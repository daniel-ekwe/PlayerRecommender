import { useState } from 'react'
import { teams } from '../data/teams'

type TeamsProps = {
	onSelectTeam: (abbreviation: string) => void
}

function Teams({ onSelectTeam }: TeamsProps) {
	const [query, setQuery] = useState('')
	const [isOpen, setIsOpen] = useState(false)
	const normalizedQuery = query.trim().toLowerCase()
	const filteredTeams = teams.filter((team) =>
		`${team.name} ${team.abbreviation} ${team.conference}`.toLowerCase().includes(normalizedQuery),
	)

	return (
			<main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
				<div
					className="relative"
					onBlur={(event) => {
						if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false)
					}}
				>
					<form
						role="search"
						className="flex w-full items-center gap-3 rounded-lg border border-stone-300 bg-white p-2 shadow-sm focus-within:border-blue-800 focus-within:ring-2 focus-within:ring-blue-800/15"
						onSubmit={(event) => event.preventDefault()}
					>
						<label htmlFor="team-search" className="sr-only">Search teams</label>
						<span aria-hidden="true" className="pl-3 text-xl leading-none text-stone-400">⌕</span>
						<input
							id="team-search"
							type="search"
							className="min-w-0 flex-1 bg-transparent py-2 text-sm text-stone-900 outline-none placeholder:text-stone-400"
							placeholder="Search for a team..."
							value={query}
							aria-expanded={isOpen && query.length > 0}
							aria-controls="team-search-results"
							autoComplete="off"
							onFocus={() => setIsOpen(true)}
							onChange={(event) => { setQuery(event.target.value); setIsOpen(true) }}
							onKeyDown={(event) => {
								if (event.key === 'Escape') setIsOpen(false)
							}}
						/>
						<button
							type="submit"
							className="shrink-0 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
						>
							Search
						</button>
					</form>

					{isOpen && normalizedQuery && (
						<div id="team-search-results" className="absolute inset-x-0 top-full z-10 mt-2 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-lg" role="listbox" aria-label="Matching teams">
							{filteredTeams.length > 0 ? filteredTeams.map((team) => (
								<a
									key={team.abbreviation}
									href={team.href}
									role="option"
									aria-selected="false"
									className="flex items-center gap-3 px-4 py-3 text-sm text-stone-800 no-underline hover:bg-stone-50"
									onClick={(event) => { event.preventDefault(); onSelectTeam(team.abbreviation) }}
								>
									<span className="grid size-8 shrink-0 place-items-center rounded bg-stone-100 text-[10px] font-semibold text-stone-600">{team.abbreviation}</span>
									<span className="flex-1 font-medium">{team.name}</span>
									<span className="text-xs text-stone-500">{team.conference}</span>
								</a>
							)) : (
								<p className="px-4 py-3 text-sm text-stone-500">No teams match “{query}”.</p>
							)}
						</div>
					)}
				</div>
		</main>
	)
}

export default Teams