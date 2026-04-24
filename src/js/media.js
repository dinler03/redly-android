// media.js — media extraction and processing utilities

import { Capacitor } from '@capacitor/core';
import { CapacitorHttp } from '@capacitor/core';

/**
 * Extract an 11-character YouTube video ID from various YouTube URL formats.
 * Supports: youtu.be/{id}, youtube.com/watch?v={id},
 *           youtube.com/shorts/{id}, youtube.com/embed/{id}
 * Returns null if no match is found.
 */
export function extractYouTubeId(url) {
    if (!url) return null;

    // youtu.be/{id}
    const shortMatch = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];

    // youtube.com/watch?v={id}
    const watchMatch = url.match(/youtube\.com\/watch\?(?:[^#]*&)?v=([A-Za-z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];

    // youtube.com/shorts/{id}
    const shortsMatch = url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/);
    if (shortsMatch) return shortsMatch[1];

    // youtube.com/embed/{id}
    const embedMatch = url.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];

    return null;
}

/**
 * Extract a Redgifs GIF ID from various Redgifs URL formats.
 * Supports: redgifs.com/watch/{id}, redgifs.com/ifr/{id}, redgifs.com/i/{id}
 * Returns the lowercase ID or null if no match.
 */
export function extractRedgifsId(url) {
    if (!url) return null;

    const match = url.match(/redgifs\.com\/(?:watch|ifr|i)\/([A-Za-z0-9]+)/);
    if (match) return match[1].toLowerCase();

    return null;
}

/**
 * Trusted image hosts whose links should be shown inline in comments.
 */
const IMAGE_HOSTS = new Set([
    'i.redd.it',
    'preview.redd.it',
    'i.imgur.com',
    'media.giphy.com',
    'external-preview.redd.it',
]);

/**
 * Image file extensions that qualify a URL as an inline image.
 */
const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);

/**
 * Post-process decoded Reddit comment HTML to display images/GIFs inline.
 * Finds anchor tags pointing to trusted image URLs and inserts an <img> after
 * each one. If the link text is just the bare URL, the anchor is removed.
 * Returns the processed HTML string.
 */
export function processCommentMedia(html) {
    if (!html) return html;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const anchors = Array.from(doc.querySelectorAll('a'));

    for (const anchor of anchors) {
        const href = anchor.getAttribute('href');
        if (!href) continue;

        let urlObj;
        try {
            urlObj = new URL(href);
        } catch {
            continue;
        }

        const host = urlObj.hostname;
        if (!IMAGE_HOSTS.has(host)) continue;

        // Check extension (ignore query string)
        const pathname = urlObj.pathname;
        const ext = pathname.split('.').pop().toLowerCase();
        if (!IMAGE_EXTS.has(ext)) continue;

        // Build final src — append ?width=640 for preview.redd.it if no query
        let src = href;
        if (host === 'preview.redd.it' && !urlObj.search) {
            src = href + '?width=640';
        }

        // Create inline image element
        const img = doc.createElement('img');
        img.setAttribute('src', src);
        img.setAttribute('loading', 'lazy');
        img.setAttribute('class', 'comment-inline-img');

        // Insert img after the anchor
        anchor.parentNode.insertBefore(img, anchor.nextSibling);

        // Remove bare-URL anchor (link text equals href exactly)
        if (anchor.textContent.trim() === href) {
            anchor.parentNode.removeChild(anchor);
        }
    }

    return doc.body.innerHTML;
}

/**
 * Fetch direct video URLs from the Redgifs API v2.
 * Step 1: Obtain a temporary bearer token.
 * Step 2: Fetch gif metadata using the token.
 * Returns the gif.urls object: { hd, sd, poster, thumbnail }
 * Throws on failure.
 */
export async function fetchRedgifsUrls(gifId) {
    const isNative = Capacitor.isNativePlatform();

    // Helper: perform a GET request using CapacitorHttp on native, fetch on web
    async function getJson(url, headers = {}) {
        if (isNative) {
            const response = await CapacitorHttp.get({ url, headers });
            if (response.status < 200 || response.status >= 300) {
                throw new Error(`HTTP ${response.status} for ${url}`);
            }
            return response.data;
        } else {
            const response = await fetch(url, { headers });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} for ${url}`);
            }
            return response.json();
        }
    }

    // Step 1: get temporary token
    const authData = await getJson('https://api.redgifs.com/v2/auth/temporary');
    const token = authData && authData.token;
    if (!token) {
        throw new Error('Failed to obtain Redgifs token');
    }

    // Step 2: fetch gif metadata
    const gifData = await getJson(
        `https://api.redgifs.com/v2/gifs/${gifId}`,
        { Authorization: `Bearer ${token}` }
    );

    const gif = gifData && gifData.gif;
    if (!gif || !gif.urls) {
        throw new Error('Failed to fetch Redgifs gif data');
    }

    return gif.urls;
}
