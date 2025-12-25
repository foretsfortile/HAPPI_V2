let allScenarios = null;
let currentScenarioId = null;
let currentStepIdx = 0;
let currentViewIdx = 0;
let isIAMode = false;

// Chargement des données
fetch('scenarios.json?v=' + Date.now())
    .then(r => r.json())
    .then(data => {
        allScenarios = data;
        populateSelect();
        initEvents();
    });

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

function renderStep() {
    const step = allScenarios[currentScenarioId].steps[currentStepIdx];
    const config = getViewConfig(step.Step_Phase, currentViewIdx);

    document.getElementById('scenario-name').innerText = `${step.Step_Phase} - Vue ${currentViewIdx + 1}/2`;

    // Action Box
    const box = document.getElementById('box-action');
    box.innerHTML = config.panels.map(key => `
        <div class="panneau-tranche ${key.endsWith('_A') ? 'pane-a' : 'pane-b'}">
            <span class="pane-label">${key.replace('Zone_', '')}</span>
            ${step[key] || ""}
        </div>
    `).join('');

    // Intel & Logs
    const sfx = config.suffix;
    document.getElementById('smart-content').innerHTML = step['Zone_Intel' + sfx] || step['Explication_SMART'] || "Analyse...";
    document.getElementById('matrix-logs').innerHTML = `<div>${step['Zone_Log' + sfx] || "OK"}</div>`;
}

function initEvents() {
    document.getElementById('nextBtn').onclick = () => {
        const scn = allScenarios[currentScenarioId];
        if (currentViewIdx < 1) currentViewIdx++;
        else if (currentStepIdx < scn.steps.length - 1) { currentStepIdx++; currentViewIdx = 0; }
        renderStep();
    };

    document.getElementById('scenario-select').onchange = (e) => {
        currentScenarioId = e.target.value;
        currentStepIdx = 0; currentViewIdx = 0;
        if (currentScenarioId) renderStep();
    };
}

function populateSelect() {
    const select = document.getElementById('scenario-select');
    select.innerHTML = '<option value="">-- Choisir --</option>' +
        Object.keys(allScenarios)
            .filter(id => allScenarios[id].Scen_IA === isIAMode)
            .map(id => `<option value="${id}">${id} - ${allScenarios[id].Scen_Titre}</option>`).join('');
}