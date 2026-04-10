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
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(new Audio());

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

  // ---- OpenAI TTS Audio Playback ----

  // Set up audio event listeners once
  useEffect(() => {
    const audio = audioRef.current;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoadingAudio(false);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('canplaythrough', () => setIsLoadingAudio(false));

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.pause();
    };
  }, []);

  const playArticle = useCallback(async (article, articleQueue, index) => {
    setQueue(articleQueue);
    setCurrentIndex(index);
    setIsLoadingAudio(true);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    markAsRead(article.id);

    addToast(`Generating narration for "${article.title.slice(0, 40)}..."`, 'info');

    try {
      // Call backend to generate OpenAI TTS audio
      const res = await fetch(`${API_BASE}/audio/article/${article.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Audio generation failed');
      }

      // Convert response to blob and create audio URL
      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Clean up previous blob URL
      if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = audioRef.current;
      audio.src = audioUrl;

      // Auto-advance when track ends
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        if (index < articleQueue.length - 1) {
          const nextIndex = index + 1;
          setTimeout(() => {
            playArticle(articleQueue[nextIndex], articleQueue, nextIndex);
          }, 800);
        } else {
          setIsPlaying(false);
          setCurrentIndex(-1);
          setProgress(0);
          addToast('Finished playing all articles', 'success');
        }
      };

      await audio.play();
      setIsPlaying(true);
      setIsLoadingAudio(false);
    } catch (err) {
      console.error('Playback error:', err);
      setIsLoadingAudio(false);
      addToast(`Audio failed: ${err.message}`, 'error');
    }
  }, [addToast, markAsRead]);

  const handlePlayAll = () => {
    if (articles.length === 0) return;
    playArticle(articles[0], articles, 0);
    addToast(`Queued ${articles.length} articles`, 'info');
  };

  const handlePlaySingle = (article) => {
    const idx = articles.findIndex((a) => a.id === article.id);
    playArticle(article, articles, idx >= 0 ? idx : 0);
  };

  const handlePause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const handleStop = () => {
    const audio = audioRef.current;
    audio.pause();
    audio.currentTime = 0;
    if (audio.src && audio.src.startsWith('blob:')) {
      URL.revokeObjectURL(audio.src);
    }
    audio.src = '';
    setIsPlaying(false);
    setCurrentIndex(-1);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  };

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      audioRef.current.pause();
      const nextIndex = currentIndex + 1;
      playArticle(queue[nextIndex], queue, nextIndex);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      audioRef.current.pause();
      const prevIndex = currentIndex - 1;
      playArticle(queue[prevIndex], queue, prevIndex);
    }
  };

  const handleSeek = (percent) => {
    const audio = audioRef.current;
    if (audio.duration) {
      audio.currentTime = (percent / 100) * audio.duration;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      audio.pause();
      if (audio.src && audio.src.startsWith('blob:')) {
        URL.revokeObjectURL(audio.src);
      }
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
            isLoadingAudio={isLoadingAudio}
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
        isLoadingAudio={isLoadingAudio}
        progress={progress}
        currentTime={currentTime}
        duration={duration}
        currentIndex={currentIndex}
        queueLength={queue.length}
        onPlayPause={handlePause}
        onStop={handleStop}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSeek={handleSeek}
      />

      {/* Toasts */}
      <Toast toasts={toasts} />
    </div>
  );
}

export default App;
