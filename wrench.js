// ==UserScript==
// @name         Wrench
// @namespace    https://github.com/Th3rdMan
// @version      2.9
// @description  Analyse passive d’un site web : robots.txt, métadonnées, IP / DNS, commentaires HTML et outils OSINT externes.
// @author       Th3rd
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      *
// @run-at       document-end
// @license      GPL-3.0
// ==/UserScript==

(function () {
    'use strict';

    const ICON_WRENCH = 'https://cdn-icons-png.flaticon.com/128/617/617034.png';
    const ICON_CLOSE = 'https://cdn-icons-png.flaticon.com/128/9426/9426995.png';
    const baseUrl = location.origin;
    const robotsUrl = `${baseUrl}/robots.txt`;

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
                                const f = g.country_code ? ` <img src='https://flagcdn.com/16x12/${g.country_code.toLowerCase()}.png' style='vertical-align:middle;'>` : '';
                                resolve(`IP : ${ip}<br>Pays : ${g.country} (${g.country_code})${f}<br>ASN : ${g.org}`);
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
        content.innerHTML = tools.map(t => `<div style="display:flex;align-items:center;gap:6px;margin:0;"><img src="https://www.google.com/s2/favicons?sz=16&domain=${t.url}" style="margin:0;"><a href="${t.url}" target="_blank" style="color:#6cf">${t.name}</a></div>`).join('');
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
