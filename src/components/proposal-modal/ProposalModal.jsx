// src/components/modals/ProposalModal.jsx
import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {
  createProposal,
  updateProposal,
  forkProposal,
} from "../../services/proposalsService";

const INITIAL_ACTION = { title: "", description: "" };
const INITIAL_RISK = { risk: "", mitigation: "" };
const INITIAL_TIMELINE_STEP = { phase: "", description: "" };
const INITIAL_SOURCE = { url: "", label: "" };

/* ------------------------------------------------------------------ */
/* Sous-composants d'étape                                            */
/* ------------------------------------------------------------------ */

function StepIndicator({ step }) {
  const steps = [
    "Problème & objectifs",
    "Actions concrètes",
    "Description globale",
    "Risques & impacts",
    "Contexte & sources",
  ];

  return (
    <div className="flex items-center justify-between mb-4 text-xs sm:text-sm">
      {steps.map((label, idx) => (
        <div key={idx} className="flex-1 flex flex-col items-center">
          <div
            className={[
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold border",
              idx === step
                ? "bg-primary text-primary-foreground border-primary"
                : idx < step
                ? "bg-primary/80 text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-border",
            ].join(" ")}
          >
            {idx + 1}
          </div>
          <span
            className={[
              "mt-1 text-center",
              idx === step ? "font-semibold" : "text-muted-foreground",
            ].join(" ")}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function StepProblemObjectives({
  title,
  objectives,
  onChangeTitle,
  onChangeObjectives,
  errors,
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="proposal-title">Titre de la proposition</Label>
        <Input
          id="proposal-title"
          className="mt-1"
          value={title}
          onChange={onChangeTitle}
          placeholder="Ex : Renforcer la présence médicale dans les zones rurales"
        />
        {errors?.title && (
          <p className="mt-1 text-xs text-red-500">{errors.title}</p>
        )}
      </div>

      <div>
        <Label htmlFor="proposal-objectives">Objectifs</Label>
        <Textarea
          id="proposal-objectives"
          className="mt-1"
          rows={4}
          value={objectives}
          onChange={onChangeObjectives}
          placeholder="Qu’essaies-tu de résoudre précisément ? Quels résultats souhaites-tu obtenir ?"
        />
        {errors?.objectives && (
          <p className="mt-1 text-xs text-red-500">{errors.objectives}</p>
        )}
      </div>
    </div>
  );
}

function StepActions({
  actions,
  updateAction,
  addAction,
  removeAction,
  errors,
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Décris les actions concrètes qui composent ta proposition (plan
        d’exécution).
      </p>

      {actions.map((action, idx) => (
        <div
          key={idx}
          className="space-y-2 rounded-md border border-border p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <Label className="text-sm">Action {idx + 1}</Label>
            {actions.length > 1 && (
              <Button
                variant="ghost"
                size="xs"
                type="button"
                onClick={() => removeAction(idx)}
              >
                Supprimer
              </Button>
            )}
          </div>

          <Input
            className="mt-1"
            value={action.title}
            onChange={(e) => updateAction(idx, "title", e.target.value)}
            placeholder="Intitulé de l’action"
          />
          <Textarea
            className="mt-1"
            rows={3}
            value={action.description}
            onChange={(e) =>
              updateAction(idx, "description", e.target.value)
            }
            placeholder="Détaille comment cette action sera mise en œuvre."
          />
        </div>
      ))}

      {errors?.actions && (
        <p className="text-xs text-red-500">{errors.actions}</p>
      )}

      <Button type="button" variant="outline" size="sm" onClick={addAction}>
        + Ajouter une action
      </Button>
    </div>
  );
}

function StepDescriptionMeans({ content, means, onChangeContent, onChangeMeans, errors }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Description globale de la proposition</Label>
        <Textarea
          className="mt-1"
          rows={6}
          value={content}
          onChange={onChangeContent}
          placeholder="Raconte ta proposition de manière fluide : contexte, enchaînement des actions, logique d’ensemble."
        />
        {errors?.content && (
          <p className="mt-1 text-xs text-red-500">{errors.content}</p>
        )}
      </div>

      <div>
        <Label>Moyens nécessaires (humains, matériels, organisationnels)</Label>
        <Textarea
          className="mt-1"
          rows={4}
          value={means}
          onChange={onChangeMeans}
          placeholder="Un moyen par ligne (ex : 2 médecins supplémentaires, une équipe de coordination, formation spécifique...)."
        />
        {errors?.means && (
          <p className="mt-1 text-xs text-red-500">{errors.means}</p>
        )}
      </div>
    </div>
  );
}

function StepTimelineRisks({
  timelineSteps,
  risks,
  updateTimelineStep,
  addTimelineStep,
  removeTimelineStep,
  updateRisk,
  addRisk,
  removeRisk,
  errors,
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Timeline / Étapes dans le temps</Label>
        <p className="text-xs text-muted-foreground mb-1">
          Décompose la mise en œuvre en grandes phases.
        </p>
        {timelineSteps.map((stepItem, idx) => (
          <div
            key={idx}
            className="space-y-2 rounded-md border border-border p-3 mb-2"
          >
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm">Phase {idx + 1}</Label>
              {timelineSteps.length > 1 && (
                <Button
                  variant="ghost"
                  size="xs"
                  type="button"
                  onClick={() => removeTimelineStep(idx)}
                >
                  Supprimer
                </Button>
              )}
            </div>
            <Input
              className="mt-1"
              value={stepItem.phase}
              onChange={(e) =>
                updateTimelineStep(idx, "phase", e.target.value)
              }
              placeholder="Ex : Phase pilote (année 1)"
            />
            <Textarea
              className="mt-1"
              rows={3}
              value={stepItem.description}
              onChange={(e) =>
                updateTimelineStep(idx, "description", e.target.value)
              }
              placeholder="Que se passe-t-il durant cette phase ?"
            />
          </div>
        ))}

        {errors?.timeline && (
          <p className="text-xs text-red-500">{errors.timeline}</p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTimelineStep}
        >
          + Ajouter une phase
        </Button>
      </div>

      <div>
        <Label>Risques & mesures d’atténuation</Label>
        {risks.map((riskItem, idx) => (
          <div
            key={idx}
            className="space-y-2 rounded-md border border-border p-3 mb-2"
          >
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm">Risque {idx + 1}</Label>
              {risks.length > 1 && (
                <Button
                  variant="ghost"
                  size="xs"
                  type="button"
                  onClick={() => removeRisk(idx)}
                >
                  Supprimer
                </Button>
              )}
            </div>
            <Input
              className="mt-1"
              value={riskItem.risk}
              onChange={(e) => updateRisk(idx, "risk", e.target.value)}
              placeholder="Ex : Difficulté de recrutement"
            />
            <Textarea
              className="mt-1"
              rows={3}
              value={riskItem.mitigation}
              onChange={(e) =>
                updateRisk(idx, "mitigation", e.target.value)
              }
              placeholder="Comment limiter ce risque ?"
            />
          </div>
        ))}

        {errors?.risks && (
          <p className="text-xs text-red-500">{errors.risks}</p>
        )}

        <Button type="button" variant="outline" size="sm" onClick={addRisk}>
          + Ajouter un risque
        </Button>
      </div>
    </div>
  );
}

function StepContextSources({
  territorialScope,
  targetPopulationsText,
  impactExpected,
  estimatedCost,
  dataSources,
  updateSource,
  addSource,
  removeSource,
  onChangeScope,
  onChangeTargets,
  onChangeImpact,
  onChangeCost,
  errors,
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Portée territoriale</Label>
          <Input
            className="mt-1"
            value={territorialScope}
            onChange={onChangeScope}
            placeholder="Ex : National, Région Île-de-France, Département X..."
          />
          {errors?.territorial_scope && (
            <p className="mt-1 text-xs text-red-500">
              {errors.territorial_scope}
            </p>
          )}
        </div>

        <div>
          <Label>Populations ciblées</Label>
          <Input
            className="mt-1"
            value={targetPopulationsText}
            onChange={onChangeTargets}
            placeholder="Ex : étudiants, seniors, médecins libéraux (séparés par des virgules)"
          />
          {errors?.target_populations && (
            <p className="mt-1 text-xs text-red-500">
              {errors.target_populations}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Impact attendu (synthèse)</Label>
          <Textarea
            className="mt-1"
            rows={3}
            value={impactExpected}
            onChange={onChangeImpact}
            placeholder="Quels résultats concrets attends-tu ?"
          />
          {errors?.impact_expected && (
            <p className="mt-1 text-xs text-red-500">
              {errors.impact_expected}
            </p>
          )}
        </div>

        <div>
          <Label>Coût estimé (ordre de grandeur)</Label>
          <Textarea
            className="mt-1"
            rows={3}
            value={estimatedCost}
            onChange={onChangeCost}
            placeholder="Ordre de grandeur, hypothèses de coût, etc."
          />
          {errors?.estimated_cost && (
            <p className="mt-1 text-xs text-red-500">
              {errors.estimated_cost}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label>Sources (liens vers données, rapports, études...)</Label>
        {dataSources.map((src, idx) => (
          <div
            key={idx}
            className="mt-2 grid gap-2 sm:grid-cols-[2fr,2fr,auto]"
          >
            <Input
              className="sm:col-span-1"
              value={src.url}
              onChange={(e) => updateSource(idx, "url", e.target.value)}
              placeholder="URL de la source"
            />
            <Input
              className="sm:col-span-1"
              value={src.label}
              onChange={(e) => updateSource(idx, "label", e.target.value)}
              placeholder="Label (INSEE 2023, Cour des comptes, etc.)"
            />
            <div className="flex items-center justify-end">
              {dataSources.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSource(idx)}
                >
                  ✕
                </Button>
              )}
            </div>
          </div>
        ))}

        {errors?.data_sources && (
          <p className="mt-1 text-xs text-red-500">
            {errors.data_sources}
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={addSource}
        >
          + Ajouter une source
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Composant principal ProposalModal                                  */
/* ------------------------------------------------------------------ */

export default function ProposalModal({
  open,
  onClose,
  issueId,
  mode = "create", // "create" | "edit" | "fork"
  baseProposal = null,
  onSubmitted,
}) {
  const [step, setStep] = useState(0);

  // Champs principaux
  const [title, setTitle] = useState("");
  const [objectives, setObjectives] = useState("");
  const [content, setContent] = useState("");

  // Sections structurées
  const [actions, setActions] = useState([{ ...INITIAL_ACTION }]);
  const [means, setMeans] = useState(""); // texte -> tableau
  const [timelineSteps, setTimelineSteps] = useState([
    { ...INITIAL_TIMELINE_STEP },
  ]);
  const [risks, setRisks] = useState([{ ...INITIAL_RISK }]);

  const [territorialScope, setTerritorialScope] = useState("");
  const [targetPopulationsText, setTargetPopulationsText] = useState("");
  const [impactExpected, setImpactExpected] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");

  const [dataSources, setDataSources] = useState([{ ...INITIAL_SOURCE }]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const clearFieldError = useCallback((key) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      return { ...prev, [key]: null };
    });
  }, []);

  const resetForm = useCallback(() => {
    setStep(0);
    setTitle("");
    setObjectives("");
    setContent("");
    setActions([{ ...INITIAL_ACTION }]);
    setMeans("");
    setTimelineSteps([{ ...INITIAL_TIMELINE_STEP }]);
    setRisks([{ ...INITIAL_RISK }]);
    setTerritorialScope("");
    setTargetPopulationsText("");
    setImpactExpected("");
    setEstimatedCost("");
    setDataSources([{ ...INITIAL_SOURCE }]);
    setFormError("");
    setFieldErrors({});
    setIsSubmitting(false);
  }, []);

  const hydrateFromBaseProposal = useCallback(
    (proposal, currentMode) => {
      if (!proposal) return;

      setStep(0);

      setTitle(
        currentMode === "fork"
          ? `Variante – ${proposal.title || ""}`
          : proposal.title || ""
      );
      setObjectives(proposal.objectives || "");
      setContent(proposal.content || "");

      const parsedActions =
        Array.isArray(proposal.actions) && proposal.actions.length > 0
          ? proposal.actions.map((a) => ({
              title: a.title || "",
              description: a.description || "",
            }))
          : [{ ...INITIAL_ACTION }];
      setActions(parsedActions);

      const meansText = Array.isArray(proposal.means)
        ? proposal.means
            .map((m) => m?.description || "")
            .filter(Boolean)
            .join("\n")
        : "";
      setMeans(meansText);

      const parsedTimeline =
        Array.isArray(proposal.timeline) && proposal.timeline.length > 0
          ? proposal.timeline.map((t) => ({
              phase: t.phase || "",
              description: t.description || "",
            }))
          : [{ ...INITIAL_TIMELINE_STEP }];
      setTimelineSteps(parsedTimeline);

      const parsedRisks =
        Array.isArray(proposal.risks) && proposal.risks.length > 0
          ? proposal.risks.map((r) => ({
              risk: r.risk || "",
              mitigation: r.mitigation || "",
            }))
          : [{ ...INITIAL_RISK }];
      setRisks(parsedRisks);

      setTerritorialScope(proposal.territorial_scope || "");

      const targetsArray = Array.isArray(proposal.target_populations)
        ? proposal.target_populations
        : [];
      setTargetPopulationsText(targetsArray.join(", "));

      setImpactExpected(proposal.impact_expected || "");
      setEstimatedCost(proposal.estimated_cost || "");

      const parsedSources =
        Array.isArray(proposal.data_sources) &&
        proposal.data_sources.length > 0
          ? proposal.data_sources.map((s) => ({
              url: s.url || "",
              label: s.label || s.url || "",
            }))
          : [{ ...INITIAL_SOURCE }];
      setDataSources(parsedSources);

      setFormError("");
      setFieldErrors({});
    },
    []
  );

  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }

    // Au moment où le modal s'ouvre, si on est en EDIT/FORK + baseProposal → pré-remplissage
    if (baseProposal && (mode === "edit" || mode === "fork")) {
      hydrateFromBaseProposal(baseProposal, mode);
    } else if (mode === "create") {
      resetForm();
    }
  }, [open, baseProposal, mode, resetForm, hydrateFromBaseProposal]);

  const handleDialogChange = (isOpen) => {
    if (!isOpen) {
      onClose?.();
    }
  };

  /* ------------------------------------------------------------------ */
  /* Helpers listes                                                     */
  /* ------------------------------------------------------------------ */

  const updateListItem =
    (setter) =>
    (index, key, value) => {
      setter((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [key]: value };
        return next;
      });
    };

  const addListItem =
    (setter, initial) =>
    () => {
      setter((prev) => [...prev, { ...initial }]);
    };

  const removeListItem = (setter) => (index) => {
    setter((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const updateAction = updateListItem(setActions);
  const addAction = addListItem(setActions, INITIAL_ACTION);
  const removeAction = removeListItem(setActions);

  const updateRisk = updateListItem(setRisks);
  const addRisk = addListItem(setRisks, INITIAL_RISK);
  const removeRisk = removeListItem(setRisks);

  const updateTimelineStep = updateListItem(setTimelineSteps);
  const addTimelineStep = addListItem(setTimelineSteps, INITIAL_TIMELINE_STEP);
  const removeTimelineStep = removeListItem(setTimelineSteps);

  const updateSource = updateListItem(setDataSources);
  const addSource = addListItem(setDataSources, INITIAL_SOURCE);
  const removeSource = removeListItem(setDataSources);

  /* ------------------------------------------------------------------ */
  /* Validation champ par champ                                         */
  /* ------------------------------------------------------------------ */

  function validateStepFields(stepIndex) {
    const errors = {};
    let message = "";

    if (stepIndex === 0) {
      if (!title.trim()) {
        errors.title = "Le titre est obligatoire.";
      } else if (title.trim().length < 10) {
        errors.title = "Le titre doit faire au moins 10 caractères.";
      }

      if (!objectives.trim()) {
        errors.objectives = "Les objectifs sont obligatoires.";
      } else if (objectives.trim().length < 30) {
        errors.objectives =
          "Merci de décrire les objectifs en quelques phrases complètes.";
      }

      if (errors.title) {
        message = errors.title;
      } else if (errors.objectives) {
        message = errors.objectives;
      }
    }

    if (stepIndex === 1) {
      const validActions = actions.filter(
        (a) => a.title.trim() || a.description.trim()
      );
      if (validActions.length === 0) {
        errors.actions = "Ajoute au moins une action concrète.";
        message = errors.actions;
      }
    }

    if (stepIndex === 2) {
      if (!content.trim()) {
        errors.content =
          "Merci de décrire la proposition dans son ensemble.";
        message = errors.content;
      }

      const lines = means
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length === 0) {
        errors.means =
          "Indique au moins un moyen (ressource humaine, matérielle, etc.).";
        if (!message) message = errors.means;
      }
    }

    if (stepIndex === 3) {
      const validTimeline = timelineSteps.filter(
        (t) => t.phase.trim() || t.description.trim()
      );
      if (validTimeline.length === 0) {
        errors.timeline =
          "Ajoute au moins une phase dans le temps pour la mise en œuvre.";
        message = errors.timeline;
      }

      const validRisks = risks.filter((r) => r.risk.trim());
      if (validRisks.length === 0) {
        errors.risks = "Identifie au moins un risque potentiel.";
        if (!message) message = errors.risks;
      }
    }

    if (stepIndex === 4) {
      // Ces champs restent souples, mais on peut suggérer
      const hasSource = dataSources.some((s) => s.url.trim());
      if (!hasSource) {
        errors.data_sources =
          "Ajoute au moins une source de données si possible (facultatif mais recommandé).";
        // Pas bloquant → on laisse message vide ici pour ne pas empêcher la soumission
      }
    }

    const ok = Object.keys(errors).length === 0;
    return { ok, errors, message };
  }

  function validateAllSteps() {
    let mergedErrors = {};
    let firstMessage = "";

    for (let i = 0; i <= 4; i++) {
      const { ok, errors, message } = validateStepFields(i);
      if (!ok) {
        mergedErrors = { ...mergedErrors, ...errors };
        if (!firstMessage && message) {
          firstMessage = message;
        }
      }
    }

    return {
      ok: Object.keys(mergedErrors).length === 0,
      errors: mergedErrors,
      message: firstMessage,
    };
  }

  const handleNextStep = () => {
    const { ok, errors, message } = validateStepFields(step);
    if (!ok) {
      setFieldErrors((prev) => ({ ...prev, ...errors }));
      setFormError(message || "Merci de corriger les champs indiqués.");
      return;
    }
    setFormError("");
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setFormError("");
    setStep((prev) => Math.max(prev - 1, 0));
  };

  /* ------------------------------------------------------------------ */
  /* Construction du payload                                            */
  /* ------------------------------------------------------------------ */

  function buildCleanPayload() {
    const cleanedActions = actions
      .filter((a) => a.title.trim() || a.description.trim())
      .map((a) => ({
        title: a.title.trim(),
        description: a.description.trim(),
      }));

    const cleanedTimeline = timelineSteps
      .filter((t) => t.phase.trim() || t.description.trim())
      .map((t) => ({
        phase: t.phase.trim(),
        description: t.description.trim(),
      }));

    const cleanedRisks = risks
      .filter((r) => r.risk.trim())
      .map((r) => ({
        risk: r.risk.trim(),
        mitigation: r.mitigation.trim(),
      }));

    const cleanedMeans = means
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((m) => ({ description: m }));

    const cleanedTargetPopulations = targetPopulationsText
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    const cleanedSources = dataSources
      .filter((s) => s.url.trim())
      .map((s) => ({
        url: s.url.trim(),
        label: s.label.trim() || s.url.trim(),
      }));

    return {
      issue_id:
        mode === "create"
          ? issueId
          : baseProposal?.issue_id || issueId,
      title: title.trim(),
      content: content.trim(),
      objectives: objectives.trim(),
      actions: cleanedActions,
      means: cleanedMeans,
      timeline: cleanedTimeline,
      risks: cleanedRisks,
      territorial_scope: territorialScope.trim() || null,
      target_populations: cleanedTargetPopulations,
      impact_expected: impactExpected.trim() || null,
      estimated_cost: estimatedCost.trim() || null,
      data_sources: cleanedSources,
    };
  }

  /* ------------------------------------------------------------------ */
  /* Soumission                                                         */
  /* ------------------------------------------------------------------ */

  const handleSubmit = async () => {
    const { ok, errors, message } = validateAllSteps();
    if (!ok) {
      setFieldErrors(errors);
      setFormError(message || "Merci de corriger les champs indiqués.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const payload = buildCleanPayload();

      let result;
      if (mode === "edit" && baseProposal) {
        result = await updateProposal(baseProposal.id, payload);
      } else if (mode === "fork" && baseProposal) {
        // On passe le payload comme overrides
        result = await forkProposal(baseProposal.id, payload);
      } else {
        result = await createProposal(payload);
      }

      onSubmitted?.(result);
      onClose?.();
      resetForm();
    } catch (err) {
      console.error("ProposalModal submit error:", err);

      if (err?.message === "AUTH_REQUIRED") {
        setFormError("Tu dois être connecté pour créer ou modifier une proposition.");
      } else if (err?.message === "RATE_LIMIT_EXCEEDED") {
        setFormError(
          "Tu as atteint la limite de propositions pour aujourd'hui. Tu pourras en créer d’autres demain."
        );
      } else {
        setFormError(
          "Impossible d’enregistrer la proposition pour le moment. Réessaie plus tard."
        );
      }
      setIsSubmitting(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Rendu                                                              */
  /* ------------------------------------------------------------------ */

  const modeLabel =
    mode === "edit"
      ? "Modifier la proposition"
      : mode === "fork"
      ? "Créer une variante de la proposition"
      : "Nouvelle proposition";

  const ctaLabel =
    mode === "edit"
      ? "Enregistrer les modifications"
      : mode === "fork"
      ? "Créer la variante"
      : "Créer la proposition";

  const issueInfoSuffix =
    mode === "create"
      ? ` pour l'enjeu ${issueId ?? ""}`
      : baseProposal
      ? ` (enjeu : ${baseProposal.issue_id})`
      : "";

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="bg-card text-foreground max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{modeLabel}</DialogTitle>
          <DialogDescription>
            Remplis les différentes sections pour proposer une solution
            structurée, argumentée et exploitable
            {issueInfoSuffix && (
              <span className="font-mono text-[11px] block mt-1 opacity-70">
                {issueInfoSuffix}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <StepIndicator step={step} />

        <div className="space-y-4">
          {/* Contenu step courant */}
          {step === 0 && (
            <StepProblemObjectives
              title={title}
              objectives={objectives}
              onChangeTitle={(e) => {
                setTitle(e.target.value);
                clearFieldError("title");
              }}
              onChangeObjectives={(e) => {
                setObjectives(e.target.value);
                clearFieldError("objectives");
              }}
              errors={fieldErrors}
            />
          )}

          {step === 1 && (
            <StepActions
              actions={actions}
              updateAction={(idx, key, value) => {
                updateAction(idx, key, value);
                clearFieldError("actions");
              }}
              addAction={() => {
                addAction();
                clearFieldError("actions");
              }}
              removeAction={(idx) => {
                removeAction(idx);
                clearFieldError("actions");
              }}
              errors={fieldErrors}
            />
          )}

          {step === 2 && (
            <StepDescriptionMeans
              content={content}
              means={means}
              onChangeContent={(e) => {
                setContent(e.target.value);
                clearFieldError("content");
              }}
              onChangeMeans={(e) => {
                setMeans(e.target.value);
                clearFieldError("means");
              }}
              errors={fieldErrors}
            />
          )}

          {step === 3 && (
            <StepTimelineRisks
              timelineSteps={timelineSteps}
              risks={risks}
              updateTimelineStep={(idx, key, value) => {
                updateTimelineStep(idx, key, value);
                clearFieldError("timeline");
              }}
              addTimelineStep={() => {
                addTimelineStep();
                clearFieldError("timeline");
              }}
              removeTimelineStep={(idx) => {
                removeTimelineStep(idx);
                clearFieldError("timeline");
              }}
              updateRisk={(idx, key, value) => {
                updateRisk(idx, key, value);
                clearFieldError("risks");
              }}
              addRisk={() => {
                addRisk();
                clearFieldError("risks");
              }}
              removeRisk={(idx) => {
                removeRisk(idx);
                clearFieldError("risks");
              }}
              errors={fieldErrors}
            />
          )}

          {step === 4 && (
            <StepContextSources
              territorialScope={territorialScope}
              targetPopulationsText={targetPopulationsText}
              impactExpected={impactExpected}
              estimatedCost={estimatedCost}
              dataSources={dataSources}
              updateSource={(idx, key, value) => {
                updateSource(idx, key, value);
                clearFieldError("data_sources");
              }}
              addSource={() => {
                addSource();
                clearFieldError("data_sources");
              }}
              removeSource={(idx) => {
                removeSource(idx);
                clearFieldError("data_sources");
              }}
              onChangeScope={(e) => {
                setTerritorialScope(e.target.value);
                clearFieldError("territorial_scope");
              }}
              onChangeTargets={(e) => {
                setTargetPopulationsText(e.target.value);
                clearFieldError("target_populations");
              }}
              onChangeImpact={(e) => {
                setImpactExpected(e.target.value);
                clearFieldError("impact_expected");
              }}
              onChangeCost={(e) => {
                setEstimatedCost(e.target.value);
                clearFieldError("estimated_cost");
              }}
              errors={fieldErrors}
            />
          )}

          {formError && (
            <p className="text-sm text-red-500 mt-2">{formError}</p>
          )}

          <div className="flex justify-between pt-4 border-t border-border mt-4">
            <div>
              {step > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handlePrevStep}
                  disabled={isSubmitting}
                >
                  ← Précédent
                </Button>
              )}
            </div>
            <div className="space-x-2">
              {step < 4 && (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isSubmitting}
                >
                  Suivant →
                </Button>
              )}
              {step === 4 && (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Enregistrement…" : ctaLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
