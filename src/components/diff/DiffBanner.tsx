import { useEditorStore } from '../../stores/editorStore'
import { useSnapshot } from '../../hooks/useSnapshot'
import { Icons } from '../ui/Icon'

export default function DiffBanner() {
  const { diffTargetA, diffTargetB, loadedSnapshots, clearDiff } = useEditorStore()
  const { restoreSnapshot } = useSnapshot()

  if (!diffTargetA || !diffTargetB) return null

  const snapA = diffTargetA !== 'now' ? loadedSnapshots[diffTargetA] : null
  const snapB = diffTargetB !== 'now' ? loadedSnapshots[diffTargetB] : null
  const labelA = diffTargetA === 'now' ? 'Working copy' : (snapA?.note ?? `Take ${diffTargetA.slice(0, 8)}`)
  const labelB = diffTargetB === 'now' ? 'Working copy' : (snapB?.note ?? `Take ${diffTargetB.slice(0, 8)}`)

  const handleRestoreB = async () => {
    if (diffTargetB === 'now') return
    await restoreSnapshot(diffTargetB)
    clearDiff()
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-accent-soft border-b border-accent text-sm text-primary">
      <span className="font-medium">Comparing</span>
      <span className="text-accent font-mono text-xs">{labelA}</span>
      <span className="text-muted">↔</span>
      <span className="text-accent font-mono text-xs">{labelB}</span>
      <div className="flex-1" />
      {diffTargetB !== 'now' && (
        <button
          className="flex items-center gap-1 px-2.5 py-1 bg-elev border border-border-soft rounded text-secondary hover:bg-panel text-xs cursor-pointer"
          onClick={handleRestoreB}
        >
          Restore this take
        </button>
      )}
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
