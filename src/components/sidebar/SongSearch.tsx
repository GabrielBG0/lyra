import { Icons } from '../ui/Icon'

interface SongSearchProps {
  value: string
  onChange: (value: string) => void
}

export default function SongSearch({ value, onChange }: SongSearchProps) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-bg border border-border-soft rounded-lg text-muted focus-within:border-accent focus-within:text-primary transition-colors">
      <Icons.Search size={13} />
      <input
        className="flex-1 bg-transparent border-none outline-none text-primary font-ui min-w-0"
        style={{ fontSize: 12.5 }}
        placeholder="Search songs…"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {value && (
        <button className="text-faint hover:text-muted flex p-0 border-none bg-transparent cursor-pointer" onClick={() => onChange('')}>
          <Icons.X size={11} />
        </button>
      )}
    </div>
  )
}
