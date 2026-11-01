import { useMemo, useState } from 'react'
import { AlarmIndexTool } from './components/AlarmIndexTool.tsx'
import { DistributionTool } from './components/DistributionTool.tsx'
import { KeywordFilter } from './components/KeywordFilter.tsx'
import { TimeframeTool } from './components/TimeframeTool.tsx'
import { operations } from './data.ts'
import { filterByKeywords, parseKeywords } from './filters.ts'

type ToolId = 'timeframe' | 'distribution' | 'alarmindex'

const TOOLS: { id: ToolId; label: string }[] = [
  { id: 'timeframe', label: 'Zeitraum' },
  { id: 'distribution', label: 'Verteilung' },
  { id: 'alarmindex', label: 'Alarmindex' },
]

export function EinsaetzeSection() {
  const [keywordInput, setKeywordInput] = useState('')
  const [tool, setTool] = useState<ToolId>('timeframe')

  const filtered = useMemo(
    () => filterByKeywords(operations, parseKeywords(keywordInput)),
    [keywordInput],
  )

  return (
    <div className="section">
      <h1>Einsätze</h1>
      <KeywordFilter value={keywordInput} onChange={setKeywordInput} />
      <div className="tabs" role="tablist">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tool === t.id}
            onClick={() => setTool(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tool === 'timeframe' ? (
        <TimeframeTool operations={filtered} />
      ) : tool === 'distribution' ? (
        <DistributionTool operations={filtered} />
      ) : (
        <AlarmIndexTool operations={filtered} />
      )}
    </div>
  )
}
