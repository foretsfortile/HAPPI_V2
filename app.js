// ==========================================================
// CONFIGURATION ET ÉTAT DE L'APPLICATION
// ==========================================================
let allScenarios = null;
let currentScenarioId = null;
let currentStepIdx = 0;   // Index de la ligne (S1, S2, S3)
let currentViewIdx = 0;   // Index de la vue dans la phase (0 ou 1)
let isIAMode = false;     // Initialisé à FALSE pour voir vos scénarios par défaut

// ==========================================================
// 1. CHARGEMENT DES DONNÉES (FETCH)
// ==========================================================
// On ajoute le timestamp pour éviter les problèmes de cache GitHub
fetch('scenarios.json?v=' + Date.now())
    .then(response => response.json())
    .then(data => {
        allScenarios = data;
        console.log("Données chargées :", allScenarios);
        populateSelect(); // Appel crucial après réception des données
        setupIAButton();
        setupNavigation();
    })
    .catch(err => {
        console.error("Erreur lors du chargement du JSON :", err);
        document.getElementById('matrix-logs').innerHTML = "ERREUR CHARGEMENT JSON";
    });

// ==========================================================
// 2. GESTION DU MENU DÉROULANT ET DU BOUTON IA
// ==========================================================
function populateSelect() {
    const select = document.getElementById('scenario-select');
    if (!select || !allScenarios) return;

    select.innerHTML = '<option value="">-- Choisir un Scénario --</option>';

    Object.keys(allScenarios).forEach(id => {
        const scenario = allScenarios[id];
        // On compare Scen_IA (du JSON) avec isIAMode (du JS)
        if (scenario.Scen_IA === isIAMode) {
            const opt = document.createElement('option');
            opt.value = id;
            opt.innerText = `${id} - ${scenario.Scen_Titre}`;
            select.appendChild(opt);
        }
    });
}

function setupIAButton() {
    const btnIA = document.getElementById('toggleIA');
    if (!btnIA) return;

    btnIA.onclick = () => {
        isIAMode = !isIAMode;
        btnIA.innerText = isIAMode ? "IA ON" : "IA OFF";
        // On rafraîchit la liste des scénarios disponibles
        populateSelect();
        // Reset de la vue si on change de mode
        resetDisplay();
    };
}

// ==========================================================
// 3. MOTEUR DE RENDU DES TRANCHES (LOGIQUE MIROIR)
// ==========================================================
function getViewConfig(phase, viewIdx) {
    // Cette logique assure que les bons panneaux s'affichent selon la phase
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
    if (!currentScenarioId || !allScenarios[currentScenarioId]) return;

    const scenario = allScenarios[currentScenarioId];
    const step = scenario.steps[currentStepIdx];
    const config = getViewConfig(step.Step_Phase, currentViewIdx);

    // Mise à jour du titre
    document.getElementById('scenario-name').innerText = `${step.Step_Phase} - Vue ${currentViewIdx + 1}/2`;

    // 1. Zone Action (Injection des tranches A et B)
    const actionBox = document.getElementById('box-action');
    actionBox.innerHTML = "";
    config.panels.forEach(