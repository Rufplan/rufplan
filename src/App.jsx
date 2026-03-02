import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import Auth from './Auth';
import RufplanApp from './Rufplan_v260';

export default function App() {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const initialized = useRef(false);

  // Cache for user's own data
  const ownProfessionalData = useRef(null);
  const ownProfileData = useRef(null);
  const ownBizData = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadOwnData(u.id).then(() => console.log('Loaded own data on session restore'));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setShowAuth(false);
      if (u) loadOwnData(u.id).then(() => console.log('Loaded own data on auth change'));
    });
    return () => subscription.unsubscribe();
  }, []);

  // ─── Expose globals ───
  window._openLogin = () => setShowAuth(true);
  window._currentUser = user;
  window._supabase = supabase;
  window._logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // ─── Toast helper ───
  function showToast(msg, color = '#3ECFF7') {
    const t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style, {
      position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
      background: '#0a0a0a', color: color, padding: '14px 28px',
      fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px',
      fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase',
      zIndex: '999999', borderBottom: '3px solid ' + color,
    });
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; }, 2200);
    setTimeout(() => t.remove(), 2700);
  }

  // ─── Save/Discard confirmation modal ───
  function showSaveModal(onSave, onDiscard) {
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', background: 'rgba(0,0,0,.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: '999999', fontFamily: "'Barlow', sans-serif",
    });

    overlay.innerHTML = `
      <div style="background:#fff;width:360px;max-width:90vw;text-align:center;overflow:hidden">
        <div style="background:#0a0a0a;padding:20px">
          <div style="width:48px;height:48px;border-radius:50%;background:rgba(62,207,247,.12);
            display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3ECFF7" stroke-width="2.5">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
            </svg>
          </div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;
            color:#fff;text-transform:uppercase;letter-spacing:2px">Save Changes?</div>
          <div style="font-size:12px;color:rgba(255,255,255,.5);margin-top:4px">
            You have unsaved edits on this profile
          </div>
        </div>
        <div style="padding:20px 24px;display:flex;gap:10px">
          <button id="_modal_save" style="flex:1;padding:14px;background:#3ECFF7;color:#0a0a0a;
            font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:800;
            text-transform:uppercase;letter-spacing:1px;border:none;cursor:pointer">
            Save Changes
          </button>
          <button id="_modal_discard" style="padding:14px 20px;background:none;
            border:1.5px solid #ddd;font-family:'Barlow Condensed',sans-serif;font-size:13px;
            font-weight:700;color:#888;cursor:pointer;text-transform:uppercase;letter-spacing:1px">
            Discard
          </button>
        </div>
      </div>
    `;

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    overlay.querySelector('#_modal_save').addEventListener('click', () => {
      overlay.remove();
      onSave();
    });
    overlay.querySelector('#_modal_discard').addEventListener('click', () => {
      overlay.remove();
      onDiscard();
    });

    document.body.appendChild(overlay);
  }

  // ─── Load user's data from Supabase ───
  async function loadOwnData(userId) {
    // Load profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    ownProfileData.current = profile;

    // Load professional record (linked via profile_id)
    const { data: proRows } = await supabase
      .from('professionals')
      .select('*')
      .eq('profile_id', userId);
    if (proRows && proRows.length > 0) {
      ownProfessionalData.current = proRows[0];
    }

    // Load business (if business owner)
    const { data: bizRows } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', userId);
    if (bizRows && bizRows.length > 0) {
      ownBizData.current = bizRows[0];
    }

    return { profile, professional: ownProfessionalData.current, business: ownBizData.current };
  }

  // ─── Save individual profile from captured values (captured BEFORE toggle) ───
  async function saveIndividualFromCaptured(captured) {
    if (!user) return;

    const profileUpdates = {};
    const proUpdates = {};
    const vals = captured.editInputs || [];
    const ptypes = captured.ptypeInputs || [];

    console.log('All captured edit input values:', vals);
    console.log('All captured ptype values:', ptypes);

    // Index 0: Title + Location combo "Architectural Designer · New York, NY"
    if (vals[0]) {
      const val = vals[0];
      if (val.includes('·') || val.includes('•')) {
        const parts = val.split(/[·•]/);
        profileUpdates.title = parts[0].trim();
        profileUpdates.location = parts.slice(1).join('·').trim();
        proUpdates.title = profileUpdates.title;
        proUpdates.discipline = profileUpdates.title;
        proUpdates.location = profileUpdates.location;
      } else {
        profileUpdates.title = val;
        proUpdates.title = val;
      }
    }

    // Index 1: Total Projects (stat-box)
    if (vals[1]) {
      proUpdates.total_projects = vals[1];
    }

    // Index 2: Location (detail-value)
    if (vals[2]) {
      profileUpdates.location = vals[2];
      proUpdates.location = vals[2];
    }

    // Index 3: Experience (detail-value)
    if (vals[3]) {
      proUpdates.experience = vals[3];
    }

    // Index 4: Availability (detail-value)
    if (vals[4]) {
      const avail = vals[4].toLowerCase();
      proUpdates.available = avail.includes('available now') || avail === 'available';
    }

    // Index 5: Languages (detail-value)
    if (vals[5]) {
      proUpdates.languages = vals[5];
    }

    // Index 6+: Skills/Expertise
    const skills = [];
    for (let i = 6; i < vals.length; i++) {
      if (vals[i]) skills.push(vals[i]);
    }
    if (skills.length > 0) {
      profileUpdates.skills = skills;
    }

    // Project type counts (Residential, Commercial, Hospitality, etc.)
    if (ptypes.length > 0) {
      proUpdates.project_counts = JSON.stringify(ptypes.map(v => parseInt(v) || 0));
    }

    // Salary
    if (captured.salary) {
      const salVal = captured.salary.replace(/[$,Kk]/g, '').trim();
      const salNum = parseInt(salVal);
      if (!isNaN(salNum)) profileUpdates.hourly_rate = salNum;
    }

    // Rate
    if (captured.rate) {
      const rateVal = captured.rate.replace(/[$,]/g, '').trim();
      const rateNum = parseInt(rateVal);
      if (!isNaN(rateNum)) profileUpdates.hourly_rate = rateNum;
    }

    console.log('Final profile updates:', profileUpdates);
    console.log('Final professional updates:', proUpdates);

    // Update profiles table
    if (Object.keys(profileUpdates).length > 0) {
      const { data: profData, error: profError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id)
        .select();

      console.log('Profile save result:', profData, 'Error:', profError);
      if (profError) {
        showToast('Error: ' + profError.message, '#e74c3c');
        return;
      }
      ownProfileData.current = { ...ownProfileData.current, ...profileUpdates };
    }

    // Update professionals table if linked
    if (ownProfessionalData.current) {
      // Only send columns that exist in the table
      const cleanProUpdates = {};
      if (proUpdates.title) cleanProUpdates.title = proUpdates.title;
      if (proUpdates.discipline) cleanProUpdates.discipline = proUpdates.discipline;
      if (proUpdates.location) cleanProUpdates.location = proUpdates.location;
      if (proUpdates.experience) cleanProUpdates.experience = proUpdates.experience;
      if (proUpdates.languages) cleanProUpdates.languages = proUpdates.languages;
      if (proUpdates.total_projects) cleanProUpdates.total_projects = proUpdates.total_projects;
      if (proUpdates.project_counts) cleanProUpdates.project_counts = proUpdates.project_counts;
      if (proUpdates.available !== undefined) cleanProUpdates.available = proUpdates.available;

      console.log('Saving to professionals, ID:', ownProfessionalData.current.id, 'Updates:', cleanProUpdates);

      if (Object.keys(cleanProUpdates).length > 0) {
        const { data: proData, error: proError } = await supabase
          .from('professionals')
          .update(cleanProUpdates)
          .eq('id', ownProfessionalData.current.id)
          .select();

        console.log('Professional save result:', proData, 'Error:', proError);
        if (proError) {
          showToast('Error: ' + proError.message, '#e74c3c');
        }
        ownProfessionalData.current = { ...ownProfessionalData.current, ...cleanProUpdates };
      }
    } else {
      console.warn('No ownProfessionalData — skipping professionals update');
    }

    showToast('Profile changes saved ✓');
  }

  // ─── Save individual profile to Supabase ───
  async function saveIndividualToSupabase() {
    if (!user) return;

    const page = document.getElementById('page-profile');
    if (!page) { showToast('Profile page not found', '#e74c3c'); return; }

    // Read from visible editable-input fields (Rufplan's edit mode inputs)
    const editInputs = Array.from(page.querySelectorAll('.editable-input')).filter(
      i => i.offsetParent !== null && i.offsetWidth > 0
    );

    // Read from project type count inputs
    const ptypeInputs = Array.from(page.querySelectorAll('.ptype-count-input')).filter(
      i => i.offsetParent !== null && i.offsetWidth > 0
    );

    // Read stat numbers
    const statNums = Array.from(page.querySelectorAll('.profile-stat-num'));

    // Build updates object from what we can identify
    const profileUpdates = {};
    const proUpdates = {};

    // First editable-input is usually title + location like "Architectural Designer · New York, NY"
    if (editInputs[0]) {
      const val = editInputs[0].value.trim();
      if (val.includes('·') || val.includes('•')) {
        const parts = val.split(/[·•]/);
        profileUpdates.title = parts[0].trim();
        profileUpdates.location = parts.slice(1).join('·').trim();
        proUpdates.title = profileUpdates.title;
        proUpdates.discipline = profileUpdates.title;
        proUpdates.location = profileUpdates.location;
      } else {
        profileUpdates.title = val;
        proUpdates.title = val;
      }
    }

    // Collect all editable input values for a broad save
    const allValues = editInputs.map(i => i.value.trim());

    // Try to find specific fields by content patterns
    editInputs.forEach((inp, idx) => {
      const val = inp.value.trim();
      if (!val) return;

      // Experience (matches "8+ years", "10 years", etc.)
      if (val.match(/^\d+\+?\s*years?$/i)) {
        proUpdates.experience = val;
      }

      // Location patterns (City, ST or City, State)
      if (val.match(/^[A-Z][a-z]+.*,\s*[A-Z]{2}$/) || val.match(/^[A-Z][a-z]+.*,\s*[A-Z][a-z]+/)) {
        if (idx > 0) { // skip first input which is title+location combo
          profileUpdates.location = val;
          proUpdates.location = val;
        }
      }

      // Availability
      if (val.toLowerCase().includes('available') || val.toLowerCase().includes('not available')) {
        proUpdates.available = val.toLowerCase().includes('available now') || val.toLowerCase().includes('available');
      }
    });

    // Read salary input
    const salaryInput = page.querySelector('.salary-input');
    if (salaryInput) {
      const salVal = salaryInput.value.replace(/[$,K]/gi, '').trim();
      const salNum = parseInt(salVal);
      if (!isNaN(salNum)) {
        profileUpdates.hourly_rate = salNum;
      }
    }

    // Read rate input
    const rateInput = page.querySelector('.rate-input');
    if (rateInput) {
      const rateVal = rateInput.value.replace(/[$,]/g, '').trim();
      const rateNum = parseInt(rateVal);
      if (!isNaN(rateNum)) {
        profileUpdates.hourly_rate = rateNum;
      }
    }

    // Collect skills from editable inputs that look like skill names
    const skills = [];
    editInputs.forEach(inp => {
      const val = inp.value.trim();
      // Skills are usually short phrases like "Computational Design", "Parametric modeling"
      if (val && !val.includes('·') && !val.match(/^\d/) && !val.match(/years?$/i) &&
          !val.includes('$') && !val.includes(',') && val.length < 40 && val.length > 3 &&
          !val.toLowerCase().includes('available') && !val.toLowerCase().includes('english')) {
        // Check if it's in the skills/expertise section (higher index inputs)
        skills.push(val);
      }
    });

    // Only save skills if we found some reasonable ones
    if (skills.length > 3) {
      profileUpdates.skills = skills.slice(-10); // take the last ones (more likely to be skills section)
    }

    // Save total projects stat
    if (statNums.length > 2) {
      const projectsStat = statNums[2]; // index 2 is "Projects"
      if (projectsStat) {
        proUpdates.total_projects = projectsStat.textContent.trim();
      }
    }

    // Also read ptype counts as metadata
    if (ptypeInputs.length > 0) {
      const ptypeCounts = ptypeInputs.map(i => parseInt(i.value) || 0);
      proUpdates.project_counts = JSON.stringify(ptypeCounts);
    }

    console.log('Saving profile updates:', profileUpdates);
    console.log('Saving professional updates:', proUpdates);

    // Update profiles table
    if (Object.keys(profileUpdates).length > 0) {
      const { data: profData, error: profError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id)
        .select();

      console.log('Profile save result:', profData, 'Error:', profError);

      if (profError) {
        console.error('Error saving profile:', profError);
        showToast('Error: ' + profError.message, '#e74c3c');
        return;
      }
      if (!profData || profData.length === 0) {
        console.warn('Profile update returned no rows — RLS may be blocking');
        showToast('Warning: profile update blocked by permissions', '#e74c3c');
      }
      ownProfileData.current = { ...ownProfileData.current, ...profileUpdates };
    }

    // Update professionals table if linked
    if (ownProfessionalData.current && Object.keys(proUpdates).length > 0) {
      // Remove fields that don't exist in the table yet
      const cleanProUpdates = { ...proUpdates };
      delete cleanProUpdates.total_projects;
      delete cleanProUpdates.project_counts;
      delete cleanProUpdates.available;

      console.log('Clean pro updates:', cleanProUpdates, 'ID:', ownProfessionalData.current.id);

      const { data: proData, error: proError } = await supabase
        .from('professionals')
        .update(cleanProUpdates)
        .eq('id', ownProfessionalData.current.id)
        .select();

      console.log('Professional save result:', proData, 'Error:', proError);

      if (proError) {
        console.error('Error saving professional:', proError);
        showToast('Error saving professional: ' + proError.message, '#e74c3c');
      }
      if (!proData || proData.length === 0) {
        console.warn('Professional update returned no rows — RLS may be blocking');
      }
      ownProfessionalData.current = { ...ownProfessionalData.current, ...cleanProUpdates };
    } else {
      console.warn('No ownProfessionalData — skipping professionals update. Current value:', ownProfessionalData.current);
    }

    showToast('Profile changes saved ✓');
  }

  // ─── Save business profile to Supabase ───
  async function saveBizToSupabase() {
    if (!user) return;

    const page = document.getElementById('page-business-profile');
    if (!page) return;

    const getText = (sel) => {
      const el = page.querySelector(sel);
      return el ? (el.value || el.textContent || '').trim() : '';
    };

    // Read from DOM - try multiple selectors
    const name = getText('#biz-name') || getText('.biz-profile-name') || getText('[data-field="biz-name"]');
    const desc = getText('#biz-desc') || getText('.biz-about-text') || getText('[data-field="description"]');
    const location = getText('#biz-location') || getText('.biz-location') || getText('[data-field="biz-location"]');

    // Try reading tags
    let tags = [];
    const tagEls = page.querySelectorAll('.tag-pill, .expertise-tag, [data-tag]');
    tagEls.forEach(t => {
      const txt = t.textContent.trim();
      if (txt) tags.push(txt);
    });

    // Try reading detail fields
    let size = '', founded = '';
    const detailItems = page.querySelectorAll('.detail-item, .stat-item');
    detailItems.forEach(item => {
      const label = (item.querySelector('.detail-label, .stat-label') || {}).textContent || '';
      const value = (item.querySelector('.detail-value, .stat-value, input') || {}).textContent ||
                    (item.querySelector('input') || {}).value || '';
      if (label.toLowerCase().includes('size') || label.toLowerCase().includes('employees')) size = value.trim();
      if (label.toLowerCase().includes('founded') || label.toLowerCase().includes('year')) founded = value.trim();
    });

    const bizUpdates = {};
    if (name) bizUpdates.name = name;
    if (desc) bizUpdates.description = desc;
    if (location) bizUpdates.location = location;
    if (tags.length > 0) bizUpdates.expertise = tags;
    if (size) bizUpdates.employees = parseInt(size) || null;
    if (founded) bizUpdates.founded = parseInt(founded) || null;

    if (ownBizData.current && ownBizData.current.id) {
      const { error } = await supabase
        .from('businesses')
        .update(bizUpdates)
        .eq('id', ownBizData.current.id);

      if (error) {
        console.error('Error saving business:', error);
        showToast('Error saving business profile', '#e74c3c');
        return;
      }
      ownBizData.current = { ...ownBizData.current, ...bizUpdates };
    } else {
      // No business row yet — create one
      bizUpdates.owner_id = user.id;
      if (!bizUpdates.name) bizUpdates.name = user.user_metadata?.full_name || user.email;
      const { data, error } = await supabase
        .from('businesses')
        .insert(bizUpdates)
        .select()
        .single();

      if (error) {
        console.error('Error creating business:', error);
        showToast('Error creating business profile', '#e74c3c');
        return;
      }
      ownBizData.current = data;
    }

    // Also update professionals table
    const proUpdates = {};
    if (name) proUpdates.name = name;
    if (location) proUpdates.location = location;
    if (desc) proUpdates.bio = desc;

    if (ownProfessionalData.current) {
      await supabase
        .from('professionals')
        .update(proUpdates)
        .eq('id', ownProfessionalData.current.id);
      ownProfessionalData.current = { ...ownProfessionalData.current, ...proUpdates };
    }

    showToast('Business profile saved ✓');
  }

  // ─── Main setup effect ───
  useEffect(() => {
    if (initialized.current) return;

    const timer = setTimeout(() => {
      initialized.current = true;

      // ── Auth button overrides ──
      // Let Rufplan's native login/signup screens handle auth
      // Only override _openLogin as a console fallback
      const loginBtn = document.getElementById('nav-login-btn');
      const signupBtn = document.getElementById('nav-signup-btn');

      // ── Override openAuth to keep Rufplan's native UI ──
      // Don't override - let Rufplan show its own auth modal

      // ── Override doLogin to use Supabase ──
      const origDoLogin = window.doLogin;
      window.doLogin = async () => {
        const emailEl = document.getElementById('login-email');
        const passEl = document.getElementById('login-password');
        if (!emailEl || !passEl) { if (origDoLogin) origDoLogin(); return; }

        const email = emailEl.value.trim();
        const password = passEl.value;
        if (!email || !password) { showToast('Enter email and password', '#e74c3c'); return; }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          showToast(error.message, '#e74c3c');
          return;
        }

        // Load user data from Supabase
        await loadOwnData(data.user.id);

        // Call original to handle UI transition
        if (origDoLogin) {
          try { origDoLogin(); } catch (e) { console.log('origDoLogin UI error (ok):', e); }
        }

        // Close auth modal
        const modal = document.getElementById('auth-modal') || document.getElementById('modal-auth');
        if (modal) modal.style.display = 'none';
        const overlay = document.querySelector('.modal-overlay, .auth-overlay');
        if (overlay) overlay.style.display = 'none';
      };

      // ── Override doSignup to use Supabase ──
      const origDoSignup = window.doSignup;
      window.doSignup = async () => {
        const nameEl = document.getElementById('signup-name');
        const emailEl = document.getElementById('signup-email');
        const passEl = document.getElementById('signup-password');
        const bizNameEl = document.getElementById('signup-biz-name');

        if (!emailEl || !passEl) { if (origDoSignup) origDoSignup(); return; }

        const email = emailEl.value.trim();
        const password = passEl.value;
        const fullName = nameEl ? nameEl.value.trim() : '';
        const bizName = bizNameEl ? bizNameEl.value.trim() : '';

        if (!email || !password) { showToast('Enter email and password', '#e74c3c'); return; }

        // Detect selected discipline
        let discipline = '';
        const activePill = document.querySelector('.disc-pill.active, .discipline-pill.active, [data-discipline].active');
        if (activePill) discipline = activePill.textContent.trim();

        // Detect account type
        let accountType = 'individual';
        const bizTab = document.querySelector('.acct-tab.active, [data-acct-type].active');
        if (bizTab && bizTab.textContent.toLowerCase().includes('business')) accountType = 'business';

        // Detect if client
        let role = 'professional';
        if (discipline.toLowerCase().includes('client') || discipline.toLowerCase().includes('developer') ||
            discipline.toLowerCase().includes('homeowner') || discipline.toLowerCase().includes('owner rep')) {
          role = 'client';
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              business_name: bizName,
              discipline: discipline,
              account_type: accountType,
              role: role,
            },
          },
        });

        if (error) {
          showToast(error.message, '#e74c3c');
          return;
        }

        showToast('Account created ✓');

        if (origDoSignup) {
          try { origDoSignup(); } catch (e) { console.log('origDoSignup UI error (ok):', e); }
        }

        const modal = document.getElementById('auth-modal') || document.getElementById('modal-auth');
        if (modal) modal.style.display = 'none';
      };

      // ── Override toggleIndivEditMode with save/discard modal ──
      const origToggleIndivEdit = window.toggleIndivEditMode;
      let _skipIndivModal = false;
      window.toggleIndivEditMode = () => {
        // If we just saved/discarded, let the original toggle handle UI cleanup
        if (_skipIndivModal) {
          _skipIndivModal = false;
          if (origToggleIndivEdit) origToggleIndivEdit();
          return;
        }

        // Check the actual global variable Rufplan uses
        if (window.indivEditMode === true) {
          // CAPTURE all input values NOW while still in edit mode
          const page = document.getElementById('page-profile');
          const capturedValues = { editInputs: [], ptypeInputs: [], salary: '', rate: '' };
          
          if (page) {
            const editInputs = Array.from(page.querySelectorAll('.editable-input')).filter(
              i => i.offsetParent !== null && i.offsetWidth > 0
            );
            const ptypeInputs = Array.from(page.querySelectorAll('.ptype-count-input')).filter(
              i => i.offsetParent !== null && i.offsetWidth > 0
            );
            
            capturedValues.editInputs = editInputs.map(i => i.value.trim());
            capturedValues.ptypeInputs = ptypeInputs.map(i => i.value.trim());
            
            const salaryInput = page.querySelector('.salary-input') || page.querySelector('#nsalary-input');
            if (salaryInput) capturedValues.salary = salaryInput.value.trim();
            
            const rateInput = page.querySelector('.rate-input') || page.querySelector('#nrate-input');
            if (rateInput) capturedValues.rate = rateInput.value.trim();
          }
          
          console.log('Captured values before toggle:', capturedValues);

          // Currently editing — turning OFF — show save/discard modal
          showSaveModal(
            // Save
            async () => {
              await saveIndividualFromCaptured(capturedValues);
              // Now let the original toggle handle UI cleanup
              _skipIndivModal = true;
              window.indivEditMode = true; // ensure it's true so original toggle flips it off
              if (origToggleIndivEdit) origToggleIndivEdit();
              
              // After toggle exits edit mode, update the DOM with saved values
              setTimeout(() => {
                const page = document.getElementById('page-profile');
                if (!page) return;
                const cv = capturedValues.editInputs || [];
                
                // Update editable-field spans with the saved values
                const fields = page.querySelectorAll('.editable-field');
                const fieldArr = Array.from(fields);
                
                // Update the title+location display (first editable-field or the role tag)
                if (cv[0]) {
                  const roleTag = page.querySelector('.profile-role-tag .editable-field');
                  if (roleTag) roleTag.textContent = cv[0];
                }
                
                // Update Total Projects stat
                if (cv[1]) {
                  const statBoxes = page.querySelectorAll('.stat-box .editable-field');
                  if (statBoxes.length > 0) statBoxes[0].textContent = cv[1];
                  // Also update the stat-num display
                  const statNums = page.querySelectorAll('.profile-stat-num');
                  // Projects is usually the 3rd stat (after followers, following)
                  if (statNums.length > 2) statNums[2].textContent = cv[1];
                }
                
                // Update detail values (location, experience, availability, languages)
                const detailValues = page.querySelectorAll('.detail-value .editable-field');
                const dvArr = Array.from(detailValues);
                if (cv[2] && dvArr[0]) dvArr[0].textContent = cv[2]; // location
                if (cv[3] && dvArr[1]) dvArr[1].textContent = cv[3]; // experience
                if (cv[4] && dvArr[2]) dvArr[2].textContent = cv[4]; // availability
                if (cv[5] && dvArr[3]) dvArr[3].textContent = cv[5]; // languages
                
                // Update project type counts
                const ptypeCounts = page.querySelectorAll('.project-type-count');
                const ptypes = capturedValues.ptypeInputs || [];
                ptypeCounts.forEach((el, i) => {
                  if (ptypes[i] !== undefined) el.textContent = ptypes[i];
                });
                
                // Update expertise/skill fields
                const expertiseFields = page.querySelectorAll('.expertise-text .editable-field, .expertise-sub .editable-field');
                const expArr = Array.from(expertiseFields);
                for (let i = 6; i < cv.length; i++) {
                  if (cv[i] && expArr[i - 6]) expArr[i - 6].textContent = cv[i];
                }
                
                console.log('DOM updated with saved values');
              }, 400);
            },
            // Discard
            () => {
              _skipIndivModal = true;
              window.indivEditMode = true; // ensure it's true so original toggle flips it off
              if (origToggleIndivEdit) origToggleIndivEdit();
              showToast('Changes discarded', '#888');
            }
          );
        } else {
          // Not editing — turn ON edit mode normally
          if (origToggleIndivEdit) origToggleIndivEdit();
        }
      };

      // ── Override toggleBizEditMode with save/discard modal ──
      const origToggleBizEdit = window.toggleBizEditMode;
      let _skipBizModal = false;
      window.toggleBizEditMode = () => {
        if (_skipBizModal) {
          _skipBizModal = false;
          if (origToggleBizEdit) origToggleBizEdit();
          return;
        }

        if (window.bizEditMode === true) {
          showSaveModal(
            async () => {
              await saveBizToSupabase();
              _skipBizModal = true;
              window.bizEditMode = true;
              if (origToggleBizEdit) origToggleBizEdit();
            },
            () => {
              _skipBizModal = true;
              window.bizEditMode = true;
              if (origToggleBizEdit) origToggleBizEdit();
              showToast('Changes discarded', '#888');
            }
          );
        } else {
          if (origToggleBizEdit) origToggleBizEdit();
        }
      };

      // ── Override saveProfile to persist to Supabase (not destroy owner bar) ──
      const origSaveProfile = window.saveProfile;
      window.saveProfile = async () => {
        await saveIndividualToSupabase();
        // Do NOT call origSaveProfile — it destroys the owner bar
        // Just sync the display values from inputs
        const profPage = document.getElementById('page-profile');
        if (profPage) {
          profPage.querySelectorAll('[contenteditable="true"]').forEach(el => {
            el.contentEditable = 'false';
          });
        }
      };

      // ── Override goTo('profile') to load from Supabase ──
      const origGoTo = window.goTo;
      window.goTo = async (page, ...rest) => {
        if (page === 'profile' && user) {
          // Load data from Supabase before showing the page
          const data = await loadOwnData(user.id);

          // Let Rufplan navigate to the page
          if (origGoTo) origGoTo(page, ...rest);

          // After a brief delay, populate with real data
          setTimeout(() => {
            const profPage = document.getElementById('page-profile');
            if (!profPage) return;

            const profile = data.profile;
            const pro = data.professional;

            if (profile) {
              // Populate name
              const nameEls = profPage.querySelectorAll('.profile-name, #prof-name, h1, h2');
              nameEls.forEach(el => {
                if (el.textContent.includes('Demo') || el.textContent.includes('User') || el.textContent.includes('Name')) {
                  el.textContent = profile.full_name || '';
                }
              });

              // Populate title
              const titleEls = profPage.querySelectorAll('.profile-title, #prof-title, .subtitle');
              titleEls.forEach(el => {
                if (profile.title) el.textContent = profile.title;
              });

              // Populate location
              const locEls = profPage.querySelectorAll('.profile-location, #prof-location, .location');
              locEls.forEach(el => {
                if (profile.location) el.textContent = profile.location;
              });

              // Populate bio
              const bioEls = profPage.querySelectorAll('.profile-bio, #prof-bio, .about-text');
              bioEls.forEach(el => {
                if (profile.bio) el.textContent = profile.bio;
              });
            }
          }, 300);
        } else {
          if (origGoTo) origGoTo(page, ...rest);
        }
      };

      // ── Feed Supabase data into PROS arrays ──
      (async () => {
        try {
          const { data: businesses } = await supabase.from('professionals').select('*').eq('type', 'business');
          const { data: individuals } = await supabase.from('professionals').select('*').eq('type', 'individual');

          if (businesses && window.PROS_BUSINESSES) {
            // Append Supabase businesses to existing array
            businesses.forEach(b => {
              if (!window.PROS_BUSINESSES.find(existing => existing.n === b.name)) {
                window.PROS_BUSINESSES.push({
                  n: b.name || '',
                  discipline: b.discipline || 'Architecture',
                  loc: b.location || '',
                  exp: b.experience || '',
                  tags: b.tags || [],
                  size: b.size || '',
                  founded: b.founded || '',
                  rating: b.rating || 0,
                  reviews: b.reviews || 0,
                  photo: b.photo || '',
                  title: b.title || '',
                  bio: b.bio || '',
                  _supabase_id: b.id,
                  _profile_id: b.profile_id,
                });
              }
            });
          }

          if (individuals && window.PROS_INDIVIDUALS) {
            individuals.forEach(p => {
              if (!window.PROS_INDIVIDUALS.find(existing => existing.n === p.name)) {
                window.PROS_INDIVIDUALS.push({
                  n: p.name || '',
                  discipline: p.discipline || 'Architecture',
                  loc: p.location || '',
                  title: p.title || '',
                  bio: p.bio || '',
                  rating: p.rating || 0,
                  reviews: p.reviews || 0,
                  photo: p.photo || '',
                  _supabase_id: p.id,
                  _profile_id: p.profile_id,
                });
              }
            });
          }
        } catch (e) {
          console.log('Error loading pros data:', e);
        }
      })();

      // ── Inject client discipline pills into signup ──
      const injectClientPills = () => {
        const discGrid = document.querySelector('.disc-grid, .discipline-grid, #discipline-pills');
        if (!discGrid) return;

        // Check if already injected
        if (discGrid.querySelector('[data-client-pill]')) return;

        const separator = document.createElement('div');
        separator.setAttribute('data-client-pill', 'true');
        Object.assign(separator.style, {
          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
          margin: '12px 0 8px',
        });
        separator.innerHTML = `
          <div style="flex:1;height:1px;background:rgba(255,255,255,.1)"></div>
          <span style="font-size:9px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,.35);
            text-transform:uppercase;white-space:nowrap">Looking to build?</span>
          <div style="flex:1;height:1px;background:rgba(255,255,255,.1)"></div>
        `;
        discGrid.appendChild(separator);

        // Detect if business or individual tab is active
        const isBusiness = () => {
          const activeTab = document.querySelector('.acct-tab.active, [data-acct-type].active');
          return activeTab && activeTab.textContent.toLowerCase().includes('business');
        };

        const clientPill = document.createElement('div');
        clientPill.setAttribute('data-client-pill', 'true');
        clientPill.className = 'disc-pill';
        clientPill.textContent = isBusiness() ? 'Business Client' : 'Individual Client';
        Object.assign(clientPill.style, {
          padding: '8px 16px', cursor: 'pointer', fontSize: '12px',
          fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase',
          border: '1px solid rgba(62,207,247,.3)', color: '#3ECFF7',
          textAlign: 'center', transition: 'all .2s',
        });
        clientPill.onclick = () => {
          discGrid.querySelectorAll('.disc-pill').forEach(p => {
            p.style.background = 'transparent';
            p.style.color = p.getAttribute('data-client-pill') ? '#3ECFF7' : '';
            if (p.classList) p.classList.remove('active');
          });
          clientPill.style.background = '#3ECFF7';
          clientPill.style.color = '#0a0a0a';
          clientPill.classList.add('active');
        };
        discGrid.appendChild(clientPill);

        // Update Product pill to say Product Manufacturer for business
        const updateProductPill = () => {
          const pills = discGrid.querySelectorAll('.disc-pill:not([data-client-pill])');
          pills.forEach(p => {
            if (p.textContent.includes('Product')) {
              if (isBusiness()) {
                p.textContent = 'Product Manufacturer';
                p.style.display = '';
              } else {
                p.style.display = 'none';
              }
            }
          });
          clientPill.textContent = isBusiness() ? 'Business Client' : 'Individual Client';
        };

        // Watch for tab changes
        const tabs = document.querySelectorAll('.acct-tab, [data-acct-type]');
        tabs.forEach(tab => {
          const origClick = tab.onclick;
          tab.onclick = (e) => {
            if (origClick) origClick.call(tab, e);
            setTimeout(updateProductPill, 50);
          };
        });

        updateProductPill();
      };

      // Try injecting pills periodically (signup form may not exist yet)
      const pillInterval = setInterval(() => {
        const discGrid = document.querySelector('.disc-grid, .discipline-grid, #discipline-pills');
        if (discGrid && !discGrid.querySelector('[data-client-pill]')) {
          injectClientPills();
        }
        
        // Inject Google sign-in buttons
        injectGoogleLoginButton();
        injectGoogleSignupButton();
      }, 1000);

      // Clean up after 30 seconds
      setTimeout(() => clearInterval(pillInterval), 30000);
      
      // Google SVG icon reusable
      const googleSvg = `<svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>`;
      
      const googleBtnStyle = `
        width:100%;padding:12px;background:#fff;color:#333;
        font-family:'Barlow',sans-serif;font-size:14px;font-weight:600;
        border:1.5px solid #ddd;cursor:pointer;
        display:flex;align-items:center;justify-content:center;gap:10px;
        border-radius:2px;transition:all .2s;
      `;
      
      const orDividerStyle = (dark) => `
        <div style="display:flex;align-items:center;gap:12px;margin:14px 0;">
          <div style="flex:1;height:1px;background:${dark ? 'rgba(0,0,0,.1)' : 'rgba(255,255,255,.15)'}"></div>
          <span style="font-size:10px;color:${dark ? 'rgba(0,0,0,.3)' : 'rgba(255,255,255,.35)'};font-weight:700;text-transform:uppercase;letter-spacing:2px">or</span>
          <div style="flex:1;height:1px;background:${dark ? 'rgba(0,0,0,.1)' : 'rgba(255,255,255,.15)'}"></div>
        </div>
      `;
      
      function addGoogleClickHandler(btnId) {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin },
          });
          if (error) showToast(error.message, '#e74c3c');
        });
        btn.addEventListener('mouseover', () => { btn.style.background = '#f8f8f8'; });
        btn.addEventListener('mouseout', () => { btn.style.background = '#fff'; });
      }

      // ── Inject Google button into LOGIN form ──
      function injectGoogleLoginButton() {
        const loginEmail = document.getElementById('login-email');
        if (!loginEmail) return;
        const container = loginEmail.parentElement;
        if (!container || container.querySelector('[data-google-login]')) return;
        
        const wrapper = document.createElement('div');
        wrapper.setAttribute('data-google-login', 'true');
        wrapper.innerHTML = `
          <button id="_google-login-btn" style="${googleBtnStyle}">
            ${googleSvg} Continue with Google
          </button>
          ${orDividerStyle(true)}
        `;
        container.insertBefore(wrapper, loginEmail);
        addGoogleClickHandler('_google-login-btn');
      }

      // ── Inject Google button into SIGNUP form and rearrange layout ──
      function injectGoogleSignupButton() {
        const suEmail = document.getElementById('su-email');
        if (!suEmail) return;
        if (document.querySelector('[data-google-signup]')) return;
        
        const formContainer = suEmail.parentElement.parentElement;
        if (!formContainer) return;
        const children = Array.from(formContainer.children);
        
        // Find the key sections by index/content
        let disciplineSection = null;
        let emailSection = null;
        let bizIndivSection = null;
        let nameWrapBiz = document.getElementById('su-biz-name-wrap');
        let nameWrapIndiv = document.getElementById('su-individual-name-wrap');
        
        children.forEach((child, i) => {
          const text = child.textContent.trim().substring(0, 20);
          if (text.startsWith('Discipline') || text.startsWith('DISCIPLINE')) disciplineSection = child;
          if (text.startsWith('Email') || text.startsWith('EMAIL')) emailSection = child;
          if (text.includes('Business or Individual') || text.includes('BUSINESS OR INDIVIDUAL')) bizIndivSection = child;
        });
        
        if (!disciplineSection || !emailSection) return;
        
        // Move discipline to right after the name wraps (which are after biz/individual)
        const insertAfter = nameWrapIndiv || nameWrapBiz || bizIndivSection;
        if (insertAfter && insertAfter.nextSibling) {
          formContainer.insertBefore(disciplineSection, insertAfter.nextSibling);
        }
        
        // Create divider + Google button + or + (email section stays where it is)
        const wrapper = document.createElement('div');
        wrapper.setAttribute('data-google-signup', 'true');
        wrapper.style.cssText = 'margin:20px 0 0;';
        wrapper.innerHTML = `
          <div style="display:flex;align-items:center;gap:12px;margin:20px 0 16px;">
            <div style="flex:1;height:1px;background:rgba(0,0,0,.1)"></div>
            <span style="font-size:9px;color:rgba(0,0,0,.25);font-weight:700;text-transform:uppercase;letter-spacing:2px">Create your account</span>
            <div style="flex:1;height:1px;background:rgba(0,0,0,.1)"></div>
          </div>
          <button id="_google-signup-btn" style="${googleBtnStyle}" type="button">
            ${googleSvg} Sign up with Google
          </button>
          ${orDividerStyle(true)}
        `;
        
        // Insert the Google wrapper right before the email section
        formContainer.insertBefore(wrapper, emailSection);
        
        // Add click handler with validation
        const gBtn = document.getElementById('_google-signup-btn');
        if (gBtn) {
          gBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Check if Business or Individual is selected
            const bizCard = formContainer.querySelector('.su-type-card.active, .su-type-card.selected, [data-acct-type].active');
            if (!bizCard) {
              showToast('Please select Business or Individual first', '#e74c3c');
              return;
            }
            
            // Check if a discipline is selected
            const activePill = formContainer.querySelector('.su-disc-pill.active, .disc-pill.active');
            if (!activePill) {
              showToast('Please select a discipline first', '#e74c3c');
              return;
            }
            
            const { error } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: window.location.origin },
            });
            if (error) showToast(error.message, '#e74c3c');
          });
          gBtn.addEventListener('mouseover', () => { gBtn.style.background = '#f8f8f8'; });
          gBtn.addEventListener('mouseout', () => { gBtn.style.background = '#fff'; });
        }
        
        // Also add validation to the CREATE MY ACCOUNT button
        const createBtn = formContainer.querySelector('button');
        if (createBtn && createBtn.textContent.includes('CREATE')) {
          const origOnclick = createBtn.onclick;
          createBtn.onclick = (e) => {
            // Check if Business or Individual is selected
            const bizCard = formContainer.querySelector('.su-type-card.active, .su-type-card.selected, [data-acct-type].active');
            if (!bizCard) {
              e.preventDefault();
              e.stopPropagation();
              showToast('Please select Business or Individual first', '#e74c3c');
              return;
            }
            
            // Check if a discipline is selected
            const activePill = formContainer.querySelector('.su-disc-pill.active, .disc-pill.active');
            if (!activePill) {
              e.preventDefault();
              e.stopPropagation();
              showToast('Please select a discipline first', '#e74c3c');
              return;
            }
            
            if (origOnclick) origOnclick.call(createBtn, e);
          };
        }
      }

    }, 800);

    return () => clearTimeout(timer);
  }, [user]);

  // ── Update nav when user state changes ──
  useEffect(() => {
    const timer = setTimeout(() => {
      const loginBtn = document.getElementById('nav-login-btn');
      const signupBtn = document.getElementById('nav-signup-btn');
      const navPill = document.getElementById('nav-user-pill');
      const navName = document.getElementById('nav-user-name');

      if (user) {
        const userName = user.user_metadata?.full_name || user.email;
        if (navPill) {
          navPill.style.display = 'flex';
          navPill.style.cursor = 'pointer';
          navPill.onclick = async () => {
            await loadOwnData(user.id);
            if (window.goTo) window.goTo('profile');
          };
        }
        if (navName) navName.textContent = userName;
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
      } else {
        if (navPill) navPill.style.display = 'none';
        if (loginBtn) loginBtn.style.display = '';
        if (signupBtn) signupBtn.style.display = '';
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [user]);

  return (
    <>
      <RufplanApp />
      {showAuth && <Auth onAuth={() => setShowAuth(false)} />}
    </>
  );
}
