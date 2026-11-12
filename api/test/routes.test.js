import assert from 'node:assert/strict'
import { once } from 'node:events'
import { afterEach, test } from 'node:test'
import { createApp } from '../src/app.js'
import { DatabaseConfigurationError } from '../src/db.js'

const servers = new Set()

afterEach(async () => {
	for (const server of servers) {
		await new Promise((resolve, reject) => {
			server.close((error) => error ? reject(error) : resolve())
		})
	}
	servers.clear()
})

async function requestApp(app, path) {
	const server = app.listen(0)
	servers.add(server)
	await once(server, 'listening')
	const address = server.address()
	return fetch(`http://127.0.0.1:${address.port}${path}`)
}

test('health endpoint reports a connected database', async () => {
	const app = createApp(async () => ({
		request: () => ({ query: async () => ({ recordset: [{ ok: 1 }] }) }),
	}))
	const response = await requestApp(app, '/health')
	assert.equal(response.status, 200)
	assert.deepEqual(await response.json(), { status: 'ok', database: 'connected' })
})

test('health endpoint reports a missing database configuration as unavailable', async () => {
	const app = createApp(async () => {
		throw new DatabaseConfigurationError('Configuration is missing')
	})
	const response = await requestApp(app, '/health')
	assert.equal(response.status, 503)
	assert.deepEqual(await response.json(), { detail: 'Database is not configured.' })
})

test('player search preserves the frontend response shape', async () => {
	const app = createApp(async () => ({
		request: () => {
			const inputs = new Map()
			return {
				input(name, type, value) {
					inputs.set(name, value)
					return this
				},
				async query(query) {
					if (query.includes('COUNT_BIG')) {
						return { recordset: [{ count: 1n }] }
					}
					return {
						recordset: [{
							player_id: 'p001',
							name: 'Example Player',
							pos: 'G',
							from_year: 2000,
							to_year: 2010,
						}],
					}
				},
			}
		},
	}))
	const response = await requestApp(app, '/api/v1/players/?search=Example')
	assert.equal(response.status, 200)
	assert.deepEqual(await response.json(), {
		count: 1,
		page: 1,
		page_size: 25,
		next_page: null,
		previous_page: null,
		results: [{
			id: 'p001',
			name: 'Example Player',
			position: 'G',
			from_year: 2000,
			to_year: 2010,
		}],
	})
})

test('player detail returns the profile shape consumed by the frontend', async () => {
	const app = createApp(async () => ({
		request: () => {
			const request = {
				input() {
					return request
				},
				async query(query) {
					if (query.includes('FROM dbo.players')) {
						return {
							recordset: [{
								player_id: 'p001',
								name: 'Example Player',
								pos: 'G',
								ht_in_in: 79,
								wt: 190,
								birth_date: new Date('2000-01-02T00:00:00.000Z'),
								colleges: 'Example University',
								from_year: 2000,
								to_year: 2010,
								debut: new Date('2000-10-01T00:00:00.000Z'),
								hof: false,
							}],
						}
					}
					if (query.includes('FROM dbo.player_seasons')) {
						return { recordset: [{ team: 'BOS', season: 2000 }] }
					}
					if (query.includes('FROM dbo.player_draft_history')) {
						return { recordset: [] }
					}
					if (query.includes('FROM dbo.player_award_shares')) {
						return { recordset: [{ award: 'MVP' }] }
					}
					return {
						recordset: [{
							season: 2001,
							team_type: 'All-NBA',
							number_tm: '1st',
							position: 'G',
						}],
					}
				},
			}
			return request
		},
	}))
	const response = await requestApp(app, '/api/v1/players/p001/')
	assert.equal(response.status, 200)
	const profile = await response.json()
	assert.equal(profile.id, 'p001')
	assert.deepEqual(profile.height, { inches: 79, feet: 6, remaining_inches: 7 })
	assert.equal(profile.birth_date, '2000-01-02')
	assert.equal(profile.teams[0].code, 'BOS')
	assert.deepEqual(profile.honours, [
		{ title: 'All-NBA 1st Team (G)', count: 1 },
		{ title: 'MVP', count: 1 },
	])
})

test('player stats rejects unsupported stat types without querying the database', async () => {
	let poolRequested = false
	const app = createApp(async () => {
		poolRequested = true
		throw new Error('Database should not be queried')
	})
	const response = await requestApp(app, '/api/v1/players/p001/stats/?type=unsupported')
	assert.equal(response.status, 400)
	assert.deepEqual(await response.json(), {
		detail: 'Invalid stat type.',
		allowed_types: ['per_game', 'shooting', 'totals'],
	})
	assert.equal(poolRequested, false)
})

test('player stats returns the requested season and stat rows', async () => {
	const app = createApp(async () => ({
		request: () => ({
			input() {
				return this
			},
			async query(query) {
				if (query.includes('SELECT 1 AS found')) return { recordset: [{ found: 1 }] }
				return {
					recordset: [{ season: 2001, team: 'BOS', pos: 'G', pts_per_game: 20.5 }],
				}
			},
		}),
	}))
	const response = await requestApp(app, '/api/v1/players/p001/stats/?type=per_game&season=2001')
	assert.equal(response.status, 200)
	assert.deepEqual(await response.json(), {
		player_id: 'p001',
		type: 'per_game',
		season: 2001,
		results: [{ season: 2001, team: 'BOS', pos: 'G', pts_per_game: 20.5 }],
	})
})

test('team detail returns the summary, season, and roster contract', async () => {
	const summary = {
		season: 2020,
		lg: 'NBA',
		team: 'Boston Celtics',
		abbreviation: 'BOS',
		playoffs: true,
		age: 25.2,
		w: 48,
		l: 24,
		pw: 46,
		pl: 26,
		mov: 6.4,
		sos: -0.5,
		srs: 6.0,
		o_rtg: 113.0,
		d_rtg: 106.5,
		n_rtg: 6.5,
		pace: 98.0,
		arena: 'TD Garden',
		attend: 0,
		attend_g: 0,
	}
	const app = createApp(async () => ({
		request: () => ({
			input() {
				return this
			},
			async query(query) {
				if (query.includes('FROM dbo.team_season_summaries')) {
					return { recordset: [summary] }
				}
				return { recordset: [] }
			},
		}),
	}))
	const response = await requestApp(app, '/api/v1/teams/BOS/?stats=summary')
	assert.equal(response.status, 200)
	const team = await response.json()
	assert.equal(team.abbreviation, 'BOS')
	assert.equal(team.selected_season, 2020)
	assert.equal(team.overview.wins, 48)
	assert.deepEqual(team.stats, { type: 'summary', values: summary })
	assert.deepEqual(team.roster, [])
	assert.equal(team.seasons[0].name, 'Boston Celtics')
})
