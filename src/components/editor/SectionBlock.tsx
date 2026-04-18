import { useEffect, useRef, useState } from 'react'
import type { Section, SectionType } from '../../lib/types'
import { useEditorStore } from '../../stores/editorStore'
import SectionHeader from './SectionHeader'
import CommentPanel from '../comments/CommentPanel'
import AddSection from './AddSection'

interface SectionBlockProps {
  section: Section
  isFirst: boolean
  lyricFont: string
  commentCount: number
  onInsertBefore: (type: SectionType, name: string) => void
  onDelete: (id: string) => void
}

export default function SectionBlock({ section, isFirst, lyricFont, commentCount, onInsertBefore, onDelete }: SectionBlockProps) {
  const { updateSection } = useEditorStore()
  const [commentsOpen, setCommentsOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const resize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  useEffect(resize, [section.content])

  return (
    <div className="group relative">
      {/* Divider with insert affordance */}
      {!isFirst && (
        <div className="group/divider relative h-7 flex items-center cursor-default">
          <div className="absolute inset-x-0 top-1/2 h-px bg-border-soft opacity-55 group-hover/divider:bg-accent group-hover/divider:opacity-35 transition-all" />
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 opacity-0 group-hover/divider:opacity-100 transition-opacity">
            <AddSection onAdd={onInsertBefore} inline />
          </div>
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
      />

      {/* Lyric textarea */}
      <div className="pb-2">
        <textarea
          ref={textareaRef}
          className="lyric-textarea"
          style={{ fontFamily: lyricFont }}
          value={section.content}
          onChange={e => {
            updateSection(section.id, e.target.value)
            resize()
          }}
          onInput={resize}
          spellCheck={false}
          placeholder={`Write ${section.name.toLowerCase()}…`}
        />
      </div>

      {/* Comments panel */}
      {commentsOpen && <CommentPanel sectionId={section.id} />}
    </div>
  )
}
