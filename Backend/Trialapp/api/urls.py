from django.urls import path

from . import views


urlpatterns = [
    path('players/', views.player_list, name='api_player_list'),
    path('players/<str:player_id>/', views.player_detail, name='api_player_detail'),
    path('players/<str:player_id>/stats/', views.player_stats, name='api_player_stats'),
    path('teams/', views.team_list, name='api_team_list'),
    path('teams/<str:abbreviation>/', views.team_detail, name='api_team_detail'),
]