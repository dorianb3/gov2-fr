// src/components/proposals/ProposalImplementationSection.jsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function ProposalImplementationSection({
  actions,
  means,
  timeline,
  risks,
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">
          Plan d’action et mise en œuvre
        </h2>
        <p className="text-sm text-neutral-400 mt-1">
          Les actions concrètes et les moyens nécessaires.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Actions */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Actions concrètes</CardTitle>
            <CardDescription>
              Les étapes opérationnelles proposées.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {actions.length === 0 && (
              <p className="text-sm text-neutral-400">
                Aucune action détaillée.
              </p>
            )}
            {actions.map((a, idx) => (
              <div
                key={idx}
                className="rounded-md border border-neutral-700 p-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-semibold text-neutral-100">
                    Action {idx + 1} — {a.title || "Sans titre"}
                  </h4>
                </div>
                {a.description && (
                  <p className="mt-1 text-sm text-neutral-200 whitespace-pre-line">
                    {a.description}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Moyens */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Moyens nécessaires</CardTitle>
            <CardDescription>
              Ressources humaines, matérielles et organisationnelles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {means.length === 0 ? (
              <p className="text-sm text-neutral-400">
                Aucun moyen n&apos;a été détaillé.
              </p>
            ) : (
              <ul className="list-disc list-inside space-y-1 text-sm text-neutral-200">
                {means.map((m, idx) => (
                  <li key={idx}>{m.description || JSON.stringify(m)}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timeline & risques */}
      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Timeline / Phases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {timeline.length === 0 && (
              <p className="text-sm text-neutral-400">
                Aucune timeline n&apos;a été fournie.
              </p>
            )}
            {timeline.map((t, idx) => (
              <div
                key={idx}
                className="rounded-md border border-neutral-700 p-3"
              >
                <h4 className="font-semibold text-neutral-100">
                  {t.phase || `Phase ${idx + 1}`}
                </h4>
                {t.description && (
                  <p className="mt-1 text-sm text-neutral-200 whitespace-pre-line">
                    {t.description}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Risques & atténuation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {risks.length === 0 && (
              <p className="text-sm text-neutral-400">
                Aucun risque identifié dans la fiche.
              </p>
            )}
            {risks.map((r, idx) => (
              <div
                key={idx}
                className="rounded-md border border-neutral-700 p-3"
              >
                <h4 className="font-semibold text-neutral-100">
                  Risque {idx + 1} — {r.risk || "Non précisé"}
                </h4>
                {r.mitigation && (
                  <p className="mt-1 text-sm text-neutral-200 whitespace-pre-line">
                    Mesures d&apos;atténuation : {r.mitigation}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
