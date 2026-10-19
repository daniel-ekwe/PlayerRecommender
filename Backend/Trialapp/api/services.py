from django.core.paginator import Paginator
from django.db.models import Count, Q

from ..models import (
    Player,
    PlayerPerGameStat,
    PlayerShootingStat,
    PlayerTotalsStat,
    TeamSeasonStat,
    TeamSeasonSummary,
)


PLAYER_PAGE_SIZE = 25
TEAM_CODE_ALIASES = {'BKN': 'BRK'}
AGGREGATE_TEAM_CODES = {'TOT', '2TM', '3TM', '4TM'}

PLAYER_STAT_FIELDS = {
    'per_game': (
        PlayerPerGameStat,
        (
            'season', 'team', 'pos', 'g', 'gs', 'mp_per_game',
            'fg_per_game', 'fga_per_game', 'fg_percent',
            'x3p_per_game', 'x3pa_per_game', 'x3p_percent',
            'x2p_per_game', 'x2pa_per_game', 'x2p_percent',
            'ft_per_game', 'fta_per_game', 'ft_percent',
            'orb_per_game', 'drb_per_game', 'trb_per_game',
            'ast_per_game', 'stl_per_game', 'blk_per_game',
            'tov_per_game', 'pf_per_game', 'pts_per_game',
        ),
    ),
    'shooting': (
        PlayerShootingStat,
        ('season', 'team', 'pos', 'fg_percent', 'x3p_percent', 'x2p_percent', 'e_fg_percent', 'ft_percent'),
    ),
    'totals': (
        PlayerTotalsStat,
        (
            'season', 'team', 'pos', 'g', 'gs', 'mp', 'fg', 'fga', 'fg_percent',
            'x3p', 'x3pa', 'x3p_percent', 'x2p', 'x2pa', 'x2p_percent',
            'ft', 'fta', 'ft_percent', 'orb', 'drb', 'trb', 'ast', 'stl',
            'blk', 'tov', 'pf', 'pts',
        ),
    ),
}


def search_players(search, page_number):
    players = Player.objects.order_by('name', 'player_id')
    if search:
        players = players.filter(Q(name__icontains=search) | Q(player_id__icontains=search))
    summaries = players.values('player_id', 'name', 'pos', 'from_year', 'to_year')
    return Paginator(summaries, PLAYER_PAGE_SIZE).get_page(page_number)


def get_player_detail(player_id):
    return Player.objects.prefetch_related(
        'seasons', 'draft_history', 'award_shares', 'end_of_season_teams',
    ).filter(player_id=player_id).first()


def player_exists(player_id):
    return Player.objects.filter(player_id=player_id).exists()


def get_player_stats(player_id, stat_type, season):
    model, fields = PLAYER_STAT_FIELDS[stat_type]
    stats = model.objects.filter(player__player_id=player_id)
    if season is not None:
        stats = stats.filter(season=season)
    return stats.order_by('-season', 'team').values(*fields)


def search_teams(search):
    latest_season = TeamSeasonSummary.objects.order_by('-season').values_list('season', flat=True).first()
    if latest_season is None:
        return None, []

    summaries = TeamSeasonSummary.objects.filter(season=latest_season).exclude(abbreviation='3TM')
    if search:
        summaries = summaries.filter(Q(team__icontains=search) | Q(abbreviation__icontains=search))
    return latest_season, list(summaries.order_by('team', 'abbreviation'))


def get_team_seasons(abbreviation):
    return list(
        TeamSeasonSummary.objects.filter(abbreviation=TEAM_CODE_ALIASES.get(abbreviation, abbreviation)).order_by('-season', 'team'),
    )


def get_team_stat(abbreviation, season, stat_type):
    source_code = TEAM_CODE_ALIASES.get(abbreviation, abbreviation)
    return TeamSeasonStat.objects.filter(
        abbreviation=source_code,
        season=season,
        stat_type=stat_type,
    ).first()


def get_team_roster(abbreviation, season):
    source_code = TEAM_CODE_ALIASES.get(abbreviation, abbreviation)
    roster_rows = list(
        PlayerPerGameStat.objects.filter(season=season, team__iexact=source_code)
        .select_related('player')
        .order_by('player__name', 'player__player_id')
    )
    player_ids = [row.player_id for row in roster_rows]
    traded_players = {
        row['player_id']
        for row in PlayerPerGameStat.objects.filter(season=season, player_id__in=player_ids)
        .exclude(team__in=AGGREGATE_TEAM_CODES)
        .values('player_id')
        .annotate(team_count=Count('team', distinct=True))
        if row['team_count'] > 1
    }

    return [
        {
            'id': row.player.player_id,
            'name': row.player.name,
            'position': row.pos,
            'team': row.team,
            'traded': row.player_id in traded_players,
        }
        for row in roster_rows
    ]