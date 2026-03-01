import React from 'react';

const loadSqlJs = () =>
  new Promise((resolve, reject) => {
    if (window.initSqlJs) {
      resolve(window.initSqlJs);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sql.js.org/dist/sql-wasm.js';
    script.async = true;
    script.onload = () => resolve(window.initSqlJs);
    script.onerror = () => reject(new Error('Failed to load sql.js'));
    document.head.appendChild(script);
  });

export default function SqlRunner({ schema = '', seed = '', defaultQuery = '', onRun }) {
  const [db, setDb] = React.useState(null);
  const [query, setQuery] = React.useState(defaultQuery || 'SELECT * FROM demo LIMIT 5;');
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const init = async () => {
      try {
        const initSqlJs = await loadSqlJs();
        const SQL = await initSqlJs({
          locateFile: (file) => `https://sql.js.org/dist/${file}`
        });
        const dbInstance = new SQL.Database();
        if (schema) dbInstance.run(schema);
        if (seed) dbInstance.run(seed);
        setDb(dbInstance);
      } catch (err) {
        setError(err.message);
      }
    };
    init();
    return () => {
      try {
        db?.close();
      } catch (err) {
        /* noop */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = React.useCallback(() => {
    if (!db) return;
    setLoading(true);
    setError('');
    try {
      const res = db.exec(query);
      setResult(res);
      onRun?.(res);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [db, query, onRun]);

  return (
    <div className="sql-runner">
      <div className="sql-toolbar">
        <div>
          <strong>SQL Runner</strong>
          <div className="sql-meta">In-browser SQLite (sql.js)</div>
        </div>
        <button className="btn-nav next" onClick={run} disabled={loading || !db}>
          {loading ? 'Running…' : 'Run Query'}
        </button>
      </div>
      <textarea
        className="code-editor"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        spellCheck={false}
        style={{ minHeight: 160 }}
        placeholder="Write SQL here..."
      />
      {error && <div className="test-error">Error: {error}</div>}
      {result && result.length === 0 && <div className="test-summary">Query executed. No rows returned.</div>}
      {result && result.length > 0 && (
        <div className="test-results">
          {result.map((table, idx) => (
            <div key={idx} className="test-row-block">
              <div className="test-row-header">
                <span>{table.columns.join(' | ')}</span>
                <span>{table.values.length} rows</span>
              </div>
              <div className="test-row-detail">
                <table className="leader-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      {table.columns.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.values.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) => (
                          <td key={c}>{String(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
