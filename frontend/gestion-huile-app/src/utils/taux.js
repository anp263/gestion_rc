import { db } from '../db';

export async function getTauxPourDate(dateStr) {
    const taux = await db.taux_change.where('date').equals(dateStr).first();
    if (taux) return taux.taux;
    const tauxAvant = await db.taux_change.where('date').below(dateStr).last();
    return tauxAvant ? tauxAvant.taux : 2500; // taux par défaut
}

export async function convertirMontants(montant, deviseSource, dateStr) {
    const taux = await getTauxPourDate(dateStr);
    let montant_cdf = 0, montant_usd = 0;
    if (deviseSource === 'CDF') {
        montant_cdf = montant;
        montant_usd = montant / taux;
    } else {
        montant_usd = montant;
        montant_cdf = montant * taux;
    }
    return { montant_cdf, montant_usd };
}

/**
 * Recalcule les montants CDF/USD de toutes les écritures d'une date donnée
 * après modification du taux de change.
 * 
 * @param {string} dateStr - Date au format YYYY-MM-DD
 * @param {number} nouveauTaux - Le nouveau taux (1 USD = X CDF)
 */
export async function recalculerEcrituresDate(dateStr, nouveauTaux) {
    // 1. Mouvements de caisse
    const mouvementsCaisse = await db.mouvementsCaisse.where('date').equals(dateStr).toArray();
    for (let mvt of mouvementsCaisse) {
        let montant_cdf, montant_usd;
        if (mvt.devise === 'CDF') {
            montant_cdf = mvt.montant;
            montant_usd = mvt.montant / nouveauTaux;
        } else {
            montant_usd = mvt.montant;
            montant_cdf = mvt.montant * nouveauTaux;
        }
        await db.mouvementsCaisse.update(mvt.id, { montant_cdf, montant_usd });
    }

    // 2. Mouvements bancaires (date_operation)
    const mouvementsBanque = await db.mouvements_bancaires.where('date_operation').equals(dateStr).toArray();
    for (let mvt of mouvementsBanque) {
        let montant_cdf, montant_usd;
        if (mvt.devise === 'CDF') {
            montant_cdf = mvt.montant;
            montant_usd = mvt.montant / nouveauTaux;
        } else {
            montant_usd = mvt.montant;
            montant_cdf = mvt.montant * nouveauTaux;
        }
        await db.mouvements_bancaires.update(mvt.id, { montant_cdf, montant_usd });
    }

    // 3. Écritures manuelles
    const ecrituresManuelles = await db.ecritures_manuelles.where('date').equals(dateStr).toArray();
    for (let mvt of ecrituresManuelles) {
        let montant_cdf, montant_usd;
        if (mvt.devise === 'CDF') {
            montant_cdf = mvt.montant;
            montant_usd = mvt.montant / nouveauTaux;
        } else {
            montant_usd = mvt.montant;
            montant_cdf = mvt.montant * nouveauTaux;
        }
        await db.ecritures_manuelles.update(mvt.id, { montant_cdf, montant_usd });
    }
}