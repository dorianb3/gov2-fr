// src/components/proposal-modal/ProposalFormState.js

// --------------
// Valeurs par défaut
// --------------
const INITIAL_ACTION = { title: "", description: "" };
const INITIAL_RISK = { risk: "", mitigation: "" };
const INITIAL_TIMELINE_STEP = { phase: "", description: "" };
const INITIAL_SOURCE = { url: "", label: "" };

export function createProposalFormState(mode, issueId, baseProposal = null) {
  // ------------------------------
  // 1. INITIALISATION DES CHAMPS
  // ------------------------------

  const initial = (() => {
    if (!baseProposal) {
      return {
        title: "",
        objectives: "",
        content: "",
        actions: [ { ...INITIAL_ACTION } ],
        meansText: "",
        timeline: [ { ...INITIAL_TIMELINE_STEP } ],
        risks: [ { ...INITIAL_RISK } ],
        territorial_scope: "",
        target_populations_text: "",
        impact_expected: "",
        estimated_cost: "",
        data_sources: [ { ...INITIAL_SOURCE } ],
      };
    }

    // MODE EDIT ou FORK : pré-remplir tous les champs
    return {
      title:
        mode === "fork"
          ? baseProposal.title + " — variante"
          : baseProposal.title || "",

      objectives: baseProposal.objectives || "",
      content: baseProposal.content || "",

      actions:
        baseProposal.actions?.length > 0
          ? baseProposal.actions.map(a => ({ ...a }))
          : [ { ...INITIAL_ACTION } ],

      meansText:
        baseProposal.means?.map(m => m.description).join("\n") || "",

      timeline:
        baseProposal.timeline?.length > 0
          ? baseProposal.timeline.map(t => ({ ...t }))
          : [ { ...INITIAL_TIMELINE_STEP } ],

      risks:
        baseProposal.risks?.length > 0
          ? baseProposal.risks.map(r => ({ ...r }))
          : [ { ...INITIAL_RISK } ],

      territorial_scope: baseProposal.territorial_scope || "",
      target_populations_text:
        baseProposal.target_populations?.join(", ") || "",

      impact_expected: baseProposal.impact_expected || "",
      estimated_cost: baseProposal.estimated_cost || "",

      data_sources:
        baseProposal.data_sources?.length > 0
          ? baseProposal.data_sources.map(s => ({ ...s }))
          : [ { ...INITIAL_SOURCE } ],
    };
  })();

  // ---------------------------------
  // État interne et setters
  // ---------------------------------
  let state = { ...initial };

  const set = (key, value) => {
    state[key] = value;
  };

  const updateListItem = (listKey, index, field, value) => {
    state[listKey] = state[listKey].map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
  };

  const addListItem = (listKey, template) => {
    state[listKey] = [...state[listKey], { ...template }];
  };

  const removeListItem = (listKey, index) => {
    if (state[listKey].length <= 1) return;
    state[listKey] = state[listKey].filter((_, i) => i !== index);
  };

  // ---------------------------------
  // VALIDATION
  // ---------------------------------
  const validateStep = (step) => {
    // Step 0 — Titre / objectifs
    if (step === 0) {
      if (!state.title.trim()) return "Le titre est obligatoire.";
      if (state.title.trim().length < 10)
        return "Le titre doit faire au moins 10 caractères.";
      if (!state.objectives.trim())
        return "Les objectifs sont obligatoires.";
      if (state.objectives.trim().length < 30)
        return "Les objectifs doivent être détaillés.";
    }

    // Step 1 — Actions
    if (step === 1) {
      const valid = state.actions.filter(
        a => a.title.trim() || a.description.trim()
      );
      if (valid.length === 0)
        return "Ajoute au moins une action concrète.";
    }

    // Step 2 — Description globale
    if (step === 2) {
      if (!state.content.trim())
        return "La description globale est obligatoire.";
    }

    // Step 3 — Risques
    if (step === 3) {
      const valid = state.risks.filter(r => r.risk.trim());
      if (valid.length === 0)
        return "Ajoute au moins un risque.";
    }

    // Step 4 — pas de validation forte
    return null;
  };

  const validateAll = () => {
    for (let step = 0; step <= 4; step++) {
      const err = validateStep(step);
      if (err) return err;
    }
    return null;
  };

  // ---------------------------------
  // BUILD PAYLOADS
  // ---------------------------------
  const buildCleanPayload = () => {
    const cleanedActions = state.actions
      .filter(a => a.title.trim() || a.description.trim())
      .map(a => ({
        title: a.title.trim(),
        description: a.description.trim(),
      }));

    const cleanedMeans = state.meansText
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean)
      .map(m => ({ description: m }));

    const cleanedTimeline = state.timeline
      .filter(t => t.phase.trim() || t.description.trim())
      .map(t => ({
        phase: t.phase.trim(),
        description: t.description.trim(),
      }));

    const cleanedRisks = state.risks
      .filter(r => r.risk.trim())
      .map(r => ({
        risk: r.risk.trim(),
        mitigation: r.mitigation.trim(),
      }));

    const cleanedSources = state.data_sources
      .filter(s => s.url.trim())
      .map(s => ({
        url: s.url.trim(),
        label: s.label.trim() || s.url.trim(),
      }));

    const targetPop = state.target_populations_text
      .split(",")
      .map(p => p.trim())
      .filter(Boolean);

    return {
      issue_id: issueId,
      title: state.title.trim(),
      objectives: state.objectives.trim(),
      content: state.content.trim(),
      actions: cleanedActions,
      means: cleanedMeans,
      timeline: cleanedTimeline,
      risks: cleanedRisks,
      territorial_scope:
        state.territorial_scope.trim() || null,
      target_populations: targetPop,
      impact_expected:
        state.impact_expected.trim() || null,
      estimated_cost:
        state.estimated_cost.trim() || null,
      data_sources: cleanedSources,
    };
  };

  const buildPayloadForCreate = () => buildCleanPayload();

  const buildPayloadForUpdate = () => buildCleanPayload();

  const buildPayloadForFork = () => {
    // En fork, on renvoie seulement les overrides modifiés.
    // Mais pour simplifier, on envoie tout — ton RPC ignore les champs identiques.
    return buildCleanPayload();
  };

  // ---------------------------------
  // EXPORT DES API DU STORE
  // ---------------------------------
  return {
    state,
    set,
    updateListItem,
    addListItem,
    removeListItem,
    validateStep,
    validateAll,
    buildPayloadForCreate,
    buildPayloadForUpdate,
    buildPayloadForFork,
    INITIAL_ACTION,
    INITIAL_RISK,
    INITIAL_TIMELINE_STEP,
    INITIAL_SOURCE,
  };
}
