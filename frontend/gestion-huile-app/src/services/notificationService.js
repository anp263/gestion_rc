import { db } from '../db';

const CONFIG_PAR_DEFAUT = {
    facture_retard: {
        actif: true,
        destinataires: ['superviseur_vente', 'superviseur'],
        modele: 'Facture {numero} du client {client} en retard de {jours_retard} jours. Montant : {montant} {devise}.',
        seuils: {}
    },
    facture_livree_impayee: {
        actif: true,
        destinataires: ['superviseur_vente'],
        modele: 'Facture {numero} livrée mais impayée. Client : {client}.',
        seuils: {}
    },
    facture_paiement_partiel: {
        actif: true,
        destinataires: ['superviseur_vente'],
        modele: 'Paiement partiel reçu pour facture {numero}. Payé : {montant_paye} {devise}, reste : {reste_a_payer} {devise}.',
        seuils: {}
    },
    nouvelle_facture: {
        actif: true,
        destinataires: ['superviseur_vente'],
        modele: 'Nouvelle facture {numero} pour {client} d\'un montant de {total} {devise}.',
        seuils: {}
    },
    livraison_en_attente: {
        actif: true,
        destinataires: ['superviseur_vente', 'superviseur_huilerie'],
        modele: 'Livraison en attente pour facture {numero} (client {client}).',
        seuils: { jours_attente: 2 }
    },
    stock_faible: {
        actif: true,
        destinataires: ['superviseur_huilerie', 'superviseur'],
        modele: 'Stock faible : {contenant} sur {site} - Quantité restante : {quantite} (seuil : {seuil}).',
        seuils: { par_defaut: 10 }
    },
    stock_rupture: {
        actif: true,
        destinataires: ['superviseur_huilerie', 'superviseur'],
        modele: 'RUPTURE DE STOCK : {contenant} sur {site}.',
        seuils: {}
    },
    transfert_en_attente: {
        actif: true,
        destinataires: ['superviseur_huilerie'],
        modele: 'Transfert {numero} en attente depuis {jours_attente} jours.',
        seuils: { jours_attente: 2 }
    },
    ecart_inventaire: {
        actif: true,
        destinataires: ['superviseur'],
        modele: 'Écart d\'inventaire sur {site} : lot {lot}, contenant {contenant}. Théorique : {theorique}, Réel : {reel}.',
        seuils: {}
    },
    ecart_reconditionnement: {
        actif: true,
        destinataires: ['superviseur_huilerie'],
        modele: 'Perte lors du reconditionnement du {date} : {perte} L.',
        seuils: {}
    },
    ecart_transfert: {
        actif: true,
        destinataires: ['superviseur_huilerie', 'superviseur'],
        modele: 'Écart lors du transfert {numero} : {ecart} unités manquantes.',
        seuils: {}
    },
    semaine_non_cloturee: {
        actif: true,
        destinataires: ['caissier', 'superviseur'],
        modele: 'Semaine du {date_debut} non clôturée depuis {jours} jours.',
        seuils: { jours_attente: 3 }
    },
    ecart_caisse: {
        actif: true,
        destinataires: ['superviseur'],
        modele: 'Écart de caisse détecté : {caisse} - écart de {ecart} {devise}.',
        seuils: { seuil_ecart: 0 }
    },
    taux_extraction_bas: {
        actif: true,
        destinataires: ['superviseur_huilerie'],
        modele: 'Taux d\'extraction {type} faible ({taux}%) pour la semaine du {semaine}.',
        seuils: {
            taux_fruit_regime: 60,
            taux_huilerie: 22,
            taux_global: 20
        }
    },
    production_manquante: {
        actif: true,
        destinataires: ['superviseur_huilerie'],
        modele: 'Saisie de production manquante pour la semaine du {semaine}.',
        seuils: { jours_attente: 3 }
    },
    recolte_manquante: {
        actif: true,
        destinataires: ['superviseur_huilerie'],
        modele: 'Saisie de récolte manquante pour la semaine du {semaine}.',
        seuils: { jours_attente: 3 }
    },
    taux_change_manquant: {
        actif: true,
        destinataires: ['superviseur'],
        modele: 'Taux de change manquant pour le {date}.',
        seuils: {}
    },
    depassement_budget: {
        actif: true,
        destinataires: ['superviseur'],
        modele: 'Dépassement budgétaire : poste {poste} - mois {mois}/{annee} - prévu {prevu} {devise}, réalisé {realise} {devise}.',
        seuils: {}
    },
    stock_faible_carburant: {
        actif: true,
        destinataires: ['superviseur_huilerie', 'superviseur'],
        modele: 'Stock carburant faible : {type} sur {site} - {quantite} L restants (seuil {seuil}).',
        seuils: { par_defaut: 50 }
    },
    stock_faible_emballage: {
        actif: true,
        destinataires: ['superviseur_huilerie', 'superviseur'],
        modele: 'Stock emballage faible : {nom} sur {site} - {quantite} restant(s).',
        seuils: { par_defaut: 10 }
    },
    transfert_emballage_recu: {
        actif: true,
        destinataires: ['superviseur_huilerie'],
        modele: 'Nouveau transfert d\'emballage {numero} de {source} vers {destination}. Veuillez confirmer réception.'
    },
    transfert_emballage_confirme: {
        actif: true,
        destinataires: ['superviseur_huilerie'],
        modele: 'Transfert d\'emballage {numero} confirmé.'
    }
};

let configCache = null;

export async function getConfig() {
    if (configCache) return configCache;
    const reg = await db.reglages.where('cle').equals('notifications_config').first();
    if (reg && reg.valeur) {
        configCache = reg.valeur;
    } else {
        configCache = JSON.parse(JSON.stringify(CONFIG_PAR_DEFAUT));
        await db.reglages.add({
            id: crypto.randomUUID(),
            cle: 'notifications_config',
            valeur: configCache
        });
    }
    return configCache;
}

export async function envoyerMessageSysteme(type, contexte, destinataireSupplementaire = null) {
    const config = await getConfig();
    const conf = config[type];
    if (!conf || !conf.actif) return;

    let contenu = conf.modele;
    for (const [key, value] of Object.entries(contexte)) {
        contenu = contenu.replace(new RegExp(`{${key}}`, 'g'), value);
    }

    const destinataires = [...conf.destinataires];
    if (destinataireSupplementaire && typeof destinataireSupplementaire === 'string' && !destinataires.includes(destinataireSupplementaire)) {
        destinataires.push(destinataireSupplementaire);
    }

    for (const role of destinataires) {
        const message = {
            id: crypto.randomUUID(),
            expediteurId: 'system',
            destinataireRole: role,
            type: 'systeme',
            dateEnvoi: new Date().toISOString(),
            lu: false,
            titre: `[${type}]`,
            contenu,
            contexte: JSON.stringify(contexte)
        };
        await db.messages.add(message);
    }

    if (destinataireSupplementaire && destinataireSupplementaire !== 'system' && !conf.destinataires.includes(destinataireSupplementaire)) {
        const messageDirect = {
            id: crypto.randomUUID(),
            expediteurId: 'system',
            destinataireId: destinataireSupplementaire,
            type: 'systeme',
            dateEnvoi: new Date().toISOString(),
            lu: false,
            titre: `[${type}]`,
            contenu,
            contexte: JSON.stringify(contexte)
        };
        await db.messages.add(messageDirect);
    }
}

export async function envoyerMessageDirect(expediteurId, destinataireId, titre, contenu) {
    const message = {
        id: crypto.randomUUID(),
        expediteurId,
        destinataireId,
        type: 'direct',
        dateEnvoi: new Date().toISOString(),
        lu: false,
        titre,
        contenu
    };
    await db.messages.add(message);
    return message;
}

export async function getMessagesNonLusCount(user) {
    if (!user) return 0;
    const messages = await db.messages
        .where('lu').equals(false)
        .toArray();
    return messages.filter(msg => (msg.destinataireRole === user.role) || (msg.destinataireId === user.id)).length;
}

// ========== VÉRIFICATIONS PÉRIODIQUES ==========

export async function verifierTousLesMessages() {
    await verifierStocksFaibles();
    await verifierSemainesNonCloturees();
    await verifierTauxChangeManquants();
    await verifierTransfertsEnAttente();
    await verifierProductionsManquantes();
    await verifierRecoltesManquantes();
    await verifierDepassementsBudget();
    await verifierTauxExtractionBas();
    await verifierLivraisonsEnAttente();
    await verifierFacturesEnRetard();
}

async function verifierStocksFaibles() {
    const config = await getConfig();
    const stocks = await db.stocks.toArray();
    const typesContenants = await db.typesContenants.toArray();
    const sites = await db.sites.toArray();
    const seuil = config.stock_faible?.seuils?.par_defaut || 10;

    const messagesSysteme = await db.messages.where('type').equals('systeme').toArray();
    const unJourAvant = Date.now() - 24 * 3600 * 1000;

    for (const stock of stocks) {
        const tc = typesContenants.find(t => t.id === stock.typeContenantId);
        const site = sites.find(s => s.id === stock.siteId);
        if (!tc || !site) continue;

        if (stock.quantite <= seuil) {
            const typeMsg = stock.quantite === 0 ? 'stock_rupture' : 'stock_faible';
            const recent = messagesSysteme.filter(msg =>
                msg.titre.includes(typeMsg) && new Date(msg.dateEnvoi).getTime() > unJourAvant
            ).length;
            if (recent > 0) continue;

            await envoyerMessageSysteme(typeMsg, {
                contenant: tc.nom,
                site: site.nom,
                quantite: stock.quantite,
                seuil
            });
        }
    }
}

async function verifierSemainesNonCloturees() {
    const config = await getConfig();
    if (!config.semaine_non_cloturee?.actif) return;
    const joursAttente = config.semaine_non_cloturee.seuils?.jours_attente || 3;

    const semaines = await db.semaines_caisse.where('estCloturee').equals(false).toArray();
    const aujourdhui = new Date();
    const messagesSysteme = await db.messages.where('type').equals('systeme').toArray();
    const unJourAvant = Date.now() - 24 * 3600 * 1000;

    for (const semaine of semaines) {
        const dateDebut = new Date(semaine.dateDebut);
        const diffJours = Math.floor((aujourdhui - dateDebut) / (1000 * 3600 * 24));
        if (diffJours >= joursAttente) {
            const recent = messagesSysteme.filter(msg =>
                msg.contenu.includes(semaine.dateDebut) && new Date(msg.dateEnvoi).getTime() > unJourAvant
            ).length;
            if (recent > 0) continue;
            await envoyerMessageSysteme('semaine_non_cloturee', {
                date_debut: semaine.dateDebut,
                jours: diffJours
            });
        }
    }
}

async function verifierTauxChangeManquants() {
    const config = await getConfig();
    if (!config.taux_change_manquant?.actif) return;
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    const dateStr = aujourdhui.toISOString().slice(0, 10);
    const taux = await db.taux_change.where('date').equals(dateStr).first();
    if (!taux) {
        await envoyerMessageSysteme('taux_change_manquant', { date: dateStr });
    }
}

async function verifierTransfertsEnAttente() {
    const config = await getConfig();
    if (!config.transfert_en_attente?.actif) return;
    const joursAttente = config.transfert_en_attente.seuils?.jours_attente || 2;

    const transferts = await db.transferts.where('statut').equals('en cours').toArray();
    const aujourdhui = new Date();

    for (const transfert of transferts) {
        const dateCreation = new Date(transfert.dateCreation);
        const diffJours = Math.floor((aujourdhui - dateCreation) / (1000 * 3600 * 24));
        if (diffJours >= joursAttente) {
            await envoyerMessageSysteme('transfert_en_attente', {
                numero: transfert.numero,
                jours_attente: diffJours
            });
        }
    }
}

async function verifierProductionsManquantes() {
    const config = await getConfig();
    if (!config.production_manquante?.actif) return;
    const joursAttente = config.production_manquante.seuils?.jours_attente || 3;

    const toutesSemaines = await db.semaines_production.toArray();
    const aujourdhui = new Date();
    const lundiCourant = new Date(aujourdhui);
    lundiCourant.setDate(aujourdhui.getDate() - (aujourdhui.getDay() === 0 ? 6 : aujourdhui.getDay() - 1));
    lundiCourant.setHours(0, 0, 0, 0);
    const dateDebutCourante = lundiCourant.toISOString().slice(0, 10);

    const semaineExistante = toutesSemaines.find(s => s.dateDebut === dateDebutCourante);
    if (!semaineExistante) {
        const diffJours = Math.floor((aujourdhui - lundiCourant) / (1000 * 3600 * 24));
        if (diffJours >= joursAttente) {
            await envoyerMessageSysteme('production_manquante', {
                semaine: new Date(dateDebutCourante).toLocaleDateString('fr-FR')
            });
        }
    }
}

async function verifierRecoltesManquantes() {
    const config = await getConfig();
    if (!config.recolte_manquante?.actif) return;
    const joursAttente = config.recolte_manquante.seuils?.jours_attente || 3;

    const toutesSemaines = await db.semaines_recolte.toArray();
    const aujourdhui = new Date();
    const lundiCourant = new Date(aujourdhui);
    lundiCourant.setDate(aujourdhui.getDate() - (aujourdhui.getDay() === 0 ? 6 : aujourdhui.getDay() - 1));
    lundiCourant.setHours(0, 0, 0, 0);
    const dateDebutCourante = lundiCourant.toISOString().slice(0, 10);

    const semaineExistante = toutesSemaines.find(s => s.dateDebut === dateDebutCourante);
    if (!semaineExistante) {
        const diffJours = Math.floor((aujourdhui - lundiCourant) / (1000 * 3600 * 24));
        if (diffJours >= joursAttente) {
            await envoyerMessageSysteme('recolte_manquante', {
                semaine: new Date(dateDebutCourante).toLocaleDateString('fr-FR')
            });
        }
    }
}

async function verifierDepassementsBudget() {
    const config = await getConfig();
    if (!config.depassement_budget?.actif) return;

    const annee = new Date().getFullYear();
    const mois = new Date().getMonth() + 1;
    const versions = await db.budget_versions.where('annee').equals(annee).reverse().sortBy('version');
    if (!versions.length) return;
    const budgetData = versions[0].donnees;
    const postes = await db.budget_postes.where('annee').equals(annee).toArray();
    const mouvementsCaisse = await db.mouvementsCaisse.where('status').equals('validé').toArray();
    const mouvementsBancaires = await db.mouvements_bancaires.where('statut').equals('valide').toArray();

    for (const poste of postes) {
        const prevuMensuel = (budgetData[poste.id] || [])[mois - 1] || 0;
        const realCaisse = mouvementsCaisse
            .filter(m => new Date(m.date).getMonth() === mois - 1 && m.posteBudgetaire === poste.nom)
            .reduce((sum, m) => sum + (m.type === 'entree' ? m.montant : -m.montant), 0);
        const realBanque = mouvementsBancaires
            .filter(m => new Date(m.date_operation).getMonth() === mois - 1 && m.poste_id === poste.id)
            .reduce((sum, m) => sum + (m.type === 'credit' ? m.montant : -m.montant), 0);
        const totalReal = realCaisse + realBanque;
        if (totalReal > prevuMensuel) {
            await envoyerMessageSysteme('depassement_budget', {
                poste: poste.nom,
                mois: mois,
                annee: annee,
                prevu: prevuMensuel.toFixed(2),
                realise: totalReal.toFixed(2),
                devise: 'CDF'
            });
        }
    }
}

async function verifierTauxExtractionBas() {
    const config = await getConfig();
    if (!config.taux_extraction_bas?.actif) return;
    const seuils = config.taux_extraction_bas.seuils;

    const semainesProd = await db.semaines_production.toArray();
    const consos = await db.production_consommation.toArray();
    const lots = await db.production_lot.toArray();
    const typesContenants = await db.typesContenants.toArray();

    for (const semaine of semainesProd.slice(-1)) {
        const consosSem = consos.filter(c => c.semaineProdId === semaine.id);
        const fruitsTransformes = consosSem.reduce((s, c) => s + (c.fruitsTransformesKg || 0), 0);
        const lotsSem = lots.filter(l => l.semaineProdId === semaine.id);
        let volumeHuile = 0;
        for (const lot of lotsSem) {
            const contenants = JSON.parse(lot.contenants || '{}');
            for (const [tcId, qte] of Object.entries(contenants)) {
                const tc = typesContenants.find(t => t.id === tcId);
                if (tc) volumeHuile += qte * tc.capaciteL;
            }
        }
        const huileKg = volumeHuile * 0.9;
        const tauxHuilerie = fruitsTransformes ? (huileKg / fruitsTransformes) * 100 : 0;
        if (tauxHuilerie < seuils.taux_huilerie) {
            await envoyerMessageSysteme('taux_extraction_bas', {
                type: 'huilerie',
                taux: tauxHuilerie.toFixed(1),
                semaine: semaine.dateDebut
            });
        }
    }
}

async function verifierLivraisonsEnAttente() {
    const config = await getConfig();
    if (!config.livraison_en_attente?.actif) return;
    const joursAttente = config.livraison_en_attente.seuils?.jours_attente || 2;

    const factures = await db.factures.where('statutLivraison').equals('a_livrer').toArray();
    const aujourdhui = new Date();

    for (const facture of factures) {
        const dateFacture = new Date(facture.date);
        const diffJours = Math.floor((aujourdhui - dateFacture) / (1000 * 3600 * 24));
        if (diffJours >= joursAttente) {
            const client = await db.clients.get(facture.clientId);
            await envoyerMessageSysteme('livraison_en_attente', {
                numero: facture.numero,
                client: client?.nom || 'Inconnu'
            });
        }
    }
}

async function verifierFacturesEnRetard() {
    const config = await getConfig();
    if (!config.facture_retard?.actif) return;

    const factures = await db.factures.where('statutPaiement').notEqual('payée').toArray();
    const aujourdhui = new Date();

    for (const facture of factures) {
        let dateEcheance;
        if (facture.echeance === 'livraison') {
            if (facture.statutLivraison !== 'livrée') continue;
            dateEcheance = new Date(facture.dateLivraison);
        } else {
            dateEcheance = new Date(facture.dateEcheance);
        }
        if (!dateEcheance || dateEcheance > aujourdhui) continue;

        const joursRetard = Math.floor((aujourdhui - dateEcheance) / (1000 * 3600 * 24));
        const client = await db.clients.get(facture.clientId);
        await envoyerMessageSysteme('facture_retard', {
            numero: facture.numero,
            client: client?.nom || 'Inconnu',
            jours_retard: joursRetard,
            montant: facture.totalHT,
            devise: facture.devise
        });
    }
}

export default {
    getConfig,
    envoyerMessageSysteme,
    envoyerMessageDirect,
    getMessagesNonLusCount,
    verifierTousLesMessages
};