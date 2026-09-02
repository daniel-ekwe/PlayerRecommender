from django.http import JsonResponse
from django.shortcuts import render
from .models import Player


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

        team_history = sorted(
            {season.team for season in player.seasons.all() if season.team},
            key=str.casefold,
        )

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
        'stat_rows': stat_rows,
        'height_feet': height_feet,
        'height_inches': height_inches,
    }
    return render(request, 'test.html', context)

