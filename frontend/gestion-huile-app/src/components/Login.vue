<template>
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-5">
        <div class="card shadow-lg border-0 rounded-4 overflow-hidden">
          <div class="card-header text-white text-center py-4" style="background-color: #ED1C24;">
            <h3 class="mb-0"><i class="bi bi-droplet me-2"></i>Gestion Huile de Palme</h3>
          </div>
          <div class="card-body p-5">
            <form @submit.prevent="login">
              <div class="mb-4">
                <label for="login" class="form-label fw-semibold">Nom d'utilisateur</label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-0"><i class="bi bi-person"></i></span>
                  <input type="text" class="form-control" id="login" v-model="credentials.login" required>
                </div>
              </div>
              <div class="mb-4">
                <label for="password" class="form-label fw-semibold">Mot de passe</label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-0"><i class="bi bi-lock"></i></span>
                  <input type="password" class="form-control" id="password" v-model="credentials.password" required>
                </div>
              </div>
              <div class="alert alert-danger rounded-pill" v-if="error">
                {{ error }}
              </div>
              <button type="submit" class="btn btn-primary w-100 py-3 rounded-pill" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                {{ loading ? 'Connexion...' : 'Se connecter' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import apiService from '../services/api';
import { db } from '../db';

export default {
  name: 'Login',
  data() {
    return {
      credentials: {
        login: '',
        password: ''
      },
      loading: false,
      error: null
    };
  },
  methods: {
    async login() {
      this.loading = true;
      this.error = null;

      try {
        const response = await apiService.api.get('utilisateurs');
        const utilisateurs = response.data;

        const utilisateur = utilisateurs.find(
          u => u.login === this.credentials.login && u.mot_de_passe === this.credentials.password
        );

        if (utilisateur) {
          await db.utilisateurs.clear();
          await db.utilisateurs.add(utilisateur);

          localStorage.setItem('currentUser', JSON.stringify(utilisateur));
          this.$emit('login-success', utilisateur);
          this.$router.push('/');
        } else {
          this.error = 'Identifiants incorrects';
        }
      } catch (err) {
        console.error('Erreur connexion:', err);
        this.error = 'Impossible de contacter le serveur. Vérifiez que le backend est lancé.';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>