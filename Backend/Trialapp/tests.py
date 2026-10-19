from django.test import TestCase
from django.urls import reverse

from .models import (
	Player,
	PlayerAwardShare,
	PlayerDraftHistory,
	PlayerEndOfSeasonTeam,
	PlayerPerGameStat,
	PlayerSeason,
	TeamSeasonStat,
	TeamSeasonSummary,
)


class PlayerApiTests(TestCase):
	def setUp(self):
		self.player = Player.objects.create(
			player_id='test-player',
			name='Test Player',
			pos='G',
			ht_in_in=78,
			wt=190,
			from_year=2020,
			to_year=2024,
		)

	def test_player_search_returns_paginated_player_summaries(self):
		response = self.client.get(reverse('api_player_list'), {'search': 'test'})

		self.assertEqual(response.status_code, 200)
		payload = response.json()
		self.assertEqual(payload['count'], 1)
		self.assertEqual(payload['results'][0]['id'], 'test-player')
		self.assertEqual(payload['results'][0]['name'], 'Test Player')

	def test_player_detail_includes_profile_history_and_honours(self):
		PlayerSeason.objects.create(player=self.player, season=2021, team='BOS')
		PlayerSeason.objects.create(player=self.player, season=2022, team='BOS')
		PlayerDraftHistory.objects.create(player=self.player, season=2020, overall_pick=12, round=1)
		PlayerAwardShare.objects.create(player=self.player, season=2022, award='MVP', winner=True)
		PlayerEndOfSeasonTeam.objects.create(
			player=self.player,
			season=2022,
			team_type='All-NBA',
			number_tm='1st',
			position='G',
		)

		response = self.client.get(reverse('api_player_detail', args=[self.player.player_id]))

		self.assertEqual(response.status_code, 200)
		payload = response.json()
		self.assertEqual(payload['height'], {'inches': 78, 'feet': 6, 'remaining_inches': 6})
		self.assertEqual(payload['teams'][0]['from_year'], 2021)
		self.assertEqual(payload['teams'][0]['to_year'], 2022)
		self.assertEqual(payload['draft_history'][0]['overall_pick'], 12)
		self.assertEqual({item['title'] for item in payload['honours']}, {'MVP', 'All-NBA 1st Team (G)'})

	def test_player_stats_can_be_filtered_by_type_and_season(self):
		PlayerPerGameStat.objects.create(
			player=self.player,
			season=2022,
			team='BOS',
			pts_per_game=20.5,
		)
		PlayerPerGameStat.objects.create(
			player=self.player,
			season=2023,
			team='BOS',
			pts_per_game=22.0,
		)

		response = self.client.get(
			reverse('api_player_stats', args=[self.player.player_id]),
			{'type': 'per_game', 'season': '2022'},
		)

		self.assertEqual(response.status_code, 200)
		payload = response.json()
		self.assertEqual(payload['type'], 'per_game')
		self.assertEqual(len(payload['results']), 1)
		self.assertEqual(payload['results'][0]['pts_per_game'], 20.5)

	def test_unknown_player_and_invalid_stat_type_return_json_errors(self):
		missing_player = self.client.get(reverse('api_player_detail', args=['missing']))
		invalid_stats = self.client.get(
			reverse('api_player_stats', args=[self.player.player_id]),
			{'type': 'advanced'},
		)
		invalid_season = self.client.get(
			reverse('api_player_stats', args=[self.player.player_id]),
			{'season': '2022-23'},
		)

		self.assertEqual(missing_player.status_code, 404)
		self.assertEqual(missing_player.json()['detail'], 'Player not found.')
		self.assertEqual(invalid_stats.status_code, 400)
		self.assertEqual(invalid_stats.json()['allowed_types'], ['per_game', 'shooting', 'totals'])
		self.assertEqual(invalid_season.status_code, 400)
		self.assertEqual(invalid_season.json()['detail'], 'Season must be an integer.')


class TeamApiTests(TestCase):
	def setUp(self):
		TeamSeasonSummary.objects.create(
			season=2023,
			team='Boston Celtics',
			abbreviation='BOS',
			w=57,
			l=25,
		)
		TeamSeasonSummary.objects.create(
			season=2024,
			team='Boston Celtics',
			abbreviation='BOS',
			w=64,
			l=18,
		)
		TeamSeasonSummary.objects.create(
			season=2024,
			team='New York Knicks',
			abbreviation='NYK',
			w=50,
			l=32,
		)
		TeamSeasonStat.objects.create(
			season=2024,
			team='Boston Celtics',
			abbreviation='BOS',
			stat_type=TeamSeasonStat.PER_GAME,
			stats={'pts_per_game': 120.6},
		)
		self.traded_player = Player.objects.create(player_id='traded-player', name='Traded Player', pos='G')
		PlayerPerGameStat.objects.create(
			player=self.traded_player,
			season=2024,
			team='BOS',
			pos='G',
		)
		PlayerPerGameStat.objects.create(
			player=self.traded_player,
			season=2024,
			team='NYK',
			pos='G',
		)
		PlayerPerGameStat.objects.create(
			player=self.traded_player,
			season=2024,
			team='2TM',
			pos='G',
		)

	def test_team_list_returns_latest_season_and_supports_search(self):
		response = self.client.get(reverse('api_team_list'), {'search': 'bos'})

		self.assertEqual(response.status_code, 200)
		payload = response.json()
		self.assertEqual(payload['season'], 2024)
		self.assertEqual(payload['count'], 1)
		self.assertEqual(payload['results'][0]['abbreviation'], 'BOS')

	def test_team_detail_returns_season_history(self):
		response = self.client.get(reverse('api_team_detail', args=['bos']))

		self.assertEqual(response.status_code, 200)
		payload = response.json()
		self.assertEqual(payload['abbreviation'], 'BOS')
		self.assertEqual([row['season'] for row in payload['seasons']], [2024, 2023])

	def test_team_detail_returns_year_stats_and_traded_roster(self):
		response = self.client.get(
			reverse('api_team_detail', args=['BOS']),
			{'season': '2024', 'stats': 'per_game'},
		)

		self.assertEqual(response.status_code, 200)
		payload = response.json()
		self.assertEqual(payload['selected_season'], 2024)
		self.assertEqual(payload['overview']['wins'], 64)
		self.assertEqual(payload['stats']['values']['pts_per_game'], 120.6)
		self.assertEqual(payload['roster'], [{
			'id': 'traded-player',
			'name': 'Traded Player',
			'position': 'G',
			'team': 'BOS',
			'traded': True,
		}])

	def test_unknown_team_returns_json_not_found(self):
		response = self.client.get(reverse('api_team_detail', args=['XYZ']))

		self.assertEqual(response.status_code, 404)
		self.assertEqual(response.json()['detail'], 'Team not found.')
