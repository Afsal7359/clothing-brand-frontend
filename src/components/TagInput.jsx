'use client';

import { useState } from 'react';

/**
 * Chip-style multi-value input — type a value, press Enter (or comma, or the
 * Add button) and it becomes a removable chip.
 *
 * Replaces the comma-separated text inputs, which could not accept a comma at
 * all: their value was `list.join(', ')` while every keystroke re-split on
 * comma and dropped empty segments, so the comma was erased before it rendered.
 */
export default function TagInput({ value = [], onChange, placeholder = '', addLabel = 'Add', disabled = false }) {
  const [draft, setDraft] = useState('');

  /** Adds one or more values; a pasted "a, b, c" lands as three chips. */
  const commit = (raw) => {
    if (disabled) return;
    const parts = String(raw).split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    for (const p of parts) {
      // Case-insensitive de-dupe: "Black" and "black" are one colour.
      if (!next.some((v) => String(v).toLowerCase() === p.toLowerCase())) next.push(p);
    }
    onChange(next);
    setDraft('');
  };

  const removeAt = (i) => { if (!disabled) onChange(value.filter((_, j) => j !== i)); };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      // Enter must not submit the form this input sits inside.
      e.preventDefault();
      commit(draft);
    } else if (e.key === 'Backspace' && !draft && value.length) {
      removeAt(value.length - 1);
    }
  };

  return (
    <div className={`tag-input${disabled ? ' is-disabled' : ''}`}>
      {value.length > 0 && (
        <div className="tag-chips">
          {value.map((v, i) => (
            <span key={`${v}-${i}`} className="tag-chip">
              {v}
              {!disabled && (
                <button type="button" onClick={() => removeAt(i)} aria-label={`Remove ${v}`}>×</button>
              )}
            </span>
          ))}
        </div>
      )}
      <div className="tag-input-row">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          /* Commit on blur too, so a typed value isn't silently lost when the
             user goes straight to Save without pressing Enter. */
          onBlur={() => commit(draft)}
          placeholder={placeholder}
          disabled={disabled}
        />
        <button type="button" className="tag-add" onClick={() => commit(draft)} disabled={disabled || !draft.trim()}>
          {addLabel}
        </button>
      </div>
    </div>
  );
}
