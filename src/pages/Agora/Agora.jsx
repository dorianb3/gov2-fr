// src/pages/Agora/Agora.jsx
import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronRight, ChevronDown, Plus, Star } from "lucide-react";

// Supabase (uniquement pour les stats globales)
import { supabase } from "../../supabase/client";

// Services
import { getCurrentUser } from "../../services/authService";
import { getProfile, getProfilesByIds } from "../../services/profilesService";
import { getReputation } from "../../services/reputationService";
import { getAllTopics } from "../../services/topicsService";
import {
  getIssuesByTopic,
  getIssuePriorityView,
} from "../../services/issuesService";
import {
  getProposalsByIssue,
  getProposalScores,
  forkProposal,
} from "../../services/proposalsService";
import {
  getProposalVersions,
} from "../../services/proposalVersionsService";
import {
  getProposalLinks,
} from "../../services/proposalLinksService";
import {
  getMyFollows,
  follow as followEntity,
  unfollow as unfollowEntity,
} from "../../services/followsService";

// Modals
import IssueModal from "@/components/modals/IssueModal";
import ProposalModal from "@/components/modals/ProposalModal";
import VoteModal from "@/components/modals/VoteModal";
import ReviewModal from "@/components/modals/ReviewModal";
import CommentModal from "@/components/modals/CommentModal";

// Sous-composants locaux
import ProposalCard from "./ProposalCard";

export default function Agora() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  /* -------------------------------------------------- */
  /* ÉTATS UTILISATEUR                                  */
  /* -------------------------------------------------- */

  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  /* -------------------------------------------------- */
  /* ÉTATS STRUCTURE (topics / issues / proposals)      */
  /* -------------------------------------------------- */

  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(null);

  const [issues, setIssues] = useState([]);
  const [issuesPriority, setIssuesPriority] = useState({}); // issue_id -> { num_proposals, total_votes }
  const [proposals, setProposals] = useState([]);

  // Proposals meta
  const [proposalScores, setProposalScores] = useState({}); // proposal_id -> scores view
  const [proposalVersionsMeta, setProposalVersionsMeta] = useState({}); // proposal_id -> { count, latestVersionNumber }
  const [proposalRelationsMeta, setProposalRelationsMeta] = useState({}); // proposal_id -> relations

  // Créateurs & réputation
  const [issueCreators, setIssueCreators] = useState({}); // user_id -> profile
  const [proposalCreators, setProposalCreators] = useState({}); // user_id -> profile
  const [creatorReputation, setCreatorReputation] = useState({}); // user_id -> score

  // Follows
  const [following, setFollowing] = useState({
    topic: {},
    issue: {},
    proposal: {},
  });

  // Stats globales
  const [globalStats, setGlobalStats] = useState({
    topics: 0,
    issues: 0,
    proposals: 0,
    votes: 0,
    reviews: 0,
  });

  /* -------------------------------------------------- */
  /* UI / FILTRES                                       */
  /* -------------------------------------------------- */

  const [loading, setLoading] = useState(true);
  const [loadingTopic, setLoadingTopic] = useState(false);

  const [expandedIssues, setExpandedIssues] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [proposalStatusFilter, setProposalStatusFilter] = useState("all");
  const [minVotesFilter, setMinVotesFilter] = useState(0);
  const [sortMode, setSortMode] = useState("default"); // "default" | "votes_desc" | "newest"

  /* Modals */
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);

  const [proposalIssueId, setProposalIssueId] = useState(null);
  const [activeProposalId, setActiveProposalId] = useState(null);

  /* -------------------------------------------------- */
  /* INIT                                               */
  /* -------------------------------------------------- */

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        // 1. Utilisateur & profil
        const user = await getCurrentUser();
        setCurrentUser(user || null);

        if (user) {
          const profile = await getProfile(user.id);
          setUserProfile(profile || null);
        } else {
          setUserProfile(null);
        }

        // 2. Topics + stats + follows
        await Promise.all([loadTopicsAndSelect(), loadGlobalStats(), loadFollows(user)]);
      } catch (e) {
        console.error("Agora init error:", e);
      } finally {
        setLoading(false);
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------------------------------- */
  /* CHARGEMENT TOPICS & SÉLECTION                      */
  /* -------------------------------------------------- */

  async function loadTopicsAndSelect() {
    try {
      const topicsData = await getAllTopics();
      setTopics(topicsData || []);

      if (!topicsData || topicsData.length === 0) {
        setSelectedTopicId(null);
        return;
      }

      // Topic depuis l’URL si présent
      const topicFromUrl = searchParams.get("topic");
      const initialTopicId =
        topicFromUrl && topicsData.find((t) => t.id === topicFromUrl)
          ? topicFromUrl
          : topicsData[0].id;

      setSelectedTopicId(initialTopicId);
      setSearchParams({ topic: initialTopicId });
      await loadTopicData(initialTopicId);
    } catch (e) {
      console.error("Error loading topics:", e);
      setTopics([]);
    }
  }

  /* -------------------------------------------------- */
  /* STATS GLOBALES (supabase direct, marginal)         */
  /* -------------------------------------------------- */

  async function loadGlobalStats() {
    try {
      const [
        { count: topicsCount },
        { count: issuesCount },
        { count: proposalsCount },
        { count: votesCount },
        { count: reviewsCount },
      ] = await Promise.all([
        supabase.from("topics").select("id", { count: "exact", head: true }),
        supabase.from("issues").select("id", { count: "exact", head: true }),
        supabase.from("proposals").select("id", { count: "exact", head: true }),
        supabase.from("votes").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
      ]);

      setGlobalStats({
        topics: topicsCount || 0,
        issues: issuesCount || 0,
        proposals: proposalsCount || 0,
        votes: votesCount || 0,
        reviews: reviewsCount || 0,
      });
    } catch (err) {
      console.error("Error loading global stats:", err);
    }
  }

  /* -------------------------------------------------- */
  /* FOLLOWS                                            */
  /* -------------------------------------------------- */

  async function loadFollows(user) {
    if (!user) {
      setFollowing({ topic: {}, issue: {}, proposal: {} });
      return;
    }
    try {
      const rows = await getMyFollows();
      const followState = { topic: {}, issue: {}, proposal: {} };

      for (const row of rows || []) {
        if (followState[row.target_type]) {
          followState[row.target_type][row.target_id] = true;
        }
      }
      setFollowing(followState);
    } catch (e) {
      console.error("Error loading follows:", e);
    }
  }

  async function toggleFollow(targetType, targetId) {
    if (!currentUser) {
      alert("Tu dois être connecté pour suivre cet élément.");
      return;
    }

    const isCurrentlyFollowing = !!following[targetType]?.[targetId];

    try {
      if (isCurrentlyFollowing) {
        await unfollowEntity(targetType, targetId);
        setFollowing((prev) => ({
          ...prev,
          [targetType]: { ...prev[targetType], [targetId]: false },
        }));
      } else {
        await followEntity(targetType, targetId);
        setFollowing((prev) => ({
          ...prev,
          [targetType]: { ...prev[targetType], [targetId]: true },
        }));
      }
    } catch (e) {
      console.error("toggleFollow error:", e);
    }
  }

  /* -------------------------------------------------- */
  /* CHARGEMENT PAR TOPIC                               */
  /* -------------------------------------------------- */

  async function loadTopicData(topicId) {
    if (!topicId) return;
    setLoadingTopic(true);

    try {
      /* ---------- Issues du topic ---------- */
      const [issuesData, priorityView] = await Promise.all([
        getIssuesByTopic(topicId),
        getIssuePriorityView(),
      ]);

      setIssues(issuesData || []);

      const priorityMap = {};
      (priorityView || [])
        .filter((row) => row.topic_id === topicId)
        .forEach((row) => {
          priorityMap[row.id] = {
            num_proposals: row.num_proposals,
            total_votes: row.total_votes,
          };
        });
      setIssuesPriority(priorityMap);

      /* ---------- Propositions du topic ---------- */
      const issueIds = (issuesData || []).map((i) => i.id);
      let proposalsData = [];
      if (issueIds.length > 0) {
        const proposalsByIssueArr = await Promise.all(
          issueIds.map((id) => getProposalsByIssue(id))
        );
        proposalsData = proposalsByIssueArr.flat();
      }
      setProposals(proposalsData);

      /* ---------- Scores des propositions ---------- */
      const scoresMap = {};
      await Promise.all(
        (proposalsData || []).map(async (p) => {
          try {
            const scoreRow = await getProposalScores(p.id);
            if (scoreRow) {
              scoresMap[p.id] = scoreRow;
            }
          } catch (e) {
            console.error("Error loading proposal score", p.id, e);
          }
        })
      );
      setProposalScores(scoresMap);

      /* ---------- Créateurs & réputation ---------- */
      const issueAuthorIds = [
        ...new Set((issuesData || []).map((i) => i.created_by).filter(Boolean)),
      ];
      const proposalAuthorIds = [
        ...new Set((proposalsData || []).map((p) => p.created_by).filter(Boolean)),
      ];
      const allAuthorIds = [...new Set([...issueAuthorIds, ...proposalAuthorIds])];

      let creatorsById = {};
      const reputationMap = {};

      if (allAuthorIds.length > 0) {
        const profiles = await getProfilesByIds(allAuthorIds);
        creatorsById = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

        await Promise.all(
          allAuthorIds.map(async (id) => {
            try {
              const rep = await getReputation(id);
              reputationMap[id] = rep?.score ?? 0;
            } catch (e) {
              console.error("Error loading reputation for", id, e);
              reputationMap[id] = 0;
            }
          })
        );
      }

      const issueCreatorsMap = {};
      for (const issue of issuesData || []) {
        if (issue.created_by && creatorsById[issue.created_by]) {
          issueCreatorsMap[issue.created_by] = creatorsById[issue.created_by];
        }
      }

      const proposalCreatorsMap = {};
      for (const proposal of proposalsData || []) {
        if (proposal.created_by && creatorsById[proposal.created_by]) {
          proposalCreatorsMap[proposal.created_by] = creatorsById[proposal.created_by];
        }
      }

      setIssueCreators(issueCreatorsMap);
      setProposalCreators(proposalCreatorsMap);
      setCreatorReputation(reputationMap);

      /* ---------- Versions & Relations (forks, alternatives, supersedes) ---------- */
      const versionsMeta = {};
      const relationsMeta = {};

      await Promise.all(
        (proposalsData || []).map(async (p) => {
          // Versions
          try {
            const versions = await getProposalVersions(p.id);
            if (versions && versions.length > 0) {
              const latest = versions.reduce((acc, v) =>
                v.version_number > acc.version_number ? v : acc
              , versions[0]);

              versionsMeta[p.id] = {
                count: versions.length,
                latestVersionNumber: latest.version_number,
              };
            } else {
              versionsMeta[p.id] = {
                count: 0,
                latestVersionNumber: 1,
              };
            }
          } catch (e) {
            console.error("Error loading proposal versions", p.id, e);
            versionsMeta[p.id] = {
              count: 0,
              latestVersionNumber: 1,
            };
          }

          // Relations (forks, alternatives, supersedes)
          try {
            const links = await getProposalLinks(p.id);
            if (links && links.length > 0) {
              const forksChildren = links.filter(
                (l) => l.relation === "fork" && l.target_id === p.id
              );
              const forkParent = links.find(
                (l) => l.relation === "fork" && l.source_id === p.id
              );
              const alternatives = links.filter((l) => l.relation === "alternative");
              const supersedes = links.find(
                (l) => l.relation === "supersedes" && l.source_id === p.id
              );
              const supersededBy = links.find(
                (l) => l.relation === "supersedes" && l.target_id === p.id
              );

              relationsMeta[p.id] = {
                forksCount: forksChildren.length,
                hasParentFork: !!forkParent,
                isFork: !!forkParent || !!p.forked_from,
                alternativesCount: alternatives.length,
                supersedes: !!supersedes,
                supersededBy: !!supersededBy,
              };
            } else {
              relationsMeta[p.id] = {
                forksCount: 0,
                hasParentFork: false,
                isFork: !!p.forked_from,
                alternativesCount: 0,
                supersedes: false,
                supersededBy: false,
              };
            }
          } catch (e) {
            console.error("Error loading proposal links", p.id, e);
            relationsMeta[p.id] = {
              forksCount: 0,
              hasParentFork: false,
              isFork: !!p.forked_from,
              alternativesCount: 0,
              supersedes: false,
              supersededBy: false,
            };
          }
        })
      );

      setProposalVersionsMeta(versionsMeta);
      setProposalRelationsMeta(relationsMeta);
    } finally {
      setLoadingTopic(false);
    }
  }

  /* -------------------------------------------------- */
  /* HANDLERS UI                                        */
  /* -------------------------------------------------- */

  function handleSelectTopic(topicId) {
    setSelectedTopicId(topicId);
    setSearchParams({ topic: topicId });
    setExpandedIssues([]);
    loadTopicData(topicId);
  }

  function openProposalModal(issueId) {
    setProposalIssueId(issueId);
    setShowProposalModal(true);
  }

  function toggleIssueExpand(issueId) {
    setExpandedIssues((prev) =>
      prev.includes(issueId) ? prev.filter((id) => id !== issueId) : [...prev, issueId]
    );
  }

  function openVoteModalForProposal(proposalId) {
    setActiveProposalId(proposalId);
    setShowVoteModal(true);
  }

  function openReviewModalForProposal(proposalId) {
    setActiveProposalId(proposalId);
    setShowReviewModal(true);
  }

  function openCommentModalForProposal(proposalId) {
    setActiveProposalId(proposalId);
    setShowCommentModal(true);
  }

  async function handleForkProposal(proposal) {
    if (!currentUser) {
      alert("Tu dois être connecté pour forker une proposition.");
      return;
    }

    try {
      const forked = await forkProposal(proposal.id, {
        title: proposal.title + " (variante)",
      });
      if (forked?.id) {
        navigate(`/proposals/${forked.id}`);
      } else {
        // fallback : reload topic
        await loadTopicData(selectedTopicId);
      }
    } catch (e) {
      console.error("Error forking proposal:", e);
      alert("Impossible de forker cette proposition pour le moment.");
    }
  }

  /* -------------------------------------------------- */
  /* DERIVÉS : PROPOSITIONS PAR ISSUE                   */
  /* -------------------------------------------------- */

  const proposalsByIssue = useMemo(() => {
    const map = {};
    for (const p of proposals || []) {
      if (!map[p.issue_id]) map[p.issue_id] = [];
      map[p.issue_id].push(p);
    }
    return map;
  }, [proposals]);

  function filterAndSortProposals(issueId) {
    const list = proposalsByIssue[issueId] || [];

    const filtered = list.filter((p) => {
      const scores = proposalScores[p.id];
      const totalVotes = scores?.total_votes || 0;

      if (proposalStatusFilter !== "all" && p.status !== proposalStatusFilter) {
        return false;
      }

      if (minVotesFilter > 0 && totalVotes < minVotesFilter) {
        return false;
      }

      if (searchTerm.trim().length > 0) {
        const search = searchTerm.toLowerCase();
        const haystack = `${p.title} ${p.content || ""} ${p.objectives || ""}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortMode === "votes_desc") {
        const va = proposalScores[a.id]?.total_votes || 0;
        const vb = proposalScores[b.id]?.total_votes || 0;
        return vb - va;
      }
      if (sortMode === "newest") {
        const da = new Date(a.created_at).getTime();
        const db = new Date(b.created_at).getTime();
        return db - da;
      }
      // default : ordre de création (déjà trié par loadTopicData : created_at desc)
      return 0;
    });

    return sorted;
  }

  /* -------------------------------------------------- */
  /* RENDU UI                                           */
  /* -------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground text-sm">
        Chargement de l’agora citoyenne…
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[80vh] gap-4 lg:gap-6">
      {/* ---------------- SIDEBAR TOPICS ---------------- */}
      <aside className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r pb-4 lg:pb-0 lg:pr-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
          <span>Sujets</span>
          {userProfile?.role === "moderator" && (
            <span className="text-[10px] uppercase tracking-wide text-primary/80">
              Mode modération
            </span>
          )}
        </h2>

        <div className="flex flex-col gap-2">
          {topics.map((t) => {
            const isSelected = selectedTopicId === t.id;
            const isFollowingTopic = !!following.topic[t.id];
            return (
              <button
                key={t.id}
                className={`group px-3 py-2 rounded text-left text-sm transition flex items-center justify-between gap-2 ${
                  isSelected ? "bg-primary/15 border border-primary text-primary" : "hover:bg-accent"
                }`}
                onClick={() => handleSelectTopic(t.id)}
              >
                <span className="truncate">{t.name}</span>
                {currentUser && (
                  <Star
                    className={`w-4 h-4 shrink-0 ${
                      isFollowingTopic ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFollow("topic", t.id);
                    }}
                  />
                )}
              </button>
            );
          })}

          {topics.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              Aucun sujet n’a encore été créé. Un modérateur peut en ajouter.
            </p>
          )}
        </div>

        {/* Stats rapides */}
        <div className="mt-6 space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Enjeux</span>
            <span className="font-mono">{globalStats.issues}</span>
          </div>
          <div className="flex justify-between">
            <span>Propositions</span>
            <span className="font-mono">{globalStats.proposals}</span>
          </div>
          <div className="flex justify-between">
            <span>Votes</span>
            <span className="font-mono">{globalStats.votes}</span>
          </div>
          <div className="flex justify-between">
            <span>Reviews</span>
            <span className="font-mono">{globalStats.reviews}</span>
          </div>
        </div>
      </aside>

      {/* ---------------- CONTENU PRINCIPAL ---------------- */}
      <div className="flex-1 flex flex-col gap-6 pb-10 pt-2 lg:pt-0">
        {/* Barre de recherche + filtres */}
        <section className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex-1 flex items-center gap-2">
            <Input
              placeholder="Rechercher une proposition (titre, contenu, objectifs)…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2 text-xs items-center">
            <span className="text-muted-foreground mr-1">Filtrer propositions :</span>

            <select
              className="bg-background border border-border rounded px-2 py-1 text-xs"
              value={proposalStatusFilter}
              onChange={(e) => setProposalStatusFilter(e.target.value)}
            >
              <option value="all">Tous statuts</option>
              <option value="draft">Brouillons</option>
              <option value="submitted">Soumises</option>
              <option value="reviewed">En revue</option>
              <option value="validated">Validées</option>
              <option value="rejected">Rejetées</option>
            </select>

            <select
              className="bg-background border border-border rounded px-2 py-1 text-xs"
              value={minVotesFilter}
              onChange={(e) => setMinVotesFilter(Number(e.target.value))}
            >
              <option value={0}>Tous les niveaux de votes</option>
              <option value={5}>≥ 5 votes</option>
              <option value={20}>≥ 20 votes</option>
              <option value={50}>≥ 50 votes</option>
            </select>

            <select
              className="bg-background border border-border rounded px-2 py-1 text-xs"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
            >
              <option value="default">Tri par défaut</option>
              <option value="votes_desc">Plus votées</option>
              <option value="newest">Plus récentes</option>
            </select>
          </div>
        </section>

        {/* Liste des enjeux + propositions */}
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold">
              Enjeux
              {loadingTopic && (
                <span className="ml-2 text-xs text-muted-foreground italic">
                  (mise à jour…)
                </span>
              )}
            </h2>
            {currentUser && (
              <Button size="sm" onClick={() => setShowIssueModal(true)}>
                <Plus className="w-3 h-3 mr-1" /> Nouvel enjeu
              </Button>
            )}
          </div>

          {issues.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Aucun enjeu enregistré pour ce sujet.
                {currentUser && (
                  <>
                    <br />
                    <Button className="mt-3" size="sm" onClick={() => setShowIssueModal(true)}>
                      Proposer un premier enjeu
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {issues.map((issue) => {
            const issuePropsAll = proposalsByIssue[issue.id] || [];
            const issueProps = filterAndSortProposals(issue.id);
            const priority = issuesPriority[issue.id];
            const totalVotes = priority?.total_votes || 0;
            const numProps = priority?.num_proposals || issuePropsAll.length;
            const isExpanded = expandedIssues.includes(issue.id);

            const issueAuthorProfile = issueCreators[issue.created_by];
            const issueCreatorName = issueAuthorProfile?.username || "Auteur inconnu";

            return (
              <Card key={issue.id} className="overflow-hidden max-w-[90vw]">
                {/* Header de l’enjeu */}
                <div className="flex flex-col items-start gap-3 px-4 pt-3 pb-2 text-xs border-b bg-muted/40">
                  <div className="flex flex-col w-full">
                    <div className="text-[11px] text-muted-foreground w-full flex justify-end">
                      Par : {issueCreatorName}
                    </div>
                    <span className="font-medium text-sm truncate">{issue.title}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {issue.description}
                    </span>
                  </div>

                  <div className="flex gap-3 items-center justify-between w-full">
                    <div className="flex gap-3 items-center">
                      <button
                        className="flex justify-center items-start"
                        onClick={() => toggleIssueExpand(issue.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 text-muted-foreground" />
                        )}
                      </button>

                      {/* Nb propositions */}
                      <div className="text-center flex gap-2">
                        <div className="text-xs font-semibold">{numProps}</div>
                        <div className="text-[10px] text-muted-foreground">propositions</div>
                      </div>

                      {/* Nb votes */}
                      <div className="text-center flex gap-2">
                        <div className="text-xs font-semibold">{totalVotes}</div>
                        <div className="text-[10px] text-muted-foreground">votes</div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="text-right flex items-center gap-2">
                      {currentUser && (
                        <Button size="sm" variant="outline" onClick={() => openProposalModal(issue.id)}>
                          <Plus className="w-3 h-3 mr-1" /> Proposer
                        </Button>
                      )}
                      {currentUser && (
                        <button
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary"
                          onClick={() => toggleFollow("issue", issue.id)}
                        >
                          <Star
                            className={`w-3 h-3 ${
                              following.issue[issue.id]
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Liste des propositions de cet enjeu */}
                {isExpanded && (
                  <div className="px-4 pb-3 pt-2 space-y-2 bg-background/60">
                    {issueProps.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        Aucune proposition ne correspond aux filtres / recherche.
                      </p>
                    )}

                    {issueProps.map((p) => {
                      const scores = proposalScores[p.id];
                      const relations = proposalRelationsMeta[p.id];
                      const versionsMeta = proposalVersionsMeta[p.id];
                      const creator = proposalCreators[p.created_by];
                      const rep = creatorReputation[p.created_by] ?? 0;
                      const isFollowingProposal = !!following.proposal[p.id];

                      return (
                        <ProposalCard
                          key={p.id}
                          proposal={p}
                          scores={scores}
                          relations={relations}
                          versionsMeta={versionsMeta}
                          creator={creator}
                          reputation={rep}
                          isFollowing={isFollowingProposal}
                          onToggleFollow={() => toggleFollow("proposal", p.id)}
                          onNavigate={() => navigate(`/proposals/${p.id}`)}
                          onOpenVote={() => openVoteModalForProposal(p.id)}
                          onOpenReview={() => openReviewModalForProposal(p.id)}
                          onOpenComment={() => openCommentModalForProposal(p.id)}
                          onFork={() => handleForkProposal(p)}
                        />
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </section>

        {/* Modals */}
        <IssueModal
          open={showIssueModal}
          onClose={() => setShowIssueModal(false)}
          topicId={selectedTopicId}
          onSubmitted={() => loadTopicData(selectedTopicId)}
        />

        <ProposalModal
          open={showProposalModal}
          onClose={() => setShowProposalModal(false)}
          issueId={proposalIssueId}
          onSubmitted={() => loadTopicData(selectedTopicId)}
        />

        <VoteModal
          open={showVoteModal}
          onClose={() => setShowVoteModal(false)}
          proposalId={activeProposalId}
          onSubmitted={() => loadTopicData(selectedTopicId)}
        />

        <ReviewModal
          open={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          proposalId={activeProposalId}
          onSubmitted={() => loadTopicData(selectedTopicId)}
        />

        <CommentModal
          open={showCommentModal}
          onClose={() => setShowCommentModal(false)}
          proposalId={activeProposalId}
          onSubmitted={() => loadTopicData(selectedTopicId)}
        />
      </div>
    </div>
  );
}
