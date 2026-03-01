import { useState } from 'react';

export default function ProProfile({ item, mode, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  const photoUrl = (key, w, h) =>
    key ? `https://images.unsplash.com/${key}?w=${w}&h=${h}&fit=crop` : null;

  const isBiz = mode === 'businesses';
  const bannerUrl = photoUrl(item.photo_key, 1200, 400) || 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&h=400&fit=crop';
  const avatarUrl = photoUrl(item.photo_key, 200, 200);
  const initials = item.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  const stars = (r) => {
    const full = Math.floor(r);
    return '★'.repeat(full) + (r % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.ceil(r));
  };

  const tabs = ['Overview', 'Projects', 'Reviews', 'Contact'];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#fff', zIndex: 99999,
      display: 'flex', flexDirection: 'column', fontFamily: "'Barlow', sans-serif",
      overflow: 'auto',
    }}>

      {/* Banner */}
      <div style={{ position: 'relative', height: 260, flexShrink: 0, overflow: 'hidden' }}>
        <img src={bannerUrl} alt="" style={{
          width: '100%', height: '100%', objectFit: 'cover',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(transparent 40%, rgba(0,0,0,.7))',
        }} />

        {/* Back button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, left: 16, width: 40, height: 40,
          borderRadius: '50%', background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(8px)',
          border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>←</button>
      </div>

      {/* Profile info bar */}
      <div style={{
        display: 'flex', gap: 20, padding: '0 32px', marginTop: -50,
        position: 'relative', zIndex: 2, alignItems: 'flex-end',
      }}>
        {/* Avatar */}
        <div style={{
          width: isBiz ? 100 : 100, height: isBiz ? 100 : 100,
          borderRadius: isBiz ? 12 : '50%', background: '#3ECFF7',
          border: '4px solid #fff', flexShrink: 0, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,.15)',
        }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32,
              fontWeight: 900, color: '#0a0a0a',
            }}>{initials}</span>
          )}
        </div>

        {/* Name block */}
        <div style={{ paddingBottom: 8, flex: 1 }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28,
            fontWeight: 900, textTransform: 'uppercase', color: '#0a0a0a',
            lineHeight: 1.1,
          }}>{item.name}</div>
          <div style={{ fontSize: 14, color: '#888', marginTop: 2 }}>{item.title}</div>
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>📍 {item.location}</div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
          <button style={{
            padding: '10px 24px', background: '#3ECFF7', color: '#0a0a0a',
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13,
            fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1,
            border: 'none', cursor: 'pointer',
          }}>Contact</button>
          <button style={{
            padding: '10px 24px', background: 'none', border: '1.5px solid #0a0a0a',
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13,
            fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1,
            cursor: 'pointer', color: '#0a0a0a',
          }}>Save</button>
        </div>
      </div>

      {/* Stat bar */}
      <div style={{
        display: 'flex', gap: 24, padding: '16px 32px', borderBottom: '1px solid #eee',
        marginTop: 12,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22,
            fontWeight: 900, color: '#0a0a0a',
          }}>{item.projects_count || 0}</div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>Projects</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22,
            fontWeight: 900, color: '#0a0a0a',
          }}>{item.experience || '—'}</div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>Experience</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22,
            fontWeight: 900, color: '#3ECFF7',
          }}>★ {item.rating}</div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>{item.reviews} Reviews</div>
        </div>
        {item.available && (
          <div style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2ecc71' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2ecc71', textTransform: 'uppercase', letterSpacing: 1 }}>Available</span>
          </div>
        )}
        {isBiz && item.size && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22,
              fontWeight: 900, color: '#0a0a0a',
            }}>{item.size}</div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>Team Size</div>
          </div>
        )}
        {isBiz && item.founded && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22,
              fontWeight: 900, color: '#0a0a0a',
            }}>{item.founded}</div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>Founded</div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', borderBottom: '2px solid #eee', padding: '0 32px',
      }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase())}
            style={{
              padding: '14px 24px', background: 'none', border: 'none',
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14,
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
              cursor: 'pointer', position: 'relative',
              color: activeTab === tab.toLowerCase() ? '#0a0a0a' : '#aaa',
              borderBottom: activeTab === tab.toLowerCase() ? '3px solid #0a0a0a' : '3px solid transparent',
              marginBottom: -2,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, padding: '24px 32px', overflow: 'auto' }}>

        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32 }}>
            {/* Left column */}
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{
                  fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: 2, color: '#888', marginBottom: 10,
                }}>About</div>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7 }}>
                  {item.name} is a {item.title?.toLowerCase()} based in {item.location}, specializing in {item.discipline?.toLowerCase()}.
                  {isBiz ? ` Founded in ${item.founded}, the firm has grown to ${item.size} employees and completed over ${item.projects_count} projects.` : ` With ${item.experience} of experience, they have completed ${item.projects_count} projects.`}
                </p>
              </div>

              <div style={{ marginBottom: 28 }}>
                <div style={{
                  fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: 2, color: '#888', marginBottom: 10,
                }}>Expertise</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(item.tags || []).map((tag) => (
                    <span key={tag} style={{
                      padding: '8px 16px', background: '#0a0a0a', color: '#3ECFF7',
                      fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12,
                      fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
                    }}>{tag}</span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <div style={{
                  fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: 2, color: '#888', marginBottom: 10,
                }}>Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#eee' }}>
                  {[
                    ['Discipline', item.discipline],
                    ['Specialty', item.subtype],
                    ['Location', item.location],
                    ['Experience', item.experience],
                    ...(isBiz ? [['Founded', item.founded], ['Team Size', item.size]] : []),
                    ...(item.bids ? [['Bids Submitted', item.bids]] : []),
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label} style={{
                      background: '#fff', padding: '12px 16px',
                    }}>
                      <div style={{
                        fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: 1.5, color: '#aaa', marginBottom: 4,
                      }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div>
              <div style={{
                background: '#f8f8f8', padding: 20, marginBottom: 16,
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: 2, color: '#888', marginBottom: 12,
                }}>Quick Info</div>
                <div style={{ fontSize: 13, color: '#555', lineHeight: 2 }}>
                  <div>📍 {item.location}</div>
                  <div>🏗️ {item.projects_count} Projects</div>
                  <div>⭐ {item.rating} ({item.reviews} reviews)</div>
                  {item.experience && <div>📅 {item.experience} experience</div>}
                  {item.available ? (
                    <div style={{ color: '#2ecc71', fontWeight: 700 }}>✓ Available for work</div>
                  ) : (
                    <div style={{ color: '#888' }}>Currently unavailable</div>
                  )}
                </div>
              </div>

              <button style={{
                width: '100%', padding: 14, background: '#3ECFF7', color: '#0a0a0a',
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14,
                fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1,
                border: 'none', cursor: 'pointer', marginBottom: 8,
              }}>Send Message</button>

              <button style={{
                width: '100%', padding: 14, background: '#0a0a0a', color: '#fff',
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14,
                fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1,
                border: 'none', cursor: 'pointer', marginBottom: 8,
              }}>Request Proposal</button>

              <button style={{
                width: '100%', padding: 14, background: 'none', color: '#0a0a0a',
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14,
                fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1,
                border: '1.5px solid #ddd', cursor: 'pointer',
              }}>Save to List</button>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20,
              fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2,
              marginBottom: 8,
            }}>Project Portfolio</div>
            <p style={{ fontSize: 13 }}>Project gallery coming soon. {item.name} has completed {item.projects_count} projects.</p>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20,
              fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2,
              marginBottom: 8,
            }}>Reviews</div>
            <p style={{ fontSize: 13 }}>{item.reviews} reviews with an average rating of {item.rating} stars.</p>
          </div>
        )}

        {activeTab === 'contact' && (
          <div style={{ maxWidth: 500 }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20,
              fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2,
              marginBottom: 20, color: '#0a0a0a',
            }}>Contact {item.name}</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{
                fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: 2, color: '#888', display: 'block', marginBottom: 4,
              }}>Your Message</label>
              <textarea style={{
                width: '100%', minHeight: 120, padding: '12px 14px',
                border: '1.5px solid #ddd', fontSize: 13,
                fontFamily: "'Barlow', sans-serif", outline: 'none',
                resize: 'vertical', boxSizing: 'border-box',
              }} placeholder={`Hi ${item.name.split(' ')[0]}, I'd like to discuss a potential project...`} />
            </div>
            <button style={{
              padding: '14px 32px', background: '#0a0a0a', color: '#3ECFF7',
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14,
              fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1,
              border: 'none', cursor: 'pointer',
            }}>Send Message</button>
          </div>
        )}
      </div>
    </div>
  );
}
