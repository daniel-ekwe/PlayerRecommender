import { useState, type FormEvent } from 'react'
import { usePlayerData, type PlayerStatRow, type StatType } from '../context/PlayerDataContext'

const aggregateTeamCodes = new Set(['TOT', '2TM', '3TM', '4TM', '5TM'])

const statTabs: { id: StatType; label: string }[] = [
	{ id: 'per_game', label: 'Per Game' },
	{ id: 'shooting', label: 'Shooting' },
	{ id: 'totals', label: 'Totals' },
]

const statColumns: Record<StatType, { key: string; label: string }[]> = {
	per_game: [
		{ key: 'season', label: 'Season' }, { key: 'team', label: 'Team' }, { key: 'g', label: 'G' },
		{ key: 'mp_per_game', label: 'MPG' }, { key: 'fg_per_game', label: 'FGM' },
		{ key: 'fga_per_game', label: 'FGA' }, { key: 'x3p_per_game', label: '3PM' },
		{ key: 'x3pa_per_game', label: '3PA' }, { key: 'ft_per_game', label: 'FTM' },
		{ key: 'fta_per_game', label: 'FTA' }, { key: 'trb_per_game', label: 'REB' },
		{ key: 'ast_per_game', label: 'AST' }, { key: 'stl_per_game', label: 'STL' },
		{ key: 'blk_per_game', label: 'BLK' }, { key: 'pts_per_game', label: 'PTS' },
	],
	shooting: [
		{ key: 'season', label: 'Season' }, { key: 'team', label: 'Team' },
		{ key: 'fg_percent', label: 'FG%' }, { key: 'x3p_percent', label: '3P%' },
		{ key: 'x2p_percent', label: '2P%' }, { key: 'e_fg_percent', label: 'eFG%' },
		{ key: 'ft_percent', label: 'FT%' },
	],
	totals: [
		{ key: 'season', label: 'Season' }, { key: 'team', label: 'Team' }, { key: 'g', label: 'G' },
		{ key: 'gs', label: 'GS' }, { key: 'mp', label: 'MP' }, { key: 'fg', label: 'FGM' },
		{ key: 'fga', label: 'FGA' }, { key: 'x3p', label: '3PM' }, { key: 'x3pa', label: '3PA' },
		{ key: 'ft', label: 'FTM' }, { key: 'fta', label: 'FTA' }, { key: 'trb', label: 'REB' },
		{ key: 'ast', label: 'AST' }, { key: 'stl', label: 'STL' }, { key: 'blk', label: 'BLK' },
		{ key: 'pts', label: 'PTS' },
	],
}

function displayStat(value: PlayerStatRow[string]) {
	return value === null || value === '' ? '—' : value
}

type PlayersProps = {
	onSelectTeam: (abbreviation: string) => void
}

function Players({ onSelectTeam }: PlayersProps) {
	const [searchOpen, setSearchOpen] = useState(false)
	const {
		searchQuery,
		setSearchQuery,
		searchResults,
		searchLoading,
		searchError,
		selectPlayer,
		selectedPlayer,
		profileLoading,
		profileError,
		statType,
		setStatType,
		season,
		setSeason,
		stats,
		statsLoading,
		statsError,
	} = usePlayerData()
	const visibleStats = season === null ? stats : stats.filter((row) => row.season === season)
	const seasons = [...new Set(stats.map((row) => row.season))].sort((left, right) => right - left)
	const columns = statColumns[statType]

	function submitSearch(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (searchResults[0]) {
			selectPlayer(searchResults[0])
			setSearchOpen(false)
		}
	}

	return (
		<main id="players" className="mx-auto w-full max-w-5xl space-y-5 px-5 py-10 sm:px-8">
			<div
				className="relative"
				onBlur={(event) => {
					if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false)
				}}
			>
				<form
					role="search"
					className="flex w-full items-center gap-3 rounded-lg border border-stone-300 bg-white p-2 shadow-sm focus-within:border-blue-800 focus-within:ring-2 focus-within:ring-blue-800/15"
					onSubmit={submitSearch}
				>
					<label htmlFor="player-search" className="sr-only">Search players</label>
					<span aria-hidden="true" className="pl-3 text-xl leading-none text-stone-400">⌕</span>
					<input
						id="player-search"
						type="search"
						className="min-w-0 flex-1 bg-transparent py-2 text-sm text-stone-900 outline-none placeholder:text-stone-400"
						placeholder="Search for a player..."
						value={searchQuery}
						aria-autocomplete="list"
						aria-expanded={searchOpen && searchQuery.trim().length >= 2}
						aria-controls="player-search-results"
						autoComplete="off"
						onFocus={() => setSearchOpen(true)}
						onChange={(event) => { setSearchQuery(event.target.value); setSearchOpen(true) }}
						onKeyDown={(event) => {
							if (event.key === 'Escape') setSearchOpen(false)
						}}
					/>
					<button
						type="submit"
						className="shrink-0 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
					>
						Search
					</button>
				</form>

				{searchOpen && searchQuery.trim().length >= 2 && (
					<div id="player-search-results" className="absolute inset-x-0 top-full z-10 mt-2 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-lg" role="listbox" aria-label="Matching players">
						{searchLoading && <p className="px-4 py-3 text-sm text-stone-500">Searching players…</p>}
						{!searchLoading && searchError && <p className="px-4 py-3 text-sm text-red-700">{searchError}</p>}
						{!searchLoading && !searchError && searchResults.map((player) => (
							<a
								key={player.id}
								href={`#player-${encodeURIComponent(player.id)}`}
								role="option"
								aria-selected={selectedPlayer?.id === player.id}
								className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-stone-800 no-underline hover:bg-stone-50"
								onClick={(event) => { event.preventDefault(); selectPlayer(player); setSearchOpen(false) }}
							>
								<span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-semibold text-blue-900">{player.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('')}</span>
								<span className="min-w-0 flex-1">
									<strong className="block truncate">{player.name}</strong>
									<span className="text-xs text-stone-500">{player.position || 'Position unavailable'}{player.from_year ? ` · ${player.from_year}–${player.to_year ?? 'present'}` : ''}</span>
								</span>
							</a>
						))}
						{!searchLoading && !searchError && searchResults.length === 0 && <p className="px-4 py-3 text-sm text-stone-500">No players match “{searchQuery}”.</p>}
					</div>
				)}
			</div>

			<section
				aria-label="Player profile header"
				className="min-h-48 rounded-lg border border-stone-300 bg-white p-6"
			>
				{profileLoading && <p className="text-sm text-stone-500">Loading player profile…</p>}
				{profileError && <p role="alert" className="text-sm text-red-700">{profileError}</p>}
				{selectedPlayer && !profileLoading && (
					<div className="space-y-6">
						<div className="flex flex-wrap items-start justify-between gap-4">
							<div>
								<p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Player profile</p>
								<h1 className="text-3xl font-semibold tracking-tight text-stone-900">{selectedPlayer.name}</h1>
								<p className="mt-1 text-sm text-stone-600">{selectedPlayer.position || 'Position unavailable'}</p>
							</div>
							{selectedPlayer.hall_of_fame && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">Hall of Fame</span>}
						</div>

						<div className="grid gap-4 border-t border-stone-200 pt-5 sm:grid-cols-3">
							<div><p className="text-xs text-stone-500">Career</p><p className="mt-1 text-sm font-medium text-stone-800">{selectedPlayer.career.from_year ?? '—'}–{selectedPlayer.career.to_year ?? 'present'}</p></div>
							<div><p className="text-xs text-stone-500">Height · Weight</p><p className="mt-1 text-sm font-medium text-stone-800">{selectedPlayer.height ? `${selectedPlayer.height.feet} ft ${selectedPlayer.height.remaining_inches} in` : '—'} · {selectedPlayer.weight_lbs ? `${selectedPlayer.weight_lbs} lb` : '—'}</p></div>
							<div><p className="text-xs text-stone-500">College</p><p className="mt-1 text-sm font-medium text-stone-800">{selectedPlayer.colleges || '—'}</p></div>
						</div>

						{selectedPlayer.teams.length > 0 && <div>
							<p className="mb-2 text-xs font-medium text-stone-500">Teams</p>
							<ul className="flex flex-wrap gap-2">
								{selectedPlayer.teams.map((team) => <li key={team.code}>
									<a
										href={`#team-${encodeURIComponent(team.code.toLowerCase())}`}
										className="inline-block rounded-md bg-stone-100 px-3 py-1.5 text-xs text-stone-700 no-underline hover:bg-blue-50 hover:text-blue-900"
										onClick={(event) => { event.preventDefault(); onSelectTeam(team.code) }}
									>{team.name} · {team.from_year}{team.to_year !== team.from_year ? `–${team.to_year}` : ''}</a>
								</li>)}
							</ul>
						</div>}

						{selectedPlayer.honours.length > 0 && <div>
							<p className="mb-2 text-xs font-medium text-stone-500">Honours</p>
							<ul className="flex flex-wrap gap-2">
								{selectedPlayer.honours.map((honour) => <li key={honour.title} className="rounded-md border border-stone-200 px-3 py-1.5 text-xs text-stone-700">{honour.title} <span className="text-stone-500">×{honour.count}</span></li>)}
							</ul>
						</div>}
					</div>
				)}
			</section>

			<section
				aria-label="Player statistics"
				className="min-h-[28rem] rounded-lg border border-stone-300 bg-white p-6"
			>
				{selectedPlayer && <>
					<div className="flex flex-wrap items-end justify-between gap-4">
						<div>
							<p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Season by season</p>
							<h2 className="text-xl font-semibold text-stone-900">Statistics</h2>
						</div>
						<label className="flex items-center gap-2 text-xs text-stone-500">
							Season
							<select
								className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800"
								value={season ?? ''}
								onChange={(event) => setSeason(event.target.value ? Number(event.target.value) : null)}
							>
								<option value="">All seasons</option>
								{seasons.map((year) => <option key={year} value={year}>{year}</option>)}
							</select>
						</label>
					</div>

					<div className="mt-5 flex gap-2 border-b border-stone-200" role="tablist" aria-label="Stat type">
						{statTabs.map((tab) => <button
							key={tab.id}
							type="button"
							role="tab"
							aria-selected={statType === tab.id}
							className={`border-b-2 px-3 py-2 text-sm ${statType === tab.id ? 'border-blue-900 font-medium text-blue-950' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
							onClick={() => setStatType(tab.id)}
						>{tab.label}</button>)}
					</div>

					{statsLoading && <p className="py-8 text-sm text-stone-500">Loading statistics…</p>}
					{statsError && <p role="alert" className="py-8 text-sm text-red-700">{statsError}</p>}
					{!statsLoading && !statsError && visibleStats.length > 0 && <div className="mt-4 overflow-x-auto">
						<table className="w-full min-w-max border-collapse text-left text-sm">
							<thead><tr>{columns.map((column) => <th key={column.key} scope="col" className="whitespace-nowrap border-b border-stone-200 px-3 py-3 text-xs font-medium text-stone-500">{column.label}</th>)}</tr></thead>
							<tbody>{visibleStats.map((row, rowIndex) => <tr key={`${row.season}-${row.team}-${rowIndex}`} className="border-b border-stone-100 last:border-0">
								{columns.map((column) => <td key={column.key} className="whitespace-nowrap px-3 py-3 text-stone-700">
									{column.key === 'team' && typeof row.team === 'string' && !aggregateTeamCodes.has(row.team.toUpperCase()) ? (
										<a
											href={`#team-${encodeURIComponent(row.team.toLowerCase())}`}
											className="text-blue-900 underline decoration-blue-200 underline-offset-2 hover:decoration-blue-900"
											onClick={(event) => { event.preventDefault(); onSelectTeam(row.team) }}
										>{row.team}</a>
									) : displayStat(row[column.key])}
								</td>)}
							</tr>)}</tbody>
						</table>
					</div>}
					{!statsLoading && !statsError && visibleStats.length === 0 && <p className="py-8 text-sm text-stone-500">No statistics are available for this selection.</p>}
				</>}
			</section>
		</main>
	)
}

export default Players
