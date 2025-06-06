// ==UserScript==
// @name         Wrench
// @namespace    http://tampermonkey.net/
// @version      2.9
// @description  Analyse passive d’un site web : robots.txt, métadonnées, IP / DNS, commentaires HTML et outils OSINT externes.
// @author       Th3rd
// @match        *://*/*
// @grant        GM_xmlhttpRequest
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

    const ICON_WRENCH = 'data:image/png;base64,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';
    const ICON_CLOSE = 'data:image/png;base64,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';
    const baseUrl = location.origin;
    const robotsUrl = `${baseUrl}/robots.txt`;
    // flagcdn bloqué par CSP
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
    return FLAG_EMOJIS[countryCode?.toUpperCase()] || '';
    }

    let bannerVisible = false;

    const toggleIcon = document.createElement('img');
    toggleIcon.src = ICON_WRENCH;
    toggleIcon.style.cssText = 'position:fixed;top:60px;right:10px;width:36px;height:36px;cursor:pointer;z-index:100000;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);transition:transform 0.2s;';
    toggleIcon.addEventListener('mouseenter', () => { toggleIcon.style.transform = 'scale(1.1)'; });
    toggleIcon.addEventListener('mouseleave', () => { toggleIcon.style.transform = 'scale(1)'; });
    toggleIcon.addEventListener('click', toggleBanner);
    document.body.appendChild(toggleIcon);

    const banner = document.createElement('div');
    banner.id = 'osinter-banner';
    banner.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;max-height:300px;overflow:auto;background:#111;color:#0f0;font-family:monospace;font-size:13px;white-space:pre-wrap;padding:10px 16px;z-index:99999;border-bottom:2px solid #444;box-shadow:0 2px 4px rgba(0,0,0,0.3);';
    document.body.prepend(banner);

    const menu = document.createElement('div');
    menu.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;';
    banner.appendChild(menu);

    const content = document.createElement('div');
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

    function loadRobotsTxt() {
    content.innerHTML = 'Chargement robots.txt...';
    GM_xmlhttpRequest({
        method: 'GET',
        url: robotsUrl,
        onload: res => {
            if (res.status === 404) {
                content.innerHTML = "Aucun fichier robots.txt trouvé (404).";
                return;
            }
            if (res.status >= 400) {
                content.innerHTML = `Erreur lors du chargement du robots.txt (HTTP ${res.status})`;
                return;
            }
            const lines = res.responseText.trim().split('\n');
            const sitemaps = [], others = [];
            for (let line of lines) {
                if (/^Sitemap:/i.test(line)) {
                    const url = line.replace(/^Sitemap:\s*/i, '').trim();
                    sitemaps.push(`<strong><u>Sitemap:</u></strong> <a href='${url}' target='_blank' style='color:#6cf'>${url}</a>`);
                } else if (/^User-agent:/i.test(line)) others.push(`<span style='color:#ff0;'>${line}</span>`);
                else if (/^Disallow:/i.test(line)) others.push(`<span style='color:#f55;'>${line}</span>`);
                else if (/^Allow:/i.test(line)) others.push(`<span style='color:#5f5;'>${line}</span>`);
                else others.push(line);
            }
            content.innerHTML = [...sitemaps, ...others].join('\n');
        },
        onerror: () => { content.innerHTML = 'Erreur lors du chargement.'; }
    });
}

    function loadMeta() {
        const meta = document.getElementsByTagName('meta');
        let info = `<strong>Titre</strong> : ${document.title}`;
        for (let m of meta) {
            if (m.name === 'description') info += `<br><strong>Description</strong> : ${m.content}`;
            if (m.name === 'author') info += `<br><strong>Auteur</strong> : ${m.content}`;
        }
        const c = document.querySelector("link[rel='canonical']");
        if (c) info += `<br><strong>Canonical</strong> : ${c.href}`;
        content.innerHTML = info;
    }

    function loadIPDNS() {
        const d = location.hostname;
        content.innerHTML = 'Résolution DNS...';
        GM_xmlhttpRequest({
            method: 'GET',
            url: `https://dns.google/resolve?name=${d}&type=A`,
            onload: res => {
                const data = JSON.parse(res.responseText);
                if (!data.Answer) {
                    content.innerHTML = 'Aucune IP trouvée.';
                    return;
                }
                const aRecords = data.Answer.filter(a => a.type === 1);
                if (aRecords.length === 0) {
                    content.innerHTML = 'Aucune IP trouvée.';
                    return;
                }
                content.innerHTML = 'Chargement des infos IP...';
                Promise.all(
                    aRecords.map(a => new Promise(resolve => {
                        const ip = a.data;
                        GM_xmlhttpRequest({
                            method: 'GET',
                            url: `https://ipwhois.app/json/${ip}`,
                            onload: r => {
                                const g = JSON.parse(r.responseText);
                                const f = getFlagEmoji(g.country_code);
                                resolve(`IP : ${ip}<br>Pays : ${g.country} ${f} (${g.country_code})<br>ASN : ${g.org}`);
                            },
                            onerror: () => resolve(`IP : ${ip}<br>Localisation indisponible.`)
                        });
                    }))
                ).then(results => {
                    content.innerHTML = results.join('<br><br>');
                });
            },
            onerror: function() { content.innerHTML = 'Erreur DNS.'; }
        });
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
        "URLScan": "🔎",
        "Shodan": "🛰️",
        "Hunter.io": "🦊",
        "WHOIS": "🕵️",
        "Wayback Machine": "⏳"
    };

    content.innerHTML = tools.map(t =>
        `${emojiMap[t.name] || '🔗'} <a href="${t.url}" target="_blank" style="color:#6cf;text-decoration:none;">${t.name}</a>`
    ).join('<br>');
}

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
    }

    function extractCommentsFromDOM(node, arr = []) {
        for (let child of node.childNodes) {
            if (child.nodeType === Node.COMMENT_NODE) arr.push(child.nodeValue.trim());
            else extractCommentsFromDOM(child, arr);
        }
        return arr;
    }

function showComments() {
    content.innerHTML = 'Chargement et analyse du code source...';
    GM_xmlhttpRequest({
        method: 'GET',
        url: document.location.href,
        onload: res => {
            const matches = [...res.responseText.matchAll(/<!--([\s\S]*?)-->/g)];
            const comments = matches.map(m => m[1].trim()).filter(Boolean);
            const emails = [...res.responseText.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)]
                .map(m => m[0]);
            const uniqueEmails = Array.from(new Set(emails));

            let html = '';
            html += `<strong><u>Commentaires HTML trouvés :</u></strong><br>`;
            html += comments.length
                ? comments.map(c => `<pre style="white-space:pre-wrap;background:#222;color:#6cf;padding:4px;">&lt;!-- ${escapeHTML(c)} --&gt;</pre>`).join('')
                : "<i>Aucun commentaire HTML détecté dans le code source.</i>";

            html += `<hr style="margin:10px 0;border:0;border-top:1px solid #333;">`;
            html += `<strong><u>Adresses e-mail détectées :</u></strong><br>`;
            html += uniqueEmails.length
                ? uniqueEmails.map(email => `<span style="color:#ffd700">${escapeHTML(email)}</span>`).join('<br>')
                : "<i>Aucune adresse e-mail détectée dans le code source.</i>";

            content.innerHTML = html;
        },
        onerror: function() { content.innerHTML = 'Erreur lors du chargement du code source.'; }
    });
}

    [
        ['Robots.txt', loadRobotsTxt],
        ['Métadonnées', loadMeta],
        ['IP / DNS', loadIPDNS],
        ['Code Source', showComments],
        ['Outils externes', showTools]
    ].forEach(([label, action]) => addButton(label, action));
})();
