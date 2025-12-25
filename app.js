// --- VARIABLES GLOBALES ---
let allScenarios = null;
let currentScenarioId = null;
let currentStepIdx = 0;   // Index de la ligne (S1, S2, S3)
let currentViewIdx = 0;   // Index de la tranche (0 ou 1)
let isIAMode = false;

// --- 1. CHARGEMENT DES DONNÉES (FETCH) ---
// Ajout d'un paramètre date pour forcer le navigateur à ignorer le cache
fetch('scenarios.json?v=' + Date.now())
    .then(response => {
        if (!response.ok) throw new Error("Erreur de chargement du JSON");
        return response.json();
    })
    .then(data => {
        allScenarios = data;
        setupControls();
        populateSelect();
    })
    .catch(error => console.error("Erreur:", error));

// --- 2. CONFIGURATION DU STORYBOARD ---
// Ce programme définit ce qu'on "imprime" selon la phase
function getViewConfig(phase, viewIdx) {
    if (phase === "MONO CULTURE") {
        return viewIdx === 0
            ? { panels: ['Zone_Tchate_A'], suffix: '_A' }
            : { panels: ['Zone_Tchate_A', 'Zone_Commentaire_A'], suffix: '_A' };
    }
    if (phase === "TOUT-MONDE") {
        return viewIdx === 0
            ? { panels: ['Zone_Commentaire_A', 'Zone_Commentaire_B'], suffix: '_B' }
            : { panels: ['Zone_Commentaire_B', 'Zone_Tchate_B'], suffix: '_B' };
    }
    if (phase === "NOU PE PALE") {
        return viewIdx === 0
            ? { panels: ['Zone_Tchate_B'], suffix: '_B' }
            : { panels: ['Zone_Tchate_A', 'Zone_Tchate_B'], suffix: '_B' };
    }
    return { panels: [], suffix: '_A' };
}

// --- 3. LOGIQUE D'IMPRESSION ---
function renderStep() {
    if (!currentScenarioId) return;

    const scn = allScenarios[currentScenarioId];
    const step = scn.steps[currentStepIdx]; // Récupère S1, S2 ou S3
    const phase = step.Step_Phase;
    const config = getViewConfig(phase, currentViewIdx);

    // Titre et Phase
    document.getElementById('scenario-name').innerText = `${phase} (${currentStepIdx + 1}/${scn.steps.length})`;

    // Panneaux Centraux
    const actionBox = document.getElementById('box-action');
    actionBox.innerHTML = "";
    config.panels.forEach(key => {
        const pane = document.createElement('div');
        const sideClass = key.endsWith('_A') ? 'pane-a' : 'pane-b';
        pane.className = `panneau-tranche ${sideClass}`;

        // Impression brute (vide si vide dans le JSON)
        const content = step[key] || "";
        pane.innerHTML = `<div class="pane-label">${key.replace('Zone_', '').replace('_', ' ')}</div>${content}`;
        actionBox.appendChild(pane);
    });

    // Zones Systèmes (Intel, Log, KPI)
    const sfx = config.suffix;
    document.getElementById('smart-content').innerHTML = step['Zone_Intel' + sfx] || "";

    const logVal = step['Zone_Log' + sfx] || "";
    const kpiVal = step['Zone_KPI' + sfx] ? `<div class="kpi-badge">KPI: ${step['Zone_KPI' + sfx]}</div>` : "";

    document.getElementById('matrix-logs').innerHTML = `<div class="log-entry">${logVal}</div>${kpiVal}`;
}

// --- 4. NAVIGATION ET CONTRÔLES ---
function setupControls() {
    // Bouton IA
    const btnIA = document.getElementById('toggleIA');
    btnIA.onclick = () => {
        isIAMode = !isIAMode;
        btnIA.innerText = isIAMode ? "IA ON" : "IA OFF";
        btnIA.classList.toggle('ia-on', isIAMode);
        populateSelect(); // Filtre les scénarios selon le mode IA
    };

    // Bouton SUIVANT (Gère les tranches avant de changer de ligne)
    document.getElementById('nextBtn').onclick = () => {
        const scn = allScenarios[currentScenarioId];
        if (currentViewIdx < 1) {
            currentViewIdx++;
        } else if (currentStepIdx < scn.steps.length - 1) {
            currentStepIdx++;
            currentViewIdx = 0;
        }
        renderStep();
    };

    // Bouton REPRISE (Reset complet)
    document.getElementById('stopBtn').onclick = () => {
        currentStepIdx = 0;
        currentViewIdx = 0;
        renderStep();
    };
}

function populateSelect() {
    const select = document.getElementById('scenario-select');
    select.innerHTML = '<option value="">-- Choisir un Scénario --</option>';

    Object.keys(allScenarios).forEach(id => {
        const scn = allScenarios[id];
        // Filtrage par mode IA
        if (scn.Scen_IA === isIAMode) {
            const opt = document.createElement('option');
            opt.value = id;
            opt.innerText = `${scn.Scen_ID} - ${scn.Scen_Titre}`;
            select.appendChild(opt);
        }
    });

    select.onchange = (e) => {
        currentScenarioId = e.target.value;
        currentStepIdx = 0;
        currentViewIdx = 0;
        if (currentScenarioId) renderStep();
    };
}