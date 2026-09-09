import { db } from '../db';

export async function enregistrerChangements(travailleurId, ancien, nouveau) {
    const date = new Date().toISOString();
    const champs = ['poste_travail_id', 'departement', 'salaire_net_total'];
    for (let champ of champs) {
        const ancienVal = ancien?.[champ]?.toString() || '';
        const nouveauVal = nouveau[champ]?.toString() || '';
        if (ancienVal !== nouveauVal) {
            await db.travailleurs_historique.add({
                id: crypto.randomUUID(),
                travailleur_id: travailleurId,
                date_modification: date,
                champ,
                ancien_valeur: ancienVal,
                nouvelle_valeur: nouveauVal
            });
        }
    }
}