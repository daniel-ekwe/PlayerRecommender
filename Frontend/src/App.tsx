import { useState } from 'react'
import Header from './components/Header'
import type { SectionId } from './components/Header'
import Compare from './components/Compare'
import Data from './components/Data'
import Players from './components/Players'
import Teams from './components/Teams'
import TeamProfile from './components/TeamProfile'
import { PlayerDataProvider } from './context/PlayerDataContext'

function App() {
  const [activeSection, setActiveSection] = useState<SectionId>('players')
  const [selectedTeamCode, setSelectedTeamCode] = useState<string | null>(null)

  function handleSectionChange(section: SectionId) {
    setSelectedTeamCode(null)
    setActiveSection(section)
  }

  function handleTeamSelect(abbreviation: string) {
    setSelectedTeamCode(abbreviation)
    setActiveSection('teams')
  }

  return (
    <PlayerDataProvider>
      <Header activeSection={activeSection} onSectionChange={handleSectionChange} onSelectTeam={handleTeamSelect} />
      {activeSection === 'players' && <Players onSelectTeam={handleTeamSelect} />}
      {activeSection === 'teams' && (selectedTeamCode ? (
        <TeamProfile
          key={selectedTeamCode}
          teamCode={selectedTeamCode}
          onBack={() => setSelectedTeamCode(null)}
          onOpenPlayers={() => { setSelectedTeamCode(null); setActiveSection('players') }}
        />
      ) : <Teams onSelectTeam={handleTeamSelect} />)}
      {activeSection === 'compare' && <Compare />}
      {activeSection === 'data' && <Data />}
    </PlayerDataProvider>
  )
}

export default App