<template>
  <div class="container-fluid">
    <h2 class="mb-4" style="color: #ED1C24;">Factures</h2>

    <!-- Onglets Factures Huile / Autres -->
    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <a class="nav-link" :class="{ active: typeFacture === 'huile' }" href="#"
           @click.prevent="typeFacture = 'huile'">
          <i class="bi bi-droplet"></i> Factures huile
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" :class="{ active: typeFacture === 'autre' }" href="#"
           @click.prevent="typeFacture = 'autre'">
          <i class="bi bi-file-earmark-text"></i> Autres factures
        </a>
      </li>
    </ul>

    <!-- ==================== FACTURATION HUILE ==================== -->
    <div v-if="typeFacture === 'huile'">
      <div class="mb-3">
        <button class="btn btn-primary" @click="showForm = true" v-if="!showForm">Nouvelle facture</button>
        <button class="btn btn-secondary" @click="showForm = false" v-if="showForm">Annuler</button>
      </div>

      <!-- Formulaire de création / modification (huile) -->
      <div v-if="showForm" class="card mb-4" ref="formulaireFacture">
        <div class="card-header">
          <i class="bi bi-plus-circle"></i> {{ factureEnEdition ? 'Modifier la facture' : 'Nouvelle facture' }}
        </div>
        <div class="card-body">
          <form @submit.prevent="sauvegarderFacture">
            <div class="row">
              <div class="col-md-4 mb-3">
                <label>Client</label>
                <select class="form-select" v-model="nouvelleFacture.clientId" required>
                  <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.nom }}</option>
                </select>
              </div>
              <div class="col-md-4 mb-3">
                <label>Vendeur</label>
                <select class="form-select" v-model="nouvelleFacture.vendeurId" required>
                  <option v-for="v in vendeurs" :key="v.id" :value="v.id">{{ v.nom }}</option>
                </select>
              </div>
              <div class="col-md-4 mb-3">
                <label>Stock concerné</label>
                <select class="form-select" v-model="nouvelleFacture.siteId" required>
                  <option v-for="s in sites" :key="s.id" :value="s.id">{{ s.nom }}</option>
                </select>
              </div>
            </div>
            <div class="row">
              <div class="col-md-3 mb-3">
                <label>Date</label>
                <input type="date" class="form-control" v-model="nouvelleFacture.date" required>
              </div>
              <div class="col-md-3 mb-3">
                <label>Devise</label>
                <select class="form-select" v-model="nouvelleFacture.devise" required @change="onDeviseChange">
                  <option value="USD">USD</option>
                  <option value="CDF">CDF</option>
                </select>
              </div>
              <div class="col-md-3 mb-3">
                <label>Tarif</label>
                <select class="form-select" v-model="nouvelleFacture.tarif" required>
                  <option value="">-- Sélectionner --</option>
                  <option v-for="t in tarifsFiltres" :key="t.code" :value="t.code">{{ t.code }} ({{ t.devise }})</option>
                </select>
              </div>
              <div class="col-md-3 mb-3">
                <label>Échéance</label>
                <select class="form-select" v-model="nouvelleFacture.echeance">
                  <option value="livraison">Paiement à la livraison</option>
                  <option value="30j">Paiement à 30 jours</option>
                  <option value="60j">Paiement à 60 jours</option>
                  <option value="90j">Paiement à 90 jours</option>
                </select>
              </div>
            </div>
            <div class="row">
              <div class="col-md-3 mb-3">
                <label>Remise</label>
                <div class="input-group">
                  <input type="number" step="0.01" class="form-control" v-model.number="nouvelleFacture.remiseMontant" placeholder="Montant">
                  <select class="form-select" style="max-width: 100px;" v-model="nouvelleFacture.remiseType">
                    <option value="percent">%</option>
                    <option value="amount">Montant</option>
                  </select>
                </div>
                <small class="text-muted" v-if="nouvelleFacture.remiseType === 'percent'">Saisir le pourcentage</small>
                <small class="text-muted" v-else>Saisir le montant en {{ nouvelleFacture.devise }}</small>
              </div>
            </div>

            <h5>Lignes de facture</h5>
            <div class="table-responsive">
              <table class="table table-bordered">
                <thead>
                  <tr>
                    <th>Conditionnement</th>
                    <th>Quantité</th>
                    <th>Prix unitaire</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(ligne, idx) in nouvelleFacture.lignes" :key="idx">
                    <td class="text-start">
                      <select class="form-select" v-model="ligne.conditionnementId" required @change="majPrixUnitaire(ligne)">
                        <option v-for="cond in conditionnements" :key="cond.id" :value="cond.id">{{ cond.nom }} ({{ cond.capaciteL }}L)</option>
                      </select>
                    </td>
                    <td class="text-end"><input type="number" class="form-control text-end" v-model.number="ligne.quantite" min="1" required @input="calculerTotalLigne(ligne)"></td>
                    <td class="text-end"><input type="number" step="0.01" class="form-control text-end" v-model.number="ligne.prixUnitaire" readonly></td>
                    <td class="text-end">{{ formatMontant(ligne.prixTotal, nouvelleFacture.devise) }}</td>
                    <td class="text-center"><button type="button" class="btn btn-sm btn-danger" @click="supprimerLigneFacture(idx)">🗑️</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button type="button" class="btn btn-secondary mb-3" @click="ajouterLigneFacture">Ajouter une ligne</button>

            <div class="row">
              <div class="col-md-4 offset-md-8">
                <table class="table table-sm">
                  <tbody>
                    <tr><th>Sous-total</th><td class="text-end">{{ formatMontant(sousTotal, nouvelleFacture.devise) }}</td></tr>
                    <tr>
                      <th>Remise</th>
                      <td class="text-end" v-if="nouvelleFacture.remiseType === 'percent'">{{ nouvelleFacture.remiseMontant || 0 }}% ({{ formatMontant(remiseValeur, nouvelleFacture.devise) }})</td>
                      <td class="text-end" v-else>{{ formatMontant(nouvelleFacture.remiseMontant || 0, nouvelleFacture.devise) }}</td>
                    </tr>
                    <tr><th>Total</th><td class="text-end">{{ formatMontant(totalTTC, nouvelleFacture.devise) }}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <button type="submit" class="btn btn-success">{{ factureEnEdition ? 'Mettre à jour' : 'Créer facture' }}</button>
            <button type="button" class="btn btn-secondary ms-2" v-if="factureEnEdition" @click="annulerEdition">Annuler</button>
          </form>
        </div>
      </div>
    </div>

    <!-- ==================== FACTURATION AUTRE ==================== -->
    <div v-if="typeFacture === 'autre'">
      <div class="mb-3">
        <button class="btn btn-primary" @click="showForm = true" v-if="!showForm">Nouvelle facture</button>
        <button class="btn btn-secondary" @click="showForm = false" v-if="showForm">Annuler</button>
      </div>

      <div v-if="showForm" class="card mb-4">
        <div class="card-header">
          <i class="bi bi-plus-circle"></i> Nouvelle facture (autre)
        </div>
        <div class="card-body">
          <form @submit.prevent="sauvegarderFactureAutre">
            <div class="row">
              <div class="col-md-4 mb-3">
                <label>Client</label>
                <select class="form-select" v-model="nouvelleFactureAutre.clientId" required>
                  <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.nom }}</option>
                </select>
              </div>
              <div class="col-md-4 mb-3">
                <label>Poste budgétaire</label>
                <select class="form-select" v-model="nouvelleFactureAutre.posteBudgetaireId" required>
                  <option v-for="p in postesAutres" :key="p.id" :value="p.id">{{ p.nom }}</option>
                </select>
              </div>
              <div class="col-md-4 mb-3">
                <label>Date</label>
                <input type="date" class="form-control" v-model="nouvelleFactureAutre.date" required>
              </div>
            </div>
            <div class="row">
              <div class="col-md-4 mb-3">
                <label>Devise</label>
                <select class="form-select" v-model="nouvelleFactureAutre.devise" required>
                  <option value="USD">USD</option>
                  <option value="CDF">CDF</option>
                </select>
              </div>
              <div class="col-md-4 mb-3">
                <label>Échéance</label>
                <select class="form-select" v-model="nouvelleFactureAutre.echeance">
                  <option value="livraison">Paiement à la livraison</option>
                  <option value="30j">Paiement à 30 jours</option>
                  <option value="60j">Paiement à 60 jours</option>
                  <option value="90j">Paiement à 90 jours</option>
                </select>
              </div>
            </div>

            <h5>Lignes</h5>
            <table class="table table-bordered">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantité</th>
                  <th>Prix unitaire</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(ligne, idx) in nouvelleFactureAutre.lignes" :key="idx">
                  <td><input type="text" class="form-control" v-model="ligne.libelle" required></td>
                  <td><input type="number" class="form-control" v-model.number="ligne.quantite" min="1" required></td>
                  <td><input type="number" step="0.01" class="form-control" v-model.number="ligne.prixUnitaire" required></td>
                  <td class="text-end">{{ formatMontant(ligne.quantite * ligne.prixUnitaire, nouvelleFactureAutre.devise) }}</td>
                  <td><button type="button" class="btn btn-sm btn-danger" @click="supprimerLigneAutre(idx)">🗑️</button></td>
                </tr>
              </tbody>
            </table>
            <button type="button" class="btn btn-secondary mb-3" @click="ajouterLigneAutre">Ajouter une ligne</button>

            <div class="row">
              <div class="col-md-4 offset-md-8">
                <table class="table table-sm">
                  <tbody>
                    <tr><th>Total</th><td class="text-end">{{ formatMontant(totalAutre, nouvelleFactureAutre.devise) }}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <button type="submit" class="btn btn-success">Créer facture</button>
            <button type="button" class="btn btn-secondary ms-2" @click="showForm = false">Annuler</button>
          </form>
        </div>
      </div>
    </div>

    <!-- ==================== LISTE DES FACTURES ==================== -->
    <div class="card" v-if="(!showForm || (typeFacture === 'huile' && showForm) === false) ? true : false">
      <div class="card-header">
        <i class="bi bi-list"></i> Liste des factures {{ typeFacture === 'huile' ? 'd\'huile' : 'autres' }}
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th @click="tri('numero')" style="cursor: pointer;">N° <i v-if="triColonne === 'numero'" :class="triOrdre === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i></th>
                <th @click="tri('date')" style="cursor: pointer;">Date <i v-if="triColonne === 'date'" :class="triOrdre === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i></th>
                <th @click="tri('clientNom')" style="cursor: pointer;">Client <i v-if="triColonne === 'clientNom'" :class="triOrdre === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i></th>
                <th v-if="typeFacture === 'huile'" @click="tri('vendeurNom')" style="cursor: pointer;">Vendeur <i v-if="triColonne === 'vendeurNom'" :class="triOrdre === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i></th>
                <th v-if="typeFacture === 'huile'" @click="tri('tarif')" style="cursor: pointer;">Tarif <i v-if="triColonne === 'tarif'" :class="triOrdre === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i></th>
                <th @click="tri('totalHT')" style="cursor: pointer;">Total <i v-if="triColonne === 'totalHT'" :class="triOrdre === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i></th>
                <th @click="tri('devise')" style="cursor: pointer;">Devise <i v-if="triColonne === 'devise'" :class="triOrdre === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i></th>
                <th @click="tri('statutPaiement')" style="cursor: pointer; width: 120px;">Paiement <i v-if="triColonne === 'statutPaiement'" :class="triOrdre === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i></th>
                <th v-if="typeFacture === 'huile'" @click="tri('statutLivraison')" style="cursor: pointer;">Livraison <i v-if="triColonne === 'statutLivraison'" :class="triOrdre === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i></th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="f in facturesTriees" :key="f.id">
                <td class="text-start">{{ f.numero }}</td>
                <td class="text-start">{{ formatDate(f.date) }}</td>
                <td class="text-start">{{ getClientNom(f.clientId) }}</td>
                <td v-if="typeFacture === 'huile'" class="text-start">{{ getVendeurNom(f.vendeurId) }}</td>
                <td v-if="typeFacture === 'huile'" class="text-center">{{ f.tarif || '-' }}</td>
                <td class="text-center">{{ formatMontant(f.totalHT, f.devise) }}</td>
                <td class="text-center">{{ f.devise }}</td>
                <td class="text-start"><span class="badge" :class="getPaiementClass(f)">{{ getPaiementLabel(f) }}</span></td>
                <td v-if="typeFacture === 'huile'" class="text-start"><span class="badge" :class="getLivraisonClass(f)">{{ getLivraisonLabel(f) }}</span></td>
                <td class="text-nowrap">
                    <div class="btn-group" role="group">
                      <button class="btn btn-info" @click="voirFacture(f.id)" title="Voir"><i class="bi bi-eye"></i></button>
                      <template v-if="typeFacture === 'huile'">
                        <button class="btn btn-warning" @click="modifierFacture(f.id)" title="Modifier la facture"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-danger" @click="supprimerFacture(f.id)" title="Supprimer la facture"><i class="bi bi-trash"></i></button>
                        <button v-if="f.statutLivraison !== 'livrée' && !f.blSelectionne" class="btn btn-primary" @click="creerBL(f.id)" title="Créer le BL"><i class="bi bi-file-earmark-plus"></i></button>
                        <button v-else-if="f.statutLivraison !== 'livrée' && f.blSelectionne" class="btn btn-warning" @click="modifierBL(f.id)" title="Modifier le BL"><i class="bi bi-pencil-square"></i></button>
                        <button v-if="f.statutLivraison === 'a_livrer' && f.blSelectionne" class="btn btn-success" @click="confirmerLivraison(f.id)" title="Confirmer la livraison"><i class="bi bi-check-circle"></i></button>
                        <button v-if="f.statutLivraison === 'livrée'" class="btn btn-danger" @click="annulerLivraison(f.id)" title="Annuler la livraison"><i class="bi bi-arrow-counterclockwise"></i></button>
                        <button class="btn btn-secondary" @click="imprimerFacture(f.id)" title="Imprimer facture"><i class="bi bi-printer"></i></button>
                        <button class="btn btn-secondary" @click="imprimerBL(f.id)" title="Imprimer BL"><i class="bi bi-truck"></i></button>
                      </template>
                      <template v-else>
                        <button class="btn btn-secondary" @click="imprimerFacture(f.id)" title="Imprimer facture"><i class="bi bi-printer"></i></button>
                      </template>
                    </div>
                  </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <div v-if="factureDetail" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Facture {{ factureDetail.numero }}</h5>
            <button type="button" class="btn-close" @click="factureDetail = null"></button>
          </div>
          <div class="modal-body">
            <div class="row mb-3">
              <div class="col-md-6"><strong>Client :</strong> {{ getClientNom(factureDetail.clientId) }}</div>
              <div class="col-md-6"><strong>Vendeur :</strong> {{ getVendeurNom(factureDetail.vendeurId) }}</div>
              <div class="col-md-6"><strong>Date :</strong> {{ formatDate(factureDetail.date) }}</div>
              <div class="col-md-6"><strong>Devise :</strong> {{ factureDetail.devise }}</div>
              <div class="col-md-6"><strong>Tarif :</strong> {{ factureDetail.tarif || '-' }}</div>
              <div class="col-md-6"><strong>Échéance :</strong> {{ getEcheanceLabel(factureDetail) }}</div>
              <div class="col-md-6"><strong>Paiement :</strong> 
                <span :class="getPaiementClass(factureDetail)">{{ getPaiementLabel(factureDetail) }}</span>
                <span v-if="factureDetail.statutPaiement === 'partiel'" class="badge bg-warning ms-2">Partiel</span>
              </div>
              <div class="col-md-6"><strong>Livraison :</strong> <span :class="getLivraisonClass(factureDetail)">{{ getLivraisonLabel(factureDetail) }}</span></div>
            </div>

            <h6>Lignes de facture</h6>
            <table class="table table-sm">
              <thead>
                <tr><th>Conditionnement</th><th>Quantité</th><th>Prix unitaire</th><th>Total</th></tr>
              </thead>
              <tbody>
                <tr v-for="l in factureLignes" :key="l.id">
                  <td class="text-start">{{ getConditionnementNom(l.conditionnementId) }}</td>
                  <td class="text-end">{{ l.quantite }}</td>
                  <td class="text-end">{{ formatMontant(l.prixUnitaire, factureDetail.devise) }}</td>
                  <td class="text-end">{{ formatMontant(l.prixTotal, factureDetail.devise) }}</td>
                </tr>
              </tbody>
            </table>

            <div class="text-end">
              <p><strong>Sous-total :</strong> {{ formatMontant(sousTotalDetail, factureDetail.devise) }}</p>
              <p><strong>Remise :</strong> {{ factureDetail.remise }}% ({{ formatMontant(remiseMontantDetail, factureDetail.devise) }})</p>
              <p><strong>Total :</strong> {{ formatMontant(factureDetail.totalHT, factureDetail.devise) }}</p>
            </div>

            <div class="mt-4">
              <h6>Paiements enregistrés</h6>
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Montant</th>
                    <th>Devise</th>
                    <th>Justificatif</th>
                    <th>Semaine caisse</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in paiementsFacture" :key="p.id">
                    <td>{{ formatDate(p.date) }}</td>
                    <td class="text-end">{{ formatMontant(p.montantConverti, factureDetail.devise) }}</td>
                    <td>{{ p.devise }}</td>
                    <td>{{ p.justificatif || '-' }}</td>
                    <td>{{ getSemaineCaisse(p.semaineId) }}</td>
                  </tr>
                  <tr v-if="paiementsFacture.length === 0">
                    <td colspan="5" class="text-center">Aucun paiement enregistré</td>
                  </tr>
                </tbody>
              </table>
              <p><strong>Total payé :</strong> {{ formatMontant(totalPaye, factureDetail.devise) }} / {{ formatMontant(factureDetail.totalHT, factureDetail.devise) }}</p>
              <p v-if="factureDetail.statutPaiement === 'partiel'" class="text-warning">
                <i class="bi bi-exclamation-triangle"></i> Paiement partiel – reste {{ formatMontant(factureDetail.totalHT - totalPaye, factureDetail.devise) }}
              </p>
            </div>

          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="factureDetail = null">Fermer</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showRetourModal" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5>Retour de contenants - Facture {{ facturePourRetour?.numero }}</h5>
            <button type="button" class="btn-close" @click="showRetourModal = false"></button>
          </div>
          <div class="modal-body">
            <p>Indiquez combien de conditionnements ont été retournés :</p>
            <table class="table table-sm">
              <thead><tr><th>Conditionnement</th><th>Quantité vendue</th><th>Quantité retournée</th></tr></thead>
              <tbody>
                <tr v-for="(ligne, idx) in retourLignes" :key="idx">
                  <td>{{ ligne.nom }}</td>
                  <td>{{ ligne.quantite }}</td>
                  <td><input type="number" class="form-control" v-model.number="ligne.retourne" min="0" :max="ligne.quantite"></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showRetourModal = false">Ignorer</button>
            <button class="btn btn-primary" @click="enregistrerRetours">Enregistrer</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de sélection des lots (création/modification BL) -->
    <div v-if="factureBLOpen" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ blEnCreation ? 'Créer le bon de livraison' : 'Modifier le bon de livraison' }} - Facture {{ factureCourante?.numero }}</h5>
            <button type="button" class="btn-close" @click="factureBLOpen = false"></button>
          </div>
          <div class="modal-body">
            <p>Sélectionnez les lots à livrer pour chaque ligne :</p>
            <table class="table table-bordered">
              <thead>  <tr><th>Conditionnement</th><th>Quantité facturée</th><th>Lot</th></tr> </thead>
              <tbody>
                <tr v-for="(ligne, idx) in lignesBL" :key="idx">
                  <td class="text-start">{{ getConditionnementNom(ligne.conditionnementId) }}</td>
                  <td class="text-end">{{ ligne.quantiteFacturee }}</td>
                  <td class="text-start">
                    <select class="form-select" v-model="ligne.lotId" required>
                      <option value="">-- Choisir un lot --</option>
                      <option v-for="lot in lotsDisponibles(ligne.conditionnementId)" :key="lot.id" :value="lot.id">
                        {{ lot.numero }} (stock: {{ lot.stockDisponible }})
                      </option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="factureBLOpen = false">Annuler</button>
            <button class="btn btn-success" @click="enregistrerBL">Enregistrer</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de confirmation de livraison -->
    <div v-if="factureConfirmation" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirmer la livraison</h5>
            <button type="button" class="btn-close" @click="factureConfirmation = null"></button>
          </div>
          <div class="modal-body">
            <p>Facture {{ factureConfirmation.numero }}</p>
            <div class="mb-3">
              <label>Date de livraison</label>
              <input type="date" class="form-control" v-model="dateLivraison" required>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="factureConfirmation = null">Annuler</button>
            <button class="btn btn-success" @click="validerLivraison">Confirmer</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from '../db';
import apiService from '../services/api';
import { hasPermission } from '../utils/permissions';
import notificationService from '../services/notificationService';

export default {
  name: 'Factures',
  data() {
    return {
      showForm: false,
      clients: [],
      vendeurs: [],
      sites: [],
      conditionnements: [],          // remplace typesContenants
      tarifs: [],
      factures: [],
      paiementsFacture: [],
      totalPaye: 0,
      semainesCaisse: [],
      factureLignes: [],
      factureDetail: null,
      factureBLOpen: false,
      factureConfirmation: null,
      factureCourante: null,
      lignesBL: [],
      blEnCreation: true,
      dateLivraison: new Date().toISOString().slice(0, 10),
      triColonne: 'numero',
      triOrdre: 'desc',
      stocksCache: [],
      lotsCache: [],
      coordonnees: { nom: '', adresse: '', telephone: '', email: '', logo: '', legalInfo: '' },
      factureEnEdition: null,
      typeFacture: 'huile',
      nouvelleFactureAutre: {
        clientId: '',
        posteBudgetaireId: '',
        date: new Date().toISOString().slice(0, 10),
        devise: 'USD',
        echeance: 'livraison',
        lignes: []
      },
      nouvelleFacture: {
        clientId: '',
        vendeurId: '',
        siteId: '',
        date: new Date().toISOString().slice(0, 10),
        devise: 'USD',
        tarif: '',
        echeance: 'livraison',
        remiseType: 'amount',
        remiseMontant: 0,
        lignes: []
      },
      showRetourModal: false,
      retourLignes: [],
      facturePourRetour: null,
      articlesFourniture: [],       // pour les retours de conditionnements
      conditionnementComposants: [], // pour retrouver l'article contenant_vide
      stocksFournitures: [],        // pour ajuster les retours
    };
  },
  computed: {
    tarifsFiltres() {
      return this.tarifs.filter(t => t.devise === this.nouvelleFacture.devise);
    },
    sousTotal() {
      return this.nouvelleFacture.lignes.reduce((acc, l) => acc + (l.prixTotal || 0), 0);
    },
    remiseValeur() {
      if (this.nouvelleFacture.remiseType === 'percent')
        return this.sousTotal * (this.nouvelleFacture.remiseMontant / 100);
      else
        return this.nouvelleFacture.remiseMontant || 0;
    },
    totalTTC() {
      return this.sousTotal - this.remiseValeur;
    },
    postesAutres() {
      return this.postesBudgetaires.filter(p => p.typeFacturation === 'autre' && p.actif);
    },
    totalAutre() {
      return this.nouvelleFactureAutre.lignes.reduce((s, l) => s + (l.quantite || 0) * (l.prixUnitaire || 0), 0);
    },
    sousTotalDetail() {
      return this.factureLignes.reduce((acc, l) => acc + l.prixTotal, 0);
    },
    remiseMontantDetail() {
      return this.factureDetail ? this.sousTotalDetail * (this.factureDetail.remise / 100) : 0;
    },
    facturesTriees() {
      let result = [...this.facturesFiltrees];
      const colonne = this.triColonne;
      const ordre = this.triOrdre;

      if (colonne === 'clientNom') {
        result.sort((a, b) => {
          const nomA = this.getClientNom(a.clientId);
          const nomB = this.getClientNom(b.clientId);
          return ordre === 'asc' ? nomA.localeCompare(nomB) : nomB.localeCompare(nomA);
        });
      } else if (colonne === 'vendeurNom') {
        result.sort((a, b) => {
          const nomA = this.getVendeurNom(a.vendeurId);
          const nomB = this.getVendeurNom(b.vendeurId);
          return ordre === 'asc' ? nomA.localeCompare(nomB) : nomB.localeCompare(nomA);
        });
      } else if (colonne === 'statutPaiement') {
        result.sort((a, b) => {
          const labelA = this.getPaiementLabel(a);
          const labelB = this.getPaiementLabel(b);
          return ordre === 'asc' ? labelA.localeCompare(labelB) : labelB.localeCompare(labelA);
        });
      } else if (colonne === 'statutLivraison') {
        result.sort((a, b) => {
          const labelA = this.getLivraisonLabel(a);
          const labelB = this.getLivraisonLabel(b);
          return ordre === 'asc' ? labelA.localeCompare(labelB) : labelB.localeCompare(labelA);
        });
      } else {
        result.sort((a, b) => {
          let valA = a[colonne];
          let valB = b[colonne];
          if (colonne === 'date') { valA = new Date(valA); valB = new Date(valB); }
          if (colonne === 'totalHT') { valA = valA || 0; valB = valB || 0; }
          if (ordre === 'asc') return valA > valB ? 1 : -1;
          else return valA < valB ? 1 : -1;
        });
      }
      return result;
    },
    facturesFiltrees() {
      return this.factures.filter(f => f.typeFacture === this.typeFacture);
    }
  },
  async mounted() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const peutAcceder = await hasPermission(user, 'factures', 'lecture');
    if (!peutAcceder) {
      this.$router.push('/');
      return;
    }
    await this.chargerDonnees();
    await this.chargerCacheStocksLots();
    const coordsReg = await db.reglages.where('cle').equals('coordonnees').first();
    if (coordsReg) this.coordonnees = coordsReg.valeur;

    this.semainesCaisse = await db.semaines_caisse.toArray() || [];
    this.conditionnements = await db.conditionnements.toArray();
    // Charger les données de fournitures pour les retours
    this.articlesFourniture = await db.articles_fourniture.toArray();
    this.conditionnementComposants = await db.conditionnement_composants.toArray();
    this.stocksFournitures = await db.stocks_fournitures.toArray();
  },
  methods: {
    // ===================== CHARGEMENT =====================
    async chargerDonnees() {
      this.clients = await db.clients.toArray() || [];
      const utilisateurs = await db.utilisateurs.toArray() || [];
      const vendeursFiltres = [];
      for (const u of utilisateurs) {
        if (await hasPermission(u, 'clients', 'ecriture')) {
          vendeursFiltres.push(u);
        }
      }
      this.vendeurs = vendeursFiltres;
      this.sites = await db.sites.toArray() || [];
      this.conditionnements = await db.conditionnements.toArray() || [];
      this.tarifs = await db.tarifs.toArray() || [];
      this.factures = await db.factures.toArray() || [];
      this.postesBudgetaires = await db.postes_budgetaires.toArray();
    },
    async chargerCacheStocksLots() {
      this.stocksCache = await db.stocks.toArray() || [];
      this.lotsCache = await db.lots.toArray() || [];
    },

    // ===================== FORMATTAGE =====================
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
    formatDate(dateString) {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('fr-FR');
    },

    // ===================== GESTION LIGNES =====================
    onDeviseChange() {
      this.nouvelleFacture.tarif = '';
    },
    getConditionnementNom(id) {
      const cond = this.conditionnements.find(c => c.id === id);
      return cond ? cond.nom : '-';
    },
    majPrixUnitaire(ligne) {
      if (!this.nouvelleFacture.tarif) return;
      const tarif = this.tarifs.find(t => t.code === this.nouvelleFacture.tarif);
      if (!tarif || !tarif.prixParConditionnement) return;
      ligne.prixUnitaire = tarif.prixParConditionnement[ligne.conditionnementId] || 0;
      this.calculerTotalLigne(ligne);
    },
    calculerTotalLigne(ligne) {
      ligne.prixTotal = ligne.quantite * ligne.prixUnitaire;
    },
    ajouterLigneFacture() {
      this.nouvelleFacture.lignes.push({
        conditionnementId: '',
        quantite: 1,
        prixUnitaire: 0,
        prixTotal: 0
      });
    },
    supprimerLigneFacture(idx) {
      this.nouvelleFacture.lignes.splice(idx, 1);
    },

    // ===================== SAUVEGARDE FACTURE =====================
    async sauvegarderFacture() {
      if (!this.nouvelleFacture.tarif) {
        alert('Veuillez sélectionner un tarif');
        return;
      }
      for (let ligne of this.nouvelleFacture.lignes) {
        if (!ligne.conditionnementId || ligne.quantite <= 0) {
          alert('Veuillez remplir toutes les lignes avec une quantité > 0');
          return;
        }
      }
      const annee = new Date(this.nouvelleFacture.date).getFullYear().toString().slice(-2);
      const count = this.factures.filter(f => f.numero.endsWith(annee)).length + 1;
      const numero = `F${count.toString().padStart(2, '0')}/${annee}`;
      const totalHT = this.totalTTC;
      const dateEcheance = this.calculerDateEcheance(this.nouvelleFacture.date, this.nouvelleFacture.echeance);
      const factureData = {
        numero,
        date: this.nouvelleFacture.date,
        echeance: this.nouvelleFacture.echeance,
        dateEcheance,
        clientId: this.nouvelleFacture.clientId,
        vendeurId: this.nouvelleFacture.vendeurId,
        siteId: this.nouvelleFacture.siteId,
        devise: this.nouvelleFacture.devise,
        tarif: this.nouvelleFacture.tarif,
        remise: this.nouvelleFacture.remiseType === 'percent' ? this.nouvelleFacture.remiseMontant : 0,
        remiseMontant: this.nouvelleFacture.remiseType === 'amount' ? this.nouvelleFacture.remiseMontant : 0,
        remiseType: this.nouvelleFacture.remiseType,
        totalHT,
        statutLivraison: 'a_livrer',
        statutPaiement: 'en_attente',
        blSelectionne: false,
        dateLivraison: null,
        datePaiement: null,
        notes: '',
        dateCreation: new Date().toISOString()
      };
      try {
        let factureId;
        if (this.factureEnEdition) {
          factureId = this.factureEnEdition;
          await apiService.modifier('factures', factureId, factureData, { audit: true });
          await db.facture_lignes.where('factureId').equals(factureId).delete();
          for (let ligne of this.nouvelleFacture.lignes) {
            await apiService.ajouter('facture_lignes', {
              factureId,
              conditionnementId: ligne.conditionnementId,
              quantite: ligne.quantite,
              prixUnitaire: ligne.prixUnitaire,
              prixTotal: ligne.prixTotal,
              remiseLigne: 0
            });
          }
          alert('Facture modifiée');
          this.factureEnEdition = null;
        } else {
          factureId = await apiService.ajouter('factures', factureData, { audit: true });
          for (let ligne of this.nouvelleFacture.lignes) {
            await apiService.ajouter('facture_lignes', {
              factureId,
              conditionnementId: ligne.conditionnementId,
              quantite: ligne.quantite,
              prixUnitaire: ligne.prixUnitaire,
              prixTotal: ligne.prixTotal,
              remiseLigne: 0
            });
          }
          // BL brouillon
          const blNumero = `BL${count.toString().padStart(2, '0')}/${annee}`;
          const blData = {
            numero: blNumero,
            factureId,
            date: this.nouvelleFacture.date,
            siteId: this.nouvelleFacture.siteId,
            statut: 'brouillon',
            vendeurId: this.nouvelleFacture.vendeurId,
            superviseurValidation: null,
            notes: ''
          };
          const blId = await apiService.ajouter('bons_livraison', blData);
          for (let ligne of this.nouvelleFacture.lignes) {
            await apiService.ajouter('bl_lignes', {
              blId,
              lotId: null,
              conditionnementId: ligne.conditionnementId,
              quantiteLivree: ligne.quantite
            });
          }
          await apiService.modifier('factures', factureId, { bonLivraisonId: blId });
          // Notification
          const client = this.clients.find(c => c.id === this.nouvelleFacture.clientId);
          await notificationService.envoyerMessageSysteme('nouvelle_facture', {
            numero: numero,
            client: client?.nom || 'Inconnu',
            total: totalHT,
            devise: this.nouvelleFacture.devise
          }, this.nouvelleFacture.vendeurId);
          alert('Facture créée');
        }
        await this.chargerDonnees();
        this.resetFormulaire();
        this.showForm = false;
      } catch (error) {
        console.error(error);
        alert('Erreur');
      }
    },
    resetFormulaire() {
      this.nouvelleFacture = {
        clientId: '',
        vendeurId: '',
        siteId: '',
        date: new Date().toISOString().slice(0, 10),
        devise: 'USD',
        tarif: '',
        echeance: 'livraison',
        remiseType: 'amount',
        remiseMontant: 0,
        lignes: []
      };
      this.factureEnEdition = null;
    },
    calculerDateEcheance(dateFacture, echeance) {
      if (echeance === 'livraison') return null;
      const d = new Date(dateFacture);
      const jours = parseInt(echeance);
      d.setDate(d.getDate() + jours);
      return d.toISOString().slice(0, 10);
    },

    // ===================== MODIFICATION / SUPPRESSION =====================
    async modifierFacture(id) {
      const facture = await db.factures.get(id);
      if (!facture) return;
      const lignes = await db.facture_lignes.where('factureId').equals(id).toArray();
      this.nouvelleFacture = {
        clientId: facture.clientId,
        vendeurId: facture.vendeurId,
        siteId: facture.siteId,
        date: facture.date,
        devise: facture.devise,
        tarif: facture.tarif,
        echeance: facture.echeance,
        remiseType: facture.remiseType || 'amount',
        remiseMontant: facture.remiseType === 'percent' ? facture.remise : facture.remiseMontant,
        lignes: lignes.map(l => ({
          conditionnementId: l.conditionnementId,
          quantite: l.quantite,
          prixUnitaire: l.prixUnitaire,
          prixTotal: l.prixTotal
        }))
      };
      this.factureEnEdition = id;
      this.showForm = true;
      this.$nextTick(() => {
        this.$refs.formulaireFacture.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    },
    annulerEdition() {
      this.resetFormulaire();
      this.showForm = false;
    },
    async supprimerFacture(id) {
      const facture = await db.factures.get(id);
      if (!facture) return;
      if (facture.statutLivraison === 'livrée') {
        alert('Cette facture a déjà été livrée. Vous devez d\'abord annuler la livraison avant de pouvoir la supprimer.');
        return;
      }
      const paiements = await db.mouvementsCaisse.where({ factureId: id, type: 'entree', status: 'validé' }).toArray();
      if (paiements.length > 0) {
        alert('Cette facture a des paiements enregistrés. Supprimez d\'abord les paiements dans la caisse avant de supprimer la facture.');
        return;
      }
      if (!confirm('Supprimer cette facture ?')) return;
      try {
        if (facture.bonLivraisonId) {
          await apiService.supprimer('bons_livraison', facture.bonLivraisonId);
          await db.bl_lignes.where('blId').equals(facture.bonLivraisonId).delete();
        }
        await apiService.supprimer('factures', id, { audit: true });
        await db.facture_lignes.where('factureId').equals(id).delete();
        await this.chargerDonnees();
        alert('Facture supprimée');
      } catch (error) {
        console.error(error);
        alert('Erreur lors de la suppression');
      }
    },

    // ===================== BON DE LIVRAISON =====================
    async creerBL(factureId) {
      const facture = await db.factures.get(factureId);
      if (!facture || !facture.bonLivraisonId) {
        alert('Aucun bon de livraison associé');
        return;
      }
      const bl = await db.bons_livraison.get(facture.bonLivraisonId);
      if (bl.statut !== 'brouillon') {
        alert('Ce bon de livraison a déjà été traité');
        return;
      }
      const blLignes = await db.bl_lignes.where('blId').equals(bl.id).toArray();
      const factureLignes = await db.facture_lignes.where('factureId').equals(factureId).toArray();
      this.lignesBL = blLignes.map(blLigne => {
        const factLigne = factureLignes.find(fl => fl.conditionnementId === blLigne.conditionnementId);
        return {
          blLigneId: blLigne.id,
          conditionnementId: blLigne.conditionnementId,
          quantiteFacturee: factLigne ? factLigne.quantite : 0,
          lotId: blLigne.lotId || ''
        };
      });
      this.factureCourante = facture;
      this.blEnCreation = true;
      this.factureBLOpen = true;
    },
    async modifierBL(factureId) {
      const facture = await db.factures.get(factureId);
      if (!facture) return;
      const bl = await db.bons_livraison.get(facture.bonLivraisonId);
      const blLignes = await db.bl_lignes.where('blId').equals(bl.id).toArray();
      const factureLignes = await db.facture_lignes.where('factureId').equals(factureId).toArray();
      this.lignesBL = blLignes.map(blLigne => {
        const factLigne = factureLignes.find(fl => fl.conditionnementId === blLigne.conditionnementId);
        return {
          blLigneId: blLigne.id,
          conditionnementId: blLigne.conditionnementId,
          quantiteFacturee: factLigne ? factLigne.quantite : 0,
          lotId: blLigne.lotId || ''
        };
      });
      this.factureCourante = facture;
      this.blEnCreation = false;
      this.factureBLOpen = true;
    },
    async enregistrerBL() {
      for (let ligne of this.lignesBL) {
        if (!ligne.lotId) {
          alert('Veuillez sélectionner un lot pour chaque ligne');
          return;
        }
      }
      try {
        for (let ligne of this.lignesBL) {
          await apiService.modifier('bl_lignes', ligne.blLigneId, { lotId: ligne.lotId }, { audit: true });
        }
        await apiService.modifier('factures', this.factureCourante.id, { blSelectionne: true }, { audit: true });
        await this.chargerDonnees();
        this.factureBLOpen = false;
        alert(this.blEnCreation ? 'Bon de livraison créé' : 'Bon de livraison modifié');
      } catch (error) {
        console.error(error);
        alert('Erreur');
      }
    },

    // ===================== LIVRAISON =====================
    async confirmerLivraison(factureId) {
      const facture = await db.factures.get(factureId);
      if (!facture) return;
      this.factureConfirmation = facture;
      this.dateLivraison = new Date().toISOString().slice(0, 10);
    },
    async validerLivraison() {
      const facture = this.factureConfirmation;
      const bl = await db.bons_livraison.get(facture.bonLivraisonId);
      const blLignes = await db.bl_lignes.where('blId').equals(bl.id).toArray();
      try {
        for (let ligne of blLignes) {
          await this.modifierStock(facture.siteId, ligne.lotId, ligne.conditionnementId, -ligne.quantiteLivree);
        }
        await apiService.modifier('bons_livraison', bl.id, { statut: 'livré' });
        const updateData = {
          statutLivraison: 'livrée',
          dateLivraison: this.dateLivraison
        };
        if (facture.echeance === 'livraison' && facture.paiementStatut !== 'payée') {
          updateData.statutPaiement = 'retard';
        }
        await apiService.modifier('factures', facture.id, updateData);
        const clientNom = this.getClientNom(facture.clientId);
        const mouvementId = await apiService.ajouter('mouvements', {
          type: 'livraison',
          date: this.dateLivraison,
          description: `Livraison facture ${facture.numero}`,
          statut: 'validé',
          notes: `Client : ${clientNom}`
        });
        for (let ligne of blLignes) {
          await apiService.ajouter('mouvement_lignes', {
            mouvementId,
            lotId: ligne.lotId,
            conditionnementId: ligne.conditionnementId,
            quantite: ligne.quantiteLivree,
            siteSource: facture.siteId,
            siteDestination: null
          });
        }
        await this.chargerDonnees();
        if (facture.echeance === 'livraison' && facture.statutPaiement !== 'payée') {
          const jours = Math.floor((new Date() - new Date(facture.date)) / (1000 * 3600 * 24));
          await notificationService.envoyerMessageSysteme('facture_livree_impayee', {
            numero: facture.numero,
            client: clientNom,
            jours_retard: jours
          }, facture.vendeurId);
        }
        await this.chargerCacheStocksLots();
        this.factureConfirmation = null;
        alert('Livraison confirmée, le stock a été réduit');

        // Proposer les retours
        const lignesFacture = await db.facture_lignes.where('factureId').equals(facture.id).toArray();
        const lignesRetour = [];
        for (const ligne of lignesFacture) {
          const cond = this.conditionnements.find(c => c.id === ligne.conditionnementId);
          if (cond && cond.retour_possible) {
            lignesRetour.push({
              conditionnementId: cond.id,
              nom: cond.nom,
              quantite: ligne.quantite,
              retourne: 0
            });
          }
        }
        if (lignesRetour.length > 0) {
          this.retourLignes = lignesRetour;
          this.facturePourRetour = facture;
          this.showRetourModal = true;
        }
      } catch (error) {
        console.error(error);
        alert('Erreur');
      }
    },
    async annulerLivraison(id) {
      if (!confirm('Annuler cette livraison ? Les stocks seront réintégrés.')) return;
      const facture = await db.factures.get(id);
      if (!facture) return;
      const bl = await db.bons_livraison.get(facture.bonLivraisonId);
      const blLignes = await db.bl_lignes.where('blId').equals(bl.id).toArray();
      const mouvementLivraison = await db.mouvements.where('description').equals(`Livraison facture ${facture.numero}`).first();

      try {
        for (let ligne of blLignes) {
          await this.modifierStock(facture.siteId, ligne.lotId, ligne.conditionnementId, ligne.quantiteLivree);
        }
        await apiService.modifier('bons_livraison', bl.id, { statut: 'brouillon' });
        await apiService.modifier('factures', facture.id, {
          statutLivraison: 'a_livrer',
          dateLivraison: null,
          blSelectionne: true
        });
        if (mouvementLivraison) {
          await apiService.supprimer('mouvements', mouvementLivraison.id);
          const lignesMvt = await db.mouvement_lignes.where('mouvementId').equals(mouvementLivraison.id).toArray();
          for (let lm of lignesMvt) {
            await apiService.supprimer('mouvement_lignes', lm.id);
          }
        }
        const mouvementAnnulation = await apiService.ajouter('mouvements', {
          type: 'annulation_livraison',
          date: new Date().toISOString(),
          description: `Annulation livraison facture ${facture.numero}`,
          statut: 'validé',
          notes: `Réintégration des stocks`
        });
        for (let ligne of blLignes) {
          await apiService.ajouter('mouvement_lignes', {
            mouvementId: mouvementAnnulation,
            lotId: ligne.lotId,
            conditionnementId: ligne.conditionnementId,
            quantite: ligne.quantiteLivree,
            siteSource: null,
            siteDestination: facture.siteId
          });
        }
        await this.chargerDonnees();
        await this.chargerCacheStocksLots();
        alert('Livraison annulée et stocks réintégrés');
      } catch (error) {
        console.error(error);
        alert('Erreur lors de l\'annulation');
      }
    },

    // ===================== STOCKS =====================
    async modifierStock(siteId, lotId, conditionnementId, delta) {
      let stock = await db.stocks.where({ siteId, lotId, conditionnementId }).first();
      if (stock) {
        stock.quantite += delta;
        if (stock.quantite < 0) stock.quantite = 0;
        await db.stocks.update(stock.id, stock);
        try {
          await apiService.api.put('/api/stocks/update', {
            siteId, lotId, conditionnementId,
            quantite: stock.quantite
          });
        } catch (error) {
          console.error("Erreur mise à jour serveur", error);
        }
      } else if (delta > 0) {
        const newStock = {
          siteId, lotId, conditionnementId,
          quantite: delta,
          id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()
        };
        await db.stocks.add(newStock);
        try {
          await apiService.api.post('/api/stocks', newStock);
        } catch (error) {
          console.error("Erreur création serveur", error);
        }
      }
      await this.chargerDonnees();
    },
    lotsDisponibles(conditionnementId) {
      const siteId = this.factureCourante?.siteId;
      if (!siteId) return [];
      const stocks = this.stocksCache.filter(s => s.siteId === siteId && s.conditionnementId === conditionnementId && s.quantite > 0);
      const lots = [];
      for (let s of stocks) {
        const lot = this.lotsCache.find(l => l.id === s.lotId);
        if (lot) {
          lots.push({
            id: lot.id,
            numero: lot.numero,
            stockDisponible: s.quantite
          });
        }
      }
      return lots;
    },

    // ===================== RETOURS =====================
    async enregistrerRetours() {
      for (const ligne of this.retourLignes) {
        if (ligne.retourne > 0) {
          const composants = this.conditionnementComposants.filter(c => c.conditionnement_id === ligne.conditionnementId);
          let articleId = null;
          for (const comp of composants) {
            const article = this.articlesFourniture.find(a => a.id === comp.article_fourniture_id);
            if (article && article.type === 'contenant_vide') {
              articleId = article.id;
              break;
            }
          }
          if (articleId) {
            await this.ajusterStockFourniture(articleId, this.facturePourRetour.siteId, ligne.retourne);
          }
        }
        const nonRetourne = ligne.quantite - ligne.retourne;
        if (nonRetourne > 0) {
          await db.consignations.add({
            id: crypto.randomUUID(),
            factureId: this.facturePourRetour.id,
            clientId: this.facturePourRetour.clientId,
            conditionnementId: ligne.conditionnementId,
            quantite_attendue: nonRetourne,
            quantite_retournee: 0,
            dateLivraison: this.facturePourRetour.dateLivraison,
            statut: 'en_attente'
          });
        }
      }
      this.showRetourModal = false;
      await this.chargerDonnees();
    },
    async ajusterStockFourniture(articleId, siteId, delta) {
      let stock = this.stocksFournitures.find(s => s.article_id === articleId && s.site_id === siteId);
      if (stock) {
        stock.quantite += delta;
        if (stock.quantite < 0) stock.quantite = 0;
        await db.stocks_fournitures.update(stock.id, { quantite: stock.quantite });
      } else if (delta > 0) {
        const newStock = { id: crypto.randomUUID(), article_id: articleId, site_id: siteId, quantite: delta };
        await db.stocks_fournitures.add(newStock);
        this.stocksFournitures.push(newStock);
      }
    },

    // ===================== AFFICHAGE / DETAIL =====================
    async voirFacture(id) {
      this.factureDetail = await db.factures.get(id);
      this.factureLignes = await db.facture_lignes.where('factureId').equals(id).toArray();
      const paiements = await db.mouvementsCaisse.where({ factureId: id, type: 'entree', status: 'validé' }).toArray();
      this.paiementsFacture = paiements.map(p => ({
        ...p,
        montantConverti: p.montant_converti_facture || 0
      }));
      this.paiementsFacture.sort((a, b) => new Date(a.date) - new Date(b.date));
      this.totalPaye = this.paiementsFacture.reduce((sum, p) => sum + (p.montantConverti || 0), 0);
    },
    imprimerFacture(id) {
      const facture = this.factures.find(f => f.id === id);
      if (!facture) return;
      db.facture_lignes.where('factureId').equals(id).toArray().then(factureLignes => {
        db.reglages.where('cle').equals('modele_facture').first().then(reg => {
          let html = reg?.valeur || this.getModeleFactureParDefaut();
          html = this.remplacerVariablesFacture(html, facture, factureLignes);
          const win = window.open();
          win.document.write(html);
          win.print();
        });
      });
    },
    imprimerBL(id) {
      const facture = this.factures.find(f => f.id === id);
      if (!facture) return;
      if (!facture.bonLivraisonId) {
        alert('Aucun bon de livraison associé à cette facture');
        return;
      }
      db.bons_livraison.get(facture.bonLivraisonId).then(bl => {
        if (!bl) {
          alert('Bon de livraison introuvable');
          return;
        }
        db.bl_lignes.where('blId').equals(bl.id).toArray().then(blLignes => {
          db.reglages.where('cle').equals('modele_bl').first().then(reg => {
            let html = reg?.valeur || this.getModeleBLParDefaut();
            html = this.remplacerVariablesBL(html, facture, bl, blLignes);
            const win = window.open();
            win.document.write(html);
            win.print();
          });
        });
      });
    },
    getModeleFactureParDefaut() {
        return `<html>
      <head><title>Facture {{ numero }}</title></head>
      <body>
        <div style="text-align:center;">
          {{ coordonnees.logo }}
          <h2>{{ coordonnees.nom }}</h2>
          <p>{{ coordonnees.adresse }}<br>{{ coordonnees.telephone }} - {{ coordonnees.email }}</p>
          <p><small>{{ coordonnees.legalInfo }}</small></p>
        </div>
        <hr>
        <h1>FACTURE N° {{ numero }}</h1>
        <p><strong>Date :</strong> {{ date }}</p>
        <p><strong>Client :</strong> {{ client.nom }}</p>
        <p><strong>Vendeur :</strong> {{ vendeur.nom }}</p>
        <p><strong>Échéance :</strong> {{ echeance }}</p>
        <table border="1" cellpadding="5" cellspacing="0" style="width:100%; border-collapse:collapse;">
          <thead><tr><th>Conditionnement</th><th>Quantité</th><th>Prix unitaire</th><th>Total</th></tr></thead>
          <tbody>{{ lignesHtml }}</tbody>
        </table>
        <div style="text-align:right;">
          <p><strong>Sous-total :</strong> {{ sousTotal }}</p>
          <p><strong>Remise :</strong> {{ remise }}</p>
          <p><strong>Total :</strong> {{ totalHT }}</p>
        </div>
        <hr>
        <p>Conditions de paiement : {{ conditionsPaiement }}</p>
      </body>
      </html>`;
      },
      getModeleBLParDefaut() {
        return `<html>
      <head><title>Bon de livraison {{ numero }}</title></head>
      <body>
        <div style="text-align:center;">
          {{ coordonnees.logo }}
          <h2>{{ coordonnees.nom }}</h2>
          <p>{{ coordonnees.adresse }}<br>{{ coordonnees.telephone }} - {{ coordonnees.email }}</p>
          <p><small>{{ coordonnees.legalInfo }}</small></p>
        </div>
        <hr>
        <h1>BON DE LIVRAISON N° {{ numero }}</h1>
        <p><strong>Date :</strong> {{ date }}</p>
        <p><strong>Facture :</strong> {{ factureNumero }}</p>
        <p><strong>Client :</strong> {{ client.nom }}</p>
        <p><strong>Site de livraison :</strong> {{ site.nom }}</p>
        <table border="1" cellpadding="5" cellspacing="0" style="width:100%; border-collapse:collapse;">
          <thead><tr><th>Conditionnement</th><th>Quantité</th><th>Lot</th></tr></thead>
          <tbody>{{ lignesHtml }}</tbody>
        </table>
        <hr>
        <p>Bon de livraison à conserver.</p>
      </body>
      </html>`;
      },
    remplacerVariablesFacture(html, facture, lignes) {
      const clientNom = this.getClientNom(facture.clientId);
      const vendeurNom = this.getVendeurNom(facture.vendeurId);
      const sousTotal = lignes.reduce((acc, l) => acc + l.prixTotal, 0);
      const remise = facture.remiseType === 'percent' ? `${facture.remise}%` : `${facture.remiseMontant} ${facture.devise}`;
      const totalHT = facture.totalHT;
      const lignesHtml = lignes.map(l => `<tr><td>${this.getConditionnementNom(l.conditionnementId)}</td><td>${l.quantite}</td><td>${this.formatMontant(l.prixUnitaire, facture.devise)}</td><td>${this.formatMontant(l.prixTotal, facture.devise)}</td></tr>`).join('');
      const conditionsPaiement = facture.echeance === 'livraison' ? 'Paiement à la livraison' : `Paiement à ${facture.echeance}`;
      return html
        .replace(/{{ numero }}/g, facture.numero)
        .replace(/{{ date }}/g, this.formatDate(facture.date))
        .replace(/{{ client\.nom }}/g, clientNom)
        .replace(/{{ vendeur\.nom }}/g, vendeurNom)
        .replace(/{{ echeance }}/g, conditionsPaiement)
        .replace(/{{ sousTotal }}/g, this.formatMontant(sousTotal, facture.devise))
        .replace(/{{ remise }}/g, remise)
        .replace(/{{ totalHT }}/g, this.formatMontant(totalHT, facture.devise))
        .replace(/{{ lignesHtml }}/g, lignesHtml)
        .replace(/{{ devise }}/g, facture.devise)
        .replace(/{{ coordonnees\.nom }}/g, this.coordonnees?.nom || '')
        .replace(/{{ coordonnees\.adresse }}/g, this.coordonnees?.adresse || '')
        .replace(/{{ coordonnees\.telephone }}/g, this.coordonnees?.telephone || '')
        .replace(/{{ coordonnees\.email }}/g, this.coordonnees?.email || '')
        .replace(/{{ coordonnees\.legalInfo }}/g, this.coordonnees?.legalInfo || '')
        .replace(/{{ coordonnees\.logo }}/g, this.coordonnees?.logo ? `<img src="${this.coordonnees.logo}" style="max-width:150px;">` : '')
        .replace(/{{ conditionsPaiement }}/g, conditionsPaiement);
    },
    remplacerVariablesBL(html, facture, bl, lignes) {
      const clientNom = this.getClientNom(facture.clientId);
      const siteNom = this.getSiteNom(bl.siteId);
      const lignesHtml = lignes.map(l => `<tr><td>${this.getConditionnementNom(l.conditionnementId)}</td><td>${l.quantiteLivree}</td><td>${this.getLotNumero(l.lotId)}</td></tr>`).join('');
      return html
        .replace(/{{ numero }}/g, bl.numero)
        .replace(/{{ date }}/g, this.formatDate(bl.date))
        .replace(/{{ factureNumero }}/g, facture.numero)
        .replace(/{{ client\.nom }}/g, clientNom)
        .replace(/{{ site\.nom }}/g, siteNom)
        .replace(/{{ lignesHtml }}/g, lignesHtml)
        .replace(/{{ coordonnees\.nom }}/g, this.coordonnees?.nom || '')
        .replace(/{{ coordonnees\.adresse }}/g, this.coordonnees?.adresse || '')
        .replace(/{{ coordonnees\.telephone }}/g, this.coordonnees?.telephone || '')
        .replace(/{{ coordonnees\.email }}/g, this.coordonnees?.email || '')
        .replace(/{{ coordonnees\.legalInfo }}/g, this.coordonnees?.legalInfo || '')
        .replace(/{{ coordonnees\.logo }}/g, this.coordonnees?.logo ? `<img src="${this.coordonnees.logo}" style="max-width:150px;">` : '');
    },

    // ===================== UTILITAIRES =====================
    getClientNom(id) { const c = this.clients.find(c => c.id === id); return c ? c.nom : '-'; },
    getVendeurNom(id) { const v = this.vendeurs.find(v => v.id === id); return v ? v.nom : '-'; },
    getSiteNom(id) { const s = this.sites.find(s => s.id === id); return s ? s.nom : '-'; },
    getLotNumero(id) { const lot = this.lotsCache.find(l => l.id === id); return lot ? lot.numero : '-'; },
    getSemaineCaisse(semaineId) {
      if (!semaineId) return '-';
      const semaine = this.semainesCaisse.find(s => s.id === semaineId);
      if (!semaine) return '-';
      return `${this.formatDate(semaine.dateDebut)} → ${this.formatDate(semaine.dateFin)}`;
    },
    getPaiementLabel(facture) {
      const statut = facture.statutPaiement;
      const echeance = facture.echeance;
      const livraison = facture.statutLivraison;
      const dateEcheance = facture.dateEcheance ? new Date(facture.dateEcheance) : null;
      const aujourdhui = new Date();
      if (statut === 'payée') return 'Payée';
      if (statut === 'partiel') {
        if (echeance === 'livraison') {
          if (livraison === 'livrée') {
            const jours = Math.floor((aujourdhui - new Date(facture.dateLivraison)) / (1000 * 3600 * 24));
            return `Paiement partiel - retard de ${jours} jour${jours > 1 ? 's' : ''}`;
          } else {
            return 'Paiement partiel - en attente de livraison';
          }
        } else {
          if (!dateEcheance) return 'Paiement partiel';
          if (dateEcheance < aujourdhui) {
            const jours = Math.floor((aujourdhui - dateEcheance) / (1000 * 3600 * 24));
            return `Paiement partiel - retard de ${jours} jour${jours > 1 ? 's' : ''}`;
          } else {
            const jours = Math.floor((dateEcheance - aujourdhui) / (1000 * 3600 * 24));
            const dateStr = this.formatDate(facture.dateEcheance);
            return `Paiement partiel - reste ${jours} jour${jours > 1 ? 's' : ''} (échéance ${dateStr})`;
          }
        }
      }
      if (echeance === 'livraison') {
        if (livraison === 'livrée') {
          const jours = Math.floor((aujourdhui - new Date(facture.dateLivraison)) / (1000 * 3600 * 24));
          return `Retard de paiement de ${jours} jour${jours > 1 ? 's' : ''}`;
        } else {
          return 'Paiement à la livraison';
        }
      } else {
        if (!dateEcheance) return 'En attente de paiement';
        if (dateEcheance < aujourdhui) {
          const jours = Math.floor((aujourdhui - dateEcheance) / (1000 * 3600 * 24));
          return `Retard de paiement de ${jours} jour${jours > 1 ? 's' : ''}`;
        } else {
          const jours = Math.floor((dateEcheance - aujourdhui) / (1000 * 3600 * 24));
          const dateStr = this.formatDate(facture.dateEcheance);
          return `À payer d'ici ${dateStr} (${jours} jour${jours > 1 ? 's' : ''})`;
        }
      }
    },
    getPaiementClass(facture) {
      const label = this.getPaiementLabel(facture);
      if (label === 'Payée') return 'bg-success text-white';
      if (label.includes('Retard')) return 'bg-danger text-white';
      if (label.includes('Paiement partiel')) return 'bg-warning text-dark';
      return 'bg-info text-dark';
    },
    getLivraisonLabel(facture) {
      if (facture.statutLivraison === 'livrée') return 'Livrée';
      return 'À livrer';
    },
    getLivraisonClass(facture) {
      if (facture.statutLivraison === 'livrée') return 'bg-success text-white';
      return 'bg-primary text-white';
    },
    getEcheanceLabel(facture) {
      if (facture.echeance === 'livraison') return 'Paiement à la livraison';
      if (facture.echeance === '30j') return '30 jours';
      if (facture.echeance === '60j') return '60 jours';
      if (facture.echeance === '90j') return '90 jours';
      return '-';
    },
    calculerJoursRetard(facture) {
      if (!facture.dateEcheance) return 0;
      const aujourdhui = new Date();
      const echeance = new Date(facture.dateEcheance);
      const diff = Math.floor((aujourdhui - echeance) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    },
    tri(colonne) {
      if (this.triColonne === colonne) {
        this.triOrdre = this.triOrdre === 'asc' ? 'desc' : 'asc';
      } else {
        this.triColonne = colonne;
        this.triOrdre = 'asc';
      }
    },

    // ===================== FONCTIONS AUTRE (inchangées) =====================
    ajouterLigneAutre() {
      this.nouvelleFactureAutre.lignes.push({ libelle: '', quantite: 1, prixUnitaire: 0 });
    },
    supprimerLigneAutre(idx) {
      this.nouvelleFactureAutre.lignes.splice(idx, 1);
    },
    async sauvegarderFactureAutre() {
      const poste = this.postesBudgetaires.find(p => p.id === this.nouvelleFactureAutre.posteBudgetaireId);
      if (!poste) return alert('Poste invalide');
      const annee = new Date(this.nouvelleFactureAutre.date).getFullYear().toString().slice(-2);
      const count = this.factures.filter(f => f.typeFacture === 'autre' && f.numero.endsWith(annee)).length + 1;
      const numero = `FA${count.toString().padStart(2, '0')}/${annee}`;
      const totalHT = this.totalAutre;
      const dateEcheance = this.calculerDateEcheance(this.nouvelleFactureAutre.date, this.nouvelleFactureAutre.echeance);
      const factureData = {
        numero,
        date: this.nouvelleFactureAutre.date,
        echeance: this.nouvelleFactureAutre.echeance,
        dateEcheance,
        clientId: this.nouvelleFactureAutre.clientId,
        vendeurId: this.currentUserId,
        siteId: null,
        devise: this.nouvelleFactureAutre.devise,
        tarif: null,
        remise: 0,
        remiseMontant: 0,
        remiseType: 'amount',
        totalHT,
        statutLivraison: 'livrée',
        statutPaiement: 'en_attente',
        typeFacture: 'autre',
        blSelectionne: false,
        dateLivraison: null,
        datePaiement: null,
        notes: '',
        dateCreation: new Date().toISOString()
      };
      try {
        const factureId = await apiService.ajouter('factures', factureData);
        for (const ligne of this.nouvelleFactureAutre.lignes) {
          await apiService.ajouter('facture_lignes', {
            factureId,
            conditionnementId: null,
            quantite: ligne.quantite,
            prixUnitaire: ligne.prixUnitaire,
            prixTotal: ligne.quantite * ligne.prixUnitaire,
            libelle: ligne.libelle
          });
        }
        await this.chargerDonnees();
        this.nouvelleFactureAutre = { clientId: '', posteBudgetaireId: '', date: '', devise: 'USD', echeance: 'livraison', lignes: [] };
        this.showForm = false;
        alert('Facture créée');
      } catch (error) {
        console.error(error);
        alert('Erreur');
      }
    },
  }
};
</script>