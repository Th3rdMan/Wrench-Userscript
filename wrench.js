// ==UserScript==
// @name         Wrench
// @namespace    http://tampermonkey.net/
// @version      2.10.0
// @description  Analyse passive d’un site web : robots.txt, métadonnées, IP / DNS, commentaires, endpoints, technos, sitemap et outils OSINT externes.
// @author       Th3rd
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceURL
// @resource     wrenchIcon https://raw.githubusercontent.com/Th3rdMan/Wrench-Userscript/main/wrench.png
// @connect      *
// @run-at       document-end
// @license      GPL-3.0
// @icon         https://github.com/Th3rdMan/wrench-userscript/blob/main/wrench.png?raw=true
// @namespace    https://github.com/Th3rdMan/wrench-userscript
// @downloadURL  https://update.greasyfork.org/scripts/538478/Wrench.user.js
// @updateURL    https://update.greasyfork.org/scripts/538478/Wrench.meta.js
// ==/UserScript==

(function () {
    'use strict';
    if (window.top !== window) return;

    const baseUrl = location.origin;
    const robotsUrl = `${baseUrl}/robots.txt`;

    const ICON_WRENCH = typeof GM_getResourceURL === 'function'
        ? GM_getResourceURL('wrenchIcon')
        : 'https://raw.githubusercontent.com/Th3rdMan/Wrench-Userscript/main/wrench.png';

    const ICON_CLOSE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="30" fill="#e63946"/>
            <path d="M22 22l20 20M42 22L22 42" stroke="#fff" stroke-width="7" stroke-linecap="round"/>
        </svg>
    `)}`;

    const SUSPICIOUS_RE = /\b(flag|ctf|debug|todo|fixme|secret|token|key|password|passwd|admin|internal|staging|backup|old|dev|test|hidden|private|credential|auth)\b/i;
    const store = { page: null, analysis: null, robots: null, sitemap: null };

    function escapeHTML(str) {
        return String(str ?? '').replace(/[&<>'"]/g, c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[c]));
    }

    function highlightSuspicious(str) {
        return escapeHTML(str).replace(
            /\b(flag|ctf|debug|todo|fixme|secret|token|key|password|passwd|admin|internal|staging|backup|old|dev|test|hidden|private|credential|auth)\b/gi,
            '<mark style="background:#614600;color:#ffd166;padding:0 2px;border-radius:2px;">$1</mark>'
        );
    }

    function safeHref(url) {
        try {
            const parsed = new URL(url, document.location.href);
            return /^https?:$/.test(parsed.protocol) ? escapeHTML(url) : '#';
        } catch (_) {
            return '#';
        }
    }

    function gmGet(url, timeout = 12000) {
        return new Promise(resolve => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                timeout,
                onload: res => resolve({
                    ok: res.status >= 200 && res.status < 400,
                    status: res.status,
                    text: res.responseText || '',
                    finalUrl: res.finalUrl || url,
                    headers: res.responseHeaders || '',
                    error: null
                }),
                onerror: () => resolve({ ok: false, status: 0, text: '', finalUrl: url, headers: '', error: 'network' }),
                ontimeout: () => resolve({ ok: false, status: 0, text: '', finalUrl: url, headers: '', error: 'timeout' })
            });
        });
    }

    function absoluteUrl(value) {
        try {
            return new URL(value, location.href).href;
        } catch (_) {
            return null;
        }
    }

    function isSameOrigin(url) {
        try {
            return new URL(url).origin === location.origin;
        } catch (_) {
            return false;
        }
    }

    function shortenUrl(url) {
        try {
            const parsed = new URL(url);
            return parsed.origin === location.origin
                ? parsed.pathname + parsed.search + parsed.hash
                : parsed.hostname + parsed.pathname + parsed.search;
        } catch (_) {
            return url;
        }
    }

    function lineNumberAt(text, index) {
        return text.slice(0, index).split(/\r\n|\r|\n/).length;
    }

    function getFlagEmoji(countryCode) {
        if (!countryCode || !/^[a-z]{2}$/i.test(countryCode)) return '';
        return countryCode.toUpperCase().replace(/./g, char =>
            String.fromCodePoint(127397 + char.charCodeAt(0))
        );
    }

    function uniqueItems(items, keyFn = item => item) {
        const seen = new Set();
        return items.filter(item => {
            const key = String(keyFn(item)).toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    function countBy(items, keyFn) {
        return items.reduce((acc, item) => {
            const key = keyFn(item);
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
    }

    function formatLineRange(item) {
        if (!item.line) return '';
        return item.endLine && item.endLine !== item.line
            ? `:${item.line}-${item.endLine}`
            : `:${item.line}`;
    }

    function badge(text, color = '#0f0') {
        return `<span style="display:inline-block;color:${color};border:1px solid #333;background:#181818;border-radius:3px;padding:1px 5px;margin:1px 3px 1px 0;">${escapeHTML(text)}</span>`;
    }

    function card(title, body, meta = '') {
        return `
            <div style="border:1px solid #333;background:#161616;margin:6px 0;padding:7px;border-radius:4px;">
                <div style="color:#0f0;font-weight:bold;">${title}</div>
                ${meta ? `<div style="color:#888;margin:2px 0 5px;">${meta}</div>` : ''}
                <div>${body}</div>
            </div>
        `;
    }

    function preBlock(content, useHighlight = true) {
        return `<pre style="white-space:pre-wrap;background:#222;color:#6cf;padding:7px;margin:4px 0 0;overflow:auto;border-radius:3px;">${useHighlight ? highlightSuspicious(content) : escapeHTML(content)}</pre>`;
    }

    let bannerVisible = false;

    const toggleIcon = document.createElement('img');
    toggleIcon.src = ICON_WRENCH;
    toggleIcon.style.cssText = 'position:fixed;top:60px;right:10px;width:36px;height:36px;cursor:pointer;z-index:100000;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);transition:transform 0.2s;background:#111;';
    toggleIcon.addEventListener('mouseenter', () => { toggleIcon.style.transform = 'scale(1.1)'; });
    toggleIcon.addEventListener('mouseleave', () => { toggleIcon.style.transform = 'scale(1)'; });
    toggleIcon.addEventListener('click', toggleBanner);
    document.body.appendChild(toggleIcon);

    const banner = document.createElement('div');
    banner.id = 'wrench-banner';
    banner.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;max-height:380px;overflow:auto;background:#111;color:#0f0;font-family:monospace;font-size:13px;white-space:normal;padding:10px 16px;z-index:99999;border-bottom:2px solid #444;box-shadow:0 2px 4px rgba(0,0,0,0.3);box-sizing:border-box;';
    document.body.prepend(banner);

    const menu = document.createElement('div');
    menu.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;';
    banner.appendChild(menu);

    const content = document.createElement('div');
    content.style.cssText = 'white-space:normal;';
    banner.appendChild(content);

    function addButton(label, action) {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.style.cssText = 'background:#222;color:#0f0;border:1px solid #444;padding:4px 8px;cursor:pointer;font-family:monospace;';
        btn.addEventListener('click', action);
        menu.appendChild(btn);
    }

    function toggleBanner() {
        bannerVisible = !bannerVisible;
        banner.style.display = bannerVisible ? 'block' : 'none';
        toggleIcon.src = bannerVisible ? ICON_CLOSE : ICON_WRENCH;
    }

    function setLoading(label = 'Analyse en cours...') {
        content.innerHTML = `<span style="color:#aaa">${escapeHTML(label)}</span>`;
    }

    async function getPageBundle() {
        if (store.page) return store.page;

        const pageRes = await gmGet(document.location.href);
        if (!pageRes.ok) throw new Error('Impossible de charger le code source.');

        const source = pageRes.text || '';
        const doc = new DOMParser().parseFromString(source, 'text/html');
        const external = await collectExternalCode(doc);

        store.page = { source, doc, external, headers: pageRes.headers || '', url: document.location.href };
        return store.page;
    }

    async function getAnalysis() {
        if (store.analysis) return store.analysis;

        const page = await getPageBundle();

        const comments = uniqueItems([
            ...extractHTMLComments(page.source, page.url),
            ...extractInlineJsComments(page.doc, page.url),
            ...extractInlineCssComments(page.doc, page.url),
            ...page.external.jsResources.flatMap(resource => extractJSComments(resource.text, resource.url)),
            ...page.external.cssResources.flatMap(resource => extractCSSComments(resource.text, resource.url))
        ], comment => `${comment.type}:${comment.source}:${comment.line}:${comment.value}`);

        const combinedSources = [
            { label: page.url, text: page.source },
            ...page.external.jsResources.map(resource => ({ label: resource.url, text: resource.text })),
            ...page.external.cssResources.map(resource => ({ label: resource.url, text: resource.text }))
        ];

        const emails = extractEmails(combinedSources);
        const endpoints = extractEndpoints(combinedSources);
        const technologies = detectTechnologies(page, endpoints);
        const suspiciousComments = comments.filter(comment => SUSPICIOUS_RE.test(comment.value));

        store.analysis = { comments, emails, endpoints, technologies, suspiciousComments, external: page.external };
        return store.analysis;
    }

    async function collectExternalCode(doc) {
        const scriptUrls = [...doc.querySelectorAll('script[src]')]
            .map(script => absoluteUrl(script.getAttribute('src')))
            .filter(Boolean)
            .filter(isSameOrigin);

        const styleUrls = [...doc.querySelectorAll('link[rel~="stylesheet"][href]')]
            .map(link => absoluteUrl(link.getAttribute('href')))
            .filter(Boolean)
            .filter(isSameOrigin);

        const uniqueScriptUrls = uniqueItems(scriptUrls).slice(0, 20);
        const uniqueStyleUrls = uniqueItems(styleUrls).slice(0, 20);

        const jsResources = await Promise.all(uniqueScriptUrls.map(async url => {
            const res = await gmGet(url, 8000);
            return res.ok ? { url, text: res.text } : null;
        }));

        const cssResources = await Promise.all(uniqueStyleUrls.map(async url => {
            const res = await gmGet(url, 8000);
            return res.ok ? { url, text: res.text } : null;
        }));

        return {
            jsResources: jsResources.filter(Boolean),
            cssResources: cssResources.filter(Boolean),
            skippedExternal: {
                scripts: Math.max(0, scriptUrls.length - uniqueScriptUrls.length),
                stylesheets: Math.max(0, styleUrls.length - uniqueStyleUrls.length)
            }
        };
    }

    function extractHTMLComments(source, sourceLabel) {
        return [...source.matchAll(/<!--[\s\S]*?-->/g)]
            .map(match => ({
                type: 'HTML',
                value: match[0].trim(),
                source: sourceLabel,
                line: lineNumberAt(source, match.index || 0),
                endLine: lineNumberAt(source, (match.index || 0) + match[0].length)
            }))
            .filter(comment => comment.value !== '<!---->');
    }

    function extractInlineJsComments(doc, pageLabel) {
        return [...doc.querySelectorAll('script:not([src])')]
            .flatMap((script, index) => extractJSComments(
                script.textContent || '',
                `${pageLabel}#inline-script-${index + 1}`
            ));
    }

    function extractInlineCssComments(doc, pageLabel) {
        return [...doc.querySelectorAll('style')]
            .flatMap((style, index) => extractCSSComments(
                style.textContent || '',
                `${pageLabel}#inline-style-${index + 1}`
            ));
    }

    function extractCSSComments(css, sourceLabel) {
        return [...css.matchAll(/\/\*[\s\S]*?\*\//g)]
            .map(match => ({
                type: 'CSS',
                value: match[0].trim(),
                source: sourceLabel,
                line: lineNumberAt(css, match.index || 0),
                endLine: lineNumberAt(css, (match.index || 0) + match[0].length)
            }))
            .filter(comment => comment.value !== '/**/');
    }

    function extractJSComments(code, sourceLabel) {
        const comments = [];
        let i = 0;

        while (i < code.length) {
            const char = code[i];
            const next = code[i + 1];

            if (char === '"' || char === "'" || char === '`') {
                i = skipString(code, i);
                continue;
            }

            if (char === '/' && next === '/') {
                const block = readLineCommentBlock(code, i);
                if (block.value.trim()) {
                    comments.push({
                        type: 'JS',
                        value: block.value,
                        source: sourceLabel,
                        line: lineNumberAt(code, block.start),
                        endLine: lineNumberAt(code, block.end)
                    });
                }
                i = block.end;
                continue;
            }

            if (char === '/' && next === '*') {
                const start = i;
                i += 2;

                while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
                    i++;
                }

                const end = Math.min(i + 2, code.length);
                const raw = code.slice(start, end).trim();

                if (raw && raw !== '/**/') {
                    comments.push({
                        type: 'JS',
                        value: raw,
                        source: sourceLabel,
                        line: lineNumberAt(code, start),
                        endLine: lineNumberAt(code, end)
                    });
                }

                i = end;
                continue;
            }

            i++;
        }

        return comments;
    }

    function skipString(code, start) {
        const quote = code[start];
        let i = start + 1;

        while (i < code.length) {
            if (code[i] === '\\') {
                i += 2;
                continue;
            }

            if (code[i] === quote) {
                return i + 1;
            }

            i++;
        }

        return i;
    }

    function readLineCommentBlock(code, start) {
        let i = start;
        const lines = [];

        while (i < code.length && code[i] === '/' && code[i + 1] === '/') {
            const lineStart = i;
            i += 2;

            while (i < code.length && code[i] !== '\n' && code[i] !== '\r') {
                i++;
            }

            const line = code.slice(lineStart, i).trim();
            if (line) lines.push(line);

            const afterBreak = skipLineBreak(code, i);
            let k = afterBreak;

            while (k < code.length && (code[k] === ' ' || code[k] === '\t')) {
                k++;
            }

            if (code[k] === '/' && code[k + 1] === '/') {
                i = k;
                continue;
            }

            i = afterBreak;
            break;
        }

        return { start, end: i, value: lines.join('\n') };
    }

    function skipLineBreak(code, index) {
        if (code[index] === '\r' && code[index + 1] === '\n') return index + 2;
        if (code[index] === '\r' || code[index] === '\n') return index + 1;
        return index;
    }

    function extractEmails(sources) {
        const items = [];

        for (const source of sources) {
            for (const match of source.text.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)) {
                items.push({
                    value: match[0],
                    source: source.label,
                    line: lineNumberAt(source.text, match.index || 0)
                });
            }
        }

        return uniqueItems(items, item => item.value);
    }

    function extractEndpoints(sources) {
        const endpoints = [];

        for (const source of sources) {
            const found = [
                ...findFullUrls(source.text),
                ...findPaths(source.text),
                ...findSuspiciousFiles(source.text)
            ];

            for (const item of found) {
                const normalized = cleanEndpoint(item.value);
                if (!normalized || normalized.length < 2 || normalized.length > 300) continue;

                endpoints.push({
                    value: normalized,
                    source: source.label,
                    line: lineNumberAt(source.text, item.index || 0),
                    category: classifyEndpoint(normalized)
                });
            }
        }

        return uniqueItems(endpoints, item => item.value)
            .sort((a, b) => endpointPriority(b) - endpointPriority(a) || a.value.localeCompare(b.value));
    }

    function findFullUrls(text) {
        return [...text.matchAll(/https?:\/\/[^\s"'<>`)]+/g)]
            .map(match => ({ value: match[0], index: match.index || 0 }));
    }

    function findPaths(text) {
        return [...text.matchAll(/\/[A-Za-z0-9][A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]{1,}/g)]
            .map(match => ({ value: match[0], index: match.index || 0 }))
            .filter(item => !item.value.startsWith('//'))
            .filter(item => !/^\/[/*]/.test(item.value))
            .filter(item => !/^\/(svg|path|span|div|script|style|body|html|head|meta|link)>?/i.test(item.value));
    }

    function findSuspiciousFiles(text) {
        return [...text.matchAll(/\b[A-Za-z0-9_.-]+\.(?:env|bak|old|zip|tar|gz|sql|sqlite|db|log|json|xml|yml|yaml|csv|config|conf|ini|txt)\b/g)]
            .map(match => ({ value: match[0], index: match.index || 0 }));
    }

    function cleanEndpoint(value) {
        return value
            .replace(/[),.;\]}]+$/g, '')
            .replace(/&quot;$/g, '')
            .trim();
    }

    function classifyEndpoint(value) {
        const lower = value.toLowerCase();

        if (/debug|dev|staging|test|internal|secret|token|key|password|passwd|backup|old|dump|admin|\.env|\.sql|\.bak|\.zip|\.log|\.db|\.sqlite/.test(lower)) {
            return 'suspect';
        }

        if (/\/api\b|\/api\/|graphql|wp-json|rest\//.test(lower)) {
            return 'api';
        }

        if (/login|logout|signin|signup|auth|oauth|sso|session|account|dashboard|admin/.test(lower)) {
            return 'auth';
        }

        if (/\.(env|bak|old|zip|tar|gz|sql|sqlite|db|log|json|xml|yml|yaml|csv|config|conf|ini|txt)$/i.test(lower)) {
            return 'fichier';
        }

        if (/^https?:\/\//i.test(value)) {
            return isSameOrigin(value) ? 'interne' : 'externe';
        }

        return 'interne';
    }

    function endpointPriority(endpoint) {
        return {
            suspect: 5,
            auth: 4,
            api: 3,
            fichier: 2,
            interne: 1,
            externe: 0
        }[endpoint.category] || 0;
    }

    function detectTechnologies(page, endpoints) {
        const source = page.source;
        const scriptSrcs = [...page.doc.querySelectorAll('script[src]')].map(script => script.src).join('\n');
        const linkHrefs = [...page.doc.querySelectorAll('link[href]')].map(link => link.href).join('\n');
        const metaGenerator = page.doc.querySelector('meta[name="generator" i]')?.getAttribute('content') || '';
        const text = `${source}\n${scriptSrcs}\n${linkHrefs}\n${metaGenerator}\n${page.headers}`.toLowerCase();

        const checks = [
            ['WordPress', /wp-content|wp-includes|generator["']?\s*content=["']?wordpress|\/wp-json/i, 'wp-content / wp-json / generator'],
            ['Drupal', /drupal-settings-json|\/sites\/default\/|generator["']?\s*content=["']?drupal/i, 'drupal-settings-json / sites/default'],
            ['Next.js', /__next_data__|\/_next\/static/i, '/_next/static ou __NEXT_DATA__'],
            ['Nuxt', /__nuxt__|\/_nuxt\//i, '/_nuxt ou __NUXT__'],
            ['React', /react|data-reactroot|react-dom/i, 'react / react-dom'],
            ['Vue', /vue\.|vuejs|data-v-[a-f0-9]|__vue__/i, 'vue / data-v-*'],
            ['Angular', /ng-version|ng-app|angular/i, 'ng-version / angular'],
            ['jQuery', /jquery/i, 'jquery'],
            ['Bootstrap', /bootstrap/i, 'bootstrap'],
            ['Tailwind', /tailwind/i, 'tailwind'],
            ['Shopify', /cdn\.shopify|shopify\.theme|myshopify/i, 'shopify'],
            ['Cloudflare', /cloudflare|cf-ray|\/cdn-cgi\//i, 'cloudflare / cf-ray / cdn-cgi'],
            ['Google Tag Manager', /googletagmanager\.com|gtm-[a-z0-9]+/i, 'googletagmanager / GTM-*'],
            ['Google Analytics', /google-analytics\.com|gtag\(|ga\(/i, 'google analytics / gtag'],
            ['Matomo', /matomo|piwik/i, 'matomo / piwik']
        ];

        const detected = checks
            .filter(([, regex]) => regex.test(text))
            .map(([name, , proof]) => ({ name, proof }));

        if (endpoints.some(endpoint => endpoint.value.includes('/graphql'))) {
            detected.push({ name: 'GraphQL', proof: '/graphql détecté dans les endpoints' });
        }

        return uniqueItems(detected, tech => tech.name);
    }

    async function getRobotsData() {
        if (store.robots) return store.robots;

        const res = await gmGet(robotsUrl);

        if (!res.ok) {
            store.robots = { ok: false, status: res.status, text: '', sitemaps: [] };
            return store.robots;
        }

        const lines = res.text.trim().split('\n');
        const sitemaps = lines
            .filter(line => /^Sitemap:/i.test(line))
            .map(line => line.replace(/^Sitemap:\s*/i, '').trim())
            .filter(Boolean);

        store.robots = { ok: true, status: res.status, text: res.text, lines, sitemaps };
        return store.robots;
    }

    async function getSitemapData() {
        if (store.sitemap) return store.sitemap;

        const robots = await getRobotsData();
        const candidates = uniqueItems([
            ...(robots.sitemaps || []),
            `${baseUrl}/sitemap.xml`,
            `${baseUrl}/sitemap_index.xml`
        ]).slice(0, 5);

        const sitemaps = [];

        for (const url of candidates) {
            const res = await gmGet(url, 10000);
            if (!res.ok || !res.text) continue;

            const urls = [...res.text.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
                .map(match => match[1].trim())
                .filter(Boolean);

            if (urls.length) {
                sitemaps.push({
                    url,
                    count: urls.length,
                    urls: uniqueItems(urls).slice(0, 100)
                });
            }
        }

        store.sitemap = {
            candidates,
            sitemaps,
            totalUrls: sitemaps.reduce((sum, sitemap) => sum + sitemap.urls.length, 0)
        };

        return store.sitemap;
    }

    async function showSummary() {
        setLoading('Synthèse en cours...');
        try {
            const [analysis, robots, sitemap] = await Promise.all([
                getAnalysis(),
                getRobotsData(),
                getSitemapData()
            ]);

            const commentsByType = countBy(analysis.comments, item => item.type);
            const priorityEndpoints = analysis.endpoints.filter(endpoint => endpointPriority(endpoint) >= 2).slice(0, 10);
            const suspicious = [
                ...analysis.suspiciousComments.slice(0, 5).map(comment => ({
                    label: `[${comment.type}] ${shortenUrl(comment.source)}${formatLineRange(comment)}`,
                    value: comment.value
                })),
                ...priorityEndpoints.slice(0, 5).map(endpoint => ({
                    label: `[${endpoint.category}] ${shortenUrl(endpoint.source)}${formatLineRange(endpoint)}`,
                    value: endpoint.value
                }))
            ].slice(0, 8);

            let html = '';
            html += card('Synthèse', `
                ${badge(`Commentaires ${analysis.comments.length}`)}
                ${badge(`HTML ${commentsByType.HTML || 0}`)}
                ${badge(`JS ${commentsByType.JS || 0}`)}
                ${badge(`CSS ${commentsByType.CSS || 0}`)}
                ${badge(`Endpoints ${analysis.endpoints.length}`)}
                ${badge(`Prioritaires ${priorityEndpoints.length}`, '#ffd166')}
                ${badge(`E-mails ${analysis.emails.length}`)}
                ${badge(`Technos ${analysis.technologies.length}`)}
                ${badge(`Sitemap URLs ${sitemap.totalUrls}`)}
                ${badge(`robots.txt ${robots.ok ? 'OK' : 'absent'}`, robots.ok ? '#0f0' : '#f55')}
            `);

            html += card('À regarder en priorité', suspicious.length
                ? suspicious.map(item => `
                    <div style="margin:5px 0;">
                        <div style="color:#999;">${escapeHTML(item.label)}</div>
                        <code style="color:#6cf;">${highlightSuspicious(item.value)}</code>
                    </div>
                `).join('')
                : '<i>Aucun signal prioritaire évident.</i>'
            );

            html += card('Technos probables', analysis.technologies.length
                ? analysis.technologies.map(tech => `${badge(tech.name, '#6cf')} <span style="color:#999">${escapeHTML(tech.proof)}</span>`).join('<br>')
                : '<i>Aucune techno évidente détectée.</i>'
            );

            html += card('Ressources analysées', `
                Scripts JS même origine : ${analysis.external.jsResources.length}<br>
                Styles CSS même origine : ${analysis.external.cssResources.length}<br>
                Limite non analysée : ${analysis.external.skippedExternal.scripts} script(s), ${analysis.external.skippedExternal.stylesheets} stylesheet(s)
            `);

            content.innerHTML = html;
        } catch (error) {
            content.innerHTML = `Erreur : ${escapeHTML(error.message)}`;
        }
    }

    async function loadRobotsTxt() {
        setLoading('Chargement robots.txt...');
        const robots = await getRobotsData();

        if (!robots.ok) {
            content.innerHTML = robots.status === 404
                ? 'Aucun fichier robots.txt trouvé (404).'
                : `Erreur lors du chargement du robots.txt${robots.status ? ` (HTTP ${robots.status})` : ''}.`;
            return;
        }

        const sitemaps = [];
        const others = [];

        for (const line of robots.lines) {
            const safeLine = escapeHTML(line);
            if (/^Sitemap:/i.test(line)) {
                const url = line.replace(/^Sitemap:\s*/i, '').trim();
                sitemaps.push(`<strong><u>Sitemap:</u></strong> <a href="${safeHref(url)}" target="_blank" rel="noopener noreferrer" style="color:#6cf">${escapeHTML(url)}</a>`);
            } else if (/^User-agent:/i.test(line)) {
                others.push(`<span style="color:#ff0;">${safeLine}</span>`);
            } else if (/^Disallow:/i.test(line)) {
                others.push(`<span style="color:#f55;">${safeLine}</span>`);
            } else if (/^Allow:/i.test(line)) {
                others.push(`<span style="color:#5f5;">${safeLine}</span>`);
            } else {
                others.push(safeLine);
            }
        }

        content.innerHTML = [...sitemaps, ...others].join('<br>');
    }

    function loadMeta() {
        const meta = [...document.getElementsByTagName('meta')];
        const links = [...document.querySelectorAll('link[rel], link[href]')];

        let html = `<strong><u>Métadonnées :</u></strong><br>`;
        html += `<strong>Titre :</strong> ${escapeHTML(document.title || '(vide)')}<br><br>`;

        html += `<strong>Meta tags :</strong><br>`;
        html += meta.length
            ? meta.map(m => {
                const attrs = [...m.attributes]
                    .map(attr => `${escapeHTML(attr.name)}="${escapeHTML(attr.value)}"`)
                    .join(' ');
                return `<code style="color:#6cf">&lt;meta ${attrs}&gt;</code>`;
            }).join('<br>')
            : '<i>Aucune balise meta détectée.</i>';

        html += `<hr style="margin:10px 0;border:0;border-top:1px solid #333;">`;
        html += `<strong>Liens utiles :</strong><br>`;

        const usefulLinks = links
            .filter(link => /canonical|alternate|manifest|icon|stylesheet/i.test(link.rel || ''))
            .map(link => {
                const rel = link.rel || '(sans rel)';
                const href = link.href || link.getAttribute('href') || '';
                return `<span style="color:#ff0">${escapeHTML(rel)}</span> : <a href="${safeHref(href)}" target="_blank" rel="noopener noreferrer" style="color:#6cf">${escapeHTML(href)}</a>`;
            });

        html += usefulLinks.length ? usefulLinks.join('<br>') : '<i>Aucun lien notable détecté.</i>';
        content.innerHTML = html;
    }

    async function loadIPDNS() {
        setLoading('Résolution DNS...');

        const hostname = location.hostname;
        const dnsUrl = `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`;
        const dnsRes = await gmGet(dnsUrl);

        if (!dnsRes.ok) {
            content.innerHTML = 'Erreur DNS.';
            return;
        }

        let data;
        try {
            data = JSON.parse(dnsRes.text);
        } catch (_) {
            content.innerHTML = 'Réponse DNS illisible.';
            return;
        }

        const ips = Array.from(new Set((data.Answer || [])
            .map(answer => answer.data)
            .filter(ip => /^\d{1,3}(\.\d{1,3}){3}$/.test(ip))));

        if (!ips.length) {
            content.innerHTML = 'Aucune IPv4 trouvée via dns.google.';
            return;
        }

        content.innerHTML = `IP trouvées : ${ips.map(escapeHTML).join(', ')}<br>Géolocalisation...`;

        const results = await Promise.all(ips.map(async ip => {
            const geoRes = await gmGet(`https://ipwhois.app/json/${encodeURIComponent(ip)}`);
            if (!geoRes.ok) return `IP : ${escapeHTML(ip)}<br>Localisation indisponible.`;

            try {
                const geo = JSON.parse(geoRes.text);
                const flag = getFlagEmoji(geo.country_code);
                return `IP : ${escapeHTML(ip)}<br>Pays : ${escapeHTML(geo.country || 'inconnu')} ${flag} (${escapeHTML(geo.country_code || '?')})<br>ASN : ${escapeHTML(geo.org || 'inconnu')}`;
            } catch (_) {
                return `IP : ${escapeHTML(ip)}<br>Réponse de géolocalisation illisible.`;
            }
        }));

        content.innerHTML = results.join('<br><br>');
    }

    async function showComments() {
        setLoading('Analyse des commentaires...');
        try {
            const analysis = await getAnalysis();
            const counts = countBy(analysis.comments, comment => comment.type);

            let html = '';
            html += `<strong><u>Commentaires trouvés :</u></strong><br>`;
            html += `<span style="color:#aaa">HTML: ${counts.HTML || 0} | JS: ${counts.JS || 0} | CSS: ${counts.CSS || 0}</span><br>`;
            html += `<span style="color:#aaa">Les commentaires JS consécutifs sont regroupés en blocs.</span><br><br>`;

            html += analysis.comments.length
                ? analysis.comments.map(comment => {
                    const meta = `${escapeHTML(shortenUrl(comment.source))}${formatLineRange(comment)}`;
                    return card(`[${escapeHTML(comment.type)}]`, preBlock(comment.value), `<span>${meta}</span>`);
                }).join('')
                : '<i>Aucun commentaire détecté dans le code source.</i>';

            html += '<hr style="margin:10px 0;border:0;border-top:1px solid #333;">';
            html += '<strong><u>Adresses e-mail détectées :</u></strong><br>';
            html += analysis.emails.length
                ? analysis.emails.map(email => `<div>${badge(shortenUrl(email.source), '#999')} <span style="color:#ffd700">${escapeHTML(email.value)}</span></div>`).join('')
                : '<i>Aucune adresse e-mail détectée dans les sources analysées.</i>';

            content.innerHTML = html;
        } catch (error) {
            content.innerHTML = `Erreur : ${escapeHTML(error.message)}`;
        }
    }

    async function showEndpoints() {
        setLoading('Extraction des endpoints...');
        try {
            const analysis = await getAnalysis();
            const priority = analysis.endpoints.filter(endpoint => endpointPriority(endpoint) >= 2);
            const others = analysis.endpoints.filter(endpoint => endpointPriority(endpoint) < 2).slice(0, 80);

            let html = `<strong><u>Endpoints / URLs :</u></strong><br>`;
            html += `<span style="color:#aaa">${analysis.endpoints.length} élément(s), dont ${priority.length} prioritaire(s).</span><br><br>`;

            html += card('Prioritaires', priority.length
                ? priority.slice(0, 60).map(renderEndpoint).join('')
                : '<i>Aucun endpoint prioritaire évident.</i>'
            );

            html += card('Autres', others.length
                ? others.map(renderEndpoint).join('')
                : '<i>Aucun autre endpoint détecté.</i>'
            );

            content.innerHTML = html;
        } catch (error) {
            content.innerHTML = `Erreur : ${escapeHTML(error.message)}`;
        }
    }

    function renderEndpoint(endpoint) {
        const color = {
            suspect: '#ffd166',
            auth: '#ff7b72',
            api: '#6cf',
            fichier: '#c9a7ff',
            interne: '#0f0',
            externe: '#999'
        }[endpoint.category] || '#0f0';

        return `
            <div style="margin:4px 0;">
                ${badge(endpoint.category, color)}
                <code style="color:#6cf;">${highlightSuspicious(endpoint.value)}</code>
                <span style="color:#777;"> — ${escapeHTML(shortenUrl(endpoint.source))}${formatLineRange(endpoint)}</span>
            </div>
        `;
    }

    async function showTechnologies() {
        setLoading('Détection des technos...');
        try {
            const analysis = await getAnalysis();

            let html = `<strong><u>Technologies probables :</u></strong><br><br>`;
            html += analysis.technologies.length
                ? analysis.technologies.map(tech => card(
                    escapeHTML(tech.name),
                    `<span style="color:#999">Preuve : ${escapeHTML(tech.proof)}</span>`
                )).join('')
                : '<i>Aucune technologie évidente détectée.</i>';

            content.innerHTML = html;
        } catch (error) {
            content.innerHTML = `Erreur : ${escapeHTML(error.message)}`;
        }
    }

    async function showSitemap() {
        setLoading('Lecture des sitemaps...');
        const sitemap = await getSitemapData();

        let html = `<strong><u>Sitemap :</u></strong><br>`;
        html += `<span style="color:#aaa">Candidats testés : ${sitemap.candidates.length} | URLs extraites affichées : ${sitemap.totalUrls}</span><br><br>`;

        if (!sitemap.sitemaps.length) {
            content.innerHTML = html + '<i>Aucun sitemap lisible trouvé.</i>';
            return;
        }

        html += sitemap.sitemaps.map(item => card(
            escapeHTML(shortenUrl(item.url)),
            `
                <div style="color:#aaa;margin-bottom:4px;">${item.count} URL(s) dans le fichier, ${item.urls.length} affichée(s) max.</div>
                ${item.urls.map(url => `<div><a href="${safeHref(url)}" target="_blank" rel="noopener noreferrer" style="color:#6cf">${escapeHTML(shortenUrl(url))}</a></div>`).join('')}
            `
        )).join('');

        content.innerHTML = html;
    }

    function showTools() {
        const d = location.hostname;
        const tools = [
            { name: 'URLScan', url: `https://urlscan.io/domain/${d}` },
            { name: 'Shodan', url: `https://www.shodan.io/search?query=hostname:${d}` },
            { name: 'Hunter.io', url: `https://hunter.io/search/${d}` },
            { name: 'WHOIS', url: `https://who.is/whois/${d}` },
            { name: 'Wayback Machine', url: `https://web.archive.org/web/*/${d}` }
        ];

        const emojiMap = {
            'URLScan': '🔎',
            'Shodan': '🛰️',
            'Hunter.io': '🦊',
            'WHOIS': '🕵️',
            'Wayback Machine': '⏳'
        };

        content.textContent = '';
        tools.forEach((t, i) => {
            if (i > 0) content.appendChild(document.createElement('br'));
            content.appendChild(document.createTextNode(`${emojiMap[t.name] || '🔗'} `));
            const a = document.createElement('a');
            a.href = safeHref(t.url);
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.style.cssText = 'color:#6cf;text-decoration:none;';
            a.textContent = t.name;
            content.appendChild(a);
        });
    }

    const buttonDefinitions = [
        ['Synthèse', showSummary],
        ['Robots.txt', loadRobotsTxt],
        ['Métadonnées', loadMeta],
        ['IP / DNS', loadIPDNS],
        ['Code Source', showComments],
        ['Endpoints', showEndpoints],
        ['Technos', showTechnologies],
        ['Sitemap', showSitemap],
        ['Outils externes', showTools]
    ];

    buttonDefinitions.forEach(([label, action]) => addButton(label, action));
})();