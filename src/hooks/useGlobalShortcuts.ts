import { useEffect } from "react";
import { useEditorStore } from "../stores/editorStore";
import {
  serializeSection,
  looksLikeSection,
  parseSection,
} from "../lib/sectionClipboard";
import { generateUlid } from "../lib/ulid";
import type { Section } from "../lib/types";

export function useGlobalShortcuts() {
  useEffect(() => {
    async function handleCopy() {
      const { sections, focusedSectionId } = useEditorStore.getState();
      if (!focusedSectionId) return;
      const section = sections.find((s) => s.id === focusedSectionId);
      if (!section) return;
      try {
        await navigator.clipboard.writeText(serializeSection(section));
      } catch {
        console.warn("[clipboard] writeText failed");
      }
    }

    async function handleCut() {
      const { sections, focusedSectionId, removeSection } =
        useEditorStore.getState();
      if (!focusedSectionId) return;
      const section = sections.find((s) => s.id === focusedSectionId);
      if (!section) return;
      try {
        await navigator.clipboard.writeText(serializeSection(section));
      } catch {
        console.warn("[clipboard] writeText failed");
      }
      removeSection(focusedSectionId);
    }

    async function handlePaste() {
      let text: string;
      try {
        text = await navigator.clipboard.readText();
      } catch {
        console.warn("[clipboard] readText failed");
        return;
      }

      if (!looksLikeSection(text)) return;

      const parsed = parseSection(text);
      if (!parsed) return;

      const { sections, focusedSectionId, addSection } =
        useEditorStore.getState();
      const focusedIdx = focusedSectionId
        ? sections.findIndex((s) => s.id === focusedSectionId)
        : -1;
      const insertAt = focusedIdx >= 0 ? focusedIdx + 1 : sections.length;

      const now = new Date().toISOString();
      const newSection: Section = {
        id: generateUlid(),
        name: parsed.name,
        section_type: parsed.section_type,
        order: insertAt + 1,
        content: parsed.content,
        created_at: now,
        updated_at: now,
      };

      addSection(newSection, insertAt);
    }

    async function handleKeydown(e: KeyboardEvent) {
      const isMac = navigator.platform.startsWith("Mac");
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      if (!modifier) return;

      const tag = (document.activeElement as HTMLElement)?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA";

      switch (e.key.toLowerCase()) {
        case "z": {
          e.preventDefault();
          const { undo, redo } = useEditorStore.getState();
          if (e.shiftKey) redo();
          else undo();
          break;
        }
        case "c": {
          if (isTyping) return;
          e.preventDefault();
          await handleCopy();
          break;
        }
        case "x": {
          if (isTyping) return;
          e.preventDefault();
          await handleCut();
          break;
        }
        case "v": {
          if (isTyping) return;
          e.preventDefault();
          await handlePaste();
          break;
        }
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);
}
