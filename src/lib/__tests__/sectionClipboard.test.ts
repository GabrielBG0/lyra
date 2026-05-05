import { describe, it, expect } from "vitest";
import {
  serializeSection,
  parseSection,
  looksLikeSection,
} from "../sectionClipboard";
import type { Section } from "../types";

function makeSection(overrides: Partial<Section> = {}): Section {
  return {
    id: "id1",
    name: "Chorus",
    section_type: "chorus",
    order: 1,
    content: "Hello world\nSecond line",
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

describe("serializeSection", () => {
  it("produces the correct header format", () => {
    const out = serializeSection(makeSection());
    expect(out).toBe("--- chorus: Chorus ---\nHello world\nSecond line");
  });

  it("includes section_type and name in the header", () => {
    const out = serializeSection(
      makeSection({ section_type: "verse", name: "Verse 1" }),
    );
    expect(out.startsWith("--- verse: Verse 1 ---")).toBe(true);
  });

  it("handles empty content", () => {
    const out = serializeSection(makeSection({ content: "" }));
    expect(out).toBe("--- chorus: Chorus ---\n");
  });
});

describe("parseSection", () => {
  it("round-trips a serialized section", () => {
    const original = makeSection();
    const serialized = serializeSection(original);
    const parsed = parseSection(serialized);
    expect(parsed).not.toBeNull();
    expect(parsed!.name).toBe(original.name);
    expect(parsed!.section_type).toBe(original.section_type);
    expect(parsed!.content).toBe(original.content);
  });

  it("returns null for empty input", () => {
    expect(parseSection("")).toBeNull();
  });

  it("returns null when header is missing", () => {
    expect(parseSection("just some text\nno header")).toBeNull();
  });

  it("returns null when header format is wrong", () => {
    expect(parseSection("-- bad header --\ncontent")).toBeNull();
  });

  it("coerces unknown section_type to verse", () => {
    const parsed = parseSection("--- unknown-type: My Section ---\ncontent");
    expect(parsed!.section_type).toBe("verse");
  });

  it("accepts all valid section types", () => {
    const types = [
      "intro",
      "verse",
      "pre-chorus",
      "chorus",
      "bridge",
      "outro",
      "custom",
    ] as const;
    for (const t of types) {
      const parsed = parseSection(`--- ${t}: Name ---\ncontent`);
      expect(parsed!.section_type).toBe(t);
    }
  });

  it("normalizes section_type to lowercase", () => {
    const parsed = parseSection("--- CHORUS: Name ---\ncontent");
    expect(parsed!.section_type).toBe("chorus");
  });

  it("handles CRLF line endings", () => {
    const parsed = parseSection("--- verse: V1 ---\r\nline one\r\nline two");
    expect(parsed).not.toBeNull();
    expect(parsed!.content).toBe("line one\nline two");
  });

  it("trims leading/trailing whitespace from content", () => {
    const parsed = parseSection("--- verse: V1 ---\n\nsome content\n");
    expect(parsed!.content).toBe("some content");
  });

  it("preserves internal newlines in content", () => {
    const parsed = parseSection("--- verse: V1 ---\nline 1\nline 2\nline 3");
    expect(parsed!.content).toBe("line 1\nline 2\nline 3");
  });
});

describe("looksLikeSection", () => {
  it("returns true for text starting with ---", () => {
    expect(looksLikeSection("--- verse: Name ---\ncontent")).toBe(true);
  });

  it("returns false for plain text", () => {
    expect(looksLikeSection("just some lyrics")).toBe(false);
  });

  it("returns true even with leading whitespace before ---", () => {
    expect(looksLikeSection("  --- verse: Name ---\ncontent")).toBe(true);
  });

  it("returns false for empty string", () => {
    expect(looksLikeSection("")).toBe(false);
  });
});
