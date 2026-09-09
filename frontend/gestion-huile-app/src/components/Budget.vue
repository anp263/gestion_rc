<template>
    <div class="container-fluid">
        <h2 class="mb-4" style="color: #ED1C24;">Budgets</h2>

        <!-- Sélecteur de devise global -->
        <div class="card mb-3">
            <div class="card-body py-2">
                <div class="row align-items-center">
                    <div class="col-auto">
                        <strong>Devise d'affichage :</strong>
                    </div>
                    <div class="col-auto">
                        <div class="btn-group" role="group">
                            <button type="button" class="btn"
                                :class="deviseAffichage === 'USD' ? 'btn-primary' : 'btn-outline-secondary'"
                                @click="changerDevise('USD')">USD ($)</button>
                            <button type="button" class="btn"
                                :class="deviseAffichage === 'CDF' ? 'btn-primary' : 'btn-outline-secondary'"
                                @click="changerDevise('CDF')">CDF (FC)</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Onglets -->
        <ul class="nav nav-tabs">
            <li class="nav-item"><a class="nav-link" :class="{ active: onglet === 'budget' }" href="#"
                    @click.prevent="onglet = 'budget'">📊 Budget</a></li>
            <li class="nav-item"><a class="nav-link" :class="{ active: onglet === 'suivi' }" href="#"
                    @click.prevent="onglet = 'suivi'">📈 Suivi du budget</a></li>
            <li class="nav-item"><a class="nav-link" :class="{ active: onglet === 'tresorerie' }" href="#"
                    @click.prevent="onglet = 'tresorerie'">💰 Trésorerie prévisionnelle</a></li>
        </ul>

        <!-- ==================== ONGLET SAISIE DU BUDGET ==================== -->
        <div v-show="onglet === 'budget'" class="mt-3">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span><i class="bi bi-pencil-square"></i> Budget annuel</span>
                    <div>
                        <select v-model="anneeBudget" class="form-select form-select-sm w-auto d-inline-block me-2">
                            <option v-for="a in anneesDisponibles" :key="a" :value="a">{{ a }}</option>
                        </select>
                        <button class="btn btn-sm btn-success me-2" @click="sauvegarderBudget">💾 Enregistrer (nouvelle
                            version)</button>
                        <button class="btn btn-sm btn-secondary" @click="chargerHistorique">📜 Historique</button>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="budget-table-container">
                        <table class="table table-bordered table-sm budget-table">
                            <thead class="sticky-top bg-light">
                                <tr>
                                    <th class="sticky-col-post">Poste</th>
                                    <th class="sticky-col-total text-center">Total</th>
                                    <th v-for="m in 12" :key="m" class="text-center">{{ moisNoms[m-1] }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- Taux de change -->
                                <tr class="table-secondary">
                                    <td class="fw-bold sticky-col-post taux-cell"
                                        style="background-color: #e9ecef !important;">Taux USD → CDF</td>
                                    <td class="sticky-col-total taux-cell"
                                        style="background-color: #e9ecef !important;"></td>
                                    <td v-for="m in 12" :key="m" class="taux-cell">
                                        <input type="text" class="form-control form-control-sm text-end"
                                            :value="formatMontant(tauxMensuels[m-1], 'CDF')"
                                            @input="formatInputBudget($event, deviseAffichage)"
                                            @blur="updateTauxValue(m-1, $event.target.value)">
                                    </td>
                                </tr>
                                <!-- Dépenses -->
                                <tr v-for="poste in postesBudgetaires.filter(p => p.type === 'sortie')" :key="poste.id">
                                    <td class="fw-bold sticky-col-post bg-white">{{ poste.nom }}</td>
                                    <td class="text-end fw-bold sticky-col-total bg-white">{{
                                        formatMontant(totalParPosteAffichage[poste.id], deviseAffichage) }}</td>
                                    <td v-for="m in 12" :key="m">
                                        <input type="text" class="form-control form-control-sm text-end"
                                            :value="formatMontant(valeurAfficheeCellule(poste.id, m-1), deviseAffichage)"
                                            @input="formatInputBudget($event, deviseAffichage)"
                                            @blur="updateBudgetValue(poste.id, m-1, $event)"
                                            :ref="el => setInputRef(el, poste.id, m-1)">
                                    </td>
                                </tr>
                                <tr class="table-primary total-row">
                                    <td class="fw-bold sticky-col-post bg-primary text-white">Total dépenses</td>
                                    <td class="text-end fw-bold sticky-col-total bg-primary text-white">{{
                                        formatMontant(totalDepensesAffichage, deviseAffichage) }}</td>
                                    <td v-for="m in 12" :key="m" class="text-end">{{
                                        formatMontant(totalDepensesMoisAffichage[m-1], deviseAffichage) }}</td>
                                </tr>
                                <!-- Revenus -->
                                <tr v-for="poste in postesBudgetaires.filter(p => p.type === 'entree')" :key="poste.id">
                                    <td class="fw-bold sticky-col-post bg-white">{{ poste.nom }}</td>
                                    <td class="text-end fw-bold sticky-col-total bg-white">{{
                                        formatMontant(totalParPosteAffichage[poste.id], deviseAffichage) }}</td>
                                    <td v-for="m in 12" :key="m">
                                        <input type="text" class="form-control form-control-sm text-end"
                                            :value="formatMontant(valeurAfficheeCellule(poste.id, m-1), deviseAffichage)"
                                            @input="formatInputBudget($event, deviseAffichage)"
                                            @blur="updateBudgetValue(poste.id, m-1, $event)"
                                            :ref="el => setInputRef(el, poste.id, m-1)">
                                    </td>
                                </tr>
                                <tr class="table-primary total-row">
                                    <td class="fw-bold sticky-col-post bg-primary text-white">Total revenus</td>
                                    <td class="text-end fw-bold sticky-col-total bg-primary text-white">{{
                                        formatMontant(totalRevenusAffichage, deviseAffichage) }}</td>
                                    <td v-for="m in 12" :key="m" class="text-end">{{
                                        formatMontant(totalRevenusMoisAffichage[m-1], deviseAffichage) }}</td>
                                </tr>
                                <tr class="table-success">
                                    <td class="fw-bold sticky-col-post bg-success text-white">Variation de trésorerie
                                    </td>
                                    <td class="text-end fw-bold sticky-col-total bg-success text-white"
                                        :class="soldeTotalAffichage >= 0 ? 'text-success' : 'text-danger'">
                                        {{ formatMontant(soldeTotalAffichage, deviseAffichage) }}
                                    </td>
                                    <td v-for="m in 12" :key="m" class="text-end"
                                        :class="soldeMoisAffichage[m-1] >= 0 ? 'text-success' : 'text-danger'">
                                        {{ formatMontant(soldeMoisAffichage[m-1], deviseAffichage) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Modal historique -->
            <div v-if="showHistorique" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Historique des versions ({{ anneeBudget }})</h5>
                            <button type="button" class="btn-close" @click="showHistorique = false"></button>
                        </div>
                        <div class="modal-body">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Version</th>
                                        <th>Date</th>
                                        <th>Utilisateur</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="v in versions" :key="v.version">
                                        <td>{{ v.version }}</td>
                                        <td>{{ formatDate(v.date_creation) }}</td>
                                        <td>{{ v.utilisateur_nom || '-' }}</td>
                                        <td><button class="btn btn-sm btn-primary"
                                                @click="restaurerVersion(v)">Restaurer</button></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ==================== ONGLET SUIVI DU BUDGET ==================== -->
        <div v-show="onglet === 'suivi'" class="mt-3">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span><i class="bi bi-graph-up"></i> Suivi du budget</span>
                    <div class="d-flex gap-2">
                        <select v-model="anneeSuivi" class="form-select form-select-sm w-auto">
                            <option v-for="a in anneesDisponibles" :key="a" :value="a">{{ a }}</option>
                        </select>
                        <button class="btn btn-sm btn-outline-primary" @click="exporterSuivi">
                            <i class="bi bi-camera"></i> Exporter
                        </button>
                    </div>
                </div>
                <div class="card-body p-0">
                    <!-- Légendes inchangées -->
                    <div class="d-flex gap-4 p-2 bg-light border-bottom">
                        <div>
                            <strong>Dépenses :</strong>
                            <span class="badge bg-success ms-1">≤100%</span>
                            <span class="badge bg-warning text-dark ms-1">100-110%</span>
                            <span class="badge bg-danger ms-1">>110%</span>
                        </div>
                        <div>
                            <strong>Revenus :</strong>
                            <span class="badge bg-danger ms-1">&lt;100%</span>
                            <span class="badge bg-success ms-1">≥100%</span>
                        </div>
                    </div>

                    <div class="budget-table-container" id="suivi-budget-table">
                        <table class="table table-bordered table-sm budget-table suivi-table">
                            <thead class="sticky-top bg-light">
                                <tr>
                                    <th rowspan="2" class="sticky-col-post">Poste</th>
                                    <th colspan="3" class="text-center sticky-col-total-group">Total</th>
                                    <th v-for="m in 12" :key="m" colspan="3" class="text-center mois-header"
                                        :class="{ 'border-end-bold': m < 12, 'border-start-bold': m === 1 }">
                                        {{ moisNoms[m-1] }}
                                    </th>
                                </tr>
                                <tr>
                                    <!-- Sous-colonnes du Total -->
                                    <th class="text-center sticky-col-budget">Prévu</th>
                                    <th class="text-center sticky-col-realise">Réalisé</th>
                                    <th class="text-center sticky-col-percent">%</th>

                                    <!-- Sous-colonnes mensuelles -->
                                    <template v-for="m in 12" :key="m">
                                        <th class="text-center" :class="{ 'border-start-bold': m === 1 }">Prévu</th>
                                        <th class="text-center">Réalisé</th>
                                        <th class="text-center" :class="{ 'border-end-bold': m < 12 }">%</th>
                                    </template>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- Dépenses (postes) -->
                                <template v-for="poste in postesBudgetaires.filter(p => p.type === 'sortie')"
                                    :key="poste.id">
                                    <tr>
                                        <td class="fw-bold sticky-col-post bg-white">{{ poste.nom }} <span
                                                v-if="poste.lieFacture">📄</span></td>

                                        <!-- Colonnes Total -->
                                        <td class="text-end sticky-col-budget">{{
                                            formatMontant(totalPrevisionParPoste[poste.id] || 0,
                                            deviseAffichage) }}</td>
                                        <td class="text-end sticky-col-realise">{{
                                            formatMontant(totalRealiseParPoste[poste.id] || 0,
                                            deviseAffichage) }}</td>
                                        <td class="text-end sticky-col-percent"
                                            :class="getPourcentageClassDepenses(pourcentageTotalParPoste[poste.id])">
                                            {{ pourcentageTotalParPoste[poste.id] || 0 }}%
                                        </td>

                                        <!-- Colonnes mensuelles -->
                                        <template v-for="m in 12" :key="m">
                                            <td class="text-end" :class="{ 'border-start-bold': m === 1 }">
                                                {{ formatMontant(previsionParPosteMois[poste.id]?.[m-1] || 0,
                                                deviseAffichage) }}
                                            </td>
                                            <td class="text-end">
                                                {{ formatMontant(realiseParPosteMois[poste.id]?.[m-1] || 0,
                                                deviseAffichage) }}
                                            </td>
                                            <td class="text-end"
                                                :class="[getPourcentageClassDepenses(pourcentagePosteMois[poste.id]?.[m-1]), { 'border-end-bold': m < 12 }]">
                                                {{ pourcentagePosteMois[poste.id]?.[m-1] || 0 }}%
                                            </td>
                                        </template>
                                    </tr>
                                </template>

                                <!-- Total dépenses -->
                                <tr class="table-primary total-row">
                                    <td class="fw-bold sticky-col-post bg-primary text-white">Total dépenses</td>
                                    <td class="text-end sticky-col-budget">{{
                                        formatMontant(totalDepensesPrevisionAffichage,
                                        deviseAffichage) }}</td>
                                    <td class="text-end sticky-col-realise">{{
                                        formatMontant(totalDepensesRealiseAffichage,
                                        deviseAffichage) }}</td>
                                    <td class="text-end sticky-col-percent"
                                        :class="getPourcentageClassDepenses(pourcentageTotalDepenses)">
                                        {{ pourcentageTotalDepenses }}%
                                    </td>
                                    <template v-for="m in 12" :key="m">
                                        <td class="text-end" :class="{ 'border-start-bold': m === 1 }">
                                            {{ formatMontant(totalDepensesPrevisionMoisAffichage[m-1], deviseAffichage)
                                            }}
                                        </td>
                                        <td class="text-end">
                                            {{ formatMontant(totalDepensesRealiseMoisAffichage[m-1], deviseAffichage) }}
                                        </td>
                                        <td class="text-end"
                                            :class="[getPourcentageClassDepenses(pourcentageDepensesMois[m-1]), { 'border-end-bold': m < 12 }]">
                                            {{ pourcentageDepensesMois[m-1] }}%
                                        </td>
                                    </template>
                                </tr>

                                <!-- Revenus (postes) - même structure -->
                                <template v-for="poste in postesBudgetaires.filter(p => p.type === 'entree')"
                                    :key="poste.id">
                                    <tr>
                                        <td class="fw-bold sticky-col-post bg-white">{{ poste.nom }} <span
                                                v-if="poste.lieFacture">📄</span></td>
                                        <td class="text-end sticky-col-budget">{{
                                            formatMontant(totalPrevisionParPoste[poste.id] || 0,
                                            deviseAffichage) }}</td>
                                        <td class="text-end sticky-col-realise">{{
                                            formatMontant(totalRealiseParPoste[poste.id] || 0,
                                            deviseAffichage) }}</td>
                                        <td class="text-end sticky-col-percent"
                                            :class="getPourcentageClassRevenus(pourcentageTotalParPoste[poste.id])">
                                            {{ pourcentageTotalParPoste[poste.id] || 0 }}%
                                        </td>
                                        <template v-for="m in 12" :key="m">
                                            <td class="text-end" :class="{ 'border-start-bold': m === 1 }">
                                                {{ formatMontant(previsionParPosteMois[poste.id]?.[m-1] || 0,
                                                deviseAffichage) }}
                                            </td>
                                            <td class="text-end">
                                                {{ formatMontant(realiseParPosteMois[poste.id]?.[m-1] || 0,
                                                deviseAffichage) }}
                                            </td>
                                            <td class="text-end"
                                                :class="[getPourcentageClassRevenus(pourcentagePosteMois[poste.id]?.[m-1]), { 'border-end-bold': m < 12 }]">
                                                {{ pourcentagePosteMois[poste.id]?.[m-1] || 0 }}%
                                            </td>
                                        </template>
                                    </tr>
                                </template>

                                <!-- Total revenus -->
                                <tr class="table-primary total-row">
                                    <td class="fw-bold sticky-col-post bg-primary text-white">Total revenus</td>
                                    <td class="text-end sticky-col-budget">{{
                                        formatMontant(totalRevenusPrevisionAffichage,
                                        deviseAffichage) }}</td>
                                    <td class="text-end sticky-col-realise">{{
                                        formatMontant(totalRevenusRealiseAffichage,
                                        deviseAffichage) }}</td>
                                    <td class="text-end sticky-col-percent"
                                        :class="getPourcentageClassRevenus(pourcentageTotalRevenus)">
                                        {{ pourcentageTotalRevenus }}%
                                    </td>
                                    <template v-for="m in 12" :key="m">
                                        <td class="text-end" :class="{ 'border-start-bold': m === 1 }">
                                            {{ formatMontant(totalRevenusPrevisionMoisAffichage[m-1], deviseAffichage)
                                            }}
                                        </td>
                                        <td class="text-end">
                                            {{ formatMontant(totalRevenusRealiseMoisAffichage[m-1], deviseAffichage) }}
                                        </td>
                                        <td class="text-end"
                                            :class="[getPourcentageClassRevenus(pourcentageRevenusMois[m-1]), { 'border-end-bold': m < 12 }]">
                                            {{ pourcentageRevenusMois[m-1] }}%
                                        </td>
                                    </template>
                                </tr>

                                <!-- Variation de trésorerie (inchangée, sauf ajout des classes sticky pour cohérence) -->
                                <tr class="table-success">
                                    <td class="fw-bold sticky-col-post bg-success text-white">Variation de trésorerie
                                    </td>
                                    <td class="text-end sticky-col-budget"
                                        :class="variationTotalePrevue >= 0 ? 'text-success' : 'text-danger'">
                                        {{ formatMontant(variationTotalePrevue, deviseAffichage) }}
                                    </td>
                                    <td class="text-end sticky-col-realise"
                                        :class="variationTotaleAffichage >= 0 ? 'text-success' : 'text-danger'">
                                        {{ formatMontant(variationTotaleAffichage, deviseAffichage) }}
                                    </td>
                                    <td class="text-end sticky-col-percent"
                                        :class="getPourcentageClassVariation(pourcentageVariation)">
                                        {{ pourcentageVariation !== null ? pourcentageVariation + '%' : '—' }}
                                    </td>
                                    <template v-for="m in 12" :key="m">
                                        <td class="text-end"
                                            :class="[variationMensuellePrevue[m-1] >= 0 ? 'text-success' : 'text-danger', { 'border-start-bold': m === 1 }]">
                                            {{ formatMontant(variationMensuellePrevue[m-1], deviseAffichage) }}
                                        </td>
                                        <td class="text-end"
                                            :class="variationMensuelleAffichage[m-1] >= 0 ? 'text-success' : 'text-danger'">
                                            {{ formatMontant(variationMensuelleAffichage[m-1], deviseAffichage) }}
                                        </td>
                                        <td class="text-end"
                                            :class="[getPourcentageClassVariation(pourcentageVariationMois[m-1]), { 'border-end-bold': m < 12 }]">
                                            {{ pourcentageVariationMois[m-1] !== null ? pourcentageVariationMois[m-1] +
                                            '%' : '—' }}
                                        </td>
                                    </template>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- ==================== ONGLET TRÉSORERIE PRÉVISIONNELLE ==================== -->
        <div v-show="onglet === 'tresorerie'" class="mt-3">
            <div class="card">
                <div class="card-header"><i class="bi bi-cash-stack"></i> Projection de trésorerie</div>
                <div class="card-body">
                    <div class="row mb-3 align-items-end">
                        <div class="col-md-4">
                            <label>Année</label>
                            <select v-model="anneeTreso" class="form-select" @change="initialiserSoldeInitial">
                                <option v-for="a in anneesDisponibles" :key="a" :value="a">{{ a }}</option>
                            </select>
                        </div>
                        <div class="col-md-5">
                            <label>Solde au 1ᵉʳ janvier ({{ deviseAffichage }})</label>
                            <div class="input-group">
                                <input type="text" class="form-control"
                                    :value="formatMontant(soldeInitialTreso, deviseAffichage)"
                                    :readonly="!modeManuelSoldeInitial"
                                    @input="formatInputBudget($event, deviseAffichage)"
                                    @blur="updateSoldeInitial($event.target.value)">
                                <button class="btn btn-outline-secondary" type="button"
                                    @click="modeManuelSoldeInitial = !modeManuelSoldeInitial"
                                    :title="modeManuelSoldeInitial ? 'Revenir au solde calculé automatiquement' : 'Définir manuellement'">
                                    <i
                                        :class="modeManuelSoldeInitial ? 'bi bi-arrow-counterclockwise' : 'bi bi-pencil'"></i>
                                </button>
                            </div>
                            <small class="text-muted" v-if="modeManuelSoldeInitial">
                                Valeur saisie manuellement ({{ deviseAffichage }})
                            </small>
                            <small class="text-muted" v-else-if="soldeInitialAutoCalcule !== null">
                                Solde calculé automatiquement au 31/12/{{ anneeTreso-1 }}
                            </small>
                            <div v-if="messageSoldeInitial" class="text-warning mt-1">
                                <i class="bi bi-exclamation-triangle"></i> {{ messageSoldeInitial }}
                            </div>
                        </div>
                        <div class="col-md-3">
                            <button class="btn btn-outline-primary" @click="recalculerSoldeInitial">
                                <i class="bi bi-arrow-repeat"></i> Recalculer le solde initial
                            </button>
                        </div>
                    </div>

                    <div class="table-responsive">
                        <table class="table table-bordered">
                            <thead>
                                <tr>
                                    <th>Mois</th>
                                    <th>Solde début</th>
                                    <th>Entrées</th>
                                    <th>Sorties</th>
                                    <th>Solde fin</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(mois, idx) in moisNoms" :key="idx">
                                    <td>{{ mois }}</td>
                                    <td class="text-end">{{ formatMontant(soldesTreso[idx]?.debut || 0, deviseAffichage)
                                        }}</td>
                                    <td class="text-end text-success">{{ formatMontant(soldesTreso[idx]?.entrees || 0,
                                        deviseAffichage) }}</td>
                                    <td class="text-end text-danger">{{ formatMontant(soldesTreso[idx]?.sorties || 0,
                                        deviseAffichage) }}</td>
                                    <td class="text-end fw-bold"
                                        :class="(soldesTreso[idx]?.fin || 0) >= 0 ? 'text-success' : 'text-danger'">
                                        {{ formatMontant(soldesTreso[idx]?.fin || 0, deviseAffichage) }}
                                    </td>
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
    import html2canvas from 'html2canvas';
    import { convertirMontants } from '../utils/taux';
    import { getMouvementsBudget } from '../utils/financeUtils';

    export default {
        name: 'Budget',
        data() {
            return {
                onglet: 'suivi',
                deviseAffichage: 'CDF',
                anneesDisponibles: [2026, 2027, 2028, 2029, 2030],
                anneeBudget: new Date().getFullYear(),
                anneeSuivi: new Date().getFullYear(),
                anneeTreso: new Date().getFullYear(),
                moisNoms: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
                postesBudgetaires: [],
                budgetData: {},
                tauxMensuels: Array(12).fill(2500),
                versions: [],
                showHistorique: false,
                modificationsNonSauvegardees: false,

                // Suivi
                previsionParPosteMois: {},
                realiseParPosteMois: {},
                pourcentagePosteMois: {},
                totalPrevisionParPoste: {},
                totalRealiseParPoste: {},
                pourcentageTotalParPoste: {},

                // Trésorerie
                modeManuelSoldeInitial: false,
                soldeInitialAutoCalcule: null,
                soldeInitialSaisi: 0,
                soldesTreso: [],
                debounceTimer: null,
                messageSoldeInitial: '',
                calculAutoPossible: true,

                // Écritures
                ecrituresCaisse: [],
                ecrituresBanque: [],

                // Références pour les inputs
                inputRefs: {},
            };
        },
        computed: {
            // ----- TRÉSORERIE -----
            soldeInitialTreso() {
                if (this.modeManuelSoldeInitial) return this.soldeInitialSaisi;
                const baseCDF = this.soldeInitialAutoCalcule || 0;
                if (this.deviseAffichage === 'CDF') return baseCDF;
                const taux = this.tauxMensuels[0] || 2500;
                return baseCDF / taux;
            },

            // ----- BUDGET -----
            totalDepensesMoisAffichage() {
                const totalCDF = Array(12).fill(0);
                for (let p of this.postesBudgetaires.filter(p => p.type === 'sortie')) {
                    const arr = this.budgetData[p.id] || Array(12).fill(0);
                    for (let i = 0; i < 12; i++) totalCDF[i] += arr[i];
                }
                if (this.deviseAffichage === 'CDF') return totalCDF;
                return totalCDF.map((val, idx) => val / (this.tauxMensuels[idx] || 2500));
            },
            valeursAffichees() {
                const result = {};
                for (const poste of this.postesBudgetaires) {
                    const arrCDF = this.budgetData[poste.id] || Array(12).fill(0);
                    if (this.deviseAffichage === 'CDF') {
                        result[poste.id] = [...arrCDF];
                    } else {
                        result[poste.id] = arrCDF.map((valCDF, mois) => {
                            const taux = this.tauxMensuels[mois] || 2500;
                            return valCDF / taux;
                        });
                    }
                }
                return result;
            },
            totalRevenusMoisAffichage() {
                const totalCDF = Array(12).fill(0);
                for (let p of this.postesBudgetaires.filter(p => p.type === 'entree')) {
                    const arr = this.budgetData[p.id] || Array(12).fill(0);
                    for (let i = 0; i < 12; i++) totalCDF[i] += arr[i];
                }
                if (this.deviseAffichage === 'CDF') return totalCDF;
                return totalCDF.map((val, idx) => val / (this.tauxMensuels[idx] || 2500));
            },
            soldeMoisAffichage() {
                return this.totalRevenusMoisAffichage.map((v, i) => v - this.totalDepensesMoisAffichage[i]);
            },
            totalDepensesAffichage() {
                return this.totalDepensesMoisAffichage.reduce((a, b) => a + b, 0);
            },
            totalRevenusAffichage() {
                return this.totalRevenusMoisAffichage.reduce((a, b) => a + b, 0);
            },
            soldeTotalAffichage() {
                return this.totalRevenusAffichage - this.totalDepensesAffichage;
            },
            totalParPosteAffichage() {
                const totals = {};
                for (let p of this.postesBudgetaires) {
                    const arrCDF = this.budgetData[p.id] || Array(12).fill(0);
                    if (this.deviseAffichage === 'CDF') {
                        totals[p.id] = arrCDF.reduce((a, b) => a + b, 0);
                    } else {
                        let sum = 0;
                        for (let i = 0; i < 12; i++) sum += arrCDF[i] / (this.tauxMensuels[i] || 2500);
                        totals[p.id] = sum;
                    }
                }
                return totals;
            },

            // ----- SUIVI -----
            totalDepensesPrevisionMoisAffichage() {
                const total = Array(12).fill(0);
                for (let p of this.postesBudgetaires.filter(p => p.type === 'sortie')) {
                    const arr = this.previsionParPosteMois[p.id] || Array(12).fill(0);
                    for (let i = 0; i < 12; i++) total[i] += arr[i];
                }
                return total;
            },
            totalDepensesRealiseMoisAffichage() {
                const total = Array(12).fill(0);
                for (let p of this.postesBudgetaires.filter(p => p.type === 'sortie')) {
                    const arr = this.realiseParPosteMois[p.id] || Array(12).fill(0);
                    for (let i = 0; i < 12; i++) total[i] += arr[i];
                }
                return total;
            },
            totalRevenusPrevisionMoisAffichage() {
                const total = Array(12).fill(0);
                for (let p of this.postesBudgetaires.filter(p => p.type === 'entree')) {
                    const arr = this.previsionParPosteMois[p.id] || Array(12).fill(0);
                    for (let i = 0; i < 12; i++) total[i] += arr[i];
                }
                return total;
            },
            totalRevenusRealiseMoisAffichage() {
                const total = Array(12).fill(0);
                for (let p of this.postesBudgetaires.filter(p => p.type === 'entree')) {
                    const arr = this.realiseParPosteMois[p.id] || Array(12).fill(0);
                    for (let i = 0; i < 12; i++) total[i] += arr[i];
                }
                return total;
            },
            totalDepensesPrevisionAffichage() {
                return this.totalDepensesPrevisionMoisAffichage.reduce((a, b) => a + b, 0);
            },
            totalDepensesRealiseAffichage() {
                return this.totalDepensesRealiseMoisAffichage.reduce((a, b) => a + b, 0);
            },
            totalRevenusPrevisionAffichage() {
                return this.totalRevenusPrevisionMoisAffichage.reduce((a, b) => a + b, 0);
            },
            totalRevenusRealiseAffichage() {
                return this.totalRevenusRealiseMoisAffichage.reduce((a, b) => a + b, 0);
            },
            variationMensuelleAffichage() {
                return this.totalRevenusRealiseMoisAffichage.map((v, i) => v - this.totalDepensesRealiseMoisAffichage[i]);
            },
            variationTotaleAffichage() {
                return this.totalRevenusRealiseAffichage - this.totalDepensesRealiseAffichage;
            },
            variationMensuellePrevue() {
                return this.totalRevenusPrevisionMoisAffichage.map((v, i) => v - this.totalDepensesPrevisionMoisAffichage[i]);
            },
            variationTotalePrevue() {
                return this.totalRevenusPrevisionAffichage - this.totalDepensesPrevisionAffichage;
            },

            // Pourcentages totaux
            pourcentageTotalDepenses() {
                const prev = this.totalDepensesPrevisionAffichage;
                const real = this.totalDepensesRealiseAffichage;
                return prev === 0 ? 0 : Math.round((real / prev) * 100);
            },
            pourcentageTotalRevenus() {
                const prev = this.totalRevenusPrevisionAffichage;
                const real = this.totalRevenusRealiseAffichage;
                return prev === 0 ? 0 : Math.round((real / prev) * 100);
            },
            pourcentageVariation() {
                const prev = this.variationTotalePrevue;
                const real = this.variationTotaleAffichage;
                if (prev === 0) return null;
                if ((prev > 0 && real < 0) || (prev < 0 && real > 0)) return null;
                return Math.round((real / prev) * 100);
            },

            // Pourcentages mensuels pour les totaux
            pourcentageDepensesMois() {
                return this.totalDepensesPrevisionMoisAffichage.map((prev, i) => {
                    const real = this.totalDepensesRealiseMoisAffichage[i];
                    return prev === 0 ? 0 : Math.round((real / prev) * 100);
                });
            },
            pourcentageRevenusMois() {
                return this.totalRevenusPrevisionMoisAffichage.map((prev, i) => {
                    const real = this.totalRevenusRealiseMoisAffichage[i];
                    return prev === 0 ? 0 : Math.round((real / prev) * 100);
                });
            },
            pourcentageVariationMois() {
                return this.variationMensuellePrevue.map((prev, i) => {
                    const real = this.variationMensuelleAffichage[i];
                    if (prev === 0) return null;
                    if ((prev > 0 && real < 0) || (prev < 0 && real > 0)) return null;
                    return Math.round((real / prev) * 100);
                });
            },
        },
        watch: {
            anneeBudget() {
                this.chargerPostes();
                this.chargerBudget();
                this.chargerTauxMensuels();
            },
            anneeSuivi() {
                this.chargerPostes();
                this.chargerRealises();
            },
            anneeTreso() {
                this.initialiserSoldeInitial();
                this.calculerProjection();
            },
            deviseAffichage(newVal, oldVal) {
                if (this.modeManuelSoldeInitial && oldVal && newVal !== oldVal) {
                    const taux = this.tauxMensuels[0] || 2500;
                    if (oldVal === 'CDF' && newVal === 'USD') {
                        this.soldeInitialSaisi = this.soldeInitialSaisi / taux;
                    } else if (oldVal === 'USD' && newVal === 'CDF') {
                        this.soldeInitialSaisi = this.soldeInitialSaisi * taux;
                    }
                }
                this.chargerBudget();
                this.chargerRealises();
                this.calculerProjection();
                this.mettreAJourTousLesInputsBudget();
            },
            ecrituresCaisse: { handler() { this.debouncedCalculerProjection(); }, deep: true },
            ecrituresBanque: { handler() { this.debouncedCalculerProjection(); }, deep: true }
        },
        async mounted() {
            await this.chargerPostes();
            await this.chargerBudget();
            await this.chargerTauxMensuels();
            await this.chargerDonneesEcritures();
            await this.chargerRealises();
            await this.initialiserSoldeInitial();
            await this.calculerProjection();

            this.unsubscribePostes = db.postes_budgetaires.hook('creating', () => this.chargerPostes());
            db.postes_budgetaires.hook('updating', () => this.chargerPostes());
            db.postes_budgetaires.hook('deleting', () => this.chargerPostes());
        },
        beforeUnmount() {
            if (this.unsubscribePostes) this.unsubscribePostes();
        },
        methods: {
            // ---------- UTILITAIRES ----------
            formatMontant(montant, devise) {
                if (montant === undefined || montant === null) montant = 0;
                const formatter = new Intl.NumberFormat('fr-FR', {
                    useGrouping: true,
                    maximumFractionDigits: 0,
                    minimumFractionDigits: 0
                });
                let formatted = formatter.format(Math.round(montant));
                return formatted;
            },
            mettreAJourTousLesInputsBudget() {
                Object.entries(this.inputRefs).forEach(([key, input]) => {
                    if (!input) return;
                    const [posteId, mois] = key.split('-');
                    const valeurCDF = (this.budgetData[posteId] || [])[mois] || 0;
                    let valeurAff = valeurCDF;
                    if (this.deviseAffichage === 'USD') {
                        valeurAff = valeurCDF / (this.tauxMensuels[mois] || 2500);
                    }
                    input.value = this.formatSaisie(valeurAff, this.deviseAffichage);
                });
            },
            valeurAfficheeCellule(posteId, mois) {
                const valeurCDF = (this.budgetData[posteId] || [])[mois] || 0;
                if (this.deviseAffichage === 'CDF') return valeurCDF;
                const taux = this.tauxMensuels[mois] || 2500;
                return valeurCDF / taux;
            },
            formatSaisie(valeurCDF, devise) {
                if (valeurCDF === undefined || valeurCDF === null) valeurCDF = 0;
                if (devise === 'CDF') return Math.round(valeurCDF).toString();
                else return Math.round(valeurCDF / (this.tauxMensuels[0] || 2500)).toString();
            },
            formatInputBudget(event, devise) {
                let value = event.target.value;
                const input = event.target;
                value = value.replace(/'/g, '').replace(/\s/g, '').replace(/,/g, '.');
                let number = parseFloat(value);
                if (isNaN(number)) number = 0;
                let formatted = this.formatMontant(number, devise);
                input.value = formatted;
            },
            parseMontantBudget(value) {
                if (!value) return 0;
                let str = value.toString().replace(/'/g, '').replace(/,/g, '.');
                return parseFloat(str);
            },
            montantPoste(posteId, mois) {
                return (this.budgetData[posteId] || [])[mois] || 0;
            },
            setInputRef(el, posteId, mois) {
                if (el) {
                    const key = `${posteId}-${mois}`;
                    this.inputRefs[key] = el;
                }
            },
            updateBudgetValue(posteId, moisIndex, event) {
                const input = event.target;
                const valeurSaisieStr = input.value;
                let valeurSaisie = this.parseMontantBudget(valeurSaisieStr);

                // Conversion en CDF
                let valeurCDF = valeurSaisie;
                if (this.deviseAffichage === 'USD') {
                    valeurCDF = valeurSaisie * (this.tauxMensuels[moisIndex] || 2500);
                }

                if (!this.budgetData[posteId]) this.budgetData[posteId] = Array(12).fill(0);
                this.budgetData[posteId][moisIndex] = valeurCDF;
                this.budgetData = { ...this.budgetData };
                this.modificationsNonSauvegardees = true;

                // Reformater l'input avec la valeur convertie (arrondie)
                input.value = this.formatSaisie(valeurCDF, this.deviseAffichage);
            },
            updateTauxValue(moisIndex, valeurSaisieStr) {
                let valeurSaisie = this.parseMontantBudget(valeurSaisieStr);
                this.tauxMensuels[moisIndex] = valeurSaisie;
                this.sauvegarderTauxMensuels();
            },
            formatDate(dateStr) { return dateStr ? new Date(dateStr).toLocaleString() : ''; },
            changerDevise(devise) { this.deviseAffichage = devise; },

            getPourcentageClassDepenses(pct) {
                if (pct === null || pct === undefined) return '';
                if (pct <= 100) return 'bg-success text-white';
                if (pct <= 110) return 'bg-warning text-dark';
                return 'bg-danger text-white';
            },
            getPourcentageClassRevenus(pct) {
                if (pct === null || pct === undefined) return '';
                if (pct < 100) return 'bg-danger text-white';
                return 'bg-success text-white';
            },
            getPourcentageClassVariation(pct) {
                if (pct === null || pct === undefined) return '';
                if (pct >= 100) return 'bg-success text-white';
                if (pct >= 0) return 'bg-warning text-dark';
                return 'bg-danger text-white';
            },

            // ---------- POSTES ----------
            async chargerPostes() {
                this.postesBudgetaires = await db.postes_budgetaires.where('annee').equals(this.anneeBudget).toArray();
                if (this.postesBudgetaires.length === 0) {
                    const defaut = [
                        { id: crypto.randomUUID(), annee: this.anneeBudget, nom: "Vente d'huile", type: 'entree', lieFacture: true, actif: true, systeme: false },
                        { id: crypto.randomUUID(), annee: this.anneeBudget, nom: "Transport régimes", type: 'sortie', lieFacture: false, actif: true, systeme: false },
                        { id: crypto.randomUUID(), annee: this.anneeBudget, nom: "Carburant", type: 'sortie', lieFacture: false, actif: true, systeme: false }
                    ];
                    await db.postes_budgetaires.bulkAdd(defaut);
                    this.postesBudgetaires = await db.postes_budgetaires.where('annee').equals(this.anneeBudget).toArray();
                }
            },

            // ---------- BUDGET ----------
            async chargerBudget() {
                const versions = await db.budget_versions.where('annee').equals(this.anneeBudget).reverse().sortBy('version');
                if (versions.length === 0) {
                    this.budgetData = {};
                    for (let p of this.postesBudgetaires) this.budgetData[p.id] = Array(12).fill(0);
                } else {
                    this.budgetData = versions[0].donnees;
                }
                this.modificationsNonSauvegardees = false;
            },
            async sauvegarderBudget() {
                const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
                const count = await db.budget_versions.where('annee').equals(this.anneeBudget).count();
                const nouvelleVersion = count + 1;
                await db.budget_versions.add({
                    id: crypto.randomUUID(),
                    annee: this.anneeBudget,
                    version: nouvelleVersion,
                    date_creation: new Date().toISOString(),
                    utilisateur_id: user.id,
                    utilisateur_nom: user.nom,
                    donnees: JSON.parse(JSON.stringify(this.budgetData))
                });
                this.modificationsNonSauvegardees = false;
                alert(`Budget ${this.anneeBudget} version ${nouvelleVersion} sauvegardé`);
            },
            async chargerHistorique() {
                this.versions = await db.budget_versions.where('annee').equals(this.anneeBudget).reverse().sortBy('version');
                this.showHistorique = true;
            },
            restaurerVersion(version) {
                if (confirm(`Restaurer la version ${version.version} ?`)) {
                    this.budgetData = version.donnees;
                    this.showHistorique = false;
                    this.modificationsNonSauvegardees = true;
                }
            },

            // ---------- TAUX MENSUELS ----------
            async chargerTauxMensuels() {
                const tauxData = await db.taux_change_mensuel.where('annee').equals(this.anneeBudget).toArray();
                const tauxParMois = Array(12).fill(2500);
                for (let t of tauxData) tauxParMois[t.mois - 1] = t.taux;
                this.tauxMensuels = tauxParMois;
            },
            async sauvegarderTauxMensuels() {
                for (let i = 0; i < 12; i++) {
                    const mois = i + 1;
                    const existant = await db.taux_change_mensuel.where({ annee: this.anneeBudget, mois }).first();
                    if (existant) await db.taux_change_mensuel.update(existant.id, { taux: this.tauxMensuels[i] });
                    else await db.taux_change_mensuel.add({ id: crypto.randomUUID(), annee: this.anneeBudget, mois, taux: this.tauxMensuels[i] });
                }
            },

            // ---------- SUIVI ----------
            async getTauxJour(dateStr) {
                const taux = await db.taux_change.where('date').equals(dateStr).first();
                if (taux) return taux.taux;
                const tauxAvant = await db.taux_change.where('date').below(dateStr).last();
                return tauxAvant ? tauxAvant.taux : 2500;
            },
            async chargerRealises() {
                this.previsionParPosteMois = {};
                this.realiseParPosteMois = {};
                this.pourcentagePosteMois = {};
                this.totalPrevisionParPoste = {};
                this.totalRealiseParPoste = {};
                this.pourcentageTotalParPoste = {};

                const postesAnnee = await db.postes_budgetaires.where('annee').equals(this.anneeSuivi).toArray();
                const versions = await db.budget_versions.where('annee').equals(this.anneeSuivi).reverse().sortBy('version');
                const budgetData = versions.length ? versions[0].donnees : {};

                const tauxParMois = Array(12).fill(2500);
                const tauxMensuels = await db.taux_change_mensuel.where('annee').equals(this.anneeSuivi).toArray();
                for (let t of tauxMensuels) tauxParMois[t.mois - 1] = t.taux;

                // Prévisions
                for (let p of postesAnnee) {
                    const valeurs = budgetData[p.id] || Array(12).fill(0);
                    this.previsionParPosteMois[p.id] = Array(12).fill(0);
                    this.realiseParPosteMois[p.id] = Array(12).fill(0);
                    let totalPrevu = 0;
                    for (let m = 0; m < 12; m++) {
                        let montantCDF = valeurs[m] || 0;
                        let montantAff = (this.deviseAffichage === 'USD') ? (montantCDF / (tauxParMois[m] || 2500)) : montantCDF;
                        this.previsionParPosteMois[p.id][m] = montantAff;
                        totalPrevu += montantAff;
                    }
                    this.totalPrevisionParPoste[p.id] = totalPrevu;
                }

                // Réalisations
                for (let m = 0; m < 12; m++) {
                    const { caisse, banque, manuelles } = await getMouvementsBudget(this.anneeSuivi, m + 1);

                    // Traitement caisse
                    for (const mvt of caisse) {
                        const poste = postesAnnee.find(p => p.nom === mvt.poste);
                        if (poste) {
                            const montant = (this.deviseAffichage === 'CDF') ? (mvt.montantCdf || 0) : (mvt.montantUsd || 0);
                            this.realiseParPosteMois[poste.id][m] += Math.abs(montant);
                        }
                    }

                    // Traitement banque
                    for (const mvt of banque) {
                        const poste = postesAnnee.find(p => p.id === mvt.posteId);
                        if (poste) {
                            const montant = (this.deviseAffichage === 'CDF') ? (mvt.montantCdf || 0) : (mvt.montantUsd || 0);
                            this.realiseParPosteMois[poste.id][m] += Math.abs(montant);
                        }
                    }

                    // Traitement écritures manuelles
                    for (const mvt of manuelles) {
                        const poste = postesAnnee.find(p => p.nom === mvt.poste);
                        if (poste) {
                            const montant = (this.deviseAffichage === 'CDF') ? (mvt.montantCdf || 0) : (mvt.montantUsd || 0);
                            this.realiseParPosteMois[poste.id][m] += Math.abs(montant);
                        }
                    }
                }

                // Pourcentages (inchangé)
                for (let p of postesAnnee) {
                    let totalReal = 0;
                    for (let m = 0; m < 12; m++) {
                        const prev = this.previsionParPosteMois[p.id][m];
                        const real = this.realiseParPosteMois[p.id][m];
                        this.pourcentagePosteMois[p.id] = this.pourcentagePosteMois[p.id] || Array(12).fill(0);
                        this.pourcentagePosteMois[p.id][m] = prev ? Math.round((real / prev) * 100) : 0;
                        totalReal += real;
                    }
                    this.totalRealiseParPoste[p.id] = totalReal;
                    const totalPrev = this.totalPrevisionParPoste[p.id] || 0;
                    this.pourcentageTotalParPoste[p.id] = totalPrev ? Math.round((totalReal / totalPrev) * 100) : 0;
                }
            },

            async exporterSuivi() {
                const element = document.getElementById('suivi-budget-table');
                if (!element) return;
                try {
                    const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
                    const link = document.createElement('a');
                    link.download = `suivi_budget_${this.anneeSuivi}.png`;
                    link.href = canvas.toDataURL();
                    link.click();
                } catch (error) {
                    console.error('Erreur export:', error);
                    alert('Impossible d\'exporter le tableau.');
                }
            },

            // ---------- TRÉSORERIE ----------
            async verifierClotureEtJustificatifs(annee) {
                const anneePrec = annee - 1;
                const dateDebut = `${anneePrec}-01-01`;
                const dateFin = `${anneePrec}-12-31`;

                const semainesNonCloturees = await db.semaines_caisse
                    .where('dateFin').between(dateDebut, dateFin, true, true)
                    .filter(s => !s.estCloturee)
                    .count();
                if (semainesNonCloturees > 0) {
                    return { ok: false, raison: `Il reste des semaines non clôturées en ${anneePrec}.` };
                }

                const mouvementsAJustifier = await db.mouvementsCaisse
                    .where('date').between(dateDebut, dateFin, true, true)
                    .filter(m => m.aJustifier === true && !m.annule)
                    .count();
                if (mouvementsAJustifier > 0) {
                    return { ok: false, raison: `Il reste des écritures "à justifier" non traitées en ${anneePrec}.` };
                }
                return { ok: true };
            },
            async calculerSoldeInitialAuto(annee) {
                const anneePrecedente = annee - 1;
                const dateFinAnneePrec = `${anneePrecedente}-12-31`;
                const dateDebutAnnee = `${annee}-01-01`;

                const verif = await this.verifierClotureEtJustificatifs(annee);
                if (!verif.ok) {
                    this.messageSoldeInitial = verif.raison;
                    this.calculAutoPossible = false;
                    return null;
                }

                const caisses = await db.caisses.toArray();
                const comptes = await db.comptes_bancaires.toArray();
                let totalCDF = 0;
                let totalUSD = 0;
                let auMoinsUneCaisse = false;

                const tauxDebutAnnee = await this.getTauxPourDate(dateDebutAnnee);

                for (let caisse of caisses) {
                    const mouvements = await db.mouvementsCaisse
                        .where('caisseId').equals(caisse.id)
                        .filter(m => m.date <= dateFinAnneePrec && m.status === 'validé' && !m.annule)
                        .toArray();
                    let soldeCDF = 0, soldeUSD = 0;
                    for (let mvt of mouvements) {
                        if (mvt.devise === 'CDF') {
                            soldeCDF += (mvt.type === 'entree' ? mvt.montant : -mvt.montant);
                        } else {
                            soldeUSD += (mvt.type === 'entree' ? mvt.montant : -mvt.montant);
                        }
                    }
                    if (soldeCDF !== 0 || soldeUSD !== 0) auMoinsUneCaisse = true;
                    totalCDF += soldeCDF;
                    totalUSD += soldeUSD;
                }

                for (let compte of comptes) {
                    const mouvements = await db.mouvements_bancaires
                        .where('compte_id').equals(compte.id)
                        .filter(m => m.date_operation <= dateFinAnneePrec && m.statut === 'valide')
                        .toArray();
                    let solde = compte.solde_initial || 0;
                    for (let mvt of mouvements) {
                        solde += (mvt.type === 'credit' ? mvt.montant : -mvt.montant);
                    }
                    if (solde !== 0) auMoinsUneCaisse = true;
                    if (compte.devise === 'CDF') totalCDF += solde;
                    else totalUSD += solde;
                }

                if (!auMoinsUneCaisse) {
                    this.messageSoldeInitial = `Aucune caisse ou compte bancaire avec un solde au 31/12/${anneePrecedente}. Veuillez saisir le solde manuellement.`;
                    this.calculAutoPossible = false;
                    return null;
                }

                this.calculAutoPossible = true;
                this.messageSoldeInitial = '';
                return totalCDF + totalUSD * tauxDebutAnnee;
            },
            async getTauxPourDate(dateStr) {
                const taux = await db.taux_change.where('date').equals(dateStr).first();
                if (taux) return taux.taux;
                const tauxAvant = await db.taux_change.where('date').below(dateStr).last();
                return tauxAvant ? tauxAvant.taux : 2500;
            },
            async getTauxParMois(annee) {
                const tauxParMois = Array(12).fill(2500);
                const tauxMensuels = await db.taux_change_mensuel.where('annee').equals(annee).toArray();
                for (let t of tauxMensuels) tauxParMois[t.mois - 1] = t.taux;
                return tauxParMois;
            },
            async initialiserSoldeInitial() {
                this.modeManuelSoldeInitial = false;
                this.soldeInitialAutoCalcule = await this.calculerSoldeInitialAuto(this.anneeTreso);
                if (this.soldeInitialAutoCalcule === null) {
                    this.modeManuelSoldeInitial = true;
                    this.soldeInitialSaisi = 0;
                }
            },
            async recalculerSoldeInitial() {
                this.modeManuelSoldeInitial = false;
                await this.initialiserSoldeInitial();
                this.calculerProjection();
            },
            updateSoldeInitial(valeurSaisieStr) {
                if (!this.modeManuelSoldeInitial) return;
                let valeur = this.parseMontantBudget(valeurSaisieStr);
                this.soldeInitialSaisi = valeur;
                this.calculerProjection();
            },
            async calculerProjection() {
                const versions = await db.budget_versions.where('annee').equals(this.anneeTreso).reverse().sortBy('version');
                const budgetData = versions.length ? versions[0].donnees : {};
                const postesAnnee = await db.postes_budgetaires.where('annee').equals(this.anneeTreso).toArray();
                const tauxParMois = await this.getTauxParMois(this.anneeTreso);
                const mouvementsCaisse = await db.mouvementsCaisse.where('status').equals('validé').toArray();
                const mouvementsBanque = await db.mouvements_bancaires.where('statut').equals('valide').toArray();

                let soldeInitial = this.soldeInitialTreso;
                let cumul = soldeInitial;
                const nouveauxSoldes = [];
                const aujourdhui = new Date();
                const moisActuel = aujourdhui.getMonth();
                const anneeActuelle = aujourdhui.getFullYear();

                for (let m = 0; m < 12; m++) {
                    let entrees = 0, sorties = 0;
                    const dateMois = new Date(this.anneeTreso, m, 1);

                    if (dateMois < new Date(anneeActuelle, moisActuel, 1) || this.anneeTreso < anneeActuelle) {
                        for (let p of postesAnnee) {
                            const realisationsCaisse = mouvementsCaisse.filter(mvt => {
                                const d = new Date(mvt.date);
                                return d.getFullYear() === this.anneeTreso && d.getMonth() === m && mvt.posteBudgetaire === p.nom;
                            });
                            const realisationsBanque = mouvementsBanque.filter(mvt => {
                                const d = new Date(mvt.date_operation);
                                return d.getFullYear() === this.anneeTreso && d.getMonth() === m && mvt.poste_id === p.id;
                            });
                            let totalReal = 0;
                            for (let r of realisationsCaisse) {
                                let montant = r.montant;
                                if (r.devise !== this.deviseAffichage) {
                                    if (this.deviseAffichage === 'USD') montant = r.montant / tauxParMois[m];
                                    else montant = r.montant * tauxParMois[m];
                                }
                                totalReal += (r.type === 'entree' ? montant : -montant);
                            }
                            for (let r of realisationsBanque) {
                                let montant = r.montant;
                                if (r.devise !== this.deviseAffichage) {
                                    if (this.deviseAffichage === 'USD') montant = r.montant / tauxParMois[m];
                                    else montant = r.montant * tauxParMois[m];
                                }
                                totalReal += (r.type === 'credit' ? montant : -montant);
                            }
                            if (p.type === 'entree') entrees += Math.max(0, totalReal);
                            else sorties += Math.max(0, -totalReal);
                        }
                    } else {
                        for (let p of postesAnnee) {
                            const montantCDF = budgetData[p.id]?.[m] || 0;
                            let montantAff = montantCDF;
                            if (this.deviseAffichage === 'USD') montantAff = montantCDF / tauxParMois[m];
                            if (p.type === 'entree') entrees += montantAff;
                            else sorties += montantAff;
                        }
                    }

                    const debut = cumul;
                    const fin = debut + entrees - sorties;
                    nouveauxSoldes.push({ debut, entrees, sorties, fin });
                    cumul = fin;
                }
                this.soldesTreso = nouveauxSoldes;
            },
            debouncedCalculerProjection() {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => this.calculerProjection(), 300);
            },

            async chargerDonneesEcritures() {
                this.ecrituresCaisse = await db.mouvementsCaisse.where('status').equals('validé').toArray();
                this.ecrituresBanque = await db.mouvements_bancaires.where('statut').equals('valide').toArray();
            },
        }
    };
</script>

<style scoped>
    /* Conteneur avec scroll */
    .budget-table-container {
        max-height: 70vh;
        overflow: auto;
        border: 2px solid #dee2e6;
        border-radius: 8px;
        margin: 1rem;
        position: relative;
    }

    /* Scrollbar personnalisée */
    .budget-table-container::-webkit-scrollbar {
        width: 12px;
        height: 12px;
    }

    .budget-table-container::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
    }

    .budget-table-container::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 10px;
    }

    .budget-table-container::-webkit-scrollbar-thumb:hover {
        background: #555;
    }

    /* Table de base */
    .budget-table {
        border-collapse: separate !important;
        border-spacing: 0;
        margin-bottom: 0;
        font-size: 0.85rem;
        table-layout: fixed;
        width: max-content;
        min-width: 100%;
    }

    /* Lignes */
    .budget-table tbody tr {
        height: 42px;
    }

    .budget-table tbody td {
        vertical-align: middle;
        text-align: right;
        padding: 0.3rem 0.5rem;
    }

    .budget-table tbody td:first-child {
        text-align: left;
    }

    /* Inputs */
    .budget-table input.form-control {
        text-align: right;
        padding: 0.15rem 0.25rem;
        font-size: 0.85rem;
    }

    /* ===== STICKY VERTICAL (en-têtes) ===== */
    .budget-table thead tr:first-child th {
        position: sticky;
        top: 0;
        z-index: 110;
        background-color: #f8f9fa !important;
    }



    /* ===== LARGEURS FIXES ===== */
    .sticky-col-post {
        min-width: 160px !important;
        max-width: 160px;
        width: 160px;
    }

    .sticky-col-total {
        min-width: 120px !important;
        max-width: 120px;
        width: 120px;
    }

    .sticky-col-budget,
    .sticky-col-realise,
    .sticky-col-percent {
        min-width: 120px !important;
        max-width: 120px;
        width: 120px;
    }

    /* ===== STICKY HORIZONTAL ===== */
    /* Colonne Poste */
    .sticky-col-post {
        position: sticky;
        left: 0;
        background-color: white !important;
        z-index: 100;
        box-shadow: 2px 0 5px -2px rgba(0, 0, 0, 0.1);
    }

    /* Colonne Total */
    .sticky-col-total {
        position: sticky;
        left: 160px;
        background-color: white !important;
        z-index: 99;
    }

    /* Sous-colonnes du bloc Total */
    .sticky-col-budget {
        position: sticky;
        left: 160px;
        background-color: white !important;
        z-index: 98;
    }

    .sticky-col-realise {
        position: sticky;
        left: 280px;
        /* 160 + 120 */
        background-color: white !important;
        z-index: 98;
    }

    .sticky-col-percent {
        position: sticky;
        left: 400px;
        /* 280 + 120 */
        background-color: white !important;
        z-index: 98;
    }

    /* Cas spécifique du tableau de suivi (pour éviter des conflits) */
    .suivi-table .sticky-col-budget {
        left: 160px;
    }

    .suivi-table .sticky-col-realise {
        left: 280px;
    }

    .suivi-table .sticky-col-percent {
        left: 400px;
    }

    /* ===== FONDS OPAQUES POUR TOUTES LES CELLULES STICKY ===== */
    .budget-table tbody td {
        background-color: inherit !important;
    }

    /* Force le fond blanc pour les cellules sticky du corps */
    .budget-table tbody .sticky-col-post,
    .budget-table tbody .sticky-col-total,
    .budget-table tbody .sticky-col-budget,
    .budget-table tbody .sticky-col-realise,
    .budget-table tbody .sticky-col-percent {
        background-color: white !important;
    }

    /* Maintient le fond coloré pour les lignes de totaux (bleu/vert) */
    .bg-primary .sticky-col-post,
    .bg-primary .sticky-col-total,
    .bg-primary .sticky-col-budget,
    .bg-primary .sticky-col-realise,
    .bg-primary .sticky-col-percent,
    .bg-success .sticky-col-post,
    .bg-success .sticky-col-total,
    .bg-success .sticky-col-budget,
    .bg-success .sticky-col-realise,
    .bg-success .sticky-col-percent {
        background-color: inherit !important;
    }

    /* ===== BORDURES ===== */
    .mois-header {
        border-right: 4px solid #6c757d !important;
    }

    .border-end-bold {
        border-right: 4px solid #6c757d !important;
    }

    .border-start-bold {
        border-left: 4px solid #6c757d !important;
    }

    .total-row {
        border-top: 4px solid #0d6efd !important;
        border-bottom: 4px solid #0d6efd !important;
    }

    /* Colonnes normales (non sticky) */
    .budget-table th:not([class*="sticky-col"]),
    .budget-table td:not([class*="sticky-col"]) {
        min-width: 50px;
    }

    /* ===== LIGNE TAUX DE CHANGE (non sticky verticalement mais au-dessus des en-têtes) ===== */
    .taux-cell {
        position: relative;
        z-index: 200 !important;
        background-color: #e9ecef !important;
    }

    .sticky-col-post.taux-cell {
        left: 0;
        z-index: 201 !important;
    }

    .sticky-col-total.taux-cell {
        left: 160px;
    }
</style>