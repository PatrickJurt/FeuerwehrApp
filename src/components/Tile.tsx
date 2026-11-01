interface TileProps {
  icon: string
  title: string
  description: string
  onClick: () => void
}

export function Tile({ icon, title, description, onClick }: TileProps) {
  return (
    <button type="button" className="tile" onClick={onClick}>
      <span className="tile-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="tile-title">{title}</span>
      <span className="tile-description">{description}</span>
    </button>
  )
}
