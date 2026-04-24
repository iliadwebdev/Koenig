import GIFIcon from '../assets/icons/kg-card-type-gif.svg?react';
import ImageCardIcon from '../assets/icons/kg-card-type-image.svg?react';
import UnsplashIcon from '../assets/icons/kg-card-type-unsplash.svg?react';
import {$generateHtmlFromNodes} from '@lexical/html';
import {ImageNode as BaseImageNode} from '@tryghost/kg-default-nodes';
import {ImageNodeComponent} from './ImageNodeComponent';
import {KoenigCardWrapper, MINIMAL_NODES} from '../index.js';
import {OPEN_TENOR_SELECTOR_COMMAND, OPEN_UNSPLASH_SELECTOR_COMMAND} from '../plugins/KoenigSelectorPlugin.jsx';
import {cleanBasicHtml} from '@tryghost/kg-clean-basic-html';
import {createCommand} from 'lexical';
import {populateNestedEditor, setupNestedEditor} from '../utils/nested-editors';

export const INSERT_IMAGE_COMMAND = createCommand();

export const MAX_WIDTH_PX_MIN = 50;
export const MAX_WIDTH_PX_MAX = 1600;

function normalizeMaxWidthPx(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    const parsed = typeof value === 'number' ? value : parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
        return null;
    }
    const rounded = Math.round(parsed);
    if (rounded < MAX_WIDTH_PX_MIN) {
        return MAX_WIDTH_PX_MIN;
    }
    if (rounded > MAX_WIDTH_PX_MAX) {
        return MAX_WIDTH_PX_MAX;
    }
    return rounded;
}

export class ImageNode extends BaseImageNode {
    // transient properties used to control node behaviour
    __triggerFileDialog = false;
    __previewSrc = null;
    __captionEditor;
    __captionEditorInitialState;
    __maxWidthPx = null;

    static kgMenu = [{
        label: 'Image',
        desc: 'Upload, or embed with /image [url]',
        Icon: ImageCardIcon,
        insertCommand: INSERT_IMAGE_COMMAND,
        insertParams: {
            triggerFileDialog: true
        },
        matches: ['image', 'img'],
        queryParams: ['src'],
        priority: 1,
        shortcut: '/image'
    },
    {
        section: 'Embeds',
        label: 'Unsplash',
        desc: '/unsplash [search term or url]',
        Icon: UnsplashIcon,
        insertCommand: OPEN_UNSPLASH_SELECTOR_COMMAND,
        insertParams: {
            triggerFileDialog: false
        },
        isHidden: ({config}) => !config?.unsplash,
        matches: ['unsplash', 'uns'],
        queryParams: ['src'],
        priority: 3,
        shortcut: '/unsplash'
    },
    {
        label: 'GIF',
        desc: 'Search and embed gifs',
        Icon: GIFIcon,
        insertCommand: OPEN_TENOR_SELECTOR_COMMAND,
        insertParams: {
            triggerFileDialog: false
        },
        matches: ['gif', 'giphy', 'tenor'],
        priority: 17,
        queryParams: ['src'],
        isHidden: ({config}) => !config?.tenor,
        shortcut: '/gif'
    }];

    static uploadType = 'image';

    constructor(dataset = {}, key) {
        super(dataset, key);

        const {previewSrc, triggerFileDialog, initialFile, selector, isImageHidden, maxWidthPx} = dataset;

        this.__maxWidthPx = normalizeMaxWidthPx(maxWidthPx);

        this.__previewSrc = previewSrc || '';
        // don't trigger the file dialog when rendering if we've already been given a url
        this.__triggerFileDialog = (!dataset.src && triggerFileDialog) || false;

        // passed via INSERT_MEDIA_COMMAND on drag+drop or paste
        this.__initialFile = initialFile || null;

        this.__selector = selector;
        this.__isImageHidden = isImageHidden;

        setupNestedEditor(this, '__captionEditor', {editor: dataset.captionEditor, nodes: MINIMAL_NODES});

        // populate nested editors on initial construction
        if (!dataset.captionEditor && dataset.caption) {
            populateNestedEditor(this, '__captionEditor', `${dataset.caption}`); // we serialize with no wrapper
        }
    }

    getIcon() {
        return ImageCardIcon;
    }

    getDataset() {
        const dataset = super.getDataset();

        dataset.__previewSrc = this.__previewSrc;
        dataset.__triggerFileDialog = this.__triggerFileDialog;

        // client-side only data properties such as nested editors
        const self = this.getLatest();
        dataset.captionEditor = self.__captionEditor;
        dataset.captionEditorInitialState = self.__captionEditorInitialState;
        dataset.maxWidthPx = self.__maxWidthPx;

        return dataset;
    }

    get maxWidthPx() {
        const self = this.getLatest();
        return self.__maxWidthPx;
    }

    set maxWidthPx(value) {
        const writable = this.getWritable();
        writable.__maxWidthPx = normalizeMaxWidthPx(value);
    }

    get previewSrc() {
        const self = this.getLatest();
        return self.__previewSrc;
    }

    set previewSrc(previewSrc) {
        const writable = this.getWritable();
        writable.__previewSrc = previewSrc;
    }

    set triggerFileDialog(shouldTrigger) {
        const writable = this.getWritable();
        writable.__triggerFileDialog = shouldTrigger;
    }

    createDOM() {
        return document.createElement('div');
    }

    exportJSON() {
        const json = super.exportJSON();

        // convert nested editor instances back into HTML because their content may not
        // be automatically updated when the nested editor changes
        if (this.__captionEditor) {
            this.__captionEditor.getEditorState().read(() => {
                const html = $generateHtmlFromNodes(this.__captionEditor, null);
                const cleanedHtml = cleanBasicHtml(html, {firstChildInnerContent: true});
                json.caption = cleanedHtml;
            });
        }

        json.maxWidthPx = this.__maxWidthPx;

        return json;
    }

    static importJSON(serializedNode) {
        const node = super.importJSON(serializedNode);
        node.__maxWidthPx = normalizeMaxWidthPx(serializedNode?.maxWidthPx);
        return node;
    }

    exportDOM(options = {}) {
        const result = super.exportDOM(options);
        const element = result?.element;
        const maxWidthPx = this.__maxWidthPx;

        if (element && maxWidthPx && element.tagName === 'FIGURE') {
            element.setAttribute('data-kg-max-width', String(maxWidthPx));
            // apply the inline size to the <img>, not the <figure>, so the caption
            // below stays natural-width instead of being squished alongside the image
            const img = element.querySelector('img');
            if (img) {
                img.style.maxWidth = `${maxWidthPx}px`;
                img.style.margin = '0 auto';
                img.style.display = 'block';
            }
        }

        return result;
    }

    static importDOM() {
        const baseMap = super.importDOM();
        const originalFigureFactory = baseMap.figure;

        baseMap.figure = (nodeElem) => {
            const baseEntry = originalFigureFactory(nodeElem);
            if (!baseEntry) {
                return null;
            }
            const originalConversion = baseEntry.conversion;
            return {
                ...baseEntry,
                conversion(domNode) {
                    const result = originalConversion(domNode);
                    if (result?.node && typeof domNode.getAttribute === 'function') {
                        const raw = domNode.getAttribute('data-kg-max-width');
                        const normalized = normalizeMaxWidthPx(raw);
                        if (normalized !== null) {
                            result.node.__maxWidthPx = normalized;
                        }
                    }
                    return result;
                }
            };
        };

        return baseMap;
    }

    decorate() {
        const Selector = this.__selector;

        return (
            <KoenigCardWrapper nodeKey={this.getKey()} width={this.__cardWidth}>
                {this.__selector && <Selector nodeKey={this.getKey()} />}

                {
                    !this.__isImageHidden && (
                        <ImageNodeComponent
                            altText={this.__alt}
                            captionEditor={this.__captionEditor}
                            captionEditorInitialState={this.__captionEditorInitialState}
                            href={this.href}
                            initialFile={this.__initialFile}
                            maxWidthPx={this.__maxWidthPx}
                            nodeKey={this.getKey()}
                            previewSrc={this.previewSrc}
                            src={this.src}
                            triggerFileDialog={this.__triggerFileDialog}
                        />
                    )
                }
            </KoenigCardWrapper>
        );
    }
}

export const $createImageNode = (dataset) => {
    return new ImageNode(dataset);
};

export function $isImageNode(node) {
    return node instanceof ImageNode;
}
