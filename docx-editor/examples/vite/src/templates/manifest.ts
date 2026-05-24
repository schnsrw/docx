/**
 * Template registry for the Casual Editor home page.
 *
 * Add a new template by dropping a .docx into examples/vite/public/templates/
 * (and an SVG thumbnail into public/templates/thumbs/) and pushing an entry
 * here. See public/templates/README.md.
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
  /** Material Symbols Outlined glyph (used as a small badge alongside the thumbnail). */
  icon: string;
  /** Path to the per-template SVG thumbnail in public/templates/thumbs/. */
  thumbnail: string;
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
    thumbnail: '/templates/thumbs/blank.svg',
    source: { kind: 'synthesized' },
    defaultFileName: 'Untitled.docx',
  },
  {
    id: 'sample',
    name: 'Sample document',
    description: 'Headings, lists, a small table, and a formatting showcase.',
    icon: 'feed',
    thumbnail: '/templates/thumbs/sample.svg',
    source: { kind: 'docx', path: '/sample.docx' },
    defaultFileName: 'Sample.docx',
  },
  {
    id: 'resume',
    name: 'Resume',
    description: 'Single-column résumé with experience and skills sections.',
    icon: 'badge',
    thumbnail: '/templates/thumbs/resume.svg',
    source: { kind: 'docx', path: '/templates/resume.docx' },
    defaultFileName: 'Resume.docx',
  },
  {
    id: 'letter',
    name: 'Letter',
    description: 'Formal letter with sender block, salutation, and closing.',
    icon: 'mail',
    thumbnail: '/templates/thumbs/letter.svg',
    source: { kind: 'docx', path: '/templates/letter.docx' },
    defaultFileName: 'Letter.docx',
  },
  {
    id: 'meeting-notes',
    name: 'Meeting notes',
    description: 'Attendees, agenda, discussion, and action items.',
    icon: 'edit_note',
    thumbnail: '/templates/thumbs/meeting-notes.svg',
    source: { kind: 'docx', path: '/templates/meeting-notes.docx' },
    defaultFileName: 'Meeting notes.docx',
  },
  {
    id: 'project-proposal',
    name: 'Project proposal',
    description: 'Executive summary, objectives, approach, and milestones.',
    icon: 'rocket_launch',
    thumbnail: '/templates/thumbs/project-proposal.svg',
    source: { kind: 'docx', path: '/templates/project-proposal.docx' },
    defaultFileName: 'Project proposal.docx',
  },
];
