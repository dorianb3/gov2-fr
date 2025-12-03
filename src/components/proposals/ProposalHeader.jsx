// src/components/proposals/ProposalHeader.jsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, GitBranch, Link2, Pencil } from "lucide-react";
import ProposalStatusControl from "@/components/proposals/ProposalStatusControl";

export default function ProposalHeader({
  proposal,
  issue,
  creator,
  creatorReputation,
  userRole,
  isFollowing,
  onToggleFollow,
  formatDateTime,
  flagsCount,
  proposalId,
  onStatusChanged,
  onEdit,
  onFork,
  onOpenRelationDialog,
}) {
  return (
    <div className="space-y-4">
      {/* Titre + statut + status-control */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-semibold">{proposal.title}</h1>
            <Badge variant="outline" className="uppercase text-xs">
              {proposal.status}
            </Badge>
            {flagsCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {flagsCount} signalement(s)
              </Badge>
            )}
          </div>

          {issue && (
            <p className="text-sm text-neutral-400">
              Enjeu :{" "}
              <span className="font-semibold text-neutral-200">
                {issue.title}
              </span>
              {issue.topic?.name && (
                <>
                  {" "}
                  — Thématique :{" "}
                  <span className="text-neutral-200">
                    {issue.topic.name}
                  </span>
                </>
              )}
            </p>
          )}

          <div className="text-xs text-neutral-400">
            Créée le {formatDateTime(proposal.created_at)}
            {proposal.updated_at && (
              <>
                <br />
                Dernière mise à jour :{" "}
                {formatDateTime(proposal.updated_at)}
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <ProposalStatusControl
            proposalId={proposalId}
            status={proposal.status}
            userRole={userRole}
            onStatusChanged={onStatusChanged}
          />
          <div className="text-sm text-neutral-300 text-right">
            Par{" "}
            <span className="font-semibold text-neutral-100">
              {creator?.username || "Utilisateur inconnu"}
            </span>
            {creator?.role && (
              <>
                {" "}
                — <span className="italic">{creator.role}</span>
              </>
            )}
            {creatorReputation && (
              <>
                {" "}
                — Score réputation :{" "}
                <span className="font-mono">
                  {creatorReputation.score ?? 0}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions principales : suivre / éditer / forker / lier */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          variant={isFollowing ? "secondary" : "default"}
          onClick={onToggleFollow}
        >
          <Star
            className={`w-4 h-4 mr-1 ${
              isFollowing ? "fill-yellow-400 text-yellow-400" : ""
            }`}
          />
          {isFollowing ? "Se désabonner" : "Suivre cette proposition"}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={onEdit}
          title="Modifier le contenu de la proposition"
        >
          <Pencil className="w-4 h-4 mr-1" />
          Modifier
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={onFork}
          title="Créer une variante de cette proposition"
        >
          <GitBranch className="w-4 h-4 mr-1" />
          Créer une variante
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={onOpenRelationDialog}
          title="Lier cette proposition à une autre (alternative, supersedes, etc.)"
        >
          <Link2 className="w-4 h-4 mr-1" />
          Gérer les relations
        </Button>
      </div>
    </div>
  );
}
