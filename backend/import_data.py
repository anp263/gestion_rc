#!/usr/bin/env python3
# backend/import_data.py

import os
import csv
import json
import uuid
import re
from datetime import datetime, timedelta

DATA_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
os.makedirs(DATA_FOLDER, exist_ok=True)

# Fichiers JSON
SEM_RECOLTE_JSON = os.path.join(DATA_FOLDER, 'semaines_recolte.json')
SEM_PRODUCTION_JSON = os.path.join(DATA_FOLDER, 'semaines_production.json')
PROD_CONS_JSON = os.path.join(DATA_FOLDER, 'production_consommation.json')
PROD_LOT_JSON = os.path.join(DATA_FOLDER, 'production_lot.json')
LOTS_JSON = os.path.join(DATA_FOLDER, 'lots.json')
STOCKS_JSON = os.path.join(DATA_FOLDER, 'stocks.json')
TYPES_CONTENANTS_JSON = os.path.join(DATA_FOLDER, 'typesContenants.json')
SITES_JSON = os.path.join(DATA_FOLDER, 'sites.json')
CLIENTS_JSON = os.path.join(DATA_FOLDER, 'clients.json')
FACTURES_JSON = os.path.join(DATA_FOLDER, 'factures.json')
FACTURE_LIGNES_JSON = os.path.join(DATA_FOLDER, 'facture_lignes.json')
UTILISATEURS_JSON = os.path.join(DATA_FOLDER, 'utilisateurs.json')
TARIFS_JSON = os.path.join(DATA_FOLDER, 'tarifs.json')

# Fichiers CSV
CSV_RECOLTE = os.path.join(DATA_FOLDER, 'Suivi production huilerie 1.csv')
CSV_PROD_JOUR = os.path.join(DATA_FOLDER, 'Suivi production huilerie 2.csv')
CSV_PROD_HEBDO = os.path.join(DATA_FOLDER, 'Suivi production huilerie 3.csv')
CSV_CLIENTS = os.path.join(DATA_FOLDER, 'Facturier RC 2026 1.csv')
CSV_FACTURES = os.path.join(DATA_FOLDER, 'Facturier RC 2026 2.csv')

# --- Utilitaires ---
def lire_json(chemin):
    if os.path.exists(chemin):
        with open(chemin, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def ecrire_json(chemin, donnees):
    with open(chemin, 'w', encoding='utf-8') as f:
        json.dump(donnees, f, indent=2, ensure_ascii=False)

def vider_fichiers_json():
    fichiers = [
        SEM_RECOLTE_JSON, SEM_PRODUCTION_JSON, PROD_CONS_JSON, PROD_LOT_JSON,
        LOTS_JSON, STOCKS_JSON, TYPES_CONTENANTS_JSON, SITES_JSON,
        CLIENTS_JSON, FACTURES_JSON, FACTURE_LIGNES_JSON, TARIFS_JSON
    ]
    for f in fichiers:
        with open(f, 'w', encoding='utf-8') as out:
            json.dump([], out)
    print("🗑️  Fichiers JSON vidés.")

def normaliser_chaine(s):
    if not s:
        return ''
    s = s.replace('+ACI-', '').replace('+ACU-', '').replace('+//0-', '')
    s = s.replace('"', '').replace("'", '')
    s = s.replace('\xa0', ' ')
    s = re.sub(r'[^\x20-\x7E]', '', s)
    mapping = {
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
        'à': 'a', 'â': 'a', 'ä': 'a',
        'ô': 'o', 'ö': 'o',
        'ï': 'i', 'î': 'i',
        'ç': 'c',
        'ù': 'u', 'û': 'u', 'ü': 'u',
        'ŕ': 'r', 'ň': 'n', 'ő': 'o', 'ű': 'u',
    }
    for acc, rep in mapping.items():
        s = s.replace(acc, rep)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def nettoyer_nombre(valeur):
    if not valeur or valeur.strip() == '':
        return 0.0
    # Supprimer les espaces, remplacer la virgule décimale
    valeur = re.sub(r'\s', '', valeur)
    valeur = valeur.replace(',', '.')
    # Supprimer tout ce qui n'est pas chiffre, point ou moins
    valeur = re.sub(r'[^\d.-]', '', valeur)
    try:
        return float(valeur)
    except:
        return 0.0

def convertir_date(date_str):
    date_str = normaliser_chaine(date_str)
    mois_map = {
        'janv': '01', 'fevr': '02', 'mars': '03', 'avr': '04', 'mai': '05', 'juin': '06',
        'juil': '07', 'aout': '08', 'sept': '09', 'oct': '10', 'nov': '11', 'dec': '12'
    }
    # Vérifier si c'est un format avec mois abrégé
    for abbr, num in mois_map.items():
        if abbr in date_str:
            parts = date_str.split('-')
            if len(parts) == 3:
                jour = parts[0].zfill(2)
                mois = num
                annee = parts[2]
                if len(annee) == 2:
                    annee = '20' + annee
                date_str = f"{jour}/{mois}/{annee}"
                break
    try:
        return datetime.strptime(date_str, "%d/%m/%Y").date().isoformat()
    except:
        try:
            return datetime.strptime(date_str, "%d/%m/%y").date().isoformat()
        except:
            return None

def ajouter_entite(fichier, entite):
    donnees = lire_json(fichier)
    entite['id'] = str(uuid.uuid4())
    entite['date_creation'] = datetime.now().isoformat()
    donnees.append(entite)
    ecrire_json(fichier, donnees)
    return entite['id']

def obtenir_ou_creer_semaine_recolte(date_debut, poids_regimes=None):
    semaines = lire_json(SEM_RECOLTE_JSON)
    for s in semaines:
        if s.get('dateDebut') == date_debut:
            return s['id']
    date_fin = (datetime.fromisoformat(date_debut) + timedelta(days=6)).date().isoformat()
    nouvelle = {
        'dateDebut': date_debut,
        'dateFin': date_fin,
        'poidsRegimesTotal': poids_regimes if poids_regimes is not None else 0,
        'nbRegimesTotal': 0,
        'nbPalmiersEntretenusTotal': 0,
        'nbPalmiersVisitesTotal': 0,
        'poidsMoyenRegime': 0,
        'poidsRegimeParPalmier': 0,
        'consoGasoilTransport': 0
    }
    return ajouter_entite(SEM_RECOLTE_JSON, nouvelle)

def obtenir_ou_creer_semaine_production(date_debut):
    semaines = lire_json(SEM_PRODUCTION_JSON)
    for s in semaines:
        if s.get('dateDebut') == date_debut:
            return s['id']
    date_fin = (datetime.fromisoformat(date_debut) + timedelta(days=6)).date().isoformat()
    nouvelle = {
        'dateDebut': date_debut,
        'dateFin': date_fin,
        'consoGasoilTotal': 0,
        'consoEssenceTotal': 0
    }
    return ajouter_entite(SEM_PRODUCTION_JSON, nouvelle)

def obtenir_ou_creer_lot(numero, semaine_prod_id):
    lots = lire_json(LOTS_JSON)
    for l in lots:
        if l.get('numero') == numero:
            return l['id']
    lot_data = {
        'numero': numero,
        'semaineProdId': semaine_prod_id,
        'dateCreation': datetime.now().isoformat()
    }
    return ajouter_entite(LOTS_JSON, lot_data)

def lire_csv(chemin):
    with open(chemin, 'r', encoding='latin-1') as f:
        reader = csv.reader(f)
        lignes = list(reader)
    return lignes

# --- Importations avec indices fixes ---
def importer_recoltes():
    print("📥 Import des récoltes (fichier 1)...")
    if not os.path.exists(CSV_RECOLTE):
        print(f"Fichier non trouvé : {CSV_RECOLTE}")
        return
    lignes = lire_csv(CSV_RECOLTE)
    if len(lignes) < 3:
        print("Fichier trop court.")
        return
    col_semaine = 1
    col_poids = 2
    compteur = 0
    for row in lignes[2:]:
        if not row or len(row) <= col_poids:
            continue
        semaine_str = row[col_semaine].strip()
        if not semaine_str:
            continue
        date_debut = convertir_date(semaine_str)
        if not date_debut:
            continue
        poids = nettoyer_nombre(row[col_poids])
        if poids <= 0:
            continue
        obtenir_ou_creer_semaine_recolte(date_debut, poids)
        compteur += 1
    print(f"✅ {compteur} semaines de récolte importées.")

def importer_consommations():
    print("📥 Import des consommations journalières (fichier 2)...")
    if not os.path.exists(CSV_PROD_JOUR):
        print(f"Fichier non trouvé : {CSV_PROD_JOUR}")
        return
    lignes = lire_csv(CSV_PROD_JOUR)
    if len(lignes) < 3:
        print("Fichier trop court.")
        return
    col_date = 1
    col_seaux = 2
    col_semaine_recolte = 3
    col_gasoil = 5
    col_essence = 6
    compteur = 0
    for row in lignes[2:]:
        if not row or len(row) <= col_date:
            continue
        date_str = row[col_date].strip()
        if not date_str:
            continue
        date_prod = convertir_date(date_str)
        if not date_prod:
            continue
        d = datetime.fromisoformat(date_prod)
        lundi = d - timedelta(days=d.weekday())
        semaine_prod_debut = lundi.date().isoformat()
        semaine_prod_id = obtenir_ou_creer_semaine_production(semaine_prod_debut)
        seaux = nettoyer_nombre(row[col_seaux] if len(row) > col_seaux else '')
        if seaux == 0:
            continue
        fruits_kg = seaux * 12 * (10/12)
        gasoil = nettoyer_nombre(row[col_gasoil] if len(row) > col_gasoil else '')
        essence = nettoyer_nombre(row[col_essence] if len(row) > col_essence else '')
        rec_str = row[col_semaine_recolte].strip() if len(row) > col_semaine_recolte else ''
        semaine_recolte_id = None
        if rec_str:
            rec_date = convertir_date(rec_str)
            if rec_date:
                semaine_recolte_id = obtenir_ou_creer_semaine_recolte(rec_date)
        conso_data = {
            'semaineProdId': semaine_prod_id,
            'date': date_prod,
            'fruitsTransformesKg': fruits_kg,
            'consoGasoil': gasoil,
            'consoEssence': essence,
            'semaineRecolteId': semaine_recolte_id
        }
        ajouter_entite(PROD_CONS_JSON, conso_data)
        compteur += 1
    print(f"✅ {compteur} consommations importées.")

def importer_productions_hebdo():
    print("📥 Import des productions hebdomadaires (fichier 3)...")
    if not os.path.exists(CSV_PROD_HEBDO):
        print(f"Fichier non trouvé : {CSV_PROD_HEBDO}")
        return
    lignes = lire_csv(CSV_PROD_HEBDO)
    if len(lignes) < 3:
        print("Fichier trop court.")
        return
    col_semaine = 1
    col_bidon1 = 3
    col_bidon5 = 4
    col_bidon25 = 5
    col_odeur = 6
    col_couleur = 7
    col_gout = 8
    col_acidite = 9
    types_contenants = lire_json(TYPES_CONTENANTS_JSON)
    if not types_contenants:
        types_contenants = [
            {'id': '1', 'nom': 'Bidon 25L', 'capaciteL': 25, 'code': 'B25'},
            {'id': '2', 'nom': 'Bidon 5L', 'capaciteL': 5, 'code': 'B5'},
            {'id': '3', 'nom': 'Bidon 1L', 'capaciteL': 1, 'code': 'B1'}
        ]
        ecrire_json(TYPES_CONTENANTS_JSON, types_contenants)
    sites = lire_json(SITES_JSON)
    site_prod = next((s for s in sites if s.get('estProduction')), None)
    if not site_prod:
        site_id = ajouter_entite(SITES_JSON, {'nom': 'Production', 'estProduction': True})
        site_prod = {'id': site_id}
    else:
        site_id = site_prod['id']
    compteur = 0
    for row in lignes[2:]:
        if not row or len(row) <= col_bidon25:
            continue
        semaine_str = row[col_semaine].strip()
        if not semaine_str:
            continue
        date_debut = convertir_date(semaine_str)
        if not date_debut:
            continue
        bidon1 = nettoyer_nombre(row[col_bidon1] if len(row) > col_bidon1 else '')
        bidon5 = nettoyer_nombre(row[col_bidon5] if len(row) > col_bidon5 else '')
        bidon25 = nettoyer_nombre(row[col_bidon25] if len(row) > col_bidon25 else '')
        odeur = nettoyer_nombre(row[col_odeur] if len(row) > col_odeur else '')
        couleur = nettoyer_nombre(row[col_couleur] if len(row) > col_couleur else '')
        gout = nettoyer_nombre(row[col_gout] if len(row) > col_gout else '')
        acidite = nettoyer_nombre(row[col_acidite] if len(row) > col_acidite else '')
        volume = bidon1 * 1 + bidon5 * 5 + bidon25 * 25
        if volume == 0 and acidite == 0 and odeur == 0 and couleur == 0 and gout == 0:
            continue
        semaine_prod_id = obtenir_ou_creer_semaine_production(date_debut)
        date_obj = datetime.fromisoformat(date_debut)
        numero_base = date_obj.strftime("%d%m%y")
        lots_existants = lire_json(PROD_LOT_JSON)
        compteur_lot = len([l for l in lots_existants if l.get('semaineProdId') == semaine_prod_id]) + 1
        numero_lot = f"{numero_base}-{compteur_lot}"
        lot_id = obtenir_ou_creer_lot(numero_lot, semaine_prod_id)
        contenants = {}
        for tc in types_contenants:
            if tc['code'] == 'B25':
                contenants[tc['id']] = bidon25
            elif tc['code'] == 'B5':
                contenants[tc['id']] = bidon5
            elif tc['code'] == 'B1':
                contenants[tc['id']] = bidon1
        lot_data = {
            'semaineProdId': semaine_prod_id,
            'numeroLot': numero_lot,
            'date': date_debut,
            'fruitsTransformesKg': 0,
            'semaineRecolteId': None,
            'volumeHuileL': volume,
            'tauxAcidite': acidite,
            'noteGout': gout,
            'noteOdeur': odeur,
            'noteCouleur': couleur,
            'lotId': lot_id,
            'contenants': json.dumps(contenants)
        }
        ajouter_entite(PROD_LOT_JSON, lot_data)
        for tc_id, qte in contenants.items():
            if qte > 0:
                stocks = lire_json(STOCKS_JSON)
                existing = next((s for s in stocks if s.get('siteId') == site_id and s.get('lotId') == lot_id and s.get('typeContenantId') == tc_id), None)
                if existing:
                    existing['quantite'] += qte
                    ecrire_json(STOCKS_JSON, stocks)
                else:
                    ajouter_entite(STOCKS_JSON, {
                        'siteId': site_id,
                        'lotId': lot_id,
                        'typeContenantId': tc_id,
                        'quantite': qte
                    })
        compteur += 1
    print(f"✅ {compteur} lots de production importés.")

def importer_clients():
    print("📥 Import des clients (fichier 1)...")
    if not os.path.exists(CSV_CLIENTS):
        print(f"Fichier non trouvé : {CSV_CLIENTS}")
        return
    lignes = lire_csv(CSV_CLIENTS)
    if len(lignes) < 3:
        print("Fichier trop court.")
        return
    col_nom = 1
    col_type = 2
    col_nb_points = 3
    col_adresse = 4
    col_telephone = 6
    col_email = 7
    compteur = 0
    for row in lignes[2:]:
        if not row or len(row) <= col_nom:
            continue
        nom = row[col_nom].strip()
        if not nom:
            continue
        clients_existants = lire_json(CLIENTS_JSON)
        if any(c.get('nom') == nom for c in clients_existants):
            continue
        type_client = row[col_type].strip() if len(row) > col_type else ''
        nb_points = nettoyer_nombre(row[col_nb_points]) if len(row) > col_nb_points else 0
        adresse = row[col_adresse].strip() if len(row) > col_adresse else ''
        telephone = row[col_telephone].strip() if len(row) > col_telephone else ''
        email = row[col_email].strip() if len(row) > col_email else ''
        client_data = {
            'nom': nom,
            'type': type_client,
            'nbPointsVente': int(nb_points) if nb_points > 0 else 1,
            'adresse': adresse,
            'secteur': '',
            'telephone': telephone,
            'email': email,
            'produitsAchetes': '',
            'notes': ''
        }
        ajouter_entite(CLIENTS_JSON, client_data)
        compteur += 1
    print(f"✅ {compteur} clients importés.")

def importer_vendeurs():
    print("📥 Mise à jour des vendeurs...")
    if not os.path.exists(CSV_FACTURES):
        print(f"Fichier factures non trouvé, impossible de lister les vendeurs.")
        return
    lignes = lire_csv(CSV_FACTURES)
    if len(lignes) < 3:
        return
    col_vendeur = 5
    vendeurs_set = set()
    for row in lignes[2:]:
        if not row or len(row) <= col_vendeur:
            continue
        vendeur = row[col_vendeur].strip()
        if vendeur and vendeur != 'Nom du vendeur':
            vendeurs_set.add(vendeur)
    utilisateurs = lire_json(UTILISATEURS_JSON)
    if not utilisateurs:
        utilisateurs = [{'id': '1', 'nom': 'Admin', 'login': 'admin', 'mot_de_passe': 'admin123', 'role': 'superviseur', 'actifVendeur': False}]
        ecrire_json(UTILISATEURS_JSON, utilisateurs)
    for nom_vendeur in vendeurs_set:
        existant = any(u.get('nom') == nom_vendeur for u in utilisateurs)
        if not existant:
            nouveau = {
                'id': str(uuid.uuid4()),
                'nom': nom_vendeur,
                'login': nom_vendeur.lower().replace(' ', '_'),
                'mot_de_passe': 'password123',
                'role': 'vendeur',
                'actifVendeur': True
            }
            utilisateurs.append(nouveau)
    ecrire_json(UTILISATEURS_JSON, utilisateurs)
    print(f"✅ {len(vendeurs_set)} vendeurs intégrés dans les utilisateurs.")

def importer_tarifs():
    print("📥 Import des tarifs (extraits des factures)...")
    if not os.path.exists(CSV_FACTURES):
        print(f"Fichier factures non trouvé.")
        return
    lignes = lire_csv(CSV_FACTURES)
    if len(lignes) < 3:
        return
    col_tarif = 6
    col_devise = 7
    col_prix_b1 = 10
    col_prix_b5 = 12
    col_prix_b25 = 14
    tarifs_existants = lire_json(TARIFS_JSON)
    for row in lignes[2:]:
        if not row or len(row) <= col_tarif:
            continue
        tarif = row[col_tarif].strip()
        if not tarif:
            continue
        devise = row[col_devise].strip()
        prix_b1 = nettoyer_nombre(row[col_prix_b1]) if len(row) > col_prix_b1 else 0
        prix_b5 = nettoyer_nombre(row[col_prix_b5]) if len(row) > col_prix_b5 else 0
        prix_b25 = nettoyer_nombre(row[col_prix_b25]) if len(row) > col_prix_b25 else 0
        existant = next((t for t in tarifs_existants if t.get('code') == tarif), None)
        if not existant:
            nouveau_tarif = {
                'code': tarif,
                'devise': devise,
                'prixBidon1L': prix_b1,
                'prixBidon5L': prix_b5,
                'prixBidon25L': prix_b25,
                'dateDebut': datetime.now().isoformat(),
                'dateFin': ''
            }
            ajouter_entite(TARIFS_JSON, nouveau_tarif)
    print(f"✅ {len(tarifs_existants)} tarifs importés.")

def importer_factures():
    print("📥 Import des factures (fichier 2)...")
    if not os.path.exists(CSV_FACTURES):
        print(f"Fichier non trouvé : {CSV_FACTURES}")
        return
    lignes = lire_csv(CSV_FACTURES)
    if len(lignes) < 3:
        print("Fichier trop court.")
        return

    # Indices fixes (colonne 0 = première colonne du CSV)
    col_numero = 1
    col_date = 2
    col_client = 3
    col_lieu = 4
    col_vendeur = 5
    col_tarif = 6
    col_devise = 7
    col_remise = 8
    col_qte_b1 = 9
    col_prix_b1 = 10
    col_qte_b5 = 11
    col_prix_b5 = 12
    col_qte_b25 = 13
    col_prix_b25 = 14

    clients = lire_json(CLIENTS_JSON)
    utilisateurs = lire_json(UTILISATEURS_JSON)
    types_contenants = lire_json(TYPES_CONTENANTS_JSON)

    # Création des types de contenants s'ils n'existent pas
    if not types_contenants:
        types_contenants = [
            {'id': '1', 'nom': 'Bidon 25L', 'capaciteL': 25, 'code': 'B25'},
            {'id': '2', 'nom': 'Bidon 5L',  'capaciteL': 5,  'code': 'B5'},
            {'id': '3', 'nom': 'Bidon 1L',  'capaciteL': 1,  'code': 'B1'}
        ]
        ecrire_json(TYPES_CONTENANTS_JSON, types_contenants)

    tc_1l = next((tc for tc in types_contenants if tc.get('code') == 'B1'), None)
    tc_5l = next((tc for tc in types_contenants if tc.get('code') == 'B5'), None)
    tc_25l = next((tc for tc in types_contenants if tc.get('code') == 'B25'), None)

    # Vérifier qu'on a bien un vendeur par défaut
    if not any(u.get('role') == 'vendeur' for u in utilisateurs):
        # Créer un vendeur par défaut si nécessaire
        utilisateurs.append({
            'id': str(uuid.uuid4()),
            'nom': 'Vendeur par défaut',
            'login': 'vendeur_defaut',
            'mot_de_passe': 'password123',
            'role': 'vendeur',
            'actifVendeur': True
        })
        ecrire_json(UTILISATEURS_JSON, utilisateurs)

    compteur = 0
    for idx, row in enumerate(lignes[2:]):
        if not row or len(row) <= max(col_numero, col_date, col_client):
            continue

        numero = row[col_numero].strip()
        if not numero or numero == '0' or numero == 'F0':
            continue

        date_str = row[col_date].strip()
        if not date_str:
            continue
        date_facture = convertir_date(date_str)
        if not date_facture:
            continue

        client_nom = row[col_client].strip()
        client = next((c for c in clients if c.get('nom') == client_nom), None)
        if not client:
            print(f"Client non trouvé : {client_nom} (ligne {idx+3})")
            continue

        vendeur_nom = row[col_vendeur].strip() if len(row) > col_vendeur else ''
        vendeur = next((u for u in utilisateurs if u.get('nom') == vendeur_nom), None)
        if not vendeur:
            vendeur = next((u for u in utilisateurs if u.get('role') == 'vendeur'), None)
            if not vendeur:
                print(f"Aucun vendeur trouvé pour la facture {numero}")
                continue

        devise = row[col_devise].strip() if len(row) > col_devise else 'USD'
        tarif = row[col_tarif].strip() if len(row) > col_tarif else ''
        remise = nettoyer_nombre(row[col_remise]) if len(row) > col_remise else 0
        lieu_vente = row[col_lieu].strip() if len(row) > col_lieu else ''

        total = 0
        lignes_facture = []

        # LOG : afficher les données brutes
        print(f"\n--- Facture {numero} ---")
        if len(row) > col_qte_b1:
            print(f"  Bidon 1L: qte='{row[col_qte_b1]}' prix='{row[col_prix_b1]}'")
        if len(row) > col_qte_b5:
            print(f"  Bidon 5L: qte='{row[col_qte_b5]}' prix='{row[col_prix_b5]}'")
        if len(row) > col_qte_b25:
            print(f"  Bidon 25L: qte='{row[col_qte_b25]}' prix='{row[col_prix_b25]}'")

        # Bidon 1L
        if len(row) > col_qte_b1 and len(row) > col_prix_b1:
            qte_str = row[col_qte_b1]
            prix_str = row[col_prix_b1]
            qte = nettoyer_nombre(qte_str)
            prix = nettoyer_nombre(prix_str)
            print(f"  Après nettoyage: qte={qte}, prix={prix}")
            if qte > 0 and prix > 0 and tc_1l:
                total += qte * prix
                lignes_facture.append({
                    'factureId': None,
                    'typeContenantId': tc_1l['id'],
                    'quantite': qte,
                    'prixUnitaire': prix,
                    'prixTotal': qte * prix,
                    'remiseLigne': 0
                })
                print(f"    Ajouté bidon 1L: {qte} x {prix} = {qte*prix}")
        else:
            print("  Bidon 1L: colonnes manquantes")

        # Bidon 5L
        if len(row) > col_qte_b5 and len(row) > col_prix_b5:
            qte = nettoyer_nombre(row[col_qte_b5])
            prix = nettoyer_nombre(row[col_prix_b5])
            if qte > 0 and prix > 0 and tc_5l:
                total += qte * prix
                lignes_facture.append({
                    'factureId': None,
                    'typeContenantId': tc_5l['id'],
                    'quantite': qte,
                    'prixUnitaire': prix,
                    'prixTotal': qte * prix,
                    'remiseLigne': 0
                })

        # Bidon 25L
        if len(row) > col_qte_b25 and len(row) > col_prix_b25:
            qte = nettoyer_nombre(row[col_qte_b25])
            prix = nettoyer_nombre(row[col_prix_b25])
            if qte > 0 and prix > 0 and tc_25l:
                total += qte * prix
                lignes_facture.append({
                    'factureId': None,
                    'typeContenantId': tc_25l['id'],
                    'quantite': qte,
                    'prixUnitaire': prix,
                    'prixTotal': qte * prix,
                    'remiseLigne': 0
                })

        if total == 0:
            print(f"  ⚠️ Total nul pour la facture {numero}")
            continue

        total_apres_remise = total - remise
        if total_apres_remise < 0:
            total_apres_remise = 0

        # Échéance à 30 jours
        echeance = '30j'
        date_facture_obj = datetime.fromisoformat(date_facture)
        date_echeance = (date_facture_obj + timedelta(days=30)).date().isoformat()

        facture_data = {
            'numero': numero,
            'date': date_facture,
            'echeance': echeance,
            'dateEcheance': date_echeance,
            'clientId': client['id'],
            'vendeurId': vendeur['id'],
            'siteId': None,
            'devise': devise,
            'tarif': tarif,
            'lieuVente': lieu_vente,
            'remise': remise,
            'remiseMontant': remise,
            'remiseType': 'amount',
            'totalHT': total_apres_remise,
            'statutLivraison': 'a_livrer',   # car échéance à 30 jours, on attend paiement avant livraison ?
            'statutPaiement': 'en_attente',
            'blSelectionne': False,
            'dateLivraison': None,
            'datePaiement': None,
            'notes': '',
            'dateCreation': datetime.now().isoformat()
        }
        facture_id = ajouter_entite(FACTURES_JSON, facture_data)
        for ligne in lignes_facture:
            ligne['factureId'] = facture_id
            ajouter_entite(FACTURE_LIGNES_JSON, ligne)
        compteur += 1
        print(f"  ✅ Facture importée (total={total_apres_remise})")
        if compteur % 10 == 0:
            print(f"  {compteur} factures importées...")

    print(f"✅ {compteur} factures importées.")

if __name__ == '__main__':
    print("🚀 Démarrage de l'import unique des données historiques...")
    vider_fichiers_json()
    importer_recoltes()
    importer_consommations()
    importer_productions_hebdo()
    importer_clients()
    importer_vendeurs()
    importer_tarifs()
    importer_factures()
    flag_file = os.path.join(DATA_FOLDER, 'import_done.txt')
    with open(flag_file, 'w') as f:
        f.write(datetime.now().isoformat())
    print("✅ Import terminé.")