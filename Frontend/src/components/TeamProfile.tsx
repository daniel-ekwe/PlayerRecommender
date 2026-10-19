import { useEffect, useState } from 'react'
import { usePlayerData, type PlayerSearchResult } from '../context/PlayerDataContext'

type TeamStatType = 'per_game' | 'summary' | 'per_100'

type TeamProfileData = {
	abbreviation: string
	name: string
	available_seasons: number[]
	selected_season: number
	overview: {
		season: number
		league: string
		name: string
		abbreviation: string
		logo: string | null
		wins: number | null
		losses: number | null
		playoffs: boolean
		arena: string
		attendance: number | null
		attendance_per_game: number | null
	}
	stats: { type: TeamStatType; values: Record<string, string | number | boolean | null> }
	roster: { id: string; name: string; position: string; team: string; traded: boolean }[]
}

const statOptions: { id: TeamStatType; label: string }[] = [
	{ id: 'per_game', label: 'Per Game' },
	{ id: 'summary', label: 'Summary' },
	{ id: 'per_100', label: 'Per 100' },
]

const statColumns: Record<TeamStatType, { key: string; label: string }[]> = {
	per_game: [
		{ key: 'g', label: 'Games' }, { key: 'mp_per_game', label: 'Minutes' },
		{ key: 'fg_per_game', label: 'FGM' }, { key: 'fga_per_game', label: 'FGA' },
		{ key: 'x3p_per_game', label: '3PM' }, { key: 'x3pa_per_game', label: '3PA' },
		{ key: 'ft_per_game', label: 'FTM' }, { key: 'fta_per_game', label: 'FTA' },
		{ key: 'trb_per_game', label: 'Rebounds' }, { key: 'ast_per_game', label: 'Assists' },
		{ key: 'stl_per_game', label: 'Steals' }, { key: 'blk_per_game', label: 'Blocks' },
		{ key: 'pts_per_game', label: 'Points' },
	],
	per_100: [
		{ key: 'g', label: 'Games' }, { key: 'mp', label: 'Minutes' },
		{ key: 'fg_per_100_poss', label: 'FGM' }, { key: 'fga_per_100_poss', label: 'FGA' },
		{ key: 'x3p_per_100_poss', label: '3PM' }, { key: 'x3pa_per_100_poss', label: '3PA' },
		{ key: 'ft_per_100_poss', label: 'FTM' }, { key: 'fta_per_100_poss', label: 'FTA' },
		{ key: 'trb_per_100_poss', label: 'Rebounds' }, { key: 'ast_per_100_poss', label: 'Assists' },
		{ key: 'stl_per_100_poss', label: 'Steals' }, { key: 'blk_per_100_poss', label: 'Blocks' },
		{ key: 'pts_per_100_poss', label: 'Points' },
	],
	summary: [
		{ key: 'w', label: 'Wins' }, { key: 'l', label: 'Losses' },
		{ key: 'pw', label: 'Pythagorean Wins' }, { key: 'pl', label: 'Pythagorean Losses' },
		{ key: 'mov', label: 'Point Differential' }, { key: 'srs', label: 'Simple Rating' },
		{ key: 'o_rtg', label: 'Offensive Rating' }, { key: 'd_rtg', label: 'Defensive Rating' },
		{ key: 'n_rtg', label: 'Net Rating' }, { key: 'pace', label: 'Pace' },
	],
}

function formatValue(value: string | number | boolean | null | undefined) {
	if (value === null || value === undefined || value === '') return '—'
	if (typeof value === 'boolean') return value ? 'Yes' : 'No'
	return value
}

type TeamProfileProps = {
	teamCode: string
	onBack: () => void
	onOpenPlayers: () => void
}

function TeamProfile({ teamCode, onBack, onOpenPlayers }: TeamProfileProps) {
	const [team, setTeam] = useState<TeamProfileData | null>(null)
	const [season, setSeason] = useState<number | null>(null)
	const [statType, setStatType] = useState<TeamStatType>('per_game')
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const { selectPlayer } = usePlayerData()
	const columns = statColumns[statType]

	useEffect(() => {
		const controller = new AbortController()
		const params = new URLSearchParams({ stats: statType })
		if (season !== null) params.set('season', String(season))

		setLoading(true)
		setError(null)
		fetch(`/api/v1/teams/${encodeURIComponent(teamCode)}/?${params}`, {
			signal: controller.signal,
			headers: { Accept: 'application/json' },
		})
			.then(async (response) => {
				const payload = await response.json() as TeamProfileData & { detail?: string }
				if (!response.ok) throw new Error(payload.detail || `Request failed (${response.status}).`)
				return payload
			})
			.then(setTeam)
			.catch((requestError: unknown) => {
				if (requestError instanceof Error && requestError.name !== 'AbortError') setError(requestError.message)
			})
			.finally(() => {
				if (!controller.signal.aborted) setLoading(false)
			})

		return () => controller.abort()
	}, [teamCode, season, statType])

	function openPlayer(player: TeamProfileData['roster'][number]) {
		const result: PlayerSearchResult = {
			id: player.id,
			name: player.name,
			position: player.position,
			from_year: null,
			to_year: null,
		}
		selectPlayer(result)
		onOpenPlayers()
	}

	return (
		<main className="mx-auto w-full max-w-5xl space-y-5 px-5 py-10 sm:px-8">
			<section aria-label="Team information" className="rounded-lg border border-stone-300 bg-white p-6">
				<div className="flex flex-wrap items-center justify-between gap-5">
					<div className="flex min-w-0 items-center gap-4">
						<button type="button" onClick={onBack} className="rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50">Back to teams</button>
						{team?.overview.logo && <img src={team.overview.logo} alt="" className="size-14 shrink-0 object-contain" />}
						<div className="min-w-0">
							<p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Team Profile · {teamCode}</p>
							<h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-stone-900">{loading && !team ? 'Loading team…' : team?.name ?? 'Team profile'}</h1>
						</div>
					</div>
					<label className="flex items-center gap-2 text-sm text-stone-600">
						Season
						<select
							className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800"
							value={season ?? team?.selected_season ?? ''}
							disabled={!team || team.available_seasons.length === 0}
							onChange={(event) => setSeason(Number(event.target.value))}
						>
							{team?.available_seasons.map((year) => <option key={year} value={year}>{year}</option>)}
						</select>
					</label>
				</div>

				{team && <div className="mt-6 grid gap-4 border-t border-stone-200 pt-5 sm:grid-cols-2 lg:grid-cols-4">
					<div><p className="text-xs text-stone-500">Record</p><p className="mt-1 text-sm font-medium text-stone-800">{formatValue(team.overview.wins)}–{formatValue(team.overview.losses)}</p></div>
					<div><p className="text-xs text-stone-500">Playoffs</p><p className="mt-1 text-sm font-medium text-stone-800">{formatValue(team.overview.playoffs)}</p></div>
					<div><p className="text-xs text-stone-500">Arena</p><p className="mt-1 text-sm font-medium text-stone-800">{formatValue(team.overview.arena)}</p></div>
					<div><p className="text-xs text-stone-500">Attendance</p><p className="mt-1 text-sm font-medium text-stone-800">{formatValue(team.overview.attendance)}</p></div>
				</div>}
				{loading && team && <p className="mt-4 text-xs text-stone-500">Updating season…</p>}
				{error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
			</section>

			<section aria-label="Team statistics" className="rounded-lg border border-stone-300 bg-white p-6">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<h2 className="text-lg font-semibold text-stone-900">Team Statistics</h2>
					<div className="flex gap-1 rounded-md bg-stone-100 p-1" role="tablist" aria-label="Team stat display">
						{statOptions.map((option) => <button
							key={option.id}
							type="button"
							role="tab"
							aria-selected={statType === option.id}
							className={`rounded px-3 py-2 text-xs font-medium ${statType === option.id ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
							onClick={() => setStatType(option.id)}
						>{option.label}</button>)}
					</div>
				</div>
				{team && <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{columns.map((column) => <div key={column.key} className="border-t border-stone-200 py-3">
						<dt className="text-xs text-stone-500">{column.label}</dt>
						<dd className="mt-1 text-lg font-medium text-stone-900">{formatValue(team.stats.values[column.key])}</dd>
					</div>)}
				</dl>}
				{!loading && team && Object.keys(team.stats.values).length === 0 && <p className="mt-5 text-sm text-stone-500">No {statOptions.find((option) => option.id === statType)?.label.toLowerCase()} data is available for this season.</p>}
			</section>

			<section aria-label="Team roster" className="rounded-lg border border-stone-300 bg-white p-6">
				<div className="flex items-center justify-between gap-4">
					<h2 className="text-lg font-semibold text-stone-900">Roster</h2>
					{team && <span className="text-xs text-stone-500">{team.roster.length} players</span>}
				</div>
				{team && team.roster.length > 0 ? <ul className="mt-4 divide-y divide-stone-200 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:divide-y-0">
					{team.roster.map((player) => <li key={player.id} className="border-t border-stone-200 py-2.5 sm:border-t">
						<div className="flex items-center gap-2">
							{player.traded && <span className="group relative inline-flex" title="Traded">
								<span aria-label="Traded" className="grid size-5 place-items-center rounded bg-amber-100 text-[10px] font-bold text-amber-900">T</span>
								<span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded bg-stone-900 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">Traded</span>
							</span>}
							<a
								href={`#players/${encodeURIComponent(player.id)}`}
								className="text-sm font-medium text-stone-800 underline decoration-stone-300 underline-offset-4 hover:text-blue-900"
								onClick={() => openPlayer(player)}
							>{player.name}</a>
							<span className="ml-auto text-xs text-stone-500">{player.position || '—'}</span>
						</div>
					</li>)}
				</ul> : !loading && <p className="mt-4 text-sm text-stone-500">No roster data is available for this season.</p>}
			</section>
		</main>
	)
}

export default TeamProfile