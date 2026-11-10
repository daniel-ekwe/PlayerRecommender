import json
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from itertools import chain
from pathlib import Path

from django.apps import apps
from django.core.management.base import BaseCommand, CommandError
from django.core import serializers
from django.db import connections, models


class Command(BaseCommand):
    help = 'Export Trialapp data from SQLite or verify an imported fixture.'

    def add_arguments(self, parser):
        parser.add_argument('action', choices=('export', 'verify'))
        parser.add_argument('--database', default='default')
        parser.add_argument('--output-dir', default='cloud-migration')
        parser.add_argument('--manifest')

    def handle(self, *args, **options):
        if options['action'] == 'export':
            return self.export_data(options['database'], Path(options['output_dir']))
        if not options['manifest']:
            raise CommandError('--manifest is required when action is verify.')
        return self.verify_data(options['database'], Path(options['manifest']))

    def export_data(self, database_alias, output_dir):
        connection = connections[database_alias]
        if connection.vendor != 'sqlite':
            raise CommandError('Export must run against the original SQLite database.')

        source_path = Path(connection.settings_dict['NAME']).resolve()
        if not source_path.is_file():
            raise CommandError(f'SQLite database does not exist: {source_path}')

        output_dir = output_dir.resolve()
        output_dir.mkdir(parents=True, exist_ok=True)
        fixture_path = output_dir / 'basketball-data.json'
        manifest_path = output_dir / 'manifest.json'
        backup_path = output_dir / 'sqlite-backup.sqlite3'
        if any(path.exists() for path in (fixture_path, manifest_path, backup_path)):
            raise CommandError(
                f'Export files already exist in {output_dir}; choose a new output directory.'
            )

        with closing(sqlite3.connect(str(source_path))) as source:
            with closing(sqlite3.connect(str(backup_path))) as backup:
                source.backup(backup)

        model_list = list(apps.get_app_config('Trialapp').get_models())
        counts = {
            model._meta.label: model._default_manager.using(database_alias).count()
            for model in model_list
        }
        objects = chain.from_iterable(
            model._default_manager.using(database_alias).all().iterator(chunk_size=500)
            for model in model_list
        )
        with fixture_path.open('w', encoding='utf-8') as fixture_file:
            serializers.serialize('json', objects, stream=fixture_file, indent=2)

        manifest = {
            'created_at': datetime.now(timezone.utc).isoformat(),
            'source_database': 'sqlite',
            'models': counts,
        }
        manifest_path.write_text(json.dumps(manifest, indent=2), encoding='utf-8')
        self.stdout.write(self.style.SUCCESS(
            f'Exported Trialapp data to {fixture_path}; SQLite backup: {backup_path}'
        ))

    def verify_data(self, database_alias, manifest_path):
        try:
            manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
        except (OSError, json.JSONDecodeError) as error:
            raise CommandError(f'Could not read migration manifest: {error}') from error

        connection = connections[database_alias]
        counts = manifest.get('models')
        if not isinstance(counts, dict) or not counts:
            raise CommandError('Migration manifest has no model counts.')

        errors = []
        imported_models = []
        for label, expected_count in counts.items():
            try:
                model = apps.get_model(label)
            except (LookupError, ValueError) as error:
                raise CommandError(f'Unknown model in migration manifest: {label}') from error
            actual_count = model._default_manager.using(database_alias).count()
            imported_models.append(model)
            if actual_count != expected_count:
                errors.append(f'{label}: expected {expected_count} rows, found {actual_count}')

        errors.extend(self.check_foreign_keys(imported_models, database_alias))
        if errors:
            raise CommandError('Migration validation failed:\n- ' + '\n- '.join(errors))
        self.stdout.write(self.style.SUCCESS(
            f'Validated {len(imported_models)} model counts and foreign-key relationships '
            f'on {connection.vendor}.'
        ))

    @staticmethod
    def check_foreign_keys(model_list, database_alias):
        errors = []
        for model in model_list:
            records = model._default_manager.using(database_alias)
            for field in model._meta.concrete_fields:
                if not isinstance(field, models.ForeignKey):
                    continue
                target_values = (
                    field.remote_field.model._default_manager.using(database_alias)
                    .values_list(field.target_field.attname, flat=True)
                )
                missing = records.filter(
                    **{f'{field.attname}__isnull': False},
                ).exclude(
                    **{f'{field.attname}__in': target_values},
                ).count()
                if missing:
                    errors.append(
                        f'{model._meta.label}.{field.name}: {missing} rows reference missing records'
                    )
        return errors
