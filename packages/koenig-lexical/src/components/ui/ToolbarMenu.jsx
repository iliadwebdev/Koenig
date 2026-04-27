import AddIcon from '../../assets/icons/kg-add.svg?react';
import AlignCenterIcon from '../../assets/icons/kg-align-center.svg?react';
import AlignLeftIcon from '../../assets/icons/kg-align-left.svg?react';
import AlignRightIcon from '../../assets/icons/kg-align-right.svg?react';
import BoldIcon from '../../assets/icons/kg-bold.svg?react';
import EditIcon from '../../assets/icons/kg-edit.svg?react';
import EyeIcon from '../../assets/icons/kg-eye.svg?react';
import HeadingThreeIcon from '../../assets/icons/kg-heading-3.svg?react';
import HeadingTwoIcon from '../../assets/icons/kg-heading-2.svg?react';
import ImgFullIcon from '../../assets/icons/kg-img-full.svg?react';
import ImgRegularIcon from '../../assets/icons/kg-img-regular.svg?react';
import ImgReplaceIcon from '../../assets/icons/kg-replace.svg?react';
import ImgWideIcon from '../../assets/icons/kg-img-wide.svg?react';
import ItalicIcon from '../../assets/icons/kg-italic.svg?react';
import LinkIcon from '../../assets/icons/kg-link.svg?react';
import QuoteIcon from '../../assets/icons/kg-quote.svg?react';
import QuoteOneIcon from '../../assets/icons/kg-quote-1.svg?react';
import QuoteTwoIcon from '../../assets/icons/kg-quote-2.svg?react';
import React from 'react';
import SnippetIcon from '../../assets/icons/kg-snippet.svg?react';
import TrashIcon from '../../assets/icons/kg-trash.svg?react';
import WandIcon from '../../assets/icons/kg-wand.svg?react';
import {Tooltip} from './Tooltip';

export const TOOLBAR_ICONS = {
    bold: BoldIcon,
    italic: ItalicIcon,
    headingTwo: HeadingTwoIcon,
    headingThree: HeadingThreeIcon,
    alignLeft: AlignLeftIcon,
    alignCenter: AlignCenterIcon,
    alignRight: AlignRightIcon,
    quote: QuoteIcon,
    quoteOne: QuoteOneIcon,
    quoteTwo: QuoteTwoIcon,
    link: LinkIcon,
    imgRegular: ImgRegularIcon,
    imgWide: ImgWideIcon,
    imgFull: ImgFullIcon,
    imgReplace: ImgReplaceIcon,
    add: AddIcon,
    edit: EditIcon,
    wand: WandIcon,
    visibility: EyeIcon,
    snippet: SnippetIcon,
    remove: TrashIcon
};

export function ToolbarMenu({children, hide, ...props}) {
    if (hide) {
        return null;
    }

    return (
        <ul className="relative m-0 flex items-center justify-evenly gap-1 rounded-lg bg-white px-1 font-sans text-md font-normal text-black shadow-md dark:bg-grey-950" {...props}>
            {children}
        </ul>
    );
}

export function ToolbarMenuItem({label, isActive, onClick, icon, shortcutKeys, secondary, dataTestId, hide, ...props}) {
    if (hide) {
        return null;
    }

    const Icon = TOOLBAR_ICONS[icon];

    return (
        <li className="group relative m-0 flex p-0 first:m-0" {...props}>
            <button
                aria-label={label}
                className={`my-1 flex h-8 w-9 cursor-pointer items-center justify-center rounded-md transition hover:bg-grey-200/80 dark:bg-grey-950 dark:hover:bg-grey-900 ${isActive ? 'bg-grey-200/80' : 'bg-white'}`}
                data-kg-active={isActive}
                data-testid={dataTestId}
                type="button"
                onClick={onClick}
            >
                <Icon className={`size-4 overflow-visible transition ${secondary ? 'stroke-2' : 'stroke-[2.5]'} ${isActive ? 'text-green-600 dark:text-green-600' : 'text-black dark:text-white'}`} />
            </button>
            <Tooltip label={label} shortcutKeys={shortcutKeys} />
        </li>
    );
}

export function ToolbarMenuSeparator({hide}) {
    if (hide) {
        return null;
    }

    return (
        <li className="m-0 w-px self-stretch bg-grey-300/80 dark:bg-grey-900"></li>
    );
}

export function ToolbarMenuInput({
    label,
    value,
    onChange,
    placeholder,
    min,
    max,
    suffix,
    dataTestId,
    hide
}) {
    const [draft, setDraft] = React.useState(value ?? '');

    React.useEffect(() => {
        setDraft(value ?? '');
    }, [value]);

    if (hide) {
        return null;
    }

    const commit = () => {
        if (draft === '' || draft === null) {
            onChange(null);
            return;
        }
        const parsed = parseInt(draft, 10);
        if (!Number.isFinite(parsed)) {
            setDraft(value ?? '');
            return;
        }
        onChange(parsed);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            event.currentTarget.blur();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            setDraft(value ?? '');
            event.currentTarget.blur();
        }
    };

    return (
        <li className="group relative m-0 flex items-center p-0 first:m-0">
            <label aria-label={label} className="my-1 flex h-8 items-center rounded-md bg-white px-2 dark:bg-grey-950">
                <input
                    aria-label={label}
                    className="w-12 bg-transparent text-center text-sm text-black outline-none placeholder:text-grey-500 dark:text-white"
                    data-testid={dataTestId}
                    inputMode="numeric"
                    max={max}
                    min={min}
                    placeholder={placeholder}
                    type="number"
                    value={draft}
                    onBlur={commit}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                {suffix && (
                    <span className="ml-1 select-none text-xs text-grey-600 dark:text-grey-400">{suffix}</span>
                )}
            </label>
            <Tooltip label={label} />
        </li>
    );
}
