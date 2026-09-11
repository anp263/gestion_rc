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
    }
}

export async function initTestData() {
    const confirmation = confirm(
        "⚠️ Ce script va réinitialiser les données de test.\n\n" +
        "Il va générer :\n" +
        "• 5 utilisateurs, 4 sites, 4 parcelles\n" +
        "• 4 conditionnements, 7 articles de fourniture\n" +
        "• ~35 semaines de récolte et production\n" +
        "• 5 travailleurs, 5 clients\n" +
        "• 20 semaines de caisse clôturées avec paiements\n\n" +
        "Continuer ?"
    );
    if (!confirmation) return;

    console.log("🚀 Génération des données de test...");

    const aujourdhui = new Date();
    const ANNEE_COURANTE = aujourdhui.getFullYear();
    const DEBUT_ANNEE = new Date(ANNEE_COURANTE, 0, 1);
    const DATE_LIMITE = aujourdhui;
    const JOURS_TOTAL = Math.floor((DATE_LIMITE - DEBUT_ANNEE) / (1000 * 60 * 60 * 24)) + 1;
    const SEMAINES_TOTAL = Math.ceil(JOURS_TOTAL / 7);
    const MOIS_TOTAL = aujourdhui.getMonth() + 1;

    // ========== 1. VIDER LES TABLES ==========
    const tablesAEffacer = [
        'postes_budgetaires', 'budget_versions', 'taux_change_mensuel', 'taux_change',
        'travailleurs', 'salaires_historique', 'presence_suspension', 'avances', 'remboursements_avances', 'primes',
        'sites', 'stocks', 'lots', 'mouvements', 'mouvement_lignes',
        'transferts', 'transfert_lignes', 'inventaires', 'inventaire_lignes', 'reconditionnements',
        'semaines_recolte', 'recolte_journaliere',
        'semaines_production', 'production_consommation', 'production_lot', 'production_consommation_carburant',
        'clients', 'types_clients', 'tarifs', 'factures', 'facture_lignes', 'bons_livraison', 'bl_lignes',
        'objectifs_mensuels', 'projets', 'charges_abonnement', 'parametres_analytiques',
        'ecritures_manuelles', 'plan_comptable', 'poste_compte', 'repartitions_ecritures',
        'conditionnements', 'articles_fourniture', 'conditionnement_composants', 'stocks_fournitures', 'mouvements_fournitures',
        'carburant_types', 'carburant_type_sites', 'carburant_utilisations', 'carburant_stocks', 'carburant_mouvements',
        'consignations', 'messages', 'mouvementsCaisse', 'semaines_caisse', 'sous_caisses', 'caisses', 'caisse_utilisateurs'
    ];
    for (const table of tablesAEffacer) {
        try { await db[table].clear(); } catch (e) { /* ignorer */ }
    }
    console.log("🧹 Tables vidées.");

    // ========== 2. UTILISATEURS ==========
    await db.utilisateurs.clear();

    const adminUser = { id: crypto.randomUUID(), nom: 'Admin', login: 'admin', mot_de_passe: 'admin123', role: 'superviseur' };
    const vendeur1 = { id: crypto.randomUUID(), nom: 'Marie Vente', login: 'vente', mot_de_passe: 'vente', role: 'superviseur_vente' };
    const vendeur2 = { id: crypto.randomUUID(), nom: 'Pierre Commercial', login: 'pierre', mot_de_passe: 'pierre', role: 'vendeur' };
    const caissier = { id: crypto.randomUUID(), nom: 'Jean Caissier', login: 'caissier', mot_de_passe: 'caisse', role: 'caissier' };
    const prod = { id: crypto.randomUUID(), nom: 'Paul Production', login: 'prod', mot_de_passe: 'prod', role: 'superviseur_huilerie' };

    await safeBulkAdd('utilisateurs', [adminUser, vendeur1, vendeur2, caissier, prod]);

    // ========== 3. RÉGLAGES ==========
    await db.reglages.clear();
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
        {
            cle: 'parcelles', valeur: [
                { nom: 'Parcelle Nord', surface_m2: 85000, gps: '-4.32154, 15.32145', annee_plantation: 2010, notes: 'Zone la plus productive' },
                { nom: 'Parcelle Sud', surface_m2: 72000, gps: '-4.33568, 15.31022', annee_plantation: 2012, notes: '' },
                { nom: 'Parcelle Est', surface_m2: 60000, gps: '-4.32890, 15.34567', annee_plantation: 2015, notes: 'Jeunes palmiers' },
                { nom: 'Parcelle Ouest', surface_m2: 45000, gps: '-4.31987, 15.29876', annee_plantation: 2008, notes: 'Vieille plantation' }
            ]
        },
        { cle: 'secteurs', valeur: ['Centre-ville', 'Est', 'Ouest', 'Nord'] },
        { cle: 'coordonnees', valeur: { nom: 'Huilerie du Congo SARL', adresse: '123 Avenue de la Paix, Kinshasa', telephone: '+243 123 456 789', email: 'contact@huilerie.cd', logo: '', legalInfo: 'RC 12345 / ID Nat. 01-234-N56789' } },
        { cle: 'taux_change', valeur: { USD_CDF: 2500 } },
        { cle: 'postes_travail', valeur: ['Ouvrier agricole', 'Opérateur machine', 'Comptable', 'Vendeur', 'Superviseur', 'Chauffeur'] },
        { cle: 'departements', valeur: ['Production', 'Comptabilité', 'Vente', 'Logistique', 'Administration'] },
        { cle: 'params_conges', valeur: { joursVacancesAnnuels: 26, plafondAvanceMois: 80, joursOuvrablesMois: 26 } },
        { cle: 'facteurs_emission', valeur: { gasoil_kg_co2_par_l: 2.68, essence_kg_co2_par_l: 2.31 } },
        { cle: 'taux_conversion', valeur: { huile_l_kg: 0.9, fruits_l_kg: 10 / 12 } },
        { cle: 'tolerance_paiement', valeur: { mode: 'pourcentage', valeur_pourcentage: 0.5, valeur_usd: 1, valeur_cdf: 500 } }
    ];
    for (const r of reglagesToAdd) {
        await db.reglages.add({ id: crypto.randomUUID(), cle: r.cle, valeur: r.valeur });
    }
    console.log("✅ Réglages ajoutés.");

    // ========== 4. SITES ==========
    const sites = [
        { id: crypto.randomUUID(), nom: 'Huilerie principale', estProduction: true },
        { id: crypto.randomUUID(), nom: 'Entrepôt Kinshasa', estProduction: false },
        { id: crypto.randomUUID(), nom: 'Dépôt Matadi', estProduction: false },
        { id: crypto.randomUUID(), nom: 'Point de vente Lubumbashi', estProduction: false }
    ];
    await safeBulkAdd('sites', sites);

    // ========== 5. CONDITIONNEMENTS ==========
    const conditionnements = [
        { id: crypto.randomUUID(), nom: 'Bidon 1L', code: 'B1', capaciteL: 1, retour_possible: true, actif: true, ordre: 1 },
        { id: crypto.randomUUID(), nom: 'Bidon 5L', code: 'B5', capaciteL: 5, retour_possible: true, actif: true, ordre: 2 },
        { id: crypto.randomUUID(), nom: 'Bidon 25L', code: 'B25', capaciteL: 25, retour_possible: true, actif: true, ordre: 3 },
        { id: crypto.randomUUID(), nom: 'Fût 200L', code: 'F200', capaciteL: 200, retour_possible: false, actif: true, ordre: 4 }
    ];
    await safeBulkAdd('conditionnements', conditionnements);

    // ========== 6. ARTICLES DE FOURNITURE ==========
    const articlesFourniture = [
        { id: crypto.randomUUID(), nom: 'Bidon vide 1L', type: 'contenant_vide', unite: 'pièce', seuil_alerte: 50, actif: true },
        { id: crypto.randomUUID(), nom: 'Bidon vide 5L', type: 'contenant_vide', unite: 'pièce', seuil_alerte: 50, actif: true },
        { id: crypto.randomUUID(), nom: 'Bidon vide 25L', type: 'contenant_vide', unite: 'pièce', seuil_alerte: 30, actif: true },
        { id: crypto.randomUUID(), nom: 'Étiquette 1L', type: 'etiquette', unite: 'pièce', seuil_alerte: 100, actif: true },
        { id: crypto.randomUUID(), nom: 'Étiquette 5L', type: 'etiquette', unite: 'pièce', seuil_alerte: 100, actif: true },
        { id: crypto.randomUUID(), nom: 'Étiquette 25L', type: 'etiquette', unite: 'pièce', seuil_alerte: 50, actif: true },
        { id: crypto.randomUUID(), nom: 'Bouchon standard', type: 'bouchon', unite: 'pièce', seuil_alerte: 200, actif: true }
    ];
    await safeBulkAdd('articles_fourniture', articlesFourniture);

    // ========== 7. COMPOSANTS DES CONDITIONNEMENTS ==========
    const comps = [];
    for (const cond of conditionnements) {
        if (cond.code === 'B1') {
            comps.push({ id: crypto.randomUUID(), conditionnement_id: cond.id, article_fourniture_id: articlesFourniture[0].id, quantite: 1 });
            comps.push({ id: crypto.randomUUID(), conditionnement_id: cond.id, article_fourniture_id: articlesFourniture[3].id, quantite: 1 });
            comps.push({ id: crypto.randomUUID(), conditionnement_id: cond.id, article_fourniture_id: articlesFourniture[6].id, quantite: 1 });
        } else if (cond.code === 'B5') {
            comps.push({ id: crypto.randomUUID(), conditionnement_id: cond.id, article_fourniture_id: articlesFourniture[1].id, quantite: 1 });
            comps.push({ id: crypto.randomUUID(), conditionnement_id: cond.id, article_fourniture_id: articlesFourniture[4].id, quantite: 1 });
            comps.push({ id: crypto.randomUUID(), conditionnement_id: cond.id, article_fourniture_id: articlesFourniture[6].id, quantite: 1 });
        } else if (cond.code === 'B25') {
            comps.push({ id: crypto.randomUUID(), conditionnement_id: cond.id, article_fourniture_id: articlesFourniture[2].id, quantite: 1 });
            comps.push({ id: crypto.randomUUID(), conditionnement_id: cond.id, article_fourniture_id: articlesFourniture[5].id, quantite: 1 });
            comps.push({ id: crypto.randomUUID(), conditionnement_id: cond.id, article_fourniture_id: articlesFourniture[6].id, quantite: 1 });
        }
    }
    await safeBulkAdd('conditionnement_composants', comps);

    // ========== 8. STOCKS DE FOURNITURES ==========
    const stocksFournitures = [];
    for (const site of sites) {
        for (const art of articlesFourniture) {
            stocksFournitures.push({
                id: crypto.randomUUID(),
                site_id: site.id,
                article_id: art.id,
                quantite: 500 + Math.floor(Math.random() * 500)
            });
        }
    }
    await safeBulkAdd('stocks_fournitures', stocksFournitures);

    // ========== 9. CARBURANTS ==========
    const carburantTypes = [
        { id: crypto.randomUUID(), nom: 'Gasoil', unite: 'L', facteur_co2: 2.68 },
        { id: crypto.randomUUID(), nom: 'Essence', unite: 'L', facteur_co2: 2.31 }
    ];
    await safeBulkAdd('carburant_types', carburantTypes);

    const carburantTypeSites = [];
    for (const ct of carburantTypes) {
        for (const site of sites) {
            carburantTypeSites.push({ id: crypto.randomUUID(), carburant_type_id: ct.id, site_id: site.id });
        }
    }
    await safeBulkAdd('carburant_type_sites', carburantTypeSites);

    const carburantUtilisations = [
        { id: crypto.randomUUID(), nom: 'Transport régimes', departement: 'Logistique' },
        { id: crypto.randomUUID(), nom: 'Groupes électrogènes', departement: 'Production' },
        { id: crypto.randomUUID(), nom: 'Véhicules de service', departement: 'Administration' },
        { id: crypto.randomUUID(), nom: 'Tronçonneuses', departement: 'Production' }
    ];
    await safeBulkAdd('carburant_utilisations', carburantUtilisations);

    const carburantStocks = [];
    for (const ct of carburantTypes) {
        for (const site of sites) {
            carburantStocks.push({ id: crypto.randomUUID(), carburant_type_id: ct.id, site_id: site.id, quantite: 800 + Math.floor(Math.random() * 500) });
        }
    }
    await safeBulkAdd('carburant_stocks', carburantStocks);

    // ========== 10. MODES DE PAIEMENT ==========
    await safeBulkAdd('modes_paiement', [
        { id: crypto.randomUUID(), nom: 'Liquide', actif: true },
        { id: crypto.randomUUID(), nom: 'Orange Money', actif: true },
        { id: crypto.randomUUID(), nom: 'Airtel Money', actif: true },
        { id: crypto.randomUUID(), nom: 'Carte bancaire', actif: true },
        { id: crypto.randomUUID(), nom: 'Virement', actif: true }
    ]);

    // ========== 11. POSTES BUDGÉTAIRES ==========
    const postesBudget = [
        { id: crypto.randomUUID(), nom: 'Vente huile', type: 'entree', lieFacture: true, actif: true, systeme: false, annee: ANNEE_COURANTE, typeFacturation: 'huile', typeComptable: 'produit', numero_compte: '701501' },
        { id: crypto.randomUUID(), nom: 'Transport régimes', type: 'sortie', lieFacture: false, actif: true, systeme: false, annee: ANNEE_COURANTE, typeComptable: 'charge', numero_compte: '624101' },
        { id: crypto.randomUUID(), nom: 'Carburant', type: 'sortie', lieFacture: false, actif: true, systeme: false, annee: ANNEE_COURANTE, typeComptable: 'charge', numero_compte: '624201', affectation_stock: 'carburant' },
        { id: crypto.randomUUID(), nom: 'Salaire - Production', type: 'sortie', lieFacture: false, actif: true, systeme: true, annee: ANNEE_COURANTE, typeComptable: 'charge', numero_compte: '641101' },
        { id: crypto.randomUUID(), nom: 'Salaire - Comptabilité', type: 'sortie', lieFacture: false, actif: true, systeme: true, annee: ANNEE_COURANTE, typeComptable: 'charge', numero_compte: '641102' },
        { id: crypto.randomUUID(), nom: 'Salaire - Vente', type: 'sortie', lieFacture: false, actif: true, systeme: true, annee: ANNEE_COURANTE, typeComptable: 'charge', numero_compte: '641103' },
        { id: crypto.randomUUID(), nom: 'Salaire - Logistique', type: 'sortie', lieFacture: false, actif: true, systeme: true, annee: ANNEE_COURANTE, typeComptable: 'charge', numero_compte: '641104' },
        { id: crypto.randomUUID(), nom: 'Maintenance', type: 'sortie', lieFacture: false, actif: true, systeme: false, annee: ANNEE_COURANTE, typeComptable: 'charge', numero_compte: '615201' },
        { id: crypto.randomUUID(), nom: 'Loyer', type: 'sortie', lieFacture: false, actif: true, systeme: false, annee: ANNEE_COURANTE, typeComptable: 'charge', numero_compte: '613201' },
        { id: crypto.randomUUID(), nom: 'Fournitures bureau', type: 'sortie', lieFacture: false, actif: true, systeme: false, annee: ANNEE_COURANTE, typeComptable: 'charge', numero_compte: '606401', affectation_stock: 'emballage' },
        { id: crypto.randomUUID(), nom: 'Honoraires comptables', type: 'sortie', lieFacture: false, actif: true, systeme: false, annee: ANNEE_COURANTE, typeComptable: 'charge', numero_compte: '622601' }
    ];
    await safeBulkAdd('postes_budgetaires', postesBudget);

    // ========== 12. PLAN COMPTABLE ==========
    const planComptable = [
        { id: crypto.randomUUID(), numero_compte: '701501', intitule: 'Ventes huile', type: 'produit' },
        { id: crypto.randomUUID(), numero_compte: '624101', intitule: 'Transport régimes', type: 'charge' },
        { id: crypto.randomUUID(), numero_compte: '624201', intitule: 'Carburant', type: 'charge' },
        { id: crypto.randomUUID(), numero_compte: '641101', intitule: 'Salaires Production', type: 'charge' },
        { id: crypto.randomUUID(), numero_compte: '641102', intitule: 'Salaires Comptabilité', type: 'charge' },
        { id: crypto.randomUUID(), numero_compte: '641103', intitule: 'Salaires Vente', type: 'charge' },
        { id: crypto.randomUUID(), numero_compte: '615201', intitule: 'Maintenance', type: 'charge' },
        { id: crypto.randomUUID(), numero_compte: '613201', intitule: 'Loyer', type: 'charge' },
        { id: crypto.randomUUID(), numero_compte: '606401', intitule: 'Fournitures bureau', type: 'charge' },
        { id: crypto.randomUUID(), numero_compte: '622601', intitule: 'Honoraires comptables', type: 'charge' }
    ];
    await safeBulkAdd('plan_comptable', planComptable);

    // ========== 13. JOURNAUX ==========
    await safeBulkAdd('journaux', [
        { id: crypto.randomUUID(), code: 'BQ1', libelle: 'Banque Rawbank USD', type: 'banque' },
        { id: crypto.randomUUID(), code: 'CKI', libelle: 'Caisse Kinshasa USD', type: 'caisse' },
        { id: crypto.randomUUID(), code: 'CAI', libelle: 'Caisse Kinshasa CDF', type: 'caisse' },
        { id: crypto.randomUUID(), code: 'OD', libelle: 'Opérations diverses', type: 'manuel' }
    ]);

    // ========== 14. TAUX DE CHANGE JOURNALIERS ==========
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

    const tauxMensuels = [];
    for (let m = 1; m <= 12; m++) {
        tauxMensuels.push({ id: crypto.randomUUID(), annee: ANNEE_COURANTE, mois: m, taux: 2500 + Math.floor(Math.random() * 50) });
    }
    await safeBulkAdd('taux_change_mensuel', tauxMensuels);

    // ========== 15. COMPTE BANCAIRE ==========
    await safeBulkAdd('comptes_bancaires', [
        { id: crypto.randomUUID(), nom: 'Rawbank USD', titulaire: 'Huilerie du Congo SARL', numero: '00123456789', devise: 'USD', solde_initial: 10000 }
    ]);

    // ========== 16. LOTS ==========
    const lots = [];
    for (let i = 1; i <= 40; i++) {
        const date = new Date(DEBUT_ANNEE);
        date.setDate(DEBUT_ANNEE.getDate() + i * 5);
        lots.push({
            id: crypto.randomUUID(),
            numero: `LOT-${String(i).padStart(3, '0')}`,
            dateCreation: date.toISOString()
        });
    }
    await safeBulkAdd('lots', lots);

    // ========== 17. SEMAINES DE RÉCOLTE & PRODUCTION ==========
    const debutAnneeProd = new Date(ANNEE_COURANTE, 0, 5);
    const semainesRecolte = [];
    const semainesProd = [];
    for (let i = 0; i < SEMAINES_TOTAL; i++) {
        const lundi = new Date(debutAnneeProd);
        lundi.setDate(debutAnneeProd.getDate() + i * 7);
        const dimanche = new Date(lundi);
        dimanche.setDate(lundi.getDate() + 6);
        if (lundi > DATE_LIMITE) break;

        const dateDebut = lundi.toISOString().slice(0, 10);
        const dateFin = dimanche.toISOString().slice(0, 10);
        const facteurSaison = 1.0 + Math.random() * 0.3;
        const poidsRegimes = Math.round(5000 * facteurSaison + Math.random() * 500);

        semainesRecolte.push({
            id: crypto.randomUUID(),
            dateDebut,
            dateFin,
            poidsRegimesTotal: poidsRegimes,
            nbRegimesTotal: Math.round(poidsRegimes / 25),
            nbPalmiersEntretenusTotal: 400 + Math.floor(Math.random() * 100),
            nbPalmiersVisitesTotal: 500 + Math.floor(Math.random() * 100),
            poidsMoyenRegime: 25,
            poidsRegimeParPalmier: 50
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

    // ========== 18. RÉCOLTE JOURNALIÈRE ==========
    const parcelles = reglagesToAdd.find(r => r.cle === 'parcelles').valeur;
    const recolteJournaliere = [];
    for (const sem of semainesRecolte) {
        const debut = new Date(sem.dateDebut);
        for (let j = 0; j < 7; j++) {
            const date = new Date(debut);
            date.setDate(debut.getDate() + j);
            if (date > DATE_LIMITE) break;
            const parcelle = parcelles[Math.floor(Math.random() * parcelles.length)];
            recolteJournaliere.push({
                id: crypto.randomUUID(),
                semaineId: sem.id,
                date: date.toISOString().slice(0, 10),
                parcelle: parcelle.nom,
                nbTravailleurs: 4 + Math.floor(Math.random() * 4),
                nbPalmiersRecoltes: 15 + Math.floor(Math.random() * 10),
                nbPalmiersEntretenus: 20 + Math.floor(Math.random() * 15),
                nbRegimes: 25 + Math.floor(Math.random() * 15)
            });
        }
    }
    await safeBulkAdd('recolte_journaliere', recolteJournaliere);

    // ========== 19. PRODUCTION CONSOMMATION & LOTS ==========
    const prodConsommation = [];
    const prodLots = [];
    for (let i = 0; i < semainesProd.length; i++) {
        const semaine = semainesProd[i];
        const dateSem = new Date(semaine.dateDebut);
        for (let d = 0; d < 7; d++) {
            const dateJour = new Date(dateSem);
            dateJour.setDate(dateSem.getDate() + d);
            if (dateJour > DATE_LIMITE) break;
            prodConsommation.push({
                id: crypto.randomUUID(),
                semaineProdId: semaine.id,
                date: dateJour.toISOString().slice(0, 10),
                fruitsTransformesKg: Math.round(800 + Math.random() * 200),
                consoGasoil: Math.round(20 + Math.random() * 5),
                consoEssence: Math.round(5 + Math.random() * 3),
                semaineRecolteId: semainesRecolte[i]?.id || null,
                nbTravailleurs: 4 + Math.floor(Math.random() * 4)
            });
        }
        for (let j = 0; j < 2; j++) {
            const lot = lots[(i * 2 + j) % lots.length];
            const cond = conditionnements[j % 3];
            const volumeL = Math.round(180 + Math.random() * 100);
            prodLots.push({
                id: crypto.randomUUID(),
                semaineProdId: semaine.id,
                numeroLot: lot.numero,
                date: semaine.dateDebut,
                fruitsTransformesKg: Math.round(volumeL * 4.5),
                semaineRecolteId: semainesRecolte[i]?.id,
                volumeHuileL: volumeL,
                conditionnementId: cond.id,
                lotId: lot.id,
                tauxAcidite: 0.5 + Math.random() * 0.3,
                noteGout: 7 + Math.floor(Math.random() * 3),
                noteOdeur: 8,
                noteCouleur: 9
            });
        }
    }
    await safeBulkAdd('production_consommation', prodConsommation);
    await safeBulkAdd('production_lot', prodLots);

    // ========== 20. STOCKS D'HUILE ==========
    const stocks = [];
    for (const site of sites) {
        for (const lot of lots.slice(0, 10)) {
            for (const cond of conditionnements) {
                stocks.push({
                    id: crypto.randomUUID(),
                    siteId: site.id,
                    lotId: lot.id,
                    conditionnementId: cond.id,
                    quantite: 100 + Math.floor(Math.random() * 200)
                });
            }
        }
    }
    await safeBulkAdd('stocks', stocks);

    // ========== 21. CLIENTS ==========
    await safeBulkAdd('types_clients', [
        { id: crypto.randomUUID(), nom: 'Boutique', description: 'Petit commerce' },
        { id: crypto.randomUUID(), nom: 'Supermarché', description: 'Grande surface' },
        { id: crypto.randomUUID(), nom: 'Privé', description: 'Particulier' },
        { id: crypto.randomUUID(), nom: 'Distributeur', description: 'Gros' }
    ]);

    const clients = [
        { id: crypto.randomUUID(), nom: 'Supermarché Kin Marché', type: 'Supermarché', nbPointsVente: 2, adresse: '123 Boulevard du 30 Juin', secteur: 'Centre-ville', telephone: '0812345678', email: 'contact@kinmarche.cd', produitsAchetes: 'Huile 5L, 25L', notes: 'Bon client' },
        { id: crypto.randomUUID(), nom: 'Boutique Mama Jeanne', type: 'Boutique', nbPointsVente: 1, adresse: '45 Rue Kasaï', secteur: 'Est', telephone: '0823456789', email: null, produitsAchetes: 'Huile 1L, 5L', notes: '' },
        { id: crypto.randomUUID(), nom: 'Distributeur Saphir', type: 'Distributeur', nbPointsVente: 5, adresse: 'Zone industrielle', secteur: 'Ouest', telephone: '0834567890', email: 'saphir@distrib.cd', produitsAchetes: 'Huile 25L en gros', notes: 'Livraison hebdomadaire' },
        { id: crypto.randomUUID(), nom: 'Client Privé - M. Kabila', type: 'Privé', nbPointsVente: 1, adresse: '56 Avenue Lumumba', secteur: 'Nord', telephone: '0845678901', email: null, produitsAchetes: 'Huile 5L', notes: '' },
        { id: crypto.randomUUID(), nom: 'Épicerie du Coin', type: 'Boutique', nbPointsVente: 1, adresse: '78 Rue du Commerce', secteur: 'Centre-ville', telephone: '0856789012', email: null, produitsAchetes: 'Huile 1L', notes: '' }
    ];
    await safeBulkAdd('clients', clients);

    // ========== 22. TARIFS ==========
    const tarifs = [
        { id: crypto.randomUUID(), code: 'A', devise: 'USD', prixParConditionnement: { [conditionnements[0].id]: 2.5, [conditionnements[1].id]: 11, [conditionnements[2].id]: 50, [conditionnements[3].id]: 380 }, note: 'Tarif standard USD', dateCreation: new Date().toISOString() },
        { id: crypto.randomUUID(), code: 'B', devise: 'CDF', prixParConditionnement: { [conditionnements[0].id]: 6000, [conditionnements[1].id]: 27500, [conditionnements[2].id]: 125000, [conditionnements[3].id]: 950000 }, note: 'Tarif CDF', dateCreation: new Date().toISOString() }
    ];
    await safeBulkAdd('tarifs', tarifs);

    // ========== 23. TRAVAILLEURS ==========
    const travailleurs = [
        { id: crypto.randomUUID(), nom: 'Mbala', postnom: 'Kongo', prenom: 'Jean', date_naissance: '1985-03-15', date_debut: `${ANNEE_COURANTE - 1}-01-01`, departement: 'Production', poste_travail_id: 'Ouvrier agricole', salaire_actuel: 150000, devise_salaire: 'CDF', actif: true, nb_personnes_charge: 3, salaire_net_total: 150000, salaire_brut_calcule: 180000, soumis_ipr: true, soumis_cnss: true },
        { id: crypto.randomUUID(), nom: 'Mukendi', postnom: 'Tshilombo', prenom: 'Marie', date_naissance: '1990-07-22', date_debut: `${ANNEE_COURANTE - 1}-02-01`, departement: 'Vente', poste_travail_id: 'Vendeur', salaire_actuel: 200000, devise_salaire: 'CDF', actif: true, nb_personnes_charge: 1, salaire_net_total: 200000, salaire_brut_calcule: 240000, soumis_ipr: true, soumis_cnss: true },
        { id: crypto.randomUUID(), nom: 'Kabongo', postnom: 'Ilunga', prenom: 'Pierre', date_naissance: '1988-11-05', date_debut: `${ANNEE_COURANTE - 2}-03-01`, departement: 'Logistique', poste_travail_id: 'Chauffeur', salaire_actuel: 180000, devise_salaire: 'CDF', actif: true, nb_personnes_charge: 4, salaire_net_total: 180000, salaire_brut_calcule: 216000, soumis_ipr: true, soumis_cnss: true },
        { id: crypto.randomUUID(), nom: 'Tshibangu', postnom: 'Mwamba', prenom: 'Joseph', date_naissance: '1992-05-10', date_debut: `${ANNEE_COURANTE - 1}-06-01`, departement: 'Comptabilité', poste_travail_id: 'Comptable', salaire_actuel: 300000, devise_salaire: 'CDF', actif: true, nb_personnes_charge: 2, salaire_net_total: 300000, salaire_brut_calcule: 360000, soumis_ipr: true, soumis_cnss: true },
        { id: crypto.randomUUID(), nom: 'Nkulu', postnom: 'Banza', prenom: 'Albert', date_naissance: '1987-09-18', date_debut: `${ANNEE_COURANTE - 3}-04-01`, departement: 'Production', poste_travail_id: 'Superviseur', salaire_actuel: 250000, devise_salaire: 'CDF', actif: true, nb_personnes_charge: 5, salaire_net_total: 250000, salaire_brut_calcule: 300000, soumis_ipr: true, soumis_cnss: true }
    ];
    await safeBulkAdd('travailleurs', travailleurs);

    // Lier les vendeurs à des travailleurs
    await db.utilisateurs.update(vendeur1.id, { travailleur_id: travailleurs[1].id });
    await db.utilisateurs.update(vendeur2.id, { travailleur_id: travailleurs[1].id });

    // ========== 24. PRÉSENCES ==========
    const presences = [];
    for (const t of travailleurs) {
        for (let mois = 1; mois <= MOIS_TOTAL; mois++) {
            presences.push({
                id: crypto.randomUUID(),
                travailleur_id: t.id,
                annee: ANNEE_COURANTE,
                mois,
                jours_vacances: Math.floor(Math.random() * 3),
                jours_suspension: Math.floor(Math.random() * 2),
                motif: ''
            });
        }
    }
    await safeBulkAdd('presence_suspension', presences);

    // ========== 25. CAISSES ET SOUS-CAISSES AVEC SEMAINES CLÔTURÉES ==========
    const caisseId = crypto.randomUUID();
    await safeBulkAdd('caisses', [{ id: caisseId, nom: 'Caisse Principale', active: true }]);

    const sousCaisseUSD = { id: crypto.randomUUID(), caisseId, nom: 'Espèces USD', devise: 'USD', solde_initial: 5000, typePaiement: '1', actif: true };
    const sousCaisseCDF = { id: crypto.randomUUID(), caisseId, nom: 'Espèces CDF', devise: 'CDF', solde_initial: 2000000, typePaiement: '1', actif: true };
    await safeBulkAdd('sous_caisses', [sousCaisseUSD, sousCaisseCDF]);

    // Calculer le lundi de la semaine courante
    const aujourdhuiSem = new Date();
    const jourSemaine = aujourdhuiSem.getDay();
    const diffLundi = jourSemaine === 0 ? 6 : jourSemaine - 1;
    const lundiCourant = new Date(aujourdhuiSem);
    lundiCourant.setDate(aujourdhuiSem.getDate() - diffLundi);

    // Créer les 20 semaines passées CLÔTURÉES
    const semainesCaisse = [];
    const mapSemainesParLundi = {};
    for (let i = 20; i >= 1; i--) {
        const lundi = new Date(lundiCourant);
        lundi.setDate(lundiCourant.getDate() - i * 7);
        const dimanche = new Date(lundi);
        dimanche.setDate(lundi.getDate() + 6);
        const semaine = {
            id: crypto.randomUUID(),
            caisseId,
            dateDebut: lundi.toISOString().slice(0, 10),
            dateFin: dimanche.toISOString().slice(0, 10),
            soldeOuvertureUSD: 0,
            soldeOuvertureCDF: 0,
            soldeClotureUSD: 0,
            soldeClotureCDF: 0,
            estCloturee: true,
            dateCloture: new Date().toISOString(),
            commentaireCloture: 'Semaine de test clôturée automatiquement'
        };
        semainesCaisse.push(semaine);
        mapSemainesParLundi[lundi.toISOString().slice(0, 10)] = semaine;
    }

    // Semaine courante (ouverte)
    const dateFinCourante = new Date(lundiCourant);
    dateFinCourante.setDate(lundiCourant.getDate() + 6);
    const semaineCourante = {
        id: crypto.randomUUID(),
        caisseId,
        dateDebut: lundiCourant.toISOString().slice(0, 10),
        dateFin: dateFinCourante.toISOString().slice(0, 10),
        soldeOuvertureUSD: 5000,
        soldeOuvertureCDF: 2000000,
        soldeClotureUSD: 0,
        soldeClotureCDF: 0,
        estCloturee: false,
        dateCloture: null,
        commentaireCloture: ''
    };
    semainesCaisse.push(semaineCourante);
    await safeBulkAdd('semaines_caisse', semainesCaisse);

    // Fonction utilitaire : trouver la semaine correspondant à une date
    function trouverSemaine(dateStr) {
        const d = new Date(dateStr);
        const j = d.getDay();
        const diff = j === 0 ? 6 : j - 1;
        const lundi = new Date(d);
        lundi.setDate(d.getDate() - diff);
        const key = lundi.toISOString().slice(0, 10);
        return mapSemainesParLundi[key] || semaineCourante;
    }

    // Associer utilisateurs à la caisse
    await safeBulkAdd('caisse_utilisateurs', [
        { id: crypto.randomUUID(), caisseId, utilisateurId: adminUser.id, peutCloturer: true },
        { id: crypto.randomUUID(), caisseId, utilisateurId: caissier.id, peutCloturer: false }
    ]);

    // ========== 26. FACTURES AVEC VENDEUR ET PAIEMENTS ==========
    const factures = [];
    const factureLignes = [];
    const paiementsCaisse = [];

    const vendeursList = [vendeur1, vendeur2];

    for (let mois = 0; mois < MOIS_TOTAL; mois++) {
        const nbFactures = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < nbFactures; i++) {
            const client = clients[i % clients.length];
            const vendeur = vendeursList[Math.floor(Math.random() * vendeursList.length)];
            const jourMax = (mois === MOIS_TOTAL - 1) ? DATE_LIMITE.getDate() : new Date(ANNEE_COURANTE, mois + 1, 0).getDate();
            const jour = 1 + Math.floor(Math.random() * jourMax);
            const date = `${ANNEE_COURANTE}-${String(mois + 1).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
            if (new Date(date) > DATE_LIMITE) continue;

            const numero = `F${(mois * 10 + i + 1).toString().padStart(3, '0')}/${ANNEE_COURANTE.toString().slice(-2)}`;
            const factureId = crypto.randomUUID();
            const devise = Math.random() > 0.5 ? 'CDF' : 'USD';
            const totalHT = devise === 'CDF' ? 100000 + Math.floor(Math.random() * 300000) : 40 + Math.floor(Math.random() * 200);

            const randomStatut = Math.random();
            let statutPaiement, statutLivraison, montantPaye;
            if (randomStatut < 0.7) {
                statutPaiement = 'payée';
                montantPaye = totalHT;
            } else if (randomStatut < 0.9) {
                statutPaiement = 'partiel';
                montantPaye = totalHT * 0.5;
            } else {
                statutPaiement = 'en_attente';
                montantPaye = 0;
            }
            statutLivraison = 'livrée';

            factures.push({
                id: factureId,
                numero,
                date,
                echeance: '30j',
                dateEcheance: new Date(new Date(date).getTime() + 30 * 86400000).toISOString().slice(0, 10),
                clientId: client.id,
                vendeurId: vendeur.id,
                siteId: sites[0].id,
                devise,
                tarif: devise === 'CDF' ? 'B' : 'A',
                remise: 0,
                remiseMontant: 0,
                remiseType: 'amount',
                totalHT,
                statutLivraison,
                statutPaiement,
                typeFacture: 'huile',
                blSelectionne: true,
                dateLivraison: date,
                datePaiement: statutPaiement === 'payée' ? date : null,
                notes: '',
                dateCreation: new Date().toISOString()
            });

            for (let j = 0; j < 2; j++) {
                const cond = conditionnements[j];
                const qte = 5 + Math.floor(Math.random() * 15);
                const pu = devise === 'CDF'
                    ? (cond.capaciteL === 1 ? 6000 : cond.capaciteL === 5 ? 27500 : 125000)
                    : (cond.capaciteL === 1 ? 2.5 : cond.capaciteL === 5 ? 11 : 50);
                factureLignes.push({
                    id: crypto.randomUUID(),
                    factureId,
                    conditionnementId: cond.id,
                    quantite: qte,
                    prixUnitaire: pu,
                    prixTotal: qte * pu,
                    remiseLigne: 0
                });
            }

            // Créer le paiement si la facture est payée ou partielle
            if (montantPaye > 0) {
                const sc = devise === 'USD' ? sousCaisseUSD : sousCaisseCDF;
                const tauxJour = 2500 + Math.floor(Math.random() * 50);
                const montantCDF = devise === 'CDF' ? montantPaye : montantPaye * tauxJour;
                const montantUSD = devise === 'USD' ? montantPaye : montantPaye / tauxJour;
                const semaineConcernee = trouverSemaine(date);

                paiementsCaisse.push({
                    id: crypto.randomUUID(),
                    caisseId,
                    sousCaisseId: sc.id,
                    semaineId: semaineConcernee.id,
                    date,
                    type: 'entree',
                    montant: montantPaye,
                    devise,
                    montant_cdf: montantCDF,
                    montant_usd: montantUSD,
                    posteBudgetaire: 'Vente huile',
                    factureId,
                    justificatif: `Paiement facture ${numero}`,
                    commentaire: statutPaiement === 'partiel' ? 'Paiement partiel' : 'Paiement complet',
                    designation: `Paiement facture ${numero}`,
                    status: 'validé',
                    aJustifier: false,
                    estCorrection: false,
                    typeCorrection: null,
                    remplaceParCorrection: false,
                    annule: false,
                    parentId: null,
                    correctionParentId: null,
                    montant_converti_facture: montantPaye,
                    dateCreation: new Date().toISOString()
                });
            }
        }
    }
    await safeBulkAdd('factures', factures);
    await safeBulkAdd('facture_lignes', factureLignes);
    console.log(`✅ ${paiementsCaisse.length} paiements de factures à créer.`);

    // ========== 27. AUTRES MOUVEMENTS DE CAISSE (dépenses) ==========
    const mouvementsDivers = [];
    const postesSortie = postesBudget.filter(p => p.type === 'sortie' && !p.systeme);

    for (let mois = 0; mois < MOIS_TOTAL; mois++) {
        const nbMvts = 5 + Math.floor(Math.random() * 5);
        for (let i = 0; i < nbMvts; i++) {
            const jourMax = (mois === MOIS_TOTAL - 1) ? DATE_LIMITE.getDate() : new Date(ANNEE_COURANTE, mois + 1, 0).getDate();
            const jour = 1 + Math.floor(Math.random() * jourMax);
            const date = `${ANNEE_COURANTE}-${String(mois + 1).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
            if (new Date(date) > DATE_LIMITE) continue;

            const poste = postesSortie[Math.floor(Math.random() * postesSortie.length)];
            const devise = Math.random() > 0.5 ? 'USD' : 'CDF';
            const montant = devise === 'USD' ? 50 + Math.floor(Math.random() * 300) : 20000 + Math.floor(Math.random() * 200000);
            const sc = devise === 'USD' ? sousCaisseUSD : sousCaisseCDF;
            const tauxJour = 2500 + Math.floor(Math.random() * 50);
            const montantCDF = devise === 'CDF' ? montant : montant * tauxJour;
            const montantUSD = devise === 'USD' ? montant : montant / tauxJour;
            const semaineConcernee = trouverSemaine(date);

            mouvementsDivers.push({
                id: crypto.randomUUID(),
                caisseId,
                sousCaisseId: sc.id,
                semaineId: semaineConcernee.id,
                date,
                type: 'sortie',
                montant,
                devise,
                montant_cdf: montantCDF,
                montant_usd: montantUSD,
                posteBudgetaire: poste.nom,
                factureId: null,
                justificatif: `Dépense ${poste.nom}`,
                commentaire: '',
                designation: `Dépense ${poste.nom}`,
                status: 'validé',
                aJustifier: false,
                estCorrection: false,
                typeCorrection: null,
                remplaceParCorrection: false,
                annule: false,
                parentId: null,
                correctionParentId: null,
                dateCreation: new Date().toISOString()
            });
        }
    }

    // Ajouter paiements + dépenses
    const tousMouvementsCaisse = [...paiementsCaisse, ...mouvementsDivers];
    await safeBulkAdd('mouvementsCaisse', tousMouvementsCaisse);
    console.log(`✅ Total ${tousMouvementsCaisse.length} mouvements de caisse créés.`);

    // ========== 28. BONS DE LIVRAISON ==========
    const bonsLivraison = [];
    const blLignes = [];
    for (let i = 0; i < Math.min(20, factures.length); i++) {
        const fact = factures[i];
        if (!fact) break;
        const blId = crypto.randomUUID();
        bonsLivraison.push({
            id: blId,
            numero: `BL${(i + 1).toString().padStart(3, '0')}/${ANNEE_COURANTE.toString().slice(-2)}`,
            factureId: fact.id,
            date: fact.date,
            siteId: sites[0].id,
            statut: 'livré',
            vendeurId: fact.vendeurId,
            superviseurValidation: null,
            notes: ''
        });
        const lignesFact = factureLignes.filter(l => l.factureId === fact.id);
        for (let j = 0; j < lignesFact.length; j++) {
            blLignes.push({
                id: crypto.randomUUID(),
                blId,
                lotId: lots[j % lots.length].id,
                conditionnementId: lignesFact[j].conditionnementId,
                quantiteLivree: lignesFact[j].quantite
            });
        }
    }
    await safeBulkAdd('bons_livraison', bonsLivraison);
    await safeBulkAdd('bl_lignes', blLignes);

    // ========== 29. BUDGET ==========
    const budgetData = {};
    for (let p of postesBudget) {
        budgetData[p.id] = Array(12).fill(0);
        for (let m = 0; m < MOIS_TOTAL; m++) {
            if (p.type === 'entree') {
                budgetData[p.id][m] = 5000000 + m * 300000;
            } else {
                budgetData[p.id][m] = 300000 + m * 50000;
                if (p.nom === 'Carburant') budgetData[p.id][m] = 200000;
                if (p.nom === 'Transport régimes') budgetData[p.id][m] = 350000;
            }
        }
    }
    await db.budget_versions.add({
        id: crypto.randomUUID(),
        annee: ANNEE_COURANTE,
        version: 1,
        date_creation: new Date().toISOString(),
        utilisateur_id: adminUser.id,
        utilisateur_nom: adminUser.nom,
        donnees: budgetData
    });

    // ========== 30. OBJECTIFS MENSUELS ==========
    const objectifs = [
        { domaine: 'Regimes', valeurs: Array(12).fill(5500) },
        { domaine: 'TauxFruits', valeurs: Array(12).fill(62) },
        { domaine: 'TauxExtraction', valeurs: Array(12).fill(22) },
        { domaine: 'TauxGlobal', valeurs: Array(12).fill(13.6) },
        { domaine: 'Huile', valeurs: Array(12).fill(1200) },
        { domaine: 'VolumeVentes', valeurs: Array(12).fill(1000) },
        { domaine: 'PrixMoyenVente', valeurs: Array(12).fill(2600) },
        { domaine: 'Ventes', valeurs: Array(12).fill(2600000) },
        { domaine: 'Qualite', valeurs: Array(12).fill(7.8) },
        { domaine: 'Acidite', valeurs: Array(12).fill(0.55) },
        { domaine: 'ConsoGasoil', valeurs: Array(12).fill(200) },
        { domaine: 'ConsoEssence', valeurs: Array(12).fill(50) }
    ];
    for (const obj of objectifs) {
        await db.objectifs_mensuels.add({
            id: crypto.randomUUID(),
            annee: ANNEE_COURANTE,
            domaine: obj.domaine,
            vendeur_id: null,
            donnees: obj.valeurs
        });
    }

    // Objectifs par vendeur (pour bonus)
    for (const vendeur of vendeursList) {
        await db.objectifs_mensuels.add({
            id: crypto.randomUUID(),
            annee: ANNEE_COURANTE,
            domaine: 'BonusVolumeMin',
            vendeur_id: vendeur.id,
            donnees: Array(12).fill(200)
        });
        await db.objectifs_mensuels.add({
            id: crypto.randomUUID(),
            annee: ANNEE_COURANTE,
            domaine: 'BonusPrixMin',
            vendeur_id: vendeur.id,
            donnees: Array(12).fill(2500)
        });
        await db.objectifs_mensuels.add({
            id: crypto.randomUUID(),
            annee: ANNEE_COURANTE,
            domaine: 'BonusParLitre',
            vendeur_id: vendeur.id,
            donnees: Array(12).fill(50)
        });
    }

    // ========== 31. PROJETS ==========
    await safeBulkAdd('projets', [
        { id: crypto.randomUUID(), nom: 'Huile de Palme', actif: true },
        { id: crypto.randomUUID(), nom: 'Huile de Coco', actif: false }
    ]);

    // ========== 32. PRIMES ==========
    const primes = [];
    for (const t of travailleurs) {
        for (let m = 1; m <= MOIS_TOTAL; m++) {
            if (Math.random() > 0.7) {
                primes.push({
                    id: crypto.randomUUID(),
                    travailleur_id: t.id,
                    annee: ANNEE_COURANTE,
                    mois: m,
                    montant: Math.round(10000 + Math.random() * 30000),
                    libelle: `Prime ${t.departement}`,
                    payee: Math.random() > 0.5
                });
            }
        }
    }
    await safeBulkAdd('primes', primes);

    console.log("✅ Données de test générées avec succès !");
    alert(
        "✅ Données de test générées avec succès !\n\n" +
        "Comptes disponibles :\n" +
        "• admin / admin123 (superviseur)\n" +
        "• vente / vente (superviseur vente)\n" +
        "• pierre / pierre (vendeur)\n" +
        "• caissier / caisse (caissier)\n" +
        "• prod / prod (superviseur huilerie)\n\n" +
        "Vous pouvez maintenant tester l'application."
    );
    location.reload();
}