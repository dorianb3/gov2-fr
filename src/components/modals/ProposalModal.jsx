// src/components/modals/ProposalModal.jsx
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabase/client";
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

const INITIAL_ACTION = { title: "", description: "" };
const INITIAL_RISK = { risk: "", mitigation: "" };
const INITIAL_TIMELINE_STEP = { phase: "", description: "" };
const INITIAL_SOURCE = { url: "", label: "" };

export default function ProposalModal({ open, onClose, issueId, onSubmitted }) {
  const [step, setStep] = useState(0);

  // Champs principaux
  const [title, setTitle] = useState("");
  const [objectives, setObjectives] = useState("");
  const [content, setContent] = useState("");

  // Sections structurées
  const [actions, setActions] = useState([ { ...INITIAL_ACTION } ]);
  const [means, setMeans] = useState(""); // sera converti en tableau côté insert
  const [timelineSteps, setTimelineSteps] = useState([ { ...INITIAL_TIMELINE_STEP } ]);
  const [risks, setRisks] = useState([ { ...INITIAL_RISK } ]);

  const [territorialScope, setTerritorialScope] = useState("");
  const [targetPopulationsText, setTargetPopulationsText] = useState("");
  const [impactExpected, setImpactExpected] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");

  // Sources (stockées dans proposals.data_sources en JSON)
  const [dataSources, setDataSources] = useState([ { ...INITIAL_SOURCE } ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Reset complet quand on ferme
  const resetForm = useCallback(() => {
    setStep(0);
    setTitle("");
    setObjectives("");
    setContent("");
    setActions([ { ...INITIAL_ACTION } ]);
    setMeans("");
    setTimelineSteps([ { ...INITIAL_TIMELINE_STEP } ]);
    setRisks([ { ...INITIAL_RISK } ]);
    setTerritorialScope("");
    setTargetPopulationsText("");
    setImpactExpected("");
    setEstimatedCost("");
    setDataSources([ { ...INITIAL_SOURCE } ]);
    setFormError("");
    setIsSubmitting(false);
  }, []);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  const handleDialogChange = (isOpen) => {
    if (!isOpen) {
      onClose?.();
    }
  };

  /* ------------------------------------------------------------------
   * Helpers pour les listes (actions, risques, timeline, sources)
   * ------------------------------------------------------------------ */

  const updateListItem = (list, setter) => (index, key, value) => {
    setter((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const addListItem = (list, setter, initial) => () => {
    setter((prev) => [...prev, { ...initial }]);
  };

  const removeListItem = (list, setter) => (index) => {
    setter((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const updateAction = updateListItem(actions, setActions);
  const addAction = addListItem(actions, setActions, INITIAL_ACTION);
  const removeAction = removeListItem(actions, setActions);

  const updateRisk = updateListItem(risks, setRisks);
  const addRisk = addListItem(risks, setRisks, INITIAL_RISK);
  const removeRisk = removeListItem(risks, setRisks);

  const updateTimelineStep = updateListItem(timelineSteps, setTimelineSteps);
  const addTimelineStep = addListItem(timelineSteps, setTimelineSteps, INITIAL_TIMELINE_STEP);
  const removeTimelineStep = removeListItem(timelineSteps, setTimelineSteps);

  const updateSource = updateListItem(dataSources, setDataSources);
  const addSource = addListItem(dataSources, setDataSources, INITIAL_SOURCE);
  const removeSource = removeListItem(dataSources, setDataSources);

  /* ------------------------------------------------------------------
   * Validation par étape
   * ------------------------------------------------------------------ */

  const validateStep = () => {
    setFormError("");

    if (step === 0) {
      if (!title.trim() || !objectives.trim()) {
        setFormError("Titre et objectifs sont obligatoires.");
        return false;
      }
      if (title.trim().length < 10) {
        setFormError("Le titre doit faire au moins 10 caractères pour être explicite.");
        return false;
      }
      if (objectives.trim().length < 30) {
        setFormError("Les objectifs doivent être décrits en quelques phrases.");
        return false;
      }
    }

    if (step === 1) {
      const validActions = actions.filter(
        (a) => a.title.trim() || a.description.trim()
      );
      if (validActions.length === 0) {
        setFormError("Ajoute au moins une action concrète.");
        return false;
      }
    }

    if (step === 2) {
      if (!content.trim()) {
        setFormError("Merci de décrire la proposition dans son ensemble.");
        return false;
      }
    }

    if (step === 3) {
      const validRisks = risks.filter((r) => r.risk.trim());
      if (validRisks.length === 0) {
        setFormError("Identifie au moins un risque potentiel.");
        return false;
      }
    }

    // Step 4 (contexte & sources) : pas d’obligation stricte, mais tu peux en ajouter plus tard.
    return true;
  };

  const handleNextStep = () => {
    if (!validateStep()) return;
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setFormError("");
    setStep((prev) => Math.max(prev - 1, 0));
  };

  /* ------------------------------------------------------------------
   * Soumission finale
   * ------------------------------------------------------------------ */

  const handleCreate = async () => {
    // Validation finale de la dernière étape aussi
    if (!validateStep()) return;

    setIsSubmitting(true);
    setFormError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setFormError(
          "Tu dois être connecté pour créer une proposition."
        );
        setIsSubmitting(false);
        return;
      }

      // Rate limit
      const { data: canCreate, error: rateError } = await supabase.rpc(
        "check_rate_limit",
        { action_name: "proposal" }
      );

      if (rateError) {
        console.error("Rate limit RPC error:", rateError);
        setFormError(
          "Erreur lors de la vérification du quota. Réessaie dans quelques instants."
        );
        setIsSubmitting(false);
        return;
      }

      if (canCreate === false) {
        setFormError(
          "Tu as atteint la limite de propositions pour aujourd'hui. Tu pourras en créer d’autres demain."
        );
        setIsSubmitting(false);
        return;
      }

      // Nettoyage des structures avant insert
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

      const payload = {
        issue_id: issueId,
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
        created_by: user.id,
      };

      const { error } = await supabase.from("proposals").insert(payload);

      if (error) {
        console.error("Error inserting proposal:", error);
        setFormError(
          "Impossible de créer la proposition pour le moment. Réessaie ou contacte le support."
        );
        setIsSubmitting(false);
        return;
      }

      onSubmitted?.();
      onClose?.();
      resetForm();
    } catch (err) {
      console.error("Unexpected error while creating proposal:", err);
      setFormError(
        "Une erreur inattendue est survenue. Réessaie plus tard."
      );
      setIsSubmitting(false);
    }
  };

  /* ------------------------------------------------------------------
   * Rendu des étapes
   * ------------------------------------------------------------------ */

  const renderStepIndicator = () => {
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
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="proposal-title">Titre de la proposition</Label>
              <Input
                id="proposal-title"
                className="mt-1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex : Renforcer la présence médicale dans les zones rurales"
              />
            </div>

            <div>
              <Label htmlFor="proposal-objectives">Objectifs</Label>
              <Textarea
                id="proposal-objectives"
                className="mt-1"
                rows={4}
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                placeholder="Qu’essaies-tu de résoudre précisément ? Quels résultats souhaites-tu obtenir ?"
              />
            </div>
          </div>
        );

      case 1:
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
                  <Label className="text-sm">
                    Action {idx + 1}
                  </Label>
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

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addAction}
            >
              + Ajouter une action
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label>Description globale de la proposition</Label>
              <Textarea
                className="mt-1"
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Raconte ta proposition de manière fluide : contexte, enchaînement des actions, logique d’ensemble."
              />
            </div>

            <div>
              <Label>Moyens nécessaires (humains, matériels, organisationnels)</Label>
              <Textarea
                className="mt-1"
                rows={4}
                value={means}
                onChange={(e) => setMeans(e.target.value)}
                placeholder="Un moyen par ligne (ex : 2 médecins supplémentaires, une équipe de coordination, formation spécifique...)."
              />
            </div>
          </div>
        );

      case 3:
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
                    <Label className="text-sm">
                      Phase {idx + 1}
                    </Label>
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
                    <Label className="text-sm">
                      Risque {idx + 1}
                    </Label>
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
                    onChange={(e) =>
                      updateRisk(idx, "risk", e.target.value)
                    }
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

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRisk}
              >
                + Ajouter un risque
              </Button>
            </div>
          </div>
        );

      case 4:
      default:
        return (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Portée territoriale</Label>
                <Input
                  className="mt-1"
                  value={territorialScope}
                  onChange={(e) => setTerritorialScope(e.target.value)}
                  placeholder="Ex : National, Région Île-de-France, Département X..."
                />
              </div>

              <div>
                <Label>Populations ciblées</Label>
                <Input
                  className="mt-1"
                  value={targetPopulationsText}
                  onChange={(e) => setTargetPopulationsText(e.target.value)}
                  placeholder="Ex : étudiants, seniors, médecins libéraux (séparés par des virgules)"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Impact attendu (synthèse)</Label>
                <Textarea
                  className="mt-1"
                  rows={3}
                  value={impactExpected}
                  onChange={(e) => setImpactExpected(e.target.value)}
                  placeholder="Quels résultats concrets attends-tu ?"
                />
              </div>

              <div>
                <Label>Coût estimé (ordre de grandeur)</Label>
                <Textarea
                  className="mt-1"
                  rows={3}
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="Ordre de grandeur, hypothèses de coût, etc."
                />
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
                    onChange={(e) =>
                      updateSource(idx, "url", e.target.value)
                    }
                    placeholder="URL de la source"
                  />
                  <Input
                    className="sm:col-span-1"
                    value={src.label}
                    onChange={(e) =>
                      updateSource(idx, "label", e.target.value)
                    }
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
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="bg-card text-foreground max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Nouvelle proposition pour l&apos;enjeu&nbsp;
            <span className="font-mono text-xs align-middle">
              {issueId}
            </span>
          </DialogTitle>
          <DialogDescription>
            Remplis les différentes sections pour proposer une solution
            structurée, argumentée et exploitable.
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        <div className="space-y-4">
          {renderStepContent()}

          {formError && (
            <p className="text-sm text-red-500">{formError}</p>
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
                  onClick={handleCreate}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Création en cours…"
                    : "Créer la proposition"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
