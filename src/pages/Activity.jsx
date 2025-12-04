// src/pages/Activity.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

import { Globe2, Users, GitCommit, FileText, MessageCircle, ThumbsUp, UserPlus, Flame, Clock, BarChart3,
  Activity as ActivityIcon
 } from "lucide-react";

import { getCurrentUser } from "@/services/authService";
import {
  getGlobalEnrichedActivity,
} from "@/services/userActivityService";
import { getPersonalizedFeed } from "@/services/activityFeedService";
import { getTopContributors } from "@/services/reputationService";
import { getTrendingProposals } from "@/services/proposalsService";
import { getIssuePriorityView } from "@/services/issuesService";
import { getMyFollows } from "@/services/followsService";

/* -------------------------------------------------- */
/* Helpers                                            */
/* -------------------------------------------------- */

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapTargetType(table, action) {
  const act = (action || "").toUpperCase();

  // On distingue quelques grandes familles
  if (table === "proposals") {
    return { label: "Proposition", color: "bg-blue-500/15 text-blue-200" };
  }
  if (table === "issues") {
    return { label: "Enjeu", color: "bg-emerald-500/15 text-emerald-200" };
  }
  if (table === "reviews") {
    return { label: "Review", color: "bg-amber-500/15 text-amber-200" };
  }
  if (table === "comments") {
    return { label: "Commentaire", color: "bg-purple-500/15 text-purple-200" };
  }
  if (act.startsWith("VOTE_") || table === "votes") {
    return { label: "Vote", color: "bg-cyan-500/15 text-cyan-200" };
  }
  if (act.startsWith("LIKE_") || act.startsWith("FOLLOW_")) {
    return { label: "Social", color: "bg-pink-500/15 text-pink-200" };
  }
  if (table === "proposal_analysis") {
    return { label: "Analyse", color: "bg-indigo-500/15 text-indigo-200" };
  }
  if (table === "proposal_links") {
    return { label: "Lien", color: "bg-slate-500/15 text-slate-200" };
  }

  return { label: table || "Activité", color: "bg-slate-500/15 text-slate-200" };
}

function formatActionLabel(event) {
  const table = event.target_table;
  const action = (event.action || "").toUpperCase();
  const base = event.target_label || "";

  // Propositions
  if (table === "proposals") {
    if (action === "INSERT") return `a créé la proposition « ${base} »`;
    if (action === "UPDATE") return `a mis à jour la proposition « ${base} »`;
    if (action === "DELETE") return `a supprimé une proposition`;
    if (action === "STATUS_CHANGED") {
      const oldS = event.metadata?.old_status;
      const newS = event.metadata?.new_status;
      return `a changé le statut de « ${base} » (${oldS} → ${newS})`;
    }
    if (action === "VERSION_RESTORED") {
      return `a restauré une version précédente de « ${base} »`;
    }
    return `a interagi avec la proposition « ${base} »`;
  }

  // Enjeux
  if (table === "issues") {
    if (action === "INSERT") return `a ouvert l’enjeu « ${base} »`;
    if (action === "UPDATE") return `a mis à jour l’enjeu « ${base} »`;
    if (action === "DELETE") return `a fermé un enjeu`;
    return `a interagi avec l’enjeu « ${base} »`;
  }

  // Reviews
  if (table === "reviews") {
    if (action === "INSERT" || "REVIEW_ADDED") return "a publié une review";
    if (action === "UPDATE") return "a mis à jour une review";
    if (action === "DELETE") return "a supprimé une review";
    return "a interagi avec une review";
  }

  // Commentaires
  if (table === "comments" || action === "COMMENT_ADDED") {
    return "a commenté une proposition";
  }

  // Votes
  if (action === "VOTE_CAST") {
    return "a voté sur une proposition";
  }
  if (action === "VOTE_UPDATED") {
    return "a mis à jour son vote";
  }

  // Likes
  if (action === "LIKE_ADDED") {
    if (event.target_table === "proposals") return "a aimé une proposition";
    if (event.target_table === "issues") return "a aimé un enjeu";
    if (event.target_table === "comment") return "a aimé un commentaire";
    return "a aimé un contenu";
  }

  // Follows
  if (action === "FOLLOW_ADDED") {
    if (event.target_table === "user") return "suit un nouveau citoyen";
    if (event.target_table === "topic") return "suit un nouveau sujet";
    if (event.target_table === "issue") return "suit un enjeu";
    if (event.target_table === "proposal") return "suit une proposition";
    return "suit un nouvel élément";
  }

  // Liens entre propositions
  if (table === "proposal_links") {
    const relation = event.metadata?.relation;
    if (relation === "fork") return "a forké une proposition";
    if (relation === "alternative") return "a relié une alternative";
    if (relation === "supersedes") return "a substitué une proposition";
    if (relation === "superseded_by") return "a marqué une proposition comme obsolète";
    return "a lié deux propositions";
  }

  // Analyses
  if (table === "proposal_analysis" || action === "ANALYSIS_ADDED") {
    const type = event.metadata?.type;
    return type
      ? `a ajouté une analyse ${type}`
      : "a ajouté une analyse";
  }

  return `a réalisé une action sur ${table || "la plateforme"}`;
}

function passesTypeFilter(item, filter) {
  if (filter === "all") return true;

  const table = item.target_table;
  const action = (item.action || "").toUpperCase();

  if (filter === "proposals") return table === "proposals";
  if (filter === "issues") return table === "issues";
  if (filter === "reviews") return table === "reviews";
  if (filter === "comments") return table === "comments";
  if (filter === "votes") return action.startsWith("VOTE_") || table === "votes";
  if (filter === "social") return action.startsWith("LIKE_") || action.startsWith("FOLLOW_");
  if (filter === "system")
    return (
      table === "proposal_analysis" ||
      table === "proposal_links" ||
      action === "STATUS_CHANGED" ||
      action === "VERSION_RESTORED"
    );

  return true;
}

function passesTimeFilter(item, filter) {
  if (filter === "all") return true;
  if (!item.created_at) return false;
  const ts = new Date(item.created_at).getTime();
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  if (filter === "24h") return now - ts <= oneDay;
  if (filter === "7d") return now - ts <= 7 * oneDay;
  if (filter === "30d") return now - ts <= 30 * oneDay;
  return true;
}

function passesSearch(item, searchTerm) {
  if (!searchTerm) return true;
  const q = searchTerm.toLowerCase();

  const parts = [
    item.user_username || "",
    item.target_label || "",
    item.action || "",
  ];

  // On ajoute aussi le texte sentence, en recalculant
  parts.push(formatActionLabel(item));

  return parts.some((p) => p.toLowerCase().includes(q));
}

/**
 * Résumé simple des follows
 * rows: [{ target_type, target_id, created_at, ... }]
 */
function buildFollowsSummary(rows) {
  const summary = {
    counts: { topic: 0, issue: 0, proposal: 0, user: 0 },
  };

  for (const row of rows || []) {
    if (summary.counts[row.target_type] == null) {
      summary.counts[row.target_type] = 0;
    }
    summary.counts[row.target_type] += 1;
  }

  return summary;
}

/* -------------------------------------------------- */
/* Composant d’un événement individuel               */
/* -------------------------------------------------- */

function ActivityItem({ event, onOpenUser, onOpenTarget, isFollowBased }) {
  const { label, color } = mapTargetType(event.target_table, event.action);

  const actionIconProps = {
    className: "w-3 h-3 mt-[3px] text-muted-foreground",
  };

  let ActionIcon = GitCommit;

  const act = (event.action || "").toUpperCase();
  const table = event.target_table;

  if (table === "proposals") ActionIcon = FileText;
  else if (table === "issues") ActionIcon = GitCommit;
  else if (table === "reviews") ActionIcon = MessageCircle;
  else if (table === "comments") ActionIcon = MessageCircle;
  else if (act.startsWith("VOTE_")) ActionIcon = BarChart3;
  else if (act.startsWith("LIKE_")) ActionIcon = ThumbsUp;
  else if (act.startsWith("FOLLOW_")) ActionIcon = UserPlus;

  const sentence = formatActionLabel(event);

  const commentPreview =
    event.target_table === "comments"
      ? event.metadata?.content_preview || ""
      : null;

  const voteScores =
    act.startsWith("VOTE_") && event.metadata?.scores
      ? event.metadata.scores
      : null;

  const reviewData =
    event.target_table === "reviews"
      ? {
          category: event.metadata?.category,
          score: event.metadata?.score,
          comment_preview: event.metadata?.comment_preview,
          proposal_id: event.metadata?.proposal_id
        }
      : null;
  return (
    <div
      className={`flex gap-3 py-3 border-b border-border/40 last:border-b-0 ${
        isFollowBased ? "bg-primary/5" : ""
      }`}
    >
      {/* Avatar + colonne gauche */}
      <button
        onClick={onOpenUser}
        className={`flex-shrink-0 w-8 h-8 rounded-full text-[11px] font-semibold flex items-center justify-center hover:ring-2 hover:ring-primary/60 transition ${
          event.user_avatar
            ? "bg-slate-900"
            : "bg-slate-800 text-slate-100"
        }`}
        title={event.user_username || "Auteur"}
      >
        {event.user_avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.user_avatar}
            alt={event.user_username || "Avatar"}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          (event.user_username || "?").slice(0, 1).toUpperCase()
        )}
      </button>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col gap-1 text-xs">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={onOpenUser}
            className="font-medium hover:underline text-[11px]"
          >
            @{event.user_username || "citoyen.ne"}
          </button>

          {isFollowBased && (
            <Badge className="border-none bg-primary/10 text-primary text-[9px] px-2 py-0.5 rounded-full">
              Dans ton réseau
            </Badge>
          )}

          <span className="text-[10px] text-muted-foreground mx-1">·</span>

          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(event.created_at)}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-start gap-2">
            <ActionIcon {...actionIconProps} />
            <p className="text-xs leading-snug">{sentence}</p>
          </div>

          {commentPreview && (
            <p className="text-[11px] text-muted-foreground pl-5 border-l border-border/40">
              « {commentPreview} »
            </p>
          )}

          {voteScores && (
            <div className="flex flex-wrap gap-1 pl-5 text-[10px] text-muted-foreground">
              {["priority", "impact", "feasibility", "acceptability", "trust"].map(
                (key) =>
                  voteScores[key] != null && (
                    <span
                      key={key}
                      className="px-1.5 py-0.5 border border-border/50 rounded-full"
                    >
                      {key[0].toUpperCase()} : {voteScores[key]} / 5
                    </span>
                  )
              )}
            </div>
          )}

          {reviewData && (
            <div className="pl-5 text-[11px] text-muted-foreground flex flex-col gap-1 border-l border-border/40">
              <p>
                Review : <span className="font-medium">{reviewData.category}</span>{" "}
                — Score <span className="font-semibold">{reviewData.score}/5</span>
              </p>

              {reviewData.comment_preview && (
                <p className="italic">« {reviewData.comment_preview} »</p>
              )}
            </div>
          )}
       
        </div>

        <div className="flex items-center justify-between mt-1">
          <Badge
            className={`border-none text-[10px] px-2 py-0.5 rounded-full ${color}`}
          >
            {label}
          </Badge>

          <div className="flex items-center gap-2">
            {event.target_label && (
              <button
                onClick={onOpenTarget}
                className="text-[10px] text-primary hover:underline"
              >
                Ouvrir « {event.target_label} »
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/* PAGE PRINCIPALE                                   */
/* -------------------------------------------------- */

export default function Activity() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("personal"); // "personal" | "global"

  const [globalActivity, setGlobalActivity] = useState([]);
  const [personalActivity, setPersonalActivity] = useState([]);

  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [loadingPersonal, setLoadingPersonal] = useState(true);
  const [errorGlobal, setErrorGlobal] = useState(null);
  const [errorPersonal, setErrorPersonal] = useState(null);

  const [typeFilter, setTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("7d");
  const [searchTerm, setSearchTerm] = useState("");

  const [trendingProposals, setTrendingProposals] = useState([]);
  const [priorityIssues, setPriorityIssues] = useState([]);
  const [topContributors, setTopContributors] = useState([]);
  const [myFollows, setMyFollows] = useState([]);
  const [followsSummary, setFollowsSummary] = useState(null);

  // --------------------------------------------------
  // INIT : user + feeds + contexte global
  // --------------------------------------------------
  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const user = await getCurrentUser();
        if (!active) return;
        setCurrentUser(user || null);
      } catch (err) {
        console.error("getCurrentUser error:", err);
      }

      // ACTIVITÉ GLOBALE + CONTEXTE
      try {
        setLoadingGlobal(true);

        const [global, trending, issues, contributors] = await Promise.all([
          getGlobalEnrichedActivity(200),
          getTrendingProposals(5),
          getIssuePriorityView(5),
          getTopContributors(5),
        ]);

        if (!active) return;

        setGlobalActivity(global || []);
        setTrendingProposals(trending || []);
        setPriorityIssues(issues || []);
        setTopContributors(contributors || []);
        setErrorGlobal(null);
      } catch (err) {
        console.error("Activity global error:", err);
        if (active) setErrorGlobal("LOAD_ERROR");
      } finally {
        if (active) setLoadingGlobal(false);
      }

      // FIL PERSO + FOLLOWS (si connecté)
      try {
        if (!active) return;

        const user = await getCurrentUser();
        if (!user) {
          setPersonalActivity([]);
          setErrorPersonal("AUTH_REQUIRED");
          setMyFollows([]);
          setFollowsSummary(buildFollowsSummary([]));
          return;
        }

        setLoadingPersonal(true);

        const [feed, follows] = await Promise.all([
          getPersonalizedFeed({ limit: 200 }),
          getMyFollows(200),
        ]);

        if (!active) return;
        setPersonalActivity(feed || []);
        setMyFollows(follows || []);
        setFollowsSummary(buildFollowsSummary(follows || []));
        setErrorPersonal(null);
      } catch (err) {
        console.error("Activity personal error:", err);
        if (active) {
          setErrorPersonal(
            err?.message === "AUTH_REQUIRED" ? "AUTH_REQUIRED" : "LOAD_ERROR"
          );
        }
      } finally {
        if (active) setLoadingPersonal(false);
      }
    }

    init();
    return () => {
      active = false;
    };
  }, []);

  // --------------------------------------------------
  // Sets de follows pour marquer les événements
  // --------------------------------------------------
  const followKeySet = useMemo(() => {
    const set = new Set();
    for (const f of myFollows || []) {
      set.add(`${f.target_type}:${f.target_id}`);
    }
    return set;
  }, [myFollows]);

  // --------------------------------------------------
  // Dérivés : listes filtrées
  // --------------------------------------------------
  const globalFiltered = useMemo(
    () =>
      globalActivity.filter(
        (ev) =>
          passesTypeFilter(ev, typeFilter) &&
          passesTimeFilter(ev, timeFilter) &&
          passesSearch(ev, searchTerm)
      ),
    [globalActivity, typeFilter, timeFilter, searchTerm]
  );

  const personalFiltered = useMemo(
    () =>
      personalActivity.filter(
        (ev) =>
          passesTypeFilter(ev, typeFilter) &&
          passesTimeFilter(ev, timeFilter) &&
          passesSearch(ev, searchTerm)
      ),
    [personalActivity, typeFilter, timeFilter, searchTerm]
  );

  const activeList =
    activeTab === "global" ? globalFiltered : personalFiltered;

  const loadingActive =
    activeTab === "global" ? loadingGlobal : loadingPersonal;

  const errorActive =
    activeTab === "global" ? errorGlobal : errorPersonal;

  // --------------------------------------------------
  // Navigation vers profil / cible
  // --------------------------------------------------
  function goToUser(id) {
    if (!id) return;
    navigate(`/profile/${id}`);
  }

  function goToTarget(ev) {
    if (!ev) return;

    const { target_table, target_id, metadata, action } = ev;
    const act = (action || "").toUpperCase();

    // FOLLOW user -> profil
    if (act === "FOLLOW_ADDED" && target_table === "user") {
      navigate(`/profile/${target_id}`);
      return;
    }

    // Propositions directes
    if (target_table === "proposals") {
      navigate(`/proposals/${target_id}`);
      return;
    }

    // Commentaires / votes / analyses / liens / status -> proposition liée
    if (
      target_table === "comments" ||
      target_table === "reviews" ||
      target_table === "votes" ||
      target_table === "proposal_analysis" ||
      target_table === "proposal_links" ||
      act === "STATUS_CHANGED" ||
      act === "VERSION_RESTORED" ||
      act === "VOTE_CAST" ||
      act === "VOTE_UPDATED"
    ) {
      const proposalId =
        metadata?.proposal_id ||
        metadata?.source_id ||
        metadata?.target_id ||
        target_id;

      if (proposalId) {
        navigate(`/proposals/${proposalId}`);
        return;
      }
    }

    // Enjeux / sujets : renvoi vers l'agora pour l'instant
    if (target_table === "issues" || target_table === "topic") {
      navigate("/agora");
      return;
    }

    // Fallback générique
    navigate("/agora");
  }

  // Marqueur "Dans ton réseau"
  function isEventFromFollowed(event) {
    // Direct : follow sur la cible
    if (followKeySet.has(`${event.target_table}:${event.target_id}`)) {
      return true;
    }

    const act = (event.action || "").toUpperCase();

    // Commentaire / vote / analyse sur une proposition suivie
    const propId =
      event.metadata?.proposal_id ||
      event.metadata?.source_id ||
      event.metadata?.target_id;

    if (
      propId &&
      (event.target_table === "comments" ||
        event.target_table === "reviews" ||
        act.startsWith("VOTE_") ||
        event.target_table === "proposal_analysis" ||
        event.target_table === "proposal_links")
    ) {
      return followKeySet.has(`proposal:${propId}`);
    }

    return false;
  }

  // --------------------------------------------------
  // Rendu
  // --------------------------------------------------
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-primary" />
            Fil d&apos;activité citoyen
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Un flux en temps réel de la vie démocratique : tout ce qui se passe
            sur les enjeux, les propositions, les votes, les commentaires et ton réseau
            politique.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 text-xs">
          <div className="inline-flex items-center rounded-full border border-border/60 px-2 py-1 gap-2 bg-background/60">
            <ActivityIcon className="w-3 h-3 text-primary" />
            <span className="font-medium">Modes d&apos;affichage</span>
            <div className="flex gap-1 ml-2">
              <Button
                size="xs"
                variant={activeTab === "personal" ? "default" : "outline"}
                className="h-6 text-[11px] px-2"
                onClick={() => setActiveTab("personal")}
              >
                Mon fil
              </Button>
              <Button
                size="xs"
                variant={activeTab === "global" ? "default" : "outline"}
                className="h-6 text-[11px] px-2"
                onClick={() => setActiveTab("global")}
              >
                Activité globale
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* LAYOUT 3 COLONNES (stacké sur mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-[230px_minmax(0,1fr)_260px] gap-6">
        {/* COLONNE GAUCHE : Filtres + réseau */}
        <div className="space-y-4">
          <Card className="border-border/70 bg-background/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-primary" />
                Filtres du fil
              </CardTitle>
              <CardDescription className="text-[11px]">
                Affine ton flux pour te concentrer sur un type d&apos;activité ou
                une période.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[11px]">Type</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    size="xs"
                    variant={typeFilter === "all" ? "default" : "outline"}
                    className="h-7 text-[10px]"
                    onClick={() => setTypeFilter("all")}
                  >
                    Tout
                  </Button>
                  <Button
                    size="xs"
                    variant={typeFilter === "proposals" ? "default" : "outline"}
                    className="h-7 text-[10px]"
                    onClick={() => setTypeFilter("proposals")}
                  >
                    Propositions
                  </Button>
                  <Button
                    size="xs"
                    variant={typeFilter === "issues" ? "default" : "outline"}
                    className="h-7 text-[10px]"
                    onClick={() => setTypeFilter("issues")}
                  >
                    Enjeux
                  </Button>
                  <Button
                    size="xs"
                    variant={typeFilter === "comments" ? "default" : "outline"}
                    className="h-7 text-[10px]"
                    onClick={() => setTypeFilter("comments")}
                  >
                    Commentaires
                  </Button>
                  <Button
                    size="xs"
                    variant={typeFilter === "votes" ? "default" : "outline"}
                    className="h-7 text-[10px]"
                    onClick={() => setTypeFilter("votes")}
                  >
                    Votes
                  </Button>
                  <Button
                    size="xs"
                    variant={typeFilter === "social" ? "default" : "outline"}
                    className="h-7 text-[10px]"
                    onClick={() => setTypeFilter("social")}
                  >
                    Social
                  </Button>
                  <Button
                    size="xs"
                    variant={typeFilter === "reviews" ? "default" : "outline"}
                    className="h-7 text-[10px]"
                    onClick={() => setTypeFilter("reviews")}
                  >
                    Reviews
                  </Button>
                  <Button
                    size="xs"
                    variant={typeFilter === "system" ? "default" : "outline"}
                    className="h-7 text-[10px]"
                    onClick={() => setTypeFilter("system")}
                  >
                    Système
                  </Button>
                </div>
              </div>

              <Separator className="my-2" />

              <div className="space-y-1">
                <span className="font-medium text-[11px]">Période</span>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { value: "24h", label: "24h" },
                    { value: "7d", label: "7j" },
                    { value: "30d", label: "30j" },
                    { value: "all", label: "Tout" },
                  ].map((o) => (
                    <Button
                      key={o.value}
                      size="xs"
                      variant={timeFilter === o.value ? "default" : "outline"}
                      className="h-7 text-[10px]"
                      onClick={() => setTimeFilter(o.value)}
                    >
                      {o.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator className="my-2" />

              <div className="space-y-1">
                <span className="font-medium text-[11px]">Recherche</span>
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Auteur, titre, action…"
                  className="h-8 text-[11px]"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-background/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Mon réseau
              </CardTitle>
              <CardDescription className="text-[11px]">
                Synthèse de ce que tu suis. C&apos;est ce qui alimente ton fil
                personnalisé.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {followsSummary ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded border border-border/50">
                      <p className="text-[10px] text-muted-foreground mb-1">
                        Sujets
                      </p>
                      <p className="text-lg font-semibold">
                        {followsSummary.counts.topic ?? 0}
                      </p>
                    </div>
                    <div className="p-2 rounded border border-border/50">
                      <p className="text-[10px] text-muted-foreground mb-1">
                        Enjeux
                      </p>
                      <p className="text-lg font-semibold">
                        {followsSummary.counts.issue ?? 0}
                      </p>
                    </div>
                    <div className="p-2 rounded border border-border/50">
                      <p className="text-[10px] text-muted-foreground mb-1">
                        Propositions
                      </p>
                      <p className="text-lg font-semibold">
                        {followsSummary.counts.proposal ?? 0}
                      </p>
                    </div>
                    <div className="p-2 rounded border border-border/50">
                      <p className="text-[10px] text-muted-foreground mb-1">
                        Citoyen·nes
                      </p>
                      <p className="text-lg font-semibold">
                        {followsSummary.counts.user ?? 0}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground mt-1">
                    Plus tu suis d&apos;enjeux et de propositions, plus ton fil
                    devient riche et pertinent.
                  </p>

                  <Button
                    size="xs"
                    variant="outline"
                    className="w-full h-7 text-[11px] mt-1"
                    onClick={() => navigate("/agora")}
                  >
                    Explorer de nouveaux sujets
                  </Button>
                </>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Connexion en cours ou données en chargement…
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* COLONNE CENTRALE : Feed */}
        <div className="space-y-3">
          <Card className="border-border/70 bg-background/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {activeTab === "personal" ? (
                  <>
                    <UserPlus className="w-4 h-4 text-primary" />
                    Mon fil personnalisé
                  </>
                ) : (
                  <>
                    <Globe2 className="w-4 h-4 text-primary" />
                    Activité globale de la plateforme
                  </>
                )}
              </CardTitle>
              <CardDescription className="text-[11px]">
                {activeTab === "personal"
                  ? "Flux pondéré par ce que tu suis : enjeux, propositions, citoyens…"
                  : "Vue panoramique de tout ce qui se passe sur Agora."}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-1">
              {loadingActive && (
                <div key="loading"  className="py-6 text-center text-xs text-muted-foreground">
                  Chargement du fil…
                </div>
              )}

              {!loadingActive && errorActive === "AUTH_REQUIRED" && activeTab === "personal" && (
                <div className="py-6 text-center text-xs text-muted-foreground flex flex-col gap-2 items-center">
                  <p>Connecte-toi pour voir ton fil personnalisé.</p>
                  <Button
                    size="sm"
                    className="h-7 text-[11px]"
                    onClick={() => navigate("/login")}
                  >
                    Se connecter
                  </Button>
                </div>
              )}

              {!loadingActive && !errorActive && activeList.length === 0 && (
                <div key="empty" className="py-6 text-center text-xs text-muted-foreground">
                  Aucune activité correspondant à ces filtres pour le moment.
                  Essaie d&apos;élargir la période ou le type.
                </div>
              )}

              {!loadingActive && errorActive && errorActive !== "AUTH_REQUIRED" && (
                <div key="error"  className="py-6 text-center text-xs text-red-400">
                  Une erreur est survenue lors du chargement du fil.
                </div>
              )}

              {!loadingActive && !errorActive && activeList.length > 0 && (
                <div className="divide-y divide-border/40">
                  {activeList.map((ev) => (
                    <ActivityItem
                      key={ev.id}
                      event={ev}
                      onOpenUser={() => goToUser(ev.user_id)}
                      onOpenTarget={() => goToTarget(ev)}
                      isFollowBased={isEventFromFollowed(ev)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* COLONNE DROITE : Vue politique globale */}
        <div className="space-y-4">
          <Card className="border-border/70 bg-background/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Flame className="w-4 h-4 text-primary" />
                Propositions qui montent
              </CardTitle>
              <CardDescription className="text-[11px]">
                Propositions ayant reçu le plus de votes récemment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {trendingProposals && trendingProposals.length > 0 ? (
                trendingProposals.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    className="w-full text-left text-[11px] border border-border/50 rounded px-2 py-1.5 hover:border-primary/70 hover:bg-primary/5 transition"
                    onClick={() => navigate(`/proposals/${p.id}`)}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium line-clamp-2">{p.title}</span>
                      {p.recent_votes != null && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          {p.recent_votes} votes
                        </span>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Pas encore de propositions tendances.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-background/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-primary" />
                Enjeux prioritaires
              </CardTitle>
              <CardDescription className="text-[11px]">
                Enjeux qui concentrent le plus de propositions et de votes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {priorityIssues && priorityIssues.length > 0 ? (
                priorityIssues.slice(0, 5).map((i) => (
                  <div
                    key={i.id}
                    className="border border-border/50 rounded px-2 py-1.5 text-[11px] flex flex-col gap-1"
                  >
                    <div className="font-medium line-clamp-2">
                      {i.title}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{i.num_proposals} propositions</span>
                      <span>{i.total_votes} votes</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Pas encore d&apos;enjeux fortement priorisés.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-background/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Top contributeurs
              </CardTitle>
              <CardDescription className="text-[11px]">
                Citoyen·nes les plus actifs selon le score de réputation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {topContributors && topContributors.length > 0 ? (
                topContributors.map((c) => (
                  <div
                    key={c.user_id}
                    className="flex items-center justify-between text-[11px] border border-border/50 rounded px-2 py-1.5"
                  >
                    <span className="truncate max-w-[120px]">
                      @{(c.user_id || "").slice(0, 8)}…
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Score : {c.score}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Les premiers contributeurs apparaîtront ici.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
