<template>
  <div class="container-fluid">
    <h2 class="mb-4" style="color: #ED1C24;">Gestion des caisses</h2>

    <!-- === Gestion des alertes d'accès aux caisses === -->
    <div v-if="chargementEnCours" class="alert alert-info">
      <i class="bi bi-hourglass-split"></i> Chargement des données...
    </div>
    <div v-else-if="caisses.length === 0" class="alert alert-warning">
      <i class="bi bi-exclamation-triangle"></i> Aucune caisse n'a encore été créée.
      <button v-if="peutAccederReglages" class="btn btn-primary ms-3" @click="allerAuxReglagesCaisses">
        ➕ Créer une caisse
      </button>
      <span v-else> Veuillez contacter un administrateur.</span>
    </div>
    <div v-else-if="caissesAccessibles.length === 0" class="alert alert-warning">
      <i class="bi bi-exclamation-triangle"></i> Vous n'avez accès à aucune caisse.
      <span v-if="peutAccederReglages"> Vérifiez les associations dans les réglages.</span>
      <span v-else> Veuillez contacter un administrateur.</span>
    </div>

    <!-- Sélecteurs -->
    <div class="card mb-4" v-else>
      <div class="card-header">
        <i class="bi bi-wallet2"></i> Navigation
      </div>
      <div class="card-body">
        <!-- Ligne 1 : Sélecteurs + Clôtures -->
        <div class="row align-items-end">
          <div class="col-md-3">
            <label>Caisse principale</label>
            <select class="form-select" v-model="caisseActiveId" @change="changerCaisse">
              <option v-for="c in caissesAccessibles" :key="c.id" :value="c.id">{{ c.nom }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <label>Sous-caisse</label>
            <select class="form-select" v-model="sousCaisseActiveId" @change="changerSousCaisse">
              <option v-for="sc in sousCaisses" :key="sc.id" :value="sc.id">{{ sc.nom }} ({{ sc.devise }})</option>
            </select>
          </div>
          <div class="col-md-4">
            <label>Semaine</label>
            <div class="input-group">
              <button class="btn btn-outline-secondary" @click="semainePrecedente" :disabled="!semainePrecedenteDisponible">◀</button>
              <select class="form-select" v-model="semaineCouranteId" @change="changerSemaine">
                <option v-for="s in semainesDisponibles" :key="s.id" :value="s.id">
                  {{ formatDateSemaine(s.dateDebut) }}
                  <span v-if="s.estCloturee"> (Clôturée)</span>
                  <span v-else> (En cours)</span>
                </option>
              </select>
              <button class="btn btn-outline-secondary" @click="semaineSuivante" :disabled="!semaineSuivanteDisponible">▶</button>
            </div>
          </div>
          <div class="col-md-2">
            <div class="d-grid gap-2 d-flex">
              <button class="btn btn-secondary flex-fill" @click="clotureJournaliere" :disabled="semaineCourante?.estCloturee || !peutCloturer">
                <i class="bi bi-sun"></i> Clôture jour
              </button>
              <button class="btn btn-danger flex-fill" @click="cloturerSemaine" :disabled="semaineCourante?.estCloturee || !peutCloturer">
                <i class="bi bi-check2-circle"></i> Clôture semaine
              </button>
            </div>
          </div>
        </div>

        <!-- Ligne 2 : Solde actuel + Opérations -->
        <div class="row mt-3 align-items-center" v-if="semaineCourante">
          <div class="col-md-4">
            <div class="card text-white" style="background: linear-gradient(135deg, #11998e, #38ef7d);">
              <div class="card-body text-center py-2">
                <h6 class="mb-0">Solde actuel</h6>
                <p class="mb-0 fs-4">{{ formatMontant(soldeCourant, deviseActive) }} {{ deviseActive }}</p>
              </div>
            </div>
          </div>
          <div class="col-md-8">
            <div class="d-flex gap-2 flex-wrap justify-content-end">
              <button class="btn btn-primary" @click="ouvrirMouvement" :disabled="estSousCaisseCloturee(semaineCouranteId, sousCaisseActiveId)">
                <i class="bi bi-plus-circle"></i> Mouvement
              </button>
              <button class="btn btn-secondary" @click="ouvrirPaiementSalaires" :disabled="semaineCourante.estCloturee">
                <i class="bi bi-person-badge"></i> Paiement salaires
              </button>
              <button class="btn btn-warning" @click="ouvrirTransfert" :disabled="estSousCaisseCloturee(semaineCouranteId, sousCaisseActiveId)">
                <i class="bi bi-arrow-left-right"></i> Transfert
              </button>
              <button v-if="afficherBoutonChange" class="btn btn-info" @click="ouvrirChange" :disabled="estSousCaisseCloturee(semaineCouranteId, sousCaisseActiveId)">
                <i class="bi bi-currency-exchange"></i> Change
              </button>
              <button class="btn btn-outline-danger" @click="ouvrirAnnulationManuelle" :disabled="semaineCourante.estCloturee || !peutEcrire">
                <i class="bi bi-arrow-counterclockwise"></i> Annuler un mouvement
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Onglets -->
    <ul class="nav nav-tabs" v-if="caisseActiveId">
      <li class="nav-item"><a class="nav-link" :class="{ active: onglet === 'mouvements' }" href="#" @click.prevent="onglet = 'mouvements'">Mouvements</a></li>
      <li class="nav-item">
        <a class="nav-link" :class="{ active: onglet === 'a_justifier' }" href="#" @click.prevent="onglet = 'a_justifier'">
          À justifier
          <span v-if="nbAJustifier > 0" class="badge bg-danger ms-2">{{ nbAJustifier }}</span>
        </a>
      </li>
      <li class="nav-item"><a class="nav-link" :class="{ active: onglet === 'historique' }" href="#" @click.prevent="onglet = 'historique'">Historique des clôtures</a></li>
    </ul>

    <!-- Onglet Mouvements -->
    <div v-show="onglet === 'mouvements'" class="mt-3">
      <div class="row">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header bg-success text-white">Entrées</div>
            <div class="card-body p-0">
              <table class="table table-sm mb-0">
                <thead>
                  <tr>
                    <th @click="triEntrees('date')" style="cursor:pointer">Date <i v-if="triMouvementsCol==='date'" :class="triMouvementsOrdre==='asc'?'bi-arrow-up':'bi-arrow-down'"></i></th>
                    <th @click="triMouvements('designation')" style="cursor:pointer">Désignation</th>
                    <th @click="triMouvements('posteBudgetaire')" style="cursor:pointer">Poste</th>
                    <th @click="triMouvements('montant')" style="cursor:pointer">Montant</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="m in mouvementsEntreesTries" :key="m.id">
                    <td class="text-start">{{ formatDate(m.date) }}</td>
                    <td class="text-start">{{ m.designation || '-' }}</td>
                    <td class="text-start">{{ m.posteBudgetaire }}</td>
                    <td class="text-end text-success">{{ formatMontant(m.montant, m.devise) }}</td>
                    <td>
                      <div class="btn-group btn-group-sm">
                        <button v-if="m.status === 'brouillon'" class="btn btn-success" @click="validerMouvement(m.id)" title="Valider"><i class="bi bi-check-lg"></i></button>
                        <button v-if="peutModifierSemaine(m.semaineId) && !['Transfert entre caisses', 'Change'].includes(m.posteBudgetaire) && !postesSysteme.includes(m.posteBudgetaire)" 
                                class="btn btn-warning" @click="corrigerMouvement(m)" title="Corriger">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-danger" @click="supprimerMouvement(m.id)" title="Supprimer" :disabled="postesSysteme.includes(m.posteBudgetaire)">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="mouvementsEntreesTries.length === 0"><td colspan="5" class="text-center">Aucune entrée</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card">
            <div class="card-header bg-danger text-white">Sorties</div>
            <div class="card-body p-0">
              <table class="table table-sm mb-0">
                <thead>
                  <tr>
                    <th @click="triSorties('date')" style="cursor:pointer">Date</th>
                    <th @click="triMouvements('designation')" style="cursor:pointer">Désignation</th>
                    <th @click="triMouvements('posteBudgetaire')" style="cursor:pointer">Poste</th>
                    <th @click="triMouvements('montant')" style="cursor:pointer">Montant</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="m in mouvementsSortiesTries" :key="m.id">
                    <td class="text-start">{{ formatDate(m.date) }}</td>
                    <td class="text-start">{{ m.designation || '-' }}</td>
                    <td class="text-start">{{ m.posteBudgetaire }}</td>
                    <td class="text-end text-danger">{{ formatMontant(m.montant, m.devise) }}</td>
                    <td>
                      <div class="btn-group btn-group-sm">
                        <button v-if="m.status === 'brouillon'" class="btn btn-success" @click="validerMouvement(m.id)" title="Valider"><i class="bi bi-check-lg"></i></button>
                        <button v-if="peutModifierSemaine(m.semaineId) && !['Transfert entre caisses', 'Change'].includes(m.posteBudgetaire) && !postesSysteme.includes(m.posteBudgetaire)" 
                            class="btn btn-warning" @click="corrigerMouvement(m)" title="Corriger">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-danger" @click="supprimerMouvement(m.id)" title="Supprimer" :disabled="postesSysteme.includes(m.posteBudgetaire)">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="mouvementsSortiesTries.length === 0"><td colspan="5" class="text-center">Aucune sortie</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Onglet À justifier -->
    <div v-show="onglet === 'a_justifier'" class="mt-3">
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr><th>Semaine</th><th>Date</th><th>Sous-caisse</th><th>Montant</th><th>Poste</th><th>Justificatif</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr v-for="m in mouvementsAJustifier" :key="m.id">
              <td>{{ formatDate(getSemaineDate(m.semaineId)) }}</td>
              <td>{{ formatDate(m.date) }}</td>
              <td>{{ getSousCaisseNom(m.sousCaisseId) }}</td>
              <td class="text-end text-danger">{{ formatMontant(m.montant, m.devise) }}</td>
              <td>{{ m.posteBudgetaire }}</td>
              <td>{{ m.justificatif || 'Aucun' }}</td>
              <td>
                <button class="btn btn-sm btn-warning me-1" @click="justifierMouvement(m)">Justifier</button>
                <button class="btn btn-sm btn-danger" @click="annulerMouvementAJustifier(m)">Annuler</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Onglet Historique des clôtures -->
    <div v-show="onglet === 'historique'" class="mt-3">
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr><th>Date clôture</th><th>Type</th><th>Solde déclaré</th><th>Écart</th><th>Commentaire</th></tr>
          </thead>
          <tbody>
            <tr v-for="c in historiqueClotures" :key="c.date + c.type">
              <td class="text-start">{{ formatDate(c.date) }}</td>
              <td class="text-start">{{ c.type }}</td>
              <td class="text-end">{{ formatMontant(c.soldeDeclare, c.devise) }} {{ c.devise }}</td>
              <td class="text-end" :class="c.ecart >= 0 ? 'text-success' : 'text-danger'">
                {{ formatMontant(c.ecart, c.devise) }} {{ c.devise }}
              </td>
              <td class="text-start">{{ c.commentaire || '-' }}</td>
            </tr>
            <tr v-if="historiqueClotures.length === 0"><td colspan="5" class="text-center">Aucune clôture enregistrée</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ========== MODALS ========== -->

    <!-- Modal Nouveau mouvement / Modification -->
        <div v-if="showMouvementModal" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ mouvementEdition ? 'Modifier' : 'Nouveau' }} mouvement</h5>
            <button type="button" class="btn-close" @click="closeMouvementModal"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info">
              <strong>Caisse :</strong> {{ getCaisseNom(caisseActiveId) }} &nbsp;|&nbsp;
              <strong>Sous-caisse :</strong> {{ getSousCaisseNom(sousCaisseActiveId) }} ({{ deviseActive }})
            </div>
            <form @submit.prevent="enregistrerMouvement">
              <div class="row">
                <div class="col-md-4 mb-3">
                  <label>Date *</label>
                  <input type="date" class="form-control" v-model="mouvementForm.date" :min="dateMouvementMin" :max="dateMouvementMax" required>
                </div>
                <div class="col-md-4 mb-3">
                  <label>Type *</label>
                  <select class="form-select" v-model="mouvementForm.type" required @change="onTypeChange">
                    <option value="entree">Entrée</option>
                    <option value="sortie">Sortie</option>
                  </select>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label>Désignation *</label>
                  <input type="text" class="form-control" v-model="mouvementForm.designation">
                </div>
                <div class="col-md-4 mb-3">
                  <label>Poste budgétaire *</label>
                  <select class="form-select" v-model="mouvementForm.posteBudgetaire" required>
                    <option v-for="p in postesFiltres" :key="p.id" :value="p.nom">{{ p.nom }}</option>
                  </select>
                </div>
                <div class="col-md-4 mb-3">
                  <label>Montant *</label>
                  <input type="text" class="form-control" v-model="mouvementForm.montant" @input="formatInputNumberLive($event, deviseActive)" @blur="formatInputNumberBlur($event, deviseActive)" required>
                </div>
                <div class="col-md-4 mb-3">
                  <label>Facture (si vente)</label>
                  <select class="form-select" v-model="mouvementForm.factureId" :disabled="!afficherFactures">
                    <option value="">-- Aucune --</option>
                    <option v-for="f in facturesAvecReste" :key="f.id" :value="f.id">
                      {{ f.numero }} - {{ f.resteFormate }} {{ f.devise }} (reste)
                    </option>
                  </select>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label>Justificatif</label>
                  <input type="text" class="form-control" v-model="mouvementForm.justificatif">
                </div>
                <div class="col-md-6 mb-3">
                  <label>Commentaire</label>
                  <input type="text" class="form-control" v-model="mouvementForm.commentaire">
                </div>
              </div>
              <div class="form-check mb-3">
                <input class="form-check-input" type="checkbox" v-model="mouvementForm.estBrouillon">
                <label class="form-check-label">Brouillon (ne met pas à jour le solde)</label>
              </div>
              <div class="form-check mb-3">
                <input class="form-check-input" type="checkbox" v-model="mouvementForm.aJustifier">
                <label class="form-check-label">À justifier (sortie sans justificatif immédiat)</label>
              </div>
              <div v-if="mouvementForm.aJustifier || (mouvementForm.type==='sortie' && !mouvementForm.justificatif)" class="alert alert-warning">
                <i class="bi bi-info-circle"></i> Cette écriture devra être justifiée ultérieurement depuis l'onglet "À justifier".
              </div>

              <!-- Bloc conditionnel affectation stock -->
              <div v-if="mouvementForm.affectationStock">
                <div v-if="mouvementForm.affectationStock === 'carburant'" class="row">
                  <div class="col-md-4 mb-3">
                    <label>Type carburant *</label>
                    <select class="form-select" v-model="mouvementForm.carburant_type_id" required>
                      <option v-for="ct in carburantTypes" :key="ct.id" :value="ct.id">{{ ct.nom }}</option>
                    </select>
                  </div>
                  <div class="col-md-4 mb-3">
                    <label>Site *</label>
                    <select class="form-select" v-model="mouvementForm.site_id" required>
                      <option v-for="s in sites" :key="s.id" :value="s.id">{{ s.nom }}</option>
                    </select>
                  </div>
                  <div class="col-md-4 mb-3">
                    <label>Quantité (L) *</label>
                    <input type="number" step="0.1" class="form-control" v-model.number="mouvementForm.quantite_carburant" required>
                  </div>
                </div>

                <div v-if="mouvementForm.affectationStock === 'emballage'">
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <label>Site de stockage *</label>
                            <select class="form-select" v-model="mouvementForm.site_id" required>
                                <option v-for="s in sites" :key="s.id" :value="s.id">{{ s.nom }}</option>
                            </select>
                        </div>
                    </div>
                    <h6>Articles de fourniture achetés</h6>
                    <div v-for="(ligne, idx) in mouvementForm.fournitureLignes" :key="idx" class="row mb-2">
                        <div class="col-md-5">
                            <select class="form-select" v-model="ligne.article_id" required>
                                <option v-for="art in articlesFourniture" :key="art.id" :value="art.id">{{ art.nom }} ({{ art.unite }})</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <input type="number" class="form-control" v-model.number="ligne.quantite" min="1" required>
                        </div>
                        <div class="col-md-3">
                            <button class="btn btn-sm btn-danger" @click="supprimerLigneFourniture(idx)">×</button>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-secondary" @click="ajouterLigneFourniture">+ Ajouter une ligne</button>
                </div>
              </div>

              <button type="submit" class="btn btn-success">Enregistrer</button>
              <button type="button" class="btn btn-secondary ms-2" @click="closeMouvementModal">Annuler</button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Transfert -->
    <div v-if="showTransfertModal" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Transfert entre sous-caisses</h5>
            <button type="button" class="btn-close" @click="showTransfertModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info">
              <strong>Caisse :</strong> {{ getCaisseNom(caisseActiveId) }}
            </div>
            <form @submit.prevent="enregistrerTransfert">
              <div class="mb-3">
                <label>Date *</label>
                <input type="date" class="form-control" v-model="transfertForm.date" :min="dateMouvementMin" :max="dateMouvementMax" required>
              </div>
              <div class="mb-3">
                <label>Sous-caisse source</label>
                <input type="text" class="form-control" :value="getSousCaisseNom(sousCaisseActiveId)" disabled>
              </div>
              <div class="mb-3">
                <label>Montant source *</label>
                <input type="text" class="form-control" v-model="transfertForm.montantSource" @input="formatInputNumberLive($event, deviseActive)" @blur="formatInputNumberBlur($event, deviseActive)" required>
              </div>
              <div class="mb-3">
                <label>Sous-caisse destination *</label>
                <select class="form-select" v-model="transfertForm.sousCaisseDestination" required>
                  <option v-for="sc in destinationsTransfert" :key="sc.id" :value="sc.id">
                    {{ sc.nom }} ({{ getCaisseNom(sc.caisseId) }}) - {{ sc.devise }}
                  </option>
                </select>
              </div>
              <div class="mb-3">
                <label>Notes</label>
                <textarea class="form-control" rows="2" v-model="transfertForm.notes"></textarea>
              </div>
              <button type="submit" class="btn btn-success">Effectuer transfert</button>
              <button type="button" class="btn btn-secondary ms-2" @click="showTransfertModal = false">Annuler</button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Change -->
    <div v-if="showChangeModal" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Opération de change</h5>
            <button type="button" class="btn-close" @click="showChangeModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info">
              <strong>Caisse :</strong> {{ getCaisseNom(caisseActiveId) }}<br>
              <strong>Sous-caisse source :</strong> {{ getSousCaisseNom(sousCaisseActiveId) }} ({{ deviseActive }})
            </div>
            <form @submit.prevent="enregistrerChange">
              <div class="mb-3">
                <label>Date *</label>
                <input type="date" class="form-control" v-model="changeForm.date" :min="dateMouvementMin" :max="dateMouvementMax" required>
              </div>
              <div class="mb-3">
                <label>Montant {{ deviseActive }} *</label>
                <input type="text" class="form-control" v-model="changeForm.montantSource" @input="formatInputNumberLive($event, deviseActive)" @blur="formatInputNumberBlur($event, deviseActive)" required>
              </div>
              <div class="mb-3">
                <label>Taux de change (1 USD = ? CDF)</label>
                <input type="text" class="form-control" v-model="changeForm.taux" @input="formatInputNumberLive($event, 'CDF')" @blur="formatInputNumberBlur($event, 'CDF')" required>
              </div>
              <div class="mb-3">
                <label>Sous-caisse destination *</label>
                <select class="form-select" v-model="changeForm.sousCaisseDestination" required>
                  <option v-for="sc in sousCaissesChangeDestinations" :key="sc.id" :value="sc.id">
                    {{ sc.nom }} ({{ sc.devise }})
                  </option>
                </select>
              </div>
              <div class="mb-3">
                <label>Montant {{ autreDevise }} calculé</label>
                <input type="text" class="form-control" :value="formatMontant(montantDestinationChange, autreDevise)" readonly>
              </div>
              <div class="mb-3">
                <label>Notes</label>
                <textarea class="form-control" rows="2" v-model="changeForm.notes"></textarea>
              </div>
              <button type="submit" class="btn btn-success">Effectuer change</button>
              <button type="button" class="btn btn-secondary ms-2" @click="showChangeModal = false">Annuler</button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Justification -->
    <div v-if="showJustificationModal" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Justifier l'écriture</h5>
            <button type="button" class="btn-close" @click="showJustificationModal = false"></button>
          </div>
          <div class="modal-body">
            <p><strong>Montant initial :</strong> {{ formatMontant(mouvementAJustifier.montant, mouvementAJustifier.devise) }}</p>
            <p><strong>Poste :</strong> {{ mouvementAJustifier.posteBudgetaire }}</p>
            <div v-for="(ligne, idx) in justificationLignes" :key="idx" class="row mb-2">
              <div class="col-md-3">
                <input type="text" class="form-control" v-model="ligne.designation" placeholder="Désignation">
              </div>
              <div class="col-md-3">
                <select class="form-select" v-model="ligne.posteBudgetaire" required>
                  <option v-for="p in postesSortie" :key="p.id" :value="p.nom">{{ p.nom }}</option>
                </select>
              </div>
              <div class="col-md-2">
                <input type="text" class="form-control" v-model="ligne.montant" @input="formatInputNumberLive($event, mouvementAJustifier.devise)" @blur="formatInputNumberBlur($event, mouvementAJustifier.devise)" required>
              </div>
              <div class="col-md-3">
                <input type="text" class="form-control" v-model="ligne.justificatif" placeholder="Justificatif">
              </div>
              <div class="col-md-1">
                <button class="btn btn-sm btn-danger" @click="supprimerLigneJustification(idx)">×</button>
              </div>
            </div>
            <button type="button" class="btn btn-secondary" @click="ajouterLigneJustification">Ajouter une ligne</button>
            <div class="mt-3">
              <p><strong>Total justifié :</strong> {{ formatMontant(totalJustifie, mouvementAJustifier.devise) }}</p>
              <p v-if="soldeRestant > 0" class="text-warning">Solde restant à réintégrer : {{ formatMontant(soldeRestant, mouvementAJustifier.devise) }}</p>
              <p v-if="soldeRestant < 0" class="text-danger">Dépassement : {{ formatMontant(-soldeRestant, mouvementAJustifier.devise) }} (sera régularisé)</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showJustificationModal = false">Annuler</button>
            <button class="btn btn-success" @click="validerJustification">Valider la justification</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Clôture globale (jour/semaine) -->
    <div v-if="showClotureGlobaleModal" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Clôture {{ clotureGlobaleType === 'jour' ? 'journalière' : 'hebdomadaire' }}</h5>
            <button type="button" class="btn-close" @click="showClotureGlobaleModal = false"></button>
          </div>
          <div class="modal-body">
            <div v-if="clotureGlobaleType === 'jour'" class="mb-3">
              <label>Date *</label>
              <input type="date" class="form-control" v-model="clotureGlobaleDate" :min="dateMouvementMin" :max="dateMouvementMax" required>
            </div>
            <div class="alert alert-info">
              <strong>Caisse :</strong> {{ getCaisseNom(caisseActiveId) }}
            </div>
            <div class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Sous-caisse</th>
                    <th>Devise</th>
                    <th>Solde théorique</th>
                    <th>Solde réel</th>
                    <th>Poste de correction (si écart)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(ligne, idx) in lignesCloture" :key="ligne.sousCaisseId">
                    <td>{{ ligne.nom }}</td>
                    <td>{{ ligne.devise }}</td>
                    <td class="text-end">{{ formatMontant(ligne.soldeTheorique, ligne.devise) }}</td>
                    <td>
                      <input type="text" class="form-control form-control-sm text-end"
                             v-model="ligne.soldeReel"
                             @input="formatInputNumberLive($event, ligne.devise)"
                             @blur="formatInputNumberBlur($event, ligne.devise); verifierEcartLigne(idx)">
                    </td>
                    <td>
                      <select class="form-select form-select-sm" v-model="ligne.posteCorrection" :disabled="(ligne.soldeReelNum === ligne.soldeTheorique)">
                        <option value="">-- Aucun --</option>
                        <option v-for="p in postesCorrectionDisponibles(ligne)" :key="p.id" :value="p.nom">{{ p.nom }}</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="mb-3">
              <label>Commentaire</label>
              <textarea class="form-control" rows="2" v-model="commentaireClotureGlobale"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showClotureGlobaleModal = false">Annuler</button>
            <button class="btn btn-primary" @click="validerClotureGlobale">Valider la clôture</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Paiement salaires (multidevise) -->
    <div v-if="showPaiementSalairesModal" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Paiement des salaires / avances</h5>
            <button type="button" class="btn-close" @click="showPaiementSalairesModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row mb-3">
              <div class="col-md-6">
                <label>Travailleur</label>
                <select class="form-select" v-model="paiementSalaires.travailleurId" @change="onTravailleurChange">
                  <option value="">-- Sélectionner --</option>
                  <option v-for="t in travailleursActifs" :key="t.id" :value="t.id">
                    {{ t.nom }} {{ t.prenom }}
                  </option>
                </select>
              </div>
              <div class="col-md-6">
                <label>Type de paiement</label>
                <select class="form-select" v-model="paiementSalaires.type" @change="onTypeChangeSalaires">
                  <option value="avance_mois">Avance sur le mois</option>
                  <option value="avance_annee">Avance sur l'année</option>
                  <option value="solde">Solde du mois</option>
                </select>
              </div>
            </div>
            <!-- Champs de montant dans la devise de la sous‑caisse active -->
            <div class="row mb-3" v-if="paiementSalaires.type === 'avance_mois' || paiementSalaires.type === 'avance_annee'">
              <div class="col-md-6">
                <label>Montant ({{ deviseActive }})</label>
                <input type="text" class="form-control" v-model="paiementSalaires.montant" @input="formatInputNumberLive($event, deviseActive)" @blur="formatInputNumberBlur($event, deviseActive)">
              </div>
              <div class="col-md-6" v-if="paiementSalaires.type === 'avance_mois'">
                <label>Mois concerné</label>
                <select class="form-select" v-model="paiementSalaires.moisConcerne">
                  <option v-for="opt in optionsMois" :key="opt.valeur" :value="opt.valeur">{{ opt.libelle }}</option>
                </select>
              </div>
            </div>
            <div class="row mb-3" v-if="paiementSalaires.type === 'avance_annee'">
              <div class="col-md-12">
                <button class="btn btn-outline-primary" @click="ouvrirEcheancier">Définir échéancier</button>
                <small class="ms-2">Total à rembourser : {{ formatMontant(totalEcheancier, deviseActive) }} / {{ formatMontant(parseMontant(paiementSalaires.montant), deviseActive) }}</small>
              </div>
            </div>
            <div class="row mb-3" v-if="paiementSalaires.type === 'solde'">
              <div class="col-md-6">
                <label>Mois concerné</label>
                <select class="form-select" v-model="paiementSalaires.moisConcerne">
                  <option v-for="opt in optionsMois" :key="opt.valeur" :value="opt.valeur">{{ opt.libelle }}</option>
                </select>
              </div>
              <div class="col-md-6">
                <label>Montant à payer ({{ deviseActive }})</label>
                <input type="text" class="form-control" :value="formatMontant(soldeEstime, deviseActive)" readonly>
              </div>
            </div>
              <div class="alert alert-info">
              <strong>Salaire mensuel :</strong> {{ formatMontant(salaireTravailleurConverti, deviseActive) }} {{ deviseActive }}<br>
              <strong>Avances déjà perçues ce mois :</strong> {{ formatMontant(avancesMoisConverties, deviseActive) }} {{ deviseActive }}<br>
              <strong>Remboursements ce mois :</strong> {{ formatMontant(remboursementsMoisConverties, deviseActive) }} {{ deviseActive }}<br>
              <strong>Déduction (suspensions) :</strong> {{ formatMontant(montantSuspension, deviseActive) }} {{ deviseActive }}<br>
              <strong>Primes ce mois :</strong> {{ formatMontant(totalPrimesConverties, deviseActive) }} {{ deviseActive }}<br>
              <strong>Solde du mois :</strong> {{ formatMontant(soldeEstime, deviseActive) }} {{ deviseActive }}
            </div>
            <button class="btn btn-success" @click="validerPaiementSalaires">💾 Enregistrer paiement</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Échéancier (avance année) -->
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
                <input type="text" class="form-control" v-model="echeance.montant" @input="formatInputNumberLive($event, deviseActive); calculerTotalEcheancier()" @blur="formatInputNumberBlur($event, deviseActive); calculerTotalEcheancier()">
              </div>
            </div>
            <p>Total : {{ formatMontant(totalEcheancier, deviseActive) }} / {{ formatMontant(parseMontant(paiementSalaires.montant), deviseActive) }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showEcheancierModal = false">Annuler</button>
            <button class="btn btn-primary" @click="validerEcheancier">Valider</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Correction superviseur -->
    <div v-if="showCorrectionModal" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Corriger le mouvement</h5>
            <button type="button" class="btn-close" @click="showCorrectionModal = false"></button>
          </div>
          <div class="modal-body">
            <p>Mouvement original : {{ formatMontant(mouvementOriginal.montant, mouvementOriginal.devise) }} - {{ mouvementOriginal.posteBudgetaire }}</p>
            <div class="mb-3">
              <label>Nouveau montant</label>
              <input type="text" class="form-control" v-model="correctionForm.montant" @input="formatInputNumberLive($event, mouvementOriginal.devise)" @blur="formatInputNumberBlur($event, mouvementOriginal.devise)">
            </div>
            <div class="mb-3">
              <label>Nouveau poste budgétaire</label>
              <select class="form-select" v-model="correctionForm.posteBudgetaire">
                <option v-for="p in tousPostesBudgetaires" :key="p.id" :value="p.nom">{{ p.nom }}</option>
              </select>
            </div>
            <div class="mb-3">
              <label>Justificatif (optionnel)</label>
              <input type="text" class="form-control" v-model="correctionForm.justificatif">
            </div>
            <div class="mb-3">
              <label>Commentaire de correction</label>
              <textarea class="form-control" rows="2" v-model="correctionForm.commentaire"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showCorrectionModal = false">Annuler</button>
            <button class="btn btn-danger" @click="annulerMouvementCorrection">Annuler le mouvement</button>
            <button class="btn btn-primary" @click="validerCorrection">Appliquer correction</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Annulation manuelle -->
    <div v-if="showAnnulationManuelleModal" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Annuler un mouvement antérieur</h5>
            <button type="button" class="btn-close" @click="showAnnulationManuelleModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row mb-3">
              <div class="col-md-4">
                <label>Type de mouvement</label>
                <select class="form-select" v-model="annulationManuelleForm.type" @change="filtrerMouvementsAnnulables">
                  <option value="">Tous</option>
                  <option value="entree">Entrée</option>
                  <option value="sortie">Sortie</option>
                </select>
              </div>
              <div class="col-md-4">
                <label>Semaine</label>
                <select class="form-select" v-model="annulationManuelleForm.semaineId" @change="filtrerMouvementsAnnulables">
                  <option value="">Toutes</option>
                  <option v-for="s in semainesAnterieures" :key="s.id" :value="s.id">
                    {{ formatDateSemaine(s.dateDebut) }}
                  </option>
                </select>
              </div>
            </div>
            <div class="table-responsive" style="max-height: 300px;">
              <table class="table table-sm table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Désignation</th>
                    <th>Montant</th>
                    <th>Semaine caisse</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="m in mouvementsEligiblesAnnulation" :key="m.id">
                    <td>{{ formatDate(m.date) }}</td>
                    <td>{{ m.type === 'entree' ? 'Entrée' : 'Sortie' }}</td>
                    <td>{{ m.designation || '-' }}</td>
                    <td>{{ formatMontant(m.montant, m.devise) }}</td>
                    <td>{{ formatDate(getSemaineDate(m.semaineId)) }}</td>
                    <td>
                      <button class="btn btn-sm btn-outline-danger" @click="selectionnerMouvementAAnnuler(m)">Annuler</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="annulationManuelleForm.mouvementId" class="mt-3">
              <label>Commentaire (optionnel)</label>
              <textarea class="form-control" v-model="annulationManuelleForm.commentaire" rows="2"></textarea>
              <button class="btn btn-danger mt-2" @click="confirmerAnnulationManuelle">Confirmer l'annulation</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Modal confirmation transferts entrants -->
    <div v-if="showConfirmationTransfertEntrantModal" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-warning">
            <h5 class="modal-title">Transferts en attente de confirmation</h5>
            <button type="button" class="btn-close" @click="fermerModaleTransferts"></button>
          </div>
          <div class="modal-body">
            <p>Les transferts suivants ont été reçus et doivent être confirmés :</p>
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>De</th>
                  <th>À</th>
                  <th>Montant</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in transfertsEntrantsAConfirmer" :key="t.id">
                  <td>{{ formatDate(t.date) }}</td>
                  <td>{{ getNomCreateur(t.createurId) }} ({{ getSourceTransfertSousCaisse(t) }})</td>
                  <td>{{ getDestinationTransfert(t) }}</td>
                  <td>{{ formatMontant(t.montant, t.devise) }} {{ t.devise }}</td>
                  <td>
                    <button class="btn btn-sm btn-success me-1" @click="accepterTransfert(t)">Accepter</button>
                    <button class="btn btn-sm btn-danger" @click="ouvrirRefusTransfert(t)">Refuser</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="transfertARefuser" class="mt-3">
              <label>Motif du refus</label>
              <textarea class="form-control" v-model="motifRefus"></textarea>
              <button class="btn btn-danger mt-2" @click="confirmerRefusTransfert">Confirmer le refus</button>
              <button class="btn btn-secondary mt-2 ms-2" @click="transfertARefuser = null; motifRefus = ''">Annuler</button>
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
import notificationService from '../services/notificationService';
import { getRolePermissions } from '../utils/permissions';
import { convertirMontants } from '../utils/taux';

export default {
  name: 'Caisses',
  data() {
    return {
      // Utilisateur et permissions
      peutCloturer: false,
      permissionApresCloture: false,
      peutEcrire: false,
      
      // travailleur (pour les salaires)
      travailleursActifs: [],
      primesTravailleur: [],
      primeSelectionnee: null,
      paiementSalaires: {
        travailleurId: null,
        type: 'avance_mois',
        montant: 0,
        moisConcerne: new Date().toISOString().slice(0,7),
        libellePrime: '',
      },
      showPaiementSalairesModal: false,
      paramsConges: { joursOuvrablesMois: 26 },
      
      // Données
      caisses: [],
      sousCaisses: [],
      toutesSousCaisses: [],
      modesPaiement: [],
      postesBudgetaires: [],
      factures: [],
      mouvements: [],
      semaines: [],        
      caisseUtilisateurs: [],
      utilisateurs: [],
      chargementEnCours: true,
      permissionsCache: {},
      postesSysteme: [
        'Solde initial',
        'Annulation écriture antérieure',
        'Ajustement clôture',
        'Récupération sur justification',
        'Annulation écriture à justifier'
      ],
      articlesFourniture: [],
      stocksFournitures: [],
      
      // Sélection
      caisseActiveId: null,
      sousCaisseActiveId: null,
      semaineCouranteId: null,
      lastCaisseKey: 'lastCaisseId',
      lastSousCaisseKey: 'lastSousCaisseId',
      lastSemaineKey: 'lastSemaineId',
      
      // UI
      onglet: 'mouvements',
      triMouvementsCol: 'date',
      triMouvementsOrdre: 'desc',
      
      // Modals
      showMouvementModal: false,
      showTransfertModal: false,
      showChangeModal: false,
      showJustificationModal: false,
      showCorrectionModal: false,
      showEcheancierModal: false,
      showClotureGlobaleModal: false,
      clotureGlobaleType: 'jour',
      clotureGlobaleDate: new Date().toISOString().slice(0,10),
      lignesCloture: [],
      commentaireClotureGlobale: '',
      
      // Formulaires
      mouvementEdition: null,
      triEntreesCol: 'date',
      triEntreesOrdre: 'desc',
      triSortiesCol: 'date',
      triSortiesOrdre: 'desc',
      mouvementForm: {
        date: new Date().toISOString().slice(0,10),
        sousCaisseId: '',
        type: 'entree',
        montant: 0,
        designation: '',
        posteBudgetaire: '',
        factureId: '',
        justificatif: '',
        commentaire: '',
        estBrouillon: false,
        aJustifier: false,
        affectationStock: null,   // sera rempli automatiquement quand on choisit un poste
        carburant_type_id: null,
        site_id: null,
        quantite_carburant: 0,
        fournitureLignes: []
      },
      transfertForm: {
        date: new Date().toISOString().slice(0,10),
        sousCaisseSource: '',
        sousCaisseDestination: '',
        montantSource: 0,
        notes: ''
      },
      changeForm: {
        date: new Date().toISOString().slice(0,10),
        sousCaisseSource: '',
        sousCaisseDestination: '',
        montantSource: 0,
        taux: 0,
        notes: ''
      },
      justificationLignes: [],
      mouvementAJustifier: null,
      
      cloturesSousCaisse: [],
      
      // Correction
      mouvementOriginal: null,
      correctionForm: {
        montant: 0,
        posteBudgetaire: '',
        justificatif: '',
        commentaire: ''
      },
      showAnnulationManuelleModal: false,
      transfertsEntrantsAConfirmer: [],
      transfertARefuser: null,
      motifRefus: '',
      intervalVerifTransferts: null,
      showConfirmationTransfertEntrantModal: false,
      annulationManuelleForm: {
        type: '',
        semaineId: '',
        mouvementId: null,
        commentaire: ''
      },
      mouvementsEligiblesAnnulation: [],
      
      // Contrôles de date
      dateMouvementMin: '',
      dateMouvementMax: '',

      // emballage et carburant

      carburantTypes: [],
      emballageTypes: [],
      sites: [],
      
      // Avance année
      echeancier: [],
      totalEcheancier: 0,
      
      // Soldes dynamiques (en devise de la sous‑caisse active)
      avancesMoisConverties: 0,
      remboursementsMoisConverties: 0,
      totalPrimesConverties: 0,
      montantSuspension: 0,
      salaireTravailleurConverti: 0,
      soldeEstime: 0,
    };
  },
  computed: {
    afficherBoutonChange() {
      if (!this.caisseActiveId) return false;
      const devises = new Set(this.sousCaisses.map(sc => sc.devise));
      return devises.has('USD') && devises.has('CDF');
    },
    nbAJustifier() {
      return this.mouvements.filter(m => 
        m.aJustifier === true && !m.annule && !m.remplaceParCorrection && m.sousCaisseId === this.sousCaisseActiveId
      ).length;
    },
    caissesAccessibles() {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const permission = this.permissionsCache?.caisses || 'aucun';
      if (permission === 'aucun') return [];
      
      const aDesAssociations = this.caisseUtilisateurs.some(cu => cu.utilisateurId === user.id);
      
      if (!aDesAssociations) {
        return this.caisses;
      } else {
        const caisseIds = this.caisseUtilisateurs
          .filter(cu => cu.utilisateurId === user.id)
          .map(cu => cu.caisseId);
        return this.caisses.filter(c => caisseIds.includes(c.id));
      }
    },
    autreDevise() {
      return this.deviseActive === 'USD' ? 'CDF' : 'USD';
    },
    montantDestinationChange() {
      const montant = this.parseMontant(this.changeForm.montantSource);
      const taux = this.parseMontant(this.changeForm.taux);
      if (this.deviseActive === 'CDF') {
        return montant / taux;
      } else {
        return montant * taux;
      }
    },
    sousCaissesChangeDestinations() {
      const source = this.sousCaisses.find(sc => sc.id === this.changeForm.sousCaisseSource);
      if (!source) return [];
      return this.sousCaisses.filter(sc => 
        sc.caisseId === source.caisseId && 
        sc.devise !== source.devise && 
        sc.id !== source.id
      );
    },
    historiqueClotures() {
      return this.cloturesSousCaisse
        .filter(c => c.sousCaisseId === this.sousCaisseActiveId)
        .map(c => ({
          date: c.dateCloture,
          type: c.type === 'hebdo' ? 'Hebdomadaire' : 'Journalière',
          soldeDeclare: c.soldeDeclare,
          devise: this.sousCaisses.find(sc => sc.id === c.sousCaisseId)?.devise || '?',
          ecart: c.ecart,
          commentaire: c.commentaire
        }))
        .sort((a,b) => new Date(b.date) - new Date(a.date));
    },
    deviseActive() {
      const sc = this.sousCaisses.find(s => s.id === this.sousCaisseActiveId);
      return sc ? sc.devise : 'USD';
    },
    soldeCourant() {
      if (!this.semaineCourante) return 0;
      return this.deviseActive === 'USD' ? this.soldeCourantUSD : this.soldeCourantCDF;
    },
    mouvementsEntreesTries() {
      return this.mouvementsSemaine
        .filter(m => m.type === 'entree')
        .sort((a,b) => this.compareMouvements(a,b, this.triEntreesCol, this.triEntreesOrdre));
    },
    mouvementsSortiesTries() {
      return this.mouvementsSemaine
        .filter(m => m.type === 'sortie' || m.type === 'change' || m.type === 'transfert')
        .sort((a,b) => this.compareMouvements(a,b, this.triSortiesCol, this.triSortiesOrdre));
    },
    postesFiltres() {
        const type = this.mouvementForm.type;
        const tous = this.postesBudgetaires.filter(p => p.actif && !p.systeme);
        if (type === 'entree') return tous.filter(p => p.type === 'entree');
        else return tous.filter(p => p.type === 'sortie');
    },
    postesSortie() {
      return this.postesBudgetaires.filter(p => p.type === 'sortie' && p.actif && !p.systeme);
    },
    tousPostesBudgetaires() {
      return this.postesBudgetaires.filter(p => !p.systeme);
    },
    afficherFactures() {
      const poste = this.postesBudgetaires.find(p => p.nom === this.mouvementForm.posteBudgetaire);
      return poste && poste.lieFacture;
    },
    facturesImpayees() {
      return this.factures.filter(f => f.statutPaiement !== 'payée');
    },
    facturesAvecReste() {
        const poste = this.postesBudgetaires.find(p => p.nom === this.mouvementForm.posteBudgetaire);
        const type = poste?.typeFacturation || 'huile';
        return this.facturesImpayees
            .filter(f => f.typeFacture === type)
            .map(f => {
                const paiements = this.mouvements.filter(m => m.factureId === f.id && m.type === 'entree' && m.status === 'validé');
                const totalPaye = paiements.reduce((sum, p) => sum + p.montant, 0);
                const reste = f.totalHT - totalPaye;
                return { ...f, reste, resteFormate: this.formatMontant(reste, f.devise) };
            });
    },
    totalJustifie() {
      return this.justificationLignes.reduce((sum, l) => sum + (this.parseMontant(l.montant) || 0), 0);
    },
    soldeRestant() {
      if (!this.mouvementAJustifier) return 0;
      return this.mouvementAJustifier.montant - this.totalJustifie;
    },
    semaineCourante() {
      return this.semaines.find(s => s.id === this.semaineCouranteId);
    },
    semainesDisponibles() {
      return this.semaines;
    },
    semainePrecedenteDisponible() {
      if (!this.semaineCourante) return false;
      const index = this.semainesDisponibles.findIndex(s => s.id === this.semaineCouranteId);
      return index < this.semainesDisponibles.length - 1;
    },
    semaineSuivanteDisponible() {
      if (!this.semaineCourante) return false;
      const index = this.semainesDisponibles.findIndex(s => s.id === this.semaineCouranteId);
      return index > 0;
    },
    mouvementsSemaine() {
      if (!this.semaineCouranteId) return [];
      return this.mouvements.filter(m => 
        m.semaineId === this.semaineCouranteId && 
        !m.annule && 
        !m.remplaceParCorrection &&
        m.sousCaisseId === this.sousCaisseActiveId
      );
    },
    mouvementsAJustifier() {
      return this.mouvements.filter(m => 
        m.aJustifier === true && 
        !m.annule && 
        !m.remplaceParCorrection &&
        m.sousCaisseId === this.sousCaisseActiveId
      ).sort((a,b) => new Date(b.date) - new Date(a.date));
    },
    soldeCourantUSD() {
      let solde = this.soldeOuvertureUSD;
      for (let m of this.mouvementsSemaine) {
        if (m.devise !== 'USD') continue;
        if (m.type === 'entree') solde += m.montant;
        else if (m.type === 'sortie') solde -= m.montant;
      }
      return solde;
    },
    soldeCourantCDF() {
      let solde = this.soldeOuvertureCDF;
      for (let m of this.mouvementsSemaine) {
        if (m.devise !== 'CDF') continue;
        if (m.type === 'entree') solde += m.montant;
        else if (m.type === 'sortie') solde -= m.montant;
      }
      return solde;
    },
    soldeOuvertureUSD() {
      if (!this.semaineCourante) return 0;
      return this.semaineCourante.soldeOuvertureUSD;
    },
    soldeOuvertureCDF() {
      if (!this.semaineCourante) return 0;
      return this.semaineCourante.soldeOuvertureCDF;
    },
    destinationsTransfert() {
      const source = this.sousCaisses.find(sc => sc.id === this.transfertForm.sousCaisseSource);
      if (!source) return [];
      return this.toutesSousCaisses.filter(sc => 
        sc.id !== source.id && sc.devise === source.devise
      );
    },
    semainesAnterieures() {
      return this.semaines
        .filter(s => s.id !== this.semaineCouranteId)
        .sort((a,b) => new Date(b.dateDebut) - new Date(a.dateDebut));
    },
    peutAccederReglages() {
      return this.permissionsCache?.reglages === 'ecriture';
    },
    optionsMois() {
      const aujourdhui = new Date();
      const moisCourant = aujourdhui.getMonth();
      const anneeCourante = aujourdhui.getFullYear();
      const options = [];
      for (let i = -6; i <= 6; i++) {
        let mois = moisCourant + i;
        let annee = anneeCourante;
        if (mois < 0) {
          mois += 12;
          annee -= 1;
        } else if (mois > 11) {
          mois -= 12;
          annee += 1;
        }
        const date = new Date(annee, mois, 1);
        const libelle = date.toLocaleDateString('fr-FR', { month: 'long', year: '2-digit' });
        const valeur = `${annee}-${(mois+1).toString().padStart(2,'0')}`;
        options.push({ valeur, libelle });
      }
      return options;
    }
  },
  watch: {
      caisseActiveId: {
        immediate: false,
        async handler(newVal) {
          if (newVal) {
            const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
            localStorage.setItem(`${this.lastCaisseKey}_${user.id}`, newVal);
            await this.chargerSousCaisses();
            await this.chargerSemainesParCaisse();
            if (this.sousCaisseActiveId && !this.sousCaisses.some(sc => sc.id === this.sousCaisseActiveId)) {
              this.sousCaisseActiveId = this.sousCaisses[0]?.id || null;
            }
            this.verifierTransfertsEntrants();
          }
        }
      },
      'mouvementForm.posteBudgetaire'(newVal) {
        const poste = this.postesBudgetaires.find(p => p.nom === newVal);
        this.mouvementForm.affectationStock = poste ? poste.affectation_stock : null;
        if (poste?.affectation_stock === 'emballage') {
          this.mouvementForm.emballageLignes = []; // reset
        }
      },
      semaineCouranteId: {
        handler(newVal) {
          if (newVal && this.caisseActiveId) {
            const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
            localStorage.setItem(`${this.lastSemaineKey}_${user.id}_${this.caisseActiveId}`, newVal);
            this.verifierTransfertsEntrants();
          }
        },
        immediate: false
      },
      async sousCaisseActiveId(newVal) {
        if (newVal && this.caisseActiveId) {
          const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
          localStorage.setItem(`${this.lastSousCaisseKey}_${user.id}_${this.caisseActiveId}`, newVal);
        }
      },
      semaineCourante: {
        handler(val) {
          if (val) {
            this.dateMouvementMin = val.dateDebut;
            this.dateMouvementMax = val.dateFin;
          }
        },
        immediate: true
      },
      'paiementSalaires.travailleurId': 'calculerSoldeEstime',
      'paiementSalaires.moisConcerne': 'calculerSoldeEstime',
      'paiementSalaires.type': 'calculerSoldeEstime'
    },
  async mounted() {
      await this.chargerDonnees();
      await this.mettreAJourDroits();
      await this.restaurerDernieresSelections();
      this.chargementEnCours = false;
      this.verifierTransfertsEntrants();
      this.intervalVerifTransferts = setInterval(() => {
        this.verifierTransfertsEntrants();
      }, 30000);
      const pc = await db.reglages.where('cle').equals('params_conges').first();
      if (pc) this.paramsConges = pc.valeur;
      this.carburantTypes = await db.carburant_types.toArray();
      this.emballageTypes = await db.emballage_types.toArray();
      this.sites = await db.sites.toArray();
      this.articlesFourniture = await db.articles_fourniture.toArray();
      this.stocksFournitures = await db.stocks_fournitures.toArray();
    },
  beforeUnmount() {
    if (this.intervalVerifTransferts) clearInterval(this.intervalVerifTransferts);
  },
  methods: {
    compareMouvements(a, b, col, ordre) {
      let valA = a[col];
      let valB = b[col];
      if (col === 'date') {
        const dateA = new Date(valA);
        const dateB = new Date(valB);
        if (dateA.getTime() === dateB.getTime()) {
          // Si même date, comparer par dateCreation
          const dcA = new Date(a.dateCreation || 0);
          const dcB = new Date(b.dateCreation || 0);
          return ordre === 'asc' ? dcA - dcB : dcB - dcA;
        }
        return ordre === 'asc' ? dateA - dateB : dateB - dateA;
      }
      if (col === 'montant') {
        valA = parseFloat(valA) || 0;
        valB = parseFloat(valB) || 0;
      }
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (ordre === 'asc') return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    },
    triMouvements(col) {
      if (this.triMouvementsCol === col) {
        this.triMouvementsOrdre = this.triMouvementsOrdre === 'asc' ? 'desc' : 'asc';
      } else {
        this.triMouvementsCol = col;
        this.triMouvementsOrdre = 'desc';
      }
    },
    triEntrees(col) {
      if (this.triEntreesCol === col) {
        this.triEntreesOrdre = this.triEntreesOrdre === 'asc' ? 'desc' : 'asc';
      } else {
        this.triEntreesCol = col;
        this.triEntreesOrdre = 'desc';
      }
    },
    triSorties(col) {
      if (this.triSortiesCol === col) {
        this.triSortiesOrdre = this.triSortiesOrdre === 'asc' ? 'desc' : 'asc';
      } else {
        this.triSortiesCol = col;
        this.triSortiesOrdre = 'desc';
      }
    },
    // ---------- FORMATTAGE DYNAMIQUE ----------
    formatInputNumberLive(event, devise) {
      let value = event.target.value;
      // supprimer tout sauf chiffres, point, virgule
      value = value.replace(/[^\d.,]/g, '');
      // remplacer virgule par point
      value = value.replace(/,/g, '.');
      // ne garder que le premier point
      const parts = value.split('.');
      if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
      event.target.value = value;
    },
    formatInputNumberBlur(event, devise) {
      let value = event.target.value;
      if (value === '') value = '0';
      let number = parseFloat(value);
      if (isNaN(number)) number = 0;
      event.target.value = this.formatMontant(number, devise);
    },
    // ---------- UTILITAIRES DE PERMISSION ----------
    peutModifierSemaine(semaineId) {
      const semaine = this.semaines.find(s => s.id === semaineId);
      if (!semaine) return true;
      if (!semaine.estCloturee) return this.peutEcrire;
      return this.permissionApresCloture;
    },

    // ---------- FORMATTAGE ----------
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
    formatInputNumber(event, devise) {
      let value = event.target.value.replace(/'/g, '').replace(/,/g, '.');
      let number = parseFloat(value);
      if (isNaN(number)) number = 0;
      let formatted = this.formatMontant(number, devise);
      event.target.value = formatted;
    },
    parseMontant(value) {
      if (!value) return 0;
      let str = value.toString().replace(/'/g, '').replace(/\s/g, '').replace(/,/g, '.');
      return parseFloat(str);
    },
    arrondirCentaineInferieure(montant) {
      return Math.floor(montant / 100) * 100;
    },
    formatDate(dateString) {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('fr-FR');
    },
    formatDateSemaine(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    },
    formatMoisAnnee(moisStr) {
      if (!moisStr) return '';
      const [annee, mois] = moisStr.split('-');
      const date = new Date(annee, mois - 1);
      return date.toLocaleDateString('fr-FR', { month: 'long', year: '2-digit' });
    },
    getCaisseNom(id) { const c = this.caisses.find(c => c.id === id); return c ? c.nom : '-'; },
    getSousCaisseNom(id) { const sc = this.sousCaisses.find(s => s.id === id); return sc ? sc.nom : '-'; },
    getSemaineDate(semaineId) { const s = this.semaines.find(s => s.id === semaineId); return s ? s.dateDebut : ''; },
    getFactureNumero(id) { const f = this.factures.find(f => f.id === id); return f ? f.numero : '-'; },
    estSousCaisseCloturee(semaineId, sousCaisseId) {
      return this.cloturesSousCaisse.some(c => c.semaineId === semaineId && c.sousCaisseId === sousCaisseId && c.type === 'hebdo');
    },

    // ---------- CHARGEMENT DES DONNÉES ----------
    async chargerDonnees() {
      this.caisses = await db.caisses.toArray() || [];
      this.toutesSousCaisses = await db.sous_caisses.toArray() || [];
      this.modesPaiement = await db.modes_paiement.toArray() || [];
      this.postesBudgetaires = await db.postes_budgetaires.toArray() || [];
      this.factures = await db.factures.toArray() || [];
      this.mouvements = await db.mouvementsCaisse.toArray() || [];
      this.caisseUtilisateurs = await db.caisse_utilisateurs.toArray() || [];
      this.cloturesSousCaisse = await db.clotures_sous_caisse.toArray() || [];
      this.utilisateurs = await db.utilisateurs.toArray() || [];
    },
    async chargerPostes() {
      this.postesBudgetaires = await db.postes_budgetaires.toArray();
    },
    async creerPosteAnnulationSiNecessaire() {
      const existe = this.postesBudgetaires.find(p => p.nom === 'Annulation écriture antérieure');
      if (!existe) {
        const nouveauPoste = {
          nom: 'Annulation écriture antérieure',
          type: 'sortie',
          lieFacture: false,
          estRetraitBancaire: false,
          actif: true,
          systeme: true
        };
        await apiService.ajouter('postes_budgetaires', nouveauPoste);
        await this.chargerPostes();
      }
    },
    async getSemaineCouranteNonCloturee() {
      if (!this.caisseActiveId) return null;
      
      // Récupérer toutes les semaines de la caisse
      const toutes = await db.semaines_caisse.where('caisseId').equals(this.caisseActiveId).toArray();
      // Trier par date décroissante
      toutes.sort((a, b) => new Date(b.dateDebut) - new Date(a.dateDebut));
      
      // Chercher la première semaine non clôturée
      let semaineNonCloturee = toutes.find(s => !s.estCloturee);
      
      if (!semaineNonCloturee) {
        // Aucune semaine non clôturée → en créer une nouvelle
        await this.creerPremiereSemainePourCaisse();
        // Recharger les semaines
        await this.chargerSemainesParCaisse();
        semaineNonCloturee = this.semaines.find(s => !s.estCloturee);
      }
      
      return semaineNonCloturee;
    },
    async mettreAJourDroits() {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const permissions = await getRolePermissions(user.role);
      this.permissionsCache = permissions || {};

      const niveau = permissions?.caisses || 'aucun';
      const peutLire = niveau === 'lecture' || niveau === 'ecriture';

      this.peutEcrire = niveau === 'ecriture';
      this.peutCloturer = this.peutEcrire;
      this.permissionApresCloture = false;

      if (!peutLire) {
        this.caisseActiveId = null;
        this.sousCaisseActiveId = null;
        this.semaineCouranteId = null;
      }
    },
    async restaurerDernieresSelections() {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const storedCaisseId = localStorage.getItem(`${this.lastCaisseKey}_${user.id}`);
      
      // Sélection caisse
      if (storedCaisseId && this.caissesAccessibles.some(c => c.id === storedCaisseId)) {
        this.caisseActiveId = storedCaisseId;
      } else if (this.caissesAccessibles.length > 0) {
        this.caisseActiveId = this.caissesAccessibles[0].id;
      }

      if (this.caisseActiveId) {
        await this.chargerSousCaisses();
        const storedSousCaisseId = localStorage.getItem(`${this.lastSousCaisseKey}_${user.id}_${this.caisseActiveId}`);
        if (storedSousCaisseId && this.sousCaisses.some(sc => sc.id === storedSousCaisseId)) {
          this.sousCaisseActiveId = storedSousCaisseId;
        } else if (this.sousCaisses.length) {
          this.sousCaisseActiveId = this.sousCaisses[0].id;
        }
        await this.chargerSemainesParCaisse();
        // Définir la semaine courante sur la première de la liste (la plus récente)
        this.semaineCouranteId = this.semaines.length > 0 ? this.semaines[0].id : null;
      }
      this.chargementEnCours = false;
    },
    async chargerSousCaisses() {
      if (!this.caisseActiveId) return;
      const scs = await db.sous_caisses.where('caisseId').equals(this.caisseActiveId).toArray();
      this.sousCaisses = scs;
    },
    async chargerSemainesParCaisse() {
      if (!this.caisseActiveId) return;
      const sem = await db.semaines_caisse.where('caisseId').equals(this.caisseActiveId).toArray();
      this.semaines = sem.sort((a, b) => new Date(b.dateDebut) - new Date(a.dateDebut));
    },

    // ---------- GESTION DES SEMAINES ----------
    async nettoyerAnciennesSemaines() {
      const toutes = await db.semaines_caisse.where('caisseId').equals(this.caisseActiveId).toArray();
      const triees = toutes.sort((a,b) => new Date(b.dateDebut) - new Date(a.dateDebut));
      if (triees.length > 52) {
        const aSupprimer = triees.slice(52);
        for (let s of aSupprimer) {
          await db.semaines_caisse.delete(s.id);
        }
      }
    },
    semainePrecedente() {
      const index = this.semainesDisponibles.findIndex(s => s.id === this.semaineCouranteId);
      if (index < this.semainesDisponibles.length - 1) {
        this.semaineCouranteId = this.semainesDisponibles[index+1].id;
      }
    },
    semaineSuivante() {
      const index = this.semainesDisponibles.findIndex(s => s.id === this.semaineCouranteId);
      if (index > 0) {
        this.semaineCouranteId = this.semainesDisponibles[index-1].id;
      }
    },
    async changerSemaine() {},
    async changerCaisse() {
      await this.chargerSousCaisses();  // filtre les sous‑caisses de la caisse sélectionnée
      await this.chargerSemainesParCaisse();
      
      if (this.semaines.length === 0) {
        await this.creerPremiereSemainePourCaisse();
      } else {
        // Vérifier pour chaque sous‑caisse si son solde initial a été enregistré dans la première semaine
        const premiereSemaine = this.semaines.sort((a,b) => new Date(a.dateDebut) - new Date(b.dateDebut))[0];
        for (let sc of this.sousCaisses) {
          await this.initialiserSoldeInitialSousCaisse(sc);
        }
      }
      
      const sorted = [...this.semaines].sort((a, b) => new Date(b.dateDebut) - new Date(a.dateDebut));
      this.semaineCouranteId = sorted[0]?.id;
      
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const storedSousCaisseId = localStorage.getItem(`${this.lastSousCaisseKey}_${user.id}_${this.caisseActiveId}`);
      if (storedSousCaisseId && this.sousCaisses.some(sc => sc.id === storedSousCaisseId)) {
        this.sousCaisseActiveId = storedSousCaisseId;
      } else if (this.sousCaisses.length) {
        this.sousCaisseActiveId = this.sousCaisses[0].id;
      }
    },
    async creerPremiereSemainePourCaisse() {
      const aujourdhui = new Date();
      const jour = aujourdhui.getDay();
      const diffLundi = jour === 0 ? 6 : jour - 1;
      const lundi = new Date(aujourdhui);
      lundi.setDate(aujourdhui.getDate() - diffLundi);
      const dateDebut = lundi.toISOString().slice(0, 10);
      const dateFin = new Date(lundi);
      dateFin.setDate(lundi.getDate() + 6);
      const dateFinStr = dateFin.toISOString().slice(0, 10);

      const newSemaine = {
        id: crypto.randomUUID(),
        caisseId: this.caisseActiveId,
        dateDebut,
        dateFin: dateFinStr,
        soldeOuvertureUSD: 0,
        soldeOuvertureCDF: 0,
        soldeClotureUSD: 0,
        soldeClotureCDF: 0,
        estCloturee: false,
        dateCloture: null,
        commentaireCloture: ''
      };
      await db.semaines_caisse.add(newSemaine);
      await this.chargerSemainesParCaisse();
      this.semaineCouranteId = newSemaine.id;

      const sousCaisses = await db.sous_caisses.where('caisseId').equals(this.caisseActiveId).toArray();
      
      let posteSoldeInitial = await db.postes_budgetaires.where('nom').equals('Solde initial').first();
      if (!posteSoldeInitial) {
        posteSoldeInitial = {
          id: crypto.randomUUID(),
          nom: 'Solde initial',
          type: 'entree',
          lieFacture: false,
          estRetraitBancaire: false,
          actif: true,
          systeme: true,
          annee: new Date().getFullYear()
        };
        await db.postes_budgetaires.add(posteSoldeInitial);
      }

      for (let sc of sousCaisses) {
        if (!sc.solde_initial || sc.solde_initial === 0) continue;
        
        const { montant_cdf, montant_usd } = await convertirMontants(
          sc.solde_initial,
          sc.devise,
          dateDebut
        );
        
        const mouvementData = {
          id: crypto.randomUUID(),
          caisseId: this.caisseActiveId,
          sousCaisseId: sc.id,
          semaineId: newSemaine.id,
          date: dateDebut,
          type: 'entree',
          montant: sc.solde_initial,
          devise: sc.devise,
          montant_cdf,
          montant_usd,
          posteBudgetaire: 'Solde initial',
          designation: 'Solde initial',
          justificatif: 'Création de la caisse',
          status: 'validé',
          aJustifier: false,
          estCorrection: false,
          typeCorrection: null,
          remplaceParCorrection: false,
          annule: false,
          parentId: null,
          correctionParentId: null,
          factureId: null,
          commentaire: null,
          montant_converti_facture: null,
          dateCreation: new Date().toISOString()
        };
        await db.mouvementsCaisse.add(mouvementData);
      }
      
      await this.chargerDonnees();
    },
    async changerSousCaisse() {},
    allerAuxReglagesCaisses() {
      this.$router.push({ name: 'Settings', query: { group: 'caisse_banque', tab: 'caisse-caisses' } });
    },
    async initialiserSoldeInitialSousCaisse(sousCaisse) {
      if (!sousCaisse.solde_initial || sousCaisse.solde_initial === 0) return;
      
      const semaine = await this.getSemaineCouranteNonCloturee();
      if (!semaine) {
        console.error("Impossible d'obtenir une semaine non clôturée pour le solde initial.");
        return;
      }
      
      // Vérifier si un mouvement de solde initial existe déjà pour cette sous‑caisse dans cette semaine
      const existant = await db.mouvementsCaisse
        .where({ sousCaisseId: sousCaisse.id, semaineId: semaine.id, posteBudgetaire: 'Solde initial' })
        .first();
      if (existant) return;
      
      const { montant_cdf, montant_usd } = await convertirMontants(
        sousCaisse.solde_initial,
        sousCaisse.devise,
        semaine.dateDebut
      );
      
      const mouvementData = {
        id: crypto.randomUUID(),
        caisseId: this.caisseActiveId,
        sousCaisseId: sousCaisse.id,
        semaineId: semaine.id,
        date: semaine.dateDebut,
        type: 'entree',
        montant: sousCaisse.solde_initial,
        devise: sousCaisse.devise,
        montant_cdf,
        montant_usd,
        posteBudgetaire: 'Solde initial',
        designation: 'Solde initial',
        justificatif: 'Solde initial de la sous-caisse',
        status: 'validé',
        aJustifier: false,
        estCorrection: false,
        typeCorrection: null,
        remplaceParCorrection: false,
        annule: false,
        parentId: null,
        correctionParentId: null,
        factureId: null,
        commentaire: null,
        montant_converti_facture: null,
        dateCreation: new Date().toISOString()
      };
      await db.mouvementsCaisse.add(mouvementData);
      await this.chargerDonnees();
    },

    // ---------- MOUVEMENTS ----------
    verifierSoldeSuffisant(montant) {
      if (montant <= 0) return true;
      return this.soldeCourant >= montant;
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
          quantite: delta
        });
      }
    },

    async ajusterStockFourniture(typeId, siteId, delta) {
      let stock = await db.emballage_stocks.where({ type_id: typeId, site_id: siteId }).first();
      if (stock) {
        stock.quantite += delta;
        if (stock.quantite < 0) stock.quantite = 0;
        await db.emballage_stocks.update(stock.id, stock);
      } else if (delta > 0) {
        await db.emballage_stocks.add({
          id: crypto.randomUUID(),
          type_id: typeId,
          site_id: siteId,
          quantite: delta
        });
      }
    },
    ajouterLigneEmballage() {
      this.mouvementForm.emballageLignes.push({ type_id: null, quantite: 1 });
    },
    supprimerLigneEmballage(idx) {
      this.mouvementForm.emballageLignes.splice(idx, 1);
    },
    ouvrirMouvement() {
      if (this.semaineCourante && this.semaineCourante.estCloturee) {
        alert('Cette semaine est clôturée, vous ne pouvez plus ajouter de mouvement.');
        return;
      }
      this.mouvementEdition = null;
          this.mouvementForm = {
            date: new Date().toISOString().slice(0,10),
            sousCaisseId: this.sousCaisseActiveId || (this.sousCaisses[0]?.id || ''),
            type: 'entree',
            montant: 0,
            designation: '',
            posteBudgetaire: '',
            factureId: '',
            justificatif: '',
            commentaire: '',
            estBrouillon: false,
            aJustifier: false,
            affectationStock: null,
            carburant_type_id: null,
            site_id: null,
            quantite_carburant: 0,
            emballageLignes: []
        };
        this.showMouvementModal = true;
    },
    closeMouvementModal() { this.showMouvementModal = false; },
    onTypeChange() { this.mouvementForm.posteBudgetaire = ''; },
    async enregistrerMouvement() {
        const montantOrigine = this.parseMontant(this.mouvementForm.montant);
        if (!this.mouvementForm.sousCaisseId || !this.mouvementForm.posteBudgetaire || montantOrigine <= 0) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }
        if (this.mouvementForm.type === 'sortie' && !this.mouvementForm.estBrouillon) {
            if (!this.verifierSoldeSuffisant(montantOrigine)) {
                alert('Solde insuffisant pour effectuer cette sortie.');
                return;
            }
        }
        const sousCaisse = this.sousCaisses.find(sc => sc.id === this.mouvementForm.sousCaisseId);
        if (!sousCaisse) {
            alert('Sous-caisse introuvable. Veuillez en sélectionner une.');
            return;
        }

        const status = this.mouvementForm.estBrouillon ? 'brouillon' : (this.mouvementForm.aJustifier ? 'valide' : 'validé');
        let aJustifier = this.mouvementForm.aJustifier && !this.mouvementForm.estBrouillon;
        if (this.mouvementForm.type === 'sortie' && !this.mouvementForm.justificatif) {
            aJustifier = true;
        }

        // Justificatif automatique facture
        if (this.mouvementForm.factureId && !this.mouvementForm.justificatif) {
            const facture = await db.factures.get(this.mouvementForm.factureId);
            if (facture) {
                this.mouvementForm.justificatif = `Facture ${facture.numero}`;
            }
        }

        const { montant_cdf, montant_usd } = await convertirMontants(montantOrigine, sousCaisse.devise, this.mouvementForm.date);

        // Calcul du montant converti dans la devise de la facture
        let montantConvertiFacture = null;
        let depassement = false;
        if (this.mouvementForm.factureId && this.mouvementForm.type === 'entree') {
            const facture = await db.factures.get(this.mouvementForm.factureId);
            if (facture) {
                const taux = await this.getTauxPourDate(this.mouvementForm.date);
                if (sousCaisse.devise === facture.devise) {
                    montantConvertiFacture = montantOrigine;
                } else if (sousCaisse.devise === 'USD' && facture.devise === 'CDF') {
                    montantConvertiFacture = montantOrigine * taux;
                } else if (sousCaisse.devise === 'CDF' && facture.devise === 'USD') {
                    montantConvertiFacture = montantOrigine / taux;
                }

                const paiements = await db.mouvementsCaisse
                    .where({ factureId: facture.id, type: 'entree', status: 'validé' })
                    .toArray();
                const totalDejaPaye = paiements.reduce((sum, p) => sum + (p.montant_converti_facture || 0), 0);
                const reste = facture.totalHT - totalDejaPaye;

                if (montantConvertiFacture > reste) {
                    depassement = true;
                    if (!confirm(`Le montant saisi dépasse le solde dû de ${this.formatMontant(reste, facture.devise)}. Voulez-vous continuer et créer un trop-perçu ?`)) {
                        return;
                    }
                }
            }
        }

        const mouvementData = {
            id: crypto.randomUUID(),
            caisseId: this.caisseActiveId,
            sousCaisseId: this.sousCaisseActiveId,
            semaineId: this.semaineCouranteId,
            date: this.mouvementForm.date,
            type: this.mouvementForm.type,
            montant: montantOrigine,
            devise: sousCaisse.devise,
            montant_cdf,
            montant_usd,
            posteBudgetaire: this.mouvementForm.posteBudgetaire,
            factureId: this.mouvementForm.factureId || null,
            justificatif: this.mouvementForm.justificatif,
            commentaire: this.mouvementForm.commentaire,
            designation: this.mouvementForm.designation,
            status: status,
            aJustifier: aJustifier,
            parentId: null,
            correctionParentId: null,
            typeCorrection: null,
            remplaceParCorrection: false,
            annule: false,
            estCorrection: false,
            dateCreation: new Date().toISOString(),
            montant_converti_facture: montantConvertiFacture
        };

        try {
            const mouvementId = await apiService.ajouter('mouvementsCaisse', mouvementData, { audit: true });

            if (!this.mouvementForm.estBrouillon && !this.mouvementForm.aJustifier) {
                if (this.mouvementForm.factureId) {
                    await this.mettreAJourFacturePaiement(this.mouvementForm.factureId);
                }
            }

            // Gestion affectation stock
            if (this.mouvementForm.affectationStock === 'carburant') {
                await apiService.ajouter('carburant_mouvements', {
                    id: crypto.randomUUID(),
                    carburant_type_id: this.mouvementForm.carburant_type_id,
                    site_id: this.mouvementForm.site_id,
                    date: this.mouvementForm.date,
                    type: 'entree',
                    quantite: this.mouvementForm.quantite_carburant,
                    utilisation_id: null,
                    source: 'caisse',
                    reference_id: mouvementId
                }, { audit: true });
                await this.ajusterStockCarburant(
                    this.mouvementForm.carburant_type_id,
                    this.mouvementForm.site_id,
                    this.mouvementForm.quantite_carburant
                );
            } else if (this.mouvementForm.affectationStock === 'emballage') {
                for (let ligne of this.mouvementForm.emballageLignes) {
                    if (!ligne.type_id || ligne.quantite <= 0) continue;
                    await apiService.ajouter('achat_emballage_lignes', {
                        id: crypto.randomUUID(),
                        mouvementCaisseId: mouvementId,
                        emballage_type_id: ligne.type_id,
                        quantite: ligne.quantite
                    }, { audit: true });
                    // Site par défaut : celui de la sous‑caisse, ou bien un site sélectionné dans le formulaire ?
                    const siteId = this.mouvementForm.site_id;   // désormais toujours renseigné
                    await this.ajusterStockEmballage(ligne.type_id, siteId, ligne.quantite);
                }
            }

            // Message informatif
            if (this.mouvementForm.factureId && this.mouvementForm.type === 'entree' && !this.mouvementForm.estBrouillon) {
                const facture = await db.factures.get(this.mouvementForm.factureId);
                if (facture) {
                    const paiements = await db.mouvementsCaisse
                        .where({ factureId: facture.id, type: 'entree', status: 'validé' })
                        .toArray();
                    const totalPaye = paiements.reduce((sum, p) => sum + (p.montant_converti_facture || 0), 0);
                    const reste = facture.totalHT - totalPaye;
                    if (reste > 0 && !depassement) {
                        alert(`Paiement enregistré. Il reste ${this.formatMontant(reste, facture.devise)} à payer sur cette facture.`);
                    }
                }
            }

            await this.chargerDonnees();
            this.closeMouvementModal();
        } catch (error) {
            console.error(error);
            alert('Erreur lors de l\'enregistrement');
        }
    },
    async validerMouvement(id) {
      const mvt = this.mouvements.find(m => m.id === id);
      if (!mvt) return;
      if (!this.peutModifierSemaine(mvt.semaineId)) {
        alert("Impossible de valider un mouvement dans une semaine clôturée (hebdo).");
        return;
      }
      try {
        await apiService.modifier('mouvementsCaisse', id, { status: 'validé' }, { audit: true });
        if (mvt.factureId) {
          await this.mettreAJourFacturePaiement(mvt.factureId);
        }
        await this.chargerDonnees();
        alert('Mouvement validé');
      } catch (error) {
        console.error(error);
        alert('Erreur');
      }
    },
    async supprimerMouvement(id) {
        const mvt = this.mouvements.find(m => m.id === id);
        if (!mvt) return;
        if (!this.peutModifierSemaine(mvt.semaineId)) {
            alert("Impossible de supprimer un mouvement dans une semaine clôturée. Utilisez le bouton 'Annuler un mouvement'.");
            return;
        }

        const estCouple = mvt.posteBudgetaire === 'Transfert entre caisses' || mvt.posteBudgetaire === 'Change';
        let mvtLie = null;
        if (estCouple) {
            mvtLie = this.mouvements.find(m => m.parentId === mvt.id || (mvt.parentId && m.id === mvt.parentId));
            if (!confirm(`Cette opération est liée à un ${mvt.posteBudgetaire}. L'écriture correspondante sera également supprimée. Continuer ?`)) return;
        }

        const avanceLiee = await db.avances.where('mouvementCaisseId').equals(id).first();
        if (avanceLiee) {
            if (!confirm('Ce mouvement correspond à une avance. Supprimer également l\'avance ?')) return;
        }

        try {
            if (avanceLiee) {
                await db.avances.delete(avanceLiee.id);
                if (avanceLiee.type === 'annee') {
                    await db.remboursements_avances.where('avance_id').equals(avanceLiee.id).delete();
                }
            }

            // Supprimer les écritures manuelles de correction liées à ce mouvement
            await db.ecritures_manuelles.where('parentId').equals(id).delete();

            if (estCouple && mvtLie) {
                await db.ecritures_manuelles.where('parentId').equals(mvtLie.id).delete();
                await apiService.supprimer('mouvementsCaisse', mvtLie.id);
            }

            await apiService.supprimer('mouvementsCaisse', id);

            if (mvt.factureId) {
                await this.mettreAJourFacturePaiement(mvt.factureId);
            }

            await this.chargerDonnees();
            alert('Mouvement(s) supprimé(s).');
        } catch (error) {
            console.error(error);
            alert('Erreur lors de la suppression');
        }
    },
    
    // ---------- TRANSFERT ----------
    ouvrirTransfert() {
      if (this.semaineCourante && this.semaineCourante.estCloturee) {
        alert('Cette semaine est clôturée, vous ne pouvez plus effectuer de transfert.');
        return;
      }
      this.transfertForm = {
        date: new Date().toISOString().slice(0,10),
        sousCaisseSource: this.sousCaisseActiveId || (this.sousCaisses[0]?.id || ''),
        sousCaisseDestination: '',
        montantSource: 0,
        notes: ''
      };
      this.showTransfertModal = true;
    },
    getNomCreateur(createurId) {
      if (!createurId) return 'Système';
      const user = this.utilisateurs?.find(u => u.id === createurId);
      return user ? user.nom : 'Inconnu';
    },
    getSourceTransfertSousCaisse(m) {
      try {
        const comm = JSON.parse(m.commentaire);
        return comm.sourceSousCaisseNom || '';
      } catch { return ''; }
    },
    getDestinationTransfert(m) {
      try {
        const comm = JSON.parse(m.commentaire);
        return `${this.getCaisseNom(comm.destinationCaisseId)} (${comm.destinationNom})`;
      } catch { return ''; }
    },
    fermerModaleTransferts() {
      this.showConfirmationTransfertEntrantModal = false;
      this.transfertARefuser = null;
      this.motifRefus = '';
    },
    async verifierTransfertsEntrants() {
      if (!this.caisseActiveId) return;
      const tousMouvements = await db.mouvementsCaisse
        .where('status').equals('validé')
        .and(m => m.posteBudgetaire === 'Transfert entre caisses')
        .toArray();
      const transfertsEnAttente = [];
      for (const m of tousMouvements) {
        try {
          const comm = JSON.parse(m.commentaire || '{}');
          if (comm.type === 'transfert_en_attente' && comm.destinationCaisseId === this.caisseActiveId) {
            const entreeExistante = await db.mouvementsCaisse.where({ parentId: m.id, type: 'entree', posteBudgetaire: 'Transfert entre caisses' }).first();
            if (!entreeExistante) transfertsEnAttente.push(m);
          }
        } catch (e) { /* ignore */ }
      }
      if (transfertsEnAttente.length > 0) {
        this.transfertsEntrantsAConfirmer = transfertsEnAttente;
        this.showConfirmationTransfertEntrantModal = true;
      }
    },
    getSourceTransfert(m) {
      try {
        const comm = JSON.parse(m.commentaire);
        return `${comm.sourceSousCaisseNom} (${comm.sourceCaisseNom})`;
      } catch { return 'Inconnu'; }
    },
    async accepterTransfert(mouvementSortie) {
      const comm = JSON.parse(mouvementSortie.commentaire);
      const destSousCaisse = this.toutesSousCaisses.find(sc => sc.id === comm.destinationSousCaisseId);
      if (!destSousCaisse) return alert('Sous‑caisse de destination introuvable');
      
      const semaineDest = await this.getSemaineCouranteNonClotureePourCaisse(destSousCaisse.caisseId);
      
      const designationEntree = `Transfert reçu de ${comm.sourceCaisseNom} (${comm.sourceSousCaisseNom}) vers ${this.getCaisseNom(destSousCaisse.caisseId)} (${destSousCaisse.nom})`;
      
      const mouvementEntree = {
        id: crypto.randomUUID(),
        caisseId: destSousCaisse.caisseId,
        sousCaisseId: destSousCaisse.id,
        semaineId: semaineDest.id,
        date: new Date().toISOString().slice(0,10),
        type: 'entree',
        montant: mouvementSortie.montant,
        devise: mouvementSortie.devise,
        montant_cdf: mouvementSortie.montant_cdf,
        montant_usd: mouvementSortie.montant_usd,
        posteBudgetaire: 'Transfert entre caisses',
        designation: designationEntree,
        justificatif: `Confirmé le ${new Date().toLocaleDateString()}`,
        status: 'validé',
        aJustifier: false,
        parentId: mouvementSortie.id,
        dateCreation: new Date().toISOString(),
        createurId: JSON.parse(localStorage.getItem('currentUser')).id
      };
      
      await apiService.ajouter('mouvementsCaisse', mouvementEntree, { audit: true });
      
      const expediteurId = mouvementSortie.createurId;
      if (expediteurId) {
        await notificationService.envoyerMessageSysteme('transfert_confirme', {
          montant: this.formatMontant(mouvementSortie.montant, mouvementSortie.devise),
          destinataire: destSousCaisse.nom
        }, expediteurId);
      }
      
      await this.chargerDonnees();
      
      // Retirer le transfert de la liste locale
      this.transfertsEntrantsAConfirmer = this.transfertsEntrantsAConfirmer.filter(t => t.id !== mouvementSortie.id);
      
      if (this.transfertsEntrantsAConfirmer.length === 0) {
        this.fermerModaleTransferts();
      }
      
      alert('Transfert accepté avec succès.');
    },
    ouvrirRefusTransfert(t) {
      this.transfertARefuser = t;
      this.motifRefus = '';
    },
    async confirmerRefusTransfert() {
      if (!this.motifRefus.trim()) {
        alert('Veuillez saisir un motif de refus.');
        return;
      }
      
      const t = this.transfertARefuser;
      const comm = JSON.parse(t.commentaire);
      
      // Annuler le mouvement de sortie original
      await apiService.modifier('mouvementsCaisse', t.id, {
        status: 'annulé',
        commentaire: (t.commentaire || '') + `\nRefusé le ${new Date().toLocaleDateString()} - Motif: ${this.motifRefus}`
      });

      // Créer une compensation (entrée) chez l'expéditeur
      const semaineSource = await this.getSemaineCouranteNonClotureePourCaisse(t.caisseId);
      
      const designationCompensation = `Refus de transfert de ${comm.sourceCaisseNom} (${comm.sourceSousCaisseNom}) vers ${this.getCaisseNom(comm.destinationCaisseId)} (${comm.destinationNom}) - Motif: ${this.motifRefus}`;
      
      const mouvementCompensation = {
        id: crypto.randomUUID(),
        caisseId: t.caisseId,
        sousCaisseId: t.sousCaisseId,
        semaineId: semaineSource.id,
        date: new Date().toISOString().slice(0,10),
        type: 'entree',
        montant: t.montant,
        devise: t.devise,
        montant_cdf: t.montant_cdf,
        montant_usd: t.montant_usd,
        posteBudgetaire: 'Annulation écriture antérieure',
        designation: designationCompensation,
        justificatif: `Refus du ${new Date().toLocaleDateString()}`,
        status: 'validé',
        aJustifier: false,
        parentId: t.id,
        dateCreation: new Date().toISOString(),
        createurId: JSON.parse(localStorage.getItem('currentUser')).id
      };
      
      await apiService.ajouter('mouvementsCaisse', mouvementCompensation, { audit: true });

      // Notification à l'expéditeur
      const expediteurId = t.createurId;
      if (expediteurId) {
        await notificationService.envoyerMessageSysteme('transfert_refuse', {
          montant: this.formatMontant(t.montant, t.devise),
          motif: this.motifRefus
        }, expediteurId);
      }

      await this.chargerDonnees();
      
      // Retirer de la liste locale
      this.transfertsEntrantsAConfirmer = this.transfertsEntrantsAConfirmer.filter(item => item.id !== t.id);
      this.transfertARefuser = null;
      this.motifRefus = '';
      
      if (this.transfertsEntrantsAConfirmer.length === 0) {
        this.fermerModaleTransferts();
      }
      
      alert('Transfert refusé.');
    },
      async getSemaineCouranteNonClotureePourCaisse(caisseId) {
      const toutes = await db.semaines_caisse.where('caisseId').equals(caisseId).toArray();
      toutes.sort((a, b) => new Date(b.dateDebut) - new Date(a.dateDebut));
      let semaine = toutes.find(s => !s.estCloturee);
      if (!semaine) {
        const aujourdhui = new Date();
        const jour = aujourdhui.getDay();
        const diffLundi = jour === 0 ? 6 : jour - 1;
        const lundi = new Date(aujourdhui);
        lundi.setDate(aujourdhui.getDate() - diffLundi);
        const dateDebut = lundi.toISOString().slice(0, 10);
        const dateFin = new Date(lundi);
        dateFin.setDate(lundi.getDate() + 6);
        const newSemaine = {
          id: crypto.randomUUID(),
          caisseId: caisseId,
          dateDebut,
          dateFin: dateFin.toISOString().slice(0, 10),
          soldeOuvertureUSD: 0,
          soldeOuvertureCDF: 0,
          soldeClotureUSD: 0,
          soldeClotureCDF: 0,
          estCloturee: false,
          dateCloture: null,
          commentaireCloture: ''
        };
        await db.semaines_caisse.add(newSemaine);
        semaine = newSemaine;
      }
      return semaine;
    },
    async enregistrerTransfert() {
      const montant = this.parseMontant(this.transfertForm.montantSource);
      if (!this.verifierSoldeSuffisant(montant)) {
        alert('Solde insuffisant dans la caisse source.');
        return;
      }
      const source = this.sousCaisses.find(sc => sc.id === this.transfertForm.sousCaisseSource);
      const dest = this.toutesSousCaisses.find(sc => sc.id === this.transfertForm.sousCaisseDestination);
      if (!source || !dest) return;
      if (source.devise !== dest.devise) {
        alert('Le transfert ne peut se faire qu’entre sous-caisses de même devise.');
        return;
      }
      const { montant_cdf, montant_usd } = await convertirMontants(montant, source.devise, this.transfertForm.date);
      const caisseDest = this.caisses.find(c => c.id === dest.caisseId);
      const destinataireId = caisseDest?.responsableId;
      
      const designationSortie = `Transfert de ${this.getCaisseNom(source.caisseId)} (${source.nom}) vers ${this.getCaisseNom(dest.caisseId)} (${dest.nom})`;
      
      const mouvementSortie = {
        id: crypto.randomUUID(),
        caisseId: source.caisseId,
        sousCaisseId: source.id,
        semaineId: this.semaineCouranteId,
        date: this.transfertForm.date,
        type: 'sortie',
        montant: montant,
        devise: source.devise,
        montant_cdf,
        montant_usd,
        posteBudgetaire: 'Transfert entre caisses',
        factureId: null,
        justificatif: `Transfert vers ${dest.nom} (${this.getCaisseNom(dest.caisseId)})`,
        commentaire: JSON.stringify({
          type: 'transfert_en_attente',
          destinationCaisseId: dest.caisseId,
          destinationSousCaisseId: dest.id,
          destinationNom: dest.nom,
          sourceCaisseId: source.caisseId,
          sourceSousCaisseId: source.id,
          sourceCaisseNom: this.getCaisseNom(source.caisseId),
          sourceSousCaisseNom: source.nom
        }),
        designation: designationSortie,
        status: 'validé',
        aJustifier: false,
        parentId: null,
        correctionParentId: null,
        typeCorrection: null,
        remplaceParCorrection: false,
        annule: false,
        estCorrection: false,
        dateCreation: new Date().toISOString(),
        createurId: JSON.parse(localStorage.getItem('currentUser')).id
      };
      try {
        await apiService.ajouter('mouvementsCaisse', mouvementSortie, { audit: true });
        if (destinataireId) {
          await notificationService.envoyerMessageSysteme('transfert_recu', {
            montant: this.formatMontant(montant, source.devise),
            source: source.nom,
            caisseSource: this.getCaisseNom(source.caisseId)
          }, destinataireId);
        }
        await this.chargerDonnees();
        this.showTransfertModal = false;
        alert(`Transfert de ${this.formatMontant(montant, source.devise)} ${source.devise} effectué vers ${dest.nom}. Le destinataire devra confirmer la réception.`);
      } catch (error) {
        console.error(error);
        alert('Erreur');
      }
    },
    
    // ---------- CHANGE ----------
    ouvrirChange() {
      if (this.semaineCourante && this.semaineCourante.estCloturee) {
        alert('Cette semaine est clôturée, vous ne pouvez plus effectuer de change.');
        return;
      }
      this.changeForm = {
        date: new Date().toISOString().slice(0,10),
        sousCaisseSource: this.sousCaisseActiveId || (this.sousCaisses[0]?.id || ''),
        sousCaisseDestination: '',
        montantSource: 0,
        taux: 0,
        notes: ''
      };
      this.showChangeModal = true;
    },
    async enregistrerChange() {
      const montantSource = this.parseMontant(this.changeForm.montantSource);
      const taux = this.parseMontant(this.changeForm.taux);
      if (!this.verifierSoldeSuffisant(montantSource)) {
        alert('Solde insuffisant dans la caisse source.');
        return;
      }
      const source = this.sousCaisses.find(sc => sc.id === this.sousCaisseActiveId);
      const dest = this.sousCaisses.find(sc => sc.id === this.changeForm.sousCaisseDestination);
      if (!source || !dest) return;
      if (source.devise === dest.devise) {
        alert('Les devises doivent être différentes pour un change. Utilisez le transfert.');
        return;
      }

      let montantDest;
      if (source.devise === 'CDF') {
        montantDest = montantSource / taux;
      } else {
        montantDest = montantSource * taux;
      }

      const { montant_cdf: montant_cdf_source, montant_usd: montant_usd_source } = await convertirMontants(
        montantSource,
        source.devise,
        this.changeForm.date
      );
      const { montant_cdf: montant_cdf_dest, montant_usd: montant_usd_dest } = await convertirMontants(
        montantDest,
        dest.devise,
        this.changeForm.date
      );

      const mouvementSortie = {
        caisseId: this.caisseActiveId,
        sousCaisseId: source.id,
        semaineId: this.semaineCouranteId,
        date: this.changeForm.date,
        type: 'sortie',
        montant: montantSource,
        devise: source.devise,
        montant_cdf: montant_cdf_source,
        montant_usd: montant_usd_source,
        posteBudgetaire: 'Change',
        factureId: null,
        justificatif: `Change vers ${dest.nom} au taux ${taux}`,
        commentaire: this.changeForm.notes,
        designation: `Change ${source.devise} → ${dest.devise}`,
        status: 'validé',
        aJustifier: false,
        parentId: null,
        correctionParentId: null,
        typeCorrection: null,
        remplaceParCorrection: false,
        annule: false,
        estCorrection: false,
        dateCreation: new Date().toISOString()
      };
      const mouvementEntree = {
        ...mouvementSortie,
        sousCaisseId: dest.id,
        type: 'entree',
        montant: montantDest,
        devise: dest.devise,
        montant_cdf: montant_cdf_dest,
        montant_usd: montant_usd_dest,
        justificatif: `Change depuis ${source.nom} au taux ${taux}`
      };
      try {
        const idSortie = await apiService.ajouter('mouvementsCaisse', mouvementSortie, { audit: true });
        mouvementEntree.parentId = idSortie;
        await apiService.ajouter('mouvementsCaisse', mouvementEntree, { audit: true });
        await this.chargerDonnees();
        this.showChangeModal = false;
        alert('Change effectué');
      } catch (error) {
        console.error(error);
        alert('Erreur');
      }
    },

    // ---------- JUSTIFICATION ----------
    justifierMouvement(mvt) {
      this.mouvementAJustifier = mvt;
      this.justificationLignes = [{
        posteBudgetaire: mvt.posteBudgetaire,
        montant: this.formatMontant(mvt.montant, mvt.devise),
        justificatif: mvt.justificatif || '',
        designation: mvt.designation || ''
      }];
      this.showJustificationModal = true;
    },
    ajouterLigneJustification() {
      this.justificationLignes.push({ posteBudgetaire: '', montant: '', justificatif: '', designation: '' });
    },
    supprimerLigneJustification(idx) {
      this.justificationLignes.splice(idx, 1);
    },
    async validerJustification() {
      const total = this.totalJustifie;
      const montantInitial = this.mouvementAJustifier.montant;
      try {
        if (total === montantInitial && this.justificationLignes.length === 1 && this.justificationLignes[0].posteBudgetaire === this.mouvementAJustifier.posteBudgetaire) {
          await apiService.modifier('mouvementsCaisse', this.mouvementAJustifier.id, {
            justificatif: this.justificationLignes[0].justificatif,
            designation: this.justificationLignes[0].designation || this.mouvementAJustifier.designation,
            aJustifier: false,
            status: 'validé'
          });
        } else {
          await apiService.modifier('mouvementsCaisse', this.mouvementAJustifier.id, {
            remplaceParCorrection: true,
            aJustifier: false,
            commentaire: `Remplacé par justification le ${new Date().toISOString()}`
          });

          for (let ligne of this.justificationLignes) {
            const montantLigne = this.parseMontant(ligne.montant);
            if (montantLigne <= 0) continue;
            const nouveauMvt = {
              caisseId: this.mouvementAJustifier.caisseId,
              sousCaisseId: this.mouvementAJustifier.sousCaisseId,
              semaineId: this.mouvementAJustifier.semaineId,
              date: this.mouvementAJustifier.date,
              type: 'sortie',
              montant: montantLigne,
              devise: this.mouvementAJustifier.devise,
              posteBudgetaire: ligne.posteBudgetaire,
              factureId: null,
              justificatif: ligne.justificatif,
              designation: ligne.designation || this.mouvementAJustifier.designation || 'Justification',
              commentaire: `Justification partielle de l'écriture ${this.mouvementAJustifier.id}`,
              status: 'validé',
              aJustifier: false,
              parentId: this.mouvementAJustifier.id,
              correctionParentId: this.mouvementAJustifier.id,
              typeCorrection: 'justification',
              remplaceParCorrection: false,
              annule: false,
              estCorrection: true,
              dateCreation: new Date().toISOString()
            };
            await apiService.ajouter('mouvementsCaisse', nouveauMvt, { audit: true });
          }

          const difference = total - montantInitial;
          if (difference !== 0) {
            const semaineCouranteObj = this.semaineCourante;
            if (!semaineCouranteObj) throw new Error('Semaine courante introuvable');
            const typeCompensation = difference > 0 ? 'sortie' : 'entree';
            const mvtCompensation = {
              caisseId: this.mouvementAJustifier.caisseId,
              sousCaisseId: this.mouvementAJustifier.sousCaisseId,
              semaineId: semaineCouranteObj.id,
              date: new Date().toISOString().slice(0,10),
              type: typeCompensation,
              montant: Math.abs(difference),
              devise: this.mouvementAJustifier.devise,
              posteBudgetaire: difference > 0 ? 'Récupération sur justification' : 'Régularisation justification',
              factureId: null,
              justificatif: `Régularisation de l'écriture ${this.mouvementAJustifier.id}`,
              designation: 'Régularisation justification',
              commentaire: '',
              status: 'validé',
              aJustifier: false,
              parentId: this.mouvementAJustifier.id,
              correctionParentId: this.mouvementAJustifier.id,
              typeCorrection: 'compensation_justification',
              remplaceParCorrection: false,
              annule: false,
              estCorrection: true,
              dateCreation: new Date().toISOString()
            };
            await apiService.ajouter('mouvementsCaisse', mvtCompensation);
          }
        }

        await this.chargerDonnees();
        this.showJustificationModal = false;
        alert('Justification enregistrée');
      } catch (error) {
        console.error(error);
        alert('Erreur lors de la justification');
      }
    },
    async annulerMouvementAJustifier(mvt) {
        if (!this.peutModifierSemaine(mvt.semaineId)) {
            alert("Impossible d'annuler un mouvement dans une semaine clôturée (hebdo) sans être superviseur.");
            return;
        }
        if (!confirm(`Annuler le mouvement à justifier du ${this.formatDate(mvt.date)} ? Une compensation sera créée dans la semaine courante.`)) return;
        try {
            await apiService.modifier('mouvementsCaisse', mvt.id, {
                annule: true,
                commentaire: `Annulé le ${new Date().toISOString()}`
            });

            // Supprimer les écritures manuelles de correction liées
            await db.ecritures_manuelles.where('parentId').equals(mvt.id).delete();

            const typeCompensation = mvt.type === 'sortie' ? 'entree' : 'sortie';
            const mvtCompensation = {
                caisseId: mvt.caisseId,
                sousCaisseId: mvt.sousCaisseId,
                semaineId: this.semaineCouranteId,
                date: new Date().toISOString().slice(0,10),
                type: typeCompensation,
                montant: mvt.montant,
                devise: mvt.devise,
                posteBudgetaire: 'Annulation écriture à justifier',
                factureId: null,
                justificatif: `Annulation du mouvement ${mvt.id}`,
                designation: 'Annulation',
                commentaire: '',
                status: 'validé',
                aJustifier: false,
                parentId: mvt.id,
                correctionParentId: mvt.id,
                typeCorrection: 'annulation_justification',
                remplaceParCorrection: false,
                annule: false,
                estCorrection: true,
                dateCreation: new Date().toISOString()
            };
            await apiService.ajouter('mouvementsCaisse', mvtCompensation);
            await this.chargerDonnees();
            alert('Mouvement annulé, compensation ajoutée dans la semaine courante');
        } catch (error) {
            console.error(error);
            alert('Erreur');
        }
    },

    // ---------- ANNULATION MANUELLE ----------
    ouvrirAnnulationManuelle() {
      this.annulationManuelleForm = {
        type: '',
        semaineId: '',
        mouvementId: null,
        commentaire: ''
      };
      this.filtrerMouvementsAnnulables();
      this.showAnnulationManuelleModal = true;
    },
    async filtrerMouvementsAnnulables() {
      let tous = await db.mouvementsCaisse
        .where({ caisseId: this.caisseActiveId, sousCaisseId: this.sousCaisseActiveId })
        .toArray();
      
      tous = tous.filter(m => 
        m.status === 'validé' && 
        !m.annule && 
        !m.remplaceParCorrection &&
        !m.aJustifier &&
        m.semaineId !== this.semaineCouranteId
      );
      
      if (this.annulationManuelleForm.type) {
        tous = tous.filter(m => m.type === this.annulationManuelleForm.type);
      }
      if (this.annulationManuelleForm.semaineId) {
        tous = tous.filter(m => m.semaineId === this.annulationManuelleForm.semaineId);
      }
      
      const tousMouvements = await db.mouvementsCaisse.toArray();
      tous = tous.filter(m => {
        const dejaAnnule = tousMouvements.some(other => 
          other.parentId === m.id && other.typeCorrection === 'annulation_manuelle'
        );
        return !dejaAnnule;
      });
      
      tous.sort((a, b) => new Date(b.date) - new Date(a.date));
      this.mouvementsEligiblesAnnulation = tous;
    },
    selectionnerMouvementAAnnuler(mvt) {
      this.annulationManuelleForm.mouvementId = mvt.id;
    },
    async confirmerAnnulationManuelle() {
      const mvtOriginal = this.mouvements.find(m => m.id === this.annulationManuelleForm.mouvementId);
      if (!mvtOriginal) {
        alert("Mouvement introuvable");
        return;
      }
      
      const tous = await db.mouvementsCaisse.toArray();
      const dejaAnnule = tous.some(m => 
        m.parentId === mvtOriginal.id && m.typeCorrection === 'annulation_manuelle'
      );
      if (dejaAnnule) {
        alert("Ce mouvement a déjà été annulé.");
        return;
      }
      
      const typeCompensation = mvtOriginal.type === 'entree' ? 'sortie' : 'entree';
      if (typeCompensation === 'sortie') {
        if (this.soldeCourant - mvtOriginal.montant < 0) {
          alert("Cette annulation rendrait le solde négatif. Opération interdite.");
          return;
        }
      }
      
      const estCouple = mvtOriginal.posteBudgetaire === 'Transfert entre caisses' || mvtOriginal.posteBudgetaire === 'Change';
      let mvtLie = null;
      if (estCouple) {
        mvtLie = this.mouvements.find(m => m.parentId === mvtOriginal.id || (mvtOriginal.parentId && m.id === mvtOriginal.parentId));
        if (!confirm(`Cette opération est un ${mvtOriginal.posteBudgetaire}. L'écriture correspondante sera également annulée. Continuer ?`)) return;
      }
      
      const designationBase = `Annulation du ${this.formatDate(mvtOriginal.date)} : ${mvtOriginal.designation || 'sans désignation'}`;
      
      const nouveauMvt = {
        id: crypto.randomUUID(),
        caisseId: mvtOriginal.caisseId,
        sousCaisseId: mvtOriginal.sousCaisseId,
        semaineId: this.semaineCouranteId,
        date: new Date().toISOString().slice(0,10),
        type: typeCompensation,
        montant: mvtOriginal.montant,
        devise: mvtOriginal.devise,
        montant_cdf: mvtOriginal.montant_cdf,
        montant_usd: mvtOriginal.montant_usd,
        posteBudgetaire: 'Annulation écriture antérieure',
        designation: designationBase,
        justificatif: this.annulationManuelleForm.commentaire || '',
        commentaire: `Annulation manuelle du mouvement ${mvtOriginal.id}`,
        status: 'validé',
        aJustifier: false,
        estCorrection: true,
        typeCorrection: 'annulation_manuelle',
        parentId: mvtOriginal.id,
        correctionParentId: mvtOriginal.id,
        remplaceParCorrection: false,
        annule: false,
        dateCreation: new Date().toISOString()
      };
      
      await apiService.ajouter('mouvementsCaisse', nouveauMvt);
      
      if (estCouple && mvtLie) {
        const typeLie = mvtLie.type === 'entree' ? 'sortie' : 'entree';
        const nouveauMvtLie = {
          ...nouveauMvt,
          id: crypto.randomUUID(),
          type: typeLie,
          montant: mvtLie.montant,
          devise: mvtLie.devise,
          montant_cdf: mvtLie.montant_cdf,
          montant_usd: mvtLie.montant_usd,
          sousCaisseId: mvtLie.sousCaisseId,
          designation: `Annulation du ${this.formatDate(mvtLie.date)} : ${mvtLie.designation || ''}`,
          parentId: mvtLie.id,
          correctionParentId: mvtLie.id
        };
        await apiService.ajouter('mouvementsCaisse', nouveauMvtLie);
      }
      
      await this.chargerDonnees();
      this.showAnnulationManuelleModal = false;
      alert('Annulation enregistrée dans la semaine courante.');
    },

    // ---------- CLÔTURE GLOBALE ----------
    clotureJournaliere() {
      if (!this.sousCaisseActiveId) {
        alert("Veuillez sélectionner une sous-caisse.");
        return;
      }
      this.preparerLignesCloture();
      this.clotureGlobaleType = 'jour';
      this.clotureGlobaleDate = new Date().toISOString().slice(0,10);
      this.showClotureGlobaleModal = true;
    },
    cloturerSemaine() {
      if (!this.semaineCourante) return;
      if (this.semaineCourante.estCloturee) {
        alert('Cette semaine est déjà clôturée.');
        return;
      }
      const toutesSemaines = this.semaines;
      const semainesPrec = toutesSemaines.filter(s => new Date(s.dateDebut) < new Date(this.semaineCourante.dateDebut));
      const dernierePrec = semainesPrec.sort((a,b) => new Date(b.dateDebut) - new Date(a.dateDebut))[0];
      if (dernierePrec && !dernierePrec.estCloturee) {
        alert('Veuillez d’abord clôturer la semaine précédente.');
        return;
      }
      this.preparerLignesCloture();
      this.clotureGlobaleType = 'semaine';
      this.showClotureGlobaleModal = true;
    },
    preparerLignesCloture() {
      this.lignesCloture = this.sousCaisses.map(sc => {
        const soldeTheorique = this.getSoldeTheoriqueSousCaisse(sc.id);
        return {
          sousCaisseId: sc.id,
          nom: sc.nom,
          devise: sc.devise,
          soldeTheorique,
          soldeReel: null,
          soldeReelNum: null,
          posteCorrection: ''
        };
      });
    },
    getSoldeTheoriqueSousCaisse(sousCaisseId) {
      const mouvements = this.mouvementsSemaine.filter(m => m.sousCaisseId === sousCaisseId);
      const sc = this.sousCaisses.find(s => s.id === sousCaisseId);
      if (!sc) return 0;
      let solde = sc.devise === 'USD' ? this.soldeOuvertureUSD : this.soldeOuvertureCDF;
      for (let m of mouvements) {
        if (m.devise !== sc.devise) continue;
        if (m.type === 'entree') solde += m.montant;
        else if (m.type === 'sortie') solde -= m.montant;
      }
      return solde;
    },
    verifierEcartLigne(idx) {
      const ligne = this.lignesCloture[idx];
      const val = this.parseMontant(ligne.soldeReel);
      ligne.soldeReelNum = val;
      if (val !== ligne.soldeTheorique && !ligne.posteCorrection) {
        // message implicite via le select requis
      }
    },
    postesCorrectionDisponibles(ligne) {
      const type = ligne.soldeReelNum > ligne.soldeTheorique ? 'entree' : 'sortie';
      return this.postesBudgetaires.filter(p => p.type === type && p.actif && !p.systeme);
    },
    async validerClotureGlobale() {
      for (let ligne of this.lignesCloture) {
        const val = this.parseMontant(ligne.soldeReel);
        if (isNaN(val)) {
          alert(`Veuillez saisir un solde réel valide pour la sous-caisse ${ligne.nom}.`);
          return;
        }
        ligne.soldeReelNum = val;
        if (val !== ligne.soldeTheorique && !ligne.posteCorrection) {
          alert(`Veuillez sélectionner un poste de correction pour la sous-caisse ${ligne.nom}.`);
          return;
        }
      }

      try {
        const dateCloture = this.clotureGlobaleType === 'jour' ? this.clotureGlobaleDate : new Date().toISOString();
        const typeCloture = this.clotureGlobaleType === 'jour' ? 'journalier' : 'hebdo';

        for (let ligne of this.lignesCloture) {
          const ecart = ligne.soldeReelNum - ligne.soldeTheorique;
          
          await apiService.ajouter('clotures_sous_caisse', {
            semaineId: this.semaineCourante.id,
            sousCaisseId: ligne.sousCaisseId,
            dateCloture,
            soldeDeclare: ligne.soldeReelNum,
            ecart,
            commentaire: this.commentaireClotureGlobale,
            type: typeCloture
          });

          if (ecart !== 0) {
            const mouvementCompensation = {
              caisseId: this.caisseActiveId,
              sousCaisseId: ligne.sousCaisseId,
              semaineId: this.semaineCouranteId,
              date: dateCloture.slice(0,10),
              type: ecart > 0 ? 'entree' : 'sortie',
              montant: Math.abs(ecart),
              devise: ligne.devise,
              posteBudgetaire: ligne.posteCorrection,
              justificatif: `Ajustement suite clôture ${typeCloture}`,
              designation: 'Ajustement clôture',
              status: 'validé',
              aJustifier: false,
              estCorrection: true,
              typeCorrection: 'ajustement_cloture',
              dateCreation: new Date().toISOString()
            };
            await apiService.ajouter('mouvementsCaisse', mouvementCompensation);
          }
        }

        if (this.clotureGlobaleType === 'semaine') {
          const updateData = {};
          updateData.soldeClotureUSD = this.soldeCourantUSD;
          updateData.soldeClotureCDF = this.soldeCourantCDF;
          await apiService.modifier('semaines_caisse', this.semaineCourante.id, updateData);
          
          await apiService.modifier('semaines_caisse', this.semaineCourante.id, {
            estCloturee: true,
            dateCloture: new Date().toISOString()
          });

          await this.creerSemaineSuivante();
        }

        await this.chargerDonnees();
        this.showClotureGlobaleModal = false;
        alert('Clôture enregistrée avec succès.');
      } catch (error) {
        console.error(error);
        alert('Erreur lors de la clôture');
      }
    },
    async creerSemaineSuivante() {
      if (!this.caisseActiveId) return;
      const toutesSemaines = await db.semaines_caisse.where('caisseId').equals(this.caisseActiveId).toArray();
      toutesSemaines.sort((a, b) => new Date(b.dateDebut) - new Date(a.dateDebut));
      const derniereSemaine = toutesSemaines[0];

      const dateDebutDerniere = new Date(derniereSemaine.dateDebut);
      const nouvelleDateDebut = new Date(dateDebutDerniere);
      nouvelleDateDebut.setDate(dateDebutDerniere.getDate() + 7);
      const dateDebutStr = nouvelleDateDebut.toISOString().slice(0, 10);

      if (toutesSemaines.some(s => s.dateDebut === dateDebutStr)) {
        console.warn('La semaine suivante existe déjà.');
        return;
      }

      let soldeOuvertureUSD = 0, soldeOuvertureCDF = 0;
      for (let ligne of this.lignesCloture) {
        const sc = this.sousCaisses.find(s => s.id === ligne.sousCaisseId);
        if (!sc) continue;
        // Pas de conversion, on cumule simplement les soldes réels déclarés dans leur devise
        if (sc.devise === 'USD') {
          soldeOuvertureUSD += ligne.soldeReelNum;
        } else {
          soldeOuvertureCDF += ligne.soldeReelNum;
        }
      }

      const dateFin = new Date(nouvelleDateDebut);
      dateFin.setDate(nouvelleDateDebut.getDate() + 6);
      const dateFinStr = dateFin.toISOString().slice(0, 10);

      const newSemaine = {
        id: crypto.randomUUID(),
        caisseId: this.caisseActiveId,
        dateDebut: dateDebutStr,
        dateFin: dateFinStr,
        soldeOuvertureUSD,
        soldeOuvertureCDF,
        soldeClotureUSD: 0,
        soldeClotureCDF: 0,
        estCloturee: false,
        dateCloture: null,
        commentaireCloture: ''
      };

      await db.semaines_caisse.add(newSemaine);
      await this.chargerSemainesParCaisse();
      this.semaineCouranteId = newSemaine.id;
    },

    // ---------- CORRECTION SUPERVISEUR ----------
    async corrigerMouvement(mvt) {
      if (!this.peutModifierSemaine(mvt.semaineId)) {
        alert("Cette semaine est clôturée (hebdo) et vous n'avez pas les droits pour la modifier.");
        return;
      }
      this.mouvementOriginal = mvt;
      this.correctionForm = {
        montant: this.formatMontant(mvt.montant, mvt.devise),
        posteBudgetaire: mvt.posteBudgetaire,
        justificatif: mvt.justificatif,
        commentaire: ''
      };
      this.showCorrectionModal = true;
    },
    async validerCorrection() {
      const semaineMvt = this.semaines.find(s => s.id === this.mouvementOriginal.semaineId);
      if (semaineMvt && semaineMvt.estCloturee) {
        alert("Impossible de modifier un mouvement dans une semaine clôturée. Utilisez le bouton 'Annuler un mouvement'.");
        return;
      }

      const nouveauMontant = this.parseMontant(this.correctionForm.montant);
      
      // Mise à jour du mouvement original
      await apiService.modifier('mouvementsCaisse', this.mouvementOriginal.id, {
        montant: nouveauMontant,
        posteBudgetaire: this.correctionForm.posteBudgetaire,
        justificatif: this.correctionForm.justificatif,
        commentaire: (this.mouvementOriginal.commentaire || '') + '\n' + this.correctionForm.commentaire
      });

      // Si le mouvement est lié à une avance, mettre à jour le montant de l'avance
      const avance = await db.avances.where('mouvementCaisseId').equals(this.mouvementOriginal.id).first();
      if (avance) {
        const travailleur = await db.travailleurs.get(avance.travailleur_id);
        const taux = await this.getTauxPourDate(this.mouvementOriginal.date);
        const deviseSalaire = travailleur.devise_salaire || 'CDF';
        const montantConverti = this.convertirMontant(
          nouveauMontant,
          this.mouvementOriginal.devise,
          deviseSalaire,
          taux
        );
        await db.avances.update(avance.id, { montant: montantConverti });
      }

      // Mise à jour du statut de facture si nécessaire
      if (this.mouvementOriginal.factureId) {
        await this.mettreAJourFacturePaiement(this.mouvementOriginal.factureId);
      }

      await this.chargerDonnees();
      this.showCorrectionModal = false;
      alert('Correction appliquée');
    },
    async annulerMouvementCorrection() {
      if (!confirm('Annuler ce mouvement ? Une compensation sera créée dans la semaine courante.')) return;
      const mvt = this.mouvementOriginal;
      
      const typeCompensation = mvt.type === 'entree' ? 'sortie' : 'entree';
      if (typeCompensation === 'sortie') {
        if (this.soldeCourant - mvt.montant < 0) {
          alert("Cette annulation rendrait le solde négatif. Opération interdite.");
          return;
        }
      }
      
      const estCouple = mvt.posteBudgetaire === 'Transfert entre caisses' || mvt.posteBudgetaire === 'Change';
      let mvtLie = null;
      if (estCouple) {
        mvtLie = this.mouvements.find(m => m.parentId === mvt.id || (mvt.parentId && m.id === mvt.parentId));
        if (!confirm(`Cette opération est un ${mvt.posteBudgetaire}. L'écriture correspondante sera également annulée. Continuer ?`)) return;
      }
      
      await apiService.modifier('mouvementsCaisse', mvt.id, { annule: true });
      
      const mvtCompensation = {
        caisseId: mvt.caisseId,
        sousCaisseId: mvt.sousCaisseId,
        semaineId: this.semaineCouranteId,
        date: new Date().toISOString().slice(0,10),
        type: typeCompensation,
        montant: mvt.montant,
        devise: mvt.devise,
        posteBudgetaire: 'Annulation écriture',
        factureId: null,
        justificatif: `Annulation du mouvement ${mvt.id}`,
        designation: 'Annulation',
        commentaire: '',
        status: 'validé',
        aJustifier: false,
        parentId: mvt.id,
        correctionParentId: mvt.id,
        typeCorrection: 'annulation',
        remplaceParCorrection: false,
        annule: false,
        estCorrection: true,
        dateCreation: new Date().toISOString()
      };
      await apiService.ajouter('mouvementsCaisse', mvtCompensation);
      
      if (estCouple && mvtLie) {
        await apiService.modifier('mouvementsCaisse', mvtLie.id, { annule: true });
        const typeLie = mvtLie.type === 'entree' ? 'sortie' : 'entree';
        const mvtCompensationLie = {
          ...mvtCompensation,
          id: crypto.randomUUID(),
          type: typeLie,
          montant: mvtLie.montant,
          devise: mvtLie.devise,
          sousCaisseId: mvtLie.sousCaisseId,
          parentId: mvtLie.id,
          correctionParentId: mvtLie.id,
          designation: 'Annulation (liée)'
        };
        await apiService.ajouter('mouvementsCaisse', mvtCompensationLie);
      }
      
      await this.chargerDonnees();
      this.showCorrectionModal = false;
      alert('Mouvement annulé, compensation ajoutée');
    },

    // ---------- FACTURES ----------
    async mettreAJourFacturePaiement(factureId) {
      const facture = await db.factures.get(factureId);
      if (!facture) return;
      const paiements = await db.mouvementsCaisse.where({ factureId, type: 'entree', status: 'validé' }).toArray();
      const totalPaye = paiements.reduce((sum, p) => sum + (p.montant_converti_facture || 0), 0);
      let nouveauStatut = 'en_attente';
      if (totalPaye >= facture.totalHT) {
        nouveauStatut = 'payée';
      } else if (totalPaye > 0) {
        nouveauStatut = 'partiel';
      }
      if (facture.statutPaiement !== nouveauStatut) {
        await apiService.modifier('factures', factureId, { statutPaiement: nouveauStatut, dateDernierPaiement: new Date().toISOString() });
      }
    },

    // ---------- SALAIRES (MULTIDEVISE) ----------
    async ouvrirPaiementSalaires() {
      const all = await db.travailleurs.toArray();
      this.travailleursActifs = all.filter(t => t.actif === true);
      this.paiementSalaires = {
        travailleurId: null,
        type: 'avance_mois',
        montant: 0,
        moisConcerne: new Date().toISOString().slice(0,7),
        libellePrime: '',
      };
      this.primeSelectionnee = null;
      this.primesTravailleur = [];
      this.avancesMoisConverties = 0;
      this.remboursementsMoisConverties = 0;
      this.totalPrimesConverties = 0;
      this.montantSuspension = 0;
      this.salaireTravailleurConverti = 0;
      this.soldeEstime = 0;
      this.showPaiementSalairesModal = true;
    },
    async onTravailleurChange() {
      if (!this.paiementSalaires.travailleurId) {
        this.resetSalairesValues();
        return;
      }
      const toutesLesPrimes = await db.primes.where({ travailleur_id: this.paiementSalaires.travailleurId }).toArray();
      this.primesTravailleur = toutesLesPrimes.filter(p => !p.payee);
      this.calculerSoldeEstime();
    },
    resetSalairesValues() {
      this.avancesMoisConverties = 0;
      this.remboursementsMoisConverties = 0;
      this.totalPrimesConverties = 0;
      this.montantSuspension = 0;
      this.salaireTravailleurConverti = 0;
      this.soldeEstime = 0;
    },
    onPrimeChange() {
      const prime = this.primesTravailleur.find(p => p.id === this.primeSelectionnee);
      if (prime) {
        this.paiementSalaires.libellePrime = prime.libelle;
        this.paiementSalaires.montant = prime.montant;
      }
    },
    onTypeChangeSalaires() {
      this.calculerSoldeEstime();
    },
    async calculerSoldeEstime() {
      if (!this.paiementSalaires.travailleurId || !this.paiementSalaires.moisConcerne) {
        this.soldeEstime = 0;
        return;
      }
      const travailleur = this.travailleursActifs.find(t => t.id === this.paiementSalaires.travailleurId);
      if (!travailleur) return;

      const [annee, mois] = this.paiementSalaires.moisConcerne.split('-').map(Number);
      const deviseSalaire = travailleur.devise_salaire || 'CDF';
      const taux = await this.getTauxPourDate(new Date().toISOString().slice(0,10));

      let salaireBrut = travailleur.salaire_actuel || 0;
      this.salaireTravailleurConverti = this.convertirMontant(salaireBrut, deviseSalaire, this.deviseActive, taux);

      // Avances du mois
      const avances = await db.avances.where({ travailleur_id: travailleur.id, mois_concerne: this.paiementSalaires.moisConcerne, type: 'mois' }).toArray();
      this.avancesMoisConverties = avances.reduce((s, a) => s + this.convertirMontant(a.montant, deviseSalaire, this.deviseActive, taux), 0);

      // Remboursements du mois
      const remboursements = await db.remboursements_avances.where('mois_remboursement').equals(this.paiementSalaires.moisConcerne).toArray();
      this.remboursementsMoisConverties = remboursements.reduce((s, r) => s + this.convertirMontant(r.montant_rembourse, deviseSalaire, this.deviseActive, taux), 0);

      // Suspensions
      const suspension = await db.presence_suspension.where({ travailleur_id: travailleur.id, annee, mois }).first();
      const joursSuspension = suspension ? suspension.jours_suspension : 0;
      const salaireJournalier = salaireBrut / this.paramsConges.joursOuvrablesMois;
      let montantSuspensionBrut = salaireJournalier * joursSuspension;
      
      // Convertir en devise active
      let montantSuspensionConverti = this.convertirMontant(montantSuspensionBrut, deviseSalaire, this.deviseActive, taux);
      
      // Appliquer l'arrondi à la centaine inférieure SEULEMENT si la devise active est CDF
      if (this.deviseActive === 'CDF') {
        montantSuspensionConverti = this.arrondirCentaineInferieure(montantSuspensionConverti);
      }
      this.montantSuspension = montantSuspensionConverti;

      // Primes
      const primes = await db.primes.where({ travailleur_id: travailleur.id, annee, mois }).toArray();
      this.totalPrimesConverties = primes.reduce((s, p) => s + this.convertirMontant(p.montant, p.devise || 'CDF', this.deviseActive, taux), 0);

      // Salaire déjà payé
      const posteNom = `Salaire - ${travailleur.departement}`;
      const mouvementsSemaine = this.mouvementsSemaine.filter(m => m.posteBudgetaire === posteNom && m.designation.includes(travailleur.nom));
      const dejaPaye = mouvementsSemaine.reduce((s, m) => s + m.montant, 0);

      const salaireProrata = this.salaireTravailleurConverti - this.montantSuspension;
      this.soldeEstime = salaireProrata - this.avancesMoisConverties - this.remboursementsMoisConverties + this.totalPrimesConverties - dejaPaye;
    },
    convertirMontant(montant, deviseSource, deviseCible, taux) {
      if (deviseSource === deviseCible) return montant;
      if (deviseSource === 'USD' && deviseCible === 'CDF') return montant * taux;
      if (deviseSource === 'CDF' && deviseCible === 'USD') return montant / taux;
      return montant;
    },
    async getTauxPourDate(dateStr) {
      const taux = await db.taux_change.where('date').equals(dateStr).first();
      if (taux) return taux.taux;
      const tauxAvant = await db.taux_change.where('date').below(dateStr).last();
      return tauxAvant ? tauxAvant.taux : 2500;
    },
    ouvrirEcheancier() {
      const montantTotal = this.parseMontant(this.paiementSalaires.montant);
      if (!montantTotal || montantTotal <= 0) {
        alert('Veuillez d\'abord saisir un montant total');
        return;
      }
      const aujourdhui = new Date();
      let annee = aujourdhui.getFullYear();
      let mois = aujourdhui.getMonth() + 2;
      this.echeancier = [];
      this.totalEcheancier = 0;
      for (let i = 0; i < 12; i++) {
        if (mois > 12) { mois = 1; annee++; }
        const moisStr = `${annee}-${mois.toString().padStart(2,'0')}`;
        this.echeancier.push({ mois: moisStr, montant: '' });
        mois++;
      }
      this.showEcheancierModal = true;
      this.$nextTick(() => {
        this.calculerTotalEcheancier();
      });
    },
    calculerTotalEcheancier() {
      this.totalEcheancier = this.echeancier.reduce((sum, e) => sum + (this.parseMontant(e.montant) || 0), 0);
    },
    validerEcheancier() {
      const montantTotal = this.parseMontant(this.paiementSalaires.montant);
      if (Math.abs(this.totalEcheancier - montantTotal) > 0.01) {
        alert('Le total de l\'échéancier doit correspondre au montant de l\'avance');
        return;
      }
      this.showEcheancierModal = false;
    },
    async validerPaiementSalaires() {
      if (!this.paiementSalaires.travailleurId) {
        alert("Veuillez sélectionner un travailleur.");
        return;
      }
      const travailleur = this.travailleursActifs.find(t => t.id === this.paiementSalaires.travailleurId);
      if (!travailleur) {
        alert("Travailleur introuvable.");
        return;
      }

      const posteNom = `Salaire - ${travailleur.departement}`;
      let posteSalaire = await db.postes_budgetaires.where('nom').equals(posteNom).first();
      if (!posteSalaire) {
        const create = confirm(`Le poste budgétaire "${posteNom}" n'existe pas. Voulez-vous le créer automatiquement ?`);
        if (!create) return;
        const nouveauPoste = {
          nom: posteNom,
          type: 'sortie',
          lieFacture: false,
          estRetraitBancaire: false,
          actif: true,
          systeme: true
        };
        const posteId = await apiService.ajouter('postes_budgetaires', nouveauPoste);
        posteSalaire = { id: posteId, nom: posteNom };
      }

      let montant = 0;
      let designation = `${travailleur.nom} ${travailleur.prenom} - `;
      let avanceId = crypto.randomUUID();
      let primeId = null;

      switch (this.paiementSalaires.type) {
        case 'avance_mois': {
          montant = this.parseMontant(this.paiementSalaires.montant);
          if (isNaN(montant) || montant <= 0) {
            alert("Montant invalide.");
            return;
          }
          const disponible = this.soldeEstime + this.avancesMoisConverties + this.remboursementsMoisConverties;
          if (montant > disponible) {
            alert(`L'avance demandée (${this.formatMontant(montant, this.deviseActive)}) dépasse le solde disponible (${this.formatMontant(disponible, this.deviseActive)}).`);
            return;
          }
          designation += 'Avance mois';
          break;
        }
        case 'avance_annee': {
          montant = this.parseMontant(this.paiementSalaires.montant);
          if (isNaN(montant) || montant <= 0) {
            alert("Montant invalide.");
            return;
          }
          if (this.totalEcheancier === 0) {
            alert("Veuillez définir l'échéancier de remboursement.");
            return;
          }
          if (Math.abs(this.totalEcheancier - montant) > 0.01) {
            alert(`Le total de l'échéancier (${this.formatMontant(this.totalEcheancier, this.deviseActive)}) ne correspond pas au montant de l'avance (${this.formatMontant(montant, this.deviseActive)}).`);
            return;
          }
          designation += 'Avance année';
          break;
        }
        case 'solde': {
          montant = this.soldeEstime;
          if (montant <= 0) {
            alert("Solde nul ou négatif. Aucun paiement à effectuer.");
            return;
          }
          designation += 'Solde';
          break;
        }
        case 'prime': {
          if (!this.primeSelectionnee) {
            alert("Veuillez sélectionner une prime.");
            return;
          }
          const prime = this.primesTravailleur.find(p => p.id === this.primeSelectionnee);
          if (!prime) {
            alert("Prime introuvable.");
            return;
          }
          montant = this.convertirMontant(prime.montant, prime.devise || 'CDF', this.deviseActive, await this.getTauxPourDate(new Date().toISOString().slice(0,10)));
          designation += `Prime: ${prime.libelle}`;
          primeId = prime.id;
          break;
        }
        default:
          alert("Type de paiement inconnu.");
          return;
      }

      if (montant > 0 && !this.verifierSoldeSuffisant(montant)) {
        alert('Solde insuffisant pour effectuer ce paiement.');
        return;
      }

      const dateJour = new Date().toISOString().slice(0,10);
      const { montant_cdf, montant_usd } = await convertirMontants(montant, this.deviseActive, dateJour);

      const mouvementData = {
        caisseId: this.caisseActiveId,
        sousCaisseId: this.sousCaisseActiveId,
        semaineId: this.semaineCouranteId,
        date: dateJour,
        type: 'sortie',
        montant: montant,
        devise: this.deviseActive,
        montant_cdf,
        montant_usd,
        posteBudgetaire: posteSalaire.nom,
        factureId: null,
        justificatif: `Paiement ${designation}`,
        commentaire: `Travailleur: ${travailleur.nom} ${travailleur.prenom}`,
        designation: designation,
        status: 'validé',
        aJustifier: false,
        parentId: null,
        correctionParentId: null,
        typeCorrection: null,
        remplaceParCorrection: false,
        annule: false,
        estCorrection: false,
        dateCreation: new Date().toISOString()
      };

      try {
        // Créer le mouvement
        const mouvementId = await apiService.ajouter('mouvementsCaisse', mouvementData, { audit: true });

        // Créer l'avance ou le remboursement lié
        if (this.paiementSalaires.type === 'avance_mois') {
          await db.avances.add({
            id: avanceId,
            travailleur_id: travailleur.id,
            type: 'mois',
            mois_concerne: this.paiementSalaires.moisConcerne,
            montant: this.convertirMontant(montant, this.deviseActive, travailleur.devise_salaire || 'CDF', await this.getTauxPourDate(dateJour)),
            date_avance: dateJour,
            statut: 'paye',
            mouvementCaisseId: mouvementId
          });
        } else if (this.paiementSalaires.type === 'avance_annee') {
          const avanceData = {
            id: avanceId,
            travailleur_id: travailleur.id,
            type: 'annee',
            mois_concerne: null,
            montant: this.convertirMontant(montant, this.deviseActive, travailleur.devise_salaire || 'CDF', await this.getTauxPourDate(dateJour)),
            date_avance: dateJour,
            statut: 'en_cours',
            nb_mois_remboursement: this.echeancier.filter(e => this.parseMontant(e.montant) > 0).length,
            mouvementCaisseId: mouvementId
          };
          await db.avances.add(avanceData);
          for (let e of this.echeancier) {
            const montantEch = this.parseMontant(e.montant);
            if (montantEch > 0) {
              await db.remboursements_avances.add({
                id: crypto.randomUUID(),
                avance_id: avanceId,
                mois_remboursement: e.mois,
                montant_rembourse: this.convertirMontant(montantEch, this.deviseActive, travailleur.devise_salaire || 'CDF', await this.getTauxPourDate(dateJour))
              });
            }
          }
        }

        if (this.paiementSalaires.type === 'prime' && primeId) {
          await apiService.modifier('primes', primeId, { payee: true });
        }

        alert("Paiement enregistré avec succès.");
        this.showPaiementSalairesModal = false;
        await this.chargerDonnees();
      } catch (error) {
        console.error(error);
        alert('Erreur lors de l\'enregistrement du paiement.');
      }
    },
  }
};
</script>