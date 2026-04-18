import type { SectionType } from "../../lib/types";
import { useEditorStore } from "../../stores/editorStore";
import SectionBlock from "./SectionBlock";
import AddSection from "./AddSection";
import LyraLogo from "../ui/LyraLogo";
import { tauriApi } from "../../lib/tauri";

interface SectionEditorProps {
  lyricFont: string;
}

export default function SectionEditor({ lyricFont }: SectionEditorProps) {
  const { sections, filePath, addSection, removeSection } = useEditorStore();

  const handleAdd = async (type: SectionType, name: string, afterIndex = sections.length - 1) => {
    if (!filePath) return
    const order = afterIndex + 2
    try {
      const section = await tauriApi.section.add(filePath, type, name, order)
      addSection(section)
    } catch (error) {
      console.error('Failed to add section:', error)
      // Consider showing a toast notification to the user
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
    <div className="max-w-190 mx-auto px-14 py-3.5 pb-16">
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
  );
}
