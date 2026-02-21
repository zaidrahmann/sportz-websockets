import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { WebSocketProvider, useWebSocket } from './hooks/useWebSocket.jsx';
import { MatchList } from './pages/MatchList.jsx';
import { CreateMatch } from './pages/CreateMatch.jsx';
import { MatchDetail } from './pages/MatchDetail.jsx';
import './App.css';

function Layout({ children }) {
  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="logo">
          <span className="logo-icon">◇</span>
          Sportz
        </Link>
        <nav className="nav">
          <Link to="/" className="nav-link">Matches</Link>
          <Link to="/create" className="nav-link nav-link-cta">New match</Link>
        </nav>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}

function Toasts() {
  const { toasts, removeToast } = useWebSocket();
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(({ id, message, type }) => (
        <div
          key={id}
          className={`toast toast-${type}`}
          role="alert"
          onClick={() => removeToast(id)}
        >
          {message}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <WebSocketProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<MatchList />} />
            <Route path="/create" element={<CreateMatch />} />
            <Route path="/match/:id" element={<MatchDetail />} />
          </Routes>
        </Layout>
        <Toasts />
      </HashRouter>
    </WebSocketProvider>
  );
}
