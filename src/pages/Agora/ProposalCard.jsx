// src/pages/Agora/ProposalCard.jsx
import { Star } from "lucide-react";
import RelationsGraphMini from "./RelationsGraphMini";
import LikeButton from "@/components/common/LikeButton";
import FollowButton from "@/components/common/FollowButton";
import { Link } from "react-router-dom";

export default function ProposalCard({
  proposal,
  scores,
  relations,
  versionsMeta,
  // followersCount,
  creator,
  reputation,
  // isFollowing,
  // onToggleFollow,
  onNavigate,
  onOpenVote,
  onOpenReview,
  onOpenComment,
  onFork,
}) {
  const totalVotes = scores?.total_votes || 0;

  const avgPriority = scores?.avg_priority ?? null;
  const avgImpact = scores?.avg_impact ?? null;
  const avgFeasibility = scores?.avg_feasibility ?? null;
  const avgAcceptability = scores?.avg_acceptability ?? null;
  const avgTrust = scores?.avg_trust ?? null;

  const versionLabel = versionsMeta
    ? `v${versionsMeta.latestVersionNumber} (${versionsMeta.count || 0} versions)`
    : "v1";

  const statusLabel = proposal.status || "draft";

  return (
    <div className="border border-border/60 rounded px-3 py-2 text-xs flex flex-col gap-2 bg-background">
      {/* Ligne statut + auteur */}
      <div className="flex w-full justify-between items-center gap-2">
        <span className="w-fit text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground">
          {statusLabel}
        </span>

        <div className="flex items-center gap-3">
          {versionsMeta && (
            <span className="text-[10px] text-muted-foreground border border-border/60 rounded-full px-2 py-0.5">
              {versionLabel}
            </span>
          )}

          {creator && (
            <div className="flex flex-col items-end">
              <Link
                to={`/profile/${creator.id}`}
                className="text-[11px] font-medium hover:underline"
              >
                @{creator.username}
              </Link>
              <div className="text-[10px] text-muted-foreground">
                Réputation : {reputation}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ligne titre + actions principales */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
        <div className="flex-1">
          {/* Titre cliquable */}
          <button
            onClick={onNavigate}
            className="font-semibold text-left hover:underline text-sm"
          >
            {proposal.title}
          </button>


          {/* Objectifs / portée */}
          {proposal.objectives && (
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
              Objectif : {proposal.objectives}
            </p>
          )}
          {proposal.territorial_scope && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Portée : {proposal.territorial_scope}
            </p>
          )}
        </div>

        {/* Mini-graphe des relations */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <RelationsGraphMini relations={relations} />
          {relations && (
            <div className="flex flex-wrap justify-end gap-2 text-[9px] text-muted-foreground">
              {relations.isFork && <span>Fork</span>}
              {relations.forksCount > 0 && (
                <span>{relations.forksCount} variante(s)</span>
              )}
              {relations.alternativesCount > 0 && (
                <span>{relations.alternativesCount} alternative(s)</span>
              )}
              {relations.supersedes && <span>Remplace une autre prop.</span>}
              {relations.supersededBy && <span>Remplacée par une autre prop.</span>}
            </div>
          )}
        </div>
      </div>

      {/* Scores */}
      <div className="mt-1 flex flex-col gap-2">
        <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
          <span>
            Votes : <span className="font-semibold text-foreground">{totalVotes}</span>
          </span>

          {avgPriority != null && (
            <span>
              Priorité :{" "}
              <span className="font-semibold text-foreground">
                {avgPriority.toFixed(1)}/5
              </span>
            </span>
          )}
          {avgImpact != null && (
            <span>
              Impact :{" "}
              <span className="font-semibold text-foreground">
                {avgImpact.toFixed(1)}/5
              </span>
            </span>
          )}
          {avgFeasibility != null && (
            <span>
              Faisabilité :{" "}
              <span className="font-semibold text-foreground">
                {avgFeasibility.toFixed(1)}/5
              </span>
            </span>
          )}
          {avgAcceptability != null && (
            <span>
              Acceptabilité :{" "}
              <span className="font-semibold text-foreground">
                {avgAcceptability.toFixed(1)}/5
              </span>
            </span>
          )}
          {avgTrust != null && (
            <span>
              Confiance :{" "}
              <span className="font-semibold text-foreground">
                {avgTrust.toFixed(1)}/5
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="mt-1 flex flex-wrap gap-2 text-[10px]">
        <FollowButton targetType="proposal" targetId={proposal.id} size="xs" />
        <LikeButton targetType="proposal" targetId={proposal.id} size="sm" variant="ghost"/>
        <button
          className="px-2 py-1 border border-border/60 rounded hover:bg-accent"
          onClick={onOpenVote}
        >
          Voter
        </button>
        <button
          className="px-2 py-1 border border-border/60 rounded hover:bg-accent"
          onClick={onOpenReview}
        >
          Laisser une revue
        </button>
        <button
          className="px-2 py-1 border border-border/60 rounded hover:bg-accent"
          onClick={onOpenComment}
        >
          Commenter
        </button>
        <button
          className="px-2 py-1 border border-border/60 rounded hover:bg-accent"
          onClick={onFork}
        >
          Créer une variante
        </button>
      </div>
    </div>
  );
}
