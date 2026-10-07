from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Trialapp', '0004_playerawardshare_playerdrafthistory_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='TeamSeasonSummary',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('season', models.IntegerField()),
                ('lg', models.CharField(blank=True, max_length=20)),
                ('team', models.CharField(max_length=100)),
                ('abbreviation', models.CharField(max_length=10)),
                ('playoffs', models.BooleanField(default=False)),
                ('age', models.FloatField(blank=True, null=True)),
                ('w', models.IntegerField(blank=True, null=True)),
                ('l', models.IntegerField(blank=True, null=True)),
                ('pw', models.IntegerField(blank=True, null=True)),
                ('pl', models.IntegerField(blank=True, null=True)),
                ('mov', models.FloatField(blank=True, null=True)),
                ('sos', models.FloatField(blank=True, null=True)),
                ('srs', models.FloatField(blank=True, null=True)),
                ('o_rtg', models.FloatField(blank=True, null=True)),
                ('d_rtg', models.FloatField(blank=True, null=True)),
                ('n_rtg', models.FloatField(blank=True, null=True)),
                ('pace', models.FloatField(blank=True, null=True)),
                ('arena', models.CharField(blank=True, max_length=150)),
                ('attend', models.IntegerField(blank=True, null=True)),
                ('attend_g', models.IntegerField(blank=True, null=True)),
            ],
            options={
                'ordering': ['-season', 'team'],
            },
        ),
    ]
