import { Router } from 'express'
import { getTeamDisplay } from './teamConfig.js'

const PLAYER_PAGE_SIZE = 25
const TEAM_CODE_ALIASES = { BKN: 'BRK' }
const AGGREGATE_TEAM_CODES = ['TOT', '2TM', '3TM', '4TM']

const PLAYER_STATS = {
	per_game: {
		table: 'player_per_game_stats',
		fields: [
			'season', 'team', 'pos', 'g', 'gs', 'mp_per_game',
			'fg_per_game', 'fga_per_game', 'fg_percent',
			'x3p_per_game', 'x3pa_per_game', 'x3p_percent',
			'x2p_per_game', 'x2pa_per_game', 'x2p_percent',
			'ft_per_game', 'fta_per_game', 'ft_percent',
			'orb_per_game', 'drb_per_game', 'trb_per_game',
			'ast_per_game', 'stl_per_game', 'blk_per_game',
			'tov_per_game', 'pf_per_game', 'pts_per_game',
		],
	},
	shooting: {
		table: 'player_shooting_stats',
		fields: ['season', 'team', 'pos', 'fg_percent', 'x3p_percent', 'x2p_percent', 'e_fg_percent', 'ft_percent'],
	},
	totals: {
		table: 'player_totals_stats',
		fields: [
			'season', 'team', 'pos', 'g', 'gs', 'mp', 'fg', 'fga', 'fg_percent',
			'x3p', 'x3pa', 'x3p_percent', 'x2p', 'x2pa', 'x2p_percent',
			'ft', 'fta', 'ft_percent', 'orb', 'drb', 'trb', 'ast', 'stl',
			'blk', 'tov', 'pf', 'pts',
		],
	},
}

const TEAM_SUMMARY_FIELDS = [
	'season', 'lg', 'team', 'abbreviation', 'playoffs', 'age', 'w', 'l', 'pw', 'pl',
	'mov', 'sos', 'srs', 'o_rtg', 'd_rtg', 'n_rtg', 'pace', 'arena', 'attend', 'attend_g',
]

function parsePage(value) {
	if (value === 'last') return 'last'
	const page = Number.parseInt(value, 10)
	return Number.isSafeInteger(page) && page > 0 ? page : 1
}

function parseSeason(value) {
	if (value === undefined || value === '') return { value: null }
	const season = Number(value)
	if (!Number.isInteger(season)) return { error: 'Season must be an integer.' }
	return { value: season }
}

function escapeLike(value) {
	return value.replace(/[\\%_[\]]/g, '\\$&')
}

function formatDate(value) {
	if (!value) return null
	if (value instanceof Date) return value.toISOString().slice(0, 10)
	return String(value).slice(0, 10)
}

function formatDateTime(value) {
	if (!value) return null
	return value instanceof Date ? value.toISOString() : String(value)
}

function serializeTeamSummary(summary) {
	const display = getTeamDisplay(summary.abbreviation)
	return {
		...Object.fromEntries(TEAM_SUMMARY_FIELDS.map((field) => [field, summary[field]])),
		name: summary.team || display.name,
		logo: display.logo,
	}
}

function serializeTeamOverview(summary) {
	const display = getTeamDisplay(summary.abbreviation)
	return {
		season: summary.season,
		league: summary.lg,
		name: summary.team || display.name,
		abbreviation: summary.abbreviation,
		logo: display.logo,
		wins: summary.w,
		losses: summary.l,
		playoffs: summary.playoffs,
		arena: summary.arena,
		attendance: summary.attend,
		attendance_per_game: summary.attend_g,
	}
}

function serializeTeamDetail(abbreviation, selectedSummary, availableSeasons, statsType, stats, roster, summaries) {
	const display = getTeamDisplay(abbreviation)
	const teamName = selectedSummary.team || display.name
	return {
		abbreviation,
		name: teamName,
		available_seasons: availableSeasons,
		selected_season: selectedSummary.season,
		overview: serializeTeamOverview(selectedSummary),
		stats: { type: statsType, values: stats },
		roster,
		seasons: summaries.map(serializeTeamSummary),
	}
}

export function createApiRouter(getPool, sql) {
	const router = Router()

	router.get('/players/', async (request, response, next) => {
		try {
			const pool = await getPool()
			const search = (request.query.search || '').toString().trim().slice(0, 100)
			const pageRequest = parsePage(request.query.page?.toString())
			const countRequest = pool.request()
			countRequest.input('pattern', sql.NVarChar(202), `%${escapeLike(search)}%`)
			const countResult = await countRequest.query(`
				SELECT COUNT_BIG(1) AS count
				FROM dbo.players
				WHERE @pattern = N'%%'
					OR name LIKE @pattern ESCAPE '\\'
					OR player_id LIKE @pattern ESCAPE '\\'
			`)
			const count = Number(countResult.recordset[0].count)
			const pageSize = PLAYER_PAGE_SIZE
			const pageCount = Math.max(1, Math.ceil(count / pageSize))
			const page = pageRequest === 'last' ? pageCount : Math.min(pageRequest, pageCount)
			const resultsRequest = pool.request()
			resultsRequest.input('pattern', sql.NVarChar(202), `%${escapeLike(search)}%`)
			resultsRequest.input('offset', sql.Int, (page - 1) * pageSize)
			resultsRequest.input('pageSize', sql.Int, pageSize)
			const result = await resultsRequest.query(`
				SELECT player_id, name, pos, from_year, to_year
				FROM dbo.players
				WHERE @pattern = N'%%'
					OR name LIKE @pattern ESCAPE '\\'
					OR player_id LIKE @pattern ESCAPE '\\'
				ORDER BY name, player_id
				OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
			`)
			return response.json({
				count,
				page,
				page_size: pageSize,
				next_page: page < pageCount && count > 0 ? page + 1 : null,
				previous_page: page > 1 && count > 0 ? page - 1 : null,
				results: result.recordset.map((player) => ({
					id: player.player_id,
					name: player.name,
					position: player.pos,
					from_year: player.from_year,
					to_year: player.to_year,
				})),
			})
		} catch (error) {
			return next(error)
		}
	})

	router.get('/players/:playerId/', async (request, response, next) => {
		try {
			const pool = await getPool()
			const playerRequest = pool.request()
			playerRequest.input('playerId', sql.VarChar(50), request.params.playerId)
			const playerResult = await playerRequest.query(`
				SELECT player_id, name, pos, ht_in_in, wt, birth_date, colleges,
					from_year, to_year, debut, hof
				FROM dbo.players WHERE player_id = @playerId
			`)
			const player = playerResult.recordset[0]
			if (!player) return response.status(404).json({ detail: 'Player not found.' })

			const relatedRequest = pool.request()
			relatedRequest.input('playerId', sql.VarChar(50), player.player_id)
			const [seasonsResult, draftResult, awardsResult, selectionsResult] = await Promise.all([
				relatedRequest.query(`
					SELECT team, season FROM dbo.player_seasons
					WHERE player_id = @playerId ORDER BY season, team
				`),
				relatedRequest.query(`
					SELECT season, lg, overall_pick, round, team, college
					FROM dbo.player_draft_history
					WHERE player_id = @playerId ORDER BY season DESC
				`),
				relatedRequest.query(`
					SELECT award FROM dbo.player_award_shares
					WHERE player_id = @playerId AND winner = 1
				`),
				relatedRequest.query(`
					SELECT season, team_type, number_tm, position
					FROM dbo.player_end_of_season_teams WHERE player_id = @playerId
				`),
			])

			const teamYears = new Map()
			for (const season of seasonsResult.recordset) {
				const code = (season.team || '').trim().toUpperCase()
				if (!code) continue
				const years = teamYears.get(code) || []
				years.push(season.season)
				teamYears.set(code, years)
			}
			const teams = [...teamYears.entries()].sort(([left], [right]) => left.localeCompare(right))
				.map(([code, years]) => ({
					...getTeamDisplay(code),
					from_year: Math.min(...years),
					to_year: Math.max(...years),
				}))

			const honours = new Map()
			for (const { award } of awardsResult.recordset) {
				const title = (award || '').trim()
				if (title) honours.set(title, (honours.get(title) || 0) + 1)
			}
			for (const selection of selectionsResult.recordset) {
				let title = `${selection.team_type || ''} ${selection.number_tm || ''} Team`.trim()
				if (selection.position) title += ` (${selection.position})`
				if (title) honours.set(title, (honours.get(title) || 0) + 1)
			}

			return response.json({
				id: player.player_id,
				name: player.name,
				position: player.pos,
				height: player.ht_in_in === null ? null : {
					inches: player.ht_in_in,
					feet: Math.floor(player.ht_in_in / 12),
					remaining_inches: player.ht_in_in % 12,
				},
				weight_lbs: player.wt,
				birth_date: formatDate(player.birth_date),
				colleges: player.colleges,
				career: { from_year: player.from_year, to_year: player.to_year },
				debut: formatDateTime(player.debut),
				hall_of_fame: player.hof,
				teams,
				draft_history: draftResult.recordset.map((draft) => ({
					season: draft.season,
					league: draft.lg,
					overall_pick: draft.overall_pick,
					round: draft.round,
					team: draft.team,
					college: draft.college,
				})),
				honours: [...honours.entries()].sort(([left], [right]) => left.localeCompare(right, undefined, { sensitivity: 'base' }))
					.map(([title, count]) => ({ title, count })),
			})
		} catch (error) {
			return next(error)
		}
	})

	router.get('/players/:playerId/stats/', async (request, response, next) => {
		try {
			const statType = (request.query.type || 'per_game').toString().trim().toLowerCase()
			const stats = PLAYER_STATS[statType]
			if (!stats) {
				return response.status(400).json({
					detail: 'Invalid stat type.',
					allowed_types: Object.keys(PLAYER_STATS),
				})
			}
			const parsedSeason = parseSeason(request.query.season?.toString())
			if (parsedSeason.error) return response.status(400).json({ detail: parsedSeason.error })

			const pool = await getPool()
			const existsRequest = pool.request()
			existsRequest.input('playerId', sql.VarChar(50), request.params.playerId)
			const existsResult = await existsRequest.query(
				'SELECT 1 AS found FROM dbo.players WHERE player_id = @playerId',
			)
			if (!existsResult.recordset.length) {
				return response.status(404).json({ detail: 'Player not found.' })
			}

			const statsRequest = pool.request()
			statsRequest.input('playerId', sql.VarChar(50), request.params.playerId)
			if (parsedSeason.value !== null) statsRequest.input('season', sql.Int, parsedSeason.value)
			const seasonFilter = parsedSeason.value === null ? '' : ' AND season = @season'
			const result = await statsRequest.query(`
				SELECT ${stats.fields.join(', ')}
				FROM dbo.${stats.table}
				WHERE player_id = @playerId${seasonFilter}
				ORDER BY season DESC, team
			`)
			return response.json({
				player_id: request.params.playerId,
				type: statType,
				season: parsedSeason.value,
				results: result.recordset,
			})
		} catch (error) {
			return next(error)
		}
	})

	router.get('/teams/', async (request, response, next) => {
		try {
			const pool = await getPool()
			const search = (request.query.search || '').toString().trim().slice(0, 100)
			const latestResult = await pool.request().query(
				'SELECT MAX(season) AS season FROM dbo.team_season_summaries',
			)
			const latestSeason = latestResult.recordset[0].season
			if (latestSeason === null) {
				return response.json({ season: null, count: 0, results: [] })
			}
			const teamRequest = pool.request()
			teamRequest.input('season', sql.Int, latestSeason)
			teamRequest.input('pattern', sql.NVarChar(202), `%${escapeLike(search)}%`)
			const result = await teamRequest.query(`
				SELECT ${TEAM_SUMMARY_FIELDS.join(', ')}
				FROM dbo.team_season_summaries
				WHERE season = @season AND abbreviation <> '3TM'
					AND (@pattern = N'%%' OR team LIKE @pattern ESCAPE '\\' OR abbreviation LIKE @pattern ESCAPE '\\')
				ORDER BY team, abbreviation
			`)
			return response.json({
				season: latestSeason,
				count: result.recordset.length,
				results: result.recordset.map(serializeTeamSummary),
			})
		} catch (error) {
			return next(error)
		}
	})

	router.get('/teams/:abbreviation/', async (request, response, next) => {
		try {
			const abbreviation = request.params.abbreviation.trim().toUpperCase()
			const sourceCode = TEAM_CODE_ALIASES[abbreviation] || abbreviation
			const parsedSeason = parseSeason(request.query.season?.toString())
			if (parsedSeason.error) return response.status(400).json({ detail: parsedSeason.error })
			const statType = (request.query.stats || 'per_game').toString().trim().toLowerCase()
			const allowedStatTypes = ['per_game', 'summary', 'per_100']
			if (!allowedStatTypes.includes(statType)) {
				return response.status(400).json({
					detail: 'Invalid team stat type.',
					allowed_types: allowedStatTypes,
				})
			}

			const pool = await getPool()
			const summariesRequest = pool.request()
			summariesRequest.input('abbreviation', sql.VarChar(10), sourceCode)
			const summariesResult = await summariesRequest.query(`
				SELECT ${TEAM_SUMMARY_FIELDS.join(', ')}
				FROM dbo.team_season_summaries
				WHERE abbreviation = @abbreviation
				ORDER BY season DESC, team
			`)
			const summaries = summariesResult.recordset
			if (!summaries.length) return response.status(404).json({ detail: 'Team not found.' })

			const availableSeasons = [...new Set(summaries.map((summary) => summary.season))]
			const selectedSeason = parsedSeason.value ?? availableSeasons[0]
			const selectedSummary = summaries.find((summary) => summary.season === selectedSeason)
			if (!selectedSummary) {
				return response.status(404).json({
					detail: 'Season not found for this team.',
					available_seasons: availableSeasons,
				})
			}

			let stats = {}
			if (statType === 'summary') {
				stats = selectedSummary
			} else {
				const statRequest = pool.request()
				statRequest.input('season', sql.Int, selectedSeason)
				statRequest.input('abbreviation', sql.VarChar(10), sourceCode)
				statRequest.input('statType', sql.VarChar(20), statType)
				const statResult = await statRequest.query(`
					SELECT stats_json FROM dbo.team_season_stats
					WHERE season = @season AND abbreviation = @abbreviation AND stat_type = @statType
				`)
				if (statResult.recordset[0]) {
					stats = JSON.parse(statResult.recordset[0].stats_json)
				}
			}

			const rosterRequest = pool.request()
			rosterRequest.input('season', sql.Int, selectedSeason)
			rosterRequest.input('team', sql.NVarChar(50), sourceCode)
			for (const [index, code] of AGGREGATE_TEAM_CODES.entries()) {
				rosterRequest.input(`aggregate${index}`, sql.NVarChar(10), code)
			}
			const rosterResult = await rosterRequest.query(`
				WITH traded_players AS (
					SELECT player_id
					FROM dbo.player_per_game_stats
					WHERE season = @season AND team NOT IN (@aggregate0, @aggregate1, @aggregate2, @aggregate3)
					GROUP BY player_id
					HAVING COUNT(DISTINCT team) > 1
				)
				SELECT stats.player_id AS id, players.name, stats.pos AS position, stats.team,
					CAST(CASE WHEN traded.player_id IS NULL THEN 0 ELSE 1 END AS bit) AS traded
				FROM dbo.player_per_game_stats AS stats
				INNER JOIN dbo.players AS players ON players.player_id = stats.player_id
				LEFT JOIN traded_players AS traded ON traded.player_id = stats.player_id
				WHERE stats.season = @season AND UPPER(stats.team) = UPPER(@team)
				ORDER BY players.name, stats.player_id
			`)

			return response.json(serializeTeamDetail(
				abbreviation,
				selectedSummary,
				availableSeasons,
				statType,
				stats,
				rosterResult.recordset,
				summaries,
			))
		} catch (error) {
			return next(error)
		}
	})

	return router
}
