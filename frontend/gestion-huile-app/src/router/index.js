import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../components/Dashboard.vue';
import Login from '../components/Login.vue';
import Settings from '../components/Settings.vue';
import Recolte from '../components/Recolte.vue';
import Production from '../components/Production.vue';
import Stocks from '../components/Stocks.vue';
import Clients from '../components/Clients.vue';
import Factures from '../components/Factures.vue';
import BonsLivraison from '../components/BonsLivraison.vue';
import Caisses from '../components/Caisses.vue';
import Budget from '../components/Budget.vue';
import Banque from '../components/Banque.vue';
import Travailleurs from '../components/Travailleurs.vue';
import { getRolePermissions } from '../utils/permissions';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/recolte',
    name: 'Recolte',
    component: Recolte,
    meta: { requiresAuth: true }
  },
  {
    path: '/production',
    name: 'Production',
    component: Production,
    meta: { requiresAuth: true }
  },
  {
    path: '/stocks',
    name: 'Stocks',
    component: Stocks,
    meta: { requiresAuth: true }
  },
  {
    path: '/clients',
    name: 'Clients',
    component: Clients,
    meta: { requiresAuth: true }
  },
  {
    path: '/factures',
    name: 'Factures',
    component: Factures,
    meta: { requiresAuth: true }
  },
  {
    path: '/bons-livraison',
    name: 'BonsLivraison',
    component: BonsLivraison,
    meta: { requiresAuth: true }
  },
  {
    path: '/caisses',
    name: 'Caisses',
    component: Caisses,
    meta: { requiresAuth: true }
  },
  {
    path: '/budgets',
    name: 'Budget',
    component: Budget,
    meta: { requiresAuth: true }
  },
  {
    path: '/banque',
    name: 'Banque',
    component: Banque,
    meta: { requiresAuth: true }
  },
  {
    path: '/comptabilite',
    name: 'Comptabilite',
    component: () => import('../components/Comptabilite.vue'),
    meta: { requiresAuth: true, permission: 'comptabilite' }
  },
  {
    path: '/travailleurs',         // Nouvelle route
    name: 'Travailleurs',
    component: Travailleurs,
    meta: { requiresAuth: true }
  },
  {
    path: '/ventes',
    name: 'Ventes',
    component: () => import('../components/Ventes.vue'),
    meta: { requiresAuth: true, permission: 'ventes' }
  },
  {
    path: '/profil',
    name: 'Profil',
    component: () => import('../components/Profil.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('../components/Messages.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  const currentUser = localStorage.getItem('currentUser');

  // Vérification de l'authentification
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!currentUser) {
      next('/login');
      return;
    }
  }

  // Vérification de la permission spécifique si définie dans la route
  if (to.meta.permission) {
    const user = JSON.parse(currentUser || '{}');
    const permissions = await getRolePermissions(user.role);
    if (!permissions || permissions[to.meta.permission] === 'aucun') {
      next('/');
      return;
    }
  }

  next();
});

export default router;