import { useState } from 'react'
import { Home } from './components/Home.tsx'
import { sections } from './sections.ts'

export default function App() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = sections.find((section) => section.id === activeId)

  return (
    <div className="app">
      <header className="app-header">
        <button type="button" className="brand" onClick={() => setActiveId(null)}>
          🔥 Feuerwehr App
        </button>
        {active && (
          <>
            <span className="crumb-sep">/</span>
            <span>{active.title}</span>
          </>
        )}
      </header>
      <main>
        {active ? <active.component /> : <Home sections={sections} onSelect={setActiveId} />}
      </main>
    </div>
  )
}
