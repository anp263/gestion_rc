<template>
  <div class="container-fluid">
    <h2 class="mb-4" style="color: #ED1C24;">Bons de livraison</h2>

    <div class="card mb-4">
      <div class="card-header">
        <i class="bi bi-plus-circle"></i> Nouveau bon de livraison
      </div>
      <div class="card-body">
        <form @submit.prevent="creerBL">
          <div class="row">
            <div class="col-md-4 mb-3">
              <label>Facture</label>
              <select class="form-select" v-model="nouveauBL.factureId" required @change="chargerLignesFacture">
                <option v-for="f in facturesValidees" :key="f.id" :value="f.id">{{ f.numero }} - {{ getClientNom(f.clientId) }}</option>
              </select>
            </div>
            <div class="col-md-4 mb-3">
              <label>Site de livraison</label>
              <select class="form-select" v-model="nouveauBL.siteId" required>
                <option v-for="s in sites" :key="s.id" :value="s.id">{{ s.nom }}</option>
              </select>
            </div>
            <div class="col-md-4 mb-3">
              <label>Date</label>
              <input type="date" class="form-control" v-model="nouveauBL.date" required>
            </div>
          </div>

          <h5>Lignes à livrer</h5>
          <table class="table table-bordered">
            <thead>
              <tr>
                <th>Lot</th>
                <th>Contenant</th>
                <th>Quantité facturée</th>
                <th>Quantité déjà livrée</th>
                <th>Quantité à livrer</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(ligne, idx) in lignesBL" :key="idx">
                <td>
                  <select class="form-select" v-model="ligne.lotId" required>
                    <option v-for="lot in lotsDisponibles(ligne.conditionnementId)" :key="lot.id" :value="lot.id">{{ lot.numero }}</option>
                  </select>
                </td>
                <td>{{ getConditionnementNom(ligne.conditionnementId) }}</td>
                <td>{{ ligne.quantiteFacturee }}</td>
                <td>{{ ligne.quantiteDejaLivree }}</td>
                <td>
                  <input type="number" class="form-control" v-model.number="ligne.quantiteALivrer" min="0" :max="ligne.quantiteFacturee - ligne.quantiteDejaLivree">
                </td>
              </tr>
            </tbody>
          </table>
          <button type="submit" class="btn btn-success">Créer BL</button>
        </form>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <i class="bi bi-list"></i> Liste des bons de livraison
      </div>
      <div class="card-body">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>N°</th>
              <th>Date</th>
              <th>Facture</th>
              <th>Site</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bl in bons" :key="bl.id">
              <td>{{ bl.numero }}</td>
              <td>{{ formatDate(bl.date) }}</td>
              <td>{{ getFactureNumero(bl.factureId) }}</td>
              <td>{{ getSiteNom(bl.siteId) }}</td>
              <td>{{ bl.statut }}</td>
              <td>
                <button class="btn btn-sm btn-success" @click="marquerLivre(bl.id)" v-if="bl.statut === 'brouillon'">Marquer livré</button>
                <button class="btn btn-sm btn-info" @click="voirBL(bl.id)">Voir</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from '../db';
import apiService from '../services/api';

export default {
  name: 'BonsLivraison',
  data() {
    return {
      facturesValidees: [],
      sites: [],
      conditionnements: [],
      lots: [],
      stocks: [],
      bons: [],
      nouveauBL: {
        factureId: '',
        siteId: '',
        date: new Date().toISOString().slice(0,10)
      },
      lignesBL: [],
      clients: [],
    };
  },
  async mounted() {
    const factureId = this.$route.query.facture;
    if (factureId) {
      this.nouveauBL.factureId = factureId;
    }
    await this.chargerDonnees();
    if (factureId) {
      await this.chargerLignesFacture();
    }
    this.conditionnements = await db.conditionnements.toArray();
  },
  methods: {
    async chargerDonnees() {
      const factures = await db.factures.toArray() || [];
      this.facturesValidees = factures.filter(f => f.statut === 'validée' || f.statut === 'partiellement livrée');
      this.sites = await db.sites.toArray() || [];
      this.conditionnements = await db.conditionnements.toArray() || [];
      this.lots = await db.lots.toArray() || [];
      this.stocks = await db.stocks.toArray() || [];
      this.bons = await db.bons_livraison.toArray() || [];
      this.clients = await db.clients.toArray();
    },
    async chargerLignesFacture() {
      if (!this.nouveauBL.factureId) return;
      const lignes = await db.facture_lignes.where('factureId').equals(this.nouveauBL.factureId).toArray();
      const bls = await db.bons_livraison.where('factureId').equals(this.nouveauBL.factureId).toArray();
      const blIds = bls.map(b => b.id);
      const lignesLivrees = await db.bl_lignes.where('blId').anyOf(blIds).toArray();
      
      this.lignesBL = lignes.map(l => {
        const dejaLivree = lignesLivrees
          .filter(ll => ll.conditionnementId === l.conditionnementId)
          .reduce((acc, ll) => acc + ll.quantiteLivree, 0);
        return {
          conditionnementId: l.conditionnementId,
          quantiteFacturee: l.quantite,
          quantiteDejaLivree: dejaLivree,
          quantiteALivrer: 0,
          lotId: ''
        };
      });
    },
    async creerBL() {
      for (let ligne of this.lignesBL) {
        if (!ligne.lotId || ligne.quantiteALivrer <= 0) {
          alert('Veuillez renseigner un lot et une quantité > 0 pour chaque ligne');
          return;
        }
      }
      const annee = new Date(this.nouveauBL.date).getFullYear().toString().slice(-2);
      const count = this.bons.filter(b => b.numero.endsWith(annee)).length + 1;
      const numero = `BL${count.toString().padStart(2, '0')}/${annee}`;

      const blData = {
        numero,
        factureId: this.nouveauBL.factureId,
        date: this.nouveauBL.date,
        siteId: this.nouveauBL.siteId,
        statut: 'brouillon',
        vendeurId: JSON.parse(localStorage.getItem('currentUser')).id,
        superviseurValidation: null,
        notes: ''
      };
      try {
        const blId = await apiService.ajouter('bons_livraison', blData);
        for (let ligne of this.lignesBL) {
          await apiService.ajouter('bl_lignes', {
            blId,
            lotId: ligne.lotId,
            conditionnementId: ligne.conditionnementId,
            quantiteLivree: ligne.quantiteALivrer
          });
        }
        await this.chargerDonnees();
        alert('Bon de livraison créé');
      } catch (error) {
        console.error(error);
        alert('Erreur');
      }
    },
    async marquerLivre(blId) {
      if (!confirm('Marquer ce bon comme livré ? Cela mettra à jour les stocks.')) return;
      const bl = this.bons.find(b => b.id === blId);
      if (!bl) return;
      try {
        const lignes = await db.bl_lignes.where('blId').equals(blId).toArray();
        for (let ligne of lignes) {
          await this.modifierStock(bl.siteId, ligne.lotId, ligne.conditionnementId, -ligne.quantiteLivree);
        }
        await apiService.modifier('bons_livraison', blId, { statut: 'livré' });
        const facture = await db.factures.get(bl.factureId);
        if (facture) {
          const toutesLignesFacture = await db.facture_lignes.where('factureId').equals(bl.factureId).toArray();
          const tousBLs = await db.bons_livraison.where('factureId').equals(bl.factureId).toArray();
          const tousBLIds = tousBLs.map(b => b.id);
          const toutesLignesLivrees = await db.bl_lignes.where('blId').anyOf(tousBLIds).toArray();
          
          let totalFacture = toutesLignesFacture.reduce((acc, l) => acc + l.quantite, 0);
          let totalLivree = toutesLignesLivrees.reduce((acc, l) => acc + l.quantiteLivree, 0);
          
          if (totalLivree >= totalFacture) {
            await apiService.modifier('factures', bl.factureId, { statut: 'livrée' });
          } else {
            await apiService.modifier('factures', bl.factureId, { statut: 'partiellement livrée' });
          }
        }
        await this.chargerDonnees();
        alert('Bon marqué livré');
      } catch (error) {
        console.error(error);
        alert('Erreur');
      }
    },

    async modifierStock(siteId, lotId, conditionnementId, delta) {
      let stock = await db.stocks.where({ siteId, lotId, conditionnementId }).first();
      if (stock) {
        stock.quantite += delta;
        if (stock.quantite < 0) stock.quantite = 0;
        await apiService.modifier('stocks', stock.id, stock);
      }
    },
    getClientNom(id) {
      const facture = this.facturesValidees.find(f => f.id === id);
      if (!facture) return '';
      const client = this.clients.find(c => c.id === facture.clientId);
      return client ? client.nom : '';
    },
    getConditionnementNom(id) {
      const cond = this.conditionnements.find(c => c.id === id);
      return cond ? cond.nom : '-';
    },
    lotsDisponibles(conditionnementId) {
      const stockLots = this.stocks
        .filter(s => s.siteId === this.nouveauBL.siteId && s.conditionnementId === conditionnementId && s.quantite > 0)
        .map(s => s.lotId);
      return this.lots.filter(l => stockLots.includes(l.id));
    },
    getFactureNumero(id) {
      const f = this.facturesValidees.find(f => f.id === id);
      return f ? f.numero : '-';
    },
    getSiteNom(id) {
      const s = this.sites.find(s => s.id === id);
      return s ? s.nom : '-';
    },
    formatDate(dateString) {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('fr-FR');
    },
    voirBL(id) {
      console.log('Voir BL', id);
    }
  }
};
</script>