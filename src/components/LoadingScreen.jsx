'use client';
import { useState, useEffect } from 'react';
import logoSrc from '../../public/logo.png';

export default function LoadingScreen() {
  const [phase, setPhase] = useState('in');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('out'), 2300);
    const t2 = setTimeout(() => setPhase('done'), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === 'done') return null;

  return (
    <div className={`splash splash-${phase}`} aria-hidden="true">
      <div className="splash-inner">
        <img src={logoSrc.src} alt="" className="splash-logo" />
        <div className="splash-bar"><div className="splash-fill" /></div>
      </div>
    </div>
  );
}
