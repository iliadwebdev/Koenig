export function formatFromClassList(classList) {
    if (!classList) {
        return '';
    }
    if (classList.contains('kg-align-center')) {
        return 'center';
    }
    if (classList.contains('kg-align-right')) {
        return 'right';
    }
    if (classList.contains('kg-align-left')) {
        return 'left';
    }
    return '';
}
