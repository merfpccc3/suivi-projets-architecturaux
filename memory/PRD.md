# PRD — SUIVI DES PROJETS D'ARCHITECTURE

## Original problem statement
Application web professionnelle « SUIVI DES PROJETS D'ARCHITECTURE » (français, FCFA, PWA installable « SUIVI PROJETS ») : tableau de bord, enregistrement des projets (n° auto, client, réception, lieu, type, description, concept, besoins, infos techniques facultatives), étapes (11 modifiables), tâches avec avancement %, suivi financier (honoraires, avance, paiements multiples Espèces/TMoney/Flooz/Virement/Autre, solde), documents joints, fiche détaillée + historique, impressions A4 (fiche projet, états financiers, rapport d'activité, liste des tâches, reçu de paiement), PDF, export Excel/CSV, recherche & filtres, statuts (Nouveau, En attente, En cours, En validation, Terminé, Livré, Suspendu), design bleu foncé/blanc/gris/vert, responsive, stockage local, sauvegarde/import. React + TypeScript + localStorage + PWA, prêt GitHub/Vercel. Pas de paiement en ligne/IA/API externe. Budget crédits strict.
User choices: en-tête « SUIVI DES PROJETS D'ARCHITECTURE — Gestion – Conception – Suivi des réalisations » ; pièces jointes en stockage navigateur limité (~5 Mo).

## Architecture
- Frontend only: CRA/craco + TypeScript (/app/frontend/src/*.tsx), React Router, sonner, lucide-react, html2pdf.js (lazy) for PDF.
- Data: localStorage key `suivi_projets_architecture_v1` (store.tsx). Documents base64 (1 Mo/fichier).
- Print: PrintProvider portal preview (A4) + window.print + PDF; @page pagination.
- PWA: public/manifest.json, sw.js (network-first), icons. vercel.json rewrites.

## Implemented (2026-11-26)
- All sections 2–16 implemented; tested E2E by testing agent (iteration_1: 97%, no blocking bugs).
- Fixes after test: receipt shows totals as of its payment date; note on advance edit; task edits logged.

- 2026-11-26: removed platform script from index.html; customizable identity (owner name, logo ≤300 Ko) in Settings, shown in sidebar + printed docs.

## Backlog
- P2: log step field edits in history; French date picker display.
