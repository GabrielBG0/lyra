export interface EditorCommand {
  readonly description: string
  apply(): void
  undo(): void
}

export interface HistoryState {
  past: EditorCommand[]
  future: EditorCommand[]
}
