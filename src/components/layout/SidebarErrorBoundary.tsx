import React from 'react'

export default class SidebarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <aside className="w-65 shrink-0 bg-panel border-r border-border-soft flex items-center justify-center">
          <p className="text-sm text-muted text-center px-4">Sidebar unavailable</p>
        </aside>
      )
    }
    return this.props.children
  }
}
