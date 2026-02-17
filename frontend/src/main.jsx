import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// NOTE: StrictMode removed — it breaks react-beautiful-dnd in React 18
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
