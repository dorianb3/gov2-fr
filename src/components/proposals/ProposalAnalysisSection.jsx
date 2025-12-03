// src/components/proposals/ProposalAnalysisSection.jsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProposalAnalysisSection({ sources, analyses }) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">
          Données, sources & analyses
        </h2>
        <p className="text-sm text-neutral-400 mt-1">
          Sur quelles données s’appuie la proposition ? Quels sont les
          impacts estimés ?
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sources */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Sources de données</CardTitle>
            <CardDescription>
              Liens vers statistiques, rapports, études…
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {sources.length === 0 ? (
              <p className="text-sm text-neutral-400">
                Aucune source spécifique n&apos;est liée à cette
                proposition.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {sources.map((s, idx) => (
                  <li key={idx} className="flex flex-col">
                    <span className="font-medium text-neutral-100">
                      {s.label || s.url}
                    </span>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-400 break-all hover:underline"
                    >
                      {s.url}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Analyses */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Analyses</CardTitle>
            <CardDescription>
              Évaluations fiscales, socio-économiques, juridiques…
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analyses.length === 0 ? (
              <p className="text-sm text-neutral-400">
                Aucune analyse n&apos;a encore été attachée à cette
                proposition.
              </p>
            ) : (
              analyses.map((a) => (
                <div
                  key={a.id}
                  className="rounded-md border border-neutral-700 p-3 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <Badge variant="outline" className="uppercase">
                      {a.type}
                    </Badge>
                    <span className="text-neutral-500">
                      {a.generated_by === "system"
                        ? "Analyse automatique"
                        : a.generated_by === "expert"
                        ? "Analyse experte"
                        : "Analyse institutionnelle"}
                    </span>
                  </div>
                  {a.summary && (
                    <p className="text-sm text-neutral-200 whitespace-pre-line mt-1">
                      {a.summary}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
