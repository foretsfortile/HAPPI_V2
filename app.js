let allScenarios = null;
let currentScenarioId = null;
let currentStepIdx = 0;
let isIAMode = false;
let autoTimer = null;

// --- 1. BOUTON IA ---
function setupIAButton() {
    const btnIA = document.getElementById('toggleIA');
    if (!btnIA) return;

    btnIA.onclick = () => {
        isIAMode = !isIAMode;
        btnIA.innerText = isIAMode ? "IA ON" : "IA OFF";
        // Utilise la classe CSS pour le passage au rouge
        btnIA.classList.toggle('ia-on', isIAMode);
        populateSelect();
    };
}

// --- 2. LOGIQUE DE MAPPING DYNAMIQUE ---
function getActiveZones(step, phaseName, config) {
    const allZoneKeys = Object.keys(step).filter(k => k.startsWith('Zone_')).sort();
    if (!config) return allZoneKeys.slice(0, 2);

    const phases = config.split(';').map(p => {
        const parts = p.replace('<', '').replace('>', '').split(':');
        return { name: parts[0].trim(), count: parseInt(parts[1]) };
    });

    let offset = 0;
    for (let p of phases) {
        if (p.name === phaseName) break;
        offset += (p.count - 1);
    }
    const currentPhase = phases.find(p => p.name === phaseName);
    const count = currentPhase ? currentPhase.count : 2;
    return allZoneKeys.slice(offset, offset + count);
}

// --- 3. CHARGEMENT & FILTRAGE ---
function populateSelect() {
    const select = document.getElementById('scenario-select');
    if (!select) return;
    select.innerHTML = '<option value="">-- Choisir un Scénario --</option>';

    if (!allScenarios) return;

    Object.keys(allScenarios).forEach(id => {
        const scn = allScenarios[id];
        if (scn.Scen_IA === isIAMode) {
            const opt = document.createElement('option');
            opt.value = id;
            opt.innerText = `${scn.Scen_ID || id} - ${scn.Scen_Titre || "Sans Titre"}`;
            select.appendChild(opt);
        }
    });
}

// --- 4. LE RENDU ---
function renderStep() {
    const scn = allScenarios[currentScenarioId];
    const step = scn.steps[currentStepIdx];

    document.getElementById('scenario-name').innerText = `${step.Step_Phase} (${currentStepIdx + 1}/${scn.steps.length})`;

    const actionBox = document.getElementById('box-action');
    actionBox.innerHTML = "";

    const keys = getActiveZones(step, step.Step_Phase, scn.Scen_Visualisation);
    keys.forEach(key => {
        const pane = document.createElement('div');
        pane.className = "panneau-tranche";
        pane.innerHTML = `<div class="pane-label">${key.replace('Zone_', '')}</div>${step[key] || ""}`;
        actionBox.appendChild(pane);
    });

    const suffix = isIAMode ? '_B' : '_A';
    document.getElementById('smart-content').innerHTML = step['Zone_Intel' + suffix] || step['Explication_SMART'] || "Analyse...";
    document.getElementById('matrix-logs').innerHTML = `<div class="log-entry">${step['Zone_Log' + suffix] || "Système OK"}</div>`;

    if (step.Step_Pause > 0) {
        clearTimeout(autoTimer);
        autoTimer = setTimeout(() => {
            if (currentStepIdx < scn.steps.length - 1) {
                currentStepIdx++;
                renderStep();
            }
        }, step.Step_Pause * 1000);
    }
}

// Initialisation
fetch('scenarios.json').then(r => r.json()).then(data => {
    allScenarios = data;
    setupIAButton();
    populateSelect();
});

document.getElementById('scenario-select').onchange = (e) => {
    currentScenarioId = e.target.value;
    currentStepIdx = 0;
    if (currentScenarioId) renderStep();
};

document.getElementById('nextBtn').onclick = () => {
    if (currentScenarioId && currentStepIdx < allScenarios[currentScenarioId].steps.length - 1) {
        currentStepIdx++;
        renderStep();
    }
};