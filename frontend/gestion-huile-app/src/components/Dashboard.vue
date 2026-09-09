<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4 sticky-selectors">
      <h2 style="color: #ED1C24;">Tableau de bord</h2>
      <div class="d-flex gap-2">
        <select v-model="moisReference" class="form-select" style="width: 150px;" @change="chargerDonnees">
          <option v-for="m in optionsMois" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
        <select v-model="deviseAffichage" class="form-select" style="width: 100px;" @change="chargerDonnees">
          <option value="CDF">CDF</option>
          <option value="USD">USD</option>
        </select>
        <button class="btn btn-outline-primary" @click="exporterVueComplete">
          <i class="bi bi-camera"></i> Exporter tout
        </button>
      </div>
    </div>

    <div id="dashboard-content">
      <!-- INDICATEURS PRINCIPAUX -->
      <div class="row mb-4">

        <!-- 1. Production d'huile -->
        <div class="col-md-6 mb-3">
          <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
              <span><i class="bi bi-droplet"></i> Production d'huile</span>
              <small class="text-muted">{{ periodeProduction }}</small>
          </div>
          <div class="card-body">
              <!-- Barres proportionnelles -->
              <div v-for="item in prodBarres" :key="item.label" class="mb-3">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                      <span class="fw-bold" style="width: 80px;">{{ item.label }} :</span>
                      <span class="text-end" style="width: 150px;">{{ item.actuel }} / {{ item.objectif }} L</span>
                      <div class="d-flex align-items-center" style="width: 60%; margin-left: 10px; position: relative;">
                          <div class="progress-bar-bg" style="width:100%; background:#e9ecef; height:10px; border-radius:5px; position:relative; overflow:hidden;">
                              <div class="progress-bar-fill" :style="{ width: Math.min(item.pct, 100) + '%', backgroundColor: item.couleur }"></div>
                              <div v-if="item.pct > 100" class="progress-bar-overflow" :style="{ width: (item.pct - 100) + '%', backgroundColor: '#dc3545', position: 'absolute', left: '100%', height: '100%' }"></div>
                              <div class="trait-100" style="position:absolute; right:0; top:0; bottom:0; border-left:2px dashed #333;"></div>
                          </div>
                          <span class="ms-2" style="width:50px; text-align:right;">{{ item.pct }}%</span>
                      </div>
                  </div>
              </div>

              <!-- Taux d'extraction -->
              <div class="mt-3">
                <div class="row">
                    <div class="col-6">
                        <h6>Taux d'extraction global mois</h6>
                        <p class="display-6 mb-0" :class="prodTauxGlobal >= objectifTauxGlobalMois ? 'text-success' : 'text-danger'">
                            {{ prodTauxGlobal.toFixed(1) }} %
                        </p>
                        <small>Objectif : {{ objectifTauxGlobalMois.toFixed(1) }} %</small>
                    </div>
                    <div class="col-6">
                        <h6>Taux d'extraction global annuel</h6>
                        <p class="display-6 mb-0" :class="prodTauxAnnuel >= objectifTauxGlobalAnnuel ? 'text-success' : 'text-danger'">
                            {{ prodTauxAnnuel }} %
                        </p>
                        <small>Objectif : {{ objectifTauxGlobalAnnuel }} %</small>
                    </div>
                </div>
            </div>
          </div>
      </div>
        </div>

        <!-- 2. Ventes du mois -->
        <div class="col-md-6 mb-3">
          <div class="card h-100">
          <div class="card-header"><i class="bi bi-cart"></i> Ventes du mois</div>
          <div class="card-body">
              <!-- Volume -->
              <div v-for="item in ventesBarres" :key="'vol-'+item.label" class="mb-3">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                      <span class="fw-bold" style="width: 80px;">{{ item.label }} :</span>
                      <span class="text-end" style="width: 150px;">{{ item.actuel }} / {{ item.objectif }} L</span>
                      <div class="d-flex align-items-center" style="width: 60%; margin-left: 10px; position: relative;">
                          <div class="progress-bar-bg" style="width:100%; background:#e9ecef; height:10px; border-radius:5px; position:relative; overflow:hidden;">
                              <div class="progress-bar-fill" :style="{ width: Math.min(item.pct, 100) + '%', backgroundColor: item.couleur }"></div>
                              <div v-if="item.pct > 100" class="progress-bar-overflow" :style="{ width: (item.pct - 100) + '%', backgroundColor: '#dc3545', position: 'absolute', left: '100%', height: '100%' }"></div>
                              <div class="trait-100" style="position:absolute; right:0; top:0; bottom:0; border-left:2px dashed #333;"></div>
                          </div>
                          <span class="ms-2" style="width:50px; text-align:right;">{{ item.pct }}%</span>
                      </div>
                  </div>
              </div>

              <!-- Prix moyen -->
              <div class="mt-3">
                  <div class="row">
                      <div class="col-6">
                          <h6>Prix moyen mois</h6>
                          <p class="display-6 mb-0" :class="ventesPrixMoyen >= objectifPrixMoyenMois ? 'text-success' : 'text-danger'">
                              {{ formatMontant(ventesPrixMoyen, deviseAffichage) }}
                          </p>
                          <small>Objectif : {{ formatMontant(objectifPrixMoyenMois, deviseAffichage) }}</small>
                      </div>
                      <div class="col-6">
                        <h6>Prix moyen annuel</h6>
                        <p class="display-6 mb-0" :class="ventesPrixMoyenAnnuel >= objectifPrixMoyenAnnuel ? 'text-success' : 'text-danger'">
                            {{ formatMontant(ventesPrixMoyenAnnuel, deviseAffichage) }}
                        </p>
                        <small>Objectif : {{ formatMontant(objectifPrixMoyenAnnuel, deviseAffichage) }}</small>
                    </div>
                  </div>
              </div>
          </div>
      </div>
        </div>

        <!-- 3. Suivi des dépenses -->
        <div class="col-md-6 mb-3">
          <div class="card h-100">
          <div class="card-header"><i class="bi bi-wallet2"></i> Dépenses</div>
          <div class="card-body">
              <div v-for="item in depensesBarres" :key="item.label" class="mb-3">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                      <span class="fw-bold" style="width: 80px;">{{ item.label }} :</span>
                      <span class="text-end" style="width: 150px;">{{ formatMontant(item.actuel, deviseAffichage) }} / {{ formatMontant(item.objectif, deviseAffichage) }}</span>
                      <div class="d-flex align-items-center" style="width: 60%; margin-left: 10px; position: relative;">
                          <div class="progress-bar-bg" style="width:100%; background:#e9ecef; height:10px; border-radius:5px; position:relative; overflow:hidden;">
                              <div class="progress-bar-fill" :style="{ width: Math.min(item.pct, 100) + '%', backgroundColor: item.couleur }"></div>
                              <div v-if="item.pct > 100" class="progress-bar-overflow" :style="{ width: (item.pct - 100) + '%', backgroundColor: '#dc3545', position: 'absolute', left: '100%', height: '100%' }"></div>
                              <div class="trait-100" style="position:absolute; right:0; top:0; bottom:0; border-left:2px dashed #333;"></div>
                          </div>
                          <span class="ms-2" style="width:50px; text-align:right;">{{ item.pct }}%</span>
                      </div>
                  </div>
              </div>

              <!-- Dépassements dépenses -->
              <div class="mt-3">
                  <h6>Dépassements du mois</h6>
                  <div v-if="depassementsDepenses.length === 0" class="text-muted">Aucun dépassement</div>
                  <ul v-else class="list-unstyled">
                      <li v-for="d in depassementsDepenses" :key="d.nom">
                          {{ d.nom }} : +{{ d.pctDepassement }}% (+{{ formatMontant(d.montantDepassement, deviseAffichage) }})
                      </li>
                  </ul>
              </div>
          </div>
      </div>
        </div>

        <!-- 4. Émissions CO₂ -->
        <div class="col-md-6 mb-3">
          <div class="card h-100">
            <div class="card-header"><i class="bi bi-cloud"></i> Émissions CO₂</div>
            <div class="card-body">
              <!-- Barres de progression -->
              <div v-for="item in emissionsBarres" :key="item.label" class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <span class="fw-bold" style="width: 80px;">{{ item.label }} :</span>
                  <span class="text-end" style="width: 150px;">{{ item.actuel }} / {{ item.objectif }} kg</span>
                  <div class="d-flex align-items-center" style="width: 60%; margin-left: 10px; position: relative;">
                    <div class="progress-bar-bg" style="width:100%; background:#e9ecef; height:10px; border-radius:5px; position:relative; overflow:hidden;">
                      <div class="progress-bar-fill" :style="{ width: Math.min(item.pct, 100) + '%', backgroundColor: item.couleur }"></div>
                      <div v-if="item.pct > 100" class="progress-bar-overflow" :style="{ width: (item.pct - 100) + '%', backgroundColor: '#dc3545', position: 'absolute', left: '100%', height: '100%' }"></div>
                      <div class="trait-100" style="position:absolute; right:0; top:0; bottom:0; border-left:2px dashed #333;"></div>
                    </div>
                    <span class="ms-2" style="width:50px; text-align:right;">{{ item.pct }}%</span>
                  </div>
                </div>
              </div>

              <!-- Indicateurs complémentaires -->
              <div class="mt-3">
                <div class="row">
                  <div class="col-6">
                    <h6>Émissions par litre (mois)</h6>
                    <p class="display-6 mb-0" :class="emissionsParLitreMois <= objectifEmissionsParLitreMois ? 'text-success' : 'text-danger'">
                      {{ emissionsParLitreMois.toFixed(1) }} kg CO₂ / L
                    </p>
                    <small>Objectif : {{ objectifEmissionsParLitreMois.toFixed(1) }} kg CO₂ / L</small>
                  </div>
                  <div class="col-6">
                    <h6>Émissions par litre (année)</h6>
                    <p class="display-6 mb-0" :class="emissionsParLitreAnnuel <= objectifEmissionsParLitreAnnuel ? 'text-success' : 'text-danger'">
                      {{ emissionsParLitreAnnuel.toFixed(1) }} kg CO₂ / L
                    </p>
                    <small>Objectif : {{ objectifEmissionsParLitreAnnuel.toFixed(1) }} kg CO₂ / L</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>


      <!-- Section Production (accordéon) -->
      <div class="accordion mb-4" id="accordionProduction">
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseProduction">
              <i class="bi bi-tree me-2"></i> Production
            </button>
          </h2>
          <div id="collapseProduction" class="accordion-collapse collapse show" data-bs-parent="#accordionProduction">
            <div class="accordion-body">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <div class="card h-100" id="cardRegimes">
                    <div class="card-header d-flex justify-content-between">
                      <span>Régimes récoltés (kg)</span>
                      <button class="btn btn-sm btn-outline-secondary" @click="exporterGraphique('cardRegimes')"><i class="bi bi-download"></i></button>
                    </div>
                    <div class="card-body"><canvas id="chartRegimes"></canvas></div>
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <div class="card h-100" id="cardHuile">
                    <div class="card-header d-flex justify-content-between">
                      <span>Huile produite (L)</span>
                      <button class="btn btn-sm btn-outline-secondary" @click="exporterGraphique('cardHuile')"><i class="bi bi-download"></i></button>
                    </div>
                    <div class="card-body"><canvas id="chartHuile"></canvas></div>
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <div class="card h-100" id="cardTauxExtraction">
                    <div class="card-header d-flex justify-content-between">
                      <span>Taux extraction huilerie (%)</span>
                      <button class="btn btn-sm btn-outline-secondary" @click="exporterGraphique('cardTauxExtraction')"><i class="bi bi-download"></i></button>
                    </div>
                    <div class="card-body"><canvas id="chartTaux"></canvas></div>
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <div class="card h-100" id="cardTauxGlobal">
                    <div class="card-header d-flex justify-content-between">
                      <span>Taux global (%)</span>
                      <button class="btn btn-sm btn-outline-secondary" @click="exporterGraphique('cardTauxGlobal')"><i class="bi bi-download"></i></button>
                    </div>
                    <div class="card-body"><canvas id="chartTauxGlobal"></canvas></div>
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <div class="card h-100" id="cardTauxFruits">
                    <div class="card-header d-flex justify-content-between">
                      <span>Taux de fruits (%)</span>
                      <button class="btn btn-sm btn-outline-secondary" @click="exporterGraphique('cardTauxFruits')"><i class="bi bi-download"></i></button>
                    </div>
                    <div class="card-body"><canvas id="chartTauxFruits"></canvas></div>
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <div class="card h-100" id="cardQualite">
                    <div class="card-header d-flex justify-content-between">
                      <span>Qualité moyenne (note/10)</span>
                      <button class="btn btn-sm btn-outline-secondary" @click="exporterGraphique('cardQualite')"><i class="bi bi-download"></i></button>
                    </div>
                    <div class="card-body"><canvas id="chartQualite"></canvas></div>
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <div class="card h-100" id="cardAcidite">
                    <div class="card-header d-flex justify-content-between">
                      <span>Taux d'acidité</span>
                      <button class="btn btn-sm btn-outline-secondary" @click="exporterGraphique('cardAcidite')"><i class="bi bi-download"></i></button>
                    </div>
                    <div class="card-body"><canvas id="chartAcidite"></canvas></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section Ventes (accordéon) -->
      <div class="accordion mb-4" id="accordionVentes">
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseVentes">
              <i class="bi bi-cart me-2"></i> Ventes
            </button>
          </h2>
          <div id="collapseVentes" class="accordion-collapse collapse" data-bs-parent="#accordionVentes">
            <div class="accordion-body">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <div class="card h-100" id="cardVentesVolume">
                    <div class="card-header d-flex justify-content-between">
                      <span>Volume par contenant (L)</span>
                      <button class="btn btn-sm btn-outline-secondary" @click="exporterGraphique('cardVentesVolume')"><i class="bi bi-download"></i></button>
                    </div>
                    <div class="card-body"><canvas id="chartVentes"></canvas></div>
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <div class="card h-100" id="cardPrixMoyen">
                    <div class="card-header d-flex justify-content-between">
                      <span>Prix moyen par contenant ({{ deviseAffichage }})</span>
                      <button class="btn btn-sm btn-outline-secondary" @click="exporterGraphique('cardPrixMoyen')"><i class="bi bi-download"></i></button>
                    </div>
                    <div class="card-body"><canvas id="chartPrixMoyen"></canvas></div>
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <div class="card h-100" id="cardClientsActifs">
                    <div class="card-header d-flex justify-content-between">
                      <span>Clients actifs</span>
                      <button class="btn btn-sm btn-outline-secondary" @click="exporterGraphique('cardClientsActifs')"><i class="bi bi-download"></i></button>
                    </div>
                    <div class="card-body"><canvas id="chartPointsVente"></canvas></div>
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <div class="card h-100" id="cardCA">
                    <div class="card-header d-flex justify-content-between">
                      <span>Chiffre d'affaires ({{ deviseAffichage }})</span>
                      <button class="btn btn-sm btn-outline-secondary" @click="exporterGraphique('cardCA')"><i class="bi bi-download"></i></button>
                    </div>
                    <div class="card-body"><canvas id="chartCA"></canvas></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section Environnement & Stocks (accordéon) -->
      <div class="accordion mb-4" id="accordionEnvironnement">
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseEnvironnement">
              <i class="bi bi-globe me-2"></i> Environnement & Stocks
            </button>
          </h2>
          <div id="collapseEnvironnement" class="accordion-collapse collapse" data-bs-parent="#accordionEnvironnement">
            <div class="accordion-body">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <div class="card h-100" id="cardStock">
                    <div class="card-header d-flex justify-content-between">
                      <span>Stock d'huile (L)</span>
                      <button class="btn btn-sm btn-outline-secondary" @click="exporterGraphique('cardStock')"><i class="bi bi-download"></i></button>
                    </div>
                    <div class="card-body"><canvas id="chartStock"></canvas></div>
                  </div>
                </div>
                <div class="col-md-12 mb-3">
                  <div class="card h-100" id="cardEmissionsUsage">
                    <div class="card-header d-flex justify-content-between">
                      <span>Émissions de CO₂ par usage et département</span>
                      <button class="btn btn-sm btn-outline-secondary" @click="exporterGraphique('cardEmissionsUsage')"><i class="bi bi-download"></i></button>
                    </div>
                    <div class="card-body"><canvas id="chartEmissionsUsage"></canvas></div>
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <div class="card h-100" id="cardConsosCarburant">
                    <div class="card-header d-flex justify-content-between">
                      <span>Consommation carburant (L)</span>
                      <button class="btn btn-sm btn-outline-secondary" @click="exporterGraphique('cardConsosCarburant')"><i class="bi bi-download"></i></button>
                    </div>
                    <div class="card-body"><canvas id="chartConsosCarburant"></canvas></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Analyse financière -->
      <div class="row">
        <div class="col-md-12 mb-4">
          <div class="card" id="cardFinances">
            <div class="card-header d-flex justify-content-between">
              <span>Analyse financière - {{ moisReference }}</span>
              <select v-model="projetAnalyseId" class="form-select w-auto">
                <option v-for="p in projetsActifs" :key="p.id" :value="p.id">{{ p.nom }}</option>
              </select>
              <button class="btn btn-sm btn-outline-secondary" @click="exporterGraphique('cardFinances')"><i class="bi bi-download"></i></button>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <table class="table table-sm">
                    <tbody>
                    <tr><th>Volume produit</th><td>{{ formatVolume(volumeProduitMois) }} L</td></tr>
                    <tr><th>Chiffre d'affaires</th><td>{{ formatMontant(chiffreAffairesMois) }}</td></tr>
                    <tr><th>Charges variables</th><td>{{ formatMontant(chargesVariables) }}</td></tr>
                    <tr><th>Charges fixes</th><td>{{ formatMontant(chargesFixes) }}</td></tr>
                    <tr><th>Coût de production total</th><td>{{ formatMontant(coutProduction) }}</td></tr>
                    <tr><th>Coût de revient unitaire</th><td>{{ formatMontant(coutRevientUnitaire) }} / L</td></tr>
                    <tr><th>Marge brute</th><td>{{ formatMontant(margeBrute) }}</td></tr>
                    <tr><th>Résultat net</th><td>{{ formatMontant(resultatNet) }}</td></tr>
                    </tbody>
                  </table>
                </div>
                <div class="col-md-6">
                  <canvas id="chartFinances"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from '../db';
import Chart from 'chart.js/auto';
import html2canvas from 'html2canvas';
import { getDepensesReelles, getBudgetMensuelDepenses, getEcrituresBudget } from '../utils/financeUtils';
import { getTauxPourDate } from '../utils/taux';



export default {
  name: 'Dashboard',
  data() {
    return {
      moisReference: new Date().toISOString().slice(0,7),
      deviseAffichage: 'CDF',
      optionsMois: [],
      projetsActifs: [],
      projetAnalyseId: null,
      conditionnements: [],

      // Production
      prodVolumeMois: 0,
      prodPourcentMois: 0,
      prodCumulAnnee: 0,
      prodPourcentCumul: 0,
      prodPourcentAnnuel: 0,
      prodObjectifAnnuel: 0,
      prodTauxGlobal: 0,
      prodTauxAnnuel: 0,
      periodeProduction: '',

      // Ventes
      ventesVolMois: 0,
      ventesVolPourcentMois: 0,
      ventesVolCumul: 0,
      ventesVolPourcentCumul: 0,
      ventesVolPourcentAnnuel: 0,
      ventesPrixMoyen: 0,
      ventesPrixPourcentMois: 0,
      ventesPrixMoyenAnnuel: 0,
      objectifPrixMoyenAnnuel: 0,

      // Dépenses
      depensesMois: 0,
      depensesPourcentMois: 0,
      depensesCumul: 0,
      depensesPourcentCumul: 0,
      depensesPourcentAnnuel: 0,
      depensesCouleur: 'bg-success',

      // Émissions CO2
      emissionsReellesMois: 0,
      emissionsReellesCumul: 0,
      objectifEmissionsMois: 0,
      objectifEmissionsCumul: 0,
      objectifEmissionsAnnuel: 0,
      emissionsParLitreMois: 0,
      emissionsParLitreAnnuel: 0,
      objectifEmissionsParLitreMois: 0,
      objectifEmissionsParLitreAnnuel: 0,
      emissionsParUsage: [], // pour le graphique

      // Nouveaux objectifs et budgets
      objectifTauxGlobalMois: 0,
      objectifTauxGlobalAnnuel: 0,
      objectifPrixMoyenMois: 0,
      budgetDepensesMois: 0,
      budgetDepensesCumul: 0,
      budgetDepensesAnnuel: 0,
      depassementsDepenses: [],
      depassementsCarburant: [],

      // Tableaux d'objectifs mensuels (pour barres)
      prodObjectifsMensuels: [],
      ventesObjectifsMensuels: [],
      ventesObjectifAnnuel: 0,

      // Analyses financières
      volumeProduitMois: 0,
      chiffreAffairesMois: 0,
      chargesVariables: 0,
      chargesFixes: 0,
      coutProduction: 0,
      coutRevientUnitaire: 0,
      margeBrute: 0,
      resultatNet: 0,

      // Graphiques (instances)
      chartRegimes: null,
      chartHuile: null,
      chartTaux: null,
      chartVentes: null,
      chartTauxGlobal: null,
      chartPointsVente: null,
      chartPrixMoyen: null,
      chartFinances: null,
      chartTauxFruits: null,
      chartQualite: null,
      chartAcidite: null,
      chartStock: null,
      chartConsosCarburant: null,
      chartCA: null,
      exportFontFamily: "'Gilroy', sans-serif",

      // Propriété pour le graphique de stock
      stockHuileActuel: 0,
      tauxChangeAnneeDashboard: [],
    };
  },

  computed: {
    prodBarres() {
        const items = this.genererBarres(
            this.prodVolumeMois,
            this.prodCumulAnnee,
            this.prodCumulAnnee,
            this.prodObjectifsMensuels,
            this.prodObjectifAnnuel
        );
        items.forEach(item => {
            item.couleur = this.getCouleurPourcentage(item.pct, 'revenue');
        });
        return items;
    },
    emissionsBarres() {
        const items = [
            { label: 'Mois', actuel: Math.round(this.emissionsReellesMois), objectif: Math.round(this.objectifEmissionsMois),
              pct: this.objectifEmissionsMois ? Math.round((this.emissionsReellesMois / this.objectifEmissionsMois) * 100) : 0 },
            { label: 'Cumul', actuel: Math.round(this.emissionsReellesCumul), objectif: Math.round(this.objectifEmissionsCumul),
              pct: this.objectifEmissionsCumul ? Math.round((this.emissionsReellesCumul / this.objectifEmissionsCumul) * 100) : 0 },
            { label: 'Année', actuel: Math.round(this.emissionsReellesCumul), objectif: Math.round(this.objectifEmissionsAnnuel),
              pct: this.objectifEmissionsAnnuel ? Math.round((this.emissionsReellesCumul / this.objectifEmissionsAnnuel) * 100) : 0 }
        ];
        items.forEach(item => {
            item.couleur = this.getCouleurPourcentage(item.pct, 'expense');
        });
        return items;
    },
    ventesBarres() {
        const items = this.genererBarres(
            this.ventesVolMois,
            this.ventesVolCumul,
            this.ventesVolCumul,
            this.ventesObjectifsMensuels,
            this.ventesObjectifAnnuel
        );
        items.forEach(item => {
            item.couleur = this.getCouleurPourcentage(item.pct, 'revenue');
        });
        return items;
    },
    depensesBarres() {
        const pctMois = this.budgetDepensesMois ? Math.round((this.depensesMois / this.budgetDepensesMois) * 100) : 0;
        const pctCumul = this.budgetDepensesCumul ? Math.round((this.depensesCumul / this.budgetDepensesCumul) * 100) : 0;
        const pctAnnuel = this.budgetDepensesAnnuel ? Math.round((this.depensesCumul / this.budgetDepensesAnnuel) * 100) : 0;
        return [
            { label: 'Mois', actuel: this.depensesMois, objectif: this.budgetDepensesMois, pct: pctMois, couleur: this.getCouleurPourcentage(pctMois, 'expense') },
            { label: 'Cumul', actuel: this.depensesCumul, objectif: this.budgetDepensesCumul, pct: pctCumul, couleur: this.getCouleurPourcentage(pctCumul, 'expense') },
            { label: 'Année', actuel: this.depensesCumul, objectif: this.budgetDepensesAnnuel, pct: pctAnnuel, couleur: this.getCouleurPourcentage(pctAnnuel, 'expense') }
        ];
    },
  },

  methods: {
    /* ========== MÉTHODES GÉNÉRALES ========== */
    genererOptionsMois() {
      const aujourdhui = new Date();
      this.optionsMois = [];
      for (let i = -12; i <= 12; i++) {
        const d = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() + i, 1);
        const value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        const label = d.toLocaleDateString('fr-FR', { month: 'long', year: '2-digit' });
        this.optionsMois.push({ value, label });
      }
      this.moisReference = this.optionsMois.find(o => o.value === this.moisReference)?.value || this.optionsMois[12]?.value;
    },

    formatPoids(v) { return Math.round(v).toLocaleString('fr-FR'); },
    formatVolume(v) { return Math.round(v).toLocaleString('fr-FR'); },
    formatNombre(v) { return Math.round(v).toLocaleString('fr-FR'); },
    formatMontant(v, devise) {
      if (v === undefined || v === null) return '0';
      if (devise === 'CDF') {
        return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(v));
      } else {
        return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
      }
    },
    formatMontantCourt(v, devise) {
      return this.formatMontant(v, devise);
    },

    getCouleurPourcentage(pct, type = 'expense') {
        if (type === 'revenue') {
            // production, ventes : vert si >=100, rouge si <100
            return pct >= 100 ? '#28a745' : '#dc3545';
        } else {
            // dépenses, émissions : vert si <=100, rouge si >100
            return pct <= 100 ? '#28a745' : '#dc3545';
        }
    },

    genererBarres(actuelMois, cumulAnnee, actuelAnnuel, objectifsMensuels, objectifAnnuel) {
      const [annee, mois] = this.moisReference.split('-').map(Number);
      const objMois = objectifsMensuels?.[mois - 1] || 0;
      let objCumul = 0;
      for (let m = 1; m <= mois; m++) {
        objCumul += objectifsMensuels?.[m - 1] || 0;
      }
      const pctMois = objMois ? Math.round((actuelMois / objMois) * 100) : 0;
      const pctCumul = objCumul ? Math.round((cumulAnnee / objCumul) * 100) : 0;
      const pctAnnuel = objectifAnnuel ? Math.round((actuelAnnuel / objectifAnnuel) * 100) : 0;

      return [
        { label: 'Mois', actuel: Math.round(actuelMois).toLocaleString('fr-FR'), objectif: Math.round(objMois).toLocaleString('fr-FR'), pct: pctMois, couleur: this.getCouleurPourcentage(pctMois) },
        { label: 'Cumul', actuel: Math.round(cumulAnnee).toLocaleString('fr-FR'), objectif: Math.round(objCumul).toLocaleString('fr-FR'), pct: pctCumul, couleur: this.getCouleurPourcentage(pctCumul) },
        { label: 'Année', actuel: Math.round(actuelAnnuel).toLocaleString('fr-FR'), objectif: Math.round(objectifAnnuel || 0).toLocaleString('fr-FR'), pct: pctAnnuel, couleur: this.getCouleurPourcentage(pctAnnuel) }
      ];
    },

    /* ========== CHARGEMENT DES DONNÉES ========== */
    async chargerDonnees() {
        const [annee, mois] = this.moisReference.split('-').map(Number);
        const debutMois = new Date(annee, mois - 1, 1);
        const finMois = new Date(annee, mois, 0);

        // Charger les taux de change mensuels pour la conversion monétaire
        this.tauxChangeAnneeDashboard = await db.taux_change_mensuel.where('annee').equals(annee).toArray();

        // ----- PRODUCTION -----
        const semainesProd = await db.semaines_production.toArray();
        const semainesDuMois = semainesProd.filter(s => {
            const lundi = new Date(s.dateDebut);
            return lundi >= debutMois && lundi <= finMois;
        }).sort((a, b) => new Date(a.dateDebut) - new Date(b.dateDebut));

        if (semainesDuMois.length > 0) {
            const premier = new Date(semainesDuMois[0].dateDebut);
            const dernier = new Date(semainesDuMois[semainesDuMois.length - 1].dateFin);
            this.periodeProduction = `Du ${premier.toLocaleDateString('fr-FR')} au ${dernier.toLocaleDateString('fr-FR')}`;
        } else {
            this.periodeProduction = 'Aucune semaine trouvée';
        }

        const semProdIds = semainesDuMois.map(s => s.id);
        const lotsMois = (await db.production_lot.toArray()).filter(l => semProdIds.includes(l.semaineProdId));
        this.prodVolumeMois = lotsMois.reduce((sum, l) => sum + (l.volumeHuileL || 0), 0);

        // Objectifs de production : on charge Régimes, TauxFruits, TauxExtraction
        const objRegimesDoc = await db.objectifs_mensuels.where({ annee, domaine: 'Regimes' }).and(o => o.vendeur_id === null).first();
        const objTauxFruitsDoc = await db.objectifs_mensuels.where({ annee, domaine: 'TauxFruits' }).and(o => o.vendeur_id === null).first();
        const objTauxExtractionDoc = await db.objectifs_mensuels.where({ annee, domaine: 'TauxExtraction' }).and(o => o.vendeur_id === null).first();

        const regimes = objRegimesDoc?.donnees || Array(12).fill(0);
        const tauxFruits = objTauxFruitsDoc?.donnees || Array(12).fill(0);
        const tauxExtraction = objTauxExtractionDoc?.donnees || Array(12).fill(0);

        // Calculer l'objectif d'huile pour chaque mois : Régimes(kg) * TauxFruits(%) * TauxHuilerie(%) / 10000
        const objHuileCalc = regimes.map((r, idx) => {
            const tf = tauxFruits[idx] || 0;
            const te = tauxExtraction[idx] || 0;
            return Math.round(r * tf * te / 10000);
        });

        this.prodObjectifsMensuels = objHuileCalc;
        this.prodObjectifAnnuel = objHuileCalc.reduce((a, b) => a + b, 0);

        const objHuileMois = objHuileCalc[mois - 1] || 0;
        this.prodPourcentMois = objHuileMois ? Math.round((this.prodVolumeMois / objHuileMois) * 100) : 0;

        let cumulProd = 0;
        for (let m = 1; m <= mois; m++) {
            const debutM = new Date(annee, m - 1, 1);
            const finM = new Date(annee, m, 0);
            const semM = semainesProd.filter(s => {
                const lundi = new Date(s.dateDebut);
                return lundi >= debutM && lundi <= finM;
            });
            const ids = semM.map(s => s.id);
            const lots = (await db.production_lot.toArray()).filter(l => ids.includes(l.semaineProdId));
            cumulProd += lots.reduce((s, l) => s + (l.volumeHuileL || 0), 0);
        }
        this.prodCumulAnnee = cumulProd;
        const cumulObjHuile = objHuileCalc.slice(0, mois).reduce((a, b) => a + b, 0);
        this.prodPourcentCumul = cumulObjHuile ? Math.round((cumulProd / cumulObjHuile) * 100) : 0;
        this.prodPourcentAnnuel = this.prodObjectifAnnuel ? Math.round((cumulProd / this.prodObjectifAnnuel) * 100) : 0;

        // Taux d'extraction global (réel) : volume huile / poids régimes * 100
        const debutStr = debutMois.toISOString().slice(0, 10);
        const finStr = finMois.toISOString().slice(0, 10);
        const semainesRecolteMois = await db.semaines_recolte.where('dateDebut').between(debutStr, finStr, true, true).toArray();
        const totalRegimesKg = semainesRecolteMois.reduce((s, r) => s + (r.poidsRegimesTotal || 0), 0);
        const huileKgMois = this.prodVolumeMois * 0.9;
        this.prodTauxGlobal = totalRegimesKg ? (huileKgMois / totalRegimesKg * 100) : 0;

        // Objectif TauxGlobal (maintenant sauvegardé)
        const objTauxGlobalDoc = await db.objectifs_mensuels.where({ annee, domaine: 'TauxGlobal' }).and(o => o.vendeur_id === null).first();
        const objTauxGlobal = objTauxGlobalDoc?.donnees || Array(12).fill(0);
        this.objectifTauxGlobalMois = objTauxGlobal[mois - 1] || 0;
        this.objectifTauxGlobalAnnuel = (objTauxGlobal.reduce((a,b)=>a+b,0) / 12).toFixed(1);

        // Taux annuel réel
        const maintenant = new Date();
        const ilYa14Jours = new Date(maintenant.getTime() - 14 * 24 * 60 * 60 * 1000);
        let totalHuileKgAnnuel = 0, totalFruitsKgAnnuel = 0;
        const toutesConsos = await db.production_consommation.toArray();
        const tousLots = await db.production_lot.toArray();
        for (const lot of tousLots) {
            const semaine = semainesProd.find(s => s.id === lot.semaineProdId);
            if (semaine && new Date(semaine.dateDebut) <= ilYa14Jours) {
                const huileL = lot.volumeHuileL || 0;
                totalHuileKgAnnuel += huileL * 0.9;
                const consos = toutesConsos.filter(c => c.semaineProdId === lot.semaineProdId);
                totalFruitsKgAnnuel += consos.reduce((s, c) => s + (c.fruitsTransformesKg || 0), 0);
            }
        }
        this.prodTauxAnnuel = totalFruitsKgAnnuel ? ((totalHuileKgAnnuel / totalFruitsKgAnnuel) * 100).toFixed(1) : '0';

        // ----- VENTES -----
        const facturesMois = await db.factures.where('date').between(debutStr, finStr, true, true).toArray();
        let volVentes = 0, caVentesCDF = 0;
        for (const f of facturesMois) {
            const lignes = await db.facture_lignes.where('factureId').equals(f.id).toArray();
            let totalLigneVolume = 0;
            for (const l of lignes) {
                const cont = this.conditionnements.find(c => c.id === l.conditionnementId);
                if (cont) {
                    totalLigneVolume += l.quantite * cont.capaciteL;
                }
            }
            volVentes += totalLigneVolume;
            const tauxMois = (this.tauxChangeAnneeDashboard[mois - 1]?.taux) || 2500;
            caVentesCDF += f.devise === 'CDF' ? f.totalHT : f.totalHT * tauxMois;
        }
        this.ventesVolMois = volVentes;
        this.ventesPrixMoyen = volVentes ? this.convertirMonetaire(caVentesCDF / volVentes, mois - 1) : 0;

        const objVolVentes = (await db.objectifs_mensuels.where({ annee, domaine: 'VolumeVentes' }).and(o => o.vendeur_id === null).first())?.donnees || Array(12).fill(0);
        this.ventesObjectifsMensuels = objVolVentes;
        this.ventesObjectifAnnuel = objVolVentes.reduce((a, b) => a + b, 0);
        this.ventesVolPourcentMois = objVolVentes[mois - 1] ? Math.round((volVentes / objVolVentes[mois - 1]) * 100) : 0;

        let cumulVolVentes = 0, cumulCAVentesCDF = 0;
        for (let m = 1; m <= mois; m++) {
            const debutM = new Date(annee, m - 1, 1).toISOString().slice(0, 10);
            const finM = new Date(annee, m, 0).toISOString().slice(0, 10);
            const fm = await db.factures.where('date').between(debutM, finM, true, true).toArray();
            let volM = 0, caM = 0;
            for (const f of fm) {
                const lignes = await db.facture_lignes.where('factureId').equals(f.id).toArray();
                for (const l of lignes) {
                    const cont = this.conditionnements.find(c => c.id === l.conditionnementId);
                    if (cont) {
                        volM += l.quantite * cont.capaciteL;
                    }
                }
                const tauxMois = (this.tauxChangeAnneeDashboard[m - 1]?.taux) || 2500;
                caM += f.devise === 'CDF' ? f.totalHT : f.totalHT * tauxMois;
            }
            cumulVolVentes += volM;
            cumulCAVentesCDF += caM;
        }
        this.ventesVolCumul = cumulVolVentes;
        this.ventesVolPourcentCumul = objVolVentes.slice(0, mois).reduce((a,b)=>a+b,0) ? Math.round((cumulVolVentes / objVolVentes.slice(0, mois).reduce((a,b)=>a+b,0)) * 100) : 0;
        this.ventesVolPourcentAnnuel = this.ventesObjectifAnnuel ? Math.round((cumulVolVentes / this.ventesObjectifAnnuel) * 100) : 0;
        this.ventesPrixMoyenAnnuel = cumulVolVentes ? this.convertirMonetaire(cumulCAVentesCDF / cumulVolVentes, mois - 1) : 0;

        const objPrixMoyenVente = (await db.objectifs_mensuels.where({ annee, domaine: 'PrixMoyenVente' }).and(o => o.vendeur_id === null).first())?.donnees || Array(12).fill(0);
        const pmMoisCDF = objPrixMoyenVente[mois - 1] || 0;
        this.objectifPrixMoyenMois = this.convertirMonetaire(pmMoisCDF, mois - 1);
        const moyenneAnnuelleCDF = objPrixMoyenVente.reduce((a,b)=>a+b,0) / 12;
        this.objectifPrixMoyenAnnuel = this.convertirMonetaire(moyenneAnnuelleCDF, 0);

        // ----- DÉPENSES -----
        let depensesMoisCDF = await getDepensesReelles(annee, mois, 'CDF');
        let budgetMoisCDF = await getBudgetMensuelDepenses(annee, mois);
        this.depensesMois = this.convertirMonetaire(depensesMoisCDF, mois - 1);
        this.budgetDepensesMois = this.convertirMonetaire(budgetMoisCDF, mois - 1);
        this.depensesPourcentMois = this.budgetDepensesMois ? Math.round((this.depensesMois / this.budgetDepensesMois) * 100) : 0;

        let cumulDepenses = 0, budgetCumul = 0;
        for (let m = 1; m <= mois; m++) {
            let d = await getDepensesReelles(annee, m, 'CDF');
            let b = await getBudgetMensuelDepenses(annee, m);
            cumulDepenses += this.convertirMonetaire(d, m - 1);
            budgetCumul += this.convertirMonetaire(b, m - 1);
        }
        this.depensesCumul = cumulDepenses;
        this.budgetDepensesCumul = budgetCumul;
        this.depensesPourcentCumul = budgetCumul ? Math.round((cumulDepenses / budgetCumul) * 100) : 0;

        const budgetAnnuelDoc = (await db.budget_versions.where('annee').equals(annee).reverse().sortBy('version'))[0];
        let budgetAnnuelCDF = budgetAnnuelDoc ? Object.values(budgetAnnuelDoc.donnees).flat().reduce((acc, val) => acc + (val || 0), 0) : 0;
        this.budgetDepensesAnnuel = this.convertirMonetaire(budgetAnnuelCDF, 0);
        this.depensesPourcentAnnuel = this.budgetDepensesAnnuel ? Math.round((cumulDepenses / this.budgetDepensesAnnuel) * 100) : 0;

        // ----- ÉMISSIONS CO₂ -----
        await this.calculerEmissions();

        // Dépassements
        await this.calculerDepassementsDepenses(annee, mois);
        await this.calculerDepassementsCarburant(annee, mois);

        // Graphiques
        await this.updateCharts();
        await this.calculerAnalyseFinanciere();
    },
    async calculerEmissions() {
        const [annee, mois] = this.moisReference.split('-').map(Number);
        const debutMois = new Date(annee, mois - 1, 1);
        const finMois = new Date(annee, mois, 0, 23, 59, 59);
        const debutStr = debutMois.toISOString().slice(0, 10);
        const finStr = finMois.toISOString().slice(0, 10);

        // Chargement UNIQUE de toutes les tables
        const [carburantTypes, allCarbMvts, allObjectifs, allRegles, allBudgetVersions, allTauxMensuelsData, allLots, allUsages] = await Promise.all([
            db.carburant_types.toArray(),
            db.carburant_mouvements.toArray(),
            db.objectifs_mensuels.toArray(),
            db.regles_emissions_indirectes.toArray(),
            db.budget_versions.toArray(),
            db.taux_change_mensuel.toArray(),
            db.production_lot.toArray(),
            db.carburant_utilisations.toArray()
        ]);

        const facteurs = {};
        carburantTypes.forEach(ct => facteurs[ct.id] = ct.facteur_co2 || 0);

        // 1. Émissions directes – sorties du mois
        const carburantMouvements = allCarbMvts.filter(m => m.type === 'sortie' && m.date >= debutStr && m.date <= finStr);
        let directMois = 0;
        const directParUsage = {};

        for (const mvt of carburantMouvements) {
            if (!mvt.utilisation_id) continue;
            const facteur = facteurs[mvt.carburant_type_id] || 0;
            const kg = mvt.quantite * facteur;
            directMois += kg;
            const usage = allUsages.find(u => u.id === mvt.utilisation_id) || { nom: 'Inconnu', departement: 'Non défini' };
            const dep = usage.departement || 'Non défini';
            const usageNom = usage.nom || 'Inconnu';
            if (!directParUsage[mvt.utilisation_id]) directParUsage[mvt.utilisation_id] = { usageNom, departement: dep, kg: 0 };
            directParUsage[mvt.utilisation_id].kg += kg;
        }

        // 2. Émissions indirectes du mois
        const reglesActives = allRegles.filter(r => r.actif === true);
        let indirectMois = 0;
        const indirectParUsage = {};

        for (const regle of reglesActives) {
            const totalUSD = await this.getTotalDepenseUSD(regle.posteId, annee, mois);
            if (totalUSD === 0) continue;
            let facteurKgCO2ParUSD = 0;
            if (regle.methode === 'direct') facteurKgCO2ParUSD = regle.facteur_direct || 0;
            else if (regle.methode === 'conversion') {
                const ct = carburantTypes.find(c => c.id === regle.carburant_type_id);
                if (ct) facteurKgCO2ParUSD = (regle.volume_par_usd || 0) * (ct.facteur_co2 || 0);
            }
            const ratio = (regle.pourcentage || 100) / 100;
            const kg = totalUSD * ratio * facteurKgCO2ParUSD;
            indirectMois += kg;
            if (kg > 0 && regle.utilisation_id) {
                const usage = allUsages.find(u => u.id === regle.utilisation_id) || { nom: 'Inconnu', departement: 'Non défini' };
                const dep = usage.departement || 'Non défini';
                const usageNom = usage.nom || 'Inconnu';
                if (!indirectParUsage[regle.utilisation_id]) indirectParUsage[regle.utilisation_id] = { usageNom, departement: dep, kg: 0 };
                indirectParUsage[regle.utilisation_id].kg += kg;
            }
        }

        const totalMois = directMois + indirectMois;
        this.emissionsReellesMois = totalMois;

        // 3. Cumul annuel
        let cumul = 0;
        for (let m = 1; m <= mois; m++) {
            const debutM = new Date(annee, m - 1, 1);
            const finM = new Date(annee, m, 0, 23, 59, 59);
            const debutMStr = debutM.toISOString().slice(0, 10);
            const finMStr = finM.toISOString().slice(0, 10);
            const mvtsMois = allCarbMvts.filter(mvt => mvt.type === 'sortie' && mvt.date >= debutMStr && mvt.date <= finMStr);
            let directM = 0;
            for (const mvt of mvtsMois) directM += mvt.quantite * (facteurs[mvt.carburant_type_id] || 0);
            let indirectM = 0;
            for (const regle of reglesActives) {
                const totalUSD = await this.getTotalDepenseUSD(regle.posteId, annee, m);
                let facteur = 0;
                if (regle.methode === 'direct') facteur = regle.facteur_direct || 0;
                else if (regle.methode === 'conversion') {
                    const ct = carburantTypes.find(c => c.id === regle.carburant_type_id);
                    facteur = (regle.volume_par_usd || 0) * (ct?.facteur_co2 || 0);
                }
                indirectM += totalUSD * ((regle.pourcentage || 100) / 100) * facteur;
            }
            cumul += directM + indirectM;
        }
        this.emissionsReellesCumul = cumul;

        // 4. Objectifs directs (dynamiques)
        let objDirectMensuel = 0, objDirectCumul = 0, objDirectAnnuel = 0;
        for (const ct of carburantTypes) {
            const domaine = 'Conso' + ct.nom.charAt(0).toUpperCase() + ct.nom.slice(1);
            const objDoc = allObjectifs.find(o => o.annee === annee && o.domaine === domaine && o.vendeur_id === null);
            const donnees = objDoc?.donnees || Array(12).fill(0);
            const facteur = ct.facteur_co2 || 0;
            for (let m = 1; m <= 12; m++) {
                const kg = (donnees[m-1] || 0) * facteur;
                objDirectAnnuel += kg;
                if (m === mois) objDirectMensuel += kg;
                if (m <= mois) objDirectCumul += kg;
            }
        }

        // 5. Objectifs indirects (budget)
        let objIndirectMensuel = 0, objIndirectCumul = 0, objIndirectAnnuel = 0;
        const budgetVersion = allBudgetVersions.filter(v => v.annee === annee).sort((a,b) => b.version - a.version)[0];
        if (budgetVersion) {
            const budgetDonnees = budgetVersion.donnees;
            const tauxMensuels = allTauxMensuelsData.filter(t => t.annee === annee);
            const tauxParMois = Array(12).fill(2500);
            tauxMensuels.forEach(t => tauxParMois[t.mois - 1] = t.taux);

            for (const regle of reglesActives) {
                let facteur = 0;
                if (regle.methode === 'direct') facteur = regle.facteur_direct || 0;
                else if (regle.methode === 'conversion') {
                    const ct = carburantTypes.find(c => c.id === regle.carburant_type_id);
                    facteur = (regle.volume_par_usd || 0) * (ct?.facteur_co2 || 0);
                }
                for (let m = 1; m <= 12; m++) {
                    const budgetCDF = (budgetDonnees[regle.posteId] || [])[m-1] || 0;
                    const taux = tauxParMois[m-1] || 2500;
                    const budgetUSD = budgetCDF / taux;
                    const kg = budgetUSD * ((regle.pourcentage || 100) / 100) * facteur;
                    objIndirectAnnuel += kg;
                    if (m === mois) objIndirectMensuel += kg;
                    if (m <= mois) objIndirectCumul += kg;
                }
            }
        }

        this.objectifEmissionsMois = objDirectMensuel + objIndirectMensuel;
        this.objectifEmissionsCumul = objDirectCumul + objIndirectCumul;
        this.objectifEmissionsAnnuel = objDirectAnnuel + objIndirectAnnuel;

        // 6. Émissions par litre d'huile produit
        const lotsMois = allLots.filter(l => l.date >= debutStr && l.date <= finStr);
        const volumeHuile = lotsMois.reduce((sum, lot) => sum + (lot.volumeHuileL || 0), 0);

        // Mensuel
        this.emissionsParLitreMois = volumeHuile ? (totalMois / volumeHuile) : 0;
        // Annuel : cumul des émissions / cumul production depuis janvier
        this.emissionsParLitreAnnuel = this.prodCumulAnnee ? (this.emissionsReellesCumul / this.prodCumulAnnee) : 0;

        // Objectifs d'émissions par litre
        const objHuileMois = this.prodObjectifsMensuels[mois - 1] || 0;
        this.objectifEmissionsParLitreMois = objHuileMois ? (this.objectifEmissionsMois / objHuileMois) : 0;
        this.objectifEmissionsParLitreAnnuel = this.prodObjectifAnnuel ? (this.objectifEmissionsAnnuel / this.prodObjectifAnnuel) : 0;

        // 7. Graphique par usage/département
        const usageMap = {};
        [directParUsage, indirectParUsage].forEach(par => {
            Object.entries(par).forEach(([usageId, data]) => {
                if (!usageMap[usageId]) usageMap[usageId] = { usage: data.usageNom, departements: {} };
                usageMap[usageId].departements[data.departement] = (usageMap[usageId].departements[data.departement] || 0) + data.kg;
            });
        });
        this.emissionsParUsage = Object.values(usageMap)
            .filter(u => Object.values(u.departements).reduce((a,b) => a+b, 0) > 0)
            .map(u => ({
                usage: u.usage,
                departements: u.departements,
                totalKg: Object.values(u.departements).reduce((a,b) => a+b, 0)
            }));

        this.renderEmissionsUsageChart();
    },
    async getTotalDepenseUSD(posteId, annee, mois) {
        const { caisse, banque, manuelles } = await getEcrituresBudget(annee, mois);
        let totalUSD = 0;
        const poste = await db.postes_budgetaires.get(posteId);
        if (!poste) return 0;

        for (const mvt of caisse) {
            if (mvt.poste === poste.nom && mvt.type === 'sortie') {
                totalUSD += mvt.devise === 'USD' ? mvt.montant : (mvt.montantCdf / (await getTauxPourDate(mvt.date)));
            }
        }
        for (const mvt of banque) {
            if (mvt.posteId === posteId && mvt.type === 'sortie') {
                totalUSD += mvt.devise === 'USD' ? mvt.montant : (mvt.montantCdf / (await getTauxPourDate(mvt.date)));
            }
        }
        for (const mvt of manuelles) {
            if (mvt.poste === poste.nom && mvt.type === 'sortie') {
                totalUSD += mvt.devise === 'USD' ? mvt.montant : (mvt.montantCdf / (await getTauxPourDate(mvt.date)));
            }
        }
        return totalUSD;
    },

    /* ========== DÉPASSEMENTS ========== */
    async calculerDepassementsDepenses(annee, mois) {
      const postes = await db.postes_budgetaires.where({ type: 'sortie', actif: true }).toArray();
      const postesFiltres = postes.filter(p => !p.systeme);
      const { caisse, banque, manuelles } = await getEcrituresBudget(annee, mois);

      const depensesParPoste = {};
      for (const mvt of [...caisse, ...banque, ...manuelles]) {
        if (mvt.type !== 'sortie') continue;
        let nomPoste = mvt.poste;
        if (!nomPoste && mvt.posteId) {
          const p = await db.postes_budgetaires.get(mvt.posteId);
          nomPoste = p?.nom;
        }
        if (!nomPoste || !postesFiltres.some(p => p.nom === nomPoste)) continue;
        const montant = mvt.montantCdf || 0;
        depensesParPoste[nomPoste] = (depensesParPoste[nomPoste] || 0) + montant;
      }

      const budgetVersion = (await db.budget_versions.where('annee').equals(annee).reverse().sortBy('version'))[0];
      const budgetDonnees = budgetVersion ? budgetVersion.donnees : {};

      const depassements = [];
      for (const poste of postesFiltres) {
        const reel = depensesParPoste[poste.nom] || 0;
        const prevu = (budgetDonnees[poste.id] || [])[mois - 1] || 0;
        if (reel > prevu && prevu > 0) {
          const depassementPct = Math.round(((reel - prevu) / prevu) * 100);
          if (depassementPct > 5) {
            depassements.push({
              nom: poste.nom,
              pctDepassement: depassementPct,
              montantDepassement: reel - prevu
            });
          }
        }
      }
      depassements.sort((a, b) => b.montantDepassement - a.montantDepassement);
      this.depassementsDepenses = depassements.slice(0, 5);
    },

    async calculerDepassementsCarburant(annee, mois) {
        const debutMois = new Date(annee, mois - 1, 1);
        const finMois = new Date(annee, mois, 0, 23, 59, 59);
        const debutStr = debutMois.toISOString().slice(0, 10);
        const finStr = finMois.toISOString().slice(0, 10);

        // Somme des sorties par type de carburant
        const mouvements = await db.carburant_mouvements
            .where('date').between(debutStr, finStr, true, true)
            .filter(m => m.type === 'sortie')
            .toArray();

        const volsParType = {}; // id -> litres
        mouvements.forEach(m => {
            volsParType[m.carburant_type_id] = (volsParType[m.carburant_type_id] || 0) + m.quantite;
        });

        // Récupérer les objectifs pour chaque type de carburant (on utilise les domaines ConsoGasoil, ConsoEssence)
        const carburantTypes = await db.carburant_types.toArray();
        const result = [];
        for (const ct of carburantTypes) {
            const volumeReel = volsParType[ct.id] || 0;
            // Objectif mensuel pour ce carburant (domaine = 'Conso' + nom)
            const domaine = 'Conso' + ct.nom.charAt(0).toUpperCase() + ct.nom.slice(1); // ex: ConsoGasoil
            const objDoc = (await db.objectifs_mensuels.where({ annee, domaine }).and(o => o.vendeur_id === null).first());
            const obj = objDoc?.donnees?.[mois - 1] || 0;

            if (volumeReel > obj) {
                result.push({
                    nom: ct.nom,
                    depassement: volumeReel - obj,
                    objectif: obj,
                    reel: volumeReel
                });
            }
        }
        this.depassementsCarburant = result;
    },

    /* ========== GRAPHIQUES ========== */
        renderEmissionsUsageChart() {
          const ctx = document.getElementById('chartEmissionsUsage');
          if (!ctx) return;
          // Utilise this.charts.emissionsUsage (comme dans initCharts)
          if (this.charts.emissionsUsage) this.charts.emissionsUsage.destroy();

          const usages = this.emissionsParUsage;
          if (usages.length === 0) return;

          const departementsSet = new Set();
          usages.forEach(u => Object.keys(u.departements).forEach(dep => departementsSet.add(dep)));
          const departements = Array.from(departementsSet).sort();

          const datasets = departements.map(dep => ({
              label: dep,
              data: usages.map(u => u.departements[dep] || 0),
              backgroundColor: this.getCouleurDepartement(dep)
          }));

          this.charts.emissionsUsage = new Chart(ctx, {
              type: 'bar',
              data: {
                  labels: usages.map(u => u.usage),
                  datasets: datasets
              },
              options: {
                  responsive: true,
                  scales: {
                      x: { stacked: true },
                      y: { stacked: true, title: { display: true, text: 'kg CO₂' } }
                  },
                  plugins: {
                      tooltip: {
                          callbacks: {
                              label: (ctx) => `${ctx.dataset.label}: ${Math.round(ctx.raw)} kg`
                          }
                      }
                  }
              }
          });
      },
    getCouleurDepartement(dep) {
        const colors = ['#ED1C24', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c'];
        let hash = 0;
        for (let i = 0; i < dep.length; i++) hash = dep.charCodeAt(i) + ((hash << 5) - hash);
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    },
    getCouleurCarburant(nom) {
        const colors = ['#c0392b', '#2980b9', '#27ae60', '#f39c12', '#8e44ad'];
        let hash = 0;
        for (let i = 0; i < nom.length; i++) hash = nom.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    },
    initCharts() {
      const createChart = (canvasId, config) => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        const existing = Chart.getChart(canvas);
        if (existing) existing.destroy();
        return new Chart(canvas, config);
      };

      const baseConfigs = {
        regimes:      { type: 'line', data: { labels: [], datasets: [{ label: 'Régimes (kg)', data: [] }] } },
        huile:        { type: 'line', data: { labels: [], datasets: [{ label: 'Huile (L)', data: [] }] } },
        taux:         { type: 'line', data: { labels: [], datasets: [{ label: 'Taux huilerie (%)', data: [] }] } },
        ventes:       { type: 'bar', data: { labels: [], datasets: [{ label: '1L', data: [] }, { label: '5L', data: [] }, { label: '25L', data: [] }] }, options: { scales: { x: { stacked: true }, y: { stacked: true } } } },
        tauxGlobal:   { type: 'line', data: { labels: [], datasets: [{ label: 'Taux global (%)', data: [] }] } },
        pointsVente:  { type: 'line', data: { labels: [], datasets: [{ label: 'Clients actifs', data: [] }] } },
        prixMoyen:    { type: 'line', data: { labels: [], datasets: [{ label: '1L', data: [] }, { label: '5L', data: [] }, { label: '25L', data: [] }] } },
        finances:     { type: 'bar', data: { labels: ['CA', 'Coût Prod', 'Marge'], datasets: [{ data: [0,0,0] }] } },
        tauxFruits:   { type: 'line', data: { labels: [], datasets: [{ label: 'Taux de fruits (%)', data: [] }] } },
        qualite:      { type: 'line', data: { labels: [], datasets: [{ label: 'Qualité moyenne', data: [] }] } },
        acidite:      { type: 'line', data: { labels: [], datasets: [{ label: 'Acidité', data: [] }] } },
        stock:        { type: 'line', data: { labels: [], datasets: [{ label: 'Stock (L)', data: [] }] } },
        consosCarburant: { type: 'line', data: { labels: [], datasets: [] } },
        ca:           { type: 'line', data: { labels: [], datasets: [{ label: 'CA', data: [] }] } },
        emissionsUsage: { type: 'bar', data: { labels: [], datasets: [] }, options: { scales: { x: { stacked: true }, y: { stacked: true, title: { display: true, text: 'kg CO₂' } } } } }
      };

      this.charts = {
        regimes: createChart('chartRegimes', baseConfigs.regimes),
        huile: createChart('chartHuile', baseConfigs.huile),
        taux: createChart('chartTaux', baseConfigs.taux),
        ventes: createChart('chartVentes', baseConfigs.ventes),
        tauxGlobal: createChart('chartTauxGlobal', baseConfigs.tauxGlobal),
        pointsVente: createChart('chartPointsVente', baseConfigs.pointsVente),
        prixMoyen: createChart('chartPrixMoyen', baseConfigs.prixMoyen),
        finances: createChart('chartFinances', baseConfigs.finances),
        tauxFruits: createChart('chartTauxFruits', baseConfigs.tauxFruits),
        qualite: createChart('chartQualite', baseConfigs.qualite),
        acidite: createChart('chartAcidite', baseConfigs.acidite),
        stock: createChart('chartStock', baseConfigs.stock),
        consosCarburant: createChart('chartConsosCarburant', baseConfigs.consosCarburant),
        ca: createChart('chartCA', baseConfigs.ca),
        emissionsUsage: createChart('chartEmissionsUsage', baseConfigs.emissionsUsage)
      };
    },

    async updateCharts() {
      const [anneeRef, moisRef] = this.moisReference.split('-').map(Number);
      const moisLabels = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(anneeRef, moisRef - 1 - i, 1);
        moisLabels.push(d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }));
      }

      const regimesData = [], huileData = [], tauxData = [], tauxGlobalData = [], tauxFruitsData = [];
      const pointsVenteData = [], caData = [], qualiteData = [], aciditeData = [], stockData = [];

      // Initialiser les tableaux de volume et prix pour chaque conditionnement
      const ventesParConditionnement = {};
      const prixParConditionnement = {};
      this.conditionnements.forEach(cond => {
        ventesParConditionnement[cond.id] = [];
        prixParConditionnement[cond.id] = [];
      });

      const champMontant = this.deviseAffichage === 'CDF' ? 'montant_cdf' : 'montant_usd';
      const capMap = {};
      this.conditionnements.forEach(cond => { capMap[cond.id] = cond.capaciteL; });

      const objRegimes = (await db.objectifs_mensuels.where({ annee: anneeRef, domaine: 'Regimes' }).and(o => o.vendeur_id === null).first())?.donnees || Array(12).fill(0);
      const objHuile = (await db.objectifs_mensuels.where({ annee: anneeRef, domaine: 'Huile' }).and(o => o.vendeur_id === null).first())?.donnees || Array(12).fill(0);
      const objTauxExtraction = (await db.objectifs_mensuels.where({ annee: anneeRef, domaine: 'TauxExtraction' }).and(o => o.vendeur_id === null).first())?.donnees || Array(12).fill(0);
      const objTauxGlobal = (await db.objectifs_mensuels.where({ annee: anneeRef, domaine: 'TauxGlobal' }).and(o => o.vendeur_id === null).first())?.donnees || Array(12).fill(0);
      const objTauxFruits = (await db.objectifs_mensuels.where({ annee: anneeRef, domaine: 'TauxFruits' }).and(o => o.vendeur_id === null).first())?.donnees || Array(12).fill(0);
      const objQualite = (await db.objectifs_mensuels.where({ annee: anneeRef, domaine: 'Qualite' }).and(o => o.vendeur_id === null).first())?.donnees || Array(12).fill(0);
      const objAcidite = (await db.objectifs_mensuels.where({ annee: anneeRef, domaine: 'Acidite' }).and(o => o.vendeur_id === null).first())?.donnees || Array(12).fill(0);
      const objCA = (await db.objectifs_mensuels.where({ annee: anneeRef, domaine: 'Ventes' }).and(o => o.vendeur_id === null).first())?.donnees || Array(12).fill(0);
      // Conversion des objectifs CA dans la devise d'affichage
      const objCAConverti = objCA.map((val, idx) => {
        const moisAbsolu = moisRef - 1 - (11 - idx);
        return this.convertirMonetaire(val, moisAbsolu);
      });

      for (let i = 0; i < 12; i++) {
        const debut = new Date(anneeRef, moisRef - 1 - (11 - i), 1);
        const fin = new Date(anneeRef, moisRef - (11 - i), 0);
        const debutStr = debut.toISOString().slice(0,10), finStr = fin.toISOString().slice(0,10);

        // ===== Récolte / Production =====
        const recoltes = await db.semaines_recolte.where('dateDebut').between(debutStr, finStr, true, true).toArray();
        regimesData.push(recoltes.reduce((s, r) => s + (r.poidsRegimesTotal || 0), 0));

        const lots = await db.production_lot.where('date').between(debutStr, finStr, true, true).toArray();
        const huileMois = lots.reduce((s, l) => s + (l.volumeHuileL || 0), 0);
        huileData.push(huileMois);

        const consos = await db.production_consommation.where('date').between(debutStr, finStr, true, true).toArray();
        const fruitsKg = consos.reduce((s, c) => s + (c.fruitsTransformesKg || 0), 0);
        const huileKg = huileMois * 0.9;
        tauxData.push(fruitsKg ? (huileKg / fruitsKg) * 100 : 0);
        tauxFruitsData.push(regimesData[i] ? (fruitsKg / regimesData[i]) * 100 : 0);
        tauxGlobalData.push(regimesData[i] ? (huileMois / regimesData[i]) * 100 : 0);

        // ===== Ventes =====
        const facturesMois = await db.factures.where('date').between(debutStr, finStr, true, true).toArray();
        const lignes = [];
        for (const f of facturesMois) {
          const l = await db.facture_lignes.where('factureId').equals(f.id).toArray();
          lignes.push(...l);
        }

        // Pour chaque conditionnement, calculer le volume vendu et le prix moyen unitaire
        for (let cond of this.conditionnements) {
          let volume = 0, quantite = 0, totalPrix = 0;
          for (const l of lignes) {
            if (l.conditionnementId === cond.id) {
              const qte = l.quantite;
              volume += qte * cond.capaciteL;
              quantite += qte;
              totalPrix += l.prixTotal;
            }
          }
          ventesParConditionnement[cond.id].push(volume);
          prixParConditionnement[cond.id].push(quantite ? totalPrix / quantite : 0);
        }

        // Clients actifs
        pointsVenteData.push(new Set(facturesMois.map(f => f.clientId)).size);

        // Chiffre d'affaires
        const mvtCaisse = await db.mouvementsCaisse
          .where('date').between(debutStr, finStr, true, true)
          .and(m => m.status === 'validé' && m.type === 'entree').toArray();
        const mvtBanque = await db.mouvements_bancaires
          .where('date_operation').between(debutStr, finStr, true, true)
          .and(m => m.statut === 'valide' && m.type === 'credit').toArray();
        caData.push(
          mvtCaisse.reduce((s, m) => s + (m[champMontant] || 0), 0) +
          mvtBanque.reduce((s, m) => s + (m[champMontant] || 0), 0)
        );

        // Qualité / acidité
        const notesGout = lots.map(l => l.noteGout).filter(v => v != null);
        const notesOdeur = lots.map(l => l.noteOdeur).filter(v => v != null);
        const notesCouleur = lots.map(l => l.noteCouleur).filter(v => v != null);
        const acidites = lots.map(l => l.tauxAcidite).filter(v => v != null);
        const qualMoy = [...notesGout, ...notesOdeur, ...notesCouleur];
        qualiteData.push(qualMoy.length ? qualMoy.reduce((a,b)=>a+b,0) / qualMoy.length : 0);
        aciditeData.push(acidites.length ? acidites.reduce((a,b)=>a+b,0) / acidites.length : 0);

        // Stock (huile)
        stockData.push(this.stockHuileActuel); // à mettre à jour si besoin de l'historique
      }

      // Construction des datasets pour les graphiques de ventes et prix moyens
      const couleurs = ['#3498db', '#2ecc71', '#e67e22', '#9b59b6', '#1abc9c', '#e74c3c', '#f1c40f'];
      const ventesDatasets = this.conditionnements.map((cond, idx) => ({
        label: cond.nom,
        data: ventesParConditionnement[cond.id],
        backgroundColor: couleurs[idx % couleurs.length]
      }));
      const prixMoyenDatasets = this.conditionnements.map((cond, idx) => ({
        label: cond.nom,
        data: prixParConditionnement[cond.id],
        borderColor: couleurs[idx % couleurs.length],
        tension: 0.1,
        fill: false
      }));

      // ======= Mise à jour des graphiques =======
      const updateChart = (chart, config) => {
        const canvas = chart?.canvas || (chart ? document.getElementById(chart.canvas?.id) : null);
        if (!canvas) return;
        const existing = Chart.getChart(canvas);
        if (existing) existing.destroy();
        return new Chart(canvas, config);
      };

      this.charts.regimes = updateChart(this.charts.regimes, {
        type: 'line', data: { labels: moisLabels, datasets: [
          { label: 'Réalisé', data: regimesData, borderColor: '#ED1C24', tension: 0.1 },
          { label: 'Objectif', data: objRegimes.slice(-12), borderColor: '#aaa', borderDash: [5,5] }
        ] }
      });
      this.charts.huile = updateChart(this.charts.huile, {
        type: 'line', data: { labels: moisLabels, datasets: [
          { label: 'Réalisé', data: huileData, borderColor: '#28a745', tension: 0.1 },
          { label: 'Objectif', data: objHuile.slice(-12), borderColor: '#aaa', borderDash: [5,5] }
        ] }
      });
      this.charts.taux = updateChart(this.charts.taux, {
        type: 'line', data: { labels: moisLabels, datasets: [
          { label: 'Réalisé', data: tauxData, borderColor: '#ffc107', tension: 0.1 },
          { label: 'Objectif', data: objTauxExtraction.slice(-12), borderColor: '#aaa', borderDash: [5,5] }
        ] }
      });
      this.charts.tauxGlobal = updateChart(this.charts.tauxGlobal, {
        type: 'line', data: { labels: moisLabels, datasets: [
          { label: 'Réalisé', data: tauxGlobalData, borderColor: '#9b59b6', tension: 0.1 },
          { label: 'Objectif', data: objTauxGlobal.slice(-12), borderColor: '#aaa', borderDash: [5,5] }
        ] }
      });
      this.charts.tauxFruits = updateChart(this.charts.tauxFruits, {
        type: 'line', data: { labels: moisLabels, datasets: [
          { label: 'Réalisé', data: tauxFruitsData, borderColor: '#e67e22', tension: 0.1 },
          { label: 'Objectif', data: objTauxFruits.slice(-12), borderColor: '#aaa', borderDash: [5,5] }
        ] }
      });
      this.charts.qualite = updateChart(this.charts.qualite, {
        type: 'line', data: { labels: moisLabels, datasets: [
          { label: 'Qualité', data: qualiteData, borderColor: '#1abc9c', tension: 0.1 },
          { label: 'Objectif', data: objQualite.slice(-12), borderColor: '#aaa', borderDash: [5,5] }
        ] }
      });
      this.charts.acidite = updateChart(this.charts.acidite, {
        type: 'line', data: { labels: moisLabels, datasets: [
          { label: 'Acidité', data: aciditeData, borderColor: '#17a2b8', tension: 0.1 },
          { label: 'Objectif', data: objAcidite.slice(-12), borderColor: '#aaa', borderDash: [5,5] }
        ] }
      });
      this.charts.ventes = updateChart(this.charts.ventes, {
        type: 'bar',
        data: { labels: moisLabels, datasets: ventesDatasets },
        options: { responsive: true, scales: { x: { stacked: true }, y: { stacked: true } } }
      });
      this.charts.prixMoyen = updateChart(this.charts.prixMoyen, {
        type: 'line',
        data: { labels: moisLabels, datasets: prixMoyenDatasets }
      });
      this.charts.pointsVente = updateChart(this.charts.pointsVente, {
        type: 'line', data: { labels: moisLabels, datasets: [
          { label: 'Clients actifs', data: pointsVenteData, borderColor: '#1abc9c', tension: 0.1 }
        ] }
      });
      this.charts.ca = updateChart(this.charts.ca, {
        type: 'line', data: { labels: moisLabels, datasets: [
          { label: 'CA', data: caData, borderColor: '#e74c3c', tension: 0.1 },
          { label: 'Objectif', data: objCAConverti, borderColor: '#aaa', borderDash: [5,5] }
        ] }
      });
      this.charts.stock = updateChart(this.charts.stock, {
        type: 'line', data: { labels: moisLabels, datasets: [{ label: 'Stock (L)', data: stockData, borderColor: '#8e44ad', tension: 0.1 }] }
      });

      // Consommations mensuelles par type de carburant (inchangé)
      const carburantTypes = await db.carburant_types.toArray();
      const mouvementsCarburant = await db.carburant_mouvements.toArray();
      const datasetsCarb = [];
      for (const ct of carburantTypes) {
        const data = moisLabels.map((_, index) => {
          const debutM = new Date(anneeRef, moisRef - 1 - (11 - index), 1);
          const finM = new Date(anneeRef, moisRef - (11 - index), 0);
          const debutStr = debutM.toISOString().slice(0,10);
          const finStr = finM.toISOString().slice(0,10);
          return mouvementsCarburant
            .filter(m => m.carburant_type_id === ct.id && m.type === 'sortie' && m.date >= debutStr && m.date <= finStr)
            .reduce((sum, m) => sum + m.quantite, 0);
        });
        datasetsCarb.push({
          label: ct.nom,
          data,
          borderColor: this.getCouleurCarburant(ct.nom),
          fill: false,
          tension: 0.1
        });
      }
      this.charts.consosCarburant = updateChart(this.charts.consosCarburant, {
        type: 'line',
        data: { labels: moisLabels, datasets: datasetsCarb },
        options: { responsive: true, scales: { y: { title: { display: true, text: 'Litres' } } } }
      });

      // finances
      this.charts.finances = updateChart(this.charts.finances, {
        type: 'bar', data: { labels: ['CA', 'Coût Prod', 'Marge'], datasets: [
          { label: 'Montant', data: [this.chiffreAffairesMois, this.coutProduction, this.margeBrute],
            backgroundColor: ['#28a745','#ffc107','#17a2b8'] }
        ] }
      });
    },

    getCouleurConditionnement(nom) {
      const colors = ['#3498db', '#2ecc71', '#e67e22', '#9b59b6'];
      let hash = 0;
      for (let i = 0; i < nom.length; i++) hash = nom.charCodeAt(i) + ((hash << 5) - hash);
      return colors[Math.abs(hash) % colors.length];
    },

    async calculerAnalyseFinanciere() {
      if (!this.projetAnalyseId) return;
      const [annee, mois] = this.moisReference.split('-').map(Number);
      const debutMois = new Date(annee, mois - 1, 1).toISOString().slice(0,10);
      const finMois = new Date(annee, mois, 0).toISOString().slice(0,10);

      const postesExclus = ['Annulation écriture antérieure', 'Récupération sur justification', 'Ajustement clôture', 'Annulation écriture à justifier'];
      const mvtCaisse = await db.mouvementsCaisse
        .where('date').between(debutMois, finMois, true, true)
        .and(m => m.status === 'validé' && !postesExclus.includes(m.posteBudgetaire) && !m.annule && !m.remplaceParCorrection)
        .toArray();
      const mvtBanque = await db.mouvements_bancaires
        .where('date_operation').between(debutMois, finMois, true, true)
        .and(m => m.statut === 'valide').toArray();

      const champMontant = this.deviseAffichage === 'CDF' ? 'montant_cdf' : 'montant_usd';
      const totauxParPoste = {};
      mvtCaisse.forEach(m => {
        const poste = m.posteBudgetaire;
        const montant = m.type === 'entree' ? (m[champMontant] || 0) : -(m[champMontant] || 0);
        totauxParPoste[poste] = (totauxParPoste[poste] || 0) + montant;
      });
      for (const m of mvtBanque) {
        const posteObj = await db.postes_budgetaires.get(m.poste_id);
        if (posteObj && !postesExclus.includes(posteObj.nom)) {
          const montant = m.type === 'credit' ? (m[champMontant] || 0) : -(m[champMontant] || 0);
          totauxParPoste[posteObj.nom] = (totauxParPoste[posteObj.nom] || 0) + montant;
        }
      }

      const params = await db.parametres_analytiques
        .where('[projetId+annee]').equals([this.projetAnalyseId, annee]).toArray();

      let ca = 0, varCost = 0, fixCost = 0;
      for (const param of params) {
        const posteObj = await db.postes_budgetaires.get(param.posteId);
        if (!posteObj || postesExclus.includes(posteObj.nom)) continue;
        const posteNom = posteObj.nom;
        const montantPoste = totauxParPoste[posteNom] || 0;
        const part = montantPoste * (param.pourcentage / 100);
        if (param.type_analyse === 'vente') ca += part;
        else if (param.nature_charge === 'variable') varCost += Math.abs(part);
        else if (param.nature_charge === 'fixe') fixCost += Math.abs(part);
      }

      const abonnements = await db.charges_abonnement
        .where('projetId').equals(this.projetAnalyseId)
        .and(c => c.date_debut <= finMois && c.date_fin >= debutMois).toArray();
      const debutMoisDate = new Date(debutMois), finMoisDate = new Date(finMois);
      for (const abo of abonnements) {
        const debutAbo = new Date(Math.max(new Date(abo.date_debut), debutMoisDate));
        const finAbo = new Date(Math.min(new Date(abo.date_fin), finMoisDate));
        const joursTotal = (new Date(abo.date_fin) - new Date(abo.date_debut)) / (86400000) + 1;
        const joursMois = Math.max(0, (finAbo - debutAbo) / 86400000 + 1);
        if (joursTotal > 0 && joursMois > 0) {
          fixCost += abo.montant_total * (joursMois / joursTotal);
        }
      }

      const debutMoisRep = new Date(debutMois), finMoisRep = new Date(finMois);
      const repartitions = await db.repartitions_ecritures
        .where('date_debut').belowOrEqual(finMoisRep.toISOString().slice(0,10))
        .and(r => new Date(r.date_fin) >= debutMoisRep).toArray();
      for (const rep of repartitions) {
        const ecriture = await db.mouvementsCaisse.get(rep.ecritureId) || await db.mouvements_bancaires.get(rep.ecritureId);
        if (!ecriture) continue;
        const posteNom = ecriture.posteBudgetaire || (await db.postes_budgetaires.get(ecriture.poste_id))?.nom;
        if (postesExclus.includes(posteNom)) continue;
        const posteObj = await db.postes_budgetaires.where('nom').equals(posteNom).first();
        if (!posteObj) continue;
        const param = params.find(p => p.posteId === posteObj.id);
        if (!param) continue;
        let montantReparti = rep.pourcentage ? (ecriture.montant || 0) * (rep.pourcentage / 100) : rep.montant_par_periode;
        const part = montantReparti * (param.pourcentage / 100);
        if (param.type_analyse === 'vente') ca += part;
        else if (param.nature_charge === 'variable') varCost += Math.abs(part);
        else if (param.nature_charge === 'fixe') fixCost += Math.abs(part);
      }

      this.chiffreAffairesMois = ca;
      this.chargesVariables = varCost;
      this.chargesFixes = fixCost;
      this.coutProduction = varCost + fixCost;
      this.coutRevientUnitaire = this.volumeProduitMois ? this.coutProduction / this.volumeProduitMois : 0;
      this.margeBrute = ca - this.coutProduction;
      this.resultatNet = this.margeBrute;
    },

    /* ========== UTILITAIRES ========== */
    async chargerProjets() {
      const tous = await db.projets.toArray();
      this.projetsActifs = tous.filter(p => p.actif);
      if (this.projetsActifs.length) this.projetAnalyseId = this.projetsActifs[0].id;
    },
    async convertirObjectifMonetaire(valeurCDF, moisIndex) {
        if (this.deviseAffichage === 'CDF') return valeurCDF;
        const taux = (this.tauxChangeAnneeDashboard[moisIndex]?.taux) || 2500;
        return valeurCDF / taux;
    },
    convertirMonetaire(valeurCDF, moisIndex) {
        if (this.deviseAffichage === 'CDF') return valeurCDF;
        const taux = (this.tauxChangeAnneeDashboard[moisIndex]?.taux) || 2500;
        return valeurCDF / taux;
    },
    async chargerContenants() {
      this.conditionnements = await db.conditionnements.toArray();
    },
    mettreAJourAffichage() { this.chargerDonnees(); },

    async exporterGraphique(cardId) {
        // Mapping cardId → clé dans this.charts
        const chartKeyMap = {
            cardRegimes: 'regimes', cardHuile: 'huile', cardTauxExtraction: 'taux',
            cardTauxGlobal: 'tauxGlobal', cardTauxFruits: 'tauxFruits', cardQualite: 'qualite',
            cardAcidite: 'acidite', cardVentesVolume: 'ventes', cardPrixMoyen: 'prixMoyen',
            cardClientsActifs: 'pointsVente', cardCA: 'ca', cardStock: 'stock',
            cardCarburant: 'consosCarburant', cardEmissionsUsage: 'emissionsUsage',
            cardFinances: 'finances'
        };
        const chartKey = chartKeyMap[cardId];
        if (!chartKey) return;
        const chartInstance = this.charts[chartKey];
        if (!chartInstance) return;

        // Récupérer le titre affiché dans la carte
        const cardElement = document.getElementById(cardId);
        const header = cardElement?.querySelector('.card-header span');
        const title = header ? header.textContent.trim() : 'Graphique';

        await this.exportHighResChart(chartInstance, title, cardId);
    },
    async exportHighResChart(chartInstance, title, filename) {
        if (!chartInstance) return;

        const scale = 4;
        const originalWidth = chartInstance.width;
        const originalHeight = chartInstance.height;
        const fontFamily = this.exportFontFamily || "'Gilroy', sans-serif";

        // Sauvegarder la police par défaut actuelle
        const originalFont = Chart.defaults.font.family;
        // Appliquer Gilroy comme police par défaut pour ce rendu
        Chart.defaults.font.family = fontFamily;

        // Créer le canvas temporaire (caché dans le DOM pour que la police s'applique)
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = originalWidth;
        tempCanvas.height = originalHeight;
        tempCanvas.style.cssText = 'display:none;';
        document.body.appendChild(tempCanvas);

        try {
            const hiChart = new Chart(tempCanvas, {
                type: chartInstance.config.type,
                data: JSON.parse(JSON.stringify(chartInstance.data)),
                options: {
                    ...chartInstance.options,
                    responsive: false,
                    devicePixelRatio: scale,
                    plugins: {
                        ...chartInstance.options.plugins,
                        legend: { display: true }
                    }
                }
            });

            // Attendre le rendu complet (police chargée)
            await new Promise(r => setTimeout(r, 500));

            // Dimensions finales
            const margin = 30;
            const titleFontSize = 20 * scale;
            const titleHeight = titleFontSize * 2;
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = originalWidth * scale + margin * 2;
            finalCanvas.height = originalHeight * scale + titleHeight + margin;
            const ctx = finalCanvas.getContext('2d');

            // Fond blanc
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

            // Titre centré
            ctx.fillStyle = '#333333';
            ctx.font = `bold ${titleFontSize}px "${fontFamily}"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(title, finalCanvas.width / 2, margin);

            // Graphique
            ctx.drawImage(tempCanvas, margin, titleHeight, originalWidth * scale, originalHeight * scale);

            // Téléchargement
            const link = document.createElement('a');
            link.download = `${filename}_${this.moisReference}.png`;
            link.href = finalCanvas.toDataURL('image/png');
            link.click();

            hiChart.destroy();
        } finally {
            // Restaurer la police par défaut
            Chart.defaults.font.family = originalFont;
            document.body.removeChild(tempCanvas);
        }
    },
    async exporterVueComplete() {
      const el = document.getElementById('dashboard-content');
      const canvas = await html2canvas(el, { scale: 3 });
      const link = document.createElement('a');
      link.download = `dashboard_${this.moisReference}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    },
  },

  async mounted() {
    this.genererOptionsMois();
    await this.chargerProjets();
    await this.chargerContenants();
    this.initCharts();
    await this.chargerDonnees();
  },

  watch: {
    projetAnalyseId() { this.calculerAnalyseFinanciere(); }
  }
};
</script>

<style scoped>
.progress-bar-bg {
  background-color: #e9ecef;
  border-radius: 5px;
  overflow: visible;
  position: relative;
}
.progress-bar-fill {
  height: 100%;
  border-radius: 5px 0 0 5px;
  transition: width 0.3s ease;
}
.progress-bar-overflow {
  border-radius: 0 5px 5px 0;
}

.sticky-selectors {
    position: sticky;
    top: 70px;                 /* ← nouveau : place le sélecteur juste sous la navbar */
    z-index: 1020;             /* conserve le z-index existant, inférieur à 1030 */
    background-color: #f4f7fc;
    padding-top: 1rem;
    padding-bottom: 1rem;
}
</style>