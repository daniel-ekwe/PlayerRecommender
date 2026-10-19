import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react'

export type PlayerSearchResult = {
	id: string
	name: string
	position: string
	from_year: number | null
	to_year: number | null
}

export type PlayerProfile = {
	id: string
	name: string
	position: string
	height: { inches: number; feet: number; remaining_inches: number } | null
	weight_lbs: number | null
	birth_date: string | null
	colleges: string
	career: { from_year: number | null; to_year: number | null }
	debut: string | null
	hall_of_fame: boolean
	teams: { code: string; name: string; logo: string | null; from_year: number; to_year: number }[]
	draft_history: { season: number; league: string; overall_pick: number | null; round: number | null; team: string; college: string }[]
	honours: { title: string; count: number }[]
}

export type StatType = 'per_game' | 'shooting' | 'totals'

export type PlayerStatRow = {
	season: number
	team: string
	[key: string]: string | number | boolean | null
}

type PlayerDataContextValue = {
	searchQuery: string
	setSearchQuery: (query: string) => void
	searchResults: PlayerSearchResult[]
	searchLoading: boolean
	searchError: string | null
	selectPlayer: (player: PlayerSearchResult) => void
	selectedPlayer: PlayerProfile | null
	profileLoading: boolean
	profileError: string | null
	statType: StatType
	setStatType: (type: StatType) => void
	season: number | null
	setSeason: (season: number | null) => void
	stats: PlayerStatRow[]
	statsLoading: boolean
	statsError: string | null
}

const PlayerDataContext = createContext<PlayerDataContextValue | null>(null)

async function fetchApi<T>(url: string, signal: AbortSignal): Promise<T> {
	const response = await fetch(url, {
		signal,
		headers: { Accept: 'application/json' },
	})
	const payload = await response.json() as T & { detail?: string }

	if (!response.ok) {
		throw new Error(payload.detail || `Request failed (${response.status}).`)
	}

	return payload
}

export function PlayerDataProvider({ children }: PropsWithChildren) {
	const [searchQuery, setSearchQuery] = useState('')
	const [searchResults, setSearchResults] = useState<PlayerSearchResult[]>([])
	const [searchLoading, setSearchLoading] = useState(false)
	const [searchError, setSearchError] = useState<string | null>(null)
	const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
	const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfile | null>(null)
	const [profileLoading, setProfileLoading] = useState(false)
	const [profileError, setProfileError] = useState<string | null>(null)
	const [statType, setStatTypeState] = useState<StatType>('per_game')
	const [season, setSeason] = useState<number | null>(null)
	const [stats, setStats] = useState<PlayerStatRow[]>([])
	const [statsLoading, setStatsLoading] = useState(false)
	const [statsError, setStatsError] = useState<string | null>(null)

	useEffect(() => {
		const search = searchQuery.trim()
		if (search.length < 2) {
			setSearchResults([])
			setSearchLoading(false)
			setSearchError(null)
			return
		}

		const controller = new AbortController()
		const timeoutId = window.setTimeout(async () => {
			setSearchLoading(true)
			setSearchError(null)
			try {
				const params = new URLSearchParams({ search })
				const payload = await fetchApi<{ results: PlayerSearchResult[] }>(
					`/api/v1/players/?${params}`,
					controller.signal,
				)
				setSearchResults(payload.results)
			} catch (error) {
				if (error instanceof Error && error.name !== 'AbortError') {
					setSearchError(error.message)
					setSearchResults([])
				}
			} finally {
				if (!controller.signal.aborted) setSearchLoading(false)
			}
		}, 250)

		return () => {
			window.clearTimeout(timeoutId)
			controller.abort()
		}
	}, [searchQuery])

	useEffect(() => {
		if (!selectedPlayerId) {
			setSelectedPlayer(null)
			setProfileLoading(false)
			setProfileError(null)
			return
		}

		const controller = new AbortController()
		setSelectedPlayer(null)
		setProfileLoading(true)
		setProfileError(null)

		fetchApi<PlayerProfile>(`/api/v1/players/${encodeURIComponent(selectedPlayerId)}/`, controller.signal)
			.then(setSelectedPlayer)
			.catch((error: unknown) => {
				if (error instanceof Error && error.name !== 'AbortError') setProfileError(error.message)
			})
			.finally(() => {
				if (!controller.signal.aborted) setProfileLoading(false)
			})

		return () => controller.abort()
	}, [selectedPlayerId])

	useEffect(() => {
		if (!selectedPlayerId) {
			setStats([])
			setStatsLoading(false)
			setStatsError(null)
			return
		}

		const controller = new AbortController()
		setStatsLoading(true)
		setStatsError(null)
		const params = new URLSearchParams({ type: statType })

		fetchApi<{ results: PlayerStatRow[] }>(
			`/api/v1/players/${encodeURIComponent(selectedPlayerId)}/stats/?${params}`,
			controller.signal,
		)
			.then((payload) => setStats(payload.results))
			.catch((error: unknown) => {
				if (error instanceof Error && error.name !== 'AbortError') {
					setStatsError(error.message)
					setStats([])
				}
			})
			.finally(() => {
				if (!controller.signal.aborted) setStatsLoading(false)
			})

		return () => controller.abort()
	}, [selectedPlayerId, statType])

	function selectPlayer(player: PlayerSearchResult) {
		setSearchQuery(player.name)
		setSeason(null)
		setStatTypeState('per_game')
		setSelectedPlayerId(player.id)
	}

	function setStatType(type: StatType) {
		setSeason(null)
		setStatTypeState(type)
	}

	return (
		<PlayerDataContext.Provider value={{
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
		}}>
			{children}
		</PlayerDataContext.Provider>
	)
}

export function usePlayerData() {
	const context = useContext(PlayerDataContext)
	if (!context) throw new Error('usePlayerData must be used within PlayerDataProvider.')
	return context
}