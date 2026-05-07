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

    describe('imageAlignment serialization', function () {
        it('defaults imageAlignment to null when not provided', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png'});
            expect(node.imageAlignment).toBeNull();
            expect(node.exportJSON().imageAlignment).toBeNull();
        }));

        it('stores left and right values', editorTest(function () {
            const left = $createImageNode({src: 'https://example.com/a.png', imageAlignment: 'left'});
            const right = $createImageNode({src: 'https://example.com/a.png', imageAlignment: 'right'});
            expect(left.imageAlignment).toBe('left');
            expect(right.imageAlignment).toBe('right');
        }));

        it('treats center, empty, and invalid input as null (the default)', editorTest(function () {
            const center = $createImageNode({src: 'https://example.com/a.png', imageAlignment: 'center'});
            const empty = $createImageNode({src: 'https://example.com/a.png', imageAlignment: ''});
            const junk = $createImageNode({src: 'https://example.com/a.png', imageAlignment: 'sideways'});
            expect(center.imageAlignment).toBeNull();
            expect(empty.imageAlignment).toBeNull();
            expect(junk.imageAlignment).toBeNull();
        }));

        it('round-trips left/right through exportJSON / importJSON', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png', imageAlignment: 'left'});
            const json = node.exportJSON();
            expect(json.imageAlignment).toBe('left');

            const restored = ImageNode.importJSON(json);
            expect(restored.imageAlignment).toBe('left');
        }));

        it('round-trips null through exportJSON / importJSON', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png'});
            const json = node.exportJSON();
            const restored = ImageNode.importJSON(json);
            expect(restored.imageAlignment).toBeNull();
        }));

        it('persists imageAlignment across node.clone', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png', imageAlignment: 'right'});
            const cloned = ImageNode.clone(node);
            expect(cloned.imageAlignment).toBe('right');
        }));

        it('imageAlignment setter normalizes the value', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png'});
            node.imageAlignment = 'right';
            expect(node.imageAlignment).toBe('right');
            node.imageAlignment = 'center';
            expect(node.imageAlignment).toBeNull();
            node.imageAlignment = null;
            expect(node.imageAlignment).toBeNull();
        }));
    });

    describe('focalPoint serialization', function () {
        it('defaults focalPoint to null when not provided', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png'});
            expect(node.focalPoint).toBeNull();
            expect(node.exportJSON().focalPoint).toBeNull();
        }));

        it('stores an {x, y} object', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png', focalPoint: {x: 25, y: 75}});
            expect(node.focalPoint).toEqual({x: 25, y: 75});
        }));

        it('accepts [x, y] arrays and "x,y" strings', editorTest(function () {
            const fromArr = $createImageNode({src: 'https://example.com/a.png', focalPoint: [30, 40]});
            const fromStr = $createImageNode({src: 'https://example.com/a.png', focalPoint: '30,40'});
            expect(fromArr.focalPoint).toEqual({x: 30, y: 40});
            expect(fromStr.focalPoint).toEqual({x: 30, y: 40});
        }));

        it('clamps out-of-range values', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png', focalPoint: {x: 150, y: -10}});
            expect(node.focalPoint).toEqual({x: 100, y: 0});
        }));

        it('rounds to one decimal place', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png', focalPoint: {x: 33.333, y: 66.666}});
            expect(node.focalPoint).toEqual({x: 33.3, y: 66.7});
        }));

        it('collapses the {50,50} default to null', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png', focalPoint: {x: 50, y: 50}});
            expect(node.focalPoint).toBeNull();
        }));

        it('treats malformed input as null', editorTest(function () {
            const a = $createImageNode({src: 'https://example.com/a.png', focalPoint: 'foo'});
            const b = $createImageNode({src: 'https://example.com/a.png', focalPoint: {}});
            const c = $createImageNode({src: 'https://example.com/a.png', focalPoint: [1]});
            const d = $createImageNode({src: 'https://example.com/a.png', focalPoint: ''});
            expect(a.focalPoint).toBeNull();
            expect(b.focalPoint).toBeNull();
            expect(c.focalPoint).toBeNull();
            expect(d.focalPoint).toBeNull();
        }));

        it('round-trips through exportJSON / importJSON', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png', focalPoint: {x: 25, y: 75}});
            const json = node.exportJSON();
            expect(json.focalPoint).toEqual({x: 25, y: 75});

            const restored = ImageNode.importJSON(json);
            expect(restored.focalPoint).toEqual({x: 25, y: 75});
        }));

        it('round-trips null through exportJSON / importJSON', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png'});
            const json = node.exportJSON();
            const restored = ImageNode.importJSON(json);
            expect(restored.focalPoint).toBeNull();
        }));

        it('persists focalPoint across node.clone', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png', focalPoint: {x: 10, y: 90}});
            const cloned = ImageNode.clone(node);
            expect(cloned.focalPoint).toEqual({x: 10, y: 90});
        }));

        it('focalPoint setter normalizes the value', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png'});
            node.focalPoint = {x: 20, y: 80};
            expect(node.focalPoint).toEqual({x: 20, y: 80});
            node.focalPoint = {x: 50, y: 50};
            expect(node.focalPoint).toBeNull();
            node.focalPoint = null;
            expect(node.focalPoint).toBeNull();
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

        it('emits left alignment attrs/class on the figure and left-anchored margin on the img', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png', alt: '', maxWidthPx: 500, imageAlignment: 'left'});
            const {element} = node.exportDOM({});
            expect(element.getAttribute('data-kg-image-align')).toBe('left');
            expect(element.getAttribute('class') || '').toContain('kg-image-align-left');
            const img = element.querySelector('img');
            // 0px top, auto right, 0px bottom, 0px left — image hugs the left edge of the figure
            expect(img.style.margin).toBe('0px auto 0px 0px');
        }));

        it('emits right alignment attrs/class on the figure and right-anchored margin on the img', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png', alt: '', maxWidthPx: 500, imageAlignment: 'right'});
            const {element} = node.exportDOM({});
            expect(element.getAttribute('data-kg-image-align')).toBe('right');
            expect(element.getAttribute('class') || '').toContain('kg-image-align-right');
            const img = element.querySelector('img');
            expect(img.style.margin).toBe('0px 0px 0px auto');
        }));

        it('emits no alignment attrs when imageAlignment is null (default center)', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png', alt: '', maxWidthPx: 500});
            const {element} = node.exportDOM({});
            expect(element.hasAttribute('data-kg-image-align')).toBe(false);
            expect(element.getAttribute('class') || '').not.toContain('kg-image-align-');
            const img = element.querySelector('img');
            expect(img.style.margin).toBe('0px auto');
        }));

        it('does not apply alignment styles to the img when maxWidthPx is unset', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png', alt: '', imageAlignment: 'left'});
            const {element} = node.exportDOM({});
            // alignment only applies visually when the image is constrained
            expect(element.hasAttribute('data-kg-image-align')).toBe(false);
            const img = element.querySelector('img');
            expect(img.style.margin).toBe('');
        }));

        it('emits data-kg-focal-point on the figure and object-position on the img when set', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png', alt: '', focalPoint: {x: 25, y: 75}});
            const {element} = node.exportDOM({});
            expect(element.tagName).toBe('FIGURE');
            expect(element.getAttribute('data-kg-focal-point')).toBe('25,75');

            const img = element.querySelector('img');
            expect(img.style.objectPosition).toBe('25% 75%');
        }));

        it('emits focal-point hooks regardless of maxWidthPx', editorTest(function () {
            // unlike imageAlignment, focalPoint applies whenever a downstream
            // theme crops the image — it must not be gated on maxWidthPx
            const node = $createImageNode({src: 'https://example.com/a.png', alt: '', focalPoint: {x: 10, y: 90}});
            const {element} = node.exportDOM({});
            expect(element.getAttribute('data-kg-focal-point')).toBe('10,90');
            const img = element.querySelector('img');
            expect(img.style.objectPosition).toBe('10% 90%');
        }));

        it('does not emit focal-point attributes when unset', editorTest(function () {
            const node = $createImageNode({src: 'https://example.com/a.png', alt: ''});
            const {element} = node.exportDOM({});
            expect(element.hasAttribute('data-kg-focal-point')).toBe(false);
            const img = element.querySelector('img');
            expect(img.style.objectPosition).toBe('');
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

        it('reads data-kg-image-align off a figure', editorTest(function () {
            const conversionMap = ImageNode.importDOM();
            const figure = document.createElement('figure');
            figure.setAttribute('data-kg-image-align', 'right');
            const img = document.createElement('img');
            img.setAttribute('src', 'https://example.com/a.png');
            img.setAttribute('alt', '');
            figure.appendChild(img);

            const factory = conversionMap.figure(figure);
            const {node} = factory.conversion(figure);
            expect(node.imageAlignment).toBe('right');
        }));

        it('ignores unknown alignment values', editorTest(function () {
            const conversionMap = ImageNode.importDOM();
            const figure = document.createElement('figure');
            figure.setAttribute('data-kg-image-align', 'sideways');
            const img = document.createElement('img');
            img.setAttribute('src', 'https://example.com/a.png');
            img.setAttribute('alt', '');
            figure.appendChild(img);

            const factory = conversionMap.figure(figure);
            const {node} = factory.conversion(figure);
            expect(node.imageAlignment).toBeNull();
        }));

        it('leaves imageAlignment null when data attribute absent', editorTest(function () {
            const conversionMap = ImageNode.importDOM();
            const figure = document.createElement('figure');
            const img = document.createElement('img');
            img.setAttribute('src', 'https://example.com/a.png');
            img.setAttribute('alt', '');
            figure.appendChild(img);

            const factory = conversionMap.figure(figure);
            const {node} = factory.conversion(figure);
            expect(node.imageAlignment).toBeNull();
        }));

        it('reads data-kg-focal-point off a figure', editorTest(function () {
            const conversionMap = ImageNode.importDOM();
            const figure = document.createElement('figure');
            figure.setAttribute('data-kg-focal-point', '40,60');
            const img = document.createElement('img');
            img.setAttribute('src', 'https://example.com/a.png');
            img.setAttribute('alt', '');
            figure.appendChild(img);

            const factory = conversionMap.figure(figure);
            const {node} = factory.conversion(figure);
            expect(node.focalPoint).toEqual({x: 40, y: 60});
        }));

        it('ignores malformed focal-point values', editorTest(function () {
            const conversionMap = ImageNode.importDOM();
            const figure = document.createElement('figure');
            figure.setAttribute('data-kg-focal-point', 'foo,bar');
            const img = document.createElement('img');
            img.setAttribute('src', 'https://example.com/a.png');
            img.setAttribute('alt', '');
            figure.appendChild(img);

            const factory = conversionMap.figure(figure);
            const {node} = factory.conversion(figure);
            expect(node.focalPoint).toBeNull();
        }));

        it('leaves focalPoint null when data attribute absent', editorTest(function () {
            const conversionMap = ImageNode.importDOM();
            const figure = document.createElement('figure');
            const img = document.createElement('img');
            img.setAttribute('src', 'https://example.com/a.png');
            img.setAttribute('alt', '');
            figure.appendChild(img);

            const factory = conversionMap.figure(figure);
            const {node} = factory.conversion(figure);
            expect(node.focalPoint).toBeNull();
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
