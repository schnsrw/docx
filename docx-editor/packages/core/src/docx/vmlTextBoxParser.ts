/**
 * VML Text Box Parser
 *
 * Legacy Vector Markup Language (VML) shape format used by older Word
 * versions (and some current Word saves) for text frames:
 *
 *   <w:r>
 *     <w:pict>
 *       <v:group>?           [optional grouping element]
 *         <v:shape type="#_x0000_t202" ...>
 *           <v:textbox inset="...">
 *             <w:txbxContent>
 *               <w:p>...</w:p>
 *             </w:txbxContent>
 *           </v:textbox>
 *         </v:shape>
 *       </v:group>?
 *     </w:pict>
 *   </w:r>
 *
 * The shape type `#_x0000_t202` is Microsoft's well-known shape id for
 * text frames. Decorative VML shapes (lines, ovals, paths) carry other
 * type ids or no type at all and are not treated as text frames.
 *
 * The modern DrawingML equivalent (`<wps:wsp>` / `<wps:txbx>`) is parsed
 * by `textBoxParser.ts`. This module exists separately so the legacy
 * code path can be skipped quickly when only DrawingML is present.
 */

import type { TextBox, Paragraph, ImageSize } from '../types/content';
import {
  findDeep,
  findChild,
  getChildElements,
  getLocalName,
  getAttribute,
  type XmlElement,
} from './xmlParser';
import type { ParagraphParserFn } from './textBoxParser';

const VML_TEXTBOX_SHAPE_TYPE = '#_x0000_t202';

/**
 * Does this `<w:pict>` element contain a VML text frame we can parse?
 * Walks direct children + one level of grouping (`<v:group>`).
 */
export function isVmlTextBoxPict(pictEl: XmlElement): boolean {
  return findVmlTextBoxShape(pictEl) !== null;
}

/**
 * Locate the `<v:shape type="#_x0000_t202">` inside a `<w:pict>`.
 * Returns null if no text-frame shape is present.
 */
function findVmlTextBoxShape(pictEl: XmlElement): XmlElement | null {
  const children = getChildElements(pictEl);
  for (const child of children) {
    const local = getLocalName(child.name ?? '');
    if (local === 'shape' && isTextBoxShape(child)) return child;
    if (local === 'group') {
      const inGroup = findInGroup(child);
      if (inGroup) return inGroup;
    }
  }
  return null;
}

function findInGroup(groupEl: XmlElement): XmlElement | null {
  for (const child of getChildElements(groupEl)) {
    if (getLocalName(child.name ?? '') === 'shape' && isTextBoxShape(child)) return child;
  }
  return null;
}

function isTextBoxShape(shapeEl: XmlElement): boolean {
  const type = getAttribute(shapeEl, null, 'type');
  return type === VML_TEXTBOX_SHAPE_TYPE;
}

/**
 * Parse a `<w:pict>` element to a TextBox structure.
 * Size is derived best-effort from the `<v:shape>`'s `style` attribute
 * (CSS-like declarations using `pt`, `px`, or unit-less twips).
 * Returns null if no text-frame shape or `<w:txbxContent>` is found.
 */
export function parseVmlTextBox(
  pictEl: XmlElement,
  parseParagraph: ParagraphParserFn
): TextBox | null {
  const shape = findVmlTextBoxShape(pictEl);
  if (!shape) return null;

  const textBoxEl = findChild(shape, 'v', 'textbox');
  if (!textBoxEl) return null;

  const txbxContent = findDeep(textBoxEl, 'w', 'txbxContent');
  if (!txbxContent) return null;

  // Parse inner paragraphs.
  const content: Paragraph[] = [];
  for (const child of getChildElements(txbxContent)) {
    const local = getLocalName(child.name ?? '');
    if (local === 'p') {
      content.push(parseParagraph(child, null, null, null, null));
    }
  }

  const size = parseVmlShapeSize(shape);
  const id = getAttribute(shape, null, 'id') ?? undefined;

  return {
    type: 'textBox',
    id,
    size,
    content,
  };
}

/**
 * Extract width/height from the VML shape's `style` attribute. Defaults
 * to a reasonable rendering size when unparseable so the user still sees
 * the content rather than a zero-area box.
 */
function parseVmlShapeSize(shapeEl: XmlElement): ImageSize {
  const DEFAULT_WIDTH_EMU = 2_200_000;
  const DEFAULT_HEIGHT_EMU = 500_000;

  const style = getAttribute(shapeEl, null, 'style') ?? '';
  const decls = new Map<string, string>();
  for (const part of style.split(';')) {
    const [k, v] = part.split(':');
    if (k && v) decls.set(k.trim().toLowerCase(), v.trim());
  }

  const widthEmu = lengthDeclToEmu(decls.get('width')) ?? DEFAULT_WIDTH_EMU;
  const heightEmu = lengthDeclToEmu(decls.get('height')) ?? DEFAULT_HEIGHT_EMU;

  return { width: widthEmu, height: heightEmu };
}

/**
 * Convert a VML length declaration to EMUs. VML accepts `Npt`, `Npx`,
 * or a bare number (interpreted as twips per Word's VML convention).
 */
function lengthDeclToEmu(value: string | undefined): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  const num = parseFloat(trimmed);
  if (!Number.isFinite(num)) return null;

  if (trimmed.endsWith('pt')) {
    // 1 pt = 12700 EMU
    return Math.round(num * 12700);
  }
  if (trimmed.endsWith('px')) {
    // 1 px ≈ 0.75 pt at 96dpi → 9525 EMU
    return Math.round(num * 9525);
  }
  // Bare number → twips
  // 1 twip = 635 EMU
  return Math.round(num * 635);
}
