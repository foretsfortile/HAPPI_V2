let allScenarios = null;
let currentScenarioId = null;
let currentStepIdx = 0;
let currentViewIdx = 0;
let isIAMode = false;

// 1. Connexion aux données
fetch('scenarios.json')
    .then(r => r.json())
    .then(data => {
        allScenarios = data;
        populateSelect();
    });

// 2. Gestion du menu (Strictement calé sur Scen_IA et Scen_Titre)
function populateSelect() {
    const select = document.getElementById('scenario-select');
    select.innerHTML = '<option value="">-- Choisir --</option>';

    // On nettoie l'erreur "undefined" en vérifiant la clé
    Object.keys(allScenarios).forEach(id => {
        if (id === "undefined") return;
        const scn = allScenarios[id];
        if (scn.Scen_IA === isIAMode) {
            const opt = document.createElement('option');
            opt.value = id;
            opt.innerText = scn.Scen_Titre;
            select.appendChild(opt);
        }
    });
}

// 3. Moteur de rendu (Le "Miroir")
function renderStep() {
    const scenario = allScenarios[currentScenarioId];
    const step = scenario.steps[currentStepIdx];

    // Titre : Lit la Phase du JSON
    document.getElementById('scenario-name').innerText = `${step.Step_Phase} - (${currentViewIdx + 1}/2)`;

    // Logique de tranches : définit les zones à afficher
    let zones = [];
    let suffix = "_A";
    const phase = step.Step_Phase;

    if (phase.includes("MONO")) {
        zones = currentViewIdx === 0 ? ['Zone_Tchate_A'] : ['Zone_Tchate_A', 'Zone_Commentaire_A'];
        suffix = "_A";
    } else if (phase.includes("TOUT")) {
        zones = currentViewIdx === 0 ? ['Zone_Commentaire_A', 'Zone_Commentaire_B'] : ['Zone_Commentaire_B', 'Zone_Tchate_B'];
        suffix = "_B";
    } else {
        zones = currentViewIdx === 0 ? ['Zone_Tchate_B'] : ['Zone_Tchate_A', 'Zone_Tchate_B'];
        suffix = "_B";
    }

    // Affichage des boites d'action
    const box = document.getElementById('box-action');
    box.innerHTML = zones.map(key => `
        <div class="panneau-tranche ${key.endsWith('_B') ? 'pane-b' : 'pane-a'}">
            <div class="pane-label">${key.replace('Zone_', '')}</div>
            ${step[key] || ""}
        </div>
    `).join('');

    // Intel et Logs (utilise Explication_SMART si Zone_Intel est vide)
    document.getElementById('smart-content').innerHTML = step['Zone_Intel' + suffix] || step['Explication_SMART'] || "";
    document.getElementById('matrix-logs').innerHTML = step['Zone_Log' + suffix] || "OK";
}

// 4. Contrôles
document.getElementById('scenario-select').onchange = (e) => {
    currentScenarioId = e.target.value;
    currentStepIdx = 0; currentViewIdx = 0;
    if (currentScenarioId) renderStep();
};

document.getElementById('nextBtn').onclick = () => {
    if (!currentScenarioId) return;
    if (currentViewIdx < 1) { currentViewIdx++; }
    else if (currentStepIdx < allScenarios[currentScenarioId].steps.length - 1) {
        currentStepIdx++; currentViewIdx = 0;
    }
    renderStep();
};

document.getElementById('toggleIA').onclick = (e) => {
    isIAMode = !isIAMode;
    e.target.innerText = isIAMode ? "IA ON" : "IA OFF";
    populateSelect();
};