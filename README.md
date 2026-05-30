# 🛠 Wrench – Analyse passive OSINT sur navigateur

![Version](https://img.shields.io/badge/Version-2.10.0-blue)
![License](https://img.shields.io/badge/License-GPLv3-teal)
[![Install Wrench on GreasyFork](https://img.shields.io/badge/Install-GreasyFork-red.svg)](https://greasyfork.org/fr/scripts/538478-wrench)  
[![Author: Th3rd](https://img.shields.io/badge/github-Th3rdMan-181717?logo=github)](https://github.com/Th3rdMan)

**Wrench** est un userscript compact conçu pour l’**analyse passive** des sites web visités, directement depuis le navigateur.

Il sert à repérer rapidement des informations utiles en OSINT léger, CTF ou veille : `robots.txt`, métadonnées, IP/DNS, commentaires dans le code source, endpoints, technos probables, sitemaps, adresses e-mail et liens vers des outils externes.

---

## 🔍 Fonctionnalités

- 🧭 **Synthèse compacte**  
  Vue d’ensemble rapide : nombre de commentaires, endpoints, éléments prioritaires, e-mails, technos détectées, URLs de sitemap et état de `robots.txt`.

- 📜 **Lecture de `robots.txt`**  
  Coloration visuelle des directives `Allow`, `Disallow`, `User-agent` et affichage des `Sitemap`.

- 🧠 **Extraction des métadonnées HTML**  
  Titre de page, balises `<meta>`, liens canoniques, manifestes, icônes et stylesheets déclarées.

- 🌍 **Résolution DNS & géolocalisation IP**  
  Résolution IPv4 via DNS, pays avec drapeau, ASN et organisation associée.

- 🧱 **Analyse du code source**  
  Extraction des commentaires :
  - HTML : `<!-- ... -->`
  - JavaScript : `// ...` et `/* ... */`
  - CSS : `/* ... */`

  Le module analyse :
  - le HTML source de la page ;
  - les scripts JavaScript inline ;
  - les styles CSS inline ;
  - les fichiers JS/CSS externes de **même origine**, limités aux 20 premiers pour éviter de ralentir la page.

  Les commentaires JavaScript `//` consécutifs sont regroupés en blocs pour garder une lecture compacte.

- 🎯 **Mots-clés suspects**  
  Mise en évidence de termes comme `flag`, `ctf`, `debug`, `todo`, `secret`, `token`, `password`, `admin`, `internal`, `staging`, `backup`, `dev`, `test`, etc.

- 🔗 **Extraction d’endpoints / URLs**  
  Détection passive de chemins, URLs complètes, fichiers potentiellement intéressants et routes exposées dans le HTML/JS/CSS.

  Les résultats sont classés par type :
  - `suspect`
  - `api`
  - `auth`
  - `fichier`
  - `interne`
  - `externe`

- 🧬 **Détection technologique légère**  
  Identification probable de technologies via indices visibles : WordPress, Drupal, Next.js, Nuxt, React, Vue, Angular, jQuery, Bootstrap, Shopify, Cloudflare, Google Tag Manager, Google Analytics, Matomo, GraphQL.

- 🗺️ **Lecture des sitemaps**  
  Extraction passive des URLs depuis les sitemaps déclarés dans `robots.txt` ou depuis `/sitemap.xml` et `/sitemap_index.xml`.  
  L’affichage est limité pour rester lisible.

- 📧 **Détection d’adresses e-mail**  
  Recherche dans le HTML source et dans les ressources JS/CSS analysées.

- 🧰 **Outils OSINT intégrés**  
  Accès rapide à [`urlscan.io`](https://urlscan.io), [`Shodan`](https://shodan.io), [`Hunter.io`](https://hunter.io), [`Who.is`](https://who.is) et [`Wayback Machine`](https://web.archive.org).

---

## 🎯 Objectif

Wrench est pensé comme un outil d’observation rapide pour la cybersécurité, l’OSINT, les CTF et la veille.

Il reste volontairement simple et passif :

- pas de scan agressif ;
- pas de fuzzing ;
- pas d’exploitation ;
- pas de soumission de formulaires ;
- pas de modification côté serveur ;
- pas de contournement d’accès ;
- pas de crawl massif.

Le script effectue uniquement des lectures utiles à l’analyse : page courante, `robots.txt`, résolution DNS, géolocalisation IP, ressources JS/CSS de même origine et sitemaps.

---

## ⚠️ Limites connues

- Les fichiers JS/CSS cross-origin ne sont pas analysés automatiquement.
- Les scripts/styles externes sont limités aux 20 premiers par type.
- Les sitemaps sont lus de manière limitée pour rester compacts.
- Les contenus générés dynamiquement après chargement peuvent ne pas apparaître dans le HTML source récupéré.
- L’analyse des commentaires JS évite les chaînes de caractères simples, doubles et template literals, mais ne remplace pas un parseur JavaScript complet.
- La détection technologique est indicative : elle signale des indices, pas une preuve exhaustive.
- Wrench n’est pas un scanner de vulnérabilités : c’est un assistant de lecture passive.

---

## 📦 Installation

1. Installe une extension de userscripts comme [Tampermonkey](https://www.tampermonkey.net).
2. Active le mode développeur si ton navigateur ou Tampermonkey le demande.
3. Installe le script depuis GreasyFork : [Wrench](https://greasyfork.org/fr/scripts/538478-wrench).

---

## 🧭 Utilisation

1. Navigue sur un site web.  
   Le script se lance automatiquement au chargement de la page.

2. Clique sur l’icône Wrench en haut à droite.

   ![Wrench Icon](https://github.com/Th3rdMan/wrench-userscript/blob/main/wrench.png)

3. Explore les modules disponibles :

   - `Synthèse` → résumé compact des éléments intéressants ;
   - `Robots.txt` → règles d’exploration et sitemaps déclarés ;
   - `Métadonnées` → informations HTML internes ;
   - `IP / DNS` → IP, géolocalisation et ASN ;
   - `Code Source` → commentaires HTML/JS/CSS regroupés et e-mails ;
   - `Endpoints` → chemins, URLs, APIs, routes auth, fichiers et éléments suspects ;
   - `Technos` → technologies probables avec indices de détection ;
   - `Sitemap` → URLs extraites des sitemaps lisibles ;
   - `Outils externes` → raccourcis vers plateformes OSINT.

---

## 🧪 Exemple d’usage OSINT / CTF

Le module `Synthèse` sert de point d’entrée. Il permet de voir immédiatement si une page expose quelque chose d’intéressant.

Le module `Code Source` est utile pour repérer :

- commentaires oubliés par les développeurs ;
- blocs de notes ou de TODO ;
- traces de staging, debug ou anciennes routes ;
- indices laissés dans les fichiers JS/CSS inline ou même origine ;
- adresses e-mail exposées.

Le module `Endpoints` est utile pour repérer :

- routes d’API ;
- endpoints d’authentification ;
- fichiers potentiellement sensibles ;
- chemins internes ;
- URLs externes liées au site.

---

## ✍️ Auteur

**Th3rd**  
👁️‍🗨️ [https://github.com/Th3rdMan](https://github.com/Th3rdMan)

---

> 📘 Script libre sous licence GPLv3. Contributions, suggestions et pull requests bienvenues.
