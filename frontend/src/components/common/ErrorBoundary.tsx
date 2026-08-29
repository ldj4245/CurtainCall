import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#e11d48', fontSize: '24px', fontWeight: 'bold' }}>⚠️ 화면 렌더링 오류가 발생했습니다</h1>
          <p style={{ color: '#4b5563', marginTop: '10px' }}>아래 에러 내용을 확인해 주세요:</p>
          <pre
            style={{
              background: '#f3f4f6',
              padding: '20px',
              borderRadius: '12px',
              color: '#dc2626',
              fontSize: '14px',
              overflowX: 'auto',
              marginTop: '16px',
              whiteSpace: 'pre-wrap',
            }}
          >
            {this.state.error?.toString()}
            {'\n\n'}
            {this.state.errorInfo?.componentStack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#e11d48',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            페이지 새로고침
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
