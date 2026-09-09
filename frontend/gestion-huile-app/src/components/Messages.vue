<template>
    <div class="container-fluid">
        <h2 class="mb-4" style="color: #ED1C24;">Messagerie</h2>

        <div class="row">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <span><i class="bi bi-envelope"></i> Messages reçus</span>
                        <button class="btn btn-sm btn-primary" @click="showNouveauMessage = true">
                            <i class="bi bi-plus-circle"></i> Nouveau message
                        </button>
                    </div>
                    <div class="card-body p-0">
                        <div class="list-group list-group-flush">
                            <a v-for="msg in messagesTries" :key="msg.id" href="#"
                                class="list-group-item list-group-item-action" :class="{ 'fw-bold': !msg.lu }"
                                @click="ouvrirMessage(msg)">
                                <div class="d-flex w-100 justify-content-between">
                                    <h6 class="mb-1">
                                        <span v-if="msg.type === 'systeme'" class="badge bg-info me-2">Système</span>
                                        <span v-else class="badge bg-secondary me-2">Direct</span>
                                        {{ msg.titre }}
                                    </h6>
                                    <small>{{ formatDate(msg.dateEnvoi) }}</small>
                                </div>
                                <p class="mb-1 text-truncate">{{ msg.contenu }}</p>
                                <small>De : {{ getExpediteurNom(msg.expediteurId) }}</small>
                            </a>
                            <div v-if="messagesTries.length === 0" class="list-group-item text-center text-muted">
                                Aucun message
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <i class="bi bi-funnel"></i> Filtres
                    </div>
                    <div class="card-body">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" v-model="filtreNonLus" id="nonLus">
                            <label class="form-check-label" for="nonLus">Non lus uniquement</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" v-model="filtreSysteme" id="systeme">
                            <label class="form-check-label" for="systeme">Messages système</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" v-model="filtreDirect" id="direct">
                            <label class="form-check-label" for="direct">Messages directs</label>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal nouveau message -->
        <div v-if="showNouveauMessage" class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Nouveau message</h5>
                        <button type="button" class="btn-close" @click="showNouveauMessage = false"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label>Destinataire</label>
                            <select class="form-select" v-model="nouveauMessage.destinataireId">
                                <option v-for="user in utilisateurs" :key="user.id" :value="user.id">
                                    {{ user.nom }} ({{ user.role }})
                                </option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label>Titre</label>
                            <input type="text" class="form-control" v-model="nouveauMessage.titre">
                        </div>
                        <div class="mb-3">
                            <label>Message</label>
                            <textarea class="form-control" rows="5" v-model="nouveauMessage.contenu"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" @click="showNouveauMessage = false">Annuler</button>
                        <button class="btn btn-primary" @click="envoyerMessage">Envoyer</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal lecture message -->
        <div v-if="messageOuvert" class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">{{ messageOuvert.titre }}</h5>
                        <button type="button" class="btn-close" @click="messageOuvert = null"></button>
                    </div>
                    <div class="modal-body">
                        <p><strong>De :</strong> {{ getExpediteurNom(messageOuvert.expediteurId) }}</p>
                        <p><strong>Date :</strong> {{ formatDate(messageOuvert.dateEnvoi) }}</p>
                        <hr>
                        <p style="white-space: pre-wrap;">{{ messageOuvert.contenu }}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" @click="messageOuvert = null">Fermer</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import { db } from '../db';
    import notificationService from '../services/notificationService';

    export default {
        name: 'Messages',
        data() {
            return {
                messages: [],
                utilisateurs: [],
                filtreNonLus: false,
                filtreSysteme: true,
                filtreDirect: true,
                showNouveauMessage: false,
                nouveauMessage: {
                    destinataireId: '',
                    titre: '',
                    contenu: ''
                },
                messageOuvert: null
            };
        },
        computed: {
            currentUser() {
                return JSON.parse(localStorage.getItem('currentUser') || '{}');
            },
            messagesTries() {
                let result = this.messages
                    .filter(m => m.destinataireRole === this.currentUser.role || m.destinataireId === this.currentUser.id)
                    .sort((a, b) => new Date(b.dateEnvoi) - new Date(a.dateEnvoi));
                if (this.filtreNonLus) result = result.filter(m => !m.lu);
                if (!this.filtreSysteme) result = result.filter(m => m.type !== 'systeme');
                if (!this.filtreDirect) result = result.filter(m => m.type !== 'direct');
                return result;
            }
        },
        async mounted() {
            await this.chargerDonnees();
        },
        methods: {
            async chargerDonnees() {
                this.messages = await db.messages.toArray();
                this.utilisateurs = await db.utilisateurs.toArray();
            },
            getExpediteurNom(id) {
                if (id === 'system') return 'Système';
                const user = this.utilisateurs.find(u => u.id === id);
                return user ? user.nom : 'Inconnu';
            },
            formatDate(dateStr) {
                return new Date(dateStr).toLocaleString('fr-FR');
            },
            async ouvrirMessage(msg) {
                if (!msg.lu) {
                    await db.messages.update(msg.id, { lu: true });
                    msg.lu = true;
                }
                this.messageOuvert = msg;
            },
            async envoyerMessage() {
                const expediteur = this.currentUser;
                await notificationService.envoyerMessageDirect(
                    expediteur.id,
                    this.nouveauMessage.destinataireId,
                    this.nouveauMessage.titre,
                    this.nouveauMessage.contenu
                );
                this.showNouveauMessage = false;
                this.nouveauMessage = { destinataireId: '', titre: '', contenu: '' };
                await this.chargerDonnees();
            }
        }
    };
</script>