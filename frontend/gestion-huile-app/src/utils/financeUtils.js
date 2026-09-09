import { db } from '../db';

// ==================== CONSTANTES ====================
/**
 * Postes exclus du suivi budgétaire (Dashboard/Budget)
 * même s'ils ne sont pas marqués systeme: true.
 */
const POSTES_EXCLUS_BUDGET = [
    'Transfert entre caisses',
    'Change',
    'Solde initial',
    'Annulation écriture antérieure',
    'Annulation écriture à justifier',
    'Récupération sur justification',
    'Régularisation justification'
];

// ==================== NOYAU CENTRAL ====================
/**
 * Retourne toutes les écritures définitives (caisse, banque, manuelles)
 * pour un mois donné. Utilisé par Dashboard et Budget.
 */
export async function getEcrituresBudget(annee, mois) {
    const debut = new Date(annee, mois - 1, 1);
    const fin = new Date(annee, mois, 0);
    const debutStr = debut.toISOString().slice(0, 10);
    const finStr = fin.toISOString().slice(0, 10);

    // Semaines de caisse clôturées
    const toutesSemaines = await db.semaines_caisse.toArray();
    const idsSemainesCloturees = toutesSemaines
        .filter(s => s.estCloturee === true)
        .map(s => s.id);

    // ----- Caisse -----
    const mouvementsCaisse = await db.mouvementsCaisse
        .where('status').equals('validé')
        .and(m => !m.annule && !m.remplaceParCorrection && !m.aJustifier && !m.correctionComptable)
        .toArray();
    const mvtsCaisse = mouvementsCaisse.filter(m =>
        idsSemainesCloturees.includes(m.semaineId) &&
        m.date >= debutStr && m.date <= finStr
    );

    // ----- Banque -----
    const mouvementsBanque = await db.mouvements_bancaires
        .where('statut').equals('valide')
        .and(m => !m.correctionComptable)
        .toArray();
    const mvtsBanque = mouvementsBanque.filter(m =>
        m.date_operation >= debutStr && m.date_operation <= finStr
    );

    // ----- Écritures manuelles -----
    const ecrituresManuelles = await db.ecritures_manuelles
        .where('date').between(debutStr, finStr, true, true)
        .toArray();

    return {
        caisse: mvtsCaisse.map(m => ({
            id: m.id,
            date: m.date,
            type: m.type,
            poste: m.posteBudgetaire,
            montant: m.montant,
            devise: m.devise,
            montantCdf: m.montant_cdf || 0,
            montantUsd: m.montant_usd || 0,
            source: 'caisse'
        })),
        banque: mvtsBanque.map(m => ({
            id: m.id,
            date: m.date_operation,
            type: m.type === 'credit' ? 'entree' : 'sortie',
            poste: null,
            posteId: m.poste_id,
            montant: m.montant,
            devise: m.devise,
            montantCdf: m.montant_cdf || 0,
            montantUsd: m.montant_usd || 0,
            source: 'banque'
        })),
        manuelles: ecrituresManuelles.map(m => ({
            id: m.id,
            date: m.date,
            type: m.type,
            poste: m.posteBudgetaire,
            montant: m.montant,
            devise: m.devise,
            montantCdf: m.montant_cdf || 0,
            montantUsd: m.montant_usd || 0,
            source: 'manuelle'
        }))
    };
}

/**
 * Retourne les écritures définitives sur une période personnalisée.
 * Utilisée par la Comptabilité pour éviter la duplication des filtres.
 */
export async function getEcrituresDefinitives(dateDebut, dateFin) {
    const semainesCloturees = await db.semaines_caisse.toArray();
    const idsSemainesCloturees = semainesCloturees
        .filter(s => s.estCloturee)
        .map(s => s.id);

    // Caisse
    const mouvementsCaisse = await db.mouvementsCaisse
        .where('status').equals('validé')
        .and(m => !m.annule && !m.remplaceParCorrection && !m.aJustifier && !m.correctionComptable)
        .toArray();
    const mvtsCaisse = mouvementsCaisse.filter(m =>
        idsSemainesCloturees.includes(m.semaineId) &&
        m.date >= dateDebut && m.date <= dateFin
    );

    // Banque
    const mouvementsBanque = await db.mouvements_bancaires
        .where('statut').equals('valide')
        .and(m => !m.correctionComptable)
        .toArray();
    const mvtsBanque = mouvementsBanque.filter(m =>
        m.date_operation >= dateDebut && m.date_operation <= dateFin
    );

    // Manuelles
    const ecrituresManuelles = await db.ecritures_manuelles
        .where('date').between(dateDebut, dateFin, true, true)
        .toArray();

    return {
        caisse: mvtsCaisse.map(m => ({
            id: m.id,
            date: m.date,
            type: m.type,
            poste: m.posteBudgetaire,
            montant: m.montant,
            devise: m.devise,
            montantCdf: m.montant_cdf || 0,
            montantUsd: m.montant_usd || 0,
            source: 'caisse'
        })),
        banque: mvtsBanque.map(m => ({
            id: m.id,
            date: m.date_operation,
            type: m.type === 'credit' ? 'entree' : 'sortie',
            poste: null,
            posteId: m.poste_id,
            montant: m.montant,
            devise: m.devise,
            montantCdf: m.montant_cdf || 0,
            montantUsd: m.montant_usd || 0,
            source: 'banque'
        })),
        manuelles: ecrituresManuelles.map(m => ({
            id: m.id,
            date: m.date,
            type: m.type,
            poste: m.posteBudgetaire,
            montant: m.montant,
            devise: m.devise,
            montantCdf: m.montant_cdf || 0,
            montantUsd: m.montant_usd || 0,
            source: 'manuelle'
        }))
    };
}

// ==================== FONCTIONS AGRÉGÉES ====================

/**
 * Total des dépenses réelles du mois, dans la devise choisie.
 * Exclut les postes techniques et les écritures non définitives.
 */
export async function getDepensesReelles(annee, mois, deviseAffichage) {
    const debut = new Date(annee, mois - 1, 1);
    const fin = new Date(annee, mois, 0, 23, 59, 59);
    const debutStr = debut.toISOString().slice(0, 10);
    const finStr = fin.toISOString().slice(0, 10);

    const mouvementsCaisse = await db.mouvementsCaisse
        .where('status').equals('validé')
        .and(m => !m.annule && !m.remplaceParCorrection && m.date >= debutStr && m.date <= finStr)
        .toArray();

    const mouvementsBanque = await db.mouvements_bancaires
        .where('statut').equals('valide')
        .and(m => m.date_operation >= debutStr && m.date_operation <= finStr)
        .toArray();

    const ecrituresManuelles = await db.ecritures_manuelles
        .where('date').between(debutStr, finStr, true, true)
        .toArray();

    const tousLesPostes = await db.postes_budgetaires.toArray();
    const nomParId = {};
    tousLesPostes.forEach(p => { nomParId[p.id] = p.nom; });

    const postesExclus = ['Transfert entre caisses', 'Change', 'Solde initial',
        'Annulation écriture antérieure', 'Annulation écriture à justifier',
        'Récupération sur justification', 'Régularisation justification'];

    let total = 0;

    // Caisse
    for (const m of mouvementsCaisse) {
        if (m.type !== 'sortie') continue;
        const nom = m.posteBudgetaire;
        if (!nom || postesExclus.includes(nom)) continue;
        const poste = tousLesPostes.find(p => p.nom === nom && p.type === 'sortie' && p.actif && !p.systeme);
        if (!poste) continue;
        total += (deviseAffichage === 'CDF' ? (m.montant_cdf || 0) : (m.montant_usd || 0));
    }

    // Banque
    for (const m of mouvementsBanque) {
        if (m.type !== 'debit') continue;
        const nom = nomParId[m.poste_id];
        if (!nom || postesExclus.includes(nom)) continue;
        const poste = tousLesPostes.find(p => p.nom === nom && p.type === 'sortie' && p.actif && !p.systeme);
        if (!poste) continue;
        total += (deviseAffichage === 'CDF' ? (m.montant_cdf || 0) : (m.montant_usd || 0));
    }

    // Manuelles
    for (const m of ecrituresManuelles) {
        if (m.type !== 'sortie') continue;
        const nom = m.posteBudgetaire;
        if (!nom || postesExclus.includes(nom)) continue;
        const poste = tousLesPostes.find(p => p.nom === nom && p.type === 'sortie' && p.actif && !p.systeme);
        if (!poste) continue;
        total += (deviseAffichage === 'CDF' ? (m.montant_cdf || 0) : (m.montant_usd || 0));
    }

    return total;
}



/**
 * Total des revenus réels du mois, dans la devise choisie.
 * Exclut les postes techniques et les écritures non définitives.
 */
export async function getRevenusReelles(annee, mois, deviseAffichage) {
    const { caisse, banque, manuelles } = await getEcrituresBudget(annee, mois);
    const postesRevenus = (await db.postes_budgetaires
        .where({ type: 'entree', actif: true })
        .toArray())
        .filter(p => !p.systeme);

    let total = 0;
    for (const mvt of caisse) {
        if (mvt.type === 'entree' &&
            !POSTES_EXCLUS_BUDGET.includes(mvt.poste) &&
            postesRevenus.some(p => p.nom === mvt.poste)) {
            total += (deviseAffichage === 'CDF' ? mvt.montantCdf : mvt.montantUsd);
        }
    }
    for (const mvt of banque) {
        const poste = postesRevenus.find(p => p.id === mvt.posteId);
        if (mvt.type === 'entree' && poste && !POSTES_EXCLUS_BUDGET.includes(poste.nom)) {
            total += (deviseAffichage === 'CDF' ? mvt.montantCdf : mvt.montantUsd);
        }
    }
    for (const mvt of manuelles) {
        if (mvt.type === 'entree' &&
            !POSTES_EXCLUS_BUDGET.includes(mvt.poste) &&
            postesRevenus.some(p => p.nom === mvt.poste)) {
            total += (deviseAffichage === 'CDF' ? mvt.montantCdf : mvt.montantUsd);
        }
    }
    return total;
}

/**
 * Retourne la liste détaillée des mouvements (caisse, banque, manuels) du mois.
 * Utilisé par la page Budget pour le suivi mensuel.
 */
export async function getMouvementsBudget(annee, mois) {
    const data = await getEcrituresBudget(annee, mois);

    // Filtre supplémentaire des postes exclus pour le budget
    const filterPoste = (posteNom) => !POSTES_EXCLUS_BUDGET.includes(posteNom);

    return {
        caisse: data.caisse.filter(m => filterPoste(m.poste)),
        banque: data.banque.filter(m => {
            // Le filtrage exact par poste sera fait dans Budget.vue avec les postesAnnee
            return true;
        }),
        manuelles: data.manuelles.filter(m => filterPoste(m.poste))
    };
}

/**
 * Retourne le budget prévisionnel de dépenses pour un mois donné.
 * Utilise la version la plus récente du budget de l'année.
 */
export async function getBudgetMensuelDepenses(annee, mois) {
    const budgetVersion = (await db.budget_versions
        .where('annee').equals(annee)
        .reverse()
        .sortBy('version'))[0];
    if (!budgetVersion) return 0;

    const budgetData = budgetVersion.donnees;
    const tousLesPostes = await db.postes_budgetaires.toArray();
    const nomParId = {};
    tousLesPostes.forEach(p => { nomParId[p.id] = p.nom; });

    const postesDepenses = tousLesPostes.filter(p => p.type === 'sortie' && p.actif && !p.systeme);

    let total = 0;
    for (const poste of postesDepenses) {
        const posteIdDansBudget = Object.keys(budgetData).find(id => nomParId[id] === poste.nom);
        if (posteIdDansBudget) {
            const valeurs = budgetData[posteIdDansBudget] || Array(12).fill(0);
            total += valeurs[mois - 1] || 0;
        }
    }
    return total;
}