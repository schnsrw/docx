import React, { useRef, useState, type CSSProperties } from 'react';
import { TEMPLATES, type TemplateEntry } from './templates/manifest';

interface HomeProps {
  onSelectTemplate: (entry: TemplateEntry) => void;
  onOpenFile: (file: File) => void;
}

const COLORS = {
  ink: '#0f172a',
  inkMuted: '#475569',
  inkSubtle: '#94a3b8',
  paper: '#ffffff',
  surface: '#f8fafc',
  surface2: '#f1f5f9',
  border: '#e2e8f0',
  borderHover: '#94a3b8',
  brand: '#2563eb',
  brandHover: '#1d4ed8',
  brandSoft: '#eff6ff',
};

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    background:
      'radial-gradient(1000px 600px at 12% -10%, #dbeafe 0%, transparent 55%),' +
      'radial-gradient(900px 500px at 100% 0%, #f3e8ff 0%, transparent 50%),' +
      `linear-gradient(180deg, ${COLORS.surface} 0%, ${COLORS.surface2} 100%)`,
    boxSizing: 'border-box',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", Roboto, "Helvetica Neue", Arial, sans-serif',
    color: COLORS.ink,
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 40px',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  brandLogo: {
    width: '32px',
    height: '32px',
  },
  brandName: {
    fontSize: '17px',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    color: COLORS.ink,
  },
  topRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '13px',
    color: COLORS.inkMuted,
  },
  topLink: {
    color: COLORS.inkMuted,
    textDecoration: 'none',
    padding: '6px 10px',
    borderRadius: '6px',
    transition: 'background 0.15s, color 0.15s',
  },
  hero: {
    maxWidth: '1120px',
    margin: '0 auto',
    padding: '40px 40px 24px',
    textAlign: 'left',
  },
  heroEyebrow: {
    display: 'inline-block',
    fontSize: '12px',
    fontWeight: 600,
    color: COLORS.brand,
    background: COLORS.brandSoft,
    padding: '4px 10px',
    borderRadius: '999px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    marginBottom: '14px',
  },
  heroTitle: {
    fontSize: '40px',
    fontWeight: 700,
    letterSpacing: '-0.025em',
    lineHeight: 1.1,
    color: COLORS.ink,
    margin: 0,
  },
  heroLede: {
    marginTop: '12px',
    fontSize: '17px',
    color: COLORS.inkMuted,
    lineHeight: 1.5,
    maxWidth: '640px',
  },
  inner: {
    maxWidth: '1120px',
    margin: '0 auto',
    padding: '24px 40px 64px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    margin: '12px 0 18px',
  },
  sectionLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: COLORS.inkMuted,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  sectionSub: {
    fontSize: '13px',
    color: COLORS.inkSubtle,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(232px, 1fr))',
    gap: '20px',
  },
  card: {
    background: COLORS.paper,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '12px',
    padding: '0',
    cursor: 'pointer',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transition:
      'border-color 0.18s, box-shadow 0.18s, transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1)',
    textAlign: 'left',
    font: 'inherit',
    color: 'inherit',
    position: 'relative',
  },
  cardHover: {
    borderColor: '#cbd5e1',
    boxShadow:
      '0 12px 24px -12px rgba(15, 23, 42, 0.15), 0 4px 6px -2px rgba(15, 23, 42, 0.04)',
    transform: 'translateY(-2px)',
  },
  cardThumb: {
    aspectRatio: '200 / 140',
    display: 'block',
    width: '100%',
    background: COLORS.surface,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  cardBody: {
    padding: '14px 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  cardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  cardIconBadge: {
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.inkMuted,
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: COLORS.ink,
    letterSpacing: '-0.005em',
  },
  cardDescription: {
    fontSize: '12.5px',
    color: COLORS.inkMuted,
    lineHeight: 1.45,
  },
  openCard: {
    background: COLORS.paper,
    border: `1px dashed ${COLORS.borderHover}`,
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    color: COLORS.inkMuted,
    cursor: 'pointer',
    padding: '28px 16px',
    transition: 'border-color 0.18s, background 0.18s, color 0.18s',
    font: 'inherit',
    textAlign: 'center',
  },
  openLabel: {
    fontSize: '14px',
    fontWeight: 600,
  },
  openSub: {
    fontSize: '12px',
    color: COLORS.inkSubtle,
  },
  hiddenInput: {
    display: 'none',
  },
  footer: {
    maxWidth: '1120px',
    margin: '0 auto',
    padding: '32px 40px',
    fontSize: '12px',
    color: COLORS.inkSubtle,
    borderTop: `1px solid ${COLORS.border}`,
    display: 'flex',
    justifyContent: 'space-between',
  },
};

function TemplateCard({
  entry,
  onSelect,
}: {
  entry: TemplateEntry;
  onSelect: (entry: TemplateEntry) => void;
}): React.JSX.Element {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      style={{ ...styles.card, ...(hovered ? styles.cardHover : null) }}
      onClick={() => onSelect(entry)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      data-testid={`template-card-${entry.id}`}
      aria-label={`${entry.name}: ${entry.description}`}
    >
      <img
        src={entry.thumbnail}
        alt=""
        style={styles.cardThumb}
        aria-hidden="true"
        draggable={false}
      />
      <div style={styles.cardBody}>
        <div style={styles.cardTitleRow}>
          <span style={styles.cardIconBadge} aria-hidden="true">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {entry.icon}
            </span>
          </span>
          <span style={styles.cardTitle}>{entry.name}</span>
        </div>
        <div style={styles.cardDescription}>{entry.description}</div>
      </div>
    </button>
  );
}

function OpenFromDiskCard({
  onPick,
}: {
  onPick: () => void;
}): React.JSX.Element {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      style={{
        ...styles.openCard,
        ...(hovered
          ? {
              borderColor: COLORS.brand,
              background: COLORS.brandSoft,
              color: COLORS.brandHover,
            }
          : null),
      }}
      onClick={onPick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      data-testid="home-open-from-disk"
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 32, color: hovered ? COLORS.brand : COLORS.inkMuted }}
        aria-hidden="true"
      >
        upload_file
      </span>
      <span style={styles.openLabel}>Open from disk</span>
      <span style={styles.openSub}>.docx</span>
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
      <header style={styles.topBar}>
        <div style={styles.brandRow}>
          <img src="/logo.svg" alt="" style={styles.brandLogo} aria-hidden="true" />
          <div style={styles.brandName}>Casual Editor</div>
        </div>
        <div style={styles.topRight}>
          <a
            href="https://github.com/schnsrw/docx"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.topLink}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = COLORS.ink;
              e.currentTarget.style.background = COLORS.surface2;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = COLORS.inkMuted;
              e.currentTarget.style.background = 'transparent';
            }}
          >
            GitHub
          </a>
        </div>
      </header>

      <section style={styles.hero}>
        <div style={styles.heroEyebrow}>Casual Editor</div>
        <h1 style={styles.heroTitle}>
          Open a Word document.
          <br />
          Edit it like it&rsquo;s the web.
        </h1>
        <p style={styles.heroLede}>
          A real-time collaborative <code>.docx</code> editor that runs in the browser.
          Pick a template to start, or drop in your own document.
        </p>
      </section>

      <section style={styles.inner}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionLabel}>Start a new document</div>
          <div style={styles.sectionSub}>{TEMPLATES.length} templates · or open your own</div>
        </div>
        <div style={styles.grid}>
          {TEMPLATES.map((entry) => (
            <TemplateCard key={entry.id} entry={entry} onSelect={onSelectTemplate} />
          ))}
          <OpenFromDiskCard onPick={() => fileInputRef.current?.click()} />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          style={styles.hiddenInput}
          onChange={handleFileChange}
          data-testid="home-file-input"
        />
      </section>

      <footer style={styles.footer}>
        <span>MIT-licensed fork of eigenpal/docx-editor · stateless real-time backend in Go</span>
        <span>
          <a
            href="https://github.com/schnsrw/docx"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: COLORS.inkMuted, textDecoration: 'none' }}
          >
            schnsrw/docx
          </a>
        </span>
      </footer>
    </div>
  );
}
