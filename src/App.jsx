import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Auth from './Auth';
import RufplanApp from './Rufplan_v260';

export default function App() {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setShowAuth(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  window._openLogin = () => setShowAuth(true);
  window._currentUser = user;
  window._logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const loginBtn = document.getElementById('nav-login-btn');
      const signupBtn = document.getElementById('nav-signup-btn');

      if (loginBtn) {
        loginBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowAuth(true);
        };
      }
      if (signupBtn) {
        signupBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowAuth(true);
        };
      }

      if (user) {
        const userName = user.user_metadata?.full_name || user.email;
        const navPill = document.getElementById('nav-user-pill');
        const navName = document.getElementById('nav-user-name');
        if (navPill) navPill.style.display = 'flex';
        if (navName) navName.textContent = userName;
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [user]);

  return (
    <>
      <RufplanApp />
      {showAuth && <Auth onAuth={() => setShowAuth(false)} />}
    </>
  );
}