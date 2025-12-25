let allScenarios = null;
let currentScenarioId = null;
let currentStepIdx = 0;   // L'index de la ligne dans le JSON (S1, S2, S3)
let currentViewIdx = 0;   // L'index de la tranche dans la phase (0 ou 1)
let isIAMode = false;

// --- 1. CHARGEMENT AVEC ANTI-CACHE ---
// Le "?v=" force le navigateur à télécharger la version la plus récente
fetch('scenarios.json?v=' + Date.now())
    .then(r => {
        if (!r.ok) throw new Error("Erreur réseau");
        return r.json();
    })
    .then(data => {
        allScenarios = data;
        setupIAButton();
        populateSelect();
        console.log("Données chargées :", data);
    })
    .catch(err => console.error("Échec du chargement :", err));

// --- 2. LE MOTEUR DE STORYBOARD (VOTRE LOGIQUE) ---
function getViewConfig(phase, viewIdx) {
    // Phase 1 : MONO CULTURE
    if (phase === "MONO CULTURE") {
        return viewIdx === 0
            ? { panels: ['Zone_Tchate_A'], suffix: '_A' } // Tranche 1 : Tchate A + Intel/Log A
            : { panels: ['Zone_Tchate_A', 'Zone_Commentaire_A'], suffix: '_A' }; // Tranche 2 : Duo A
    }
    // Phase 2 : TOUT-MONDE
    if (phase === "TOUT-MONDE") {
        return viewIdx === 0
            ? { panels: ['Zone_Commentaire_A', 'Zone_Commentaire_B'], suffix: '_B' } // Tranche 1 : Comm A vs Comm B
            : { panels: ['Zone_Commentaire_B', 'Zone_Tchate_B'], suffix: '_B' };    // Tranche 2 : Comm B vs Tchate B
    }
    // Phase 3 : NOU PE PALE
    if (phase === "NOU PE PALE") {
        return viewIdx === 0
            ? { panels: ['Zone_Tchate_B'], suffix: '_B' } // Tranche 1 : Tchate B + Intel/KPI/Log B
            : { panels: ['Zone_Tchate_A', 'Zone_Tchate_B'], suffix: '_B' }; // FINAL : Synchro A/B
    }
    return { panels: [], suffix: '_A' };
}

// --- 3. RENDU SYSTÉMIQUE (Tranches, Intel, Log, KPI) ---
function renderStep() {
    const scn = allScenarios[currentScenarioId];
    const step = scn.steps[currentStepIdx];
    const config = getViewConfig(step.Step_Phase, currentViewIdx);

    // Titre de la Phase
    document.getElementById('scenario-name').innerText = `${step.Step_Phase} - Tranche ${currentViewIdx + 1}`;

    // Impression des Panneaux (Tranches)
    const actionBox = document.getElementById('box-action');
    actionBox.innerHTML = "";
    config.panels.forEach(key => {
        const pane = document.createElement('div');
        const sideClass = key.endsWith('_A') ? 'pane-a' : 'pane-b'; // Styles définis dans style.css
        pane.className = `panneau-tranche ${sideClass}`;
        pane.innerHTML = `<div class="pane-label">${key.replace('Zone_', '').replace('_', ' ')}</div>${step[key] || ""}`;
        actionBox.appendChild(pane);
    });

    // Impression Intelligence, Log et KPI
    const sfx = config.suffix;
    document.getElementById('smart-content').innerHTML = step['Zone_Intel' + sfx] || step['Explication_SMART'] || "";

    const logs = step['Zone_Log' + sfx] || "";
    const kpi = step['Zone_KPI' + sfx] ? `<div style="color:#10b981; margin-top:10px;">KPI: ${step['Zone_KPI' + sfx]}</div>` : "";
    document.getElementById('matrix-logs').innerHTML = `<div class="log-entry">${logs}</div>${kpi}`;
}

// --- 4. NAVIGATION ---
document.getElementById('nextBtn').onclick = () => {
    const scn = allScenarios[currentScenarioId];
    if (currentViewIdx < 1) {
        currentViewIdx++; // Passe à la 2ème tranche de la ligne JSON
    } else if (currentStepIdx < scn.steps.length - 1) {
        currentStepIdx++; // Passe à la ligne JSON suivante
        currentViewIdx = 0;
    }
    renderStep();
};

document.getElementById('stopBtn').onclick = () => {
    currentStepIdx = 0;
    currentViewIdx = 0;
    renderStep();
};

function setupIAButton() {
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
}

document.getElementById('scenario-select').onchange = (e) => {
    currentScenarioId = e.target.value;
    currentStepIdx = 0;
    currentViewIdx = 0;
    if (currentScenarioId) renderStep();
};