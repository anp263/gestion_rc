import axios from 'axios';
import { db } from '../db';

const API_URL = 'http://localhost:5000/api/';

class ApiService {
    constructor() {
        this.api = axios.create({
            baseURL: API_URL,
            timeout: 10000
        });
    }

    async syncFromServer() {
        const fichiers = [
            'utilisateurs', 'semaines_recolte', 'recolte_journaliere', 'semaines_production',
            'production_consommation', 'production_lot', 'typesContenants', 'lots',
            'sites', 'stocks', 'mouvements', 'mouvement_lignes', 'transferts', 'transfert_lignes',
            'inventaires', 'inventaire_lignes', 'reconditionnements', 'clients', 'tarifs',
            'factures', 'facture_lignes', 'bons_livraison', 'bl_lignes', 'caisses', 'sous_caisses',
            'mouvementsCaisse', 'operationsChange', 'modes_paiement', 'postes_budgetaires',
            'budgets', 'reglages', 'semaines_caisse', 'clotures_sous_caisse', 'caisse_utilisateurs',
            'taux_change', 'budget_versions', 'comptes_bancaires', 'imports_bancaires',
            'mouvements_bancaires', 'regles_affectation', 'travailleurs', 'salaires_historique',
            'presence_suspension', 'avances', 'remboursements_avances', 'primes', 'types_clients',
            'ecritures_manuelles', 'plan_comptable', 'journaux', 'journal_audit'
        ];

        for (const fichier of fichiers) {
            try {
                const { data } = await this.api.get(fichier);
                // Ne vider que si on reçoit un tableau (même vide) pour les listes,
                // ou un objet pour reglages
                if (fichier === 'reglages') {
                    if (data && typeof data === 'object' && !Array.isArray(data)) {
                        await db[fichier].clear();
                        await db[fichier].add({ id: '1', cle: 'reglages', valeur: data });
                    }
                } else if (Array.isArray(data)) {
                    await db[fichier].clear();
                    if (data.length > 0) {
                        await db[fichier].bulkAdd(data);
                    }
                    console.log(`✅ Synchronisé ${fichier} (${data.length} entrées)`);
                } else {
                    console.warn(`⚠️ Réponse inattendue pour ${fichier}, conservation locale.`);
                }
            } catch (error) {
                if (error.response?.status === 404) {
                    console.warn(`ℹ️ Table ${fichier} non trouvée sur le serveur, conservation locale.`);
                } else {
                    console.error(`❌ Erreur synchronisation ${fichier}:`, error);
                }
            }
        }
        return true;
    }

    async syncToServer() {
        const fichiers = [
            'utilisateurs', 'semaines_recolte', 'recolte_journaliere', 'semaines_production',
            'production_consommation', 'production_lot', 'typesContenants', 'lots',
            'sites', 'stocks', 'mouvements', 'mouvement_lignes', 'transferts', 'transfert_lignes',
            'inventaires', 'inventaire_lignes', 'reconditionnements', 'clients', 'tarifs',
            'factures', 'facture_lignes', 'bons_livraison', 'bl_lignes', 'caisses', 'sous_caisses',
            'mouvementsCaisse', 'operationsChange', 'modes_paiement', 'postes_budgetaires',
            'budgets', 'semaines_caisse', 'clotures_sous_caisse', 'caisse_utilisateurs',
            'taux_change', 'budget_versions', 'comptes_bancaires', 'imports_bancaires',
            'mouvements_bancaires', 'regles_affectation', 'travailleurs', 'salaires_historique',
            'presence_suspension', 'avances', 'remboursements_avances', 'primes', 'types_clients',
            'ecritures_manuelles', 'plan_comptable', 'journaux'
        ];

        for (const fichier of fichiers) {
            try {
                const donnees = await db[fichier].toArray();
                await this.api.post(fichier, donnees);
                console.log(`📤 Envoyé ${fichier} (${donnees.length} entités)`);
            } catch (error) {
                console.error(`Erreur envoi ${fichier}:`, error);
            }
        }
        return true;
    }

    async ajouter(fichier, donnees, options = { audit: false }) {
        try {
            const { id: _unused, ...donneesNettoyees } = donnees;
            const newId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36);
            const dataToAdd = {
                ...donneesNettoyees,
                id: newId,
                dateCreation: new Date().toISOString()
            };

            await db[fichier].add(dataToAdd);

            // Synchronisation serveur
            try {
                await this.api.post(fichier, dataToAdd);
            } catch (error) {
                console.error(`⚠️ Synchronisation serveur échouée pour ${fichier}:`, error);
                alert(`Le mouvement a été enregistré localement mais n'a pas pu être synchronisé avec le serveur. Vérifiez votre connexion.`);
            }

            if (options.audit) {
                const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
                await db.journal_audit.add({
                    id: crypto.randomUUID(),
                    date: new Date().toISOString(),
                    utilisateurId: user.id || 'système',
                    utilisateurNom: user.nom || 'Système',
                    entite: fichier,
                    action: 'création',
                    entiteId: newId,
                    details: `Création de ${fichier} (ID: ${newId})`
                });
            }

            return newId;
        } catch (error) {
            console.error(`Erreur ajout ${fichier}:`, error);
            throw error;
        }
    }

    async modifier(fichier, id, donnees, options = { audit: false }) {
        try {
            const { id: _unused, ...donneesNettoyees } = donnees;
            const dataToUpdate = {
                ...donneesNettoyees,
                dateModification: new Date().toISOString()
            };

            let ancien = null;
            if (options.audit) {
                ancien = await db[fichier].get(id);
            }

            await db[fichier].update(id, dataToUpdate);

            try {
                await this.api.put(`${fichier}/${id}`, dataToUpdate);
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    console.warn(`Élément ${id} absent du serveur, création...`);
                    await this.api.post(fichier, { ...dataToUpdate, id });
                } else {
                    throw error;
                }
            }

            if (options.audit && ancien) {
                const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
                const changes = [];
                for (const key of Object.keys(dataToUpdate)) {
                    if (JSON.stringify(ancien[key]) !== JSON.stringify(dataToUpdate[key])) {
                        changes.push(`${key}: "${ancien[key]}" → "${dataToUpdate[key]}"`);
                    }
                }
                const details = changes.length > 0 ? `Modification(s): ${changes.join('; ')}` : 'Aucune modification détectée';
                await db.journal_audit.add({
                    id: crypto.randomUUID(),
                    date: new Date().toISOString(),
                    utilisateurId: user.id || 'système',
                    utilisateurNom: user.nom || 'Système',
                    entite: fichier,
                    action: 'modification',
                    entiteId: id,
                    details
                });
            }

            return true;
        } catch (error) {
            console.error(`Erreur modification ${fichier}:`, error);
            throw error;
        }
    }

    async supprimer(fichier, id, options = { audit: false }) {
        try {
            let entiteSupprimee = null;
            if (options.audit) {
                entiteSupprimee = await db[fichier].get(id);
            }

            await db[fichier].delete(id);
            try {
                await this.api.delete(`${fichier}/${id}`);
            } catch (error) {
                if (error.response?.status !== 404) {
                    console.error(`Erreur suppression serveur ${fichier}/${id}:`, error);
                }
            }

            if (options.audit && entiteSupprimee) {
                const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
                const nom = entiteSupprimee.nom || entiteSupprimee.numero || entiteSupprimee.libelle || entiteSupprimee.intitule || 'N/A';
                await db.journal_audit.add({
                    id: crypto.randomUUID(),
                    date: new Date().toISOString(),
                    utilisateurId: user.id || 'système',
                    utilisateurNom: user.nom || 'Système',
                    entite: fichier,
                    action: 'suppression',
                    entiteId: id,
                    details: `Suppression de ${fichier} (ID: ${id}) - ${nom}`
                });
            }

            return true;
        } catch (error) {
            console.error(`Erreur suppression ${fichier}:`, error);
            throw error;
        }
    }
}

export default new ApiService();