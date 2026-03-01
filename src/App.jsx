import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import ProfileEditor from './ProfileEditor';
import ProsDirectory from './ProsDirectory';
import RufplanApp from './Rufplan_v260';

export default function App() {
  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showPros, setShowPros] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  window._openProfile = () => setShowProfile(true);
  window._openPros = () => setShowPros(true);
  window._currentUser = user;

  useEffect(() => {
    const timer = setTimeout(() => {

      // ── Rename Product pill and make it toggle with account type ──
      const productPill = document.querySelector('.su-disc-pill[data-disc="product"]');
      if (productPill) {
        productPill.textContent = 'Product Manufacturer';
        productPill.id = 'su-pill-product';
      }

      function updateProductPillVisibility() {
        const acctType = document.getElementById('su-acct-type-val').value;
        const pill = document.getElementById('su-pill-product');
        if (pill) {
          pill.style.display = acctType === 'business' ? '' : 'none';
        }
      }

      // ── Inject client option into discipline picker ──
      const discGrid = document.getElementById('su-discipline-grid');
      if (discGrid && !document.getElementById('su-disc-separator')) {

        const sep = document.createElement('div');
        sep.id = 'su-disc-separator';
        sep.style.cssText = 'width:100%;height:1px;background:#e8e8e8;margin:6px 0;';
        discGrid.appendChild(sep);

        const label = document.createElement('div');
        label.id = 'su-client-label';
        label.style.cssText = 'width:100%;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#aaa;margin-bottom:2px;';
        label.textContent = 'Looking to build?';
        discGrid.appendChild(label);

        const clientContainer = document.createElement('div');
        clientContainer.id = 'su-client-pills';
        clientContainer.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;width:100%;';
        discGrid.appendChild(clientContainer);

        function renderClientPill() {
          const acctType = document.getElementById('su-acct-type-val').value;
          const container = document.getElementById('su-client-pills');
          if (!container) return;
          container.innerHTML = '';

          const pillLabel = acctType === 'business' ? 'Business Client' : 'Individual Client';
          const pillValue = acctType === 'business' ? 'client-business' : 'client-individual';

          const pill = document.createElement('div');
          pill.className = 'su-disc-pill';
          pill.setAttribute('data-disc', pillValue);
          pill.style.cssText = "padding:9px 18px;border:1.5px solid #e8e8e8;font-size:12px;font-weight:700;font-family:'Barlow',sans-serif;cursor:pointer;transition:all .15s;color:#666;background:white;text-transform:uppercase;letter-spacing:.5px;";
          pill.textContent = pillLabel;
          pill.onclick = function () { window.setSuDisc(pill, pillValue); };
          container.appendChild(pill);
        }

        renderClientPill();
        updateProductPillVisibility();

        const origSetSuAcctType = window.setSuAcctType;
        window.setSuAcctType = function (type) {
          origSetSuAcctType(type);
          renderClientPill();
          updateProductPillVisibility();
        };
      }

      // ── Override doLogin to use Supabase ──
      window.doLogin = async () => {
        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const pass = document.getElementById('login-password').value;
        const errEl = document.getElementById('login-error');
        errEl.style.display = 'none';

        if (!email || !pass) {
          errEl.textContent = 'Please fill in all fields.';
          errEl.style.display = 'block';
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: pass,
        });

        if (error) {
          errEl.textContent = error.message;
          errEl.style.display = 'block';
          return;
        }

        const u = data.user;
        const firstName = u.user_metadata?.full_name?.split(' ')[0] || email.split('@')[0];
        const lastName = u.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '';

        const session = {
          userId: u.id,
          email: u.email,
          firstName: firstName,
          lastName: lastName,
          role: u.user_metadata?.role || 'other',
          accountType: u.user_metadata?.account_type || 'individual',
          discipline: u.user_metadata?.discipline || '',
          businessName: u.user_metadata?.business_name || '',
          avatar: firstName[0] + (lastName[0] || ''),
          photoUrl: '',
        };

        if (typeof window.closeAuth === 'function') window.closeAuth();
        if (typeof window.applySession === 'function') window.applySession(session);
        if (typeof window.saveSession === 'function') window.saveSession(session);
        if (typeof window.showToast === 'function') window.showToast('Welcome back, ' + firstName + '! 👋');
      };

      // ── Override doSignup to use Supabase ──
      window.doSignup = async () => {
        const acctType = document.getElementById('su-acct-type-val').value;
        const discipline = document.getElementById('su-discipline-val').value;
        const role = document.getElementById('su-role').value;
        const bizName = (document.getElementById('su-biz-name') || {}).value || '';
        const pass = document.getElementById('su-password').value;
        const pass2 = document.getElementById('su-password2').value;
        const terms = document.getElementById('su-terms').checked;
        const errEl = document.getElementById('signup-error');
        const succEl = document.getElementById('signup-success');
        errEl.style.display = 'none';
        succEl.style.display = 'none';

        let fname = '';
        let lname = '';
        let email = '';

        if (acctType === 'individual') {
          fname = document.getElementById('su-fname').value.trim();
          lname = document.getElementById('su-lname').value.trim();
          email = document.getElementById('su-email').value.trim().toLowerCase();
        } else {
          fname = bizName.trim();
          lname = '';
          email = document.getElementById('su-email').value.trim().toLowerCase();
        }

        if (!acctType) { errEl.textContent = 'Please select Business or Individual.'; errEl.style.display = 'block'; return; }
        if (acctType === 'business' && !bizName.trim()) { errEl.textContent = 'Please enter your business name.'; errEl.style.display = 'block'; return; }
        if (acctType === 'individual' && (!fname || !lname)) { errEl.textContent = 'Please enter your first and last name.'; errEl.style.display = 'block'; return; }
        if (!email || !discipline || !pass || !pass2) { errEl.textContent = 'Please fill in all fields and select a discipline.'; errEl.style.display = 'block'; return; }
        if (pass.length < 8) { errEl.textContent = 'Password must be at least 8 characters.'; errEl.style.display = 'block'; return; }
        if (pass !== pass2) { errEl.textContent = 'Passwords do not match.'; errEl.style.display = 'block'; return; }
        if (!terms) { errEl.textContent = 'Please agree to the Terms of Service.'; errEl.style.display = 'block'; return; }

        const fullName = acctType === 'business' ? bizName.trim() : fname + ' ' + lname;
        const isClient = discipline.startsWith('client-');

        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: pass,
          options: {
            data: {
              full_name: fullName,
              account_type: acctType,
              discipline: discipline,
              role: isClient ? 'client' : role,
              business_name: acctType === 'business' ? bizName.trim() : '',
              is_client: isClient,
            },
          },
        });

        if (error) {
          errEl.textContent = error.message;
          errEl.style.display = 'block';
          return;
        }

        if (data.user) {
          await supabase.from('profiles').update({
            full_name: fullName,
            role: isClient ? 'client' : acctType,
            title: isClient ? (acctType === 'business' ? 'Business Client' : 'Individual Client') : discipline,
          }).eq('id', data.user.id);
        }

        const displayName = acctType === 'business' ? bizName.trim() : fname;
        succEl.textContent = '\u2713 Account created! Welcome to Rufplan, ' + displayName + '.';
        succEl.style.display = 'block';

        setTimeout(() => {
          const u = data.user;
          const session = {
            userId: u.id,
            email: u.email,
            firstName: acctType === 'business' ? bizName.trim() : fname,
            lastName: lname,
            role: isClient ? 'client' : role,
            accountType: acctType,
            discipline: discipline,
            businessName: acctType === 'business' ? bizName.trim() : '',
            avatar: acctType === 'business' ? bizName.trim().substring(0, 2).toUpperCase() : fname[0].toUpperCase() + (lname[0] || '').toUpperCase(),
            photoUrl: '',
          };
          if (typeof window.closeAuth === 'function') window.closeAuth();
          if (typeof window.applySession === 'function') window.applySession(session);
          if (typeof window.saveSession === 'function') window.saveSession(session);
          if (typeof window.showToast === 'function') window.showToast('Account created! Welcome to Rufplan, ' + displayName);
        }, 1200);
      };

      // ── Override doLogout to use Supabase ──
      const origLogout = window.doLogout;
      window.doLogout = async () => {
        await supabase.auth.signOut();
        if (typeof origLogout === 'function') origLogout();
      };

      // ── Hook professionals nav ──
      const prosNav = document.getElementById('nav-professionals');
      if (prosNav) {
        prosNav.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowPros(true);
        };
      }

      // ── If Supabase user exists, apply session to Rufplan UI ──
      if (user) {
        const firstName = user.user_metadata?.full_name?.split(' ')[0] || user.email.split('@')[0];
        const lastName = user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '';
        const session = {
          userId: user.id,
          email: user.email,
          firstName: firstName,
          lastName: lastName,
          role: user.user_metadata?.role || 'other',
          accountType: user.user_metadata?.account_type || 'individual',
          discipline: user.user_metadata?.discipline || '',
          businessName: user.user_metadata?.business_name || '',
          avatar: firstName[0] + (lastName[0] || ''),
          photoUrl: '',
        };
        if (typeof window.applySession === 'function') window.applySession(session);
        if (typeof window.saveSession === 'function') window.saveSession(session);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [user]);

  return (
    <>
      <RufplanApp />
      {showProfile && user && <ProfileEditor user={user} onClose={() => setShowProfile(false)} />}
      {showPros && <ProsDirectory onClose={() => setShowPros(false)} />}
    </>
  );
}
