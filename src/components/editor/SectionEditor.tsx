import { useRef } from "react";
import type { Section, SectionType, SnapshotSection } from "../../lib/types";
import { useEditorStore } from "../../stores/editorStore";
import { useUIStore } from "../../stores/uiStore";
import SectionBlock from "./SectionBlock";
import AddSection from "./AddSection";
import LyraLogo from "../ui/LyraLogo";
import { tauriApi } from "../../lib/tauri";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Icons } from "../ui/Icon";

interface SectionEditorProps {
  lyricFont: string;
  readOnly?: boolean;
  previewSections?: SnapshotSection[] | null;
}

export default function SectionEditor({
  lyricFont,
  readOnly,
  previewSections,
}: SectionEditorProps) {
  const {
    sections,
    filePath,
    addSection,
    removeSection,
    reorderSections,
    splitSection,
  } = useEditorStore();
  const { zenMode } = useUIStore();
  const textareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());

  const focusSectionTextarea = (
    sectionId: string,
    atEnd: boolean,
    column?: number,
  ) => {
    const el = textareaRefs.current.get(sectionId);
    if (!el) return;
    el.focus();
    let pos: number;
    if (column !== undefined) {
      if (atEnd) {
        // Land on the last line of the target section at the given column
        const lastNl = el.value.lastIndexOf("\n");
        const lastLineStart = lastNl === -1 ? 0 : lastNl + 1;
        const lastLineLen = el.value.length - lastLineStart;
        pos = lastLineStart + Math.min(column, lastLineLen);
      } else {
        // Land on the first line of the target section at the given column
        const firstNl = el.value.indexOf("\n");
        const firstLineLen = firstNl === -1 ? el.value.length : firstNl;
        pos = Math.min(column, firstLineLen);
      }
    } else {
      pos = atEnd ? el.value.length : 0;
    }
    el.setSelectionRange(pos, pos);
  };

  const handleAdd = async (
    type: SectionType,
    name: string,
    afterIndex = sections.length - 1,
  ) => {
    if (!filePath) return;
    const order = afterIndex + 2;
    try {
      const section = await tauriApi.section.add(filePath, type, name, order);
      addSection(section, afterIndex + 1);
    } catch (error) {
      console.error("Failed to add section:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!filePath) return;
    try {
      await tauriApi.section.delete(filePath, id);
      removeSection(id);
    } catch (error) {
      console.error("Failed to delete section:", error);
    }
  };

  const handleTurnInto = async (
    sectionId: string,
    selStart: number,
    selEnd: number,
    newType: SectionType,
    newName: string,
  ) => {
    if (!filePath) return;
    const sectionIndex = sections.findIndex((s) => s.id === sectionId);
    if (sectionIndex === -1) return;
    const original = sections[sectionIndex];

    const beforeText = original.content.slice(0, selStart).replace(/\n+$/, "");
    const selectedText = original.content
      .slice(selStart, selEnd)
      .replace(/^\n+/, "")
      .replace(/\n+$/, "");
    const afterText = original.content.slice(selEnd).replace(/^\n+/, "");

    const parts: { type: SectionType; name: string; content: string }[] = [];
    if (beforeText)
      parts.push({
        type: original.section_type,
        name: original.name,
        content: beforeText,
      });
    parts.push({ type: newType, name: newName, content: selectedText });
    if (afterText)
      parts.push({
        type: original.section_type,
        name: original.name,
        content: afterText,
      });

    try {
      const newSections: Section[] = [];
      for (let i = 0; i < parts.length; i++) {
        const { type, name, content } = parts[i];
        const s = await tauriApi.section.add(
          filePath,
          type,
          name,
          sectionIndex + 1 + i,
        );
        newSections.push({ ...s, content });
      }
      await tauriApi.section.delete(filePath, sectionId);
      splitSection(original, sectionIndex, newSections);
      const orderedIds = useEditorStore.getState().sections.map((s) => s.id);
      await tauriApi.section.reorder(filePath, orderedIds);
    } catch (error) {
      console.error("Failed to split section:", error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !filePath) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(sections, oldIndex, newIndex);
    const orderedIds = reordered.map((s) => s.id);

    reorderSections(orderedIds);
    try {
      await tauriApi.section.reorder(filePath, orderedIds);
    } catch (error) {
      console.error("Failed to reorder sections:", error);
    }
  };

  // Preview / read-only mode
  if (readOnly) {
    if (!previewSections) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 py-20">
          <Icons.Loader size={20} className="animate-spin text-muted" />
        </div>
      );
    }
    if (previewSections.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <LyraLogo size={48} dim />
          <p className="text-muted text-sm">This take has no sections.</p>
        </div>
      );
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
              created_at: "",
              updated_at: "",
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
    );
  }

  if (sections.length === 0) {
    return (
      <div
        data-tour="section-editor"
        className="flex flex-col items-center justify-center flex-1 gap-4"
      >
        {!zenMode && <LyraLogo size={48} dim />}
        {!zenMode && (
          <p className="text-muted text-sm">This song has no sections yet.</p>
        )}
        <AddSection onAdd={(type, name) => handleAdd(type, name)} />
      </div>
    );
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={sections.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          data-tour="section-editor"
          className={
            zenMode
              ? "max-w-2xl w-full mx-auto px-8 py-12 pb-24"
              : "w-[85%] mx-auto px-14 py-3.5 pb-16"
          }
        >
          {sections.map((section, i) => (
            <SectionBlock
              key={section.id}
              section={section}
              isFirst={i === 0}
              lyricFont={lyricFont}
              commentCount={0}
              onInsertBefore={(type, name) => handleAdd(type, name, i - 1)}
              onDelete={handleDelete}
              onTurnInto={handleTurnInto}
              zenMode={zenMode}
              textareaRefCallback={(el) => {
                if (el) textareaRefs.current.set(section.id, el);
                else textareaRefs.current.delete(section.id);
              }}
              onNavigatePrev={
                i > 0
                  ? (column?: number) =>
                      focusSectionTextarea(sections[i - 1].id, true, column)
                  : undefined
              }
              onNavigateNext={
                i < sections.length - 1
                  ? (column?: number) =>
                      focusSectionTextarea(sections[i + 1].id, false, column)
                  : undefined
              }
            />
          ))}
          <AddSection onAdd={(type, name) => handleAdd(type, name)} />
        </div>
      </SortableContext>
    </DndContext>
  );
}
