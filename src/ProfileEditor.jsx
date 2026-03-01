import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { getProfile, updateProfile } from './hooks';

export default function ProfileEditor({ user, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    title: '',
    location: '',
    bio: '',
    hourly_rate: '',
    skills: '',
  });

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then((data) => {
      if (data) {
        setProfile(data);
        setForm({
          full_name: data.full_name || '',
          title: data.title || '',
          location: data.location || '',
          bio: data.bio || '',
          hourly_rate: data.hourly_rate || '',
          skills: (data.skills || []).join(', '),
        });
      }
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    const updates = {
      full_name: form.full_name,
      title: form.title,
      location: form.location,
      bio: form.bio,
      hourly_rate: form.hourly_rate ? parseInt(form.hourly_rate) : null,
      skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
    };
    const result = await updateProfile(user.id, updates);
    if (result) setProfile(result);
    setSaving(false);
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1.5px solid #e0e0e0',
    fontSize: 13,
    fontFamily: "'Barlow', sans-serif",
    marginBottom: 10,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    fontSize: 9,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '2px',
    color: '#888',
    marginBottom: 4,
    display: 'block',
  };

  if (loading) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999,
    }}>
      <div style={{
        background: '#fff', width: 420, maxWidth: '90vw', maxHeight: '85vh',
        overflow: 'auto', fontFamily: "'Barlow', sans-serif",
      }}>
        <div style={{
          background: '#0a0a0a', padding: '18px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20,
              fontWeight: 900, color: '#fff', textTransform: 'uppercase',
            }}>Edit Profile</div>
            <div style={{ fontSize: 11, color: '#3ECFF7', fontWeight: 600 }}>
              {user.email}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,.4)',
            fontSize: 20, cursor: 'pointer',
          }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <label style={labelStyle}>Full Name</label>
          <input style={inputStyle} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />

          <label style={labelStyle}>Title / Role</label>
          <input style={inputStyle} placeholder="e.g. Senior Structural Engineer" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

          <label style={labelStyle}>Location</label>
          <input style={inputStyle} placeholder="e.g. Los Angeles, CA" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />

          <label style={labelStyle}>Bio</label>
          <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Tell us about yourself..." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />

          <label style={labelStyle}>Hourly Rate ($)</label>
          <input style={inputStyle} type="number" placeholder="e.g. 150" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} />

          <label style={labelStyle}>Skills (comma separated)</label>
          <input style={inputStyle} placeholder="e.g. AutoCAD, Revit, Project Management" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
        </div>

        <div style={{
          padding: '12px 24px 20px', borderTop: '1px solid #f0f0f0',
          display: 'flex', gap: 8,
        }}>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 1, padding: 12, background: '#0a0a0a', color: '#3ECFF7',
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14,
            fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1,
            border: 'none', cursor: 'pointer',
          }}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
          <button onClick={onClose} style={{
            padding: '12px 18px', background: 'none', border: '1.5px solid #ddd',
            fontSize: 12, color: '#888', cursor: 'pointer', fontFamily: "'Barlow', sans-serif",
          }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
Ctrl + S to save. Now we need to wire it into App.jsx. Open App.jsx and replace everything with:
jsximport { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Auth from './Auth';
import ProfileEditor from './ProfileEditor';
import RufplanApp from './Rufplan_v260';

export default function App() {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

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
  window._openProfile = () => setShowProfile(true);
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
        if (navPill) {
          navPill.style.display = 'flex';
          navPill.style.cursor = 'pointer';
          navPill.onclick = () => setShowProfile(true);
        }
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
      {showProfile && user && <ProfileEditor user={user} onClose={() => setShowProfile(false)} />}
    </>
  );
}