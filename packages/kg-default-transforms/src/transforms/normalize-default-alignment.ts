/* c8 ignore next */
import type {ElementNode, Klass, LexicalEditor} from 'lexical';

/**
 * 'left' is treated as the default alignment in Koenig — it matches the
 * implicit rendering of an unaligned paragraph/heading, so we don't want to
 * persist it. Importing HTML from sources like Word that emit explicit
 * `text-align: left` would otherwise leave every paragraph with format='left'.
 */
/* c8 ignore next */
export function normalizeDefaultAlignmentTransform(node: ElementNode) {
    if (node.getFormatType() === 'left') {
        node.setFormat('');
    }
}

/* c8 ignore next */
export function registerNormalizeDefaultAlignmentTransform<T extends ElementNode>(editor: LexicalEditor, klass: Klass<T>) {
    if (editor.hasNodes([klass])) {
        return editor.registerNodeTransform(klass, normalizeDefaultAlignmentTransform);
    }

    return () => {};
}
