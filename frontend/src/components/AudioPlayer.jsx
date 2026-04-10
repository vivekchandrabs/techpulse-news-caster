function AudioPlayer({
  currentArticle,
  isPlaying,
  progress,
  currentIndex,
  queueLength,
  onPlayPause,
  onStop,
  onNext,
  onPrevious,
}) {
  const isVisible = currentArticle != null;

  return (
    <div className={`player-bar ${isVisible ? 'player-bar--visible' : ''}`} id="audio-player">
      {/* Article Info */}
      <div className="player-bar__info">
        <div className="player-bar__title">
          {currentArticle?.title || 'No article selected'}
        </div>
        <div className="player-bar__source">
          {currentArticle?.source_name || ''}
        </div>
      </div>

      {/* Controls */}
      <div className="player-bar__controls">
        <button
          className="player-control"
          onClick={onPrevious}
          disabled={currentIndex <= 0}
          title="Previous article"
          id="btn-previous"
        >
          ⏮
        </button>

        <button
          className="player-control player-control--main"
          onClick={onPlayPause}
          title={isPlaying ? 'Pause' : 'Resume'}
          id="btn-play-pause"
        >
          {isPlaying ? '⏸' : '▶'}
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
          disabled={currentIndex >= queueLength - 1}
          title="Next article"
          id="btn-next"
        >
          ⏭
        </button>
      </div>

      {/* Progress */}
      <div className="player-bar__progress">
        <div className="progress-bar">
          <div
            className="progress-bar__fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="progress-bar__labels">
          <span>{Math.round(progress)}%</span>
          <span>Narrating</span>
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
