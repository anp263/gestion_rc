<template>
  <div class="container-fluid">
    <h2 class="mb-4" style="color: #ED1C24;">Gestion des clients</h2>

    <!-- Sélecteur de devise global -->
    <div class="card mb-3">
      <div class="card-body py-2">
        <div class="row align-items-center">
          <div class="col-auto">
            <strong>Devise d'affichage :</strong>
          </div>
          <div class="col-auto">
            <div class="btn-group" role="group">
              <button type="button" class="btn" :class="deviseAffichage === 'USD' ? 'btn-primary' : 'btn-outline-secondary'" @click="deviseAffichage = 'USD'">USD ($)</button>
              <button type="button" class="btn" :class="deviseAffichage === 'CDF' ? 'btn-primary' : 'btn-outline-secondary'" @click="deviseAffichage = 'CDF'">CDF (FC)</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Onglets -->
    <ul class="nav nav-tabs">
      <li class="nav-item">
        <a class="nav-link" :class="{ active: onglet === 'liste' }" href="#" @click.prevent="onglet = 'liste'">
          📋 Liste des clients
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" :class="{ active: onglet === 'detail' }" href="#" @click.prevent="onglet = 'detail'">
          👤 Détail client
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" :class="{ active: onglet === 'consignes' }" href="#" @click.prevent="onglet = 'consignes'">
          🔄 Suivi des consignes
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" :class="{ active: onglet === 'stats' }" href="#" @click.prevent="onglet = 'stats'">
          📊 Statistiques
        </a>
      </li>
    </ul>

    <!-- ==================== ONGLET LISTE ==================== -->
    <div v-show="onglet === 'liste'" class="mt-3">
      <div class="card mb-4" v-if="showForm">
        <div class="card-header">Nouveau client</div>
        <div class="card-body">
          <form @submit.prevent="ajouterClient">
            <div class="row">
              <div class="col-md-4 mb-3"><label>Nom *</label><input type="text" class="form-control" v-model="nouveauClient.nom" required></div>
              <div class="col-md-4 mb-3"><label>Type</label><select class="form-select" v-model="nouveauClient.type"><option value="boutique">Boutique</option><option value="supermarché">Supermarché</option><option value="privé">Privé</option><option value="autre">Autre</option></select></div>
              <div class="col-md-4 mb-3"><label>Points de vente</label><input type="number" class="form-control" v-model.number="nouveauClient.nbPointsVente" min="1"></div>
            </div>
            <div class="row">
              <div class="col-md-4 mb-3"><label>Adresse</label><input type="text" class="form-control" v-model="nouveauClient.adresse"></div>
              <div class="col-md-4 mb-3"><label>Secteur</label><select class="form-select" v-model="nouveauClient.secteur"><option value="">-- Sélectionner --</option><option v-for="s in secteurs" :key="s" :value="s">{{ s }}</option></select></div>
              <div class="col-md-4 mb-3"><label>Téléphone</label><input type="text" class="form-control" v-model="nouveauClient.telephone"></div>
            </div>
            <div class="row">
              <div class="col-md-6 mb-3"><label>Email</label><input type="email" class="form-control" v-model="nouveauClient.email"></div>
              <div class="col-md-6 mb-3"><label>Notes</label><textarea class="form-control" v-model="nouveauClient.notes" rows="2"></textarea></div>
            </div>
            <button type="submit" class="btn btn-success">Enregistrer</button>
            <button type="button" class="btn btn-secondary ms-2" @click="showForm = false">Annuler</button>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <i class="bi bi-list"></i> Liste des clients
          <div class="d-flex gap-2">
            <input type="text" class="form-control form-control-sm" placeholder="Rechercher..." v-model="searchTerm" style="width: 200px;">
            <button class="btn btn-primary btn-sm" @click="showForm = true" v-if="!showForm">Nouveau client</button>
          </div>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th @click="tri('nom')">Nom</th>
                  <th @click="tri('type')">Type</th>
                  <th @click="tri('nbPointsVente')">Points de vente</th>
                  <th @click="tri('secteur')">Secteur</th>
                  <th @click="tri('telephone')">Téléphone</th>
                  <th @click="tri('email')">Email</th>
                  <th>Produits achetés</th>
                  <th style="width: 100px;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="client in clientsFiltresTries" :key="client.id">
                  <td class="text-start">{{ client.nom }}</td>
                  <td class="text-start">{{ client.type }}</td>
                  <td class="text-center">{{ client.nbPointsVente || '-' }}</td>
                  <td class="text-start">{{ client.secteur || '-' }}</td>
                  <td class="text-start">{{ client.telephone || '-' }}</td>
                  <td class="text-start">{{ client.email || '-' }}</td>
                  <td class="text-start">{{ client.produitsAchetes || '-' }}</td>
                  <td class="text-nowrap">
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-warning" @click="editerClient(client)" title="Modifier"><i class="bi bi-pencil"></i></button>
                      <button class="btn btn-danger" @click="supprimerClient(client.id)" title="Supprimer"><i class="bi bi-trash"></i></button>
                    </div>
                  </td>
                </tr>
                <tr v-if="clientsFiltresTries.length === 0">
                  <td colspan="8" class="text-center">Aucun client trouvé</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <!-- ==================== ONGLET CONSIGNE ==================== -->

    <div v-show="onglet === 'consignes'" class="mt-3">
      <div class="card">
        <div class="card-header">Bidons en attente de retour</div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-sm">
              <thead><tr><th>Client</th><th>Facture</th><th>Contenant</th><th>Attendu</th><th>Retourné</th><th>Date livraison</th><th>Action</th></tr></thead>
              <tbody>
                <tr v-for="c in consignationsEnAttente" :key="c.id">
                  <td>{{ getClientNom(c.clientId) }}</td>
                  <td>{{ getFactureNumero(c.factureId) }}</td>
                  <td>{{ getEmballageNom(c.emballage_type_id) }}</td>
                  <td>{{ c.quantite_attendue }}</td>
                  <td>{{ c.quantite_retournee }}</td>
                  <td>{{ formatDate(c.dateLivraison) }}</td>
                  <td>
                    <button class="btn btn-sm btn-success" @click="enregistrerRetourConsignation(c)">Retourné</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== ONGLET DÉTAIL CLIENT ==================== -->
    <div v-show="onglet === 'detail'" class="mt-3">
      <div class="card">
        <div class="card-header">Détail d'un client</div>
        <div class="card-body">
          <div class="row mb-4">
            <div class="col-md-4">
              <label>Client</label>
              <select class="form-select" v-model="clientDetailId" @change="chargerDetailClient">
                <option value="">-- Sélectionner --</option>
                <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.nom }}</option>
              </select>
            </div>
          </div>

          <div v-if="clientDetail">
            <div class="row">
              <div class="col-md-4">
                <div class="card bg-light">
                  <div class="card-body text-center">
                    <h6>Sommes dues</h6>
                    <p class="display-6">{{ formatMontant(sommesDuTotal, deviseAffichage) }}</p>
                    <small>{{ deviseAffichage }}</small>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card bg-light">
                  <div class="card-body text-center">
                    <h6>Volume restant à livrer</h6>
                    <p class="display-6">{{ volumeRestant }} litres</p>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card bg-light">
                  <div class="card-body text-center">
                    <h6>Nombre de factures impayées</h6>
                    <p class="display-6">{{ nbFacturesImpayees }}</p>
                  </div>
                </div>
              </div>
            </div>

            <h5 class="mt-4">Historique des opérations</h5>
            <div class="table-responsive">
              <table class="table table-sm table-striped">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Référence</th>
                    <th>Montant ({{ deviseAffichage }})</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="op in historiqueOperations" :key="op.id">
                    <td>{{ formatDate(op.date) }}</td>
                    <td>{{ op.type }}</td>
                    <td>{{ op.ref }}</td>
                    <td>{{ formatMontant(op.montant, op.devise) }}</td>
                    <td><span class="badge" :class="op.badgeClass">{{ op.statut }}</span></td>
                    <td><button class="btn btn-sm btn-info" @click="voirDetailOperation(op)">Voir</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-else class="alert alert-info">Sélectionnez un client pour afficher les détails.</div>
        </div>
      </div>
    </div>

    <!-- ==================== ONGLET STATISTIQUES ==================== -->
    <div v-show="onglet === 'stats'" class="mt-3">
      <div class="card">
        <div class="card-header">Statistiques</div>
        <div class="card-body">
          <!-- Filtres de période -->
          <div class="row mb-4">
            <div class="col-md-3">
              <label>Période</label>
              <select class="form-select" v-model="periodeType" @change="changerPeriode">
                <option value="annee">Année</option>
                <option value="mois">Mois</option>
                <option value="trimestre">Trimestre</option>
              </select>
            </div>
            <div class="col-md-3">
              <label>Année</label>
              <select class="form-select" v-model="statsAnnee" @change="chargerStatistiques">
                <option v-for="a in anneesDisponibles" :key="a" :value="a">{{ a }}</option>
              </select>
            </div>
            <div class="col-md-3" v-if="periodeType === 'mois'">
              <label>Mois</label>
              <select class="form-select" v-model="statsMois" @change="chargerStatistiques">
                <option v-for="(nom, idx) in moisNoms" :key="idx" :value="idx+1">{{ nom }}</option>
              </select>
            </div>
            <div class="col-md-3" v-if="periodeType === 'trimestre'">
              <label>Trimestre</label>
              <select class="form-select" v-model="statsTrimestre" @change="chargerStatistiques">
                <option value="1">T1 (Jan-Mar)</option>
                <option value="2">T2 (Avr-Juin)</option>
                <option value="3">T3 (Jul-Sep)</option>
                <option value="4">T4 (Oct-Déc)</option>
              </select>
            </div>
          </div>

          <!-- Indicateurs -->
          <div class="row mb-4">
            <div class="col-md-3">
              <div class="card bg-primary text-white">
                <div class="card-body text-center">
                  <h6>Chiffre d'affaires</h6>
                  <p class="display-6">{{ formatMontant(ca, deviseAffichage) }}</p>
                  <small>{{ deviseAffichage }}</small>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card bg-success text-white">
                <div class="card-body text-center">
                  <h6>Nombre de commandes</h6>
                  <p class="display-6">{{ nbCommandes }}</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card bg-info text-white">
                <div class="card-body text-center">
                  <h6>Volume commandé (litres)</h6>
                  <p class="display-6">{{ volumeTotal }}</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card bg-warning text-white">
                <div class="card-body text-center">
                  <h6>Clients actifs</h6>
                  <p class="display-6">{{ nbClientsActifs }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="row mb-4">
            <div class="col-md-3">
              <div class="card bg-secondary text-white">
                <div class="card-body text-center">
                  <h6>Commande moyenne</h6>
                  <p class="display-6">{{ formatMontant(panierMoyen, deviseAffichage) }}</p>
                  <small>{{ deviseAffichage }}</small>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card bg-dark text-white">
                <div class="card-body text-center">
                  <h6>Délai de paiement moyen</h6>
                  <p class="display-6">{{ delaiPaiementMoyen }} jours</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card bg-danger text-white">
                <div class="card-body text-center">
                  <h6>Taux d'impayés après délai</h6>
                  <p class="display-6">{{ tauxImpayes }}%</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card bg-info text-white">
                <div class="card-body text-center">
                  <h6>Commandes/mois</h6>
                  <p class="display-6">{{ commandesParMois }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="row mb-4">
            <div class="col-md-3">
              <div class="card bg-danger text-white">
                <div class="card-body text-center">
                  <h6>Factures livrées non payées</h6>
                  <p class="display-6">{{ facturesLivreesNonPayees }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Graphiques -->
          <div class="row">
            <div class="col-md-6">
              <div class="card">
                <div class="card-header">Répartition par type de client</div>
                <div class="card-body">
                  <canvas id="typeChart" style="height: 250px;"></canvas>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card">
                <div class="card-header">Ventes par contenant (litres)</div>
                <div class="card-body">
                  <canvas id="contenantChart" style="height: 250px;"></canvas>
                </div>
              </div>
            </div>
          </div>
          <div class="row mt-4">
            <div class="col-md-12">
              <div class="card">
                <div class="card-header">Produits les plus vendus (litres)</div>
                <div class="card-body">
                  <table class="table table-sm">
                    <thead><tr><th>Contenant</th><th>Volume (litres)</th><th>Part (%)</th></tr></thead>
                    <tbody>
                      <tr v-for="p in topProduits" :key="p.conditionnementId"><td>{{ p.nom }}</td><td class="text-start">{{ p.volume }} L</td><td class="text-start">{{ p.pourcentage }}%</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal édition client -->
    <div v-if="clientEnEdition" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header"><h5>Modifier client</h5><button type="button" class="btn-close" @click="clientEnEdition = null"></button></div>
          <div class="modal-body">
            <div class="mb-3"><label>Nom</label><input type="text" class="form-control" v-model="clientEnEdition.nom"></div>
            <div class="mb-3"><label>Type</label><select class="form-select" v-model="clientEnEdition.type"><option value="boutique">Boutique</option><option value="supermarché">Supermarché</option><option value="privé">Privé</option><option value="autre">Autre</option></select></div>
            <div class="mb-3"><label>Points de vente</label><input type="number" class="form-control" v-model.number="clientEnEdition.nbPointsVente"></div>
            <div class="mb-3"><label>Adresse</label><input type="text" class="form-control" v-model="clientEnEdition.adresse"></div>
            <div class="mb-3"><label>Secteur</label><select class="form-select" v-model="clientEnEdition.secteur"><option value="">-- Sélectionner --</option><option v-for="s in secteurs" :key="s" :value="s">{{ s }}</option></select></div>
            <div class="mb-3"><label>Téléphone</label><input type="text" class="form-control" v-model="clientEnEdition.telephone"></div>
            <div class="mb-3"><label>Email</label><input type="email" class="form-control" v-model="clientEnEdition.email"></div>
            <div class="mb-3"><label>Produits achetés</label><input type="text" class="form-control" v-model="clientEnEdition.produitsAchetes"></div>
            <div class="mb-3"><label>Notes</label><textarea class="form-control" rows="2" v-model="clientEnEdition.notes"></textarea></div>
          </div>
          <div class="modal-footer"><button class="btn btn-secondary" @click="clientEnEdition = null">Annuler</button><button class="btn btn-primary" @click="sauvegarderEdition">Sauvegarder</button></div>
        </div>
      </div>
    </div>

    <!-- Modal détail opération formatée -->
    <div v-if="detailOperation" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ detailOperation.type }} - {{ detailOperation.ref }}</h5>
            <button type="button" class="btn-close" @click="detailOperation = null"></button>
          </div>
          <div class="modal-body">
            <div v-if="detailOperation.type === 'Facture'">
              <p><strong>Date :</strong> {{ detailOperation.data.date }}</p>
              <p><strong>Client :</strong> {{ getClientNom(detailOperation.data.clientId) }}</p>
              <p><strong>Statut paiement :</strong> {{ detailOperation.data.statutPaiement }}</p>
              <p><strong>Statut livraison :</strong> {{ detailOperation.data.statutLivraison }}</p>
              <h6>Lignes de facture</h6>
              <table class="table table-sm">
                <thead><tr><th>Produit</th><th>Quantité</th><th>Prix unitaire</th><th>Total</th></tr></thead>
                <tbody>
                  <tr v-for="l in detailOperation.lignes" :key="l.id">
                    <td>{{ getConditionnementNom(l.conditionnementId) }}</td>
                    <td class="text-end">{{ l.quantite }}</td>
                    <td class="text-end">{{ formatMontant(l.prixUnitaire, detailOperation.data.devise) }}</td>
                    <td class="text-end">{{ formatMontant(l.prixTotal, detailOperation.data.devise) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else-if="detailOperation.type === 'Paiement'">
              <p><strong>Date :</strong> {{ detailOperation.data.date }}</p>
              <p><strong>Montant :</strong> {{ formatMontant(detailOperation.data.montant, detailOperation.data.devise) }} {{ detailOperation.data.devise }}</p>
              <p><strong>Justificatif :</strong> {{ detailOperation.data.justificatif || '-' }}</p>
            </div>
            <div v-else-if="detailOperation.type === 'Bon de livraison'">
              <p><strong>Date :</strong> {{ detailOperation.data.date }}</p>
              <p><strong>Statut :</strong> {{ detailOperation.data.statut }}</p>
            </div>
          </div>
          <div class="modal-footer"><button class="btn btn-secondary" @click="detailOperation = null">Fermer</button></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from '../db';
import apiService from '../services/api';
import Chart from 'chart.js/auto';

export default {
  name: 'Clients',
  data() {
    return {
      onglet: 'liste',
      clients: [],
      secteurs: [],
      searchTerm: '',
      triColonne: 'nom',
      triOrdre: 'asc',
      showForm: false,
      nouveauClient: { nom: '', type: 'boutique', nbPointsVente: 1, adresse: '', secteur: '', telephone: '', email: '', produitsAchetes: '', notes: '' },
      clientEnEdition: null,

      // Détail client
      clientDetailId: null,
      clientDetail: null,
      sommesDuTotal: 0,
      volumeRestant: 0,
      nbFacturesImpayees: 0,
      historiqueOperations: [],
      deviseAffichage: 'CDF',

      // Consignes

      consignations: [],

      // Statistiques
      periodeType: 'annee',
      statsAnnee: new Date().getFullYear(),
      statsMois: new Date().getMonth() + 1,
      statsTrimestre: 1,
      anneesDisponibles: [2024,2025,2026,2027],
      moisNoms: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
      ca: 0,
      nbCommandes: 0,
      volumeTotal: 0,
      nbClientsActifs: 0,
      panierMoyen: 0,
      delaiPaiementMoyen: 0,
      tauxImpayes: 0,
      commandesParMois: 0,
      facturesLivreesNonPayees: 0,
      topProduits: [],
      tauxChangeJour: 2500,
      typeChart: null,
      contenantChart: null,
      detailOperation: null,
      conditionnements: [],
    };
  },
  computed: {
    clientsFiltresTries() {
      let result = [...this.clients];
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        result = result.filter(c => (c.nom && c.nom.toLowerCase().includes(term)) ||
          (c.secteur && c.secteur.toLowerCase().includes(term)) ||
          (c.telephone && c.telephone.toLowerCase().includes(term)) ||
          (c.email && c.email.toLowerCase().includes(term)));
      }
      const colonne = this.triColonne;
      const ordre = this.triOrdre;
      result.sort((a, b) => {
        let valA = a[colonne];
        let valB = b[colonne];
        if (colonne === 'nbPointsVente') { valA = valA || 0; valB = valB || 0; }
        else { valA = (valA || '').toString(); valB = (valB || '').toString(); }
        return ordre === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
      return result;
    },
  },

  watch: {
    deviseAffichage() {
      if (this.clientDetailId) {
        this.chargerDetailClient();
      }
      if (this.onglet === 'stats') {
        this.chargerStatistiques();
      }
    }
  },

  async mounted() {
    await this.chargerSecteurs();
    await this.chargerClients();
    this.conditionnements = await db.conditionnements.toArray();
    await this.chargerTauxChangeJour();
    await this.chargerStatistiques();
    this.chargerConsignations();
    this.emballageStocks = await db.emballage_stocks.toArray();
    this.emballageTypes = await db.emballage_types.toArray();
  },
  methods: {
    async chargerSecteurs() {
      const reglages = await db.reglages.where('cle').equals('secteurs').first();
      this.secteurs = reglages?.valeur || [];
    },
    async chargerClients() {
      this.clients = await db.clients.toArray() || [];
    },
    async chargerTauxChangeJour() {
      const taux = await db.taux_change.where('date').equals(new Date().toISOString().slice(0,10)).first();
      this.tauxChangeJour = taux ? taux.taux : 2500;
    },
    async ajouterClient() {
      try {
        await apiService.ajouter('clients', this.nouveauClient, { audit: true });
        await this.chargerClients();
        this.nouveauClient = { nom: '', type: 'boutique', nbPointsVente: 1, adresse: '', secteur: '', telephone: '', email: '', produitsAchetes: '', notes: '' };
        this.showForm = false;
        alert('Client ajouté');
      } catch (error) { console.error(error); alert('Erreur'); }
    },
    async supprimerClient(id) {
      if (!confirm('Supprimer ce client ?')) return;
      try {
        await apiService.supprimer('clients', id, { audit: true });
        await this.chargerClients();
      } catch (error) { console.error(error); alert('Erreur'); }
    },
    editerClient(client) { this.clientEnEdition = { ...client }; },
    async sauvegarderEdition() {
      try {
        await apiService.modifier('clients', this.clientEnEdition.id, this.clientEnEdition, { audit: true });
        await this.chargerClients();
        this.clientEnEdition = null;
        alert('Client modifié');
      } catch (error) { console.error(error); alert('Erreur'); }
    },
    tri(colonne) {
      if (this.triColonne === colonne) this.triOrdre = this.triOrdre === 'asc' ? 'desc' : 'asc';
      else { this.triColonne = colonne; this.triOrdre = 'asc'; }
    },
    formatDate(dateString) { return dateString ? new Date(dateString).toLocaleDateString('fr-FR') : ''; },
    formatMontant(montant, deviseOrigine) {
      if (montant === undefined || montant === null) montant = 0;
      if (!deviseOrigine) return '0';
      
      // Conversion si nécessaire
      let montantConverti = montant;
      if (deviseOrigine !== this.deviseAffichage) {
        if (this.deviseAffichage === 'CDF') {
          montantConverti = montant * this.tauxChangeJour;
        } else {
          montantConverti = montant / this.tauxChangeJour;
        }
      }
      
      // Formatage selon la devise d'affichage
      if (this.deviseAffichage === 'CDF') {
        let formatted = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0, useGrouping: true }).format(Math.round(montantConverti));
        return formatted.replace(/\s/g, "'");
      } else {
        let formatted = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: true }).format(montantConverti);
        return formatted.replace(/\s/g, "'");
      }
    },
    getClientNom(id) { const c = this.clients.find(c => c.id === id); return c ? c.nom : '-'; },
    getConditionnementNom(id) {
      const cond = this.conditionnements.find(c => c.id === id);
      return cond ? cond.nom : '-';
    },

    // ========== DÉTAIL CLIENT ==========
    async chargerDetailClient() {
      if (!this.clientDetailId) { this.clientDetail = null; return; }
      this.clientDetail = this.clients.find(c => c.id === this.clientDetailId);
      if (!this.clientDetail) return;

      const factures = await db.factures.where('clientId').equals(this.clientDetailId).toArray();
      const facturesImpayees = factures.filter(f => f.statutPaiement !== 'payée');
      this.nbFacturesImpayees = facturesImpayees.length;

      // Champ de montant selon la devise d'affichage
      const champMontant = this.deviseAffichage === 'CDF' ? 'montant_cdf' : 'montant_usd';

      // ----- Sommes dues (conversion via champs double devise) -----
      let totalDues = 0;
      for (let f of facturesImpayees) {
        const montantRestant = f.totalHT - (f.montantPaye || 0);
        if (f[champMontant] !== undefined) {
          // La facture a les champs double devise : on applique le prorata du reste dû
          const ratio = f.totalHT > 0 ? montantRestant / f.totalHT : 1;
          totalDues += f[champMontant] * ratio;
        } else {
          // Fallback pour anciennes factures sans champs double devise
          let montant = montantRestant;
          if (f.devise !== this.deviseAffichage) {
            if (this.deviseAffichage === 'CDF') montant = montant * this.tauxChangeJour;
            else montant = montant / this.tauxChangeJour;
          }
          totalDues += montant;
        }
      }
      this.sommesDuTotal = totalDues;

      // ----- Volume restant à livrer -----
      let volumeFacture = 0, volumeLivre = 0;
      const capacites = {};
      this.conditionnements.forEach(cond => capacites[cond.id] = cond.capaciteL);
      for (let f of factures) {
        const lignesFacture = await db.facture_lignes.where('factureId').equals(f.id).toArray();
        volumeFacture += lignesFacture.reduce((sum, l) => sum + l.quantite * (capacites[l.conditionnementId] || 0), 0);
        if (f.bonLivraisonId) {
          const blLignes = await db.bl_lignes.where('blId').equals(f.bonLivraisonId).toArray();
          volumeLivre += blLignes.reduce((sum, l) => sum + l.quantiteLivree * (capacites[l.conditionnementId] || 0), 0);
        }
      }
      this.volumeRestant = volumeFacture - volumeLivre;

      // ----- Historique des opérations -----
      let ops = [];
      for (let f of factures) {
        // Montant de la facture dans la devise d'affichage
        let montantFacture = f.totalHT;
        if (f[champMontant] !== undefined) {
          montantFacture = f[champMontant];
        } else {
          if (f.devise !== this.deviseAffichage) {
            if (this.deviseAffichage === 'CDF') montantFacture = f.totalHT * this.tauxChangeJour;
            else montantFacture = f.totalHT / this.tauxChangeJour;
          }
        }

        ops.push({
          id: f.id,
          date: f.date,
          type: 'Facture',
          ref: f.numero,
          montant: montantFacture,
          devise: this.deviseAffichage,
          statut: this.getPaiementLabel(f),
          badgeClass: this.getPaiementClass(f),
          data: f
        });

        // Paiements liés à cette facture
        const paiements = await db.mouvementsCaisse.where({ factureId: f.id, type: 'entree', status: 'validé' }).toArray();
        for (let p of paiements) {
          let montantPaiement = p.montant;
          if (p[champMontant] !== undefined) {
            montantPaiement = p[champMontant];
          } else {
            if (p.devise !== this.deviseAffichage) {
              if (this.deviseAffichage === 'CDF') montantPaiement = p.montant * this.tauxChangeJour;
              else montantPaiement = p.montant / this.tauxChangeJour;
            }
          }

          ops.push({
            id: p.id,
            date: p.date,
            type: 'Paiement',
            ref: `Paiement facture ${f.numero}`,
            montant: montantPaiement,
            devise: this.deviseAffichage,
            statut: 'Effectué',
            badgeClass: 'bg-success',
            data: p
          });
        }

        // Bon de livraison associé
        if (f.bonLivraisonId) {
          const bl = await db.bons_livraison.get(f.bonLivraisonId);
          if (bl) {
            ops.push({
              id: bl.id,
              date: bl.date,
              type: 'Bon de livraison',
              ref: bl.numero,
              montant: 0,
              devise: null,
              statut: bl.statut,
              badgeClass: bl.statut === 'livré' ? 'bg-success' : 'bg-warning',
              data: bl
            });
          }
        }
      }

      // Tri par date décroissante
      ops.sort((a,b) => new Date(b.date) - new Date(a.date));
      this.historiqueOperations = ops;
    },

    async voirDetailOperation(op) {
      if (op.type === 'Facture') {
        const lignes = await db.facture_lignes.where('factureId').equals(op.id).toArray();
        op.lignes = lignes;
      }
      this.detailOperation = op;
    },

    getPaiementLabel(facture) {
      const statut = facture.statutPaiement;
      const echeance = facture.echeance;
      const livraison = facture.statutLivraison;
      const dateEcheance = facture.dateEcheance ? new Date(facture.dateEcheance) : null;
      const aujourdhui = new Date();

      // Payée
      if (statut === 'payée') return 'Payée';

      // Paiement partiel
      if (statut === 'partiel') {
        if (echeance === 'livraison') {
          if (livraison === 'livrée') {
            const jours = Math.floor((aujourdhui - new Date(facture.dateLivraison)) / (1000*3600*24));
            return `Paiement partiel - retard de ${jours} jour${jours>1?'s':''}`;
          } else {
            return 'Paiement partiel - en attente de livraison';
          }
        } else {
          if (!dateEcheance) return 'Paiement partiel';
          if (dateEcheance < aujourdhui) {
            const jours = Math.floor((aujourdhui - dateEcheance) / (1000*3600*24));
            return `Paiement partiel - retard de ${jours} jour${jours>1?'s':''}`;
          } else {
            const jours = Math.floor((dateEcheance - aujourdhui) / (1000*3600*24));
            const dateStr = this.formatDate(facture.dateEcheance); // utilisation de votre méthode existante
            return `Paiement partiel - reste ${jours} jour${jours>1?'s':''} (échéance ${dateStr})`;
          }
        }
      }

      // Impayé (en_attente)
      if (echeance === 'livraison') {
        if (livraison === 'livrée') {
          const jours = Math.floor((aujourdhui - new Date(facture.dateLivraison)) / (1000*3600*24));
          return `Retard de paiement de ${jours} jour${jours>1?'s':''}`;
        } else {
          return 'Paiement à la livraison';
        }
      } else {
        if (!dateEcheance) return 'En attente de paiement';
        if (dateEcheance < aujourdhui) {
          const jours = Math.floor((aujourdhui - dateEcheance) / (1000*3600*24));
          return `Retard de paiement de ${jours} jour${jours>1?'s':''}`;
        } else {
          const jours = Math.floor((dateEcheance - aujourdhui) / (1000*3600*24));
          const dateStr = this.formatDate(facture.dateEcheance);
          return `À payer d'ici ${dateStr} (${jours} jour${jours>1?'s':''})`;
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

    // =========== CONSIGNE ===========

    async chargerConsignations() {
      this.consignations = await db.consignations.where('statut').equals('en_attente').toArray();
    },
    async enregistrerRetourConsignation(cons) {
      await db.consignations.update(cons.id, { statut: 'retourné', quantite_retournee: cons.quantite_attendue });
      // Créditer le stock du contenant vide (il faut connaître le site – on peut le récupérer depuis la facture)
      const facture = await db.factures.get(cons.factureId);
      if (facture) {
        await this.ajusterStockEmballage(cons.emballage_type_id, facture.siteId, cons.quantite_attendue);
      }
      await this.chargerConsignations();
    },
    async ajusterStockEmballage(typeId, siteId, delta) {
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

    // ========== STATISTIQUES ==========
    async chargerStatistiques() {
      let dateDebut, dateFin;
      if (this.periodeType === 'annee') {
        dateDebut = new Date(this.statsAnnee, 0, 1);
        dateFin = new Date(this.statsAnnee, 11, 31);
      } else if (this.periodeType === 'mois') {
        dateDebut = new Date(this.statsAnnee, this.statsMois - 1, 1);
        dateFin = new Date(this.statsAnnee, this.statsMois, 0);
      } else {
        const moisDebut = (this.statsTrimestre - 1) * 3;
        dateDebut = new Date(this.statsAnnee, moisDebut, 1);
        dateFin = new Date(this.statsAnnee, moisDebut + 3, 0);
      }
      const debutStr = dateDebut.toISOString().slice(0,10);
      const finStr = dateFin.toISOString().slice(0,10);

      const factures = await db.factures.where('date').between(debutStr, finStr).toArray();
      const facturesPayees = factures.filter(f => f.statutPaiement === 'payée');
      this.nbCommandes = factures.length;

      // CA avec conversion dans devise d'affichage
      let caTemp = 0;
      const champMontant = this.deviseAffichage === 'CDF' ? 'montant_cdf' : 'montant_usd';
      for (let f of factures) {
        if (f[champMontant] !== undefined) {
          caTemp += f[champMontant];
        } else {
          let montant = f.totalHT;
          if (f.devise !== this.deviseAffichage) {
            if (this.deviseAffichage === 'CDF') montant = montant * this.tauxChangeJour;
            else montant = montant / this.tauxChangeJour;
          }
          caTemp += montant;
        }
      }
      this.ca = caTemp;
      this.panierMoyen = this.nbCommandes ? this.ca / this.nbCommandes : 0;

      // Volume total
      let volume = 0;
      const capacites = {};
      this.conditionnements.forEach(cond => capacites[cond.id] = cond.capaciteL);
      for (let f of factures) {
        const lignes = await db.facture_lignes.where('factureId').equals(f.id).toArray();
        volume += lignes.reduce((sum, l) => sum + l.quantite * (capacites[l.conditionnementId] || 0), 0);
      }
      this.volumeTotal = volume;

      // Délai de paiement moyen
      let totalJours = 0, nbPayees = 0;
      for (let f of facturesPayees) {
        if (f.datePaiement) {
          const jours = (new Date(f.datePaiement) - new Date(f.date)) / (1000*3600*24);
          totalJours += jours;
          nbPayees++;
        }
      }
      this.delaiPaiementMoyen = nbPayees ? Math.round(totalJours / nbPayees) : 0;

      // Taux d'impayés après délai
      const aujourdhui = new Date();
      const impayesApresDelai = factures.filter(f => f.dateEcheance && new Date(f.dateEcheance) < aujourdhui && f.statutPaiement !== 'payée').length;
      this.tauxImpayes = factures.length ? Math.round((impayesApresDelai / factures.length) * 100) : 0;

      // Clients actifs (commande dans les 6 derniers mois)
      const sixMoisAvant = new Date(); sixMoisAvant.setMonth(sixMoisAvant.getMonth() - 6);
      const clientsAvecCommande = new Set();
      for (let f of factures) {
        if (new Date(f.date) >= sixMoisAvant) clientsAvecCommande.add(f.clientId);
      }
      this.nbClientsActifs = clientsAvecCommande.size;

      // Commandes par mois
      const nbMois = (dateFin.getFullYear() - dateDebut.getFullYear()) * 12 + (dateFin.getMonth() - dateDebut.getMonth()) + 1;
      this.commandesParMois = nbMois ? Math.round(this.nbCommandes / nbMois) : 0;

      // Factures livrées non payées
      const livreesNonPayees = factures.filter(f => f.statutLivraison === 'livrée' && f.statutPaiement !== 'payée').length;
      this.facturesLivreesNonPayees = livreesNonPayees;

      // Top produits
      const volumesParConditionnement = {};
      for (let f of factures) {
        const lignes = await db.facture_lignes.where('factureId').equals(f.id).toArray();
        for (let l of lignes) {
          const capacite = capacites[l.conditionnementId] || 0;
          volumesParConditionnement[l.conditionnementId] = (volumesParConditionnement[l.conditionnementId] || 0) + l.quantite * capacite;
        }
      }
      const sorted = Object.entries(volumesParConditionnement).sort((a,b) => b[1] - a[1]);
      this.topProduits = [];
      for (let [condId, vol] of sorted.slice(0,5)) {
        const cond = this.conditionnements.find(c => c.id === condId);
        if (cond) this.topProduits.push({ typeContenantId: condId, nom: cond.nom, volume: vol, pourcentage: this.volumeTotal ? Math.round((vol / this.volumeTotal)*100) : 0 });
      }

      this.initTypeChart();
      this.initContenantChart();
    },

    async initContenantChart() {
        const ctx = document.getElementById('contenantChart');
        if (!ctx) return;
        if (this.contenantChart) this.contenantChart.destroy();

        const factures = await db.factures.where('date').between(
            new Date(this.statsAnnee,0,1).toISOString().slice(0,10),
            new Date(this.statsAnnee,11,31).toISOString().slice(0,10)
        ).toArray();

        const capacites = {};
        this.conditionnements.forEach(cond => { capacites[cond.id] = cond.capaciteL; });

        const volumes = {};
        for (let f of factures) {
            const lignes = await db.facture_lignes.where('factureId').equals(f.id).toArray();
            for (let l of lignes) {
                volumes[l.conditionnementId] = (volumes[l.conditionnementId] || 0) + l.quantite * capacites[l.conditionnementId];
            }
        }

        const labels = [], data = [];
        for (let cond of this.conditionnements) {
            labels.push(cond.nom);
            data.push(volumes[cond.id] || 0);
        }

        this.contenantChart = new Chart(ctx, {
            type: 'bar',
            data: { labels, datasets: [{ label: 'Volume (litres)', data, backgroundColor: '#ED1C24' }] },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    },

    initTypeChart() {
      const ctx = document.getElementById('typeChart');
      if (!ctx) return;
      if (this.typeChart) this.typeChart.destroy();
      const types = {};
      for (let c of this.clients) types[c.type] = (types[c.type] || 0) + 1;
      this.typeChart = new Chart(ctx, { type: 'pie', data: { labels: Object.keys(types), datasets: [{ data: Object.values(types), backgroundColor: ['#ED1C24', '#3498db', '#2ecc71', '#f1c40f'] }] }, options: { responsive: true } });
    },


    changerPeriode() {
      if (this.periodeType === 'mois') this.statsMois = new Date().getMonth() + 1;
      else if (this.periodeType === 'trimestre') this.statsTrimestre = Math.floor((new Date().getMonth()) / 3) + 1;
      this.chargerStatistiques();
    },
  },
};
</script>