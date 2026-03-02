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

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) setError(error.message);
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

        {/* Google Sign In Button - only on login */}
        {!isSignUp && (
          <>
            <button
              onClick={handleGoogleLogin}
              style={{
                width: '100%', padding: 12, background: '#fff', color: '#333',
                fontFamily: "'Barlow', sans-serif", fontSize: 14, fontWeight: 600,
                border: '1.5px solid #ddd', cursor: 'pointer', marginBottom: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                borderRadius: 2, transition: 'all .2s',
              }}
              onMouseOver={(e) => e.target.style.background = '#f8f8f8'}
              onMouseOut={(e) => e.target.style.background = '#fff'}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: '#e0e0e0' }} />
              <span style={{ fontSize: 11, color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>or</span>
              <div style={{ flex: 1, height: 1, background: '#e0e0e0' }} />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          )}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 14, background: '#0a0a0a', color: '#3ECFF7',
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15,
            fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1,
            border: 'none', cursor: 'pointer', marginTop: 8,
          }}>
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
