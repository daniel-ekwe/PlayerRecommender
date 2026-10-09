import { useState } from 'react'
import Header from './components/Header'
import type { SectionId } from './components/Header'
import Compare from './components/Compare'
import Data from './components/Data'
import Players from './components/Players'

function App() {
  const [activeSection, setActiveSection] = useState<SectionId>('players')

  return (
    <>
      <Header activeSection={activeSection} onSectionChange={setActiveSection} />
      {activeSection === 'players' && <Players />}
      {activeSection === 'compare' && <Compare />}
      {activeSection === 'data' && <Data />}
    </>
  )
}

export default App