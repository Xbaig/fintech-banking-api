
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function LedgerRule() {
  return <div className="ledger-rule" />;
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        const res = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: form.username, email: form.email, password: form.password }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || 'Registration failed');
        }
        setMode('login');
        setError('');
      } else {
        const res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: form.username, password: form.password }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || 'Login failed');
        }
        const data = await res.json();
        onLogin(data.access_token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.authWrap}>
      <div style={styles.authForm}>
        <p className="mono" style={styles.eyebrow}>FINTECH BANKING</p>
        <h1 className="display" style={styles.authTitle}>
          {mode === 'login' ? 'Welcome back' : 'Open an account'}
        </h1>
        <LedgerRule />
        <form onSubmit={handleSubmit} style={styles.formCol}>
          <input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          {mode === 'register' && (
            <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          )}
          <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
          {error && <p className="error-msg">{error}</p>}
        </form>
        <p style={styles.switchText}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <span style={styles.switchLink} onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Register' : 'Log in'}
          </span>
        </p>
      </div>
      <div style={styles.authBrand}>
        <div style={styles.brandLines}>
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} style={{ ...styles.brandLine, opacity: 0.06 + (i % 3) * 0.04 }} />
          ))}
        </div>
        <p className="display" style={styles.brandQuote}>Every transaction,<br />accounted for.</p>
      </div>
    </div>
  );
}

function Dashboard({ token, onLogout }) {
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadAccounts() {
    try {
      const res = await fetch(`${API_URL}/accounts/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Could not load accounts');
      setAccounts(await res.json());
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { loadAccounts(); }, []);

  async function createAccount(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ account_number: newAccountNumber }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Could not create account');
      }
      setNewAccountNumber('');
      loadAccounts();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function doTransaction(accountId, type, amount) {
    if (!amount || Number(amount) <= 0) return;
    try {
      const res = await fetch(`${API_URL}/accounts/${accountId}/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `${type} failed`);
      }
      loadAccounts();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={styles.dashWrap}>
      <div style={styles.dashHeader}>
        <p className="mono" style={styles.eyebrow}>FINTECH BANKING</p>
        <button className="btn-secondary" onClick={onLogout}>Log out</button>
      </div>
      <h1 className="display" style={styles.dashTitle}>Your accounts</h1>
      <LedgerRule />
      {error && <p className="error-msg">{error}</p>}
      <div style={styles.accountGrid}>
        {accounts.map((acc) => (
          <AccountCard key={acc.id} account={acc} onTransact={doTransaction} />
        ))}
      </div>
      <div style={styles.newAccountBox}>
        <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 10 }}>Open a new account</p>
        <form onSubmit={createAccount} style={{ display: 'flex', gap: 10 }}>
          <input placeholder="Account number" value={newAccountNumber} onChange={(e) => setNewAccountNumber(e.target.value)} required />
          <button className="btn-primary" type="submit" disabled={busy}>Create</button>
        </form>
      </div>
    </div>
  );
}

function AccountCard({ account, onTransact }) {
  const [amount, setAmount] = useState('');
  return (
    <div style={styles.card}>
      <p className="mono" style={styles.cardAccNum}>{account.account_number}</p>
      <p className="display" style={styles.cardBalance}>${account.balance.toFixed(2)}</p>
      <div style={{ marginTop: 16 }}>
        <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { onTransact(account.id, 'deposit', amount); setAmount(''); }}>Deposit</button>
          <button className="btn-danger" style={{ flex: 1 }} onClick={() => { onTransact(account.id, 'withdraw', amount); setAmount(''); }}>Withdraw</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  function handleLogin(newToken) {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  }
  function handleLogout() {
    localStorage.removeItem('token');
    setToken(null);
  }
  return token ? <Dashboard token={token} onLogout={handleLogout} /> : <AuthScreen onLogin={handleLogin} />;
}

const styles = {
  authWrap: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' },
  authForm: { display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 80px', maxWidth: 480 },
  eyebrow: { color: 'var(--accent)', fontSize: 12, letterSpacing: '0.12em', marginBottom: 6 },
  authTitle: { fontSize: 34, fontWeight: 600, margin: 0 },
  formCol: { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 },
  switchText: { color: 'var(--text-dim)', fontSize: 13, marginTop: 20 },
  switchLink: { color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 },
  authBrand: { background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  brandLines: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' },
  brandLine: { height: 1, background: 'var(--accent)' },
  brandQuote: { fontSize: 28, textAlign: 'center', lineHeight: 1.4, position: 'relative', zIndex: 1, padding: '0 40px' },
  dashWrap: { maxWidth: 900, margin: '0 auto', padding: '48px 24px' },
  dashHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  dashTitle: { fontSize: 30, fontWeight: 600, margin: '20px 0 0' },
  accountGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginTop: 24 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 20 },
  cardAccNum: { color: 'var(--text-dim)', fontSize: 13, margin: 0 },
  cardBalance: { fontSize: 32, fontWeight: 600, margin: '6px 0 0' },
  newAccountBox: { marginTop: 36, padding: 20, background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 8 },
};
