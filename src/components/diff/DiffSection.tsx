import type { SectionDiff } from '../../lib/types'
import DiffHunk from './DiffHunk'

interface DiffSectionProps {
  diff: SectionDiff
}

export default function DiffSection({ diff }: DiffSectionProps) {
  return (
    <div className="mb-6">
      <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-muted mb-2 font-ui">
        {diff.name}
      </div>
      <pre className="font-lyrics text-primary leading-[1.85] whitespace-pre-wrap text-base">
        {diff.hunks.map((h, i) => <DiffHunk key={i} hunk={h} />)}
      </pre>
    </div>
  )
}
