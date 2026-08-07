import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Sentry } from '../lib/sentry'

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
}

/** Fallback UI when a render error escapes; reports to Sentry when DSN is set. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    Sentry.captureException(error, {
      contexts: { react: { componentStack: info.componentStack } },
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
          <h1>Algo deu errado</h1>
          <p>Recarregue a página. Se o problema continuar, tente novamente em instantes.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Recarregar
          </button>
        </main>
      )
    }

    return this.props.children
  }
}
