import { Tile } from './Tile.tsx'
import type { Section } from '../sections.ts'

interface HomeProps {
  sections: Section[]
  onSelect: (id: string) => void
}

export function Home({ sections, onSelect }: HomeProps) {
  return (
    <div className="tiles">
      {sections.map((section) => (
        <Tile
          key={section.id}
          icon={section.icon}
          title={section.title}
          description={section.description}
          onClick={() => onSelect(section.id)}
        />
      ))}
    </div>
  )
}
