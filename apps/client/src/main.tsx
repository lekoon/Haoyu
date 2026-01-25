import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import './i18n/config'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Dynamic import to catch module initialization errors (e.g. store crashes)
import('./App.tsx').then(({ default: App }) => {
  try {
    console.log('Starting Haoyu App...');
    const rootElement = document.getElementById('root');
    if (!rootElement) throw new Error('Root element not found');

    createRoot(rootElement).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </StrictMode>,
    )
  } catch (error) {
    showError(error);
  }
}).catch((error) => {
  console.error('Failed to load application module:', error);
  showError(error);
});

function showError(error: any) {
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif; color: #ef4444;">
      <h1>Application Failed to Load</h1>
      <p>A critical error occurred while initializing the application.</p>
      <pre style="background: #fef2f2; padding: 10px; border-radius: 4px; overflow: auto; max-width: 100%; border: 1px solid #fee2e2;">${error instanceof Error ? error.message + '\n' + error.stack : String(error)}</pre>
      <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 20px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Reload Application</button>
    </div>
  `;
}
