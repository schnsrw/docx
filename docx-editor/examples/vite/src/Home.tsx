import React, { useRef, type CSSProperties } from 'react';
import { TEMPLATES, type TemplateEntry } from './templates/manifest';

interface HomeProps {
  onSelectTemplate: (entry: TemplateEntry) => void;
  onOpenFile: (file: File) => void;
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
    padding: '48px 24px 64px',
    boxSizing: 'border-box',
  },
  inner: {
    maxWidth: '1080px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '40px',
  },
  logo: {
    width: '36px',
    height: '36px',
  },
  brand: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#0f172a',
    letterSpacing: '-0.01em',
  },
  sectionLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#475569',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    marginBottom: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '20px',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '0',
    cursor: 'pointer',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.05s',
    textAlign: 'left',
    font: 'inherit',
    color: 'inherit',
  },
  cardDisabled: {
    cursor: 'not-allowed',
    opacity: 0.55,
  },
  cardPreview: {
    height: '140px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: '14px 16px 16px',
    borderTop: '1px solid #f1f5f9',
  },
  cardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginBottom: '4px',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#0f172a',
  },
  cardDescription: {
    fontSize: '12px',
    color: '#64748b',
    lineHeight: 1.45,
  },
  comingBadge: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#7c2d12',
    background: '#fed7aa',
    padding: '2px 6px',
    borderRadius: '4px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  openCard: {
    background: '#ffffff',
    border: '1px dashed #94a3b8',
    borderRadius: '10px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: '#475569',
    cursor: 'pointer',
    padding: '24px 16px',
    transition: 'border-color 0.15s, background 0.15s',
  },
  openLabel: {
    fontSize: '13px',
    fontWeight: 600,
  },
  openSub: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  hiddenInput: {
    display: 'none',
  },
};

function TemplateCard({
  entry,
  onSelect,
}: {
  entry: TemplateEntry;
  onSelect: (entry: TemplateEntry) => void;
}): React.JSX.Element {
  const comingSoon = entry.source.kind === 'coming-soon';
  return (
    <button
      type="button"
      style={{ ...styles.card, ...(comingSoon ? styles.cardDisabled : null) }}
      disabled={comingSoon}
      onClick={() => !comingSoon && onSelect(entry)}
      onMouseEnter={(e) => {
        if (!comingSoon) {
          e.currentTarget.style.borderColor = '#cbd5e1';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.06)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e2e8f0';
        e.currentTarget.style.boxShadow = 'none';
      }}
      data-testid={`template-card-${entry.id}`}
    >
      <div style={{ ...styles.cardPreview, background: entry.accent }}>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 48, color: '#475569' }}
          aria-hidden="true"
        >
          {entry.icon}
        </span>
      </div>
      <div style={styles.cardBody}>
        <div style={styles.cardTitleRow}>
          <span style={styles.cardTitle}>{entry.name}</span>
          {comingSoon && <span style={styles.comingBadge}>Coming soon</span>}
        </div>
        <div style={styles.cardDescription}>{entry.description}</div>
      </div>
    </button>
  );
}

export function Home({ onSelectTemplate, onOpenFile }: HomeProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onOpenFile(file);
    // Reset so picking the same file again re-fires onChange.
    e.target.value = '';
  };

  return (
    <div style={styles.page} data-testid="home-page">
      <div style={styles.inner}>
        <div style={styles.header}>
          <img src="/logo.svg" alt="" style={styles.logo} aria-hidden="true" />
          <div style={styles.brand}>Casual Editor</div>
        </div>

        <div style={styles.sectionLabel}>Start a new document</div>
        <div style={styles.grid}>
          {TEMPLATES.map((entry) => (
            <TemplateCard key={entry.id} entry={entry} onSelect={onSelectTemplate} />
          ))}
          <button
            type="button"
            style={styles.openCard}
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#2563eb';
              e.currentTarget.style.background = '#eff6ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#94a3b8';
              e.currentTarget.style.background = '#ffffff';
            }}
            data-testid="home-open-from-disk"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 36 }}
              aria-hidden="true"
            >
              upload_file
            </span>
            <span style={styles.openLabel}>Open from disk</span>
            <span style={styles.openSub}>.docx</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          style={styles.hiddenInput}
          onChange={handleFileChange}
          data-testid="home-file-input"
        />
      </div>
    </div>
  );
}
