// src/initTestData.js
import { db } from './db';
import { convertirMontants } from './utils/taux';

async function safeBulkAdd(tableName, data) {
    try {
        if (!data || data.length === 0) return;
        await db[tableName].bulkAdd(data);
        console.log(`✅ ${tableName} : ${data.length} élément(s)`);
    } catch (error) {
        console.error(`❌ ERREUR dans ${tableName} :`, error);
        throw error;
    }
}

export async function initTestData() {
    const confirmation = confirm(
        "⚠️ Ce script va réinitialiser les données (sauf utilisateurs, caisses et banques) avec des données de test jusqu'au 26 avril 2026. Continuer ?"
    );
    if (!confirmation) return;

    console.log("🚀 Initialisation des données de test 2026 (jusqu'au 26/04/2026)...");

    // Définition des limites de date
    const DATE_LIMITE = new Date(2026, 3, 26); // 26 avril 2026
    const DEBUT_ANNEE = new Date(2026, 0, 1);
    const JOURS_TOTAL = Math.floor((DATE_LIMITE - DEBUT_ANNEE) / (1000 * 60 * 60 * 24)) + 1; // 116 jours
    const SEMAINES_TOTAL = 16; // semaines ISO du 5 janvier au 26 avril (semaine 0 à 15)
    const MOIS_TOTAL = 4; // janvier (0) à avril (3)

    // ========== 1. VIDER LES TABLES (sauf utilisateurs, caisses et banques) ==========
    const tablesAEffacer = [
        'postes_budgetaires', 'budgets', 'budget_versions', 'taux_change_mensuel', 'taux_change',
        'travailleurs', 'salaires_historique', 'presence_suspension', 'avances', 'remboursements_avances', 'primes',
        'sites', 'typesContenants', 'stocks', 'lots', 'mouvements', 'mouvement_lignes',
        'transferts', 'transfert_lignes', 'inventaires', 'inventaire_lignes', 'reconditionnements',
        'semaines_recolte', 'recolte_journaliere',
        'semaines_production', 'production_consommation', 'production_lot',
        'clients', 'types_clients', 'tarifs', 'factures', 'facture_lignes', 'bons_livraison', 'bl_lignes',
        'reglages',
        'objectifs_mensuels', 'projets', 'affectations_projet', 'charges_abonnement', 'parametres_analytiques',
        'ecritures_manuelles', 'plan_comptable', 'poste_compte', 'journaux', 'parametres_export', 'repartitions_ecritures'
    ];
    for (const table of tablesAEffacer) {
        try { await db[table].clear(); } catch (e) { /* ignorer */ }
    }

    // ========== 2. UTILISATEURS (admin déjà présent, ajouter les autres si nécessaire) ==========
    if ((await db.utilisateurs.count()) <= 1) {
        await safeBulkAdd('utilisateurs', [
            { id: crypto.randomUUID(), nom: 'Jean Caissier', login: 'caissier', mot_de_passe: 'caisse', role: 'caissier' },
            { id: crypto.randomUUID(), nom: 'Marie Vente', login: 'vente', mot_de_passe: 'vente', role: 'superviseur_vente' },
            { id: crypto.randomUUID(), nom: 'Paul Prod', login: 'prod', mot_de_passe: 'prod', role: 'superviseur_huilerie' }
        ]);
    }

    // ========== 3. RÉGLAGES DE BASE ==========
    const reglagesToAdd = [
        {
            cle: 'roles', valeur: [
                { nom: 'superviseur', permissions: { recolte: 'ecriture', production: 'ecriture', stocks: 'ecriture', clients: 'ecriture', caisses: 'ecriture', budgets: 'ecriture', reglages: 'ecriture', factures: 'ecriture', travailleurs: 'ecriture', banque: 'ecriture', comptabilite: 'ecriture', ventes: 'ecriture' }, groupes: ['admin', 'production', 'ventes', 'caisse_banque', 'finance'] },
                { nom: 'superviseur_huilerie', permissions: { recolte: 'lecture', production: 'ecriture', stocks: 'ecriture', clients: 'lecture', caisses: 'lecture', budgets: 'lecture', reglages: 'lecture', factures: 'lecture', travailleurs: 'aucun', banque: 'aucun', comptabilite: 'lecture', ventes: 'lecture' }, groupes: ['production'] },
                { nom: 'superviseur_vente', permissions: { recolte: 'lecture', production: 'lecture', stocks: 'ecriture', clients: 'ecriture', caisses: 'ecriture', budgets: 'lecture', reglages: 'lecture', factures: 'ecriture', travailleurs: 'aucun', banque: 'aucun', comptabilite: 'lecture', ventes: 'ecriture' }, groupes: ['ventes', 'caisse_banque'] },
                { nom: 'vendeur', permissions: { recolte: 'aucun', production: 'aucun', stocks: 'lecture', clients: 'ecriture', caisses: 'aucun', budgets: 'aucun', reglages: 'aucun', factures: 'lecture', travailleurs: 'aucun', banque: 'aucun', comptabilite: 'aucun', ventes: 'lecture' }, groupes: [] },
                { nom: 'caissier', permissions: { recolte: 'aucun', production: 'aucun', stocks: 'lecture', clients: 'lecture', caisses: 'ecriture', budgets: 'lecture', reglages: 'aucun', factures: 'lecture', travailleurs: 'aucun', banque: 'aucun', comptabilite: 'aucun', ventes: 'lecture' }, groupes: ['caisse_banque'] }
            ]
        },
        { cle: 'parcelles', valeur: ['Parcelle A', 'Parcelle B'] },
        { cle: 'secteurs', valeur: ['Centre-ville', 'Est', 'Ouest'] },
        { cle: 'coordonnees', valeur: { nom: 'Huilerie SARL', adresse: '123 Avenue de la Paix', telephone: '+243 123 456 789', email: 'contact@huilerie.com', logo: '', legalInfo: 'RC 12345' } },
        { cle: 'taux_change', valeur: { USD_CDF: 2500 } },
        { cle: 'postes_travail', valeur: ['Ouvrier', 'Comptable', 'Vendeur', 'Superviseur'] },
        { cle: 'departements', valeur: ['Production', 'Comptabilité', 'Vente', 'Logistique'] },
        { cle: 'params_conges', valeur: { joursVacancesAnnuels: 26, plafondAvanceMois: 80, joursOuvrablesMois: 26 } },
        { cle: 'facteurs_emission', valeur: { gasoil_kg_co2_par_l: 2.68, essence_kg_co2_par_l: 2.31 } },
        { cle: 'taux_conversion', valeur: { huile_l_kg: 0.9, fruits_l_kg: 10 / 12 } }
    ];
    for (const r of reglagesToAdd) {
        await db.reglages.add({ id: crypto.randomUUID(), cle: r.cle, valeur: r.valeur });
    }

    // ========== 4. POSTES BUDGÉTAIRES ==========
    const postesBudget = [
        { id: crypto.randomUUID(), nom: 'Vente huile', type: 'entree', lieFacture: true, estRetraitBancaire: false, actif: true, systeme: false, annee: 2026 },
        { id: crypto.randomUUID(), nom: 'Transport régimes', type: 'sortie', lieFacture: false, estRetraitBancaire: false, actif: true, systeme: false, annee: 2026 },
        { id: crypto.randomUUID(), nom: 'Carburant', type: 'sortie', lieFacture: false, estRetraitBancaire: false, actif: true, systeme: false, annee: 2026 },
        { id: crypto.randomUUID(), nom: 'Salaire - Production', type: 'sortie', lieFacture: false, estRetraitBancaire: false, actif: true, systeme: true, annee: 2026 },
        { id: crypto.randomUUID(), nom: 'Salaire - Comptabilité', type: 'sortie', lieFacture: false, estRetraitBancaire: false, actif: true, systeme: true, annee: 2026 },
        { id: crypto.randomUUID(), nom: 'Salaire - Vente', type: 'sortie', lieFacture: false, estRetraitBancaire: false, actif: true, systeme: true, annee: 2026 },
        { id: crypto.randomUUID(), nom: 'Maintenance', type: 'sortie', lieFacture: false, estRetraitBancaire: false, actif: true, systeme: false, annee: 2026 },
        { id: crypto.randomUUID(), nom: 'Loyer', type: 'sortie', lieFacture: false, estRetraitBancaire: false, actif: true, systeme: false, annee: 2026 },
        { id: crypto.randomUUID(), nom: 'Fournitures de bureau', type: 'sortie', lieFacture: false, estRetraitBancaire: false, actif: true, systeme: false, annee: 2026 },
        { id: crypto.randomUUID(), nom: 'Honoraires comptables', type: 'sortie', lieFacture: false, estRetraitBancaire: false, actif: true, systeme: false, annee: 2026 },
        { id: crypto.randomUUID(), nom: 'Annulation écriture antérieure', type: 'sortie', lieFacture: false, estRetraitBancaire: false, actif: true, systeme: true, annee: 2026 }
    ];
    await safeBulkAdd('postes_budgetaires', postesBudget);

    // ========== 5. PLAN COMPTABLE ==========
    const planComptable = [
        { id: crypto.randomUUID(), numero_compte: '701501', intitule: 'Ventes huile', type: 'produit' },
        { id: crypto.randomUUID(), numero_compte: '624101', intitule: 'Transport régimes', type: 'charge' },
        { id: crypto.randomUUID(), numero_compte: '624201', intitule: 'Carburant', type: 'charge' },
        { id: crypto.randomUUID(), numero_compte: '641101', intitule: 'Salaires Production', type: 'charge' },
        { id: crypto.randomUUID(), numero_compte: '615201', intitule: 'Maintenance', type: 'charge' },
        { id: crypto.randomUUID(), numero_compte: '613201', intitule: 'Loyer', type: 'charge' },
        { id: crypto.randomUUID(), numero_compte: '606401', intitule: 'Fournitures de bureau', type: 'charge' },
        { id: crypto.randomUUID(), numero_compte: '622601', intitule: 'Honoraires comptables', type: 'charge' }
    ];
    await safeBulkAdd('plan_comptable', planComptable);

    // ========== 6. ASSOCIATION POSTE/COMPTE ==========
    const posteCompte = [
        { id: crypto.randomUUID(), posteId: postesBudget[0].id, compteId: planComptable[0].id },
        { id: crypto.randomUUID(), posteId: postesBudget[1].id, compteId: planComptable[1].id },
        { id: crypto.randomUUID(), posteId: postesBudget[2].id, compteId: planComptable[2].id },
        { id: crypto.randomUUID(), posteId: postesBudget[3].id, compteId: planComptable[3].id },
        { id: crypto.randomUUID(), posteId: postesBudget[4].id, compteId: planComptable[5].id },
        { id: crypto.randomUUID(), posteId: postesBudget[5].id, compteId: planComptable[6].id },
        { id: crypto.randomUUID(), posteId: postesBudget[6].id, compteId: planComptable[7].id }
    ];
    await safeBulkAdd('poste_compte', posteCompte);

    // ========== 7. JOURNAUX ==========
    await safeBulkAdd('journaux', [
        { id: crypto.randomUUID(), code: 'OD', libelle: 'Opérations diverses', type: 'manuel' }
    ]);

    // ========== 8. TAUX DE CHANGE JOURNALIERS (jusqu'au 26 avril 2026) ==========
    const tauxJournaliers = [];
    for (let i = 0; i < JOURS_TOTAL; i++) {
        const date = new Date(DEBUT_ANNEE);
        date.setDate(DEBUT_ANNEE.getDate() + i);
        tauxJournaliers.push({
            id: crypto.randomUUID(),
            date: date.toISOString().slice(0, 10),
            taux: 2500 + Math.floor(Math.random() * 50)
        });
    }
    await safeBulkAdd('taux_change', tauxJournaliers);

    // ========== 9. CAISSES (si aucune) ==========
    if ((await db.caisses.count()) === 0) {
        const caisseId = crypto.randomUUID();
        await db.caisses.add({ id: caisseId, nom: 'Caisse Principale', active: true });
        const sousCaisses = [
            { id: crypto.randomUUID(), caisseId, nom: 'Espèces USD', devise: 'USD', solde_initial: 0, typePaiement: '1', actif: true },
            { id: crypto.randomUUID(), caisseId, nom: 'Espèces CDF', devise: 'CDF', solde_initial: 0, typePaiement: '1', actif: true }
        ];
        await safeBulkAdd('sous_caisses', sousCaisses);
        // Créer une semaine de caisse initiale
        const lundi = new Date(2026, 0, 5); // premier lundi de 2026
        lundi.setDate(lundi.getDate() - (lundi.getDay() === 0 ? 6 : lundi.getDay() - 1));
        await db.semaines_caisse.add({
            id: crypto.randomUUID(),
            caisseId,
            dateDebut: lundi.toISOString().slice(0, 10),
            dateFin: new Date(lundi.getTime() + 6 * 86400000).toISOString().slice(0, 10),
            soldeOuvertureUSD: 0,
            soldeOuvertureCDF: 0,
            soldeClotureUSD: 0,
            soldeClotureCDF: 0,
            estCloturee: false
        });
    }

    // ========== 10. COMPTES BANCAIRES (si aucun) ==========
    let compteBanque = null;
    if ((await db.comptes_bancaires.count()) === 0) {
        const compteId = crypto.randomUUID();
        await db.comptes_bancaires.add({
            id: compteId,
            nom: 'Banque Rawbank',
            titulaire: 'Huilerie SARL',
            numero: '123456789',
            devise: 'USD',
            solde_initial: 10000
        });
        compteBanque = { id: compteId, devise: 'USD' };
    } else {
        compteBanque = (await db.comptes_bancaires.toArray())[0];
    }

    // ========== 11. MOUVEMENTS DE CAISSE ET BANQUE (janvier à avril 2026) ==========
    const caissePrincipale = (await db.caisses.toArray())[0];
    const sousCaisses = await db.sous_caisses.where('caisseId').equals(caissePrincipale.id).toArray();
    const semaineCaisse = (await db.semaines_caisse.where('caisseId').equals(caissePrincipale.id).first());

    const mouvementsCaisse = [];
    const mouvementsBanque = [];

    // Générer des mouvements mensuels pour janvier à avril
    for (let mois = 0; mois < MOIS_TOTAL; mois++) {
        const nbOps = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < nbOps; i++) {
            const jourMax = mois === 3 ? 26 : new Date(2026, mois + 1, 0).getDate();
            const jour = 1 + Math.floor(Math.random() * jourMax);
            const date = `2026-${String(mois + 1).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
            const type = Math.random() > 0.4 ? 'sortie' : 'entree';
            const posteCandidats = postesBudget.filter(p => p.type === type && p.actif);
            const poste = posteCandidats[Math.floor(Math.random() * posteCandidats.length)];
            const devise = Math.random() > 0.5 ? 'USD' : 'CDF';
            const montant = devise === 'USD'
                ? Math.round(50 + Math.random() * 500)
                : Math.round(10000 + Math.random() * 500000);
            const { montant_cdf, montant_usd } = await convertirMontants(montant, devise, date);

            // 50% caisse, 50% banque
            if (Math.random() > 0.5 && sousCaisses.length > 0) {
                const sc = sousCaisses.find(s => s.devise === devise) || sousCaisses[0];
                mouvementsCaisse.push({
                    id: crypto.randomUUID(),
                    caisseId: caissePrincipale.id,
                    sousCaisseId: sc.id,
                    semaineId: semaineCaisse.id,
                    date,
                    type,
                    montant,
                    devise: sc.devise,
                    montant_cdf,
                    montant_usd,
                    posteBudgetaire: poste.nom,
                    designation: `${poste.nom} - ${devise} ${montant}`,
                    status: 'validé',
                    aJustifier: false,
                    estCorrection: false,
                    typeCorrection: null,
                    remplaceParCorrection: false,
                    annule: false,
                    dateCreation: new Date().toISOString()
                });
            } else if (compteBanque) {
                mouvementsBanque.push({
                    id: crypto.randomUUID(),
                    compte_id: compteBanque.id,
                    date_operation: date,
                    libelle: `${poste.nom} - ${devise}`,
                    montant,
                    devise: compteBanque.devise,
                    montant_cdf,
                    montant_usd,
                    type: type === 'entree' ? 'credit' : 'debit',
                    poste_id: poste.id,
                    statut: 'valide',
                    verification: 'ok'
                });
            }
        }
    }

    if (mouvementsCaisse.length) await safeBulkAdd('mouvementsCaisse', mouvementsCaisse);
    if (mouvementsBanque.length) await safeBulkAdd('mouvements_bancaires', mouvementsBanque);
    console.log(`✅ ${mouvementsCaisse.length} mvts caisse, ${mouvementsBanque.length} mvts banque.`);

    // ========== 12. ÉCRITURES MANUELLES (complément, limité à avril) ==========
    const ecrituresManuelles = [];
    for (let mois = 0; mois < MOIS_TOTAL; mois++) {
        const nbEc = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < nbEc; i++) {
            const jourMax = mois === 3 ? 26 : new Date(2026, mois + 1, 0).getDate();
            const jour = 1 + Math.floor(Math.random() * jourMax);
            const date = `2026-${String(mois + 1).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
            const type = Math.random() > 0.5 ? 'sortie' : 'entree';
            const poste = postesBudget.filter(p => p.type === type && p.actif && !p.systeme)[Math.floor(Math.random() * postesBudget.filter(p => p.type === type && p.actif && !p.systeme).length)];
            const devise = Math.random() > 0.5 ? 'USD' : 'CDF';
            const montant = devise === 'USD' ? Math.round(100 + Math.random() * 500) : Math.round(20000 + Math.random() * 200000);
            const { montant_cdf, montant_usd } = await convertirMontants(montant, devise, date);
            ecrituresManuelles.push({
                id: crypto.randomUUID(),
                date,
                type,
                posteBudgetaire: poste.nom,
                designation: `${poste.nom} - ${devise} ${montant}`,
                montant,
                devise,
                montant_cdf,
                montant_usd,
                justificatif: `Justif-${mois + 1}-${i + 1}`,
                sousCaisseId: null,
                source: 'Manuelle',
                dateCreation: new Date().toISOString()
            });
        }
    }
    await safeBulkAdd('ecritures_manuelles', ecrituresManuelles);
    console.log(`✅ ${ecrituresManuelles.length} écritures manuelles.`);

    // ========== 13. SITES & CONTENANTS ==========
    const sites = [
        { id: crypto.randomUUID(), nom: 'Site Production', estProduction: true },
        { id: crypto.randomUUID(), nom: 'Dépôt Vente', estProduction: false }
    ];
    await safeBulkAdd('sites', sites);
    const contenants = [
        { id: crypto.randomUUID(), nom: 'Bidon 1L', capaciteL: 1, code: 'B1' },
        { id: crypto.randomUUID(), nom: 'Bidon 5L', capaciteL: 5, code: 'B5' },
        { id: crypto.randomUUID(), nom: 'Bidon 25L', capaciteL: 25, code: 'B25' }
    ];
    await safeBulkAdd('typesContenants', contenants);

    // ========== 14. LOTS ==========
    const lots = [];
    for (let i = 1; i <= 20; i++) {
        lots.push({ id: crypto.randomUUID(), numero: `LOT-${i.toString().padStart(3, '0')}`, dateCreation: new Date(2026, 0, 1 + i).toISOString() });
    }
    await safeBulkAdd('lots', lots);

    // ========== 15. SEMAINES DE RÉCOLTE & PRODUCTION (jusqu'à la semaine du 20 au 26 avril) ==========
    const debutAnneeProd = new Date(2026, 0, 5);
    const semainesRecolte = [];
    const semainesProd = [];
    for (let i = 0; i < SEMAINES_TOTAL; i++) {
        const lundi = new Date(debutAnneeProd);
        lundi.setDate(debutAnneeProd.getDate() + i * 7);
        const dimanche = new Date(lundi);
        dimanche.setDate(lundi.getDate() + 6);
        const dateDebut = lundi.toISOString().slice(0, 10);
        const dateFin = dimanche.toISOString().slice(0, 10);
        const moisLundi = lundi.getMonth();
        let facteurSaison = 1.0;
        if (moisLundi >= 5 && moisLundi <= 8) facteurSaison = 1.3;
        else if (moisLundi >= 10 || moisLundi <= 1) facteurSaison = 0.8;
        const poidsRegimes = Math.round(5000 * facteurSaison + Math.random() * 500);
        semainesRecolte.push({
            id: crypto.randomUUID(),
            dateDebut,
            dateFin,
            poidsRegimesTotal: poidsRegimes,
            nbRegimesTotal: Math.round(poidsRegimes / 25),
            nbPalmiersEntretenusTotal: 50,
            nbPalmiersVisitesTotal: 100,
            poidsMoyenRegime: 25,
            poidsRegimeParPalmier: 50,
        });
        semainesProd.push({
            id: crypto.randomUUID(),
            dateDebut,
            dateFin,
            consoGasoilTotal: Math.round(200 * facteurSaison),
            consoEssenceTotal: Math.round(50 * facteurSaison)
        });
    }
    await safeBulkAdd('semaines_recolte', semainesRecolte);
    await safeBulkAdd('semaines_production', semainesProd);

    // ========== 16. RÉCOLTE JOURNALIÈRE (échantillon limité aux 12 premières semaines, déjà dans la limite) ==========
    const recolteJournaliere = [];
    for (let s of semainesRecolte.slice(0, 12)) {
        const debut = new Date(s.dateDebut);
        for (let j = 0; j < 7; j++) {
            const date = new Date(debut);
            date.setDate(debut.getDate() + j);
            // Ne pas dépasser le 26 avril
            if (date > DATE_LIMITE) continue;
            recolteJournaliere.push({
                id: crypto.randomUUID(),
                semaineId: s.id,
                date: date.toISOString().slice(0, 10),
                parcelle: 'Parcelle A',
                nbTravailleurs: 5 + j,
                nbPalmiersRecoltes: 15 + j,
                nbPalmiersEntretenus: 10,
                nbRegimes: 30 + j * 2
            });
        }
    }
    await safeBulkAdd('recolte_journaliere', recolteJournaliere);

    // ========== 17. PRODUCTION CONSOMMATION & LOTS (limité aux 16 semaines) ==========
    const prodConsommation = [];
    const prodLots = [];
    for (let i = 0; i < SEMAINES_TOTAL; i++) {
        const semaine = semainesProd[i];
        const dateSem = new Date(semaine.dateDebut);
        for (let d = 0; d < 7; d++) {
            const dateJour = new Date(dateSem);
            dateJour.setDate(dateSem.getDate() + d);
            if (dateJour > DATE_LIMITE) continue;
            const fruitsKg = Math.round(1000 + Math.random() * 200);
            prodConsommation.push({
                id: crypto.randomUUID(),
                semaineProdId: semaine.id,
                date: dateJour.toISOString().slice(0, 10),
                fruitsTransformesKg: fruitsKg,
                consoGasoil: Math.round(20 + Math.random() * 5),
                consoEssence: Math.round(5 + Math.random() * 2),
                semaineRecolteId: semainesRecolte[i]?.id || null
            });
        }
        const nbLots = 2;
        for (let j = 0; j < nbLots; j++) {
            const lot = lots[(i * nbLots + j) % lots.length];
            const cont = contenants[j % contenants.length];
            const volume = Math.round(200 + Math.random() * 100);
            // Vérifier que la date du lot ne dépasse pas la limite (date de début de semaine)
            const dateLot = new Date(semaine.dateDebut);
            if (dateLot > DATE_LIMITE) continue;
            prodLots.push({
                id: crypto.randomUUID(),
                semaineProdId: semaine.id,
                numeroLot: lot.numero,
                date: semaine.dateDebut,
                fruitsTransformesKg: Math.round(volume * 4.5),
                semaineRecolteId: semainesRecolte[i]?.id,
                volumeHuileL: volume,
                tauxAcidite: 0.5 + Math.random() * 0.3,
                noteGout: 7 + Math.floor(Math.random() * 3),
                noteOdeur: 8,
                noteCouleur: 9,
                lotId: lot.id,
                contenants: JSON.stringify({ [cont.id]: Math.round(volume / cont.capaciteL) })
            });
        }
    }
    await safeBulkAdd('production_consommation', prodConsommation);
    await safeBulkAdd('production_lot', prodLots);

    // ========== 18. STOCKS ==========
    const stocks = [];
    for (let site of sites) {
        for (let lot of lots.slice(0, 5)) {
            for (let cont of contenants) {
                stocks.push({
                    id: crypto.randomUUID(),
                    siteId: site.id,
                    lotId: lot.id,
                    typeContenantId: cont.id,
                    quantite: 50 + Math.floor(Math.random() * 100)
                });
            }
        }
    }
    await safeBulkAdd('stocks', stocks);

    // ========== 19. CLIENTS & TARIFS ==========
    const clients = [
        { id: crypto.randomUUID(), nom: 'Supermarché du Centre', type: 'supermarché', nbPointsVente: 2, adresse: '123 Centre-ville', secteur: 'Centre-ville', telephone: '0812345678', email: 'contact@supercentre.com', produitsAchetes: 'Huile 5L, 25L', notes: 'Bon client' },
        { id: crypto.randomUUID(), nom: 'Boutique Maman José', type: 'boutique', nbPointsVente: 1, adresse: '45 Quartier Est', secteur: 'Est', telephone: '0823456789', email: null, produitsAchetes: 'Huile 1L, 5L', notes: '' },
        { id: crypto.randomUUID(), nom: 'Distributeur Saphir', type: 'autre', nbPointsVente: 5, adresse: 'Zone industrielle', secteur: 'Ouest', telephone: '0834567890', email: 'saphir@distrib.com', produitsAchetes: 'Huile 25L en gros', notes: 'Livraison hebdo' }
    ];
    await safeBulkAdd('clients', clients);
    const tarifs = [
        { id: crypto.randomUUID(), code: 'A', devise: 'USD', prixBidon1L: 2.5, prixBidon5L: 11, prixBidon25L: 50, note: 'Tarif standard', dateCreation: new Date().toISOString() },
        { id: crypto.randomUUID(), code: 'B', devise: 'CDF', prixBidon1L: 6000, prixBidon5L: 27500, prixBidon25L: 125000, note: 'Tarif CDF', dateCreation: new Date().toISOString() }
    ];
    await safeBulkAdd('tarifs', tarifs);

    // ========== 20. FACTURES (limité à avril) ==========
    const factures = [];
    const factureLignes = [];
    for (let mois = 0; mois < MOIS_TOTAL; mois++) {
        const nbFactures = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < nbFactures; i++) {
            const client = clients[i % clients.length];
            const jourMax = mois === 3 ? 26 : new Date(2026, mois + 1, 0).getDate();
            const jour = 1 + Math.floor(Math.random() * jourMax);
            const date = `2026-${String(mois + 1).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
            const numero = `F${(mois * 10 + i + 1).toString().padStart(2, '0')}/26`;
            const totalHT = 100000 + Math.floor(Math.random() * 50000);
            const factureId = crypto.randomUUID();
            // Échéance en jours, on s'assure que la date d'échéance ne dépasse pas trop, mais on garde tel quel
            const echeanceJours = 30;
            const dateEcheance = new Date(2026, mois, jour + echeanceJours).toISOString().slice(0, 10);
            factures.push({
                id: factureId,
                numero,
                date,
                echeance: `${echeanceJours}j`,
                dateEcheance,
                clientId: client.id,
                vendeurId: null,
                siteId: sites[0].id,
                devise: 'CDF',
                tarif: 'B',
                remise: 0,
                remiseMontant: 0,
                remiseType: 'amount',
                totalHT,
                statutLivraison: 'livrée',
                statutPaiement: i % 3 === 0 ? 'payée' : 'en_attente',
                blSelectionne: true,
                dateLivraison: date,
                datePaiement: i % 3 === 0 ? date : null,
                bonLivraisonId: null,
                notes: '',
                dateCreation: new Date().toISOString()
            });
            for (let j = 0; j < 2; j++) {
                const cont = contenants[j];
                const qte = 5 + j * 3;
                const pu = (cont.nom === 'Bidon 1L' ? 6000 : cont.nom === 'Bidon 5L' ? 27500 : 125000);
                factureLignes.push({
                    id: crypto.randomUUID(),
                    factureId,
                    typeContenantId: cont.id,
                    quantite: qte,
                    prixUnitaire: pu,
                    prixTotal: qte * pu,
                    remiseLigne: 0
                });
            }
        }
    }
    await safeBulkAdd('factures', factures);
    await safeBulkAdd('facture_lignes', factureLignes);

    // ========== 21. BUDGETS PRÉVISIONNELS (sous‑évalués pour dépassements, 4 mois) ==========
    const budgetData = {};
    for (let p of postesBudget) {
        // On crée un tableau de 12 mois avec des zéros, puis on remplit les 4 premiers
        budgetData[p.id] = Array(12).fill(0);
        for (let m = 0; m < MOIS_TOTAL; m++) {
            if (p.type === 'entree') {
                budgetData[p.id][m] = 5000000 + m * 200000; // élevé
            } else {
                budgetData[p.id][m] = 200000 + m * 50000;   // faible pour créer des dépassements
                if (p.nom === 'Carburant') budgetData[p.id][m] = 150000;
                if (p.nom === 'Transport régimes') budgetData[p.id][m] = 250000;
            }
        }
    }
    await db.budget_versions.add({
        id: crypto.randomUUID(),
        annee: 2026,
        version: 1,
        date_creation: new Date().toISOString(),
        utilisateur_id: (await db.utilisateurs.toArray())[0].id,
        utilisateur_nom: (await db.utilisateurs.toArray())[0].nom,
        donnees: budgetData
    });

    // ========== 22. OBJECTIFS MENSUELS (4 premiers mois) ==========
    const objectifsComplets = [
        { domaine: 'Regimes', valeurs: [5000, 5200, 5500, 5800, 6000, 6200, 6500, 6400, 6000, 5800, 5500, 5200] },
        { domaine: 'Huile', valeurs: [1000, 1100, 1200, 1250, 1300, 1350, 1400, 1380, 1250, 1200, 1150, 1100] },
        { domaine: 'TauxExtraction', valeurs: [20, 21, 21.5, 22, 22.5, 23, 23.5, 23, 22, 21.5, 21, 20.5] },
        { domaine: 'TauxGlobal', valeurs: [18, 19, 19.5, 20, 20.5, 21, 21.5, 21, 20, 19.5, 19, 18.5] },
        { domaine: 'TauxFruits', valeurs: [60, 61, 62, 63, 64, 65, 64, 63, 62, 61, 60, 59] },
        { domaine: 'Qualite', valeurs: [7.5, 7.6, 7.7, 7.8, 8.0, 8.2, 8.3, 8.1, 7.9, 7.8, 7.6, 7.5] },
        { domaine: 'Acidite', valeurs: [0.5, 0.52, 0.54, 0.55, 0.58, 0.6, 0.62, 0.6, 0.55, 0.53, 0.5, 0.48] },
        { domaine: 'Ventes', valeurs: [5000000, 5500000, 6000000, 6500000, 7000000, 7500000, 8000000, 7800000, 7000000, 6500000, 6000000, 5500000] },
        { domaine: 'VolumeVentes', valeurs: [800, 900, 1000, 1100, 1200, 1300, 1400, 1350, 1200, 1100, 1000, 900] },
        { domaine: 'PrixMoyenVente', valeurs: [2500, 2550, 2600, 2650, 2700, 2750, 2800, 2780, 2700, 2650, 2600, 2550] },
        { domaine: 'ConsoGasoil', valeurs: [180, 190, 200, 210, 220, 230, 240, 235, 220, 210, 200, 190] },
        { domaine: 'ConsoEssence', valeurs: [45, 48, 50, 52, 55, 58, 60, 59, 55, 52, 50, 48] }
    ];
    for (let obj of objectifsComplets) {
        await db.objectifs_mensuels.add({
            id: crypto.randomUUID(),
            annee: 2026,
            domaine: obj.domaine,
            donnees: obj.valeurs.slice(0, MOIS_TOTAL) // seulement les 4 premiers mois
        });
    }

    // ========== 23. PROJETS ==========
    await safeBulkAdd('projets', [
        { id: crypto.randomUUID(), nom: 'Huile de Palme', actif: true }
    ]);

    // ========== 24. TYPES DE CARBURANT, SITES, UTILISATIONS ==========
    const carburantTypes = [
        { id: crypto.randomUUID(), nom: 'Gasoil', unite: 'L', facteur_co2: 2.68 },
        { id: crypto.randomUUID(), nom: 'Essence', unite: 'L', facteur_co2: 2.31 }
    ];
    await safeBulkAdd('carburant_types', carburantTypes);

    // Lier chaque type aux deux sites
    const carburantTypeSites = [];
    for (const ct of carburantTypes) {
        for (const site of sites) {
            carburantTypeSites.push({
                id: crypto.randomUUID(),
                carburant_type_id: ct.id,
                site_id: site.id
            });
        }
    }
    await safeBulkAdd('carburant_type_sites', carburantTypeSites);

    // Utilisations
    const carburantUtilisations = [
        { id: crypto.randomUUID(), nom: 'Transport régimes' },
        { id: crypto.randomUUID(), nom: 'Groupes électrogènes' },
        { id: crypto.randomUUID(), nom: 'Véhicules de service' },
        { id: crypto.randomUUID(), nom: 'Tronçonneuses' }
    ];
    await safeBulkAdd('carburant_utilisations', carburantUtilisations);

    // ========== 25. STOCKS ET MOUVEMENTS CARBURANT (janvier-avril) ==========
    // Stocks initiaux (pour chaque type sur les deux sites)
    const carburantStocks = [];
    for (const ct of carburantTypes) {
        for (const site of sites) {
            carburantStocks.push({
                id: crypto.randomUUID(),
                carburant_type_id: ct.id,
                site_id: site.id,
                quantite: 500 + Math.floor(Math.random() * 500) // 500-1000 L
            });
        }
    }
    await safeBulkAdd('carburant_stocks', carburantStocks);

    // Mouvements d'achat (depuis caisse, poste 'Carburant')
    const carburantMouvements = [];
    for (let mois = 0; mois < MOIS_TOTAL; mois++) {
        const nbAchats = 1 + Math.floor(Math.random() * 2); // 1-2 achats par mois
        for (let a = 0; a < nbAchats; a++) {
            const ct = carburantTypes[Math.floor(Math.random() * carburantTypes.length)];
            const site = sites[Math.floor(Math.random() * sites.length)];
            const jourMax = mois === 3 ? 26 : new Date(2026, mois + 1, 0).getDate();
            const jour = 1 + Math.floor(Math.random() * jourMax);
            const date = `2026-${String(mois + 1).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
            const quantite = Math.round(100 + Math.random() * 300);
            carburantMouvements.push({
                id: crypto.randomUUID(),
                carburant_type_id: ct.id,
                site_id: site.id,
                date,
                type: 'entree',
                quantite,
                utilisation_id: null,
                source: 'caisse',
                reference_id: null
            });
        }
    }
    // Consommations depuis production (on réutilise les données déjà générées pour production_consommation)
    for (const conso of prodConsommation) {
        // On prend une fraction des jours pour simuler des utilisations de carburant
        if (Math.random() > 0.7) continue; // 30% des jours de prod ont une conso carburant explicite
        const ct = carburantTypes[0]; // majorité gasoil
        const quantite = Math.round(10 + Math.random() * 30);
        carburantMouvements.push({
            id: crypto.randomUUID(),
            carburant_type_id: ct.id,
            site_id: sites[0].id, // toujours site production
            date: conso.date,
            type: 'sortie',
            quantite,
            utilisation_id: carburantUtilisations[Math.floor(Math.random() * carburantUtilisations.length)].id,
            source: 'production',
            reference_id: conso.semaineProdId
        });
    }
    await safeBulkAdd('carburant_mouvements', carburantMouvements);

    // ========== 26. EMBALLAGES (TYPES, STOCKS, MOUVEMENTS) ==========
    const emballageTypes = [
        { id: crypto.randomUUID(), nom: 'Bidon 1L vente', categorie: 'contenant', contenant_id: contenants[0].id, nb_etiquettes_requises: 1, ordre: 1 },
        { id: crypto.randomUUID(), nom: 'Bidon 5L vente', categorie: 'contenant', contenant_id: contenants[1].id, nb_etiquettes_requises: 1, ordre: 2 },
        { id: crypto.randomUUID(), nom: 'Bidon 25L vente', categorie: 'contenant', contenant_id: contenants[2].id, nb_etiquettes_requises: 1, ordre: 3 },
        { id: crypto.randomUUID(), nom: 'Étiquette 1L', categorie: 'etiquette', contenant_id: contenants[0].id, nb_etiquettes_requises: 0, ordre: 10 },
        { id: crypto.randomUUID(), nom: 'Étiquette 5L', categorie: 'etiquette', contenant_id: contenants[1].id, nb_etiquettes_requises: 0, ordre: 11 },
        { id: crypto.randomUUID(), nom: 'Étiquette 25L', categorie: 'etiquette', contenant_id: contenants[2].id, nb_etiquettes_requises: 0, ordre: 12 }
    ];
    await safeBulkAdd('emballage_types', emballageTypes);

    // Stocks d'emballage (initiaux élevés pour éviter rupture immédiate)
    const emballageStocks = [];
    for (const et of emballageTypes) {
        for (const site of sites) {
            emballageStocks.push({
                id: crypto.randomUUID(),
                type_id: et.id,
                site_id: site.id,
                quantite: 200 + Math.floor(Math.random() * 300)
            });
        }
    }
    await safeBulkAdd('emballage_stocks', emballageStocks);

    // Mouvements d'emballage (entrées via caisse, sorties via production)
    const emballageMouvements = [];
    // Entrées manuelles (janvier-avril)
    for (let mois = 0; mois < MOIS_TOTAL; mois++) {
        const nbEntrees = 2;
        for (let e = 0; e < nbEntrees; e++) {
            const et = emballageTypes[Math.floor(Math.random() * 3)]; // contenants uniquement
            const site = sites[Math.floor(Math.random() * sites.length)];
            const jourMax = mois === 3 ? 26 : new Date(2026, mois + 1, 0).getDate();
            const jour = 1 + Math.floor(Math.random() * jourMax);
            const date = `2026-${String(mois + 1).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
            emballageMouvements.push({
                id: crypto.randomUUID(),
                type_id: et.id,
                site_id: site.id,
                date,
                type: 'entree',
                quantite: 50 + Math.floor(Math.random() * 100),
                source: 'caisse',
                reference_id: null,
                commentaire: 'Achat lot'
            });
        }
    }
    await safeBulkAdd('emballage_mouvements', emballageMouvements);

    // ========== 27. ACCÈS SITES POUR LES RÔLES ==========
    const roles = (await db.reglages.where('cle').equals('roles').first())?.valeur || [];
    const accesSites = [];
    for (const role of roles) {
        for (const site of sites) {
            let niveau = 'lecture';
            if (role.nom === 'superviseur' || role.nom === 'superviseur_huilerie' || role.nom === 'superviseur_vente') {
                niveau = 'ecriture';
            } else if (role.nom === 'vendeur' || role.nom === 'caissier') {
                niveau = 'lecture';
            }
            accesSites.push({
                id: crypto.randomUUID(),
                role: role.nom,
                siteId: site.id,
                niveau
            });
        }
    }
    await safeBulkAdd('acces_sites', accesSites);

    // ========== 28. TRAVAILLEURS ==========
    const travailleurs = [
        { id: crypto.randomUUID(), nom: 'Mbala', postnom: 'Kongo', prenom: 'Jean', date_naissance: '1985-03-15', date_debut: '2025-01-01', departement: 'Production', poste_travail_id: 'Ouvrier', salaire_actuel: 150000, devise_salaire: 'CDF', actif: true, nb_personnes_charge: 3, salaire_net_total: 120000, salaire_brut_calcule: 140000, soumis_ipr: true, soumis_cnss: true },
        { id: crypto.randomUUID(), nom: 'Mukendi', postnom: 'Tshilombo', prenom: 'Marie', date_naissance: '1990-07-22', date_debut: '2025-02-01', departement: 'Vente', poste_travail_id: 'Vendeur', salaire_actuel: 200000, devise_salaire: 'CDF', actif: true, nb_personnes_charge: 1, salaire_net_total: 180000, salaire_brut_calcule: 190000, soumis_ipr: true, soumis_cnss: true },
        { id: crypto.randomUUID(), nom: 'Kabongo', postnom: '', prenom: 'Pierre', date_naissance: '1988-11-05', date_debut: '2025-03-01', departement: 'Logistique', poste_travail_id: 'Superviseur', salaire_actuel: 250000, devise_salaire: 'CDF', actif: true, nb_personnes_charge: 4, salaire_net_total: 230000, salaire_brut_calcule: 250000, soumis_ipr: true, soumis_cnss: true },
    ];
    await safeBulkAdd('travailleurs', travailleurs);

    // ========== 29. PRÉSENCES & SUSPENSIONS (janvier à avril) ==========
    const presences = [];
    for (const t of travailleurs) {
        for (let mois = 1; mois <= MOIS_TOTAL; mois++) {
            presences.push({
                id: crypto.randomUUID(),
                travailleur_id: t.id,
                annee: 2026,
                mois,
                jours_vacances: Math.floor(Math.random() * 3),
                jours_suspension: Math.floor(Math.random() * 2),
                motif: ''
            });
        }
    }
    await safeBulkAdd('presence_suspension', presences);

    // ========== 30. SALAIRES HISTORIQUE ==========
    const salaires = [];
    for (const t of travailleurs) {
        salaires.push({
            id: crypto.randomUUID(),
            travailleur_id: t.id,
            date_effet: '2025-01-01',
            montant: t.salaire_actuel
        });
    }
    await safeBulkAdd('salaires_historique', salaires);

    // ========== 31. AVANCES & REMBOURSEMENTS (limités à avril) ==========
    const avances = [];
    const remboursements = [];
    for (const t of travailleurs) {
        // Avance sur mois (janvier à avril)
        for (let m = 1; m <= MOIS_TOTAL; m++) {
            if (Math.random() > 0.6) {
                const montant = Math.round(t.salaire_actuel * (0.1 + Math.random() * 0.3));
                const avanceId = crypto.randomUUID();
                avances.push({
                    id: avanceId,
                    travailleur_id: t.id,
                    type: 'mois',
                    mois_concerne: `2026-${String(m).padStart(2, '0')}`,
                    montant,
                    date_avance: `2026-${String(m).padStart(2, '0')}-15`,
                    statut: 'paye',
                    nb_mois_remboursement: 0,
                    mouvementCaisseId: null
                });
            }
        }
        // Avance annuelle (début d'année)
        if (Math.random() > 0.7) {
            const montant = Math.round(t.salaire_actuel * 2);
            const avanceId = crypto.randomUUID();
            avances.push({
                id: avanceId,
                travailleur_id: t.id,
                type: 'annee',
                mois_concerne: null,
                montant,
                date_avance: '2026-01-10',
                statut: 'en_cours',
                nb_mois_remboursement: 4, // limité à 4 mois
                mouvementCaisseId: null
            });
            for (let m = 1; m <= 4; m++) {
                remboursements.push({
                    id: crypto.randomUUID(),
                    avance_id: avanceId,
                    mois_remboursement: `2026-${String(m).padStart(2, '0')}`,
                    montant_rembourse: Math.round(montant / 4)
                });
            }
        }
    }
    await safeBulkAdd('avances', avances);
    await safeBulkAdd('remboursements_avances', remboursements);

    // ========== 32. PRIMES (limité à avril) ==========
    const primes = [];
    for (const t of travailleurs) {
        for (let m = 1; m <= MOIS_TOTAL; m++) {
            if (Math.random() > 0.8) {
                primes.push({
                    id: crypto.randomUUID(),
                    travailleur_id: t.id,
                    annee: 2026,
                    mois: m,
                    montant: Math.round(5000 + Math.random() * 20000),
                    libelle: `Prime ${t.departement}`,
                    payee: Math.random() > 0.5
                });
            }
        }
    }
    await safeBulkAdd('primes', primes);

    // ========== 33. BONS DE LIVRAISON (liés aux factures, déjà dans la période) ==========
    const bonsLivraison = [];
    const blLignes = [];
    for (let i = 0; i < 10; i++) {
        const fact = factures[i % factures.length];
        // Si plus aucune facture (au cas où), on sort
        if (!fact) break;
        const blId = crypto.randomUUID();
        bonsLivraison.push({
            id: blId,
            numero: `BL${(i + 1).toString().padStart(2, '0')}/26`,
            factureId: fact.id,
            date: fact.date,
            siteId: sites[0].id,
            statut: 'livré',
            vendeurId: null,
            superviseurValidation: null,
            notes: ''
        });
        for (let j = 0; j < 2; j++) {
            blLignes.push({
                id: crypto.randomUUID(),
                blId,
                lotId: lots[j].id,
                typeContenantId: contenants[j].id,
                quantiteLivree: 5 + j * 2
            });
        }
    }
    await safeBulkAdd('bons_livraison', bonsLivraison);
    await safeBulkAdd('bl_lignes', blLignes);

    // ========== 34. MOBILITÉ STOCK HUILÉ (MOUVEMENTS + LIGNES) limité à la période ==========
    const mouvementsStock = [];
    const mouvementLignes = [];
    for (let i = 0; i < 20; i++) {
        const mois = Math.floor(Math.random() * MOIS_TOTAL); // 0..3
        const jourMax = mois === 3 ? 26 : new Date(2026, mois + 1, 0).getDate();
        const jour = Math.floor(Math.random() * jourMax) + 1;
        const date = `2026-${String(mois + 1).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
        const mvtId = crypto.randomUUID();
        mouvementsStock.push({
            id: mvtId,
            type: 'production',
            date,
            description: 'Production manuelle',
            statut: 'validé',
            notes: ''
        });
        for (let j = 0; j < 2; j++) {
            mouvementLignes.push({
                id: crypto.randomUUID(),
                mouvementId: mvtId,
                lotId: lots[j].id,
                typeContenantId: contenants[j].id,
                quantite: Math.round(10 + Math.random() * 30),
                siteSource: sites[0].id,
                siteDestination: sites[1].id
            });
        }
    }
    await safeBulkAdd('mouvements', mouvementsStock);
    await safeBulkAdd('mouvement_lignes', mouvementLignes);

    // ========== 35. INVENTAIRES SUPPLÉMENTAIRES (limitée à avril) ==========
    const inventairesSup = [];
    const inventaireLignesSup = [];
    // Février et avril
    const moisInventaires = [2, 4]; // février et avril
    for (const m of moisInventaires) {
        const invId = crypto.randomUUID();
        inventairesSup.push({
            id: invId,
            siteId: sites[m % 2].id,
            date: `2026-${String(m).padStart(2, '0')}-15`,
            statut: 'validé'
        });
        for (let j = 0; j < 3; j++) {
            inventaireLignesSup.push({
                id: crypto.randomUUID(),
                inventaireId: invId,
                lotId: lots[j].id,
                typeContenantId: contenants[j].id,
                quantiteTheorique: 50 + j * 10,
                quantiteReelle: 48 + j * 10 + Math.floor(Math.random() * 5 - 1),
                ecart: -1,
                justification: 'Écart normal'
            });
        }
    }
    await safeBulkAdd('inventaires', inventairesSup);
    await safeBulkAdd('inventaire_lignes', inventaireLignesSup);

    // ========== 36. TRANSFERTS SUPPLÉMENTAIRES (janvier-avril) ==========
    const transfertsSup = [];
    const transfertLignesSup = [];
    for (let i = 0; i < 4; i++) { // un par mois
        const mois = i + 1;
        const trId = crypto.randomUUID();
        transfertsSup.push({
            id: trId,
            numero: `TR${Date.now()}-${i}`,
            siteSource: sites[i % 2].id,
            siteDestination: sites[(i + 1) % 2].id,
            dateCreation: `2026-${String(mois).padStart(2, '0')}-01`,
            statut: 'confirmé',
            createurId: null,
            notes: ''
        });
        for (let j = 0; j < 2; j++) {
            transfertLignesSup.push({
                id: crypto.randomUUID(),
                transfertId: trId,
                lotId: lots[j].id,
                typeContenantId: contenants[j].id,
                quantite: 10 + j * 5,
                quantiteRecue: 10 + j * 5
            });
        }
    }
    await safeBulkAdd('transferts', transfertsSup);
    await safeBulkAdd('transfert_lignes', transfertLignesSup);

    // ========== 37. RECONDITIONNEMENTS SUPPLÉMENTAIRES (limité à avril) ==========
    const recond = [];
    for (let i = 0; i < 4; i++) { // un par mois
        const mois = i + 1;
        recond.push({
            id: crypto.randomUUID(),
            siteId: sites[i % 2].id,
            date: `2026-0${mois}-10`,
            lotId: lots[i].id,
            typeContenantSource: contenants[2].id, // 25L
            quantiteSource: 5,
            typeContenantDestination: contenants[1].id, // 5L
            quantiteDestination: 25,
            remarques: 'Reconditionnement de test'
        });
    }
    await safeBulkAdd('reconditionnements', recond);

    // ========== 38. ÉCRITURES MANUELLES SUPPLÉMENTAIRES (TOUS POSTES, janvier-avril) ==========
    const ecrituresManuellesTous = [];
    for (let mois = 1; mois <= MOIS_TOTAL; mois++) {
        for (const poste of postesBudget) {
            if (poste.systeme) continue;
            const jourMax = mois === 4 ? 26 : new Date(2026, mois, 0).getDate();
            const jour = Math.floor(Math.random() * jourMax) + 1;
            const date = `2026-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
            const devise = Math.random() > 0.5 ? 'USD' : 'CDF';
            const montant = devise === 'USD' ? Math.round(50 + Math.random() * 200) : Math.round(10000 + Math.random() * 500000);
            const { montant_cdf, montant_usd } = await convertirMontants(montant, devise, date);
            ecrituresManuellesTous.push({
                id: crypto.randomUUID(),
                date,
                type: poste.type,
                posteBudgetaire: poste.nom,
                designation: `${poste.nom} - ${devise} ${montant}`,
                montant,
                devise,
                montant_cdf,
                montant_usd,
                justificatif: `Justif-${poste.nom}-${mois}`,
                sousCaisseId: null,
                source: 'Manuelle',
                dateCreation: new Date().toISOString()
            });
        }
    }
    await safeBulkAdd('ecritures_manuelles', ecrituresManuellesTous);
    console.log(`✅ ${ecrituresManuellesTous.length} écritures manuelles supplémentaires (tous postes).`);

    // ========== 39. FACTURES SUPPLÉMENTAIRES (avec écheances variées, livraisons partielles) ==========
    const facturesSup = [];
    const factureLignesSup = [];
    for (let i = 0; i < 30; i++) {
        const client = clients[i % clients.length];
        // Générer une date aléatoire entre le 1er janvier et le 26 avril 2026
        const dateAleatoire = new Date(DEBUT_ANNEE.getTime() + Math.random() * (DATE_LIMITE.getTime() - DEBUT_ANNEE.getTime()));
        const date = dateAleatoire.toISOString().slice(0, 10);
        const mois = dateAleatoire.getMonth() + 1;
        const jour = dateAleatoire.getDate();
        const numero = `F${(100 + i).toString().padStart(2, '0')}/26`;
        const devise = Math.random() > 0.5 ? 'CDF' : 'USD';
        let totalHT;
        if (devise === 'CDF') totalHT = Math.round(50000 + Math.random() * 200000);
        else totalHT = Math.round(20 + Math.random() * 100);
        const factureId = crypto.randomUUID();
        facturesSup.push({
            id: factureId,
            numero,
            date,
            echeance: ['30j', '60j', 'livraison'][Math.floor(Math.random() * 3)],
            dateEcheance: null,
            clientId: client.id,
            vendeurId: null,
            siteId: sites[0].id,
            devise,
            tarif: devise === 'CDF' ? 'B' : 'A',
            remise: 0,
            remiseMontant: 0,
            remiseType: 'amount',
            totalHT,
            statutLivraison: ['livrée', 'a_livrer', 'livrée'][Math.floor(Math.random() * 3)],
            statutPaiement: ['payée', 'en_attente', 'partiel'][Math.floor(Math.random() * 3)],
            blSelectionne: true,
            dateLivraison: date,
            datePaiement: Math.random() > 0.5 ? date : null,
            bonLivraisonId: null,
            notes: '',
            dateCreation: new Date().toISOString()
        });
        for (let j = 0; j < 2; j++) {
            const cont = contenants[j];
            const qte = Math.floor(Math.random() * 20) + 1;
            const pu = cont.nom === 'Bidon 1L' ? (devise === 'CDF' ? 6000 : 2.5) : cont.nom === 'Bidon 5L' ? (devise === 'CDF' ? 27500 : 11) : (devise === 'CDF' ? 125000 : 50);
            factureLignesSup.push({
                id: crypto.randomUUID(),
                factureId,
                typeContenantId: cont.id,
                quantite: qte,
                prixUnitaire: pu,
                prixTotal: qte * pu,
                remiseLigne: 0
            });
        }
    }
    await safeBulkAdd('factures', facturesSup);
    await safeBulkAdd('facture_lignes', factureLignesSup);
    console.log(`✅ ${facturesSup.length} factures supplémentaires.`);

    // ========== 40. MOUVEMENTS DE CAISSE SUPPLÉMENTAIRES (LIÉS AUX FACTURES) ==========
    const mouvementsCaisseSup = [];
    for (const fact of [...factures, ...facturesSup]) {
        if (fact.statutPaiement === 'payée' || fact.statutPaiement === 'partiel') {
            const devise = fact.devise;
            const sc = sousCaisses.find(s => s.devise === devise) || sousCaisses[0];
            const montant = fact.statutPaiement === 'payée' ? fact.totalHT : Math.round(fact.totalHT * 0.6);
            const { montant_cdf, montant_usd } = await convertirMontants(montant, devise, fact.date);
            mouvementsCaisseSup.push({
                id: crypto.randomUUID(),
                caisseId: caissePrincipale.id,
                sousCaisseId: sc.id,
                semaineId: semaineCaisse.id,
                date: fact.date,
                type: 'entree',
                montant,
                devise: sc.devise,
                montant_cdf,
                montant_usd,
                posteBudgetaire: 'Vente huile',
                designation: `Paiement facture ${fact.numero}`,
                status: 'validé',
                aJustifier: false,
                estCorrection: false,
                typeCorrection: null,
                remplaceParCorrection: false,
                annule: false,
                dateCreation: new Date().toISOString()
            });
        }
    }
    await safeBulkAdd('mouvementsCaisse', mouvementsCaisseSup);
    console.log(`✅ ${mouvementsCaisseSup.length} mouvements caisse liés aux factures.`);

    // ========== 41. ACCÈS SITES (déjà fait) ==========
    // (rien à modifier)

    // ========== 42. MOUVEMENTS EMBALLAGE LIÉS AUX PRODUCTIONS ==========
    const emballageMouvementsProd = [];
    for (const lot of prodLots) {
        const contenantsObj = JSON.parse(lot.contenants);
        for (const [contId, qte] of Object.entries(contenantsObj)) {
            if (qte > 0) {
                const embType = emballageTypes.find(et => et.categorie === 'contenant' && et.contenant_id === contId);
                if (embType) {
                    emballageMouvementsProd.push({
                        id: crypto.randomUUID(),
                        type_id: embType.id,
                        site_id: sites[0].id,
                        date: lot.date,
                        type: 'sortie',
                        quantite: qte,
                        source: 'production',
                        reference_id: lot.semaineProdId,
                        commentaire: 'Consommation prod'
                    });
                    if (embType.nb_etiquettes_requises > 0) {
                        const etiqType = emballageTypes.find(et => et.categorie === 'etiquette' && et.contenant_id === contId);
                        if (etiqType) {
                            emballageMouvementsProd.push({
                                id: crypto.randomUUID(),
                                type_id: etiqType.id,
                                site_id: sites[0].id,
                                date: lot.date,
                                type: 'sortie',
                                quantite: qte,
                                source: 'production',
                                reference_id: lot.semaineProdId,
                                commentaire: 'Étiquettes consommées'
                            });
                        }
                    }
                }
            }
        }
    }
    await safeBulkAdd('emballage_mouvements', emballageMouvementsProd);
    console.log(`✅ ${emballageMouvementsProd.length} mouvements emballage (production).`);

    console.log('✅ Données de test 2026 générées avec succès (jusqu\'au 26 avril 2026).');
}