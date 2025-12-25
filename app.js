let allScenarios = null;
let currentScenarioId = null;
let currentStepIdx = 0;
let isIAMode = false;
let autoTimer = null;

// --- 1. CONTRÔLE DE COHÉRENCE ---
function runPreFlightCheck(allData) {
    let report = [];
    Object.keys(allData).forEach(sId => {
        const scn = allData[sId];
        if (!scn.Scen_Visualisation) report.push(`[${sId}] Champ 'Scen_Visualisation' manquant.`);
        scn.steps.forEach((st, idx) => {
            if (!st.Step_Phase) report.push(`[${sId}] Step ${st.Step_ID || idx} : 'Step_Phase' manquant.`);
        });
    });

    if (report.length > 0) {
        const errorDiv = document.createElement('div');
        errorDiv.style = "background:#450a0a; color:#fca5a5; padding:20px; border-bottom:2px solid #ef4444; font-family:monospace; position:fixed; z-index:9999; width:100%;";
        errorDiv.innerHTML = `<h3>🚨 Erreurs JSON détectées</h3><ul>${report.map(e => `<li>${e}</li>`).join('')}</ul><button onclick="this.parentElement.remove()">Fermer</button>`;
        document.body.prepend(errorDiv);
        return false;
    }
    return true;
}

// --- 2. LOGIQUE DE MAPPING DYNAMIQUE ---
function getActiveZones(step, phaseName, config) {
    const allZoneKeys = Object.keys(step).filter(k => k.startsWith('Zone_')).sort();

    // Parse <PHASE:N>
    const phases = config.split(';').map(p => {
        const parts = p.replace('<', '').replace('>', '').split(':');
        return { name: parts[0], count: parseInt(parts[1]) };
    });

    let offset = 0;
    for (let p of phases) {
        if (p.name === phaseName) break;
        offset += (p.count - 1);
    }

    const currentPhase = phases.find(p => p.name === phaseName);
    return allZoneKeys.slice(offset, offset + (currentPhase ? currentPhase.count : 2));
}

// --- 3. CHARGEMENT & NAVIGATION ---
function populateSelect() {
    const select = document.getElementById('scenario-select');
    select.innerHTML = '<option value="">-- Choisir un Scénario --</option>';
    Object.keys(allScenarios).forEach(id => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.innerText = `${id} - ${allScenarios[id].Scen_Titre || "Sans Titre"}`;
        select.appendChild(opt);
    });
}

fetch('scenarios.json').then(r => r.json()).then(data => {
    if (runPreFlightCheck(data)) {
        allScenarios = data;
        populateSelect();
    }
});

document.getElementById('scenario-select').onchange = (e) => {
    currentScenarioId = e.target.value;
    currentStepIdx = 0;
    if (currentScenarioId) renderStep();
};

// --- 4. LE RENDU (RENDER) ---
function renderStep() {
    const scenario = allScenarios[currentScenarioId];
    const step = scenario.steps[currentStepIdx];

    // Mise à jour Titre et Phase
    document.getElementById('scenario-name').innerText = `${step.Step_Phase} (${currentStepIdx + 1}/${scenario.steps.length})`;

    const actionBox = document.getElementById('box-action');
    actionBox.innerHTML = ""; // On vide pour reconstruire les panneaux

    // Récupération des zones à afficher
    const keysToDisplay = getActiveZones(step, step.Step_Phase, scenario.Scen_Visualisation);

    keysToDisplay.forEach(key => {
        const pane = document.createElement('div');
        pane.className = "panneau-tranche";
        pane.innerHTML = `<div class="pane-label">${key.replace('Zone_', '')}</div>${step[key] || ""}`;
        actionBox.appendChild(pane);
    });

    // Intel & Logs (Dynamique selon le suffixe du step A ou B)
    const suffix = step.Step_Phase.includes('VIVRE') ? '_B' : '_A';
    document.getElementById('smart-content').innerHTML = step['Zone_Intel' + suffix] || step['Explication_SMART'] || "";
    document.getElementById('matrix-logs').innerHTML = `<div class="log-entry">${step['Zone_Log' + suffix] || ""}</div>`;

    // Gestion de la pause automatique (V3 Preview)
    if (step.Step_Pause > 0) {
        clearTimeout(autoTimer);
        autoTimer = setTimeout(() => {
            if (currentStepIdx < scenario.steps.length - 1) {
                currentStepIdx++;
                renderStep();
            }
        }, step.Step_Pause * 1000);
    }
}

document.getElementById('nextBtn').onclick = () => {
    const scenario = allScenarios[currentScenarioId];
    if (currentStepIdx < scenario.steps.length - 1) {
        currentStepIdx++;
        renderStep();
    }
};