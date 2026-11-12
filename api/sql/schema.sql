IF OBJECT_ID(N'dbo.players', N'U') IS NULL
BEGIN
	CREATE TABLE dbo.players (
		player_id varchar(50) NOT NULL PRIMARY KEY,
		name nvarchar(100) NOT NULL,
		pos nvarchar(20) NOT NULL CONSTRAINT DF_players_pos DEFAULT N'',
		ht_in_in int NULL,
		wt int NULL,
		birth_date date NULL,
		colleges nvarchar(200) NOT NULL CONSTRAINT DF_players_colleges DEFAULT N'',
		from_year int NULL,
		to_year int NULL,
		debut datetime2 NULL,
		hof bit NOT NULL CONSTRAINT DF_players_hof DEFAULT 0
	);
END;

IF OBJECT_ID(N'dbo.player_seasons', N'U') IS NULL
BEGIN
	CREATE TABLE dbo.player_seasons (
		player_id varchar(50) NOT NULL,
		season int NOT NULL,
		lg nvarchar(20) NOT NULL CONSTRAINT DF_player_seasons_lg DEFAULT N'',
		age int NULL,
		team nvarchar(50) NOT NULL CONSTRAINT DF_player_seasons_team DEFAULT N'',
		pos nvarchar(20) NOT NULL CONSTRAINT DF_player_seasons_pos DEFAULT N'',
		experience int NULL,
		CONSTRAINT PK_player_seasons PRIMARY KEY (player_id, season),
		CONSTRAINT FK_player_seasons_players FOREIGN KEY (player_id) REFERENCES dbo.players(player_id)
	);
END;

IF OBJECT_ID(N'dbo.player_draft_history', N'U') IS NULL
BEGIN
	CREATE TABLE dbo.player_draft_history (
		player_id varchar(50) NOT NULL,
		season int NOT NULL,
		lg nvarchar(20) NOT NULL CONSTRAINT DF_player_draft_history_lg DEFAULT N'',
		overall_pick int NULL,
		round int NULL,
		team nvarchar(50) NOT NULL CONSTRAINT DF_player_draft_history_team DEFAULT N'',
		college nvarchar(200) NOT NULL CONSTRAINT DF_player_draft_history_college DEFAULT N'',
		CONSTRAINT PK_player_draft_history PRIMARY KEY (player_id, season),
		CONSTRAINT FK_player_draft_history_players FOREIGN KEY (player_id) REFERENCES dbo.players(player_id)
	);
END;

IF OBJECT_ID(N'dbo.player_award_shares', N'U') IS NULL
BEGIN
	CREATE TABLE dbo.player_award_shares (
		player_id varchar(50) NOT NULL,
		season int NOT NULL,
		award nvarchar(100) NOT NULL,
		age int NULL,
		first int NULL,
		pts_won float NULL,
		pts_max float NULL,
		share float NULL,
		winner bit NOT NULL CONSTRAINT DF_player_award_shares_winner DEFAULT 0,
		CONSTRAINT PK_player_award_shares PRIMARY KEY (player_id, season, award),
		CONSTRAINT FK_player_award_shares_players FOREIGN KEY (player_id) REFERENCES dbo.players(player_id)
	);
END;

IF OBJECT_ID(N'dbo.player_end_of_season_teams', N'U') IS NULL
BEGIN
	CREATE TABLE dbo.player_end_of_season_teams (
		player_id varchar(50) NOT NULL,
		season int NOT NULL,
		lg nvarchar(20) NOT NULL CONSTRAINT DF_player_end_of_season_teams_lg DEFAULT N'',
		team_type nvarchar(100) NOT NULL CONSTRAINT DF_player_end_of_season_teams_type DEFAULT N'',
		number_tm nvarchar(20) NOT NULL CONSTRAINT DF_player_end_of_season_teams_number DEFAULT N'',
		position nvarchar(20) NOT NULL CONSTRAINT DF_player_end_of_season_teams_position DEFAULT N'',
		CONSTRAINT PK_player_end_of_season_teams PRIMARY KEY (player_id, season, team_type, number_tm),
		CONSTRAINT FK_player_end_of_season_teams_players FOREIGN KEY (player_id) REFERENCES dbo.players(player_id)
	);
END;

IF OBJECT_ID(N'dbo.player_per_game_stats', N'U') IS NULL
BEGIN
	CREATE TABLE dbo.player_per_game_stats (
		player_id varchar(50) NOT NULL,
		season int NOT NULL,
		team nvarchar(50) NOT NULL CONSTRAINT DF_player_per_game_stats_team DEFAULT N'',
		pos nvarchar(20) NOT NULL CONSTRAINT DF_player_per_game_stats_pos DEFAULT N'',
		g int NULL, gs int NULL,
		mp_per_game float NULL, fg_per_game float NULL, fga_per_game float NULL, fg_percent float NULL,
		x3p_per_game float NULL, x3pa_per_game float NULL, x3p_percent float NULL,
		x2p_per_game float NULL, x2pa_per_game float NULL, x2p_percent float NULL,
		ft_per_game float NULL, fta_per_game float NULL, ft_percent float NULL,
		orb_per_game float NULL, drb_per_game float NULL, trb_per_game float NULL,
		ast_per_game float NULL, stl_per_game float NULL, blk_per_game float NULL,
		tov_per_game float NULL, pf_per_game float NULL, pts_per_game float NULL,
		CONSTRAINT PK_player_per_game_stats PRIMARY KEY (player_id, season, team),
		CONSTRAINT FK_player_per_game_stats_players FOREIGN KEY (player_id) REFERENCES dbo.players(player_id)
	);
END;

IF OBJECT_ID(N'dbo.player_shooting_stats', N'U') IS NULL
BEGIN
	CREATE TABLE dbo.player_shooting_stats (
		player_id varchar(50) NOT NULL,
		season int NOT NULL,
		team nvarchar(50) NOT NULL CONSTRAINT DF_player_shooting_stats_team DEFAULT N'',
		pos nvarchar(20) NOT NULL CONSTRAINT DF_player_shooting_stats_pos DEFAULT N'',
		fg_percent float NULL, x3p_percent float NULL, x2p_percent float NULL,
		e_fg_percent float NULL, ft_percent float NULL,
		CONSTRAINT PK_player_shooting_stats PRIMARY KEY (player_id, season, team),
		CONSTRAINT FK_player_shooting_stats_players FOREIGN KEY (player_id) REFERENCES dbo.players(player_id)
	);
END;

IF OBJECT_ID(N'dbo.player_totals_stats', N'U') IS NULL
BEGIN
	CREATE TABLE dbo.player_totals_stats (
		player_id varchar(50) NOT NULL,
		season int NOT NULL,
		team nvarchar(50) NOT NULL CONSTRAINT DF_player_totals_stats_team DEFAULT N'',
		pos nvarchar(20) NOT NULL CONSTRAINT DF_player_totals_stats_pos DEFAULT N'',
		g int NULL, gs int NULL, mp float NULL, fg float NULL, fga float NULL, fg_percent float NULL,
		x3p float NULL, x3pa float NULL, x3p_percent float NULL, x2p float NULL, x2pa float NULL,
		x2p_percent float NULL, ft float NULL, fta float NULL, ft_percent float NULL,
		orb float NULL, drb float NULL, trb float NULL, ast float NULL, stl float NULL,
		blk float NULL, tov float NULL, pf float NULL, pts float NULL,
		CONSTRAINT PK_player_totals_stats PRIMARY KEY (player_id, season, team),
		CONSTRAINT FK_player_totals_stats_players FOREIGN KEY (player_id) REFERENCES dbo.players(player_id)
	);
END;

IF OBJECT_ID(N'dbo.team_season_summaries', N'U') IS NULL
BEGIN
	CREATE TABLE dbo.team_season_summaries (
		season int NOT NULL,
		lg nvarchar(20) NOT NULL CONSTRAINT DF_team_season_summaries_lg DEFAULT N'',
		team nvarchar(100) NOT NULL,
		abbreviation varchar(10) NOT NULL,
		playoffs bit NOT NULL CONSTRAINT DF_team_season_summaries_playoffs DEFAULT 0,
		age float NULL, w int NULL, l int NULL, pw int NULL, pl int NULL,
		mov float NULL, sos float NULL, srs float NULL, o_rtg float NULL,
		d_rtg float NULL, n_rtg float NULL, pace float NULL,
		arena nvarchar(150) NOT NULL CONSTRAINT DF_team_season_summaries_arena DEFAULT N'',
		attend int NULL, attend_g int NULL,
		CONSTRAINT PK_team_season_summaries PRIMARY KEY (season, abbreviation)
	);
END;

IF OBJECT_ID(N'dbo.team_season_stats', N'U') IS NULL
BEGIN
	CREATE TABLE dbo.team_season_stats (
		season int NOT NULL,
		abbreviation varchar(10) NOT NULL,
		stat_type varchar(20) NOT NULL,
		stats_json nvarchar(max) NOT NULL,
		CONSTRAINT PK_team_season_stats PRIMARY KEY (season, abbreviation, stat_type),
		CONSTRAINT CK_team_season_stats_json CHECK (ISJSON(stats_json) = 1)
	);
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_players_name' AND object_id = OBJECT_ID(N'dbo.players'))
	CREATE INDEX IX_players_name ON dbo.players(name, player_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_player_per_game_stats_season_team' AND object_id = OBJECT_ID(N'dbo.player_per_game_stats'))
	CREATE INDEX IX_player_per_game_stats_season_team ON dbo.player_per_game_stats(season, team, player_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_team_season_summaries_season_team' AND object_id = OBJECT_ID(N'dbo.team_season_summaries'))
	CREATE INDEX IX_team_season_summaries_season_team ON dbo.team_season_summaries(season, team, abbreviation);
