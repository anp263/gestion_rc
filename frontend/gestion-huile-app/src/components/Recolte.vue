<template>
  <div class="container-fluid">
    <h2 class="mb-4" style="color: #ED1C24;">Gestion des récoltes</h2>

    <!-- Sélecteur de semaine (10 semaines avant/après) -->
    <div class="card mb-4">
      <div class="card-header">
        <i class="bi bi-calendar-week"></i> Choisir une semaine
      </div>
      <div class="card-body">
        <select class="form-select" v-model="semaineSelectionnee" @change="onSemaineChange">
          <option v-for="s in semainesDisponibles" :key="s.dateDebut" :value="s.dateDebut">
            {{ s.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Formulaire de saisie -->
    <div v-if="semaineEnCours" class="card mb-4" ref="formulaireRecolte">
      <div class="card-header">
        <i class="bi bi-pencil-square"></i> Semaine du {{ formatDate(semaineEnCours.dateDebut) }}
      </div>
      <div class="card-body">
        <form @submit.prevent="enregistrerSemaine">
          <h5 class="text-primary">Saisie journalière des récoltes</h5>
          <div class="table-responsive">
            <table class="table table-bordered">
              <thead class="table-light">
                <tr>
                  <th>Jour</th>
                  <th>Parcelle</th>
                  <th>Nb travailleurs</th>
                  <th>Palmiers récoltés</th>
                  <th>Palmiers entretenus</th>
                  <th>Nb régimes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(ligne, index) in saisieLignes" :key="index">
                  <td>
                    <select class="form-select" v-model="ligne.date">
                      <option v-for="jour in joursSemaine" :key="jour.date" :value="jour.date">
                        {{ formatDateLong(jour.date) }}
                      </option>
                    </select>
                  </td>
                  <td>
                    <select class="form-select" v-model="ligne.parcelle">
                      <option value="">-- Sélectionner --</option>
                      <option v-for="p in parcelles" :key="p.nom" :value="p.nom">{{ p.nom }}</option>
                    </select>
                  </td>
                  <td><input type="number" class="form-control" v-model.number="ligne.nbTravailleurs" min="0"></td>
                  <td><input type="number" class="form-control" v-model.number="ligne.nbPalmiersRecoltes" min="0"></td>
                  <td><input type="number" class="form-control" v-model.number="ligne.nbPalmiersEntretenus" min="0"></td>
                  <td><input type="number" class="form-control" v-model.number="ligne.nbRegimes" min="0"></td>
                  <td><button type="button" class="btn btn-sm btn-outline-danger" @click="supprimerLigne(index)">🗑️</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <button type="button" class="btn btn-secondary mb-3" @click="ajouterLigne">Ajouter une ligne</button>

          <div class="row mb-3">
            <div class="col-md-4">
              <label class="form-label">Poids total des régimes (kg) <span class="text-danger">*</span></label>
              <input type="number" step="0.1" class="form-control" v-model.number="semaineEnCours.poidsRegimesTotal" min="0" required>
            </div>
          </div>

          <button type="submit" class="btn btn-success">
            <i class="bi bi-check-circle"></i> Enregistrer la semaine
          </button>
        </form>
      </div>
    </div>

    <!-- Historique -->
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span><i class="bi bi-list"></i> Historique des semaines de récolte</span>
        <div>
          <label class="me-2">Année :</label>
          <select class="form-select w-auto d-inline-block" v-model="anneeHistorique" @change="mettreAJourHistorique">
            <option v-for="a in anneesDisponiblesHistorique" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead>
              <tr>
                <th @click="tri('dateDebut')" style="cursor: pointer;">Semaine</th>
                <th class="text-center" @click="tri('poidsRegimesTotal')" style="cursor: pointer;">Poids total (kg)</th>
                <th class="text-center" @click="tri('surfaceRecoltee')" style="cursor: pointer;">Surface récoltée (ha)</th>
                <th class="text-center" @click="tri('surfaceEntretenue')" style="cursor: pointer;">Surface entretenue (ha)</th>
                <th class="text-center" @click="tri('nbRegimesTotal')" style="cursor: pointer;">Nb régimes</th>
                <th class="text-center" @click="tri('poidsMoyenRegime')" style="cursor: pointer;">Poids moyen (kg)</th>
                <th class="text-center" @click="tri('productiviteHJ')" style="cursor: pointer;">Productivité (hj/tonne)</th>
                <th class="text-center" @click="tri('productiviteRegimeHJ')" style="cursor: pointer;">Productivité (régime/hj)</th>
                <th class="text-center" @click="tri('tauxFruit')" style="cursor: pointer;">Taux fruit/régime (%)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="semaine in semainesTriees" :key="semaine.id">
                <td>{{ formatDate(semaine.dateDebut) }}</td>
                <td class="text-center">{{ formatPoids(semaine.poidsRegimesTotal) }}</td>
                <td class="text-center">{{ surfaceRecoltee(semaine).toFixed(1) }}</td>
                <td class="text-center">{{ surfaceEntretenue(semaine).toFixed(1) }}</td>
                <td class="text-center">{{ semaine.nbRegimesTotal || 0 }}</td>
                <td class="text-center">{{ semaine.poidsMoyenRegime ? semaine.poidsMoyenRegime.toFixed(1) : '-' }}</td>
                <td class="text-center">{{ productiviteHJ(semaine) }}</td>
                <td class="text-center">{{ productiviteRegimeHJ(semaine) }}</td>
                <td class="text-center">{{ tauxFruit(semaine) }}</td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-1" @click="modifierSemaine(semaine)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="supprimerSemaine(semaine.id)">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Suivi des parcelles -->
    <div class="card mt-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span>Suivi des parcelles</span>
        <div>
          <label class="me-2">Année :</label>
          <select class="form-select w-auto d-inline-block" v-model="anneeSuivi" @change="calculerSuiviParcelles">
            <option v-for="a in anneesDisponibles" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-bordered">
            <thead>
              <tr>
                <th>Parcelle</th>
                <th>Surface (ha)</th>
                <th>Récolte totale (tonnes)</th>
                <th>Nb passages</th>
                <th>Rendement (tonnes/ha)</th>
                <th>Surface entretenue (ha/an)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in suiviParcelles" :key="p.nom">
                <td>{{ p.nom }}</td>
                <td>{{ p.surface_ha }}</td>
                <td>{{ p.totalTonnes }}</td>
                <td>{{ p.nbPassages }}</td>
                <td>{{ p.rendement }}</td>
                <td>{{ p.surfaceEntretenue }}</td>
              </tr>
              <tr v-if="suiviParcelles.length === 0">
                <td colspan="6" class="text-center">Aucune donnée pour cette année</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from '../db';
import apiService from '../services/api';

export default {
  name: 'Recolte',
  data() {
    return {
      semaines: [],
      semainesDisponibles: [],
      semaineSelectionnee: '',
      semaineEnCours: null,
      saisieLignes: [],
      joursSemaine: [],
      parcelles: [],
      consommations: [],
      saisieLignesAll: [],
      moyenneGlissante: 0.6,
      triColonne: 'dateDebut',
      triOrdre: 'desc',
      tauxMap: {},
      definitiveMap: {},
      suiviParcelles: [],
      anneeSuivi: new Date().getFullYear(),
      anneeHistorique: new Date().getFullYear(),
    };
  },
  computed: {
    semainesTriees() {
      let result = [...this.semaines];
      
      // Filtrage par année pour l'historique
      result = result.filter(s => {
        const annee = new Date(s.dateDebut).getFullYear();
        return annee === this.anneeHistorique;
      });

      const colonne = this.triColonne;
      const ordre = this.triOrdre;

      if (colonne === 'surfaceRecoltee') {
        result.sort((a, b) => {
          const valA = this.surfaceRecoltee(a);
          const valB = this.surfaceRecoltee(b);
          return ordre === 'asc' ? valA - valB : valB - valA;
        });
      } else if (colonne === 'surfaceEntretenue') {
        result.sort((a, b) => {
          const valA = this.surfaceEntretenue(a);
          const valB = this.surfaceEntretenue(b);
          return ordre === 'asc' ? valA - valB : valB - valA;
        });
      } else if (colonne === 'productiviteHJ') {
        result.sort((a, b) => {
          const valA = parseFloat(this.productiviteHJ(a)) || 0;
          const valB = parseFloat(this.productiviteHJ(b)) || 0;
          return ordre === 'asc' ? valA - valB : valB - valA;
        });
      } else if (colonne === 'productiviteRegimeHJ') {
        result.sort((a, b) => {
          const valA = parseFloat(this.productiviteRegimeHJ(a)) || 0;
          const valB = parseFloat(this.productiviteRegimeHJ(b)) || 0;
          return ordre === 'asc' ? valA - valB : valB - valA;
        });
      } else if (colonne === 'tauxFruit') {
        result.sort((a, b) => {
          const valA = parseFloat(this.tauxFruit(a)) || 0;
          const valB = parseFloat(this.tauxFruit(b)) || 0;
          return ordre === 'asc' ? valA - valB : valB - valA;
        });
      } else if (colonne === 'dateDebut') {
        result.sort((a, b) => {
          const dateA = new Date(a.dateDebut);
          const dateB = new Date(b.dateDebut);
          return ordre === 'asc' ? dateA - dateB : dateB - dateA;
        });
      } else {
        result.sort((a, b) => {
          let valA = a[colonne];
          let valB = b[colonne];
          if (valA === undefined || valA === null) valA = 0;
          if (valB === undefined || valB === null) valB = 0;
          return ordre === 'asc' ? valA - valB : valB - valA;
        });
      }
      return result;
    },
    anneesDisponibles() {
      const annees = new Set();
      this.semaines.forEach(s => {
        const annee = new Date(s.dateDebut).getFullYear();
        annees.add(annee);
      });
      const anneeCourante = new Date().getFullYear();
      if (!annees.has(anneeCourante)) annees.add(anneeCourante);
      return Array.from(annees).sort();
    },
    anneesDisponiblesHistorique() {
      const annees = new Set();
      this.semaines.forEach(s => {
        const annee = new Date(s.dateDebut).getFullYear();
        annees.add(annee);
      });
      const anneeCourante = new Date().getFullYear();
      if (!annees.has(anneeCourante)) annees.add(anneeCourante);
      return Array.from(annees).sort();
    },
  },
  async mounted() {
    await this.chargerParcelles();
    await this.chargerSemaines();
    await this.chargerConsommations();
    await this.chargerSaisieLignesAll();
    await this.calculerMoyenneGlissante();
    await this.mettreAJourTauxMap();
    this.genererSemainesDisponibles();
    this.selectionnerSemaineCourante();
    this.calculerSuiviParcelles();
    
    // Initialisation des filtres d'année
    if (this.anneesDisponibles.length) {
      const courante = new Date().getFullYear();
      this.anneeSuivi = this.anneesDisponibles.includes(courante) ? courante : this.anneesDisponibles[this.anneesDisponibles.length - 1];
      this.anneeHistorique = this.anneeSuivi;
    }
  },
  watch: {
    async semaineSelectionnee(newVal) {
      if (newVal) {
        await this.chargerOuCreerSemaine(newVal);
      }
    },
  },
  methods: {
    // ----- Chargement -----
    async chargerParcelles() {
      const reg = await db.reglages.where('cle').equals('parcelles').first();
      if (reg && Array.isArray(reg.valeur) && reg.valeur.length > 0) {
        if (typeof reg.valeur[0] === 'string') {
          this.parcelles = reg.valeur.map(nom => ({ nom, surface_m2: 0, gps: '', annee_plantation: null, notes: '' }));
        } else {
          this.parcelles = reg.valeur;
        }
      } else {
        this.parcelles = [{ nom: 'Parcelle A', surface_m2: 0, gps: '', annee_plantation: null, notes: '' }];
      }
    },
    async chargerSemaines() {
      this.semaines = await db.semaines_recolte.toArray() || [];
      this.semaines.sort((a, b) => new Date(b.dateDebut) - new Date(a.dateDebut));
    },
    async chargerConsommations() {
      this.consommations = await db.production_consommation.toArray() || [];
    },
    async chargerSaisieLignesAll() {
      this.saisieLignesAll = await db.recolte_journaliere.toArray() || [];
    },

    // ----- Taux -----
    async existeProductionApres(dateDebutStr) {
      const limitDate = new Date(dateDebutStr);
      limitDate.setDate(limitDate.getDate() + 14);
      const prod = await db.semaines_production.where('dateDebut').aboveOrEqual(limitDate.toISOString().slice(0, 10)).first();
      return !!prod;
    },
    async estDefinitive(semaine) {
      return await this.existeProductionApres(semaine.dateDebut);
    },
    async calculerTaux(semaine) {
      const totalFruits = this.consommations
        .filter(c => c.semaineRecolteId === semaine.id)
        .reduce((acc, c) => acc + (c.fruitsTransformesKg || 0), 0);
      if (semaine.poidsRegimesTotal === 0) return 0;
      const tauxReel = totalFruits / semaine.poidsRegimesTotal;
      if (await this.estDefinitive(semaine)) {
        return tauxReel * 100;
      } else {
        if (totalFruits === 0) {
          return this.moyenneGlissante * 100;
        } else {
          return tauxReel * 100;
        }
      }
    },
    async mettreAJourTauxMap() {
      const newTauxMap = {};
      const newDefinitiveMap = {};
      for (const s of this.semaines) {
        const definitive = await this.estDefinitive(s);
        const taux = await this.calculerTaux(s);
        newTauxMap[s.id] = taux.toFixed(1);
        newDefinitiveMap[s.id] = definitive;
      }
      this.tauxMap = newTauxMap;
      this.definitiveMap = newDefinitiveMap;
    },
    async calculerMoyenneGlissante() {
      const definitives = [];
      for (const sr of this.semaines) {
        if (await this.estDefinitive(sr) && sr.poidsRegimesTotal > 0) {
          const totalFruits = this.consommations
            .filter(c => c.semaineRecolteId === sr.id)
            .reduce((acc, c) => acc + (c.fruitsTransformesKg || 0), 0);
          const taux = totalFruits / sr.poidsRegimesTotal;
          definitives.push({ dateDebut: sr.dateDebut, taux });
        }
      }
      definitives.sort((a, b) => new Date(b.dateDebut) - new Date(a.dateDebut));
      const recentes = definitives.slice(0, 4);
      if (recentes.length === 0) {
        this.moyenneGlissante = 0.6;
      } else {
        const somme = recentes.reduce((acc, r) => acc + r.taux, 0);
        this.moyenneGlissante = somme / recentes.length;
      }
    },

    // ----- Sélecteur de semaine (10 semaines avant/après) -----
    genererSemainesDisponibles() {
      const aujourdhui = new Date();
      const jour = aujourdhui.getDay();
      const diffLundi = (jour === 0 ? 6 : jour - 1);
      const lundiCourant = new Date(aujourdhui);
      lundiCourant.setDate(aujourdhui.getDate() - diffLundi);
      const dateDebutCourante = lundiCourant.toISOString().slice(0, 10);

      // Générer les 10 semaines avant et 10 semaines après
      const semaines = [];
      for (let i = -10; i <= 0; i++) {
        const lundi = new Date(lundiCourant);
        lundi.setDate(lundiCourant.getDate() + i * 7);
        const dateDebut = lundi.toISOString().slice(0, 10);
        semaines.push({
          dateDebut,
          label: `${this.formatDate(dateDebut)}`,
        });
      }
      this.semainesDisponibles = semaines;
    },

    selectionnerSemaineCourante() {
      const aujourdhui = new Date();
      const jour = aujourdhui.getDay();
      const diffLundi = (jour === 0 ? 6 : jour - 1);
      const lundiCourant = new Date(aujourdhui);
      lundiCourant.setDate(aujourdhui.getDate() - diffLundi);
      const dateDebutCourante = lundiCourant.toISOString().slice(0, 10);

      // Vérifier si la semaine courante est dans la liste
      const existe = this.semainesDisponibles.some(s => s.dateDebut === dateDebutCourante);
      if (existe) {
        this.semaineSelectionnee = dateDebutCourante;
      } else if (this.semainesDisponibles.length > 0) {
        // Si absente (cas rare), sélectionner la plus proche (index 10 = semaine courante normalement)
        const idx = this.semainesDisponibles.findIndex(s => s.dateDebut >= dateDebutCourante);
        if (idx >= 0 && idx < this.semainesDisponibles.length) {
          this.semaineSelectionnee = this.semainesDisponibles[idx].dateDebut;
        } else {
          this.semaineSelectionnee = this.semainesDisponibles[0].dateDebut;
        }
      }
    },

    async chargerOuCreerSemaine(dateDebut) {
      const semaineExistante = await db.semaines_recolte.where('dateDebut').equals(dateDebut).first();
      const dateFin = this.getDateFinFromDateDebut(dateDebut);
      const lundi = new Date(dateDebut);
      this.joursSemaine = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(lundi);
        d.setDate(lundi.getDate() + i);
        this.joursSemaine.push({ date: d.toISOString().slice(0, 10) });
      }

      if (semaineExistante) {
        this.semaineEnCours = { ...semaineExistante };
        const lignes = await db.recolte_journaliere.where('semaineId').equals(semaineExistante.id).toArray();
        this.saisieLignes = lignes.map(l => ({ ...l }));
      } else {
        this.semaineEnCours = {
          id: null,
          dateDebut,
          dateFin,
          poidsRegimesTotal: 0,
          nbRegimesTotal: 0,
          nbPalmiersEntretenusTotal: 0,
          nbPalmiersVisitesTotal: 0,
          poidsMoyenRegime: 0,
          poidsRegimeParPalmier: 0,
        };
        this.saisieLignes = [];
      }
    },
    getDateFinFromDateDebut(dateDebut) {
      const lundi = new Date(dateDebut);
      const dimanche = new Date(lundi);
      dimanche.setDate(lundi.getDate() + 6);
      return dimanche.toISOString().slice(0, 10);
    },
    onSemaineChange() {},

    // ----- Lignes de saisie -----
    ajouterLigne() {
      let defaultDate = this.joursSemaine[0]?.date || '';
      if (this.saisieLignes.length > 0) {
        const dernier = this.saisieLignes[this.saisieLignes.length - 1];
        if (dernier.date) {
          const d = new Date(dernier.date);
          d.setDate(d.getDate() + 1);
          const finSemaine = new Date(this.joursSemaine[6]?.date);
          if (d <= finSemaine) {
            defaultDate = d.toISOString().slice(0, 10);
          } else {
            defaultDate = this.joursSemaine[0]?.date || '';
          }
        }
      }
      this.saisieLignes.push({
        date: defaultDate,
        parcelle: '',
        nbTravailleurs: 0,
        nbPalmiersRecoltes: 0,
        nbPalmiersEntretenus: 0,
        nbRegimes: 0,
      });
    },
    supprimerLigne(index) {
      this.saisieLignes.splice(index, 1);
    },

    // ----- Enregistrement -----
    async enregistrerSemaine() {
      if (!this.semaineEnCours.poidsRegimesTotal || this.semaineEnCours.poidsRegimesTotal <= 0) {
        alert('Le poids total des régimes est obligatoire.');
        return;
      }

      let nbRegimesTotal = 0,
        nbPalmiersEntretenusTotal = 0,
        nbPalmiersVisitesTotal = 0;
      for (const ligne of this.saisieLignes) {
        nbRegimesTotal += ligne.nbRegimes || 0;
        nbPalmiersEntretenusTotal += ligne.nbPalmiersEntretenus || 0;
        nbPalmiersVisitesTotal += ligne.nbPalmiersRecoltes || 0;
      }
      const poidsMoyenRegime = nbRegimesTotal > 0 ? this.semaineEnCours.poidsRegimesTotal / nbRegimesTotal : 0;
      const poidsRegimeParPalmier = nbPalmiersVisitesTotal > 0 ? this.semaineEnCours.poidsRegimesTotal / nbPalmiersVisitesTotal : 0;

      const semaineData = {
        id: this.semaineEnCours.id || undefined,
        dateDebut: this.semaineEnCours.dateDebut,
        dateFin: this.semaineEnCours.dateFin,
        poidsRegimesTotal: this.semaineEnCours.poidsRegimesTotal,
        nbRegimesTotal,
        nbPalmiersEntretenusTotal,
        nbPalmiersVisitesTotal,
        poidsMoyenRegime,
        poidsRegimeParPalmier,
      };

      try {
        let semaineId;
        if (semaineData.id) {
          await apiService.modifier('semaines_recolte', semaineData.id, semaineData);
          semaineId = semaineData.id;
          await db.recolte_journaliere.where('semaineId').equals(semaineId).delete();
        } else {
          semaineId = await apiService.ajouter('semaines_recolte', semaineData, { audit: true });
        }

        for (const ligne of this.saisieLignes) {
          if (ligne.parcelle || ligne.nbTravailleurs || ligne.nbPalmiersRecoltes || ligne.nbPalmiersEntretenus || ligne.nbRegimes) {
            const detail = {
              semaineId,
              date: ligne.date,
              parcelle: ligne.parcelle || '',
              nbTravailleurs: ligne.nbTravailleurs || 0,
              nbPalmiersRecoltes: ligne.nbPalmiersRecoltes || 0,
              nbPalmiersEntretenus: ligne.nbPalmiersEntretenus || 0,
              nbRegimes: ligne.nbRegimes || 0,
            };
            await apiService.ajouter('recolte_journaliere', detail, { audit: true });
          }
        }

        await this.chargerSemaines();
        await this.chargerConsommations();
        await this.chargerSaisieLignesAll();
        await this.calculerMoyenneGlissante();
        await this.mettreAJourTauxMap();
        this.calculerSuiviParcelles();
        alert('Semaine enregistrée');
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement:', error);
        alert('Erreur lors de l\'enregistrement. Voir console.');
      }
    },
    async supprimerSemaine(id) {
      if (!confirm('Supprimer cette semaine de récolte ?')) return;
      try {
        await db.recolte_journaliere.where('semaineId').equals(id).delete();
        await apiService.supprimer('semaines_recolte', id, { audit: true });
        await this.chargerSemaines();
        await this.chargerConsommations();
        await this.chargerSaisieLignesAll();
        await this.calculerMoyenneGlissante();
        await this.mettreAJourTauxMap();
        this.calculerSuiviParcelles();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression');
      }
    },
    modifierSemaine(semaine) {
      this.semaineSelectionnee = semaine.dateDebut;
      this.$nextTick(() => {
        if (this.$refs.formulaireRecolte) {
          this.$refs.formulaireRecolte.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    },

    // ----- Méthodes de calcul pour l'historique -----
    formatPoids(kg) {
      return Math.round(kg).toLocaleString('fr-FR');
    },
    surfaceRecoltee(semaine) {
      const lignes = this.saisieLignesAll.filter(l => l.semaineId === semaine.id);
      const totalPalmiers = lignes.reduce((sum, l) => sum + (l.nbPalmiersRecoltes || 0), 0);
      return totalPalmiers / 143;
    },
    surfaceEntretenue(semaine) {
      const lignes = this.saisieLignesAll.filter(l => l.semaineId === semaine.id);
      const totalPalmiers = lignes.reduce((sum, l) => sum + (l.nbPalmiersEntretenus || 0), 0);
      return totalPalmiers / 143;
    },
    productiviteHJ(semaine) {
      const lignes = this.saisieLignesAll.filter(l => l.semaineId === semaine.id);
      const totalHJ = lignes.reduce((sum, l) => sum + (l.nbTravailleurs || 0), 0);
      const poidsTonnes = (semaine.poidsRegimesTotal || 0) / 1000;
      if (poidsTonnes === 0) return '-';
      return (totalHJ / poidsTonnes).toFixed(1);
    },
    productiviteRegimeHJ(semaine) {
      const lignes = this.saisieLignesAll.filter(l => l.semaineId === semaine.id);
      const totalHJ = lignes.reduce((sum, l) => sum + (l.nbTravailleurs || 0), 0);
      const nbRegimes = semaine.nbRegimesTotal || 0;
      if (totalHJ === 0 || nbRegimes === 0) return '-';
      return (nbRegimes / totalHJ).toFixed(1);
    },
    tauxFruit(semaine) {
      const fruitsTransformes = this.consommations
        .filter(c => c.semaineRecolteId === semaine.id)
        .reduce((sum, c) => sum + (c.fruitsTransformesKg || 0), 0);
      if (fruitsTransformes === 0 || semaine.poidsRegimesTotal === 0) return '-';
      return ((fruitsTransformes / semaine.poidsRegimesTotal) * 100).toFixed(1);
    },

    // ----- Suivi des parcelles -----
    calculerSuiviParcelles() {
      const map = {};
      for (let p of this.parcelles) {
        map[p.nom] = {
          nom: p.nom,
          surface_ha: p.surface_m2 ? (p.surface_m2 / 10000).toFixed(2) : 0,
          totalKg: 0,
          nbPassages: 0,
          surfaceEntretenueHa: 0,
        };
      }

      const semainesAnnee = this.semaines.filter(s => {
        const annee = new Date(s.dateDebut).getFullYear();
        return annee === this.anneeSuivi;
      });

      for (let sem of semainesAnnee) {
        const lignesSem = this.saisieLignesAll.filter(l => l.semaineId === sem.id);
        const parcellesSem = {};
        for (let l of lignesSem) {
          if (!parcellesSem[l.parcelle]) {
            parcellesSem[l.parcelle] = { nbPalmiersRecoltes: 0, nbPalmiersEntretenus: 0, nbRegimes: 0 };
          }
          parcellesSem[l.parcelle].nbPalmiersRecoltes += l.nbPalmiersRecoltes || 0;
          parcellesSem[l.parcelle].nbPalmiersEntretenus += l.nbPalmiersEntretenus || 0;
          parcellesSem[l.parcelle].nbRegimes += l.nbRegimes || 0;
        }
        for (let [nom, data] of Object.entries(parcellesSem)) {
          if (map[nom]) {
            if (data.nbPalmiersRecoltes > 0) map[nom].nbPassages++;
            const totalRegimesSem = Object.values(parcellesSem).reduce((s, d) => s + d.nbRegimes, 0);
            if (totalRegimesSem > 0) {
              const part = data.nbRegimes / totalRegimesSem;
              map[nom].totalKg += sem.poidsRegimesTotal * part;
            }
            map[nom].surfaceEntretenueHa += data.nbPalmiersEntretenus / 143;
          }
        }
      }

      this.suiviParcelles = Object.values(map).map(p => ({
        ...p,
        totalTonnes: (p.totalKg / 1000).toFixed(1),
        rendement: p.surface_ha > 0 ? ((p.totalKg / 1000) / p.surface_ha).toFixed(2) : '-',
        surfaceEntretenue: p.surfaceEntretenueHa.toFixed(1),
      }));
    },

    // ----- Utilitaires -----
    tri(colonne) {
      if (this.triColonne === colonne) {
        this.triOrdre = this.triOrdre === 'asc' ? 'desc' : 'asc';
      } else {
        this.triColonne = colonne;
        this.triOrdre = 'desc';
      }
    },
    formatDate(dateString) {
      if (!dateString) return '';
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('fr-FR', options);
    },
    formatDateLong(dateString) {
      if (!dateString) return '';
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('fr-FR', options);
    },
    mettreAJourHistorique() {
      // Forcer le re-tri via le computed (le v-model fait déjà le travail)
      // Cette méthode peut être vide, elle est juste là pour le @change
    },
  },
};
</script>