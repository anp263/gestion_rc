// src/db.js
import Dexie from 'dexie';

export const db = new Dexie('GestionHuileDB_v4');

db.version(1).stores({
    // ==================== TABLES CONSERVÉES ====================
    utilisateurs: 'id, nom, login, role, travailleur_id',
    reglages: 'id, cle, valeur',
    semaines_recolte: 'id, dateDebut, dateFin',
    recolte_journaliere: 'id, semaineId, date',
    semaines_production: 'id, dateDebut, dateFin',
    production_consommation: 'id, semaineProdId, date',
    production_lot: 'id, semaineProdId, lotId, date, volumeHuileL, conditionnementId',
    lots: 'id, numero, semaineProdId, dateCreation',
    sites: 'id, nom, estProduction',
    stocks: 'id, siteId, lotId, conditionnementId, quantite',
    mouvements: 'id, type, date, description, statut, notes',
    mouvement_lignes: 'id, mouvementId, lotId, conditionnementId, quantite, siteSource, siteDestination',
    transferts: 'id, numero, dateCreation, siteSource, siteDestination, statut, createurId, notes',
    transfert_lignes: 'id, transfertId, lotId, conditionnementId, quantite, quantiteRecue',
    inventaires: 'id, siteId, date, statut',
    inventaire_lignes: 'id, inventaireId, lotId, conditionnementId, quantiteTheorique, quantiteReelle, ecart, justification',
    reconditionnements: 'id, siteId, date, lotId, conditionnementSource, quantiteSource, conditionnementDestination, quantiteDestination, remarques',
    clients: 'id, nom, type, secteur, telephone, email, produitsAchetes, notes',
    types_clients: 'id, nom, description',
    tarifs: 'id, code, devise, prixParConditionnement, note', // stocke un objet {conditionnementId: prix}
    factures: 'id, numero, date, echeance, dateEcheance, clientId, vendeurId, siteId, devise, tarif, remise, remiseMontant, remiseType, totalHT, montant_cdf, montant_usd, statutLivraison, statutPaiement, bonLivraisonId, typeFacture, notes, dateCreation, datePaiement, blSelectionne',
    facture_lignes: 'id, factureId, conditionnementId, quantite, prixUnitaire, prixTotal, remiseLigne, libelle',
    bons_livraison: 'id, numero, factureId, date, siteId, statut, vendeurId, superviseurValidation, notes',
    bl_lignes: 'id, blId, lotId, conditionnementId, quantiteLivree',
    caisses: 'id, nom, active',
    sous_caisses: 'id, caisseId, nom, devise, solde_initial, typePaiement, actif',
    mouvementsCaisse: 'id, caisseId, sousCaisseId, semaineId, date, type, montant, devise, montant_cdf, montant_usd, posteBudgetaire, status, aJustifier, estCorrection, typeCorrection, remplaceParCorrection, annule, parentId, correctionParentId, factureId, justificatif, commentaire, designation, dateCreation, montant_converti_facture, correctionComptable',
    operationsChange: 'id, caisseId, sousCaisseSource, sousCaisseDestination, date, montantSource, deviseSource, montantDestination, deviseDestination, taux, status',
    erreurs_caisse: 'id, semaineId, caisseId, sousCaisseId, date, soldeDeclare, devise, ecart, type',
    clotures_sous_caisse: 'id, semaineId, sousCaisseId, dateCloture, soldeDeclare, ecart, type',
    caisse_utilisateurs: 'id, caisseId, utilisateurId',
    semaines_caisse: 'id, caisseId, dateDebut, dateFin, soldeOuvertureUSD, soldeOuvertureCDF, soldeClotureUSD, soldeClotureCDF, estCloturee, dateCloture, commentaireCloture',
    modes_paiement: 'id, nom, actif',
    postes_budgetaires: 'id, nom, type, lieFacture, estRetraitBancaire, actif, systeme, annee, typeFacturation, typeComptable, numero_compte, affectation_stock, [annee+actif]',
    budget_versions: 'id, annee, version, date_creation, utilisateur_id, utilisateur_nom, donnees',
    taux_change_mensuel: 'id, annee, mois, taux',
    comptes_bancaires: 'id, nom, titulaire, numero, devise, solde_initial',
    imports_bancaires: 'id, compte_id, semaine_id, date_import, statut, nom_fichier',
    mouvements_bancaires: 'id, import_id, compte_id, date_operation, libelle, montant, devise, montant_cdf, montant_usd, type, poste_id, statut, verification, caisse_id, correctionComptable',
    regles_affectation: 'id, compte_id, mot_cle, poste_id, actif',
    taux_change: 'id, date, taux',
    travailleurs: 'id, nom, postnom, prenom, date_naissance, date_debut, departement, poste_travail_id, salaire_actuel, devise_salaire, actif, nb_personnes_charge, salaire_net_total, salaire_brut_calcule, soumis_ipr, soumis_cnss',
    salaires_historique: 'id, travailleur_id, date_effet, montant',
    presence_suspension: 'id, travailleur_id, annee, mois, jours_vacances, jours_suspension, motif',
    avances: 'id, travailleur_id, type, mois_concerne, montant, date_avance, statut, nb_mois_remboursement, mouvementCaisseId',
    remboursements_avances: 'id, avance_id, mois_remboursement, montant_rembourse',
    primes: 'id, travailleur_id, annee, mois, montant, libelle, payee',
    messages: 'id, expediteurId, destinataireId, destinataireRole, type, dateEnvoi, lu, titre, contenu, contexte',
    presence_suspension_archive: 'id, travailleur_id, annee_archive',
    avances_archive: 'id, travailleur_id, annee_archive',
    primes_archive: 'id, travailleur_id, annee_archive',
    objectifs_mensuels: 'id, annee, domaine, vendeur_id, donnees, [annee+domaine+vendeur_id], [annee+domaine]',
    projets: 'id, nom, actif',
    affectations_analytiques: 'id, posteId, projetId, departement, pourcentage, [posteId+projetId], [posteId+departement]',
    charges_abonnement: 'id, description, montant_total, date_debut, date_fin, projetId, ecritureId',
    parametres_analytiques: 'id, annee, type_analyse, posteId, projetId, pourcentage, nature_charge, [projetId+annee]',
    plan_comptable: 'id, numero_compte, intitule, type',
    poste_compte: 'id, posteId, compteId',
    repartitions_ecritures: 'id, ecritureId, date_debut, date_fin, montant_par_periode, pourcentage, type_periode',
    parametres_export: 'id, cle, valeur',
    journaux: 'id, code, libelle, type',
    ecritures_manuelles: 'id, date, type, posteBudgetaire, designation, montant, devise, montant_cdf, montant_usd, justificatif, sousCaisseId, source, dateCreation, typeCorrection, parentId',
    acces_sites: 'id, role, siteId, niveau, [role+siteId]',
    consignations: 'id, factureId, clientId, conditionnementId, quantite_attendue, quantite_retournee, dateLivraison, statut',
    carburant_types: 'id, nom, unite, facteur_co2',
    carburant_type_sites: 'id, carburant_type_id, site_id',
    carburant_utilisations: 'id, nom, departement',
    carburant_stocks: 'id, carburant_type_id, site_id, quantite',
    carburant_mouvements: 'id, carburant_type_id, site_id, date, type, quantite, utilisation_id, source, reference_id',
    production_consommation_carburant: 'id, semaineProdId, date, carburant_type_id, quantite, utilisation_id',
    journal_audit: 'id, date, utilisateurId, utilisateurNom, entite, action, details',
    travailleurs_historique: 'id, travailleur_id, date_modification, champ, ancien_valeur, nouvelle_valeur',
    archive_annee: 'id, annee, date, presence, avances, primes',
    regles_emissions_indirectes: 'id, posteId, methode, actif',

    // ==================== NOUVELLES TABLES (CONDITIONNEMENTS & FOURNITURES) ====================
    conditionnements: 'id, nom, code, capaciteL, retour_possible, actif, ordre',
    articles_fourniture: 'id, nom, type, unite, seuil_alerte, actif',
    conditionnement_composants: 'id, conditionnement_id, article_fourniture_id, quantite',
    stocks_fournitures: 'id, site_id, article_id, quantite',
    mouvements_fournitures: 'id, type_id, site_id, date, type, quantite, source, reference_id, commentaire',
});

// ==================== POPULATE : Données initiales ====================
db.on('populate', async () => {
    console.log("Première ouverture de la base v4 – initialisation");

    // Postes système
    const postesSysteme = [
        { nom: 'Solde initial', type: 'entree', lieFacture: false, estRetraitBancaire: false, actif: true, systeme: true, annee: new Date().getFullYear() },
        { nom: 'Annulation écriture antérieure', type: 'sortie', lieFacture: false, estRetraitBancaire: false, actif: true, systeme: true, annee: new Date().getFullYear() },
        { nom: 'Annulation écriture à justifier', type: 'sortie', lieFacture: false, estRetraitBancaire: false, actif: true, systeme: true, annee: new Date().getFullYear() },
        { nom: 'Transfert entre caisses', type: 'sortie', lieFacture: false, estRetraitBancaire: false, actif: true, systeme: true, annee: new Date().getFullYear() },
        { nom: 'Change', type: 'sortie', lieFacture: false, estRetraitBancaire: false, actif: true, systeme: true, annee: new Date().getFullYear() },
        { nom: 'Récupération sur justification', type: 'entree', lieFacture: false, estRetraitBancaire: false, actif: true, systeme: true, annee: new Date().getFullYear() },
        { nom: 'Régularisation justification', type: 'sortie', lieFacture: false, estRetraitBancaire: false, actif: true, systeme: true, annee: new Date().getFullYear() }
    ];
    for (const p of postesSysteme) {
        const exist = await db.postes_budgetaires.where('nom').equals(p.nom).first();
        if (!exist) await db.postes_budgetaires.add(p);
    }

    // Modes de paiement
    await db.modes_paiement.bulkAdd([
        { id: crypto.randomUUID, nom: 'Liquide', actif: true },
        { id: crypto.randomUUID, nom: 'Orange Money', actif: true },
        { id: crypto.randomUUID, nom: 'Airtel Money', actif: true },
        { id: crypto.randomUUID, nom: 'Carte bancaire', actif: true },
        { id: crypto.randomUUID, nom: 'Virement', actif: true }
    ]);

    // Types de clients
    await db.types_clients.bulkAdd([
        { id: crypto.randomUUID, nom: 'Boutique', description: '' },
        { id: crypto.randomUUID, nom: 'Supermarché', description: '' },
        { id: crypto.randomUUID, nom: 'Privé', description: '' },
        { id: crypto.randomUUID, nom: 'Autre', description: '' }
    ]);

    // Journaux
    await db.journaux.bulkAdd([
        { id: crypto.randomUUID, code: 'BQ1', libelle: 'Banque Rawbank USD', type: 'banque' },
        { id: crypto.randomUUID, code: 'CKI', libelle: 'Caisse Kinshasa USD', type: 'caisse' },
        { id: crypto.randomUUID, code: 'CAI', libelle: 'Caisse Kinshasa CDF', type: 'caisse' },
        { id: crypto.randomUUID, code: 'CKA', libelle: 'Caisse Kapangu USD', type: 'caisse' },
        { id: crypto.randomUUID, code: 'CK$', libelle: 'Caisse Kapangu CDF', type: 'caisse' },
        { id: crypto.randomUUID, code: 'OD', libelle: 'Opérations diverses', type: 'manuel' }
    ]);

    // Paramètres d'export
    await db.parametres_export.bulkAdd([
        { id: crypto.randomUUID, cle: 'separateur', valeur: ';' },
        { id: crypto.randomUUID, cle: 'colonnes', valeur: ['numero', 'journal', 'date', 'compte', 'libelle', 'debit', 'credit'] },
        { id: crypto.randomUUID, cle: 'comptes_tresorerie', valeur: { BQ1: '521500', CKI: '571200', CAI: '571100', CKA: '572100', 'CK$': '572200' } }
    ]);

    // Utilisateur admin
    await db.utilisateurs.add({
        id: crypto.randomUUID(),
        nom: 'Admin',
        login: 'admin',
        mot_de_passe: 'admin123',
        role: 'superviseur'
    });
});

export const initData = async () => {
    console.log("Base de données prête (GestionHuileDB_v4)");
};