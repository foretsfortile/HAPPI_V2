let allScenarios = null;
let currentScenarioId = null;
let currentStepIdx = 0;   // L'index de la ligne dans le JSON (S1, S2, S3)
let currentViewIdx = 0;   // L'index de la "tranche" dans la phase actuelle (0 ou 1)
let isIAMode = false;

// --- LE MOTEUR DE DÉTECTION DES VUES ---
function getViewConfig(phase, viewIdx) {
    // Phase 1 : MONO CULTURE
    if (phase === "MONO CULTURE") {
        return viewIdx === 0
            ? { panels: ['Zone_Tchate_A'], suffix: '_A' } // Tranche 1
            : { panels: ['Zone_Tchate_A', 'Zone_Commentaire_A'], suffix: '_A' }; // Tranche 2
    }
    // Phase 2 : TOUT-MONDE (Le Pivot)
    if (phase === "TOUT-MONDE") {
        return viewIdx === 0
            ? { panels: ['Zone_Commentaire_A', 'Zone_Commentaire_B'], suffix: '_B' } // Tranche 1
            : { panels: ['Zone_Commentaire_B', 'Zone_Tchate_B'], suffix: '_B' };    // Tranche 2
    }
    // Phase 3 : NOU PE PALE (L'aboutissement)
    if (phase === "NOU PE PALE") {
        return viewIdx === 0
            ? { panels: ['Zone_Tchate_B'], suffix: '_B' } // Tranche 1 (Intel/KPI/Log B)
            : { panels: ['Zone_Tchate_A', 'Zone_Tchate_B'], suffix: '_B' }; // FINAL (Synchro)
    }
    return { panels: [], suffix: '_A' };
}

function renderStep() {
    const scn = allScenarios[currentScenarioId];
    const step = scn.steps[currentStepIdx];
    const phase = step.Step_Phase;

    // Récupération de la configuration visuelle via le programme
    const config = getViewConfig(phase, currentViewIdx);

    // Mise à jour du titre
    document.getElementById('scenario-name').innerText = `${phase} - Tranche ${currentViewIdx + 1}`;

    // 1. Impression des Panneaux (Tranches)
    const actionBox = document.getElementById('box-action');
    actionBox.innerHTML = "";
    config.panels.forEach(key => {
        const pane = document.createElement('div');
        const sideClass = key.endsWith('_A') ? 'pane-a' : 'pane-b';
        pane.className = `panneau-tranche ${sideClass}`;

        // RÈGLE : On imprime ce qu'il y a, même si c'est "(vide)"
        const content = step[key] || "";
        pane.innerHTML = `<div class="pane-label">${key.replace('Zone_', '').replace('_', ' ')}</div>${content}`;
        actionBox.appendChild(pane);
    });

    // 2. Impression Intelligence, Log et KPI (Suivent le suffixe de la config)
    const sfx = config.suffix;
    document.getElementById('smart-content').innerHTML = step['Zone_Intel' + sfx] || "";

    const logContent = step['Zone_Log' + sfx] || "";
    const kpiContent = step['Zone_KPI' + sfx] ? `<div class="kpi-badge">KPI: ${step['Zone_KPI' + sfx]}</div>` : "";

    document.getElementById('matrix-logs').innerHTML = `
        <div class="log-entry">${logContent}</div>
        ${kpiContent}
    `;
}

// --- NAVIGATION LOGIQUE ---
document.getElementById('nextBtn').onclick = () => {
    const scn = allScenarios[currentScenarioId];
    // On avance dans les tranches (0 -> 1) avant de changer de ligne JSON
    if (currentViewIdx < 1) {
        currentViewIdx++;
    } else {
        if (currentStepIdx < scn.steps.length - 1) {
            currentStepIdx++;
            currentViewIdx = 0;
        }
    }
    renderStep();
};

// Fonction REPRISE (Remise à zéro totale)
document.getElementById('stopBtn').onclick = () => {
    currentStepIdx = 0;
    currentViewIdx = 0;
    renderStep();
};