'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

const DEFAULTS = [
  'Free shipping on orders above £250',
  'New Drop — Latest collection live',
  '7-day easy returns & exchanges',
];

let _cache = null;

export default function AnnounceBar({ messages: propMessages }) {
  const [messages, setMessages] = useState(propMessages || _cache || DEFAULTS);

  useEffect(() => {
    if (propMessages || _cache) return;
    fetch(`${API_URL}/settings`)
      .then((r) => r.json())
      .then((s) => {
        if (s.announcements?.length) {
          _cache = s.announcements;
          setMessages(s.announcements);
        }
      })
      .catch(() => {});
  }, []);

  const doubled = [...messages, ...messages];
  return (
    <div className="announce" aria-label="Announcements">
      <div className="announce-track">
        {doubled.map((m, i) => (
          <span key={i}>{m}</span>
        ))}
      </div>
    </div>
  );
}
