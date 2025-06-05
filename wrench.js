// ==UserScript==
// @name         Wrench
// @namespace    https://github.com/Th3rdMan
// @version      2.5.1
// @description  Analyse passive d’un site web : robots.txt, métadonnées, IP, DNS et outils OSINT.
// @author       Th3rd
// @match        *://*/*
// @grant        GM_xmlhttpRequest
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
    toggleIcon.addEventListener('mouseenter', () => toggleIcon.style.transform = 'scale(1.1)');
    toggleIcon.addEventListener('mouseleave', () => toggleIcon.style.transform = 'scale(1)');
    toggleIcon.addEventListener('click', toggleBanner);
    document.body.appendChild(toggleIcon);

    const banner = document.createElement('div');
    banner.id = 'osinter-banner';
    banner.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;max-height:300px;overflow:auto;background:#111;color:#0f0;font-family:monospace;font-size:13px;white-space:pre-wrap;padding:10px 16px;z-index:99999;border-bottom:2px solid #444;box-shadow:0 2px 4px rgba(0,0,0,0.3);';
    document.body.prepend(banner);

    const menu = document.createElement('div');
    menu.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;';
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
            onerror: () => content.innerHTML = 'Erreur lors du chargement.'
        });
    }

    function loadMeta() {
        const meta = document.getElementsByTagName('meta');
        let info = `<strong>Titre</strong> : ${document.title}\n`;
        for (let m of meta) {
            if (m.name === 'description') info += `\n<strong>Description</strong> : ${m.content}`;
            if (m.name === 'author') info += `\n<strong>Auteur</strong> : ${m.content}`;
        }
        const c = document.querySelector("link[rel='canonical']");
        if (c) info += `\n<strong>Canonical</strong> : ${c.href}`;
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
                if (!data.Answer) return content.innerHTML = 'Aucune IP trouvée.';
                const aRecords = data.Answer.filter(a => a.type === 1);
                if (aRecords.length === 0) return content.innerHTML = 'Aucune IP trouvée.';

                content.innerHTML = 'Chargement des infos IP...';

                Promise.all(
                    aRecords.map(a =>
                        new Promise(resolve => {
                            const ip = a.data;
                            GM_xmlhttpRequest({
                                method: 'GET',
                                url: `https://ipwhois.app/json/${ip}`,
                                onload: r => {
                                    const g = JSON.parse(r.responseText);
                                    const f = g.country_code ? ` <img src='https://flagcdn.com/16x12/${g.country_code.toLowerCase()}.png' style='vertical-align:middle;'>` : '';
                                    resolve(`IP\u00a0: ${ip}\nPays\u00a0: ${g.country} (${g.country_code})${f}\nASN\u00a0: ${g.org}`);
                                },
                                onerror: () => resolve(`IP\u00a0: ${ip}\nLocalisation indisponible.`)
                            });
                        })
                    )
                ).then(results => {
                    content.innerHTML = results.join('\n\n');
                });
            },
            onerror: () => content.innerHTML = 'Erreur DNS.'
        });
    }

    function showTools() {
        const d = location.hostname;
        const tools = [
            { name: 'URLScan', url: `https://urlscan.io/domain/${d}` },
            { name: 'crt.sh', url: `https://crt.sh/?q=%25.${d}` },
            { name: 'Shodan', url: `https://www.shodan.io/search?query=hostname:${d}` },
            { name: 'Hunter.io', url: `https://hunter.io/search/${d}` },
            { name: 'WHOIS', url: `https://who.is/whois/${d}` }
        ];
        content.innerHTML = tools.map(t => `<div style="display:flex;align-items:center;gap:6px;margin:0;"><img src="https://www.google.com/s2/favicons?sz=16&domain=${t.url}" style="margin:0;"><a href="${t.url}" target="_blank" style="color:#6cf">${t.name}</a></div>`).join('');
    }

    addButton('robots.txt', loadRobotsTxt);
    addButton('Méta', loadMeta);
    addButton('IP / DNS', loadIPDNS);
    addButton('Outils', showTools);
})();
