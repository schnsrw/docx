/**
 * Page Break Extension — block node representing a DOCX page break
 */

import { createNodeExtension } from '../create';
import { insertPageBreak } from '../../commands/pageBreak';

export const PageBreakExtension = createNodeExtension({
  name: 'pageBreak',
  schemaNodeName: 'pageBreak',
  nodeSpec: {
    group: 'block',
    atom: true,
    selectable: true,
    parseDOM: [{ tag: 'div.docx-page-break' }],
    toDOM() {
      return ['div', { class: 'docx-page-break' }];
    },
  },
  // Word convention — Cmd/Ctrl+Enter inserts a page break at the cursor.
  // Bound here (not in the base keymap) so a host that drops the
  // page-break node from its schema doesn't accidentally inherit the
  // shortcut as a no-op.
  onSchemaReady() {
    return {
      keyboardShortcuts: {
        'Mod-Enter': insertPageBreak,
      },
    };
  },
});
