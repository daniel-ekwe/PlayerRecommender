from django.urls import path, include
from .views import team_profile_view, test_view

urlpatterns = [
    path('', test_view, name='test'),
    path('teams/<str:abbreviation>/', team_profile_view, name='team_profile'),
]
