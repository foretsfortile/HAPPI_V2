// --- ÉTAT GLOBAL ---
let allScenarios = null;
let currentScenarioId = null;
let currentStepIdx = 0;
let currentViewIdx = 0;
let isIAMode = false;     // Initialisé selon votre préférence (IA OFF au départ)

// --- 1. CHARGEMENT ---
fetch('scenarios.json?v=' + Date.now())
    .then(r => r.json())
    .then(data => {
        // On nettoie l'objet si une clé "undefined" s'est glissée dedans
        if (data.undefined) delete data.undefined;
        allScenarios = data;
        initApp();
    })
    .catch(err => console.error("Erreur de lecture du fichier scenarios.json"));

// --- 2. INITIALISATION ---
function initApp() {
    populateSelect();

    document.getElementById('toggleIA').onclick = (e) => {
        isIAMode = !isIAMode;
        e.target.innerText = isIAMode ? "IA ON" : "IA OFF";
        populateSelect();
        resetDisplay();
    };

    document.getElementById('scenario-select').onchange = (e) => {
        currentScenarioId = e.target.value;
        currentStepIdx = 0;
        currentViewIdx = 0;
        if (currentScenarioId) renderStep();
    };

    document.getElementById('nextBtn').onclick = () => {
        if (!currentScenarioId) return;
        const steps = allScenarios[currentScenarioId].steps;

        // Navigation alternée (2 vues par étape)
        if (currentViewIdx < 1) {
            currentViewIdx++;
        } else if (currentStepIdx < steps.length - 1) {
            currentStepIdx++;
            currentViewIdx = 0;
        }
        renderStep();
    };

    document.getElementById('stopBtn').onclick = () => {
        currentStepIdx = 0;
        currentViewIdx = 0;
        if (currentScenarioId) renderStep();
    };
}

// --- 3. GESTION DU MENU ---
function populateSelect() {
    const select = document.getElementById('scenario-select');
    select.innerHTML = '<option value="">-- Choisir un Scénario --</option>';

    Object.keys(allScenarios).forEach(id => {
        const scn = allScenarios[id];
        // Filtrage strict : on ne montre que ce qui correspond à l'état du bouton IA
        if (scn.Scen_IA === isIAMode) {
            const opt = document.createElement('option');
            opt.value = id;
            opt.innerText = scn.Scen_Titre || id;
            select.appendChild(opt);
        }
    });
}

// --- 4. MOTEUR DE RENDU (Rigueur des clés) ---
function renderStep() {
    const scenario = allScenarios[currentScenarioId];
    const step = scenario.steps[currentStepIdx];

    // CORRECTION TITRE : On affiche la Phase (ex: MONO CULTURE) et non le message
    const phaseLabel = step.Step_Phase && step.Step_Phase !== "(vide)" ? step.Step_Phase : "Phase inconnue";
    document.getElementById('scenario-name').innerText = `${phaseLabel} - Vue ${currentViewIdx + 1}/2`;

    // LOGIQUE DE DISTRIBUTION (Mirror)
    let config = { panels: [], suffix: "_A" };
    const phase = String(step.Step_Phase).toUpperCase();

    if (phase.includes("MONO")) {
        config = { panels: currentViewIdx === 0 ? ['Zone_Tchate_A'] : ['Zone_Tchate_A', 'Zone_Commentaire_A'], suffix: "_A" };
    } else if (phase.includes("TOUT")) {
        config = { panels: currentViewIdx === 0 ? ['Zone_Commentaire_A', 'Zone_Commentaire_B'] : ['Zone_Commentaire_B', 'Zone_Tchate_B'], suffix: "_B" };
    } else if (phase.includes("PALE") || phase.includes("NOU")) {
        config = { panels: currentViewIdx === 0 ? ['Zone_Tchate_B'] : ['Zone_Tchate_A', 'Zone_Tchate_B'], suffix: "_B" };
    }

    // RENDU COLONNE ACTION
    const box = document.getElementById('box-action');
    box.innerHTML = config.panels.map(key => {
        const val = step[key];
        if (!val || val === "(vide)") return "";
        return `
            <div class="panneau-tranche ${key.endsWith('_B') ? 'pane-b' : ''}">
                <div class="pane-label">${key.replace('Zone_', '').replace('_', ' ')}</div>
                <div class="pane-text">${val}</div>
            </div>`;
    }).join('');

    // RENDU INTELLIGENCE & LOGS
    const intel = step['Zone_Intel' + config.suffix] || step['Explication_SMART'];
    document.getElementById('smart-content').innerHTML = (intel && intel !== "(vide)") ? intel : "Analyse en attente...";

    const logs = step['Zone_Log' + config.suffix];
    document.getElementById('matrix-logs').innerHTML = (logs && logs !== "(vide)") ? logs : "Système opérationnel";
}

function resetDisplay() {
    document.getElementById('scenario-name').innerText = "SÉLECTIONNEZ UN SCÉNARIO";
    document.getElementById('box-action').innerHTML = "";
    document.getElementById('smart-content').innerHTML = "En attente de données...";
    document.getElementById('matrix-logs').innerHTML = "Initialisation système...";
}