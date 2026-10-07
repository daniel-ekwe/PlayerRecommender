from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from .models import Player, TeamSeasonSummary
from .team_config import get_team_display


def test_view(request):
    query = request.GET.get('q', '').strip()
    tab = request.GET.get('tab', 'per_game')
    selected_id = request.GET.get('selected')

    if request.GET.get('format') == 'json':
        players = Player.objects.filter(name__icontains=query).order_by('name')[:8]
        return JsonResponse({
            'players': [
                {'id': player.pk, 'name': player.name}
                for player in players
            ]
        })

    matches = []
    suggestions = []
    player = None
    team_history = []
    draft_history = []
    recognition_groups = []
    stat_rows = []
    height_feet = None
    height_inches = None

    if query:
        matches = list(Player.objects.filter(name__icontains=query).order_by('name')[:10])
        suggestions = matches[:10]

    if selected_id:
        player = Player.objects.filter(pk=selected_id).first()

    if player:
        if player.ht_in_in is not None:
            height_feet, height_inches = divmod(player.ht_in_in, 12)

        team_years = {}
        for season in player.seasons.all():
            team_code = (season.team or '').strip().upper()
            if not team_code:
                continue
            team_years.setdefault(team_code, []).append(season.season)

        team_history = []
        for team_code in sorted(team_years):
            years = team_years[team_code]
            team = get_team_display(team_code)
            team['from_year'] = min(years)
            team['to_year'] = max(years)
            team_history.append(team)

        draft_history = player.draft_history.order_by('-season')

        recognition_counts = {}
        for award in player.award_shares.all():
            title = award.award.strip()
            if title and award.winner:
                recognition_counts[title] = recognition_counts.get(title, 0) + 1
        for selection in player.end_of_season_teams.all():
            title = f"{selection.team_type} {selection.number_tm} Team".strip()
            if selection.position:
                title = f"{title} ({selection.position})"
            if title:
                recognition_counts[title] = recognition_counts.get(title, 0) + 1
        recognition_groups = [
            {'title': title, 'count': count}
            for title, count in sorted(recognition_counts.items(), key=lambda item: item[0].casefold())
        ]

        if tab == 'shooting':
            stat_rows = player.shooting_stats.order_by('-season', 'team')
        elif tab == 'totals':
            stat_rows = player.totals_stats.order_by('-season', 'team')
        else:
            tab = 'per_game'
            stat_rows = player.per_game_stats.order_by('-season', 'team')

    context = {
        'query': query,
        'players': matches,
        'suggestions': suggestions,
        'player': player,
        'tab': tab,
        'team_history': team_history,
        'draft_history': draft_history,
        'recognition_groups': recognition_groups,
        'stat_rows': stat_rows,
        'height_feet': height_feet,
        'height_inches': height_inches,
    }
    return render(request, 'test.html', context)


def team_profile_view(request, abbreviation):
    code = abbreviation.strip().upper()
    summaries = TeamSeasonSummary.objects.filter(abbreviation=code).order_by('-season')
    team = get_team_display(code)
    latest_summary = summaries.first()

    if latest_summary:
        team['name'] = latest_summary.team or team['name']

    return render(request, 'team_profile.html', {
        'team': team,
        'summaries': summaries,
        'latest_summary': latest_summary,
    })

