import { useState } from 'react';

function ArticleCard({ article, isPlaying, isLoadingAudio, onPlay, onMarkRead, formatTime }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`glass-card article-card ${isPlaying ? 'article-card--playing' : ''} ${
        article.is_read ? 'article-card--read' : ''
      }`}
      id={`article-${article.id}`}
    >
      <div className="article-card__header">
        <h3 className="article-card__title">{article.title}</h3>
        <div className="article-card__actions">
          <button
            className="btn btn--ghost btn--sm"
            onClick={onPlay}
            title="Play this article"
            disabled={isLoadingAudio}
          >
            {isLoadingAudio ? '⏳' : isPlaying ? '⏸' : '▶'}
          </button>
          {!article.is_read && (
            <button
              className="btn btn--ghost btn--sm"
              onClick={onMarkRead}
              title="Mark as read"
            >
              ✓
            </button>
          )}
          <a
            className="btn btn--ghost btn--sm"
            href={article.original_link}
            target="_blank"
            rel="noopener noreferrer"
            title="Open source"
          >
            ↗
          </a>
        </div>
      </div>

      <div className="article-card__meta">
        <span className="article-card__source">📰 {article.source_name}</span>
        <span className="article-card__time">{formatTime(article.published_at)}</span>
        {article.is_read ? (
          <span className="article-card__badge" style={{ background: 'rgba(100,116,139,0.15)', color: '#94a3b8', borderColor: 'rgba(100,116,139,0.2)' }}>Read</span>
        ) : (
          <span className="article-card__badge">New</span>
        )}
      </div>

      {article.summary && (
        <div
          className={`article-card__summary ${isPlaying ? 'article-card__summary--highlight' : ''}`}
          onClick={() => setExpanded(!expanded)}
          style={{ cursor: 'pointer' }}
        >
          {expanded ? article.summary : article.summary.slice(0, 200) + (article.summary.length > 200 ? '...' : '')}
        </div>
      )}

      <div className="article-card__footer">
        <button className="btn btn--ghost btn--sm" onClick={onPlay} disabled={isLoadingAudio}>
          {isLoadingAudio ? '⏳ Generating...' : isPlaying ? '⏸ Narrating...' : '🎧 Listen'}
        </button>
        {article.summary && article.summary.length > 200 && (
          <button className="btn btn--ghost btn--sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? '▲ Less' : '▼ More'}
          </button>
        )}
      </div>
    </div>
  );
}

function Dashboard({ articles, stats, loading, currentArticle, isPlaying, isLoadingAudio, onPlayAll, onPlaySingle, onMarkRead }) {
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 18 ? 'Good Afternoon' : 'Good Evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div id="dashboard">
      <div className="dashboard__header">
        <div>
          <h1 className="dashboard__greeting">
            {greeting}, <span>here's your briefing</span>
          </h1>
          <p className="dashboard__date">{dateStr}</p>
        </div>
        <div className="dashboard__controls">
          <button
            id="btn-play-all"
            className="btn btn--primary btn--lg"
            onClick={onPlayAll}
            disabled={articles.length === 0 || isLoadingAudio}
          >
            {isLoadingAudio ? '⏳ Generating...' : `▶ Play All (${articles.length})`}
          </button>
        </div>
      </div>

      <div className="stats-bar">
        <div className="glass-card stat-card">
          <div className="stat-card__value">{stats.today || articles.length}</div>
          <div className="stat-card__label">Today's Articles</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-card__value">{stats.unread || 0}</div>
          <div className="stat-card__label">Unread</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-card__value">{stats.total || 0}</div>
          <div className="stat-card__label">Total Archived</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-card__value">{stats.bySource?.length || 0}</div>
          <div className="stat-card__label">Active Sources</div>
        </div>
      </div>

      {loading ? (
        <div className="articles-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card article-card">
              <div className="skeleton" style={{ width: '80%', height: 22, marginBottom: 12 }}></div>
              <div className="skeleton" style={{ width: '40%', height: 14, marginBottom: 16 }}></div>
              <div className="skeleton" style={{ width: '100%', height: 60 }}></div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📡</div>
          <h3 className="empty-state__title">No articles yet</h3>
          <p className="empty-state__text">
            Click "Fetch News" to pull the latest articles from your configured sources, or add sources in Settings.
          </p>
        </div>
      ) : (
        <div className="articles-grid">
          {articles.map((article) => {
            const isCurrent = currentArticle?.id === article.id;
            return (
              <ArticleCard
                key={article.id}
                article={article}
                isPlaying={isCurrent && isPlaying}
                isLoadingAudio={isCurrent && isLoadingAudio}
                onPlay={() => onPlaySingle(article)}
                onMarkRead={() => onMarkRead(article.id)}
                formatTime={formatTime}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
