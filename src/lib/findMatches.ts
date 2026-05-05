import type { Section } from "./types";
import type { FindMatch } from "./types";

function isWordChar(ch: string): boolean {
  return /\w/.test(ch);
}

export function computeMatches(
  query: string,
  caseSensitive: boolean,
  sections: Section[],
  wholeWord = false,
): FindMatch[] {
  if (!query) return [];

  const matches: FindMatch[] = [];
  const needle = caseSensitive ? query : query.toLowerCase();

  for (let si = 0; si < sections.length; si++) {
    const section = sections[si];
    const haystack = caseSensitive
      ? section.content
      : section.content.toLowerCase();
    let matchIndex = 0;
    let pos = 0;

    while (pos < haystack.length) {
      const found = haystack.indexOf(needle, pos);
      if (found === -1) break;

      const end = found + query.length;
      if (wholeWord) {
        const beforeOk = found === 0 || !isWordChar(haystack[found - 1]);
        const afterOk = end === haystack.length || !isWordChar(haystack[end]);
        if (!beforeOk || !afterOk) {
          pos = found + 1;
          continue;
        }
      }

      matches.push({
        sectionId: section.id,
        sectionIndex: si,
        matchIndex,
        start: found,
        end,
      });
      matchIndex++;
      pos = end;
    }
  }

  return matches;
}
