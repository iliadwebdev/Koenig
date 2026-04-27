import {$createParagraphNode} from 'lexical';
import {formatFromClassList} from '../utils/alignment';

export default {
    import: {
        p: (node) => {
            const isGoogleDocs = !!node.closest('[id^="docs-internal-guid-"]');

            // Google docs wraps dividers in paragraphs, without text content
            // Remove them to avoid creating empty paragraphs in the editor
            if (isGoogleDocs && node.textContent === '') {
                return {
                    conversion: () => null,
                    priority: 1
                };
            }

            const format = formatFromClassList(node.classList);
            if (format) {
                return {
                    conversion: (domNode) => {
                        const paragraph = $createParagraphNode();
                        paragraph.setFormat(format);
                        if (domNode.style) {
                            const indent = parseInt(domNode.style.textIndent, 10) / 20;
                            if (indent > 0) {
                                paragraph.setIndent(indent);
                            }
                        }
                        return {node: paragraph};
                    },
                    priority: 1
                };
            }

            return null;
        }
    }
};
