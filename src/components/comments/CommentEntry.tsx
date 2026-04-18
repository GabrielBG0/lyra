import type { Comment } from '../../lib/types'
import { Icons } from '../ui/Icon'

interface CommentEntryProps {
  comment: Comment
  onResolve: (id: string) => void
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  if (diff < 0 || Number.isNaN(diff)) return 'just now'
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return mins <= 1 ? 'just now' : `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return days === 1 ? 'yesterday' : `${days}d ago`
}

export default function CommentEntry({ comment, onResolve }: CommentEntryProps) {
  return (
    <div className="bg-elev rounded-lg px-3 py-2.5 mb-1.5">
      <div className="flex items-center gap-2 mb-1" style={{ fontSize: 11 }}>
        <span className="text-secondary font-medium">
          {comment.created_by ?? 'Me'}
        </span>
        <span className="text-faint">{timeAgo(comment.created_at)}</span>
        <div className="flex-1" />
        {!comment.resolved && (
          <button
            className="flex items-center gap-1 text-faint hover:text-accent transition-colors border-none bg-transparent cursor-pointer"
            style={{ fontSize: 11 }}
            onClick={() => onResolve(comment.id)}
          >
            <Icons.Check size={11} />
            Resolve
          </button>
        )}
      </div>
      <div className="text-primary leading-snug" style={{ fontSize: 12.5 }}>
        {comment.text}
      </div>
    </div>
  )
}
