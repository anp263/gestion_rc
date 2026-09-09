<template>
  <div class="container-fluid">
    <h2 class="mb-4" style="color: #ED1C24;">Réglages</h2>

    <!-- Barre de groupes (boutons) -->
    <div class="btn-group mb-3" v-if="groupesVisibles.length > 1">
      <button
        v-for="grp in groupesVisibles"
        :key="grp"
        type="button"
        class="btn"
        :class="activeGroup === grp ? 'btn-primary' : 'btn-outline-primary'"
        @click="activeGroup = grp"
      >
        {{ groupLabels[grp] }}
      </button>
    </div>

    <!-- Contenu du groupe actif -->
    <div class="card">
      <div class="card-body">
        <!-- ==================== ADMINISTRATION ==================== -->
        <div v-if="activeGroup === 'admin'">
          <ul class="nav nav-tabs">
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'admin-utilisateurs' }" href="#" @click.prevent="sousOnglet = 'admin-utilisateurs'">Utilisateurs</a></li>
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'admin-roles' }" href="#" @click.prevent="sousOnglet = 'admin-roles'">Rôles</a></li>
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'admin-departements' }" href="#" @click.prevent="sousOnglet = 'admin-departements'">Départements</a></li>
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'admin-objectifs' }" href="#" @click.prevent="sousOnglet = 'admin-objectifs'">Objectifs</a></li>
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'admin-postes-travail' }" href="#" @click.prevent="sousOnglet = 'admin-postes-travail'">Postes de travail</a></li>
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'admin-conges' }" href="#" @click.prevent="sousOnglet = 'admin-conges'">Congés</a></li>
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'admin-notifications' }" href="#" @click.prevent="sousOnglet = 'admin-notifications'">Notifications</a></li>
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'admin-coordonnees' }" href="#" @click.prevent="sousOnglet = 'admin-coordonnees'">Coordonnées société</a></li>
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'admin-modeles' }" href="#" @click.prevent="sousOnglet = 'admin-modeles'">Modèles d'impression</a></li>
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'admin-sync' }" href="#" @click.prevent="sousOnglet = 'admin-sync'">Synchronisation</a></li>
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'admin-journal' }" href="#" @click.prevent="sousOnglet = 'admin-journal'">Journal d'audit</a></li>
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'admin-reset' }" href="#" @click.prevent="sousOnglet = 'admin-reset'">Réinitialisation</a></li>
          </ul>
          <div class="tab-content p-3 bg-white border rounded-bottom">
            <!-- Utilisateurs -->
            <div v-show="sousOnglet === 'admin-utilisateurs'">
              <h4>Gestion des utilisateurs</h4>
              <button class="btn btn-success mb-3" @click="ouvrirModalUtilisateur(null)">Ajouter un utilisateur</button>
              <div class="table-responsive">
                <table class="table table-bordered">
                  <thead>
                    <tr><th>Nom</th><th>Login</th><th>Rôle</th><th>Caisses accessibles</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="u in utilisateurs" :key="u.id">
                      <td>{{ u.nom }}</td>
                      <td>{{ u.login }}</td>
                      <td>{{ u.role }}</td>
                      <td>
                        <span v-for="c in getCaissesForUser(u.id)" :key="c.id" class="badge bg-secondary me-1">{{ c.nom }}</span>
                        <button class="btn btn-sm btn-outline-primary" @click="gererCaissesUtilisateur(u)">Modifier</button>
                      </td>
                      <td>
                        <button class="btn btn-sm btn-warning me-1" @click="ouvrirModalUtilisateur(u)">Modifier</button>
                        <button class="btn btn-sm btn-danger" @click="supprimerUtilisateur(u.id)">Supprimer</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!-- Modal utilisateur -->
              <teleport to="body">
                <div v-if="modalUtilisateur" class="modal fade show" tabindex="-1" style="display: block; background-color: rgba(0,0,0,0.5);">
                  <div class="modal-dialog">
                    <div class="modal-content">
                      <div class="modal-header">
                        <h5 class="modal-title">{{ utilisateurEnEdition ? 'Modifier' : 'Ajouter' }} un utilisateur</h5>
                        <button type="button" class="btn-close" @click="modalUtilisateur = false" aria-label="Close"></button>
                      </div>
                      <div class="modal-body">
                        <form @submit.prevent="enregistrerUtilisateur">
                          <div class="mb-3">
                            <label for="userNom" class="form-label">Nom</label>
                            <input type="text" class="form-control" id="userNom" v-model="utilisateurForm.nom" required>
                          </div>
                          <div class="mb-3">
                            <label for="userLogin" class="form-label">Login</label>
                            <input type="text" class="form-control" id="userLogin" v-model="utilisateurForm.login" required>
                          </div>
                          <div class="mb-3">
                            <label for="userPassword" class="form-label">Mot de passe</label>
                            <input type="password" class="form-control" id="userPassword" v-model="utilisateurForm.mot_de_passe" :required="!utilisateurEnEdition">
                            <small v-if="utilisateurEnEdition" class="text-muted">Laisser vide pour conserver l'ancien mot de passe</small>
                          </div>
                          <div class="mb-3">
                            <label for="userRole" class="form-label">Rôle</label>
                            <select class="form-select" id="userRole" v-model="utilisateurForm.role">
                              <option v-for="r in rolesArray" :key="r.nom" :value="r.nom">{{ r.nom }}</option>
                            </select>
                          </div>
                          <div class="mb-3">
                              <label for="userTravailleur" class="form-label">Travailleur associé</label>
                              <select class="form-select" id="userTravailleur" v-model="utilisateurForm.travailleur_id">
                                  <option value="">-- Aucun --</option>
                                  <option v-for="t in travailleursPourUtilisateur" :key="t.id" :value="t.id">
                                      {{ t.nom }} {{ t.prenom }}
                                  </option>
                              </select>
                              <small class="text-muted">Lier un travailleur à ce vendeur pour générer automatiquement ses primes.</small>
                          </div>
                          <div class="d-flex justify-content-end">
                            <button type="button" class="btn btn-secondary me-2" @click="modalUtilisateur = false">Annuler</button>
                            <button type="submit" class="btn btn-primary">Enregistrer</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </teleport>

              <!-- Modal caisses utilisateur -->
              <div v-if="modalCaissesUtilisateur" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
                <div class="modal-dialog">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5 class="modal-title">Caisses accessibles pour {{ utilisateurCourant?.nom }}</h5>
                      <button type="button" class="btn-close" @click="modalCaissesUtilisateur = false"></button>
                    </div>
                    <div class="modal-body">
                      <div v-for="caisse in caisses" :key="caisse.id" class="form-check">
                        <input class="form-check-input" type="checkbox" :value="caisse.id" v-model="caissesSelectionnees">
                        <label class="form-check-label">{{ caisse.nom }}</label>
                      </div>
                    </div>
                    <div class="modal-footer">
                      <button class="btn btn-secondary" @click="modalCaissesUtilisateur = false">Annuler</button>
                      <button class="btn btn-primary" @click="sauvegarderCaissesUtilisateur">Sauvegarder</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Rôles -->
            <div v-show="sousOnglet === 'admin-roles'">
              <h4>Rôles et permissions</h4>
                  <p class="text-muted">
                      Module <strong>Ventes</strong> : accès à la page Ventes (Suivi, Statistiques). L'écriture permet de gérer les bonus des vendeurs.
                  </p>
              <div class="d-flex justify-content-between align-items-center mb-3">
                <button class="btn btn-success" @click="ajouterRole">
                  <i class="bi bi-plus-circle me-1"></i>Ajouter un rôle
                </button>
                <button class="btn btn-primary" @click="sauvegarderRoles">
                  <i class="bi bi-check-circle me-1"></i>Sauvegarder les rôles
                </button>
              </div>
              <div v-for="(role, index) in rolesArray" :key="index" class="card mb-3">
                <div class="card-header d-flex justify-content-between">
                  <input type="text" class="form-control w-25" v-model="role.nom" placeholder="Nom du rôle">
                  <button class="btn btn-sm btn-danger" @click="supprimerRole(index)">Supprimer</button>
                </div>
                <div class="mt-3">
                <h6>Accès aux sites</h6>
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Site</th>
                      <th>Lecture</th>
                      <th>Écriture</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="site in sites" :key="site.id">
                      <td>{{ site.nom }}</td>
                      <td>
                        <input type="checkbox"
                              :checked="getAccesSite(role, site.id, 'lecture')"
                              @change="getAccesSite(role, site.id, 'lecture') ? (role.accesSites[site.id].lecture = $event.target.checked) : null">
                      </td>
                      <td>
                        <input type="checkbox"
                              :checked="getAccesSite(role, site.id, 'ecriture')"
                              @change="getAccesSite(role, site.id, 'ecriture') ? (role.accesSites[site.id].ecriture = $event.target.checked) : null">
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
                <div class="card-body">
                  <div class="row">
                    <div v-for="module in modules" :key="module" class="col-md-3 mb-2">
                      <label>{{ module }}</label>
                      <select class="form-select" v-model="role.permissions[module]">
                        <option value="aucun">Aucun</option>
                        <option value="lecture">Lecture</option>
                        <option value="ecriture">Écriture</option>
                      </select>
                    </div>
                  </div>
                  <div class="mt-3" v-if="role.permissions.reglages !== 'aucun'">
                    <h6>Accès aux groupes de réglages</h6>
                    <div v-for="groupe in groupesDisponibles" :key="groupe.id" class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="role.groupes" :value="groupe.id">
                      <label class="form-check-label">{{ groupe.label }}</label>
                    </div>
                  </div>
                </div>
              </div>
              <button class="btn btn-primary" @click="sauvegarderRoles">Sauvegarder les rôles</button>
            </div>

            <!--Postes de travail-->

            <div v-show="sousOnglet === 'admin-postes-travail'">
              <h4>Postes de travail (fonctions)</h4>
              <p class="text-muted">Ces postes seront disponibles lors de la création des travailleurs.</p>
              <div v-for="(poste, index) in postesTravail" :key="index" class="input-group mb-2">
                <input type="text" class="form-control" v-model="postesTravail[index]">
                <button class="btn btn-outline-danger" @click="supprimerPosteTravail(index)">×</button>
              </div>
              <button class="btn btn-success" @click="ajouterPosteTravail">Ajouter</button>
              <button class="btn btn-primary ms-2" @click="sauvegarderPostesTravail">Sauvegarder</button>
            </div>

            <!-- Notifications -->
            <div v-show="sousOnglet === 'admin-notifications'">
              <h4>Configuration des notifications automatiques</h4>
              <p class="text-muted">Activez/désactivez les notifications et personnalisez les messages.</p>
              
              <div class="accordion" id="notifAccordion">
                <div v-for="(conf, type) in configNotif" :key="type" class="accordion-item">
                  <h2 class="accordion-header">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" :data-bs-target="'#collapse_' + type">
                      <span class="me-2">
                        <i v-if="conf.actif" class="bi bi-check-circle-fill text-success"></i>
                        <i v-else class="bi bi-x-circle-fill text-danger"></i>
                      </span>
                      {{ getNotifLabel(type) }}
                    </button>
                  </h2>
                  <div :id="'collapse_' + type" class="accordion-collapse collapse" data-bs-parent="#notifAccordion">
                    <div class="accordion-body">
                      <div class="row">
                        <div class="col-md-3">
                          <div class="form-check form-switch mb-3">
                            <input class="form-check-input" type="checkbox" v-model="conf.actif" id="actif_'+type">
                            <label class="form-check-label" :for="'actif_'+type">Actif</label>
                          </div>
                        </div>
                        <div class="col-md-9">
                          <label>Destinataires (rôles)</label>
                          <select class="form-select" multiple v-model="conf.destinataires">
                            <option v-for="role in rolesArray" :key="role.nom" :value="role.nom">{{ role.nom }}</option>
                          </select>
                        </div>
                      </div>
                      <div class="mb-3">
                        <label>Modèle du message</label>
                        <textarea class="form-control" rows="2" v-model="conf.modele"></textarea>
                        <small class="text-muted">Variables : {{ getVariablesForType(type) }}</small>
                      </div>
                      <div v-if="conf.seuils && Object.keys(conf.seuils).length" class="row">
                        <div v-for="(val, key) in conf.seuils" :key="key" class="col-md-3 mb-2">
                          <label>{{ getSeuilLabel(key) }}</label>
                          <input type="number" step="0.01" class="form-control" v-model.number="conf.seuils[key]">
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button class="btn btn-primary mt-3" @click="sauvegarderConfigNotif">Sauvegarder la configuration</button>
            </div>

            <!-- Coordonnées société -->
            <div v-show="sousOnglet === 'admin-coordonnees'">
              <h4>Coordonnées de l'entreprise</h4>
              <div class="row">
                <div class="col-md-6 mb-3"><label>Nom</label><input type="text" class="form-control" v-model="coordonnees.nom"></div>
                <div class="col-md-6 mb-3"><label>Adresse</label><input type="text" class="form-control" v-model="coordonnees.adresse"></div>
                <div class="col-md-6 mb-3"><label>Téléphone</label><input type="text" class="form-control" v-model="coordonnees.telephone"></div>
                <div class="col-md-6 mb-3"><label>Email</label><input type="email" class="form-control" v-model="coordonnees.email"></div>
                <div class="col-md-12 mb-3"><label>Informations légales</label><textarea class="form-control" rows="3" v-model="coordonnees.legalInfo"></textarea></div>
                <div class="col-md-12 mb-3"><label>Logo</label><input type="file" class="form-control" @change="handleLogoUpload" accept="image/*"><img v-if="coordonnees.logo" :src="coordonnees.logo" style="max-width:150px; margin-top:10px;"></div>
              </div>
              <button class="btn btn-primary" @click="sauvegarderCoordonnees">Sauvegarder</button>
            </div>

            <!-- Modèles -->
            <div v-show="sousOnglet === 'admin-modeles'">
              <h4>Modèles d'impression</h4>
              <div class="mb-3"><label>Modèle de facture (HTML)</label><textarea class="form-control" rows="12" v-model="modeleFacture"></textarea><small>Variables : numero, date, client.nom, vendeur.nom, devise, totalHT, lignesHtml, coordonnees.*</small></div>
              <div class="mb-3"><label>Modèle de bon de livraison (HTML)</label><textarea class="form-control" rows="12" v-model="modeleBL"></textarea><small>Variables : numero, date, factureNumero, site.nom, client.nom, lignesHtml, coordonnees.*</small></div>
              <button class="btn btn-primary" @click="sauvegarderModeles">Sauvegarder</button>
            </div>

            <!-- Départements -->
            <div v-show="sousOnglet === 'admin-departements'">
            <h4>Départements</h4>
            <div class="alert alert-info">
              <i class="bi bi-info-circle"></i> Les postes budgétaires de salaire (ex: "Salaire - Production") sont automatiquement créés et synchronisés avec ces départements. Ils apparaissent dans Finance > Postes budgétaires (lecture seule).
            </div>
            <table class="table table-sm">
              <thead>
                <tr><th>Nom du département</th><th>Actions</th></tr>
              </thead>
              <tbody>
                <tr v-for="(dep, index) in departements" :key="index">
                  <td>
                    <input type="text" class="form-control" v-model="departements[index]" @change="onDepartementChange(index, $event)">
                  </td>
                  <td>
                    <button class="btn btn-sm btn-danger" @click="supprimerDepartement(index)">Supprimer</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <button class="btn btn-success" @click="ajouterDepartement">Ajouter un département</button>
            <button class="btn btn-primary ms-2" @click="sauvegarderDepartements">Sauvegarder</button>

            <!-- Modale de remplacement (pour suppression) -->
            <div v-if="modalRemplacementDepartement" class="modal" style="display: block; background: rgba(0,0,0,0.5);">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">Remplacer le département</h5>
                    <button type="button" class="btn-close" @click="modalRemplacementDepartement = null"></button>
                  </div>
                  <div class="modal-body">
                    <p>Le département <strong>{{ departementASupprimer }}</strong> va être supprimé. Veuillez choisir un département de remplacement pour les travailleurs et les écritures associées :</p>
                    <select class="form-select" v-model="departementRemplacement">
                      <option v-for="dep in departementsSauf(departementASupprimer)" :key="dep" :value="dep">{{ dep }}</option>
                    </select>
                  </div>
                  <div class="modal-footer">
                    <button class="btn btn-secondary" @click="modalRemplacementDepartement = null">Annuler</button>
                    <button class="btn btn-danger" @click="confirmerSuppressionDepartement">Supprimer et remplacer</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

            <!-- Synchronisation -->
            <div v-show="sousOnglet === 'admin-sync'">
              <h4>Synchronisation</h4>
              <p>Dernière synchronisation : {{ derniereSync || 'Jamais' }}</p>
              <button class="btn btn-primary" @click="synchroniser" :disabled="syncEnCours"><span v-if="syncEnCours" class="spinner-border spinner-border-sm me-2"></span>{{ syncEnCours ? 'Synchronisation...' : 'Synchroniser' }}</button>
              <div class="mt-3"><h5>Export / Import</h5><button class="btn btn-outline-primary me-2" @click="exporterDonnees">Exporter</button><label class="btn btn-outline-primary">Importer <input type="file" style="display: none" @change="importerDonnees" accept=".json"></label></div>
            </div>
          </div>
          <div v-show="sousOnglet === 'admin-objectifs'">
            <template v-if="objectifsReady">
                <h4>Objectifs mensuels</h4>
                <div class="row mb-3">
                    <div class="col-md-3">
                        <label>Année</label>
                        <select v-model="objectifAnnee" class="form-select" @change="chargerObjectifs">
                            <option v-for="a in anneesDisponibles" :key="a" :value="a">{{ a }}</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label>Devise d'affichage</label>
                        <select v-model="deviseSaisie" class="form-select" @change="chargerObjectifs">
                            <option value="CDF">CDF</option>
                            <option value="USD" :disabled="!tauxMensuelsDisponibles">USD</option>
                        </select>
                        <small v-if="deviseSaisie==='USD' && !tauxMensuelsDisponibles" class="text-danger">Taux mensuels incomplets</small>
                    </div>
                    <div class="col-md-3 mt-4">
                        <button class="btn btn-primary" @click="sauvegarderObjectifs">Sauvegarder</button>
                    </div>
                </div>
                <div class="table-responsive" style="max-height: 70vh;">
                    <table class="table table-sm table-bordered">
                        <thead>
                            <tr>
                                <th>Domaine</th>
                                <th v-for="m in moisNoms" :key="m" class="text-center">{{ m }}</th>
                                <th class="text-center">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="domaine in domainesObjectifsAvecDonnees" :key="domaine.value">
                                <td class="text-nowrap">
                                    {{ domaine.label }}
                                    <i class="bi bi-lightning-fill ms-2" style="cursor:pointer;" title="Appliquer à tous les mois"
                                      @click="fillAllMonths(domaine.value)"></i>
                                </td>
                                <td v-for="idx in 12" :key="idx">
                                    <template v-if="domaine.saisissable">
                                        <input type="text" class="form-control form-control-sm text-end no-spinner"
                                              :value="formatCellValue(objectifsParDomaine[domaine.value][idx-1], domaine, idx-1)"
                                              @change="updateObjectif(domaine.value, idx-1, $event.target.value)"
                                              @focus="$event.target.select()"
                                              @keypress="isNumberKey($event)">
                                    </template>
                                    <template v-else>
                                        <div class="text-end px-1" style="background:#f0f0f0; line-height:2;">
                                            {{ formatCellValue(lignesCalculees[domaine.value][idx-1], domaine, idx-1) }}
                                        </div>
                                    </template>
                                </td>
                                <td class="text-end">
                                    <strong>{{ formatCellValue(totauxParDomaine[domaine.value], domaine) }}</strong>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </template>
            <div v-else class="text-center p-3">
                Chargement des objectifs…
            </div>
        </div>
          <!-- Journal d'audit -->
          <div v-show="sousOnglet === 'admin-journal'">
            <h4>Journal d'audit</h4>
            <div class="row mb-3">
              <div class="col-md-3">
                <label>Du</label>
                <input type="date" class="form-control" v-model="auditFiltre.dateDebut">
              </div>
              <div class="col-md-3">
                <label>Au</label>
                <input type="date" class="form-control" v-model="auditFiltre.dateFin">
              </div>
              <div class="col-md-2">
                <label>Utilisateur</label>
                <select class="form-select" v-model="auditFiltre.utilisateurId">
                  <option value="">Tous</option>
                  <option v-for="u in utilisateurs" :key="u.id" :value="u.id">{{ u.nom }}</option>
                </select>
              </div>
              <div class="col-md-2">
                <label>Entité</label>
                <select class="form-select" v-model="auditFiltre.entite">
                  <option value="">Toutes</option>
                  <option v-for="entite in entitesAuditees" :key="entite" :value="entite">{{ entite }}</option>
                </select>
              </div>
              <div class="col-md-2">
                <label>Action</label>
                <select class="form-select" v-model="auditFiltre.action">
                  <option value="">Toutes</option>
                  <option value="création">Création</option>
                  <option value="modification">Modification</option>
                  <option value="suppression">Suppression</option>
                </select>
              </div>
              <div class="col-md-1">
                <button class="btn btn-primary mt-4" @click="chargerAudit">Filtrer</button>
              </div>
              <div class="col-md-1">
                <button class="btn btn-outline-primary mt-4" @click="exporterAuditCSV">CSV</button>
              </div>
            </div>
            <div class="table-responsive">
              <table class="table table-sm table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Utilisateur</th>
                    <th>Entité</th>
                    <th>Action</th>
                    <th>Détails</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="log in auditLogsFiltres" :key="log.id">
                    <td>{{ formatDateHeure(log.date) }}</td>
                    <td>{{ log.utilisateurNom }}</td>
                    <td>{{ log.entite }}</td>
                    <td>{{ log.action }}</td>
                    <td>{{ log.details }}</td>
                  </tr>
                  <tr v-if="auditLogsFiltres.length === 0">
                    <td colspan="5" class="text-center">Aucune entrée trouvée</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Onglet Réinitialisation -->
          <div v-show="sousOnglet === 'admin-reset'">
            <h4>Réinitialisation des données</h4>
            <p class="text-danger"><i class="bi bi-exclamation-triangle"></i> Ces actions sont irréversibles. Les données supprimées ne pourront pas être récupérées.</p>

            <div class="row">
              <div class="col-md-4">
                <div class="card mb-3">
                  <div class="card-header bg-danger text-white">Caisses & Banques</div>
                  <div class="card-body">
                    <p>Supprime toutes les caisses, sous‑caisses, mouvements, semaines, clôtures et associations utilisateurs.</p>
                    <button class="btn btn-outline-danger w-100" @click="resetModule('caisses')">🧹 Réinitialiser les caisses</button>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card mb-3">
                  <div class="card-header bg-danger text-white">Stocks & Mouvements</div>
                  <div class="card-body">
                    <p>Supprime les stocks, mouvements de stock, transferts, inventaires, reconditionnements.</p>
                    <button class="btn btn-outline-danger w-100" @click="resetModule('stocks')">🧹 Réinitialiser les stocks</button>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card mb-3">
                  <div class="card-header bg-danger text-white">Production & Récolte</div>
                  <div class="card-body">
                    <p>Supprime les semaines de production, récolte, consommations et lots.</p>
                    <button class="btn btn-outline-danger w-100" @click="resetModule('production')">🧹 Réinitialiser production</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="row">
              <div class="col-md-4">
                <div class="card mb-3">
                  <div class="card-header bg-danger text-white">Clients & Factures</div>
                  <div class="card-body">
                    <p>Supprime les clients, factures, lignes de facture, bons de livraison.</p>
                    <button class="btn btn-outline-danger w-100" @click="resetModule('clients')">🧹 Réinitialiser clients/factures</button>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card mb-3">
                  <div class="card-header bg-danger text-white">Budgets & Comptabilité</div>
                  <div class="card-body">
                    <p>Supprime les postes budgétaires, budgets, versions, plan comptable, journaux.</p>
                    <button class="btn btn-outline-danger w-100" @click="resetModule('finance')">🧹 Réinitialiser finances</button>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card mb-3">
                  <div class="card-header bg-danger text-white">Travailleurs & Salaires</div>
                  <div class="card-body">
                    <p>Supprime les travailleurs, salaires, avances, primes, présences.</p>
                    <button class="btn btn-outline-danger w-100" @click="resetModule('travailleurs')">🧹 Réinitialiser travailleurs</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="row">
              <div class="col-md-12">
                <div class="card mb-3 border-dark">
                  <div class="card-header bg-dark text-white">Réinitialisation complète</div>
                  <div class="card-body">
                    <p>Supprime toutes les données de l'application (sauf utilisateurs et réglages).</p>
                    <button class="btn btn-dark w-100" @click="resetAllData">⚠️ Tout réinitialiser</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- Congés -->
          <div v-show="sousOnglet === 'admin-conges'">
            <h4>Paramètres des congés</h4>
            <div class="row">
              <div class="col-md-4">
                <label>Jours de vacances annuels</label>
                <input type="number" class="form-control" v-model.number="paramsConges.joursVacancesAnnuels" min="0" max="52">
              </div>
              <div class="col-md-4">
                <label>Jours ouvrables par mois</label>
                <input type="number" class="form-control" v-model.number="paramsConges.joursOuvrablesMois" min="1" max="31">
              </div>
              <div class="col-md-4">
                <label>Plafond avance mois (% du salaire)</label>
                <input type="number" class="form-control" v-model.number="paramsConges.plafondAvanceMois" min="0" max="100">
              </div>
            </div>
            <button class="btn btn-primary mt-3" @click="sauvegarderParamsConges">Sauvegarder</button>
          </div>
        </div>

        

        <!-- ==================== PRODUCTION ==================== -->
        <div v-else-if="activeGroup === 'production'">
          <ul class="nav nav-tabs">
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'prod-sites' }" href="#" @click.prevent="sousOnglet = 'prod-sites'">Sites de stockage</a></li>
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'prod-carburant' }" href="#" @click.prevent="sousOnglet = 'prod-carburant'">Émissions CO₂ et carburant</a></li>
            <li class="nav-item">
              <a class="nav-link" :class="{ active: sousOnglet === 'prod-conditionnements' }" href="#" @click.prevent="sousOnglet = 'prod-conditionnements'">Conditionnements</a>
            </li>
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'prod-parcelles' }" href="#" @click.prevent="sousOnglet = 'prod-parcelles'">Parcelles</a></li>
          </ul>
          <div class="tab-content p-3 bg-white border rounded-bottom">
            <!-- Sites -->
            <div v-show="sousOnglet === 'prod-sites'">
              <h4>Sites de stockage</h4><p class="text-muted">Un seul site peut être le site de production.</p>
              <table class="table"><thead><tr><th>Nom</th><th>Site de production</th><th></th></tr></thead><tbody><tr v-for="(site, index) in sites" :key="site.id || index"><td><input type="text" class="form-control" v-model="site.nom"></td><td><input type="radio" :value="true" v-model="site.estProduction" @change="checkProduction(site)"> Oui</td><td><button class="btn btn-sm btn-danger" @click="supprimerSite(index)">Suppr.</button></td></tr></tbody></table>
              <button class="btn btn-success" @click="ajouterSite">Ajouter un site</button>
              <button class="btn btn-primary ms-2" @click="sauvegarderSites">Sauvegarder</button>
            </div>
            
            <!-- ONGLET CARBURANT -->
              <div v-show="sousOnglet === 'prod-carburant'">

                <!-- Types de carburant -->
                <h4>Types de carburant</h4>
                <table class="table">
                    <thead><tr><th>Nom</th><th>Unité</th><th>Facteur CO₂ (kg/L)</th><th>Sites de stockage</th><th></th></tr></thead>
                    <tbody>
                        <tr v-for="(ct, index) in carburantTypes" :key="ct.id || index">
                            <td><input type="text" class="form-control" v-model="ct.nom"></td>
                            <td><input type="text" class="form-control" v-model="ct.unite" readonly></td>
                            <td><input type="number" step="0.01" class="form-control" v-model.number="ct.facteur_co2"></td>
                            <td>
                                <div v-for="site in sites" :key="site.id" class="form-check">
                                    <input class="form-check-input" type="checkbox" :value="site.id" v-model="ct.sites">
                                    <label class="form-check-label">{{ site.nom }}</label>
                                </div>
                            </td>
                            <td><button class="btn btn-sm btn-danger" @click="supprimerCarburantType(index)">Suppr.</button></td>
                        </tr>
                    </tbody>
                </table>
                <button class="btn btn-success" @click="ajouterCarburantType">Ajouter un carburant</button>
                <button class="btn btn-primary ms-2" @click="sauvegarderCarburantTypes">Sauvegarder</button>

                <h4 class="mt-4">Utilisations du carburant</h4>
                <div class="table-responsive">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Département</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(u, index) in carburantUtilisations" :key="index">
                        <td><input type="text" class="form-control" v-model="u.nom"></td>
                        <td>
                          <select class="form-select" v-model="u.departement">
                            <option value="">-- Aucun --</option>
                            <option v-for="dep in departements" :key="dep" :value="dep">{{ dep }}</option>
                          </select>
                        </td>
                        <td><button class="btn btn-outline-danger" @click="supprimerCarburantUtilisation(index)">×</button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <button class="btn btn-success" @click="ajouterCarburantUtilisation">Ajouter</button>
                <button class="btn btn-primary ms-2" @click="sauvegarderCarburantUtilisations">Sauvegarder</button>

                <h4 class="mt-4">Émissions indirectes (Scope 3)</h4>
                <p class="text-muted">Associez des postes de dépenses à des émissions de CO₂ indirectes.</p>
                <div class="table-responsive">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Poste budgétaire</th>
                        <th>Méthode</th>
                        <th>Facteur</th>
                        <th>%</th>
                        <th>Usage</th>
                        <th>Actif</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(regle, index) in reglesIndirectes" :key="index">
                        <td>
                          <select class="form-select" v-model="regle.posteId">
                            <option v-for="p in postesSortie" :key="p.id" :value="p.id">{{ p.nom }}</option>
                          </select>
                        </td>
                        <td>
                          <select class="form-select" v-model="regle.methode">
                            <option value="direct">Direct (kg CO₂/USD)</option>
                            <option value="conversion">Conversion carburant</option>
                          </select>
                        </td>
                        <td>
                          <div v-if="regle.methode === 'direct'">
                            <input type="number" step="0.0001" class="form-control" v-model.number="regle.facteur_direct" placeholder="kg CO₂/USD">
                          </div>
                          <div v-else>
                            <select class="form-select form-select-sm mb-1" v-model="regle.carburant_type_id">
                              <option v-for="ct in carburantTypes" :key="ct.id" :value="ct.id">{{ ct.nom }}</option>
                            </select>
                            <input type="number" step="0.01" class="form-control form-control-sm" v-model.number="regle.volume_par_usd" placeholder="L/USD">
                          </div>
                        </td>
                        <td>
                          <input type="number" class="form-control" v-model.number="regle.pourcentage" min="0" max="100">
                        </td>
                        <td>
                          <select class="form-select" v-model="regle.utilisation_id">
                            <option value="">-- Aucun --</option>
                            <option v-for="u in carburantUtilisations" :key="u.id" :value="u.id">{{ u.nom }}</option>
                          </select>
                        </td>
                        <td>
                          <input type="checkbox" v-model="regle.actif">
                        </td>
                        <td>
                          <button class="btn btn-outline-danger" @click="supprimerRegleIndirecte(index)">×</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <button class="btn btn-success" @click="ajouterRegleIndirecte">Ajouter une règle</button>
                <button class="btn btn-primary ms-2" @click="sauvegarderReglesIndirectes">Sauvegarder</button>
            </div>
            <div v-show="sousOnglet === 'prod-conditionnements'">
            <h4>Conditionnements</h4>
            <div v-for="(cond, cIdx) in conditionnements" :key="cond.id || cIdx" class="card mb-3">
              <div class="card-header d-flex gap-2 align-items-center">
                <input type="text" class="form-control" v-model="cond.nom" placeholder="Nom">
                <input type="text" class="form-control" v-model="cond.code" placeholder="Code">
                <input type="number" step="0.01" class="form-control" v-model.number="cond.capaciteL" placeholder="Litres" style="width:100px;">
                <div class="form-check ms-2">
                  <input class="form-check-input" type="checkbox" v-model="cond.retour_possible">
                  <label class="form-check-label">Retour possible</label>
                </div>
                <button class="btn btn-sm btn-danger" @click="supprimerConditionnement(cIdx)">Suppr.</button>
              </div>
              <div class="card-body">
                <h6>Composants (fournitures nécessaires)</h6>
                <table class="table table-sm">
                  <thead><tr><th>Article</th><th>Quantité</th><th></th></tr></thead>
                  <tbody>
                    <tr v-for="(comp, compIdx) in getComposantsConditionnement(cond.id)" :key="compIdx">
                      <td>
                        <select class="form-select" v-model="comp.article_fourniture_id">
                          <option v-for="art in articlesFourniture" :key="art.id" :value="art.id">{{ art.nom }} ({{ art.unite }})</option>
                        </select>
                      </td>
                      <td>
                        <input type="number" step="1" class="form-control" v-model.number="comp.quantite">
                      </td>
                      <td>
                        <button class="btn btn-outline-danger" @click="supprimerComposantConditionnement(cond.id, compIdx)">×</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <button class="btn btn-sm btn-secondary" @click="ajouterComposantConditionnement(cond.id)">+ Ajouter un composant</button>
              </div>
            </div>
            <button class="btn btn-success mb-3" @click="ajouterConditionnement">Ajouter un conditionnement</button>
            <button class="btn btn-primary" @click="sauvegarderConditionnements">Sauvegarder tout</button>

            <hr>
            <h4>Articles de fourniture</h4>
            <table class="table">
              <thead><tr><th>Nom</th><th>Type</th><th>Unité</th><th>Seuil alerte</th><th>Actif</th><th></th></tr></thead>
              <tbody>
                <tr v-for="(art, aIdx) in articlesFourniture" :key="art.id || aIdx">
                  <td><input type="text" class="form-control" v-model="art.nom"></td>
                  <td>
                    <select class="form-select" v-model="art.type">
                      <option value="contenant_vide">Bidon vide</option>
                      <option value="etiquette">Étiquette</option>
                      <option value="bouchon">Bouchon</option>
                      <option value="autre">Autre</option>
                    </select>
                  </td>
                  <td><input type="text" class="form-control" v-model="art.unite"></td>
                  <td><input type="number" class="form-control" v-model.number="art.seuil_alerte"></td>
                  <td><input type="checkbox" v-model="art.actif"></td>
                  <td><button class="btn btn-sm btn-danger" @click="supprimerArticleFourniture(aIdx)">×</button></td>
                </tr>
              </tbody>
            </table>
            <button class="btn btn-success" @click="ajouterArticleFourniture">Ajouter un article</button>
            <button class="btn btn-primary ms-2" @click="sauvegarderArticlesFourniture">Sauvegarder</button>
          </div>
            <!-- Parcelles -->
            <div v-show="sousOnglet === 'prod-parcelles'">
              <h4>Parcelles</h4>
              <div v-for="(p, index) in parcelles" :key="index" class="card mb-2 p-2">
                <div class="row">
                  <div class="col-md-3">
                    <label>Nom</label>
                    <input type="text" class="form-control" v-model="p.nom">
                  </div>
                  <div class="col-md-2">
                    <label>Surface (m²)</label>
                    <input type="number" step="1" class="form-control" v-model.number="p.surface_m2">
                  </div>
                  <div class="col-md-2">
                    <label>GPS (dd.ddddd°)</label>
                    <input type="text" class="form-control" v-model="p.gps" placeholder="ex: -4.32154, 15.32145">
                  </div>
                  <div class="col-md-2">
                    <label>Année plantation</label>
                    <input type="number" class="form-control" v-model.number="p.annee_plantation">
                  </div>
                  <div class="col-md-2">
                    <label>Notes</label>
                    <input type="text" class="form-control" v-model="p.notes">
                  </div>
                  <div class="col-md-1 d-flex align-items-end">
                    <button class="btn btn-danger" @click="supprimerParcelle(index)">×</button>
                  </div>
                </div>
              </div>
              <button class="btn btn-success" @click="ajouterParcelle">Ajouter une parcelle</button>
              <button class="btn btn-primary ms-2" @click="sauvegarderParcelles">Sauvegarder</button>
            </div>
          </div>
        </div>

        <!-- ==================== VENTES ==================== -->
        <div v-else-if="activeGroup === 'ventes'">
          <ul class="nav nav-tabs">
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'ventes-secteurs' }" href="#" @click.prevent="sousOnglet = 'ventes-secteurs'">Secteurs</a></li>
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'ventes-tarifs' }" href="#" @click.prevent="sousOnglet = 'ventes-tarifs'">Tarifs</a></li>
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'ventes-modes-paiement' }" href="#" @click.prevent="sousOnglet = 'ventes-modes-paiement'">Modes de paiement</a></li>
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'ventes-types-clients' }" href="#" @click.prevent="sousOnglet = 'ventes-types-clients'">Types de clients</a></li>
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'ventes-tolerance' }" href="#" @click.prevent="sousOnglet = 'ventes-tolerance'">Tolérance</a></li>
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'ventes-bonus' }" href="#" @click.prevent="sousOnglet = 'ventes-bonus'">Bonus & objectifs vendeur</a></li>
          </ul>
          <div class="tab-content p-3 bg-white border rounded-bottom">
            <!-- Secteurs -->
            <div v-show="sousOnglet === 'ventes-secteurs'">
              <h4>Secteurs de vente</h4>
              <div v-for="(s, index) in secteurs" :key="index" class="input-group mb-2"><input type="text" class="form-control" v-model="secteurs[index]"><button class="btn btn-outline-danger" @click="supprimerSecteur(index)">×</button></div>
              <button class="btn btn-success" @click="ajouterSecteur">Ajouter</button>
              <button class="btn btn-primary ms-2" @click="sauvegarderSecteurs">Sauvegarder</button>
            </div>
            <!-- Tarifs -->
            <div v-show="sousOnglet === 'ventes-tarifs'">
            <h4>Tarifs par conditionnement</h4>
            <table class="table">
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Devise</th>
                        <th v-for="cond in conditionnements" :key="cond.id">{{ cond.nom }} ({{ cond.capaciteL }}L)</th>
                        <th>Note</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(tarif, index) in tarifs" :key="tarif.id || index">
                        <td><input type="text" class="form-control" v-model="tarif.code" readonly></td>
                        <td>
                            <select class="form-select" v-model="tarif.devise">
                                <option value="USD">USD</option>
                                <option value="CDF">CDF</option>
                            </select>
                        </td>
                        <td v-for="cond in conditionnements" :key="cond.id">
                            <input type="number" step="0.01" class="form-control" v-model.number="tarif.prixParConditionnement[cond.id]">
                        </td>
                        <td><input type="text" class="form-control" v-model="tarif.note"></td>
                        <td><button class="btn btn-sm btn-danger" @click="supprimerTarif(index)">Suppr.</button></td>
                    </tr>
                </tbody>
            </table>
            <button class="btn btn-success" @click="ajouterTarif">Ajouter</button>
            <button class="btn btn-primary ms-2" @click="sauvegarderTarifs">Sauvegarder</button>
        </div>
            <!-- Modes de paiement -->
            <div v-show="sousOnglet === 'ventes-modes-paiement'">
              <h4>Modes de paiement</h4>
              <button class="btn btn-success mb-3" @click="ajouterModePaiement">Ajouter</button>
              <div v-for="(m, index) in modesPaiement" :key="index" class="input-group mb-2"><input type="text" class="form-control" v-model="modesPaiement[index].nom"><button class="btn btn-outline-danger" @click="supprimerModePaiement(index)">×</button></div>
              <button class="btn btn-primary" @click="sauvegarderModesPaiement">Sauvegarder</button>
            </div>
            <!-- Types de clients -->
            <div v-show="sousOnglet === 'ventes-types-clients'">
              <h4>Types de clients</h4>
              <button class="btn btn-success mb-3" @click="ajouterTypeClient">Ajouter</button>
              <table class="table"><thead><tr><th>Nom</th><th>Description</th><th></th></tr></thead><tbody><tr v-for="(tc, index) in typesClients" :key="tc.id || index"><td><input type="text" class="form-control" v-model="tc.nom"></td><td><input type="text" class="form-control" v-model="tc.description"></td><td><button class="btn btn-sm btn-danger" @click="supprimerTypeClient(index)">Suppr.</button></td></tr></tbody></table>
              <button class="btn btn-primary" @click="sauvegarderTypesClients">Sauvegarder</button>
            </div>
            <!-- Tolérance -->
            <div v-show="sousOnglet === 'ventes-tolerance'">
              <h4>Tolérance de paiement</h4>
              <div class="row mb-3">
                <div class="col-md-4">
                  <label>Mode</label>
                  <select class="form-select" v-model="toleranceForm.mode">
                    <option value="pourcentage">Pourcentage (%)</option>
                    <option value="fixe">Montant fixe</option>
                  </select>
                </div>
                <div class="col-md-4" v-if="toleranceForm.mode === 'pourcentage'">
                  <label>Pourcentage</label>
                  <div class="input-group">
                    <input type="number" step="0.01" class="form-control" v-model.number="toleranceForm.valeur_pourcentage">
                    <span class="input-group-text">%</span>
                  </div>
                </div>
                <div class="col-md-4" v-if="toleranceForm.mode === 'fixe'">
                  <label>Montant USD</label>
                  <input type="number" step="0.01" class="form-control" v-model.number="toleranceForm.valeur_usd">
                </div>
                <div class="col-md-4" v-if="toleranceForm.mode === 'fixe'">
                  <label>Montant CDF</label>
                  <input type="number" class="form-control" v-model.number="toleranceForm.valeur_cdf">
                </div>
              </div>
              <button class="btn btn-primary" @click="sauvegarderTolerance">Sauvegarder</button>
            </div>

            <!-- Bonus vendeurs -->
            <div v-show="sousOnglet === 'ventes-bonus'" class="mt-3">
              <h4>Bonus et objectifs mensuels par vendeur</h4>
              <div class="row mb-3">
                <div class="col-md-3">
                  <label>Année</label>
                  <select class="form-select" v-model="bonusAnnee" @change="chargerBonusMensuel">
                    <option v-for="a in anneesDisponibles" :key="a" :value="a">{{ a }}</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <label>Mois</label>
                  <select class="form-select" v-model="bonusMois" @change="chargerBonusMensuel">
                    <option v-for="(nom, idx) in moisNoms" :key="idx" :value="idx+1">{{ nom }}</option>
                  </select>
                </div>
              </div>
              <div class="table-responsive">
                <table class="table table-bordered">
                  <thead>
                    <tr>
                      <th>Vendeur</th>
                      <th>Volume obj. (L)</th>
                      <th>Prix moyen obj. (CDF/L)</th>
                      <th>Vol. min bonus (L)</th>
                      <th>Prix min bonus (CDF/L)</th>
                      <th>Bonus/L (CDF/L)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="v in vendeurs" :key="v.id">
                      <td>{{ v.nom }}</td>
                      <td><input type="number" class="form-control" v-model.number="bonusData[v.id].volumeObjectif"></td>
                      <td><input type="number" step="0.01" class="form-control" v-model.number="bonusData[v.id].prixObjectif"></td>
                      <td><input type="number" class="form-control" v-model.number="bonusData[v.id].volumeMin"></td>
                      <td><input type="number" step="0.01" class="form-control" v-model.number="bonusData[v.id].prixMin"></td>
                      <td><input type="number" step="0.01" class="form-control" v-model.number="bonusData[v.id].bonusParLitre"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button class="btn btn-primary" @click="sauvegarderBonusMensuel">Sauvegarder</button>
            </div>
          </div>
        </div>

        <!-- ==================== CAISSE & BANQUE ==================== -->
        <div v-else-if="activeGroup === 'caisse_banque'">
          <ul class="nav nav-tabs">
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'caisse-caisses' }" href="#" @click.prevent="sousOnglet = 'caisse-caisses'">Caisses</a></li>
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'caisse-banques' }" href="#" @click.prevent="sousOnglet = 'caisse-banques'">Banques & Règles</a></li>
          </ul>
          <div class="tab-content p-3 bg-white border rounded-bottom">
            <!-- Caisses -->
            <div v-show="sousOnglet === 'caisse-caisses'">
              <h4>Gestion des caisses</h4>
              <button class="btn btn-success mb-3" @click="ouvrirModalCaisse(null)">➕ Nouvelle caisse</button>

              <div class="table-responsive">
                <table class="table table-bordered">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Sous-caisses</th>
                      <th>Utilisateurs</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="caisse in caisses" :key="caisse.id">
                      <td>{{ caisse.nom }}</td>
                      <td>
                        <span v-for="(sc, idx) in getSousCaissesForCaisse(caisse.id)" :key="sc.id">
                          {{ sc.nom }} ({{ sc.devise }})<span v-if="idx < getSousCaissesForCaisse(caisse.id).length - 1">, </span>
                        </span>
                        <span v-if="getSousCaissesForCaisse(caisse.id).length === 0">—</span>
                      </td>
                      <td>
                        <span v-for="(user, idx) in getUtilisateursForCaisse(caisse.id)" :key="user.id">
                          {{ user.nom }} ({{ user.role }})<span v-if="idx < getUtilisateursForCaisse(caisse.id).length - 1">, </span>
                        </span>
                        <span v-if="getUtilisateursForCaisse(caisse.id).length === 0">—</span>
                      </td>
                      <td>
                        <button class="btn btn-sm btn-warning me-1" @click="ouvrirModalCaisse(caisse)">✏️ Modifier</button>
                        <button class="btn btn-sm btn-danger" @click="supprimerCaisse(caisse.id)">🗑️ Supprimer</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <!-- Banques & Règles -->
            <div v-show="sousOnglet === 'caisse-banques'">
              <h4>Comptes bancaires</h4>
              <button class="btn btn-success mb-3" @click="ajouterCompte">➕ Nouveau compte</button>
              <div class="table-responsive">
                <table class="table table-bordered">
                  <thead>
                    <tr><th>Nom</th><th>Titulaire</th><th>Numéro</th><th>Devise</th><th>Solde initial</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="c in comptesBancaires" :key="c.id">
                      <td><input type="text" class="form-control" v-model="c.nom"></td>
                      <td><input type="text" class="form-control" v-model="c.titulaire"></td>
                      <td><input type="text" class="form-control" v-model="c.numero"></td>
                      <td>
                        <select class="form-select" v-model="c.devise">
                          <option value="USD">USD</option>
                          <option value="CDF">CDF</option>
                        </select>
                      </td>
                      <td><input type="number" step="0.01" class="form-control" v-model.number="c.solde_initial"></td>
                      <td><button class="btn btn-sm btn-danger" @click="supprimerCompteBancaire(c.id)">Suppr</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button class="btn btn-primary" @click="sauvegarderComptes">Sauvegarder les comptes</button>

              <h4 class="mt-4">Règles d'affectation automatique</h4>
              <p class="text-muted">Associez un mot-clé (présent dans le libellé) à un poste budgétaire pour affecter automatiquement les mouvements importés.</p>
              <button class="btn btn-success mb-3" @click="ajouterRegle">➕ Nouvelle règle</button>
              <div class="table-responsive">
                <table class="table table-bordered">
                  <thead>
                    <tr><th>Compte</th><th>Mot-clé</th><th>Poste</th><th>Actif</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in reglesAffectation" :key="r.id">
                      <td>
                        <select class="form-select" v-model="r.compte_id">
                          <option v-for="c in comptesBancaires" :key="c.id" :value="c.id">{{ c.nom }}</option>
                        </select>
                      </td>
                      <td><input type="text" class="form-control" v-model="r.mot_cle"></td>
                      <td>
                        <select class="form-select" v-model="r.poste_id">
                          <option v-for="p in postesBudgetaires" :key="p.id" :value="p.id">{{ p.nom }}</option>
                        </select>
                      </td>
                      <td><input type="checkbox" v-model="r.actif"></td>
                      <td><button class="btn btn-sm btn-danger" @click="supprimerRegle(r.id)">Suppr</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button class="btn btn-primary" @click="sauvegarderRegles">Sauvegarder les règles</button>
            </div>
          </div>
        </div>

        

        <!-- ==================== FINANCE ==================== -->
        <div v-else-if="activeGroup === 'finance'">
          <ul class="nav nav-tabs">
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'finance-postes' }" href="#" @click.prevent="sousOnglet = 'finance-postes'">Postes budgétaires</a></li>
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'finance-taux' }" href="#" @click.prevent="sousOnglet = 'finance-taux'">Taux de change</a></li>
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'finance-projets' }" href="#" @click.prevent="sousOnglet = 'finance-projets'">Projets</a></li>
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'finance-journaux' }" href="#" @click.prevent="sousOnglet = 'finance-journaux'">Journaux</a></li>
            <li class="nav-item"><a class="nav-link" :class="{ active: sousOnglet === 'finance-charges' }" href="#" @click.prevent="sousOnglet = 'finance-charges'">Impôts et charges</a></li>
          </ul>
          <div class="tab-content p-3 bg-white border rounded-bottom">
            <!-- Postes budgétaires -->
            <div v-show="sousOnglet === 'finance-postes'">
              <h4>Postes budgétaires</h4>
              <div class="alert alert-info">
                <i class="bi bi-info-circle"></i> Les postes de salaire (ex: "Salaire - Production") sont automatiquement créés et synchronisés avec les départements. Ils apparaissent ici en lecture seule.
              </div>
              <div class="d-flex justify-content-between align-items-center mb-3">
                <button class="btn btn-success" @click="ajouterPosteBudget">
                  <i class="bi bi-plus-circle me-1"></i>Ajouter un poste
                </button>
                <div>
                  <button class="btn btn-secondary me-2" @click="annulerModificationsPostes">Annuler</button>
                  <button class="btn btn-primary" @click="sauvegarderPostesBudget">Sauvegarder</button>
                </div>
              </div>

              <!-- ===== TABLEAU DES DÉPENSES ===== -->
              <h5 class="text-danger"><i class="bi bi-arrow-down-circle"></i> Dépenses</h5>
              <div class="table-responsive mb-4">
                <table class="table table-bordered">
                  <thead>
                    <tr>
                      <th @click="triPostes('nom')" style="cursor:pointer;">Nom <i v-if="triDepensesCol==='nom'" :class="triDepensesOrdre==='asc'?'bi-arrow-up':'bi-arrow-down'"></i></th>
                      <th @click="triPostes('typeComptable')" style="cursor:pointer;">Type comptable <i v-if="triDepensesCol==='typeComptable'" :class="triDepensesOrdre==='asc'?'bi-arrow-up':'bi-arrow-down'"></i></th>
                      <th @click="triPostes('numero_compte')" style="cursor:pointer;">Compte <i v-if="triDepensesCol==='numero_compte'" :class="triDepensesOrdre==='asc'?'bi-arrow-up':'bi-arrow-down'"></i></th>
                      <th>Affect. stock</th>
                      <th @click="triPostes('actif')" style="cursor:pointer;">Actif <i v-if="triDepensesCol==='actif'" :class="triDepensesOrdre==='asc'?'bi-arrow-up':'bi-arrow-down'"></i></th>
                      <th>Affectations</th>
                      <th style="width: 80px;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="p in postesDepenses" :key="p.id">
                      <td>
                        <input type="text" class="form-control" v-model="p.nom" :readonly="p.systeme === true">
                      </td>
                      <td>
                        <select class="form-select" v-model="p.typeComptable">
                          <option value="charge">Charge</option>
                          <option value="actif">Actif</option>
                        </select>
                      </td>
                      <td>
                        <input type="text" class="form-control" v-model="p.numero_compte" placeholder="ex: 601000">
                      </td>
                      <td>
                          <select class="form-select" v-model="p.affectation_stock">
                              <option value="">Aucune</option>
                              <option value="carburant">Carburant</option>
                              <option value="emballage">Emballage</option>
                          </select>
                      </td>
                      <td>
                        <input type="checkbox" v-model="p.actif">
                      </td>
                      <td>
                        <button class="btn btn-sm btn-outline-secondary" @click="ouvrirModalAffectations(p)">
                          <i class="bi bi-diagram-3"></i> Gérer
                        </button>
                      </td>
                      <td>
                        <button class="btn btn-sm btn-danger" @click="confirmerSuppressionPoste(p)" :disabled="p.systeme === true">
                          <i class="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- ===== TABLEAU DES REVENUS ===== -->
              <h5 class="text-success"><i class="bi bi-arrow-up-circle"></i> Revenus</h5>
              <div class="table-responsive">
                <table class="table table-bordered">
                  <thead>
                    <tr>
                      <th @click="triPostes('nom')" style="cursor:pointer;">Nom <i v-if="triRevenusCol==='nom'" :class="triRevenusOrdre==='asc'?'bi-arrow-up':'bi-arrow-down'"></i></th>
                      <th @click="triPostes('typeComptable')" style="cursor:pointer;">Type comptable <i v-if="triRevenusCol==='typeComptable'" :class="triRevenusOrdre==='asc'?'bi-arrow-up':'bi-arrow-down'"></i></th>
                      <th @click="triPostes('typeFacturation')" style="cursor:pointer;">Facturation <i v-if="triRevenusCol==='typeFacturation'" :class="triRevenusOrdre==='asc'?'bi-arrow-up':'bi-arrow-down'"></i></th>
                      <th @click="triPostes('numero_compte')" style="cursor:pointer;">Compte <i v-if="triRevenusCol==='numero_compte'" :class="triRevenusOrdre==='asc'?'bi-arrow-up':'bi-arrow-down'"></i></th>
                      <th @click="triPostes('actif')" style="cursor:pointer;">Actif <i v-if="triRevenusCol==='actif'" :class="triRevenusOrdre==='asc'?'bi-arrow-up':'bi-arrow-down'"></i></th>
                      <th>Affectations</th>
                      <th style="width: 80px;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="p in postesRevenus" :key="p.id">
                      <td>
                        <input type="text" class="form-control" v-model="p.nom">
                      </td>
                      <td>
                        <select class="form-select" v-model="p.typeComptable">
                          <option value="produit">Produit</option>
                          <option value="passif">Passif</option>
                        </select>
                      </td>
                      <td>
                        <select class="form-select" v-model="p.typeFacturation">
                          <option value="">Aucun</option>
                          <option value="huile">Facturation huile</option>
                          <option value="autre">Facturation autre</option>
                        </select>
                      </td>
                      <td>
                        <input type="text" class="form-control" v-model="p.numero_compte" placeholder="ex: 701000">
                      </td>
                      <td>
                        <input type="checkbox" v-model="p.actif">
                      </td>
                      <td>
                        <button class="btn btn-sm btn-outline-secondary" @click="ouvrirModalAffectations(p)">
                          <i class="bi bi-diagram-3"></i> Gérer
                        </button>
                      </td>
                      <td>
                        <button class="btn btn-sm btn-danger" @click="confirmerSuppressionPoste(p)">
                          <i class="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="mt-3">
                <button class="btn btn-primary" @click="sauvegarderPostesBudget">Sauvegarder</button>
                <button class="btn btn-secondary ms-2" @click="annulerModificationsPostes">Annuler</button>
              </div>

              <!-- Modale de suppression avec transfert -->
              <div v-if="showModalSuppressionPoste" class="modal" style="display:block; background:rgba(0,0,0,0.5);">
                <div class="modal-dialog">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5>Supprimer le poste « {{ posteASupprimer?.nom }} »</h5>
                      <button type="button" class="btn-close" @click="showModalSuppressionPoste = false"></button>
                    </div>
                    <div class="modal-body">
                      <p>Ce poste est utilisé dans des écritures. Veuillez choisir un poste de remplacement :</p>
                      <select class="form-select" v-model="posteRemplacementId" required>
                        <option value="">-- Choisir --</option>
                        <option v-for="p in postesRemplacement(posteASupprimer)" :key="p.id" :value="p.id">
                          {{ p.nom }}
                        </option>
                      </select>
                      <p class="text-muted mt-2">Les écritures associées seront transférées vers ce nouveau poste.</p>
                    </div>
                    <div class="modal-footer">
                      <button class="btn btn-secondary" @click="showModalSuppressionPoste = false">Annuler</button>
                      <button class="btn btn-danger" @click="supprimerPosteAvecTransfert">Transférer et supprimer</button>
                    </div>
                  </div>
                </div>
              </div>
            <!-- Modale Affectations -->
            <div v-if="showModalAffectations" class="modal" style="display:block; background:rgba(0,0,0,0.5);">
              <div class="modal-dialog modal-lg">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5>Affectations du poste : {{ posteAffectation?.nom }}</h5>
                    <button type="button" class="btn-close" @click="showModalAffectations = false"></button>
                  </div>
                  <div class="modal-body">
                    <!-- Projets -->
                    <h6>Répartition par projet</h6>
                    <div v-for="(aff, idx) in affectationsProjetTemp" :key="idx" class="row mb-2">
                      <div class="col-md-5">
                        <select class="form-select" v-model="aff.projetId">
                          <option v-for="p in projetsActifs" :key="p.id" :value="p.id">{{ p.nom }}</option>
                        </select>
                      </div>
                      <div class="col-md-3">
                        <input type="number" min="0" max="100" class="form-control" v-model.number="aff.pourcentage" @change="verifierSommeProjets">
                      </div>
                      <div class="col-md-2">
                        <button class="btn btn-sm btn-outline-secondary" @click="toggleDetailsProjet(idx)">
                          <i class="bi" :class="aff.showDetails ? 'bi-chevron-up' : 'bi-chevron-down'"></i> Détails
                        </button>
                      </div>
                      <div class="col-md-2">
                        <button class="btn btn-sm btn-outline-danger" @click="supprimerAffectationProjet(idx)">×</button>
                      </div>
                      <!-- Détail par département -->
                      <div v-if="aff.showDetails" class="col-12 mt-2 ms-4">
                        <h6>Départements pour ce projet</h6>
                        <div v-for="(dep, dIdx) in aff.departements" :key="dIdx" class="row mb-1">
                          <div class="col-md-5">
                            <select class="form-select form-select-sm" v-model="dep.departement">
                              <option v-for="d in departements" :key="d" :value="d">{{ d }}</option>
                            </select>
                          </div>
                          <div class="col-md-3">
                            <input type="number" min="0" max="100" class="form-control form-control-sm" v-model.number="dep.pourcentage" @change="verifierSommeDepartements(idx)">
                          </div>
                          <div class="col-md-2">
                            <button class="btn btn-sm btn-outline-danger" @click="supprimerDepartementProjet(idx, dIdx)">×</button>
                          </div>
                        </div>
                        <button class="btn btn-sm btn-outline-primary" @click="ajouterDepartementProjet(idx)">+ Département</button>
                        <p class="text-muted">Somme : {{ sommeDepartements(idx) }}% (doit être 100%)</p>
                      </div>
                    </div>
                    <button class="btn btn-sm btn-outline-primary mb-3" @click="ajouterAffectationProjet">+ Projet</button>
                    <p class="text-muted">Somme projets : {{ sommeProjets }}% (doit être 100%)</p>
                  </div>
                  <div class="modal-footer">
                    <button class="btn btn-secondary" @click="showModalAffectations = false">Annuler</button>
                    <button class="btn btn-primary" @click="enregistrerAffectations">Enregistrer</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

            <!-- Taux de change -->
            <div v-show="sousOnglet === 'finance-taux'">
              <h4>Taux de change USD → CDF</h4>
              <ul class="nav nav-tabs">
                <li class="nav-item"><a class="nav-link" :class="{ active: sousOngletTaux === 'mois' }" href="#" @click.prevent="sousOngletTaux = 'mois'">📅 Taux du mois</a></li>
                <li class="nav-item"><a class="nav-link" :class="{ active: sousOngletTaux === 'manquants' }" href="#" @click.prevent="sousOngletTaux = 'manquants'">⚠️ Dates sans taux ({{ datesSansTaux.length }})</a></li>
              </ul>
              <!-- Taux du mois -->
              <div v-show="sousOngletTaux === 'mois'" class="mt-3">
                <div class="row mb-3">
                  <div class="col-md-3"><label>Année</label><select class="form-select" v-model="anneeTaux" @change="chargerTaux"><option v-for="a in annees" :key="a" :value="a">{{ a }}</option></select></div>
                  <div class="col-md-3"><label>Mois</label><select class="form-select" v-model="moisTaux" @change="chargerTaux"><option v-for="(nom, idx) in moisNoms" :key="idx" :value="idx+1">{{ nom }}</option></select></div>
                  <div class="col-md-3"><button class="btn btn-success mt-4" @click="sauvegarderTaux">💾 Sauvegarder les taux du mois</button></div>
                </div>
                <div class="row mb-3">
                  <div class="col-md-6">
                    <label>Appliquer un taux sur une période</label>
                    <div class="input-group">
                      <input type="number" class="form-control" v-model.number="periodeDebut" placeholder="Début" min="1" :max="nbJoursMois">
                      <span class="input-group-text">à</span>
                      <input type="number" class="form-control" v-model.number="periodeFin" placeholder="Fin" min="1" :max="nbJoursMois">
                      <input type="number" step="0.01" class="form-control" v-model.number="tauxPeriode" placeholder="Taux">
                      <button class="btn btn-secondary" @click="appliquerTauxPeriode">Appliquer</button>
                    </div>
                  </div>
                </div>
                <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
                  <table class="table table-bordered table-sm">
                    <thead><tr><th>Jour</th><th>Taux (1 USD = ? CDF)</th></tr></thead>
                    <tbody>
                      <tr v-for="jour in joursMois" :key="jour">
                        <td class="text-center">{{ jour }}</td>
                        <td><input type="number" step="0.01" class="form-control form-control-sm" v-model.number="tauxParJour[`${anneeTaux}-${String(moisTaux).padStart(2,'0')}-${String(jour).padStart(2,'0')}`]" placeholder="ex: 2500"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <!-- Dates sans taux -->
              <div v-show="sousOngletTaux === 'manquants'" class="mt-3">
                <div class="d-flex justify-content-between mb-3">
                  <h5>Dates de l'année {{ anneeTaux }} sans taux de change</h5>
                  <button class="btn btn-warning" @click="remplirDatesSansTaux">📅 Remplir avec le dernier taux connu</button>
                </div>
                <div v-if="datesSansTaux.length === 0" class="alert alert-success">✅ Toutes les dates de l’année {{ anneeTaux }} jusqu’au {{ dateAujourdhui }} ont un taux de change.</div>
                <div v-else>
                  <div class="table-responsive">
                    <table class="table table-sm">
                      <thead><tr><th>Date</th></tr></thead>
                      <tbody><tr v-for="date in datesSansTaux" :key="date"><td>{{ formatDateJJMMAA(date) }}</td></tr></tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <!-- Projets -->
            <div v-show="sousOnglet === 'finance-projets'">
              <h4>Gestion des projets</h4>
              <button class="btn btn-success mb-3" @click="ajouterProjet">Nouveau projet</button>
              <table class="table">
                <thead><tr><th>Nom</th><th>Actif</th><th></th></tr></thead>
                <tbody>
                  <tr v-for="p in projets" :key="p.id">
                    <td><input v-model="p.nom" class="form-control"></td>
                    <td><input type="checkbox" v-model="p.actif"></td>
                    <td><button class="btn btn-sm btn-danger" @click="supprimerProjet(p.id)">Suppr</button></td>
                  </tr>
                </tbody>
              </table>
              <button class="btn btn-primary" @click="sauvegarderProjets">Sauvegarder</button>
            </div>

            <!-- Journaux -->
            <div v-show="sousOnglet === 'finance-journaux'">
              <h4>Journaux comptables</h4>
              <button class="btn btn-success mb-3" @click="ajouterJournal">Nouveau journal</button>
              <table class="table table-sm">
                <thead><tr><th>Code</th><th>Libellé</th><th>Type</th><th></th></tr></thead>
                <tbody>
                  <tr v-for="j in journaux" :key="j.id">
                    <td><input v-model="j.code" class="form-control form-control-sm"></td>
                    <td><input v-model="j.libelle" class="form-control form-control-sm"></td>
                    <td>
                      <select v-model="j.type" class="form-select form-select-sm">
                        <option value="banque">Banque</option>
                        <option value="caisse">Caisse</option>
                      </select>
                    </td>
                    <td><button class="btn btn-sm btn-danger" @click="supprimerJournal(j.id)">×</button></td>
                  </tr>
                </tbody>
              </table>
              <button class="btn btn-primary" @click="sauvegarderJournaux">Sauvegarder</button>
            </div>

                              <!-- Charges à répartir -->
            <div v-show="sousOnglet === 'finance-abonnements'">
              <h4>Charges à répartir (abonnements)</h4>
              <button class="btn btn-success mb-3" @click="ajouterChargeAbonnement">Nouvelle charge</button>
              <table class="table">
                <thead><tr><th>Description</th><th>Montant total</th><th>Début</th><th>Fin</th><th>Projet</th><th></th></tr></thead>
                <tbody>
                  <tr v-for="c in chargesAbonnement" :key="c.id">
                    <td><input v-model="c.description" class="form-control"></td>
                    <td><input type="number" step="0.01" v-model="c.montant_total" class="form-control"></td>
                    <td><input type="date" v-model="c.date_debut" class="form-control"></td>
                    <td><input type="date" v-model="c.date_fin" class="form-control"></td>
                    <td>
                      <select v-model="c.projetId" class="form-select">
                        <option v-for="p in projetsActifs" :key="p.id" :value="p.id">{{ p.nom }}</option>
                      </select>
                    </td>
                    <td><button class="btn btn-sm btn-danger" @click="supprimerChargeAbonnement(c.id)">×</button></td>
                  </tr>
                </tbody>
              </table>
              <button class="btn btn-primary" @click="sauvegarderChargesAbonnement">Sauvegarder</button>
            </div>
            <!-- Impôts et charges sociales -->
            <div v-show="sousOnglet === 'finance-charges'">
              <h4>Paramètres des impôts et charges sociales</h4>
              <ul class="nav nav-tabs">
                  <li class="nav-item"><a class="nav-link" :class="{ active: sousOngletCharges === 'taux' }" href="#" @click.prevent="sousOngletCharges = 'taux'">Taux et barème IPR</a></li>
                  <li class="nav-item"><a class="nav-link" :class="{ active: sousOngletCharges === 'indemnites' }" href="#" @click.prevent="sousOngletCharges = 'indemnites'">Indemnités fixes</a></li>
              </ul>
              
              <div class="tab-content p-3">
                  <!-- Onglet Taux et barème -->
                  <div v-show="sousOngletCharges === 'taux'">
                      <h5>Taux de cotisations</h5>
                      <div class="row mb-3">
                          <div class="col-md-3">
                              <label>CNSS salariale (%)</label>
                              <input type="number" step="0.1" class="form-control" v-model.number="chargesParams.taux.cnss_salarial" @input="convertToDecimal('cnss_salarial')">
                          </div>
                          <div class="col-md-3">
                              <label>CNSS patronale (%)</label>
                              <input type="number" step="0.1" class="form-control" v-model.number="chargesParams.taux.cnss_patronal" @input="convertToDecimal('cnss_patronal')">
                          </div>
                          <div class="col-md-3">
                              <label>INPP (%)</label>
                              <input type="number" step="0.1" class="form-control" v-model.number="chargesParams.taux.inpp" @input="convertToDecimal('inpp')">
                          </div>
                          <div class="col-md-3">
                              <label>ONEM (%)</label>
                              <input type="number" step="0.1" class="form-control" v-model.number="chargesParams.taux.onem" @input="convertToDecimal('onem')">
                          </div>
                      </div>
                      
                      <h5>Barème IPR annuel (mensualisé automatiquement)</h5>
                      <table class="table table-sm">
                          <thead>
                              <tr><th>Plafond annuel (CDF)</th><th>Taux (%)</th><th></th></tr>
                          </thead>
                          <tbody>
                              <tr v-for="(tranche, idx) in chargesParams.bareme_ipr_annuel" :key="idx">
                                  <td>
                                      <input type="number" class="form-control" v-model.number="tranche.plafond" :placeholder="idx === chargesParams.bareme_ipr_annuel.length-1 ? 'Infini' : ''" :disabled="idx === chargesParams.bareme_ipr_annuel.length-1">
                                  </td>
                                  <td>
                                      <input type="number" step="0.1" class="form-control" v-model.number="tranche.taux" @input="tranche.taux = tranche.taux / 100">
                                  </td>
                                  <td>
                                      <button class="btn btn-sm btn-danger" @click="supprimerTrancheIPR(idx)" :disabled="chargesParams.bareme_ipr_annuel.length <= 1">×</button>
                                  </td>
                              </tr>
                          </tbody>
                      </table>
                      <button class="btn btn-sm btn-success" @click="ajouterTrancheIPR">Ajouter une tranche</button>
                      
                      <div class="mt-3">
                          <button class="btn btn-primary" @click="sauvegarderParamsCharges">Sauvegarder</button>
                      </div>
                  </div>
                  
                  <!-- Onglet Indemnités fixes -->
                  <div v-show="sousOngletCharges === 'indemnites'">
                      <div class="row">
                          <div class="col-md-4">
                              <label>Indemnité transport (CDF)</label>
                              <input type="number" class="form-control" v-model.number="chargesParams.indemnites_fixes.transport">
                          </div>
                          <div class="col-md-4">
                              <label>Indemnité logement (CDF)</label>
                              <input type="number" class="form-control" v-model.number="chargesParams.indemnites_fixes.logement">
                          </div>
                      </div>
                      <button class="btn btn-primary mt-3" @click="sauvegarderParamsCharges">Sauvegarder</button>
                  </div>
              </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- Modal Caisse (global) -->
  <teleport to="body">
    <div v-if="caisseModal" class="modal fade show" tabindex="-1" style="display: block; background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ caisseModal.id ? 'Modifier' : 'Nouvelle' }} caisse</h5>
            <button type="button" class="btn-close" @click="caisseModal = null"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="enregistrerCaisse">
              <div class="mb-3">
                <label>Nom de la caisse</label>
                <input type="text" class="form-control" v-model="caisseModal.nom" required>
              </div>
              <div class="mb-3">
                <label>Superviseur de la caisse</label>
                <select class="form-select" v-model="caisseModal.responsableId" required>
                  <option value="">-- Sélectionner un utilisateur --</option>
                  <option v-for="user in utilisateurs" :key="user.id" :value="user.id">{{ user.nom }} ({{ user.login }})</option>
                </select>
                <small class="text-muted">Cet utilisateur pourra clôturer et modifier les semaines clôturées de cette caisse.</small>
              </div>
              <div class="d-flex justify-content-end">
                <button type="button" class="btn btn-secondary me-2" @click="caisseModal = null">Annuler</button>
                <button type="submit" class="btn btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </teleport>
         <!-- MODAL CAISSE -->
        <teleport to="body">
          <div v-if="modalCaisseVisible" class="modal fade show" tabindex="-1" style="display: block; background-color: rgba(0,0,0,0.5); z-index: 1055;">
            <div class="modal-dialog modal-lg">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">{{ caisseEnEdition ? 'Modifier la caisse' : 'Nouvelle caisse' }}</h5>
                  <button type="button" class="btn-close" @click="modalCaisseVisible = false"></button>
                </div>
                <div class="modal-body">
                  <div class="mb-3">
                    <label class="form-label">Nom de la caisse *</label>
                    <input type="text" class="form-control" v-model="caisseForm.nom" required>
                  </div>

                  <h6>Sous-caisses</h6>
                  <div class="table-responsive mb-3">
                    <table class="table table-sm">
                      <thead>
                        <tr>
                          <th>Nom</th>
                          <th>Devise</th>
                          <th>Solde initial</th>
                          <th>Type de paiement</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(sc, idx) in caisseForm.sousCaisses" :key="idx">
                          <td><input type="text" class="form-control form-control-sm" v-model="sc.nom" placeholder="Nom"></td>
                          <td>
                            <select class="form-select form-select-sm" v-model="sc.devise">
                              <option value="USD">USD</option>
                              <option value="CDF">CDF</option>
                            </select>
                          </td>
                          <td><input type="number" step="0.01" class="form-control form-control-sm" v-model.number="sc.solde_initial"></td>
                          <td>
                            <select class="form-select form-select-sm" v-model="sc.typePaiement">
                              <option v-for="m in modesPaiement" :key="m.id" :value="m.id">{{ m.nom }}</option>
                            </select>
                          </td>
                          <td><button class="btn btn-sm btn-outline-danger" @click="supprimerSousCaisseForm(idx)">🗑️</button></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <button class="btn btn-sm btn-outline-secondary mb-3" @click="ajouterSousCaisseForm">➕ Ajouter une sous-caisse</button>

                  <h6>Utilisateurs autorisés</h6>
                  <div class="mb-3" style="max-height: 200px; overflow-y: auto;">
                    <div v-for="user in utilisateursEligiblesPourCaisse" :key="user.id" class="form-check">
                      <input class="form-check-input" type="checkbox" :value="user.id" v-model="caisseForm.utilisateurs" :id="'user_'+user.id">
                      <label class="form-check-label" :for="'user_'+user.id">
                        {{ user.nom }} ({{ user.role }})
                      </label>
                    </div>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" @click="modalCaisseVisible = false">Annuler</button>
                  <button type="button" class="btn btn-primary" @click="enregistrerCaisse">Enregistrer</button>
                </div>
              </div>
            </div>
          </div>
        </teleport>
</template>

<script>
import { db } from '../db';
import apiService from '../services/api';
import Papa from 'papaparse';
import { getRolePermissions } from '../utils/permissions';
import { recalculerEcrituresDate } from '../utils/taux';
import { convertirMontants } from '../utils/taux';

export default {
  name: 'Settings',
  data() {
    return {
      activeGroup: 'admin',
      groupesVisibles: [],
      groupLabels: {
        admin: 'Administration',
        production: 'Production',
        ventes: 'Ventes',
        caisse_banque: 'Caisse & Banque',
        finance: 'Finance'
      },
      groupesDisponibles: [
        { id: 'admin', label: 'Administration' },
        { id: 'production', label: 'Production' },
        { id: 'ventes', label: 'Ventes' },
        { id: 'caisse_banque', label: 'Caisse & Banque' },
        { id: 'finance', label: 'Finance' }
      ],
      toleranceForm: { mode: 'pourcentage', valeur_pourcentage: 0.5, valeur_usd: 1, valeur_cdf: 500 },
      bonusRegles: {},
      vendeurs: [],
      sousOnglet: 'admin-utilisateurs',
      sousOngletTaux: 'mois',
      modules: ['recolte', 'production', 'stocks', 'clients','ventes', 'caisses', 'budgets', 'reglages', 'factures', 'travailleurs', 'banque', 'comptabilite'],
      rolesArray: [],
      permissionsGroupes: {},
      sites: [],
      parcelles: [],
      secteurs: [],
      tarifs: [],
      typesClients: [],
      paramsConges: { joursVacancesAnnuels: 26, joursOuvrablesMois: 26, plafondAvanceMois: 80 },
      prochainCodeTarif: 'A',
      utilisateurs: [],
      caisses: [],
      sousCaisses: [],
      modesPaiement: [],
      caisseUtilisateurs: [],
      modalCaisseVisible: false,
      caisseEnEdition: null,
      caisseForm: {
        id: null,
        nom: '',
        sousCaisses: [],
        utilisateurs: []
      },
      comptesBancaires: [],
      reglesAffectation: [],
      postesBudgetaires: [],
      postesBudgetairesSettings: [],
      carburantTypes: [],
      carburantUtilisations: [],
      coordonnees: { nom: '', adresse: '', telephone: '', email: '', logo: '', legalInfo: '' },
      modeleFacture: '',
      modeleBL: '',
      derniereSync: null,
      syncEnCours: false,
      modalUtilisateur: false,
      utilisateurEnEdition: null,
      utilisateurForm: { nom: '', login: '', mot_de_passe: '', role: '' },
      modalCaissesUtilisateur: false,
      utilisateurCourant: null,
      caissesSelectionnees: [],
      anneeTaux: new Date().getFullYear(),
      annees: [2024, 2025, 2026, 2027],
      moisTaux: new Date().getMonth() + 1,
      moisNoms: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
      tauxParJour: {},
      periodeDebut: null,
      periodeFin: null,
      tauxPeriode: null,
      caisseModal: null,
      dateAujourdhui: new Date().toISOString().slice(0,10),
      configNotif: {},
      departements: [],
      postesTravail: [],
      modalRemplacementDepartement: null,
      departementASupprimer: '',
      departementRemplacement: '',
      objectifAnnee: new Date().getFullYear(),
      chargesAbonnement: [],
      triDepensesCol: 'nom',
      triDepensesOrdre: 'asc',
      triRevenusCol: 'nom',
      triRevenusOrdre: 'asc',
      sousOngletCharges: 'taux',   // pour les sous-onglets du nouvel onglet
      chargesParams: {
          taux: { cnss_salarial: 5, cnss_patronal: 13, inpp: 2, onem: 0.5 },
          indemnites_fixes: { transport: 50000, logement: 50000 },
          bareme_ipr_annuel: [
              { plafond: 1944000, taux: 3 },
              { plafond: 21600000, taux: 15 },
              { plafond: 43200000, taux: 30 },
              { plafond: null, taux: 40 }
          ]
      },
      projetsActifs: [],
      bonusAnnee: new Date().getFullYear(),
      bonusMois: new Date().getMonth() + 1,
      bonusData: {},
      travailleursPourUtilisateur: [],
      journaux: [],
      showModalSuppressionPoste: false,
      posteASupprimer: null,
      posteRemplacementId: '',
      showModalAffectations: false,
      objectifsParDomaine: {
          Regimes: Array(12).fill(0),
          TauxFruits: Array(12).fill(0),
          TauxExtraction: Array(12).fill(0),
          TauxGlobal: Array(12).fill(0),      // domaine calculé
          Huile: Array(12).fill(0),           // domaine calculé
          VolumeVentes: Array(12).fill(0),
          PrixMoyenVente: Array(12).fill(0),
          Ventes: Array(12).fill(0),          // domaine calculé (CA)
          Qualite: Array(12).fill(0),
          Acidite: Array(12).fill(0)
      },
      posteAffectation: null,
      affectationsProjetTemp: [],
      reglesIndirectes: [], // pour le Scope 3
      postesSortie: [],
      anneesDisponibles: [2026, 2027, 2028, 2029, 2030],
      deviseSaisie: 'CDF',
      tauxMensuelsDisponibles: true,
      tauxChangeAnneeData: [],
      auditFiltre: {
        dateDebut: '',
        dateFin: '',
        utilisateurId: '',
        entite: '',
        action: ''
      },
      auditLogs: [],
      objectifsReady: false,
      entitesAuditees: ['caisses', 'sous_caisses', 'caisse_utilisateurs', 'utilisateurs', 'postes_budgetaires', 'budget_versions', 'stocks', 'lots', 'production_lot', 'factures', 'clients', 'taux_change', 'taux_change_mensuel', 'projets', 'affectations_projet', 'plan_comptable', 'journaux', 'reglages'],
      conditionnements: [],
      articlesFourniture: [],
      conditionnementComposants: [],
    };
  },
 computed: {
  utilisateursNonAffectes() {
    const idsAffectes = this.caisseUtilisateurs.map(u => u.utilisateurId);
    return this.utilisateurs.filter(u => !idsAffectes.includes(u.id));
  },
  utilisateursEligiblesPourCaisse() {
    // Récupère les noms des rôles qui ont la permission 'caisses' >= 'ecriture'
    const rolesPermis = this.rolesArray
      .filter(r => r.permissions?.caisses === 'ecriture' || r.permissions?.caisses === 'ecriture_apres_cloture')
      .map(r => r.nom);
    return this.utilisateurs.filter(u => rolesPermis.includes(u.role));
  },
  domainesObjectifsDisponibles() {
      const fixes = [
          { value: 'Regimes', label: 'Régimes (t)', unite: 'tonnes', saisissable: true },
          { value: 'TauxFruits', label: 'Taux de fruits (%)', unite: '%', saisissable: true },
          { value: 'TauxExtraction', label: 'Taux d\'extraction huilerie (%)', unite: '%', saisissable: true },
          { value: 'TauxGlobal', label: 'Taux global (%)', unite: '%', saisissable: false, calcule: true },
          { value: 'Huile', label: 'Production (L)', unite: 'L', saisissable: false, calcule: true },
          { value: 'VolumeVentes', label: 'Volume de ventes (L)', unite: 'L', saisissable: true },
          { value: 'PrixMoyenVente', label: 'Prix moyen vente', unite: 'devise/L', saisissable: true },
          { value: 'Ventes', label: 'Chiffre d\'affaires', unite: 'devise', saisissable: false, calcule: true },        
          { value: 'Acidite', label: 'Acidité', unite: 'note', saisissable: true }
      ];
      const carburants = this.carburantTypes.map(ct => ({
          value: 'Conso' + ct.nom.charAt(0).toUpperCase() + ct.nom.slice(1),
          label: `Conso. ${ct.nom} (L)`,
          unite: 'L',
          saisissable: true
      }));
      return [...fixes, ...carburants];
  },

  
  // Lignes calculées
  lignesCalculees() {
      const map = {};
      // Toujours initialiser les clés indispensables
      map['TauxGlobal'] = Array(12).fill(0);
      map['Huile'] = Array(12).fill(0);
      map['Ventes'] = Array(12).fill(0);

      // Également les domaines de la liste actuelle (sécurité)
      this.domainesObjectifsDisponibles
          .filter(d => d.calcule)
          .forEach(d => {
              if (!map[d.value]) map[d.value] = Array(12).fill(0);
          });

      const regimes = this.objectifsParDomaine['Regimes'] || [];
      const tauxFruits = this.objectifsParDomaine['TauxFruits'] || [];
      const tauxExtraction = this.objectifsParDomaine['TauxExtraction'] || [];
      const volumeVentes = this.objectifsParDomaine['VolumeVentes'] || [];
      const prixMoyenVente = this.objectifsParDomaine['PrixMoyenVente'] || [];

      for (let i = 0; i < 12; i++) {
          const tf = tauxFruits[i] || 0;
          const te = tauxExtraction[i] || 0;
          const tauxGlobal = (tf * te) / 100;
          const ventesCalc = (volumeVentes[i] || 0) * (prixMoyenVente[i] || 0);

          map['TauxGlobal'][i] = tauxGlobal;
          map['Huile'][i] = (regimes[i] || 0) * tauxGlobal / 100;
          map['Ventes'][i] = ventesCalc;
      }
      return map;
  },
  // Totaux par domaine pour la colonne Total
  totauxParDomaine() {
      const tot = {};
      for (const d of this.domainesObjectifsDisponibles) {
          let valeurs = d.calcule ? this.lignesCalculees[d.value] : this.objectifsParDomaine[d.value];
          if (!valeurs) {
              tot[d.value] = 0;
              continue;
          }
          if (d.unite === '%' || d.unite === 'note') {
              const count = valeurs.filter(v => v > 0).length;
              tot[d.value] = count ? valeurs.reduce((a,b)=>a+b,0) / 12 : 0;
          } else {
              tot[d.value] = valeurs.reduce((a,b)=>a+b,0);
          }
      }
      // Recalculs spécifiques
      tot['TauxGlobal'] = ((tot['TauxFruits'] || 0) * (tot['TauxExtraction'] || 0)) / 100;
      tot['Huile'] = (tot['Regimes'] || 0) * tot['TauxGlobal'] / 100;
      tot['PrixMoyenVente'] = (tot['VolumeVentes'] || 0) ? (tot['Ventes'] || 0) / tot['VolumeVentes'] : 0;
      return tot;
  },
  utilisateursEligibles() {
    const idsAffectes = this.caisseUtilisateurs.map(u => u.utilisateurId);
    return this.utilisateurs.filter(u => {
      const role = this.rolesArray.find(r => r.nom === u.role);
      const perm = role?.permissions?.caisses;
      return (perm === 'ecriture' || perm === 'ecriture_apres_cloture') && !idsAffectes.includes(u.id);
    });
  },
  sommeProjets() {
    return this.affectationsProjetTemp.reduce((s, a) => s + a.pourcentage, 0);
  },
  sommeDepartements(idx) {
    if (!this.affectationsProjetTemp || !this.affectationsProjetTemp.length) return 0;
    const i = parseInt(idx);
    if (isNaN(i) || !this.affectationsProjetTemp[i]) return 0;
    const deps = this.affectationsProjetTemp[i].departements || [];
    return deps.reduce((s, d) => s + (Number(d.pourcentage) || 0), 0);
  },
  joursMois() {
    const nb = new Date(this.anneeTaux, this.moisTaux, 0).getDate();
    return Array.from({ length: nb }, (_, i) => i + 1);
  },
  nbJoursMois() {
    return new Date(this.anneeTaux, this.moisTaux, 0).getDate();
  },
  datesSansTaux() {
    const aujourdhui = new Date(this.dateAujourdhui);
    const annee = this.anneeTaux;
    const dates = [];
    const dateCourante = new Date(annee, 0, 1);
    while (dateCourante <= aujourdhui) {
      const dateStr = dateCourante.toISOString().slice(0,10);
      if (!this.tauxParJour[dateStr]) dates.push(dateStr);
      dateCourante.setDate(dateCourante.getDate() + 1);
    }
    return dates;
  },
  domainesObjectifsAvecDonnees() {
      return this.domainesObjectifsDisponibles.filter(d => d.value in this.objectifsParDomaine);
  },
  auditLogsFiltres() {
      return this.auditLogs;
    },
    postesDepenses() {
        let liste = this.postesBudgetairesSettings.filter(p => p.type === 'sortie');
        const col = this.triDepensesCol;
        const ordre = this.triDepensesOrdre;
        return liste.sort((a, b) => {
            let valA = (a[col] || '').toString().toLowerCase();
            let valB = (b[col] || '').toString().toLowerCase();
            if (col === 'actif') { valA = a.actif ? '1' : '0'; valB = b.actif ? '1' : '0'; }
            if (ordre === 'asc') return valA > valB ? 1 : -1;
            return valA < valB ? 1 : -1;
        });
    },
    postesRevenus() {
        let liste = this.postesBudgetairesSettings.filter(p => p.type === 'entree');
        const col = this.triRevenusCol;
        const ordre = this.triRevenusOrdre;
        return liste.sort((a, b) => {
            let valA = (a[col] || '').toString().toLowerCase();
            let valB = (b[col] || '').toString().toLowerCase();
            if (col === 'actif') { valA = a.actif ? '1' : '0'; valB = b.actif ? '1' : '0'; }
            if (ordre === 'asc') return valA > valB ? 1 : -1;
            return valA < valB ? 1 : -1;
        });
    },

},
async mounted() {
  const { group, tab } = this.$route.query;
  if (group) this.activeGroup = group;
  if (tab) this.sousOnglet = tab;
  await this.chargerDonnees();
  this.chargerBonusMensuel();
  await this.chargerTaux();
  this.chargerConfigNotif();
  await this.definirGroupesVisibles();
  if (this.groupesVisibles.length > 0 && !this.groupesVisibles.includes(this.activeGroup)) {
    this.activeGroup = this.groupesVisibles[0];
  }
  await this.chargerParamsCharges();
},
  methods: {
    async chargerDonnees() {
      this.sites = await db.sites.toArray() || [];
      this.tarifs = await db.tarifs.toArray() || [];
      this.utilisateurs = await db.utilisateurs.toArray() || [];
      this.caisses = await db.caisses.toArray() || [];
      this.sousCaisses = await db.sous_caisses.toArray() || [];
      this.modesPaiement = await db.modes_paiement.toArray() || [];
      this.caisseUtilisateurs = await db.caisse_utilisateurs.toArray() || [];
      this.typesClients = await db.types_clients.toArray() || [];
      this.postesBudgetaires = await db.postes_budgetaires.toArray() || [];
      this.postesBudgetairesSettings = this.postesBudgetaires
        .filter(p => !p.systeme || p.nom.startsWith('Salaire - '))
        .map(p => ({
            ...p,
            affectation_stock: p.affectation_stock || null
        }));
      this.postesSortie = this.postesBudgetaires.filter(p => p.type === 'sortie' && p.actif && !p.systeme);
      // Charger les règles indirectes
      const reglesData = await db.regles_emissions_indirectes.toArray();
      this.reglesIndirectes = reglesData.map(r => ({
          id: r.id,
          posteId: r.posteId || '',
          methode: r.methode || 'direct',
          facteur_direct: r.facteur_direct || 0,
          carburant_type_id: r.carburant_type_id || null,
          volume_par_usd: r.volume_par_usd || 0,
          pourcentage: r.pourcentage || 100,
          departement: r.departement || '',
          utilisation_id: r.utilisation_id || '',
          actif: r.actif !== undefined ? r.actif : true
      }));
      this.comptesBancaires = await db.comptes_bancaires.toArray() || [];
      const toleranceReg = await db.reglages.where('cle').equals('tolerance_paiement').first();
      if (toleranceReg) this.toleranceForm = toleranceReg.valeur;
      const bonusReg = await db.reglages.where('cle').equals('regles_bonus_vendeurs').first();
      this.bonusRegles = bonusReg?.valeur || {};
      const tousUtilisateurs = await db.utilisateurs.toArray();
      this.vendeurs = [];
      for (const u of tousUtilisateurs) {
          const perm = await getRolePermissions(u.role);
          if (perm && (perm.clients === 'ecriture' || perm.clients === 'ecriture_apres_cloture')) {
              this.vendeurs.push(u);
              if (!this.bonusRegles[u.id]) {
                  this.bonusRegles[u.id] = { actif: true, volume_min: 500, prix_min: 2500, bonus_par_litre: 80 };
              }
          }
      }
      await this.chargerJournaux();
      await this.chargerProjets();
      this.projetsActifs = this.projets.filter(p => p.actif);
      await this.chargerChargesAbonnement();
      this.reglesAffectation = await db.regles_affectation.toArray() || [];

      const reglagesArray = await db.reglages.toArray();
      const reglages = {};
      reglagesArray.forEach(r => { reglages[r.cle] = r.valeur; });

      // --- Récupération des rôles ---
      const rolesReg = reglages.roles;
      if (Array.isArray(rolesReg)) {
        this.rolesArray = rolesReg;
      } else if (typeof rolesReg === 'object' && rolesReg !== null) {
        this.rolesArray = Object.entries(rolesReg).map(([nom, permissions]) => ({ nom, permissions }));
      } else {
        // Valeurs par défaut (avec groupes)
        this.rolesArray = [
          { nom: 'superviseur', permissions: { recolte: 'ecriture', production: 'ecriture', stocks: 'ecriture', clients: 'ecriture', caisses: 'ecriture_apres_cloture', budgets: 'ecriture', reglages: 'ecriture', factures: 'ecriture', travailleurs: 'ecriture', banque: 'ecriture' }, groupes: ['admin','production','ventes','caisse_banque','finance'] },
          { nom: 'superviseur_huilerie', permissions: { recolte: 'lecture', production: 'ecriture', stocks: 'ecriture', clients: 'lecture', caisses: 'lecture', budgets: 'lecture', reglages: 'lecture', factures: 'lecture', travailleurs: 'aucun', banque: 'aucun' }, groupes: ['production'] },
          { nom: 'superviseur_vente', permissions: { recolte: 'lecture', production: 'lecture', stocks: 'ecriture', clients: 'ecriture', caisses: 'ecriture', budgets: 'lecture', reglages: 'lecture', factures: 'ecriture', travailleurs: 'aucun', banque: 'aucun' }, groupes: ['ventes','caisse_banque'] },
          { nom: 'vendeur', permissions: { recolte: 'aucun', production: 'aucun', stocks: 'lecture', clients: 'ecriture', caisses: 'aucun', budgets: 'aucun', reglages: 'aucun', factures: 'lecture', travailleurs: 'aucun', banque: 'aucun' }, groupes: [] },
          { nom: 'caissier', permissions: { recolte: 'aucun', production: 'aucun', stocks: 'lecture', clients: 'lecture', caisses: 'ecriture', budgets: 'lecture', reglages: 'aucun', factures: 'lecture', travailleurs: 'aucun', banque: 'aucun' }, groupes: ['caisse_banque'] }
        ];
      }

      this.rolesArray = this.rolesArray.map(role => ({ ...role, groupes: role.groupes || [] }));

      // --- Charger les accès sites depuis la table ---
      const allAcces = await db.acces_sites.toArray();
      this.rolesArray.forEach(role => {
        role.accesSites = {};
        this.sites.forEach(site => {
          role.accesSites[site.id] = { lecture: false, ecriture: false };
        });
        const accesDuRole = allAcces.filter(a => a.role === role.nom);
        accesDuRole.forEach(acc => {
          if (role.accesSites[acc.siteId]) {
            role.accesSites[acc.siteId].lecture = acc.niveau === 'lecture' || acc.niveau === 'ecriture';
            role.accesSites[acc.siteId].ecriture = acc.niveau === 'ecriture';
          }
        });
      });

      // --- Chargement des autres réglages ---
      if (reglages.taux_conversion) this.tauxConversion = reglages.taux_conversion;
      if (reglages.facteurs_emission) this.facteursEmission = reglages.facteurs_emission;
      // Chargement des parcelles (nouveau format : tableau d'objets)
      const regParcelles = reglages.parcelles;
      if (regParcelles && Array.isArray(regParcelles) && regParcelles.length > 0) {
        // Vérifier si c'est le nouveau format (objet avec nom, surface_m2, etc.) ou l'ancien (tableau de chaînes)
        if (typeof regParcelles[0] === 'string') {
          // Ancien format : convertir en objet
          this.parcelles = regParcelles.map(nom => ({
            nom: nom,
            surface_m2: 0,
            gps: '',
            annee_plantation: null,
            notes: ''
          }));
        } else {
          this.parcelles = regParcelles;
        }
      } else {
        // Valeur par défaut si aucune donnée
        this.parcelles = [
          { nom: 'Parcelle A', surface_m2: 0, gps: '', annee_plantation: null, notes: '' },
          { nom: 'Parcelle B', surface_m2: 0, gps: '', annee_plantation: null, notes: '' }
        ];
      }
      if (reglages.secteurs) this.secteurs = reglages.secteurs;
      if (reglages.coordonnees) this.coordonnees = reglages.coordonnees;
      if (reglages.modele_facture) this.modeleFacture = reglages.modele_facture;
      else this.modeleFacture = `<html>...</html>`;
      if (reglages.modele_bl) this.modeleBL = reglages.modele_bl;
      else this.modeleBL = `<html>...</html>`;
      this.derniereSync = localStorage.getItem('derniereSync');

      // --- Chargement des paramètres de congés ---
      if (reglages.params_conges) this.paramsConges = reglages.params_conges;
      else this.paramsConges = { joursVacancesAnnuels: 26, joursOuvrablesMois: 26, plafondAvanceMois: 80 };

      const deps = await db.reglages.where('cle').equals('departements').first();
      this.departements = deps ? deps.valeur : [];
      for (const dep of this.departements) {
        await this.creerPosteSalaire(dep);
      }
      await this.nettoyerPostesSalairesOrphelins();

      // --- Permissions des groupes ---
      const permReg = await db.reglages.where('cle').equals('permissions_groupes').first();
      if (permReg) this.permissionsGroupes = permReg.valeur;
      else {
        this.permissionsGroupes = {
          superviseur: ['admin','production','ventes','caisse_banque','finance'],
          superviseur_huilerie: ['production'],
          superviseur_vente: ['ventes','caisse_banque'],
          vendeur: [],
          caissier: ['caisse_banque']
        };
      }

     // Tarifs
      const rawTarifs = await db.tarifs.toArray();
      this.tarifs = rawTarifs.map(t => ({
          ...t,
          prixParContenant: t.prixParContenant || {}   // si absent, initialise un objet vide
      }));

      // Prochain code tarif
      const codes = this.tarifs.map(t => t.code).filter(c => c && c.length === 1 && c >= 'A' && c <= 'Z');
      if (codes.length > 0) {
          const maxCode = codes.sort().pop();
          this.prochainCodeTarif = String.fromCharCode(maxCode.charCodeAt(0) + 1);
      } else {
          this.prochainCodeTarif = 'A';
      }
      // Carburant
      const ct = await db.carburant_types.toArray();
      this.carburantTypes = ct.map(t => ({ ...t, sites: t.sites || [] }));

      // Initialisation immédiate des domaines carburant
      this.domainesObjectifsDisponibles.forEach(d => {
          if (!(d.value in this.objectifsParDomaine)) {
              this.objectifsParDomaine[d.value] = Array(12).fill(0);
          }
      });

      await this.chargerObjectifs();
      const cu = await db.carburant_utilisations.toArray();
      this.carburantUtilisations = cu.map(u => ({ nom: u.nom, departement: u.departement || '' }));
      

      await this.chargerConditionnements();
      
    },
    async chargerTaux() {
      const tousTaux = await db.taux_change.where('date').startsWith(`${this.anneeTaux}-`).toArray();
      const map = {};
      for (let t of tousTaux) map[t.date] = t.taux;
      this.tauxParJour = map;
    },
    formatVolume(v) {
        return Math.round(v).toLocaleString('fr-FR');
    },
    formatMontant(v, devise) {
        if (v === undefined || v === null) return '0';
        if (devise === 'CDF') {
            return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(v));
        } else {
            return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
        }
    },
    formatCellValue(value, domaine, moisIndex) {
        if (value === undefined || value === null) return '';
        if (!domaine) return String(value);
        if (Array.isArray(value) || typeof value !== 'number') return String(value);

        if (domaine.unite === '%' || domaine.unite === 'note') {
            return value.toFixed(1);
        } else if (domaine.unite === 'devise' || domaine.unite === 'devise/L') {
            const taux = (this.tauxChangeAnneeData[moisIndex]?.taux) || 2500;
            let valeurAff = value; // déjà en CDF
            if (this.deviseSaisie === 'USD') {
                valeurAff = value / taux;
            }
            return this.formatMontant(valeurAff, this.deviseSaisie);
        } else if (domaine.unite === 'tonnes') {
            return this.formatVolume(value / 1000);
        } else {
            return this.formatVolume(value);
        }
    },
    parseCellValue(val, domaine) {
        if (val === '' || val === undefined) return 0;
        let num = parseFloat(val.toString().replace(/'/g, '').replace(/\s/g, '').replace(',', '.'));
        if (isNaN(num)) return 0;
        if (domaine && domaine.unite === 'tonnes') {
            return Math.round(num * 1000);
        }
        return num;
    },
    isNumberKey(evt) {
        const char = String.fromCharCode(evt.which);
        if (!/[0-9.,]/.test(char)) {
            evt.preventDefault();
        }
    },
    definirGroupesVisibles() {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const roleName = user.role;
      
      const roleObj = this.rolesArray.find(r => r.nom === roleName);
      const permReglages = roleObj?.permissions?.reglages || 'aucun';
      
      if (permReglages === 'aucun') {
        this.groupesVisibles = [];
        return;
      }
      
      const permGroupes = this.permissionsGroupes[roleName];
      if (permGroupes) {
        this.groupesVisibles = permGroupes;
      } else {
        this.groupesVisibles = roleObj?.groupes || [];
      }
      
      if (this.groupesVisibles.length > 0 && !this.groupesVisibles.includes(this.activeGroup)) {
        this.activeGroup = this.groupesVisibles[0];
      }
    },
    formatDateJJMMAA(dateStr) {
      if (!dateStr) return '';
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year.slice(2)}`;
    },
    getCaissesForUser(userId) {
      const relations = this.caisseUtilisateurs.filter(cu => cu.utilisateurId === userId);
      return relations.map(rel => this.caisses.find(c => c.id === rel.caisseId)).filter(c => c);
    },
    getUtilisateurNom(id) { const u = this.utilisateurs.find(u => u.id === id); return u ? u.nom : ''; },
    getUtilisateurRole(id) { const u = this.utilisateurs.find(u => u.id === id); return u ? u.role : ''; },
    getAccesSite(role, siteId, type) {
      // Initialiser si nécessaire
      if (!role.accesSites) {
        role.accesSites = {};
      }
      if (!role.accesSites[siteId]) {
        role.accesSites[siteId] = { lecture: false, ecriture: false };
      }
      return role.accesSites[siteId][type];
    },
    // Journaux
    async chargerJournaux() {
      this.journaux = await db.journaux.toArray();
    },
    ajouterJournal() {
      this.journaux.push({ id: crypto.randomUUID(), code: '', libelle: '', type: 'caisse' });
    },
    supprimerJournal(id) {
      this.journaux = this.journaux.filter(j => j.id !== id);
    },
    async sauvegarderJournaux() {
      await db.journaux.clear();
      await db.journaux.bulkAdd(this.journaux);
      alert('Journaux sauvegardés');
    },
    // ============ ÉMISSIONS CO2 ============

    ajouterRegleIndirecte() {
        this.reglesIndirectes.push({
            posteId: this.postesSortie.length ? this.postesSortie[0].id : '',
            methode: 'direct',
            facteur_direct: 0,
            carburant_type_id: this.carburantTypes.length ? this.carburantTypes[0].id : null,
            volume_par_usd: 0,
            pourcentage: 100,
            utilisation_id: '',
            actif: true
        });
    },
    supprimerRegleIndirecte(index) {
        this.reglesIndirectes.splice(index, 1);
    },
    async sauvegarderReglesIndirectes() {
        await db.regles_emissions_indirectes.clear();
        for (const regle of this.reglesIndirectes) {
            await db.regles_emissions_indirectes.add({
                id: regle.id || crypto.randomUUID(),
                posteId: regle.posteId,
                methode: regle.methode,
                facteur_direct: regle.facteur_direct,
                carburant_type_id: regle.carburant_type_id,
                volume_par_usd: regle.volume_par_usd,
                pourcentage: regle.pourcentage,
                utilisation_id: regle.utilisation_id,
                actif: regle.actif
            });
        }
        alert('Règles enregistrées');
    },

    // ========== RÔLES ==========
        ajouterRole() {
      this.rolesArray.push({
        nom: 'Nouveau rôle',
        permissions: {
          recolte: 'aucun',
          production: 'aucun',
          stocks: 'aucun',
          clients: 'aucun',
          caisses: 'aucun',
          budgets: 'aucun',
          reglages: 'aucun',
          factures: 'aucun',
          travailleurs: 'aucun',
          banque: 'aucun'
        },
        groupes: [],
        accesSites: {}   // objet vide qui sera rempli dynamiquement
      });
      // Initialiser accesSites pour chaque site
      const nouveauRole = this.rolesArray[this.rolesArray.length - 1];
      this.sites.forEach(site => {
        nouveauRole.accesSites[site.id] = { lecture: false, ecriture: false };
      });
      this.$nextTick(() => {
        const cartes = document.querySelectorAll('.card.mb-3');
        if (cartes.length) {
          cartes[cartes.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    },
    supprimerRole(index) { this.rolesArray.splice(index, 1); },
        async sauvegarderRoles() {
      try {
        // 1. Sauvegarder les rôles (copie profonde)
        const rolesCopy = JSON.parse(JSON.stringify(this.rolesArray));
        await db.reglages.where('cle').equals('roles').delete();
        await apiService.ajouter('reglages', { cle: 'roles', valeur: rolesCopy }, { audit: true });

        // 2. Reconstruction de permissions_groupes
        const newPerms = {};
        this.rolesArray.forEach(role => {
          newPerms[role.nom] = [...(role.groupes || [])];
        });
        const permsCopy = JSON.parse(JSON.stringify(newPerms));
        await db.reglages.where('cle').equals('permissions_groupes').delete();
        await apiService.ajouter('reglages', { cle: 'permissions_groupes', valeur: permsCopy });

        // 3. Mise à jour des accès aux sites
        await db.acces_sites.clear();
        for (const role of this.rolesArray) {
          if (!role.accesSites) continue;
          for (const siteId in role.accesSites) {
            const acc = role.accesSites[siteId];
            if (acc.lecture || acc.ecriture) {
              const niveau = acc.ecriture ? 'ecriture' : 'lecture';
              await db.acces_sites.add({
                id: crypto.randomUUID(),
                role: role.nom,
                siteId,
                niveau
              });
            }
          }
        }

        // 4. Mise à jour locale
        this.permissionsGroupes = newPerms;
        this.definirGroupesVisibles();

        alert('Rôles, permissions et accès sites sauvegardés');
      } catch (error) {
        console.error('Erreur sauvegarde rôles:', error);
        alert('Erreur lors de la sauvegarde');
      }
    },

    // Projets
    async chargerProjets() { this.projets = await db.projets.toArray(); },
    ajouterProjet() { this.projets.push({ id: crypto.randomUUID(), nom: 'Nouveau projet', actif: true }); },
    async supprimerProjet(id) { await db.projets.delete(id); await this.chargerProjets(); },
    async sauvegarderProjets() {
      for (let p of this.projets) {
        if (p.id) await db.projets.update(p.id, p); else await db.projets.add(p);
      }
      alert('Projets sauvegardés');
    },

    
    // Charges à répartir
    async chargerChargesAbonnement() {
      this.chargesAbonnement = await db.charges_abonnement.toArray();
    },
    ajouterChargeAbonnement() {
      this.chargesAbonnement.push({
        id: crypto.randomUUID(),
        description: '',
        montant_total: 0,
        date_debut: new Date().toISOString().slice(0,10),
        date_fin: new Date(new Date().getFullYear(), 11, 31).toISOString().slice(0,10),
        projetId: this.projetsActifs[0]?.id || null,
        ecritureId: null
      });
    },
    async supprimerChargeAbonnement(id) {
      await db.charges_abonnement.delete(id);
      await this.chargerChargesAbonnement();
    },
    async sauvegarderChargesAbonnement() {
      for (let c of this.chargesAbonnement) {
        if (c.id) await db.charges_abonnement.update(c.id, c); else await db.charges_abonnement.add(c);
      }
      alert('Charges à répartir sauvegardées');
    },

    //========== OBJECTIFS ===========
    async chargerObjectifs() {
        this.objectifsReady = false;   // ← début

        const all = await db.objectifs_mensuels
            .where('annee').equals(this.objectifAnnee)
            .and(o => o.vendeur_id === null)
            .toArray();

        this.tauxChangeAnneeData = await db.taux_change_mensuel.where('annee').equals(this.objectifAnnee).toArray();
        this.tauxMensuelsDisponibles = this.tauxChangeAnneeData.length === 12 && this.tauxChangeAnneeData.every(t => t);

        all.forEach(o => {
            if (o.domaine in this.objectifsParDomaine) {
                this.objectifsParDomaine[o.domaine] = o.donnees || Array(12).fill(0);
            }
        });

        this.objectifsReady = true;    // ← fin
    },
        async sauvegarderObjectifs() {
          const all = await db.objectifs_mensuels.where('annee').equals(this.objectifAnnee).and(o => o.vendeur_id === null).toArray();

          for (const domaineObj of this.domainesObjectifsDisponibles) {
              const domaine = domaineObj.value;
              // Prendre les données du domaine (saisissable ou calculé)
              const donnees = domaineObj.calcule
                  ? this.lignesCalculees[domaine]
                  : this.objectifsParDomaine[domaine];
              if (!donnees) continue;

              const existant = all.find(o => o.domaine === domaine);
              const donneesBrutes = JSON.parse(JSON.stringify(donnees));

              if (existant) {
                  await db.objectifs_mensuels.update(existant.id, { donnees: donneesBrutes });
              } else {
                  await db.objectifs_mensuels.add({
                      id: crypto.randomUUID(),
                      annee: this.objectifAnnee,
                      domaine,
                      vendeur_id: null,
                      donnees: donneesBrutes
                  });
              }
          }
          alert('Objectifs sauvegardés');
      },
    updateObjectif(domaine, index, value) {
        if (!this.objectifsParDomaine[domaine]) return;
        const domaineObj = this.domainesObjectifsDisponibles.find(d => d.value === domaine);
        let parsed = this.parseCellValue(value, domaineObj);
        if (domaineObj.unite === 'devise' || domaineObj.unite === 'devise/L') {
            const taux = (this.tauxChangeAnneeData[index]?.taux) || 2500;
            if (this.deviseSaisie === 'USD') {
                parsed *= taux; // conversion en CDF
            }
        }
        this.objectifsParDomaine[domaine][index] = parsed;
    },
    fillAllMonths(domaine) {
        const firstMonthCDF = this.objectifsParDomaine[domaine][0];
        const domaineObj = this.domainesObjectifsDisponibles.find(d => d.value === domaine);
        
        // Déterminer la valeur de référence dans la devise d'affichage pour janvier
        let referenceValue;
        if (this.deviseSaisie === 'USD' && (domaineObj.unite === 'devise' || domaineObj.unite === 'devise/L')) {
            const tauxJanvier = this.tauxChangeAnneeData[0]?.taux || 2500;
            referenceValue = firstMonthCDF / tauxJanvier;
        } else {
            referenceValue = firstMonthCDF;
        }
        
        if (confirm(`Appliquer la valeur de janvier (${this.formatCellValue(firstMonthCDF, domaineObj, 0)}) à toute l'année ?`)) {
            for (let i = 1; i < 12; i++) {
                let newCDF;
                if (this.deviseSaisie === 'USD' && (domaineObj.unite === 'devise' || domaineObj.unite === 'devise/L')) {
                    const tauxMois = this.tauxChangeAnneeData[i]?.taux || 2500;
                    newCDF = referenceValue * tauxMois;
                } else {
                    newCDF = referenceValue;
                }
                this.objectifsParDomaine[domaine][i] = newCDF;
            }
        }
    },

    // Types de carburant
    ajouterCarburantType() {
      this.carburantTypes.push({
        id: null,
        nom: 'Nouveau carburant',
        unite: 'L',
        facteur_co2: 2.68,
        sites: []
      });
    },
    supprimerCarburantType(index) {
      this.carburantTypes.splice(index, 1);
    },
    async sauvegarderCarburantTypes() {
      // Sauvegarde dans carburant_types et carburant_type_sites
      for (let ct of this.carburantTypes) {
        if (!ct.id) {
          ct.id = await apiService.ajouter('carburant_types', {
            nom: ct.nom,
            unite: ct.unite,
            facteur_co2: ct.facteur_co2
          });
        } else {
          await apiService.modifier('carburant_types', ct.id, {
            nom: ct.nom,
            facteur_co2: ct.facteur_co2
          });
        }
        // Gérer les associations aux sites
        await db.carburant_type_sites.where('carburant_type_id').equals(ct.id).delete();
        for (let siteId of ct.sites) {
          await db.carburant_type_sites.add({
            id: crypto.randomUUID(),
            carburant_type_id: ct.id,
            site_id: siteId
          });
        }
      }
      alert('Types de carburant sauvegardés');
    },

    // Utilisations carburant
    ajouterCarburantUtilisation() {
        this.carburantUtilisations.push({ nom: 'Nouvelle utilisation', departement: '' });
    },
    supprimerCarburantUtilisation(index) {
      this.carburantUtilisations.splice(index, 1);
    },
    async sauvegarderCarburantUtilisations() {
      const oldIds = (await db.carburant_utilisations.toArray()).map(u => u.id);
      for (let id of oldIds) {
        await apiService.supprimer('carburant_utilisations', id);
      }
      for (let u of this.carburantUtilisations) {
        const data = JSON.parse(JSON.stringify({
          nom: u.nom,
          departement: u.departement || ''
        }));
        await apiService.ajouter('carburant_utilisations', data);
      }
      alert('Utilisations sauvegardées');
    },
    
    // ========== SITES ==========
    checkProduction(siteModifie) { this.sites.forEach(s => { if (s !== siteModifie) s.estProduction = false; }); },
    ajouterSite() { this.sites.push({ nom: 'Nouveau site', estProduction: false }); },
    async supprimerSite(index) { const s = this.sites[index]; if (s.id) await apiService.supprimer('sites', s.id); this.sites.splice(index, 1); },
    async sauvegarderSites() {
      for (let s of this.sites) {
        if (!s.id) await apiService.ajouter('sites', s);
        else await apiService.modifier('sites', s.id, s);
      }
      this.sites = await db.sites.toArray();
      alert('Sites sauvegardés');
    },

    // ===============Poste de travail==============

    ajouterPosteTravail() {
      this.postesTravail.push('Nouveau poste');
    },
    supprimerPosteTravail(index) {
      this.postesTravail.splice(index, 1);
    },
    async sauvegarderPostesTravail() {
      const copy = JSON.parse(JSON.stringify(this.postesTravail));
      await db.reglages.where('cle').equals('postes_travail').delete();
      await apiService.ajouter('reglages', { cle: 'postes_travail', valeur: copy });
      alert('Postes de travail sauvegardés');
    },

    // ==================== Congés =======================

    async sauvegarderParamsConges() {
      await db.reglages.where('cle').equals('params_conges').delete();
      await apiService.ajouter('reglages', { cle: 'params_conges', valeur: this.paramsConges });
      alert('Paramètres des congés enregistrés');
    },

    //========== Notifications ============
    getNotifLabel(type) {
      const labels = {
        facture_retard: 'Facture en retard',
        facture_livree_impayee: 'Facture livrée impayée',
        facture_paiement_partiel: 'Paiement partiel',
        nouvelle_facture: 'Nouvelle facture',
        livraison_en_attente: 'Livraison en attente',
        stock_faible: 'Stock faible',
        stock_rupture: 'Rupture de stock',
        transfert_en_attente: 'Transfert en attente',
        ecart_inventaire: 'Écart d\'inventaire',
        ecart_reconditionnement: 'Écart de reconditionnement',
        ecart_transfert: 'Écart de transfert',
        semaine_non_cloturee: 'Semaine non clôturée',
        ecart_caisse: 'Écart de caisse',
        taux_extraction_bas: 'Taux d\'extraction bas',
        production_manquante: 'Production manquante',
        recolte_manquante: 'Récolte manquante',
        taux_change_manquant: 'Taux de change manquant',
        depassement_budget: 'Dépassement budgétaire',
        stock_faible_carburant: 'Stock carburant faible',
        stock_faible_emballage: 'Stock emballage faible',
        transfert_emballage_recu: 'Transfert emballage reçu',
        transfert_emballage_confirme: 'Transfert emballage confirmé'
      };
      return labels[type] || type;
    },
    getVariablesForType(type) {
        const vars = {
            facture_retard: '{numero}, {client}, {montant}, {devise}, {jours_retard}',
            facture_livree_impayee: '{numero}, {client}',
            facture_paiement_partiel: '{numero}, {montant_paye}, {devise}, {reste_a_payer}',
            nouvelle_facture: '{numero}, {client}, {total}, {devise}',
            livraison_en_attente: '{numero}, {client}, {jours_attente}',
            stock_faible: '{contenant}, {site}, {quantite}, {seuil}',
            stock_rupture: '{contenant}, {site}',
            transfert_en_attente: '{numero}, {jours_attente}',
            ecart_inventaire: '{site}, {lot}, {contenant}, {theorique}, {reel}',
            ecart_reconditionnement: '{date}, {perte}',
            ecart_transfert: '{numero}, {ecart}',
            semaine_non_cloturee: '{date_debut}, {jours}',
            ecart_caisse: '{caisse}, {ecart}, {devise}',
            taux_extraction_bas: '{type}, {taux}, {semaine}',
            production_manquante: '{semaine}',
            recolte_manquante: '{semaine}',
            taux_change_manquant: '{date}',
            depassement_budget: '{poste}, {mois}, {annee}, {prevu}, {realise}, {devise}',
            stock_faible_carburant: '{type}, {site}, {quantite}, {seuil}',
            stock_faible_emballage: '{nom}, {site}, {quantite}, {seuil}',
            transfert_emballage_recu: '{numero}, {source}, {destination}',
            transfert_emballage_confirme: '{numero}'
        };
        return vars[type] || '';
    },
    getSeuilLabel(key) {
      const labels = {
        jours_attente: 'Jours d\'attente',
        par_defaut: 'Seuil par défaut',
        seuil_ecart: 'Seuil d\'écart',
        taux_fruit_regime: 'Seuil taux fruit/régime',
        taux_huilerie: 'Seuil taux huilerie',
        taux_global: 'Seuil taux global'
      };
      return labels[key] || key;
    },
    async chargerConfigNotif() {
      const reg = await db.reglages.where('cle').equals('notifications_config').first();
      if (reg && reg.valeur) {
        this.configNotif = reg.valeur;
      } else {
        // Charger la config par défaut depuis le service
        const { default: notificationService } = await import('../services/notificationService');
        this.configNotif = await notificationService.getConfig();
      }
    },
    async sauvegarderConfigNotif() {
      await db.reglages.where('cle').equals('notifications_config').delete();
      await apiService.ajouter('reglages', { cle: 'notifications_config', valeur: this.configNotif });
      alert('Configuration sauvegardée');
    },

    // ============== JOURNAL ======================

    async chargerAudit() {
      let logs = await db.journal_audit.orderBy('date').reverse().toArray();
      const debut = this.auditFiltre.dateDebut;
      const fin = this.auditFiltre.dateFin;
      if (debut) logs = logs.filter(l => l.date >= debut);
      if (fin) logs = logs.filter(l => l.date <= fin + 'T23:59:59');
      if (this.auditFiltre.utilisateurId) logs = logs.filter(l => l.utilisateurId === this.auditFiltre.utilisateurId);
      if (this.auditFiltre.entite) logs = logs.filter(l => l.entite === this.auditFiltre.entite);
      if (this.auditFiltre.action) logs = logs.filter(l => l.action === this.auditFiltre.action);
      this.auditLogs = logs;
    },
    formatDateHeure(dateStr) {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleString('fr-FR');
    },
    exporterAuditCSV() {
      if (!this.auditLogsFiltres.length) {
        alert('Aucune donnée à exporter');
        return;
      }
      const lignes = this.auditLogsFiltres.map(l => ({
        Date: this.formatDateHeure(l.date),
        Utilisateur: l.utilisateurNom,
        Entité: l.entite,
        Action: l.action,
        Détails: l.details
      }));
      const csv = Papa.unparse(lignes, { delimiter: ';' });
      const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `journal_audit_${new Date().toISOString().slice(0,10)}.csv`;
      link.click();
    },
    
    // ========== PARCELLES ==========
    ajouterParcelle() {
      this.parcelles.push({
        nom: 'Nouvelle parcelle',
        surface_m2: 0,
        gps: '',
        annee_plantation: null,
        notes: ''
      });
    },
    supprimerParcelle(index) {
      this.parcelles.splice(index, 1);
    },
    async sauvegarderParcelles() {
      // Sauvegarde en tant qu'objet dans reglages (clé 'parcelles')
      await db.reglages.where('cle').equals('parcelles').delete();
      await apiService.ajouter('reglages', {
        cle: 'parcelles',
        valeur: JSON.parse(JSON.stringify(this.parcelles))
      });
      alert('Parcelles sauvegardées');
    },

    // ========== SECTEURS ==========
    ajouterSecteur() { this.secteurs.push('Nouveau secteur'); },
    supprimerSecteur(index) { this.secteurs.splice(index, 1); },
    async sauvegarderSecteurs() {
      await db.reglages.where('cle').equals('secteurs').delete();
      await apiService.ajouter('reglages', { cle: 'secteurs', valeur: this.secteurs });
      alert('Secteurs sauvegardés');
    },

    // ========== TARIFS ==========
    ajouterTarif() {
        const prix = {};
        this.conditionnements.forEach(cond => { prix[cond.id] = 0; });
        this.tarifs.push({
            code: this.prochainCodeTarif,
            devise: 'USD',
            prixParConditionnement: prix,
            note: ''
        });
        this.prochainCodeTarif = String.fromCharCode(this.prochainCodeTarif.charCodeAt(0) + 1);
    },
    async sauvegarderTarifs() {
        for (let t of this.tarifs) {
            if (!t.id) await apiService.ajouter('tarifs', t);
            else await apiService.modifier('tarifs', t.id, t);
        }
        this.tarifs = await db.tarifs.toArray();
        alert('Tarifs sauvegardés');
    },
    supprimerTarif(index) { const t = this.tarifs[index]; if (t.id) apiService.supprimer('tarifs', t.id); this.tarifs.splice(index, 1); },

    // ========== MODES DE PAIEMENT ==========
    ajouterModePaiement() { this.modesPaiement.push({ id: null, nom: 'Nouveau mode', actif: true }); },
    supprimerModePaiement(index) { this.modesPaiement.splice(index, 1); },
    async sauvegarderModesPaiement() {
      await db.modes_paiement.clear();
      for (let m of this.modesPaiement) await apiService.ajouter('modes_paiement', m);
      alert('Modes de paiement sauvegardés');
    },

    async chargerConditionnements() {
        this.conditionnements = await db.conditionnements.toArray();
        this.articlesFourniture = await db.articles_fourniture.toArray();
        this.conditionnementComposants = await db.conditionnement_composants.toArray();
    },
    getComposantsConditionnement(condId) {
        return this.conditionnementComposants.filter(c => c.conditionnement_id === condId);
    },
    ajouterConditionnement() {
        this.conditionnements.push({
            nom: 'Nouveau conditionnement',
            code: '',
            capaciteL: 1,
            retour_possible: false,
            actif: true,
            ordre: 999
        });
    },
    async supprimerConditionnement(idx) {
        const cond = this.conditionnements[idx];
        if (cond.id) {
            // Supprimer les composants associés
            await db.conditionnement_composants.where('conditionnement_id').equals(cond.id).delete();
            await db.conditionnements.delete(cond.id);
        }
        this.conditionnements.splice(idx, 1);
    },
    ajouterComposantConditionnement(condId) {
        this.conditionnementComposants.push({
            conditionnement_id: condId,
            article_fourniture_id: '',
            quantite: 1
        });
    },
    supprimerComposantConditionnement(condId, compIdx) {
        const comps = this.getComposantsConditionnement(condId);
        if (comps[compIdx]) {
            this.conditionnementComposants.splice(this.conditionnementComposants.indexOf(comps[compIdx]), 1);
        }
    },
    async sauvegarderConditionnements() {
      // 1. Vider les tables
      await db.conditionnements.clear();
      await db.conditionnement_composants.clear();

      // 2. Créer une copie non-réactive des conditionnements
      const conditionnementsCopy = this.conditionnements.map(cond => ({
        ...cond,   // spread = copie superficielle, suffisante car pas d’objets imbriqués
      }));

      // 3. Ajouter chaque conditionnement
      for (const cond of conditionnementsCopy) {
        if (!cond.id) cond.id = crypto.randomUUID();
        await db.conditionnements.add(cond);

        // 4. Récupérer les composants associés (copie également)
        const comps = this.conditionnementComposants
          .filter(c => c.conditionnement_id === cond.id)
          .map(comp => ({ ...comp, id: crypto.randomUUID() }));

        for (const comp of comps) {
          await db.conditionnement_composants.add(comp);
        }
      }

      // 5. Recharger les données locales
      await this.chargerConditionnements();
      alert('Conditionnements sauvegardés');
    },
    ajouterArticleFourniture() {
        this.articlesFourniture.push({
            nom: 'Nouvel article',
            type: 'contenant_vide',
            unite: 'pièce',
            seuil_alerte: 10,
            actif: true
        });
    },
    supprimerArticleFourniture(idx) {
        this.articlesFourniture.splice(idx, 1);
    },
    async sauvegarderArticlesFourniture() {
        await db.articles_fourniture.clear();
        for (const art of this.articlesFourniture) {
            if (!art.id) art.id = crypto.randomUUID();
            await db.articles_fourniture.add(art);
        }
        alert('Articles de fourniture sauvegardés');
    },
    
    // ========== TYPES DE CLIENTS ==========
    ajouterTypeClient() { this.typesClients.push({ id: null, nom: '', description: '' }); },
    supprimerTypeClient(index) { const tc = this.typesClients[index]; if (tc.id) apiService.supprimer('types_clients', tc.id); this.typesClients.splice(index, 1); },
    async sauvegarderTypesClients() {
      for (let tc of this.typesClients) {
        if (!tc.id) await apiService.ajouter('types_clients', tc);
        else await apiService.modifier('types_clients', tc.id, tc);
      }
      this.typesClients = await db.types_clients.toArray();
      alert('Types de clients sauvegardés');
    },

    // ========== COORDONNÉES ==========
    handleLogoUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => { this.coordonnees.logo = e.target.result; };
      reader.readAsDataURL(file);
    },
    async sauvegarderCoordonnees() {
      await db.reglages.where('cle').equals('coordonnees').delete();
      await apiService.ajouter('reglages', { cle: 'coordonnees', valeur: this.coordonnees });
      alert('Coordonnées sauvegardées');
    },

    // ========== MODÈLES ==========
    async sauvegarderModeles() {
      await db.reglages.where('cle').equals('modele_facture').delete();
      await apiService.ajouter('reglages', { cle: 'modele_facture', valeur: this.modeleFacture });
      await db.reglages.where('cle').equals('modele_bl').delete();
      await apiService.ajouter('reglages', { cle: 'modele_bl', valeur: this.modeleBL });
      alert('Modèles sauvegardés');
    },

    // ========== DÉPARTEMENTS ==========

    // Ajoute un nouveau département et crée immédiatement son poste de salaire
    ajouterDepartement() {
      const base = 'Nouveau département';
      let nom = base;
      let compteur = 1;
      while (this.departements.includes(nom)) {
        nom = `${base} (${compteur++})`;
      }
      this.departements.push(nom);
      this.creerPosteSalaire(nom);
    },

    // Crée le poste budgétaire "Salaire - [département]" s'il n'existe pas déjà
    async creerPosteSalaire(nomDepartement) {
      const posteNom = `Salaire - ${nomDepartement}`;
      const existe = await db.postes_budgetaires.where('nom').equals(posteNom).first();
      if (!existe) {
        await apiService.ajouter('postes_budgetaires', {
          nom: posteNom,
          type: 'sortie',
          lieFacture: false,
          estRetraitBancaire: false,
          actif: true,
          systeme: true   // rend le poste non éditable dans l'interface
        });
        console.log(`✅ Poste "${posteNom}" créé.`);
      }
    },

    // Déclenché lors du changement manuel du nom dans l'input
    onDepartementChange(index, event) {
      const ancienNom = this.departements[index];
      const nouveauNom = event.target.value;
      if (ancienNom === nouveauNom) return;
      if (this.departements.includes(nouveauNom)) {
        alert('Ce département existe déjà');
        this.departements[index] = ancienNom;
        return;
      }
      // Appliquer le renommage immédiatement
      this.renommerDepartement(ancienNom, nouveauNom);
    },

    // Renomme un département et met à jour toutes les données liées
    async renommerDepartement(ancienNom, nouveauNom) {
      try {
        // 1. Poste budgétaire
        const poste = await db.postes_budgetaires.where('nom').equals(`Salaire - ${ancienNom}`).first();
        if (poste) {
          await apiService.modifier('postes_budgetaires', poste.id, { nom: `Salaire - ${nouveauNom}` });
        }
        // 2. Mouvements de caisse
        const mouvements = await db.mouvementsCaisse.where('posteBudgetaire').equals(`Salaire - ${ancienNom}`).toArray();
        for (let m of mouvements) {
          await apiService.modifier('mouvementsCaisse', m.id, { posteBudgetaire: `Salaire - ${nouveauNom}` });
        }
        // 3. Travailleurs
        const travailleurs = await db.travailleurs.where('departement').equals(ancienNom).toArray();
        for (let t of travailleurs) {
          await apiService.modifier('travailleurs', t.id, { departement: nouveauNom });
        }
        console.log(`Département "${ancienNom}" renommé en "${nouveauNom}"`);
      } catch (e) {
        console.error('Erreur renommage département:', e);
        alert('Erreur lors du renommage');
      }
    },

    // Prépare la suppression d'un département (ouvre la modale de remplacement)
    supprimerDepartement(index) {
      const dep = this.departements[index];
      this.departementASupprimer = dep;
      // S'il reste d'autres départements, on propose le premier comme remplacement
      if (this.departements.length > 1) {
        this.departementRemplacement = this.departementsSauf(dep)[0];
      } else {
        this.departementRemplacement = '';
      }
      this.modalRemplacementDepartement = dep;
    },

    // Retourne la liste des départements sauf celui passé en paramètre
    departementsSauf(dep) {
      return this.departements.filter(d => d !== dep);
    },

    // Confirme la suppression et effectue le transfert des données
    async confirmerSuppressionDepartement() {
      const depASupprimer = this.departementASupprimer;
      let depRemplacement = this.departementRemplacement;

      // Si aucun remplacement n'est choisi (cas du dernier département), on crée "Divers"
      if (!depRemplacement) {
        depRemplacement = 'Divers';
        if (!this.departements.includes(depRemplacement)) {
          this.departements.push(depRemplacement);
          await this.creerPosteSalaire(depRemplacement);
        }
      }

      try {
        // 1. Récupérer les postes source et cible
        const posteASupprimer = await db.postes_budgetaires.where('nom').equals(`Salaire - ${depASupprimer}`).first();

        if (posteASupprimer) {
          // Réaffecter les mouvements de caisse
          const mouvements = await db.mouvementsCaisse.where('posteBudgetaire').equals(`Salaire - ${depASupprimer}`).toArray();
          for (let m of mouvements) {
            await apiService.modifier('mouvementsCaisse', m.id, { posteBudgetaire: `Salaire - ${depRemplacement}` });
          }
          // Supprimer le poste budgétaire
          await apiService.supprimer('postes_budgetaires', posteASupprimer.id);
        }

        // 2. Réaffecter les travailleurs
        const travailleurs = await db.travailleurs.where('departement').equals(depASupprimer).toArray();
        for (let t of travailleurs) {
          await apiService.modifier('travailleurs', t.id, { departement: depRemplacement });
        }

        // 3. Retirer le département de la liste locale
        const index = this.departements.indexOf(depASupprimer);
        if (index > -1) this.departements.splice(index, 1);

        // 4. Sauvegarder la nouvelle liste dans reglages
        await this.sauvegarderDepartementsSilencieux();

        this.modalRemplacementDepartement = null;
        alert(`Département "${depASupprimer}" supprimé. Les éléments ont été transférés vers "${depRemplacement}".`);
      } catch (e) {
        console.error('Erreur suppression département:', e);
        alert('Erreur lors de la suppression');
      }
    },

    // Sauvegarde complète : crée les postes manquants et enregistre la liste des départements
    async sauvegarderDepartements() {
      // S'assurer que chaque département a son poste de salaire
      for (const dep of this.departements) {
        await this.creerPosteSalaire(dep);
      }
      await this.sauvegarderDepartementsSilencieux();
      alert('Départements sauvegardés avec succès.');
    },

    // Sauvegarde silencieuse de la liste dans reglages (sans message)
    async sauvegarderDepartementsSilencieux() {
      const copy = JSON.parse(JSON.stringify(this.departements));
      await db.reglages.where('cle').equals('departements').delete();
      await apiService.ajouter('reglages', { cle: 'departements', valeur: copy });
    },

    // Supprime les postes "Salaire - X" dont le département X n'existe plus
    async nettoyerPostesSalairesOrphelins() {
      const postesSalaire = await db.postes_budgetaires.where('nom').startsWith('Salaire - ').toArray();
      for (const poste of postesSalaire) {
        const nomDepartement = poste.nom.replace('Salaire - ', '');
        if (!this.departements.includes(nomDepartement)) {
          // Vérifier s'il y a des écritures attachées
          const mouvements = await db.mouvementsCaisse.where('posteBudgetaire').equals(poste.nom).count();
          if (mouvements === 0) {
            await apiService.supprimer('postes_budgetaires', poste.id);
            console.log(`🧹 Poste orphelin "${poste.nom}" supprimé.`);
          } else {
            console.warn(`⚠️ Le poste "${poste.nom}" a des écritures mais son département n'existe plus.`);
          }
        }
      }
    },

    // ========== SYNCHRONISATION ==========
    async synchroniser() {
      this.syncEnCours = true;
      try {
        await apiService.syncFromServer();
        this.derniereSync = new Date().toLocaleString();
        localStorage.setItem('derniereSync', this.derniereSync);
        alert('Synchronisation terminée');
      } catch (error) { alert('Erreur synchronisation'); }
      finally { this.syncEnCours = false; }
    },

    // ================ REINITIALISATION ==========
    async resetModule(module) {
      let tables = [];
      const confirmMsg = {
        caisses: 'caisses, mouvements, semaines',
        stocks: 'stocks, transferts, inventaires',
        production: 'production, récolte, lots',
        clients: 'clients, factures, BL',
        finance: 'budgets, plan comptable, journaux',
        travailleurs: 'travailleurs, salaires, primes'
      };
      if (!confirm(`Supprimer TOUTES les données du module ${module} (${confirmMsg[module]}) ?`)) return;

      if (module === 'caisses') {
        tables = ['caisses','sous_caisses','mouvementsCaisse','semaines_caisse','clotures_sous_caisse','caisse_utilisateurs','operationsChange','erreurs_caisse'];
      } else if (module === 'stocks') {
        tables = ['stocks','mouvements','mouvement_lignes','transferts','transfert_lignes','inventaires','inventaire_lignes','reconditionnements'];
      } else if (module === 'production') {
        tables = ['semaines_production','production_consommation','production_lot','lots','semaines_recolte','recolte_journaliere'];
      } else if (module === 'clients') {
        tables = ['clients','types_clients','factures','facture_lignes','bons_livraison','bl_lignes'];
      } else if (module === 'finance') {
        tables = ['postes_budgetaires','budgets','budget_versions','plan_comptable','poste_compte','journaux','taux_change','taux_change_mensuel'];
      } else if (module === 'travailleurs') {
        tables = ['travailleurs','salaires_historique','presence_suspension','avances','remboursements_avances','primes'];
      }
      
      for (const t of tables) {
        try { await db[t].clear(); } catch(e) { console.warn(`Table ${t} non trouvée`); }
      }
      alert(`Module ${module} réinitialisé.`);
      // Recharger les données si nécessaire
      await this.chargerDonnees();
    },
    async resetAllData() {
      if (!confirm('⚠️ SUPPRIMER TOUTES LES DONNÉES (sauf utilisateurs et réglages) ? Cette action est IRRÉVERSIBLE.')) return;
      const allTables = [
        'caisses','sous_caisses','mouvementsCaisse','semaines_caisse','clotures_sous_caisse','caisse_utilisateurs','operationsChange','erreurs_caisse',
        'stocks','mouvements','mouvement_lignes','transferts','transfert_lignes','inventaires','inventaire_lignes','reconditionnements',
        'semaines_production','production_consommation','production_lot','lots','semaines_recolte','recolte_journaliere',
        'clients','types_clients','factures','facture_lignes','bons_livraison','bl_lignes',
        'postes_budgetaires','budgets','budget_versions','plan_comptable','poste_compte','journaux','taux_change','taux_change_mensuel',
        'travailleurs','salaires_historique','presence_suspension','avances','remboursements_avances','primes',
        'objectifs_mensuels','projets','affectations_projet','charges_abonnement','parametres_analytiques',
        'ecritures_manuelles','repartitions_ecritures','imports_bancaires','mouvements_bancaires','regles_affectation'
      ];
      for (const t of allTables) {
        try { 
          await db[t].clear(); 
        } catch(e) { 
          console.warn(`Table ${t} introuvable ou erreur lors du clear :`, e); 
        }
      }
      alert('Toutes les données ont été supprimées. Rechargez la page.');
      location.reload();
    },

    // ============== VENTE ================

    async sauvegarderTolerance() {
      await db.reglages.where('cle').equals('tolerance_paiement').delete();
      await apiService.ajouter('reglages', { cle: 'tolerance_paiement', valeur: this.toleranceForm });
      alert('Tolérance sauvegardée');
    },
    async sauvegarderBonusRegles() {
        await db.reglages.where('cle').equals('regles_bonus_vendeurs').delete();
        await apiService.ajouter('reglages', { cle: 'regles_bonus_vendeurs', valeur: JSON.parse(JSON.stringify(this.bonusRegles)) });
        alert('Règles de bonus sauvegardées');
    },
    async chargerBonusMensuel() {
      for (const v of this.vendeurs) {
        const objVolume = (await db.objectifs_mensuels.where({ annee: this.bonusAnnee, domaine: 'VolumeVentes', vendeur_id: v.id }).first())?.donnees?.[this.bonusMois - 1] || 0;
        const objPrix = (await db.objectifs_mensuels.where({ annee: this.bonusAnnee, domaine: 'PrixMoyenVente', vendeur_id: v.id }).first())?.donnees?.[this.bonusMois - 1] || 0;
        const volMin = (await db.objectifs_mensuels.where({ annee: this.bonusAnnee, domaine: 'BonusVolumeMin', vendeur_id: v.id }).first())?.donnees?.[this.bonusMois - 1] || 0;
        const prixMin = (await db.objectifs_mensuels.where({ annee: this.bonusAnnee, domaine: 'BonusPrixMin', vendeur_id: v.id }).first())?.donnees?.[this.bonusMois - 1] || 0;
        const bonusL = (await db.objectifs_mensuels.where({ annee: this.bonusAnnee, domaine: 'BonusParLitre', vendeur_id: v.id }).first())?.donnees?.[this.bonusMois - 1] || 0;
        this.bonusData[v.id] = {
          volumeObjectif: objVolume,
          prixObjectif: objPrix,
          volumeMin: volMin,
          prixMin: prixMin,
          bonusParLitre: bonusL
        };
      }
    },
    async sauvegarderBonusMensuel() {
        for (const v of this.vendeurs) {
            const data = this.bonusData[v.id];
            const domaines = [
                { nom: 'VolumeVentes', valeur: data.volumeObjectif },
                { nom: 'PrixMoyenVente', valeur: data.prixObjectif },
                { nom: 'BonusVolumeMin', valeur: data.volumeMin },
                { nom: 'BonusPrixMin', valeur: data.prixMin },
                { nom: 'BonusParLitre', valeur: data.bonusParLitre }
            ];
            for (const d of domaines) {
                const existant = await db.objectifs_mensuels
                    .where({ annee: this.bonusAnnee, domaine: d.nom, vendeur_id: v.id })
                    .first();

                let donnees = existant ? existant.donnees : Array(12).fill(0);
                // S'assurer que donnees est un tableau brut (si existant, il l'est déjà)
                if (existant) {
                    // Créer une copie modifiable
                    donnees = [...donnees];
                }
                donnees[this.bonusMois - 1] = d.valeur;

                if (existant) {
                    await db.objectifs_mensuels.update(existant.id, { donnees });
                } else {
                    await db.objectifs_mensuels.add({
                        id: crypto.randomUUID(),
                        annee: this.bonusAnnee,
                        domaine: d.nom,
                        vendeur_id: v.id,
                        donnees: donnees
                    });
                }
            }
        }
        alert('Bonus et objectifs mensuels sauvegardés');
    },

    // ========== UTILISATEURS ==========
    async ouvrirModalUtilisateur(user) {
      this.utilisateurEnEdition = user;
      this.utilisateurForm = user ? { ...user } : { nom: '', login: '', mot_de_passe: '', role: this.rolesArray[0]?.nom || '' };
      this.modalUtilisateur = true;
    },
    async enregistrerUtilisateur() {
      if (!this.utilisateurForm.nom || !this.utilisateurForm.login) return alert('Nom et login requis');
      if (!this.utilisateurEnEdition && !this.utilisateurForm.mot_de_passe) return alert('Mot de passe requis');
      try {
        if (this.utilisateurEnEdition) {
          const data = { ...this.utilisateurForm };
          if (!data.mot_de_passe) delete data.mot_de_passe;
          await apiService.modifier('utilisateurs', this.utilisateurEnEdition.id, data, { audit: true });
        } else {
          await apiService.ajouter('utilisateurs', this.utilisateurForm, { audit: true });
        }
        await this.chargerDonnees();
        this.modalUtilisateur = false;
        alert('Utilisateur enregistré');
      } catch (e) { alert('Erreur'); }
    },
    async supprimerUtilisateur(id) {
      if (!confirm('Supprimer cet utilisateur ?')) return;
      await apiService.supprimer('utilisateurs', id, { audit: true });
      await this.chargerDonnees();
    },
    async gererCaissesUtilisateur(user) {
      this.utilisateurCourant = user;
      const relations = await db.caisse_utilisateurs.where('utilisateurId').equals(user.id).toArray();
      this.caissesSelectionnees = relations.map(r => r.caisseId);
      this.modalCaissesUtilisateur = true;
    },
    async sauvegarderCaissesUtilisateur() {
      await db.caisse_utilisateurs.where('utilisateurId').equals(this.utilisateurCourant.id).delete();
      for (let caisseId of this.caissesSelectionnees) {
        await db.caisse_utilisateurs.add({ id: crypto.randomUUID(), caisseId, utilisateurId: this.utilisateurCourant.id, peutCloturer: false });
      }
      alert('Accès aux caisses mis à jour');
      this.modalCaissesUtilisateur = false;
      await this.chargerDonnees();
    },

    // ========== CAISSES ==========
    getSousCaissesForCaisse(caisseId) {
    return this.sousCaisses.filter(sc => sc.caisseId === caisseId);
    },
    supprimerSousCaisseForm(index) {
      this.caisseForm.sousCaisses.splice(index, 1);
    },
    getUtilisateursForCaisse(caisseId) {
      const relations = this.caisseUtilisateurs.filter(cu => cu.caisseId === caisseId);
      return relations.map(rel => this.utilisateurs.find(u => u.id === rel.utilisateurId)).filter(u => u);
    },
    ouvrirModalCaisse(caisse) {
      if (caisse) {
        // Édition
        this.caisseEnEdition = caisse;
        const sousCaissesExistantes = this.sousCaisses
          .filter(sc => sc.caisseId === caisse.id)
          .map(sc => ({ ...sc })); // copie
        const utilisateursExistants = this.caisseUtilisateurs
          .filter(cu => cu.caisseId === caisse.id)
          .map(cu => cu.utilisateurId);
        this.caisseForm = {
          id: caisse.id,
          nom: caisse.nom,
          sousCaisses: sousCaissesExistantes,
          utilisateurs: utilisateursExistants
        };
      } else {
        // Création
        this.caisseEnEdition = null;
        this.caisseForm = {
          id: null,
          nom: '',
          sousCaisses: [],
          utilisateurs: []
        };
      }
      this.modalCaisseVisible = true;
    },
    ajouterSousCaisseForm() {
      this.caisseForm.sousCaisses.push({
        id: null,
        caisseId: this.caisseForm.id,
        nom: '',
        devise: 'USD',
        solde_initial: 0,
        typePaiement: this.modesPaiement.length ? this.modesPaiement[0].id : '',
        actif: true
      });
    },
    async supprimerSousCaisse(id) {
      const confirmation = confirm(
        "Supprimer cette sous-caisse ?\n" +
        "OK = supprimer définitivement ses écritures.\n" +
        "Annuler = dissocier les écritures."
      );
      const supprimerEcritures = confirmation;
      try {
        const mouvements = await db.mouvementsCaisse.where('sousCaisseId').equals(id).toArray();
        if (supprimerEcritures) {
          for (let m of mouvements) {
            await apiService.supprimer('mouvementsCaisse', m.id);
          }
        } else {
          for (let m of mouvements) {
            await apiService.modifier('mouvementsCaisse', m.id, { caisseId: null, sousCaisseId: null });
          }
        }
        await apiService.supprimer('sous_caisses', id);
        alert('Sous-caisse supprimée');
      } catch (error) {
        console.error(error);
        alert('Erreur');
      }
    },
    async enregistrerCaisse() {
      if (!this.caisseForm.nom) {
        alert('Veuillez saisir un nom pour la caisse');
        return;
      }

      try {
        let caisseId = this.caisseForm.id;

        // --- Création ou mise à jour de la caisse principale ---
        if (!caisseId) {
          // Nouvelle caisse
          caisseId = await apiService.ajouter('caisses', { nom: this.caisseForm.nom, active: true }, { audit: true });
        } else {
          // Mise à jour du nom de la caisse
          await apiService.modifier('caisses', caisseId, { nom: this.caisseForm.nom }, { audit: true });

          // --- Suppression des anciennes sous-caisses ---
          const anciennesSousCaisses = await db.sous_caisses.where('caisseId').equals(caisseId).toArray();
          for (let sc of anciennesSousCaisses) {
            try {
              await apiService.supprimer('sous_caisses', sc.id, { audit: true });
            } catch (error) {
              // Ignorer l'erreur 404 (l'élément n'existe pas sur le serveur)
              if (error.response?.status !== 404) {
                console.error('Erreur suppression sous-caisse:', error);
              }
            }
          }

          // --- Suppression des anciennes associations utilisateurs ---
          await db.caisse_utilisateurs.where('caisseId').equals(caisseId).delete();
        }

        // --- Enregistrement des nouvelles sous-caisses ---
        for (let sc of this.caisseForm.sousCaisses) {
          await apiService.ajouter('sous_caisses', {
            caisseId: caisseId,
            nom: sc.nom,
            devise: sc.devise,
            solde_initial: sc.solde_initial || 0,
            typePaiement: sc.typePaiement,
            actif: true
          }, { audit: true });
        }

        // --- Enregistrement des associations utilisateurs ---
        for (let userId of this.caisseForm.utilisateurs) {
          await db.caisse_utilisateurs.add({
            id: crypto.randomUUID(),
            caisseId: caisseId,
            utilisateurId: userId,
            peutCloturer: false // valeur par défaut
          });
        }

        await this.creerPremiereSemainePourCaisse(caisseId);

        // --- Rechargement des données et fermeture de la modale ---
        await this.chargerDonnees();
        this.modalCaisseVisible = false;
        alert('Caisse enregistrée avec succès');

      } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la caisse:', error);
        alert('Une erreur est survenue lors de l\'enregistrement.');
      }
    },

    async creerPremiereSemainePourCaisse(caisseId) {
      const aujourdhui = new Date();
      const jour = aujourdhui.getDay();
      const diffLundi = (jour === 0 ? 6 : jour - 1);
      const lundi = new Date(aujourdhui);
      lundi.setDate(aujourdhui.getDate() - diffLundi);
      const dateDebut = lundi.toISOString().slice(0, 10);
      const dateFin = new Date(lundi);
      dateFin.setDate(lundi.getDate() + 6);
      const dateFinStr = dateFin.toISOString().slice(0, 10);

      const newSemaine = {
        id: crypto.randomUUID(),
        caisseId: caisseId,
        dateDebut,
        dateFin: dateFinStr,
        soldeOuvertureUSD: 0,
        soldeOuvertureCDF: 0,
        soldeClotureUSD: 0,
        soldeClotureCDF: 0,
        estCloturee: false,
        dateCloture: null,
        commentaireCloture: ''
      };
      await db.semaines_caisse.add(newSemaine);

      // Enregistrer les soldes initiaux des sous‑caisses comme mouvements de solde initial
      const sousCaisses = await db.sous_caisses.where('caisseId').equals(caisseId).toArray();
      
      // S'assurer que le poste budgétaire 'Solde initial' existe
      let posteSoldeInitial = await db.postes_budgetaires.where('nom').equals('Solde initial').first();
      if (!posteSoldeInitial) {
        posteSoldeInitial = {
          id: crypto.randomUUID(),
          nom: 'Solde initial',
          type: 'entree',
          lieFacture: false,
          estRetraitBancaire: false,
          actif: true,
          systeme: true,
          annee: new Date().getFullYear()
        };
        await db.postes_budgetaires.add(posteSoldeInitial);
      }

      for (const sc of sousCaisses) {
        if (!sc.solde_initial || sc.solde_initial === 0) continue;

        const { montant_cdf, montant_usd } = await convertirMontants(
          sc.solde_initial,
          sc.devise,
          dateDebut
        );

        const mouvementData = {
          id: crypto.randomUUID(),
          caisseId: caisseId,
          sousCaisseId: sc.id,
          semaineId: newSemaine.id,
          date: dateDebut,
          type: 'entree',
          montant: sc.solde_initial,
          devise: sc.devise,
          montant_cdf,
          montant_usd,
          posteBudgetaire: 'Solde initial',
          designation: 'Solde initial',
          justificatif: 'Création de la caisse',
          status: 'validé',
          aJustifier: false,
          estCorrection: false,
          typeCorrection: null,
          remplaceParCorrection: false,
          annule: false,
          parentId: null,
          correctionParentId: null,
          factureId: null,
          commentaire: null,
          montant_converti_facture: null,
          dateCreation: new Date().toISOString()
        };
        await db.mouvementsCaisse.add(mouvementData);
      }
    },
    async supprimerCaisse(id) {
      const confirmation = confirm(
        "Supprimer cette caisse ?\n" +
        "Cliquez sur OK pour supprimer définitivement toutes les écritures associées.\n" +
        "Cliquez sur Annuler pour conserver les écritures (elles seront dissociées de la caisse)."
      );
      const supprimerEcritures = confirmation; // true si OK
      
      try {
        const sous = await db.sous_caisses.where('caisseId').equals(id).toArray();
        for (let sc of sous) {
          const mouvements = await db.mouvementsCaisse.where('sousCaisseId').equals(sc.id).toArray();
          if (supprimerEcritures) {
            for (let m of mouvements) {
              await apiService.supprimer('mouvementsCaisse', m.id);
            }
          } else {
            for (let m of mouvements) {
              await apiService.modifier('mouvementsCaisse', m.id, { caisseId: null, sousCaisseId: null });
            }
          }
          await apiService.supprimer('sous_caisses', sc.id);
        }
        await db.caisse_utilisateurs.where('caisseId').equals(id).delete();
        await apiService.supprimer('caisses', id);
        await this.chargerDonnees();
        alert('Caisse supprimée');
      } catch (error) {
        console.error(error);
        alert('Erreur lors de la suppression');
      }
    },
    
    ajouterCaisse() {
      this.caisseModal = {
        id: null,
        nom: '',
        active: true,
        responsableId: this.utilisateurs.length ? this.utilisateurs[0].id : ''
      };
    },

    // ========== BANQUES ==========
    ajouterCompte() {
      const nouveauCompte = {
        id: crypto.randomUUID(),
        nom: 'Nouveau compte',
        titulaire: '',
        numero: '',
        devise: 'CDF',
        solde_initial: 0
      };
      db.comptes_bancaires.add(nouveauCompte).then(() => this.chargerComptes());
    },

    async supprimerCompteBancaire(id) {
      if (!confirm('Supprimer ce compte bancaire ? Tous les imports et mouvements associés seront également supprimés.')) return;
      const mouvements = await db.mouvements_bancaires.where('compte_id').equals(id).toArray();
      for (let m of mouvements) await db.mouvements_bancaires.delete(m.id);
      const imports = await db.imports_bancaires.where('compte_id').equals(id).toArray();
      for (let i of imports) await db.imports_bancaires.delete(i.id);
      const regles = await db.regles_affectation.where('compte_id').equals(id).toArray();
      for (let r of regles) await db.regles_affectation.delete(r.id);
      await db.comptes_bancaires.delete(id);
      await this.chargerComptes();
      await this.chargerRegles();
    },

    async sauvegarderComptes() {
      for (let compte of this.comptesBancaires) {
        await db.comptes_bancaires.update(compte.id, compte);
      }
      alert('Comptes bancaires sauvegardés');
    },

    ajouterRegle() {
      const nouvelleRegle = {
        id: crypto.randomUUID(),
        compte_id: this.comptesBancaires.length ? this.comptesBancaires[0].id : '',
        mot_cle: '',
        poste_id: '',
        actif: true
      };
      db.regles_affectation.add(nouvelleRegle).then(() => this.chargerRegles());
    },

    async supprimerRegle(id) {
      if (!confirm('Supprimer cette règle d\'affectation ?')) return;
      await db.regles_affectation.delete(id);
      await this.chargerRegles();
    },

    async sauvegarderRegles() {
      for (let regle of this.reglesAffectation) {
        await db.regles_affectation.update(regle.id, regle);
      }
      alert('Règles d\'affectation sauvegardées');
    },

    // Méthodes utilitaires pour Banques (à ajouter si absentes)
    async chargerComptes() {
      this.comptesBancaires = await db.comptes_bancaires.toArray();
    },

    async chargerRegles() {
      this.reglesAffectation = await db.regles_affectation.toArray();
    },

    // ========== POSTES BUDGÉTAIRES ==========
    async ouvrirModalAffectations(poste) {
        this.posteAffectation = poste;
        this.affectationsProjetTemp = [];
        const affs = await db.affectations_analytiques.where({ posteId: poste.id }).toArray();
        const affsGlobales = affs.filter(a => !a.departement);
        const affsDepartements = affs.filter(a => a.departement);
        const projetsIds = [...new Set(affs.map(a => a.projetId))];
        for (const projetId of projetsIds) {
            const affGlob = affsGlobales.find(a => a.projetId === projetId);
            const pourcentage = affGlob ? affGlob.pourcentage : 0;
            const departements = affsDepartements
                .filter(a => a.projetId === projetId)
                .map(a => ({ departement: a.departement, pourcentage: a.pourcentage }));
            this.affectationsProjetTemp.push({
                projetId,
                pourcentage,
                showDetails: departements.length > 0,
                departements
            });
        }
        this.showModalAffectations = true;
    },
    postesRemplacement(poste) {
        if (!poste) return [];
        return this.postesBudgetaires.filter(p => 
            p.id !== poste.id &&
            p.type === poste.type &&
            p.actif &&
            (p.systeme === false || p.nom.startsWith('Salaire - '))
        );
    },
    async confirmerSuppressionPoste(poste) {
        // Vérifier si le poste est utilisé
        const nbCaisse = await db.mouvementsCaisse.where('posteBudgetaire').equals(poste.nom).count();
        const nbManuelles = await db.ecritures_manuelles.where('posteBudgetaire').equals(poste.nom).count();
        const nbTotal = nbCaisse + nbManuelles;

        if (nbTotal > 0) {
            this.posteASupprimer = poste;
            this.posteRemplacementId = '';
            this.showModalSuppressionPoste = true;
        } else {
            if (confirm(`Supprimer définitivement le poste « ${poste.nom} » ?`)) {
                await this.supprimerPosteBudget(poste);
            }
        }
    },
    async supprimerPosteAvecTransfert() {
        if (!this.posteRemplacementId) {
            alert('Veuillez choisir un poste de remplacement.');
            return;
        }
        const ancienPoste = this.posteASupprimer;
        const ancienNom = ancienPoste.nom;
        const nouveauPoste = this.postesBudgetaires.find(p => p.id === this.posteRemplacementId);
        const nouveauNom = nouveauPoste.nom;
        const nouveauId = nouveauPoste.id;

        // 1. Mettre à jour mouvements de caisse (utilisent le nom du poste)
        const mvtsCaisse = await db.mouvementsCaisse.where('posteBudgetaire').equals(ancienNom).toArray();
        for (const mvt of mvtsCaisse) {
            await db.mouvementsCaisse.update(mvt.id, { posteBudgetaire: nouveauNom });
        }

        // 2. Mettre à jour écritures manuelles (utilisent le nom du poste)
        const mvtsManuels = await db.ecritures_manuelles.where('posteBudgetaire').equals(ancienNom).toArray();
        for (const mvt of mvtsManuels) {
            await db.ecritures_manuelles.update(mvt.id, { posteBudgetaire: nouveauNom });
        }

        // 3. Mettre à jour mouvements bancaires (utilisent poste_id)
        const mvtsBanque = await db.mouvements_bancaires.where('poste_id').equals(ancienPoste.id).toArray();
        for (const mvt of mvtsBanque) {
            await db.mouvements_bancaires.update(mvt.id, { poste_id: nouveauId });
        }

        // 4. Mettre à jour les budgets prévisionnels si existants
        const versions = await db.budget_versions.toArray();
        for (const version of versions) {
            if (version.donnees && version.donnees[ancienPoste.id] !== undefined) {
                version.donnees[nouveauId] = version.donnees[ancienPoste.id];
                delete version.donnees[ancienPoste.id];
                await db.budget_versions.update(version.id, { donnees: version.donnees });
            }
        }

        // 5. Mettre à jour les affectations analytiques
        await db.affectations_analytiques.where('posteId').equals(ancienPoste.id).modify({ posteId: nouveauId });

        // 6. Supprimer le poste
        await db.postes_budgetaires.delete(ancienPoste.id);
        this.postesBudgetairesSettings = this.postesBudgetairesSettings.filter(p => p.id !== ancienPoste.id);

        this.showModalSuppressionPoste = false;
        alert(`Poste « ${ancienNom} » supprimé. Toutes les écritures ont été transférées vers « ${nouveauNom} ».`);
    },
    async supprimerPosteBudget(poste) {
        // Suppression directe (sans écritures)
        await db.postes_budgetaires.delete(poste.id);
        this.postesBudgetairesSettings = this.postesBudgetairesSettings.filter(p => p.id !== poste.id);
        alert(`Poste « ${poste.nom} » supprimé.`);
    },
    ajouterAffectationProjet() {
        this.affectationsProjetTemp.push({ projetId: '', pourcentage: 0, showDetails: false, departements: [] });
    },
    supprimerAffectationProjet(index) {
        this.affectationsProjetTemp.splice(index, 1);
    },
    triPostes(col) {
        if (this.triDepensesCol === col) {
            this.triDepensesOrdre = this.triDepensesOrdre === 'asc' ? 'desc' : 'asc';
        } else {
            this.triDepensesCol = col;
            this.triDepensesOrdre = 'asc';
        }
        if (this.triRevenusCol === col) {
            this.triRevenusOrdre = this.triRevenusOrdre === 'asc' ? 'desc' : 'asc';
        } else {
            this.triRevenusCol = col;
            this.triRevenusOrdre = 'asc';
        }
    },
    toggleDetailsProjet(index) {
        this.affectationsProjetTemp[index].showDetails = !this.affectationsProjetTemp[index].showDetails;
    },
    ajouterDepartementProjet(idx) {
        this.affectationsProjetTemp[idx].departements.push({ departement: '', pourcentage: 0 });
    },
    supprimerDepartementProjet(idx, dIdx) {
        this.affectationsProjetTemp[idx].departements.splice(dIdx, 1);
    },
    verifierSommeProjets() {
        const somme = this.sommeProjets;
        if (somme !== 100) alert('La somme des pourcentages projets doit être 100%');
    },

    verifierSommeDepartements(idx) {
      const somme = this.sommeDepartements(idx);
      if (somme !== 100) alert('La somme des pourcentages départements pour ce projet doit être 100%');
    },
    async enregistrerAffectations() {
        if (this.sommeProjets !== 100) {
            alert('La somme des pourcentages des projets doit être exactement 100%.');
            return;
        }
        for (let i = 0; i < this.affectationsProjetTemp.length; i++) {
            const aff = this.affectationsProjetTemp[i];
            if (aff.departements.length > 0 && this.sommeDepartements(i) !== 100) {
                alert(`Pour le projet sélectionné, la somme des départements doit être 100%.`);
                return;
            }
        }
        // Supprimer les anciennes affectations pour ce poste
        await db.affectations_analytiques.where('posteId').equals(this.posteAffectation.id).delete();
        // Insérer les nouvelles
        for (const aff of this.affectationsProjetTemp) {
            // Ligne projet (sans département)
            await db.affectations_analytiques.add({
                id: crypto.randomUUID(),
                posteId: this.posteAffectation.id,
                projetId: aff.projetId,
                departement: null,
                pourcentage: aff.pourcentage
            });
            // Lignes départements
            for (const dep of aff.departements) {
                await db.affectations_analytiques.add({
                    id: crypto.randomUUID(),
                    posteId: this.posteAffectation.id,
                    projetId: aff.projetId,
                    departement: dep.departement,
                    pourcentage: dep.pourcentage
                });
            }
        }
        alert('Affectations enregistrées.');
        this.showModalAffectations = false;
    },
    
    async chargerPostesBudget() {
      this.postesBudgetairesSettings = await db.postes_budgetaires.toArray();
    },

    ajouterPosteBudget() {
      const nouveau = {
        id: 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        nom: 'Nouveau poste',
        type: 'sortie',
        lieFacture: false,
        estRetraitBancaire: false,
        actif: true,
        systeme: false,
        typeComptable: 'charge',   // valeur par défaut cohérente avec type 'sortie'
        estSalaire: false,
        isNew: true
      };
      this.postesBudgetairesSettings.push(nouveau);
    },


    async sauvegarderPostesBudget() {
      // 1. Récupérer une copie des postes avant modification pour détecter les renommages
      const postesOriginaux = await db.postes_budgetaires.toArray();
      const mapOriginaux = {};
      postesOriginaux.forEach(p => { mapOriginaux[p.id] = p; });

      // 2. Sauvegarder chaque poste (création ou mise à jour)
      for (let p of this.postesBudgetairesSettings) {
        if (p.isNew) {
          // Nouveau poste : supprimer le flag temporaire et ajouter
          const { isNew, id, ...posteData } = p;
          await apiService.ajouter('postes_budgetaires', posteData, { audit: true });
        } else {
          // Poste existant : mise à jour
          await apiService.modifier('postes_budgetaires', p.id, p, { audit: true });
        }
      }

      // 3. Recharger la liste depuis la base
      await this.chargerPostesBudget();

      // 4. Détecter les postes renommés et propager les changements
      for (let p of this.postesBudgetairesSettings) {
        if (p.isNew) continue;

        const original = mapOriginaux[p.id];
        if (!original) continue;

        const ancienNom = original.nom;
        const nouveauNom = p.nom;

        if (ancienNom !== nouveauNom) {
          console.log(`Propagation du renommage du poste "${ancienNom}" → "${nouveauNom}"`);

          // Mettre à jour les mouvements de caisse
          const mouvementsCaisse = await db.mouvementsCaisse.where('posteBudgetaire').equals(ancienNom).toArray();
          for (let m of mouvementsCaisse) {
            await apiService.modifier('mouvementsCaisse', m.id, { posteBudgetaire: nouveauNom });
          }

          // Mettre à jour les budgets prévisionnels (optionnel)
          const budgets = await db.budgets.where('poste').equals(ancienNom).toArray();
          for (let b of budgets) {
            await apiService.modifier('budgets', b.id, { poste: nouveauNom });
          }
        }
      }

      alert('Postes budgétaires sauvegardés avec succès.');
    },

    async annulerModificationsPostes() {
      if (!confirm('Abandonner les modifications en cours ?')) return;
      await this.chargerPostesBudget();
    },

    // =========== IMPOTS ET CHARGES SOCIALES ======================
    convertToDecimal(field) {
        this.chargesParams.taux[field] = this.chargesParams.taux[field] / 100;
    },

    ajouterTrancheIPR() {
        const dernier = this.chargesParams.bareme_ipr_annuel.pop();
        this.chargesParams.bareme_ipr_annuel.push({ plafond: 0, taux: 0 });
        this.chargesParams.bareme_ipr_annuel.push(dernier);
    },

    supprimerTrancheIPR(index) {
        if (this.chargesParams.bareme_ipr_annuel.length > 1) {
            this.chargesParams.bareme_ipr_annuel.splice(index, 1);
        }
    },

    async sauvegarderParamsCharges() {
        const paramsCopy = JSON.parse(JSON.stringify(this.chargesParams));
        // Convertir les % en décimal
        paramsCopy.taux.cnss_salarial /= 100;
        paramsCopy.taux.cnss_patronal /= 100;
        paramsCopy.taux.inpp /= 100;
        paramsCopy.taux.onem /= 100;
        paramsCopy.bareme_ipr_annuel.forEach(t => t.taux /= 100);
        
        await db.reglages.where('cle').equals('parametres_charges_sociales').delete();
        await apiService.ajouter('reglages', { cle: 'parametres_charges_sociales', valeur: paramsCopy });
        alert('Paramètres des impôts et charges enregistrés');
    },

    async chargerParamsCharges() {
        const reg = await db.reglages.where('cle').equals('parametres_charges_sociales').first();
        if (reg) {
            this.chargesParams = reg.valeur;
            // Conversion en % pour affichage
            this.chargesParams.taux.cnss_salarial *= 100;
            this.chargesParams.taux.cnss_patronal *= 100;
            this.chargesParams.taux.inpp *= 100;
            this.chargesParams.taux.onem *= 100;
            this.chargesParams.bareme_ipr_annuel.forEach(t => t.taux *= 100);
        }
    },

    // ========== TAUX DE CHANGE ==========
    async remplirDatesSansTaux() {
        let dernierTaux = null;
        const aujourdhui = new Date(this.dateAujourdhui);
        const dateCourante = new Date(this.anneeTaux, 0, 1);

        while (dateCourante <= aujourdhui) {
            const dateStr = dateCourante.toISOString().slice(0, 10);

            // Déterminer le taux à appliquer
            const tauxExistant = await db.taux_change.where('date').equals(dateStr).first();
            let tauxApplique = tauxExistant ? tauxExistant.taux : null;

            if (!tauxApplique) {
                // Pas de taux en base → utiliser le dernier connu ou 2500
                if (this.tauxParJour[dateStr]) {
                    tauxApplique = this.tauxParJour[dateStr];
                    dernierTaux = tauxApplique;
                } else if (dernierTaux) {
                    tauxApplique = dernierTaux;
                } else {
                    tauxApplique = 2500;
                }

                // Mettre à jour la map locale
                this.tauxParJour[dateStr] = tauxApplique;

                // Enregistrer le taux dans la base
                await db.taux_change.add({
                    id: crypto.randomUUID(),
                    date: dateStr,
                    taux: tauxApplique
                });

                // Recalculer les écritures de cette date avec le nouveau taux
                await recalculerEcrituresDate(dateStr, tauxApplique);
            } else {
                // Taux déjà existant en base → on met à jour dernierTaux si nécessaire
                dernierTaux = tauxApplique;
                if (!this.tauxParJour[dateStr]) {
                    this.tauxParJour[dateStr] = tauxApplique;
                }
            }

            dateCourante.setDate(dateCourante.getDate() + 1);
        }
        this.$forceUpdate();
        alert('Dates sans taux remplies, écritures recalculées.');
    },
    async sauvegarderTaux() {
        const dateStrBase = `${this.anneeTaux}-${String(this.moisTaux).padStart(2, '0')}`;
        for (let jour of this.joursMois) {
            const dateStr = `${dateStrBase}-${String(jour).padStart(2, '0')}`;
            const taux = this.tauxParJour[dateStr];
            if (taux === undefined) continue;

            // Enregistrement du taux
            const existant = await db.taux_change.where('date').equals(dateStr).first();
            if (existant) {
                // Si le taux a changé, on met à jour et on recalcul les écritures
                if (existant.taux !== taux) {
                    await apiService.modifier('taux_change', existant.id, { taux }, { audit: true });
                    await recalculerEcrituresDate(dateStr, taux);
                }
            } else {
                await apiService.ajouter('taux_change', { id: crypto.randomUUID(), date: dateStr, taux }, { audit: true });
                // Un nouveau taux a été ajouté pour une date qui n'en avait pas → recalcul
                await recalculerEcrituresDate(dateStr, taux);
            }
        }
        alert(`Taux du mois ${this.moisNoms[this.moisTaux - 1]} ${this.anneeTaux} sauvegardés.`);
        await this.chargerTaux();
    },
    appliquerTauxPeriode() {
      if (this.periodeDebut === null || this.periodeFin === null || this.tauxPeriode === null) return alert("Période ou taux invalide.");
      for (let jour = this.periodeDebut; jour <= this.periodeFin; jour++) {
        const dateStr = `${this.anneeTaux}-${String(this.moisTaux).padStart(2,'0')}-${String(jour).padStart(2,'0')}`;
        this.tauxParJour[dateStr] = this.tauxPeriode;
      }
      this.$forceUpdate();
    },
  }
};
</script>
<style scoped>
.no-spinner::-webkit-outer-spin-button,
.no-spinner::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
.no-spinner[type=number] {
    -moz-appearance: textfield;
}
.table-responsive thead th {
    position: sticky;
    top: 0;
    background-color: #fff;
    z-index: 2;
}
</style>
