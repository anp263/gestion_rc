<template>
  <div class="container-fluid">
    <h2 class="mb-4" style="color: #ED1C24;">Relevés bancaires</h2>

    <div class="card mb-3">
      <div class="card-body">
        <div class="row">
          <div class="col-md-3">
            <label>Compte bancaire</label>
            <select class="form-select" v-model="compteActifId" @change="chargerImports">
              <option v-for="c in comptes" :key="c.id" :value="c.id">{{ c.nom }} ({{ c.devise }})</option>
            </select>
          </div>
          <div class="col-md-3">
            <label>Semaine</label>
            <select class="form-select" v-model="semaineId" @change="chargerMouvements">
              <option v-for="s in semaines" :key="s.id" :value="s.id">{{ formatDate(s.dateDebut) }} → {{ formatDate(s.dateFin) }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <button class="btn btn-primary mt-4" @click="ouvrirImport">Importer CSV</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-header">Imports existants</div>
      <div class="card-body">
        <table class="table table-sm">
          <thead><tr><th>Date import</th><th>Fichier</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="imp in imports" :key="imp.id">
              <td>{{ formatDate(imp.date_import) }}</td>
              <td>{{ imp.nom_fichier }}</td>
              <td>{{ imp.statut }}</td>
              <td><button class="btn btn-sm btn-info" @click="editerImport(imp)">Détails</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal d'import CSV -->
    <div v-if="showImportModal" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Importer un relevé CSV</h5>
            <button type="button" class="btn-close" @click="showImportModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row mb-3">
              <div class="col-md-6">
                <label>Fichier CSV</label>
                <input type="file" class="form-control" @change="onFileChange" accept=".csv">
              </div>
              <div class="col-md-3">
                <label>Ligne des en-têtes</label>
                <input type="number" class="form-control" v-model.number="ligneEnTete" min="0" max="20" @change="genererApercu">
                <small class="text-muted">0 = pas d'en-tête</small>
              </div>
              <div class="col-md-3">
                <label>Nombre de lignes à importer</label>
                <input type="number" class="form-control" v-model.number="nbLignes" min="1">
                <small class="text-muted">Laissez 0 pour tout importer</small>
              </div>
            </div>

            <div v-if="colonnesFichier.length">
              <h6>Mapping des colonnes</h6>
              <div class="row mb-2" v-for="(col, idx) in colonnesFichier" :key="idx">
                <div class="col-md-4">{{ col }}</div>
                <div class="col-md-6">
                  <select class="form-select" v-model="mapping[col]">
                    <option value="">-- Ignorer --</option>
                    <option value="date_operation">Date opération</option>
                    <option value="date_valeur">Date valeur</option>
                    <option value="libelle">Désignation / Libellé</option>
                    <option value="montant_credit">Montant crédit</option>
                    <option value="montant_debit">Montant débit</option>
                    <option value="solde">Solde</option>
                  </select>
                </div>
              </div>
              <button class="btn btn-primary" @click="previsualiser">Prévisualiser</button>
            </div>

            <div v-if="lignesApercu.length" class="mt-3">
              <h6>Aperçu ({{ lignesApercu.length }} lignes)</h6>
              <div class="table-responsive">
                <table class="table table-sm">
                  <thead>
                    <tr><th>Date op.</th><th>Date valeur</th><th>Libellé</th><th>Montant</th><th>Devise</th><th>Type</th><th>Solde</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="l in lignesApercu" :key="l.index">
                      <td>{{ l.date_op }}</td>
                      <td>{{ l.date_val }}</td>
                      <td>{{ l.libelle }}</td>
                      <td>{{ formatMontant(l.montant, deviseCompte) }}</td>
                      <td>{{ deviseCompte }}</td>
                      <td>{{ l.type === 'credit' ? 'Crédit' : 'Débit' }}</td>
                      <td>{{ l.solde }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button class="btn btn-success" @click="validerImport">Importer ces lignes</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal d'édition d'import (affectation des postes) -->
    <div v-if="showEditionImport" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Affectation des postes - Import du {{ formatDate(importEnCours.date_import) }}</h5>
            <button type="button" class="btn-close" @click="showEditionImport = false"></button>
          </div>
          <div class="modal-body">
            <div class="table-responsive">
              <table class="table table-bordered table-sm">
                <thead>
                  <tr>
                    <th>Date op.</th><th>Date valeur</th><th>Libellé</th><th>Montant</th><th>Devise</th><th>Type</th>
                    <th>Poste budgétaire</th><th>Caisse (si retrait/dépôt)</th><th>Vérification</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(mvt, idx) in mouvementsTemp" :key="idx">
                    <td>{{ formatDate(mvt.date_operation) }}</td>
                    <td>{{ formatDate(mvt.date_valeur) }}</td>
                    <td>{{ mvt.libelle }}</td>
                    <td>{{ formatMontant(mvt.montant, mvt.devise) }}</td>
                    <td>{{ mvt.devise }}</td>
                    <td>{{ mvt.type === 'credit' ? 'Crédit' : 'Débit' }}</td>
                    <td>
                      <select class="form-select" v-model="mvt.poste_id" @change="verifierMouvement(mvt)">
                        <option value="">-- Sélectionner --</option>
                        <option v-for="p in postesBudget" :key="p.id" :value="p.id">{{ p.nom }} {{ p.systeme ? '(système)' : '' }}</option>
                      </select>
                    </td>
                    <td>
                      <select class="form-select" v-model="mvt.caisse_id" :disabled="!isRetraitOuDepot(mvt.poste_id)">
                        <option value="">-- Aucune --</option>
                        <option v-for="c in caisses" :key="c.id" :value="c.id">{{ c.nom }}</option>
                      </select>
                    </td>
                    <td>
                      <span v-if="mvt.verification === 'ok'" class="text-success">✓ OK</span>
                      <span v-else-if="mvt.verification === 'warning'" class="text-warning">⚠ Avertissement</span>
                      <span v-else class="text-danger">✗ Non vérifié</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="alert alert-info">
              <strong>Solde calculé :</strong> {{ formatMontant(soldeCalcule, deviseCompte) }} / 
              <strong>Solde relevé :</strong> {{ formatMontant(soldeReleve, deviseCompte) }}
              <span v-if="Math.abs(soldeCalcule - soldeReleve) > 0.01" class="text-danger"> → Écart ! Vérifiez les lignes.</span>
            </div>
            <button class="btn btn-primary" @click="validerAffectation" :disabled="!affectationComplete">Valider l'import</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from '../db';
import Papa from 'papaparse';
import { hasPermission } from '../utils/permissions';
import apiService from '../services/api';

export default {
  name: 'Banque',
  data() {
    return {
      comptes: [],
      semaines: [],
      compteActifId: null,
      semaineId: null,
      imports: [],
      mouvementsBancaires: [],
      showImportModal: false,
      showEditionImport: false,
      importEnCours: null,
      colonnesFichier: [],
      mapping: {},
      fichierData: null,
      ligneEnTete: 1,
      nbLignes: 0, // 0 = tout importer
      lignesApercu: [],
      deviseCompte: '',
      mouvementsTemp: [],
      postesBudget: [],
      caisses: [],
      soldeCalcule: 0,
      soldeReleve: 0,
    };
  },
  computed: {
    affectationComplete() {
      return this.mouvementsTemp.every(m => m.poste_id);
    }
  },
  async mounted() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const peutAcceder = await hasPermission(user, 'banque', 'lecture');
    if (!peutAcceder) {
      this.$router.push('/');
      return;
    }
    await this.chargerComptes();
    await this.chargerSemaines();
    await this.chargerPostes();
    await this.chargerCaisses();
  },
  methods: {
    formatDate(dateStr) { return dateStr ? new Date(dateStr).toLocaleDateString('fr-FR') : ''; },
    formatMontant(montant, devise) {
    if (montant === undefined || montant === null) return '0';
    if (devise === 'CDF') {
        let formatted = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0, useGrouping: true }).format(Math.round(montant));
        return formatted.replace(/\s/g, "'");
    } else {
        let formatted = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: true }).format(montant);
        return formatted.replace(/\s/g, "'");
    }
    },
    async chargerComptes() { this.comptes = await db.comptes_bancaires.toArray(); },
    async chargerSemaines() { this.semaines = await db.semaines_caisse.toArray(); },
    async chargerPostes() { this.postesBudget = await db.postes_budgetaires.toArray(); },
    async chargerCaisses() { this.caisses = await db.caisses.toArray(); },
    async chargerImports() { this.imports = await db.imports_bancaires.where('compte_id').equals(this.compteActifId).toArray(); },
    async chargerMouvements() { this.mouvementsBancaires = await db.mouvements_bancaires.where({ compte_id: this.compteActifId, semaine_id: this.semaineId }).toArray(); },
    ouvrirImport() { this.showImportModal = true; this.colonnesFichier = []; this.mapping = {}; this.lignesApercu = []; this.fichierData = null; this.ligneEnTete = 1; this.nbLignes = 0; },
    onFileChange(event) {
      const file = event.target.files[0];
      if (!file) return;
      Papa.parse(file, {
        encoding: "UTF-8",
        complete: (results) => {
            this.fichierData = results.data;
            this.genererApercu();
        }
        });
    },
    genererApercu() {
    if (!this.fichierData || this.fichierData.length === 0) return;
    const headerIndex = this.ligneEnTete - 1;
    if (this.ligneEnTete === 0 || headerIndex < 0 || headerIndex >= this.fichierData.length) {
        const maxCols = Math.max(...this.fichierData.slice(0, 5).map(row => row.length));
        this.colonnesFichier = Array.from({ length: maxCols }, (_, i) => `Col${i+1}`);
    } else {
        this.colonnesFichier = this.fichierData[headerIndex];
    }
    const debutData = headerIndex + 1;
    let lignesData = this.fichierData.slice(debutData);
    if (this.nbLignes > 0) lignesData = lignesData.slice(0, this.nbLignes);

    const dateOpCol = Object.keys(this.mapping).find(k => this.mapping[k] === 'date_operation');
    const dateValCol = Object.keys(this.mapping).find(k => this.mapping[k] === 'date_valeur');
    const libelleCol = Object.keys(this.mapping).find(k => this.mapping[k] === 'libelle');
    const creditCol = Object.keys(this.mapping).find(k => this.mapping[k] === 'montant_credit');
    const debitCol = Object.keys(this.mapping).find(k => this.mapping[k] === 'montant_debit');
    const soldeCol = Object.keys(this.mapping).find(k => this.mapping[k] === 'solde'); // ← ajout

    this.lignesApercu = lignesData.slice(0, 10).map((row, idx) => {
        let date_op = dateOpCol ? row[this.colonnesFichier.indexOf(dateOpCol)] : '';
        let date_val = dateValCol ? row[this.colonnesFichier.indexOf(dateValCol)] : '';
        let libelle = libelleCol ? row[this.colonnesFichier.indexOf(libelleCol)] : '';
        let credit = creditCol ? parseFloat(row[this.colonnesFichier.indexOf(creditCol)]) : 0;
        let debit = debitCol ? parseFloat(row[this.colonnesFichier.indexOf(debitCol)]) : 0;
        let montant = credit || debit;
        let type = credit ? 'credit' : 'debit';
        let solde = soldeCol ? parseFloat(row[this.colonnesFichier.indexOf(soldeCol)]) : null;
        return { index: idx, date_op, date_val, libelle, montant, type, solde };
    });
    if (soldeCol && lignesData.length) {
        const derniere = lignesData[lignesData.length-1];
        this.soldeReleve = parseFloat(derniere[this.colonnesFichier.indexOf(soldeCol)]);
    }
    },
    previsualiser() { this.genererApercu(); },
    async validerImport() {
      const headerIndex = this.ligneEnTete - 1;
      const headers = (this.ligneEnTete !== 0 && headerIndex >=0 && headerIndex < this.fichierData.length) ? this.fichierData[headerIndex] : [];
      const debutData = headerIndex + 1;
      let lignesData = this.fichierData.slice(debutData);
      if (this.nbLignes > 0) lignesData = lignesData.slice(0, this.nbLignes);
      
      const importId = await db.imports_bancaires.add({
        id: crypto.randomUUID(),
        compte_id: this.compteActifId,
        semaine_id: this.semaineId,
        date_import: new Date().toISOString(),
        nom_fichier: 'import.csv',
        statut: 'brouillon'
      });
      
      const mouvements = [];
      for (let row of lignesData) {
        const getVal = (field) => {
          const colKey = Object.keys(this.mapping).find(k => this.mapping[k] === field);
          if (!colKey) return '';
          const idx = headers.length ? headers.indexOf(colKey) : -1;
          return idx >=0 ? row[idx] : '';
        };
        const date_op = getVal('date_operation');
        const date_val = getVal('date_valeur');
        const libelle = getVal('libelle');
        const credit = parseFloat(getVal('montant_credit')) || 0;
        const debit = parseFloat(getVal('montant_debit')) || 0;
        const montant = credit || debit;
        const type = credit ? 'credit' : 'debit';
        mouvements.push({
          id: crypto.randomUUID(),
          import_id: importId,
          compte_id: this.compteActifId,
          date_operation: date_op,
          date_valeur: date_val,
          libelle: libelle,
          montant: montant,
          devise: this.comptes.find(c => c.id === this.compteActifId).devise,
          type: type,
          poste_id: null,
          caisse_id: null,
          statut: 'brouillon',
          verification: 'pending'
        });
      }
      await db.mouvements_bancaires.bulkAdd(mouvements);
      this.showImportModal = false;
      this.editerImport({ id: importId });
    },
    async editerImport(imp) {
      this.importEnCours = imp;
      this.mouvementsTemp = await db.mouvements_bancaires.where('import_id').equals(imp.id).toArray();
      const compte = this.comptes.find(c => c.id === this.compteActifId);
      const mouvementsPrecedents = await db.mouvements_bancaires.where({ compte_id: this.compteActifId, statut: 'valide' }).toArray();
      let solde = compte.solde_initial;
      for (let m of mouvementsPrecedents) {
        if (m.type === 'credit') solde += m.montant;
        else solde -= m.montant;
      }
      for (let m of this.mouvementsTemp) {
        if (m.type === 'credit') solde += m.montant;
        else solde -= m.montant;
      }
      this.soldeCalcule = solde;
      this.soldeReleve = parseFloat(prompt("Solde final du relevé ?", this.soldeCalcule));
      this.showEditionImport = true;
    },
    isRetraitOuDepot(posteId) {
      const poste = this.postesBudget.find(p => p.id === posteId);
      return poste && (poste.nom === 'Retrait en liquide' || poste.nom === 'Dépôt en liquide');
    },
    async verifierMouvement(mvt) {
      const poste = this.postesBudget.find(p => p.id === mvt.poste_id);
      if (!poste) return;
      if (poste.nom === 'Retrait en liquide' && mvt.caisse_id) {
        const mouvementsCaisse = await db.mouvementsCaisse.where({ sousCaisseId: mvt.caisse_id, type: 'entree', status: 'validé' }).toArray();
        const correspondant = mouvementsCaisse.find(m => Math.abs(m.montant - mvt.montant) < 0.01 && new Date(m.date).toDateString() === new Date(mvt.date_operation).toDateString());
        mvt.verification = correspondant ? 'ok' : 'warning';
      } else if (poste.nom === 'Dépôt en liquide' && mvt.caisse_id) {
        const mouvementsCaisse = await db.mouvementsCaisse.where({ sousCaisseId: mvt.caisse_id, type: 'sortie', status: 'validé' }).toArray();
        const correspondant = mouvementsCaisse.find(m => Math.abs(m.montant - mvt.montant) < 0.01 && new Date(m.date).toDateString() === new Date(mvt.date_operation).toDateString());
        mvt.verification = correspondant ? 'ok' : 'warning';
      } else {
        mvt.verification = 'ok';
      }
      await db.mouvements_bancaires.update(mvt.id, { poste_id: mvt.poste_id, caisse_id: mvt.caisse_id, verification: mvt.verification });
    },
    async validerAffectation() {
      if (Math.abs(this.soldeCalcule - this.soldeReleve) > 0.01) {
        if (!confirm(`Le solde calculé (${this.soldeCalcule}) ne correspond pas au solde du relevé (${this.soldeReleve}). Voulez-vous quand même valider ?`)) return;
      }
      await apiService.modifier('imports_bancaires', this.importEnCours.id, { statut: 'valide' }, { audit: true });
      for (let m of this.mouvementsTemp) {
        await apiService.modifier('mouvements_bancaires', m.id, { statut: 'valide' }, { audit: true });
      }
      alert("Import validé");
      this.showEditionImport = false;
      await this.chargerImports();
    }
  }
};
</script>