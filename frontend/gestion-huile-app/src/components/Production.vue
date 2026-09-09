<template>
  <div class="container-fluid">
    <h2 class="mb-4" style="color: #ED1C24;">Gestion de la production</h2>

    <div class="card mb-4">
      <div class="card-header">
        <i class="bi bi-calendar-week"></i> Choisir une semaine de production
      </div>
      <div class="card-body">
        <select class="form-select" v-model="semaineSelectionnee" @change="onSemaineChange">
          <option v-for="s in semainesDisponibles" :key="s.dateDebut" :value="s.dateDebut">
            {{ s.label }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="semaineEnCours" class="card mb-4">
      <div class="card-header">
        <i class="bi bi-pencil-square"></i> Semaine du {{ formatDate(semaineEnCours.dateDebut) }}
      </div>
      <div class="card-body">
        <form @submit.prevent="enregistrerSemaine">

          <h5 class="text-primary">Suivi quotidien</h5>
          <div class="table-responsive">
            <table class="table table-bordered align-middle">
              <thead class="table-light">
                <tr>
                  <th style="vertical-align: middle;">Date</th>
                  <th style="vertical-align: middle;">Nb travailleurs</th>
                  <th style="vertical-align: middle;">Fruits transformés</th>
                  <th style="vertical-align: middle;">Carburant</th>
                  <th style="vertical-align: middle;"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(jour, jIdx) in joursSuivi" :key="jIdx">
                  <td class="align-middle">
                    <span>{{ formatDateLong(jour.date) }}</span>
                  </td>
                  <td class="align-middle" style="width: 100px;">
                    <input type="number" class="form-control" v-model.number="jour.nbTravailleurs" min="0" step="1"
                          style="width:80px;">
                  </td>
                  <td>
                    <div v-for="(fruit, fIdx) in jour.fruits" :key="fIdx" class="d-flex mb-1">
                      <input type="number" step="1" class="form-control me-1"
                        v-model.number="fruit.fruitsTransformesKg" min="0"
                        placeholder="Quantité de fruit (kg)">
                      <select class="form-select me-1" v-model="fruit.semaineRecolteId"
                              :class="{ 'placeholder-visible': !fruit.semaineRecolteId }">
                        <option value="" disabled selected hidden>Semaine de récolte</option>
                        <option v-for="sr in semainesRecolteRecent" :key="sr.id" :value="sr.id">
                          {{ formatDate(sr.dateDebut) }}
                        </option>
                      </select>
                      <button class="btn btn-outline-danger" type="button"
                        @click="supprimerFruit(jIdx, fIdx)">×</button>
                    </div>
                    <button class="btn btn-sm btn-link" type="button" @click="ajouterFruit(jIdx)">
                      + Ajouter fruits transformés</button>
                  </td>
                  <td>
                    <div v-for="(carb, cIdx) in jour.carburants" :key="cIdx" class="d-flex mb-1">
                      <select class="form-select me-1" v-model="carb.carburant_type_id" required>
                        <option value="" disabled selected hidden>Type de carburant</option>
                        <option v-for="ct in carburantTypes" :key="ct.id" :value="ct.id">{{ ct.nom }}</option>
                      </select>
                      <input type="number" step="1" class="form-control me-1"
                        v-model.number="carb.quantite" min="0" placeholder="Quantité (L)">
                      <select class="form-select me-1" v-model="carb.utilisation_id" required>
                        <option value="" disabled selected hidden>Utilisation</option>
                        <option v-for="u in carburantUtilisations" :key="u.id" :value="u.id">{{ u.nom }}</option>
                      </select>
                      <button class="btn btn-outline-danger" type="button"
                        @click="supprimerCarburant(jIdx, cIdx)">×</button>
                    </div>
                    <button class="btn btn-sm btn-link" type="button" @click="ajouterCarburant(jIdx)">
                      + Ajouter carburant</button>
                  </td>
                  <td class="align-middle">
                    <button type="button" class="btn btn-sm btn-outline-danger"
                      @click="supprimerJourSuivi(jIdx)">🗑️</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h5 class="text-primary mt-4">Production de la semaine</h5>
          <div class="table-responsive">
            <table class="table table-bordered">
              <thead class="table-light">
                <tr>
                  <th>Lot n°</th>
                  <th>Conditionnements</th>
                  <th>Qualité</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(lot, index) in lots" :key="index">
                  <td class="align-middle">
                    <input type="text" class="form-control" v-model="lot.numeroLot" placeholder="ex: 160326-1" readonly>
                    <div class="mt-1 text-end"><strong>Volume total :</strong> {{ calculerVolumeLot(lot) }} L</div>
                  </td>
                  <td>
                    <div v-for="(ligne, lIdx) in lot.conditionnementLignes" :key="lIdx" class="d-flex mb-1">
                      <select class="form-select form-select-sm" v-model="ligne.conditionnementId" required>
                        <option v-for="cond in conditionnementsDisponibles" :key="cond.id" :value="cond.id">
                          {{ cond.nom }} ({{ cond.capaciteL }}L)
                        </option>
                      </select>
                      <input type="number" class="form-control me-1" v-model.number="ligne.quantite" 
                            min="1" step="1" placeholder="Qté">
                      <button class="btn btn-outline-danger" type="button"
                              @click="supprimerLigneLot(index, lIdx)">×</button>
                    </div>
                    <button class="btn btn-sm btn-link" type="button"
                            @click="ajouterLigneLot(index)">+ Ajouter un conditionnement</button>
                  </td>
                  <td>
                    <div class="row">
                      <div class="col-6"><label>Taux acidité</label>
                        <input type="number" step="0.1" class="form-control" v-model.number="lot.tauxAcidite" min="0">
                      </div>
                      <div class="col-6"><label>Note goût (1-10)</label>
                        <input type="number" class="form-control" v-model.number="lot.noteGout" min="1" max="10">
                      </div>
                      <div class="col-6 mt-2"><label>Note odeur (1-10)</label>
                        <input type="number" class="form-control" v-model.number="lot.noteOdeur" min="1" max="10">
                      </div>
                      <div class="col-6 mt-2"><label>Note couleur (1-10)</label>
                        <input type="number" class="form-control" v-model.number="lot.noteCouleur" min="1" max="10">
                      </div>
                    </div>
                  </td>
                  <td class="align-middle">
                    <button type="button" class="btn btn-sm btn-outline-danger"
                      @click="supprimerLot(index)">🗑️</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <button type="button" class="btn btn-secondary mb-3" @click="ajouterLot">Ajouter un lot</button>

          <div class="mt-3">
            <button type="submit" class="btn btn-success">
              <i class="bi bi-check-circle"></i> Enregistrer la semaine
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span><i class="bi bi-list"></i> Historique des semaines de production</span>
        <div>
          <label class="me-2">Année :</label>
          <select class="form-select w-auto d-inline-block" v-model="anneeHistorique" @change="mettreAJourHistorique">
            <option v-for="a in anneesDisponiblesHistorique" :key="a" :value="a">{{ a }}</option>
          </select>
          <button v-if="historiqueLimit < historiqueComplet.length" class="btn btn-sm btn-outline-secondary ms-2" @click="chargerPlusHistorique">
            Voir plus (+20)
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead>
              <tr>
                <th @click="tri('dateDebut')" style="cursor: pointer;">Semaine</th>
                <th class="text-center" @click="tri('poidsFruits')" style="cursor: pointer;">
                  Poids de fruit<br>transformé (kg)
                </th>
                <th class="text-center" @click="tri('volumeHuile')" style="cursor: pointer;">
                  Volume d'huile<br>produit (L)
                </th>
                <th v-for="ct in carburantsUtilises" :key="ct.id" class="text-center" @click="tri('conso_' + ct.id)" style="cursor: pointer;">
                  {{ ct.nom }} consommé (L)
                </th>
                <th class="text-center" @click="tri('tauxHuilerie')" style="cursor: pointer;">
                  Taux extract.<br>huilerie (%)
                </th>
                <th class="text-center" @click="tri('productivite')" style="cursor: pointer;">
                  Productivité<br>(L/hj)
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in historiqueAffiche" :key="s.id">
                <td>{{ formatDate(s.dateDebut) }}</td>
                <td class="text-center">{{ totalFruitsParSemaine[s.id] || 0 }}</td>
                <td class="text-center">{{ totalHuileParSemaine[s.id] || 0 }}</td>
                <td v-for="ct in carburantsUtilises" :key="ct.id" class="text-center">
                  {{ consoCarburantParSemaine[ct.id]?.[s.id] || 0 }}
                </td>
                <td class="text-center">{{ tauxHuilerieParSemaine[s.id] || '-' }}</td>
                <td class="text-center">{{ productiviteParSemaine[s.id] || '-' }}</td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-1" @click="modifierSemaine(s)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="supprimerSemaine(s.id)">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="historiqueAffiche.length === 0">
                <td colspan="7" class="text-center">Aucune semaine pour cette année</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span><i class="bi bi-graph-up"></i> Suivi du taux global par semaine de récolte</span>
        <div>
          <label class="me-2">Année :</label>
          <select class="form-select w-auto d-inline-block" v-model="anneeSuiviTaux" @change="calculerSuiviTauxGlobal">
            <option v-for="a in anneesDisponiblesHistorique" :key="a" :value="a">{{ a }}</option>
          </select>
          <button v-if="tauxLimit < tauxComplet.length" class="btn btn-sm btn-outline-secondary ms-2" @click="chargerPlusTaux">
            Voir plus (+20)
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-bordered table-hover">
            <thead>
              <tr>
                <th>Semaine de récolte</th>
                <th class="text-end">Poids récolté (kg)</th>
                <th class="text-end">Volume d'huile obtenu (L)</th>
                <th class="text-end">
                  Taux global (%)
                  <i class="bi bi-info-circle ms-1" style="cursor: help;"
                     title="(Huile en kg / Poids des régimes) × 100.
Avec : 1 L d'huile ≈ 0,9 kg.
L'huile est répartie proportionnellement au poids de fruits transformés
lorsqu'une semaine de production utilise plusieurs semaines de récolte."></i>
                </th>
                <th>Répartition par semaine de production</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in tauxAffiche" :key="row.semaineRecolteId">
                <td>{{ formatDate(row.dateDebut) }}</td>
                <td class="text-end">{{ row.poidsRegimes.toLocaleString('fr-FR') }}</td>
                <td class="text-end">{{ row.huileTotale.toFixed(1) }}</td>
                <td class="text-end">
                  {{ row.tauxGlobal !== null ? row.tauxGlobal.toFixed(2) + '%' : '-' }}
                </td>
                <td>
                  <span v-if="row.details && row.details.length">
                    <span v-for="(d, idx) in row.details" :key="d.semaineProdId">
                      {{ formatDate(d.dateDebut) }} ({{ d.huile.toFixed(1) }} L){{ idx < row.details.length - 1 ? ', ' : '' }}
                    </span>
                  </span>
                  <span v-else class="text-muted">Aucune production liée</span>
                </td>
              </tr>
              <tr v-if="tauxAffiche.length === 0">
                <td colspan="5" class="text-center">Aucune donnée pour cette année</td>
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
  name: 'Production',
  data() {
    return {
      semaines: [],
      semainesRecolte: [],
      semainesDisponibles: [],
      semaineSelectionnee: '',
      semaineEnCours: null,
      joursSemaine: [],
      joursSuivi: [],
      lots: [{
        numeroLot: '',
        conditionnementLignes: [],
        tauxAcidite: null,
        noteGout: null,
        noteOdeur: null,
        noteCouleur: null,
      }],
      carburantTypes: [],
      carburantUtilisations: [],
      totalFruitsParSemaine: {},
      totalHuileParSemaine: {},
      tauxHuilerieParSemaine: {},
      consoCarburantParSemaine: {},
      productiviteParSemaine: {},
      sites: [],
      moyenneGlissante: 0.6,
      triColonne: 'dateDebut',
      triOrdre: 'desc',
      conditionnements: [],
      articlesFourniture: [],
      stocksFournitures: [],
      conditionnementComposants: [],
      conditionnementsDisponibles: [],
      anneeHistorique: new Date().getFullYear(),
      anneeSuiviTaux: new Date().getFullYear(),
      suiviTauxGlobal: [],
      consosCarburantParSemaineAll: [],
      historiqueLimit: 8,
      tauxLimit: 8,
    };
  },
  computed: {
    semainesRecolteRecent() {
      return [...this.semainesRecolte]
        .filter(sr => sr.poidsRegimesTotal > 0)
        .sort((a, b) => new Date(b.dateDebut) - new Date(a.dateDebut))
        .slice(0, 3);
    },
    siteProductionId() {
      const prod = this.sites.find(s => s.estProduction);
      return prod ? prod.id : null;
    },
    carburantsUtilises() {
      const ids = new Set();
      const semainesAnnee = this.semaines.filter(s => {
        return new Date(s.dateDebut).getFullYear() === this.anneeHistorique;
      });
      for (const semaine of semainesAnnee) {
        const consos = this.consosCarburantParSemaineAll.filter(c => c.semaineProdId === semaine.id);
        consos.forEach(c => ids.add(c.carburant_type_id));
      }
      return this.carburantTypes.filter(ct => ids.has(ct.id));
    },
    anneesDisponiblesHistorique() {
      const annees = new Set();
      this.semaines.forEach(s => {
        const annee = new Date(s.dateDebut).getFullYear();
        annees.add(annee);
      });
      this.semainesRecolte.forEach(s => {
        const annee = new Date(s.dateDebut).getFullYear();
        annees.add(annee);
      });
      const anneeCourante = new Date().getFullYear();
      if (!annees.has(anneeCourante)) annees.add(anneeCourante);
      return Array.from(annees).sort();
    },
    historiqueComplet() {
      let result = [...this.semaines];
      result = result.filter(s => new Date(s.dateDebut).getFullYear() === this.anneeHistorique);
      result.sort((a, b) => new Date(b.dateDebut) - new Date(a.dateDebut));
      return result;
    },
    historiqueAffiche() {
      return this.historiqueComplet.slice(0, this.historiqueLimit);
    },
    tauxComplet() {
      let result = [...this.suiviTauxGlobal];
      result = result.filter(r => new Date(r.dateDebut).getFullYear() === this.anneeSuiviTaux);
      result.sort((a, b) => new Date(b.dateDebut) - new Date(a.dateDebut));
      return result;
    },
    tauxAffiche() {
      return this.tauxComplet.slice(0, this.tauxLimit);
    },
  },
  async mounted() {
    await this.chargerSites();
    await this.chargerCarburant();
    await this.chargerConditionnements();
    await this.chargerDonnees();
    this.genererSemainesDisponibles();
    this.selectionnerSemaineCourante();
    const annees = this.anneesDisponiblesHistorique;
    const courante = new Date().getFullYear();
    this.anneeHistorique = annees.includes(courante) ? courante : (annees.length ? annees[annees.length - 1] : courante);
    this.anneeSuiviTaux = this.anneeHistorique;
    this.calculerSuiviTauxGlobal();
  },
  watch: {
    async semaineSelectionnee(newVal) {
      if (newVal) {
        await this.chargerOuCreerSemaine(newVal);
      }
    },
  },
  methods: {
    async chargerCarburant() {
      this.carburantTypes = await db.carburant_types.toArray();
      this.carburantUtilisations = await db.carburant_utilisations.toArray();
    },
    async chargerSites() {
      this.sites = await db.sites.toArray() || [];
    },
    async chargerDonnees() {
      this.semaines = await db.semaines_production.toArray() || [];
      this.semaines.sort((a, b) => new Date(b.dateDebut) - new Date(a.dateDebut));
      this.semainesRecolte = await db.semaines_recolte.toArray() || [];
      this.consosCarburantParSemaineAll = await db.production_consommation_carburant.toArray() || [];
      await this.calculerMoyenneGlissante();
      await this.calculerTousLesTaux();
    },
    async chargerConditionnements() {
      this.conditionnements = await db.conditionnements.toArray();
      this.articlesFourniture = await db.articles_fourniture.toArray();
      this.stocksFournitures = await db.stocks_fournitures.toArray();
      this.conditionnementComposants = await db.conditionnement_composants.toArray();
      await this.chargerConditionnementsDisponibles();
    },

    async existeProductionApres(dateDebutStr) {
      const limitDate = new Date(dateDebutStr);
      limitDate.setDate(limitDate.getDate() + 14);
      const prod = await db.semaines_production.where('dateDebut').aboveOrEqual(limitDate.toISOString().slice(0, 10)).first();
      return !!prod;
    },
    async estDefinitiveRecolte(semaineRecolte) {
      return await this.existeProductionApres(semaineRecolte.dateDebut);
    },
    async calculerMoyenneGlissante() {
      const toutesConsos = await db.production_consommation.toArray();
      const definitives = [];
      for (const sr of this.semainesRecolte) {
        if (await this.estDefinitiveRecolte(sr) && sr.poidsRegimesTotal > 0) {
          const totalFruits = toutesConsos
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
    async calculerTousLesTaux() {
      const totalFruits = {};
      const totalHuile = {};
      const tauxHuilerie = {};
      const consoCarburant = {};
      const productivite = {};

      const toutesConsos = await db.production_consommation.toArray() || [];
      const tousLots = await db.production_lot.toArray() || [];

      const consosFruitsBySemaine = {};
      for (const c of toutesConsos) {
        if (!consosFruitsBySemaine[c.semaineProdId]) consosFruitsBySemaine[c.semaineProdId] = [];
        consosFruitsBySemaine[c.semaineProdId].push(c);
      }
      const lotsBySemaine = {};
      for (const l of tousLots) {
        if (!lotsBySemaine[l.semaineProdId]) lotsBySemaine[l.semaineProdId] = [];
        lotsBySemaine[l.semaineProdId].push(l);
      }

      for (const semaine of this.semaines) {
        const consos = consosFruitsBySemaine[semaine.id] || [];
        const lots = lotsBySemaine[semaine.id] || [];

        const fruits = consos.reduce((acc, c) => acc + (c.fruitsTransformesKg || 0), 0);
        const huileL = lots.reduce((acc, l) => acc + (l.volumeHuileL || 0), 0);
        const huileKg = huileL * 0.9;
        totalFruits[semaine.id] = fruits;
        totalHuile[semaine.id] = huileL;

        tauxHuilerie[semaine.id] = fruits > 0 ? ((huileKg / fruits) * 100).toFixed(1) : '-';

        const totalHJ = consos.reduce((acc, c) => acc + (c.nbTravailleurs || 0), 0);
        productivite[semaine.id] = totalHJ > 0 ? (huileL / totalHJ).toFixed(1) : '-';

        const consosCarb = this.consosCarburantParSemaineAll.filter(c => c.semaineProdId === semaine.id);
        for (const c of consosCarb) {
          if (!consoCarburant[c.carburant_type_id]) consoCarburant[c.carburant_type_id] = {};
          consoCarburant[c.carburant_type_id][semaine.id] = (consoCarburant[c.carburant_type_id][semaine.id] || 0) + c.quantite;
        }
      }

      this.totalFruitsParSemaine = totalFruits;
      this.totalHuileParSemaine = totalHuile;
      this.tauxHuilerieParSemaine = tauxHuilerie;
      this.consoCarburantParSemaine = consoCarburant;
      this.productiviteParSemaine = productivite;
    },

    genererSemainesDisponibles() {
      const aujourdhui = new Date();
      const jour = aujourdhui.getDay();
      const diffLundi = (jour === 0 ? 6 : jour - 1);
      const lundiCourant = new Date(aujourdhui);
      lundiCourant.setDate(aujourdhui.getDate() - diffLundi);
      const dateDebutCourante = lundiCourant.toISOString().slice(0, 10);

      const semaines = [];
      for (let i = -10; i <= 0; i++) {
        const lundi = new Date(lundiCourant);
        lundi.setDate(lundiCourant.getDate() + i * 7);
        const dateDebut = lundi.toISOString().slice(0, 10);
        semaines.push({
          dateDebut,
          label: this.formatDate(dateDebut),
        });
      }
      semaines.sort((a, b) => new Date(a.dateDebut) - new Date(b.dateDebut));
      const idx = semaines.length - 1;
      semaines[idx].label += ' (courante)';
      this.semainesDisponibles = semaines;
    },

    selectionnerSemaineCourante() {
      const aujourdhui = new Date();
      const jour = aujourdhui.getDay();
      const diffLundi = (jour === 0 ? 6 : jour - 1);
      const lundiCourant = new Date(aujourdhui);
      lundiCourant.setDate(aujourdhui.getDate() - diffLundi);
      const dateDebutCourante = lundiCourant.toISOString().slice(0, 10);

      const existe = this.semainesDisponibles.some(s => s.dateDebut === dateDebutCourante);
      if (existe) {
        this.semaineSelectionnee = dateDebutCourante;
      } else if (this.semainesDisponibles.length > 0) {
        this.semaineSelectionnee = this.semainesDisponibles[this.semainesDisponibles.length - 1].dateDebut;
      }
    },

    async chargerOuCreerSemaine(dateDebut) {
      const dateFin = this.getDateFinFromDateDebut(dateDebut);
      const lundi = new Date(dateDebut);
      this.joursSemaine = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(lundi);
        d.setDate(lundi.getDate() + i);
        this.joursSemaine.push({ date: d.toISOString().slice(0, 10) });
      }

      const semaineExistante = await db.semaines_production.where('dateDebut').equals(dateDebut).first();
      if (semaineExistante) {
        this.semaineEnCours = { ...semaineExistante };
        const consosFruits = await db.production_consommation.where('semaineProdId').equals(semaineExistante.id).toArray() || [];
        const consosCarb = await db.production_consommation_carburant.where('semaineProdId').equals(semaineExistante.id).toArray() || [];

        const joursMap = new Map();
        for (const js of this.joursSemaine) {
          joursMap.set(js.date, {
            date: js.date,
            nbTravailleurs: null,
            fruits: [],
            carburants: [],
          });
        }
        for (const c of consosFruits) {
          if (!joursMap.has(c.date)) {
            joursMap.set(c.date, { date: c.date, nbTravailleurs: null, fruits: [], carburants: [] });
          }
          const jour = joursMap.get(c.date);
          jour.nbTravailleurs = c.nbTravailleurs || jour.nbTravailleurs;
          jour.fruits.push({
            fruitsTransformesKg: c.fruitsTransformesKg,
            semaineRecolteId: c.semaineRecolteId,
          });
        }
        for (const c of consosCarb) {
          if (!joursMap.has(c.date)) {
            joursMap.set(c.date, { date: c.date, nbTravailleurs: null, fruits: [], carburants: [] });
          }
          joursMap.get(c.date).carburants.push({
            carburant_type_id: c.carburant_type_id,
            quantite: c.quantite,
            utilisation_id: c.utilisation_id,
          });
        }
        this.joursSuivi = Array.from(joursMap.values());

        const lotsExistants = await db.production_lot.where('semaineProdId').equals(semaineExistante.id).toArray() || [];
        this.lots = lotsExistants.map(lp => ({
          numeroLot: lp.numeroLot,
          conditionnementLignes: [{ conditionnementId: lp.conditionnementId, quantite: Math.round(lp.volumeHuileL / (this.conditionnements.find(c => c.id === lp.conditionnementId)?.capaciteL || 1)) }],
          tauxAcidite: lp.tauxAcidite,
          noteGout: lp.noteGout,
          noteOdeur: lp.noteOdeur,
          noteCouleur: lp.noteCouleur,
        }));
      } else {
        this.semaineEnCours = {
          id: null,
          dateDebut,
          dateFin,
          consoGasoilTotal: 0,
          consoEssenceTotal: 0,
        };
        this.joursSuivi = this.joursSemaine.map(js => ({
          date: js.date,
          nbTravailleurs: null,
          fruits: [],
          carburants: [],
        }));
        this.lots = [];
      }
    },
    getDateFinFromDateDebut(dateDebut) {
      const lundi = new Date(dateDebut);
      const dimanche = new Date(lundi);
      dimanche.setDate(lundi.getDate() + 6);
      return dimanche.toISOString().slice(0, 10);
    },
    onSemaineChange() {},

    ajouterFruit(jIdx) {
      this.joursSuivi[jIdx].fruits.push({
        fruitsTransformesKg: null,
        semaineRecolteId: '',
      });
    },
    supprimerFruit(jIdx, fIdx) {
      this.joursSuivi[jIdx].fruits.splice(fIdx, 1);
    },
    ajouterCarburant(jIdx) {
      this.joursSuivi[jIdx].carburants.push({
        carburant_type_id: '',
        quantite: null,
        utilisation_id: '',
      });
    },
    supprimerCarburant(jIdx, cIdx) {
      this.joursSuivi[jIdx].carburants.splice(cIdx, 1);
    },
    supprimerJourSuivi(jIdx) {
      this.joursSuivi.splice(jIdx, 1);
    },

    ajouterLot() {
      const date = new Date(this.semaineEnCours.dateDebut);
      const annee = date.getFullYear().toString().slice(2);
      const mois = (date.getMonth() + 1).toString().padStart(2, '0');
      const jour = date.getDate().toString().padStart(2, '0');
      const baseNum = `${jour}${mois}${annee}`;
      const count = this.lots.length + 1;
      const numero = `${baseNum}-${count}`;

      this.lots.push({
        numeroLot: numero,
        conditionnementLignes: [],
        tauxAcidite: null,
        noteGout: null,
        noteOdeur: null,
        noteCouleur: null,
      });
    },
    ajouterLigneLot(lotIndex) {
      this.lots[lotIndex].conditionnementLignes.push({
        conditionnementId: '',
        quantite: null,
      });
    },
    supprimerLigneLot(lotIndex, ligneIndex) {
      this.lots[lotIndex].conditionnementLignes.splice(ligneIndex, 1);
    },
    supprimerLot(index) {
      this.lots.splice(index, 1);
    },

    async enregistrerSemaine() {
      const semaineData = {
        id: this.semaineEnCours.id || undefined,
        dateDebut: this.semaineEnCours.dateDebut,
        dateFin: this.semaineEnCours.dateFin,
        consoGasoilTotal: 0,
        consoEssenceTotal: 0,
      };

      try {
        let semaineId;
        if (semaineData.id) {
          const anciensLots = await db.production_lot.where('semaineProdId').equals(semaineData.id).toArray();
          for (const ancien of anciensLots) {
            if (ancien.conditionnementId) {
              const cond = this.conditionnements.find(c => c.id === ancien.conditionnementId);
              const qte = Math.round(ancien.volumeHuileL / (cond?.capaciteL || 1));
              const composants = this.conditionnementComposants.filter(c => c.conditionnement_id === cond.id);
              for (const comp of composants) {
                await this.ajusterStockFourniture(comp.article_fourniture_id, this.siteProductionId, qte * comp.quantite);
              }
              await this.modifierStock(this.siteProductionId, ancien.lotId, cond.id, -qte);
            }
          }
          await db.production_consommation.where('semaineProdId').equals(semaineData.id).delete();
          await db.production_consommation_carburant.where('semaineProdId').equals(semaineData.id).delete();
          await db.production_lot.where('semaineProdId').equals(semaineData.id).delete();

          await apiService.modifier('semaines_production', semaineData.id, semaineData);
          semaineId = semaineData.id;
        } else {
          semaineId = await apiService.ajouter('semaines_production', semaineData, { audit: true });
        }

        for (const jour of this.joursSuivi) {
          for (const fruit of jour.fruits) {
            if (fruit.fruitsTransformesKg || fruit.semaineRecolteId) {
              await apiService.ajouter('production_consommation', {
                semaineProdId: semaineId,
                date: jour.date,
                fruitsTransformesKg: fruit.fruitsTransformesKg || 0,
                consoGasoil: 0,
                consoEssence: 0,
                semaineRecolteId: fruit.semaineRecolteId || null,
                nbTravailleurs: jour.nbTravailleurs,
              }, { audit: true });
            }
          }
          for (const carb of jour.carburants) {
            if (carb.carburant_type_id && carb.quantite > 0) {
              await apiService.ajouter('production_consommation_carburant', {
                semaineProdId: semaineId,
                date: jour.date,
                carburant_type_id: carb.carburant_type_id,
                quantite: carb.quantite,
                utilisation_id: carb.utilisation_id,
              });
              await apiService.ajouter('carburant_mouvements', {
                id: crypto.randomUUID(),
                carburant_type_id: carb.carburant_type_id,
                site_id: this.siteProductionId,
                date: jour.date,
                type: 'sortie',
                quantite: carb.quantite,
                utilisation_id: carb.utilisation_id,
                source: 'production',
                reference_id: semaineId,
              }, { audit: true });
              await this.ajusterStockCarburant(carb.carburant_type_id, this.siteProductionId, -carb.quantite);
            }
          }
        }

        for (const lot of this.lots) {
          if (!lot.numeroLot) continue;
          let lotRecord = await db.lots.where('numero').equals(lot.numeroLot).first();
          if (!lotRecord) {
            const newLotId = await apiService.ajouter('lots', {
              numero: lot.numeroLot,
              semaineProdId: semaineId,
              dateCreation: new Date().toISOString(),
            });
            lotRecord = { id: newLotId, numero: lot.numeroLot };
          }

          for (const ligne of lot.conditionnementLignes) {
            if (!ligne.conditionnementId || (ligne.quantite || 0) <= 0) continue;

            const cond = this.conditionnements.find(c => c.id === ligne.conditionnementId);
            if (!cond) continue;

            const volumeTotal = ligne.quantite * cond.capaciteL;

            await apiService.ajouter('production_lot', {
              semaineProdId: semaineId,
              numeroLot: lot.numeroLot,
              date: this.semaineEnCours.dateDebut,
              fruitsTransformesKg: 0,
              semaineRecolteId: null,
              volumeHuileL: volumeTotal,
              conditionnementId: cond.id,
              lotId: lotRecord.id,
              tauxAcidite: lot.tauxAcidite || null,
              noteGout: lot.noteGout || null,
              noteOdeur: lot.noteOdeur || null,
              noteCouleur: lot.noteCouleur || null,
            });

            await this.modifierStock(this.siteProductionId, lotRecord.id, cond.id, ligne.quantite);

            const composants = this.conditionnementComposants.filter(c => c.conditionnement_id === cond.id);
            for (const comp of composants) {
              await this.ajusterStockFourniture(comp.article_fourniture_id, this.siteProductionId, -ligne.quantite * comp.quantite);
            }
          }
        }

        await apiService.ajouter('mouvements', {
          type: 'production',
          date: new Date().toISOString(),
          description: `Production semaine du ${this.semaineEnCours.dateDebut}`,
          statut: 'validé',
        });

        await this.chargerDonnees();
        this.calculerSuiviTauxGlobal();
        alert('Semaine enregistrée');
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement:', error);
        alert('Erreur lors de l\'enregistrement. Voir console.');
      }
    },

    async ajusterStockCarburant(typeId, siteId, delta) {
      let stock = await db.carburant_stocks.where({ carburant_type_id: typeId, site_id: siteId }).first();
      if (stock) {
        stock.quantite += delta;
        if (stock.quantite < 0) stock.quantite = 0;
        await db.carburant_stocks.update(stock.id, stock);
      } else if (delta > 0) {
        await db.carburant_stocks.add({
          id: crypto.randomUUID(),
          carburant_type_id: typeId,
          site_id: siteId,
          quantite: delta,
        });
      }
    },
    async modifierStock(siteId, lotId, conditionnementId, delta) {
      if (!siteId) return;
      let stock = await db.stocks.where({ siteId, lotId, conditionnementId }).first();
      if (stock) {
        stock.quantite += delta;
        if (stock.quantite < 0) stock.quantite = 0;
        await apiService.modifier('stocks', stock.id, stock);
      } else if (delta > 0) {
        await apiService.ajouter('stocks', { siteId, lotId, conditionnementId, quantite: delta });
      }
    },
    async ajusterStockFourniture(articleId, siteId, delta) {
      let stock = this.stocksFournitures.find(s => s.article_id === articleId && s.site_id === siteId);
      if (stock) {
        stock.quantite += delta;
        if (stock.quantite < 0) stock.quantite = 0;
        await db.stocks_fournitures.update(stock.id, { quantite: stock.quantite });
      } else if (delta > 0) {
        const newStock = {
          id: crypto.randomUUID(),
          article_id: articleId,
          site_id: siteId,
          quantite: delta,
        };
        await db.stocks_fournitures.add(newStock);
        this.stocksFournitures.push(newStock);
      }
    },

    async chargerConditionnementsDisponibles() {
      const siteProdId = this.siteProductionId;
      if (!siteProdId) { this.conditionnementsDisponibles = []; return; }

      const stocksSite = this.stocksFournitures.filter(s => s.site_id === siteProdId);

      this.conditionnementsDisponibles = this.conditionnements.map(cond => {
        const comps = this.conditionnementComposants.filter(c => c.conditionnement_id === cond.id);
        if (comps.length === 0) return { ...cond, max: Infinity };

        const maxParComposant = comps.map(comp => {
          const stock = stocksSite.find(s => s.article_id === comp.article_fourniture_id);
          if (!stock || stock.quantite <= 0) return 0;
          return Math.floor(stock.quantite / comp.quantite);
        });
        const max = Math.min(...maxParComposant);
        return { ...cond, max };
      }).filter(cond => cond.max > 0);
    },

    calculerSuiviTauxGlobal() {
      Promise.all([
        db.production_consommation.toArray(),
        db.production_lot.toArray(),
      ]).then(([consosFruits, tousLots]) => {
        const lotsByProd = {};
        for (const l of tousLots) {
          if (!lotsByProd[l.semaineProdId]) lotsByProd[l.semaineProdId] = [];
          lotsByProd[l.semaineProdId].push(l);
        }
        const consosByProd = {};
        for (const c of consosFruits) {
          if (!consosByProd[c.semaineProdId]) consosByProd[c.semaineProdId] = [];
          consosByProd[c.semaineProdId].push(c);
        }

        const recoltes = this.semainesRecolte.filter(s => {
          return new Date(s.dateDebut).getFullYear() === this.anneeSuiviTaux;
        });

        const result = [];
        for (const rec of recoltes) {
          const consosRec = consosFruits.filter(c => c.semaineRecolteId === rec.id);
          if (consosRec.length === 0) {
            result.push({
              semaineRecolteId: rec.id,
              dateDebut: rec.dateDebut,
              poidsRegimes: rec.poidsRegimesTotal || 0,
              huileTotale: 0,
              tauxGlobal: null,
              details: [],
            });
            continue;
          }

          let huileTotaleLitres = 0;
          let huileTotaleKg = 0;
          const details = [];

          for (const c of consosRec) {
            const prodId = c.semaineProdId;
            const poidsFruit = c.fruitsTransformesKg || 0;
            if (poidsFruit === 0) continue;

            const consosProd = consosByProd[prodId] || [];
            const totalFruitsProd = consosProd.reduce((sum, cc) => sum + (cc.fruitsTransformesKg || 0), 0);
            if (totalFruitsProd === 0) continue;

            const lotsProd = lotsByProd[prodId] || [];
            const huileProdLitres = lotsProd.reduce((sum, l) => sum + (l.volumeHuileL || 0), 0);

            const huileLitresAttribuee = (poidsFruit / totalFruitsProd) * huileProdLitres;
            const huileKgAttribuee = huileLitresAttribuee * 0.9;
            huileTotaleLitres += huileLitresAttribuee;
            huileTotaleKg += huileKgAttribuee;

            const semaineProd = this.semaines.find(s => s.id === prodId);
            if (semaineProd) {
              details.push({
                semaineProdId: prodId,
                dateDebut: semaineProd.dateDebut,
                huile: huileLitresAttribuee,
              });
            }
          }

          const taux = rec.poidsRegimesTotal > 0 ? (huileTotaleKg / rec.poidsRegimesTotal) * 100 : null;

          result.push({
            semaineRecolteId: rec.id,
            dateDebut: rec.dateDebut,
            poidsRegimes: rec.poidsRegimesTotal || 0,
            huileTotale: huileTotaleLitres,
            tauxGlobal: taux,
            details: details.sort((a, b) => new Date(a.dateDebut) - new Date(b.dateDebut)),
          });
        }

        this.suiviTauxGlobal = result.sort((a, b) => new Date(b.dateDebut) - new Date(a.dateDebut));
      });
    },

    chargerPlusHistorique() {
      this.historiqueLimit += 20;
    },
    chargerPlusTaux() {
      this.tauxLimit += 20;
    },

    calculerVolumeLot(lot) {
      return lot.conditionnementLignes.reduce((sum, ligne) => {
        if (!ligne.conditionnementId || !ligne.quantite) return sum;
        const cond = this.conditionnements.find(c => c.id === ligne.conditionnementId);
        return sum + (cond ? ligne.quantite * cond.capaciteL : 0);
      }, 0);
    },

    async supprimerSemaine(id) {
      if (!confirm('Supprimer cette semaine de production ?')) return;
      try {
        const lotsProd = await db.production_lot.where('semaineProdId').equals(id).toArray();
        for (const lp of lotsProd) {
          if (lp.conditionnementId) {
            const cond = this.conditionnements.find(c => c.id === lp.conditionnementId);
            const qte = Math.round(lp.volumeHuileL / (cond?.capaciteL || 1));
            const composants = this.conditionnementComposants.filter(c => c.conditionnement_id === cond.id);
            for (const comp of composants) {
              await this.ajusterStockFourniture(comp.article_fourniture_id, this.siteProductionId, qte * comp.quantite);
            }
            await this.modifierStock(this.siteProductionId, lp.lotId, cond.id, -qte);
          }
        }
        await db.production_consommation.where('semaineProdId').equals(id).delete();
        await db.production_consommation_carburant.where('semaineProdId').equals(id).delete();
        await db.production_lot.where('semaineProdId').equals(id).delete();
        await apiService.supprimer('semaines_production', id, { audit: true });
        await this.chargerDonnees();
        this.calculerSuiviTauxGlobal();
        alert('Semaine supprimée');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression');
      }
    },
    modifierSemaine(semaine) {
      this.semaineSelectionnee = semaine.dateDebut;
      this.$nextTick(() => {
        const el = document.querySelector('.card.mb-4');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    },
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
      // rien
    },
  },
};
</script>

<style scoped>
::placeholder {
  color: #6c757d !important;
  opacity: 1;
  font-size: 1rem !important;
}
select.placeholder-visible {
  color: #6c757d !important;
}
select:invalid,
select[data-placeholder] {
  color: #6c757d;
}
option[value=""][disabled] {
  color: #6c757d;
}
input.form-control,
select.form-select {
  font-size: 1rem !important;
}
</style>