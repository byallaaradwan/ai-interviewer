import { Link, useParams } from 'react-router-dom';

export function ParticipantPlaceholder() {
  const { token } = useParams();
  return (
    <div className="participant-placeholder">
      <div className="card placeholder-card">
        <div className="placeholder-badge">Coming in Phase 2</div>
        <h1>Interview link</h1>
        <p className="subtitle">
          Token: <code>{token}</code>
        </p>
        <p>
          The participant flow needs the database (Phase 2) to load interview configuration
          from a token. Until then, run interviews directly via the researcher app.
        </p>
        <Link to="/app/new" className="btn" style={{ marginTop: 16 }}>
          Open researcher app →
        </Link>
        <Link to="/landing" className="btn btn-secondary" style={{ marginTop: 8, display: 'block', textAlign: 'center' }}>
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
