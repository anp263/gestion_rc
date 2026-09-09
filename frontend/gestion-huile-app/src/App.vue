<template>
  <div id="app">
    <nav class="navbar navbar-expand-lg navbar-dark" style="background-color: #ED1C24;" v-if="isLoggedIn">
      <div class="container-fluid">
        <router-link class="navbar-brand" to="/">
          <i class="bi bi-droplet me-2"></i>RougeCongo
        </router-link>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <router-link class="nav-link" to="/" exact>Tableau de bord</router-link>
            </li>
            <li class="nav-item" v-if="hasModulePermission('recolte')">
              <router-link class="nav-link" to="/recolte">Récolte</router-link>
            </li>
            <li class="nav-item" v-if="hasModulePermission('production')">
              <router-link class="nav-link" to="/production">Production</router-link>
            </li>
            <li class="nav-item" v-if="hasModulePermission('stocks')">
              <router-link class="nav-link" to="/stocks">Stocks</router-link>
            </li>
            <li class="nav-item" v-if="hasModulePermission('clients')">
              <router-link class="nav-link" to="/clients">Clients</router-link>
            </li>
            <li class="nav-item" v-if="hasModulePermission('factures')">
              <router-link class="nav-link" to="/factures">Factures & BL</router-link>
            </li>
            <li class="nav-item" v-if="hasModulePermission('ventes')">
                <router-link class="nav-link" to="/ventes">Ventes</router-link>
            </li>
            <li class="nav-item" v-if="hasModulePermission('caisses')">
              <router-link class="nav-link" to="/caisses">Caisses</router-link>
            </li>
            <li class="nav-item" v-if="hasModulePermission('travailleurs')">
              <router-link class="nav-link" to="/travailleurs">Travailleurs</router-link>
            </li>
            <li class="nav-item" v-if="hasModulePermission('budgets')">
              <router-link class="nav-link" to="/budgets">Budgets</router-link>
            </li>
            <li class="nav-item" v-if="hasModulePermission('banque')">
              <router-link class="nav-link" to="/banque">Banque</router-link>
            </li>
            <li class="nav-item" v-if="hasModulePermission('comptabilite')">
              <router-link class="nav-link" to="/comptabilite">Comptabilité</router-link>
            </li>
            <li class="nav-item" v-if="hasModulePermission('reglages')">
              <router-link class="nav-link" to="/settings">Réglages</router-link>
            </li>
          </ul>
          <ul class="navbar-nav">
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                <i class="bi bi-person-circle me-1"></i>{{ currentUser?.nom }} ({{ currentUser?.role }})
                <span v-if="nbMessagesNonLus > 0" class="badge bg-danger ms-2">{{ nbMessagesNonLus }}</span>
              </a>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><router-link class="dropdown-item" to="/profil"><i class="bi bi-person"></i> Mon profil</router-link></li>
                <li><router-link class="dropdown-item" to="/messages">
                  <i class="bi bi-envelope"></i> Messagerie
                  <span v-if="nbMessagesNonLus > 0" class="badge bg-danger ms-2">{{ nbMessagesNonLus }}</span>
                </router-link></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" @click.prevent="logout"><i class="bi bi-box-arrow-right"></i> Déconnexion</a></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
    <div class="container-fluid mt-3">
      <router-view />
    </div>
  </div>
</template>

<script>
import { getRolePermissions } from './utils/permissions';
import notificationService from './services/notificationService';

export default {
  name: 'App',
  data() {
    return {
      currentUser: null,
      permissionsCache: {},
      nbMessagesNonLus: 0,
      intervalMessages: null
    };
  },
  computed: {
    isLoggedIn() {
      return !!this.currentUser;
    }
  },
  async mounted() {
    const user = localStorage.getItem('currentUser');
    if (user) {
      this.currentUser = JSON.parse(user);
      try {
        console.log('[App] Début loadPermissions');
        await this.loadPermissions();
        console.log('[App] Fin loadPermissions');
      } catch (e) {
        console.error('[App] Erreur dans loadPermissions:', e);
      }
      try {
        console.log('[App] Début rafraichirCompteurMessages');
        await this.rafraichirCompteurMessages();
        console.log('[App] Fin rafraichirCompteurMessages');
      } catch (e) {
        console.error('[App] Erreur dans rafraichirCompteurMessages:', e);
      }
      this.intervalMessages = setInterval(async () => {
        try {
          console.log('[App] Interval - rafraichirCompteurMessages');
          await this.rafraichirCompteurMessages();
          console.log('[App] Interval - verifierTousLesMessages');
          await notificationService.verifierTousLesMessages();
        } catch (e) {
          console.error('[App] Erreur dans interval messages:', e);
        }
      }, 3600000);
    }
  },
  beforeUnmount() {
    if (this.intervalMessages) clearInterval(this.intervalMessages);
  },
  methods: {
    async loadPermissions() {
      if (!this.currentUser) return;
      try {
        const perms = await getRolePermissions(this.currentUser.role);
        this.permissionsCache = perms || {};
      } catch (e) {
        console.error("Erreur chargement permissions", e);
        this.permissionsCache = {};
      }
    },
    hasModulePermission(module) {
      const perm = this.permissionsCache[module];
      return perm === 'lecture' || perm === 'ecriture';
    },
    async handleLogin(user) {
      this.currentUser = user;
      await this.loadPermissions();
      await this.rafraichirCompteurMessages();
    },
    logout() {
      localStorage.removeItem('currentUser');
      this.currentUser = null;
      this.permissionsCache = {};
      this.$router.push('/login');
    },
    async rafraichirCompteurMessages() {
      try {
        this.nbMessagesNonLus = await notificationService.getMessagesNonLusCount(this.currentUser);
      } catch (e) {
        console.warn('⚠️ Impossible de charger le compteur de messages (table peut être absente).', e.message);
        this.nbMessagesNonLus = 0;
      }
    }
  }
};
</script>

<style>

@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

body {
  background-color: #f4f7fc;
  font-family: 'Poppins', sans-serif;
}

#app {
  min-height: 100vh;
}

.navbar {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 1rem;
}

.navbar {
    position: sticky;
    top: 0;
    z-index: 1030; /* au-dessus du contenu */
}

.navbar-brand {
  font-weight: 700;
  font-size: 1.5rem;
  letter-spacing: 0.5px;
}

.navbar-dark .navbar-nav .nav-link {
  color: rgba(255,255,255,0.9);
  font-weight: 500;
  transition: all 0.2s;
  border-radius: 30px;
  padding: 0.5rem 1rem;
  margin: 0 0.2rem;
}

.navbar-dark .navbar-nav .nav-link:hover,
.navbar-dark .navbar-nav .nav-link.router-link-active {
  background-color: rgba(255,255,255,0.2);
  color: white;
}

.card {
  border: none;
  border-radius: 15px;
  box-shadow: 0 6px 15px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  margin-bottom: 20px;
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 25px rgba(0,0,0,0.1);
}

.card-header {
  background-color: #ED1C24;
  color: white;
  font-weight: 600;
  border-radius: 15px 15px 0 0 !important;
  padding: 1rem 1.5rem;
  border-bottom: none;
}

.btn {
  border-radius: 30px;
  padding: 0.6rem 1.5rem;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background-color: #ED1C24;
  border: none;
  box-shadow: 0 4px 10px rgba(237, 28, 36, 0.3);
}

.btn-primary:hover {
  background-color: #c4141b;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(237, 28, 36, 0.4);
}

.btn-outline-primary {
  color: #ED1C24;
  border: 2px solid #ED1C24;
  background: transparent;
}

.btn-outline-primary:hover {
  background-color: #ED1C24;
  color: white;
}

.btn-success {
  background-color: #28a745;
  background: linear-gradient(135deg, #28a745, #20c997);
  box-shadow: 0 4px 10px rgba(40, 167, 69, 0.3);
}

.form-control, .form-select {
  border-radius: 30px;
  padding: 0.75rem 1.25rem;
  border: 2px solid #e0e0e0;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.form-control:focus, .form-select:focus {
  border-color: #ED1C24;
  box-shadow: 0 0 0 0.25rem rgba(237, 28, 36, 0.2);
}

.table {
  border-radius: 15px;
  overflow: hidden;
}

.table thead {
  background-color: #f8f9fc;
  font-weight: 600;
  color: #333;
}

.table-striped > tbody > tr:nth-of-type(odd) {
  background-color: rgba(237, 28, 36, 0.02);
}

.table-hover > tbody > tr:hover {
  background-color: rgba(237, 28, 36, 0.05);
}

.text-primary {
  color: #ED1C24 !important;
}

.bg-primary {
  background-color: #ED1C24 !important;
}

.badge-rouge {
  background-color: #ED1C24;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 30px;
  font-weight: 500;
}

.modal {
  z-index: 1055 !important;
}
.modal-backdrop {
  z-index: 1050 !important;
}
.modal-dialog {
  margin: 1.75rem auto;
}

</style>