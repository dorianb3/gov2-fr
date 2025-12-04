// src/components/proposals/ProposalRelationsPanel.jsx
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Link2 } from "lucide-react";
import { useEffect, useState } from "react";
import { searchProposalsByIssue } from "@/services/proposalsService"; // à adapter si besoin

function RelationsMiniGraph({ currentProposal, links }) {
  const forks = Array.isArray(links?.forks) ? links.forks : [];
  const alternatives = Array.isArray(links?.alternatives)
    ? links.alternatives
    : [];
  const supersedes = Array.isArray(links?.supersedes)
    ? links.supersedes
    : [];
  const supersededBy = Array.isArray(links?.supersededBy)
    ? links.supersededBy
    : [];

  return (
    <svg
      viewBox="0 0 600 160"
      className="w-full h-40 border border-neutral-800 rounded-md bg-neutral-950/60"
    >
      {/* centre : current */}
      <circle cx="300" cy="80" r="20" className="fill-blue-500/80" />
      <text
        x="300"
        y="80"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-white text-[10px]"
      >
        {currentProposal?.title?.slice(0, 12) || "Current"}
      </text>

      {/* parent */}
      {links?.parent && (
        <>
          <circle cx="150" cy="80" r="16" className="fill-neutral-700" />
          <text
            x="150"
            y="80"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-white text-[9px]"
          >
            {links.parent.title?.slice(0, 10) ?? "Parent"}
          </text>
          <line
            x1="166"
            y1="80"
            x2="280"
            y2="80"
            className="stroke-neutral-500"
            strokeWidth="1.5"
            markerEnd="url(#arrow)"
          />
        </>
      )}

      {/* forks */}
      {forks.slice(0, 3).map((p, idx) => {
        const x = 430;
        const y = 50 + idx * 30;
        return (
          <g key={p.id}>
            <circle cx={x} cy={y} r="14" className="fill-emerald-600/80" />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-white text-[8px]"
            >
              {(p.title || "Fork").slice(0, 8)}
            </text>
            <line
              x1="320"
              y1="80"
              x2={x - 14}
              y2={y}
              className="stroke-emerald-500"
              strokeWidth="1"
              markerEnd="url(#arrow)"
            />
          </g>
        );
      })}

      {/* alternatives */}
      {alternatives.slice(0, 3).map((p, idx) => {
        const x = 300;
        const y = 20 + idx * 25;
        return (
          <g key={p.id}>
            <circle cx={x} cy={y} r="10" className="fill-amber-500/80" />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-white text-[7px]"
            >
              {(p.title || "Alt").slice(0, 7)}
            </text>
            <line
              x1="300"
              y1="60"
              x2={x}
              y2={y + 10}
              className="stroke-amber-400"
              strokeWidth="0.8"
            />
          </g>
        );
      })}

      {/* supersedes / supersededBy (bas) */}
      {supersedes.slice(0, 2).map((p, idx) => {
        const x = 230 + idx * 40;
        const y = 130;
        return (
          <g key={p.id}>
            <circle cx={x} cy={y} r="10" className="fill-purple-500/80" />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-white text-[7px]"
            >
              {(p.title || "Sup.").slice(0, 7)}
            </text>
            <line
              x1="300"
              y1="100"
              x2={x}
              y2={y - 10}
              className="stroke-purple-400"
              strokeWidth="0.8"
              markerEnd="url(#arrow)"
            />
          </g>
        );
      })}

      {supersededBy.slice(0, 2).map((p, idx) => {
        const x = 370 + idx * 40;
        const y = 130;
        return (
          <g key={p.id}>
            <circle cx={x} cy={y} r="10" className="fill-pink-500/80" />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-white text-[7px]"
            >
              {(p.title || "SupBy").slice(0, 7)}
            </text>
            <line
              x1="300"
              y1="100"
              x2={x}
              y2={y - 10}
              className="stroke-pink-400"
              strokeWidth="0.8"
              markerEnd="url(#arrow)"
            />
          </g>
        );
      })}

      {/* defs pour flèches */}
      <defs>
        <marker
          id="arrow"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" className="fill-current text-neutral-400" />
        </marker>
      </defs>
    </svg>
  );
}


export default function ProposalRelationsPanel({
  currentProposal,
  links,
  onOpenRelationDialog,
}) {
  const navigate = useNavigate();
  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardHeader className="pb-3 flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-neutral-400" />
            Relations entre propositions
          </CardTitle>
          <CardDescription>
            Variantes, alternatives et remplacements.
          </CardDescription>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenRelationDialog}
          className="shrink-0"
        >
          <Link2 className="w-4 h-4 mr-1" />
          Ajouter / gérer
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <RelationsMiniGraph currentProposal={currentProposal} links={links} />

        <div className="grid gap-3 md:grid-cols-2 text-xs text-neutral-200">
          <div className="space-y-1">
            <div className="font-semibold">Variante principale</div>
            {links.parent ? (
              <p className="text-neutral-300">
                Dérivée de :{" "}
                <button
                  onClick={() => navigate(`/proposals/${links.parent.id}`)}
                  className="font-semibold text-left hover:underline text-xs text-blue-700 ml-2"
                >
                  {links.parent.title}
                </button>           
              </p>
            ) : (
              <p className="text-neutral-500 text-xs">
                Cette proposition semble être la branche d’origine (pas de
                parent détecté).
              </p>
            )}
          </div>

          <div className="space-y-1">
            <div className="font-semibold">Autres variantes</div>
            {links.forks?.length ? (
              <ul className="list-disc list-inside space-y-1">
                {links.forks.map((p) => (
                  <li key={p.id}>
                  <button
                    onClick={() => navigate(`/proposals/${p.id}`)}
                    className="font-semibold text-left hover:underline text-xs text-blue-700 ml-2"
                  >
                    {p.title}
                  </button>    
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-neutral-500 text-xs">
                Aucune variante dérivée pour l’instant.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <div className="font-semibold">Alternatives</div>
            {links.alternatives?.length ? (
              <ul className="list-disc list-inside space-y-1">
                {links.alternatives.map((p) => (
                  <li key={p.id}>
                  <button
                    onClick={() => navigate(`/proposals/${p.id}`)}
                    className="font-semibold text-left hover:underline text-xs text-blue-700 ml-2"
                  >
                    {p.title}
                  </button>   
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-neutral-500 text-xs">
                Aucune alternative déclarée.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <div className="font-semibold">Remplacements (supersedes)</div>
            {links.supersededBy?.length > 0 && (
              <p className="text-xs text-neutral-300">
                Cette proposition a été remplacée par : {" "}
                {/* <span className="font-semibold">
                  {links.supersededBy[0].title}
                </span> */}
                  <button
                    onClick={() => navigate(`/proposals/${links.supersededBy[0].id}`)}
                    className="font-semibold text-left hover:underline text-xs text-blue-700 ml-2"
                  >
                    {links.supersededBy[0].title}
                  </button>   
                {links.supersededBy.length > 1 && " (plusieurs remplaçants)"}
              </p>
            )}
            {links.supersedes?.length > 0 && (
              <p className="text-xs text-neutral-300">
                Elle remplace : {" "}
                {/* <span className="font-semibold">
                  {links.supersedes[0].title}
                </span> */}
                  <button
                    onClick={() => navigate(`/proposals/${links.supersedes[0].id}`)}
                    className="font-semibold text-left hover:underline text-xs text-blue-700 ml-2"
                  >
                    {links.supersedes[0].title}
                  </button>   
                {links.supersedes.length > 1 && " et d’autres…"}
              </p>
            )}
            {!links.supersedes?.length && !links.supersededBy?.length && (
              <p className="text-neutral-500 text-xs">
                Aucun lien de remplacement institutionnel.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* 🧩 Modale minimale d'ajout de relation                             */
/* ------------------------------------------------------------------ */

export function RelationDialog({
  open,
  onOpenChange,
  currentProposalId,
  currentIssueId,
  onCreateRelation,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [relation, setRelation] = useState("alternative");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setResults([]);
      setRelation("alternative");
    }
  }, [open]);

  async function handleSearch() {
    if (!currentIssueId) return;
    setLoading(true);
    try {
      const found = await searchProposalsByIssue(currentIssueId, searchTerm, {
        excludeId: currentProposalId,
      });
      setResults(found || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect(proposalId) {
    await onCreateRelation({ targetProposalId: proposalId, relation });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Lier cette proposition à une autre</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1 text-sm">
            <label className="text-xs text-neutral-400">
              Type de relation
            </label>
            <select
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs"
            >
              <option value="alternative">Alternative</option>
              <option value="supersedes">Supersedes (remplace)</option>
              <option value="superseded_by">
                Superseded by (remplacée par)
              </option>
              <option value="fork">Fork (variante technique)</option>
            </select>
          </div>

          <div className="space-y-2 text-sm">
            <label className="text-xs text-neutral-400">
              Rechercher une proposition (dans le même enjeu)
            </label>
            <div className="flex gap-2">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Titre ou mots-clés…"
                className="text-sm"
              />
              <Button
                size="sm"
                onClick={handleSearch}
                disabled={loading || !searchTerm.trim()}
              >
                Rechercher
              </Button>
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-2 text-sm">
            {loading && (
              <div className="text-xs text-neutral-400">
                Recherche en cours…
              </div>
            )}
            {!loading && results.length === 0 && (
              <div className="text-xs text-neutral-500">
                Aucun résultat pour l’instant.
              </div>
            )}
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelect(p.id)}
                className="w-full text-left px-2 py-2 rounded border border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800/60 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-neutral-100 text-sm">
                    {p.title}
                  </span>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {p.status}
                  </Badge>
                </div>
                {p.objectives && (
                  <p className="text-xs text-neutral-400 line-clamp-2">
                    {p.objectives}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Permet de faire ProposalRelationsPanel.RelationDialog dans la page
ProposalRelationsPanel.RelationDialog = RelationDialog;
