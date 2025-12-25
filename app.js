// --- ÉTAT DU SYSTÈME ---
let allScenarios = null;
let currentScenarioId = null;
let currentStepIdx = 0;   // L'étape (S1, S2, S3)
let currentViewIdx = 0;   // La vue (0 ou 1) pour le mode "Mirror"
let isIAMode = false;     // Par défaut à OFF

// --- 1. CHARGEMENT SÉCURISÉ ---
fetch('scenarios.json?v=' + Date.now())
    .then(r => r.json())
    .then(data => {
        allScenarios = data;
        initApp();
    })
    .catch(err => console.error("Erreur critique chargement JSON"));

// --- 2. INITIALISATION ---
function initApp() {
    const select = document.getElementById('scenario-select');
    const btnIA = document.getElementById('toggleIA');
    const btnNext = document.getElementById('nextBtn');
    const btnStop = document.getElementById('stopBtn');

    // Remplissage initial de la liste
    populateSelect();

    // Gestion du bouton IA (Simple et sans invention)
    btnIA.onclick = () => {
        isIAMode = !isIAMode;
        btnIA.innerText = isIAMode ? "IA ON" : "IA OFF";
        populateSelect();
    };

    // Sélection du scénario
    select.onchange = (e) => {
        currentScenarioId = e.target.value;
        currentStepIdx = 0;
        currentViewIdx = 0;
        if (currentScenarioId) renderStep();
    };

    // Navigation (Le fameux 2 vues par étape)
    btnNext.onclick = () => {
        if (!currentScenarioId) return;
        const steps = allScenarios[currentScenarioId].steps;

        if (currentViewIdx < 1) {
            currentViewIdx++;
        } else if (currentStepIdx < steps.length - 1) {
            currentStepIdx++;
            currentViewIdx = 0;
        }
        renderStep();
    };

    // Bouton Reset
    btnStop.onclick = () => {
        currentStepIdx = 0;
        currentViewIdx = 0;
        if (currentScenarioId) renderStep();
    };
}

// --- 3. FILTRAGE DU MENU ---
function populateSelect() {
    const select = document.getElementById('scenario-select');
    select.innerHTML = '<option value="">-- Choisir --</option>';

    Object.keys(allScenarios).forEach(id => {
        const scn = allScenarios[id];
        // On compare la clé Scen_IA du JSON avec notre état local
        if (scn.Scen_IA === isIAMode) {
            const opt = document.createElement('option');
            opt.value = id;
            opt.innerText = scn.Scen_Titre || id;
            select.appendChild(opt);
        }
    });
}

// --- 4. LE MOTEUR DE RENDU (L'affichage Mirror) ---
function renderStep() {
    const scenario = allScenarios[currentScenarioId];
    const step = scenario.steps[currentStepIdx];

    // Titre : Affiche la phase du JSON
    document.getElementById('scenario-name').innerText = `${step.Step_Phase} - (${currentViewIdx + 1}/2)`;

    // Logique de distribution des zones (Mirror)
    let zones = [];
    let suffix = "_A";

    if (step.Step_Phase === "MONO CULTURE") {
        zones = currentViewIdx === 0 ? ['Zone_Tchate_A'] : ['Zone_Tchate_A', 'Zone_Commentaire_A'];
        suffix = "_A";
    } else if (step.Step_Phase === "TOUT-MONDE") {
        zones = currentViewIdx === 0 ? ['Zone_Commentaire_A', 'Zone_Commentaire_B'] : ['Zone_Commentaire_B', 'Zone_Tchate_B'];
        suffix = "_B";
    } else {
        zones = currentViewIdx === 0 ? ['Zone_Tchate_B'] : ['Zone_Tchate_A', 'Zone_Tchate_B'];
        suffix = "_B";
    }

    // Affichage des panneaux d'action
    const box = document.getElementById('box-action');
    box.innerHTML = zones.map(key => {
        const val = step[key];
        if (!val || val === "(vide)") return "";
        return `
            <div class="panneau-tranche ${key.endsWith('_B') ? 'pane-b' : ''}">
                <div class="pane-label">${key.replace('Zone_', '').replace('_', ' ')}</div>
                ${val}
            </div>`;
    }).join('');

    // Intel & Logs
    document.getElementById('smart-content').innerHTML = step['Zone_Intel' + suffix] || step['Explication_SMART'] || "";
    document.getElementById('matrix-logs').innerHTML = step['Zone_Log' + suffix] || "OK";
}