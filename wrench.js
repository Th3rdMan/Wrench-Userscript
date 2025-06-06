// ==UserScript==
// @name         Wrench
// @namespace    https://github.com/Th3rdMan
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
// @connect      crt.sh
// @connect      web.archive.org
// @grant        unsafeWindow
// @connect      *
// @run-at       document-end
// @license      GPL-3.0
// ==/UserScript==

(function () {
    'use strict';

    const ICON_WRENCH = 'data:image/png;base64,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';
    const ICON_CLOSE = 'data:image/png;base64,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';
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
    content.innerHTML = tools.map(t => `
content.innerHTML = tools.map(t => `
  <div style="display:flex;align-items:center;gap:6px;margin:0;">
    <img src="https://www.google.com/s2/favicons?sz=16&domain=${t.url}"
         style="margin:0;" width="16" height="16"
         onerror="this.remove()">
    <a href="${t.url}" target="_blank" style="color:#6cf">${t.name}</a>
  </div>
`).join('');


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
