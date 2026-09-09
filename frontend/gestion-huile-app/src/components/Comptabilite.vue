<template>
    <div class="container-fluid">
        <h2 class="mb-4" style="color: #ED1C24;">Comptabilité</h2>

        <!-- Onglets -->
        <ul class="nav nav-tabs">
            <li class="nav-item">
                <a class="nav-link" :class="{ active: onglet === 'ecritures' }" href="#"
                    @click.prevent="onglet = 'ecritures'">
                    <i class="bi bi-journal-text"></i> Écritures
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" :class="{ active: onglet === 'manuelles' }" href="#"
                    @click.prevent="onglet = 'manuelles'">
                    <i class="bi bi-pencil-square"></i> Écritures manuelles
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" :class="{ active: onglet === 'export' }" href="#"
                    @click.prevent="onglet = 'export'">
                    <i class="bi bi-download"></i> Export
                </a>
            </li>

        </ul>

        <!-- ==================== ONGLET ÉCRITURES ==================== -->
        <div v-show="onglet === 'ecritures'" class="mt-3">
            <div class="card">
                <div class="card-header d-flex justify-content-between">
                    <span><i class="bi bi-journal-text"></i> Écritures comptables (caisses + banque)</span>
                    <button class="btn btn-sm btn-success" @click="nouvelleEcriture">
                        <i class="bi bi-plus-circle"></i> Nouvelle écriture
                    </button>
                </div>
                <div class="card-body">
                    <!-- Filtres -->
                    <div class="row mb-3">
                        <div class="col-md-3">
                            <label>Période</label>
                            <select class="form-select" v-model="filtreEcritures.periode"
                                @change="appliquerFiltrePeriode">
                                <option value="mois">Mois courant</option>
                                <option value="trimestre">Trimestre courant</option>
                                <option value="annee">Année courante</option>
                                <option value="personnalise">Personnalisé</option>
                            </select>
                        </div>
                        <template v-if="filtreEcritures.periode === 'personnalise'">
                            <div class="col-md-2"><label>Du</label><input type="date" class="form-control"
                                    v-model="filtreEcritures.dateDebut"></div>
                            <div class="col-md-2"><label>Au</label><input type="date" class="form-control"
                                    v-model="filtreEcritures.dateFin"></div>
                        </template>
                        <div class="col-md-2">
                            <label>Poste budgétaire</label>
                            <select class="form-select" v-model="filtreEcritures.posteId">
                                <option value="">Tous</option>
                                <option v-for="p in postesBudgetaires" :key="p.id" :value="p.id">{{ p.nom }}</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label>Type</label>
                            <select class="form-select" v-model="filtreEcritures.type">
                                <option value="">Tous</option>
                                <option value="entree">Entrée</option>
                                <option value="sortie">Sortie</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label>Devise</label>
                            <select class="form-select" v-model="filtreEcritures.devise">
                                <option value="">Toutes</option>
                                <option value="USD">USD</option>
                                <option value="CDF">CDF</option>
                            </select>
                        </div>
                        <div class="col-md-1">
                            <button class="btn btn-primary mt-4" @click="chargerEcritures">Filtrer</button>
                        </div>
                    </div>

                    <!-- Tableau des écritures -->
                    <div class="budget-table-container" style="max-height: 60vh;">
                        <table class="table table-sm table-hover budget-table">
                            <thead class="sticky-top bg-light">
                                <tr>
                                    <th @click="triEcritures('date')" style="cursor: pointer;">Date <i
                                            v-if="triEcrituresColonne==='date'"
                                            :class="triEcrituresOrdre==='asc'?'bi-arrow-up':'bi-arrow-down'"></i></th>
                                    <th @click="triEcritures('source')" style="cursor: pointer;">Source</th>
                                    <th @click="triEcritures('type')" style="cursor: pointer;">Type</th>
                                    <th @click="triEcritures('posteBudgetaire')" style="cursor: pointer;">Poste</th>
                                    <th @click="triEcritures('designation')" style="cursor: pointer;">Désignation</th>
                                    <th @click="triEcritures('montant')" style="cursor: pointer;" class="text-end">
                                        Montant</th>
                                    <th @click="triEcritures('devise')" style="cursor: pointer;">Devise</th>
                                    <th @click="triEcritures('justificatif')" style="cursor: pointer;">Justificatif</th>
                                    <th style="width: 130px;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="e in ecrituresFiltrees" :key="e.id">
                                    <td>{{ formatDate(e.date) }}</td>
                                    <td>{{ e.source }}</td>
                                    <td><span :class="e.type === 'entree' ? 'text-success' : 'text-danger'">{{ e.type
                                            === 'entree' ? 'Entrée' : 'Sortie' }}</span></td>
                                    <td>{{ getPosteNom(e.posteBudgetaire) }}</td>
                                    <td>{{ e.designation || '-' }}</td>
                                    <td class="text-end">{{ formatMontant(e.montant, e.devise) }}</td>
                                    <td>{{ e.devise }}</td>
                                    <td>{{ e.justificatif || '-' }}</td>
                                    <td>
                                        <div class="btn-group btn-group-sm">
                                            <button class="btn btn-warning" @click="editerEcriture(e)"
                                                title="Modifier"><i class="bi bi-pencil"></i></button>
                                            <button class="btn btn-danger" @click="supprimerEcriture(e)"
                                                title="Supprimer"><i class="bi bi-trash"></i></button>
                                            <button class="btn btn-info" @click="ouvrirRepartition(e)"
                                                title="Répartir"><i class="bi bi-calendar-range"></i></button>
                                        </div>
                                    </td>
                                </tr>
                                <tr v-if="ecrituresFiltrees.length === 0">
                                    <td colspan="9" class="text-center">Aucune écriture</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Modale édition/ajout écriture -->
            <div v-if="showEcritureModal" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">{{ ecritureEnEdition ? 'Modifier' : 'Nouvelle' }} écriture</h5>
                            <button type="button" class="btn-close" @click="showEcritureModal = false"></button>
                        </div>
                        <div class="modal-body">
                            <form @submit.prevent="enregistrerEcriture">
                                <div class="mb-3">
                                    <label>Date</label>
                                    <input type="date" class="form-control" v-model="ecritureForm.date" :disabled="ecritureEnEdition !== null" required>
                                </div>
                                <div class="mb-3">
                                    <label>Type</label>
                                    <select class="form-select" v-model="ecritureForm.type" :disabled="ecritureEnEdition !== null" required>
                                    <option value="entree">Entrée</option>
                                    <option value="sortie">Sortie</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label>Poste budgétaire</label>
                                    <select class="form-select" v-model="ecritureForm.posteBudgetaire" required>
                                    <option v-for="p in postesBudgetaires" :key="p.id" :value="p.nom">{{ p.nom }}</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label>Désignation</label>
                                    <input type="text" class="form-control" v-model="ecritureForm.designation">
                                </div>
                                <div class="mb-3">
                                    <label>Montant</label>
                                    <input type="number" step="0.01" class="form-control" v-model.number="ecritureForm.montant" :disabled="ecritureEnEdition !== null" required>
                                </div>
                                <div class="mb-3">
                                    <label>Devise</label>
                                    <select class="form-select" v-model="ecritureForm.devise" :disabled="ecritureEnEdition !== null" required>
                                    <option value="USD">USD</option>
                                    <option value="CDF">CDF</option>
                                    </select>
                                </div>
                                <div class="mb-3" v-if="!ecritureEnEdition">
                                    <label>Source</label>
                                    <select class="form-select" v-model="ecritureForm.source" required>
                                    <option value="caisse">Caisse</option>
                                    <option value="banque">Banque</option>
                                    </select>
                                </div>
                                <!-- ... les autres champs conditionnels (sousCaisseId, compteId) restent inchangés mais seront aussi disabled en édition -->
                                <div class="mb-3" v-if="!ecritureEnEdition && ecritureForm.source === 'caisse'">
                                    <label>Caisse / Sous-caisse</label>
                                    <select class="form-select" v-model="ecritureForm.sousCaisseId" required>
                                    <option v-for="sc in sousCaisses" :key="sc.id" :value="sc.id">{{ sc.nom }} ({{ sc.devise }})</option>
                                    </select>
                                </div>
                                <div class="mb-3" v-if="!ecritureEnEdition && ecritureForm.source === 'banque'">
                                    <label>Compte bancaire</label>
                                    <select class="form-select" v-model="ecritureForm.compteId" required>
                                    <option v-for="c in comptesBancaires" :key="c.id" :value="c.id">{{ c.nom }} ({{ c.devise }})</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label>Justificatif</label>
                                    <input type="text" class="form-control" v-model="ecritureForm.justificatif" :disabled="ecritureEnEdition !== null">
                                </div>
                                <button type="submit" class="btn btn-success">Enregistrer</button>
                                <button type="button" class="btn btn-secondary ms-2" @click="showEcritureModal = false">Annuler</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modale de compensation pour suppression -->
            <div v-if="showCompensationModal" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Compensation de suppression</h5>
                            <button type="button" class="btn-close" @click="showCompensationModal = false"></button>
                        </div>
                        <div class="modal-body">
                            <p>La suppression de l'écriture du {{ formatDate(ecritureASupprimer?.date) }} d'un montant
                                de {{ formatMontant(ecritureASupprimer?.montant, ecritureASupprimer?.devise) }}
                                nécessite une compensation.</p>
                            <form @submit.prevent="validerCompensation">
                                <div class="mb-3">
                                    <label>Poste de compensation</label>
                                    <select class="form-select" v-model="compensation.posteBudgetaire" required>
                                        <option v-for="p in postesBudgetaires" :key="p.id" :value="p.nom">{{ p.nom }}
                                        </option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label>Désignation</label>
                                    <input type="text" class="form-control" v-model="compensation.designation"
                                        placeholder="Ex: Annulation écriture...">
                                </div>
                                <div class="mb-3">
                                    <label>Justificatif</label>
                                    <input type="text" class="form-control" v-model="compensation.justificatif">
                                </div>
                                <button type="submit" class="btn btn-primary">Valider la compensation</button>
                                <button type="button" class="btn btn-secondary ms-2"
                                    @click="showCompensationModal = false">Annuler</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modale de répartition -->
            <div v-if="showRepartitionModal" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Répartir l'écriture</h5>
                            <button type="button" class="btn-close" @click="showRepartitionModal = false"></button>
                        </div>
                        <div class="modal-body">
                            <p><strong>Écriture :</strong> {{ ecritureARepartir?.designation }} ({{
                                formatMontant(ecritureARepartir?.montant, ecritureARepartir?.devise) }})</p>
                            <div class="mb-3">
                                <label>Type de période</label>
                                <select class="form-select" v-model="repartition.typePeriode">
                                    <option value="mensuel">Mensuel</option>
                                    <option value="trimestriel">Trimestriel</option>
                                    <option value="annuel">Annuel</option>
                                </select>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label>Date de début</label>
                                    <input type="date" class="form-control" v-model="repartition.dateDebut">
                                </div>
                                <div class="col-md-6">
                                    <label>Date de fin</label>
                                    <input type="date" class="form-control" v-model="repartition.dateFin">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label>Mode de répartition</label>
                                <select class="form-select" v-model="repartition.mode" @change="onModeChange">
                                    <option value="pourcentage">Pourcentage (%)</option>
                                    <option value="montant">Montant par période</option>
                                </select>
                            </div>
                            <div v-if="repartition.mode === 'pourcentage'" class="mb-3">
                                <label>Pourcentage par période</label>
                                <input type="number" step="0.01" min="0" max="100" class="form-control"
                                    v-model.number="repartition.pourcentage">
                            </div>
                            <div v-if="repartition.mode === 'montant'" class="mb-3">
                                <label>Montant par période</label>
                                <input type="number" step="0.01" class="form-control"
                                    v-model.number="repartition.montantParPeriode">
                            </div>
                            <div class="alert alert-info">
                                <strong>Aperçu :</strong> {{ nombrePeriodes }} période(s) de {{ repartition.typePeriode
                                }}<br>
                                Montant total réparti : {{ formatMontant(totalReparti, ecritureARepartir?.devise) }}
                                <span v-if="totalReparti !== (ecritureARepartir?.montant || 0)" class="text-danger">(ne
                                    correspond pas au montant de l'écriture)</span>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" @click="showRepartitionModal = false">Annuler</button>
                            <button class="btn btn-primary" @click="enregistrerRepartition"
                                :disabled="totalReparti !== ecritureARepartir?.montant">Enregistrer</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ==================== ONGLET EXPORT ==================== -->
        <div v-show="onglet === 'export'" class="mt-3">
            <div class="card">
                <div class="card-header d-flex justify-content-between">
                    <span><i class="bi bi-download"></i> Export comptable (partie double)</span>
                    <div class="d-flex gap-2">
                        <select v-model="exportJournal" class="form-select w-auto">
                            <option value="">Tous les journaux</option>
                            <option v-for="j in journaux" :key="j.id" :value="j.code">{{ j.libelle }}</option>
                        </select>
                        <button class="btn btn-primary" @click="exporterCSV">
                            <i class="bi bi-file-earmark-spreadsheet"></i> Exporter CSV
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-3">
                            <label>Période</label>
                            <select class="form-select" v-model="filtreExport.periode"
                                @change="appliquerFiltrePeriodeExport">
                                <option value="mois">Mois courant</option>
                                <option value="trimestre">Trimestre courant</option>
                                <option value="annee">Année courante</option>
                                <option value="personnalise">Personnalisé</option>
                            </select>
                        </div>
                        <template v-if="filtreExport.periode === 'personnalise'">
                            <div class="col-md-2"><label>Du</label><input type="date" class="form-control"
                                    v-model="filtreExport.dateDebut"></div>
                            <div class="col-md-2"><label>Au</label><input type="date" class="form-control"
                                    v-model="filtreExport.dateFin"></div>
                        </template>
                        <div class="col-md-3">
                            <button class="btn btn-primary mt-4" @click="genererApercuExport">Afficher</button>
                        </div>
                    </div>

                    <!-- Tableau d'aperçu de l'export (partie double) -->
                    <div class="table-responsive" style="max-height: 60vh;">
                        <table class="table table-sm table-bordered">
                            <thead>
                                <tr>
                                    <th>N° opération</th>
                                    <th>Journal</th>
                                    <th>Date</th>
                                    <th>Compte général</th>
                                    <th>Libellé</th>
                                    <th class="text-end">Débit</th>
                                    <th class="text-end">Crédit</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(ligne, idx) in lignesExport" :key="idx">
                                    <td>{{ ligne.numero }}</td>
                                    <td>{{ ligne.journal }}</td>
                                    <td>{{ ligne.date }}</td>
                                    <td>{{ ligne.compte }}</td>
                                    <td>{{ ligne.libelle }}</td>
                                    <td class="text-end">{{ ligne.debit ? formatMontantExport(ligne.debit) : '' }}</td>
                                    <td class="text-end">{{ ligne.credit ? formatMontantExport(ligne.credit) : '' }}
                                    </td>
                                </tr>
                                <tr v-if="lignesExport.length === 0">
                                    <td colspan="7" class="text-center">Aucune ligne à exporter</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <!-- ==================== ONGLET ÉCRITURES MANUELLES ==================== -->
        <div v-show="onglet === 'manuelles'" class="mt-3">
        <div class="card">
            <div class="card-header d-flex justify-content-between">
            <span><i class="bi bi-pencil-square"></i> Écritures manuelles (sans impact caisse/banque)</span>
            <div>
                <button class="btn btn-sm btn-outline-primary me-2" @click="ouvrirImportManuel">
                <i class="bi bi-upload"></i> Importer CSV
                </button>
                <button class="btn btn-sm btn-success" @click="nouvelleEcritureManuelle">
                <i class="bi bi-plus-circle"></i> Nouvelle écriture
                </button>
            </div>
            </div>
            <div class="card-body">
            <!-- Filtres simplifiés -->
            <div class="row mb-3">
                <div class="col-md-3">
                <label>Période</label>
                <select class="form-select" v-model="filtreManuelles.periode" @change="appliquerFiltrePeriodeManuelles">
                    <option value="mois">Mois courant</option>
                    <option value="trimestre">Trimestre courant</option>
                    <option value="annee">Année courante</option>
                    <option value="personnalise">Personnalisé</option>
                </select>
                </div>
                <template v-if="filtreManuelles.periode === 'personnalise'">
                <div class="col-md-2"><label>Du</label><input type="date" class="form-control" v-model="filtreManuelles.dateDebut"></div>
                <div class="col-md-2"><label>Au</label><input type="date" class="form-control" v-model="filtreManuelles.dateFin"></div>
                </template>
                <div class="col-md-2">
                <label>Poste budgétaire</label>
                <select class="form-select" v-model="filtreManuelles.posteId">
                    <option value="">Tous</option>
                    <option v-for="p in postesBudgetaires" :key="p.id" :value="p.id">{{ p.nom }}</option>
                </select>
                </div>
                <div class="col-md-2">
                <label>Type</label>
                <select class="form-select" v-model="filtreManuelles.type">
                    <option value="">Tous</option>
                    <option value="entree">Entrée</option>
                    <option value="sortie">Sortie</option>
                </select>
                </div>
                <div class="col-md-1">
                <button class="btn btn-primary mt-4" @click="chargerEcrituresManuelles">Filtrer</button>
                </div>
            </div>

            <div class="budget-table-container" style="max-height: 60vh;">
                <table class="table table-sm table-hover budget-table">
                <thead class="sticky-top bg-light">
                    <tr>
                    <th @click="triManuelles('date')" style="cursor: pointer;">Date</th>
                    <th @click="triManuelles('type')">Type</th>
                    <th @click="triManuelles('posteBudgetaire')">Poste</th>
                    <th @click="triManuelles('designation')">Désignation</th>
                    <th @click="triManuelles('montant')" class="text-end">Montant</th>
                    <th @click="triManuelles('devise')">Devise</th>
                    <th>Sous-caisse</th>
                    <th>Justificatif</th>
                    <th style="width: 100px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="e in ecrituresManuellesFiltrees" :key="e.id">
                    <td>{{ formatDate(e.date) }}</td>
                    <td><span :class="e.type === 'entree' ? 'text-success' : 'text-danger'">{{ e.type === 'entree' ? 'Entrée' : 'Sortie' }}</span></td>
                    <td>{{ e.posteBudgetaire }}</td>
                    <td>{{ e.designation || '-' }}</td>
                    <td class="text-end">{{ formatMontant(e.montant, e.devise) }}</td>
                    <td>{{ e.devise }}</td>
                    <td>{{ getSousCaisseNom(e.sousCaisseId) }}</td>
                    <td>{{ e.justificatif || '-' }}</td>
                    <td>
                        <div class="btn-group btn-group-sm">
                        <button class="btn btn-warning" @click="editerEcritureManuelle(e)" title="Modifier"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-danger" @click="supprimerEcritureManuelle(e)" title="Supprimer"><i class="bi bi-trash"></i></button>
                        </div>
                    </td>
                    </tr>
                    <tr v-if="ecrituresManuellesFiltrees.length === 0">
                    <td colspan="9" class="text-center">Aucune écriture manuelle</td>
                    </tr>
                </tbody>
                </table>
            </div>
            </div>
        </div>

        <!-- Modale édition/ajout écriture manuelle -->
        <div v-if="showEcritureManuelleModal" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
            <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                <h5 class="modal-title">{{ ecritureManuelleEnEdition ? 'Modifier' : 'Nouvelle' }} écriture manuelle</h5>
                <button type="button" class="btn-close" @click="showEcritureManuelleModal = false"></button>
                </div>
                <div class="modal-body">
                <form @submit.prevent="enregistrerEcritureManuelle">
                    <div class="mb-3">
                    <label>Date</label>
                    <input type="date" class="form-control" v-model="ecritureManuelleForm.date" :disabled="ecritureManuelleEnEdition !== null" required>
                    </div>
                    <div class="mb-3">
                    <label>Type</label>
                    <select class="form-select" v-model="ecritureManuelleForm.type" :disabled="ecritureManuelleEnEdition !== null" required>
                        <option value="entree">Entrée</option>
                        <option value="sortie">Sortie</option>
                    </select>
                    </div>
                    <div class="mb-3">
                    <label>Poste budgétaire</label>
                    <select class="form-select" v-model="ecritureManuelleForm.posteBudgetaire" required>
                        <option v-for="p in postesBudgetaires" :key="p.id" :value="p.nom">{{ p.nom }}</option>
                    </select>
                    </div>
                    <div class="mb-3">
                    <label>Désignation</label>
                    <input type="text" class="form-control" v-model="ecritureManuelleForm.designation">
                    </div>
                    <div class="mb-3">
                    <label>Montant</label>
                    <input type="number" step="0.01" class="form-control" v-model.number="ecritureManuelleForm.montant" :disabled="ecritureManuelleEnEdition !== null" required>
                    </div>
                    <div class="mb-3">
                    <label>Devise</label>
                    <select class="form-select" v-model="ecritureManuelleForm.devise" :disabled="ecritureManuelleEnEdition !== null" required>
                        <option value="USD">USD</option>
                        <option value="CDF">CDF</option>
                    </select>
                    </div>
                    <div class="mb-3">
                    <label>Sous-caisse associée (optionnel)</label>
                    <select class="form-select" v-model="ecritureManuelleForm.sousCaisseId">
                        <option value="">-- Aucune --</option>
                        <option v-for="sc in sousCaisses" :key="sc.id" :value="sc.id">{{ sc.nom }} ({{ sc.devise }})</option>
                    </select>
                    <small class="text-muted">Permet de rattacher l'écriture à une caisse pour la contrepartie dans l'export.</small>
                    </div>
                    <div class="mb-3">
                    <label>Justificatif</label>
                    <input type="text" class="form-control" v-model="ecritureManuelleForm.justificatif">
                    </div>
                    <button type="submit" class="btn btn-success">Enregistrer</button>
                    <button type="button" class="btn btn-secondary ms-2" @click="showEcritureManuelleModal = false">Annuler</button>
                </form>
                </div>
            </div>
            </div>
        </div>

        <!-- Modal Import CSV Écritures Manuelles -->
        <div v-if="showImportManuelModal" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
            <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                <h5 class="modal-title">Importer des écritures manuelles (CSV)</h5>
                <button type="button" class="btn-close" @click="showImportManuelModal = false"></button>
                </div>
                <div class="modal-body">
                <div class="row mb-3">
                    <div class="col-md-6">
                    <label>Fichier CSV</label>
                    <input type="file" class="form-control" @change="onFileChangeManuel" accept=".csv">
                    </div>
                    <div class="col-md-3">
                    <label>Ligne d'en-tête</label>
                    <input type="number" class="form-control" v-model.number="importManuel.ligneEnTete" min="0" max="20">
                    </div>
                </div>
                <div v-if="colonnesFichierManuel.length">
                    <h6>Mapping des colonnes</h6>
                    <div class="row mb-2" v-for="(col, idx) in colonnesFichierManuel" :key="idx">
                    <div class="col-md-4">{{ col }}</div>
                    <div class="col-md-6">
                        <select class="form-select" v-model="importManuel.mapping[col]">
                        <option value="">-- Ignorer --</option>
                        <option value="date">Date</option>
                        <option value="type">Type (entree/sortie)</option>
                        <option value="posteBudgetaire">Poste budgétaire</option>
                        <option value="designation">Désignation</option>
                        <option value="montant">Montant</option>
                        <option value="devise">Devise (USD/CDF)</option>
                        <option value="sousCaisseId">ID Sous-caisse</option>
                        <option value="justificatif">Justificatif</option>
                        </select>
                    </div>
                    </div>
                    <button class="btn btn-primary" @click="previsualiserManuel">Prévisualiser</button>
                </div>
                <div v-if="importManuel.apercu.length" class="mt-3">
                    <h6>Aperçu ({{ importManuel.apercu.length }} lignes)</h6>
                    <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                        <tr><th>Date</th><th>Type</th><th>Poste</th><th>Désignation</th><th>Montant</th><th>Devise</th></tr>
                        </thead>
                        <tbody>
                        <tr v-for="(l, i) in importManuel.apercu" :key="i">
                            <td>{{ l.date }}</td>
                            <td>{{ l.type }}</td>
                            <td>{{ l.posteBudgetaire }}</td>
                            <td>{{ l.designation }}</td>
                            <td>{{ l.montant }}</td>
                            <td>{{ l.devise }}</td>
                        </tr>
                        </tbody>
                    </table>
                    </div>
                    <button class="btn btn-success" @click="validerImportManuel">Importer ces écritures</button>
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
    import apiService from '../services/api';
    import { convertirMontants } from '../utils/taux';
    import Papa from 'papaparse';
    import { getEcrituresBudget, getEcrituresDefinitives } from '../utils/financeUtils';

    export default {
        name: 'Comptabilite',
        data() {
            return {
                onglet: 'ecritures',
                ecrituresCaisse: [],
                ecrituresBanque: [],
                sousCaisses: [],
                comptesBancaires: [],
                postesBudgetaires: [],
                journaux: [],
                filtreEcritures: {
                    periode: 'mois',
                    dateDebut: '',
                    dateFin: '',
                    posteId: '',
                    type: '',
                    devise: ''
                },
                showEcritureModal: false,
                ecritureEnEdition: null,
                ecritureForm: {
                    id: null, date: '', type: 'entree', posteBudgetaire: '', designation: '', montant: 0, devise: 'USD', source: 'caisse', sousCaisseId: '', compteId: '', justificatif: ''
                },
                showCompensationModal: false,
                ecritureASupprimer: null,
                compensation: { posteBudgetaire: '', designation: '', justificatif: '' },
                triEcrituresColonne: 'date',
                triEcrituresOrdre: 'desc',
                showRepartitionModal: false,
                ecritureARepartir: null,
                repartition: {
                    typePeriode: 'mensuel',
                    dateDebut: '',
                    dateFin: '',
                    mode: 'pourcentage',
                    pourcentage: null,
                    montantParPeriode: null
                },
                filtreExport: {
                    periode: 'mois',
                    dateDebut: '',
                    dateFin: ''
                },
                exportJournal: '',
                lignesExport: [],
                // Écritures manuelles
                ecrituresManuelles: [],
                filtreManuelles: {
                periode: 'mois',
                dateDebut: '',
                dateFin: '',
                posteId: '',
                type: ''
                },
                showEcritureManuelleModal: false,
                ecritureManuelleEnEdition: null,
                ecritureManuelleForm: {
                id: null,
                date: new Date().toISOString().slice(0,10),
                type: 'entree',
                posteBudgetaire: '',
                designation: '',
                montant: 0,
                devise: 'USD',
                sousCaisseId: '',
                justificatif: ''
                },
                triManuellesColonne: 'date',
                triManuellesOrdre: 'desc',

                // Import manuel
                showImportManuelModal: false,
                importManuel: {
                ligneEnTete: 1,
                mapping: {},
                data: null,
                apercu: []
                },
                colonnesFichierManuel: []
            };
        },
        computed: {
            ecrituresFiltrees() {
                const postesExclus = [
                    'Annulation écriture antérieure',
                    'Récupération sur justification',
                    'Ajustement clôture',
                    'Annulation écriture à justifier'
                ];

                let toutes = [...this.ecrituresCaisse, ...this.ecrituresBanque, ...this.ecrituresManuelles];
                const debut = this.filtreEcritures.dateDebut;
                const fin = this.filtreEcritures.dateFin;
                if (debut && fin) {
                    toutes = toutes.filter(e => e.date >= debut && e.date <= fin);
                }
                if (this.filtreEcritures.posteId) {
                    const poste = this.postesBudgetaires.find(p => p.id === this.filtreEcritures.posteId);
                    if (poste) toutes = toutes.filter(e => e.posteBudgetaire === poste.nom);
                }
                if (this.filtreEcritures.type) {
                    toutes = toutes.filter(e => e.type === this.filtreEcritures.type);
                }
                if (this.filtreEcritures.devise) {
                    toutes = toutes.filter(e => e.devise === this.filtreEcritures.devise);
                }

                // **Exclure les postes techniques**
                toutes = toutes.filter(e => {
                    const posteNom = e.posteBudgetaire || this.getPosteNomById(e.poste_id);
                    return !postesExclus.includes(posteNom);
                });

                return toutes.sort((a, b) => {
                    const col = this.triEcrituresColonne;
                    const ordre = this.triEcrituresOrdre;
                    let valA = a[col];
                    let valB = b[col];
                    if (col === 'date') { valA = new Date(valA); valB = new Date(valB); }
                    if (col === 'montant') { valA = parseFloat(valA) || 0; valB = parseFloat(valB) || 0; }
                    if (ordre === 'asc') return valA > valB ? 1 : -1;
                    return valA < valB ? 1 : -1;
                });
            },
            ecrituresManuellesFiltrees() {
                const postesExclus = ['Annulation écriture antérieure'];
                let liste = [...this.ecrituresManuelles];
                const debut = this.filtreManuelles.dateDebut;
                const fin = this.filtreManuelles.dateFin;
                if (debut && fin) {
                    liste = liste.filter(e => e.date >= debut && e.date <= fin);
                }
                if (this.filtreManuelles.posteId) {
                    const poste = this.postesBudgetaires.find(p => p.id === this.filtreManuelles.posteId);
                    if (poste) liste = liste.filter(e => e.posteBudgetaire === poste.nom);
                }
                if (this.filtreManuelles.type) {
                    liste = liste.filter(e => e.type === this.filtreManuelles.type);
                }
                // Exclure le poste technique
                liste = liste.filter(e => !postesExclus.includes(e.posteBudgetaire));

                return liste.sort((a, b) => {
                    const col = this.triManuellesColonne;
                    const ordre = this.triManuellesOrdre;
                    let valA = a[col];
                    let valB = b[col];
                    if (col === 'date') { valA = new Date(valA); valB = new Date(valB); }
                    if (col === 'montant') { valA = parseFloat(valA) || 0; valB = parseFloat(valB) || 0; }
                    if (ordre === 'asc') return valA > valB ? 1 : -1;
                    return valA < valB ? 1 : -1;
                });
            },
            nombrePeriodes() {
                if (!this.repartition.dateDebut || !this.repartition.dateFin) return 0;
                const debut = new Date(this.repartition.dateDebut);
                const fin = new Date(this.repartition.dateFin);
                if (this.repartition.typePeriode === 'mensuel') {
                    return (fin.getFullYear() - debut.getFullYear()) * 12 + (fin.getMonth() - debut.getMonth()) + 1;
                } else if (this.repartition.typePeriode === 'trimestriel') {
                    return Math.ceil(((fin - debut) / (1000 * 60 * 60 * 24 * 90)));
                }
                return 1;
            },
            totalReparti() {
                const nb = this.nombrePeriodes;
                if (this.repartition.mode === 'pourcentage') {
                    if (!this.ecritureARepartir) return 0;
                    return this.ecritureARepartir.montant * (this.repartition.pourcentage / 100) * nb;
                } else {
                    return (this.repartition.montantParPeriode || 0) * nb;
                }
            }
        },
        async mounted() {
            await this.chargerDonnees();
            this.appliquerFiltrePeriodeManuelles();
        },
        methods: {
            formatDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR') : ''; },
            formatMontant(m, devise) {
                if (m === undefined || m === null) return '0';
                if (devise === 'CDF') {
                    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(m)) + ' CDF';
                }
                return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(m) + ' USD';
            },
            formatMontantExport(m) {
                return m.toFixed(2).replace('.', ',');
            },
            getPosteNom(nom) { return nom || '-'; },
            async chargerDonnees() {
                this.sousCaisses = await db.sous_caisses.toArray();
                this.comptesBancaires = await db.comptes_bancaires.toArray();
                this.postesBudgetaires = await db.postes_budgetaires.toArray();
                this.journaux = await db.journaux.toArray();
                this.planComptable = await db.plan_comptable.toArray();
                await this.chargerEcritures();
                await this.chargerEcrituresManuelles();
            },
            async chargerEcritures() {
                const debut = this.filtreEcritures.dateDebut;
                const fin = this.filtreEcritures.dateFin;

                const { caisse, banque, manuelles } = await getEcrituresDefinitives(debut, fin);

                // Postes exclus de la compta (ne gèrent pas de ligne comptable)
                const postesExclusCompta = [
                    'Annulation écriture antérieure',
                    'Récupération sur justification',
                    'Annulation écriture à justifier'
                ];

                this.ecrituresCaisse = caisse
                    .filter(m => !postesExclusCompta.includes(m.poste))
                    .map(m => ({ ...m, source: 'Caisse' }));

                this.ecrituresBanque = banque
                    .filter(m => {
                        const posteNom = this.getPosteNomById(m.posteId);
                        return !postesExclusCompta.includes(posteNom);
                    })
                    .map(m => ({
                        ...m,
                        source: 'Banque',
                        date: m.date,
                        type: m.type === 'entree' ? 'entree' : 'sortie',
                        posteBudgetaire: this.getPosteNomById(m.posteId),
                        designation: m.libelle || '',
                        justificatif: ''
                    }));

                // Manuelles incluses telles quelles (déjà filtrées)
                this.ecrituresManuelles = manuelles.map(m => ({ ...m, source: 'Manuelle' }));
            },
            getPosteNomById(id) {
                const p = this.postesBudgetaires.find(x => x.id === id);
                return p ? p.nom : '';
            },
            appliquerFiltrePeriode() {
                const aujourdhui = new Date();
                let debut, fin;
                if (this.filtreEcritures.periode === 'mois') {
                    debut = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);
                    fin = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() + 1, 0);
                } else if (this.filtreEcritures.periode === 'trimestre') {
                    const trim = Math.floor(aujourdhui.getMonth() / 3);
                    debut = new Date(aujourdhui.getFullYear(), trim * 3, 1);
                    fin = new Date(aujourdhui.getFullYear(), (trim + 1) * 3, 0);
                } else {
                    debut = new Date(aujourdhui.getFullYear(), 0, 1);
                    fin = new Date(aujourdhui.getFullYear(), 11, 31);
                }
                this.filtreEcritures.dateDebut = debut.toISOString().slice(0, 10);
                this.filtreEcritures.dateFin = fin.toISOString().slice(0, 10);
            },
            triEcritures(col) {
                if (this.triEcrituresColonne === col) {
                    this.triEcrituresOrdre = this.triEcrituresOrdre === 'asc' ? 'desc' : 'asc';
                } else {
                    this.triEcrituresColonne = col;
                    this.triEcrituresOrdre = 'asc';
                }
            },
            nouvelleEcriture() {
                this.ecritureEnEdition = null;
                this.ecritureForm = {
                    id: null, date: new Date().toISOString().slice(0, 10), type: 'entree', posteBudgetaire: '',
                    designation: '', montant: 0, devise: 'USD', source: 'caisse',
                    sousCaisseId: this.sousCaisses.length ? this.sousCaisses[0].id : '',
                    compteId: this.comptesBancaires.length ? this.comptesBancaires[0].id : '',
                    justificatif: ''
                };
                this.showEcritureModal = true;
            },
            editerEcriture(e) {
                this.ecritureEnEdition = e;
                this.ecritureForm = {
                    id: null,
                    originalId: e.id,
                    source: e.source,
                    date: e.date,
                    type: e.type,
                    posteBudgetaire: e.posteBudgetaire,
                    designation: e.designation,
                    montant: e.montant,
                    devise: e.devise,
                    sousCaisseId: e.sousCaisseId,
                    compteId: e.compte_id,
                    justificatif: e.justificatif
                };
                this.showEcritureModal = true;
            },
            async enregistrerEcriture() {
                // Mode édition → correction comptable (ne modifie pas l'original)
                if (this.ecritureEnEdition) {
                    const original = this.ecritureEnEdition;
                    const date = this.ecritureForm.date;
                    const type = this.ecritureForm.type;
                    const poste = this.ecritureForm.posteBudgetaire;
                    const designation = this.ecritureForm.designation;
                    const montant = this.ecritureForm.montant;

                    if (!poste || montant <= 0) {
                        alert('Veuillez remplir tous les champs obligatoires');
                        return;
                    }

                    const { montant_cdf, montant_usd } = await convertirMontants(montant, this.ecritureForm.devise, date);

                    // Marquer l'original comme corrigé
                    if (original.source === 'Caisse') {
                        await db.mouvementsCaisse.update(original.id, { correctionComptable: true });
                    } else if (original.source === 'Banque') {
                        await db.mouvements_bancaires.update(original.id, { correctionComptable: true });
                    }

                    // Créer l'écriture manuelle de correction
                    await db.ecritures_manuelles.add({
                        id: crypto.randomUUID(),
                        date,
                        type,
                        posteBudgetaire: poste,
                        designation,
                        montant,
                        devise: this.ecritureForm.devise,
                        montant_cdf,
                        montant_usd,
                        sousCaisseId: this.ecritureForm.sousCaisseId || null,
                        justificatif: this.ecritureForm.justificatif,
                        source: 'Manuelle',
                        dateCreation: new Date().toISOString(),
                        typeCorrection: 'comptable',
                        parentId: original.id
                    });

                    await this.chargerEcritures();
                    await this.chargerEcrituresManuelles();
                    this.showEcritureModal = false;
                    alert('Correction comptable enregistrée (écriture manuelle)');
                    return;
                }

                // Mode création (inchangé)
                if (!this.ecritureForm.posteBudgetaire || this.ecritureForm.montant <= 0) {
                    alert('Veuillez remplir tous les champs obligatoires');
                    return;
                }
                try {
                    const { montant_cdf, montant_usd } = await convertirMontants(
                        this.ecritureForm.montant,
                        this.ecritureForm.devise,
                        this.ecritureForm.date
                    );
                    if (this.ecritureForm.source === 'caisse') {
                        const sc = this.sousCaisses.find(s => s.id === this.ecritureForm.sousCaisseId);
                        if (!sc) throw new Error('Sous-caisse introuvable');
                        await apiService.ajouter('mouvementsCaisse', {
                            caisseId: sc.caisseId,
                            sousCaisseId: this.ecritureForm.sousCaisseId,
                            semaineId: null,
                            date: this.ecritureForm.date,
                            type: this.ecritureForm.type,
                            montant: this.ecritureForm.montant,
                            devise: this.ecritureForm.devise,
                            montant_cdf,
                            montant_usd,
                            posteBudgetaire: this.ecritureForm.posteBudgetaire,
                            designation: this.ecritureForm.designation,
                            justificatif: this.ecritureForm.justificatif,
                            status: 'validé',
                            aJustifier: false
                        });
                    } else {
                        await apiService.ajouter('mouvements_bancaires', {
                            compte_id: this.ecritureForm.compteId,
                            date_operation: this.ecritureForm.date,
                            libelle: this.ecritureForm.designation,
                            montant: this.ecritureForm.montant,
                            devise: this.ecritureForm.devise,
                            montant_cdf,
                            montant_usd,
                            type: this.ecritureForm.type === 'entree' ? 'credit' : 'debit',
                            poste_id: this.postesBudgetaires.find(p => p.nom === this.ecritureForm.posteBudgetaire)?.id,
                            statut: 'valide'
                        });
                    }
                    await this.chargerEcritures();
                    await this.chargerEcrituresManuelles();
                    this.showEcritureModal = false;
                    alert('Écriture créée avec succès');
                } catch (error) {
                    console.error(error);
                    alert('Erreur lors de la création');
                }
            },
            supprimerEcriture(e) {
                this.ecritureASupprimer = e;
                this.compensation = { posteBudgetaire: '', designation: '', justificatif: '' };
                this.showCompensationModal = true;
            },
            async validerCompensation() {
                const e = this.ecritureASupprimer;
                const typeCompensation = e.type === 'entree' ? 'sortie' : 'entree';
                if (e.source === 'Caisse') {
                    await apiService.ajouter('mouvementsCaisse', {
                        caisseId: e.caisseId, sousCaisseId: e.sousCaisseId, semaineId: e.semaineId,
                        date: new Date().toISOString().slice(0, 10), type: typeCompensation, montant: e.montant, devise: e.devise,
                        montant_cdf: e.montant_cdf, montant_usd: e.montant_usd, posteBudgetaire: this.compensation.posteBudgetaire,
                        designation: this.compensation.designation || `Compensation suppression ${e.id}`,
                        justificatif: this.compensation.justificatif, status: 'validé', aJustifier: false,
                        parentId: e.id, estCorrection: true
                    });
                    await apiService.supprimer('mouvementsCaisse', e.id);
                } else {
                    await apiService.ajouter('mouvements_bancaires', {
                        compte_id: e.compte_id, date_operation: new Date().toISOString().slice(0, 10),
                        libelle: this.compensation.designation || `Compensation suppression ${e.id}`,
                        montant: e.montant, devise: e.devise, montant_cdf: e.montant_cdf, montant_usd: e.montant_usd,
                        type: typeCompensation === 'entree' ? 'credit' : 'debit',
                        poste_id: this.postesBudgetaires.find(p => p.nom === this.compensation.posteBudgetaire)?.id,
                        statut: 'valide'
                    });
                    await apiService.supprimer('mouvements_bancaires', e.id);
                }
                await this.chargerEcritures();
                this.showCompensationModal = false;
                alert('Écriture supprimée et compensée');
            },
            ouvrirRepartition(e) {
                this.ecritureARepartir = e;
                this.repartition = {
                    typePeriode: 'mensuel',
                    dateDebut: e.date,
                    dateFin: new Date(new Date(e.date).getFullYear(), 11, 31).toISOString().slice(0, 10),
                    mode: 'pourcentage',
                    pourcentage: null,
                    montantParPeriode: null
                };
                this.showRepartitionModal = true;
            },
            onModeChange() {
                this.repartition.pourcentage = null;
                this.repartition.montantParPeriode = null;
            },
            async enregistrerRepartition() {
                await db.repartitions_ecritures.add({
                    id: crypto.randomUUID(),
                    ecritureId: this.ecritureARepartir.id,
                    date_debut: this.repartition.dateDebut,
                    date_fin: this.repartition.dateFin,
                    montant_par_periode: this.repartition.mode === 'montant' ? this.repartition.montantParPeriode : null,
                    pourcentage: this.repartition.mode === 'pourcentage' ? this.repartition.pourcentage : null,
                    type_periode: this.repartition.typePeriode
                });
                this.showRepartitionModal = false;
                alert('Répartition enregistrée');
            },
            appliquerFiltrePeriodeExport() {
                const aujourdhui = new Date();
                let debut, fin;
                if (this.filtreExport.periode === 'mois') {
                    debut = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);
                    fin = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() + 1, 0);
                } else if (this.filtreExport.periode === 'trimestre') {
                    const trim = Math.floor(aujourdhui.getMonth() / 3);
                    debut = new Date(aujourdhui.getFullYear(), trim * 3, 1);
                    fin = new Date(aujourdhui.getFullYear(), (trim + 1) * 3, 0);
                } else {
                    debut = new Date(aujourdhui.getFullYear(), 0, 1);
                    fin = new Date(aujourdhui.getFullYear(), 11, 31);
                }
                this.filtreExport.dateDebut = debut.toISOString().slice(0, 10);
                this.filtreExport.dateFin = fin.toISOString().slice(0, 10);
            },
            async genererApercuExport() {
                const postesExclus = [
                    'Annulation écriture antérieure',
                    'Récupération sur justification',
                    'Ajustement clôture',
                    'Annulation écriture à justifier'
                ];
                const lignes = [];
                const debut = this.filtreExport.dateDebut;
                const fin = this.filtreExport.dateFin;

                let ecritures = [
                    ...this.ecrituresCaisse,
                    ...this.ecrituresBanque,
                    ...this.ecrituresManuelles
                ].filter(e => e.date >= debut && e.date <= fin);

                // Filtrer par journal si sélectionné
                if (this.exportJournal) {
                    ecritures = ecritures.filter(e => this.getJournalCodeFromEcriture(e) === this.exportJournal);
                }

                // **Exclure les postes techniques**
                ecritures = ecritures.filter(e => {
                    const posteNom = e.posteBudgetaire || this.getPosteNomById(e.poste_id);
                    return !postesExclus.includes(posteNom);
                });

                let numOp = 1;
                for (let e of ecritures) {
                    // Déterminer le compte de trésorerie selon la source
                    let compteTresorerie = null;
                    if (e.source === 'Caisse') {
                    compteTresorerie = this.getCompteTresorerie(e);
                    } else if (e.source === 'Banque') {
                    compteTresorerie = this.getCompteTresorerie(e);
                    } else if (e.source === 'Manuelle') {
                    if (e.sousCaisseId) {
                        const sc = this.sousCaisses.find(s => s.id === e.sousCaisseId);
                        compteTresorerie = sc ? (sc.devise === 'USD' ? '571200' : '571100') : '580000';
                    } else {
                        compteTresorerie = '580000';
                    }
                    }

                    const estTransfertOuChange = ['Transfert entre caisses', 'Change'].includes(e.posteBudgetaire);
                    
                    if (estTransfertOuChange) {
                    const journal = this.getJournalCodeFromEcriture(e);
                    const libelle = e.designation || e.libelle || '';
                    const montant = e.montant;
                    const debit = e.type === 'entree' ? montant : null;
                    const credit = e.type === 'sortie' ? montant : null;

                    lignes.push({
                        numero: numOp,
                        journal,
                        date: e.date,
                        compte: compteTresorerie,
                        libelle,
                        debit,
                        credit
                    });
                    numOp++;
                    continue;
                    }

                    const compteChargeProduit = await this.getCompteChargeProduit(e.posteBudgetaire);
                    const journal = this.getJournalCodeFromEcriture(e);
                    const libelle = e.designation || e.libelle || '';
                    const montant = e.montant;

                    if (compteChargeProduit) {
                    lignes.push({
                        numero: numOp,
                        journal,
                        date: e.date,
                        compte: compteChargeProduit,
                        libelle,
                        debit: e.type === 'sortie' ? montant : null,
                        credit: e.type === 'entree' ? montant : null
                    });
                    }

                    if (compteTresorerie) {
                    lignes.push({
                        numero: numOp,
                        journal,
                        date: e.date,
                        compte: compteTresorerie,
                        libelle,
                        debit: e.type === 'entree' ? montant : null,
                        credit: e.type === 'sortie' ? montant : null
                    });
                    }

                    numOp++;
                }

                this.lignesExport = lignes;
            },
            getJournalCode(sc) {
                // À adapter selon votre paramétrage
                return sc.devise === 'USD' ? 'CKI' : 'CAI';
            },
            getJournalCodeFromEcritureManuelle(e) {
            if (e.sousCaisseId) {
                const sc = this.sousCaisses.find(s => s.id === e.sousCaisseId);
                if (sc) {
                return sc.devise === 'USD' ? 'CKI' : 'CAI';
                }
            }
            return 'OD'; // Code par défaut pour les écritures manuelles sans caisse
            },
            getJournalCodeBanque(_c) {
                return 'BQ1';
            },
            getJournalCodeFromEcriture(e) {
                if (e.source === 'Caisse') {
                    const sc = this.sousCaisses.find(s => s.id === e.sousCaisseId);
                    return sc ? (sc.devise === 'USD' ? 'CKI' : 'CAI') : 'CKI';
                } else if (e.source === 'Banque') {
                    return 'BQ1';
                } else if (e.source === 'Manuelle') {
                    return this.getJournalCodeFromEcritureManuelle(e);
                }
                return 'OD';
            },
            async getCompteChargeProduit(posteNom) {
                const poste = this.postesBudgetaires.find(p => p.nom === posteNom);
                if (!poste) return null;
                const lien = await db.poste_compte.where('posteId').equals(poste.id).first();
                if (!lien) return null;
                const compte = await db.plan_comptable.get(lien.compteId);
                return compte ? compte.numero_compte : null;
            },
            getCompteTresorerie(e) {
                if (e.source === 'Caisse') {
                    const sc = this.sousCaisses.find(s => s.id === e.sousCaisseId);
                    return sc && sc.devise === 'USD' ? '571200' : '571100';
                }
                return '521500';
            },
            exporterCSV() {
                if (!this.lignesExport.length) {
                    alert('Aucune ligne à exporter');
                    return;
                }
                const separateur = ';';
                let csv = `N° opération${separateur}Journal${separateur}Date${separateur}Compte général${separateur}Libellé${separateur}Débit${separateur}Crédit\n`;
                for (let l of this.lignesExport) {
                    csv += `${l.numero}${separateur}${l.journal}${separateur}${l.date}${separateur}${l.compte}${separateur}"${l.libelle}"${separateur}${l.debit || ''}${separateur}${l.credit || ''}\n`;
                }
                const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `export_comptable_${this.filtreExport.dateDebut}_${this.filtreExport.dateFin}.csv`;
                link.click();
            },
            async chargerEcrituresManuelles() {
                this.ecrituresManuelles = await db.ecritures_manuelles.toArray();
                this.appliquerFiltrePeriodeManuelles();
                },
                appliquerFiltrePeriodeManuelles() {
                const aujourdhui = new Date();
                let debut, fin;
                if (this.filtreManuelles.periode === 'mois') {
                    debut = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);
                    fin = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() + 1, 0);
                } else if (this.filtreManuelles.periode === 'trimestre') {
                    const trim = Math.floor(aujourdhui.getMonth() / 3);
                    debut = new Date(aujourdhui.getFullYear(), trim * 3, 1);
                    fin = new Date(aujourdhui.getFullYear(), (trim + 1) * 3, 0);
                } else {
                    debut = new Date(aujourdhui.getFullYear(), 0, 1);
                    fin = new Date(aujourdhui.getFullYear(), 11, 31);
                }
                this.filtreManuelles.dateDebut = debut.toISOString().slice(0,10);
                this.filtreManuelles.dateFin = fin.toISOString().slice(0,10);
                },
                triManuelles(col) {
                if (this.triManuellesColonne === col) {
                    this.triManuellesOrdre = this.triManuellesOrdre === 'asc' ? 'desc' : 'asc';
                } else {
                    this.triManuellesColonne = col;
                    this.triManuellesOrdre = 'asc';
                }
                },
                nouvelleEcritureManuelle() {
                this.ecritureManuelleEnEdition = null;
                this.ecritureManuelleForm = {
                    id: null,
                    date: new Date().toISOString().slice(0,10),
                    type: 'entree',
                    posteBudgetaire: '',
                    designation: '',
                    montant: 0,
                    devise: 'USD',
                    sousCaisseId: '',
                    justificatif: ''
                };
                this.showEcritureManuelleModal = true;
                },
                editerEcritureManuelle(e) {
                this.ecritureManuelleEnEdition = e;
                this.ecritureManuelleForm = { ...e };
                this.showEcritureManuelleModal = true;
                },
                async enregistrerEcritureManuelle() {
                if (!this.ecritureManuelleForm.posteBudgetaire || this.ecritureManuelleForm.montant <= 0) {
                    alert('Veuillez remplir les champs obligatoires');
                    return;
                }
                const { montant_cdf, montant_usd } = await convertirMontants(
                    this.ecritureManuelleForm.montant,
                    this.ecritureManuelleForm.devise,
                    this.ecritureManuelleForm.date
                );
                const data = {
                    ...this.ecritureManuelleForm,
                    montant_cdf,
                    montant_usd,
                    source: 'Manuelle',
                    dateCreation: new Date().toISOString(),
                    dateModification: new Date().toISOString()
                };
                try {
                    if (this.ecritureManuelleEnEdition) {
                    // En édition, on ne modifie que le poste et la désignation (et le justificatif)
                    await db.ecritures_manuelles.update(this.ecritureManuelleEnEdition.id, {
                        posteBudgetaire: data.posteBudgetaire,
                        designation: data.designation,
                        justificatif: data.justificatif,
                        sousCaisseId: data.sousCaisseId,
                        dateModification: new Date().toISOString()
                    });
                    } else {
                    data.id = crypto.randomUUID();
                    await apiService.ajouter('ecritures_manuelles', data, { audit: true });
                    }
                    await this.chargerEcrituresManuelles();
                    this.showEcritureManuelleModal = false;
                    alert('Écriture enregistrée');
                } catch (error) {
                    console.error(error);
                    alert('Erreur');
                }
                },
                async supprimerEcritureManuelle(e) {
                if (!confirm('Supprimer cette écriture manuelle ?')) return;
                await db.ecritures_manuelles.delete(e.id);
                await this.chargerEcrituresManuelles();
                },
                getSousCaisseNom(id) {
                const sc = this.sousCaisses.find(s => s.id === id);
                return sc ? sc.nom : '-';
                },
                // Import CSV manuel
                ouvrirImportManuel() {
                this.showImportManuelModal = true;
                this.importManuel = { ligneEnTete: 1, mapping: {}, data: null, apercu: [] };
                this.colonnesFichierManuel = [];
                },
                onFileChangeManuel(event) {
                const file = event.target.files[0];
                if (!file) return;
                Papa.parse(file, {
                    encoding: "UTF-8",
                    complete: (results) => {
                    this.importManuel.data = results.data;
                    this.genererColonnesManuel();
                    }
                });
                },
                genererColonnesManuel() {
                    const data = this.importManuel.data;
                    if (!data || data.length === 0) return;
                    const headerIndex = this.importManuel.ligneEnTete - 1;
                    if (headerIndex >= 0 && headerIndex < data.length) {
                        this.colonnesFichierManuel = data[headerIndex];
                    } else {
                        const maxCols = Math.max(...data.slice(0, 5).map(r => r.length));
                        this.colonnesFichierManuel = Array.from({ length: maxCols }, (_, i) => `Col${i + 1}`);
                    }
                },
                previsualiserManuel() {
                    const data = this.importManuel.data;
                    const headerIdx = this.importManuel.ligneEnTete - 1;
                    const start = headerIdx + 1;
                    const lignes = data.slice(start);
                    const mapping = this.importManuel.mapping;
                    
                    const getVal = (row, field) => {
                        const col = Object.keys(mapping).find(k => mapping[k] === field);
                        if (!col) return '';
                        const idx = this.colonnesFichierManuel.indexOf(col);
                        return idx >= 0 ? row[idx] : '';
                    };

                    this.importManuel.apercu = lignes.slice(0, 10).map((row, _i) => {
                        const date = getVal(row, 'date');
                        const type = getVal(row, 'type');
                        const poste = getVal(row, 'posteBudgetaire');
                        const designation = getVal(row, 'designation');
                        const montant = parseFloat(getVal(row, 'montant')) || 0;
                        const devise = getVal(row, 'devise');
                        return { date, type, posteBudgetaire: poste, designation, montant, devise };
                    });
                },
                async validerImportManuel() {
                    const data = this.importManuel.data;
                    const headerIdx = this.importManuel.ligneEnTete - 1;
                    const start = headerIdx + 1;
                    const lignes = data.slice(start);
                    const mapping = this.importManuel.mapping;
                    
                    const getVal = (row, field) => {
                        const col = Object.keys(mapping).find(k => mapping[k] === field);
                        if (!col) return '';
                        const idx = this.colonnesFichierManuel.indexOf(col);
                        return idx >= 0 ? row[idx] : '';
                    };

                    for (let row of lignes) {
                        const date = getVal(row, 'date');
                        const type = getVal(row, 'type');
                        const poste = getVal(row, 'posteBudgetaire');
                        const designation = getVal(row, 'designation');
                        const montant = parseFloat(getVal(row, 'montant')) || 0;
                        const devise = getVal(row, 'devise');
                        const sousCaisseId = getVal(row, 'sousCaisseId');
                        const justificatif = getVal(row, 'justificatif');

                        if (!date || !type || !poste || !montant || !devise) continue;

                        const { montant_cdf, montant_usd } = await convertirMontants(montant, devise, date);

                        await db.ecritures_manuelles.add({
                        id: crypto.randomUUID(),
                        date,
                        type,
                        posteBudgetaire: poste,
                        designation,
                        montant,
                        devise,
                        montant_cdf,
                        montant_usd,
                        sousCaisseId,
                        justificatif,
                        source: 'Manuelle',
                        dateCreation: new Date().toISOString()
                        });
                    }

                    await this.chargerEcrituresManuelles();
                    this.showImportManuelModal = false;
                    alert('Import terminé');
                },
        }
    };
</script>

<style scoped>
    .budget-table-container {
        max-height: 65vh;
        overflow: auto;
        border: 1px solid #dee2e6;
        border-radius: 8px;
    }

    .budget-table {
        margin-bottom: 0;
        font-size: 0.9rem;
    }

    .budget-table thead th {
        position: sticky;
        top: 0;
        background: #f8f9fa;
        z-index: 10;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        white-space: nowrap;
    }
</style>