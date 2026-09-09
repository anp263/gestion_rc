<template>
    <div class="container-fluid">
        <h2 class="mb-4" style="color: #ED1C24;">Ventes</h2>

        <ul class="nav nav-tabs">
            <li class="nav-item">
                <a class="nav-link" :class="{ active: onglet === 'stats' }" href="#" @click.prevent="onglet = 'stats'">
                    <i class="bi bi-graph-up"></i> Statistiques
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" :class="{ active: onglet === 'suivi' }" href="#" @click.prevent="onglet = 'suivi'">
                    <i class="bi bi-person-lines-fill"></i> Suivi vendeur
                </a>
            </li>
            <li class="nav-item" v-if="isSuperviseur">
                <a class="nav-link" :class="{ active: onglet === 'bonus' }" href="#" @click.prevent="onglet = 'bonus'">
                    <i class="bi bi-cash-stack"></i> Bonus
                </a>
            </li>
        </ul>

        <!-- ==================== STATISTIQUES ==================== -->
        <div v-show="onglet === 'stats'" class="mt-3">
            <div class="row mb-3 align-items-end">
                <div class="col-md-3">
                    <label>Période</label>
                    <select class="form-select" v-model="statsPeriode" @change="chargerStats">
                        <option value="mois">Mois courant</option>
                        <option value="trimestre">Trimestre courant</option>
                        <option value="annee">Année courante</option>
                        <option value="12mois">12 derniers mois</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label>Devise</label>
                    <select class="form-select" v-model="statsDevise" @change="chargerStats">
                        <option value="CDF">CDF</option>
                        <option value="USD">USD</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <button class="btn btn-outline-primary mt-4" @click="chargerStats">
                        <i class="bi bi-arrow-repeat"></i> Actualiser
                    </button>
                </div>
            </div>

            <!-- Indicateurs rapides -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h6>CA réalisé (période)</h6>
                            <h4>{{ formatMontant(statsCAR, statsDevise) }} {{ statsDevise }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h6>Volume réalisé (période)</h6>
                            <h4>{{ formatVolume(statsVolR) }} L</h4>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-info">
                        <div class="card-body">
                            <h6>Objectif CA (global)</h6>
                            <h4>{{ formatMontant(statsObjCA, statsDevise) }} {{ statsDevise }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning">
                        <div class="card-body">
                            <h6>Objectif Volume (global)</h6>
                            <h4>{{ formatVolume(statsObjVol) }} L</h4>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <!-- Évolution CA -->
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header"><i class="bi bi-graph-up"></i> Évolution du CA réalisé</div>
                        <div class="card-body"><canvas id="chartCA" style="height: 250px;"></canvas></div>
                    </div>
                </div>
                <!-- Évolution Volume -->
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header"><i class="bi bi-graph-up"></i> Évolution du volume réalisé</div>
                        <div class="card-body"><canvas id="chartVolume" style="height: 250px;"></canvas></div>
                    </div>
                </div>
                <!-- Top vendeurs CA -->
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header"><i class="bi bi-trophy"></i> Top vendeurs (CA)</div>
                        <div class="card-body"><canvas id="chartTopCA" style="height: 250px;"></canvas></div>
                    </div>
                </div>
                <!-- Top vendeurs Volume -->
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header"><i class="bi bi-trophy"></i> Top vendeurs (Volume)</div>
                        <div class="card-body"><canvas id="chartTopVol" style="height: 250px;"></canvas></div>
                    </div>
                </div>
                <!-- Répartition volumes par contenant -->
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header"><i class="bi bi-pie-chart"></i> Répartition des volumes</div>
                        <div class="card-body"><canvas id="chartContenants" style="height: 250px;"></canvas></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ==================== SUIVI VENDEUR ==================== -->
        <div v-show="onglet === 'suivi'" class="mt-3">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span><i class="bi bi-person"></i> Suivi des ventes</span>
                    <div class="d-flex gap-2">
                        <select v-if="isSuperviseur" class="form-select form-select-sm w-auto" v-model="vendeurSuiviId"
                            @change="chargerSuivi">
                            <option v-for="v in vendeurs" :key="v.id" :value="v.id">{{ v.nom }}</option>
                        </select>
                        <select class="form-select form-select-sm w-auto" v-model="suiviDevise" @change="chargerSuivi">
                            <option value="CDF">CDF</option>
                            <option value="USD">USD</option>
                        </select>
                        <button class="btn btn-sm btn-outline-primary" @click="exportSuiviPDF">
                            <i class="bi bi-file-earmark-pdf"></i> Exporter PDF
                        </button>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-sm table-striped mb-0">
                            <thead>
                                <tr>
                                    <th>Mois</th>
                                    <th class="text-end">CA émis</th>
                                    <th class="text-end">Vol. émis (L)</th>
                                    <th class="text-end">CA réalisé</th>
                                    <th class="text-end">Vol. réalisé (L)</th>
                                    <th class="text-end">Prix/L (réalisé)</th>
                                    <th class="text-end">Délai moyen</th>
                                    <th class="text-end" v-if="peutVoirBonus">Bonus calculé</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="m in suiviMois" :key="m.moisStr">
                                    <td>{{ m.label }}</td>
                                    <td class="text-end">{{ formatMontant(m.caEmis, suiviDevise) }}</td>
                                    <td class="text-end">{{ formatVolume(m.volEmis) }}</td>
                                    <td class="text-end">{{ formatMontant(m.caRealise, suiviDevise) }}</td>
                                    <td class="text-end">{{ formatVolume(m.volRealise) }}</td>
                                    <td class="text-end">{{ formatMontant(m.prixL, suiviDevise) }}</td>
                                    <td class="text-end">{{ m.delai !== null ? m.delai + ' j' : '-' }}</td>
                                    <td class="text-end" v-if="peutVoirBonus">{{ m.bonus !== null ?
                                        formatMontant(m.bonus, 'CDF') : '-' }}</td>
                                </tr>
                                <tr v-if="suiviMois.length === 0">
                                    <td :colspan="peutVoirBonus ? 8 : 7" class="text-center">Aucune donnée</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- ==================== BONUS (superviseur) ==================== -->
        <div v-show="onglet === 'bonus' && isSuperviseur" class="mt-3">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span><i class="bi bi-cash-stack"></i> Bonus des vendeurs</span>
                    <div class="d-flex gap-2 align-items-center">
                        <select class="form-select form-select-sm w-auto" v-model="bonusMoisStr" @change="chargerBonus">
                            <option v-for="m in moisList" :key="m.valeur" :value="m.valeur">{{ m.libelle }}</option>
                        </select>
                        <button class="btn btn-sm btn-success" @click="genererToutesPrimes">
                            <i class="bi bi-check-all"></i> Générer toutes les primes
                        </button>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-sm mb-0">
                            <thead>
                                <tr>
                                    <th>Vendeur</th>
                                    <th class="text-end">CA réalisé</th>
                                    <th class="text-end">Vol. réalisé (L)</th>
                                    <th class="text-end">Prix/L</th>
                                    <th class="text-end">Bonus</th>
                                    <th class="text-center">Prime existante ?</th>
                                    <th class="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="v in bonusVendeurs" :key="v.id">
                                    <td>{{ v.nom }}</td>
                                    <td class="text-end">{{ formatMontant(v.caRealise, 'CDF') }}</td>
                                    <td class="text-end">{{ formatVolume(v.volRealise) }}</td>
                                    <td class="text-end">{{ formatMontant(v.prixL, 'CDF') }}</td>
                                    <td class="text-end">{{ v.bonus > 0 ? formatMontant(v.bonus, 'CDF') : '-' }}</td>
                                    <td class="text-center">
                                        <span v-if="v.primeExistante" class="badge"
                                            :class="v.primePayee ? 'bg-success' : 'bg-warning'">
                                            {{ v.primePayee ? 'Payée' : 'En attente' }}
                                        </span>
                                        <span v-else class="badge bg-secondary">Aucune</span>
                                    </td>
                                    <td class="text-center">
                                        <button v-if="!v.primeExistante && v.bonus > 0" class="btn btn-sm btn-primary"
                                            @click="genererPrime(v.id)" :disabled="generatingPrime">
                                            <span v-if="generatingPrime"
                                                class="spinner-border spinner-border-sm me-1"></span>
                                            Générer
                                        </button>
                                    </td>
                                </tr>
                                <tr v-if="bonusVendeurs.length === 0">
                                    <td colspan="7" class="text-center">Aucun vendeur éligible ce mois</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import { db } from '../db';
    import { isFacturePayee, getDatePaiementComplet } from '../utils/factureUtils';
    import { getRolePermissions } from '../utils/permissions';
    import { getTauxPourDate } from '../utils/taux';
    import apiService from '../services/api';
    import Chart from 'chart.js/auto';

    export default {
        name: 'Ventes',
        data() {
            return {
                onglet: 'stats',
                currentUser: JSON.parse(localStorage.getItem('currentUser') || '{}'),
                permissionsCache: {},
                // Statistiques
                statsPeriode: 'mois',
                statsDevise: 'CDF',
                statsCAR: 0,
                statsVolR: 0,
                statsObjCA: 0,
                statsObjVol: 0,
                statsEvolutionLabels: [],
                statsEvolutionCA: [],
                statsEvolutionVol: [],
                statsTopVendeursCA: [],
                statsTopVendeursVol: [],
                statsVolumesContenants: [],
                // Suivi vendeur
                vendeurSuiviId: null,
                suiviDevise: 'CDF',
                suiviMois: [],
                // Bonus
                bonusMoisStr: new Date().toISOString().slice(0, 7),
                bonusVendeurs: [],
                generatingPrime: false,
                // Data partagée
                vendeurs: [], // utilisateurs avec permission clients/ecriture
                conditionnements: [],
                tousLesFactures: [],
                tousLesPaiements: [],
                toutesLesPrimes: [],
                chartInstances: {}
            };
        },
        computed: {
            isSuperviseur() {
                const perm = this.permissionsCache?.ventes;
                return perm === 'ecriture';
            },
            peutVoirBonus() {
                return this.isSuperviseur || this.vendeurSuiviId === this.currentUser.id;
            },
            moisList() {
                const mois = [];
                const maintenant = new Date();
                for (let i = 0; i < 12; i++) {
                    const date = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
                    const valeur = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    const libelle = date.toLocaleDateString('fr-FR', { month: 'long', year: '2-digit' });
                    mois.push({ valeur, libelle });
                }
                return mois;
            },
            suiviMoisList() {
                const mois = [];
                const maintenant = new Date();
                for (let i = 11; i >= 0; i--) {
                    const date = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
                    const moisStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    const label = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
                    const debut = new Date(date.getFullYear(), date.getMonth(), 1);
                    const fin = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                    mois.push({ moisStr, label, debut, fin });
                }
                return mois;
            }
        },
        watch: {
            onglet(val) {
                if (val === 'stats') this.chargerStats();
                else if (val === 'suivi') this.chargerSuivi();
                else if (val === 'bonus' && this.isSuperviseur) this.chargerBonus();
            }
        },
        async mounted() {
            await this.loadPermissions();
            await this.loadInitialData();
            this.conditionnements = await db.conditionnements.toArray();
            if (!this.isSuperviseur) {
                this.vendeurSuiviId = this.currentUser.id;
            } else {
                this.vendeurSuiviId = this.vendeurs[0]?.id || null;
            }
            this.chargerStats();
        },
        methods: {
            // ==================== PERMISSIONS & DONNÉES INITIALES ====================
            async loadPermissions() {
                this.permissionsCache = await getRolePermissions(this.currentUser.role) || {};
            },
            async loadInitialData() {

                // Utilisateurs et filtrage des vendeurs
                const utilisateurs = await db.utilisateurs.toArray();
                this.vendeurs = [];
                for (const u of utilisateurs) {
                    const perm = await getRolePermissions(u.role);
                    if (perm && perm.clients === 'ecriture') {
                        this.vendeurs.push(u);
                    }
                }

                // Factures (cache)
                this.tousLesFactures = await db.factures.toArray();

                // Paiements (mouvementsCaisse validés, type entrée)
                this.tousLesPaiements = await db.mouvementsCaisse
                    .where({ type: 'entree', status: 'validé' })
                    .toArray();

                // Primes existantes
                this.toutesLesPrimes = await db.primes.toArray();

               
            },

            // ==================== STATISTIQUES ====================
            async chargerStats() {
                // Déterminer la période
                let debut, fin;
                const maintenant = new Date();
                if (this.statsPeriode === 'mois') {
                    debut = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
                    fin = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0, 23, 59, 59);
                } else if (this.statsPeriode === 'trimestre') {
                    const trim = Math.floor(maintenant.getMonth() / 3);
                    debut = new Date(maintenant.getFullYear(), trim * 3, 1);
                    fin = new Date(maintenant.getFullYear(), (trim + 1) * 3, 0, 23, 59, 59);
                } else if (this.statsPeriode === 'annee') {
                    debut = new Date(maintenant.getFullYear(), 0, 1);
                    fin = new Date(maintenant.getFullYear(), 11, 31, 23, 59, 59);
                } else { // 12 mois
                    debut = new Date(maintenant.getFullYear(), maintenant.getMonth() - 11, 1);
                    fin = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0, 23, 59, 59);
                }
                const debutStr = debut.toISOString().slice(0, 10);
                const finStr = fin.toISOString().slice(0, 10);

                // 1. Totaux indicateurs
                let caReal = 0, volReal = 0;
                for (const f of this.tousLesFactures) {
                    const dateComplet = await getDatePaiementComplet(f.id);
                    if (dateComplet && dateComplet >= debutStr && dateComplet <= finStr) {
                        const paiements = this.tousLesPaiements.filter(p => p.factureId === f.id);
                        const totalPaye = paiements.reduce((s, p) => s + (p.montant_converti_facture || 0), 0);
                        caReal += this.convertirDansDevise(totalPaye, f.devise, this.statsDevise, f.date);
                        volReal += await this.getVolumeFacture(f.id);
                    }
                }
                this.statsCAR = caReal;
                this.statsVolR = volReal;

                // Objectifs globaux (vendeur_id = null)
                const anneeObj = maintenant.getFullYear(); // unique déclaration

                // Objectif CA
                const allObjCA = await db.objectifs_mensuels
                    .where('annee').equals(anneeObj)
                    .and(o => o.domaine === 'Ventes')
                    .toArray();
                const objCAObj = allObjCA.find(o => o.vendeur_id === null) || null;
                this.statsObjCA = objCAObj?.donnees?.[maintenant.getMonth()] || 0;

                // Objectif Volume
                const allObjVol = await db.objectifs_mensuels
                    .where('annee').equals(anneeObj)
                    .and(o => o.domaine === 'VolumeVentes')
                    .toArray();
                const objVolObj = allObjVol.find(o => o.vendeur_id === null) || null;
                this.statsObjVol = objVolObj?.donnees?.[maintenant.getMonth()] || 0;

                // 2. Évolution mensuelle
                const evolutionLabels = [];
                const evolutionCA = [];
                const evolutionVol = [];
                const cursor = new Date(debut);
                while (cursor <= fin) {
                    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
                    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59);
                    const label = monthStart.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
                    evolutionLabels.push(label);
                    let caMois = 0, volMois = 0;
                    for (const f of this.tousLesFactures) {
                        const dateComplet = await getDatePaiementComplet(f.id);
                        if (dateComplet && new Date(dateComplet) >= monthStart && new Date(dateComplet) <= monthEnd) {
                            const paiements = this.tousLesPaiements.filter(p => p.factureId === f.id);
                            const totalPaye = paiements.reduce((s, p) => s + (p.montant_converti_facture || 0), 0);
                            caMois += this.convertirDansDevise(totalPaye, f.devise, this.statsDevise, f.date);
                            volMois += await this.getVolumeFacture(f.id);
                        }
                    }
                    evolutionCA.push(caMois);
                    evolutionVol.push(volMois);
                    cursor.setMonth(cursor.getMonth() + 1);
                }
                this.statsEvolutionLabels = evolutionLabels;
                this.statsEvolutionCA = evolutionCA;
                this.statsEvolutionVol = evolutionVol;

                // 3. Top vendeurs
                const topParVendeur = {};
                for (const f of this.tousLesFactures) {
                    const dateComplet = await getDatePaiementComplet(f.id);
                    if (dateComplet && dateComplet >= debutStr && dateComplet <= finStr) {
                        if (!topParVendeur[f.vendeurId]) topParVendeur[f.vendeurId] = { ca: 0, volume: 0 };
                        const paiements = this.tousLesPaiements.filter(p => p.factureId === f.id);
                        const totalPaye = paiements.reduce((s, p) => s + (p.montant_converti_facture || 0), 0);
                        topParVendeur[f.vendeurId].ca += this.convertirDansDevise(totalPaye, f.devise, this.statsDevise, f.date);
                        topParVendeur[f.vendeurId].volume += await this.getVolumeFacture(f.id);
                    }
                }
                this.statsTopVendeursCA = Object.entries(topParVendeur)
                    .map(([id, data]) => ({ nom: this.getVendeurNom(id), ca: data.ca }))
                    .sort((a, b) => b.ca - a.ca)
                    .slice(0, 5);
                this.statsTopVendeursVol = Object.entries(topParVendeur)
                    .map(([id, data]) => ({ nom: this.getVendeurNom(id), volume: data.volume }))
                    .sort((a, b) => b.volume - a.volume)
                    .slice(0, 5);

                // 4. Volumes par contenant
                const volumesParContenant = {};
                for (const f of this.tousLesFactures) {
                    const dateComplet = await getDatePaiementComplet(f.id);
                    if (dateComplet && dateComplet >= debutStr && dateComplet <= finStr) {
                        const lignes = await db.facture_lignes.where('factureId').equals(f.id).toArray();
                        for (const l of lignes) {
                            const cond = this.conditionnements.find(c => c.id === l.conditionnementId);
                            if (!cond) continue;
                            if (!volumesParContenant[cond.nom]) volumesParContenant[cond.nom] = 0;
                            volumesParContenant[cond.nom] += l.quantite * cond.capaciteL;
                        }
                    }
                }
                this.statsVolumesContenants = Object.entries(volumesParContenant).map(([nom, volume]) => ({ nom, volume }));

                // 5. Rendu des graphiques
                await this.$nextTick();
                this.renderChartCA();
                this.renderChartVolume();
                this.renderTopVendeurs();
                this.renderContenants();
            },

            // ==================== SUIVI VENDEUR ====================
            async chargerSuivi() {
                const liste = [];
                for (const mois of this.suiviMoisList) {
                    const { debut, fin, label, moisStr } = mois;
                    const [annee, moisNum] = moisStr.split('-').map(Number);
                    const debutStr = debut.toISOString().slice(0, 10);
                    const finStr = fin.toISOString().slice(0, 10);

                    // Factures émises ce mois par le vendeur
                    const facturesMois = this.tousLesFactures.filter(f =>
                        f.date >= debutStr && f.date <= finStr && f.vendeurId === this.vendeurSuiviId
                    );
                    const caEmis = facturesMois.reduce((s, f) => s + this.convertirVersAffichage(f.totalHT, f.devise, this.suiviDevise, f.date), 0);
                    let volEmis = 0;
                    for (const f of facturesMois) volEmis += await this.getVolumeFacture(f.id);

                    // Factures devenues payées ce mois (tout vendeur, mais on filtre par vendeur)
                    let caRealise = 0, volRealise = 0, delaiSomme = 0, nbPaye = 0;
                    for (const f of this.tousLesFactures) {
                        if (f.vendeurId !== this.vendeurSuiviId) continue;
                        const dateComplet = await getDatePaiementComplet(f.id);
                        if (dateComplet && dateComplet >= debutStr && dateComplet <= finStr) {
                            const paiements = this.tousLesPaiements.filter(p => p.factureId === f.id);
                            const totalPaye = paiements.reduce((s, p) => s + (p.montant_converti_facture || 0), 0);
                            caRealise += this.convertirVersAffichage(totalPaye, f.devise, this.suiviDevise, f.date);
                            volRealise += await this.getVolumeFacture(f.id);
                            const delai = Math.round((new Date(dateComplet) - new Date(f.date)) / (1000 * 3600 * 24));
                            delaiSomme += delai;
                            nbPaye++;
                        }
                    }
                    const prixL = volRealise > 0 ? caRealise / volRealise : 0;
                    const delaiMoyen = nbPaye > 0 ? Math.round(delaiSomme / nbPaye) : null;

                    // Bonus calculé (nouvelle logique mensuelle)
                    let bonus = null;
                    if (this.peutVoirBonus) {
                        const objVolMin = (await db.objectifs_mensuels.where({ annee: annee, domaine: 'BonusVolumeMin', vendeur_id: this.vendeurSuiviId }).first())?.donnees?.[moisNum - 1] || 0;
                        const objPrixMin = (await db.objectifs_mensuels.where({ annee: annee, domaine: 'BonusPrixMin', vendeur_id: this.vendeurSuiviId }).first())?.donnees?.[moisNum - 1] || 0;
                        const objBonusL = (await db.objectifs_mensuels.where({ annee: annee, domaine: 'BonusParLitre', vendeur_id: this.vendeurSuiviId }).first())?.donnees?.[moisNum - 1] || 0;
                        if (volRealise >= objVolMin && prixL >= objPrixMin) {
                            bonus = (volRealise - objVolMin) * objBonusL;
                        } else {
                            bonus = 0;
                        }
                    }
                    liste.push({ moisStr, label, caEmis, volEmis, caRealise, volRealise, prixL, delai: delaiMoyen, bonus });
                }
                this.suiviMois = liste;
            },

            // ==================== BONUS ====================
            async chargerBonus() {
                this.bonusVendeurs = [];
                const [annee, mois] = this.bonusMoisStr.split('-').map(Number);
                const debut = new Date(annee, mois - 1, 1);
                const fin = new Date(annee, mois, 0, 23, 59, 59);
                const debutStr = debut.toISOString().slice(0, 10);
                const finStr = fin.toISOString().slice(0, 10);

                for (const vendeur of this.vendeurs) {
                    let caRealise = 0, volRealise = 0;
                    for (const f of this.tousLesFactures) {
                    const dateComplet = await getDatePaiementComplet(f.id);
                    if (dateComplet && dateComplet >= debutStr && dateComplet <= finStr && f.vendeurId === vendeur.id) {
                        const paiements = this.tousLesPaiements.filter(p => p.factureId === f.id);
                        const totalPaye = paiements.reduce((s, p) => s + (p.montant_converti_facture || 0), 0);
                        caRealise += totalPaye;
                        volRealise += await this.getVolumeFacture(f.id);
                    }
                    }
                    const prixL = volRealise > 0 ? caRealise / volRealise : 0;

                    // Récupérer les paramètres mensuels
                    const objVolMin = (await db.objectifs_mensuels.where({ annee, domaine: 'BonusVolumeMin', vendeur_id: vendeur.id }).first())?.donnees?.[mois - 1] || 0;
                    const objPrixMin = (await db.objectifs_mensuels.where({ annee, domaine: 'BonusPrixMin', vendeur_id: vendeur.id }).first())?.donnees?.[mois - 1] || 0;
                    const objBonusL = (await db.objectifs_mensuels.where({ annee, domaine: 'BonusParLitre', vendeur_id: vendeur.id }).first())?.donnees?.[mois - 1] || 0;

                    let bonus = 0;
                    if (volRealise >= objVolMin && prixL >= objPrixMin) {
                    bonus = (volRealise - objVolMin) * objBonusL;
                    }

                    const primeExistante = this.toutesLesPrimes.find(p =>
                    p.travailleur_id === vendeur.travailleur_id && p.annee === annee && p.mois === mois
                    );
                    this.bonusVendeurs.push({
                    id: vendeur.id,
                    nom: vendeur.nom,
                    travailleur_id: vendeur.travailleur_id,
                    caRealise,
                    volRealise,
                    prixL,
                    bonus,
                    primeExistante: !!primeExistante,
                    primePayee: primeExistante ? primeExistante.payee : false
                    });
                }
            },

            // ==================== GÉNÉRATION PRIMES ====================
            async genererPrime(vendeurId) {
                const vendeur = this.vendeurs.find(v => v.id === vendeurId);
                if (!vendeur || !vendeur.travailleur_id) {
                    alert('Ce vendeur n’est pas lié à un travailleur.');
                    return;
                }
                const bonusEntry = this.bonusVendeurs.find(b => b.id === vendeurId);
                if (!bonusEntry || bonusEntry.bonus <= 0) {
                    alert('Aucun bonus à générer.');
                    return;
                }
                this.generatingPrime = true;
                try {
                    const [annee, mois] = this.bonusMoisStr.split('-').map(Number);
                    await apiService.ajouter('primes', {
                        travailleur_id: vendeur.travailleur_id,
                        annee,
                        mois,
                        montant: bonusEntry.bonus,
                        libelle: `Bonus ventes ${new Date(annee, mois - 1).toLocaleDateString('fr-FR', { month: 'long', year: '2-digit' })}`,
                        payee: false
                    });
                    // Recharger les primes et bonus
                    this.toutesLesPrimes = await db.primes.toArray();
                    await this.chargerBonus();
                    alert('Prime générée avec succès.');
                } catch (err) {
                    console.error(err);
                    alert('Erreur lors de la génération.');
                } finally {
                    this.generatingPrime = false;
                }
            },
            async genererToutesPrimes() {
                if (!confirm('Générer les primes pour tous les vendeurs éligibles ce mois ?')) return;
                for (const v of this.bonusVendeurs) {
                    if (!v.primeExistante && v.bonus > 0 && v.travailleur_id) {
                        await this.genererPrime(v.id);
                    }
                }
                await this.chargerBonus();
            },

            // ==================== EXPORT PDF ====================
            async exportSuiviPDF() {
                const vendeurNom = this.vendeurs.find(v => v.id === this.vendeurSuiviId)?.nom || 'Moi';
                const rows = this.suiviMois.map(m => `
        <tr>
          <td>${m.label}</td>
          <td style="text-align:right">${this.formatMontant(m.caEmis, this.suiviDevise)}</td>
          <td style="text-align:right">${this.formatVolume(m.volEmis)}</td>
          <td style="text-align:right">${this.formatMontant(m.caRealise, this.suiviDevise)}</td>
          <td style="text-align:right">${this.formatVolume(m.volRealise)}</td>
          <td style="text-align:right">${this.formatMontant(m.prixL, this.suiviDevise)}</td>
          <td style="text-align:right">${m.delai !== null ? m.delai + ' j' : '-'}</td>
          ${this.peutVoirBonus ? `<td style="text-align:right">${m.bonus !== null ? this.formatMontant(m.bonus, 'CDF') : '-'}</td>` : ''}
        </tr>
      `).join('');
                const html = `
        <html><head><title>Suivi ventes ${vendeurNom}</title>
        <style>body{font-family:Arial;font-size:12px;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid black;padding:4px;text-align:center;}</style>
        </head>
        <body>
        <h2>Suivi des ventes - ${vendeurNom}</h2>
        <table><thead><tr><th>Mois</th><th>CA émis</th><th>Vol. émis</th><th>CA réalisé</th><th>Vol. réalisé</th><th>Prix/L</th><th>Délai</th>${this.peutVoirBonus ? '<th>Bonus</th>' : ''}</tr></thead><tbody>${rows}</tbody></table>
        </body></html>`;
                const win = window.open('', '_blank');
                win.document.write(html);
                win.document.close();
                win.print();
            },

            // ==================== GRAPHIQUES ====================
            renderChartCA() {
                const ctx = document.getElementById('chartCA');
                if (!ctx) return;
                if (this.chartInstances.chartCA) this.chartInstances.chartCA.destroy();
                this.chartInstances.chartCA = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: this.statsEvolutionLabels,
                        datasets: [{
                            label: 'CA réalisé (' + this.statsDevise + ')',
                            data: this.statsEvolutionCA,
                            borderColor: '#ED1C24',
                            backgroundColor: 'rgba(237, 28, 36, 0.1)',
                            fill: true,
                            tension: 0.2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: { beginAtZero: true, ticks: { callback: (val) => this.formatMontant(val, this.statsDevise) } }
                        },
                        plugins: {
                            tooltip: { callbacks: { label: (ctx) => this.formatMontant(ctx.raw, this.statsDevise) } }
                        }
                    }
                });
            },
            renderChartVolume() {
                const ctx = document.getElementById('chartVolume');
                if (!ctx) return;
                if (this.chartInstances.chartVolume) this.chartInstances.chartVolume.destroy();
                this.chartInstances.chartVolume = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: this.statsEvolutionLabels,
                        datasets: [{
                            label: 'Volume réalisé (litres)',
                            data: this.statsEvolutionVol,
                            borderColor: '#28a745',
                            backgroundColor: 'rgba(40, 167, 69, 0.1)',
                            fill: true,
                            tension: 0.2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: { beginAtZero: true, ticks: { callback: (val) => this.formatVolume(val) } }
                        },
                        plugins: {
                            tooltip: { callbacks: { label: (ctx) => this.formatVolume(ctx.raw) + ' L' } }
                        }
                    }
                });
            },
            renderTopVendeurs() {
                // Top CA
                const ctxCA = document.getElementById('chartTopCA');
                if (ctxCA) {
                    if (this.chartInstances.chartTopCA) this.chartInstances.chartTopCA.destroy();
                    this.chartInstances.chartTopCA = new Chart(ctxCA, {
                        type: 'bar',
                        data: {
                            labels: this.statsTopVendeursCA.map(v => v.nom),
                            datasets: [{
                                label: 'CA (' + this.statsDevise + ')',
                                data: this.statsTopVendeursCA.map(v => v.ca),
                                backgroundColor: '#ED1C24'
                            }]
                        },
                        options: {
                            responsive: true,
                            indexAxis: 'y',
                            plugins: {
                                tooltip: { callbacks: { label: (ctx) => this.formatMontant(ctx.raw, this.statsDevise) } }
                            },
                            scales: { x: { ticks: { callback: (val) => this.formatMontant(val, this.statsDevise) } } }
                        }
                    });
                }
                // Top Volume
                const ctxVol = document.getElementById('chartTopVol');
                if (ctxVol) {
                    if (this.chartInstances.chartTopVol) this.chartInstances.chartTopVol.destroy();
                    this.chartInstances.chartTopVol = new Chart(ctxVol, {
                        type: 'bar',
                        data: {
                            labels: this.statsTopVendeursVol.map(v => v.nom),
                            datasets: [{
                                label: 'Volume (L)',
                                data: this.statsTopVendeursVol.map(v => v.volume),
                                backgroundColor: '#28a745'
                            }]
                        },
                        options: {
                            responsive: true,
                            indexAxis: 'y',
                            plugins: {
                                tooltip: { callbacks: { label: (ctx) => this.formatVolume(ctx.raw) + ' L' } }
                            },
                            scales: { x: { ticks: { callback: (val) => this.formatVolume(val) + ' L' } } }
                        }
                    });
                }
            },
            renderContenants() {
                const ctx = document.getElementById('chartContenants');
                if (!ctx) return;
                if (this.chartInstances.chartContenants) this.chartInstances.chartContenants.destroy();
                this.chartInstances.chartContenants = new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: this.statsVolumesContenants.map(c => c.nom),
                        datasets: [{
                            data: this.statsVolumesContenants.map(c => c.volume),
                            backgroundColor: ['#ED1C24', '#f39c12', '#2ecc71', '#3498db']
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            tooltip: { callbacks: { label: (ctx) => ctx.label + ': ' + this.formatVolume(ctx.raw) + ' L' } }
                        }
                    }
                });
            },

            // ==================== UTILITAIRES ====================
            convertirDansDevise(montant, deviseOrigine, deviseCible, dateRef) {
                if (deviseOrigine === deviseCible) return montant;
                const taux = 2500; // si besoin précis, utiliser await getTauxPourDate(dateRef)
                if (deviseCible === 'CDF') return deviseOrigine === 'USD' ? montant * taux : montant;
                else return deviseOrigine === 'CDF' ? montant / taux : montant;
            },
            convertirVersAffichage(montant, deviseOrigine, deviseCible, dateRef) {
                return this.convertirDansDevise(montant, deviseOrigine, deviseCible, dateRef);
            },
            async getVolumeFacture(factureId) {
                const lignes = await db.facture_lignes.where('factureId').equals(factureId).toArray();
                let volume = 0;
                for (const l of lignes) {
                    const cond = this.conditionnements.find(c => c.id === l.conditionnementId);
                    if (cond) volume += l.quantite * cond.capaciteL;
                }
                return volume;
            },
            getVendeurNom(id) {
                const v = this.vendeurs.find(v => v.id === id);
                return v ? v.nom : 'Inconnu';
            },
            formatMontant(montant, devise) {
                if (montant === undefined || montant === null) return '0';
                if (devise === 'CDF') {
                    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(montant));
                } else {
                    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(montant);
                }
            },
            formatVolume(vol) {
                return Math.round(vol || 0).toLocaleString('fr-FR');
            },
        }
    };
</script>