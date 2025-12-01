// src/pages/ProposalDetail.jsx
import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase/client";

import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function ProposalDetail() {
  const { id } = useParams();

  const [userRole, setUserRole] = useState(null);

  // MAIN DATA
  const [proposal, setProposal] = useState(null);
  const [issue, setIssue] = useState(null);
  const [creator, setCreator] = useState(null);
  const [creatorReputation, setCreatorReputation] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // VERSIONING
  const [versions, setVersions] = useState([]);

  // VOTES
  const [votes, setVotes] = useState([]);
  const [vote, setVote] = useState({
    priority_score: 0,
    impact_score: 0,
    feasibility_score: 0,
    acceptability_score: 0,
    trust_score: 0,
  });
  const [voteError, setVoteError] = useState("");

  // REVIEWS
  const [reviews, setReviews] = useState([]);
  const [reviewData, setReviewData] = useState({
    category: "clarity",
    comment: "",
    score: 0,
  });
  const [reviewError, setReviewError] = useState("");

  // COMMENTS
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");

  // ANALYSIS / STATUS / SCORES / FLAGS
  const [analyses, setAnalyses] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);
  const [scoresView, setScoresView] = useState(null);
  const [flagsCount, setFlagsCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState("");

// Bloc institutionnel (changement de statut)
  const [statusValue, setStatusValue] = useState("");     // nouveau statut choisi
  const [statusComment, setStatusComment] = useState(""); // commentaire admin
  const [statusError, setStatusError] = useState("");     // erreur éventuelle
  const [loadingStatus, setLoadingStatus] = useState(false); // loader bouton

  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    loadAll();
    loadUserRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadAll() {
    setLoading(true);
    setGlobalError("");
    setVoteError("");
    setReviewError("");
    setCommentError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user || null);

      // 1) PROPOSAL
      const { data: proposalData, error: proposalError } = await supabase
        .from("proposals")
        .select("*")
        .eq("id", id)
        .single();

      if (proposalError || !proposalData) {
        console.error("Error loading proposal:", proposalError);
        setProposal(null);
        setLoading(false);
        setGlobalError("Impossible de charger cette proposition.");
        return;
      }

      setProposal(proposalData);

      // 2) PARALLEL FETCHES
      const [
        { data: profile },
        { data: reputation },
        { data: issueData },
        { data: versionData },
        { data: voteData },
        { data: reviewList },
        { data: commentList },
        { data: analysisData },
        { data: statusHistoryData },
        { data: scoresData },
        { data: flagsData },
      ] = await Promise.all([
        // creator profile
        supabase
          .from("profiles")
          .select("id, username, role")
          .eq("id", proposalData.created_by)
          .single(),
        // creator reputation
        supabase
          .from("user_reputation")
          .select("score")
          .eq("user_id", proposalData.created_by)
          .single(),
        // issue + topic (if needed)
        supabase
          .from("issues")
          .select("id, title, topic:topics(name)")
          .eq("id", proposalData.issue_id)
          .single(),
        // versions
        supabase
          .from("proposal_versions")
          .select("*")
          .eq("proposal_id", id)
          .order("version_number", { ascending: false }),
        // votes
        supabase.from("votes").select("*").eq("proposal_id", id),
        // reviews + reviewer info
        supabase
          .from("reviews")
          .select("*, reviewer:profiles(username, role)")
          .eq("proposal_id", id)
          .order("created_at", { ascending: false }),
        // comments + author info
        supabase
          .from("comments")
          .select("*, author:profiles(username)")
          .eq("proposal_id", id)
          .order("created_at", { ascending: true }),
        // analyses
        supabase
          .from("proposal_analysis")
          .select("*")
          .eq("proposal_id", id)
          .order("created_at", { ascending: true }),
        // status history + changer profile
        supabase
          .from("proposal_status_history")
          .select("*, changer:profiles(username, role)")
          .eq("proposal_id", id)
          .order("created_at", { ascending: false }),
        // scores view
        supabase
          .from("proposal_scores_view")
          .select("*")
          .eq("id", id)
          .maybeSingle(),
        // flags (signalements)
        supabase
          .from("flags")
          .select("id")
          .eq("target_type", "proposal")
          .eq("target_id", id),
      ]);

      setCreator(profile || null);
      setCreatorReputation(reputation || null);
      setIssue(issueData || null);
      setVersions(versionData || []);
      setVotes(voteData || []);
      setReviews(reviewList || []);
      setComments(commentList || []);
      setAnalyses(analysisData || []);
      setStatusHistory(statusHistoryData || []);
      setScoresView(scoresData || null);
      setFlagsCount(flagsData?.length || 0);

      // Pré-remplir le vote de l'utilisateur si déjà existant
      if (user && voteData && Array.isArray(voteData)) {
        const existing = voteData.find((v) => v.voter_id === user.id);
        if (existing) {
          setVote({
            priority_score: existing.priority_score ?? 0,
            impact_score: existing.impact_score ?? 0,
            feasibility_score: existing.feasibility_score ?? 0,
            acceptability_score: existing.acceptability_score ?? 0,
            trust_score: existing.trust_score ?? 0,
          });
        } else {
          setVote({
            priority_score: 0,
            impact_score: 0,
            feasibility_score: 0,
            acceptability_score: 0,
            trust_score: 0,
          });
        }
      }

      // 👉 ICI : check follow, maintenant qu’on a user
      let alreadyFollowing = false;
      if (user) {
        const { data: followRow, error: followError } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("target_type", "proposal")
          .eq("target_id", id)
          .maybeSingle();

        if (followError) {
          // En pratique maybeSingle renvoie error uniquement pour des cas bizarres,
          // tu peux log mais pas bloquer la page
          console.error("Error checking follow:", followError);
        }
        alreadyFollowing = !!followRow;
      }
      setIsFollowing(alreadyFollowing);

      setLoading(false);
    } catch (err) {
      console.error("Unexpected error loading proposal detail:", err);
      setGlobalError(
        "Une erreur inattendue est survenue lors du chargement de la proposition."
      );
      setLoading(false);
    }
  }

  async function loadUserRole() {
    const { data: roleData, error } = await supabase.rpc("get_user_role");

    if (error) {
      console.error("Erreur RPC get_user_role :", error);
      return;
    }

    setUserRole(roleData); // roleData = 'citizen' | 'expert' | 'moderator' | 'elected'
  }


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

  const formatDateTime = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  // ----------------------------------------------------------
  // SUBMIT VOTE
  // ----------------------------------------------------------
  async function handleVote() {
    setVoteError("");
    try {
      const { data, error: userError } = await supabase.auth.getUser();
      const user = data?.user;
      if (userError || !user) {
        setVoteError("Tu dois être connecté pour voter.");
        return;
      }

      const payload = {
        proposal_id: id,
        voter_id: user.id,
        ...vote,
      };

      const { error } = await supabase.from("votes").upsert(payload);
      if (error) {
        console.error("Vote error:", error);
        setVoteError("Impossible d'enregistrer le vote pour le moment.");
        return;
      }

      await loadAll();
    } catch (err) {
      console.error("Unexpected vote error:", err);
      setVoteError("Erreur inattendue lors de l'enregistrement du vote.");
    }
  }

  // ----------------------------------------------------------
  // SUBMIT REVIEW
  // ----------------------------------------------------------
  async function handleReview() {
    setReviewError("");
    try {
      const { data, error: userError } = await supabase.auth.getUser();
      const user = data?.user;
      if (userError || !user) {
        setReviewError("Tu dois être connecté pour déposer une review.");
        return;
      }

      if (!reviewData.comment.trim()) {
        setReviewError("Merci de détailler ta review.");
        return;
      }

      const { error } = await supabase.from("reviews").insert({
        proposal_id: id,
        reviewer_id: user.id,
        ...reviewData,
      });

      if (error) {
        console.error("Review error:", error);
        setReviewError("Impossible d'enregistrer la review.");
        return;
      }

      setReviewData({ category: "clarity", comment: "", score: 0 });
      await loadAll();
    } catch (err) {
      console.error("Unexpected review error:", err);
      setReviewError("Erreur inattendue lors de l'enregistrement de la review.");
    }
  }

  // ----------------------------------------------------------
  // SUBMIT COMMENT
  // ----------------------------------------------------------
  async function handleComment() {
    setCommentError("");
    try {
      const { data, error: userError } = await supabase.auth.getUser();
      const user = data?.user;
      if (userError || !user) {
        setCommentError("Tu dois être connecté pour commenter.");
        return;
      }

      if (!commentText.trim()) {
        setCommentError("Le commentaire ne peut pas être vide.");
        return;
      }

      const { error } = await supabase.from("comments").insert({
        proposal_id: id,
        author_id: user.id,
        content: commentText,
      });

      if (error) {
        console.error("Comment error:", error);
        setCommentError("Impossible d'envoyer ton commentaire.");
        return;
      }

      setCommentText("");
      await loadAll();
    } catch (err) {
      console.error("Unexpected comment error:", err);
      setCommentError("Erreur inattendue lors de l'envoi du commentaire.");
    }
  }



  async function handleChangeStatus() {
    setStatusError("");

    // Validation simple
    if (!statusValue) {
      setStatusError("Merci de sélectionner un statut.");
      return;
    }

    try {
      setLoadingStatus(true);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setStatusError("Tu dois être connecté.");
        setLoadingStatus(false);
        return;
      }

      // Appel RPC
      const { error } = await supabase.rpc("change_proposal_status", {
        _proposal_id: id,
        _new_status: statusValue,
        _comment: statusComment || null,
      });

      if (error) {
        console.error(error);
        setStatusError("Impossible de changer le statut.");
        setLoadingStatus(false);
        return;
      }

      // Reset
      setStatusValue("");
      setStatusComment("");

      // Recharge les données
      await loadAll();
    } finally {
      setLoadingStatus(false);
    }
  }


  



  const toggleFollow = async () => {
    if (!currentUser) {
      alert("Tu dois être connecté pour suivre une proposition.");
      return;
    }

    if (isFollowing) {
      // Unfollow
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUser.id)
        .eq("target_type", "proposal")
        .eq("target_id", id);

      if (error) {
        console.error(error);
        return;
      }

      setIsFollowing(false);
    } else {
      // Follow
      const { error } = await supabase.from("follows").insert({
        follower_id: currentUser.id,
        target_type: "proposal",
        target_id: id,
      });

      if (error) {
        console.error(error);
        return;
      }

      setIsFollowing(true);
    }
  };



  const [flagOpen, setFlagOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [flagError, setFlagError] = useState("");

  const submitFlag = async () => {
    setFlagError("");
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setFlagError("Tu dois être connecté.");
      return;
    }

    // Rate limit : 1 signalement / 10 min par exemple
    const { data: allowed } = await supabase.rpc("check_rate_limit", {
      action_name: "flag",
    });

    if (allowed === false) {
      setFlagError("Tu as signalé trop récemment. Réessaie plus tard.");
      return;
    }

    const { error } = await supabase.from("flags").insert({
      reporter_id: user.id,
      target_type: "proposal",
      target_id: id,
      reason: flagReason,
    });

    if (error) {
      console.error(error);
      setFlagError("Impossible d'envoyer le signalement.");
      return;
    }

    setFlagOpen(false);
    setFlagReason("");
    await loadAll();
  };

  // ----------------------------------------------------------
  // RENDERS AIDES
  // ----------------------------------------------------------
  const renderSectionTitle = (title, subtitle) => (
    <div className="mb-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      {subtitle && (
        <p className="text-sm text-neutral-400 mt-1">{subtitle}</p>
      )}
    </div>
  );

  const renderScoreBar = (value) => {
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
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-neutral-500 animate-pulse">
        Chargement de la proposition…
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="max-w-4xl mx-auto text-red-400">
        Proposition introuvable.
      </div>
    );
  }

  // ----------------------------------------------------------
  // UI START
  // ----------------------------------------------------------
  const parsedActions = Array.isArray(proposal.actions)
    ? proposal.actions
    : [];
  const parsedMeans = Array.isArray(proposal.means)
    ? proposal.means
    : [];
  const parsedTimeline = Array.isArray(proposal.timeline)
    ? proposal.timeline
    : [];
  const parsedRisks = Array.isArray(proposal.risks)
    ? proposal.risks
    : [];
  const parsedTargets = Array.isArray(proposal.target_populations)
    ? proposal.target_populations
    : [];
  const parsedSources = Array.isArray(proposal.data_sources)
    ? proposal.data_sources
    : [];

  return (
    <div className="space-y-14 max-w-5xl mx-auto py-8">
      {globalError && (
        <div className="mb-4 text-sm text-red-400">{globalError}</div>
      )}

      {/* ------------------------------------------------------ */}
      {/* HEADER / CONTEXTE GLOBAL */}
      {/* ------------------------------------------------------ */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-3xl">{proposal.title}</CardTitle>
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
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge className="bg-primary text-black">
                Statut : {proposal.status}
              </Badge>
              <div className="text-xs text-neutral-400 text-right">
                Créée le {formatDateTime(proposal.created_at)}
                {proposal.updated_at && (
                  <>
                    <br />
                    Dernière mise à jour : {formatDateTime(proposal.updated_at)}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-300">
            <div>
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
            <div className="flex items-center gap-3 text-xs text-neutral-400">
              <span>{voteStats.count} vote(s)</span>
              <span>{reviews.length} review(s)</span>
              <span>{comments.length} commentaire(s)</span>
              {flagsCount > 0 && (
                <span className="text-red-400">
                  {flagsCount} signalement(s)
                </span>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <section className="flex gap-4">
        <Button
          onClick={toggleFollow}
          variant={isFollowing ? "secondary" : "default"}
        >
          {isFollowing ? "Se désabonner" : "Suivre cette proposition"}
        </Button>

        <Button variant="destructive" onClick={() => setFlagOpen(true)}>
          Signaler
        </Button>
      </section>



      {/* ------------------------------------------------------ */}
      {/* SYNTHÈSE & OBJECTIFS */}
      {/* ------------------------------------------------------ */}
      <section>
        {renderSectionTitle(
          "Synthèse et objectifs",
          "Comprendre rapidement ce que vise cette proposition."
        )}

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

      <Separator className="bg-neutral-700" />

      {/* ------------------------------------------------------ */}
      {/* PLAN D’ACTION & MOYENS */}
      {/* ------------------------------------------------------ */}
      <section>
        {renderSectionTitle(
          "Plan d’action et mise en œuvre",
          "Les actions concrètes et les moyens nécessaires."
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Actions concrètes</CardTitle>
              <CardDescription>
                Les étapes opérationnelles proposées.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {parsedActions.length === 0 && (
                <p className="text-sm text-neutral-400">
                  Aucune action détaillée.
                </p>
              )}
              {parsedActions.map((a, idx) => (
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

          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Moyens nécessaires</CardTitle>
              <CardDescription>
                Ressources humaines, matérielles et organisationnelles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {parsedMeans.length === 0 ? (
                <p className="text-sm text-neutral-400">
                  Aucun moyen n&apos;a été détaillé.
                </p>
              ) : (
                <ul className="list-disc list-inside space-y-1 text-sm text-neutral-200">
                  {parsedMeans.map((m, idx) => (
                    <li key={idx}>{m.description || JSON.stringify(m)}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="bg-neutral-700" />

      {/* ------------------------------------------------------ */}
      {/* TIMELINE & RISQUES */}
      {/* ------------------------------------------------------ */}
      <section>
        {renderSectionTitle(
          "Déploiement dans le temps et risques",
          "Comment la mesure se déroule et quels sont les risques associés."
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Timeline / Phases</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {parsedTimeline.length === 0 && (
                <p className="text-sm text-neutral-400">
                  Aucune timeline n&apos;a été fournie.
                </p>
              )}
              {parsedTimeline.map((t, idx) => (
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
              <CardTitle className="text-lg">Risques & atténuation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {parsedRisks.length === 0 && (
                <p className="text-sm text-neutral-400">
                  Aucun risque identifié dans la fiche.
                </p>
              )}
              {parsedRisks.map((r, idx) => (
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

      <Separator className="bg-neutral-700" />

      {/* ------------------------------------------------------ */}
      {/* SOURCES & ANALYSES */}
      {/* ------------------------------------------------------ */}
      <section>
        {renderSectionTitle(
          "Données, sources & analyses",
          "Sur quelles données s’appuie la proposition ? Quels sont les impacts estimés ?"
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Sources de données</CardTitle>
              <CardDescription>
                Liens vers statistiques, rapports, études…
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {parsedSources.length === 0 ? (
                <p className="text-sm text-neutral-400">
                  Aucune source spécifique n&apos;est liée à cette proposition.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {parsedSources.map((s, idx) => (
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

      <Separator className="bg-neutral-700" />

      {/* ------------------------------------------------------ */}
      {/* SCORES & VOTES */}
      {/* ------------------------------------------------------ */}
      <section>
        {renderSectionTitle(
          "Votes et scores",
          "Perception globale de la proposition par la communauté."
        )}

        <div className="grid gap-6 md:grid-cols-[2fr,3fr]">
          {/* Stats agrégées */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Scores agrégés</CardTitle>
              <CardDescription>
                Moyenne des votes citoyens sur chaque critère.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-semibold">Score global</span>
                  <span className="font-mono">
                    {voteStats.global.toFixed(2)} / 5
                  </span>
                </div>
                {renderScoreBar(voteStats.global)}
              </div>

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

              {scoresView && (
                <p className="text-[11px] text-neutral-500">
                  Données agrégées issues de <code>proposal_scores_view</code> :
                  {` ${scoresView.total_votes ?? 0} votes, ${
                    scoresView.total_reviews ?? 0
                  } reviews.`}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Formulaire de vote */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Ton vote</CardTitle>
              <CardDescription>
                Note cette proposition sur les différents critères (0 à 5).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ["priority_score", "Priorité du problème"],
                ["impact_score", "Impact attendu"],
                ["feasibility_score", "Faisabilité"],
                ["acceptability_score", "Acceptabilité sociale"],
                ["trust_score", "Confiance (sources, honnêteté)"],
              ].map(([key, label]) => (
                <div key={key} className="flex items-center gap-4">
                  <label className="w-40 text-xs">{label}</label>
                  <Input
                    type="number"
                    min={0}
                    max={5}
                    value={vote[key]}
                    onChange={(e) =>
                      setVote((prev) => ({
                        ...prev,
                        [key]: Number(e.target.value),
                      }))
                    }
                    className="w-20 h-8 text-sm"
                  />
                </div>
              ))}

              {voteError && (
                <p className="text-xs text-red-400">{voteError}</p>
              )}

              <Button
                onClick={handleVote}
                className="bg-primary text-black w-fit"
              >
                Enregistrer mon vote
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="bg-neutral-700" />

      {/* ------------------------------------------------------ */}
      {/* REVIEWS STRUCTURÉES */}
      {/* ------------------------------------------------------ */}
      <section>
        {renderSectionTitle(
          "Reviews structurées",
          "Analyses qualitatives par les citoyens, experts ou élus."
        )}

        <Card className="bg-neutral-900 border-neutral-700 p-5 space-y-5">
          {/* FORM */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={reviewData.category}
                onChange={(e) =>
                  setReviewData((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                className="bg-neutral-800 border border-neutral-600 p-2 rounded text-sm"
              >
                <option value="clarity">Clarté</option>
                <option value="feasibility">Faisabilité</option>
                <option value="cost">Coût</option>
                <option value="impact">Impact</option>
                <option value="risks">Risques</option>
                <option value="legal">Juridique</option>
              </select>

              <Input
                type="number"
                min={0}
                max={5}
                value={reviewData.score}
                onChange={(e) =>
                  setReviewData((prev) => ({
                    ...prev,
                    score: Number(e.target.value),
                  }))
                }
                className="w-20 h-8 text-sm"
              />
            </div>

            <Textarea
              placeholder="Propose une analyse argumentée (points forts, limites, conditions de réussite, etc.)"
              value={reviewData.comment}
              onChange={(e) =>
                setReviewData((prev) => ({
                  ...prev,
                  comment: e.target.value,
                }))
              }
              className="min-h-[120px]"
            />

            {reviewError && (
              <p className="text-xs text-red-400">{reviewError}</p>
            )}

            <Button
              className="bg-primary text-black w-fit"
              onClick={handleReview}
            >
              Publier la review
            </Button>
          </div>

          <Separator className="bg-neutral-700" />

          {/* LIST OF REVIEWS */}
          <div className="space-y-4">
            {reviews.length === 0 && (
              <p className="text-sm text-neutral-400">
                Aucune review pour le moment. Sois le premier à proposer une
                analyse structurée.
              </p>
            )}

            {reviews.map((r) => (
              <Card
                key={r.id}
                className="bg-neutral-800 border-neutral-700 p-4"
              >
                <div className="flex justify-between items-center gap-3">
                  <div className="text-sm text-neutral-300">
                    <span className="font-semibold text-neutral-100">
                      {r.reviewer?.username ?? "Utilisateur"}
                    </span>
                    {r.reviewer?.role && (
                      <>
                        {" "}
                        —{" "}
                        <span className="italic text-neutral-400">
                          {r.reviewer.role}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="uppercase text-xs">
                      {r.category}
                    </Badge>
                    <span className="text-xs text-neutral-400">
                      Score : {r.score} / 5
                    </span>
                  </div>
                </div>

                <p className="mt-2 text-sm text-neutral-100 whitespace-pre-line">
                  {r.comment}
                </p>

                <div className="text-[11px] text-neutral-500 mt-2">
                  Publiée le {formatDateTime(r.created_at)}
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </section>

      <Separator className="bg-neutral-700" />

      {/* ------------------------------------------------------ */}
      {/* COMMENTAIRES LIBRES */}
      {/* ------------------------------------------------------ */}
      <section>
        {renderSectionTitle(
          "Commentaires",
          "Discussion libre autour de la proposition (hors structure de review)."
        )}

        {/* WRITE COMMENT */}
        <Card className="bg-neutral-900 border-neutral-700 p-4 space-y-4">
          <Textarea
            placeholder="Réagis à la proposition, pose des questions, partage des exemples concrets…"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="min-h-[80px]"
          />
          {commentError && (
            <p className="text-xs text-red-400">{commentError}</p>
          )}
          <Button
            className="bg-primary text-black w-fit"
            onClick={handleComment}
          >
            Publier le commentaire
          </Button>
        </Card>

        {/* LIST COMMENTS */}
        <div className="space-y-3 mt-6">
          {comments.length === 0 && (
            <p className="text-sm text-neutral-400">
              Aucun commentaire pour le moment.
            </p>
          )}

          {comments.map((c) => (
            <Card
              key={c.id}
              className="bg-neutral-900 border-neutral-700 p-3"
            >
              <div className="flex justify-between items-center text-xs text-neutral-400">
                <span>
                  <strong className="text-neutral-200">
                    {c.author?.username ?? "Utilisateur"}
                  </strong>{" "}
                  a écrit :
                </span>
                <span>{formatDateTime(c.created_at)}</span>
              </div>
              <p className="mt-2 text-sm text-neutral-100 whitespace-pre-line">
                {c.content}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <Separator className="bg-neutral-700" />

      {/* ------------------------------------------------------ */}
      {/* HISTORIQUE DES VERSIONS & STATUTS */}
      {/* ------------------------------------------------------ */}
      <section>
        {renderSectionTitle(
          "Historique et transparence",
          "Évolution du contenu de la proposition et décisions institutionnelles."
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Versions */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Versions</CardTitle>
              <CardDescription>
                Historique des modifications de contenu.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[320px] overflow-y-auto">
              {versions.length === 0 && (
                <p className="text-sm text-neutral-400">
                  Aucune version enregistrée (en dehors de la version actuelle).
                </p>
              )}
              {versions.map((v) => (
                <Card
                  key={v.id}
                  className="bg-neutral-950 border-neutral-800 p-3"
                >
                  <div className="flex justify-between items-center text-xs text-neutral-400 mb-1">
                    <span>Version {v.version_number}</span>
                    <span>{formatDateTime(v.created_at)}</span>
                  </div>
                  <p className="text-xs text-neutral-200 whitespace-pre-line line-clamp-6">
                    {v.content}
                  </p>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Statut */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Historique des statuts
              </CardTitle>
              <CardDescription>
                Suivi de la trajectoire institutionnelle.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[320px] overflow-y-auto">
              {statusHistory.length === 0 && (
                <p className="text-sm text-neutral-400">
                  Aucun changement de statut n&apos;a été enregistré pour le
                  moment.
                </p>
              )}
              {statusHistory.map((h) => (
                <Card
                  key={h.id}
                  className="bg-neutral-950 border-neutral-800 p-3"
                >
                  <div className="flex justify-between items-center text-xs text-neutral-400 mb-1">
                    <span>
                      {h.old_status} →{" "}
                      <span className="font-semibold text-neutral-100">
                        {h.new_status}
                      </span>
                    </span>
                    <span>{formatDateTime(h.created_at)}</span>
                  </div>
                  {h.changer && (
                    <div className="text-[11px] text-neutral-400 mb-1">
                      Décidé par{" "}
                      <span className="font-semibold text-neutral-100">
                        {h.changer.username}
                      </span>
                      {h.changer.role && (
                        <>
                          {" "}
                          —{" "}
                          <span className="italic">
                            {h.changer.role}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  {h.comment && (
                    <p className="text-xs text-neutral-200 whitespace-pre-line mt-1">
                      {h.comment}
                    </p>
                  )}
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {userRole === "moderator" || userRole === "elected" ? (
        <section>
          {renderSectionTitle(
            "Gestion institutionnelle",
            "Actions réservées aux modérateurs et aux élus."
          )}

          <Card className="bg-card border-neutral-700 p-5 space-y-4">
            <div className="">
              <div className="flex gap-4 items-center mb-4">

              <Badge className="bg-primary text-black">
                Statut : {proposal.status}
              </Badge>
                <label className="text-sm">Changer le statut :</label>
                <select
                  className="w-fit bg-neutral-800 border border-neutral-600 mt-1 rounded p-2 text-xs"
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value)}
                >
                  <option value="">— Choisir —</option>
                  <option value="submitted">Soumis</option>
                  <option value="reviewed">En revue</option>
                  <option value="validated">Validé</option>
                  <option value="rejected">Rejeté</option>
                </select>
              </div>

              <Textarea
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                className="mt-1"
                placeholder="Commentaire (optionnel)"
              />
            </div>

            {statusError && (
              <p className="text-sm text-red-400">{statusError}</p>
            )}

            <Button disabled={loadingStatus} onClick={handleChangeStatus} className="bg-primary text-black w-fit"> 
              {loadingStatus ? "Mise à jour…" : "Modifier le statut"}
            </Button>
          </Card>
        </section>
      ) : null}

      <Dialog open={flagOpen} onOpenChange={setFlagOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signaler cette proposition</DialogTitle>
            <DialogDescription>
              Explique brièvement pourquoi tu la signales.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            placeholder="Raison du signalement : contenu haineux, SPAM, manipulation…"
            className="min-h-[120px]"
          />

          {flagError && <p className="text-red-500 text-sm">{flagError}</p>}

          <Button onClick={submitFlag} className="w-full">
            Envoyer le signalement
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
