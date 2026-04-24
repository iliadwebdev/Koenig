import {describe, expect, it} from 'vitest';
import {getAllowedImageCardWidths, getDefaultImageCardWidth} from '../../../src/utils/image-card-widths';

describe('image-card-widths utils', () => {
    describe('getAllowedImageCardWidths', () => {
        it('returns default set when input is not an array', () => {
            expect(getAllowedImageCardWidths(undefined)).toEqual(['regular', 'wide', 'full']);
            expect(getAllowedImageCardWidths(null)).toEqual(['regular', 'wide', 'full']);
            expect(getAllowedImageCardWidths('wide')).toEqual(['regular', 'wide', 'full']);
        });

        it('filters to valid widths and preserves order', () => {
            expect(getAllowedImageCardWidths(['wide', 'regular'])).toEqual(['wide', 'regular']);
        });

        it('deduplicates', () => {
            expect(getAllowedImageCardWidths(['wide', 'wide', 'full'])).toEqual(['wide', 'full']);
        });

        it('drops unknown widths', () => {
            expect(getAllowedImageCardWidths(['wide', 'xl', 'full'])).toEqual(['wide', 'full']);
        });

        it('falls back to defaults when no valid widths remain', () => {
            expect(getAllowedImageCardWidths(['xl', 'mini'])).toEqual(['regular', 'wide', 'full']);
            expect(getAllowedImageCardWidths([])).toEqual(['regular', 'wide', 'full']);
        });
    });

    describe('getDefaultImageCardWidth', () => {
        it('prefers regular when allowed', () => {
            expect(getDefaultImageCardWidth(['regular', 'wide', 'full'])).toBe('regular');
            expect(getDefaultImageCardWidth(['wide', 'regular'])).toBe('regular');
        });

        it('falls back to the first allowed width', () => {
            expect(getDefaultImageCardWidth(['wide', 'full'])).toBe('wide');
            expect(getDefaultImageCardWidth(['full'])).toBe('full');
        });
    });
});
