import {ParagraphNode, TextNode} from 'lexical';
import {registerNormalizeDefaultAlignmentTransform} from '../../src/index.js';
import {assertTransform, createEditor} from '../utils.js';
import type {LexicalEditor} from 'lexical';
import {HeadingNode} from '@lexical/rich-text';

describe('Normalize default alignment transform', function () {
    it('clears explicit left format on paragraphs', function () {
        const before = {
            root: {
                children: [
                    {
                        children: [
                            {
                                detail: 0,
                                format: 0,
                                mode: 'normal',
                                style: '',
                                text: 'Default',
                                type: 'extended-text',
                                version: 1
                            }
                        ],
                        direction: 'ltr',
                        format: 'left',
                        indent: 0,
                        type: 'paragraph',
                        version: 1
                    }
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'root',
                version: 1
            }
        };

        const after = {
            root: {
                children: [
                    {
                        children: [
                            {
                                detail: 0,
                                format: 0,
                                mode: 'normal',
                                style: '',
                                text: 'Default',
                                type: 'extended-text',
                                version: 1
                            }
                        ],
                        direction: 'ltr',
                        format: '',
                        indent: 0,
                        type: 'paragraph',
                        version: 1
                    }
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'root',
                version: 1
            }
        };

        const registerTransforms = (editor: LexicalEditor) => {
            registerNormalizeDefaultAlignmentTransform(editor, ParagraphNode);
        };

        const editor = createEditor();

        assertTransform(editor, registerTransforms, before, after);
    });

    it('handles being called for a node that isn\'t registered in the editor', function () {
        const unchangedState = {
            root: {
                children: [
                    {
                        children: [
                            {
                                detail: 0,
                                format: 0,
                                mode: 'normal',
                                style: '',
                                text: 'Default',
                                type: 'text',
                                version: 1
                            }
                        ],
                        direction: 'ltr',
                        format: 'left',
                        indent: 0,
                        type: 'paragraph',
                        version: 1
                    }
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'root',
                version: 1
            }
        };

        const registerTransforms = (editor: LexicalEditor) => {
            registerNormalizeDefaultAlignmentTransform(editor, HeadingNode);
        };

        const editor = createEditor({nodes: [ParagraphNode, TextNode]});

        assertTransform(editor, registerTransforms, unchangedState, unchangedState);
    });
});
