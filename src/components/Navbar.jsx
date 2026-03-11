import React from 'react';

export default function Navbar({ onHome, phase }) {
    return (
        <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(6,6,8,0.9)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
            <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                <button onClick={onHome} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <div style={{ width: 24, height: 24, background: '#ef4444', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(239,68,68,0.5)' }}>
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                            <rect x="0" y="0" width="5.5" height="5.5" rx="1.2" fill="#fff" />
                            <rect x="8.5" y="0" width="5.5" height="5.5" rx="1.2" fill="#fff" />
                            <rect x="0" y="8.5" width="5.5" height="5.5" rx="1.2" fill="#fff" />
                            <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.2" fill="#fff" />
                        </svg>
                    </div>
                    <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 12, fontWeight: 700, color: '#f0f0f0', letterSpacing: '0.05em' }}>
                        LEETCODE ARENA
                    </span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    {phase === 2 && (
                        <button onClick={onHome} style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 10, letterSpacing: '0.12em', color: '#555', background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, padding: '6px 14px', cursor: 'pointer' }}>
                            ← ARENA
                        </button>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, padding: '5px 12px' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,0.8)', flexShrink: 0 }} />
                        <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 10, color: '#555', letterSpacing: '0.1em' }}>4.8M ONLINE</span>
                    </div>
                </div>
            </div>
        </nav>
    );
}
