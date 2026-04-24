import fs from 'node:fs';
import path from 'node:path';
import {$createImageNode, ImageNode} from '../../src/nodes/ImageNode';
const {createHeadlessEditor} = require('@lexical/headless');

const editorNodes = [ImageNode];

describe('ImageNode', function () {
    let editor;

    const editorTest = testFn => function () {
        let resolve, reject;
        const promise = new Promise((resolve_, reject_) => {
            resolve = resolve_;
            reject = reject_;
        });

        editor.update(() => {
            try {
                testFn();
                resolve();
            } catch (error) {
                reject(error);
            }
        });

        return promise;
    };

    beforeEach(function () {
        editor = createHeadlessEditor({nodes: editorNodes});
    });

    describe('maxWidthPx serialization', function () {
        it('defaults maxWidthPx to null when not provided', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png'});
            expect(node.maxWidthPx).toBeNull();
            expect(node.exportJSON().maxWidthPx).toBeNull();
        }));

        it('stores an integer maxWidthPx passed via constructor', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png', maxWidthPx: 420});
            expect(node.maxWidthPx).toBe(420);
        }));

        it('clamps values below the minimum', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png', maxWidthPx: 10});
            expect(node.maxWidthPx).toBe(50);
        }));

        it('clamps values above the maximum', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png', maxWidthPx: 5000});
            expect(node.maxWidthPx).toBe(1600);
        }));

        it('coerces numeric strings', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png', maxWidthPx: '600'});
            expect(node.maxWidthPx).toBe(600);
        }));

        it('treats empty / invalid input as null', editorTest(function () {
            const a = $createImageNode({src: 'https://example.com/a.png', maxWidthPx: ''});
            const b = $createImageNode({src: 'https://example.com/a.png', maxWidthPx: 'not-a-number'});
            expect(a.maxWidthPx).toBeNull();
            expect(b.maxWidthPx).toBeNull();
        }));

        it('round-trips through exportJSON / importJSON', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png', maxWidthPx: 640});
            const json = node.exportJSON();
            expect(json.maxWidthPx).toBe(640);

            const restored = ImageNode.importJSON(json);
            expect(restored.maxWidthPx).toBe(640);
        }));

        it('round-trips null through exportJSON / importJSON', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png'});
            const json = node.exportJSON();
            const restored = ImageNode.importJSON(json);
            expect(restored.maxWidthPx).toBeNull();
        }));

        it('persists maxWidthPx across node.clone', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png', maxWidthPx: 800});
            const cloned = ImageNode.clone(node);
            expect(cloned.maxWidthPx).toBe(800);
        }));
    });

    describe('exportDOM', function () {
        it('emits data-kg-max-width on the figure and inline style on the img when set', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png', alt: '', maxWidthPx: 500});
            const {element} = node.exportDOM({});
            expect(element.tagName).toBe('FIGURE');
            expect(element.getAttribute('data-kg-max-width')).toBe('500');
            // figure itself is not constrained so the caption stays full-width
            expect(element.style.maxWidth).toBe('');

            const img = element.querySelector('img');
            expect(img).not.toBeNull();
            expect(img.style.maxWidth).toBe('500px');
            expect(img.style.margin).toBe('0px auto');
            expect(img.style.display).toBe('block');
        }));

        it('does not emit max-width attributes when unset', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png', alt: ''});
            const {element} = node.exportDOM({});
            expect(element.tagName).toBe('FIGURE');
            expect(element.hasAttribute('data-kg-max-width')).toBe(false);
            const img = element.querySelector('img');
            expect(img.style.maxWidth).toBe('');
        }));
    });

    describe('importDOM', function () {
        it('reads data-kg-max-width off a figure', editorTest(function () {
            const conversionMap = ImageNode.importDOM();
            const figure = document.createElement('figure');
            figure.setAttribute('data-kg-max-width', '720');
            const img = document.createElement('img');
            img.setAttribute('src', 'https://example.com/a.png');
            img.setAttribute('alt', '');
            figure.appendChild(img);

            const factory = conversionMap.figure(figure);
            expect(factory).not.toBeNull();
            const {node} = factory.conversion(figure);
            expect(node.maxWidthPx).toBe(720);
        }));

        it('leaves maxWidthPx null when data attribute absent', editorTest(function () {
            const conversionMap = ImageNode.importDOM();
            const figure = document.createElement('figure');
            const img = document.createElement('img');
            img.setAttribute('src', 'https://example.com/a.png');
            img.setAttribute('alt', '');
            figure.appendChild(img);

            const factory = conversionMap.figure(figure);
            const {node} = factory.conversion(figure);
            expect(node.maxWidthPx).toBeNull();
        }));
    });

    describe('Atlas brand palette', function () {
        it('exposes purple #4945FF as the green CSS custom property default', function () {
            const cssPath = path.resolve(__dirname, '../../src/styles/index.css');
            const cssText = fs.readFileSync(cssPath, 'utf8');
            expect(cssText).toMatch(/--green:\s*#4945FF/);
            expect(cssText).not.toMatch(/--green:\s*#30CF43/i);
        });

        it('remaps the tailwind green palette to the Atlas purple scale', async function () {
            const mod = await import('../../tailwind.config.cjs');
            const green = mod.default?.theme?.colors?.green || mod.theme?.colors?.green;
            expect(green['500']).toBe('#4945FF');
            expect(green['600']).toBe('#3633CC');
            expect(green['100']).toBe('#ECEAFF');
            expect(green['400']).toBe('#7A77FF');
        });
    });
});
