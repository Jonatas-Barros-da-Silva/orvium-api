
import React from 'react';

export default function App() {
  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', color: '#334155' }}>
      <header style={{ marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px' }}>
        <h1 style={{ color: '#2563eb', fontSize: '2.5rem', margin: 0 }}>ORVIUM Platform</h1>
        <p style={{ color: '#64748b', marginTop: '10px', fontSize: '1.1rem' }}>Minimal React Frontend</p>
      </header>

      <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <p style={{ margin: 0, color: '#166534', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.5rem' }}>✅</span> Frontend is running successfully!
        </p>
      </div>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '15px' }}>Services Status</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '15px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}><span>🌐</span> Web App</strong>
            <code style={{ backgroundColor: '#e2e8f0', padding: '4px 8px', borderRadius: '4px', color: '#0f172a' }}>http://localhost:3000</code>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}><span>⚙️</span> API Server</strong>
            <code style={{ backgroundColor: '#e2e8f0', padding: '4px 8px', borderRadius: '4px', color: '#0f172a' }}>http://localhost:3001</code>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}><span>🗄️</span> PocketBase</strong>
            <code style={{ backgroundColor: '#e2e8f0', padding: '4px 8px', borderRadius: '4px', color: '#0f172a' }}>http://localhost:8090</code>
          </div>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '15px' }}>Next Steps</h2>
        <div style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '25px', borderRadius: '8px' }}>
          <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', color: '#475569' }}>
            <li>Review the <strong>STARTUP_GUIDE.md</strong> for detailed environment instructions.</li>
            <li>Run <code>bash scripts/diagnose-frontend.sh</code> to verify your setup is clean.</li>
            <li>Begin developing your application by editing <code>apps/web/src/App.jsx</code>.</li>
          </ol>
        </div>
      </section>
    </div>
  );
}
