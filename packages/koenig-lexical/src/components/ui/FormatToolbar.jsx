import KoenigComposerContext from '../../context/KoenigComposerContext';
import React from 'react';
import {$createAsideNode} from '../../nodes/AsideNode';
import {
    $createHeadingNode,
    $createQuoteNode,
    $isHeadingNode
} from '@lexical/rich-text';
import {
    $createParagraphNode,
    $getSelection,
    $isRangeSelection,
    FORMAT_ELEMENT_COMMAND,
    FORMAT_TEXT_COMMAND
} from 'lexical';
import {$getNearestNodeOfType} from '@lexical/utils';
import {$isListNode, ListNode} from '@lexical/list';
import {$setBlocksType} from '@lexical/selection';
import {HeadingNode, QuoteNode} from '@lexical/rich-text';
import {
    ToolbarMenu,
    ToolbarMenuItem,
    ToolbarMenuSeparator
} from './ToolbarMenu';
import {altOrOption, ctrlOrCmdSymbol, ctrlOrSymbol} from '../../utils/shortcutSymbols';
import {getSelectedNode} from '../../utils/getSelectedNode';

const blockTypeToBlockName = {
    bullet: 'Bulleted List',
    check: 'Check List',
    code: 'Code Block',
    h1: 'Heading 1',
    h2: 'Heading 2',
    h3: 'Heading 3',
    h4: 'Heading 4',
    h5: 'Heading 5',
    h6: 'Heading 6',
    number: 'Numbered List',
    paragraph: 'Normal',
    quote: 'Quote',
    'extended-quote': 'Quote',
    aside: 'Aside'
};

function quoteIcon(blockType = '') {
    if (blockType.endsWith?.('quote')) {
        return 'quoteOne';
    } else if (blockType.endsWith?.('aside')) {
        return 'quoteTwo';
    } else {
        return 'quote';
    }
}

export default function FormatToolbar({
    editor,
    isSnippetsEnabled,
    isLinkSelected,
    onLinkClick,
    onSnippetClick,
    hiddenFormats = []
}) {
    const [isBold, setIsBold] = React.useState(false);
    const [isItalic, setIsItalic] = React.useState(false);
    const [blockType, setBlockType] = React.useState('paragraph');
    const [alignment, setAlignment] = React.useState('left');
    const {cardConfig: {createSnippet}} = React.useContext(KoenigComposerContext);

    let hideHeading = false;
    if (!editor.hasNodes([HeadingNode])){
        hideHeading = true;
    }

    let hideQuotes = false;
    if (!editor.hasNodes([QuoteNode])){
        hideQuotes = true;
    }
    
    let hideSnippets = !isSnippetsEnabled || !createSnippet; // don't show snippet toolbar if we can't create them
    if (editor._parentEditor) {
        hideSnippets = true;
    }

    let hideBold = false;
    if (hiddenFormats.includes('bold')) {
        hideBold = true;
    }

    const updateState = React.useCallback(() => {
        editor.getEditorState().read(() => {
            // Should not to pop up the floating toolbar when using IME input
            if (editor.isComposing()) {
                return;
            }

            const selection = $getSelection();
            if (!$isRangeSelection(selection)) {
                return;
            }
            // update text format
            setIsBold(selection.hasFormat('bold'));
            setIsItalic(selection.hasFormat('italic'));

            const anchorNode = getSelectedNode(selection);
            const element = anchorNode.getKey() === 'root'
                ? anchorNode
                : anchorNode.getTopLevelElementOrThrow();
            const elementKey = element.getKey();
            const elementDOM = editor.getElementByKey(elementKey);

            if (elementDOM !== null) {
                if ($isListNode(element)) {
                    const parentList = $getNearestNodeOfType(anchorNode, ListNode);
                    const type = parentList
                        ? parentList.getListType()
                        : element.getListType();
                    setBlockType(type);
                } else {
                    const type = $isHeadingNode(element)
                        ? element.getTag()
                        : element.getType();

                    if (type in blockTypeToBlockName) {
                        setBlockType(type);
                    }
                }

                const format = typeof element.getFormatType === 'function'
                    ? element.getFormatType()
                    : '';
                setAlignment(format || 'left');
            }
        });
    }, [editor]);

    React.useEffect(() => {
        updateState();

        return editor.registerUpdateListener(() => {
            updateState();
        });
    }, [editor, updateState]);

    const formatParagraph = () => {
        if (blockType !== 'paragraph') {
            editor.update(() => {
                const selection = $getSelection();

                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createParagraphNode());
                }
            });
        }
    };

    const formatHeading = (headingSize) => {
        if (blockType !== headingSize) {
            editor.update(() => {
                const selection = $getSelection();

                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createHeadingNode(headingSize));
                }
            });
        }
    };

    const showAlignment = blockType === 'paragraph' || /^h[1-6]$/.test(blockType);

    const formatQuote = () => {
        editor.update(() => {
            const selection = $getSelection();

            if ($isRangeSelection(selection)) {
                if (blockType?.endsWith('quote')) {
                    $setBlocksType(selection, () => $createAsideNode());
                } else if (blockType?.endsWith?.('aside')) {
                    $setBlocksType(selection, () => $createParagraphNode());
                } else {
                    $setBlocksType(selection, () => $createQuoteNode());
                }
            }
        });
    };

    return (
        <ToolbarMenu>
            <ToolbarMenuItem
                data-kg-toolbar-button="bold"
                hide={hideBold}
                icon="bold"
                isActive={isBold}
                label="Bold"
                shortcutKeys={[ctrlOrCmdSymbol(), 'B']}
                onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
            />
            <ToolbarMenuItem
                data-kg-toolbar-button="italic"
                icon="italic"
                isActive={isItalic}
                label="Emphasize"
                shortcutKeys={[ctrlOrCmdSymbol(), 'I']}
                onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
            />
            <ToolbarMenuItem
                data-kg-toolbar-button="h2"
                hide={hideHeading}
                icon="headingTwo"
                isActive={blockType === 'h2'}
                label="Heading 2"
                shortcutKeys={[ctrlOrSymbol(), altOrOption(), '2']}
                onClick={() => (blockType === 'h2' ? formatParagraph() : formatHeading('h2'))}
            />
            <ToolbarMenuItem
                data-kg-toolbar-button="h3"
                hide={hideHeading}
                icon="headingThree"
                isActive={blockType === 'h3'}
                label="Heading 3"
                shortcutKeys={[ctrlOrSymbol(), altOrOption(), '3']}
                onClick={() => (blockType === 'h3' ? formatParagraph() : formatHeading('h3'))}
            />
            <ToolbarMenuSeparator hide={!showAlignment} />
            <ToolbarMenuItem
                data-kg-toolbar-button="align-left"
                hide={!showAlignment}
                icon="alignLeft"
                isActive={alignment === 'left'}
                label="Align left"
                onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, '')}
            />
            <ToolbarMenuItem
                data-kg-toolbar-button="align-center"
                hide={!showAlignment}
                icon="alignCenter"
                isActive={alignment === 'center'}
                label="Align center"
                onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}
            />
            <ToolbarMenuItem
                data-kg-toolbar-button="align-right"
                hide={!showAlignment}
                icon="alignRight"
                isActive={alignment === 'right'}
                label="Align right"
                onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}
            />
            <ToolbarMenuSeparator hide={hideQuotes} />
            <ToolbarMenuItem
                data-kg-toolbar-button="quote"
                hide={hideQuotes}
                icon={quoteIcon(blockType)}
                isActive={blockType.endsWith?.('quote') || blockType.endsWith?.('aside')}
                label="Quote"
                shortcutKeys={[ctrlOrSymbol(), 'Q']}
                onClick={formatQuote}
            />

            <ToolbarMenuItem
                data-kg-toolbar-button="link"
                icon="link"
                isActive={!!isLinkSelected}
                label="Link"
                shortcutKeys={[ctrlOrCmdSymbol(), 'K']}
                onClick={onLinkClick}
            />

            <ToolbarMenuSeparator hide={hideSnippets} />
            <ToolbarMenuItem
                data-kg-toolbar-button="snippet"
                hide={hideSnippets}
                icon="snippet"
                isActive={false}
                label="Save as snippet"
                onClick={onSnippetClick}
            />
        </ToolbarMenu>
    );
}
