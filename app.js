let allScenarios = null;
let currentScenarioId = null;
let currentStepIdx = 0;   // Index de la ligne (S1, S2, S3)
let currentViewIdx = 0;   // Index de la tranche (0 ou 1)
let isIAMode = false;

// 1. CHARGEMENT INITIAL AVEC FORCE RELOAD
fetch('scenarios.json?v=' + Date.now())
    .then(r => r.json())
    .then(data => {
        allScenarios = data;
        populateSelect();
        setupControls();
    });

// 2. LOGIQUE DE STORYBOARD (Définit les 6 vues)
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

// 3. RENDU DYNAMIQUE
function renderStep() {
    const scn = allScenarios[currentScenarioId];
    const step = scn.steps[currentStepIdx];
    const config = getViewConfig(step.Step_Phase, currentViewIdx);

    // Titre de la Phase
    document.getElementById('scenario-name').innerText = `${step.Step_Phase} (${currentStepIdx + 1}/3)`;

    // Zone Action (Les panneaux centraux)
    const actionBox = document.getElementById('box-action');
    actionBox.innerHTML = "";
    config.panels.forEach(key => {
        const pane = document.createElement('div');
        const sideClass = key.endsWith('_A') ? 'pane-a' : 'pane-b';
        pane.className = `panneau-tranche ${sideClass}`;
        pane.innerHTML = `<div class="pane-label">${key.replace('Zone_', '').replace('_', ' ')}</div>${step[key] || ""}`;
        actionBox.appendChild(pane);
    });

    // Intelligence & Machinerie
    const sfx = config.suffix;
    document.getElementById('smart-content').innerHTML = step['Zone_Intel' + sfx] || step['Explication_SMART'] || "Analyse...";

    const logVal = step['Zone_Log' + sfx] || "Système OK";
    const kpiVal = step['Zone_KPI' + sfx] ? `<div style="color:#10b981;margin-top:10px;">KPI: ${step['Zone_KPI' + sfx]}</div>` : "";
    document.getElementById('matrix-logs').innerHTML = `<div class="log-entry">${logVal}</div>${kpiVal}`;
}

// 4. NAVIGATION
function setupControls() {
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

    document.getElementById('stopBtn').onclick = () => {
        currentStepIdx = 0;
        currentViewIdx = 0;
        renderStep();
    };

    const btnIA = document.getElementById('toggleIA');
    btnIA.onclick = () => {
        isIAMode = !isIAMode;
        btnIA.innerText = isIAMode ? "IA ON" : "IA OFF";
        btnIA.style.background = isIAMode ? "#10b981" : "#1e293b";
        populateSelect();
    };
}

function populateSelect() {
    const select = document.getElementById('scenario-select');
    select.innerHTML = '<option value="">-- Choisir un Scénario --</option>';
    Object.keys(allScenarios).forEach(id => {
        const scn = allScenarios[id];
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