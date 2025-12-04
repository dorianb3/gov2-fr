// src/pages/ProposalDetail.jsx
import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";

// UI
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
// import { useToast } from "@/components/ui/use-toast";
import { useToast } from "@/hooks/use-toast";

// Composants existants
import FlagButton from "@/components/common/FlagButton";
import AggregateScore from "@/components/votes/AggregateScore";
// import ProposalModal from "@/components/modals/ProposalModal";
import ProposalModal from "@/components/proposal-modal/ProposalModal";

// Nouvelles sections
import ProposalHeader from "@/components/proposals/ProposalHeader";
import ProposalSummarySection from "@/components/proposals/ProposalSummarySection";
import ProposalImplementationSection from "@/components/proposals/ProposalImplementationSection";
import ProposalAnalysisSection from "@/components/proposals/ProposalAnalysisSection";
import ProposalReviewsSection from "@/components/proposals/ProposalReviewsSection";
import ProposalCommentsSection from "@/components/proposals/ProposalCommentsSection";
import ProposalRelationsPanel from "@/components/proposals/ProposalRelationsPanel";
import ProposalVersionsPanel from "@/components/proposals/ProposalVersionsPanel";
import ProposalHistoryPanel from "@/components/proposals/ProposalHistoryPanel";

// Services (adapte les chemins si besoin)
import { getCurrentUserWithProfile, getCurrentUserRole } from "@/services/authService";
import { getProposal, getProposalScores } from "@/services/proposalsService";
import { getIssue } from "@/services/issuesService";
import { getProfile } from "@/services/profilesService";
import { getReputation } from "@/services/reputationService";
import {
  getProposalVersions,
  restoreProposalVersion,
} from "@/services/proposalVersionsService";
import {
  getProposalLinks,
  createProposalLink,
  linkAsAlternative,
  linkAsSupersedes,
} from "@/services/proposalLinksService";
import { getVotesForProposal } from "@/services/votesService";
import {
  getReviewsForProposal,
  addReviewForProposal,
} from "@/services/reviewsService";
import {
  getCommentsForProposal,
  addCommentToProposal ,
} from "@/services/commentsService";
import { getProposalAnalyses } from "@/services/proposalAnalysisService";
import { getProposalStatusHistory } from "@/services/proposalStatusService";
import {
  isFollowingTarget,
  follow,
  unfollow,
} from "@/services/followsService";
import { getFlagsCountForTarget } from "@/services/flagsService";

export default function ProposalDetail() {
  const { id: proposalId } = useParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState("");

  // Utilisateur courant
  const [currentUser, setCurrentUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Données principales
  const [proposal, setProposal] = useState(null);
  const [issue, setIssue] = useState(null);
  const [creator, setCreator] = useState(null);
  const [creatorReputation, setCreatorReputation] = useState(null);

  // Versions & relations
  const [versions, setVersions] = useState([]);
  const [links, setLinks] = useState({
    parent: null,
    forks: [],
    alternatives: [],
    supersedes: [],
    supersededBy: [],
  });

  // Votes / scores
  const [votes, setVotes] = useState([]);
  const [scoresView, setScoresView] = useState(null);

  // Analyses & statut
  const [analyses, setAnalyses] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);

  // Reviews & commentaires
  const [reviews, setReviews] = useState([]);
  const [comments, setComments] = useState([]);

  // Flags & follow
  const [flagsCount, setFlagsCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  // Modales
  const [editMode, setEditMode] = useState(null); // 'edit' | 'fork' | null
  const [relationDialogOpen, setRelationDialogOpen] = useState(false);

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------
  const formatDateTime = useCallback((value) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }, []);

  // ----------------------------------------------------------
  // Chargement principal
  // ----------------------------------------------------------
  useEffect(() => {
    if (!proposalId) return;
    loadAll(proposalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId]);

  async function loadAll(id) {
    setLoading(true);
    setGlobalError("");

    try {
      // 1) Utilisateur courant + rôle
      const [{ user, profile }, role] = await Promise.all([
        getCurrentUserWithProfile(),
        getCurrentUserRole(),
      ]);

      setCurrentUser(user);
      setCurrentProfile(profile);
      setUserRole(role);

      // 2) Proposition
      const proposalData = await getProposal(id);
      if (!proposalData) {
        setGlobalError("Impossible de charger cette proposition.");
        setProposal(null);
        setLoading(false);
        return;
      }
      setProposal(proposalData);

      // 3) Fetch parallèles
      const [
        issueData,
        creatorProfile,
        reputation,
        versionsData,
        votesData,
        scoresData,
        analysesData,
        statusHistoryData,
        reviewsData,
        commentsData,
        flags,
        follow,
        rawLinks,
      ] = await Promise.all([
        getIssue(proposalData.issue_id),
        getProfile(proposalData.created_by),
        getReputation(proposalData.created_by),
        getProposalVersions(id),
        getVotesForProposal(id),
        getProposalScores(id),
        getProposalAnalyses(id),
        getProposalStatusHistory(id),
        getReviewsForProposal(id),
        getCommentsForProposal(id),
        getFlagsCountForTarget("proposal", id),
        isFollowingTarget("proposal", id),
        getProposalLinks(id),
      ]);

      setIssue(issueData || null);
      setCreator(creatorProfile || null);
      setCreatorReputation(reputation || null);
      setVersions(versionsData || []);
      setVotes(votesData || []);
      setScoresView(scoresData || null);
      setAnalyses(analysesData || []);
      setStatusHistory(statusHistoryData || []);
      setReviews(reviewsData || []);
      setComments(commentsData || []);
      setFlagsCount(flags || 0);
      setIsFollowing(follow || false);

      // Transformer les links bruts en structure exploitable
      setLinks(transformLinks(id, rawLinks || []));
    } catch (err) {
      console.error("Error loading proposal detail:", err);
      setGlobalError(
        "Une erreur inattendue est survenue lors du chargement de la proposition."
      );
    } finally {
      setLoading(false);
    }
  }

  // Transforme les proposal_links en structure pour le mini-graphe
  function transformLinks(currentId, rawLinks) {
    const result = {
      parent: null,
      forks: [],
      alternatives: [],
      supersedes: [],
      supersededBy: [],
    };

    if (!Array.isArray(rawLinks)) return result;

    for (const link of rawLinks) {
      const source = link.source;
      const target = link.target;

      // -------- FORKS --------
      if (link.relation === "fork") {
        // Schéma : source = enfant (fork), target = parent (original)

        // 1) Si current = enfant → parent = target
        if (link.source_id === currentId && target) {
          result.parent = target;
        }

        // 2) Si current = parent → forks = tous les enfants (source)
        if (link.target_id === currentId && source) {
          result.forks.push(source);
        }
      }

      // -------- ALTERNATIVES --------
      if (link.relation === "alternative") {
        const other =
          link.source_id === currentId ? target : source;
        if (other) result.alternatives.push(other);
      }

      // -------- SUPERSEDES --------
      if (link.relation === "supersedes") {
        if (link.source_id === currentId && target) {
          // current remplace target
          result.supersedes.push(target);
        } else if (link.target_id === currentId && source) {
          // source remplace current
          result.supersededBy.push(source);
        }
      }

      // -------- SUPERSEDED_BY --------
      // (optionnel : si tu stockes aussi ce type dans la table)
      if (link.relation === "superseded_by") {
        if (link.source_id === currentId && target) {
          result.supersededBy.push(target);
        } else if (link.target_id === currentId && source) {
          result.supersedes.push(source);
        }
      }
    }

    return result;
  }


  // ----------------------------------------------------------
  // Actions : follow / unfollow
  // ----------------------------------------------------------
  async function handleToggleFollow() {
    if (!currentUser) {
      toast({
        title: "Connexion requise",
        description: "Tu dois être connecté pour suivre une proposition.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isFollowing) {
        await unfollow("proposal", proposalId);
        setIsFollowing(false);
      } else {
        await follow("proposal", proposalId);
        setIsFollowing(true);
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour ton abonnement.",
        variant: "destructive",
      });
    }
  }

  // ----------------------------------------------------------
  // Actions : revue
  // ----------------------------------------------------------
  async function handleSubmitReview(reviewPayload) {
    if (!currentUser) {
      toast({
        title: "Connexion requise",
        description: "Tu dois être connecté pour publier une revue.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addReviewForProposal({
        proposal_id: proposalId,
        // reviewer_id: currentUser.id,
        ...reviewPayload,
      });

      toast({
        title: "Revue publiée",
        description: "Merci pour votre contribution.",
      });

      const updated = await getReviewsForProposal(proposalId);
      setReviews(updated || []);
    } catch (err) {
      console.error("Error creating review:", err);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer votre revue.",
        variant: "destructive",
      });
    }
  }

  // ----------------------------------------------------------
  // Actions : commentaire
  // ----------------------------------------------------------
  async function handleSubmitComment(commentText) {
    if (!currentUser) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour commenter.",
        variant: "destructive",
      });
      return;
    }

    if (!commentText.trim()) {
      toast({
        title: "Commentaire vide",
        description: "Merci d'écrire quelque chose avant d'envoyer.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addCommentToProposal ({
        proposalId: proposalId,
        content: commentText.trim(),
      });

      toast({
        title: "Commentaire publié",
      });

      const updated = await getCommentsForProposal(proposalId);
      setComments(updated || []);
    } catch (err) {
      console.error("Error creating comment:", err);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre commentaire.",
        variant: "destructive",
      });
    }
  }

  // ----------------------------------------------------------
  // Actions : ajout de relation
  // ----------------------------------------------------------
  async function handleCreateRelation({ targetProposalId, relation }) {
    if (!targetProposalId || !relation) {
      toast({
        title: "Relation invalide",
        description: "Choisissez une proposition et un type de relation.",
        variant: "destructive",
      });
      return;
    }

    if (targetProposalId === proposalId) {
      toast({
        title: "Relation impossible",
        description: "Une proposition ne peut pas être liée à elle-même.",
        variant: "destructive",
      });
      return;
    }

    try {
      // On normalise la façon dont on écrit dans la table
      switch (relation) {
        case "alternative":
          // alternative symétrique
          await linkAsAlternative(proposalId, targetProposalId);
          break;

        case "supersedes":
          // current (proposalId) remplace targetProposalId
          await linkAsSupersedes(proposalId, targetProposalId);
          break;

        case "superseded_by":
          // targetProposalId remplace current
          await linkAsSupersedes(targetProposalId, proposalId);
          break;

        case "fork":
          // On considère ici que current = parent, target = enfant
          await createProposalLink({
            source_id: targetProposalId, // enfant
            target_id: proposalId,       // parent
            relation: "fork",
          });
          break;

        default:
          // fallback générique si un autre type arrive un jour
          await createProposalLink({
            source_id: proposalId,
            target_id: targetProposalId,
            relation,
          });
          break;
      }

      toast({
        title: "Relation créée",
        description: "La relation entre les propositions a été ajoutée.",
      });

      const rawLinks = await getProposalLinks(proposalId);
      setLinks(transformLinks(proposalId, rawLinks || []));
    } catch (err) {
      console.error("Error creating relation:", err);
      toast({
        title: "Erreur",
        description: "Impossible de créer la relation.",
        variant: "destructive",
      });
    }
  }


  // ----------------------------------------------------------
  // Actions : après vote / status / edit / fork
  // ----------------------------------------------------------
  async function handleAfterVote() {
    const [votesData, scoresData] = await Promise.all([
      getVotesForProposal(proposalId),
      getProposalScores(proposalId),
    ]);
    setVotes(votesData || []);
    setScoresView(scoresData || null);
  }

  async function handleStatusChanged() {
    const history = await getProposalStatusHistory(proposalId);
    setStatusHistory(history || []);
    // reload proposal row
    const proposalData = await getProposal(proposalId);
    setProposal(proposalData || null);
  }

  async function handleAfterEditOrFork() {
    setEditMode(null);
    await loadAll(proposalId);
  }

  // ----------------------------------------------------------
  // Actions : restauration de version
  // ----------------------------------------------------------
  async function handleRestoreVersion(versionId) {
    const confirmed = window.confirm(
      "Restaurer cette version va remplacer le contenu actuel de la proposition par l'instantané de cette version. Continuer ?"
    );
    if (!confirmed) return;

    try {
      await restoreProposalVersion(versionId);

      toast({
        title: "Version restaurée",
        description:
          "La proposition a été restaurée à partir de cette version. Une nouvelle entrée d’historique a été créée.",
      });

      // On recharge toutes les données (proposal + versions + scores…)
      await loadAll(proposalId);
    } catch (err) {
      console.error("Error restoring version:", err);
      toast({
        title: "Erreur",
        description:
          "Impossible de restaurer cette version pour le moment.",
        variant: "destructive",
      });
    }
  }

  // ----------------------------------------------------------
  // Rendu
  // ----------------------------------------------------------
  const parsedActions = useMemo(
    () => (Array.isArray(proposal?.actions) ? proposal.actions : []),
    [proposal]
  );
  const parsedMeans = useMemo(
    () => (Array.isArray(proposal?.means) ? proposal.means : []),
    [proposal]
  );
  const parsedTimeline = useMemo(
    () => (Array.isArray(proposal?.timeline) ? proposal.timeline : []),
    [proposal]
  );
  const parsedRisks = useMemo(
    () => (Array.isArray(proposal?.risks) ? proposal.risks : []),
    [proposal]
  );
  const parsedTargets = useMemo(
    () =>
      Array.isArray(proposal?.target_populations)
        ? proposal.target_populations
        : [],
    [proposal]
  );
  const parsedSources = useMemo(
    () =>
      Array.isArray(proposal?.data_sources) ? proposal.data_sources : [],
    [proposal]
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-neutral-500 animate-pulse py-10">
        Chargement de la proposition…
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="max-w-4xl mx-auto text-red-400 py-10">
        Proposition introuvable.
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-5xl mx-auto py-8">
      {globalError && (
        <div className="mb-4 text-sm text-red-400">{globalError}</div>
      )}

      {/* HEADER / CONTEXTE GLOBAL + actions principales */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <ProposalHeader
            proposal={proposal}
            issue={issue}
            creator={creator}
            creatorReputation={creatorReputation}
            userRole={userRole}
            // isFollowing={isFollowing}
            // onToggleFollow={handleToggleFollow}
            formatDateTime={formatDateTime}
            flagsCount={flagsCount}
            proposalId={proposalId}
            onStatusChanged={handleStatusChanged}
            onEdit={() => setEditMode("edit")}
            onFork={() => setEditMode("fork")}
            onOpenRelationDialog={() => setRelationDialogOpen(true)}
            currentUser={currentUser}
          />

          <div className="mt-4 flex gap-4">
            <FlagButton
              targetType="proposal"
              targetId={proposalId}
              initialCount={flagsCount}
              onFlagSubmitted={() => loadAll(proposalId)}
              size="sm"
              variant="ghost"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Scores agrégés */}
      <AggregateScore
        proposalId={proposalId}
        scoresView={scoresView}
        votes={votes}
        currentUser={currentUser}
        onAfterVote={handleAfterVote}
      />

      {/* Graphe de relations */}
      <ProposalRelationsPanel
        currentProposal={proposal}
        links={links}
        onOpenRelationDialog={() => setRelationDialogOpen(true)}
      />

      {/* Synthèse & objectifs */}
      <ProposalSummarySection
        proposal={proposal}
        parsedTargets={parsedTargets}
      />

      <Separator className="bg-neutral-700" />

      {/* Plan d’action & moyens */}
      <ProposalImplementationSection
        actions={parsedActions}
        means={parsedMeans}
        timeline={parsedTimeline}
        risks={parsedRisks}
      />

      <Separator className="bg-neutral-700" />

      {/* Sources & analyses */}
      <ProposalAnalysisSection
        sources={parsedSources}
        analyses={analyses}
      />

      <Separator className="bg-neutral-700" />

      {/* Reviews structurées */}
      <ProposalReviewsSection
        reviews={reviews}
        onSubmitReview={handleSubmitReview}
        formatDateTime={formatDateTime}
      />

      <Separator className="bg-neutral-700" />

      {/* Commentaires libres */}
      <ProposalCommentsSection
        comments={comments}
        onSubmitComment={handleSubmitComment}
        formatDateTime={formatDateTime}
      />

      <Separator className="bg-neutral-700" />

      {/* Versions & Historique des statuts */}
      <div className="grid gap-6 md:grid-cols-2">
        <ProposalVersionsPanel
          versions={versions}
          currentContentSnapshot={{
            title: proposal.title,
            objectives: proposal.objectives,
            content: proposal.content,
            actions: proposal.actions,
            means: proposal.means,
            timeline: proposal.timeline,
            risks: proposal.risks,
            territorial_scope: proposal.territorial_scope,
            target_populations: proposal.target_populations,
            impact_expected: proposal.impact_expected,
            estimated_cost: proposal.estimated_cost,
            data_sources: proposal.data_sources,
          }}
          formatDateTime={formatDateTime}
          onRestoreVersion={handleRestoreVersion}
        />

        <ProposalHistoryPanel
          statusHistory={statusHistory}
          formatDateTime={formatDateTime}
        />
      </div>


      {/* ---------------------------------------------- */}
      {/* Modale de création / édition / fork de proposal */}
      {/* ---------------------------------------------- */}
      <ProposalModal
        open={!!editMode}
        onClose={() => setEditMode(null)}
        issueId={proposal.issue_id}
        mode={editMode} // "edit" | "fork"
        baseProposal={proposal}
        onSubmitted={handleAfterEditOrFork}
      />

      {/* Modale d’édition de relations */}
      <ProposalRelationsPanel.RelationDialog
        open={relationDialogOpen}
        onOpenChange={setRelationDialogOpen}
        currentProposalId={proposalId}
        currentIssueId={proposal.issue_id}
        onCreateRelation={handleCreateRelation}
      />
    </div>
  );
}
