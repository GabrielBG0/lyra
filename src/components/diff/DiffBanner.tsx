import { useEditorStore } from '../../stores/editorStore'
import { Icons } from '../ui/Icon'

export default function DiffBanner() {
  const { diffTargetA, diffTargetB, clearDiff } = useEditorStore()

  if (!diffTargetA || !diffTargetB) return null

  const labelA = diffTargetA === 'now' ? 'Working copy' : `Snapshot ${diffTargetA.slice(0, 8)}`
  const labelB = diffTargetB === 'now' ? 'Working copy' : `Snapshot ${diffTargetB.slice(0, 8)}`

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-accent-soft border-b border-accent text-sm text-primary">
      <span className="font-medium">Comparing</span>
      <span className="text-accent font-mono text-xs">{labelA}</span>
      <span className="text-muted">↔</span>
      <span className="text-accent font-mono text-xs">{labelB}</span>
      <div className="flex-1" />
      <button
        className="flex items-center gap-1 text-muted hover:text-primary text-xs cursor-pointer border-none bg-transparent"
        onClick={clearDiff}
      >
        <Icons.X size={12} />
        Exit diff
      </button>
    </div>
  )
}
