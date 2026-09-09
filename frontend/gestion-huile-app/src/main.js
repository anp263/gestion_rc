import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { initData, db } from './db'
import { initTestData } from './initTestData'

const app = createApp(App)
app.use(store)
app.use(router)
app.mount('#app')

// Exposer initTestData globalement pour la console
window.initTestData = initTestData

// Initialisation des tables et données système (migrations Dexie)
initData().catch(err => console.error("Erreur initData", err))

// Vérification et création de l'utilisateur admin si nécessaire
const ensureAdminUser = async () => {
    try {
        const nbUtilisateurs = await db.utilisateurs.count()
        if (nbUtilisateurs === 0) {
            await db.utilisateurs.add({
                id: crypto.randomUUID(),
                nom: 'Admin',
                login: 'admin',
                mot_de_passe: 'admin123',
                role: 'superviseur'
            })
            console.log('✅ Utilisateur admin créé automatiquement (login: admin / admin123)')
        }
    } catch (e) {
        console.error("Erreur lors de la création de l'admin:", e)
    }
}

// Chargement des données de test uniquement si la base est complètement vide (caisses ET utilisateurs)
setTimeout(async () => {
    try {
        await ensureAdminUser()

        const nbCaisses = await db.caisses.count()
        const nbUtilisateurs = await db.utilisateurs.count()
        // Si aucune caisse et seulement l'admin (ou aucun autre utilisateur), on charge les données de test
        if (nbCaisses === 0 && nbUtilisateurs <= 1) {
            console.log("Première utilisation → import des données de test")
            await initTestData()
            location.reload() // Recharger pour voir les nouvelles données
        }
    } catch (e) {
        console.error("Erreur lors du chargement des données de test", e)
    }
}, 1000)