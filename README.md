# 🛠 Wrench – Analyse passive OSINT sur navigateur

![Version](https://img.shields.io/badge/Version-2.9.3-blue)
![License](https://img.shields.io/badge/License-GPLv3-teal)
[![Install Wrench on GreasyFork](https://img.shields.io/badge/Install-GreasyFork-red.svg)](https://greasyfork.org/fr/scripts/538478-wrench)  
[![Author: Th3rd](https://img.shields.io/badge/github-Th3rdMan-181717?logo=github)](https://github.com/Th3rdMan)

**Wrench** est un userscript minimaliste conçu pour l’**analyse passive** des sites web visités, directement depuis le navigateur.

Il sert à repérer rapidement des informations utiles en OSINT léger : `robots.txt`, métadonnées, IP/DNS, commentaires laissés dans le code source, adresses e-mail et liens vers des outils externes.

---

## 🔍 Fonctionnalités

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

  Les commentaires trouvés sont affichés avec leur type, leur source et leur ligne quand elle est disponible.

- 📧 **Détection d’adresses e-mail**  
  Recherche dans le HTML source et dans les ressources JS/CSS analysées.

- 🧰 **Outils OSINT intégrés**  
  Accès rapide à [`urlscan.io`](https://urlscan.io), [`Shodan`](https://shodan.io), [`Hunter.io`](https://hunter.io), [`Who.is`](https://who.is) et [`Wayback Machine`](https://web.archive.org).

---

## 🎯 Objectif

Wrench est pensé comme un outil d’observation rapide pour la cybersécurité, l’OSINT, les CTF et la veille.

Il reste volontairement simple :

- pas de scan agressif ;
- pas de fuzzing ;
- pas d’exploitation ;
- pas de soumission de formulaires ;
- pas de modification côté serveur ;
- pas de contournement d’accès.

Le script effectue uniquement des lectures utiles à l’analyse : page courante, `robots.txt`, résolution DNS, géolocalisation IP et ressources JS/CSS de même origine.

---

## ⚠️ Limites connues

- Les fichiers JS/CSS cross-origin ne sont pas analysés automatiquement.
- Les scripts/styles externes sont limités aux 20 premiers par type.
- Les contenus générés dynamiquement après chargement peuvent ne pas apparaître dans le HTML source récupéré.
- L’analyse des commentaires JS évite les chaînes de caractères simples, doubles et template literals, mais ne remplace pas un parseur JavaScript complet.
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

   - `Robots.txt` → règles d’exploration et sitemaps ;
   - `Métadonnées` → informations HTML internes ;
   - `IP / DNS` → IP, géolocalisation et ASN ;
   - `Code Source` → commentaires HTML/JS/CSS et e-mails ;
   - `Outils externes` → raccourcis vers plateformes OSINT.

---

## 🧪 Exemple d’usage OSINT

Le module `Code Source` est utile pour repérer rapidement :

- commentaires oubliés par les développeurs ;
- noms de variables ou de modules révélateurs ;
- traces de staging, TODO, debug ou anciennes routes ;
- adresses e-mail exposées ;
- indices laissés dans les fichiers JS/CSS inline ou même origine.

---

## ✍️ Auteur

**Th3rd**  
👁️‍🗨️ [https://github.com/Th3rdMan](https://github.com/Th3rdMan)

---

> 📘 Script libre sous licence GPLv3. Contributions, suggestions et pull requests bienvenues.
