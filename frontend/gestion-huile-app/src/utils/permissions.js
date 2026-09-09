// src/utils/permissions.js
import { db } from '../db';

export async function getRolePermissions(roleName) {
    try {
        console.log(`[PERMISSIONS] Recherche du rôle "${roleName}" dans reglages`);
        const reglages = await db.reglages.where('cle').equals('roles').first();
        console.log(`[PERMISSIONS] Résultat:`, reglages ? 'trouvé' : 'non trouvé');
        if (!reglages) return null;
        const roles = reglages.valeur;
        const role = roles.find(r => r.nom === roleName);
        return role?.permissions || null;
    } catch (error) {
        console.error('[PERMISSIONS] ERREUR LORS DE LA REQUÊTE:', error);
        console.error('[PERMISSIONS] Détails:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        // Relancer l'erreur pour qu'elle soit visible dans la console
        throw error;
    }
}

export async function hasPermission(user, module, niveau = 'ecriture') {
    if (!user) return false;
    const permissions = await getRolePermissions(user.role);
    if (!permissions) return false;
    const perm = permissions[module];
    if (niveau === 'lecture') {
        return perm === 'lecture' || perm === 'ecriture';
    }
    if (niveau === 'ecriture') {
        return perm === 'ecriture';
    }
    return false;
}