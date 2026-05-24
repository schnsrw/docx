/**
 * Generate the Casual Editor home-page templates as real .docx files.
 *
 * Outputs go to examples/vite/public/templates/, plus the showcase
 * sample to examples/vite/public/sample.docx (replacing the upstream
 * 'Welcome to DOCX JS Editor' branding with a Casual Editor flavour).
 *
 * Each template is built from a tiny JS DSL (h/p/r/bullet) that
 * lowers to WordprocessingML, then bundled into a minimal .docx via
 * JSZip — same pattern as scripts/make-*-fixture.mjs.
 *
 * Run: bun scripts/make-home-templates.mjs
 */

import JSZip from 'jszip';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, '..');
const TEMPLATE_DIR = join(projectRoot, 'examples/vite/public/templates');
const PUBLIC_DIR = join(projectRoot, 'examples/vite/public');
mkdirSync(TEMPLATE_DIR, { recursive: true });

// ---------- OOXML DSL ----------

/** XML-escape (the strict five entities; OOXML is XML 1.0). */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Run formatting → <w:rPr>. */
function rPr(opts = {}) {
  const parts = [];
  if (opts.bold) parts.push('<w:b/>');
  if (opts.italic) parts.push('<w:i/>');
  if (opts.underline) parts.push('<w:u w:val="single"/>');
  if (opts.color) parts.push(`<w:color w:val="${opts.color}"/>`);
  if (opts.sz) parts.push(`<w:sz w:val="${opts.sz}"/>`); // half-points
  if (opts.font) parts.push(`<w:rFonts w:ascii="${opts.font}" w:hAnsi="${opts.font}"/>`);
  return parts.length ? `<w:rPr>${parts.join('')}</w:rPr>` : '';
}

/** A run: text with optional formatting. */
function r(text, opts = {}) {
  const space = /^\s|\s$/.test(text) ? ' xml:space="preserve"' : '';
  return `<w:r>${rPr(opts)}<w:t${space}>${esc(text)}</w:t></w:r>`;
}

/** Paragraph formatting → <w:pPr>. */
function pPr(opts = {}) {
  const parts = [];
  if (opts.style) parts.push(`<w:pStyle w:val="${opts.style}"/>`);
  if (opts.align) parts.push(`<w:jc w:val="${opts.align}"/>`);
  if (opts.spaceBefore || opts.spaceAfter) {
    const before = opts.spaceBefore ?? 0;
    const after = opts.spaceAfter ?? 0;
    parts.push(`<w:spacing w:before="${before}" w:after="${after}"/>`);
  }
  if (opts.numId !== undefined && opts.ilvl !== undefined) {
    parts.push(
      `<w:numPr><w:ilvl w:val="${opts.ilvl}"/><w:numId w:val="${opts.numId}"/></w:numPr>`
    );
  }
  return parts.length ? `<w:pPr>${parts.join('')}</w:pPr>` : '';
}

/** A paragraph: array of runs + optional pPr opts. */
function p(runs, pOpts = {}) {
  return `<w:p>${pPr(pOpts)}${runs.join('')}</w:p>`;
}

/** Heading sugar. */
function h(text, level = 1, runOpts = {}) {
  return p([r(text, runOpts)], { style: `Heading${level}` });
}

/** Bullet-list item. numId=1 is the bullet list defined in numbering.xml. */
function bullet(runs, level = 0) {
  return p(runs, { style: 'ListBullet', numId: 1, ilvl: level });
}

/** Numbered list item. numId=2 is the decimal numbered list. */
function numbered(runs, level = 0) {
  return p(runs, { style: 'ListNumber', numId: 2, ilvl: level });
}

/** Small table helper — 3 columns wide, simple borders. */
function table(rows) {
  const tbl = [
    '<w:tbl>',
    '<w:tblPr>',
    '<w:tblStyle w:val="TableGrid"/>',
    '<w:tblW w:w="0" w:type="auto"/>',
    '<w:tblBorders>',
    '<w:top w:val="single" w:sz="4" w:color="CBD5E1"/>',
    '<w:left w:val="single" w:sz="4" w:color="CBD5E1"/>',
    '<w:bottom w:val="single" w:sz="4" w:color="CBD5E1"/>',
    '<w:right w:val="single" w:sz="4" w:color="CBD5E1"/>',
    '<w:insideH w:val="single" w:sz="4" w:color="CBD5E1"/>',
    '<w:insideV w:val="single" w:sz="4" w:color="CBD5E1"/>',
    '</w:tblBorders>',
    '</w:tblPr>',
    '<w:tblGrid>',
    ...rows[0].map(() => '<w:gridCol w:w="3120"/>'),
    '</w:tblGrid>',
  ];
  rows.forEach((row, ri) => {
    tbl.push('<w:tr>');
    row.forEach((cellText) => {
      const isHeader = ri === 0;
      const shading = isHeader ? '<w:shd w:val="clear" w:fill="EFF6FF"/>' : '';
      tbl.push(
        `<w:tc><w:tcPr><w:tcW w:w="3120" w:type="dxa"/>${shading}</w:tcPr>${p([
          r(cellText, isHeader ? { bold: true, color: '1E40AF' } : {}),
        ])}</w:tc>`
      );
    });
    tbl.push('</w:tr>');
  });
  tbl.push('</w:tbl>');
  return tbl.join('');
}

// ---------- shared .docx scaffolding ----------

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
</Types>`;

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const DOC_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>`;

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:sz w:val="22"/>
        <w:color w:val="1F2937"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="120" w:line="288" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:sz w:val="40"/><w:color w:val="0F172A"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:pPr><w:spacing w:before="200" w:after="80"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:sz w:val="28"/><w:color w:val="1E40AF"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:pPr><w:spacing w:before="160" w:after="60"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="334155"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListBullet"><w:name w:val="List Bullet"/></w:style>
  <w:style w:type="paragraph" w:styleId="ListNumber"><w:name w:val="List Number"/></w:style>
  <w:style w:type="table" w:styleId="TableGrid">
    <w:name w:val="Table Grid"/>
    <w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:color="CBD5E1"/></w:tblBorders></w:tblPr>
  </w:style>
</w:styles>`;

const NUMBERING = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0">
    <w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol"/></w:rPr></w:lvl>
    <w:lvl w:ilvl="1"><w:numFmt w:val="bullet"/><w:lvlText w:val="◦"/><w:pPr><w:ind w:left="1440" w:hanging="360"/></w:pPr></w:lvl>
  </w:abstractNum>
  <w:abstractNum w:abstractNumId="1">
    <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
  <w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>`;

const SECT_PR = `
  <w:sectPr>
    <w:pgSz w:w="12240" w:h="15840"/>
    <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    <w:docGrid w:linePitch="360"/>
  </w:sectPr>`;

function buildDocument(bodyXml) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
${bodyXml}
${SECT_PR}
  </w:body>
</w:document>`;
}

async function writeDocx(outPath, body) {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', CONTENT_TYPES);
  zip.file('_rels/.rels', RELS);
  zip.file('word/_rels/document.xml.rels', DOC_RELS);
  zip.file('word/document.xml', buildDocument(body));
  zip.file('word/styles.xml', STYLES);
  zip.file('word/numbering.xml', NUMBERING);
  const buf = await zip.generateAsync({ type: 'nodebuffer' });
  writeFileSync(outPath, buf);
  console.log(`  ${outPath.replace(projectRoot + '/', '')} (${buf.byteLength} bytes)`);
}

// ---------- templates ----------

const SAMPLE_BODY = [
  h('Welcome to Casual Editor', 1),
  p([
    r(
      'A casual, real-time collaborative .docx editor — built for the browser. Open Word documents, edit them in place, and save them back as .docx.'
    ),
  ]),
  h('What you can do', 2),
  bullet([r('Rich text — bold, italic, underline, strikethrough, colors, highlights')]),
  bullet([r('Headings, alignment, line spacing, indentation')]),
  bullet([r('Tables, borders, shading, merged cells')]),
  bullet([r('Images, hyperlinks, footnotes, headers and footers')]),
  bullet([r('Real-time collaboration (in the Docker build)')]),
  h('Formatting showcase', 2),
  p([
    r('Bold', { bold: true }),
    r(', '),
    r('italic', { italic: true }),
    r(', '),
    r('underline', { underline: true }),
    r(', '),
    r('coloured', { color: '2563EB' }),
    r(', and '),
    r('bold blue', { bold: true, color: '1E40AF' }),
    r('.'),
  ]),
  h('Sample table', 2),
  table([
    ['Feature', 'Status', 'Notes'],
    ['Editing', 'Available', 'WYSIWYG'],
    ['Round-trip save', 'Available', 'Preserves OOXML'],
    ['Real-time co-edit', 'Docker build', 'Yjs over WebSocket'],
  ]),
  p([r('')], {}),
  p([r('Click anywhere and start typing — this entire document is editable.', { italic: true, color: '64748B' })], { align: 'center' }),
].join('\n');

const RESUME_BODY = [
  p([r('Alex Morgan', { bold: true, sz: 56, color: '0F172A' })], { align: 'center' }),
  p(
    [r('Software Engineer · alex@example.com · (555) 123-4567 · linkedin.com/in/alexmorgan', { color: '64748B' })],
    { align: 'center' }
  ),
  h('Summary', 2),
  p([
    r(
      'Engineer with 7 years of experience building reliable web applications. Comfortable across the stack — TypeScript, Go, and React — with a particular interest in editor tooling and real-time collaboration.'
    ),
  ]),
  h('Experience', 2),
  p([r('Senior Software Engineer · Acme Corp', { bold: true })]),
  p([r('Jan 2022 – Present · Remote', { color: '64748B', italic: true })]),
  bullet([r('Led the migration from REST to GraphQL across 12 services; reduced p99 latency by 40%.')]),
  bullet([r('Built an offline-first sync layer used by 200k+ daily users.')]),
  bullet([r('Mentored two junior engineers through their first production launches.')]),
  p([r('')]),
  p([r('Software Engineer · BluePeak', { bold: true })]),
  p([r('Mar 2019 – Dec 2021 · San Francisco, CA', { color: '64748B', italic: true })]),
  bullet([r('Owned the document-sharing pipeline; took the on-call burn-down from 12 pages/week to under 2.')]),
  bullet([r('Shipped the customer-facing audit-log feature requested by enterprise tier customers.')]),
  h('Education', 2),
  p([r('B.S. Computer Science · State University · 2018', { bold: true })]),
  h('Skills', 2),
  p([
    r('TypeScript · React · Go · PostgreSQL · Redis · AWS · GitHub Actions · OpenTelemetry'),
  ]),
].join('\n');

const LETTER_BODY = [
  p([r('Alex Morgan')], { align: 'right' }),
  p([r('123 Example Lane')], { align: 'right' }),
  p([r('San Francisco, CA 94110')], { align: 'right' }),
  p([r('alex@example.com')], { align: 'right' }),
  p([r('')]),
  p([r('March 5, 2026')]),
  p([r('')]),
  p([r('Hiring Manager', { bold: true })]),
  p([r('Northern Light Studio')]),
  p([r('456 Market Street')]),
  p([r('San Francisco, CA 94103')]),
  p([r('')]),
  p([r('Dear Hiring Manager,', { bold: true })]),
  p([r('')]),
  p([
    r(
      'I am writing to express my interest in the Senior Engineer role at Northern Light Studio. With seven years of experience building collaborative web tools, I am especially drawn to your team’s focus on real-time editor experiences.'
    ),
  ]),
  p([
    r(
      'In my current role at Acme Corp, I led the migration of our document-sharing pipeline to a CRDT-based sync model. The new design cut conflict-resolution bugs by 70% and enabled features that simply weren’t possible with the locking-based approach we had inherited. I would love the chance to bring that same engineering judgment to your team.'
    ),
  ]),
  p([
    r(
      'I have attached my résumé and would welcome the opportunity to discuss how my background fits the role. Thank you for your time and consideration.'
    ),
  ]),
  p([r('')]),
  p([r('Sincerely,')]),
  p([r('')]),
  p([r('Alex Morgan')]),
].join('\n');

const MEETING_BODY = [
  h('Weekly Sync — March 5, 2026', 1),
  p([r('Attendees: ', { bold: true }), r('Alex Morgan, Priya Patel, Jordan Lee, Sam Rivera')]),
  p([
    r('Apologies: ', { bold: true }),
    r('Casey Kim (PTO)'),
  ]),
  h('Agenda', 2),
  numbered([r('Review last week’s action items')]),
  numbered([r('Document service M1 update')]),
  numbered([r('Open questions on WOPI integration')]),
  numbered([r('Demo: home-page template gallery')]),
  numbered([r('Round-table')]),
  h('Discussion', 2),
  p([r('M1 status', { bold: true })]),
  p([
    r(
      'Two-browser Yjs round-trip is wired locally. Alex is finishing the Go gateway scaffolding; Priya offered to pair on the snapshot worker on Thursday.'
    ),
  ]),
  p([r('Template gallery', { bold: true })]),
  p([
    r(
      'Home page lands first instead of an auto-blank doc. Initial templates are Blank, Sample, Form, plus three placeholder cards that turn live once we drop .docx files into the templates directory.'
    ),
  ]),
  h('Action items', 2),
  bullet([r('Alex — finish Go WS gateway scaffold by Thursday EOD')]),
  bullet([r('Priya — pair on snapshot worker design')]),
  bullet([r('Jordan — draft WOPI integration RFC; circulate Friday')]),
  bullet([r('Sam — author résumé + letter templates for the home gallery')]),
  h('Next meeting', 2),
  p([r('Thursday, March 12 · 10:00 AM PT · same Zoom link')]),
].join('\n');

const PROPOSAL_BODY = [
  p([r('Project Proposal', { bold: true, sz: 56, color: '0F172A' })], { align: 'center' }),
  p([r('Real-Time Document Collaboration Service', { color: '475569', sz: 28 })], {
    align: 'center',
  }),
  p([r('')]),
  h('Executive summary', 2),
  p([
    r(
      'We propose to build a real-time collaborative .docx editor service that lets multiple users edit the same Word document in the browser. The service will round-trip Microsoft Word files with high fidelity and integrate with existing document hosts via the WOPI protocol.'
    ),
  ]),
  h('Objectives', 2),
  bullet([r('Ship a single-user .docx editor with end-to-end round-trip fidelity ≥ 90%')]),
  bullet([r('Support two-or-more concurrent editors per document with sub-second sync')]),
  bullet([r('Integrate with at least one WOPI-compatible host (Nextcloud first)')]),
  bullet([r('Stay storage-less in our own service — host owns the file')]),
  h('Approach', 2),
  p([
    r(
      'Browser side, we extend an existing OOXML-preserving ProseMirror editor (MIT licensed) with the y-prosemirror Yjs plugin for CRDT-backed editing. Server side, a stateless Go gateway handles the y-websocket protocol, holds the in-memory Y.Doc per active room, and delegates persistence to the host via WOPI.'
    ),
  ]),
  h('Milestones', 2),
  table([
    ['Milestone', 'Target', 'Outcome'],
    ['M1 · Yjs round-trip', 'Apr 2026', 'Two browsers edit one document locally'],
    ['M2 · Go gateway v0', 'May 2026', 'Self-contained Docker image with upload + share link'],
    ['M3 · WOPI integration', 'Jul 2026', 'Real host (Nextcloud) reads and writes documents'],
    ['M4 · Public preview', 'Aug 2026', 'Stable release, fidelity score above 90%'],
  ]),
  p([r('')]),
  h('Open questions', 2),
  bullet([r('Cross-node fanout: sticky routing per docId, or Redis pubsub?')]),
  bullet([r('Tauri desktop build: ship alongside the web build, or separate cadence?')]),
  bullet([r('Pricing model for the hosted Docker distribution.')]),
].join('\n');

// ---------- run ----------

console.log('Writing Casual Editor templates:');
await writeDocx(join(PUBLIC_DIR, 'sample.docx'), SAMPLE_BODY);
await writeDocx(join(TEMPLATE_DIR, 'resume.docx'), RESUME_BODY);
await writeDocx(join(TEMPLATE_DIR, 'letter.docx'), LETTER_BODY);
await writeDocx(join(TEMPLATE_DIR, 'meeting-notes.docx'), MEETING_BODY);
await writeDocx(join(TEMPLATE_DIR, 'project-proposal.docx'), PROPOSAL_BODY);
console.log('done.');
