<template>
  <div class="container-fluid">
    <h2 class="mb-4" style="color: #ED1C24;">Gestion des stocks</h2>

    <!-- Onglets principaux -->
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <a class="nav-link" :class="{ active: ongletPrincipal === 'resume' }" href="#"
           @click.prevent="ongletPrincipal = 'resume'">
          <i class="bi bi-bar-chart"></i> Résumé
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" :class="{ active: ongletPrincipal === 'huile' }" href="#"
           @click.prevent="ongletPrincipal = 'huile'">
          Huile
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" :class="{ active: ongletPrincipal === 'carburant' }" href="#"
           @click.prevent="ongletPrincipal = 'carburant'">
          Carburant
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" :class="{ active: ongletPrincipal === 'fournitures' }" href="#"
           @click.prevent="ongletPrincipal = 'fournitures'">
          Fournitures
        </a>
      </li>
    </ul>

    <!-- ====== VUE RÉSUMÉ ====== -->
    <div v-if="ongletPrincipal === 'resume'">
      <div class="card">
        <div class="card-header">Vue d'ensemble des stocks</div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-bordered">
              <thead>
                <tr>
                  <th>Catégorie / Article</th>
                  <th v-for="site in sites" :key="site.id" class="text-center">{{ site.nom }}</th>
                </tr>
              </thead>
              <tbody>
                <!-- Ligne Huile -->
                <tr class="table-primary">
                  <td><strong>Huile (L)</strong></td>
                  <td v-for="site in sites" :key="site.id" class="text-end">
                    {{ totalVolumeHuileSite(site.id).toFixed(1) }}
                  </td>
                </tr>

                <!-- Lignes Carburants -->
                <tr v-for="ct in carburantTypesActifs" :key="ct.id">
                  <td>{{ ct.nom }} (L)</td>
                  <td v-for="site in sites" :key="site.id" class="text-end">
                    {{ getStockCarburant(ct.id, site.id) }}
                  </td>
                </tr>

                <!-- Lignes Fournitures -->
                <tr v-for="art in articlesFournitureActifs" :key="art.id">
                  <td>{{ art.nom }} ({{ art.unite }})</td>
                  <td v-for="site in sites" :key="site.id" class="text-end">
                    {{ getStockFourniture(art.id, site.id) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== HUILE ===== -->
    <div v-if="ongletPrincipal === 'huile'">
      <div class="row mb-3" v-if="sitesAutorises.length > 1">
        <div class="col-md-4">
          <label>Site</label>
          <select class="form-select" v-model="siteActif">
            <option v-for="site in sitesAutorises" :key="site.id" :value="site.id">{{ site.nom }}</option>
          </select>
        </div>
      </div>
      <div v-else-if="sitesAutorises.length === 1" class="mb-3">
        <strong>Site :</strong> {{ sitesAutorises[0].nom }}
      </div>

      <ul class="nav nav-tabs">
        <li class="nav-item"><a class="nav-link" :class="{ active: ongletHuile === 'etat' }" href="#" @click.prevent="ongletHuile = 'etat'">État des stocks</a></li>
        <li class="nav-item"><a class="nav-link" :class="{ active: ongletHuile === 'mouvements' }" href="#" @click.prevent="ongletHuile = 'mouvements'">Mouvements</a></li>
        <li class="nav-item"><a class="nav-link" :class="{ active: ongletHuile === 'transferts' }" href="#" @click.prevent="ongletHuile = 'transferts'">Transferts</a></li>
        <li class="nav-item"><a class="nav-link" :class="{ active: ongletHuile === 'inventaires' }" href="#" @click.prevent="ongletHuile = 'inventaires'">Inventaires</a></li>
        <li class="nav-item"><a class="nav-link" :class="{ active: ongletHuile === 'reconditionnements' }" href="#" @click.prevent="ongletHuile = 'reconditionnements'">Reconditionnements</a></li>
        <li class="nav-item"><a class="nav-link" :class="{ active: ongletHuile === 'rapports' }" href="#" @click.prevent="ongletHuile = 'rapports'">Rapports</a></li>
      </ul>

      <div class="tab-content p-3 bg-white border rounded-bottom">

        <!-- État des stocks Huile -->
        <div v-show="ongletHuile === 'etat'">
          <div class="row">
            <div class="col-md-6">
              <div class="row mb-3">
                <div class="col-md-6">
                  <label>Lot</label>
                  <select class="form-select" v-model="filtreLotId">
                    <option value="">Tous</option>
                    <option v-for="lot in lotsDisponiblesFiltre" :key="lot.id" :value="lot.id">{{ lot.numero }}</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label>Conditionnement</label>
                  <select class="form-select" v-model="filtreConditionnementId">
                    <option value="">Tous</option>
                    <option v-for="cond in conditionnements" :key="cond.id" :value="cond.id">{{ cond.nom }}</option>
                  </select>
                </div>
              </div>
              <div class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th class="text-start" @click="triStocks('lot')" style="cursor:pointer">Lot <i v-if="triStocksCol==='lot'" :class="triStocksOrdre==='asc'?'bi-arrow-up':'bi-arrow-down'"></i></th>
                      <th class="text-start" @click="triStocks('conditionnement')" style="cursor:pointer">Conditionnement <i v-if="triStocksCol==='conditionnement'" :class="triStocksOrdre==='asc'?'bi-arrow-up':'bi-arrow-down'"></i></th>
                      <th class="text-end" @click="triStocks('quantite')" style="cursor:pointer">Quantité <i v-if="triStocksCol==='quantite'" :class="triStocksOrdre==='asc'?'bi-arrow-up':'bi-arrow-down'"></i></th>
                      <th class="text-end" @click="triStocks('volume')" style="cursor:pointer">Volume total (L) <i v-if="triStocksCol==='volume'" :class="triStocksOrdre==='asc'?'bi-arrow-up':'bi-arrow-down'"></i></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="stock in stocksFiltresTries" :key="stock.id">
                      <td class="text-start">{{ getLotNumero(stock.lotId) }}</td>
                      <td class="text-start">{{ getConditionnementNom(stock.conditionnementId) }}</td>
                      <td class="text-end">{{ stock.quantite }}</td>
                      <td class="text-end">{{ formatVolume(stock.quantite * getCapaciteConditionnement(stock.conditionnementId)) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="col-md-6">
              <div class="mt-0">
                <h5>Résumé par conditionnement</h5>
                <div class="table-responsive">
                  <table class="table table-sm">
                    <thead>
                      <tr><th class="text-start">Conditionnement</th><th class="text-end">Quantité</th><th class="text-end">Volume (L)</th></tr>
                    </thead>
                    <tbody>
                      <tr v-for="cond in conditionnements" :key="cond.id">
                        <td class="text-start">{{ cond.nom }}</td>
                        <td class="text-end">{{ getQuantiteParConditionnement(cond.id) }}</td>
                        <td class="text-end">{{ formatVolume(getQuantiteParConditionnement(cond.id) * cond.capaciteL) }}</td>
                      </tr>
                      <tr class="table-active">
                        <td class="text-start"><strong>Total</strong></td>
                        <td class="text-end"></td>
                        <td class="text-end"><strong>{{ formatVolume(totalVolumeHuile) }}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div class="mt-4">
                <h5>Évolution mensuelle</h5>
                <canvas id="chartHuile" style="height: 150px; width: 100%;"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- Mouvements Huile -->
        <div v-show="ongletHuile === 'mouvements'">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th class="text-start" style="width: 12%; cursor: pointer;" @click="triMouvements('date')">Date <i v-if="triMouvementsCol === 'date'" :class="triMouvementsOrdre === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i></th>
                  <th class="text-start" style="width: 10%; cursor: pointer;" @click="triMouvements('type')">Type <i v-if="triMouvementsCol === 'type'" :class="triMouvementsOrdre === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i></th>
                  <th class="text-start" style="width: 20%; cursor: pointer;" @click="triMouvements('description')">Description <i v-if="triMouvementsCol === 'description'" :class="triMouvementsOrdre === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i></th>
                  <th class="text-center" style="width: 12%; cursor: pointer;" @click="triMouvements('volume')">Volume (L) <i v-if="triMouvementsCol === 'volume'" :class="triMouvementsOrdre === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i></th>
                  <th class="text-center" style="width: 15%; cursor: pointer;" @click="triMouvements('statut')">Statut <i v-if="triMouvementsCol === 'statut'" :class="triMouvementsOrdre === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i></th>
                  <th style="width: 11%">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in mouvementsFiltres" :key="m.id">
                  <td class="text-start">{{ formatDate(m.date) }}</td>
                  <td class="text-start">{{ m.type }}</td>
                  <td class="text-start">{{ m.description }}</td>
                  <td class="text-center">{{ formatVolume(m.volumeTotal) }}</td>
                  <td class="text-center">{{ m.statut }}</td>
                  <td><button class="btn btn-sm btn-info" @click="voirMouvement(m.id)">Détails</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Transferts Huile -->
        <div v-show="ongletHuile === 'transferts'">
          <button class="btn btn-primary mb-3" @click="nouveauTransfert" v-if="peutEcrireSite()">Nouveau transfert</button>
          <div v-if="showTransfertForm" class="card mb-3">
            <div class="card-header">Créer un transfert</div>
            <div class="card-body">
              <form @submit.prevent="enregistrerTransfert">
                <div class="row">
                  <div class="col-md-4"><label>Site d'origine</label><select class="form-select" v-model="transfert.siteSource" required @change="onSiteSourceChange"><option v-for="site in sites" :key="site.id" :value="site.id">{{ site.nom }}</option></select></div>
                  <div class="col-md-4"><label>Site destination</label><select class="form-select" v-model="transfert.siteDestination" required><option v-for="site in sites" :key="site.id" :value="site.id">{{ site.nom }}</option></select></div>
                  <div class="col-md-4"><label>Date</label><input type="date" class="form-control" v-model="transfert.dateCreation" required></div>
                </div>
                <h5 class="mt-3">Lignes de transfert</h5>
                <div v-for="(ligne, idx) in transfert.lignes" :key="idx" class="row mb-2">
                  <div class="col-md-3"><select class="form-select" v-model="ligne.lotId" required @change="onLotChange(idx)"><option value="">-- Lot --</option><option v-for="lot in lotsSource" :key="lot.id" :value="lot.id">{{ lot.numero }}</option></select></div>
                  <div class="col-md-3"><select class="form-select" v-model="ligne.conditionnementId" required @change="onConditionnementChange(idx)"><option value="">-- Conditionnement --</option><option v-for="cond in conditionnementsDisponiblesPourLot(ligne.lotId)" :key="cond.id" :value="cond.id">{{ cond.nom }} (max {{ cond.max }})</option></select></div>
                  <div class="col-md-2"><input type="number" class="form-control" v-model.number="ligne.quantite" min="1" :max="quantiteMax(ligne.lotId, ligne.conditionnementId)" required placeholder="Qté"></div>
                  <div class="col-md-2"><button class="btn btn-sm btn-danger" @click="supprimerLigneTransfert(idx)">Suppr</button></div>
                </div>
                <button type="button" class="btn btn-secondary" @click="ajouterLigneTransfert">Ajouter une ligne</button>
                <div class="mt-3"><button type="submit" class="btn btn-success">Enregistrer</button><button type="button" class="btn btn-secondary ms-2" @click="annulerTransfert">Annuler</button></div>
              </form>
            </div>
          </div>
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th class="text-start" @click="triTransferts('numero')" style="cursor: pointer;">Numéro <i v-if="triTransfertsCol === 'numero'" :class="triTransfertsOrdre === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i></th>
                  <th class="text-start" @click="triTransferts('dateCreation')" style="cursor: pointer;">Date création <i v-if="triTransfertsCol === 'dateCreation'" :class="triTransfertsOrdre === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i></th>
                  <th class="text-start" @click="triTransferts('source')" style="cursor: pointer;">Origine <i v-if="triTransfertsCol === 'source'" :class="triTransfertsOrdre === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i></th>
                  <th class="text-start" @click="triTransferts('destination')" style="cursor: pointer;">Destination <i v-if="triTransfertsCol === 'destination'" :class="triTransfertsOrdre === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i></th>
                  <th class="text-start" @click="triTransferts('statut')" style="cursor: pointer;">Statut <i v-if="triTransfertsCol === 'statut'" :class="triTransfertsOrdre === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i></th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in transfertsFiltres" :key="t.id">
                  <td class="text-start">{{ t.numero }}</td>
                  <td class="text-start">{{ formatDate(t.dateCreation) }}</td>
                  <td class="text-start">{{ getSiteNom(t.siteSource) }}</td>
                  <td class="text-start">{{ getSiteNom(t.siteDestination) }}</td>
                  <td class="text-start">{{ t.statut }}</td>
                  <td>
                    <button v-if="t.statut === 'en cours'" class="btn btn-sm btn-danger me-1" @click="annulerTransfertBackend(t.id)" title="Annuler le transfert">Annuler</button>
                    <button v-if="t.statut === 'en cours' && peutConfirmerTransfert && t.siteDestination === siteActif" class="btn btn-sm btn-success me-1" @click="ouvrirConfirmationTransfert(t.id)">Confirmer réception</button>
                    <button class="btn btn-sm btn-info" @click="voirTransfert(t.id)">Détails</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Inventaires Huile -->
        <div v-show="ongletHuile === 'inventaires'">
          <button class="btn btn-primary mb-3" @click="nouvelInventaire" v-if="peutEcrireSite()">Nouvel inventaire</button>
          <div v-if="showInventaireForm" class="card mb-3">
            <div class="card-header">Créer un inventaire</div>
            <div class="card-body">
              <form @submit.prevent="enregistrerInventaire">
                <div class="row">
                  <div class="col-md-4"><label>Site</label><select class="form-select" v-model="inventaire.siteId" required @change="onInventaireSiteChange"><option v-for="site in sites" :key="site.id" :value="site.id">{{ site.nom }}</option></select></div>
                  <div class="col-md-4"><label>Date</label><input type="date" class="form-control" v-model="inventaire.date" required></div>
                </div>
                <h5 class="mt-3">Lignes d'inventaire</h5>
                <div class="table-responsive">
                  <table class="table table-bordered">
                    <thead><tr><th class="text-start" style="width: 30%">Lot</th><th class="text-start" style="width: 20%">Conditionnement</th><th class="text-end" style="width: 15%">Quantité théorique</th><th class="text-end" style="width: 20%">Quantité réelle</th><th class="text-start" style="width: 15%">Justification</th></tr></thead>
                    <tbody>
                      <tr v-for="(ligne, idx) in inventaire.lignes" :key="idx">
                        <td class="text-start">
                          <select v-if="ligne.isNew" class="form-select" v-model="ligne.lotId" @change="onInventaireLotChange(idx)"><option value="">-- Lot --</option><option v-for="lot in lotsRecents" :key="lot.id" :value="lot.id">{{ lot.numero }}</option><option value="__new__">Nouveau lot</option></select>
                          <select v-else class="form-select" v-model="ligne.lotId" disabled style="background:#e9ecef"><option v-for="lot in lotsInventaire" :key="lot.id" :value="lot.id">{{ lot.numero }}</option></select>
                          <input v-if="ligne.lotId === '__new__'" type="text" class="form-control mt-1" v-model="ligne.nouveauLotNumero" placeholder="Numéro du nouveau lot" :disabled="!ligne.isNew">
                        </td>
                        <td class="text-start">
                          <select v-if="ligne.isNew" class="form-select" v-model="ligne.conditionnementId" required><option value="">-- Conditionnement --</option><option v-for="cond in conditionnements" :key="cond.id" :value="cond.id">{{ cond.nom }}</option></select>
                          <select v-else class="form-select" v-model="ligne.conditionnementId" disabled style="background:#e9ecef"><option v-for="cond in conditionnementsPourInventaire(ligne.lotId)" :key="cond.id" :value="cond.id">{{ cond.nom }}</option></select>
                        </td>
                        <td class="text-end">{{ ligne.quantiteTheorique }}</td>
                        <td class="text-end"><input type="number" class="form-control text-end" v-model.number="ligne.quantiteReelle" min="0" required placeholder="Réelle"></td>
                        <td class="text-start"><input type="text" class="form-control" v-model="ligne.justification" placeholder="Justification"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <button type="button" class="btn btn-secondary" @click="ajouterLigneInventaire">Ajouter une ligne</button>
                <div class="mt-3"><button type="submit" class="btn btn-success">Valider l'inventaire</button><button type="button" class="btn btn-secondary ms-2" @click="annulerInventaire">Annuler</button></div>
              </form>
            </div>
          </div>
          <div class="table-responsive">
            <table class="table table-hover">
              <thead><tr><th class="text-start" @click="triInventaires('date')">Date</th><th class="text-start" @click="triInventaires('site')">Site</th><th class="text-start" @click="triInventaires('statut')">Statut</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="inv in inventairesFiltres" :key="inv.id"><td class="text-start">{{ formatDate(inv.date) }}</td><td class="text-start">{{ getSiteNom(inv.siteId) }}</td><td class="text-start">{{ inv.statut }}</td><td><button class="btn btn-sm btn-info" @click="voirInventaire(inv.id)">Détails</button></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Reconditionnements Huile -->
        <div v-show="ongletHuile === 'reconditionnements'">
          <button class="btn btn-primary mb-3" @click="nouveauReconditionnement" v-if="peutEcrireSite()">Nouveau reconditionnement</button>
          <div v-if="showReconditionnementForm" class="card mb-3">
            <div class="card-header">Reconditionnement</div>
            <div class="card-body">
              <form @submit.prevent="enregistrerReconditionnement">
                <div class="row">
                  <div class="col-md-4"><label>Site</label><select class="form-select" v-model="reconditionnement.siteId" required @change="onReconditionnementSiteChange"><option v-for="site in sites" :key="site.id" :value="site.id">{{ site.nom }}</option></select></div>
                  <div class="col-md-4"><label>Date</label><input type="date" class="form-control" v-model="reconditionnement.date" required></div>
                </div>
                <div class="row mt-3">
                  <div class="col-md-4"><label>Lot</label><select class="form-select" v-model="reconditionnement.lotId" required @change="onReconditionnementLotChange"><option value="">-- Lot --</option><option v-for="lot in lotsReconditionnement" :key="lot.id" :value="lot.id">{{ lot.numero }}</option></select></div>
                  <div class="col-md-4"><label>Conditionnement source</label><select class="form-select" v-model="reconditionnement.conditionnementSource" required @change="onReconditionnementSourceChange"><option value="">-- Conditionnement --</option><option v-for="cond in conditionnementsSource" :key="cond.id" :value="cond.id">{{ cond.nom }} (restant: {{ cond.max }})</option></select></div>
                  <div class="col-md-4"><label>Quantité source</label><input type="number" class="form-control" v-model.number="reconditionnement.quantiteSource" min="1" :max="quantiteSourceMax" required></div>
                </div>
                <div class="row mt-3">
                  <div class="col-md-4"><label>Conditionnement destination</label><select class="form-select" v-model="reconditionnement.conditionnementDestination" required><option value="">-- Conditionnement --</option><option v-for="cond in conditionnementsDest" :key="cond.id" :value="cond.id">{{ cond.nom }}</option></select></div>
                  <div class="col-md-4"><label>Quantité destination</label><input type="number" class="form-control" v-model.number="reconditionnement.quantiteDestination" min="1" required></div>
                </div>
                <div class="row mt-3"><div class="col-md-12"><label>Remarques</label><textarea class="form-control" rows="2" v-model="reconditionnement.remarques" placeholder="Justification en cas de non-équivalence des volumes"></textarea></div></div>
                <div class="mt-3"><button type="submit" class="btn btn-success">Enregistrer</button><button type="button" class="btn btn-secondary ms-2" @click="annulerReconditionnement">Annuler</button></div>
              </form>
            </div>
          </div>
          <div class="table-responsive">
            <table class="table table-hover">
              <thead><tr><th class="text-start" style="width: 12%">Date</th><th class="text-center" style="width: 12%">Site</th><th class="text-center" style="width: 12%">Lot</th><th class="text-center" style="width: 12%">Source</th><th class="text-center" style="width: 12%">Quantité source</th><th class="text-center" style="width: 12%">Destination</th><th class="text-center" style="width: 12%">Quantité dest.</th><th style="width: 7%">Actions</th></tr></thead>
              <tbody>
                <tr v-for="r in reconditionnementsFiltres" :key="r.id"><td class="text-start">{{ formatDate(r.date) }}</td><td class="text-center">{{ getSiteNom(r.siteId) }}</td><td class="text-center">{{ getLotNumero(r.lotId) }}</td><td class="text-center">{{ getConditionnementNom(r.conditionnementSource) }}</td><td class="text-center">{{ r.quantiteSource }}</td><td class="text-center">{{ getConditionnementNom(r.conditionnementDestination) }}</td><td class="text-center">{{ r.quantiteDestination }}</td><td><button class="btn btn-sm btn-info" @click="voirReconditionnement(r.id)">Détails</button></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Rapports Huile -->
        <div v-show="ongletHuile === 'rapports'">
          <div class="row mb-4">
            <div class="col-md-4"><div class="card bg-light"><div class="card-body text-center"><h5 class="card-title">Écarts d'inventaire</h5><p class="display-6">{{ formatVolume(totalEcartInventaire) }} L</p></div></div></div>
            <div class="col-md-4"><div class="card bg-light"><div class="card-body text-center"><h5 class="card-title">Manquants lors des transferts</h5><p class="display-6">{{ formatVolume(totalManquantTransfert) }} L</p></div></div></div>
            <div class="col-md-4"><div class="card bg-light"><div class="card-body text-center"><h5 class="card-title">Pertes lors des reconditionnements</h5><p class="display-6">{{ formatVolume(totalPerteReconditionnement) }} L</p></div></div></div>
          </div>
          <h5>Écarts d'inventaire</h5>
          <div class="table-responsive mb-4">
            <table class="table table-sm">
              <thead><tr><th class="text-start">Date</th><th class="text-start">Site</th><th class="text-start">Lot</th><th class="text-start">Conditionnement</th><th class="text-end">Théorique</th><th class="text-end">Réel</th><th class="text-end">Écart</th><th class="text-start">Justification</th></tr></thead>
              <tbody>
                <tr v-for="l in ecartsInventaire" :key="l.id"><td class="text-start">{{ formatDate(l.date) }}</td><td class="text-start">{{ getSiteNom(l.siteId) }}</td><td class="text-start">{{ getLotNumero(l.lotId) }}</td><td class="text-start">{{ getConditionnementNom(l.conditionnementId) }}</td><td class="text-end">{{ l.quantiteTheorique }}</td><td class="text-end">{{ l.quantiteReelle }}</td><td class="text-end">{{ l.ecart }}</td><td class="text-start">{{ l.justification }}</td></tr>
              </tbody>
            </table>
          </div>
          <h5>Transferts avec réception incomplète</h5>
          <div class="table-responsive mb-4">
            <table class="table table-sm">
              <thead><tr><th class="text-start">Date</th><th class="text-start">Numéro</th><th class="text-start">Origine</th><th class="text-start">Destination</th><th class="text-start">Lot</th><th class="text-start">Conditionnement</th><th class="text-end">Envoyé</th><th class="text-end">Reçu</th><th class="text-end">Écart</th><th class="text-start">Raison</th></tr></thead>
              <tbody>
                <tr v-for="e in ecartsTransfert" :key="e.id"><td class="text-start">{{ formatDate(e.date) }}</td><td class="text-start">{{ e.numero }}</td><td class="text-start">{{ getSiteNom(e.siteSource) }}</td><td class="text-start">{{ getSiteNom(e.siteDestination) }}</td><td class="text-start">{{ getLotNumero(e.lotId) }}</td><td class="text-start">{{ getConditionnementNom(e.conditionnementId) }}</td><td class="text-end">{{ e.quantite }}</td><td class="text-end">{{ e.quantiteRecue }}</td><td class="text-end">{{ e.quantite - e.quantiteRecue }}</td><td class="text-start">{{ e.raison }}</td></tr>
              </tbody>
            </table>
          </div>
          <h5>Pertes lors des reconditionnements</h5>
          <div class="table-responsive mb-4">
            <table class="table table-sm">
              <thead><tr><th class="text-start">Date</th><th class="text-start">Site</th><th class="text-start">Lot</th><th class="text-start">Source</th><th class="text-center">Quantité source</th><th class="text-start">Destination</th><th class="text-center">Quantité dest.</th><th class="text-end">Perte (L)</th><th class="text-start">Remarques</th></tr></thead>
              <tbody>
                <tr v-for="p in pertesReconditionnement" :key="p.id"><td class="text-start">{{ formatDate(p.date) }}</td><td class="text-start">{{ getSiteNom(p.siteId) }}</td><td class="text-start">{{ getLotNumero(p.lotId) }}</td><td class="text-start">{{ getConditionnementNom(p.conditionnementSource) }}</td><td class="text-center">{{ p.quantiteSource }}</td><td class="text-start">{{ getConditionnementNom(p.conditionnementDestination) }}</td><td class="text-center">{{ p.quantiteDestination }}</td><td class="text-end">{{ p.perte }} L</td><td class="text-start">{{ p.remarques || '-' }}</td></tr>
              </tbody>
            </table>
          </div>
          <h5>Lots créés hors production (inventaire)</h5>
          <div class="table-responsive">
            <table class="table table-sm">
              <thead><tr><th class="text-start">Date</th><th class="text-start">Lot</th><th class="text-start">Site de création</th><th class="text-start">Conditionnement</th><th class="text-end">Quantité initiale</th></tr></thead>
              <tbody>
                <tr v-for="l in lotsHorsProduction" :key="l.id"><td class="text-start">{{ formatDate(l.date) }}</td><td class="text-start">{{ l.numero }}</td><td class="text-start">{{ getSiteNom(l.siteId) }}</td><td class="text-start">{{ getConditionnementNom(l.conditionnementId) }}</td><td class="text-end">{{ l.quantite }}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

<!-- ===== CARBURANT ===== -->
    <div v-if="ongletPrincipal === 'carburant'">
      <div class="row mb-3" v-if="sitesAutorises.length > 1">
        <div class="col-md-4"><label>Site</label><select class="form-select" v-model="siteActif"><option v-for="site in sitesAutorises" :key="site.id" :value="site.id">{{ site.nom }}</option></select></div>
      </div>
      <div v-else-if="sitesAutorises.length === 1" class="mb-3"><strong>Site :</strong> {{ sitesAutorises[0].nom }}</div>

      <ul class="nav nav-tabs mb-3">
        <li class="nav-item"><a class="nav-link" :class="{ active: ongletCarburant === 'etat' }" href="#" @click.prevent="ongletCarburant = 'etat'">État</a></li>
        <li class="nav-item"><a class="nav-link" :class="{ active: ongletCarburant === 'mouvements' }" href="#" @click.prevent="ongletCarburant = 'mouvements'">Mouvements</a></li>
        <li class="nav-item"><a class="nav-link" :class="{ active: ongletCarburant === 'inventaire' }" href="#" @click.prevent="ongletCarburant = 'inventaire'">Inventaire</a></li>
      </ul>

      <!-- État carburant -->
      <div v-show="ongletCarburant === 'etat'">
        <div class="table-responsive">
          <table class="table table-bordered table-sm">
            <thead><tr><th>Type</th><th>Quantité (L)</th></tr></thead>
            <tbody>
              <tr v-for="ct in carburantTypesFiltres" :key="ct.id"><td>{{ ct.nom }}</td><td class="text-end">{{ getStockCarburant(ct.id) }}</td></tr>
              <tr v-if="carburantTypesFiltres.length === 0"><td colspan="2" class="text-center">Aucun type de carburant pour ce site.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mouvements carburant -->
      <div v-show="ongletCarburant === 'mouvements'">
        <div class="mb-3" v-if="peutEcrireSite()">
          <button class="btn btn-success" @click="nouveauMouvementCarburant('entree')"><i class="bi bi-plus-circle"></i> Entrée</button>
          <button class="btn btn-warning ms-2" @click="nouveauMouvementCarburant('sortie')"><i class="bi bi-dash-circle"></i> Sortie</button>
        </div>
        <div class="table-responsive">
          <table class="table table-sm table-striped">
            <thead><tr><th>Date</th><th>Type</th><th>Mouvement</th><th>Quantité</th><th>Utilisation</th><th>Source</th></tr></thead>
            <tbody>
              <tr v-for="m in carburantMouvementsFiltres" :key="m.id"><td>{{ formatDate(m.date) }}</td><td>{{ getCarburantNom(m.carburant_type_id) }}</td><td><span :class="m.type === 'entree' ? 'text-success' : 'text-danger'">{{ m.type === 'entree' ? 'Entrée' : 'Sortie' }}</span></td><td class="text-end">{{ m.quantite }}</td><td>{{ getUtilisationNom(m.utilisation_id) }}</td><td>{{ m.source }}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Inventaire carburant -->
      <div v-show="ongletCarburant === 'inventaire'">
        <div class="row mb-3"><div class="col-md-3"><label>Type carburant</label><select class="form-select" v-model="carburantInvType"><option v-for="ct in carburantTypesFiltres" :key="ct.id" :value="ct.id">{{ ct.nom }}</option></select></div></div>
        <div v-if="carburantInvType">
          <p><strong>Stock théorique :</strong> {{ carburantStockTheorique }} L</p>
          <div class="row"><div class="col-md-3"><label>Stock réel (L)</label><input type="number" step="0.01" class="form-control" v-model.number="carburantInvReel"></div><div class="col-md-3"><label>Justification si écart</label><input type="text" class="form-control" v-model="carburantInvJustification"></div></div>
          <button class="btn btn-primary mt-2" @click="validerInventaireCarburant">Valider l'inventaire</button>
        </div>
      </div>

      <!-- Modal mouvement carburant -->
      <div v-if="carburantShowModalMvt" class="modal" style="display:block; background:rgba(0,0,0,0.5); z-index:1055;">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header"><h5>{{ carburantModalType === 'entree' ? 'Nouvelle entrée' : 'Nouvelle sortie' }} de carburant</h5><button type="button" class="btn-close" @click="carburantShowModalMvt = false"></button></div>
            <div class="modal-body">
              <div class="mb-3"><label>Type carburant</label><select class="form-select" v-model="carburantMvtForm.carburant_type_id" required><option v-for="ct in carburantTypesFiltres" :key="ct.id" :value="ct.id">{{ ct.nom }}</option></select></div>
              <div class="mb-3"><label>Quantité</label><input type="number" step="0.1" class="form-control" v-model.number="carburantMvtForm.quantite" required></div>
              <div class="mb-3" v-if="carburantModalType === 'sortie'"><label>Utilisation</label><select class="form-select" v-model="carburantMvtForm.utilisation_id" required><option v-for="u in carburantUtilisations" :key="u.id" :value="u.id">{{ u.nom }}</option></select></div>
              <div class="mb-3"><label>Date</label><input type="date" class="form-control" v-model="carburantMvtForm.date" required></div>
            </div>
            <div class="modal-footer"><button class="btn btn-secondary" @click="carburantShowModalMvt = false">Annuler</button><button class="btn btn-primary" @click="enregistrerMouvementCarburant">Enregistrer</button></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== FOURNITURES ===== -->
    <div v-if="ongletPrincipal === 'fournitures'">
      <div class="row mb-3" v-if="sitesAutorises.length > 1">
        <div class="col-md-4"><label>Site</label><select class="form-select" v-model="siteActif"><option v-for="site in sitesAutorises" :key="site.id" :value="site.id">{{ site.nom }}</option></select></div>
      </div>
      <div v-else-if="sitesAutorises.length === 1" class="mb-3"><strong>Site :</strong> {{ sitesAutorises[0].nom }}</div>

      <ul class="nav nav-tabs mb-3">
        <li class="nav-item"><a class="nav-link" :class="{ active: ongletFournitures === 'etat' }" href="#" @click.prevent="ongletFournitures = 'etat'">État</a></li>
        <li class="nav-item"><a class="nav-link" :class="{ active: ongletFournitures === 'mouvements' }" href="#" @click.prevent="ongletFournitures = 'mouvements'">Mouvements</a></li>
        <li class="nav-item"><a class="nav-link" :class="{ active: ongletFournitures === 'inventaire' }" href="#" @click.prevent="ongletFournitures = 'inventaire'">Inventaire</a></li>
        <li class="nav-item"><a class="nav-link" :class="{ active: ongletFournitures === 'transfert' }" href="#" @click.prevent="ongletFournitures = 'transfert'">Transfert</a></li>
        <li class="nav-item"><a class="nav-link" :class="{ active: ongletFournitures === 'retour' }" href="#" @click.prevent="ongletFournitures = 'retour'">Retour bidons</a></li>
      </ul>

      <!-- État fournitures -->
      <div v-show="ongletFournitures === 'etat'">
        <div class="table-responsive">
          <table class="table table-sm table-bordered">
            <thead><tr><th>Article</th><th>Type</th><th>Conditionnement lié</th><th>Quantité</th></tr></thead>
            <tbody>
              <tr v-for="art in articlesFourniture" :key="art.id">
                <td>{{ art.nom }}</td>
                <td>{{ art.type === 'contenant_vide' ? 'Bidon vide' : art.type === 'etiquette' ? 'Étiquette' : art.type }}</td>
                <td>{{ getConditionnementNom(art.contenant_id) }}</td>
                <td class="text-end">{{ getStockFourniture(art.id) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mouvements fournitures -->
      <div v-show="ongletFournitures === 'mouvements'">
        <div class="mb-3" v-if="peutEcrireSite()">
          <button class="btn btn-success" @click="nouveauMouvementFourniture('entree')"><i class="bi bi-plus-circle"></i> Entrée</button>
          <button class="btn btn-warning ms-2" @click="nouveauMouvementFourniture('sortie')"><i class="bi bi-dash-circle"></i> Sortie</button>
        </div>
        <div class="table-responsive">
          <table class="table table-sm table-striped">
            <thead><tr><th>Date</th><th>Article</th><th>Type</th><th>Quantité</th><th>Source</th><th>Réf.</th></tr></thead>
            <tbody>
              <tr v-for="m in mouvementsFournituresFiltres" :key="m.id">
                <td>{{ formatDate(m.date) }}</td>
                <td>{{ getArticleFournitureNom(m.type_id) }}</td>
                <td><span :class="m.type === 'entree' ? 'text-success' : 'text-danger'">{{ m.type === 'entree' ? 'Entrée' : 'Sortie' }}</span></td>
                <td class="text-end">{{ m.quantite }}</td>
                <td>{{ m.source }}</td>
                <td>{{ m.reference_id || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Inventaire fournitures -->
      <div v-show="ongletFournitures === 'inventaire'">
        <div class="row mb-3"><div class="col-md-3"><label>Article</label><select class="form-select" v-model="fournitureInvArticle"><option v-for="art in articlesFourniture" :key="art.id" :value="art.id">{{ art.nom }}</option></select></div></div>
        <div v-if="fournitureInvArticle">
          <p><strong>Stock théorique :</strong> {{ getStockFourniture(fournitureInvArticle) }}</p>
          <div class="row"><div class="col-md-3"><label>Stock réel</label><input type="number" class="form-control" v-model.number="fournitureInvReel"></div><div class="col-md-3"><label>Justification si écart</label><input type="text" class="form-control" v-model="fournitureInvJustification"></div></div>
          <button class="btn btn-primary mt-2" @click="validerInventaireFourniture">Valider</button>
        </div>
      </div>

      <!-- Transfert fournitures -->
      <div v-show="ongletFournitures === 'transfert'">
        <button class="btn btn-primary mb-3" @click="nouveauTransfertFourniture" v-if="peutEcrireSite()">Nouveau transfert</button>
        <div v-if="showTransfertFournitureForm" class="card mb-3">
          <div class="card-body">
            <div class="row"><div class="col-md-4"><label>Origine</label><select class="form-select" v-model="transfertFourniture.siteSource"><option v-for="s in sites" :key="s.id" :value="s.id">{{ s.nom }}</option></select></div><div class="col-md-4"><label>Destination</label><select class="form-select" v-model="transfertFourniture.siteDestination"><option v-for="s in sites" :key="s.id" :value="s.id">{{ s.nom }}</option></select></div><div class="col-md-4"><label>Date</label><input type="date" class="form-control" v-model="transfertFourniture.dateCreation"></div></div>
            <table class="table mt-3"><thead><tr><th>Article</th><th>Quantité</th><th></th></tr></thead><tbody><tr v-for="(ligne, idx) in transfertFourniture.lignes" :key="idx"><td><select class="form-select" v-model="ligne.article_id"><option v-for="art in articlesFourniture" :key="art.id" :value="art.id">{{ art.nom }}</option></select></td><td><input type="number" class="form-control" v-model.number="ligne.quantite" min="1"></td><td><button class="btn btn-sm btn-danger" @click="transfertFourniture.lignes.splice(idx,1)">×</button></td></tr></tbody></table>
            <button class="btn btn-sm btn-secondary" @click="ajouterLigneTransfertFourniture">+ Ligne</button>
            <div class="mt-3"><button class="btn btn-success" @click="enregistrerTransfertFourniture">Créer transfert</button> <button class="btn btn-secondary" @click="showTransfertFournitureForm=false">Annuler</button></div>
          </div>
        </div>
        <table class="table table-sm">
          <thead><tr><th>N°</th><th>Date</th><th>Origine</th><th>Destination</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="t in transfertFournituresFiltres" :key="t.id"><td>{{ t.numero }}</td><td>{{ formatDate(t.dateCreation) }}</td><td>{{ getSiteNom(t.siteSource) }}</td><td>{{ getSiteNom(t.siteDestination) }}</td><td>{{ t.statut }}</td><td><button v-if="t.statut==='en cours' && peutConfirmerTransfert && t.siteDestination === siteActif" class="btn btn-sm btn-success" @click="confirmerReceptionFourniture(t)">Confirmer</button><button v-if="t.statut==='en cours'" class="btn btn-sm btn-danger" @click="annulerTransfertFourniture(t.id)">Annuler</button></td></tr>
          </tbody>
        </table>
      </div>

      <!-- Retour bidons (fournitures) -->
      <div v-show="ongletFournitures === 'retour'">
        <h5>Enregistrer un retour de bidons</h5>
        <div class="row">
          <div class="col-md-3">
            <label>Conditionnement retourné</label>
            <select class="form-select" v-model="retourForm.conditionnementId">
              <option v-for="cond in conditionnementsRetournables" :key="cond.id" :value="cond.id">{{ cond.nom }} ({{ cond.capaciteL }}L)</option>
            </select>
          </div>
          <div class="col-md-2"><label>Quantité</label><input type="number" class="form-control" v-model.number="retourForm.quantite" min="1"></div>
          <div class="col-md-3"><label>Site de réception</label><select class="form-select" v-model="retourForm.site_id"><option v-for="s in sites" :key="s.id" :value="s.id">{{ s.nom }}</option></select></div>
          <div class="col-md-2"><label>Date</label><input type="date" class="form-control" v-model="retourForm.date"></div>
          <div class="col-md-2"><button class="btn btn-primary mt-4" @click="enregistrerRetour" v-if="peutEcrireSite()">Enregistrer</button></div>
        </div>
      </div>
    </div>

    <!-- ================= MODALES ================= -->

    <!-- Modal Mouvement -->
    <div v-if="detailMouvement" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header"><h5>Détails mouvement</h5><button class="btn-close" @click="detailMouvement=null"></button></div>
          <div class="modal-body">
            <p><strong>Date :</strong> {{ formatDate(detailMouvement.date) }}</p>
            <p><strong>Type :</strong> {{ detailMouvement.type }}</p>
            <p><strong>Description :</strong> {{ detailMouvement.description }}</p>
            <p><strong>Statut :</strong> {{ detailMouvement.statut }}</p>
            <p v-if="detailMouvement.notes && detailMouvement.notes.includes('Client :')"><strong>Client :</strong> {{ extractClientName(detailMouvement.notes) }}</p>
            <h6>Lignes</h6>
            <div class="table-responsive">
              <table class="table table-sm">
                <thead><tr><th class="text-start">Lot</th><th class="text-start">Conditionnement</th><th class="text-end">Quantité</th><th class="text-end">Volume (L)</th><th class="text-start">Site de stockage</th><th v-if="detailMouvement.type !== 'livraison'" class="text-start">Site destination</th></tr></thead>
                <tbody>
                  <tr v-for="l in detailMouvement.lignes" :key="l.id"><td class="text-start">{{ getLotNumero(l.lotId) }}</td><td class="text-start">{{ getConditionnementNom(l.conditionnementId) }}</td><td class="text-end">{{ l.quantite }}</td><td class="text-end">{{ formatVolume(l.quantite * getCapaciteConditionnement(l.conditionnementId)) }}</td><td class="text-start">{{ getSiteNom(l.siteSource) || '-' }}</td><td v-if="detailMouvement.type !== 'livraison'" class="text-start">{{ getSiteNom(l.siteDestination) || '-' }}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer"><button class="btn btn-secondary" @click="detailMouvement=null">Fermer</button></div>
        </div>
      </div>
    </div>

    <!-- Modal Transfert -->
    <div v-if="detailTransfert" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header"><h5>Détails transfert</h5><button class="btn-close" @click="detailTransfert=null"></button></div>
          <div class="modal-body">
            <p><strong>Numéro :</strong> {{ detailTransfert.numero }}</p>
            <p><strong>Date création :</strong> {{ formatDate(detailTransfert.dateCreation) }}</p>
            <p><strong>Origine :</strong> {{ getSiteNom(detailTransfert.siteSource) }}</p>
            <p><strong>Destination :</strong> {{ getSiteNom(detailTransfert.siteDestination) }}</p>
            <p><strong>Statut :</strong> {{ detailTransfert.statut }}</p>
            <h6>Lignes</h6>
            <table class="table table-sm">
              <thead><tr><th class="text-start">Lot</th><th class="text-start">Conditionnement</th><th class="text-end">Quantité</th><th class="text-end">Reçue</th></tr></thead>
              <tbody>
                <tr v-for="l in detailTransfertLignes" :key="l.id"><td class="text-start">{{ getLotNumero(l.lotId) }}</td><td class="text-start">{{ getConditionnementNom(l.conditionnementId) }}</td><td class="text-end">{{ l.quantite }}</td><td class="text-end">{{ l.quantiteRecue }}</td></tr>
              </tbody>
            </table>
          </div>
          <div class="modal-footer"><button class="btn btn-secondary" @click="detailTransfert=null">Fermer</button></div>
        </div>
      </div>
    </div>

    <!-- Modal Inventaire -->
    <div v-if="detailInventaire" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header"><h5>Détails inventaire</h5><button class="btn-close" @click="detailInventaire=null"></button></div>
          <div class="modal-body">
            <p><strong>Date :</strong> {{ formatDate(detailInventaire.date) }}</p>
            <p><strong>Site :</strong> {{ getSiteNom(detailInventaire.siteId) }}</p>
            <p><strong>Statut :</strong> {{ detailInventaire.statut }}</p>
            <h6>Lignes</h6>
            <table class="table table-sm">
              <thead><tr><th class="text-start">Lot</th><th class="text-start">Conditionnement</th><th class="text-end">Théorique</th><th class="text-end">Réelle</th><th class="text-end">Écart</th><th class="text-start">Justification</th></tr></thead>
              <tbody>
                <tr v-for="l in detailInventaireLignes" :key="l.id"><td class="text-start">{{ getLotNumero(l.lotId) }}</td><td class="text-start">{{ getConditionnementNom(l.conditionnementId) }}</td><td class="text-end">{{ l.quantiteTheorique }}</td><td class="text-end">{{ l.quantiteReelle }}</td><td class="text-end">{{ l.ecart }}</td><td class="text-start">{{ l.justification }}</td></tr>
              </tbody>
            </table>
          </div>
          <div class="modal-footer"><button class="btn btn-secondary" @click="detailInventaire=null">Fermer</button></div>
        </div>
      </div>
    </div>

    <!-- Modal Reconditionnement -->
    <div v-if="detailReconditionnement" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header"><h5>Détails reconditionnement</h5><button class="btn-close" @click="detailReconditionnement=null"></button></div>
          <div class="modal-body">
            <p><strong>Date :</strong> {{ formatDate(detailReconditionnement.date) }}</p>
            <p><strong>Site :</strong> {{ getSiteNom(detailReconditionnement.siteId) }}</p>
            <p><strong>Lot :</strong> {{ getLotNumero(detailReconditionnement.lotId) }}</p>
            <p><strong>Source :</strong> {{ getConditionnementNom(detailReconditionnement.conditionnementSource) }} → {{ detailReconditionnement.quantiteSource }} unités</p>
            <p><strong>Reconditionnement :</strong> {{ getConditionnementNom(detailReconditionnement.conditionnementDestination) }} → {{ detailReconditionnement.quantiteDestination }} unités</p>
            <p><strong>Remarques :</strong> {{ detailReconditionnement.remarques }}</p>
            <h6>Mouvements associés</h6>
            <table class="table table-sm">
              <thead><tr><th class="text-start">Date</th><th class="text-start">Description</th><th class="text-end">Volume (L)</th></tr></thead>
              <tbody>
                <tr v-for="m in detailReconditionnement.mouvements" :key="m.id"><td class="text-start">{{ formatDate(m.date) }}</td><td class="text-start">{{ m.description }}</td><td class="text-end">{{ formatVolume(m.volumeTotal) }}</td></tr>
              </tbody>
            </table>
          </div>
          <div class="modal-footer"><button class="btn btn-secondary" @click="detailReconditionnement=null">Fermer</button></div>
        </div>
      </div>
    </div>

    <!-- Modal Confirmation Transfert (huile) -->
    <div v-if="showConfirmationModal" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title">Confirmer la réception</h5><button type="button" class="btn-close" @click="showConfirmationModal=false"></button></div>
          <div class="modal-body">
            <p>Transfert {{ transfertEnCours?.numero }}</p>
            <table class="table table-sm">
              <thead><tr><th class="text-start">Lot</th><th class="text-start">Conditionnement</th><th class="text-end">Quantité envoyée</th><th class="text-end">Quantité reçue</th></tr></thead>
              <tbody>
                <tr v-for="(ligne, idx) in transfertLignes" :key="idx"><td class="text-start">{{ getLotNumero(ligne.lotId) }}</td><td class="text-start">{{ getConditionnementNom(ligne.conditionnementId) }}</td><td class="text-end">{{ ligne.quantite }}</td><td class="text-end"><input type="number" class="form-control text-end" v-model.number="ligne.quantiteRecue" min="0" :max="ligne.quantite"></td></tr>
              </tbody>
            </table>
            <div v-if="quantiteManquante" class="mt-3"><label for="raisonEcart">Raison de l’écart (obligatoire si quantité reçue inférieure)</label><textarea id="raisonEcart" class="form-control" rows="2" v-model="raisonEcart" required></textarea></div>
          </div>
          <div class="modal-footer"><button class="btn btn-secondary" @click="showConfirmationModal=false">Annuler</button><button class="btn btn-success" @click="confirmerTransfert">Confirmer</button></div>
        </div>
      </div>
    </div>

    <!-- Modales pour les mouvements de fournitures (entrée/sortie) -->
    <div v-if="fournitureShowModalMvt" class="modal" style="display:block; background:rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header"><h5>{{ fournitureModalType === 'entree' ? 'Nouvelle entrée' : 'Nouvelle sortie' }} de fourniture</h5><button class="btn-close" @click="fournitureShowModalMvt=false"></button></div>
          <div class="modal-body">
            <div class="mb-3"><label>Article</label><select class="form-select" v-model="fournitureMvtForm.article_id"><option v-for="art in articlesFourniture" :key="art.id" :value="art.id">{{ art.nom }}</option></select></div>
            <div class="mb-3"><label>Quantité</label><input type="number" class="form-control" v-model.number="fournitureMvtForm.quantite" min="1"></div>
            <div class="mb-3"><label>Date</label><input type="date" class="form-control" v-model="fournitureMvtForm.date"></div>
            <div class="mb-3"><label>Commentaire</label><input type="text" class="form-control" v-model="fournitureMvtForm.commentaire"></div>
          </div>
          <div class="modal-footer"><button class="btn btn-secondary" @click="fournitureShowModalMvt=false">Annuler</button><button class="btn btn-primary" @click="enregistrerMouvementFourniture">Enregistrer</button></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from '../db';
import apiService from '../services/api';
import Chart from 'chart.js/auto';
import { hasPermission } from '../utils/permissions';
import notificationService from '../services/notificationService';

export default {
  name: 'Stocks',
  data() {
    return {
      // ========== NAVIGATION ==========
      siteActif: 'resume',       // 'resume' ou l'id d'un site
      ongletPrincipal: 'huile',
      ongletHuile: 'etat',
      ongletCarburant: 'etat',
      ongletFournitures: 'etat',   // remplace ongletEmballage
      carburantTypesActifs: [],
      articlesFournitureActifs: [],

      // ========== SITES & PERMISSIONS ==========
      sites: [],
      sitesAutorises: [],
      sitesEcriture: [],

      // ========== HUILE ==========
      conditionnements: [],          // remplace typesContenants
      lots: [],
      stocks: [],
      mouvements: [],
      mouvementLignes: [],
      transferts: [],
      transfertLignesData: [],
      inventaires: [],
      inventaireLignesData: [],
      reconditionnements: [],
      filtreLotId: '',
      filtreConditionnementId: '',   // remplace filtreContenantId
      showTransfertForm: false,
      showInventaireForm: false,
      showReconditionnementForm: false,
      showConfirmationModal: false,
      transfertEnCours: null,
      transfertLignes: [],
      raisonEcart: '',
      transfert: { siteSource: '', siteDestination: '', dateCreation: new Date().toISOString().slice(0,10), lignes: [] },
      inventaire: { siteId: '', date: new Date().toISOString().slice(0,10), lignes: [] },
      reconditionnement: { siteId: '', date: new Date().toISOString().slice(0,10), lotId: null, conditionnementSource: null, quantiteSource: 1, conditionnementDestination: null, quantiteDestination: 1, remarques: '' },
      detailMouvement: null,
      detailTransfert: null,
      detailTransfertLignes: [],
      detailInventaire: null,
      detailInventaireLignes: [],
      detailReconditionnement: null,
      triStocksCol: 'conditionnement',
      triStocksOrdre: 'asc',
      triMouvementsCol: 'date',
      triMouvementsOrdre: 'desc',
      triTransfertsCol: 'dateCreation',
      triTransfertsOrdre: 'desc',
      triInventairesCol: 'date',
      triInventairesOrdre: 'desc',
      clients: [],
      peutConfirmerTransfert: false,

      // ========== CARBURANT ==========
      carburantTypes: [],
      carburantTypeSites: [],
      carburantUtilisations: [],
      carburantStocks: [],
      carburantMouvements: [],
      carburantInvType: null,
      carburantInvReel: 0,
      carburantInvJustification: '',
      carburantShowModalMvt: false,
      carburantModalType: 'entree',
      carburantMvtForm: { carburant_type_id: null, quantite: 0, utilisation_id: null, date: new Date().toISOString().slice(0,10) },

      // ========== FOURNITURES (nouveau) ==========
      articlesFourniture: [],
      stocksFournitures: [],
      mouvementsFournitures: [],
      transfertsFournitures: [],
      transfertFournitureLignes: [],
      conditionnementComposants: [], // pour la nomenclature

      // Inventaire fourniture
      fournitureInvArticle: null,
      fournitureInvReel: 0,
      fournitureInvJustification: '',
      // Mouvement fourniture
      fournitureShowModalMvt: false,
      fournitureModalType: 'entree',
      fournitureMvtForm: { article_id: null, quantite: 1, date: new Date().toISOString().slice(0,10), commentaire: '' },
      // Transfert fourniture
      showTransfertFournitureForm: false,
      transfertFourniture: { siteSource: '', siteDestination: '', dateCreation: new Date().toISOString().slice(0,10), lignes: [] },
      // Retour bidons
      retourForm: { conditionnementId: null, quantite: 0, site_id: null, date: new Date().toISOString().slice(0,10) },

      // ========== GRAPHIQUES ==========
      chartHuile: null,
      chartResume: null,
      chartTimeout: null,
    };
  },

  computed: {
    // ---------- HUILE ----------
    lotsDisponiblesFiltre() {
      if (this.siteActif === 'resume') return [];
      const stockLots = this.stocks.filter(s => s.siteId === this.siteActif && s.quantite > 0).map(s => s.lotId);
      return this.lots.filter(l => stockLots.includes(l.id));
    },
    lotsSource() {
      if (!this.transfert.siteSource) return [];
      const stockLots = this.stocks.filter(s => s.siteId === this.transfert.siteSource && s.quantite > 0).map(s => s.lotId);
      return this.lots.filter(l => stockLots.includes(l.id));
    },
    lotsInventaire() {
      if (!this.inventaire.siteId) return [];
      const stockLots = this.stocks.filter(s => s.siteId === this.inventaire.siteId).map(s => s.lotId);
      return this.lots.filter(l => stockLots.includes(l.id));
    },
    lotsRecents() {
      const aujourdhui = new Date();
      const limite = new Date(aujourdhui.getTime() - 52 * 7 * 24 * 60 * 60 * 1000);
      return this.lots.filter(l => new Date(l.dateCreation) >= limite);
    },
    lotsReconditionnement() {
      if (!this.reconditionnement.siteId) return [];
      const stockLots = this.stocks.filter(s => s.siteId === this.reconditionnement.siteId && s.quantite > 0).map(s => s.lotId);
      return this.lots.filter(l => stockLots.includes(l.id));
    },
    stocksFiltresTries() {
      let result = this.stocks.filter(s => s.siteId === this.siteActif);
      if (this.filtreLotId) result = result.filter(s => s.lotId === this.filtreLotId);
      if (this.filtreConditionnementId) result = result.filter(s => s.conditionnementId === this.filtreConditionnementId);
      const col = this.triStocksCol;
      const ordre = this.triStocksOrdre;

      // Tri par lot, conditionnement, quantité ou volume
      result.sort((a,b) => {
        let valA, valB;
        if (col === 'lot') {
          const nomA = this.getLotNumero(a.lotId);
          const nomB = this.getLotNumero(b.lotId);
          return ordre==='asc' ? nomA.localeCompare(nomB) : nomB.localeCompare(nomA);
        } else if (col === 'conditionnement') {
          const capA = this.getCapaciteConditionnement(a.conditionnementId);
          const capB = this.getCapaciteConditionnement(b.conditionnementId);
          return ordre==='asc' ? capA - capB : capB - capA;
        } else if (col === 'quantite') {
          return ordre==='asc' ? a.quantite - b.quantite : b.quantite - a.quantite;
        } else if (col === 'volume') {
          const volA = a.quantite * this.getCapaciteConditionnement(a.conditionnementId);
          const volB = b.quantite * this.getCapaciteConditionnement(b.conditionnementId);
          return ordre==='asc' ? volA - volB : volB - volA;
        }
        return 0;
      });
      return result;
    },
    mouvementsFiltres() {
      const siteStocksLots = this.stocks.filter(s => s.siteId === this.siteActif).map(s => s.lotId);
      return this.mouvements.filter(m => {
        const lignes = this.mouvementLignes.filter(l => l.mouvementId === m.id);
        return lignes.some(l => l.siteSource === this.siteActif || l.siteDestination === this.siteActif);
      });
    },
    transfertsFiltres() {
      return this.transferts.filter(t => t.siteSource === this.siteActif || t.siteDestination === this.siteActif);
    },
    inventairesFiltres() {
      return this.inventaires.filter(inv => inv.siteId === this.siteActif);
    },
    reconditionnementsFiltres() {
      return this.reconditionnements.filter(r => r.siteId === this.siteActif);
    },
    conditionnementsDisponiblesPourLot(lotId) {
      if (!this.transfert.siteSource || !lotId) return [];
      const stocks = this.stocks.filter(s => s.siteId === this.transfert.siteSource && s.lotId === lotId && s.quantite > 0);
      return stocks.map(s => {
        const cond = this.conditionnements.find(c => c.id === s.conditionnementId);
        return { id: s.conditionnementId, nom: cond ? cond.nom : '-', max: s.quantite };
      });
    },
    quantiteMax(lotId, conditionnementId) {
      const stock = this.stocks.find(s => s.siteId === this.transfert.siteSource && s.lotId === lotId && s.conditionnementId === conditionnementId);
      return stock ? stock.quantite : 0;
    },
    conditionnementsSource() {
      if (!this.reconditionnement.siteId || !this.reconditionnement.lotId) return [];
      const stocks = this.stocks.filter(s => s.siteId === this.reconditionnement.siteId && s.lotId === this.reconditionnement.lotId && s.quantite > 0);
      return stocks.map(s => {
        const cond = this.conditionnements.find(c => c.id === s.conditionnementId);
        return { id: s.conditionnementId, nom: cond ? cond.nom : '-', max: s.quantite };
      });
    },
    quantiteSourceMax() {
      const stock = this.stocks.find(s => s.siteId === this.reconditionnement.siteId && s.lotId === this.reconditionnement.lotId && s.conditionnementId === this.reconditionnement.conditionnementSource);
      return stock ? stock.quantite : 0;
    },
    conditionnementsDest() {
      if (!this.reconditionnement.conditionnementSource) return [];
      const sourceCond = this.conditionnements.find(c => c.id === this.reconditionnement.conditionnementSource);
      if (!sourceCond) return [];
      return this.conditionnements.filter(c => c.capaciteL <= sourceCond.capaciteL);
    },
    conditionnementsPourInventaire(lotId) {
      if (!this.inventaire.siteId) return [];
      if (lotId === '__new__') return this.conditionnements;
      const stocks = this.stocks.filter(s => s.siteId === this.inventaire.siteId && s.lotId === lotId);
      const condIds = stocks.map(s => s.conditionnementId);
      return this.conditionnements.filter(c => condIds.includes(c.id));
    },
    quantiteManquante() {
      return this.transfertLignes.some(l => l.quantiteRecue < l.quantite);
    },
    totalVolumeHuile() {
      return this.stocks.filter(s => s.siteId === this.siteActif)
        .reduce((sum, s) => sum + s.quantite * this.getCapaciteConditionnement(s.conditionnementId), 0);
    },
    ecartsInventaire() {
      const ecarts = [];
      for (let inv of this.inventairesFiltres) {
        const lignes = this.inventaireLignesData.filter(l => l.inventaireId === inv.id && l.ecart !== 0);
        for (let l of lignes) ecarts.push({ ...l, date: inv.date, siteId: inv.siteId });
      }
      return ecarts.sort((a,b) => new Date(b.date) - new Date(a.date));
    },
    totalEcartInventaire() {
      return this.ecartsInventaire.reduce((sum, e) => sum + Math.abs(e.ecart) * this.getCapaciteConditionnement(e.conditionnementId), 0);
    },
    ecartsTransfert() {
      const ecarts = [];
      for (let t of this.transfertsFiltres) {
        const lignes = this.transfertLignesData.filter(l => l.transfertId === t.id && l.quantiteRecue < l.quantite);
        for (let l of lignes) ecarts.push({ ...l, numero: t.numero, date: t.dateCreation, siteSource: t.siteSource, siteDestination: t.siteDestination, raison: (t.notes||'').split('\n').find(line=>line.includes('Raison'))||'-' });
      }
      return ecarts.sort((a,b) => new Date(b.date) - new Date(a.date));
    },
    totalManquantTransfert() {
      return this.ecartsTransfert.reduce((sum, e) => sum + (e.quantite - e.quantiteRecue) * this.getCapaciteConditionnement(e.conditionnementId), 0);
    },
    pertesReconditionnement() {
      const pertes = [];
      for (let r of this.reconditionnementsFiltres) {
        const sourceCond = this.conditionnements.find(c => c.id === r.conditionnementSource);
        const destCond = this.conditionnements.find(c => c.id === r.conditionnementDestination);
        if (!sourceCond || !destCond) continue;
        const volSource = r.quantiteSource * sourceCond.capaciteL;
        const volDest = r.quantiteDestination * destCond.capaciteL;
        const perte = volSource - volDest;
        if (perte > 0.01) pertes.push({ ...r, perte: perte.toFixed(1) });
      }
      return pertes.sort((a,b) => new Date(b.date) - new Date(a.date));
    },
    totalPerteReconditionnement() {
      return this.pertesReconditionnement.reduce((sum, p) => sum + parseFloat(p.perte), 0);
    },
    lotsHorsProduction() {
      const lotsHorsProd = [];
      for (let inv of this.inventairesFiltres) {
        const lignes = this.inventaireLignesData.filter(l => l.inventaireId === inv.id && l.quantiteReelle > 0 && l.quantiteTheorique === 0);
        for (let l of lignes) {
          const lot = this.lots.find(lot => lot.id === l.lotId);
          if (lot) lotsHorsProd.push({ id: l.id, date: inv.date, numero: lot.numero, siteId: inv.siteId, conditionnementId: l.conditionnementId, quantite: l.quantiteReelle });
        }
      }
      return lotsHorsProd.sort((a,b) => new Date(b.date) - new Date(a.date));
    },

    // ---------- CARBURANT ----------
    sitePeutGererCarburant() {
      if (this.siteActif === 'resume') return false;
      return this.carburantTypeSites.some(cts => cts.site_id === this.siteActif);
    },
    carburantTypesFiltres() {
      if (this.siteActif === 'resume') return [];
      const typeIds = this.carburantTypeSites.filter(cts => cts.site_id === this.siteActif).map(cts => cts.carburant_type_id);
      return this.carburantTypes.filter(ct => typeIds.includes(ct.id));
    },
    carburantMouvementsFiltres() {
      return this.carburantMouvements.filter(m => m.site_id === this.siteActif);
    },
    carburantStockTheorique() {
      if (!this.carburantInvType) return 0;
      const s = this.carburantStocks.find(s => s.carburant_type_id === this.carburantInvType && s.site_id === this.siteActif);
      return s ? s.quantite : 0;
    },

    // ---------- FOURNITURES ----------
    mouvementsFournituresFiltres() {
      return this.mouvementsFournitures.filter(m => m.site_id === this.siteActif);
    },
    transfertFournituresFiltres() {
      return this.transfertsFournitures.filter(t => t.siteSource === this.siteActif || t.siteDestination === this.siteActif);
    },
    conditionnementsRetournables() {
      return this.conditionnements.filter(cond => cond.retour_possible);
    },
   
  },

  watch: {
    siteActif(newVal) {
      if (newVal === 'resume') {
        this.$nextTick(() => this.initChartResume());
      } else if (newVal !== 'resume' && this.ongletPrincipal === 'huile') {
        this.initChartHuile();
      }
    },
    stocks: { deep: true, handler() { clearTimeout(this.chartTimeout); this.chartTimeout = setTimeout(() => this.initChartHuile(), 300); } },
    mouvementLignes: { deep: true, handler() { clearTimeout(this.chartTimeout); this.chartTimeout = setTimeout(() => this.initChartHuile(), 300); } },
    mouvements: { deep: true, handler() { clearTimeout(this.chartTimeout); this.chartTimeout = setTimeout(() => this.initChartHuile(), 300); } },
  },

  async mounted() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.sites = await db.sites.toArray();
    await this.chargerAccesSites(user.role);
    await this.chargerDonneesHuile();
    await this.chargerDonneesCarburant();
    await this.chargerDonneesFournitures();
    // Après avoir chargé les stocks
    this.carburantTypesActifs = this.carburantTypes.filter(ct => ct.actif !== false);
    this.articlesFournitureActifs = this.articlesFourniture.filter(a => a.actif !== false);
    this.peutConfirmerTransfert = await hasPermission(user, 'stocks', 'ecriture');
    if (this.siteActif !== 'resume') this.initChartHuile();
    this.initChartResume();
  },

  methods: {
    // ===================== ACCÈS SITES =====================
    async chargerAccesSites(role) {
      const acces = await db.acces_sites.where('role').equals(role).toArray();
      if (acces.length === 0) {
        this.sitesAutorises = [...this.sites];
        this.sitesEcriture = [...this.sites];
        return;
      }
      const lectureIds = acces.filter(a => a.niveau === 'lecture' || a.niveau === 'ecriture').map(a => a.siteId);
      const ecritureIds = acces.filter(a => a.niveau === 'ecriture').map(a => a.siteId);
      this.sitesAutorises = this.sites.filter(s => lectureIds.includes(s.id));
      this.sitesEcriture = this.sites.filter(s => ecritureIds.includes(s.id));
    },
    peutEcrireSite() {
      if (this.siteActif === 'resume') return false;
      return this.sitesEcriture.some(s => s.id === this.siteActif);
    },

    // ===================== CHARGEMENTS =====================
    async chargerDonneesHuile() {
      this.conditionnements = await db.conditionnements.toArray() || [];
      this.lots = await db.lots.toArray() || [];
      this.stocks = await db.stocks.toArray() || [];
      this.mouvements = await db.mouvements.toArray() || [];
      this.mouvementLignes = await db.mouvement_lignes.toArray() || [];
      for (let m of this.mouvements) {
        const lignes = this.mouvementLignes.filter(l => l.mouvementId === m.id);
        m.volumeTotal = lignes.reduce((acc, l) => acc + (l.quantite * this.getCapaciteConditionnement(l.conditionnementId)), 0);
      }
      this.transferts = await db.transferts.toArray() || [];
      this.transfertLignesData = await db.transfert_lignes.toArray() || [];
      this.inventaires = await db.inventaires.toArray() || [];
      this.inventaireLignesData = await db.inventaire_lignes.toArray() || [];
      this.reconditionnements = await db.reconditionnements.toArray() || [];
      this.clients = await db.clients.toArray() || [];
    },
    async chargerDonneesCarburant() {
      this.carburantTypes = await db.carburant_types.toArray();
      this.carburantTypeSites = await db.carburant_type_sites.toArray();
      this.carburantUtilisations = await db.carburant_utilisations.toArray();
      this.carburantStocks = await db.carburant_stocks.toArray();
      this.carburantMouvements = await db.carburant_mouvements.toArray();
    },
    async chargerDonneesFournitures() {
      this.articlesFourniture = await db.articles_fourniture.toArray();
      this.stocksFournitures = await db.stocks_fournitures.toArray();
      this.mouvementsFournitures = await db.mouvements_fournitures.toArray();
      this.transfertsFournitures = await db.transferts_fournitures?.toArray() || [];
      this.transfertFournitureLignes = await db.transfert_fourniture_lignes?.toArray() || [];
      this.conditionnementComposants = await db.conditionnement_composants.toArray();
    },

    // ===================== UTILITAIRES =====================
    formatVolume(volume) { return volume ? Math.round(volume).toLocaleString('fr-FR') : '0'; },
    formatDate(dateString) { return dateString ? new Date(dateString).toLocaleDateString('fr-FR') : ''; },
    getSiteNom(id) { const s = this.sites.find(s => s.id === id); return s ? s.nom : '-'; },
    getLotNumero(id) { const lot = this.lots.find(l => l.id === id); return lot ? lot.numero : '-'; },
    getConditionnementNom(id) { const cond = this.conditionnements.find(c => c.id === id); return cond ? cond.nom : '-'; },
    getCapaciteConditionnement(id) { const cond = this.conditionnements.find(c => c.id === id); return cond ? cond.capaciteL : 0; },
    getArticleFournitureNom(id) { const art = this.articlesFourniture.find(a => a.id === id); return art ? art.nom : '?'; },
    extractClientName(notes) {
      if (!notes) return '';
      const match = notes.match(/Client : (.*?)(\n|$)/);
      return match ? match[1] : '';
    },

    // ===================== HUILE (méthodes existantes adaptées) =====================
    getQuantiteParConditionnement(conditionnementId) {
      return this.stocks.filter(s => s.siteId === this.siteActif && s.conditionnementId === conditionnementId)
        .reduce((sum, s) => sum + s.quantite, 0);
    },
    triStocks(colonne) {
      if (this.triStocksCol === colonne) this.triStocksOrdre = this.triStocksOrdre === 'asc' ? 'desc' : 'asc';
      else { this.triStocksCol = colonne; this.triStocksOrdre = 'asc'; }
    },
    triMouvements(colonne) {
      if (this.triMouvementsCol === colonne) this.triMouvementsOrdre = this.triMouvementsOrdre === 'asc' ? 'desc' : 'asc';
      else { this.triMouvementsCol = colonne; this.triMouvementsOrdre = 'asc'; }
    },
    triTransferts(colonne) {
      if (this.triTransfertsCol === colonne) this.triTransfertsOrdre = this.triTransfertsOrdre === 'asc' ? 'desc' : 'asc';
      else { this.triTransfertsCol = colonne; this.triTransfertsOrdre = 'asc'; }
    },
    triInventaires(colonne) {
      if (this.triInventairesCol === colonne) this.triInventairesOrdre = this.triInventairesOrdre === 'asc' ? 'desc' : 'asc';
      else { this.triInventairesCol = colonne; this.triInventairesOrdre = 'asc'; }
    },

    // ----- Transferts -----
    onSiteSourceChange() { this.transfert.lignes = []; },
    onLotChange(idx) {
      const ligne = this.transfert.lignes[idx];
      ligne.conditionnementId = '';
      ligne.quantite = 1;
    },
    onConditionnementChange(idx) {
      const ligne = this.transfert.lignes[idx];
      const max = this.quantiteMax(ligne.lotId, ligne.conditionnementId);
      if (ligne.quantite > max) ligne.quantite = max;
    },
    ajouterLigneTransfert() { this.transfert.lignes.push({ lotId: '', conditionnementId: '', quantite: 1 }); },
    supprimerLigneTransfert(idx) { this.transfert.lignes.splice(idx, 1); },
    annulerTransfert() { this.showTransfertForm = false; this.transfert.lignes = []; },
    async enregistrerTransfert() {
      // ... (logique inchangée mais utilise conditionnementId au lieu de typeContenantId)
      if (this.transfert.lignes.length === 0) { alert('Ajoutez au moins une ligne.'); return; }
      for (const ligne of this.transfert.lignes) {
        const stock = await db.stocks.where({ siteId: this.transfert.siteSource, lotId: ligne.lotId, conditionnementId: ligne.conditionnementId }).first();
        if (!stock || stock.quantite < ligne.quantite) {
          alert(`Stock insuffisant pour le lot ${this.getLotNumero(ligne.lotId)} et conditionnement ${this.getConditionnementNom(ligne.conditionnementId)}`);
          return;
        }
      }
      const now = new Date();
      const dateStr = now.toISOString().slice(0,10).replace(/-/g, '');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const num = `TR${dateStr}-${random}`;
      const transfertData = {
        numero: num,
        siteSource: this.transfert.siteSource,
        siteDestination: this.transfert.siteDestination,
        dateCreation: this.transfert.dateCreation,
        statut: 'en cours',
        createurId: JSON.parse(localStorage.getItem('currentUser')).id,
        notes: ''
      };
      try {
        const transfertId = await apiService.ajouter('transferts', transfertData, { audit: true });
        for (const ligne of this.transfert.lignes) {
          await apiService.ajouter('transfert_lignes', { transfertId, lotId: ligne.lotId, conditionnementId: ligne.conditionnementId, quantite: ligne.quantite, quantiteRecue: 0 });
        }
        await apiService.ajouter('mouvements', { type: 'transfert', date: this.transfert.dateCreation, description: `Transfert ${num} de ${this.getSiteNom(this.transfert.siteSource)} vers ${this.getSiteNom(this.transfert.siteDestination)}`, statut: 'en cours' });
        await this.chargerDonneesHuile();
        this.annulerTransfert();
        alert('Transfert créé');
      } catch (error) { console.error(error); alert('Erreur'); }
    },
    async annulerTransfertBackend(id) {
      if (!confirm('Annuler ce transfert ?')) return;
      try {
        await apiService.modifier('transferts', id, { statut: 'annulé' });
        await this.chargerDonneesHuile();
        alert('Transfert annulé');
      } catch (error) { console.error(error); alert('Erreur'); }
    },
    async ouvrirConfirmationTransfert(id) {
      await this.chargerDonneesHuile();
      this.transfertEnCours = this.transferts.find(t => t.id === id);
      if (!this.transfertEnCours) { alert('Transfert introuvable.'); return; }
      this.transfertLignes = this.transfertLignesData
        .filter(l => l.transfertId === id)
        .map(l => ({ ...l, quantiteRecue: l.quantiteRecue || l.quantite }));
      this.raisonEcart = '';
      this.showConfirmationModal = true;
    },
    async confirmerTransfert() {
      // ... remplace typeContenantId par conditionnementId dans la mise à jour des stocks
      for (const ligne of this.transfertLignes) {
        if (ligne.quantiteRecue > ligne.quantite) { alert(`Quantité reçue dépasse l'envoyé pour le lot ${this.getLotNumero(ligne.lotId)}.`); return; }
      }
      if (this.quantiteManquante && (!this.raisonEcart || this.raisonEcart.trim() === '')) { alert('Veuillez indiquer une raison pour l\'écart.'); return; }
      try {
        for (const ligne of this.transfertLignes) {
          await apiService.modifier('transfert_lignes', ligne.id, { quantiteRecue: ligne.quantiteRecue });
        }
        for (const ligne of this.transfertLignes) {
          await this.modifierStock(this.transfertEnCours.siteSource, ligne.lotId, ligne.conditionnementId, -ligne.quantite);
          await this.modifierStock(this.transfertEnCours.siteDestination, ligne.lotId, ligne.conditionnementId, ligne.quantiteRecue);
        }
        this.transfertEnCours.statut = 'confirmé';
        this.transfertEnCours.dateConfirmation = new Date().toISOString();
        await apiService.modifier('transferts', this.transfertEnCours.id, this.transfertEnCours, { audit: true });
        if (this.quantiteManquante) {
          const newNotes = (this.transfertEnCours.notes || '') + '\nRaison de l\'écart : ' + this.raisonEcart;
          await apiService.modifier('transferts', this.transfertEnCours.id, { notes: newNotes });
        }
        const mouvementId = await apiService.ajouter('mouvements', { type: 'transfert', date: new Date().toISOString(), description: `Transfert ${this.transfertEnCours.numero} confirmé`, statut: 'validé', notes: this.quantiteManquante ? this.raisonEcart : '' });
        for (const ligne of this.transfertLignes) {
          await apiService.ajouter('mouvement_lignes', { mouvementId, lotId: ligne.lotId, conditionnementId: ligne.conditionnementId, quantite: ligne.quantiteRecue, siteSource: this.transfertEnCours.siteSource, siteDestination: this.transfertEnCours.siteDestination });
        }
        // notifications...
        await this.chargerDonneesHuile();
        this.showConfirmationModal = false;
        alert('Transfert confirmé');
      } catch (error) { console.error(error); alert('Erreur'); }
    },

    // ----- Inventaires -----
    onInventaireSiteChange() {
      const stocksSite = this.stocks.filter(s => s.siteId === this.inventaire.siteId);
      const lignes = stocksSite.map(s => ({
        lotId: s.lotId, conditionnementId: s.conditionnementId, quantiteTheorique: s.quantite,
        quantiteReelle: 0, justification: '', nouveauLotNumero: '', isNew: false
      }));
      this.inventaire.lignes = lignes;
    },
    onInventaireLotChange(idx) {
      const ligne = this.inventaire.lignes[idx];
      if (ligne.lotId === '__new__') { 
        ligne.conditionnementId = '';
        ligne.quantiteTheorique = 0;
      } else {
        const stock = this.stocks.find(s => s.siteId === this.inventaire.siteId && s.lotId === ligne.lotId && s.conditionnementId === ligne.conditionnementId);
        ligne.quantiteTheorique = stock ? stock.quantite : 0;
      }
    },
    annulerInventaire() { this.showInventaireForm = false; this.inventaire.lignes = []; },
    async enregistrerInventaire() {
      // ... vérifications, puis création avec conditionnementId
      for (const ligne of this.inventaire.lignes) {
        if (!ligne.conditionnementId) { alert('Veuillez sélectionner un conditionnement pour chaque ligne'); return; }
        if (ligne.quantiteReelle === undefined || ligne.quantiteReelle === null) { alert('Veuillez saisir une quantité réelle'); return; }
        const ecart = ligne.quantiteReelle - (ligne.quantiteTheorique || 0);
        if (ecart !== 0 && (!ligne.justification || ligne.justification.trim() === '')) {
          alert(`Pour la ligne ${this.getConditionnementNom(ligne.conditionnementId)} du lot ${ligne.lotId === '__new__' ? 'nouveau lot' : this.getLotNumero(ligne.lotId)}, un écart de ${ecart} nécessite une justification.`);
          return;
        }
      }
      try {
        const invId = await apiService.ajouter('inventaires', { siteId: this.inventaire.siteId, date: this.inventaire.date, statut: 'validé' });
        for (const ligne of this.inventaire.lignes) {
          let lotId = ligne.lotId;
          if (lotId === '__new__') {
            const newLot = await apiService.ajouter('lots', { numero: ligne.nouveauLotNumero, dateCreation: new Date().toISOString() });
            lotId = newLot;
          }
          const stock = await db.stocks.where({ siteId: this.inventaire.siteId, lotId, conditionnementId: ligne.conditionnementId }).first();
          const theorique = stock ? stock.quantite : 0;
          const ecart = ligne.quantiteReelle - theorique;
          await apiService.ajouter('inventaire_lignes', { inventaireId: invId, lotId, conditionnementId: ligne.conditionnementId, quantiteTheorique: theorique, quantiteReelle: ligne.quantiteReelle, ecart, justification: ligne.justification || '' });
          if (ecart !== 0) await this.modifierStock(this.inventaire.siteId, lotId, ligne.conditionnementId, ecart);
        }
        await apiService.ajouter('mouvements', { type: 'inventaire', date: this.inventaire.date, description: `Inventaire ${this.getSiteNom(this.inventaire.siteId)}`, statut: 'validé' });
        // notifications...
        await this.chargerDonneesHuile();
        this.annulerInventaire();
        alert('Inventaire enregistré');
      } catch (error) { console.error(error); alert('Erreur'); }
    },

    // ----- Reconditionnements -----
    onReconditionnementSiteChange() { this.reconditionnement.lotId = null; this.reconditionnement.conditionnementSource = null; },
    onReconditionnementLotChange() { this.reconditionnement.conditionnementSource = null; },
    onReconditionnementSourceChange() {
      const max = this.quantiteSourceMax;
      if (this.reconditionnement.quantiteSource > max) this.reconditionnement.quantiteSource = max;
    },
    annulerReconditionnement() { this.showReconditionnementForm = false; },
    async enregistrerReconditionnement() {
      const sourceCond = this.conditionnements.find(c => c.id === this.reconditionnement.conditionnementSource);
      const destCond = this.conditionnements.find(c => c.id === this.reconditionnement.conditionnementDestination);
      if (!sourceCond || !destCond) return;
      const volumeSource = this.reconditionnement.quantiteSource * sourceCond.capaciteL;
      const volumeDest = this.reconditionnement.quantiteDestination * destCond.capaciteL;
      if (Math.abs(volumeSource - volumeDest) > 0.01) {
        if (!this.reconditionnement.remarques || this.reconditionnement.remarques.trim() === '') {
          alert('Les volumes source et destination ne correspondent pas. Ajoutez une remarque.');
          return;
        }
      }
      const stockSource = await db.stocks.where({ siteId: this.reconditionnement.siteId, lotId: this.reconditionnement.lotId, conditionnementId: this.reconditionnement.conditionnementSource }).first();
      if (!stockSource || stockSource.quantite < this.reconditionnement.quantiteSource) { alert('Stock source insuffisant'); return; }
      try {
        await this.modifierStock(this.reconditionnement.siteId, this.reconditionnement.lotId, this.reconditionnement.conditionnementSource, -this.reconditionnement.quantiteSource);
        await this.modifierStock(this.reconditionnement.siteId, this.reconditionnement.lotId, this.reconditionnement.conditionnementDestination, this.reconditionnement.quantiteDestination);
        const reconditionnementId = await apiService.ajouter('reconditionnements', {
          siteId: this.reconditionnement.siteId, date: this.reconditionnement.date,
          lotId: this.reconditionnement.lotId,
          conditionnementSource: this.reconditionnement.conditionnementSource, quantiteSource: this.reconditionnement.quantiteSource,
          conditionnementDestination: this.reconditionnement.conditionnementDestination, quantiteDestination: this.reconditionnement.quantiteDestination,
          remarques: this.reconditionnement.remarques || ''
        });
        // mouvements associés...
        await this.chargerDonneesHuile();
        this.annulerReconditionnement();
        alert('Reconditionnement effectué');
      } catch (error) { console.error(error); alert('Erreur'); }
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
      // vérification seuil notif (optionnel)
    },

    // Détails (modales)
    async voirMouvement(id) {
      const mouvement = this.mouvements.find(m => m.id === id);
      const lignes = this.mouvementLignes.filter(l => l.mouvementId === id);
      const lignesAvecVolume = lignes.map(l => ({ ...l, volume: l.quantite * this.getCapaciteConditionnement(l.conditionnementId) }));
      let facture = null;
      if (mouvement.type === 'livraison') {
        const match = mouvement.description.match(/facture (\S+)/i);
        if (match) {
          const numeroFacture = match[1];
          facture = await db.factures.where('numero').equals(numeroFacture).first();
        }
      }
      this.detailMouvement = { ...mouvement, lignes: lignesAvecVolume, facture };
    },
    voirTransfert(id) {
      this.detailTransfert = this.transferts.find(t => t.id === id);
      this.detailTransfertLignes = this.transfertLignesData.filter(l => l.transfertId === id);
    },
    voirInventaire(id) {
      this.detailInventaire = this.inventaires.find(i => i.id === id);
      this.detailInventaireLignes = this.inventaireLignesData.filter(l => l.inventaireId === id);
    },
    async voirReconditionnement(id) {
      const reconditionnement = this.reconditionnements.find(r => r.id === id);
      const mouvementsAssocies = this.mouvements.filter(m =>
        m.description.includes(`Reconditionnement sur site ${this.getSiteNom(reconditionnement.siteId)}`) &&
        new Date(m.date).toISOString().slice(0,10) === reconditionnement.date
      );
      this.detailReconditionnement = { ...reconditionnement, mouvements: mouvementsAssocies };
    },

    // Graphique huile
    async initChartHuile() {
      const ctx = document.getElementById('chartHuile');
      if (!ctx) return;
      if (this.chartHuile) { this.chartHuile.destroy(); this.chartHuile = null; }
      await this.$nextTick();

      const capacites = {};
      this.conditionnements.forEach(c => { capacites[c.id] = c.capaciteL; });

      const aujourdhui = new Date();
      const moisLabels = [];
      const stockParMois = {};
      for (let i = 11; i >= 0; i--) {
        const date = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() - i, 1);
        const moisKey = `${date.getFullYear()}-${date.getMonth()+1}`;
        const moisLabel = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        moisLabels.push(moisLabel);
        stockParMois[moisKey] = { [this.siteActif]: 0 };
      }

      let stocksCumul = { [this.siteActif]: 0 };
      const mouvementsTries = [...this.mouvements].sort((a,b) => new Date(a.date) - new Date(b.date));
      let moisCourant = null;
      for (let m of mouvementsTries) {
        const date = new Date(m.date);
        const moisKey = `${date.getFullYear()}-${date.getMonth()+1}`;
        if (moisCourant && moisCourant !== moisKey && stockParMois[moisCourant]) {
          stockParMois[moisCourant][this.siteActif] = stocksCumul[this.siteActif];
        }
        moisCourant = moisKey;
        const lignes = this.mouvementLignes.filter(l => l.mouvementId === m.id);
        for (let l of lignes) {
          if (l.siteSource) stocksCumul[this.siteActif] -= l.quantite * capacites[l.conditionnementId];
          if (l.siteDestination) stocksCumul[this.siteActif] += l.quantite * capacites[l.conditionnementId];
          if (stocksCumul[this.siteActif] < 0) stocksCumul[this.siteActif] = 0;
        }
      }
      if (moisCourant && stockParMois[moisCourant]) stockParMois[moisCourant][this.siteActif] = stocksCumul[this.siteActif];

      let dernierStockConnu = 0;
      for (let mois of Object.keys(stockParMois).sort()) {
        if (stockParMois[mois][this.siteActif] === 0) stockParMois[mois][this.siteActif] = dernierStockConnu;
        else dernierStockConnu = stockParMois[mois][this.siteActif];
      }
      const data = Object.keys(stockParMois).sort().map(m => stockParMois[m][this.siteActif] || 0);

      this.chartHuile = new Chart(ctx, {
        type: 'line',
        data: {
          labels: moisLabels,
          datasets: [{
            label: this.getSiteNom(this.siteActif),
            data,
            borderColor: '#ED1C24',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          scales: {
            y: { ticks: { callback: (value) => this.formatVolume(value) } }
          }
        }
      });
    },
    nouveauTransfert() { this.showTransfertForm = true; this.transfert.lignes = []; },
    nouvelInventaire() { this.showInventaireForm = true; this.onInventaireSiteChange(); },
    nouveauReconditionnement() { this.showReconditionnementForm = true; this.reconditionnement.remarques = ''; },
    totalFournituresSite(siteId) {
      return this.stocksFournitures.filter(s => s.site_id === siteId).reduce((sum, s) => sum + s.quantite, 0);
    },
    totalVolumeHuileSite(siteId) {
      return this.stocks.filter(s => s.siteId === siteId).reduce((sum, s) => sum + s.quantite * this.getCapaciteConditionnement(s.conditionnementId), 0);
    },
    totalVolumeCarburantSite(siteId) {
      return this.carburantStocks.filter(s => s.site_id === siteId).reduce((sum, s) => sum + s.quantite, 0);
    },

 // ===================== CARBURANT =====================
    getStockCarburant(typeId) {
      const s = this.carburantStocks.find(st => st.carburant_type_id === typeId && st.site_id === this.siteActif);
      return s ? s.quantite : 0;
    },
    getCarburantNom(id) { const t = this.carburantTypes.find(ct => ct.id === id); return t ? t.nom : '?'; },
    getUtilisationNom(id) { if (!id) return ''; const u = this.carburantUtilisations.find(cu => cu.id === id); return u ? u.nom : ''; },
    nouveauMouvementCarburant(type) {
      this.carburantModalType = type;
      this.carburantMvtForm = { carburant_type_id: this.carburantTypesFiltres.length ? this.carburantTypesFiltres[0].id : null, quantite: 0, utilisation_id: type === 'sortie' ? (this.carburantUtilisations.length ? this.carburantUtilisations[0].id : null) : null, date: new Date().toISOString().slice(0,10) };
      this.carburantShowModalMvt = true;
    },
    async enregistrerMouvementCarburant() {
      const { carburant_type_id, quantite, utilisation_id, date } = this.carburantMvtForm;
      if (!carburant_type_id || quantite <= 0) return;
      const type = this.carburantModalType === 'entree' ? 'entree' : 'sortie';
      const mouvement = { id: crypto.randomUUID(), carburant_type_id, site_id: this.siteActif, date, type, quantite, utilisation_id: utilisation_id || null, source: 'manuel' };
      await apiService.ajouter('carburant_mouvements', mouvement, { audit: true });
      await this.ajusterStockCarburant(carburant_type_id, quantite * (type === 'entree' ? 1 : -1));
      await this.verifierSeuilCarburant(carburant_type_id);
      this.carburantShowModalMvt = false;
      await this.chargerDonneesCarburant();
    },
    async ajusterStockCarburant(typeId, delta) {
      let stock = await db.carburant_stocks.where({ carburant_type_id: typeId, site_id: this.siteActif }).first();
      if (stock) {
        stock.quantite += delta;
        if (stock.quantite < 0) stock.quantite = 0;
        await db.carburant_stocks.update(stock.id, stock);
      } else if (delta > 0) {
        await db.carburant_stocks.add({ id: crypto.randomUUID(), carburant_type_id: typeId, site_id: this.siteActif, quantite: delta });
      }
    },
    async verifierSeuilCarburant(typeId) {
      const config = await notificationService.getConfig();
      const seuil = config.stock_faible_carburant?.seuils?.par_defaut || 50;
      const stock = await db.carburant_stocks.where({ carburant_type_id: typeId, site_id: this.siteActif }).first();
      const quantite = stock ? stock.quantite : 0;
      if (quantite <= seuil) {
        const type = this.carburantTypes.find(t => t.id === typeId);
        const site = this.sites.find(s => s.id === this.siteActif);
        await notificationService.envoyerMessageSysteme('stock_faible_carburant', { type: type?.nom || 'Inconnu', site: site?.nom || 'Inconnu', quantite, seuil });
      }
    },
    async validerInventaireCarburant() {
      const ecart = this.carburantInvReel - this.carburantStockTheorique;
      if (ecart === 0) { alert('Aucun écart.'); return; }
      if (!this.carburantInvJustification.trim()) { alert('Justification obligatoire.'); return; }
      await apiService.ajouter('carburant_mouvements', {
        id: crypto.randomUUID(), carburant_type_id: this.carburantInvType, site_id: this.siteActif,
        date: new Date().toISOString().slice(0,10), type: ecart > 0 ? 'entree' : 'sortie', quantite: Math.abs(ecart),
        utilisation_id: null, source: 'ajustement_inventaire', commentaire: this.carburantInvJustification
      }, { audit: true });
      await this.ajusterStockCarburant(this.carburantInvType, ecart);
      await this.verifierSeuilCarburant(this.carburantInvType);
      await this.chargerDonneesCarburant();
      alert('Inventaire ajusté.');
    },

    // ===================== FOURNITURES =====================
    getStockFourniture(articleId) {
      const stock = this.stocksFournitures.find(s => s.article_id === articleId && s.site_id === this.siteActif);
      return stock ? stock.quantite : 0;
    },
    nouveauMouvementFourniture(type) {
      this.fournitureModalType = type;
      this.fournitureMvtForm = { article_id: null, quantite: 1, date: new Date().toISOString().slice(0,10), commentaire: '' };
      this.fournitureShowModalMvt = true;
    },
    async enregistrerMouvementFourniture() {
      const { article_id, quantite, date, commentaire } = this.fournitureMvtForm;
      if (!article_id || quantite <= 0) return;
      const mouvement = { id: crypto.randomUUID(), type_id: article_id, site_id: this.siteActif, date, type: this.fournitureModalType, quantite, source: 'manuel', reference_id: null, commentaire };
      await apiService.ajouter('mouvements_fournitures', mouvement, { audit: true });
      await this.ajusterStockFourniture(article_id, quantite * (this.fournitureModalType === 'entree' ? 1 : -1));
      await this.verifySeuilFourniture(article_id);
      this.fournitureShowModalMvt = false;
      await this.chargerDonneesFournitures();
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
    async verifySeuilFourniture(articleId) {
      const config = await notificationService.getConfig();
      const seuil = config.stock_faible_emballage?.seuils?.par_defaut || 10; // à adapter si vous changez la clé
      const stock = this.stocksFournitures.find(s => s.article_id === articleId && s.site_id === this.siteActif);
      const quantite = stock ? stock.quantite : 0;
      if (quantite <= seuil) {
        const article = this.articlesFourniture.find(a => a.id === articleId);
        await notificationService.envoyerMessageSysteme('stock_faible_emballage', { nom: article?.nom || 'Inconnu', site: this.getSiteNom(this.siteActif), quantite, seuil });
      }
    },
    async validerInventaireFourniture() {
      const ecart = this.fournitureInvReel - this.getStockFourniture(this.fournitureInvArticle);
      if (ecart === 0) { alert('Aucun écart.'); return; }
      if (!this.fournitureInvJustification.trim()) { alert('Justification obligatoire.'); return; }
      await apiService.ajouter('mouvements_fournitures', {
        id: crypto.randomUUID(), type_id: this.fournitureInvArticle, site_id: this.siteActif,
        date: new Date().toISOString().slice(0,10), type: ecart > 0 ? 'entree' : 'sortie', quantite: Math.abs(ecart),
        source: 'ajustement_inventaire', reference_id: null, commentaire: this.fournitureInvJustification
      }, { audit: true });
      await this.ajusterStockFourniture(this.fournitureInvArticle, this.siteActif, ecart);
      await this.verifySeuilFourniture(this.fournitureInvArticle);
      await this.chargerDonneesFournitures();
      alert('Inventaire ajusté.');
    },

    // Transfert fourniture
    ajouterLigneTransfertFourniture() { this.transfertFourniture.lignes.push({ article_id: null, quantite: 1 }); },
    nouveauTransfertFourniture() {
      this.transfertFourniture = { siteSource: this.siteActif, siteDestination: this.sites.length > 1 ? this.sites.find(s => s.id !== this.siteActif)?.id || this.siteActif : this.siteActif, dateCreation: new Date().toISOString().slice(0,10), lignes: [] };
      this.showTransfertFournitureForm = true;
    },
    async enregistrerTransfertFourniture() {
      const count = this.transfertsFournitures.length + 1;
      const numero = `TRF-${new Date().getFullYear()}-${count.toString().padStart(4,'0')}`;
      const transfertData = { id: crypto.randomUUID(), numero, dateCreation: this.transfertFourniture.dateCreation, siteSource: this.transfertFourniture.siteSource, siteDestination: this.transfertFourniture.siteDestination, statut: 'en cours', createurId: JSON.parse(localStorage.getItem('currentUser')).id };
      await apiService.ajouter('transferts_fournitures', transfertData, { audit: true });
      for (let ligne of this.transfertFourniture.lignes) {
        if (!ligne.article_id || ligne.quantite <= 0) continue;
        await apiService.ajouter('transfert_fourniture_lignes', { id: crypto.randomUUID(), transfertId: transfertData.id, article_id: ligne.article_id, quantite: ligne.quantite, quantiteRecue: 0 });
      }
      // notification...
      this.showTransfertFournitureForm = false;
      await this.chargerDonneesFournitures();
    },
    async confirmerReceptionFourniture(transfert) {
      const lignes = this.transfertFournitureLignes.filter(l => l.transfertId === transfert.id);
      for (let l of lignes) {
        await apiService.modifier('transfert_fourniture_lignes', l.id, { quantiteRecue: l.quantite });
        await this.ajusterStockFourniture(l.article_id, transfert.siteSource, -l.quantite);
        await this.verifySeuilFourniture(l.article_id);
        await this.ajusterStockFourniture(l.article_id, transfert.siteDestination, l.quantite);
      }
      await apiService.modifier('transferts_fournitures', transfert.id, { statut: 'confirmé', dateConfirmation: new Date().toISOString() }, { audit: true });
      await this.chargerDonneesFournitures();
    },
    async annulerTransfertFourniture(id) {
      if (!confirm('Annuler ce transfert ?')) return;
      await apiService.modifier('transferts_fournitures', id, { statut: 'annulé' }, { audit: true });
      await this.chargerDonneesFournitures();
    },

    // Retour bidons
    async enregistrerRetour() {
      const { conditionnementId, quantite, site_id, date } = this.retourForm;
      if (!conditionnementId || quantite <= 0 || !site_id) return;
      // Trouver l'article contenant_vide correspondant
      const composants = this.conditionnementComposants.filter(c => c.conditionnement_id === conditionnementId);
      let articleId = null;
      for (const comp of composants) {
        const article = this.articlesFourniture.find(a => a.id === comp.article_fourniture_id);
        if (article && article.type === 'contenant_vide') {
          articleId = article.id;
          break;
        }
      }
      if (!articleId) {
        alert('Aucun article de type "contenant vide" lié à ce conditionnement.');
        return;
      }
      await this.ajusterStockFourniture(articleId, site_id, quantite);
      await this.verifySeuilFourniture(articleId);
      alert('Retour enregistré.');
      await this.chargerDonneesFournitures();
    },

    // ===================== GRAPHIQUE RÉSUMÉ =====================
    async initChartResume() {
      // inchangé mais utilise les nouvelles méthodes de calcul de volume
      const ctx = document.getElementById('chartResume');
      if (!ctx) return;
      if (this.chartResume) { this.chartResume.destroy(); this.chartResume = null; }
      await this.$nextTick();

      const aujourdhui = new Date();
      const moisLabels = [];
      const initStockParMois = () => {
        const map = {};
        for (let i = 11; i >= 0; i--) {
          const date = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() - i, 1);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          moisLabels.push(date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }));
          map[key] = 0;
        }
        return map;
      };

      const volumesHuile = this._getVolumesParMois(initStockParMois());
      const volumesCarburant = await this._getVolumesCarburantMois(initStockParMois());
      const volumesFournitures = await this._getVolumesFournituresMois(initStockParMois());

      this.chartResume = new Chart(ctx, {
        type: 'line',
        data: {
          labels: moisLabels,
          datasets: [
            { label: 'Huile (L)', data: Object.values(volumesHuile), borderColor: '#ED1C24', backgroundColor: 'rgba(237,28,36,0.1)', tension: 0.1, yAxisID: 'y' },
            { label: 'Carburant (L)', data: Object.values(volumesCarburant), borderColor: '#f39c12', backgroundColor: 'rgba(243,156,18,0.1)', tension: 0.1, yAxisID: 'y' },
            { label: 'Fournitures (unités)', data: Object.values(volumesFournitures), borderColor: '#2ecc71', backgroundColor: 'rgba(46,204,113,0.1)', tension: 0.1, yAxisID: 'y' }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { tooltip: { mode: 'index', intersect: false } }, scales: { y: { beginAtZero: true } } }
      });
    },

    _getVolumesParMois(stockParMois) {
      const capacites = {};
      this.conditionnements.forEach(c => { capacites[c.id] = c.capaciteL; });

      const mouvementsTries = [...this.mouvements].sort((a,b) => new Date(a.date) - new Date(b.date));
      let cumul = 0;
      let moisCourant = null;
      for (let m of mouvementsTries) {
        const date = new Date(m.date);
        const moisKey = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
        if (moisCourant && moisCourant !== moisKey && Object.prototype.hasOwnProperty.call(stockParMois, moisCourant)) {
          stockParMois[moisCourant] = cumul;
        }
        moisCourant = moisKey;
        const lignes = this.mouvementLignes.filter(l => l.mouvementId === m.id);
        for (let l of lignes) {
          if (l.siteSource) cumul -= l.quantite * capacites[l.conditionnementId];
          if (l.siteDestination) cumul += l.quantite * capacites[l.conditionnementId];
          if (cumul < 0) cumul = 0;
        }
      }
      if (moisCourant && Object.hasOwn(stockParMois, moisCourant)) stockParMois[moisCourant] = cumul;

      let dernierConnu = 0;
      for (let k of Object.keys(stockParMois).sort()) {
        if (stockParMois[k] === 0) stockParMois[k] = dernierConnu;
        else dernierConnu = stockParMois[k];
      }
      return stockParMois;
    },

    async _getVolumesCarburantMois(stockParMois) {
      const mouvementsTries = [...this.carburantMouvements].sort((a,b) => new Date(a.date) - new Date(b.date));
      let cumul = 0;
      let moisCourant = null;
      for (let m of mouvementsTries) {
        const moisKey = `${new Date(m.date).getFullYear()}-${String(new Date(m.date).getMonth()+1).padStart(2,'0')}`;
        if (moisCourant && moisCourant !== moisKey && Object.hasOwn(stockParMois, moisCourant)) {
          stockParMois[moisCourant] = cumul;
        }
        moisCourant = moisKey;
        cumul += (m.type === 'entree' ? m.quantite : -m.quantite);
        if (cumul < 0) cumul = 0;
      }
      if (moisCourant && Object.hasOwn(stockParMois, moisCourant)) stockParMois[moisCourant] = cumul;
      let dernierConnu = 0;
      for (let k of Object.keys(stockParMois).sort()) {
        if (stockParMois[k] === 0) stockParMois[k] = dernierConnu;
        else dernierConnu = stockParMois[k];
      }
      return stockParMois;
    },

    async _getVolumesFournituresMois(stockParMois) {
      const mouvementsTries = [...this.mouvementsFournitures].sort((a,b) => new Date(a.date) - new Date(b.date));
      let cumul = 0;
      let moisCourant = null;
      for (let m of mouvementsTries) {
        const moisKey = `${new Date(m.date).getFullYear()}-${String(new Date(m.date).getMonth()+1).padStart(2,'0')}`;
        if (moisCourant && moisCourant !== moisKey && Object.hasOwn(stockParMois, moisCourant)) {
          stockParMois[moisCourant] = cumul;
        }
        moisCourant = moisKey;
        cumul += (m.type === 'entree' ? m.quantite : -m.quantite);
        if (cumul < 0) cumul = 0;
      }
      if (moisCourant && Object.hasOwn(stockParMois, moisCourant)) stockParMois[moisCourant] = cumul;
      let dernierConnu = 0;
      for (let k of Object.keys(stockParMois).sort()) {
        if (stockParMois[k] === 0) stockParMois[k] = dernierConnu;
        else dernierConnu = stockParMois[k];
      }
      return stockParMois;
    }
  }
};
</script>