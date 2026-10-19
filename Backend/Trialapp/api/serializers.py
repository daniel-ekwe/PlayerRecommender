from math import isfinite

from ..team_config import get_team_display


TEAM_SUMMARY_FIELDS = (
    'season', 'lg', 'team', 'abbreviation', 'playoffs', 'age', 'w', 'l', 'pw', 'pl',
    'mov', 'sos', 'srs', 'o_rtg', 'd_rtg', 'n_rtg', 'pace', 'arena', 'attend', 'attend_g',
)


def serialize_player_summary(player):
    return {
        'id': player['player_id'],
        'name': player['name'],
        'position': player['pos'],
        'from_year': player['from_year'],
        'to_year': player['to_year'],
    }


def serialize_player_detail(player):
    height = None
    if player.ht_in_in is not None:
        feet, inches = divmod(player.ht_in_in, 12)
        height = {'inches': player.ht_in_in, 'feet': feet, 'remaining_inches': inches}

    team_years = {}
    for season in player.seasons.all():
        code = (season.team or '').strip().upper()
        if code:
            team_years.setdefault(code, []).append(season.season)

    teams = []
    for code, years in sorted(team_years.items()):
        teams.append({
            **get_team_display(code),
            'from_year': min(years),
            'to_year': max(years),
        })

    honours = {}
    for award in player.award_shares.all():
        title = award.award.strip()
        if title and award.winner:
            honours[title] = honours.get(title, 0) + 1
    for selection in player.end_of_season_teams.all():
        title = f'{selection.team_type} {selection.number_tm} Team'.strip()
        if selection.position:
            title = f'{title} ({selection.position})'
        if title:
            honours[title] = honours.get(title, 0) + 1

    return {
        'id': player.player_id,
        'name': player.name,
        'position': player.pos,
        'height': height,
        'weight_lbs': player.wt,
        'birth_date': player.birth_date.isoformat() if player.birth_date else None,
        'colleges': player.colleges,
        'career': {'from_year': player.from_year, 'to_year': player.to_year},
        'debut': player.debut.isoformat() if player.debut else None,
        'hall_of_fame': player.hof,
        'teams': teams,
        'draft_history': [
            {
                'season': draft.season,
                'league': draft.lg,
                'overall_pick': draft.overall_pick,
                'round': draft.round,
                'team': draft.team,
                'college': draft.college,
            }
            for draft in sorted(player.draft_history.all(), key=lambda item: item.season, reverse=True)
        ],
        'honours': [
            {'title': title, 'count': count}
            for title, count in sorted(honours.items(), key=lambda item: item[0].casefold())
        ],
    }


def serialize_stat_row(row):
    return {
        key: None if isinstance(value, float) and not isfinite(value) else value
        for key, value in row.items()
    }


def serialize_team_summary(summary):
    display = get_team_display(summary.abbreviation)
    values = {field: getattr(summary, field) for field in TEAM_SUMMARY_FIELDS}
    return {
        **serialize_stat_row(values),
        'name': summary.team or display['name'],
        'logo': display['logo'],
    }


def serialize_team_detail(abbreviation, summaries):
    latest = summaries[0]
    display = get_team_display(abbreviation)
    return {
        'abbreviation': abbreviation,
        'name': latest.team or display['name'],
        'logo': display['logo'],
        'seasons': [serialize_team_summary(summary) for summary in summaries],
    }


def serialize_team_overview(summary):
    display = get_team_display(summary.abbreviation)
    return {
        'season': summary.season,
        'league': summary.lg,
        'name': summary.team or display['name'],
        'abbreviation': summary.abbreviation,
        'logo': display['logo'],
        'wins': summary.w,
        'losses': summary.l,
        'playoffs': summary.playoffs,
        'arena': summary.arena,
        'attendance': summary.attend,
        'attendance_per_game': summary.attend_g,
    }


def serialize_team_stats(summary, stat_record, stat_type):
    if stat_type == 'summary':
        return serialize_team_summary(summary)
    return stat_record.stats if stat_record else {}