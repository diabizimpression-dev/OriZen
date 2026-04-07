import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { SecurityProvider } from './components/providers/SecurityProvider'
import { I18nProvider } from './components/providers/I18nProvider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <SecurityProvider>
        <App />
      </SecurityProvider>
    </I18nProvider>
  </React.StrictMode>,
)
