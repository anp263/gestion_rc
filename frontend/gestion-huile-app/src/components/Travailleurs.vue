<template>
  <div class="container-fluid">
    <h2 class="mb-4" style="color: #ED1C24;">Gestion des travailleurs</h2>

    <!-- Sélecteur d'année -->
    <div class="card mb-3">
      <div class="card-body d-flex justify-content-between align-items-center">
        <div class="w-25">
          <label>Année de travail</label>
          <select class="form-select" v-model="anneeSelectionnee" @change="changerAnnee">
            <option v-for="a in anneesDisponibles" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>
        <button class="btn btn-warning" @click="nouvelleAnnee">📅 Nouvelle année</button>
      </div>
    </div>

    <ul class="nav nav-tabs">
      <li class="nav-item"><a class="nav-link" :class="{ active: onglet === 'liste' }" href="#" @click.prevent="onglet = 'liste'">📋 Liste</a></li>
      <li class="nav-item"><a class="nav-link" :class="{ active: onglet === 'presence' }" href="#" @click.prevent="onglet = 'presence'">📆 Suivi présence</a></li>
      <li class="nav-item"><a class="nav-link" :class="{ active: onglet === 'avances' }" href="#" @click.prevent="onglet = 'avances'">💰 Avances & Remboursements</a></li>
      <li class="nav-item"><a class="nav-link" :class="{ active: onglet === 'primes' }" href="#" @click.prevent="onglet = 'primes'">🎁 Primes</a></li>
      <li class="nav-item"><a class="nav-link" :class="{ active: onglet === 'decompte' }" href="#" @click.prevent="onglet = 'decompte'">📊 Décompte mensuel</a></li>
      <li class="nav-item"><a class="nav-link" :class="{ active: onglet === 'fiche' }" href="#" @click.prevent="onglet = 'fiche'">📄 Fiche de paie</a></li>
      <li class="nav-item"><a class="nav-link" :class="{ active: onglet === 'impots' }" href="#" @click.prevent="onglet = 'impots'">📊 Impôts et charges</a></li>
      <li class="nav-item"><a class="nav-link" :class="{ active: onglet === 'historique' }" href="#" @click.prevent="onglet = 'historique'">📜 Historique</a></li>
    </ul>

    <!-- ==================== ONGLET LISTE ==================== -->
    <div v-show="onglet === 'liste'" class="mt-3">
      <div class="card">
        <div class="card-header d-flex justify-content-between">
          <span><i class="bi bi-people"></i> Travailleurs</span>
          <button class="btn btn-sm btn-success" @click="nouveauTravailleur">➕ Nouveau</button>
        </div>
        <div class="card-body">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Postnom</th>
                <th>Prénom</th>
                <th>Département</th>
                <th>Poste</th>
                <th>Salaire net</th>
                <th>Vacances rest.</th>
                <th>Actif</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in travailleurs" :key="t.id">
                <td class="text-start">{{ t.nom }}</td>
                <td class="text-start">{{ t.postnom || '-' }}</td>
                <td class="text-start">{{ t.prenom }}</td>
                <td class="text-start">{{ t.departement }}</td>
                <td class="text-start">{{ getNomPosteTravail(t.poste_travail_id) }}</td>
                <td class="text-start">{{ formatMontant(t.salaire_net_total, 'CDF') }}</td>
                <td class="text-center">{{ getJoursVacancesRestants(t) }}</td>
                <td class="text-center"><input type="checkbox" v-model="t.actif" @change="sauvegarderActifTravailleur(t)"></td>
                <td class="text-nowrap">
                  <button class="btn btn-sm btn-outline-primary" @click="voirDetailsTravailleur(t)">👁️</button>
                  <button class="btn btn-sm btn-info ms-1" @click="editerTravailleur(t)">✏️</button>
                  <button class="btn btn-sm btn-danger ms-1" @click="supprimerTravailleur(t.id)">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal édition travailleur -->
      <div v-if="showTravailleurModal" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ editionTravailleur.id ? 'Modifier' : 'Nouveau' }} travailleur</h5>
              <button type="button" class="btn-close" @click="showTravailleurModal = false"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="sauvegarderTravailleur">
                <div class="row">
                  <div class="col-md-4 mb-2"><label>Nom</label><input type="text" class="form-control" v-model="editionTravailleur.nom" required></div>
                  <div class="col-md-4 mb-2"><label>Postnom</label><input type="text" class="form-control" v-model="editionTravailleur.postnom"></div>
                  <div class="col-md-4 mb-2"><label>Prénom</label><input type="text" class="form-control" v-model="editionTravailleur.prenom" required></div>
                </div>
                <div class="row">
                  <div class="col-md-4 mb-2"><label>Date naissance</label><input type="date" class="form-control" v-model="editionTravailleur.date_naissance"></div>
                  <div class="col-md-4 mb-2"><label>Date début</label><input type="date" class="form-control" v-model="editionTravailleur.date_debut"></div>
                  <div class="col-md-4 mb-2"><label>Département</label>
                    <select class="form-select" v-model="editionTravailleur.departement">
                      <option v-for="dep in departements" :key="dep" :value="dep">{{ dep }}</option>
                    </select>
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-4 mb-2"><label>Poste (fonction)</label>
                    <select class="form-select" v-model="editionTravailleur.poste_travail_id">
                      <option v-for="pt in postesTravail" :key="pt" :value="pt">{{ pt }}</option>
                    </select>
                  </div>
                  <div class="col-md-4 mb-2"><label>Nb personnes à charge</label>
                    <input type="number" class="form-control" v-model.number="editionTravailleur.nb_personnes_charge" min="0" max="9">
                  </div>
                  <div class="col-md-4 mb-2"><label>Salaire net mensuel total (CDF)</label>
                    <input type="number" class="form-control" v-model.number="editionTravailleur.salaire_net_total" required>
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-6 mb-2">
                    <label>Soumis Impôts</label>
                    <input type="checkbox" v-model="editionTravailleur.soumis_ipr">
                  </div>
                  <div class="col-md-6 mb-2">
                    <label>Soumis Charges sociales</label>
                    <input type="checkbox" v-model="editionTravailleur.soumis_cnss">
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-4 mb-2"><label>Actif</label><input type="checkbox" v-model="editionTravailleur.actif"></div>
                </div>
                <button type="submit" class="btn btn-success">Enregistrer</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal détails travailleur -->
      <div v-if="showDetailsModal" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Détails du travailleur</h5>
              <button type="button" class="btn-close" @click="showDetailsModal = false"></button>
            </div>
            <div class="modal-body">
              <p><strong>Nom complet :</strong> {{ detailsTravailleur.nom }} {{ detailsTravailleur.postnom }} {{ detailsTravailleur.prenom }}</p>
              <p><strong>Département :</strong> {{ detailsTravailleur.departement }}</p>
              <p><strong>Poste :</strong> {{ getNomPosteTravail(detailsTravailleur.poste_travail_id) }}</p>
              <p><strong>Salaire net mensuel :</strong> {{ formatMontant(detailsTravailleur.salaire_net_total, 'CDF') }} CDF</p>
              <p><strong>Personnes à charge :</strong> {{ detailsTravailleur.nb_personnes_charge || 0 }}</p>
              <p><strong>Soumis Impôts :</strong> {{ detailsTravailleur.soumis_ipr ? 'Oui' : 'Non' }}</p>
              <p><strong>Soumis Charges sociales :</strong> {{ detailsTravailleur.soumis_cnss ? 'Oui' : 'Non' }}</p>
              <p><strong>Date d'entrée :</strong> {{ detailsTravailleur.date_debut ? formatDate(detailsTravailleur.date_debut) : 'Non renseignée' }}</p>
            </div>
          </div>
        </div>
      </div>
          </div>

    <!-- ==================== ONGLET SUIVI PRÉSENCE ==================== -->
    <div v-show="onglet === 'presence'" class="mt-3">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <span>Suivi mensuel des présences</span>
          <select class="form-select w-auto" v-model="moisPresence" @change="chargerPresenceTableau">
            <option v-for="m in moisDisponiblesPresence" :key="m.valeur" :value="m.valeur">{{ m.libelle }}</option>
            </select>
        </div>
        <div class="card-body">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Jours de vacances</th>
                <th>Jours d'absence/suspension</th>
                <th>Motif</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ligne in presenceTableau" :key="ligne.travailleur_id">
                <td>{{ ligne.nom }}</td>
                <td>
                  <input type="number" class="form-control form-control-sm" v-model.number="ligne.jours_vacances" min="0" :max="paramsConges.joursVacancesAnnuels">
                </td>
                <td>
                  <input type="number" class="form-control form-control-sm" v-model.number="ligne.jours_suspension" min="0" :max="paramsConges.joursOuvrablesMois">
                </td>
                <td>
                  <input type="text" class="form-control form-control-sm" v-model="ligne.motif">
                </td>
              </tr>
            </tbody>
          </table>
          <button class="btn btn-primary mt-3" @click="sauvegarderPresenceTableau">Enregistrer les modifications</button>
        </div>
      </div>
    </div>

    <!-- ==================== ONGLET AVANCES ==================== -->
    <div v-show="onglet === 'avances'" class="mt-3">
      <div class="card">
        <div class="card-header">Avances en cours</div>
        <div class="card-body">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Travailleur</th>
                <th>Type</th>
                <th>Montant total</th>
                <th>Mois restants</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="av in avancesEnCours" :key="av.id">
                <td>{{ getNomTravailleur(av.travailleur_id) }}</td>
                <td>{{ av.type === 'annee' ? 'Annuelle' : 'Mois' }}</td>
                <td>{{ formatMontant(av.montant, 'CDF') }}</td>
                <td>{{ av.nb_mois_remboursement - (av.mois_rembourses || 0) }}</td>
                <td>
                  <button class="btn btn-sm btn-primary" @click="ouvrirEcheancierAvance(av)" :disabled="av.type !== 'annee'">📅 Échéancier</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal échéancier (identique à Caisse.vue) -->
      <div v-if="showEcheancierModal" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Échéancier de remboursement</h5>
              <button type="button" class="btn-close" @click="showEcheancierModal = false"></button>
            </div>
            <div class="modal-body">
              <div v-for="(echeance, idx) in echeancier" :key="idx" class="row mb-2">
                <div class="col-md-6">{{ formatMoisAnnee(echeance.mois) }}</div>
                <div class="col-md-6">
                  <input type="text" class="form-control" v-model="echeance.montant" 
                        @input="formatInputNumberLive($event, 'CDF')" 
                        @blur="formatInputNumberBlur($event, 'CDF'); calculerTotalEcheancier()">
                </div>
              </div>
              <p>Total : {{ formatMontant(totalEcheancier, 'CDF') }} / {{ formatMontant(montantAvanceEncours, 'CDF') }}</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="showEcheancierModal = false">Annuler</button>
              <button class="btn btn-primary" @click="sauvegarderEcheancier">Enregistrer</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== ONGLET PRIMES ==================== -->
    <div v-show="onglet === 'primes'" class="mt-3">
      <div class="card">
        <div class="card-header">Attribution de primes</div>
        <div class="card-body">
          <div class="row mb-3">
            <div class="col-md-3">
              <label>Mode</label>
              <select class="form-select" v-model="primeForm.mode">
                <option value="individuel">Individuel</option>
                <option value="collectif_montant">Collectif (montant fixe)</option>
                <option value="collectif_pourcent">Collectif (% du salaire net)</option>
              </select>
            </div>
            <div class="col-md-3">
              <label>Mois</label>
              <select class="form-select" v-model="primeForm.moisStr">
                <option v-for="m in moisDisponibles" :key="m.valeur" :value="m.valeur">{{ m.libelle }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <label>{{ primeForm.mode === 'collectif_pourcent' ? 'Pourcentage (%)' : 'Montant (CDF)' }}</label>
              <input type="number" class="form-control" v-model.number="primeForm.valeur" min="0">
            </div>
            <div class="col-md-3">
              <label>Libellé</label>
              <input type="text" class="form-control" v-model="primeForm.libelle">
            </div>
          </div>
          <div v-if="primeForm.mode === 'individuel'">
            <label>Travailleur</label>
            <select class="form-select w-50" v-model="primeForm.travailleur_id">
              <option v-for="t in travailleursActifs" :key="t.id" :value="t.id">{{ t.nom }} {{ t.prenom }}</option>
            </select>
          </div>
          <div v-else>
            <label>Sélectionner les bénéficiaires</label>
            <div v-for="t in travailleursActifs" :key="t.id" class="form-check">
              <input class="form-check-input" type="checkbox" :value="t.id" v-model="primeForm.beneficiaires">
              <label class="form-check-label">{{ t.nom }} {{ t.prenom }}</label>
            </div>
          </div>
          <button class="btn btn-success mt-3" @click="attribuerPrimes">Attribuer</button>
          <hr>
          <h5>Historique des primes</h5>
          <table class="table table-sm">
                <thead>
                    <tr><th>Travailleur</th><th>Mois</th><th>Montant</th><th>Libellé</th><th>Payée</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    <tr v-for="p in primes" :key="p.id">
                    <td>{{ getNomTravailleur(p.travailleur_id) }}</td>
                    <td>{{ formatMoisAnnee(p.annee + '-' + String(p.mois).padStart(2,'0')) }}</td>
                    <td>{{ formatMontant(p.montant, 'CDF') }}</td>
                    <td>{{ p.libelle }}</td>
                    <td>{{ p.payee ? 'Oui' : 'Non' }}</td>
                    <td>
                        <button v-if="!p.payee" class="btn btn-sm btn-danger" @click="supprimerPrime(p.id)">🗑️</button>
                    </td>
                    </tr>
                </tbody>
            </table>
        </div>
      </div>
    </div>

    <!-- ==================== ONGLET DÉCOMPTE MENSUEL ==================== -->
    <div v-show="onglet === 'decompte'" class="mt-3">
      <div class="card">
        <div class="card-header d-flex justify-content-between">
          <span>Décompte mensuel</span>
          <select class="form-select w-auto" v-model="moisDecompte" @change="chargerDecompte">
            <option v-for="m in moisDisponibles" :key="m.valeur" :value="m.valeur">{{ m.libelle }}</option>
          </select>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-bordered">
              <thead>
                <tr>
                  <th>Travailleur</th>
                  <th>Salaire net</th>
                  <th>Avances</th>
                  <th>Remboursements</th>
                  <th>Suspensions</th>
                  <th>Primes</th>
                  <th>Net à payer</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in decompte" :key="d.travailleur_id">
                  <td>{{ d.nom }}</td>
                  <td class="text-end">{{ formatMontant(d.salaire_net, 'CDF') }}</td>
                  <td class="text-end text-danger">{{ formatMontant(d.avances, 'CDF') }}</td>
                  <td class="text-end text-success">{{ formatMontant(d.remboursements, 'CDF') }}</td>
                  <td class="text-end">{{ formatMontant(d.montant_suspension, 'CDF') }} ({{ d.jours_suspension }} j)</td>
                  <td class="text-end text-primary">{{ formatMontant(d.primes, 'CDF') }}</td>
                  <td class="text-end fw-bold">{{ formatMontant(d.net, 'CDF') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <button class="btn btn-success mt-3" @click="exporterDecomptePDF">Exporter PDF</button>
        </div>
      </div>
    </div>

    <!-- ==================== ONGLET FICHE DE PAIE ==================== -->
    <div v-show="onglet === 'fiche'" class="mt-3">
      <div class="card">
        <div class="card-header d-flex justify-content-between">
          <span>Fiche de paie</span>
          <select class="form-select w-auto" v-model="ficheMois">
            <option v-for="m in moisDisponibles" :key="m.valeur" :value="m.valeur">{{ m.libelle }}</option>
          </select>
        </div>
        <div class="card-body">
          <div class="row mb-3">
            <div class="col-md-4">
              <label>Travailleur</label>
              <select class="form-select" v-model="ficheTravailleurId">
                <option v-for="t in travailleurs" :key="t.id" :value="t.id">{{ t.nom }} {{ t.prenom }}</option>
              </select>
            </div>
            <div class="col-md-2">
              <button class="btn btn-primary" @click="exporterFichePDF">Exporter PDF</button>
            </div>
            <div class="col-md-2">
              <button class="btn btn-secondary" @click="ouvrirSelectionModal">Export PDF sélection</button>
            </div>
          </div>
          <div v-if="fichePaieHtml" v-html="fichePaieHtml" class="border p-3"></div>
        </div>
      </div>
        <div v-if="showSelectionModal" class="modal" style="display:block; background:rgba(0,0,0,0.5);">
            <div class="modal-dialog">
                <div class="modal-content">
                <div class="modal-header">
                    <h5>Sélectionner les travailleurs</h5>
                    <button type="button" class="btn-close" @click="showSelectionModal = false"></button>
                </div>
                <div class="modal-body">
                    <div v-for="t in travailleurs" :key="t.id" class="form-check">
                    <input class="form-check-input" type="checkbox" :value="t.id" v-model="selectedTravailleurs">
                    <label class="form-check-label">{{ t.nom }} {{ t.prenom }}</label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="showSelectionModal = false">Annuler</button>
                    <button class="btn btn-primary" @click="exporterFichesSelection">Exporter PDF</button>
                </div>
                </div>
            </div>
        </div>
    </div>

    <!-- ==================== ONGLET IMPÔTS ET CHARGES SOCIALES ==================== -->
    <div v-show="onglet === 'impots'" class="mt-3">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <span>Impôts et charges sociales</span>
          <div>
            <select class="form-select d-inline-block w-auto me-2" v-model="moisImpots" @change="chargerImpotsCharges">
              <option v-for="m in moisDisponibles" :key="m.valeur" :value="m.valeur">{{ m.libelle }}</option>
            </select>
            <select class="form-select d-inline-block w-auto" v-model="filtreNomImpots" @change="chargerImpotsCharges">
              <option value="">Tous les travailleurs</option>
              <option v-for="t in travailleurs" :key="t.id" :value="t.id">{{ t.nom }} {{ t.prenom }}</option>
            </select>
            <button class="btn btn-success ms-2" @click="exporterImpotsPDF">Exporter PDF</button>
          </div>
        </div>
        <div class="card-body">
          <!-- Totaux par organisme -->
          <div class="row mb-3">
            <div class="col-md-3">
              <div class="card text-white bg-primary">
                <div class="card-body"><h6>Total CNSS</h6><h4>{{ formatMontant(totauxImpots?.cnssTotale || 0) }} CDF</h4></div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card text-white bg-success">
                <div class="card-body"><h6>Total IPR</h6><h4>{{ formatMontant(totauxImpots?.ipr || 0) }} CDF</h4></div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card text-white bg-warning">
                <div class="card-body"><h6>Total INPP</h6><h4>{{ formatMontant(totauxImpots?.inpp || 0) }} CDF</h4></div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card text-white bg-danger">
                <div class="card-body"><h6>Total ONEM</h6><h4>{{ formatMontant(totauxImpots?.onem || 0) }} CDF</h4></div>
              </div>
            </div>
          </div>

          <table class="table table-bordered table-sm">
            <thead>
                <tr>
                    <th>Nom</th>
                    <th>Salaire net</th>
                    <th>Salaire brut</th>
                    <th>Brut imposable</th>
                    <th>CNSS trav.</th>
                    <th>CNSS entr.</th>
                    <th>ONEM</th>
                    <th>INPP</th>
                    <th>IPR</th>
                    <th>Total charges</th>
                    <th>Coût total</th>
                </tr>
            </thead>
            <tbody>
              <tr v-for="ligne in lignesImpots" :key="ligne.travailleur_id">
                <td>{{ ligne.nom }}</td>
                <td class="text-end">{{ formatMontant(ligne.salaireNetTotal) }}</td>
                <td class="text-end">{{ formatMontant(ligne.salaireBrut) }}</td>
                <td class="text-end">{{ formatMontant(ligne.brutImposable) }}</td>
                <td class="text-end">{{ formatMontant(ligne.cnssSal) }}</td>
                <td class="text-end">{{ formatMontant(ligne.cnssPat) }}</td>
                <td class="text-end">{{ formatMontant(ligne.onem) }}</td>
                <td class="text-end">{{ formatMontant(ligne.inpp) }}</td>
                <td class="text-end">{{ formatMontant(ligne.ipr) }}</td>
                <td class="text-end">{{ formatMontant(ligne.totalCharges) }}</td>
                <td class="text-end fw-bold">{{ formatMontant(ligne.coutTotalEmployeur) }}</td>
              </tr>
            </tbody>
            <tfoot>
            <tr v-if="totauxImpots" class="table-secondary">
                <th>Totaux</th>
                <th class="text-end">{{ formatMontant(totauxImpots.salaireNetTotal) }}</th>
                <th class="text-end">{{ formatMontant(totauxImpots.salaireBrut) }}</th>
                <th class="text-end">{{ formatMontant(totauxImpots.brutImposable) }}</th>
                <th class="text-end">{{ formatMontant(totauxImpots.cnssSal) }}</th>
                <th class="text-end">{{ formatMontant(totauxImpots.cnssPat) }}</th>
                <th class="text-end">{{ formatMontant(totauxImpots.onem) }}</th>
                <th class="text-end">{{ formatMontant(totauxImpots.inpp) }}</th>
                <th class="text-end">{{ formatMontant(totauxImpots.ipr) }}</th>
                <th class="text-end">{{ formatMontant(totauxImpots.totalCharges) }}</th>
                <th class="text-end">{{ formatMontant(totauxImpots.coutTotal) }}</th>
            </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <!-- ==================== ONGLET HISTORIQUE ==================== -->
    <div v-show="onglet === 'historique'" class="mt-3">
      <div class="card">
        <div class="card-header">
          <ul class="nav nav-tabs card-header-tabs">
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOngletHisto === 'travailleur' }" href="#" @click.prevent="sousOngletHisto = 'travailleur'">Par travailleur</a></li>
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOngletHisto === 'annee' }" href="#" @click.prevent="sousOngletHisto = 'annee'">Par année</a></li>
          </ul>
        </div>
        <div class="card-body">
          <div v-if="sousOngletHisto === 'travailleur'">
            <select class="form-select w-25 mb-3" v-model="histoTravailleurId" @change="chargerHistoriqueTravailleur">
              <option v-for="t in travailleurs" :key="t.id" :value="t.id">{{ t.nom }} {{ t.prenom }}</option>
            </select>
            <h6>Modifications (poste, département, salaire)</h6>
            <table class="table table-sm">
              <thead><tr><th>Date</th><th>Champ</th><th>Ancienne valeur</th><th>Nouvelle valeur</th></tr></thead>
              <tbody>
                <tr v-for="h in historiqueTravailleur" :key="h.id">
                  <td>{{ formatDate(h.date_modification) }}</td>
                  <td>{{ h.champ === 'poste_travail_id' ? 'Poste' : h.champ === 'departement' ? 'Département' : 'Salaire net' }}</td>
                  <td>{{ h.ancien_valeur }}</td>
                  <td>{{ h.nouvelle_valeur }}</td>
                </tr>
              </tbody>
            </table>
            <h6 class="mt-3">Absences et vacances par année</h6>
            <table class="table table-sm">
              <thead><tr><th>Année</th><th>Jours vacances</th><th>Jours suspension</th></tr></thead>
              <tbody>
                <tr v-for="item in historiqueAbsences" :key="item.annee">
                  <td>{{ item.annee }}</td>
                  <td>{{ item.vacances }}</td>
                  <td>{{ item.suspensions }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else>
            <select class="form-select w-25 mb-3" v-model="histoAnnee" @change="chargerHistoriqueAnnee">
              <option v-for="a in anneesDisponibles" :key="a" :value="a">{{ a }}</option>
            </select>
            <table class="table table-sm">
              <thead><tr><th>Travailleur</th><th>Vacances (j)</th><th>Suspensions (j)</th></tr></thead>
              <tbody>
                <tr v-for="item in historiqueAnnee" :key="item.travailleur_id">
                  <td>{{ item.nom }}</td>
                  <td>{{ item.vacances }}</td>
                  <td>{{ item.suspensions }}</td>
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
import { hasPermission } from '../utils/permissions';
import apiService from '../services/api';
import { trouverBrutDepuisNetImposable, calculerTout } from '../services/calculCharges';
import { enregistrerChangements } from '../services/historiqueService';

export default {
  name: 'Travailleurs',
  data() {
    return {
      onglet: 'liste',
      anneeSelectionnee: new Date().getFullYear(),
      anneesDisponibles: [2025, 2026, 2027, 2028, 2029, 2030],
      travailleurs: [],
      postesTravail: [],
      paramsConges: { joursVacancesAnnuels: 26, joursOuvrablesMois: 26, plafondAvanceMois: 80 },
      showTravailleurModal: false,
      editionTravailleur: { soumis_ipr: true, soumis_cnss: true, nb_personnes_charge: 0 },
      departements: [],
      // Présence
      moisPresence: '',
      presenceTableau: [],
      // Avances
      avancesEnCours: [],
      showEcheancierModal: false,
      echeancier: [],
      avanceActive: null,
      montantAvanceEncours: 0,
      totalEcheancier: 0,
      // Primes
      primeForm: { mode: 'individuel', travailleur_id: null, moisStr: '', valeur: 0, libelle: '', beneficiaires: [] },
      primes: [],
      // Décompte
      moisDecompte: '',
      decompte: [],
      // Fiche de paie
      ficheTravailleurId: null,
      ficheMois: '',
      fichePaieHtml: '',
      // Impôts
      moisImpots: '',
      filtreNomImpots: '',
      lignesImpots: [],
      totauxImpots: null,
      paramsCharges: null,
      // Historique
      sousOngletHisto: 'travailleur',
      histoTravailleurId: null,
      histoAnnee: new Date().getFullYear(),
      historiqueTravailleur: [],
      historiqueAbsences: [],
      historiqueAnnee: [],
      // Détails
      showDetailsModal: false,
      detailsTravailleur: {},
      showSelectionModal: false,
      selectedTravailleurs: [],
      coordonneesEntreprise: { nom: '', adresse: '', telephone: '', email: '', logo: '' },
    };
  },
  computed: {
    travailleursActifs() { return this.travailleurs.filter(t => t.actif); },
    moisDisponibles() {
        const options = [];
        const aujourdhui = new Date();
        for (let i = -6; i <= 6; i++) {
            const date = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() + i, 1);
            const valeur = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
            const libelle = date.toLocaleDateString('fr-FR', { month: 'long', year: '2-digit' });
            options.push({ valeur, libelle });
        }
        return options;
    },
    moisDisponiblesPresence() {
        const options = [];
        const aujourdhui = new Date();
        for (let i = -6; i <= 0; i++) {
        const date = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() + i, 1);
        const valeur = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
        const libelle = date.toLocaleDateString('fr-FR', { month: 'long', year: '2-digit' });
        options.push({ valeur, libelle });
        }
        return options;
    },
 
  },

  watch: {
    onglet(newVal) {
      if (newVal === 'decompte') this.chargerDecompte();
      if (newVal === 'presence') this.chargerPresenceTableau();
      if (newVal === 'avances') this.chargerAvances();        // à créer
      if (newVal === 'primes') this.chargerPrimes();           // à créer
      if (newVal === 'impots') this.chargerImpotsCharges();
      if (newVal === 'historique') {
        this.chargerHistoriqueTravailleur();
        this.chargerHistoriqueAnnee();
      }
      if (newVal === 'fiche') this.genererFichePaie();
    },
    ficheTravailleurId: {
      handler() { this.genererFichePaie(); },
      immediate: true
    },
    ficheMois: {
      handler() { this.genererFichePaie(); },
      immediate: true
    },
    moisImpots: {
      handler(val) { if (val) this.chargerImpotsCharges(); },
      immediate: true
    },
    moisPresence: {
      handler(val) { if (val) this.chargerPresenceTableau(); },
      immediate: true
    },
    moisDecompte: {
      handler(val) { if (val) this.chargerDecompte(); },
      immediate: true
    },
  },


  async mounted() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!await hasPermission(user, 'travailleurs', 'lecture')) return this.$router.push('/');
    await this.chargerDonnees();
    await this.chargerParamsCharges();
    this.chargerPresenceTableau();
    this.chargerHistoriqueTravailleur();
    this.chargerHistoriqueAnnee();
    const mc = this.getMoisLocal();
    if (this.onglet === 'impots') this.chargerImpotsCharges();
    this.moisPresence = mc;
    this.moisDecompte = mc;
    this.moisImpots = mc;
    this.ficheMois = mc;
    this.primeForm.moisStr = mc;
  },
  methods: {
    arrondirCentaineInferieure(montant) { return Math.floor(montant / 100) * 100; },
    formatMontant(montant, devise) {
      if (montant === undefined || montant === null) return '0';
      if (devise === 'CDF') {
        return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(montant)).replace(/\s/g, "'");
      } else {
        return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(montant).replace(/\s/g, "'");
      }
    },
    
    formatInputNumberLive(event, devise) {
        let value = event.target.value;
        value = value.replace(/[^\d.,]/g, '');
        value = value.replace(/,/g, '.');
        const parts = value.split('.');
        if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
        event.target.value = value;
    },
    getMoisLocal() {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
    },
    formatInputNumberBlur(event, devise) {
        let value = event.target.value;
        if (value === '') value = '0';
        let number = parseFloat(value);
        if (isNaN(number)) number = 0;
        event.target.value = this.formatMontant(number, devise);
    },
    formatDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR') : ''; },
    formatMoisAnnee(m) { 
        if (!m) return '';
        const [a, mo] = m.split('-'); 
        return new Date(a, mo-1).toLocaleDateString('fr-FR', { month: 'long', year: '2-digit' }); 
    },
    getNomPosteTravail(id) { return this.postesTravail.find(pt => pt === id) || ''; },
    getNomTravailleur(id) { const t = this.travailleurs.find(t => t.id === id); return t ? `${t.nom} ${t.prenom}` : ''; },
    getJoursVacancesRestants(t) {
      const priseAnnee = this.anneeSelectionnee;
      const debut = t.date_debut ? new Date(t.date_debut) : null;
      let droit = this.paramsConges.joursVacancesAnnuels;
      if (debut && debut.getFullYear() === priseAnnee) {
        const moisRestants = 12 - debut.getMonth();
        droit = Math.round(droit * moisRestants / 12);
      }
      // Cumul des jours pris dans l'année sélectionnée
      const pris = this.presenceTableau.filter(p => p.travailleur_id === t.id && p.annee === priseAnnee)
        .reduce((sum, p) => sum + (p.jours_vacances || 0), 0);
      return Math.max(0, droit - pris);
    },
    async chargerAvances() {
      this.avancesEnCours = await db.avances.where('statut').equals('en_cours').toArray();
    },
    async chargerPrimes() {
      this.primes = await db.primes.toArray();
    },
    async chargerDonnees() {
      this.travailleurs = await db.travailleurs.toArray();
      const pt = await db.reglages.where('cle').equals('postes_travail').first();
      this.postesTravail = pt ? pt.valeur : [];
      const pc = await db.reglages.where('cle').equals('params_conges').first();
      if (pc) this.paramsConges = pc.valeur;
      const deps = await db.reglages.where('cle').equals('departements').first();
      this.departements = deps ? deps.valeur : [];
      this.avancesEnCours = await db.avances.where('statut').equals('en_cours').toArray();
      this.primes = await db.primes.toArray();
      const coord = await db.reglages.where('cle').equals('coordonnees').first();
      this.coordonneesEntreprise = coord ? coord.valeur : { nom: '', adresse: '', telephone: '', email: '', logo: '' };
    },
    async chargerParamsCharges() {
      const reg = await db.reglages.where('cle').equals('parametres_charges_sociales').first();
      this.paramsCharges = reg ? reg.valeur : this.getDefaultParamsCharges();
    },
    getDefaultParamsCharges() {
      return {
        taux: { cnss_salarial: 0.05, cnss_patronal: 0.13, inpp: 0.02, onem: 0.005 },
        indemnites_fixes: { transport: 50000, logement: 50000 },
        bareme_ipr_annuel: [
          { plafond: 1944000, taux: 0.03 },
          { plafond: 21600000, taux: 0.15 },
          { plafond: 43200000, taux: 0.30 },
          { plafond: null, taux: 0.40 }
        ]
      };
    },
    // Liste
    nouveauTravailleur() {
      this.editionTravailleur = {
        id: null, nom: '', postnom: '', prenom: '', date_naissance: '', date_debut: '',
        departement: this.departements[0] || '', poste_travail_id: this.postesTravail[0] || '',
        salaire_net_total: 0, nb_personnes_charge: 0, soumis_ipr: true, soumis_cnss: true, actif: true
      };
      this.showTravailleurModal = true;
    },
    editerTravailleur(t) { this.editionTravailleur = { ...t }; this.showTravailleurModal = true; },
    voirDetailsTravailleur(t) { this.detailsTravailleur = t; this.showDetailsModal = true; },
    async sauvegarderActifTravailleur(t) { await db.travailleurs.update(t.id, { actif: t.actif }); },
    async sauvegarderTravailleur() {
      if (!this.editionTravailleur.nom || !this.editionTravailleur.prenom) return alert("Nom et prénom obligatoires");
      await this.chargerParamsCharges();
      let brut = 0;
      if (this.editionTravailleur.salaire_net_total) {
        const netImposableCible = this.editionTravailleur.salaire_net_total - this.paramsCharges.indemnites_fixes.transport - this.paramsCharges.indemnites_fixes.logement;
        brut = trouverBrutDepuisNetImposable(netImposableCible, this.paramsCharges, this.editionTravailleur.nb_personnes_charge || 0);
      }
      const data = {
        ...this.editionTravailleur,
        salaire_brut_calcule: brut,
        salaire_actuel: this.editionTravailleur.salaire_net_total, // pour compatibilité
        devise_salaire: 'CDF'
      };
      const ancien = data.id ? await db.travailleurs.get(data.id) : null;
      if (ancien) {
        await enregistrerChangements(data.id, ancien, data);
        await db.travailleurs.update(data.id, data);
      } else {
        data.id = crypto.randomUUID();
        await apiService.ajouter('travailleurs', data);
      }
      this.showTravailleurModal = false;
      await this.chargerDonnees();
    },
    async supprimerTravailleur(id) {
      if (confirm('Supprimer ce travailleur ?')) {
        await apiService.supprimer('travailleurs', id);
        await this.chargerDonnees();
      }
    },
    // Présence
    async chargerPresenceTableau() {
      const [annee, mois] = this.moisPresence.split('-').map(Number);
      const lignes = [];
      for (let t of this.travailleursActifs) {
        let presence = await db.presence_suspension.where({ travailleur_id: t.id, annee, mois }).first();
        if (!presence) presence = { travailleur_id: t.id, annee, mois, jours_vacances: 0, jours_suspension: 0, motif: '' };
        lignes.push({ ...presence, nom: `${t.nom} ${t.prenom}` });
      }
      this.presenceTableau = lignes;
    },
    async sauvegarderPresenceTableau() {
      for (let ligne of this.presenceTableau) {
        const { travailleur_id, annee, mois, jours_vacances, jours_suspension, motif } = ligne;
        const existant = await db.presence_suspension.where({ travailleur_id, annee, mois }).first();
        if (existant) {
          await db.presence_suspension.update(existant.id, { jours_vacances, jours_suspension, motif });
        } else {
          await db.presence_suspension.add({ id: crypto.randomUUID(), travailleur_id, annee, mois, jours_vacances, jours_suspension, motif });
        }
      }
      alert('Présences enregistrées');
      this.chargerPresenceTableau();
    },
    // Avances
    ouvrirEcheancierAvance(av) {
        this.avanceActive = av;
        this.montantAvanceEncours = av.montant;
        const now = new Date();
        const moisList = [];
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
            moisList.push(d.toISOString().slice(0,7));
        }
        db.remboursements_avances.where('avance_id').equals(av.id).toArray().then(ech => {
            const mapEch = {};
            ech.forEach(e => { mapEch[e.mois_remboursement] = e.montant_rembourse; });
            this.echeancier = moisList.map(mois => ({
            mois,
            montant: this.formatMontant(mapEch[mois] || 0, 'CDF')
            }));
            this.calculerTotalEcheancier();
            this.showEcheancierModal = true;
        });
    },
    calculerTotalEcheancier() {
      this.totalEcheancier = this.echeancier.reduce((sum, e) => sum + this.parseMontant(e.montant), 0);
    },
    parseMontant(val) { return val ? parseFloat(val.toString().replace(/'/g, '').replace(/,/g, '.')) : 0; },
    async sauvegarderEcheancier() {
        const total = this.totalEcheancier;
        const attendu = this.montantAvanceEncours;
        if (Math.abs(total - attendu) > 0.01) {
            alert(`Le total de l'échéancier (${this.formatMontant(total, 'CDF')}) ne correspond pas au montant de l'avance (${this.formatMontant(attendu, 'CDF')}).`);
            return;
        }
        const avanceId = this.avanceActive.id;
        await db.remboursements_avances.where('avance_id').equals(avanceId).delete();
        for (let e of this.echeancier) {
            const montant = this.parseMontant(e.montant);
            if (montant > 0) {
            await db.remboursements_avances.add({
                id: crypto.randomUUID(),
                avance_id: avanceId,
                mois_remboursement: e.mois,
                montant_rembourse: montant
            });
            }
        }
        alert('Échéancier mis à jour');
        this.showEcheancierModal = false;
    },
    // Primes
    async attribuerPrimes() {
      const [annee, mois] = this.primeForm.moisStr.split('-').map(Number);
      const baseMontant = this.primeForm.valeur;
      let beneficiaires = [];
      if (this.primeForm.mode === 'individuel') {
        if (!this.primeForm.travailleur_id) return alert('Sélectionnez un travailleur');
        beneficiaires = [this.primeForm.travailleur_id];
      } else {
        beneficiaires = this.primeForm.beneficiaires;
        if (!beneficiaires.length) return alert('Sélectionnez au moins un bénéficiaire');
      }
      for (let tid of beneficiaires) {
        const t = this.travailleurs.find(tr => tr.id === tid);
        let montant = baseMontant;
        if (this.primeForm.mode === 'collectif_pourcent') {
          montant = (t.salaire_net_total || 0) * baseMontant / 100;
        }
        await db.primes.add({ id: crypto.randomUUID(), travailleur_id: tid, annee, mois, montant, libelle: this.primeForm.libelle, payee: false });
      }
      await this.chargerDonnees();
      alert('Primes attribuées');
    },
    async supprimerPrime(id) {
        if (confirm('Supprimer cette prime ?')) {
            await db.primes.delete(id);
            await this.chargerDonnees();
        }
    },
    // Décompte
    async chargerDecompte() {
        const [annee, mois] = this.moisDecompte.split('-').map(Number);
        const res = [];
        for (let t of this.travailleursActifs) {
            const salaireNet = t.salaire_net_total || 0;
            // Avances
            const avances = (await db.avances.where({ travailleur_id: t.id, mois_concerne: this.moisDecompte }).toArray())
            .reduce((s, a) => s + a.montant, 0);
            // Remboursements (uniquement ceux liés à ce travailleur via son avance)
            const remb = (await db.remboursements_avances.where('mois_remboursement').equals(this.moisDecompte).toArray())
            .filter(r => {
                const av = this.avancesEnCours.find(a => a.id === r.avance_id);
                return av && av.travailleur_id === t.id;
            })
            .reduce((s, r) => s + r.montant_rembourse, 0);
            // Suspensions
            const pres = await db.presence_suspension.where({ travailleur_id: t.id, annee, mois }).first();
            const js = pres ? pres.jours_suspension : 0;
            const salaireJournalier = salaireNet / this.paramsConges.joursOuvrablesMois;
            const montantSusp = this.arrondirCentaineInferieure(salaireJournalier * js);
            // Primes
            const primes = (await db.primes.where({ travailleur_id: t.id, annee, mois }).toArray())
            .reduce((s, p) => s + p.montant, 0);
            // Net à payer = salaire net – suspension – avances – remboursements + primes
            const net = salaireNet - montantSusp - avances - remb + primes;
            res.push({
            travailleur_id: t.id,
            nom: `${t.nom} ${t.prenom}`,
            salaire_brut: t.salaire_brut_calcule || 0, // pour info uniquement
            salaire_net: salaireNet,
            avances,
            remboursements: remb,
            jours_suspension: js,
            montant_suspension: montantSusp,
            primes,
            net
            });
        }
        this.decompte = res;
        },
    exporterDecomptePDF() {
        const mois = this.formatMoisAnnee(this.moisDecompte);
        let html = `<html><head><title>Décompte ${mois}</title></head><body>
            <h2>Décompte mensuel - ${mois}</h2>
            <table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse; width:100%; text-align:right;">
            <thead><tr><th>Travailleur</th><th>Salaire brut</th><th>Avances</th><th>Remb.</th><th>Suspensions</th><th>Primes</th><th>Net</th></tr></thead><tbody>`;
        for (let d of this.decompte) {
            html += `<tr>
            <td>${d.nom}</td>
            <td>${this.formatMontant(d.salaire_brut,'CDF')}</td>
            <td>${this.formatMontant(d.avances,'CDF')}</td>
            <td>${this.formatMontant(d.remboursements,'CDF')}</td>
            <td>${this.formatMontant(d.montant_suspension,'CDF')} (${d.jours_suspension} j)</td>
            <td>${this.formatMontant(d.primes,'CDF')}</td>
            <td>${this.formatMontant(d.net,'CDF')}</td>
            </tr>`;
        }
        html += `</tbody></table></body></html>`;
        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        win.print();
    },
    // Fiche de paie
    genererFichePaie() {
      if (!this.ficheTravailleurId || !this.ficheMois) {
        this.fichePaieHtml = '';
        return;
      }
      this.fichePaieHtml = this.getFichePaieHTML(this.ficheTravailleurId, this.ficheMois);
    },
    getFichePaieHTML(travailleurId, moisStr) {
      const t = this.travailleurs.find(tr => tr.id === travailleurId);
      if (!t) return '';
      const ligne = this.decompte.find(d => d.travailleur_id === travailleurId);
      if (!ligne) return '';

      const indemnites = this.paramsCharges.indemnites_fixes.transport + this.paramsCharges.indemnites_fixes.logement;
      const primesMois = ligne.primes || 0;
      const suspension = ligne.montant_suspension || 0;
      const joursSuspension = ligne.jours_suspension || 0;
      const joursTravailles = this.paramsConges.joursOuvrablesMois - joursSuspension;

      // Net de base (salaire net – suspension, sans prime et sans indemnités)
      const salaireNetBase = (t.salaire_net_total || 0) - suspension - indemnites;
      // Net total imposable = salaireNetBase + primes (indemnités déjà retirées)
      const netTotalImposable = salaireNetBase + primesMois;
      // Le net imposable final doit être positif
      const netImposable = Math.max(0, netTotalImposable);

      // Brut total reconstitué à partir du net imposable (qui exclut les indemnités)
      const brutTotal = trouverBrutDepuisNetImposable(netImposable, this.paramsCharges, t.nb_personnes_charge || 0);

      // Brut hors prime (pour affichage)
      const netHorsPrime = Math.max(0, salaireNetBase);
      const brutHorsPrime = netHorsPrime > 0 
        ? trouverBrutDepuisNetImposable(netHorsPrime, this.paramsCharges, t.nb_personnes_charge || 0) 
        : 0;
      const primeBrute = brutTotal - brutHorsPrime;

      // Détails des cotisations sur le brut total
      const details = calculerTout(brutTotal, this.paramsCharges, t.nb_personnes_charge || 0);
      const cnssTheorique = details.cnssSal;
      const iprTheorique = details.ipr;
      const salaireNetTheorique = brutTotal - cnssTheorique - iprTheorique; // net imposable après impôts

      // Net à payer affiché = net imposable après impôts + indemnités - avances + remboursements
      const netAPayerFiche = salaireNetTheorique + indemnites - ligne.avances + (ligne.remboursements || 0);

      // Prime nette : différence entre le net avec prime et sans prime
      let primeNette = 0;
      if (primesMois > 0) {
        const detailsHorsPrime = calculerTout(brutHorsPrime, this.paramsCharges, t.nb_personnes_charge || 0);
        const netHorsPrimeTheorique = brutHorsPrime - detailsHorsPrime.cnssSal - detailsHorsPrime.ipr;
        primeNette = salaireNetTheorique - netHorsPrimeTheorique;
      }

      const cnssAffiche = t.soumis_cnss ? this.formatMontant(cnssTheorique, 'CDF') : '-';
      const iprAffiche = t.soumis_ipr ? this.formatMontant(iprTheorique, 'CDF') : '-';

      const entreprise = this.coordonneesEntreprise || { nom: '', adresse: '', telephone: '', email: '', logo: '' };
      const logoHtml = entreprise.logo ? `<img src="${entreprise.logo}" style="max-width:150px; height:auto;"/>` : '';

      return `
        <div style="font-family: Arial; padding:20px;">
          <table width="100%" style="margin-bottom:20px;">
            <tr>
              <td width="70%">
                <strong>${entreprise.nom || 'Entreprise'}</strong><br>
                ${entreprise.adresse ? entreprise.adresse + '<br>' : ''}
                ${entreprise.telephone ? 'Tél : ' + entreprise.telephone + '<br>' : ''}
                ${entreprise.email ? 'Email : ' + entreprise.email : ''}
              </td>
              <td width="30%" style="text-align:right;">${logoHtml}</td>
            </tr>
          </table>
          <h3>Fiche de paie - ${t.nom} ${t.prenom}</h3>
          <p>Mois : ${this.formatMoisAnnee(moisStr)} – Jours prestés : ${joursTravailles} / ${this.paramsConges.joursOuvrablesMois}</p>
          <table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse; width:100%;">
            <tr><th>Rubrique</th><th>Montant (CDF)</th></tr>
            <tr><td>Salaire brut de base (${joursTravailles} j × ${this.formatMontant(brutHorsPrime / joursTravailles, 'CDF')})</td><td>${this.formatMontant(brutHorsPrime, 'CDF')}</td></tr>
            <tr><td>Prime brute</td><td>${this.formatMontant(primeBrute, 'CDF')}</td></tr>
            <tr><td>Salaire total brut</td><td>${this.formatMontant(brutTotal, 'CDF')}</td></tr>
            <tr><td>CNSS (5%)</td><td>${cnssAffiche}</td></tr>
            <tr><td>Salaire imposable</td><td>${this.formatMontant(brutTotal - cnssTheorique, 'CDF')}</td></tr>
            <tr><td>IPR</td><td>${iprAffiche}</td></tr>
            <tr><td>Salaire net imposable${primesMois > 0 ? ' (dont prime nette ' + this.formatMontant(primeNette, 'CDF') + ' CDF)' : ''}</td><td>${this.formatMontant(salaireNetTheorique, 'CDF')}</td></tr>
            <tr><td>Indemnités (transport, logement)</td><td>${this.formatMontant(indemnites, 'CDF')}</td></tr>
            <tr><td>Total net avant retenues sur salaire</td><td>${this.formatMontant(salaireNetTheorique + indemnites, 'CDF')}</td></tr>
            <tr><td>Avances</td><td>${this.formatMontant(ligne.avances, 'CDF')}</td></tr>
            <tr><td>Remboursements</td><td>${this.formatMontant(ligne.remboursements, 'CDF')}</td></tr>
            <tr><th>Net à payer</th><th>${this.formatMontant(netAPayerFiche, 'CDF')}</th></tr>
          </table>
          <br/>
          <p>Signature du travailleur : ________________________</p>
        </div>`;
    },
    ouvrirSelectionModal() {
        this.selectedTravailleurs = [];
        this.showSelectionModal = true;
    },
    async exporterFichesSelection() {
        if (!this.selectedTravailleurs.length) return alert('Sélectionnez au moins un travailleur');
        let html = '<html><head><title>Fiches de paie</title></head><body>';
        for (let tid of this.selectedTravailleurs) {
            const ficheHTML = this.getFichePaieHTML(tid, this.ficheMois);
            html += `<div style="page-break-after:always;">${ficheHTML}</div>`;
        }
        html += '</body></html>';
        this.showSelectionModal = false;
        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        win.print();
    },
    exporterFichePDF() {
        if (!this.fichePaieHtml) return alert('Générez d’abord la fiche');
        const win = window.open('', '_blank');
        win.document.write(this.fichePaieHtml);
        win.document.close();
        win.print();
    },
    
    // Impôts
    async chargerImpotsCharges() {
        await this.chargerParamsCharges();
        let travailleursFiltres = this.travailleursActifs;
        if (this.filtreNomImpots) {
            travailleursFiltres = travailleursFiltres.filter(t => t.id === this.filtreNomImpots);
        }
        const lignes = [];
        const [annee, mois] = this.moisImpots.split('-').map(Number);
        for (let t of travailleursFiltres) {
            // Primes du mois
            const primes = (await db.primes.where({ travailleur_id: t.id, annee, mois }).toArray())
            .reduce((s, p) => s + p.montant, 0);
            // Suspensions du mois
            const pres = await db.presence_suspension.where({ travailleur_id: t.id, annee, mois }).first();
            const js = pres ? pres.jours_suspension : 0;
            const salaireJournalier = (t.salaire_net_total || 0) / this.paramsConges.joursOuvrablesMois;
            const montantSusp = this.arrondirCentaineInferieure(salaireJournalier * js);
            
            // Base nette imposable = salaire net + primes - suspension
            const netBase = (t.salaire_net_total || 0) + primes - montantSusp;
            const netImposableCible = netBase - this.paramsCharges.indemnites_fixes.transport - this.paramsCharges.indemnites_fixes.logement;
            const brut = trouverBrutDepuisNetImposable(netImposableCible, this.paramsCharges, t.nb_personnes_charge || 0);
            const details = calculerTout(brut, this.paramsCharges, t.nb_personnes_charge || 0);

            // Sauvegarde théorique CNSS avant exonération
            const cnssSalTheorique = details.cnssSal;
            const brutImposable = details.salaireBrut - cnssSalTheorique;

            // Appliquer exonérations
            if (!t.soumis_ipr) details.ipr = 0;
            if (!t.soumis_cnss) {
            details.cnssSal = 0;
            details.cnssPat = 0;
            }

            const totalCharges = details.cnssSal + details.cnssPat + details.inpp + details.onem + details.ipr;
            const coutTotal = details.netTotal + totalCharges;

            lignes.push({
            travailleur_id: t.id,
            nom: `${t.nom} ${t.prenom}`,
            salaireNetTotal: netBase,
            salaireBrut: details.salaireBrut,
            brutImposable,
            cnssSal: details.cnssSal,
            cnssPat: details.cnssPat,
            onem: details.onem,
            inpp: details.inpp,
            ipr: details.ipr,
            totalCharges,
            coutTotalEmployeur: coutTotal
            });
        }
        this.lignesImpots = lignes;
        this.calculerTotauxImpots();
    },
    calculerTotauxImpots() {
        const tot = {
            salaireNetTotal: 0,
            salaireBrut: 0,
            brutImposable: 0,
            cnssSal: 0,
            cnssPat: 0,
            onem: 0,
            inpp: 0,
            ipr: 0,
            totalCharges: 0,
            coutTotal: 0,
            cnssTotale: 0
        };
        this.lignesImpots.forEach(l => {
            tot.salaireNetTotal += l.salaireNetTotal;
            tot.salaireBrut += l.salaireBrut;
            tot.brutImposable += l.brutImposable;
            tot.cnssSal += l.cnssSal;
            tot.cnssPat += l.cnssPat;
            tot.onem += l.onem;
            tot.inpp += l.inpp;
            tot.ipr += l.ipr;
            tot.totalCharges += l.totalCharges;
            tot.coutTotal += l.coutTotal;
        });
        tot.cnssTotale = tot.cnssSal + tot.cnssPat;
        this.totauxImpots = tot;
    },
    exporterImpotsPDF() {
        const mois = this.moisImpots;
        let html = `<html><head><title>Impôts et charges ${mois}</title></head><body>
            <h2>Impôts et charges sociales - ${mois}</h2>
            <table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse; width:100%; text-align:right;">
            <thead><tr><th>Nom</th><th>Brut</th><th>CNSS trav.</th><th>CNSS entr.</th><th>ONEM</th><th>INPP</th><th>IPR</th><th>Total charges</th><th>Coût total</th></tr></thead><tbody>`;
        for (let l of this.lignesImpots) {
            html += `<tr>
            <td>${l.nom}</td>
            <td>${this.formatMontant(l.salaireBrut,'CDF')}</td>
            <td>${this.formatMontant(l.cnssSal,'CDF')}</td>
            <td>${this.formatMontant(l.cnssPat,'CDF')}</td>
            <td>${this.formatMontant(l.onem,'CDF')}</td>
            <td>${this.formatMontant(l.inpp,'CDF')}</td>
            <td>${this.formatMontant(l.ipr,'CDF')}</td>
            <td>${this.formatMontant(l.totalCharges,'CDF')}</td>
            <td>${this.formatMontant(l.coutTotalEmployeur,'CDF')}</td>
            </tr>`;
        }
        html += `</tbody></table></body></html>`;
        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        win.print();
        },
    // Historique
    async chargerHistoriqueTravailleur() {
      if (!this.histoTravailleurId) this.histoTravailleurId = this.travailleursActifs[0]?.id;
      if (!this.histoTravailleurId) return;
      this.historiqueTravailleur = await db.travailleurs_historique.where('travailleur_id').equals(this.histoTravailleurId).toArray();
      const absences = await db.presence_suspension.where('travailleur_id').equals(this.histoTravailleurId).toArray();
      const parAnnee = {};
      absences.forEach(a => { if (!parAnnee[a.annee]) parAnnee[a.annee] = { vacances:0, suspensions:0 }; parAnnee[a.annee].vacances += a.jours_vacances; parAnnee[a.annee].suspensions += a.jours_suspension; });
      this.historiqueAbsences = Object.entries(parAnnee).map(([annee, vals]) => ({ annee, ...vals }));
    },
    async chargerHistoriqueAnnee() {
      const absences = await db.presence_suspension.where('annee').equals(this.histoAnnee).toArray();
      const map = {};
      for (let a of absences) {
        if (!map[a.travailleur_id]) map[a.travailleur_id] = { vacances:0, suspensions:0 };
        map[a.travailleur_id].vacances += a.jours_vacances;
        map[a.travailleur_id].suspensions += a.jours_suspension;
      }
      this.historiqueAnnee = Object.entries(map).map(([tid, vals]) => {
        const t = this.travailleurs.find(tr => tr.id === tid);
        return { travailleur_id: tid, nom: t ? `${t.nom} ${t.prenom}` : tid, ...vals };
      });
    },
    changerAnnee() { this.chargerPresenceTableau(); },
    async nouvelleAnnee() {
      if (!confirm(`Archiver l'année ${this.anneeSelectionnee} et passer à ${this.anneeSelectionnee+1} ?`)) return;
      const archive = { id: crypto.randomUUID(), annee: this.anneeSelectionnee, date: new Date().toISOString(),
        presence: await db.presence_suspension.where('annee').equals(this.anneeSelectionnee).toArray(),
        avances: await db.avances.where('type').equals('annee').filter(a => a.statut !== 'termine').toArray(),
        primes: await db.primes.where('annee').equals(this.anneeSelectionnee).toArray()
      };
      await db.archive_annee.add(archive);
      await db.presence_suspension.where('annee').equals(this.anneeSelectionnee).delete();
      await db.primes.where('annee').equals(this.anneeSelectionnee).delete();
      this.anneeSelectionnee += 1;
      await this.chargerDonnees();
      alert(`Nouvelle année ${this.anneeSelectionnee} activée.`);
    },
  }
};
</script>