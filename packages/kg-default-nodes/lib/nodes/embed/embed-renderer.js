import {addCreateDocumentOption} from '../../utils/add-create-document-option';
import {renderEmptyContainer} from '../../utils/render-empty-container';
import {escapeHtml} from '../../utils/escape-html';
import twitterRenderer from './types/twitter';

// Whitelabel: providers whose oEmbed responses represent playable media.
// These get the same thumbnail + play-button MSO/VML email template that
// `embedType === 'video'` already uses.
const PLAYABLE_MEDIA_PROVIDERS = new Set([
    'spotify',
    'soundcloud',
    'apple music',
    'mixcloud',
    'bandcamp'
]);

function isPlayableMediaProvider(providerName) {
    if (!providerName || typeof providerName !== 'string') {
        return false;
    }
    return PLAYABLE_MEDIA_PROVIDERS.has(providerName.trim().toLowerCase());
}

const EMAIL_TEMPLATE_MAX_WIDTH = 600;

function getThumbnailAspectRatio(node, metadata) {
    const w = parseFloat(metadata.thumbnail_width);
    const h = parseFloat(metadata.thumbnail_height);
    if (w > 0 && h > 0) {
        return w / h;
    }
    return node.embedType === 'video' ? 16 / 9 : 1;
}

export function renderEmbedNode(node, options = {}) {
    addCreateDocumentOption(options);

    const document = options.createDocument();
    const embedType = node.embedType;

    if (embedType === 'twitter') {
        return twitterRenderer(node, document, options);
    }

    return renderTemplate(node, document, options);
}

function renderTemplate(node, document, options) {
    if (node.isEmpty()) {
        return renderEmptyContainer(document);
    }
    const isEmail = options.target === 'email';
    const metadata = node.metadata || {};
    const figure = document.createElement('figure');
    figure.setAttribute('class', 'kg-card kg-embed-card');

    if (isEmail) {
        const hasThumbnail = !!metadata.thumbnail_url;
        const isPlayable = node.embedType === 'video'
            || isPlayableMediaProvider(metadata.provider_name);

        if (hasThumbnail && isPlayable) {
            figure.innerHTML = playableThumbnailTemplate(node, metadata);
        } else if (hasThumbnail) {
            figure.innerHTML = thumbnailLinkTemplate(node, metadata);
        } else {
            figure.innerHTML = bookmarkFallbackTemplate(node, metadata);
        }
    } else {
        figure.innerHTML = node.html;
    }

    const caption = node.caption;
    if (caption) {
        const figcaption = document.createElement('figcaption');
        figcaption.innerHTML = caption;
        figure.appendChild(figcaption);
        figure.setAttribute('class', `${figure.getAttribute('class')} kg-card-hascaption`);
    }

    return {element: figure};
}

// Image + play-button overlay. Lifted from the original
// `isVideoWithThumbnail` branch and generalised so non-video playable media
// (Spotify, SoundCloud, etc.) can reuse the same template. The
// `kg-video-preview` / `kg-video-play-button` class names are preserved so
// existing theme styling continues to apply.
function playableThumbnailTemplate(node, metadata) {
    const url = escapeHtml(node.url);
    const thumbnail = escapeHtml(metadata.thumbnail_url);
    const aspectRatio = getThumbnailAspectRatio(node, metadata);
    const spacerWidth = Math.round(EMAIL_TEMPLATE_MAX_WIDTH / 4);
    const spacerHeight = Math.round(EMAIL_TEMPLATE_MAX_WIDTH / aspectRatio);
    const ariaLabel = node.embedType === 'video' ? 'Play video' : 'Play media';

    return `
        <!--[if !mso !vml]-->
        <a class="kg-video-preview" href="${url}" aria-label="${ariaLabel}" style="mso-hide: all">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" background="${thumbnail}" role="presentation" style="background: url('${thumbnail}') left top / cover; mso-hide: all">
                <tr style="mso-hide: all">
                    <td width="25%" style="visibility: hidden; mso-hide: all">
                        <img src="https://img.spacergif.org/v1/${spacerWidth}x${spacerHeight}/0a/spacer.png" alt="" width="100%" border="0" style="display:block; height: auto; opacity: 0; visibility: hidden; mso-hide: all;">
                    </td>
                    <td width="50%" align="center" valign="middle" style="vertical-align: middle; mso-hide: all;">
                        <div class="kg-video-play-button" style="mso-hide: all"><div style="mso-hide: all"></div></div>
                    </td>
                    <td width="25%" style="mso-hide: all">&nbsp;</td>
                </tr>
            </table>
        </a>
        <!--[endif]-->

        <!--[if vml]>
        <v:group xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" coordsize="${EMAIL_TEMPLATE_MAX_WIDTH},${spacerHeight}" coordorigin="0,0" href="${url}" style="width:${EMAIL_TEMPLATE_MAX_WIDTH}px;height:${spacerHeight}px;">
            <v:rect fill="t" stroked="f" style="position:absolute;width:${EMAIL_TEMPLATE_MAX_WIDTH};height:${spacerHeight};"><v:fill src="${thumbnail}" type="frame"/></v:rect>
            <v:oval fill="t" strokecolor="white" strokeweight="4px" style="position:absolute;left:${Math.round((EMAIL_TEMPLATE_MAX_WIDTH / 2) - 39)};top:${Math.round((spacerHeight / 2) - 39)};width:78;height:78"><v:fill color="black" opacity="30%" /></v:oval>
            <v:shape coordsize="24,32" path="m,l,32,24,16,xe" fillcolor="white" stroked="f" style="position:absolute;left:${Math.round((EMAIL_TEMPLATE_MAX_WIDTH / 2) - 11)};top:${Math.round((spacerHeight / 2) - 17)};width:30;height:34;" />
        </v:group>
        <![endif]-->
    `.trim();
}

// Plain thumbnail wrapped in a link, no play overlay. For non-playable
// rich embeds with usable artwork (Instagram, CodePen, GitHub Gist, etc.).
function thumbnailLinkTemplate(node, metadata) {
    const url = escapeHtml(node.url);
    const thumbnail = escapeHtml(metadata.thumbnail_url);
    const aspectRatio = getThumbnailAspectRatio(node, metadata);
    const spacerWidth = Math.round(EMAIL_TEMPLATE_MAX_WIDTH / 4);
    const spacerHeight = Math.round(EMAIL_TEMPLATE_MAX_WIDTH / aspectRatio);
    const altText = metadata.title ? escapeHtml(metadata.title) : '';

    return `
        <!--[if !mso !vml]-->
        <a class="kg-embed-thumbnail" href="${url}" style="mso-hide: all">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" background="${thumbnail}" role="presentation" style="background: url('${thumbnail}') left top / cover; mso-hide: all">
                <tr style="mso-hide: all">
                    <td width="100%" style="visibility: hidden; mso-hide: all">
                        <img src="https://img.spacergif.org/v1/${spacerWidth}x${spacerHeight}/0a/spacer.png" alt="${altText}" width="100%" border="0" style="display:block; height: auto; opacity: 0; visibility: hidden; mso-hide: all;">
                    </td>
                </tr>
            </table>
        </a>
        <!--[endif]-->

        <!--[if vml]>
        <v:group xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" coordsize="${EMAIL_TEMPLATE_MAX_WIDTH},${spacerHeight}" coordorigin="0,0" href="${url}" style="width:${EMAIL_TEMPLATE_MAX_WIDTH}px;height:${spacerHeight}px;">
            <v:rect fill="t" stroked="f" style="position:absolute;width:${EMAIL_TEMPLATE_MAX_WIDTH};height:${spacerHeight};"><v:fill src="${thumbnail}" type="frame"/></v:rect>
        </v:group>
        <![endif]-->
    `.trim();
}

// Bookmark-style text card for embeds with no thumbnail at all. Mirrors the
// two-arm conditional-comment structure used by `bookmark-renderer.js` so
// that Outlook gets a usable layout too. oEmbed has no description field,
// so the card collapses to title + provider/author + URL.
function bookmarkFallbackTemplate(node, metadata) {
    const url = escapeHtml(node.url);
    const title = escapeHtml(metadata.title || node.url);
    const publisher = metadata.provider_name ? escapeHtml(metadata.provider_name) : '';
    const author = metadata.author_name ? escapeHtml(metadata.author_name) : '';
    const hasMeta = publisher || author;

    return `
        <!--[if !mso !vml]-->
            <a class="kg-bookmark-container" href="${url}">
                <div class="kg-bookmark-content">
                    <div class="kg-bookmark-title">${title}</div>
                    ${hasMeta ? `<div class="kg-bookmark-metadata">
                        ${publisher ? `<span class="kg-bookmark-author">${publisher}</span>` : ''}
                        ${author ? `<span class="kg-bookmark-publisher">${author}</span>` : ''}
                    </div>` : ''}
                </div>
            </a>
        <!--[endif]-->
        <!--[if vml]>
            <table class="kg-card kg-bookmark-card--outlook" style="margin: 0; padding: 0; width: 100%; border: 1px solid #e5eff5; background: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; border-collapse: collapse; border-spacing: 0;" width="100%">
                <tr>
                    <td width="100%" style="padding: 20px;">
                        <table style="margin: 0; padding: 0; border-collapse: collapse; border-spacing: 0;">
                            <tr>
                                <td class="kg-bookmark-title--outlook">
                                    <a href="${url}" style="text-decoration: none; color: #15212A; font-size: 15px; line-height: 1.5em; font-weight: 600;">
                                        ${title}
                                    </a>
                                </td>
                            </tr>
                            ${hasMeta ? `<tr>
                                <td class="kg-bookmark-metadata--outlook" style="padding-top: 14px; color: #15212A; font-size: 13px; font-weight: 400; line-height: 1.5em;">
                                    <a href="${url}" style="text-decoration: none; color: #15212A;">
                                        ${publisher}
                                        ${publisher && author ? `&nbsp;&#x2022;&nbsp;` : ''}
                                        ${author}
                                    </a>
                                </td>
                            </tr>` : ''}
                        </table>
                    </td>
                </tr>
            </table>
            <div class="kg-bookmark-spacer--outlook" style="height: 1.5em;">&nbsp;</div>
        <![endif]-->
    `.trim();
}
