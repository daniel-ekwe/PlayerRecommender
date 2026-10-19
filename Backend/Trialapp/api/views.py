from django.http import JsonResponse
from django.views.decorators.http import require_GET

from . import serializers, services


@require_GET
def player_list(request):
    search = request.GET.get('search', '').strip()[:100]
    page = services.search_players(search, request.GET.get('page'))
    return JsonResponse({
        'count': page.paginator.count,
        'page': page.number,
        'page_size': services.PLAYER_PAGE_SIZE,
        'next_page': page.next_page_number() if page.has_next() else None,
        'previous_page': page.previous_page_number() if page.has_previous() else None,
        'results': [serializers.serialize_player_summary(player) for player in page.object_list],
    })


@require_GET
def player_detail(request, player_id):
    player = services.get_player_detail(player_id)
    if player is None:
        return JsonResponse({'detail': 'Player not found.'}, status=404)
    return JsonResponse(serializers.serialize_player_detail(player))


@require_GET
def player_stats(request, player_id):
    if not services.player_exists(player_id):
        return JsonResponse({'detail': 'Player not found.'}, status=404)

    stat_type = request.GET.get('type', 'per_game').strip().lower()
    if stat_type not in services.PLAYER_STAT_FIELDS:
        return JsonResponse({
            'detail': 'Invalid stat type.',
            'allowed_types': list(services.PLAYER_STAT_FIELDS),
        }, status=400)

    season = request.GET.get('season') or None
    if season:
        try:
            season = int(season)
        except ValueError:
            return JsonResponse({'detail': 'Season must be an integer.'}, status=400)

    results = services.get_player_stats(player_id, stat_type, season)
    return JsonResponse({
        'player_id': player_id,
        'type': stat_type,
        'season': season,
        'results': [serializers.serialize_stat_row(row) for row in results],
    })


@require_GET
def team_list(request):
    search = request.GET.get('search', '').strip()[:100]
    latest_season, summaries = services.search_teams(search)
    return JsonResponse({
        'season': latest_season,
        'count': len(summaries),
        'results': [serializers.serialize_team_summary(summary) for summary in summaries],
    })


@require_GET
def team_detail(request, abbreviation):
    code = abbreviation.strip().upper()
    summaries = services.get_team_seasons(code)
    if not summaries:
        return JsonResponse({'detail': 'Team not found.'}, status=404)

    available_seasons = sorted({summary.season for summary in summaries}, reverse=True)
    requested_season = request.GET.get('season')
    if requested_season:
        try:
            selected_season = int(requested_season)
        except ValueError:
            return JsonResponse({'detail': 'Season must be an integer.'}, status=400)
        if selected_season not in available_seasons:
            return JsonResponse({
                'detail': 'Season not found for this team.',
                'available_seasons': available_seasons,
            }, status=404)
    else:
        selected_season = available_seasons[0]

    stat_type = request.GET.get('stats', 'per_game').strip().lower()
    allowed_stat_types = {'per_game', 'summary', 'per_100'}
    if stat_type not in allowed_stat_types:
        return JsonResponse({
            'detail': 'Invalid team stat type.',
            'allowed_types': sorted(allowed_stat_types),
        }, status=400)

    selected_summary = next(summary for summary in summaries if summary.season == selected_season)
    stat_record = None
    if stat_type != 'summary':
        stat_record = services.get_team_stat(code, selected_season, stat_type)

    return JsonResponse({
        'abbreviation': code,
        'name': selected_summary.team,
        'available_seasons': available_seasons,
        'selected_season': selected_season,
        'overview': serializers.serialize_team_overview(selected_summary),
        'stats': {
            'type': stat_type,
            'values': serializers.serialize_team_stats(selected_summary, stat_record, stat_type),
        },
        'roster': services.get_team_roster(code, selected_season),
        'seasons': [serializers.serialize_team_summary(summary) for summary in summaries],
    })