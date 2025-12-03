// src/components/votes/AggregateScore.jsx
import React, { useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AggregateScoreBadge from "./AggregateScoreBadge";
import VoteModal from "@/components/modals/VoteModal";


function renderScoreBar(value) {
  const clamped = Math.max(0, Math.min(5, value || 0));
  const percent = (clamped / 5) * 100;
  return (
    <div className="w-full h-2 rounded bg-neutral-800 overflow-hidden">
      <div
        className="h-full bg-primary transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/**
 * Affichage détaillé des scores agrégés pour une proposition donnée.
 *
 * Props:
 * - proposalId: uuid de la proposition
 * - voteStats: { count, avg: {…}, global }
 * - scoresView: row de proposal_scores_view ou null
 * - votes: liste brute des votes (pour trouver le vote de l'utilisateur)
 * - currentUser: user Supabase courant (ou null)
 * - onAfterVote: callback appelé après vote (ex: loadAll)
 */
export default function AggregateScore({
  proposalId,
  scoresView,
  votes,
  currentUser,
  onAfterVote,
}) {
  const [openVoteModal, setOpenVoteModal] = useState(false);

  const existingVote = useMemo(() => {
    if (!currentUser || !votes || votes.length === 0) return null;
    return votes.find((v) => v.voter_id === currentUser.id) || null;
  }, [votes, currentUser]);

  // ----------------------------------------------------------
  // HELPERS : SCORES AGRÉGÉS
  // ----------------------------------------------------------
  const voteStats = useMemo(() => {
    if (!votes || votes.length === 0) {
      return {
        count: 0,
        avg: {
          priority_score: 0,
          impact_score: 0,
          feasibility_score: 0,
          acceptability_score: 0,
          trust_score: 0,
        },
        global: 0,
      };
    }

    const count = votes.length;
    const sum = votes.reduce(
      (acc, v) => {
        acc.priority_score += v.priority_score ?? 0;
        acc.impact_score += v.impact_score ?? 0;
        acc.feasibility_score += v.feasibility_score ?? 0;
        acc.acceptability_score += v.acceptability_score ?? 0;
        acc.trust_score += v.trust_score ?? 0;
        return acc;
      },
      {
        priority_score: 0,
        impact_score: 0,
        feasibility_score: 0,
        acceptability_score: 0,
        trust_score: 0,
      }
    );

    const avg = {
      priority_score: sum.priority_score / count,
      impact_score: sum.impact_score / count,
      feasibility_score: sum.feasibility_score / count,
      acceptability_score: sum.acceptability_score / count,
      trust_score: sum.trust_score / count,
    };

    const global =
      (avg.priority_score +
        avg.impact_score +
        avg.feasibility_score +
        avg.acceptability_score +
        avg.trust_score) /
      5;

    return { count, avg, global };
  }, [votes]);




  return (
    <>
      <Card className="bg-neutral-900 border-neutral-700 w-fit">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex justify-between mb-1">
                <span>Scores agrégés </span>
                <AggregateScoreBadge
                    value={voteStats.global}
                    count={voteStats.count}
                />
              </CardTitle>
              <CardDescription className="text-xs">
                Moyenne des votes citoyens sur chaque critère.
              </CardDescription>
            </div>


          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Score global */}
          {/* <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-semibold">Score global</span>
              <span className="font-mono">
                {voteStats.global.toFixed(2)} / 5
              </span>
            </div>
            {renderScoreBar(voteStats.global)}
          </div> */}

          {/* Scores par critère */}
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span>Priorité</span>
                <span className="font-mono">
                  {voteStats.avg.priority_score.toFixed(2)} / 5
                </span>
              </div>
              {renderScoreBar(voteStats.avg.priority_score)}
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Impact attendu</span>
                <span className="font-mono">
                  {voteStats.avg.impact_score.toFixed(2)} / 5
                </span>
              </div>
              {renderScoreBar(voteStats.avg.impact_score)}
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Faisabilité</span>
                <span className="font-mono">
                  {voteStats.avg.feasibility_score.toFixed(2)} / 5
                </span>
              </div>
              {renderScoreBar(voteStats.avg.feasibility_score)}
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Acceptabilité sociale</span>
                <span className="font-mono">
                  {voteStats.avg.acceptability_score.toFixed(2)} / 5
                </span>
              </div>
              {renderScoreBar(voteStats.avg.acceptability_score)}
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Confiance</span>
                <span className="font-mono">
                  {voteStats.avg.trust_score.toFixed(2)} / 5
                </span>
              </div>
              {renderScoreBar(voteStats.avg.trust_score)}
            </div>
          </div>

          {/* {scoresView && (
            <p className="text-[11px] text-neutral-500">
              Données agrégées issues de <code>proposal_scores_view</code> :
              {` ${scoresView.total_votes ?? 0} votes, ${
                scoresView.total_reviews ?? 0
              } reviews.`}
            </p>
          )} */}

            <div className="flex items-center justify-end gap-3">

              <Button
                variant=""
                size="sm"
                onClick={() => setOpenVoteModal(true)}
              >
                {/* {existingVote ? "Modifier mon vote" : "Voter"} */}
                Voter
              </Button>
            </div>

        </CardContent>
      </Card>

      {/* Modale de vote liée à ce bloc */}
      <VoteModal
        open={openVoteModal}
        onClose={() => setOpenVoteModal(false)}
        proposalId={proposalId}
        existingVote={existingVote}
        onSubmitted={onAfterVote}
      />
    </>
  );
}
