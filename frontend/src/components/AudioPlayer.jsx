function AudioPlayer({
  currentArticle,
  isPlaying,
  isLoadingAudio,
  progress,
  currentTime,
  duration,
  currentIndex,
  queueLength,
  onPlayPause,
  onStop,
  onNext,
  onPrevious,
  onSeek,
}) {
  const isVisible = currentArticle != null;

  const formatTime = (seconds) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    onSeek(Math.max(0, Math.min(100, percent)));
  };

  return (
    <div className={`player-bar ${isVisible ? 'player-bar--visible' : ''}`} id="audio-player">
      {/* Article Info */}
      <div className="player-bar__info">
        <div className="player-bar__title">
          {isLoadingAudio ? '⏳ Generating narration...' : currentArticle?.title || 'No article selected'}
        </div>
        <div className="player-bar__source">
          {currentArticle?.source_name || ''}
          {isLoadingAudio && ' — OpenAI TTS (coral)'}
        </div>
      </div>

      {/* Controls */}
      <div className="player-bar__controls">
        <button
          className="player-control"
          onClick={onPrevious}
          disabled={currentIndex <= 0 || isLoadingAudio}
          title="Previous article"
          id="btn-previous"
        >
          ⏮
        </button>

        <button
          className={`player-control player-control--main ${isLoadingAudio ? 'player-control--loading' : ''}`}
          onClick={onPlayPause}
          disabled={isLoadingAudio}
          title={isPlaying ? 'Pause' : 'Resume'}
          id="btn-play-pause"
        >
          {isLoadingAudio ? '⏳' : isPlaying ? '⏸' : '▶'}
        </button>

        <button
          className="player-control"
          onClick={onStop}
          title="Stop"
          id="btn-stop"
        >
          ⏹
        </button>

        <button
          className="player-control"
          onClick={onNext}
          disabled={currentIndex >= queueLength - 1 || isLoadingAudio}
          title="Next article"
          id="btn-next"
        >
          ⏭
        </button>
      </div>

      {/* Progress */}
      <div className="player-bar__progress">
        <div className="progress-bar" onClick={handleProgressClick}>
          <div
            className="progress-bar__fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="progress-bar__labels">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Queue Info */}
      <div className="player-bar__queue-info">
        {currentIndex + 1} / {queueLength}
      </div>
    </div>
  );
}

export default AudioPlayer;
