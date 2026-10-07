import csv
from datetime import datetime
import os
import sys
from pathlib import Path

import django

BACKEND_DIR = Path(__file__).resolve().parent / "Backend"
DATA_DIR = BACKEND_DIR / "data"
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "PlayerRecommender.settings")
django.setup()

from django.utils.timezone import make_aware
from Trialapp.models import (
    Player,
    PlayerSeason,
    TeamSeasonSummary,
    PlayerDraftHistory,
    PlayerAwardShare,
    PlayerEndOfSeasonTeam,
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
    file_path = DATA_DIR / "Player Career Info.csv"
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
    file_path = DATA_DIR / "Player Season Info.csv"
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


def import_team_summaries():
    file_path = DATA_DIR / "Team Summaries.csv"
    with open(file_path, newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        count = 0

        for row in reader:
            TeamSeasonSummary.objects.update_or_create(
                season=parse_int(row.get("season")) or 0,
                abbreviation=(row.get("abbreviation") or "").strip().upper(),
                defaults={
                    "lg": row.get("lg", "").strip(),
                    "team": row.get("team", "").strip(),
                    "playoffs": str(row.get("playoffs", "")).strip().lower() == "true",
                    "age": parse_float(row.get("age")),
                    "w": parse_int(row.get("w")),
                    "l": parse_int(row.get("l")),
                    "pw": parse_int(row.get("pw")),
                    "pl": parse_int(row.get("pl")),
                    "mov": parse_float(row.get("mov")),
                    "sos": parse_float(row.get("sos")),
                    "srs": parse_float(row.get("srs")),
                    "o_rtg": parse_float(row.get("o_rtg")),
                    "d_rtg": parse_float(row.get("d_rtg")),
                    "n_rtg": parse_float(row.get("n_rtg")),
                    "pace": parse_float(row.get("pace")),
                    "arena": row.get("arena", "").strip(),
                    "attend": parse_int(row.get("attend")),
                    "attend_g": parse_int(row.get("attend_g")),
                },
            )
            count += 1

    print(f"Imported team summary rows: {count}")


def import_draft_history():
    file_path = DATA_DIR / "Draft Pick History.csv"
    with open(file_path, newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        count = 0

        for row in reader:
            player_id = (row.get("player_id") or "").strip()
            player = Player.objects.filter(player_id=player_id).first()
            if not player:
                continue

            PlayerDraftHistory.objects.update_or_create(
                player=player,
                season=parse_int(row.get("season")) or 0,
                defaults={
                    "lg": row.get("lg", "").strip(),
                    "overall_pick": parse_int(row.get("overall_pick")),
                    "round": parse_int(row.get("round")),
                    "team": row.get("tm", "").strip(),
                    "college": row.get("college", "").strip(),
                },
            )
            count += 1

    print(f"Imported draft rows: {count}")


def import_award_shares():
    file_path = DATA_DIR / "Player Award Shares.csv"
    with open(file_path, newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        count = 0

        for row in reader:
            player_id = (row.get("player_id") or "").strip()
            player = Player.objects.filter(player_id=player_id).first()
            if not player:
                continue

            PlayerAwardShare.objects.update_or_create(
                player=player,
                season=parse_int(row.get("season")) or 0,
                award=row.get("award", "").strip(),
                defaults={
                    "age": parse_int(row.get("age")),
                    "first": parse_int(row.get("first")),
                    "pts_won": parse_float(row.get("pts_won")),
                    "pts_max": parse_float(row.get("pts_max")),
                    "share": parse_float(row.get("share")),
                    "winner": str(row.get("winner", "")).strip().lower() == "true",
                },
            )
            count += 1

    print(f"Imported award rows: {count}")


def import_end_of_season_teams():
    PlayerEndOfSeasonTeam.objects.all().delete()
    count = 0

    file_path = DATA_DIR / "End of Season Teams.csv"
    with open(file_path, newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)

        for row in reader:
            player_id = (row.get("player_id") or "").strip()
            player = Player.objects.filter(player_id=player_id).first()
            if not player:
                continue

            PlayerEndOfSeasonTeam.objects.update_or_create(
                player=player,
                season=parse_int(row.get("season")) or 0,
                team_type=row.get("type", "").strip(),
                number_tm=row.get("number_tm", "").strip(),
                defaults={
                    "lg": row.get("lg", "").strip(),
                    "position": row.get("position", "").strip(),
                    "pts_won": parse_float(row.get("pts_won")),
                    "pts_max": parse_float(row.get("pts_max")),
                    "share": parse_float(row.get("share")),
                    "first_team_votes": parse_float(row.get("x1st_tm")),
                    "second_team_votes": parse_float(row.get("x2nd_tm")),
                    "third_team_votes": parse_float(row.get("x3rd_tm")),
                },
            )
            count += 1

    print(f"Imported end-of-season rows: {count}")


def import_per_game_stats():
    file_path = DATA_DIR / "Player Per Game.csv"
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
    file_path = DATA_DIR / "Player Shooting.csv"
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
    file_path = DATA_DIR / "Player Totals.csv"
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
    import_team_summaries()
    import_draft_history()
    import_award_shares()
    import_end_of_season_teams()
    import_per_game_stats()
    import_shooting_stats()
    import_totals_stats()
    print("Import complete.")
