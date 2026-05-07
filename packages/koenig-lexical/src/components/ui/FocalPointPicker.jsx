import PropTypes from 'prop-types';
import React from 'react';

const DEFAULT_POINT = {x: 50, y: 50};

function clamp(value) {
    if (!Number.isFinite(value)) {
        return 50;
    }
    return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

export function FocalPointPicker({src, alt, value, onChange, onClose}) {
    const containerRef = React.useRef(null);
    const imageRef = React.useRef(null);
    const [isDragging, setIsDragging] = React.useState(false);

    const isDefault = value === null || value === undefined;
    const point = isDefault ? DEFAULT_POINT : value;

    const updateFromClientPos = React.useCallback((clientX, clientY) => {
        const img = imageRef.current;
        if (!img) {
            return;
        }
        const rect = img.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            return;
        }
        const x = clamp((clientX - rect.left) / rect.width * 100);
        const y = clamp((clientY - rect.top) / rect.height * 100);
        onChange({x, y});
    }, [onChange]);

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        updateFromClientPos(e.clientX, e.clientY);
    };

    const handleTouchStart = (e) => {
        if (e.touches.length === 0) {
            return;
        }
        setIsDragging(true);
        updateFromClientPos(e.touches[0].clientX, e.touches[0].clientY);
    };

    React.useEffect(() => {
        if (!isDragging) {
            return undefined;
        }
        const onMouseMove = (e) => {
            updateFromClientPos(e.clientX, e.clientY);
        };
        const onMouseUp = () => {
            setIsDragging(false);
        };
        const onTouchMove = (e) => {
            if (e.touches.length === 0) {
                return;
            }
            updateFromClientPos(e.touches[0].clientX, e.touches[0].clientY);
        };
        const onTouchEnd = () => {
            setIsDragging(false);
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchmove', onTouchMove);
        window.addEventListener('touchend', onTouchEnd);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
        };
    }, [isDragging, updateFromClientPos]);

    React.useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        const onClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                onClose();
            }
        };
        window.addEventListener('keydown', onKey);
        window.addEventListener('mousedown', onClickOutside);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('mousedown', onClickOutside);
        };
    }, [onClose]);

    return (
        <div
            ref={containerRef}
            className="relative m-0 flex flex-col items-stretch gap-2 rounded-lg bg-white p-2 font-sans text-md font-normal text-black shadow-md dark:bg-grey-950 dark:text-grey-200"
            data-testid="focal-point-picker"
        >
            <div
                className="relative max-w-[280px] cursor-crosshair select-none overflow-hidden rounded"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                <img
                    ref={imageRef}
                    alt={alt || ''}
                    className="block h-auto w-full"
                    draggable={false}
                    src={src}
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-green shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
                    data-testid="focal-point-marker"
                    style={{
                        left: `${point.x}%`,
                        top: `${point.y}%`,
                        opacity: isDefault ? 0.4 : 1
                    }}
                />
            </div>
            <div className="flex items-center justify-between gap-2 px-1 pb-1 text-sm">
                <span className="text-grey-700 dark:text-grey-400">
                    {isDefault ? 'Default (centered)' : `${point.x}%, ${point.y}%`}
                </span>
                <div className="flex gap-2">
                    <button
                        className="rounded px-2 py-1 text-grey-700 hover:bg-grey-100 dark:text-grey-400 dark:hover:bg-grey-900"
                        data-testid="focal-point-reset"
                        disabled={isDefault}
                        type="button"
                        onClick={() => onChange(null)}
                    >
                        Reset
                    </button>
                    <button
                        className="rounded bg-grey-900 px-3 py-1 text-white dark:bg-grey-100 dark:text-grey-900"
                        data-testid="focal-point-done"
                        type="button"
                        onClick={onClose}
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

FocalPointPicker.propTypes = {
    src: PropTypes.string.isRequired,
    alt: PropTypes.string,
    value: PropTypes.shape({x: PropTypes.number, y: PropTypes.number}),
    onChange: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
};
