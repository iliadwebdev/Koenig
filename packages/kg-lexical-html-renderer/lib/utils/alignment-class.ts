// 'left' is treated as the default and intentionally returns no class —
// emitting `kg-align-left` on every paragraph would bloat published HTML
// for the common case where users haven't picked an alignment.
function alignmentClass(format: string): string {
    switch (format) {
    case 'center':
        return 'kg-align-center';
    case 'right':
    case 'end':
        return 'kg-align-right';
    default:
        return '';
    }
}

export default alignmentClass;
