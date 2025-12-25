// --- ÉTAT GLOBAL ---
let allScenarios = null;
let currentScenarioId = null;
let currentStepIdx = 0;
let currentViewIdx = 0;
let isIAMode = false;

// --- 1. CHARGEMENT ---
fetch('scenarios.json?v=' + Date.now())
    .then(r => r.json())
    .then(data => {
        allScenarios = data;
        populateSelect();
        setupEvents();
    })
    .catch(err => console.error("Erreur JSON:", err));

// --- 2. LOGIQUE DE STORYBOARD ---
function getViewConfig(phase, viewIdx) {
    const configs = {
        "MONO CULTURE": [
            { panels: ['Zone_Tchate_A'], suffix: '_A' },
            { panels: ['Zone_Tchate_A', 'Zone_Commentaire_A'], suffix: '_A' }
        ],
        "TOUT-MONDE": [
            { panels: ['Zone_Commentaire_A', 'Zone_Commentaire_B'], suffix: '_B' },
            { panels: ['Zone_Commentaire_B', 'Zone_Tchate_B'], suffix: '_B' }
        ],
        "NOU PE PALE": [
            { panels: ['Zone_Tchate_B'], suffix: '_B' },
            { panels: ['Zone_Tchate_A', 'Zone_Tchate_B'], suffix: '_B' }
        ]
    };
    return configs[phase] ? configs[phase][viewIdx] : { panels: [], suffix: '_A' };
}

// --- 3. RENDU (CORRECTION TITRES & UNDEFINED) ---
function renderStep() {
    if (!currentScenarioId || !allScenarios[currentScenarioId]) return;

    const scenario = allScenarios[currentScenarioId];
    const step = scenario.steps[currentStepIdx];
    const config = getViewConfig(step.Step_Phase, currentViewIdx);

    // FIX : On affiche la Phase + Vue, pas le contenu du message dans le titre
    document.getElementById('scenario-name').innerText = `${step.Step_Phase} - Vue ${currentViewIdx + 1}/2`;

    // Rendu des panneaux (Miroir)
    const box = document.getElementById('box-action');
    box.innerHTML = "";
    config.panels.forEach(key => {
        const pane = document.createElement('div');
        const sideClass = key.endsWith('_A') ? 'pane-a' : 'pane-b';
        pane.className = `panneau-tranche ${sideClass}`;

        // On affiche proprement le contenu du JSON
        const content = step[key] || "";
        const label = key.replace('Zone_', '').replace('_', ' ');
        pane.innerHTML = `<div class="pane-label">${label}</div>${content}`;
        box.appendChild(pane);
    });

    // Intelligence & Machinerie
    const sfx = config.suffix;
    document.getElementById('smart-content').innerHTML = step['Zone_Intel' + sfx] || "Analyse en cours...";

    const logVal = step['Zone_Log' + sfx] || "Système opérationnel";
    const kpiVal = step['Zone_KPI' + sfx] ? `<div style="color:#10b981;margin-top:10px;">KPI: ${step['Zone_KPI' + sfx]}</div>` : "";
    document.getElementById('matrix-logs').innerHTML = `<div class="log-entry">${logVal}</div>${kpiVal}`;
}

// --- 4. NAVIGATION & ÉVÉNEMENTS ---
function populateSelect() {
    const select = document.getElementById('scenario-select');
    if (!select) return;

    select.innerHTML = '<option value="">-- Choisir un Scénario --</option>';
    Object.keys(allScenarios).forEach(id => {
        const scn = allScenarios[id];
        // FIX : Comparaison stricte avec Scen_IA du JSON
        if (scn.Scen_IA === isIAMode) {
            const opt = document.createElement('option');
            opt.value = id;
            // FIX : On n'affiche que le titre, pas l'ID technique
            opt.innerText = scn.Scen_Titre || id;
            select.appendChild(opt);
        }
    });
}

function setupEvents() {
    // Bouton IA
    const btnIA = document.getElementById('toggleIA');
    btnIA.onclick = () => {
        isIAMode = !isIAMode;
        btnIA.innerText = isIAMode ? "IA ON" : "IA OFF";
        populateSelect();
        resetView();
    };

    // Changement de scénario
    document.getElementById('scenario-select').onchange = (e) => {
        currentScenarioId = e.target.value;
        currentStepIdx = 0;
        currentViewIdx = 0;
        if (currentScenarioId) renderStep();
    };

    // Bouton Suivant
    document.getElementById('nextBtn').onclick = () => {
        if (!currentScenarioId) return;
        const scn = allScenarios[currentScenarioId];
        if (currentViewIdx < 1) {
            currentViewIdx++;
        } else if (currentStepIdx < scn.steps.length - 1) {
            currentStepIdx++;
            currentViewIdx = 0;
        }
        renderStep();
    };

    // Bouton Reprise
    document.getElementById('stopBtn').onclick = () => {
        currentStepIdx = 0;
        currentViewIdx = 0;
        if (currentScenarioId) renderStep();
    };
}

function resetView() {
    currentScenarioId = null;
    document.getElementById('scenario-name').innerText = "SÉLECTIONNEZ UN SCÉNARIO";
    document.getElementById('box-action').innerHTML = "";
    document.getElementById('smart-content').innerHTML = "En attente...";
    document.getElementById('matrix-logs').innerHTML = "Initialisation système...";
}