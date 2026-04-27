import {$isHeadingNode} from '@lexical/rich-text';
import alignmentClass from '../../utils/alignment-class';
import generateId from '../../utils/generate-id';
import type {RendererOptions} from '@tryghost/kg-default-nodes';
import type {ElementNode} from 'lexical';
import type {ExportChildren} from '..';

module.exports = {
    export(node: ElementNode, options: RendererOptions, exportChildren: ExportChildren) {
        if (!$isHeadingNode(node)) {
            return null;
        }

        const tag = node.getTag();
        const id = generateId(node.getTextContent(), options);
        const className = alignmentClass(node.getFormatType());
        const classAttr = className ? ` class="${className}"` : '';

        return `<${tag} id="${id}"${classAttr}>${exportChildren(node)}</${tag}>`;
    }
};
