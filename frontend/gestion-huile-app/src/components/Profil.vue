<template>
    <div class="container-fluid">
        <h2 class="mb-4" style="color: #ED1C24;"> Mon profil </h2>
        <div class="card">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Nom : </strong> {{ currentUser.nom }}</p>
                        <p><strong>Login : </strong> {{ currentUser.login }}</p>
                        <p><strong>Rôle : </strong> {{ currentUser.role }}</p>
                    </div>
                </div>
                <hr>
                <h5>Changer le mot de passe </h5>
                <div class="row">
                    <div class="col-md-4">
                        <div class="mb-3">
                            <label for="oldPassword" class="form-label"> Ancien mot de passe </label>
                            <input type="password" class="form-control" id="oldPassword" v - model="oldPassword"
                                autocomplete="off">
                        </div>
                        <div class="mb-3">
                            <label for="newPassword" class="form-label"> Nouveau mot de passe </label>
                            <input type="password" class="form-control" id="newPassword" v - model="newPassword"
                                autocomplete="off">
                        </div>
                        <div class="mb-3">
                            <label for="confirmPassword" class="form-label"> Confirmer le mot de passe </label>
                            <input type="password" class="form-control" id="confirmPassword" v - model="confirmPassword"
                                autocomplete="off">
                        </div>
                        <button class="btn btn-primary" @click="changerMotDePasse"> Enregistrer </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import { db } from '../db';
    import apiService from '../services/api';

    export default {
        name: 'Profil',
        data() {
            return {
                currentUser: JSON.parse(localStorage.getItem('currentUser') || '{}'),
                oldPassword: '',
                newPassword: '',
                confirmPassword: ''
            };
        },
        methods: {
            async changerMotDePasse() {
                if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
                    alert('Tous les champs sont obligatoires');
                    return;
                }
                if (this.newPassword !== this.confirmPassword) {
                    alert('Les nouveaux mots de passe ne correspondent pas');
                    return;
                }
                try {
                    const user = await db.utilisateurs.get(this.currentUser.id);
                    if (!user) {
                        alert('Utilisateur introuvable');
                        return;
                    }
                    if (user.mot_de_passe !== this.oldPassword) {
                        alert('Ancien mot de passe incorrect');
                        return;
                    }
                    await apiService.modifier('utilisateurs', user.id, { mot_de_passe: this.newPassword });
                    alert('Mot de passe modifié avec succès');
                    this.oldPassword = '';
                    this.newPassword = '';
                    this.confirmPassword = '';
                } catch (error) {
                    console.error('Erreur lors du changement de mot de passe:', error);
                    alert('Une erreur est survenue');
                }
            }
        }
    };
</script>

<style scoped>
    /* Styles optionnels */
</style>