import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'csv-parse/sync'
import mssql from 'mssql'

const sql = mssql

const API_DIR = resolve(fileURLToPath(new URL('..', import.meta.url)))
const DATA_DIR = resolve(API_DIR, '..', 'Backend', 'data')
const SCHEMA_PATH = resolve(API_DIR, 'sql', 'schema.sql')
const MAX_PARAMETERS_PER_INSERT = 2000

const text = (value) => (value ?? '').trim()
const integer = (value) => {
	const normalized = text(value)
	if (!normalized || normalized === 'NA') return null
	const number = Number(normalized)
	return Number.isInteger(number) ? number : null
}
const decimal = (value) => {
	const normalized = text(value)
	if (!normalized || normalized === 'NA') return null
	const number = Number(normalized)
	return Number.isFinite(number) ? number : null
}
const boolean = (value) => text(value).toLowerCase() === 'true'
const playerId = (row) => text(row.player_id) || text(row.player)
const date = (value) => {
	const normalized = text(value)
	if (!normalized || normalized === 'NA') return null
	return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null
}
const dateTime = (value) => {
	const normalized = text(value)
	if (!normalized || normalized === 'NA') return null
	const parsed = new Date(normalized)
	return Number.isNaN(parsed.getTime()) ? null : parsed
}

function field(name, type, value) {
	return { name, type, value }
}

const varchar = (name, length, value) => field(name, sql.VarChar(length), value)
const nvarchar = (name, length, value) => field(name, sql.NVarChar(length), value)
const int = (name, value) => field(name, sql.Int, value)
const float = (name, value) => field(name, sql.Float, value)
const bit = (name, value) => field(name, sql.Bit, value)

async function readCsv(fileName) {
	const contents = await readFile(resolve(DATA_DIR, fileName), 'utf8')
	return parse(contents, { bom: true, columns: true, skip_empty_lines: true })
}

function deduplicate(rows, keyFields) {
	const uniqueRows = new Map()
	for (const row of rows) {
		if (keyFields.some((key) => row[key] === null || row[key] === undefined || row[key] === '')) continue
		const key = keyFields.map((name) => String(row[name])).join('\u0000')
		uniqueRows.set(key, row)
	}
	return [...uniqueRows.values()]
}

async function loadTable(transaction, tableName, columns, records) {
	const batchSize = Math.max(1, Math.floor(MAX_PARAMETERS_PER_INSERT / columns.length))
	const columnSql = columns.map(({ name }) => `[${name}]`).join(', ')
	for (let start = 0; start < records.length; start += batchSize) {
		const batch = records.slice(start, start + batchSize)
		const request = transaction.request()
		const valuesSql = batch.map((record, rowIndex) => {
			const parameterNames = columns.map((column, columnIndex) => {
				const parameterName = `value_${rowIndex}_${columnIndex}`
				request.input(parameterName, column.type, record[column.name])
				return `@${parameterName}`
			})
			return `(${parameterNames.join(', ')})`
		})
		try {
			await request.query(
				`INSERT INTO dbo.[${tableName}] (${columnSql}) VALUES ${valuesSql.join(', ')}`,
			)
		} catch (error) {
			throw new Error(
				`Insert into dbo.${tableName} failed at batch starting with row ${start + 1}: ${error.message}`,
				{ cause: error },
			)
		}
	}
	console.log(`${tableName}: ${records.length} rows`)
}

async function buildImports(playerIds) {
	const imports = []
	const pushCsv = async (tableName, fileName, keyFields, mapper) => {
		const rows = await readCsv(fileName)
		const mapped = rows.map(mapper).filter(Boolean)
		imports.push({ tableName, rows: deduplicate(mapped, keyFields) })
	}

	await pushCsv('players', 'Player Career Info.csv', ['player_id'], (row) => {
		const id = playerId(row)
		if (!id || !text(row.player)) return null
		return {
			player_id: id,
			name: text(row.player),
			pos: text(row.pos),
			ht_in_in: integer(row.ht_in_in),
			wt: integer(row.wt),
			birth_date: date(row.birth_date),
			colleges: text(row.colleges),
			from_year: integer(row.from),
			to_year: integer(row.to),
			debut: dateTime(row.debut),
			hof: boolean(row.hof),
		}
	})
	const playerRows = imports[0].rows
	for (const { player_id: id } of playerRows) playerIds.add(id)

	const statColumns = {
		per_game: [
			['g', integer], ['gs', integer], ['mp_per_game', decimal], ['fg_per_game', decimal],
			['fga_per_game', decimal], ['fg_percent', decimal], ['x3p_per_game', decimal],
			['x3pa_per_game', decimal], ['x3p_percent', decimal], ['x2p_per_game', decimal],
			['x2pa_per_game', decimal], ['x2p_percent', decimal], ['ft_per_game', decimal],
			['fta_per_game', decimal], ['ft_percent', decimal], ['orb_per_game', decimal],
			['drb_per_game', decimal], ['trb_per_game', decimal], ['ast_per_game', decimal],
			['stl_per_game', decimal], ['blk_per_game', decimal], ['tov_per_game', decimal],
			['pf_per_game', decimal], ['pts_per_game', decimal],
		],
		shooting: [
			['fg_percent', decimal], ['x3p_percent', decimal], ['x2p_percent', decimal],
			['e_fg_percent', decimal], ['ft_percent', decimal],
		],
		totals: [
			['g', integer], ['gs', integer], ['mp', decimal], ['fg', decimal], ['fga', decimal],
			['fg_percent', decimal], ['x3p', decimal], ['x3pa', decimal], ['x3p_percent', decimal],
			['x2p', decimal], ['x2pa', decimal], ['x2p_percent', decimal], ['ft', decimal],
			['fta', decimal], ['ft_percent', decimal], ['orb', decimal], ['drb', decimal],
			['trb', decimal], ['ast', decimal], ['stl', decimal], ['blk', decimal],
			['tov', decimal], ['pf', decimal], ['pts', decimal],
		],
	}

	await pushCsv('player_seasons', 'Player Season Info.csv', ['player_id', 'season'], (row) => {
		const id = playerId(row)
		if (!playerIds.has(id)) return null
		return {
			player_id: id,
			season: integer(row.season),
			lg: text(row.lg),
			age: integer(row.age),
			team: text(row.team),
			pos: text(row.pos),
			experience: integer(row.experience),
		}
	})

	await pushCsv('player_draft_history', 'Draft Pick History.csv', ['player_id', 'season'], (row) => {
		const id = playerId(row)
		if (!playerIds.has(id)) return null
		return {
			player_id: id,
			season: integer(row.season),
			lg: text(row.lg),
			overall_pick: integer(row.overall_pick),
			round: integer(row.round),
			team: text(row.tm),
			college: text(row.college),
		}
	})

	await pushCsv('player_award_shares', 'Player Award Shares.csv', ['player_id', 'season', 'award'], (row) => {
		const id = playerId(row)
		if (!playerIds.has(id)) return null
		return {
			player_id: id,
			season: integer(row.season),
			award: text(row.award),
			age: integer(row.age),
			first: integer(row.first),
			pts_won: decimal(row.pts_won),
			pts_max: decimal(row.pts_max),
			share: decimal(row.share),
			winner: boolean(row.winner),
		}
	})

	await pushCsv('player_end_of_season_teams', 'End of Season Teams.csv', ['player_id', 'season', 'team_type', 'number_tm'], (row) => {
		const id = playerId(row)
		if (!playerIds.has(id)) return null
		return {
			player_id: id,
			season: integer(row.season),
			lg: text(row.lg),
			team_type: text(row.type),
			number_tm: text(row.number_tm),
			position: text(row.position),
		}
	})

	for (const [kind, fileName, tableName] of [
		['per_game', 'Player Per Game.csv', 'player_per_game_stats'],
		['shooting', 'Player Shooting.csv', 'player_shooting_stats'],
		['totals', 'Player Totals.csv', 'player_totals_stats'],
	]) {
		const rowFields = statColumns[kind]
		await pushCsv(tableName, fileName, ['player_id', 'season', 'team'], (row) => {
			const id = playerId(row)
			if (!playerIds.has(id)) return null
			const record = {
				player_id: id,
				season: integer(row.season),
				team: text(row.team),
				pos: text(row.pos),
			}
			for (const [name, parseValue] of rowFields) record[name] = parseValue(row[name])
			return record
		})
	}

	await pushCsv('team_season_summaries', 'Team Summaries.csv', ['season', 'abbreviation'], (row) => {
		const abbreviation = text(row.abbreviation).toUpperCase()
		if (!abbreviation) return null
		return {
			season: integer(row.season),
			lg: text(row.lg),
			team: text(row.team),
			abbreviation,
			playoffs: boolean(row.playoffs),
			age: decimal(row.age),
			w: integer(row.w),
			l: integer(row.l),
			pw: integer(row.pw),
			pl: integer(row.pl),
			mov: decimal(row.mov),
			sos: decimal(row.sos),
			srs: decimal(row.srs),
			o_rtg: decimal(row.o_rtg),
			d_rtg: decimal(row.d_rtg),
			n_rtg: decimal(row.n_rtg),
			pace: decimal(row.pace),
			arena: text(row.arena),
			attend: integer(row.attend),
			attend_g: integer(row.attend_g),
		}
	})

	for (const [fileName, statType] of [
		['Team Stats Per Game.csv', 'per_game'],
		['Team Stats Per 100 Poss.csv', 'per_100'],
	]) {
		await pushCsv('team_season_stats', fileName, ['season', 'abbreviation', 'stat_type'], (row) => {
			const abbreviation = text(row.abbreviation).toUpperCase()
			if (!abbreviation || abbreviation === '3TM') return null
			const metadata = new Set(['season', 'lg', 'team', 'abbreviation', 'playoffs'])
			const stats = Object.fromEntries(
				Object.entries(row)
					.filter(([name]) => !metadata.has(name))
					.map(([name, value]) => {
						const number = decimal(value)
						return [name, number === null ? text(value) || null : number]
					}),
			)
			return {
				season: integer(row.season),
				abbreviation,
				stat_type: statType,
				stats_json: JSON.stringify(stats),
			}
		})
	}

	return imports
}

const columnsByTable = {
	players: [
		varchar('player_id', 50, null), nvarchar('name', 100, null), nvarchar('pos', 20, null),
		int('ht_in_in', null), int('wt', null), field('birth_date', sql.Date, null),
		nvarchar('colleges', 200, null), int('from_year', null), int('to_year', null),
		field('debut', sql.DateTime2, null), bit('hof', null),
	],
	player_seasons: [
		varchar('player_id', 50, null), int('season', null), nvarchar('lg', 20, null),
		int('age', null), nvarchar('team', 50, null), nvarchar('pos', 20, null), int('experience', null),
	],
	player_draft_history: [
		varchar('player_id', 50, null), int('season', null), nvarchar('lg', 20, null),
		int('overall_pick', null), int('round', null), nvarchar('team', 50, null), nvarchar('college', 200, null),
	],
	player_award_shares: [
		varchar('player_id', 50, null), int('season', null), nvarchar('award', 100, null),
		int('age', null), int('first', null), float('pts_won', null), float('pts_max', null),
		float('share', null), bit('winner', null),
	],
	player_end_of_season_teams: [
		varchar('player_id', 50, null), int('season', null), nvarchar('lg', 20, null),
		nvarchar('team_type', 100, null), nvarchar('number_tm', 20, null), nvarchar('position', 20, null),
	],
	player_per_game_stats: [
		varchar('player_id', 50, null), int('season', null), nvarchar('team', 50, null), nvarchar('pos', 20, null),
		...['g', 'gs'].map((name) => int(name, null)),
		...[
			'mp_per_game', 'fg_per_game', 'fga_per_game', 'fg_percent', 'x3p_per_game',
			'x3pa_per_game', 'x3p_percent', 'x2p_per_game', 'x2pa_per_game', 'x2p_percent',
			'ft_per_game', 'fta_per_game', 'ft_percent', 'orb_per_game', 'drb_per_game',
			'trb_per_game', 'ast_per_game', 'stl_per_game', 'blk_per_game',
			'tov_per_game', 'pf_per_game', 'pts_per_game',
		].map((name) => float(name, null)),
	],
	player_shooting_stats: [
		varchar('player_id', 50, null), int('season', null), nvarchar('team', 50, null), nvarchar('pos', 20, null),
		...['fg_percent', 'x3p_percent', 'x2p_percent', 'e_fg_percent', 'ft_percent'].map((name) => float(name, null)),
	],
	player_totals_stats: [
		varchar('player_id', 50, null), int('season', null), nvarchar('team', 50, null), nvarchar('pos', 20, null),
		...['g', 'gs'].map((name) => int(name, null)),
		...[
			'mp', 'fg', 'fga', 'fg_percent', 'x3p', 'x3pa', 'x3p_percent', 'x2p',
			'x2pa', 'x2p_percent', 'ft', 'fta', 'ft_percent', 'orb', 'drb', 'trb',
			'ast', 'stl', 'blk', 'tov', 'pf', 'pts',
		].map((name) => float(name, null)),
	],
	team_season_summaries: [
		int('season', null), nvarchar('lg', 20, null), nvarchar('team', 100, null),
		varchar('abbreviation', 10, null), bit('playoffs', null), float('age', null),
		...['w', 'l', 'pw', 'pl'].map((name) => int(name, null)),
		...['mov', 'sos', 'srs', 'o_rtg', 'd_rtg', 'n_rtg', 'pace'].map((name) => float(name, null)),
		nvarchar('arena', 150, null), int('attend', null), int('attend_g', null),
	],
	team_season_stats: [
		int('season', null), varchar('abbreviation', 10, null), varchar('stat_type', 20, null),
		nvarchar('stats_json', sql.MAX, null),
	],
}

async function ensureEmptyDatabase(pool) {
	const tables = Object.keys(columnsByTable)
	const counts = await pool.request().query(`
		SELECT ${tables.map((table, index) =>
			`(SELECT COUNT_BIG(1) FROM dbo.${table}) AS table_${index}`,
		).join(', ')}
	`)
	const populated = tables.filter((table, index) => Number(counts.recordset[0][`table_${index}`]) > 0)
	if (populated.length) {
		throw new Error(
			`Import stopped because these tables already contain data: ${populated.join(', ')}. ` +
			'This command only imports into an empty database.',
		)
	}
}

async function main() {
	if (process.argv.includes('--dry-run')) {
		const playerIds = new Set()
		const imports = await buildImports(playerIds)
		console.log(`CSV validation complete. Found ${playerIds.size} players.`)
		for (const { tableName, rows } of imports) console.log(`${tableName}: ${rows.length} rows`)
		return
	}

	const missing = ['AZURE_SQL_SERVER', 'AZURE_SQL_DATABASE', 'AZURE_SQL_USER', 'AZURE_SQL_PASSWORD']
		.filter((name) => !process.env[name])
	if (missing.length) {
		throw new Error(`Missing database configuration: ${missing.join(', ')}`)
	}
	const pool = await new sql.ConnectionPool({
		server: process.env.AZURE_SQL_SERVER,
		database: process.env.AZURE_SQL_DATABASE,
		user: process.env.AZURE_SQL_USER,
		password: process.env.AZURE_SQL_PASSWORD,
		port: Number(process.env.AZURE_SQL_PORT || 1433),
		options: {
			encrypt: process.env.AZURE_SQL_ENCRYPT !== 'false',
			trustServerCertificate: process.env.AZURE_SQL_TRUST_SERVER_CERTIFICATE === 'true',
		},
		pool: { min: 0, max: 2 },
		connectionTimeout: 30000,
		requestTimeout: 120000,
	}).connect()

	try {
		await pool.request().batch(await readFile(SCHEMA_PATH, 'utf8'))
		await ensureEmptyDatabase(pool)
		const playerIds = new Set()
		const imports = await buildImports(playerIds)
		const transaction = new sql.Transaction(pool)
		await transaction.begin()
		try {
			for (const { tableName, rows } of imports) {
				await loadTable(transaction, tableName, columnsByTable[tableName], rows)
			}
			await transaction.commit()
		} catch (error) {
			console.error('CSV import transaction failed; attempting rollback.', error)
			try {
				await transaction.rollback()
			} catch (rollbackError) {
				console.error('CSV import rollback also failed.', rollbackError)
			}
			throw error
		}
		console.log(`CSV import complete. Loaded ${playerIds.size} players and ${imports.length - 1} related datasets.`)
	} finally {
		await pool.close()
	}
}

main().catch((error) => {
	console.error('CSV import failed:', error.message)
	process.exitCode = 1
})
