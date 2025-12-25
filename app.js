let allScenarios = null;
let currentScenarioId = null;
let currentStepIdx = 0;
let currentViewIdx = 0;
let isIAMode = true; // On commence sur TRUE car votre scénario KREYOL est en Scen_IA: true

fetch('scenarios.json')
    .then(r => r.json())
    .then(data => {
        allScenarios = data;
        // On initialise l'affichage du bouton pour correspondre à l'état
        document.getElementById('toggleIA').innerText = "IA ON";
        populateSelect();
    });

function populateSelect() {
    const select = document.getElementById('scenario-select');
    if (!select) return;

    // On vide la liste actuelle
    select.innerHTML = '<option value="">-- Sélectionner un Scénario --</option>';

    // On parcourt les clés (ex: KREYOL_01)
    Object.keys(allScenarios).forEach(id => {
        const scn = allScenarios[id];

        // Comparaison stricte entre le bouton (isIAMode) et la donnée (scn.Scen_IA)
        if (scn.Scen_IA === isIAMode) {
            const opt = document.createElement('option');
            opt.value = id;
            opt.innerText = scn.Scen_Titre || id;
            select.appendChild(opt);
        }
    });

    console.log("Liste mise à jour pour IA =", isIAMode);
}

function renderStep() {
    const scenario = allScenarios[currentScenarioId];
    const step = scenario.steps[currentStepIdx];

    // Titre : On affiche le contenu de Step_Phase
    document.getElementById('scenario-name').innerText = step.Step_Phase + " - Vue " + (currentViewIdx + 1) + "/2";

    // Mapping des zones (S1 = Mono, S2 = Tout-Monde, S3 = Nou Pe Pale)
    let zones = [];
    if (currentStepIdx === 0) { // S1
        zones = currentViewIdx === 0 ? ['Zone_Tchate_A'] : ['Zone_Tchate_A', 'Zone_Commentaire_A'];
    } else if (currentStepIdx === 1) { // S2
        zones = currentViewIdx === 0 ? ['Zone_Commentaire_A', 'Zone_Commentaire_B'] : ['Zone_Commentaire_B', 'Zone_Tchate_B'];
    } else { // S3
        zones = currentViewIdx === 0 ? ['Zone_Tchate_B'] : ['Zone_Tchate_A', 'Zone_Tchate_B'];
    }

    const box = document.getElementById('box-action');
    box.innerHTML = zones.map(key => `
        <div class="panneau-tranche ${key.endsWith('_B') ? 'pane-b' : ''}">
            <div class="pane-label">${key}</div>
            ${step[key] || ""}
        </div>
    `).join('');

    document.getElementById('smart-content').innerHTML = step.Explication_SMART || "";
    document.getElementById('matrix-logs').innerHTML = step.Zone_Globale || "";
}

// Evenements simples
document.getElementById('scenario-select').onchange = (e) => {
    currentScenarioId = e.target.value;
    currentStepIdx = 0; currentViewIdx = 0;
    if (currentScenarioId) renderStep();
};

document.getElementById('nextBtn').onclick = () => {
    if (!currentScenarioId) return;
    if (currentViewIdx < 1) {
        currentViewIdx++;
    } else if (currentStepIdx < allScenarios[currentScenarioId].steps.length - 1) {
        currentStepIdx++;
        currentViewIdx = 0;
    }
    renderStep();
};

document.getElementById('toggleIA').onclick = function () {
    // 1. Inversion
    isIAMode = !isIAMode;

    // 2. Mise à jour visuelle du bouton
    this.innerText = isIAMode ? "MODE IA : ON" : "MODE IA : OFF";
    this.className = isIAMode ? "btn-ia-on" : "btn-ia-off"; // Si vous avez du CSS

    // 3. Rafraîchir la liste déroulante
    populateSelect();

    // 4. Reset de l'affichage en cours (optionnel, pour éviter les décalages)
    document.getElementById('box-action').innerHTML = "";
    document.getElementById('scenario-name').innerText = "Sélectionnez un scénario";
};