// ==UserScript==
// @name         Wrench
// @namespace    http://tampermonkey.net/
// @version      2.9.3
// @description  Analyse passive d’un site web : robots.txt, métadonnées, IP / DNS, commentaires HTML/JS/CSS et outils OSINT externes.
// @author       Th3rd
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceURL
// @resource     wrenchIcon https://raw.githubusercontent.com/Th3rdMan/Wrench-Userscript/main/wrench.png
// @connect      ipwhois.app
// @connect      dns.google
// @connect      www.google.com
// @connect      urlscan.io
// @connect      shodan.io
// @connect      hunter.io
// @connect      who.is
// @connect      web.archive.org
// @grant        unsafeWindow
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

    const makeSvgIcon = svg => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

    const ICON_WRENCH = typeof GM_getResourceURL === 'function'
        ? GM_getResourceURL('wrenchIcon')
        : 'https://raw.githubusercontent.com/Th3rdMan/Wrench-Userscript/main/wrench.png';

    const ICON_CLOSE = makeSvgIcon(`
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="30" fill="#e63946"/>
            <path d="M22 22l20 20M42 22L22 42" stroke="#fff" stroke-width="7" stroke-linecap="round"/>
        </svg>
    `);

    const FLAG_EMOJIS = {
        "AD": "🇦🇩", "AE": "🇦🇪", "AF": "🇦🇫", "AG": "🇦🇬", "AI": "🇦🇮", "AL": "🇦🇱", "AM": "🇦🇲", "AO": "🇦🇴",
        "AR": "🇦🇷", "AS": "🇦🇸", "AT": "🇦🇹", "AU": "🇦🇺", "AW": "🇦🇼", "AX": "🇦🇽", "AZ": "🇦🇿", "BA": "🇧🇦",
        "BB": "🇧🇧", "BD": "🇧🇩", "BE": "🇧🇪", "BF": "🇧🇫", "BG": "🇧🇬", "BH": "🇧🇭", "BI": "🇧🇮", "BJ": "🇧🇯",
        "BL": "🇧🇱", "BM": "🇧🇲", "BN": "🇧🇳", "BO": "🇧🇴", "BQ": "🇧🇶", "BR": "🇧🇷", "BS": "🇧🇸", "BT": "🇧🇹",
        "BV": "🇧🇻", "BW": "🇧🇼", "BY": "🇧🇾", "BZ": "🇧🇿", "CA": "🇨🇦", "CC": "🇨🇨", "CD": "🇨🇩", "CF": "🇨🇫",
        "CG": "🇨🇬", "CH": "🇨🇭", "CI": "🇨🇮", "CK": "🇨🇰", "CL": "🇨🇱", "CM": "🇨🇲", "CN": "🇨🇳", "CO": "🇨🇴",
        "CR": "🇨🇷", "CU": "🇨🇺", "CV": "🇨🇻", "CW": "🇨🇼", "CX": "🇨🇽", "CY": "🇨🇾", "CZ": "🇨🇿", "DE": "🇩🇪",
        "DJ": "🇩🇯", "DK": "🇩🇰", "DM": "🇩🇲", "DO": "🇩🇴", "DZ": "🇩🇿", "EC": "🇪🇨", "EE": "🇪🇪", "EG": "🇪🇬",
        "EH": "🇪🇭", "ER": "🇪🇷", "ES": "🇪🇸", "ET": "🇪🇹", "FI": "🇫🇮", "FJ": "🇫🇯", "FM": "🇫🇲", "FO": "🇫🇴",
        "FR": "🇫🇷", "GA": "🇬🇦", "GB": "🇬🇧", "GD": "🇬🇩", "GE": "🇬🇪", "GF": "🇬🇫", "GG": "🇬🇬", "GH": "🇬🇭",
        "GI": "🇬🇮", "GL": "🇬🇱", "GM": "🇬🇲", "GN": "🇬🇳", "GP": "🇬🇵", "GQ": "🇬🇶", "GR": "🇬🇷", "GT": "🇬🇹",
        "GU": "🇬🇺", "GW": "🇬🇼", "GY": "🇬🇾", "HK": "🇭🇰", "HM": "🇭🇲", "HN": "🇭🇳", "HR": "🇭🇷", "HT": "🇭🇹",
        "HU": "🇭🇺", "ID": "🇮🇩", "IE": "🇮🇪", "IL": "🇮🇱", "IM": "🇮🇲", "IN": "🇮🇳", "IO": "🇮🇴", "IQ": "🇮🇶",
        "IR": "🇮🇷", "IS": "🇮🇸", "IT": "🇮🇹", "JE": "🇯🇪", "JM": "🇯🇲", "JO": "🇯🇴", "JP": "🇯🇵", "KE": "🇰🇪",
        "KG": "🇰🇬", "KH": "🇰🇭", "KI": "🇰🇮", "KM": "🇰🇲", "KN": "🇰🇳", "KP": "🇰🇵", "KR": "🇰🇷", "KW": "🇰🇼",
        "KY": "🇰🇾", "KZ": "🇰🇿", "LA": "🇱🇦", "LB": "🇱🇧", "LC": "🇱🇨", "LI": "🇱🇮", "LK": "🇱🇰", "LR": "🇱🇷",
        "LS": "🇱🇸", "LT": "🇱🇹", "LU": "🇱🇺", "LV": "🇱🇻", "LY": "🇱🇾", "MA": "🇲🇦", "MC": "🇲🇨", "MD": "🇲🇩",
        "ME": "🇲🇪", "MF": "🇲🇫", "MG": "🇲🇬", "MH": "🇲🇭", "MK": "🇲🇰", "ML": "🇲🇱", "MM": "🇲🇲", "MN": "🇲🇳",
        "MO": "🇲🇴", "MP": "🇲🇵", "MQ": "🇲🇶", "MR": "🇲🇷", "MS": "🇲🇸", "MT": "🇲🇹", "MU": "🇲🇺", "MV": "🇲🇻",
        "MW": "🇲🇼", "MX": "🇲🇽", "MY": "🇲🇾", "MZ": "🇲🇿", "NA": "🇳🇦", "NC": "🇳🇨", "NE": "🇳🇪", "NF": "🇳🇫",
        "NG": "🇳🇬", "NI": "🇳🇮", "NL": "🇳🇱", "NO": "🇳🇴", "NP": "🇳🇵", "NR": "🇳🇷", "NU": "🇳🇺", "NZ": "🇳🇿",
        "OM": "🇴🇲", "PA": "🇵🇦", "PE": "🇵🇪", "PF": "🇵🇫", "PG": "🇵🇬", "PH": "🇵🇭", "PK": "🇵🇰", "PL": "🇵🇱",
        "PM": "🇵🇲", "PN": "🇵🇳", "PR": "🇵🇷", "PT": "🇵🇹", "PW": "🇵🇼", "PY": "🇵🇾", "QA": "🇶🇦", "RE": "🇷🇪",
        "RO": "🇷🇴", "RS": "🇷🇸", "RU": "🇷🇺", "RW": "🇷🇼", "SA": "🇸🇦", "SB": "🇸🇧", "SC": "🇸🇨", "SD": "🇸🇩",
        "SE": "🇸🇪", "SG": "🇸🇬", "SH": "🇸🇭", "SI": "🇸🇮", "SJ": "🇸🇯", "SK": "🇸🇰", "SL": "🇸🇱", "SM": "🇸🇲",
        "SN": "🇸🇳", "SO": "🇸🇴", "SR": "🇸🇷", "SS": "🇸🇸", "ST": "🇸🇹", "SV": "🇸🇻", "SX": "🇸🇽", "SY": "🇸🇾",
        "SZ": "🇸🇿", "TC": "🇹🇨", "TD": "🇹🇩", "TF": "🇹🇫", "TG": "🇹🇬", "TH": "🇹🇭", "TJ": "🇹🇯", "TK": "🇹🇰",
        "TL": "🇹🇱", "TM": "🇹🇲", "TN": "🇹🇳", "TO": "🇹🇴", "TR": "🇹🇷", "TT": "🇹🇹", "TV": "🇹🇻", "TZ": "🇹🇿",
        "UA": "🇺🇦", "UG": "🇺🇬", "UM": "🇺🇲", "US": "🇺🇸", "UY": "🇺🇾", "UZ": "🇺🇿", "VA": "🇻🇦", "VC": "🇻🇨",
        "VE": "🇻🇪", "VG": "🇻🇬", "VI": "🇻🇮", "VN": "🇻🇳", "VU": "🇻🇺", "WF": "🇼🇫", "WS": "🇼🇸", "YE": "🇾🇪",
        "YT": "🇾🇹", "ZA": "🇿🇦", "ZM": "🇿🇲", "ZW": "🇿🇼"
    };

    function getFlagEmoji(countryCode) {
        if (typeof countryCode !== 'string' || !countryCode) return '';
        return FLAG_EMOJIS[countryCode.toUpperCase()] || '';
    }

    function escapeHTML(str) {
        return String(str).replace(/[&<>'"]/g, c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[c]));
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
                    error: null
                }),
                onerror: () => resolve({ ok: false, status: 0, text: '', finalUrl: url, error: 'network' }),
                ontimeout: () => resolve({ ok: false, status: 0, text: '', finalUrl: url, error: 'timeout' })
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

    let bannerVisible = false;

    const toggleIcon = document.createElement('img');
    toggleIcon.src = ICON_WRENCH;
    toggleIcon.style.cssText = 'position:fixed;top:60px;right:10px;width:36px;height:36px;cursor:pointer;z-index:100000;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);transition:transform 0.2s;background:#111;';
    toggleIcon.addEventListener('mouseenter', () => { toggleIcon.style.transform = 'scale(1.1)'; });
    toggleIcon.addEventListener('mouseleave', () => { toggleIcon.style.transform = 'scale(1)'; });
    toggleIcon.addEventListener('click', toggleBanner);
    document.body.appendChild(toggleIcon);

    const banner = document.createElement('div');
    banner.id = 'osinter-banner';
    banner.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;max-height:340px;overflow:auto;background:#111;color:#0f0;font-family:monospace;font-size:13px;white-space:normal;padding:10px 16px;z-index:99999;border-bottom:2px solid #444;box-shadow:0 2px 4px rgba(0,0,0,0.3);box-sizing:border-box;';
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

    async function loadRobotsTxt() {
        content.innerHTML = 'Chargement robots.txt...';
        const res = await gmGet(robotsUrl);

        if (res.status === 404) {
            content.innerHTML = 'Aucun fichier robots.txt trouvé (404).';
            return;
        }

        if (!res.ok) {
            content.innerHTML = `Erreur lors du chargement du robots.txt${res.status ? ` (HTTP ${res.status})` : ''}.`;
            return;
        }

        const lines = res.text.trim().split('\n');
        const sitemaps = [];
        const others = [];

        for (const line of lines) {
            const safeLine = escapeHTML(line);
            if (/^Sitemap:/i.test(line)) {
                const url = line.replace(/^Sitemap:\s*/i, '').trim();
                sitemaps.push(`<strong><u>Sitemap:</u></strong> <a href="${escapeHTML(url)}" target="_blank" style="color:#6cf">${escapeHTML(url)}</a>`);
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
                return `<span style="color:#ff0">${escapeHTML(rel)}</span> : <a href="${escapeHTML(href)}" target="_blank" style="color:#6cf">${escapeHTML(href)}</a>`;
            });

        html += usefulLinks.length ? usefulLinks.join('<br>') : '<i>Aucun lien notable détecté.</i>';
        content.innerHTML = html;
    }

    async function loadIPDNS() {
        content.innerHTML = 'Résolution DNS...';

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

        content.innerHTML = tools.map(t =>
            `${emojiMap[t.name] || '🔗'} <a href="${escapeHTML(t.url)}" target="_blank" style="color:#6cf;text-decoration:none;">${escapeHTML(t.name)}</a>`
        ).join('<br>');
    }

    function extractHTMLComments(source, sourceLabel) {
        return [...source.matchAll(/<!--[\s\S]*?-->/g)]
            .map(m => ({
                type: 'HTML',
                value: m[0].trim(),
                source: sourceLabel,
                line: lineNumberAt(source, m.index || 0)
            }))
            .filter(c => c.value.trim() !== '<!---->');
    }

    function extractCSSComments(css, sourceLabel) {
        return [...css.matchAll(/\/\*[\s\S]*?\*\//g)]
            .map(m => ({
                type: 'CSS',
                value: m[0].trim(),
                source: sourceLabel,
                line: lineNumberAt(css, m.index || 0)
            }))
            .filter(c => c.value.trim() !== '/**/');
    }

    function extractJSComments(code, sourceLabel) {
        const comments = [];
        let i = 0;

        while (i < code.length) {
            const char = code[i];
            const next = code[i + 1];

            if (char === '"' || char === "'" || char === '`') {
                const quote = char;
                i++;

                while (i < code.length) {
                    if (code[i] === '\\') {
                        i += 2;
                        continue;
                    }

                    if (code[i] === quote) {
                        i++;
                        break;
                    }

                    i++;
                }

                continue;
            }

            if (char === '/' && next === '/') {
                const tokenIndex = i;
                const start = i + 2;
                i += 2;

                while (i < code.length && code[i] !== '\n' && code[i] !== '\r') {
                    i++;
                }

                const value = code.slice(start, i).trim();
                if (value) {
                    comments.push({
                        type: 'JS',
                        value: `// ${value}`,
                        source: sourceLabel,
                        line: lineNumberAt(code, tokenIndex)
                    });
                }

                continue;
            }

            if (char === '/' && next === '*') {
                const tokenIndex = i;
                const start = i + 2;
                i += 2;

                while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
                    i++;
                }

                const value = code.slice(start, i).trim();
                if (value) {
                    comments.push({
                        type: 'JS',
                        value: `/* ${value} */`,
                        source: sourceLabel,
                        line: lineNumberAt(code, tokenIndex)
                    });
                }

                i += 2;
                continue;
            }

            i++;
        }

        return comments;
    }

    function uniqueItems(items, keyFn) {
        const seen = new Set();
        return items.filter(item => {
            const key = keyFn(item);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
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

        const uniqueScriptUrls = uniqueItems(scriptUrls, url => url).slice(0, 20);
        const uniqueStyleUrls = uniqueItems(styleUrls, url => url).slice(0, 20);

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

    async function showComments() {
        content.innerHTML = 'Chargement et analyse du code source...';

        const pageRes = await gmGet(document.location.href);
        if (!pageRes.ok) {
            content.innerHTML = 'Erreur lors du chargement du code source.';
            return;
        }

        const source = pageRes.text || '';
        const parsed = new DOMParser().parseFromString(source, 'text/html');
        const pageLabel = document.location.href;

        const htmlComments = extractHTMLComments(source, pageLabel);

        const inlineJsComments = [...parsed.querySelectorAll('script:not([src])')]
            .flatMap((script, index) => extractJSComments(script.textContent || '', `${pageLabel}#inline-script-${index + 1}`));

        const inlineCssComments = [...parsed.querySelectorAll('style')]
            .flatMap((style, index) => extractCSSComments(style.textContent || '', `${pageLabel}#inline-style-${index + 1}`));

        const external = await collectExternalCode(parsed);

        const externalJsComments = external.jsResources
            .flatMap(resource => extractJSComments(resource.text, resource.url));

        const externalCssComments = external.cssResources
            .flatMap(resource => extractCSSComments(resource.text, resource.url));

        const allComments = uniqueItems([
            ...htmlComments,
            ...inlineJsComments,
            ...inlineCssComments,
            ...externalJsComments,
            ...externalCssComments
        ], comment => `${comment.type}:${comment.source}:${comment.value}`);

        const searchableText = [
            source,
            ...external.jsResources.map(resource => resource.text),
            ...external.cssResources.map(resource => resource.text)
        ].join('\n');

        const uniqueEmails = uniqueItems(
            [...searchableText.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)].map(m => m[0]),
            email => email.toLowerCase()
        );

        const counts = allComments.reduce((acc, comment) => {
            acc[comment.type] = (acc[comment.type] || 0) + 1;
            return acc;
        }, {});

        let html = '';
        html += `<strong><u>Commentaires trouvés dans le code source :</u></strong><br>`;
        html += `<span style="color:#aaa">HTML: ${counts.HTML || 0} | JS: ${counts.JS || 0} | CSS: ${counts.CSS || 0}</span><br>`;
        html += `<span style="color:#aaa">Scripts/styles externes analysés : ${external.jsResources.length + external.cssResources.length} même origine.</span><br>`;

        if (external.skippedExternal.scripts || external.skippedExternal.stylesheets) {
            html += `<span style="color:#aaa">Limite appliquée : ${external.skippedExternal.scripts} script(s) et ${external.skippedExternal.stylesheets} stylesheet(s) non analysés au-delà des 20 premiers.</span><br>`;
        }

        html += '<br>';

        if (allComments.length) {
            html += allComments.map(comment => `
                <div style="margin:6px 0;">
                    <span style="color:#0f0;">[${escapeHTML(comment.type)}]</span>
                    <span style="color:#999;">${escapeHTML(shortenUrl(comment.source))}${comment.line ? `:${comment.line}` : ''}</span>
                    <pre style="white-space:pre-wrap;background:#222;color:#6cf;padding:6px;margin:3px 0;overflow:auto;">${escapeHTML(comment.value)}</pre>
                </div>
            `).join('');
        } else {
            html += '<i>Aucun commentaire détecté dans le code source.</i>';
        }

        html += '<hr style="margin:10px 0;border:0;border-top:1px solid #333;">';
        html += '<strong><u>Adresses e-mail détectées :</u></strong><br>';
        html += uniqueEmails.length
            ? uniqueEmails.map(email => `<span style="color:#ffd700">${escapeHTML(email)}</span>`).join('<br>')
            : '<i>Aucune adresse e-mail détectée dans le code source.</i>';

        content.innerHTML = html;
    }

    const buttonDefinitions = [
        ['Robots.txt', loadRobotsTxt],
        ['Métadonnées', loadMeta],
        ['IP / DNS', loadIPDNS],
        ['Code Source', showComments],
        ['Outils externes', showTools]
    ];

    buttonDefinitions.forEach(([label, action]) => addButton(label, action));
})();
