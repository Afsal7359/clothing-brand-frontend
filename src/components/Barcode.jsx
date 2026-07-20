'use client';

import { useMemo } from 'react';
import { ean13SVG, isValidEan13 } from '@/lib/ean13';

/**
 * Renders a real, scannable EAN-13 barcode.
 * Falls back to a plain code display if the value isn't a valid EAN-13.
 */
export default function Barcode({ value, width = 240, height = 70, showText = true, style }) {
  const svg = useMemo(
    () => (value && isValidEan13(value) ? ean13SVG(value, { width, height, showText }) : ''),
    [value, width, height, showText]
  );

  if (!value) {
    return (
      <div style={{ fontSize: 12, color: 'var(--ink-mute)', fontFamily: 'var(--mono)', ...style }}>
        No barcode yet — generated automatically on save.
      </div>
    );
  }

  if (!svg) {
    return (
      <div style={{ fontSize: 12, color: 'var(--ink-mute)', fontFamily: 'var(--mono)', ...style }}>
        {value} <span style={{ color: '#b45309' }}>(not a valid EAN-13)</span>
      </div>
    );
  }

  return <div style={style} dangerouslySetInnerHTML={{ __html: svg }} />;
}
