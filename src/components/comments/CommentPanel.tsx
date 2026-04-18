import { useEffect, useState } from 'react'
import type { Comment } from '../../lib/types'
import { tauriApi } from '../../lib/tauri'
import { useEditorStore } from '../../stores/editorStore'
import CommentEntry from './CommentEntry'

interface CommentPanelProps {
  sectionId: string
}

export default function CommentPanel({ sectionId }: CommentPanelProps) {
  const { filePath } = useEditorStore()
  const [comments, setComments] = useState<Comment[]>([])
  const [newText, setNewText] = useState('')
  const [pinToSnapshot, setPinToSnapshot] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!filePath) return
    setLoading(true)
    tauriApi.comment.list(filePath, sectionId)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoading(false))
  }, [filePath, sectionId])

  const handleResolve = async (commentId: string) => {
    if (!filePath) return
    await tauriApi.comment.resolve(filePath, commentId)
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, resolved: true } : c))
  }

  const handlePost = async () => {
    if (!filePath || !newText.trim()) return
    const comment = await tauriApi.comment.add(filePath, sectionId, null, newText.trim())
    setComments(prev => [...prev, comment])
    setNewText('')
  }

  const open = comments.filter(c => !c.resolved)
  const resolved = comments.filter(c => c.resolved)

  return (
    <div className="border-t border-border-soft bg-bg/60 px-4 py-3">
      <div className="flex justify-between items-center mb-2.5 text-faint" style={{ fontSize: 11 }}>
        <span>{open.length} open · {resolved.length} resolved</span>
        {resolved.length > 0 && (
          <button className="text-faint hover:text-accent border-none bg-transparent cursor-pointer" style={{ fontSize: 11 }}>
            Show resolved
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-faint text-xs py-2">Loading…</div>
      ) : (
        <>
          {open.map(c => (
            <CommentEntry key={c.id} comment={c} onResolve={handleResolve} />
          ))}
          {open.length === 0 && !loading && (
            <div className="text-faint text-xs py-2 text-center">No open comments</div>
          )}
        </>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 mt-2.5 px-2.5 py-2 bg-bg border border-border-soft rounded-lg">
        <input
          className="flex-1 bg-transparent border-none outline-none text-primary font-ui"
          style={{ fontSize: 12.5 }}
          placeholder="Write a comment on this section…"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handlePost() }}
        />
        <label className="flex items-center gap-1 text-faint cursor-pointer select-none" style={{ fontSize: 10.5 }}>
          <input
            type="checkbox"
            className="m-0"
            checked={pinToSnapshot}
            onChange={e => setPinToSnapshot(e.target.checked)}
          />
          pin to snapshot
        </label>
        <button
          className="px-2 py-1 bg-accent text-bg rounded text-xs font-semibold disabled:opacity-40 cursor-pointer border-none"
          disabled={!newText.trim()}
          onClick={handlePost}
        >
          Post
        </button>
      </div>
    </div>
  )
}
