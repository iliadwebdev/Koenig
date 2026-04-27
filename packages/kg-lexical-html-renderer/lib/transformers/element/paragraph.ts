import {$isParagraphNode} from 'lexical';
import alignmentClass from '../../utils/alignment-class';
import type {ElementNode} from 'lexical';
import type {ExportChildren} from '..';
import type {RendererOptions} from '@tryghost/kg-default-nodes';

module.exports = {
    export(node: ElementNode, options: RendererOptions, exportChildren: ExportChildren) {
        if (!$isParagraphNode(node)) {
            return null;
        }

        const className = alignmentClass(node.getFormatType());
        const classAttr = className ? ` class="${className}"` : '';

        return `<p${classAttr}>${exportChildren(node)}</p>`;
    }
};
