# 🛠 Wrench – Analyse passive OSINT sur navigateur

![Version](https://img.shields.io/badge/Version-2.5.1-blue)
![License](https://img.shields.io/badge/License-GPLv3-teal)
[![Install Wrench on GreasyFork](https://img.shields.io/badge/Install-GreasyFork-red.svg)](https://greasyfork.org/fr/scripts/538478-wrench)  
[![Author: Th3rd](https://img.shields.io/badge/github-Th3rdMan-181717?logo=github)](https://github.com/Th3rdMan)


**Wrench** est un script utilisateur léger conçu pour afficher des informations clés sur le site web visité, directement dans le navigateur, sans interaction active avec le serveur cible.

## 🔍 Fonctionnalités

- Affiche les directives du fichier `robots.txt` (coloration des règles, liens cliquables, sitemap en tête)
- Extrait les métadonnées principales : titre, description, auteur, lien canonique
- Résout l’IP du domaine et récupère :
  - Le pays (avec drapeau)
  - L’ASN et l’organisation associée
- Fournit des raccourcis vers des outils OSINT en ligne :
  - `urlscan.io`, `crt.sh`, `Shodan`, `Hunter.io`, `Who.is`

## 🎯 Objectif

Ce script vise une **analyse passive** :
- **Aucune requête intrusive** vers le site analysé
- **Aucune dépendance externe invasive**
- **Respect de la vie privée**, aucune donnée collectée ou transmise

## 📦 Installation

1. Installe une extension compatible comme [Tampermonkey](https://www.tampermonkey.net/)
2. Ouvre ce lien : [Installer Wrench](https://greasyfork.org/fr/scripts/538478-wrench)
3. Active le script
   
## ✍️ Auteur

**Th3rd**  
👁️‍🗨️ [https://github.com/Th3rdMan](https://github.com/Th3rdMan)

---

> Projet personnel, libre d’usage. Contributions bienvenues via pull request.
