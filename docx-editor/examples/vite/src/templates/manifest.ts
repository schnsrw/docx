/**
 * Template registry for the Casual Editor home page.
 *
 * Add a new template by dropping a .docx into examples/vite/public/templates/
 * (or wherever `source.path` points) and flipping `kind: 'coming-soon'` to
 * `kind: 'docx'` with the matching path. See public/templates/README.md.
 */

export type TemplateSource =
  /** Built in code via createEmptyDocument(); no asset fetch. */
  | { kind: 'synthesized' }
  /** Fetched from `path` (relative to the dev/prod root) on selection. */
  | { kind: 'docx'; path: string }
  /** Card is rendered but disabled — the .docx hasn't been authored yet. */
  | { kind: 'coming-soon' };

export interface TemplateEntry {
  id: string;
  name: string;
  description: string;
  /** Material Symbols Outlined icon name (font is preloaded in index.html). */
  icon: string;
  /** Card-preview tint (a soft pastel matching the icon mood). */
  accent: string;
  source: TemplateSource;
  /** File name suggested when this template lands in the editor. */
  defaultFileName: string;
}

export const TEMPLATES: TemplateEntry[] = [
  {
    id: 'blank',
    name: 'Blank document',
    description: 'Start fresh with an empty page.',
    icon: 'description',
    accent: '#f1f5f9',
    source: { kind: 'synthesized' },
    defaultFileName: 'Untitled.docx',
  },
  {
    id: 'sample',
    name: 'Sample document',
    description: 'Multi-page sample with fonts, lists, tables, and images.',
    icon: 'feed',
    accent: '#dbeafe',
    source: { kind: 'docx', path: '/sample.docx' },
    defaultFileName: 'Sample.docx',
  },
  {
    id: 'form',
    name: 'Fillable form',
    description: 'Form with checkboxes and structured fields.',
    icon: 'check_box',
    accent: '#dcfce7',
    source: { kind: 'docx', path: '/Form025U.docx' },
    defaultFileName: 'Form.docx',
  },
  {
    id: 'resume',
    name: 'Resume',
    description: 'Single-column résumé layout.',
    icon: 'badge',
    accent: '#fef3c7',
    source: { kind: 'coming-soon' },
    defaultFileName: 'Resume.docx',
  },
  {
    id: 'letter',
    name: 'Letter',
    description: 'Formal business letter with header and footer.',
    icon: 'mail',
    accent: '#fce7f3',
    source: { kind: 'coming-soon' },
    defaultFileName: 'Letter.docx',
  },
  {
    id: 'meeting-notes',
    name: 'Meeting notes',
    description: 'Agenda + attendees + action items template.',
    icon: 'edit_note',
    accent: '#ede9fe',
    source: { kind: 'coming-soon' },
    defaultFileName: 'Meeting notes.docx',
  },
];
