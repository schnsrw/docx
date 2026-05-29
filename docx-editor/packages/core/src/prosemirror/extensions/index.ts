/**
 * Extension System — Barrel Export
 */

// Types
export { Priority } from './types';
export type {
  ExtensionPriority,
  ExtensionContext,
  CommandMap,
  KeyboardShortcutMap,
  ExtensionRuntime,
  ExtensionConfig,
  NodeExtensionConfig,
  MarkExtensionConfig,
  Extension,
  NodeExtension,
  MarkExtension,
  AnyExtension,
  ExtensionDefinition,
  NodeExtensionDefinition,
  MarkExtensionDefinition,
} from './types';

// Factories
export { createExtension, createNodeExtension, createMarkExtension } from './create';

// Manager
export { ExtensionManager } from './ExtensionManager';

// StarterKit
export { createStarterKit } from './StarterKit';
export type { StarterKitOptions } from './StarterKit';

// Runtime preferences — read by SmartQuotes/Autocorrect each keystroke.
// Tools → Preferences dialog mutates these; the React layer persists to
// localStorage on mount and on change.
export { editorPreferences, setEditorPreference } from './features/editorPreferences';
export type { EditorPreferences } from './features/editorPreferences';

// Re-export specific extensions consumers commonly customize
export {
  ParagraphChangeTrackerExtension,
  getChangedParagraphIds,
  hasStructuralChanges,
  hasUntrackedChanges,
  getChangedBlockTypes,
  hasNonParagraphBlockChanges,
  clearTrackedChanges,
} from './features/ParagraphChangeTrackerExtension';
export {
  TableNodeExtension,
  TableRowExtension,
  TableCellExtension,
  TableHeaderExtension,
} from './nodes/TableExtension';
export type { TableContextInfo } from './nodes/TableExtension';
