import { useState, useEffect, useCallback } from 'react';

function Settings({ apiBase, addToast }) {
  const [sources, setSources] = useState([]);
  const [topics, setTopics] = useState([]);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [loadingSources, setLoadingSources] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(true);

  const loadSources = useCallback(async () => {
    try {
      setLoadingSources(true);
      const res = await fetch(`${apiBase}/sources`);
      const data = await res.json();
      setSources(data.sources || []);
    } catch {
      addToast('Failed to load sources', 'error');
    } finally {
      setLoadingSources(false);
    }
  }, [apiBase, addToast]);

  const loadTopics = useCallback(async () => {
    try {
      setLoadingTopics(true);
      const res = await fetch(`${apiBase}/topics`);
      const data = await res.json();
      setTopics(data.topics || []);
    } catch {
      addToast('Failed to load topics', 'error');
    } finally {
      setLoadingTopics(false);
    }
  }, [apiBase, addToast]);

  useEffect(() => {
    loadSources();
    loadTopics();
  }, [loadSources, loadTopics]);

  // Source actions
  const addSource = async (e) => {
    e.preventDefault();
    if (!newSourceName.trim() || !newSourceUrl.trim()) return;

    try {
      const res = await fetch(`${apiBase}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSourceName, url: newSourceUrl }),
      });
      const data = await res.json();
      if (data.error) {
        addToast(data.error, 'error');
      } else {
        addToast(`Added source: ${newSourceName}`, 'success');
        setNewSourceName('');
        setNewSourceUrl('');
        loadSources();
      }
    } catch {
      addToast('Failed to add source', 'error');
    }
  };

  const toggleSource = async (id, active) => {
    try {
      await fetch(`${apiBase}/sources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active }),
      });
      loadSources();
    } catch {
      addToast('Failed to update source', 'error');
    }
  };

  const deleteSource = async (id, name) => {
    try {
      await fetch(`${apiBase}/sources/${id}`, { method: 'DELETE' });
      addToast(`Removed source: ${name}`, 'info');
      loadSources();
    } catch {
      addToast('Failed to delete source', 'error');
    }
  };

  // Topic actions
  const addTopic = async (e) => {
    e.preventDefault();
    if (!newTopic.trim()) return;

    try {
      const res = await fetch(`${apiBase}/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: newTopic, is_must_follow: false }),
      });
      const data = await res.json();
      if (data.error) {
        addToast(data.error, 'error');
      } else {
        addToast(`Added topic: ${newTopic}`, 'success');
        setNewTopic('');
        loadTopics();
      }
    } catch {
      addToast('Failed to add topic', 'error');
    }
  };

  const toggleMustFollow = async (id, isMustFollow) => {
    try {
      await fetch(`${apiBase}/topics/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_must_follow: !isMustFollow }),
      });
      loadTopics();
    } catch {
      addToast('Failed to update topic', 'error');
    }
  };

  const deleteTopic = async (id, keyword) => {
    try {
      await fetch(`${apiBase}/topics/${id}`, { method: 'DELETE' });
      addToast(`Removed topic: ${keyword}`, 'info');
      loadTopics();
    } catch {
      addToast('Failed to delete topic', 'error');
    }
  };

  return (
    <div className="settings" id="settings-page">
      {/* Sources Section */}
      <section className="glass-card settings__section">
        <h2 className="settings__section-title">📡 News Sources</h2>
        <p className="settings__section-desc">
          Add RSS feed URLs to pull news from. Toggle sources on/off without removing them.
        </p>

        <form className="form-row" onSubmit={addSource}>
          <input
            className="form-input"
            type="text"
            placeholder="Source name (e.g., TechCrunch)"
            value={newSourceName}
            onChange={(e) => setNewSourceName(e.target.value)}
            id="input-source-name"
          />
          <input
            className="form-input"
            type="url"
            placeholder="RSS Feed URL"
            value={newSourceUrl}
            onChange={(e) => setNewSourceUrl(e.target.value)}
            id="input-source-url"
            style={{ flex: 2 }}
          />
          <button className="btn btn--primary" type="submit" id="btn-add-source">
            + Add
          </button>
        </form>

        {loadingSources ? (
          <div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8, borderRadius: 8 }}></div>
            ))}
          </div>
        ) : (
          <ul className="settings-list">
            {sources.map((source) => (
              <li key={source.id} className="settings-list__item">
                <div className="settings-list__item-info">
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={!!source.active}
                      onChange={() => toggleSource(source.id, source.active)}
                    />
                    <span className="toggle__slider"></span>
                  </label>
                  <div>
                    <div className="settings-list__item-name" style={{ opacity: source.active ? 1 : 0.5 }}>
                      {source.name}
                    </div>
                    <div className="settings-list__item-url">{source.url}</div>
                  </div>
                </div>
                <div className="settings-list__item-actions">
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                    {source.type}
                  </span>
                  <button
                    className="btn btn--danger btn--sm"
                    onClick={() => deleteSource(source.id, source.name)}
                    title="Remove source"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Topics Section */}
      <section className="glass-card settings__section">
        <h2 className="settings__section-title">🏷️ Topic Keywords</h2>
        <p className="settings__section-desc">
          Define topics you're interested in. Mark topics as "Must Follow" to prioritize them in your feed.
        </p>

        <form className="form-row" onSubmit={addTopic}>
          <input
            className="form-input"
            type="text"
            placeholder="Add a topic (e.g., Quantum Computing)"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            id="input-topic"
          />
          <button className="btn btn--primary" type="submit" id="btn-add-topic">
            + Add
          </button>
        </form>

        {loadingTopics ? (
          <div className="skeleton" style={{ height: 40, borderRadius: 8 }}></div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {topics.map((topic) => (
              <div
                key={topic.id}
                className={`topic-tag ${topic.is_must_follow ? 'topic-tag--must-follow' : 'topic-tag--normal'}`}
              >
                <span
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleMustFollow(topic.id, topic.is_must_follow)}
                  title={topic.is_must_follow ? 'Click to unmark as must-follow' : 'Click to mark as must-follow'}
                >
                  {topic.is_must_follow ? '⭐' : '○'} {topic.keyword}
                </span>
                <button
                  className="topic-tag__remove"
                  onClick={() => deleteTopic(topic.id, topic.keyword)}
                  title="Remove topic"
                >
                  ✕
                </button>
              </div>
            ))}
            {topics.length === 0 && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                No topics configured. Add some above!
              </span>
            )}
          </div>
        )}
      </section>

      {/* Info section */}
      <section className="glass-card settings__section">
        <h2 className="settings__section-title">ℹ️ About TechPulse</h2>
        <p className="settings__section-desc" style={{ marginBottom: 0 }}>
          TechPulse fetches news from your configured RSS sources daily at midnight,
          summarizes each article using AI (or extractive fallback), and narrates them
          using text-to-speech. Configure your <strong>OPENAI_API_KEY</strong> in the
          backend <code>.env</code> file for AI-powered summaries, or use the built-in
          extractive summaries that work without any API key.
        </p>
      </section>
    </div>
  );
}

export default Settings;
