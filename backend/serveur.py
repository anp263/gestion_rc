#!/usr/bin/env python3
# ~/Documents/En cours/Gestion/backend/serveur.py

import os
import json
import uuid
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DATA_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
os.makedirs(DATA_FOLDER, exist_ok=True)

print(f"Dossier de données : {DATA_FOLDER}")

FICHIERS = {
    'utilisateurs': os.path.join(DATA_FOLDER, 'utilisateurs.json'),
    'semaines_recolte': os.path.join(DATA_FOLDER, 'semaines_recolte.json'),
    'recolte_journaliere': os.path.join(DATA_FOLDER, 'recolte_journaliere.json'),
    'semaines_production': os.path.join(DATA_FOLDER, 'semaines_production.json'),
    'production_consommation': os.path.join(DATA_FOLDER, 'production_consommation.json'),
    'production_lot': os.path.join(DATA_FOLDER, 'production_lot.json'),
    'production_consommation_carburant': os.path.join(DATA_FOLDER, 'production_consommation_carburant.json'),
    'production_lot_emballages': os.path.join(DATA_FOLDER, 'production_lot_emballages.json'),
    'typesContenants': os.path.join(DATA_FOLDER, 'typesContenants.json'),
    'lots': os.path.join(DATA_FOLDER, 'lots.json'),
    'sites': os.path.join(DATA_FOLDER, 'sites.json'),
    'stocks': os.path.join(DATA_FOLDER, 'stocks.json'),
    'mouvements': os.path.join(DATA_FOLDER, 'mouvements.json'),
    'mouvement_lignes': os.path.join(DATA_FOLDER, 'mouvement_lignes.json'),
    'transferts': os.path.join(DATA_FOLDER, 'transferts.json'),
    'transfert_lignes': os.path.join(DATA_FOLDER, 'transfert_lignes.json'),
    'inventaires': os.path.join(DATA_FOLDER, 'inventaires.json'),
    'inventaire_lignes': os.path.join(DATA_FOLDER, 'inventaire_lignes.json'),
    'reconditionnements': os.path.join(DATA_FOLDER, 'reconditionnements.json'),
    'clients': os.path.join(DATA_FOLDER, 'clients.json'),
    'tarifs': os.path.join(DATA_FOLDER, 'tarifs.json'),
    'factures': os.path.join(DATA_FOLDER, 'factures.json'),
    'facture_lignes': os.path.join(DATA_FOLDER, 'facture_lignes.json'),
    'bons_livraison': os.path.join(DATA_FOLDER, 'bons_livraison.json'),
    'bl_lignes': os.path.join(DATA_FOLDER, 'bl_lignes.json'),
    'caisses': os.path.join(DATA_FOLDER, 'caisses.json'),
    'sous_caisses': os.path.join(DATA_FOLDER, 'sous_caisses.json'),
    'mouvementsCaisse': os.path.join(DATA_FOLDER, 'mouvementsCaisse.json'),
    'transfertsCaisse': os.path.join(DATA_FOLDER, 'transfertsCaisse.json'),
    'operationsChange': os.path.join(DATA_FOLDER, 'operationsChange.json'),
    'modes_paiement': os.path.join(DATA_FOLDER, 'modes_paiement.json'),
    'postes_budgetaires': os.path.join(DATA_FOLDER, 'postes_budgetaires.json'),
    'budgets': os.path.join(DATA_FOLDER, 'budgets.json'),
    'reglages': os.path.join(DATA_FOLDER, 'reglages.json'),
    'erreurs_caisse': os.path.join(DATA_FOLDER, 'erreurs_caisse.json'),
    'semaines_caisse': os.path.join(DATA_FOLDER, 'semaines_caisse.json'),
    'regles_emissions_indirectes': os.path.join(DATA_FOLDER, 'regles_emissions_indirectes.json'),

    # Tables ajoutées
    'clotures_sous_caisse': os.path.join(DATA_FOLDER, 'clotures_sous_caisse.json'),
    'caisse_utilisateurs': os.path.join(DATA_FOLDER, 'caisse_utilisateurs.json'),
    'taux_change': os.path.join(DATA_FOLDER, 'taux_change.json'),
    'budget_postes': os.path.join(DATA_FOLDER, 'budget_postes.json'),
    'budget_versions': os.path.join(DATA_FOLDER, 'budget_versions.json'),
    'comptes_bancaires': os.path.join(DATA_FOLDER, 'comptes_bancaires.json'),
    'imports_bancaires': os.path.join(DATA_FOLDER, 'imports_bancaires.json'),
    'mouvements_bancaires': os.path.join(DATA_FOLDER, 'mouvements_bancaires.json'),
    'regles_affectation': os.path.join(DATA_FOLDER, 'regles_affectation.json'),
    'travailleurs': os.path.join(DATA_FOLDER, 'travailleurs.json'),
    'salaires_historique': os.path.join(DATA_FOLDER, 'salaires_historique.json'),
    'presence_suspension': os.path.join(DATA_FOLDER, 'presence_suspension.json'),
    'avances': os.path.join(DATA_FOLDER, 'avances.json'),
    'remboursements_avances': os.path.join(DATA_FOLDER, 'remboursements_avances.json'),
    'primes': os.path.join(DATA_FOLDER, 'primes.json'),
    'archive_annee': os.path.join(DATA_FOLDER, 'archive_annee.json'),
    'types_clients': os.path.join(DATA_FOLDER, 'types_clients.json'),
    'permissions_groupes': os.path.join(DATA_FOLDER, 'permissions_groupes.json'),
    'ecritures_manuelles': os.path.join(DATA_FOLDER, 'ecritures_manuelles.json'),
    'plan_comptable': os.path.join(DATA_FOLDER, 'plan_comptable.json'),
    'journaux': os.path.join(DATA_FOLDER, 'journaux.json'),
    'journal_audit': os.path.join(DATA_FOLDER, 'journal_audit.json'),
    'objectifs_mensuels': os.path.join(DATA_FOLDER, 'objectifs_mensuels.json'),

    # Nouvelles tables carburant & emballage
    'carburant_types': os.path.join(DATA_FOLDER, 'carburant_types.json'),
    'carburant_type_sites': os.path.join(DATA_FOLDER, 'carburant_type_sites.json'),
    'carburant_utilisations': os.path.join(DATA_FOLDER, 'carburant_utilisations.json'),
    'carburant_stocks': os.path.join(DATA_FOLDER, 'carburant_stocks.json'),
    'carburant_mouvements': os.path.join(DATA_FOLDER, 'carburant_mouvements.json'),
    'emballage_types': os.path.join(DATA_FOLDER, 'emballage_types.json'),
    'emballage_stocks': os.path.join(DATA_FOLDER, 'emballage_stocks.json'),
    'emballage_mouvements': os.path.join(DATA_FOLDER, 'emballage_mouvements.json'),
    'achat_emballage_lignes': os.path.join(DATA_FOLDER, 'achat_emballage_lignes.json'),
    'transfert_emballages': os.path.join(DATA_FOLDER, 'transfert_emballages.json'),
    'transfert_emballage_lignes': os.path.join(DATA_FOLDER, 'transfert_emballage_lignes.json'),
}

STRUCTURES_PAR_DEFAUT = {
    'utilisateurs': [{'id': '1', 'nom': 'Admin', 'login': 'admin', 'mot_de_passe': 'admin123', 'role': 'superviseur', 'actifVendeur': True}],
    'typesContenants': [
        {'id': '1', 'nom': 'Bidon 25L', 'capaciteL': 25, 'code': 'B25', 'usage': 'vente_uniquement'},
        {'id': '2', 'nom': 'Bidon 5L', 'capaciteL': 5, 'code': 'B5', 'usage': 'vente_uniquement'},
        {'id': '3', 'nom': 'Bidon 1L', 'capaciteL': 1, 'code': 'B1', 'usage': 'vente_uniquement'}
    ],
    'sites': [
        {'id': '1', 'nom': 'Production', 'estProduction': True},
        {'id': '2', 'nom': 'Vente', 'estProduction': False}
    ],
    'modes_paiement': [
        {'id': '1', 'nom': 'Liquide', 'actif': True},
        {'id': '2', 'nom': 'Orange Money', 'actif': True},
        {'id': '3', 'nom': 'Airtel Money', 'actif': True},
        {'id': '4', 'nom': 'Carte bancaire', 'actif': True},
        {'id': '5', 'nom': 'Virement', 'actif': True}
    ],
    'postes_budgetaires': [
        {'id': '1', 'nom': "Vente d'huile", 'type': 'entree', 'lieFacture': True, 'estRetraitBancaire': False, 'actif': True, 'affectation_stock': None},
        {'id': '2', 'nom': 'Transport régimes', 'type': 'sortie', 'lieFacture': False, 'estRetraitBancaire': False, 'actif': True, 'affectation_stock': None},
        {'id': '3', 'nom': 'Transport huile', 'type': 'sortie', 'lieFacture': False, 'estRetraitBancaire': False, 'actif': True, 'affectation_stock': None},
        {'id': '4', 'nom': 'Carburant', 'type': 'sortie', 'lieFacture': False, 'estRetraitBancaire': False, 'actif': True, 'affectation_stock': 'carburant'},
        {'id': '5', 'nom': 'Salaires', 'type': 'sortie', 'lieFacture': False, 'estRetraitBancaire': False, 'actif': True, 'affectation_stock': None},
        {'id': '6', 'nom': 'Maintenance', 'type': 'sortie', 'lieFacture': False, 'estRetraitBancaire': False, 'actif': True, 'affectation_stock': None},
        {'id': '7', 'nom': 'Achats emballages', 'type': 'sortie', 'lieFacture': False, 'estRetraitBancaire': False, 'actif': True, 'affectation_stock': 'emballage'},
        {'id': '8', 'nom': 'Retrait bancaire USD', 'type': 'sortie', 'lieFacture': False, 'estRetraitBancaire': True, 'actif': True, 'affectation_stock': None},
        {'id': '9', 'nom': 'Retrait bancaire CDF', 'type': 'sortie', 'lieFacture': False, 'estRetraitBancaire': True, 'actif': True, 'affectation_stock': None}
    ],
    'reglages': {
        'roles': [
            {'nom': 'superviseur', 'permissions': {'recolte': 'ecriture', 'production': 'ecriture', 'stocks': 'ecriture', 'clients': 'ecriture', 'caisses': 'ecriture', 'budgets': 'ecriture', 'reglages': 'ecriture', 'factures': 'ecriture', 'travailleurs': 'ecriture', 'banque': 'ecriture'}, 'groupes': ['admin','production','ventes','caisse_banque','finance']},
            {'nom': 'superviseur_huilerie', 'permissions': {'recolte': 'lecture', 'production': 'ecriture', 'stocks': 'ecriture', 'clients': 'lecture', 'caisses': 'lecture', 'budgets': 'lecture', 'reglages': 'lecture', 'factures': 'lecture', 'travailleurs': 'aucun', 'banque': 'aucun'}, 'groupes': ['production']},
            {'nom': 'superviseur_vente', 'permissions': {'recolte': 'lecture', 'production': 'lecture', 'stocks': 'ecriture', 'clients': 'ecriture', 'caisses': 'lecture', 'budgets': 'lecture', 'reglages': 'lecture', 'factures': 'ecriture', 'travailleurs': 'aucun', 'banque': 'aucun'}, 'groupes': ['ventes','caisse_banque']},
            {'nom': 'vendeur', 'permissions': {'recolte': 'aucun', 'production': 'aucun', 'stocks': 'lecture', 'clients': 'ecriture', 'caisses': 'aucun', 'budgets': 'aucun', 'reglages': 'aucun', 'factures': 'lecture', 'travailleurs': 'aucun', 'banque': 'aucun'}, 'groupes': []},
            {'nom': 'caissier', 'permissions': {'recolte': 'aucun', 'production': 'aucun', 'stocks': 'lecture', 'clients': 'lecture', 'caisses': 'ecriture', 'budgets': 'lecture', 'reglages': 'aucun', 'factures': 'lecture', 'travailleurs': 'aucun', 'banque': 'aucun'}, 'groupes': ['caisse_banque']}
        ],
        'taux_conversion': {'huile_l_kg': 0.9, 'fruits_l_kg': 10/12},
        'facteurs_emission': {'gasoil_kg_co2_par_l': 2.68, 'essence_kg_co2_par_l': 2.31},
        'parcelles': ['Parcelle A', 'Parcelle B', 'Parcelle C'],
        'coordonnees': {'nom': '', 'adresse': '', 'telephone': '', 'email': '', 'logo': '', 'legalInfo': ''},
        'taux_change': {'USD_CDF': 2500}
    },
    'types_clients': [
        {'id': '1', 'nom': 'Boutique', 'description': ''},
        {'id': '2', 'nom': 'Supermarché', 'description': ''},
        {'id': '3', 'nom': 'Privé', 'description': ''},
        {'id': '4', 'nom': 'Autre', 'description': ''}
    ],
    'journaux': [
        {'id': '1', 'code': 'BQ1', 'libelle': 'Banque Rawbank USD', 'type': 'banque'},
        {'id': '2', 'code': 'CKI', 'libelle': 'Caisse Kinshasa USD', 'type': 'caisse'},
        {'id': '3', 'code': 'CAI', 'libelle': 'Caisse Kinshasa CDF', 'type': 'caisse'},
        {'id': '4', 'code': 'OD', 'libelle': 'Opérations diverses', 'type': 'manuel'}
    ],
    'regles_emissions_indirectes': [],

    # Les nouvelles tables ont des listes vides par défaut
    'carburant_types': [],
    'carburant_type_sites': [],
    'carburant_utilisations': [],
    'carburant_stocks': [],
    'carburant_mouvements': [],
    'production_consommation_carburant': [],
    'emballage_types': [],
    'emballage_stocks': [],
    'emballage_mouvements': [],
    'achat_emballage_lignes': [],
    'transfert_emballages': [],
    'transfert_emballage_lignes': [],
    'production_lot_emballages': [],
    'objectifs_mensuels': [],
}

def initialiser_fichiers():
    for nom_fichier, chemin in FICHIERS.items():
        if not os.path.exists(chemin):
            structure = STRUCTURES_PAR_DEFAUT.get(nom_fichier, [] if nom_fichier not in ['reglages'] else {})
            with open(chemin, 'w', encoding='utf-8') as f:
                json.dump(structure, f, indent=2, ensure_ascii=False)
            print(f"Création du fichier {chemin}")

def lire_fichier(nom_fichier):
    chemin = FICHIERS.get(nom_fichier)
    if not chemin or not os.path.exists(chemin):
        return None
    try:
        with open(chemin, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Erreur lecture {chemin}: {e}")
        return None

def ecrire_fichier(nom_fichier, donnees):
    chemin = FICHIERS.get(nom_fichier)
    if not chemin:
        return False
    try:
        with open(chemin, 'w', encoding='utf-8') as f:
            json.dump(donnees, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Erreur écriture {chemin}: {e}")
        return False

@app.route('/api/<nom_fichier>', methods=['GET'])
def get_donnees(nom_fichier):
    donnees = lire_fichier(nom_fichier)
    if donnees is None:
        return jsonify([] if nom_fichier not in ['reglages'] else {})
    return jsonify(donnees)

@app.route('/api/<nom_fichier>', methods=['POST'])
def post_donnees(nom_fichier):
    """Ajoute une ou plusieurs entités au lieu d'écraser le fichier"""
    nouvelles = request.json
    donnees = lire_fichier(nom_fichier)
    if donnees is None:
        donnees = [] if nom_fichier not in ['reglages'] else {}
    
    # Si c'est un dictionnaire unique (reglages) on met à jour
    if nom_fichier == 'reglages' and isinstance(donnees, dict) and isinstance(nouvelles, dict):
        donnees.update(nouvelles)
    elif isinstance(donnees, list):
        if isinstance(nouvelles, list):
            donnees.extend(nouvelles)
        else:
            donnees.append(nouvelles)
    else:
        donnees = nouvelles

    if ecrire_fichier(nom_fichier, donnees):
        return jsonify({'succes': True})
    return jsonify({'erreur': 'Erreur écriture'}), 500

@app.route('/api/<nom_fichier>/ajouter', methods=['POST'])
def ajouter_entite(nom_fichier):
    """Endpoint alternatif pour ajout avec ID généré automatiquement"""
    donnees = lire_fichier(nom_fichier)
    if donnees is None:
        return jsonify({'erreur': 'Fichier non trouvé'}), 404

    nouvelle_entite = request.json
    if 'id' not in nouvelle_entite:
        nouvelle_entite['id'] = str(uuid.uuid4())
    nouvelle_entite['date_creation'] = datetime.now().isoformat()

    if isinstance(donnees, list):
        donnees.append(nouvelle_entite)
    else:
        donnees = [nouvelle_entite]

    if ecrire_fichier(nom_fichier, donnees):
        return jsonify({'succes': True, 'id': nouvelle_entite['id']})
    return jsonify({'erreur': 'Erreur écriture'}), 500

@app.route('/api/<nom_fichier>/<id>', methods=['PUT'])
def modifier_entite(nom_fichier, id):
    print(f"PUT request for {nom_fichier}/{id}")
    donnees = lire_fichier(nom_fichier)
    if donnees is None:
        return jsonify({'erreur': 'Fichier non trouvé'}), 404

    modifications = request.json
    modifications['date_modification'] = datetime.now().isoformat()

    if isinstance(donnees, list):
        for i, entite in enumerate(donnees):
            if isinstance(entite, dict) and entite.get('id') == id:
                donnees[i].update(modifications)
                if ecrire_fichier(nom_fichier, donnees):
                    return jsonify({'succes': True})
                return jsonify({'erreur': 'Erreur écriture'}), 500
        # Élément non trouvé → on l'ajoute
        modifications['id'] = id
        donnees.append(modifications)
        if ecrire_fichier(nom_fichier, donnees):
            return jsonify({'succes': True, 'message': 'Créé car absent'})
    else:
        # Cas d'un objet unique (reglages)
        donnees.update(modifications)
        if ecrire_fichier(nom_fichier, donnees):
            return jsonify({'succes': True})

    return jsonify({'erreur': 'Impossible de modifier'}), 500

@app.route('/api/stocks/update', methods=['PUT'])
def update_stock_by_keys():
    data = request.json
    site_id = data.get('siteId')
    lot_id = data.get('lotId')
    type_id = data.get('typeContenantId')
    if not (site_id and lot_id and type_id):
        return jsonify({'erreur': 'siteId, lotId et typeContenantId requis'}), 400

    stocks = lire_fichier('stocks')
    if stocks is None:
        return jsonify({'erreur': 'Fichier stocks non trouvé'}), 404

    for stock in stocks:
        if (stock.get('siteId') == site_id and
            stock.get('lotId') == lot_id and
            stock.get('typeContenantId') == type_id):
            stock.update(data)
            stock['date_modification'] = datetime.now().isoformat()
            if ecrire_fichier('stocks', stocks):
                return jsonify({'succes': True})
            return jsonify({'erreur': 'Erreur écriture'}), 500

    # Création
    nouveau = {
        'id': str(uuid.uuid4()),
        'siteId': site_id,
        'lotId': lot_id,
        'typeContenantId': type_id,
        'quantite': data.get('quantite', 0),
        'date_creation': datetime.now().isoformat()
    }
    stocks.append(nouveau)
    if ecrire_fichier('stocks', stocks):
        return jsonify({'succes': True, 'id': nouveau['id']})
    return jsonify({'erreur': 'Erreur écriture'}), 500

@app.route('/api/transfert_lignes/update', methods=['PUT'])
def update_transfert_ligne_by_keys():
    data = request.json
    transfert_id = data.get('transfertId')
    lot_id = data.get('lotId')
    type_id = data.get('typeContenantId')
    if not (transfert_id and lot_id and type_id):
        return jsonify({'erreur': 'transfertId, lotId et typeContenantId requis'}), 400

    lignes = lire_fichier('transfert_lignes')
    if lignes is None:
        return jsonify({'erreur': 'Fichier transfert_lignes non trouvé'}), 404

    for ligne in lignes:
        if (ligne.get('transfertId') == transfert_id and
            ligne.get('lotId') == lot_id and
            ligne.get('typeContenantId') == type_id):
            ligne.update(data)
            ligne['date_modification'] = datetime.now().isoformat()
            if ecrire_fichier('transfert_lignes', lignes):
                return jsonify({'succes': True})
            return jsonify({'erreur': 'Erreur écriture'}), 500
    return jsonify({'erreur': 'Ligne non trouvée'}), 404

@app.route('/api/<nom_fichier>/<id>', methods=['DELETE'])
def supprimer_entite(nom_fichier, id):
    print(f"DELETE {nom_fichier}/{id}")
    donnees = lire_fichier(nom_fichier)
    if donnees is None:
        return jsonify({'erreur': 'Fichier non trouvé'}), 404

    if isinstance(donnees, list):
        nouvelle_liste = [e for e in donnees if e.get('id') != id]
        if len(nouvelle_liste) == len(donnees):
            # Élément déjà absent, on considère que c'est un succès
            return jsonify({'succes': True, 'message': 'Déjà supprimé'})
        if ecrire_fichier(nom_fichier, nouvelle_liste):
            return jsonify({'succes': True})
    return jsonify({'erreur': 'Erreur suppression'}), 500

@app.route('/api/export/<nom_fichier>', methods=['GET'])
def exporter(nom_fichier):
    chemin = FICHIERS.get(nom_fichier)
    if not chemin or not os.path.exists(chemin):
        return jsonify({'erreur': 'Fichier non trouvé'}), 404
    return send_file(chemin, as_attachment=True, download_name=f"{nom_fichier}.json")

@app.route('/api/import/<nom_fichier>', methods=['POST'])
def importer(nom_fichier):
    if 'fichier' not in request.files:
        return jsonify({'erreur': 'Aucun fichier'}), 400
    fichier = request.files['fichier']
    if fichier.filename == '':
        return jsonify({'erreur': 'Nom fichier vide'}), 400
    try:
        donnees = json.load(fichier)
        if ecrire_fichier(nom_fichier, donnees):
            return jsonify({'succes': True})
        return jsonify({'erreur': 'Erreur écriture'}), 500
    except Exception as e:
        return jsonify({'erreur': str(e)}), 500

if __name__ == '__main__':
    initialiser_fichiers()
    print("Démarrage du serveur sur http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)