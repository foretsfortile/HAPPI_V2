// --- VARIABLES D'ÉTAT ---
let allScenarios = null;
let currentScenarioId = null;
let currentStepIdx = 0;   // Index de la ligne dans le JSON (S1, S2, S3)
let currentViewIdx = 0;   // Index de la "tranche" dans la phase (0 ou 1)
let isIAMode = false;

// --- 1. CHARGEMENT INITIAL (FETCH) ---
// Utilisation de Date.now() pour forcer GitHub à ignorer le cache
fetch('scenarios.json?v=' + Date.now())
    .then(response => {
        if (!response.ok) throw new Error("Fichier JSON introuvable");
        return response.json();
    })
    .then(data => {
        allScenarios = data;
        setupUI(); // Initialise les boutons et le menu
        console.log("Système chargé avec succès.");
    })
    .catch(err => console.error("Erreur de chargement :", err));

// --- 2. LE MOTEUR DE DÉTECTION (STORYBOARD) ---
// Cette fonction définit précisément "quoi imprimer" pour chaque phase
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

// --- 3. RENDU DES DONNÉES ---
function renderStep() {
    if (!currentScenarioId || !allScenarios[currentScenarioId]) return;

    const scn = allScenarios[currentScenarioId];
    const step = scn.steps[currentStepIdx]; // Récupère S1, S2 ou S3
    const config = getViewConfig(step.Step_Phase, currentViewIdx);

    // Mise à jour du titre
    document.getElementById('scenario-name').innerText = `${step.Step_Phase} - Vue ${currentViewIdx + 1}/2`;

    // A. AFFICHAGE DES PANNEAUX (ZONE ACTION)
    const actionBox = document.getElementById('box-action');
    actionBox.innerHTML = "";
    config.panels.forEach(key => {
        const pane = document.createElement('div');
        const sideClass = key.endsWith('_A') ? 'pane-a' : 'pane-b';
        pane.className = `panneau-tranche ${sideClass}`;

        // On imprime la donnée brute du JSON
        const content = step[key] || "";
        pane.innerHTML = `<div class="pane-label">${key.replace('Zone_', '').replace('_', ' ')}</div>${content}`;
        actionBox.appendChild(pane);
    });

    // B. AFFICHAGE INTELLIGENCE & MACHINERIE
    const sfx = config.suffix; // _A ou _B selon la phase

    // Intelligence
    document.getElementById('smart-content').innerHTML = step['Zone_Intel' + sfx] || step['Explication_SMART'] || "Analyse en cours...";

    // Machinerie (Logs + KPI)
    const logText = step['Zone_Log' + sfx] || "Logs système OK";
    const kpiBadge = step['Zone_KPI' + sfx] ? `<div class="kpi-badge" style="color:#10b981; margin-top:10px; font-weight:bold;">KPI: ${step['Zone_KPI' + sfx]}</div>` : "";
    document.getElementById('matrix-logs').innerHTML = `<div class="log-entry">${logText}</div>${kpiBadge}`;
}

// --- 4. NAVIGATION ET CONTRÔLES ---
function setupUI() {
    const select = document.getElementById('scenario-select');
    const btnIA = document.getElementById('toggleIA');
    const btnNext = document.getElementById('nextBtn');
    const btnStop = document.getElementById('stopBtn');

    // Toggle IA
    btnIA.onclick = () => {
        isIAMode = !isIAMode;
        btnIA.innerText = isIAMode ? "IA ON" : "IA OFF";
        btnIA.style.background = isIAMode ? "#10b981" : "#1e293b";
        populateSelect(select);
    };

    // Sélection Scénario
    select.onchange = (e) => {
        currentScenarioId = e.target.value;
        currentStepIdx = 0;
        currentViewIdx = 0;
        if (currentScenarioId) renderStep();
    };

    // Bouton Suivant (Gère les 2 tranches par étape JSON)
    btnNext.onclick = () => {
        const scn = allScenarios[currentScenarioId];
        if (currentViewIdx < 1) {
            currentViewIdx++; // Passe à la 2ème tranche
        } else if (currentStepIdx < scn.steps.length - 1) {
            currentStepIdx++; // Passe à la ligne JSON suivante
            currentViewIdx = 0;
        }
        renderStep();
    };

    // Bouton Stop / Reprise
    btnStop.onclick = () => {
        currentStepIdx = 0;
        currentViewIdx = 0;
        renderStep();
    };

    populateSelect(select);
}

function populateSelect(select) {
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