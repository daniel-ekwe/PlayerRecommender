import csv
from datetime import datetime

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "PlayerRecommender.settings")
django.setup()

from django.utils.timezone import make_aware
from Trialapp.models import (
    Player,
    PlayerSeason,
    PlayerPerGameStat,
    PlayerShootingStat,
    PlayerTotalsStat,
)


def parse_int(value):
    if value is None or value == "" or value == "NA":
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def parse_float(value):
    if value is None or value == "" or value == "NA":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def parse_date(value):
    if value is None or value == "" or value == "NA":
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
    except Exception:
        return None


def parse_datetime(value):
    if value is None or value == "" or value == "NA":
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return make_aware(dt)
    except Exception:
        return None


def import_career_info():
    file_path = os.path.join("data", "Player Career Info.csv")
    with open(file_path, newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        count = 0

        for row in reader:
            player_id = (row.get("player_id") or row.get("player") or f"temp_{count}").strip()
            if not player_id:
                player_id = f"temp_{count}"

            Player.objects.update_or_create(
                player_id=player_id,
                defaults={
                    "name": row.get("player", "").strip(),
                    "pos": row.get("pos", "").strip(),
                    "ht_in_in": parse_int(row.get("ht_in_in")),
                    "wt": parse_int(row.get("wt")),
                    "birth_date": parse_date(row.get("birth_date")),
                    "colleges": row.get("colleges", "").strip(),
                    "from_year": parse_int(row.get("from")),
                    "to_year": parse_int(row.get("to")),
                    "debut": parse_datetime(row.get("debut")),
                    "hof": str(row.get("hof", "")).strip().lower() == "true",
                }
            )
            count += 1

    print(f"Imported career info rows: {count}")


def import_season_info():
    file_path = os.path.join("data", "Player Season Info.csv")
    with open(file_path, newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        count = 0

        for row in reader:
            player_id = (row.get("player_id") or row.get("player") or "unknown").strip()
            player = Player.objects.filter(player_id=player_id).first()
            if not player:
                continue

            PlayerSeason.objects.update_or_create(
                player=player,
                season=parse_int(row.get("season")) or 0,
                defaults={
                    "lg": row.get("lg", "").strip(),
                    "age": parse_int(row.get("age")),
                    "team": row.get("team", "").strip(),
                    "pos": row.get("pos", "").strip(),
                    "experience": parse_int(row.get("experience")),
                }
            )
            count += 1

    print(f"Imported season rows: {count}")


def import_per_game_stats():
    file_path = os.path.join("data", "Player Per Game.csv")
    with open(file_path, newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        count = 0

        for row in reader:
            player_id = (row.get("player_id") or row.get("player") or "unknown").strip()
            player = Player.objects.filter(player_id=player_id).first()
            if not player:
                continue

            PlayerPerGameStat.objects.update_or_create(
                player=player,
                season=parse_int(row.get("season")) or 0,
                team=row.get("team", "").strip(),
                defaults={
                    "pos": row.get("pos", "").strip(),
                    "g": parse_int(row.get("g")),
                    "gs": parse_int(row.get("gs")),
                    "mp_per_game": parse_float(row.get("mp_per_game")),
                    "fg_per_game": parse_float(row.get("fg_per_game")),
                    "fga_per_game": parse_float(row.get("fga_per_game")),
                    "fg_percent": parse_float(row.get("fg_percent")),
                    "x3p_per_game": parse_float(row.get("x3p_per_game")),
                    "x3pa_per_game": parse_float(row.get("x3pa_per_game")),
                    "x3p_percent": parse_float(row.get("x3p_percent")),
                    "x2p_per_game": parse_float(row.get("x2p_per_game")),
                    "x2pa_per_game": parse_float(row.get("x2pa_per_game")),
                    "x2p_percent": parse_float(row.get("x2p_percent")),
                    "ft_per_game": parse_float(row.get("ft_per_game")),
                    "fta_per_game": parse_float(row.get("fta_per_game")),
                    "ft_percent": parse_float(row.get("ft_percent")),
                    "orb_per_game": parse_float(row.get("orb_per_game")),
                    "drb_per_game": parse_float(row.get("drb_per_game")),
                    "trb_per_game": parse_float(row.get("trb_per_game")),
                    "ast_per_game": parse_float(row.get("ast_per_game")),
                    "stl_per_game": parse_float(row.get("stl_per_game")),
                    "blk_per_game": parse_float(row.get("blk_per_game")),
                    "tov_per_game": parse_float(row.get("tov_per_game")),
                    "pf_per_game": parse_float(row.get("pf_per_game")),
                    "pts_per_game": parse_float(row.get("pts_per_game")),
                }
            )
            count += 1

    print(f"Imported per-game rows: {count}")


def import_shooting_stats():
    file_path = os.path.join("data", "Player Shooting.csv")
    with open(file_path, newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        count = 0

        for row in reader:
            player_id = (row.get("player_id") or row.get("player") or "unknown").strip()
            player = Player.objects.filter(player_id=player_id).first()
            if not player:
                continue

            PlayerShootingStat.objects.update_or_create(
                player=player,
                season=parse_int(row.get("season")) or 0,
                team=row.get("team", "").strip(),
                defaults={
                    "pos": row.get("pos", "").strip(),
                    "fg_percent": parse_float(row.get("fg_percent")),
                    "x3p_percent": parse_float(row.get("x3p_percent")),
                    "x2p_percent": parse_float(row.get("x2p_percent")),
                    "e_fg_percent": parse_float(row.get("e_fg_percent")),
                    "ft_percent": parse_float(row.get("ft_percent")),
                }
            )
            count += 1

    print(f"Imported shooting rows: {count}")


def import_totals_stats():
    file_path = os.path.join("data", "Player Totals.csv")
    with open(file_path, newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        count = 0

        for row in reader:
            player_id = (row.get("player_id") or row.get("player") or "unknown").strip()
            player = Player.objects.filter(player_id=player_id).first()
            if not player:
                continue

            PlayerTotalsStat.objects.update_or_create(
                player=player,
                season=parse_int(row.get("season")) or 0,
                team=row.get("team", "").strip(),
                defaults={
                    "pos": row.get("pos", "").strip(),
                    "g": parse_int(row.get("g")),
                    "gs": parse_int(row.get("gs")),
                    "mp": parse_float(row.get("mp")),
                    "fg": parse_float(row.get("fg")),
                    "fga": parse_float(row.get("fga")),
                    "fg_percent": parse_float(row.get("fg_percent")),
                    "x3p": parse_float(row.get("x3p")),
                    "x3pa": parse_float(row.get("x3pa")),
                    "x3p_percent": parse_float(row.get("x3p_percent")),
                    "x2p": parse_float(row.get("x2p")),
                    "x2pa": parse_float(row.get("x2pa")),
                    "x2p_percent": parse_float(row.get("x2p_percent")),
                    "ft": parse_float(row.get("ft")),
                    "fta": parse_float(row.get("fta")),
                    "ft_percent": parse_float(row.get("ft_percent")),
                    "orb": parse_float(row.get("orb")),
                    "drb": parse_float(row.get("drb")),
                    "trb": parse_float(row.get("trb")),
                    "ast": parse_float(row.get("ast")),
                    "stl": parse_float(row.get("stl")),
                    "blk": parse_float(row.get("blk")),
                    "tov": parse_float(row.get("tov")),
                    "pf": parse_float(row.get("pf")),
                    "pts": parse_float(row.get("pts")),
                }
            )
            count += 1

    print(f"Imported totals rows: {count}")


if __name__ == "__main__":
    import_career_info()
    import_season_info()
    import_per_game_stats()
    import_shooting_stats()
    import_totals_stats()
    print("Import complete.")
