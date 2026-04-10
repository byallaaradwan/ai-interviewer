export function ParticipantHelp() {
  const faqs = [
    { q: 'What is this?', a: 'AI Interviewer is a research tool that lets you share your experience through a short conversation. A researcher set up questions on a topic they want to learn about, and you answer them naturally.' },
    { q: 'Who sees my answers?', a: 'Only the researcher who created the interview. Your responses are never sold, shared with third parties, or used to train AI models.' },
    { q: 'How long does it take?', a: 'Most interviews take 8–12 minutes. You can stop anytime — your progress is saved.' },
    { q: 'Do I need an account?', a: 'No. You don\'t need to sign up or give your name. Everything is anonymous.' },
    { q: 'Can I redo an interview?', a: 'Each interview can only be completed once. If the researcher needs more input, they will create a new one for you.' },
    { q: 'Is this a real person or AI?', a: 'The interviewer is an AI trained to have natural conversations. A human researcher designed the questions and will review your answers.' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Help</h1>
        <p className="subtitle">Frequently asked questions about participating.</p>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {faqs.map((f, i) => (
          <details key={i} className="card" style={{ padding: 16 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{f.q}</summary>
            <p style={{ margin: '10px 0 0', color: 'var(--muted)' }}>{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
