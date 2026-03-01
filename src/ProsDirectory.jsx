import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import ProProfile from './ProProfile';

export default function ProsDirectory({ onClose }) {
  const [pros, setPros] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [mode, setMode] = useState('businesses');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);

  const disciplines = ['All', 'Architecture', 'Engineering', 'Construction', 'Consultants'];

  useEffect(() => {
    async function fetchData() {
      const [prosRes, bizRes] = await Promise.all([
        supabase.from('professionals').select('*').order('name'),
        supabase.from('businesses').select('*').order('name'),
      ]);
      if (prosRes.data) setPros(prosRes.data);
      if (bizRes.data) setBusinesses(bizRes.data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const items = mode === 'businesses' ? businesses : pros;

  const filtered = items.filter((item) => {
    const matchesFilter = filter === 'All' || item.discipline === filter;
    const matchesSearch = !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.location || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const photoUrl = (key) =>
    key ? `https://images.unsplash.com/${key}?w=400&h=400&fit=crop` : null;

  // If viewing a profile, show that instead
  if (viewingProfile) {
    return (
      <ProProfile
        item={viewingProfile}
        mode={mode}
        onClose={() => setViewingProfile(null)}
      />
    );
  }

  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(255,255,255,.95)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99998,
        fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: 2, color: '#888',
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#fff', zIndex: 99998,
      display: 'flex', flexDirection: 'column', fontFamily: "'Barlow', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: '#0a0a0a', padding: '20px 30px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24,
            fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: 1,
          }}>
            Professionals Directory
          </div>
          <div style={{ fontSize: 12, color: '#3ECFF7', fontWeight: 600, marginTop: 2 }}>
            {filtered.length} {mode === 'businesses' ? 'firms' : 'professionals'} found
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: '1px solid #444', color: '#888',
          fontSize: 14, cursor: 'pointer', width: 36, height: 36, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>
      </div>

      {/* Toolbar */}
      <div style={{
        padding: '14px 30px', borderBottom: '1px solid #eee',
        display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
      }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', border: '1.5px solid #e0e0e0' }}>
          {['businesses', 'individuals'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setSelected(null); }}
              style={{
                padding: '8px 16px', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer',
                border: 'none', fontFamily: "'Barlow', sans-serif",
                background: mode === m ? '#0a0a0a' : '#fff',
                color: mode === m ? '#3ECFF7' : '#888',
              }}
            >
              {m === 'businesses' ? 'Firms' : 'Individuals'}
            </button>
          ))}
        </div>

        {/* Discipline filters */}
        <div style={{ display: 'flex', gap: 4 }}>
          {disciplines.map((d) => (
            <button
              key={d}
              onClick={() => setFilter(d)}
              style={{
                padding: '7px 14px', fontSize: 10, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer',
                border: filter === d ? 'none' : '1.5px solid #e0e0e0',
                borderRadius: 0, fontFamily: "'Barlow', sans-serif",
                background: filter === d ? '#0a0a0a' : '#fff',
                color: filter === d ? '#fff' : '#888',
              }}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          placeholder="Search name, title, location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            marginLeft: 'auto', padding: '8px 14px', border: '1.5px solid #e0e0e0',
            fontSize: 13, fontFamily: "'Barlow', sans-serif", width: 260,
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex' }}>
        {/* List */}
        <div style={{
          flex: 1, padding: '20px 30px', overflow: 'auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 12, alignContent: 'start',
        }}>
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelected(item)}
              style={{
                background: selected?.id === item.id ? '#f8f8f8' : '#fff',
                border: selected?.id === item.id ? '1.5px solid #3ECFF7' : '1.5px solid #eee',
                padding: 16, cursor: 'pointer', transition: 'all .15s',
                display: 'flex', gap: 14, alignItems: 'flex-start',
              }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: mode === 'individuals' ? '50%' : 4,
                background: '#ddd', flexShrink: 0, overflow: 'hidden',
              }}>
                {item.photo_key && (
                  <img
                    src={photoUrl(item.photo_key)}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16,
                  fontWeight: 800, textTransform: 'uppercase', color: '#0a0a0a',
                  lineHeight: 1.2,
                }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                  {item.location}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {(item.tags || []).slice(0, 3).map((tag) => (
                    <span key={tag} style={{
                      fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: 1, padding: '3px 8px', background: '#f4f4f4',
                      color: '#666',
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div style={{
                  display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: '#888',
                }}>
                  <span>★ {item.rating}</span>
                  <span>{item.reviews} reviews</span>
                  <span>{item.projects_count} projects</span>
                </div>
              </div>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                background: item.available ? '#2ecc71' : '#ccc',
              }} />
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{
            width: 380, borderLeft: '1px solid #eee', padding: '24px',
            overflow: 'auto', flexShrink: 0,
          }}>
            <div style={{
              width: '100%', height: 200, borderRadius: 4, overflow: 'hidden',
              background: '#ddd', marginBottom: 20,
            }}>
              {selected.photo_key && (
                <img
                  src={`https://images.unsplash.com/${selected.photo_key}?w=600&h=400&fit=crop`}
                  alt={selected.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>

            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22,
              fontWeight: 900, textTransform: 'uppercase', color: '#0a0a0a',
            }}>
              {selected.name}
            </div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{selected.title}</div>
            <div style={{
              height: 4, width: 40, background: '#3ECFF7', margin: '12px 0 16px',
            }} />

            <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>
              {[
                ['Location', selected.location],
                ['Discipline', selected.discipline],
                ['Specialty', selected.subtype],
                ['Experience', selected.experience],
                ['Rating', `★ ${selected.rating} (${selected.reviews} reviews)`],
                ['Projects', selected.projects_count],
                ...(selected.size ? [['Team Size', selected.size]] : []),
                ...(selected.founded ? [['Founded', selected.founded]] : []),
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 10, letterSpacing: 1, color: '#888' }}>{label}</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{
                fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: 2, color: '#888', marginBottom: 8,
              }}>
                Expertise
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(selected.tags || []).map((tag) => (
                  <span key={tag} style={{
                    fontSize: 10, fontWeight: 700, padding: '5px 12px',
                    background: '#0a0a0a', color: '#3ECFF7',
                    textTransform: 'uppercase', letterSpacing: 1,
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div style={{
              display: 'flex', gap: 8, marginTop: 24,
            }}>
              <button
                onClick={() => setViewingProfile(selected)}
                style={{
                  flex: 1, padding: 12, background: '#3ECFF7', color: '#0a0a0a',
                  fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13,
                  fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1,
                  border: 'none', cursor: 'pointer',
                }}
              >
                View Full Profile
              </button>
              <button style={{
                padding: '12px 16px', background: 'none', border: '1.5px solid #0a0a0a',
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13,
                fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1,
                cursor: 'pointer', color: '#0a0a0a',
              }}>
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
