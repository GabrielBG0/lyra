import React from 'react'

export default class EditorErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      const err = this.state.error as Error
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
          <p className="text-base text-primary font-medium">Something went wrong in the editor.</p>
          <p className="text-sm text-muted font-mono">{err.message}</p>
          <button
            className="px-3 py-1.5 bg-elev border border-border-soft rounded text-sm text-secondary hover:text-primary cursor-pointer"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
