import { useEditorStore } from '../../stores/editorStore'
import MetadataBar from '../editor/MetadataBar'
import SectionEditor from '../editor/SectionEditor'
import VersionTimeline from '../timeline/VersionTimeline'
import LyraLogo from '../ui/LyraLogo'
import { Icons } from '../ui/Icon'

interface EditorPanelProps {
  lyricFont: string
  onNewSong: () => void
}

export default function EditorPanel({ lyricFont, onNewSong }: EditorPanelProps) {
  const { metadata } = useEditorStore()

  if (!metadata) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3.5 bg-bg">
        <LyraLogo size={72} dim />
        <div className="text-base font-medium text-primary">No song selected</div>
        <div className="text-sm text-muted text-center max-w-[260px] leading-relaxed">
          Pick a song from the sidebar, or start a new one.
        </div>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-bg font-semibold text-sm rounded-md hover:brightness-110 transition-all cursor-pointer border-none"
          onClick={onNewSong}
        >
          <Icons.Plus size={13} />
          New song
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bg">
      <MetadataBar />
      <div className="flex-1 overflow-y-auto">
        <SectionEditor lyricFont={lyricFont} />
      </div>
      <VersionTimeline />
    </div>
  )
}
