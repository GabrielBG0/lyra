import type { SectionType, SnapshotSection } from "../../lib/types";
import { useEditorStore } from "../../stores/editorStore";
import SectionBlock from "./SectionBlock";
import AddSection from "./AddSection";
import LyraLogo from "../ui/LyraLogo";
import { tauriApi } from "../../lib/tauri";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { Icons } from "../ui/Icon";

interface SectionEditorProps {
  lyricFont: string;
  readOnly?: boolean;
  previewSections?: SnapshotSection[] | null;
}

export default function SectionEditor({ lyricFont, readOnly, previewSections }: SectionEditorProps) {
  const { sections, filePath, addSection, removeSection, reorderSections } = useEditorStore();

  const handleAdd = async (type: SectionType, name: string, afterIndex = sections.length - 1) => {
    if (!filePath) return
    const order = afterIndex + 2
    try {
      const section = await tauriApi.section.add(filePath, type, name, order)
      addSection(section, afterIndex + 1)
    } catch (error) {
      console.error('Failed to add section:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!filePath) return;
    try {
      await tauriApi.section.delete(filePath, id);
      removeSection(id);
    } catch (error) {
      console.error("Failed to delete section:", error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !filePath) return

    const oldIndex = sections.findIndex(s => s.id === active.id)
    const newIndex = sections.findIndex(s => s.id === over.id)
    const reordered = arrayMove(sections, oldIndex, newIndex)
    const orderedIds = reordered.map(s => s.id)

    reorderSections(orderedIds)
    try {
      await tauriApi.section.reorder(filePath, orderedIds)
    } catch (error) {
      console.error("Failed to reorder sections:", error)
    }
  }

  // Preview / read-only mode
  if (readOnly) {
    if (!previewSections) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 py-20">
          <Icons.Loader size={20} className="animate-spin text-muted" />
        </div>
      )
    }
    if (previewSections.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <LyraLogo size={48} dim />
          <p className="text-muted text-sm">This take has no sections.</p>
        </div>
      )
    }
    return (
      <div className="w-[85%] mx-auto px-14 py-3.5 pb-16">
        {previewSections.map((section, i) => (
          <SectionBlock
            key={section.section_id}
            section={{
              id: section.section_id,
              name: section.name,
              section_type: section.section_type,
              order: section.order,
              content: section.content,
              created_at: '',
              updated_at: '',
            }}
            isFirst={i === 0}
            lyricFont={lyricFont}
            commentCount={0}
            onInsertBefore={() => {}}
            onDelete={() => {}}
            readOnly
          />
        ))}
      </div>
    )
  }

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4">
        <LyraLogo size={48} dim />
        <p className="text-muted text-sm">This song has no sections yet.</p>
        <AddSection onAdd={(type, name) => handleAdd(type, name)} />
      </div>
    );
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
        <div className="w-[85%] mx-auto px-14 py-3.5 pb-16">
          {sections.map((section, i) => (
            <SectionBlock
              key={section.id}
              section={section}
              isFirst={i === 0}
              lyricFont={lyricFont}
              commentCount={0}
              onInsertBefore={(type, name) => handleAdd(type, name, i - 1)}
              onDelete={handleDelete}
            />
          ))}
          <AddSection onAdd={(type, name) => handleAdd(type, name)} />
        </div>
      </SortableContext>
    </DndContext>
  );
}
