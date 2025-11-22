import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./App.css";
import "./styles.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #0b0d13 0%, #0a0c12 100%)',
          color: '#ffffff',
          padding: '20px',
          textAlign: 'center',
          zIndex: 1000
        }}>
          <h2 style={{ 
            color: '#ff4d4f',
            fontSize: '2rem',
            marginBottom: '1rem'
          }}>Something went wrong</h2>
          
          <div style={{
            background: 'rgba(255, 77, 79, 0.1)',
            padding: '15px',
            borderRadius: '8px',
            margin: '20px 0',
            maxWidth: '600px',
            width: '90%',
            wordBreak: 'break-word',
            textAlign: 'left',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            <p><strong>Error:</strong> {this.state.error?.toString() || 'Unknown error occurred'}</p>
            {this.state.error?.stack && (
              <div style={{ marginTop: '10px' }}>
                <p><strong>Stack trace:</strong></p>
                <pre style={{ whiteSpace: 'pre-wrap', margin: '5px 0' }}>
                  {this.state.error.stack}
                </pre>
              </div>
            )}
          </div>
          
          <p style={{ margin: '15px 0 25px', maxWidth: '500px' }}>
            We apologize for the inconvenience. Please try refreshing the page. 
            If the problem persists, please contact support with the error details above.
          </p>
          
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 30px',
              background: '#ff4d4f',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 6px rgba(255, 77, 79, 0.2)'
            }}
            onMouseOver={(e) => e.target.style.background = '#ff6b6b'}
            onMouseOut={(e) => e.target.style.background = '#ff4d4f'}
          >
            Reload Application
          </button>
          
          <p style={{ marginTop: '30px', fontSize: '0.8rem', opacity: 0.7 }}>
            If the issue continues, try clearing your browser cache or using a different browser.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hide loading indicator when app is mounted
const hideLoadingIndicator = () => {
  const loadingElement = document.getElementById('app-loading');
  if (loadingElement) {
    loadingElement.classList.add('hidden');
    // Remove from DOM after fade out
    setTimeout(() => {
      if (loadingElement.parentNode) {
        loadingElement.parentNode.removeChild(loadingElement);
      }
    }, 200);
  }
};

// Initialize the app
const initApp = () => {
  try {
    const container = document.getElementById('root');
    if (!container) throw new Error('Root element not found');
    
    const root = createRoot(container);
    
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <BrowserRouter basename={process.env.PUBLIC_URL}>
            <App />
          </BrowserRouter>
        </ErrorBoundary>
      </React.StrictMode>
    );

    hideLoadingIndicator();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    const errorScreen = document.getElementById('error-screen');
    if (errorScreen) {
      errorScreen.style.display = 'block';
      const loadingElement = document.getElementById('app-loading');
      if (loadingElement) loadingElement.style.display = 'none';
    }
  }
};

// Start the app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}