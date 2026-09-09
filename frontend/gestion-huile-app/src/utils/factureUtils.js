import { db } from '../db';

export async function getToleranceConfig() {
    const reg = await db.reglages.where('cle').equals('tolerance_paiement').first();
    if (!reg) return { mode: 'pourcentage', valeur_pourcentage: 0.5, valeur_usd: 1, valeur_cdf: 500 };
    return reg.valeur;
}

export async function getTolerance(facture) {
    const config = await getToleranceConfig();
    if (config.mode === 'pourcentage') {
        return facture.totalHT * config.valeur_pourcentage / 100;
    } else {
        return facture.devise === 'USD' ? config.valeur_usd : config.valeur_cdf;
    }
}

export async function isFacturePayee(factureId) {
    const facture = await db.factures.get(factureId);
    if (!facture) return false;
    const paiements = await db.mouvementsCaisse
        .where({ factureId, type: 'entree', status: 'validé' })
        .toArray();
    const totalPaye = paiements.reduce((sum, p) => sum + (p.montant_converti_facture || 0), 0);
    const tolerance = await getTolerance(facture);
    return totalPaye >= facture.totalHT - tolerance;
}

export async function getDatePaiementComplet(factureId) {
    const facture = await db.factures.get(factureId);
    if (!facture) return null;
    const paiements = await db.mouvementsCaisse
        .where({ factureId, type: 'entree', status: 'validé' })
        .toArray();
    paiements.sort((a, b) => new Date(a.date) - new Date(b.date));
    const tolerance = await getTolerance(facture);
    let cumul = 0;
    for (const p of paiements) {
        cumul += (p.montant_converti_facture || 0);
        if (cumul >= facture.totalHT - tolerance) {
            return p.date;
        }
    }
    return null;
}