# 🛠 Wrench – Analyse passive OSINT sur navigateur

![Version](https://img.shields.io/badge/Version-2.9-blue)
![License](https://img.shields.io/badge/License-GPLv3-teal)
[![Install Wrench on GreasyFork](https://img.shields.io/badge/Install-GreasyFork-red.svg)](https://greasyfork.org/fr/scripts/538478-wrench)  
[![Author: Th3rd](https://img.shields.io/badge/github-Th3rdMan-181717?logo=github)](https://github.com/Th3rdMan)

**Wrench** est un script utilisateur minimaliste conçu pour l’**analyse passive** des sites web visités, directement depuis ton navigateur.

---

## 🔍 Fonctionnalités

- 📜 **Lecture intelligente de `robots.txt`**  
  Coloration syntaxique (`Allow`, `Disallow`, `User-agent`) et affichage des `Sitemap`
- 🧠 **Extraction des métadonnées HTML**  
  Titre, description, auteur, lien canonique
- 🌍 **Résolution DNS & géolocalisation IP**  
  Adresse IP, pays (avec drapeau), ASN, organisation
- 🧱 **Analyse du code source**  
  Extraction des commentaires HTML + adresses e-mail
- 🧰 **Outils OSINT intégrés**  
  Accès direct à [`urlscan.io`](https://urlscan.io), [`Shodan`](https://shodan.io), [`Hunter.io`](https://hunter.io), [`Who.is`](https://who.is), [`Wayback Machine`](https://web.archive.org)

---

## 🎯 Objectif

🔒 Un outil 100 % **passif**, pensé pour les passionnés de cybersécurité, d’enquêtes en ligne et de veille :

- Aucune requête intrusive vers le site visité  
- Aucune modification ou injection de contenu  
- Aucune collecte ou transmission de données

---

## 📦 Installation

1. Installe une extension telle que [Tampermonkey](https://www.tampermonkey.net)
   > *(Pense à activer le mode développeur dans Tampermonkey)*  
3. Clique ici pour installer le script : [GreasyFork – Wrench](https://greasyfork.org/fr/scripts/538478-wrench)

---

## 🧭 Tutoriel d’utilisation

1. **Navigue sur un site web**  
   Le script s’exécute automatiquement à chaque chargement de page.

2. **Clique sur l’icône Wrench en haut à droite**  
![Wrench Icon](https://github.com/Th3rdMan/wrench-userscript/blob/main/wrench.png)

🦏 *Si rien n’apparaît, c’est que le site est soit minimaliste, soit bien protégé.*

4. **Explore les modules proposés :**
   - `Robots.txt` → Règles d’exploration + sitemap
   - `Métadonnées` → Infos internes HTML
   - `IP / DNS` → Adresse IP + géoloc + ASN
   - `Code source` → Commentaires + e-mails
   - `Outils externes` → Ouvre les plateformes OSINT dans un nouvel onglet

---

## ✍️ Auteur

**Th3rd**  
👁️‍🗨️ [https://github.com/Th3rdMan](https://github.com/Th3rdMan)

---

> 📘 Script libre sous licence GPLv3. Contributions, suggestions ou pull requests bienvenues !
