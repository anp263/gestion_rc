// services/calculCharges.js

/**
 * Convertit un barème annuel en barème mensuel
 */
export function mensualiserBareme(baremeAnnuel) {
    return baremeAnnuel.map(tranche => ({
        plafond: tranche.plafond === null ? null : tranche.plafond / 12,
        taux: tranche.taux
    }));
}

/**
 * Calcule l'IPR mensuel selon barème progressif mensuel
 */
export function calculerIPR(baseIPR, baremeMensuel, nbPersonnesCharge = 0) {
    let restant = baseIPR;
    let iprBrut = 0;

    for (const tranche of baremeMensuel) {
        if (restant <= 0) break;

        const montantTranche = tranche.plafond === null
            ? restant
            : Math.min(restant, tranche.plafond);

        iprBrut += montantTranche * tranche.taux;
        restant -= montantTranche;
    }

    // Réduction pour personnes à charge (2% par personne, max 9)
    const reduction = Math.min(nbPersonnesCharge, 9) * 0.02;
    let iprFinal = iprBrut * (1 - reduction);

    // Minimum de perception mensuel : 2000 CDF
    if (iprFinal < 2000) iprFinal = 2000;

    return iprFinal;
}

/**
 * Recherche le salaire brut par dichotomie jusqu'à correspondance exacte du net imposable
 */
export function trouverBrutDepuisNetImposable(
    netImposableCible,
    params,
    nbPersonnesCharge = 0
) {
    const { taux } = params;
    const baremeMensuel = mensualiserBareme(params.bareme_ipr_annuel);

    const calcNetImposable = (brut) => {
        const cnssSal = brut * taux.cnss_salarial;
        const baseIPR = brut - cnssSal;
        const ipr = calculerIPR(baseIPR, baremeMensuel, nbPersonnesCharge);
        return brut - cnssSal - ipr;
    };

    let brutMin = netImposableCible;
    let brutMax = netImposableCible * 2;
    let brutTest;
    let netCalcule;

    // Élargir la borne max si nécessaire
    while (calcNetImposable(brutMax) < netImposableCible) {
        brutMax *= 1.5;
    }

    // Dichotomie avec haute précision (jusqu'à 0,001 CDF)
    for (let i = 0; i < 200; i++) {
        brutTest = (brutMin + brutMax) / 2;
        netCalcule = calcNetImposable(brutTest);

        if (Math.abs(netCalcule - netImposableCible) < 0.001) {
            // Arrondir le brut à 2 décimales pour éviter les problèmes d'affichage
            return Math.round(brutTest * 100) / 100;
        }

        if (netCalcule < netImposableCible) {
            brutMin = brutTest;
        } else {
            brutMax = brutTest;
        }
    }

    // Si non convergé, retourner la meilleure approximation
    return Math.round(brutTest * 100) / 100;
}

/**
 * Calcule l'ensemble des charges et totaux pour un travailleur
 */
export function calculerTout(salaireBrut, params, nbPersonnesCharge = 0) {
    const { taux, indemnites_fixes } = params;
    const baremeMensuel = mensualiserBareme(params.bareme_ipr_annuel);

    const cnssSal = salaireBrut * taux.cnss_salarial;
    const baseIPR = salaireBrut - cnssSal;
    const ipr = calculerIPR(baseIPR, baremeMensuel, nbPersonnesCharge);

    const netImposable = salaireBrut - cnssSal - ipr;
    const netTotal = netImposable + indemnites_fixes.transport + indemnites_fixes.logement;

    const cnssPat = salaireBrut * taux.cnss_patronal;
    const inpp = salaireBrut * taux.inpp;
    const onem = salaireBrut * taux.onem;
    const totalChargesPatronales = cnssPat + inpp + onem;
    const coutTotalEmployeur = salaireBrut + totalChargesPatronales;

    return {
        salaireBrut: Math.round(salaireBrut * 100) / 100,
        cnssSal: Math.round(cnssSal * 100) / 100,
        baseIPR: Math.round(baseIPR * 100) / 100,
        ipr: Math.round(ipr * 100) / 100,
        netImposable: Math.round(netImposable * 100) / 100,
        indemnites: indemnites_fixes,
        netTotal: Math.round(netTotal * 100) / 100,
        cnssPat: Math.round(cnssPat * 100) / 100,
        inpp: Math.round(inpp * 100) / 100,
        onem: Math.round(onem * 100) / 100,
        totalChargesPatronales: Math.round(totalChargesPatronales * 100) / 100,
        coutTotalEmployeur: Math.round(coutTotalEmployeur * 100) / 100
    };
}