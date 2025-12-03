// src/components/proposals/ProposalSummarySection.jsx
import { Card, CardContent } from "@/components/ui/card";

export default function ProposalSummarySection({ proposal, parsedTargets }) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Synthèse et objectifs</h2>
        <p className="text-sm text-neutral-400 mt-1">
          Comprendre rapidement ce que vise cette proposition.
        </p>
      </div>

      <Card className="bg-neutral-900 border-neutral-700">
        <CardContent className="pt-6 space-y-4">
          {proposal.objectives && (
            <div>
              <h3 className="text-lg font-semibold mb-1">Objectifs</h3>
              <p className="text-neutral-200 whitespace-pre-line">
                {proposal.objectives}
              </p>
            </div>
          )}

          {proposal.content && (
            <div>
              <h3 className="text-lg font-semibold mb-1">
                Description globale
              </h3>
              <p className="text-neutral-200 whitespace-pre-line">
                {proposal.content}
              </p>
            </div>
          )}

          {(proposal.impact_expected || proposal.estimated_cost) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {proposal.impact_expected && (
                <div>
                  <h3 className="text-sm font-semibold mb-1">
                    Impact attendu
                  </h3>
                  <p className="text-sm text-neutral-200 whitespace-pre-line">
                    {proposal.impact_expected}
                  </p>
                </div>
              )}
              {proposal.estimated_cost && (
                <div>
                  <h3 className="text-sm font-semibold mb-1">
                    Coût estimé
                  </h3>
                  <p className="text-sm text-neutral-200 whitespace-pre-line">
                    {proposal.estimated_cost}
                  </p>
                </div>
              )}
            </div>
          )}

          {(proposal.territorial_scope || parsedTargets.length > 0) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {proposal.territorial_scope && (
                <div>
                  <h3 className="text-sm font-semibold mb-1">
                    Portée territoriale
                  </h3>
                  <p className="text-sm text-neutral-200">
                    {proposal.territorial_scope}
                  </p>
                </div>
              )}
              {parsedTargets.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-1">
                    Populations ciblées
                  </h3>
                  <p className="text-sm text-neutral-200">
                    {parsedTargets.join(", ")}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
