import { useState } from 'react'

function Players() {
	const [query, setQuery] = useState('')

	return (
		<main id="players" className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
			<form
				role="search"
				className="flex w-full items-center gap-3 rounded-lg border border-stone-300 bg-white p-2 shadow-sm focus-within:border-blue-800 focus-within:ring-2 focus-within:ring-blue-800/15"
				onSubmit={(event) => event.preventDefault()}
			>
				<label htmlFor="player-search" className="sr-only">Search players</label>
				<span aria-hidden="true" className="pl-3 text-xl leading-none text-stone-400">⌕</span>
				<input
					id="player-search"
					type="search"
					className="min-w-0 flex-1 bg-transparent py-2 text-sm text-stone-900 outline-none placeholder:text-stone-400"
					placeholder="Search for a player..."
					value={query}
					onChange={(event) => setQuery(event.target.value)}
				/>
				<button
					type="submit"
					className="shrink-0 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
				>
					Search
				</button>
			</form>
		</main>
	)
}

export default Players
