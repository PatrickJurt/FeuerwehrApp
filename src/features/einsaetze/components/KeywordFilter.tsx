interface KeywordFilterProps {
  value: string
  onChange: (value: string) => void
}

export function KeywordFilter({ value, onChange }: KeywordFilterProps) {
  return (
    <label className="card field">
      <span className="field-label">
        Stichwörter (kommagetrennt, mindestens eines muss vorkommen)
      </span>
      <input
        type="search"
        value={value}
        placeholder="z. B. Brand, BMA"
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
