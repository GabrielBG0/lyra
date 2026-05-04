import type { Section, SectionType } from './types'

const VALID_TYPES = new Set<SectionType>([
  'intro', 'verse', 'pre-chorus', 'chorus', 'bridge', 'outro', 'custom',
])

const HEADER_RE = /^---\s+(\S+):\s+(.+?)\s+---$/

export function serializeSection(section: Section): string {
  return `--- ${section.section_type}: ${section.name} ---\n${section.content}`
}

export function looksLikeSection(text: string): boolean {
  return text.trimStart().startsWith('--- ')
}

export function parseSection(text: string): Pick<Section, 'name' | 'section_type' | 'content'> | null {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const headerLine = lines[0]?.trim()
  if (!headerLine) return null

  const match = HEADER_RE.exec(headerLine)
  if (!match) return null

  const rawType = match[1].toLowerCase() as SectionType
  const section_type: SectionType = VALID_TYPES.has(rawType) ? rawType : 'verse'
  const name = match[2]
  const content = lines.slice(1).join('\n').trim()

  return { name, section_type, content }
}
