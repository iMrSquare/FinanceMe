'use client';
import { useEffect } from 'react';

export default function RootPage() {
  useEffect(() => {
    const saved = localStorage.getItem('app-mode');
    window.location.replace(saved === 'hogar' ? '/hogar' : '/personal');
  }, []);

  return (
    <div style={{
      display: 'flex',
      height: '100svh',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-page)',
    }}>
      <div style={{
        width: 44,
        height: 44,
        border: '3px solid #6366f1',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 0.75s linear infinite',
      }} />
    </div>
  );
}
