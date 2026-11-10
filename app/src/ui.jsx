import React from 'react';
import { adminContato } from './backend.js';

const paths = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  play: 'M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z',
  list: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  timer: 'M12 8v5l3 2M9 2h6M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  lock: 'M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM8 11V7a4 4 0 1 1 8 0v4',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M6 6l12 12M18 6 6 18',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  ext: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'M19 12H5M11 18l-6-6 6-6',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  cloud: 'M17.5 19H7a5 5 0 1 1 .9-9.92A6 6 0 0 1 19 11a4 4 0 0 1-1.5 8z',
  flag: 'M4 22V4M4 4h13l-2 4 2 4H4',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3',
};

export function Icon({ name, size = 18, stroke = 2, className = '' }) {
  const filled = name === 'play';
  return (
    <svg className={'icon ' + className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
      fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
}

export function GoogleLogo({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function Ring({ value, max, size = 92, label, tone = 'brand' }) {
  const pct = max ? Math.min(1, value / max) : 0;
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className={'ring tone-' + tone} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" />
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-value"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="ring-label"><strong>{Math.round(pct * 100)}%</strong>{label && <span>{label}</span>}</div>
    </div>
  );
}

export function Bar({ value, max, tone }) {
  const pct = max ? Math.round((100 * value) / max) : 0;
  return (
    <div className={'bar' + (tone ? ' tone-' + tone : '')} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: pct + '%' }} />
    </div>
  );
}

/** Aviso grande para quem ainda não tem o acesso completo. */
export function LockedNotice({ status, compact = false }) {
  const blocked = status === 'blocked';
  return (
    <div className={'locked-notice' + (compact ? ' compact' : '')} role="status">
      <div className="locked-icon"><Icon name="lock" size={compact ? 20 : 28} /></div>
      <div>
        <strong>{blocked ? 'Seu acesso está suspenso.' : 'Você está no modo amostra.'}</strong>
        <p>
          Para continuar, <b>converse com o administrador para liberar seu acesso completo</b>
          {adminContato ? <> · <span className="contato">{adminContato}</span></> : '.'}
          {!compact && ' Assim que ele aprovar, esta página libera tudo automaticamente — não precisa sair nem recarregar.'}
        </p>
      </div>
    </div>
  );
}

export function LockedOverlay({ status, children }) {
  return (
    <div className="locked-wrap">
      <div className="locked-content" aria-hidden="true" inert="">{children}</div>
      <div className="locked-overlay"><LockedNotice status={status} /></div>
    </div>
  );
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}
