import { useState } from 'react';
import { supabase } from './supabase';

export default function Auth({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) setError(error.message);
      else onAuth();
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else onAuth();
    }
    setLoading(false);
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    border: '1.5px solid #e0e0e0',
    fontSize: 14,
    fontFamily: "'Barlow', sans-serif",
    marginBottom: 12,
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
      <div style={{ background: '#fff', width: 380, maxWidth: '90vw', padding: 32, fontFamily: "'Barlow', sans-serif" }}>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
          {isSignUp ? 'Create Account' : 'Log In'}
        </h2>
        <div style={{ height: 4, width: 50, background: '#3ECFF7', marginBottom: 24 }} />
        {error && <p style={{ color: '#e74c3c', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          )}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
          <button type="submit" disabled={loading} style={{ width: '100%', padding: 14, background: '#0a0a0a', color: '#3ECFF7', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, border: 'none', cursor: 'pointer', marginTop: 8 }}>
            {loading ? '...' : isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>
        <p style={{ fontSize: 13, color: '#888', marginTop: 16, textAlign: 'center' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span onClick={() => { setIsSignUp(!isSignUp); setError(''); }} style={{ color: '#3ECFF7', cursor: 'pointer', fontWeight: 600 }}>
            {isSignUp ? 'Log In' : 'Sign Up'}
          </span>
        </p>
      </div>
    </div>
  );
}