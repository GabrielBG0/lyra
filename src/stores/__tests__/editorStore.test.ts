import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useEditorStore } from "../editorStore";
import { useUIStore } from "../uiStore";
import type { Section, SongPayload, SongMetadata } from "../../lib/types";
import type { EditorCommand } from "../../lib/commands";

// ── helpers ──────────────────────────────────────────────────────────────────

function makeSection(id: string, content = "lyrics", order = 1): Section {
  return {
    id,
    name: id,
    section_type: "verse",
    order,
    content,
    created_at: "",
    updated_at: "",
  };
}

function makeMetadata(overrides: Partial<SongMetadata> = {}): SongMetadata {
  return {
    id: "meta1",
    title: "Test Song",
    status: "draft",
    created_at: "",
    updated_at: "",
    musical: { key: null, bpm: null, capo: null, tuning: null },
    tags: { genre: [], mood: [], language: [] },
    album: { album_id: null, track_number: null },
    ...overrides,
  };
}

function makePayload(
  sections: Section[] = [],
  overrides: Partial<SongPayload> = {},
): SongPayload {
  return {
    file_path: "/vault/test.lyr",
    metadata: makeMetadata(),
    sections,
    snapshot_headers: [],
    ...overrides,
  };
}

function makeCmd(
  overrides: Partial<{ applied: number; undone: number }> = {},
): EditorCommand & { applied: number; undone: number } {
  const cmd = {
    description: "test cmd",
    applied: 0,
    undone: 0,
    apply() {
      cmd.applied++;
    },
    undo() {
      cmd.undone++;
    },
    ...overrides,
  };
  return cmd;
}

// ── state reset ───────────────────────────────────────────────────────────────

const editorInitial = useEditorStore.getState();
const uiInitial = useUIStore.getState();

beforeEach(() => {
  useEditorStore.setState(editorInitial, true);
  useUIStore.setState(uiInitial, true);
});

afterEach(() => {
  vi.useRealTimers();
});

// ── loadSong / closeSong ──────────────────────────────────────────────────────

describe("loadSong", () => {
  it("populates filePath, metadata, and sections", () => {
    const payload = makePayload([makeSection("s1")]);
    useEditorStore.getState().loadSong(payload);
    const s = useEditorStore.getState();
    expect(s.filePath).toBe("/vault/test.lyr");
    expect(s.metadata?.title).toBe("Test Song");
    expect(s.sections).toHaveLength(1);
  });

  it("resets dirty flag and history", () => {
    useEditorStore.getState().loadSong(makePayload([makeSection("s1")]));
    useEditorStore.getState().updateSection("s1", "new lyrics");
    useEditorStore.getState().loadSong(makePayload());
    const s = useEditorStore.getState();
    expect(s.isDirty).toBe(false);
    expect(s.past).toHaveLength(0);
    expect(s.future).toHaveLength(0);
  });

  it("closes the find panel via uiStore", () => {
    useUIStore.getState().openFindPanel();
    expect(useUIStore.getState().findPanelOpen).toBe(true);
    useEditorStore.getState().loadSong(makePayload());
    expect(useUIStore.getState().findPanelOpen).toBe(false);
  });
});

describe("closeSong", () => {
  it("nullifies filePath and metadata", () => {
    useEditorStore.getState().loadSong(makePayload([makeSection("s1")]));
    useEditorStore.getState().closeSong();
    const s = useEditorStore.getState();
    expect(s.filePath).toBeNull();
    expect(s.metadata).toBeNull();
    expect(s.sections).toHaveLength(0);
  });
});

// ── undo / redo ───────────────────────────────────────────────────────────────

describe("execute / undo / redo", () => {
  it("execute calls apply and adds to past", () => {
    const cmd = makeCmd();
    useEditorStore.getState().execute(cmd);
    expect(cmd.applied).toBe(1);
    expect(useEditorStore.getState().past).toHaveLength(1);
  });

  it("execute clears future", () => {
    const a = makeCmd();
    const b = makeCmd();
    useEditorStore.getState().execute(a);
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().future).toHaveLength(1);
    useEditorStore.getState().execute(b);
    expect(useEditorStore.getState().future).toHaveLength(0);
  });

  it("undo calls undo() and moves cmd to future", () => {
    const cmd = makeCmd();
    useEditorStore.getState().execute(cmd);
    useEditorStore.getState().undo();
    expect(cmd.undone).toBe(1);
    expect(useEditorStore.getState().past).toHaveLength(0);
    expect(useEditorStore.getState().future).toHaveLength(1);
  });

  it("undo is a no-op when past is empty", () => {
    expect(() => useEditorStore.getState().undo()).not.toThrow();
    expect(useEditorStore.getState().past).toHaveLength(0);
  });

  it("redo calls apply() and moves cmd back to past", () => {
    const cmd = makeCmd();
    useEditorStore.getState().execute(cmd);
    useEditorStore.getState().undo();
    useEditorStore.getState().redo();
    expect(cmd.applied).toBe(2);
    expect(useEditorStore.getState().past).toHaveLength(1);
    expect(useEditorStore.getState().future).toHaveLength(0);
  });

  it("redo is a no-op when future is empty", () => {
    expect(() => useEditorStore.getState().redo()).not.toThrow();
  });

  it("caps history at MAX_HISTORY (100)", () => {
    for (let i = 0; i < 110; i++) {
      useEditorStore.getState().execute(makeCmd());
    }
    expect(useEditorStore.getState().past.length).toBeLessThanOrEqual(100);
  });
});

// ── updateSection (with command merging) ──────────────────────────────────────

describe("updateSection", () => {
  beforeEach(() => {
    useEditorStore
      .getState()
      .loadSong(makePayload([makeSection("s1", "original")]));
  });

  it("updates the section content", () => {
    useEditorStore.getState().updateSection("s1", "changed");
    const s = useEditorStore.getState();
    expect(s.sections[0].content).toBe("changed");
    expect(s.isDirty).toBe(true);
  });

  it("merges rapid edits to same section into one history entry", () => {
    vi.useFakeTimers();
    useEditorStore.getState().updateSection("s1", "change 1");
    vi.advanceTimersByTime(500);
    useEditorStore.getState().updateSection("s1", "change 2");
    expect(useEditorStore.getState().past).toHaveLength(1);
  });

  it("does not merge edits beyond 2000ms", () => {
    vi.useFakeTimers();
    useEditorStore.getState().updateSection("s1", "change 1");
    vi.advanceTimersByTime(2001);
    useEditorStore.getState().updateSection("s1", "change 2");
    expect(useEditorStore.getState().past).toHaveLength(2);
  });

  it("does not merge edits to different sections", () => {
    useEditorStore
      .getState()
      .loadSong(makePayload([makeSection("s1", "a"), makeSection("s2", "b")]));
    vi.useFakeTimers();
    useEditorStore.getState().updateSection("s1", "change 1");
    vi.advanceTimersByTime(500);
    useEditorStore.getState().updateSection("s2", "change 2");
    expect(useEditorStore.getState().past).toHaveLength(2);
  });

  it("undo restores original content", () => {
    useEditorStore.getState().updateSection("s1", "changed");
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().sections[0].content).toBe("original");
  });

  it("is a no-op for an unknown section id", () => {
    useEditorStore.getState().updateSection("nonexistent", "x");
    expect(useEditorStore.getState().past).toHaveLength(0);
  });
});

// ── addSection / removeSection ────────────────────────────────────────────────

describe("addSection", () => {
  it("appends section when no insertAt given", () => {
    useEditorStore.getState().loadSong(makePayload([makeSection("s1")]));
    useEditorStore.getState().addSection(makeSection("s2"));
    expect(useEditorStore.getState().sections[1].id).toBe("s2");
  });

  it("inserts at specified index", () => {
    useEditorStore
      .getState()
      .loadSong(makePayload([makeSection("s1"), makeSection("s3")]));
    useEditorStore.getState().addSection(makeSection("s2"), 1);
    expect(useEditorStore.getState().sections[1].id).toBe("s2");
  });

  it("can be undone", () => {
    useEditorStore.getState().loadSong(makePayload([makeSection("s1")]));
    useEditorStore.getState().addSection(makeSection("s2"));
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().sections).toHaveLength(1);
  });
});

describe("removeSection", () => {
  it("removes the section", () => {
    useEditorStore
      .getState()
      .loadSong(makePayload([makeSection("s1"), makeSection("s2")]));
    useEditorStore.getState().removeSection("s1");
    expect(useEditorStore.getState().sections.map((s) => s.id)).toEqual(["s2"]);
  });

  it("clears focusedSectionId when the focused section is removed", () => {
    useEditorStore.getState().loadSong(makePayload([makeSection("s1")]));
    useEditorStore.getState().setFocusedSection("s1");
    useEditorStore.getState().removeSection("s1");
    expect(useEditorStore.getState().focusedSectionId).toBeNull();
  });

  it("can be undone, restoring original position", () => {
    useEditorStore
      .getState()
      .loadSong(makePayload([makeSection("s1"), makeSection("s2")]));
    useEditorStore.getState().removeSection("s1");
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().sections[0].id).toBe("s1");
  });

  it("is a no-op for an unknown section id", () => {
    useEditorStore.getState().loadSong(makePayload([makeSection("s1")]));
    useEditorStore.getState().removeSection("nonexistent");
    expect(useEditorStore.getState().sections).toHaveLength(1);
    expect(useEditorStore.getState().past).toHaveLength(0);
  });
});

// ── find / replace ────────────────────────────────────────────────────────────

describe("find navigation", () => {
  beforeEach(() => {
    useEditorStore
      .getState()
      .loadSong(
        makePayload([
          makeSection("s1", "the cat sat on the mat"),
          makeSection("s2", "a cat in a hat"),
        ]),
      );
    useEditorStore.getState().setFindQuery("cat", false);
  });

  it("setFindQuery populates findMatches", () => {
    expect(useEditorStore.getState().findMatches).toHaveLength(2);
  });

  it("findNext advances the active index", () => {
    useEditorStore.getState().findNext();
    expect(useEditorStore.getState().findActiveIndex).toBe(1);
  });

  it("findNext wraps around to 0 from the last match", () => {
    useEditorStore.getState().findNext(); // → 1
    useEditorStore.getState().findNext(); // → wraps to 0
    expect(useEditorStore.getState().findActiveIndex).toBe(0);
  });

  it("findPrev wraps around from 0 to the last match", () => {
    useEditorStore.getState().findPrev();
    expect(useEditorStore.getState().findActiveIndex).toBe(1);
  });

  it("findNext is a no-op when there are no matches", () => {
    useEditorStore.getState().setFindQuery("zzz", false);
    useEditorStore.getState().findNext();
    expect(useEditorStore.getState().findActiveIndex).toBe(0);
  });

  it("clearFind resets query, matches, and index", () => {
    useEditorStore.getState().clearFind();
    const s = useEditorStore.getState();
    expect(s.findQuery).toBe("");
    expect(s.findMatches).toHaveLength(0);
    expect(s.findActiveIndex).toBe(0);
  });
});

describe("setFindCaseSensitive", () => {
  it("recomputes matches with the new case sensitivity", () => {
    useEditorStore
      .getState()
      .loadSong(makePayload([makeSection("s1", "Cat CAT cat")]));
    useEditorStore.getState().setFindQuery("cat", false);
    expect(useEditorStore.getState().findMatches).toHaveLength(3);
    useEditorStore.getState().setFindCaseSensitive(true);
    expect(useEditorStore.getState().findMatches).toHaveLength(1);
  });
});

describe("setFindWholeWord", () => {
  it("recomputes matches with whole-word constraint", () => {
    useEditorStore
      .getState()
      .loadSong(makePayload([makeSection("s1", "cat catfish the cat")]));
    useEditorStore.getState().setFindQuery("cat", false);
    expect(useEditorStore.getState().findMatches).toHaveLength(3);
    useEditorStore.getState().setFindWholeWord(true);
    expect(useEditorStore.getState().findMatches).toHaveLength(2);
  });
});

describe("replaceCurrent", () => {
  it("replaces the currently active match", () => {
    useEditorStore
      .getState()
      .loadSong(makePayload([makeSection("s1", "the cat sat")]));
    useEditorStore.getState().setFindQuery("cat", false);
    useEditorStore.getState().replaceCurrent("dog");
    expect(useEditorStore.getState().sections[0].content).toBe("the dog sat");
  });

  it("is a no-op when there are no matches", () => {
    useEditorStore
      .getState()
      .loadSong(makePayload([makeSection("s1", "hello")]));
    useEditorStore.getState().setFindQuery("zzz", false);
    useEditorStore.getState().replaceCurrent("x");
    expect(useEditorStore.getState().sections[0].content).toBe("hello");
  });

  it("clamps activeIndex when match count shrinks after replace", () => {
    useEditorStore
      .getState()
      .loadSong(makePayload([makeSection("s1", "cat cat")]));
    useEditorStore.getState().setFindQuery("cat", false);
    useEditorStore.getState().findNext(); // index → 1
    useEditorStore.getState().replaceCurrent("dog"); // replaces second match, now only 1 match
    expect(useEditorStore.getState().findActiveIndex).toBe(0);
  });
});

describe("replaceAll", () => {
  it("replaces every match across all sections", () => {
    useEditorStore
      .getState()
      .loadSong(
        makePayload([
          makeSection("s1", "the cat sat"),
          makeSection("s2", "a fat cat"),
        ]),
      );
    useEditorStore.getState().setFindQuery("cat", false);
    useEditorStore.getState().replaceAll("dog");
    const sections = useEditorStore.getState().sections;
    expect(sections[0].content).toBe("the dog sat");
    expect(sections[1].content).toBe("a fat dog");
  });

  it("handles multiple matches within the same section correctly", () => {
    useEditorStore
      .getState()
      .loadSong(makePayload([makeSection("s1", "cat cat cat")]));
    useEditorStore.getState().setFindQuery("cat", false);
    useEditorStore.getState().replaceAll("x");
    expect(useEditorStore.getState().sections[0].content).toBe("x x x");
  });

  it("is a no-op when there are no matches", () => {
    useEditorStore
      .getState()
      .loadSong(makePayload([makeSection("s1", "hello")]));
    useEditorStore.getState().setFindQuery("zzz", false);
    useEditorStore.getState().replaceAll("x");
    expect(useEditorStore.getState().sections[0].content).toBe("hello");
  });

  it("can be undone", () => {
    useEditorStore
      .getState()
      .loadSong(makePayload([makeSection("s1", "cat cat")]));
    useEditorStore.getState().setFindQuery("cat", false);
    useEditorStore.getState().replaceAll("dog");
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().sections[0].content).toBe("cat cat");
  });
});

// ── diff / preview ────────────────────────────────────────────────────────────

describe("diff state", () => {
  it("setDiff stores result and targets", () => {
    useEditorStore.getState().setDiff([], "snap-a", "snap-b");
    const s = useEditorStore.getState();
    expect(s.diffResult).toEqual([]);
    expect(s.diffTargetA).toBe("snap-a");
    expect(s.diffTargetB).toBe("snap-b");
  });

  it("clearDiff nullifies all diff state", () => {
    useEditorStore.getState().setDiff([], "a", "b");
    useEditorStore.getState().clearDiff();
    const s = useEditorStore.getState();
    expect(s.diffResult).toBeNull();
    expect(s.diffTargetA).toBeNull();
    expect(s.diffTargetB).toBeNull();
  });
});

describe("snapshot preview", () => {
  it("enterPreview sets previewSnapshotId", () => {
    useEditorStore.getState().enterPreview("snap-1");
    expect(useEditorStore.getState().previewSnapshotId).toBe("snap-1");
  });

  it("exitPreview clears previewSnapshotId", () => {
    useEditorStore.getState().enterPreview("snap-1");
    useEditorStore.getState().exitPreview();
    expect(useEditorStore.getState().previewSnapshotId).toBeNull();
  });
});
