import { useEffect, useRef, useState } from 'react'
import { teams } from '../data/teams'

export type SectionId = 'players' | 'teams' | 'compare' | 'data'

type HeaderProps = {
	activeSection: SectionId
	onSectionChange: (section: SectionId) => void
	onSelectTeam: (abbreviation: string) => void
}

const sections: { id: SectionId; label: string }[] = [
	{ id: 'players', label: 'Players' },
	{ id: 'teams', label: 'Teams' },
	{ id: 'compare', label: 'Compare' },
	{ id: 'data', label: 'Data' },
]

function Header({ activeSection, onSectionChange, onSelectTeam }: HeaderProps) {
	const [isPanelOpen, setIsPanelOpen] = useState(false)
	const closeButtonRef = useRef<HTMLButtonElement>(null)
	const menuButtonRef = useRef<HTMLButtonElement>(null)

	useEffect(() => {
		if (!isPanelOpen) return

		closeButtonRef.current?.focus()
		const previousOverflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'

		function closeOnEscape(event: KeyboardEvent) {
			if (event.key === 'Escape') setIsPanelOpen(false)
		}

		document.addEventListener('keydown', closeOnEscape)
		return () => {
			document.removeEventListener('keydown', closeOnEscape)
			document.body.style.overflow = previousOverflow
			menuButtonRef.current?.focus()
		}
	}, [isPanelOpen])

	return (
		<header className="border-b border-stone-200 bg-white">
			<div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
				<button
					ref={menuButtonRef}
					type="button"
					className="grid size-9 shrink-0 place-items-center rounded-md border border-stone-200 text-stone-700 transition-colors hover:bg-stone-50"
					aria-label="Open workspace panel"
					aria-expanded={isPanelOpen}
					aria-controls="workspace-panel"
					onClick={() => setIsPanelOpen(true)}
				>
					<span aria-hidden="true" className="text-xl leading-none">≡</span>
				</button>

				<a className="flex shrink-0 items-center gap-3 text-stone-900 no-underline" href="#home" aria-label="Court Vision home">
					<span className="grid size-9 place-items-center rounded-md bg-blue-900 font-semibold tracking-tight text-white">BTA</span>
					<span className="text-lg font-semibold tracking-tight">BETA ANALYSIS</span>
				</a>

				<nav className="flex items-center gap-1 overflow-x-auto" aria-label="Main sections">
					{sections.map((section) => (
						<button
							key={section.label}
							type="button"
							aria-current={activeSection === section.id ? 'page' : undefined}
							onClick={() => onSectionChange(section.id)}
							className={`shrink-0 rounded-md px-3 py-2 text-sm transition-colors ${
								activeSection === section.id
									? 'bg-blue-50 font-medium text-blue-950'
									: 'text-stone-600 hover:bg-stone-50 hover:text-stone-950'
							}`}
						>
							{section.label}
						</button>
					))}
				</nav>

				<div className="hidden shrink-0 items-center gap-2 text-xs text-stone-500 sm:flex">
					<span className="size-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
					<span>NBA</span>
				</div>

			</div>

			<div
				className={`fixed inset-0 z-40 transition-[visibility] duration-300 ${isPanelOpen ? 'visible' : 'invisible delay-300'}`}
				aria-hidden={!isPanelOpen}
				inert={!isPanelOpen}
			>
				<button
					type="button"
					className={`absolute inset-0 size-full bg-black/35 transition-opacity duration-300 ${isPanelOpen ? 'opacity-100' : 'opacity-0'}`}
					aria-label="Close workspace panel"
					tabIndex={isPanelOpen ? 0 : -1}
					onClick={() => setIsPanelOpen(false)}
				/>

				<aside
					id="workspace-panel"
					role={isPanelOpen ? 'dialog' : undefined}
					aria-modal={isPanelOpen ? true : undefined}
					aria-labelledby="workspace-panel-title"
					className={`absolute inset-y-0 left-0 flex w-[min(22rem,90vw)] flex-col border-r border-stone-200 bg-white px-6 pb-6 pt-0 p-6 shadow-2xl transition-transform duration-300 ease-out ${isPanelOpen ? 'translate-x-0' : '-translate-x-full'}`}
				>
					<button
						ref={closeButtonRef}
						type="button"
						className="absolute right-3 top-2 z-10 grid size-9 place-items-center rounded-md text-2xl leading-none text-stone-500 hover:bg-stone-100 hover:text-stone-900"
						aria-label="Close workspace panel"
						onClick={() => setIsPanelOpen(false)}
					>
						×
					</button>

				<nav className="min-h-0 flex-1 overflow-y-auto" aria-label="NBA teams">
						{['Eastern', 'Western'].map((conference) => (
							<section className="mb-4" key={conference}>
								<h3 className="mb-1 px-3 py-2 text-xs font-medium text-stone-500">{conference} Conference</h3>
								<ul className="grid gap-0.5">
									{teams.filter((team) => team.conference === conference).map((team) => (
										<li key={team.abbreviation}>
											<a
												href={team.href}
												className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-stone-700 no-underline hover:bg-stone-50 hover:text-stone-950"
												onClick={(event) => {
													event.preventDefault()
													setIsPanelOpen(false)
													onSelectTeam(team.abbreviation)
												}}
											>
											<span className="grid size-7 shrink-0 place-items-center rounded bg-stone-100 text-[9px] font-semibold text-stone-600">{team.abbreviation}</span>
											<span>{team.name}</span>
											</a>
										</li>
									))}
								</ul>
							</section>
						))}
				</nav>
					
				</aside>
			</div>
		</header>
	)
}

export default Header
