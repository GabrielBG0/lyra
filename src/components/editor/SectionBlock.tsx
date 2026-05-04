import { useEffect, useRef, useState } from 'react'
import type { Section, SectionType } from '../../lib/types'
import { useEditorStore } from '../../stores/editorStore'
import SectionHeader from './SectionHeader'
import CommentPanel from '../comments/CommentPanel'
import AddSection from './AddSection'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SectionBlockProps {
  section: Section
  isFirst: boolean
  lyricFont: string
  commentCount: number
  onInsertBefore: (type: SectionType, name: string) => void
  onDelete: (id: string) => void
  readOnly?: boolean
}

export default function SectionBlock({ section, isFirst, lyricFont, commentCount, onInsertBefore, onDelete, readOnly }: SectionBlockProps) {
  const { updateSection, setFocusedSection } = useEditorStore()
  const [commentsOpen, setCommentsOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    disabled: readOnly,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const resize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  useEffect(resize, [section.content])

  return (
    <div ref={setNodeRef} style={style} className="group relative" onFocus={() => setFocusedSection(section.id)}>
      {/* Divider with insert affordance */}
      {!isFirst && !readOnly && (
        <div className="group/divider relative h-7 flex items-center cursor-default">
          <div className="absolute inset-x-0 top-1/2 h-px bg-border-soft opacity-55 group-hover/divider:bg-accent group-hover/divider:opacity-35 transition-all" />
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 opacity-0 group-hover/divider:opacity-100 transition-opacity">
            <AddSection onAdd={onInsertBefore} inline />
          </div>
        </div>
      )}
      {!isFirst && readOnly && (
        <div className="h-7 flex items-center">
          <div className="absolute inset-x-0 top-1/2 h-px bg-border-soft opacity-30" />
        </div>
      )}

      {/* Section header */}
      <SectionHeader
        sectionType={section.section_type}
        name={section.name}
        commentCount={commentCount}
        commentsOpen={commentsOpen}
        onToggleComments={() => setCommentsOpen(o => !o)}
        onDelete={() => onDelete(section.id)}
        readOnly={readOnly}
        dragListeners={listeners}
        dragAttributes={attributes}
      />

      {/* Lyric textarea */}
      <div className="pb-2">
        <textarea
          ref={textareaRef}
          className="lyric-textarea"
          style={{ fontFamily: lyricFont }}
          value={section.content}
          onChange={e => {
            if (readOnly) return
            updateSection(section.id, e.target.value)
            resize()
          }}
          onInput={resize}
          spellCheck={false}
          placeholder={readOnly ? '' : `Write ${section.name.toLowerCase()}…`}
          disabled={readOnly}
        />
      </div>

      {/* Comments panel */}
      {commentsOpen && <CommentPanel sectionId={section.id} />}
    </div>
  )
}
