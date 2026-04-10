import { useState, useEffect, useCallback, useRef } from 'react';
import './index.css';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import AudioPlayer from './components/AudioPlayer';
import Toast from './components/Toast';

const API_BASE = 'http://localhost:3001/api';

function App() {
  const [page, setPage] = useState('dashboard');
  const [articles, setArticles] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, today: 0 });
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Audio queue state
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);

  const currentArticle = currentIndex >= 0 ? queue[currentIndex] : null;

  // Toast helper
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Fetch articles
  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/articles/today`);
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (err) {
      // Try all articles if today endpoint fails
      try {
        const res = await fetch(`${API_BASE}/articles`);
        const data = await res.json();
        setArticles(data.articles || []);
      } catch {
        addToast('Failed to load articles. Is the backend running?', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Fetch stats
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/articles/stats`);
      const data = await res.json();
      setStats(data);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    loadArticles();
    loadStats();
  }, [loadArticles, loadStats]);

  // Trigger news fetch
  const handleFetchNews = async () => {
    setFetching(true);
    addToast('Fetching latest news...', 'info');
    try {
      const res = await fetch(`${API_BASE}/fetch`, { method: 'POST' });
      const data = await res.json();
      addToast(data.message, 'success');
      await loadArticles();
      await loadStats();
    } catch (err) {
      addToast('Failed to fetch news. Check your backend.', 'error');
    } finally {
      setFetching(false);
    }
  };

  // Mark as read
  const markAsRead = async (id) => {
    try {
      await fetch(`${API_BASE}/articles/${id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true }),
      });
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_read: 1 } : a))
      );
      loadStats();
    } catch {
      // Silently fail
    }
  };

  // ---- TTS / Audio Queue Logic ----

  const speak = useCallback((text, onEnd) => {
    const synth = synthRef.current;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to use a natural-sounding voice
    const voices = synth.getVoices();
    const preferred = voices.find(
      (v) => v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Natural')
    );
    if (preferred) utterance.voice = preferred;

    // Progress tracking
    let startTime = Date.now();
    const estimatedDuration = (text.length / 15) * 1000; // rough estimate

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / estimatedDuration) * 100, 99);
      setProgress(pct);
    }, 200);

    utterance.onend = () => {
      clearInterval(interval);
      setProgress(100);
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      clearInterval(interval);
      setProgress(0);
      if (onEnd) onEnd();
    };

    utteranceRef.current = utterance;
    synth.speak(utterance);
  }, []);

  const playArticle = useCallback((article, articleQueue, index) => {
    setQueue(articleQueue);
    setCurrentIndex(index);
    setIsPlaying(true);
    setProgress(0);
    markAsRead(article.id);

    const textToSpeak = `${article.title}. ${article.summary || ''}`;

    speak(textToSpeak, () => {
      // Auto-advance to next
      if (index < articleQueue.length - 1) {
        const nextIndex = index + 1;
        const nextArticle = articleQueue[nextIndex];
        setTimeout(() => {
          playArticle(nextArticle, articleQueue, nextIndex);
        }, 500);
      } else {
        setIsPlaying(false);
        setCurrentIndex(-1);
        setProgress(0);
      }
    });
  }, [speak, markAsRead]);

  const handlePlayAll = () => {
    if (articles.length === 0) return;
    playArticle(articles[0], articles, 0);
    addToast(`Playing ${articles.length} articles`, 'info');
  };

  const handlePlaySingle = (article) => {
    const idx = articles.findIndex((a) => a.id === article.id);
    playArticle(article, articles, idx >= 0 ? idx : 0);
  };

  const handlePause = () => {
    const synth = synthRef.current;
    if (isPlaying) {
      synth.pause();
      setIsPlaying(false);
    } else {
      synth.resume();
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    synthRef.current.cancel();
    setIsPlaying(false);
    setCurrentIndex(-1);
    setProgress(0);
  };

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      synthRef.current.cancel();
      const nextIndex = currentIndex + 1;
      playArticle(queue[nextIndex], queue, nextIndex);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      synthRef.current.cancel();
      const prevIndex = currentIndex - 1;
      playArticle(queue[prevIndex], queue, prevIndex);
    }
  };

  // Load voices
  useEffect(() => {
    const loadVoices = () => synthRef.current.getVoices();
    loadVoices();
    synthRef.current.onvoiceschanged = loadVoices;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      synthRef.current.cancel();
    };
  }, []);

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="header" id="app-header">
        <div className="header__brand">
          <div className="header__logo">⚡</div>
          <div>
            <div className="header__title">TechPulse</div>
            <div className="header__subtitle">AI News Narrator</div>
          </div>
        </div>

        <nav className="header__nav">
          <button
            id="nav-dashboard"
            className={`nav-btn ${page === 'dashboard' ? 'nav-btn--active' : ''}`}
            onClick={() => setPage('dashboard')}
          >
            📰 Dashboard
          </button>
          <button
            id="nav-settings"
            className={`nav-btn ${page === 'settings' ? 'nav-btn--active' : ''}`}
            onClick={() => setPage('settings')}
          >
            ⚙️ Settings
          </button>
        </nav>

        <div className="header__actions">
          <button
            id="btn-fetch-news"
            className={`btn btn--primary ${fetching ? 'btn--loading' : ''}`}
            onClick={handleFetchNews}
            disabled={fetching}
          >
            📡 Fetch News
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {page === 'dashboard' && (
          <Dashboard
            articles={articles}
            stats={stats}
            loading={loading}
            currentArticle={currentArticle}
            isPlaying={isPlaying}
            onPlayAll={handlePlayAll}
            onPlaySingle={handlePlaySingle}
            onMarkRead={markAsRead}
          />
        )}
        {page === 'settings' && (
          <Settings
            apiBase={API_BASE}
            addToast={addToast}
          />
        )}
      </main>

      {/* Audio Player Bar */}
      <AudioPlayer
        currentArticle={currentArticle}
        isPlaying={isPlaying}
        progress={progress}
        currentIndex={currentIndex}
        queueLength={queue.length}
        onPlayPause={handlePause}
        onStop={handleStop}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />

      {/* Toasts */}
      <Toast toasts={toasts} />
    </div>
  );
}

export default App;
