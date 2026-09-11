<template>
    <div class="container-fluid">
        <h2 class="mb-4" style="color: #ED1C24;">Budgets</h2>

        <!-- Sélecteur de devise global -->
        <div class="card mb-3">
            <div class="card-body py-2">
                <div class="row align-items-center">
                    <div class="col-auto"><strong>Devise d'affichage :</strong></div>
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
            <li class="nav-item">
                <a class="nav-link" :class="{ active: onglet === 'budget' }" href="#"
                    @click.prevent="onglet = 'budget'">📊 Saisie budget</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" :class="{ active: onglet === 'suivi' }" href="#"
                    @click.prevent="onglet = 'suivi'">📈 Suivi budgétaire</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" :class="{ active: onglet === 'tresorerie' }" href="#"
                    @click.prevent="onglet = 'tresorerie'">💰 Trésorerie</a>
            </li>
        </ul>

        <!-- ==================== ONGLET SAISIE DU BUDGET ==================== -->
        <div v-if="onglet === 'budget'" class="mt-3">
            <div class="row mb-3">
                <div class="col-md-4">
                    <div class="card border-success">
                        <div class="card-body py-2">
                            <small class="text-muted">Total revenus prévus</small>
                            <h4 class="text-success mb-0">{{ formatMontant(totalRevenusAffichage, deviseAffichage) }} {{ deviseAffichage }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card border-warning">
                        <div class="card-body py-2">
                            <small class="text-muted">Total dépenses prévues</small>
                            <h4 class="text-warning mb-0">{{ formatMontant(totalDepensesAffichage, deviseAffichage) }} {{ deviseAffichage }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card" :class="soldeTotalAffichage >= 0 ? 'border-success' : 'border-danger'">
                        <div class="card-body py-2">
                            <small class="text-muted">Variation de trésorerie</small>
                            <h4 class="mb-0" :class="soldeTotalAffichage >= 0 ? 'text-success' : 'text-danger'">
                                {{ formatMontant(soldeTotalAffichage, deviseAffichage) }} {{ deviseAffichage }}
                            </h4>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center flex-wrap">
                    <span><i class="bi bi-pencil-square"></i> Budget annuel {{ anneeBudget }}</span>
                    <div class="d-flex gap-2">
                        <select v-model="anneeBudget" class="form-select form-select-sm w-auto">
                            <option v-for="a in anneesDisponibles" :key="a" :value="a">{{ a }}</option>
                        </select>
                        <button class="btn btn-sm btn-success" @click="sauvegarderBudget">💾 Enregistrer</button>
                        <button class="btn btn-sm btn-secondary" @click="chargerHistorique">📜 Historique</button>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="budget-table-wrapper">
                        <table class="table budget-input-table">
                            <thead>
                                <tr class="header-row">
                                    <th class="col-poste">Poste</th>
                                    <th class="col-total text-center">Total annuel</th>
                                    <th v-for="m in 12" :key="m" class="text-center col-mois">{{ moisNoms[m-1] }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="row-taux">
                                    <td class="col-poste fw-bold"><i class="bi bi-currency-exchange"></i> Taux USD → CDF</td>
                                    <td class="col-total text-center text-muted">—</td>
                                    <td v-for="m in 12" :key="m" class="col-mois">
                                        <input type="text" class="form-control form-control-sm text-end"
                                            :value="formatMontant(tauxMensuels[m-1], 'CDF')"
                                            @input="formatInputBudget($event)"
                                            @blur="updateTauxValue(m-1, $event.target.value)">
                                    </td>
                                </tr>
                                <tr class="section-header section-depenses">
                                    <td colspan="14">
                                        <i class="bi bi-cart-dash"></i> DÉPENSES
                                        <span class="text-muted ms-2">— Total : {{ formatMontant(totalDepensesAffichage, deviseAffichage) }} {{ deviseAffichage }}</span>
                                    </td>
                                </tr>
                                <tr v-for="poste in postesDepenses" :key="poste.id" class="row-poste">
                                    <td class="fw-bold col-poste"><i class="bi bi-dot text-warning"></i>{{ poste.nom }}</td>
                                    <td class="text-end fw-bold col-total bg-light">{{ formatMontant(totalParPosteAffichage[poste.id], deviseAffichage) }}</td>
                                    <td v-for="m in 12" :key="m" class="col-mois">
                                        <input type="text" class="form-control form-control-sm text-end"
                                            :value="formatMontant(valeurAfficheeCellule(poste.id, m-1), deviseAffichage)"
                                            @input="formatInputBudget($event)"
                                            @blur="updateBudgetValue(poste.id, m-1, $event)">
                                    </td>
                                </tr>
                                <tr class="total-row total-depenses">
                                    <td class="col-poste fw-bold">TOTAL DÉPENSES</td>
                                    <td class="col-total text-end fw-bold">{{ formatMontant(totalDepensesAffichage, deviseAffichage) }}</td>
                                    <td v-for="m in 12" :key="m" class="text-end fw-bold col-mois">{{ formatMontant(totalDepensesMoisAffichage[m-1], deviseAffichage) }}</td>
                                </tr>

                                <tr class="section-header section-revenus">
                                    <td colspan="14">
                                        <i class="bi bi-cart-plus"></i> REVENUS
                                        <span class="text-muted ms-2">— Total : {{ formatMontant(totalRevenusAffichage, deviseAffichage) }} {{ deviseAffichage }}</span>
                                    </td>
                                </tr>
                                <tr v-for="poste in postesRevenus" :key="poste.id" class="row-poste">
                                    <td class="fw-bold col-poste"><i class="bi bi-dot text-success"></i>{{ poste.nom }}</td>
                                    <td class="text-end fw-bold col-total bg-light">{{ formatMontant(totalParPosteAffichage[poste.id], deviseAffichage) }}</td>
                                    <td v-for="m in 12" :key="m" class="col-mois">
                                        <input type="text" class="form-control form-control-sm text-end"
                                            :value="formatMontant(valeurAfficheeCellule(poste.id, m-1), deviseAffichage)"
                                            @input="formatInputBudget($event)"
                                            @blur="updateBudgetValue(poste.id, m-1, $event)">
                                    </td>
                                </tr>
                                <tr class="total-row total-revenus">
                                    <td class="col-poste fw-bold">TOTAL REVENUS</td>
                                    <td class="col-total text-end fw-bold">{{ formatMontant(totalRevenusAffichage, deviseAffichage) }}</td>
                                    <td v-for="m in 12" :key="m" class="text-end fw-bold col-mois">{{ formatMontant(totalRevenusMoisAffichage[m-1], deviseAffichage) }}</td>
                                </tr>
                                <tr class="total-row total-variation">
                                    <td class="col-poste fw-bold">VARIATION TRÉSORERIE</td>
                                    <td class="col-total text-end fw-bold" :class="soldeTotalAffichage >= 0 ? 'text-success' : 'text-danger'">{{ formatMontant(soldeTotalAffichage, deviseAffichage) }}</td>
                                    <td v-for="m in 12" :key="m" class="text-end fw-bold col-mois"
                                        :class="soldeMoisAffichage[m-1] >= 0 ? 'text-success' : 'text-danger'">
                                        {{ formatMontant(soldeMoisAffichage[m-1], deviseAffichage) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

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
                                    <tr><th>Version</th><th>Date</th><th>Utilisateur</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    <tr v-for="v in versions" :key="v.version">
                                        <td>{{ v.version }}</td>
                                        <td>{{ formatDate(v.date_creation) }}</td>
                                        <td>{{ v.utilisateur_nom || '-' }}</td>
                                        <td><button class="btn btn-sm btn-primary" @click="restaurerVersion(v)">Restaurer</button></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ==================== ONGLET SUIVI ==================== -->
        <div v-if="onglet === 'suivi'" class="mt-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0"><i class="bi bi-speedometer2"></i> Tableau de bord budgétaire</h5>
                <div class="d-flex gap-2">
                    <select v-model="anneeSuivi" class="form-select form-select-sm w-auto">
                        <option v-for="a in anneesDisponibles" :key="a" :value="a">{{ a }}</option>
                    </select>
                    <button class="btn btn-sm btn-outline-primary" @click="exporterSuivi">
                        <i class="bi bi-camera"></i> Exporter
                    </button>
                </div>
            </div>

            <div class="row mb-4" id="suivi-budget-table">
                <div class="col-md-3 mb-3">
                    <div class="card kpi-card h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="text-muted mb-2">CA réalisé / prévu</h6>
                                    <h3 class="mb-1">{{ formatMontant(totalRevenusRealiseAffichage, deviseAffichage) }}</h3>
                                    <small class="text-muted">sur {{ formatMontant(totalRevenusPrevisionAffichage, deviseAffichage) }}</small>
                                </div>
                                <div class="kpi-icon" :class="getPourcentageClassRevenus(pourcentageTotalRevenus)"><i class="bi bi-graph-up-arrow"></i></div>
                            </div>
                            <div class="progress mt-3" style="height: 8px;">
                                <div class="progress-bar" :class="getBarClassRevenus(pourcentageTotalRevenus)"
                                    :style="{ width: Math.min(pourcentageTotalRevenus, 100) + '%' }"></div>
                            </div>
                            <div class="text-end mt-1"><strong>{{ pourcentageTotalRevenus }}%</strong></div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card kpi-card h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="text-muted mb-2">Dépenses réalisées / prévues</h6>
                                    <h3 class="mb-1">{{ formatMontant(totalDepensesRealiseAffichage, deviseAffichage) }}</h3>
                                    <small class="text-muted">sur {{ formatMontant(totalDepensesPrevisionAffichage, deviseAffichage) }}</small>
                                </div>
                                <div class="kpi-icon" :class="getPourcentageClassDepenses(pourcentageTotalDepenses)"><i class="bi bi-cash-coin"></i></div>
                            </div>
                            <div class="progress mt-3" style="height: 8px;">
                                <div class="progress-bar" :class="getBarClassDepenses(pourcentageTotalDepenses)"
                                    :style="{ width: Math.min(pourcentageTotalDepenses, 100) + '%' }"></div>
                            </div>
                            <div class="text-end mt-1"><strong>{{ pourcentageTotalDepenses }}%</strong></div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card kpi-card h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="text-muted mb-2">Variation de trésorerie</h6>
                                    <h3 class="mb-1" :class="variationTotaleAffichage >= 0 ? 'text-success' : 'text-danger'">{{ formatMontant(variationTotaleAffichage, deviseAffichage) }}</h3>
                                    <small class="text-muted">Prévu : {{ formatMontant(variationTotalePrevue, deviseAffichage) }}</small>
                                </div>
                                <div class="kpi-icon" :class="variationTotaleAffichage >= 0 ? 'bg-success text-white' : 'bg-danger text-white'"><i class="bi bi-wallet2"></i></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card kpi-card h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="text-muted mb-2">Postes en dépassement</h6>
                                    <h3 class="mb-1" :class="postesEnDepassement.length > 0 ? 'text-danger' : 'text-success'">{{ postesEnDepassement.length }}</h3>
                                    <small class="text-muted">sur {{ postesBudgetaires.length }} postes</small>
                                </div>
                                <div class="kpi-icon" :class="postesEnDepassement.length > 0 ? 'bg-danger text-white' : 'bg-success text-white'"><i class="bi bi-exclamation-triangle"></i></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mb-4">
                <div class="col-md-6 mb-3">
                    <div class="card h-100">
                        <div class="card-header"><i class="bi bi-graph-up"></i> Évolution du chiffre d'affaires</div>
                        <div class="card-body"><div class="chart-wrapper"><canvas id="chartCA"></canvas></div></div>
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <div class="card h-100">
                        <div class="card-header"><i class="bi bi-graph-down"></i> Évolution des dépenses</div>
                        <div class="card-body"><div class="chart-wrapper"><canvas id="chartDepenses"></canvas></div></div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span><i class="bi bi-table"></i> Synthèse annuelle par poste</span>
                    <div class="d-flex gap-2">
                        <span class="badge bg-success">≤100%</span>
                        <span class="badge bg-warning text-dark">100-110%</span>
                        <span class="badge bg-danger">>110%</span>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Type</th><th>Poste</th>
                                    <th class="text-end">Prévu annuel</th>
                                    <th class="text-end">Réalisé annuel</th>
                                    <th class="text-end">Écart</th>
                                    <th class="text-center">%</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                <template v-for="poste in postesBudgetaires" :key="poste.id">
                                    <tr>
                                        <td>
                                            <span v-if="poste.type === 'entree'" class="badge bg-success"><i class="bi bi-arrow-up"></i> Revenu</span>
                                            <span v-else class="badge bg-warning text-dark"><i class="bi bi-arrow-down"></i> Dépense</span>
                                        </td>
                                        <td class="fw-bold">{{ poste.nom }}</td>
                                        <td class="text-end">{{ formatMontant(totalPrevisionParPoste[poste.id] || 0, deviseAffichage) }}</td>
                                        <td class="text-end">{{ formatMontant(totalRealiseParPoste[poste.id] || 0, deviseAffichage) }}</td>
                                        <td class="text-end" :class="getEcartClass(poste, totalRealiseParPoste[poste.id], totalPrevisionParPoste[poste.id])">
                                            {{ formatMontant((totalRealiseParPoste[poste.id] || 0) - (totalPrevisionParPoste[poste.id] || 0), deviseAffichage) }}
                                        </td>
                                        <td class="text-center">
                                            <span class="badge"
                                                :class="poste.type === 'entree' ? getPourcentageClassRevenus(pourcentageTotalParPoste[poste.id]) : getPourcentageClassDepenses(pourcentageTotalParPoste[poste.id])">
                                                {{ pourcentageTotalParPoste[poste.id] || 0 }}%
                                            </span>
                                        </td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-primary" @click="voirDetailPoste(poste)">
                                                <i class="bi bi-eye"></i> Détail
                                            </button>
                                        </td>
                                    </tr>
                                </template>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal détail poste -->
        <div v-if="posteEnDetail" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            Détail mensuel : {{ posteEnDetail.nom }}
                            <span v-if="posteEnDetail.type === 'entree'" class="badge bg-success ms-2">Revenu</span>
                            <span v-else class="badge bg-warning text-dark ms-2">Dépense</span>
                        </h5>
                        <button type="button" class="btn-close" @click="posteEnDetail = null"></button>
                    </div>
                    <div class="modal-body p-0">
                        <table class="table table-sm mb-0">
                            <thead class="table-light">
                                <tr><th>Mois</th><th class="text-end">Prévu</th><th class="text-end">Réalisé</th><th class="text-end">Écart</th><th class="text-center">%</th></tr>
                            </thead>
                            <tbody>
                                <tr v-for="(nom, idx) in moisNomsComplets" :key="idx">
                                    <td>{{ nom }}</td>
                                    <td class="text-end">{{ formatMontant(previsionParPosteMois[posteEnDetail.id]?.[idx] || 0, deviseAffichage) }}</td>
                                    <td class="text-end">{{ formatMontant(realiseParPosteMois[posteEnDetail.id]?.[idx] || 0, deviseAffichage) }}</td>
                                    <td class="text-end" :class="getEcartClass(posteEnDetail, realiseParPosteMois[posteEnDetail.id]?.[idx], previsionParPosteMois[posteEnDetail.id]?.[idx])">
                                        {{ formatMontant((realiseParPosteMois[posteEnDetail.id]?.[idx] || 0) - (previsionParPosteMois[posteEnDetail.id]?.[idx] || 0), deviseAffichage) }}
                                    </td>
                                    <td class="text-center">
                                        <span class="badge"
                                            :class="posteEnDetail.type === 'entree' ? getPourcentageClassRevenus(pourcentagePosteMois[posteEnDetail.id]?.[idx]) : getPourcentageClassDepenses(pourcentagePosteMois[posteEnDetail.id]?.[idx])">
                                            {{ pourcentagePosteMois[posteEnDetail.id]?.[idx] || 0 }}%
                                        </span>
                                    </td>
                                </tr>
                                <tr class="table-primary fw-bold">
                                    <td>TOTAL</td>
                                    <td class="text-end">{{ formatMontant(totalPrevisionParPoste[posteEnDetail.id] || 0, deviseAffichage) }}</td>
                                    <td class="text-end">{{ formatMontant(totalRealiseParPoste[posteEnDetail.id] || 0, deviseAffichage) }}</td>
                                    <td class="text-end">{{ formatMontant((totalRealiseParPoste[posteEnDetail.id] || 0) - (totalPrevisionParPoste[posteEnDetail.id] || 0), deviseAffichage) }}</td>
                                    <td class="text-center">
                                        <span class="badge"
                                            :class="posteEnDetail.type === 'entree' ? getPourcentageClassRevenus(pourcentageTotalParPoste[posteEnDetail.id]) : getPourcentageClassDepenses(pourcentageTotalParPoste[posteEnDetail.id])">
                                            {{ pourcentageTotalParPoste[posteEnDetail.id] || 0 }}%
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="modal-footer"><button class="btn btn-secondary" @click="posteEnDetail = null">Fermer</button></div>
                </div>
            </div>
        </div>

        <!-- ==================== ONGLET TRÉSORERIE ==================== -->
        <div v-if="onglet === 'tresorerie'" class="mt-3">
            <div class="card mb-3">
                <div class="card-header">
                    <i class="bi bi-cash-stack"></i> Trésorerie combinée : passé (réel) + futur (budget)
                </div>
                <div class="card-body">
                    <div class="row mb-3 align-items-end">
                        <div class="col-md-3">
                            <label>Année</label>
                            <select v-model="anneeTreso" class="form-select" @change="reinitialiserTresorerie">
                                <option v-for="a in anneesDisponibles" :key="a" :value="a">{{ a }}</option>
                            </select>
                        </div>
                        <div class="col-md-5">
                            <label>Solde au 1ᵉʳ janvier ({{ deviseAffichage }})</label>
                            <div class="input-group">
                                <input type="text" class="form-control"
                                    :value="formatMontant(soldeInitialTreso, deviseAffichage)"
                                    :readonly="!modeManuelSoldeInitial"
                                    @input="formatInputBudget($event)"
                                    @blur="updateSoldeInitial($event.target.value)">
                                <button class="btn btn-outline-secondary" type="button"
                                    @click="modeManuelSoldeInitial = !modeManuelSoldeInitial">
                                    <i :class="modeManuelSoldeInitial ? 'bi bi-arrow-counterclockwise' : 'bi bi-pencil'"></i>
                                </button>
                            </div>
                            <small class="text-muted" v-if="modeManuelSoldeInitial">Valeur saisie manuellement</small>
                            <small class="text-muted" v-else-if="soldeInitialAutoCalcule !== null">Solde calculé au 31/12/{{ anneeTreso-1 }}</small>
                            <div v-if="messageSoldeInitial" class="text-warning mt-1">
                                <i class="bi bi-exclamation-triangle"></i> {{ messageSoldeInitial }}
                            </div>
                        </div>
                        <div class="col-md-4 d-flex gap-2 align-items-center">
                            <button class="btn btn-outline-primary" @click="recalculerSoldeInitial">
                                <i class="bi bi-arrow-repeat"></i> Recalculer
                            </button>
                        </div>
                    </div>

                    <!-- Cartes indicateurs -->
                    <div class="row mb-3">
                        <div class="col-md-3">
                            <div class="card border-primary">
                                <div class="card-body py-2">
                                    <small class="text-muted">Solde début d'année</small>
                                    <h5 class="mb-0 text-primary">{{ formatMontant(soldeInitialTreso, deviseAffichage) }}</h5>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card border-success">
                                <div class="card-body py-2">
                                    <small class="text-muted">Solde réel actuel</small>
                                    <h5 class="mb-0 text-success">
                                        {{ soldeActuel !== null ? formatMontant(soldeActuel, deviseAffichage) : '—' }}
                                    </h5>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card border-info">
                                <div class="card-body py-2">
                                    <small class="text-muted">Solde projeté fin d'année</small>
                                    <h5 class="mb-0 text-info">{{ formatMontant(soldeFinalProjete, deviseAffichage) }}</h5>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card" :class="ecartProjection >= 0 ? 'border-success' : 'border-danger'">
                                <div class="card-body py-2">
                                    <small class="text-muted">Écart vs budget initial</small>
                                    <h5 class="mb-0" :class="ecartProjection >= 0 ? 'text-success' : 'text-danger'">
                                        {{ formatMontant(ecartProjection, deviseAffichage) }}
                                        <small class="text-muted fs-6 ms-1">
                                            ({{ ecartProjection >= 0 ? 'meilleur' : 'moins bon' }})
                                        </small>
                                    </h5>
                                    <small class="text-muted">
                                        Projeté : {{ formatMontant(soldeFinalProjete, deviseAffichage) }}
                                        · Budget : {{ formatMontant(soldeFinalBudgetPur, deviseAffichage) }}
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Graphique -->
                    <div class="row mb-3">
                        <div class="col-md-12">
                            <div class="chart-wrapper" style="height: 350px;">
                                <canvas id="chartTresorerie"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Tableau combiné -->
                    <div class="table-responsive">
                        <table class="table table-bordered table-sm align-middle">
                            <thead>
                                <tr class="table-light">
                                    <th rowspan="2" class="align-middle">Mois</th>
                                    <th colspan="2" class="text-center bg-success text-white">Revenus</th>
                                    <th colspan="2" class="text-center bg-danger text-white">Dépenses</th>
                                    <th rowspan="2" class="text-end align-middle">Solde fin</th>
                                    <th rowspan="2" class="text-end align-middle">Variation solde</th>
                                </tr>
                                <tr class="table-light">
                                    <th class="text-end">Prévu</th>
                                    <th class="text-end">Réalisé</th>
                                    <th class="text-end">Prévu</th>
                                    <th class="text-end">Réalisé</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(mois, idx) in moisNomsComplets" :key="idx"
                                    :class="soldesTreso[idx]?.statut === 'futur' ? 'table-info' : ''">
                                    <td>
                                        {{ mois }}
                                        <span v-if="soldesTreso[idx]?.statut === 'futur'" class="badge bg-info text-dark ms-1">Projeté</span>
                                    </td>
                                    <td class="text-end">{{ formatMontant(soldesTreso[idx]?.flux?.revenusPrevus || 0, deviseAffichage) }}</td>
                                    <td class="text-end">
                                        <span v-if="soldesTreso[idx]?.flux?.revenusReels !== null && soldesTreso[idx]?.flux?.revenusReels !== undefined">
                                            {{ formatMontant(soldesTreso[idx].flux.revenusReels, deviseAffichage) }}
                                        </span>
                                        <span v-else class="text-muted">—</span>
                                    </td>
                                    <td class="text-end">{{ formatMontant(soldesTreso[idx]?.flux?.depensesPrevues || 0, deviseAffichage) }}</td>
                                    <td class="text-end">
                                        <span v-if="soldesTreso[idx]?.flux?.depensesReelles !== null && soldesTreso[idx]?.flux?.depensesReelles !== undefined">
                                            {{ formatMontant(soldesTreso[idx].flux.depensesReelles, deviseAffichage) }}
                                        </span>
                                        <span v-else class="text-muted">—</span>
                                    </td>
                                    <td class="text-end fw-bold"
                                        :class="(soldesTreso[idx]?.soldeContinu || 0) >= 0 ? 'text-success' : 'text-danger'">
                                        {{ formatMontant(soldesTreso[idx]?.soldeContinu || 0, deviseAffichage) }}
                                    </td>
                                    <td class="text-end"
                                        :class="((soldesTreso[idx]?.soldeContinu || 0) - (soldesTreso[idx]?.soldeDebut || 0)) >= 0 ? 'text-success' : 'text-danger'">
                                        {{ formatMontant((soldesTreso[idx]?.soldeContinu || 0) - (soldesTreso[idx]?.soldeDebut || 0), deviseAffichage) }}
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
import Chart from 'chart.js/auto';
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
            moisNomsComplets: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
            postesBudgetaires: [],
            budgetData: {},
            tauxMensuels: Array(12).fill(2500),
            versions: [],
            showHistorique: false,
            modificationsNonSauvegardees: false,

            previsionParPosteMois: {},
            realiseParPosteMois: {},
            pourcentagePosteMois: {},
            totalPrevisionParPoste: {},
            totalRealiseParPoste: {},
            pourcentageTotalParPoste: {},
            posteEnDetail: null,

            modeManuelSoldeInitial: false,
            soldeInitialAutoCalcule: null,
            soldeInitialSaisi: 0,
            soldesTreso: [],
            messageSoldeInitial: '',

            ecrituresCaisse: [],
            ecrituresBanque: [],

            chartCA: null,
            chartDepenses: null,
            chartTresorerie: null,
        };
    },
    computed: {
        postesDepenses() { return this.postesBudgetaires.filter(p => p.type === 'sortie'); },
        postesRevenus() { return this.postesBudgetaires.filter(p => p.type === 'entree'); },

        soldeInitialTreso() {
            if (this.modeManuelSoldeInitial) return this.soldeInitialSaisi;
            const baseCDF = this.soldeInitialAutoCalcule || 0;
            if (this.deviseAffichage === 'CDF') return baseCDF;
            const taux = this.tauxMensuels[0] || 2500;
            return baseCDF / taux;
        },
        soldeActuel() {
            if (!this.soldesTreso.length) return null;
            const maintenant = new Date();
            const moisActuel = maintenant.getMonth();
            const anneeActuelle = maintenant.getFullYear();
            if (this.anneeTreso > anneeActuelle) return null;
            // Dernier mois passé avec des données réelles
            for (let i = 11; i >= 0; i--) {
                const s = this.soldesTreso[i];
                if (s?.flux?.revenusReels !== null && s?.flux?.revenusReels !== undefined) {
                    return s.soldeContinu;
                }
            }
            return this.soldeInitialTreso;
        },
        soldeFinalProjete() {
            if (!this.soldesTreso.length) return 0;
            const last = this.soldesTreso[this.soldesTreso.length - 1];
            return last?.soldeContinu || 0;
        },
        soldeFinalBudgetPur() {
            // Solde théorique si le budget pur avait été suivi dès le début
            let solde = this.soldeInitialTreso;
            for (let m = 0; m < 12; m++) {
                const s = this.soldesTreso[m];
                if (s?.flux) {
                    solde += s.flux.revenusPrevus - s.flux.depensesPrevues;
                }
            }
            return solde;
        },
        ecartProjection() {
            return this.soldeFinalProjete - this.soldeFinalBudgetPur;
        },

        totalDepensesMoisAffichage() {
            const totalCDF = Array(12).fill(0);
            for (let p of this.postesBudgetaires.filter(p => p.type === 'sortie')) {
                const arr = this.budgetData[p.id] || Array(12).fill(0);
                for (let i = 0; i < 12; i++) totalCDF[i] += arr[i];
            }
            if (this.deviseAffichage === 'CDF') return totalCDF;
            return totalCDF.map((val, idx) => val / (this.tauxMensuels[idx] || 2500));
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
        totalDepensesAffichage() { return this.totalDepensesMoisAffichage.reduce((a, b) => a + b, 0); },
        totalRevenusAffichage() { return this.totalRevenusMoisAffichage.reduce((a, b) => a + b, 0); },
        soldeTotalAffichage() { return this.totalRevenusAffichage - this.totalDepensesAffichage; },
        totalParPosteAffichage() {
            const totals = {};
            for (let p of this.postesBudgetaires) {
                const arrCDF = this.budgetData[p.id] || Array(12).fill(0);
                if (this.deviseAffichage === 'CDF') totals[p.id] = arrCDF.reduce((a, b) => a + b, 0);
                else {
                    let sum = 0;
                    for (let i = 0; i < 12; i++) sum += arrCDF[i] / (this.tauxMensuels[i] || 2500);
                    totals[p.id] = sum;
                }
            }
            return totals;
        },

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
        totalDepensesPrevisionAffichage() { return this.totalDepensesPrevisionMoisAffichage.reduce((a, b) => a + b, 0); },
        totalDepensesRealiseAffichage() { return this.totalDepensesRealiseMoisAffichage.reduce((a, b) => a + b, 0); },
        totalRevenusPrevisionAffichage() { return this.totalRevenusPrevisionMoisAffichage.reduce((a, b) => a + b, 0); },
        totalRevenusRealiseAffichage() { return this.totalRevenusRealiseMoisAffichage.reduce((a, b) => a + b, 0); },
        variationTotaleAffichage() { return this.totalRevenusRealiseAffichage - this.totalDepensesRealiseAffichage; },
        variationTotalePrevue() { return this.totalRevenusPrevisionAffichage - this.totalDepensesPrevisionAffichage; },
        postesEnDepassement() {
            const result = [];
            for (const p of this.postesBudgetaires) {
                if (p.type !== 'sortie') continue;
                const prev = this.totalPrevisionParPoste[p.id] || 0;
                const real = this.totalRealiseParPoste[p.id] || 0;
                if (prev > 0 && real > prev * 1.1) result.push(p);
            }
            return result;
        },
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
    },
    watch: {
        anneeBudget() {
            this.chargerPostes();
            this.chargerBudget();
            this.chargerTauxMensuels();
        },
        anneeSuivi() {
            this.chargerPostesSuivi();
        },
        anneeTreso() {
            this.reinitialiserTresorerie();
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
            this.chargerPostesSuivi();
            this.reinitialiserTresorerie();
        },
        onglet(val) {
            if (val === 'suivi') {
                this.$nextTick(() => setTimeout(() => this.renderSuiviCharts(), 150));
            } else if (val === 'tresorerie') {
                this.$nextTick(() => setTimeout(() => this.renderChartTresorerie(), 150));
            }
        }
    },
    async mounted() {
        await this.chargerPostes();
        await this.chargerBudget();
        await this.chargerTauxMensuels();
        await this.chargerPostesSuivi();
        await this.reinitialiserTresorerie();
    },
    beforeUnmount() {
        this.detruireCharts();
    },
    methods: {
        detruireCharts() {
            if (this.chartCA) { try { this.chartCA.destroy(); } catch (e) { /* ignore */ } this.chartCA = null; }
            if (this.chartDepenses) { try { this.chartDepenses.destroy(); } catch (e) { /* ignore */ } this.chartDepenses = null; }
            if (this.chartTresorerie) { try { this.chartTresorerie.destroy(); } catch (e) { /* ignore */ } this.chartTresorerie = null; }
        },

        formatMontant(montant, devise) {
            if (montant === undefined || montant === null) montant = 0;
            const formatter = new Intl.NumberFormat('fr-FR', { useGrouping: true, maximumFractionDigits: 0, minimumFractionDigits: 0 });
            return formatter.format(Math.round(montant));
        },
        formatDate(dateStr) { return dateStr ? new Date(dateStr).toLocaleString() : ''; },
        changerDevise(devise) { this.deviseAffichage = devise; },
        valeurAfficheeCellule(posteId, mois) {
            const valeurCDF = (this.budgetData[posteId] || [])[mois] || 0;
            if (this.deviseAffichage === 'CDF') return valeurCDF;
            return valeurCDF / (this.tauxMensuels[mois] || 2500);
        },
        formatInputBudget(event) {
            let value = event.target.value;
            value = value.replace(/'/g, '').replace(/\s/g, '').replace(/,/g, '.');
            let number = parseFloat(value);
            if (isNaN(number)) number = 0;
            event.target.value = this.formatMontant(number, this.deviseAffichage);
        },
        parseMontantBudget(value) {
            if (!value) return 0;
            let str = value.toString().replace(/'/g, '').replace(/,/g, '.');
            return parseFloat(str) || 0;
        },
        updateBudgetValue(posteId, moisIndex, event) {
            const input = event.target;
            const valeurSaisie = this.parseMontantBudget(input.value);
            let valeurCDF = valeurSaisie;
            if (this.deviseAffichage === 'USD') {
                valeurCDF = valeurSaisie * (this.tauxMensuels[moisIndex] || 2500);
            }
            if (!this.budgetData[posteId]) this.budgetData[posteId] = Array(12).fill(0);
            this.budgetData[posteId][moisIndex] = valeurCDF;
            this.budgetData = { ...this.budgetData };
            this.modificationsNonSauvegardees = true;
        },
        updateTauxValue(moisIndex, valeurSaisieStr) {
            let valeurSaisie = this.parseMontantBudget(valeurSaisieStr);
            this.tauxMensuels[moisIndex] = valeurSaisie;
            this.sauvegarderTauxMensuels();
        },

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
        getBarClassDepenses(pct) {
            if (pct === null || pct === undefined) return 'bg-success';
            if (pct <= 100) return 'bg-success';
            if (pct <= 110) return 'bg-warning';
            return 'bg-danger';
        },
        getBarClassRevenus(pct) {
            if (pct === null || pct === undefined) return 'bg-secondary';
            if (pct < 100) return 'bg-danger';
            return 'bg-success';
        },
        getEcartClass(poste, realise, prevu) {
            if (!prevu) return '';
            if (poste.type === 'entree') {
                return realise >= prevu ? 'text-success fw-bold' : 'text-danger fw-bold';
            } else {
                return realise > prevu * 1.1 ? 'text-danger fw-bold' : (realise > prevu ? 'text-warning fw-bold' : 'text-success fw-bold');
            }
        },
        voirDetailPoste(poste) { this.posteEnDetail = poste; },

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
        async chargerPostesSuivi() {
            this.postesBudgetaires = await db.postes_budgetaires.where('annee').equals(this.anneeSuivi).toArray();
            await this.chargerRealises();
            await this.$nextTick();
            setTimeout(() => this.renderSuiviCharts(), 150);
        },

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

            for (let m = 0; m < 12; m++) {
                const { caisse, banque, manuelles } = await getMouvementsBudget(this.anneeSuivi, m + 1);
                for (const mvt of caisse) {
                    const poste = postesAnnee.find(p => p.nom === mvt.poste);
                    if (poste) {
                        const montant = (this.deviseAffichage === 'CDF') ? (mvt.montantCdf || 0) : (mvt.montantUsd || 0);
                        this.realiseParPosteMois[poste.id][m] += Math.abs(montant);
                    }
                }
                for (const mvt of banque) {
                    const poste = postesAnnee.find(p => p.id === mvt.posteId);
                    if (poste) {
                        const montant = (this.deviseAffichage === 'CDF') ? (mvt.montantCdf || 0) : (mvt.montantUsd || 0);
                        this.realiseParPosteMois[poste.id][m] += Math.abs(montant);
                    }
                }
                for (const mvt of manuelles) {
                    const poste = postesAnnee.find(p => p.nom === mvt.poste);
                    if (poste) {
                        const montant = (this.deviseAffichage === 'CDF') ? (mvt.montantCdf || 0) : (mvt.montantUsd || 0);
                        this.realiseParPosteMois[poste.id][m] += Math.abs(montant);
                    }
                }
            }

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

        renderSuiviCharts() {
            const canvasCA = document.getElementById('chartCA');
            if (canvasCA && canvasCA.offsetParent !== null) {
                if (this.chartCA) { try { this.chartCA.destroy(); } catch (e) { /* ignore */ } }
                const ctx = canvasCA.getContext('2d');
                if (ctx) {
                    try {
                        this.chartCA = new Chart(ctx, {
                            type: 'line',
                            data: {
                                labels: this.moisNoms,
                                datasets: [
                                    { label: 'CA prévu', data: this.totalRevenusPrevisionMoisAffichage, borderColor: '#6c757d', backgroundColor: 'rgba(108, 117, 125, 0.1)', borderDash: [5, 5], tension: 0.2 },
                                    { label: 'CA réalisé', data: this.totalRevenusRealiseMoisAffichage, borderColor: '#28a745', backgroundColor: 'rgba(40, 167, 69, 0.15)', fill: true, tension: 0.2 }
                                ]
                            },
                            options: {
                                responsive: true, maintainAspectRatio: false,
                                plugins: { tooltip: { callbacks: { label: (c) => c.dataset.label + ': ' + this.formatMontant(c.raw, this.deviseAffichage) } } },
                                scales: { y: { beginAtZero: true, ticks: { callback: (v) => this.formatMontant(v, this.deviseAffichage) } } }
                            }
                        });
                    } catch (e) { console.warn(e); }
                }
            }

            const canvasDep = document.getElementById('chartDepenses');
            if (canvasDep && canvasDep.offsetParent !== null) {
                if (this.chartDepenses) { try { this.chartDepenses.destroy(); } catch (e) { /* ignore */ } }
                const ctx = canvasDep.getContext('2d');
                if (ctx) {
                    try {
                        this.chartDepenses = new Chart(ctx, {
                            type: 'line',
                            data: {
                                labels: this.moisNoms,
                                datasets: [
                                    { label: 'Dépenses prévues', data: this.totalDepensesPrevisionMoisAffichage, borderColor: '#6c757d', backgroundColor: 'rgba(108, 117, 125, 0.1)', borderDash: [5, 5], tension: 0.2 },
                                    { label: 'Dépenses réalisées', data: this.totalDepensesRealiseMoisAffichage, borderColor: '#ED1C24', backgroundColor: 'rgba(237, 28, 36, 0.15)', fill: true, tension: 0.2 }
                                ]
                            },
                            options: {
                                responsive: true, maintainAspectRatio: false,
                                plugins: { tooltip: { callbacks: { label: (c) => c.dataset.label + ': ' + this.formatMontant(c.raw, this.deviseAffichage) } } },
                                scales: { y: { beginAtZero: true, ticks: { callback: (v) => this.formatMontant(v, this.deviseAffichage) } } }
                            }
                        });
                    } catch (e) { console.warn(e); }
                }
            }
        },

        renderChartTresorerie() {
            const canvas = document.getElementById('chartTresorerie');
            if (!canvas || canvas.offsetParent === null) return;
            if (this.chartTresorerie) { try { this.chartTresorerie.destroy(); } catch (e) { /* ignore */ } }
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const soldeData = this.soldesTreso.map(s => s.soldeContinu);
            const revenusPrevusData = this.soldesTreso.map(s => s.flux.revenusPrevus);
            const depensesPrevuesData = this.soldesTreso.map(s => s.flux.depensesPrevues);
            const revenusReelsData = this.soldesTreso.map(s => s.flux.revenusReels ?? 0);
            const depensesReellesData = this.soldesTreso.map(s => s.flux.depensesReelles ?? 0);

            try {
                this.chartTresorerie = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: this.moisNoms,
                        datasets: [
                            {
                                type: 'line',
                                label: 'Solde (réel + projeté)',
                                data: soldeData,
                                borderColor: '#0d6efd',
                                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                                borderWidth: 3,
                                tension: 0.2,
                                pointRadius: 5,
                                pointBackgroundColor: '#0d6efd',
                                yAxisID: 'y-solde',
                                order: 0
                            },
                            {
                                type: 'bar',
                                label: 'Revenus prévus',
                                data: revenusPrevusData,
                                backgroundColor: 'rgba(40, 167, 69, 0.25)',
                                borderColor: '#28a745',
                                borderWidth: 1,
                                yAxisID: 'y-flux',
                                order: 2
                            },
                            {
                                type: 'bar',
                                label: 'Revenus réalisés',
                                data: revenusReelsData,
                                backgroundColor: 'rgba(40, 167, 69, 0.85)',
                                yAxisID: 'y-flux',
                                order: 1
                            },
                            {
                                type: 'bar',
                                label: 'Dépenses prévues',
                                data: depensesPrevuesData,
                                backgroundColor: 'rgba(237, 28, 36, 0.25)',
                                borderColor: '#ED1C24',
                                borderWidth: 1,
                                yAxisID: 'y-flux',
                                order: 2
                            },
                            {
                                type: 'bar',
                                label: 'Dépenses réalisées',
                                data: depensesReellesData,
                                backgroundColor: 'rgba(237, 28, 36, 0.85)',
                                yAxisID: 'y-flux',
                                order: 1
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { intersect: false, mode: 'index' },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: (c) => {
                                        const value = c.raw;
                                        return c.dataset.label + ' : ' + this.formatMontant(value, this.deviseAffichage) + ' ' + this.deviseAffichage;
                                    }
                                }
                            },
                            legend: { position: 'top' }
                        },
                        scales: {
                            'y-flux': {
                                type: 'linear',
                                position: 'left',
                                title: { display: true, text: 'Flux (entrées / sorties) - ' + this.deviseAffichage },
                                ticks: { callback: (v) => this.formatMontant(v, this.deviseAffichage) },
                                grid: { drawOnChartArea: false }
                            },
                            'y-solde': {
                                type: 'linear',
                                position: 'right',
                                title: { display: true, text: 'Solde - ' + this.deviseAffichage },
                                ticks: { callback: (v) => this.formatMontant(v, this.deviseAffichage) },
                                grid: { color: 'rgba(0, 0, 0, 0.05)' }
                            }
                        }
                    }
                });
            } catch (e) { console.warn(e); }
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
                alert("Impossible d'exporter le tableau.");
            }
        },

        async verifierClotureEtJustificatifs(annee) {
            const anneePrec = annee - 1;
            const dateDebut = `${anneePrec}-01-01`;
            const dateFin = `${anneePrec}-12-31`;
            const semainesNonCloturees = await db.semaines_caisse
                .where('dateFin').between(dateDebut, dateFin, true, true)
                .filter(s => !s.estCloturee)
                .count();
            if (semainesNonCloturees > 0) return { ok: false, raison: `Il reste des semaines non clôturées en ${anneePrec}.` };
            const mouvementsAJustifier = await db.mouvementsCaisse
                .where('date').between(dateDebut, dateFin, true, true)
                .filter(m => m.aJustifier === true && !m.annule)
                .count();
            if (mouvementsAJustifier > 0) return { ok: false, raison: `Il reste des écritures "à justifier" en ${anneePrec}.` };
            return { ok: true };
        },
        async calculerSoldeInitialAuto(annee) {
            const anneePrecedente = annee - 1;
            const dateFinAnneePrec = `${anneePrecedente}-12-31`;
            const dateDebutAnnee = `${annee}-01-01`;
            const verif = await this.verifierClotureEtJustificatifs(annee);
            if (!verif.ok) {
                this.messageSoldeInitial = verif.raison;
                return null;
            }
            const caisses = await db.caisses.toArray();
            const comptes = await db.comptes_bancaires.toArray();
            let totalCDF = 0, totalUSD = 0, auMoinsUneCaisse = false;
            const tauxDebutAnnee = await this.getTauxPourDate(dateDebutAnnee);

            for (let caisse of caisses) {
                const mouvements = await db.mouvementsCaisse
                    .where('caisseId').equals(caisse.id)
                    .filter(m => m.date <= dateFinAnneePrec && m.status === 'validé' && !m.annule)
                    .toArray();
                let soldeCDF = 0, soldeUSD = 0;
                for (let mvt of mouvements) {
                    if (mvt.devise === 'CDF') soldeCDF += (mvt.type === 'entree' ? mvt.montant : -mvt.montant);
                    else soldeUSD += (mvt.type === 'entree' ? mvt.montant : -mvt.montant);
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
                for (let mvt of mouvements) solde += (mvt.type === 'credit' ? mvt.montant : -mvt.montant);
                if (solde !== 0) auMoinsUneCaisse = true;
                if (compte.devise === 'CDF') totalCDF += solde;
                else totalUSD += solde;
            }
            if (!auMoinsUneCaisse) {
                this.messageSoldeInitial = `Aucun solde au 31/12/${anneePrecedente}. Saisir manuellement.`;
                return null;
            }
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
        async reinitialiserTresorerie() {
            this.modeManuelSoldeInitial = false;
            this.soldeInitialAutoCalcule = await this.calculerSoldeInitialAuto(this.anneeTreso);
            if (this.soldeInitialAutoCalcule === null) {
                this.modeManuelSoldeInitial = true;
                this.soldeInitialSaisi = 0;
            }
            await this.calculerProjection();
        },
        async recalculerSoldeInitial() {
            this.modeManuelSoldeInitial = false;
            await this.reinitialiserTresorerie();
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

            const aujourdhui = new Date();
            const moisActuel = aujourdhui.getMonth();
            const anneeActuelle = aujourdhui.getFullYear();

            const nouveauxSoldes = [];
            let soldeCourant = this.soldeInitialTreso;

            // Étape 1 : Calculer les flux prévus (budget) pour chaque mois
            const fluxPrevus = [];
            for (let m = 0; m < 12; m++) {
                let entreesPrev = 0, sortiesPrev = 0;
                for (let p of postesAnnee) {
                    const montantCDF = budgetData[p.id]?.[m] || 0;
                    let montantAff = montantCDF;
                    if (this.deviseAffichage === 'USD') montantAff = montantCDF / tauxParMois[m];
                    if (p.type === 'entree') entreesPrev += montantAff;
                    else sortiesPrev += montantAff;
                }
                fluxPrevus.push({ entrees: entreesPrev, sorties: sortiesPrev });
            }

            // Étape 2 : Calculer les flux réels (mouvements) pour les mois passés et courants
            const fluxReels = [];
            for (let m = 0; m < 12; m++) {
                const estPasse = this.anneeTreso < anneeActuelle || (this.anneeTreso === anneeActuelle && m <= moisActuel);
                if (!estPasse) { fluxReels.push(null); continue; }

                let entrees = 0, sorties = 0;
                for (let p of postesAnnee) {
                    const mvtsCaisseMois = mouvementsCaisse.filter(mvt => {
                        const d = new Date(mvt.date);
                        return d.getFullYear() === this.anneeTreso && d.getMonth() === m && mvt.posteBudgetaire === p.nom;
                    });
                    const mvtsBanqueMois = mouvementsBanque.filter(mvt => {
                        const d = new Date(mvt.date_operation);
                        return d.getFullYear() === this.anneeTreso && d.getMonth() === m && mvt.poste_id === p.id;
                    });
                    for (let r of mvtsCaisseMois) {
                        let montant = r.montant;
                        if (r.devise !== this.deviseAffichage) {
                            if (this.deviseAffichage === 'USD') montant = r.montant / tauxParMois[m];
                            else montant = r.montant * tauxParMois[m];
                        }
                        if (r.type === 'entree') entrees += montant;
                        else sorties += montant;
                    }
                    for (let r of mvtsBanqueMois) {
                        let montant = r.montant;
                        if (r.devise !== this.deviseAffichage) {
                            if (this.deviseAffichage === 'USD') montant = r.montant / tauxParMois[m];
                            else montant = r.montant * tauxParMois[m];
                        }
                        if (r.type === 'credit') entrees += montant;
                        else sorties += montant;
                    }
                }
                fluxReels.push({ entrees, sorties });
            }

            // Étape 3 : Construire la courbe continue
            // - Mois passés + courant : flux réels
            // - Mois futurs : flux prévus
            let soldeContinu = this.soldeInitialTreso;
            for (let m = 0; m < 12; m++) {
                const estPasse = this.anneeTreso < anneeActuelle || (this.anneeTreso === anneeActuelle && m <= moisActuel);
                const flux = estPasse ? fluxReels[m] : fluxPrevus[m];

                const debut = soldeContinu;
                const fin = debut + flux.entrees - flux.sorties;
                soldeContinu = fin;

                nouveauxSoldes.push({
                    mois: m,
                    statut: estPasse ? 'passe' : 'futur',
                    flux: {
                        revenusPrevus: fluxPrevus[m].entrees,
                        depensesPrevues: fluxPrevus[m].sorties,
                        revenusReels: estPasse ? fluxReels[m].entrees : null,
                        depensesReelles: estPasse ? fluxReels[m].sorties : null
                    },
                    soldeContinu: fin,
                    soldeDebut: debut
                });
            }
            this.soldesTreso = nouveauxSoldes;
            this.$nextTick(() => this.renderChartTresorerie());
        },
    }
};
</script>

<style scoped>
.budget-table-wrapper {
    max-height: 72vh;
    overflow: auto;
    border-radius: 8px;
    border: 1px solid #dee2e6;
    margin: 12px;
}
.budget-input-table { border-collapse: separate; border-spacing: 0; font-size: 0.85rem; margin-bottom: 0; width: 100%; }
.budget-input-table th, .budget-input-table td { vertical-align: middle; padding: 0.35rem 0.4rem; white-space: nowrap; border-color: #e5e5e5; }
.budget-input-table .header-row th { background-color: #f1f3f5; font-weight: 600; color: #495057; position: sticky; top: 0; z-index: 5; border-bottom: 2px solid #adb5bd; }
.col-poste { min-width: 200px; max-width: 200px; position: sticky; left: 0; background-color: inherit; z-index: 4; box-shadow: 2px 0 4px -2px rgba(0, 0, 0, 0.08); text-align: left; }
.col-total { min-width: 110px; max-width: 110px; position: sticky; left: 200px; background-color: inherit; z-index: 4; box-shadow: 2px 0 4px -2px rgba(0, 0, 0, 0.08); }
.col-mois { min-width: 95px; max-width: 95px; text-align: right; }
.budget-input-table input.form-control { text-align: right; padding: 0.2rem 0.35rem; font-size: 0.8rem; border-radius: 4px; border: 1px solid transparent; background-color: transparent; transition: border-color 0.15s; }
.budget-input-table input.form-control:hover { border-color: #dee2e6; background-color: #fff; }
.budget-input-table input.form-control:focus { border-color: #ED1C24; background-color: #fff; box-shadow: 0 0 0 2px rgba(237, 28, 36, 0.1); }
.row-taux td { background-color: #f8f9fa; font-size: 0.8rem; border-bottom: 2px solid #adb5bd; }
.row-taux .col-poste, .row-taux .col-total { background-color: #f8f9fa; }
.section-header td { padding: 0.6rem 0.8rem !important; font-weight: 700; font-size: 0.9rem; letter-spacing: 0.5px; }
.section-depenses td { background-color: #fff3cd; color: #856404; border-top: 3px solid #ffc107; border-bottom: 2px solid #ffc107; }
.section-revenus td { background-color: #d4edda; color: #155724; border-top: 3px solid #28a745; border-bottom: 2px solid #28a745; }
.row-poste:nth-child(even) td { background-color: #fafbfc; }
.row-poste:hover td { background-color: #f1f3f5; }
.total-row td { font-weight: 700; padding: 0.55rem 0.4rem !important; font-size: 0.85rem; }
.total-depenses td { background-color: #fff3cd; border-top: 2px solid #ffc107; border-bottom: 2px solid #ffc107; color: #856404; }
.total-revenus td { background-color: #d4edda; border-top: 2px solid #28a745; border-bottom: 2px solid #28a745; color: #155724; }
.total-variation td { background-color: #cfe2ff; border-top: 2px solid #0d6efd; border-bottom: 2px solid #0d6efd; color: #084298; }
.chart-wrapper { position: relative; height: 250px; width: 100%; }
.chart-wrapper canvas { max-height: 250px !important; max-width: 100% !important; }
.kpi-card { border-left: 4px solid #0d6efd; transition: transform 0.2s, box-shadow 0.2s; }
.kpi-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1); }
.kpi-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; background-color: #f8f9fa; }
.table thead th { font-weight: 600; color: #495057; font-size: 0.85rem; }
.badge { font-weight: 500; padding: 0.35rem 0.6rem; }
</style>