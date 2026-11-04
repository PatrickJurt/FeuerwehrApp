import { useMemo, useState } from 'react'
import { DistributionTool } from './components/DistributionTool.tsx'
import { KeywordFilter } from './components/KeywordFilter.tsx'
import { TimeframeTool } from './components/TimeframeTool.tsx'
import { operations } from './data.ts'
import { filterByKeywords, normalizeKeyword, type KeywordRule, type KeywordRuleMode } from './filters.ts'

type ToolId = 'timeframe' | 'distribution'

const TOOLS: { id: ToolId; label: string }[] = [
  { id: 'timeframe', label: 'Zeitraum' },
  { id: 'distribution', label: 'Verteilung' },
]

export function EinsaetzeSection() {
  const [keywordRules, setKeywordRules] = useState<KeywordRule[]>([])
  const [tool, setTool] = useState<ToolId>('timeframe')

  function addKeywordRule(keywordInput: string, mode: KeywordRuleMode): void {
    const keyword = normalizeKeyword(keywordInput)
    if (!keyword) return
    setKeywordRules((rules) => [...rules, { keyword, mode }])
  }

  function removeKeywordRule(index: number): void {
    setKeywordRules((rules) => rules.filter((_, i) => i !== index))
  }

  const filtered = useMemo(() => filterByKeywords(operations, keywordRules), [keywordRules])

  return (
    <div className="section">
      <h1>Einsätze</h1>
      <KeywordFilter
        rules={keywordRules}
        onAddRule={addKeywordRule}
        onRemoveRule={removeKeywordRule}
      />
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
      ) : (
        <DistributionTool operations={filtered} />
      )}
    </div>
  )
}
