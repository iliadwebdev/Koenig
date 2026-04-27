import {HeadingNode} from '@lexical/rich-text';
import {formatFromClassList} from '../utils/alignment';

// Since the HeadingNode is foundational to Lexical rich-text, only using a
// custom HeadingNode is undesirable as it means every package would need to
// be updated to work with the custom node. Instead we can use Lexical's node
// override/replacement mechanism to extend the default with our custom parsing
// logic.
//
// https://lexical.dev/docs/concepts/serialization#handling-extended-html-styling

export const extendedHeadingNodeReplacement = {replace: HeadingNode, with: node => new ExtendedHeadingNode(node.__tag)};

export class ExtendedHeadingNode extends HeadingNode {
    constructor(tag, key) {
        super(tag, key);
    }

    static getType() {
        return 'extended-heading';
    }

    static clone(node) {
        return new ExtendedHeadingNode(node.__tag, node.__key);
    }

    static importDOM() {
        const importers = HeadingNode.importDOM();
        const patched = {};
        for (const tag of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
            if (importers?.[tag]) {
                patched[tag] = patchHeadingAlignment(importers[tag]);
            }
        }
        return {
            ...importers,
            ...patched,
            p: patchParagraphConversion(importers?.p)
        };
    }

    static importJSON(serializedNode) {
        return HeadingNode.importJSON(serializedNode);
    }

    exportJSON() {
        const json = super.exportJSON();
        json.type = 'extended-heading';
        return json;
    }
}

function patchHeadingAlignment(originalConverter) {
    return (domNode) => {
        const original = originalConverter?.(domNode);
        if (!original) {
            return null;
        }

        const originalConversionFn = original.conversion;

        return {
            ...original,
            // Bump priority above the stock HeadingNode converter (priority 0)
            // so this wrapped version wins when both are registered.
            priority: Math.max(original.priority ?? 0, 1),
            conversion: (innerDomNode) => {
                const result = originalConversionFn(innerDomNode);
                if (!result?.node) {
                    return result;
                }

                const format = formatFromClassList(innerDomNode.classList);
                if (format && typeof result.node.setFormat === 'function') {
                    result.node.setFormat(format);
                }

                return result;
            }
        };
    };
}

function patchParagraphConversion(originalDOMConverter) {
    return (node) => {
        // Original matches Google Docs p node to a null conversion so it's
        // child span is parsed as a heading. Don't prevent that here
        const original = originalDOMConverter?.(node);
        if (original) {
            return original;
        }

        const p = node;

        // Word uses paragraphs with role="heading" to represent headings
        // and an aria-level="x" to represent the heading level
        const hasAriaHeadingRole = p.getAttribute('role') === 'heading';
        const hasAriaLevel = p.getAttribute('aria-level');

        if (hasAriaHeadingRole && hasAriaLevel) {
            const level = parseInt(hasAriaLevel, 10);
            if (level > 0 && level < 7) {
                return {
                    conversion: () => {
                        return {
                            node: new ExtendedHeadingNode(`h${level}`)
                        };
                    },
                    priority: 1
                };
            }
        }

        return null;
    };
}
