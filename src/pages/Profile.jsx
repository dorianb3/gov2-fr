// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FollowButton from "@/components/common/FollowButton";

import { getCurrentUser } from "../services/authService";
import { getProfileOverview } from "../services/profileOverviewService";
import { getUserContributions } from "../services/contributionsService";
import { getEnrichedActivityForUser } from "../services/userActivityService";

// Petit helper pour formater les dates
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

// Helper pour une “pastille” rôle
function RoleBadge({ role }) {
  if (!role) return null;
  const labelMap = {
    citizen: "Citoyen·ne",
    expert: "Expert·e",
    elected: "Élu·e",
    moderator: "Modérateur·rice",
  };
  const label = labelMap[role] || role;
  const base =
    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide border";

  let extra = "border-slate-500 text-slate-300";
  if (role === "expert") extra = "border-blue-400 text-blue-200";
  if (role === "elected") extra = "border-green-400 text-green-200";
  if (role === "moderator") extra = "border-amber-400 text-amber-200";

  return <span className={`${base} ${extra}`}>{label}</span>;
}

// Helper pour représenter l’activité
function formatActivityLabel(a) {
  const base = a?.target_label || "";
  if (!a) return "";

  if (a.target_table === "proposals") {
    if (a.action === "INSERT") return `a créé la proposition « ${base} »`;
    if (a.action === "UPDATE") return `a mis à jour la proposition « ${base} »`;
    return `a interagi avec la proposition « ${base} »`;
  }

  if (a.target_table === "issues") {
    if (a.action === "INSERT") return `a ouvert l’enjeu « ${base} »`;
    if (a.action === "UPDATE") return `a mis à jour l’enjeu « ${base} »`;
    return `a interagi avec l’enjeu « ${base} »`;
  }

  if (a.target_table === "reviews") {
    return "a publié une revue";
  }

  // fallback générique
  return `a réalisé une action sur ${a.target_table}`;
}

export default function Profile() {
  const { id: routeUserId } = useParams();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [targetUserId, setTargetUserId] = useState(null);

  const [overview, setOverview] = useState(null);
  const [contributions, setContributions] = useState({
    issues: [],
    proposals: [],
    reviews: [],
    votes: [],
  });
  const [activity, setActivity] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [error, setError] = useState(null);

  const isOwnProfile =
    currentUser && targetUserId && currentUser.id === targetUserId;

  useEffect(() => {
    let active = true;

    async function init() {
      setLoading(true);
      setError(null);

      try {
        const user = await getCurrentUser();
        if (!active) return;
        setCurrentUser(user || null);

        let finalTargetId = routeUserId || user?.id || null;

        if (!finalTargetId) {
          setError("AUTH_REQUIRED");
          setLoading(false);
          return;
        }

        setTargetUserId(finalTargetId);

        const [ovw, contrib] = await Promise.all([
          getProfileOverview(finalTargetId),
          getUserContributions(finalTargetId),
        ]);

        if (!active) return;

        setOverview(ovw || null);
        setContributions({
          issues: contrib?.issues || [],
          proposals: contrib?.proposals || [],
          reviews: contrib?.reviews || [],
          votes: contrib?.votes || [],
        });
      } catch (err) {
        console.error("Profile init error:", err);
        if (!active) return;
        setError("LOAD_ERROR");
      } finally {
        if (active) setLoading(false);
      }

      // Charger l’activité enrichie dans un second temps
      try {
        setLoadingActivity(true);
        const activityRows = await getEnrichedActivityForUser(
          routeUserId || (await getCurrentUser())?.id,
          50
        );
        if (!active) return;
        setActivity(activityRows || []);
      } catch (err) {
        console.error("Profile activity error:", err);
      } finally {
        if (active) setLoadingActivity(false);
      }
    }

    init();
    return () => {
      active = false;
    };
  }, [routeUserId]);

  // ---------------------------------------------
  // États de chargement / erreurs
  // ---------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center min-height-[60vh] text-sm text-muted-foreground">
        Chargement du profil citoyen…
      </div>
    );
  }

  if (error === "AUTH_REQUIRED") {
    return (
      <div className="max-w-md mx-auto mt-10 text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Tu dois être connecté·e pour consulter ton profil.
        </p>
        <Button onClick={() => navigate("/login")}>Se connecter</Button>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="max-w-md mx-auto mt-10 text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Ce profil n’existe pas ou n’est pas accessible.
        </p>
      </div>
    );
  }

  const {
    username,
    bio,
    avatar_url,
    role,
    reputation_score,
    followers_count,
    following_count,
    issues_count,
    proposals_count,
    reviews_count,
    votes_count,
  } = overview;

  // fallback avatar simple avec initiale
  const initial =
    username && username.length > 0
      ? username[0].toUpperCase()
      : "?";

  // ---------------------------------------------
  // Rendu principal
  // ---------------------------------------------
  return (
    <div className="space-y-8">
      {/* HEADER PROFIL */}
      <section className="flex flex-col md:flex-row gap-6 md:items-start">
        {/* Avatar + identité */}
        <Card className="w-full md:w-80 border-border/60 bg-slate-950/60">
          <CardHeader className="flex flex-row gap-4 items-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-2xl font-semibold text-slate-100 overflow-hidden">
              {avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar_url}
                  alt={username || "Avatar"}
                  className="w-full h-full object-cover"
                />
              ) : (
                initial
              )}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">@{username}</h1>
                <RoleBadge role={role} />
              </div>
              <p className="text-xs text-muted-foreground">
                Membre depuis le{" "}
                {formatDate(overview.created_at).split(" ")[0]}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {bio && (
              <p className="text-sm text-slate-200 whitespace-pre-line">
                {bio}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div>
                <span className="block text-[11px] uppercase tracking-wide">
                  Réputation
                </span>
                <span className="text-base font-semibold text-slate-50">
                  {reputation_score ?? 0}
                </span>
              </div>

              <div className="flex gap-6">
                <div>
                  <span className="block text-[11px] uppercase tracking-wide">
                    Abonnés
                  </span>
                  <span className="text-sm font-semibold text-slate-50">
                    {followers_count ?? 0}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] uppercase tracking-wide">
                    Abonnements
                  </span>
                  <span className="text-sm font-semibold text-slate-50">
                    {following_count ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {!isOwnProfile && (
              <div className="pt-2">
                <FollowButton
                  targetType="user"
                  targetId={overview.id}
                  size="sm"
                  variant="outline"
                  className="w-full justify-center"
                />
              </div>
            )}

            {isOwnProfile && (
              <div className="pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center text-xs"
                  onClick={() => {
                    // futur : redirection vers page /settings ou modal d’édition
                    alert("Édition du profil à implémenter.");
                  }}
                >
                  Modifier mon profil
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats + infos de contribution */}
        <div className="flex-1 space-y-4">
          <Card className="border-border/60 bg-slate-950/40">
            <CardHeader>
              <CardTitle className="text-sm">
                Contributions citoyennes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Enjeux ouverts
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    {issues_count ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Propositions
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    {proposals_count ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Reviews
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    {reviews_count ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Votes
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    {votes_count ?? 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ACTIVITY + CONTRIBUTIONS DETAILLEES */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Activité */}
            <Card className="border-border/60 bg-slate-950/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs max-h-[360px] overflow-y-auto">
                {loadingActivity && (
                  <p className="text-muted-foreground text-xs">
                    Chargement de l’activité…
                  </p>
                )}

                {!loadingActivity && activity.length === 0 && (
                  <p className="text-muted-foreground text-xs italic">
                    Aucune activité enregistrée pour le moment.
                  </p>
                )}

                {activity.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-col gap-0.5 border-b border-border/40 pb-2 last:border-b-0"
                  >
                    <div className="text-[11px] text-slate-100">
                      {formatActivityLabel(a)}
                    </div>
                    <div className="text-[10px] text-muted-foreground flex justify-between">
                      <span>{a.target_table}</span>
                      <span>{formatDate(a.created_at)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Contributions détaillées */}
            <Card className="border-border/60 bg-slate-950/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  Détail des contributions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs max-h-[360px] overflow-y-auto">
                {/* Propositions */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Propositions
                    </h3>
                    <span className="font-mono text-[11px]">
                      {contributions.proposals.length}
                    </span>
                  </div>
                  {contributions.proposals.length === 0 && (
                    <p className="text-[11px] text-muted-foreground italic">
                      Aucune proposition publiée.
                    </p>
                  )}
                  {contributions.proposals.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => navigate(`/proposals/${p.id}`)}
                      className="block w-full text-left py-1.5 px-2 rounded hover:bg-slate-900/60 transition"
                    >
                      <div className="text-[11px] font-medium truncate">
                        {p.title}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex justify-between">
                        <span>{p.status}</span>
                        <span>{formatDate(p.created_at)}</span>
                      </div>
                    </button>
                  ))}
                  {contributions.proposals.length > 5 && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      + {contributions.proposals.length - 5} autres…
                    </p>
                  )}
                </div>

                {/* Enjeux */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Enjeux
                    </h3>
                    <span className="font-mono text-[11px]">
                      {contributions.issues.length}
                    </span>
                  </div>
                  {contributions.issues.length === 0 && (
                    <p className="text-[11px] text-muted-foreground italic">
                      Aucun enjeu ouvert.
                    </p>
                  )}
                  {contributions.issues.slice(0, 5).map((i) => (
                    <div
                      key={i.id}
                      className="py-1.5 px-2 rounded bg-slate-900/40 mb-1"
                    >
                      <div className="text-[11px] font-medium truncate">
                        {i.title}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex justify-between">
                        <span>Enjeu</span>
                        <span>{formatDate(i.created_at)}</span>
                      </div>
                    </div>
                  ))}
                  {contributions.issues.length > 5 && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      + {contributions.issues.length - 5} autres…
                    </p>
                  )}
                </div>

                {/* Reviews */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Reviews
                    </h3>
                    <span className="font-mono text-[11px]">
                      {contributions.reviews.length}
                    </span>
                  </div>
                  {contributions.reviews.length === 0 && (
                    <p className="text-[11px] text-muted-foreground italic">
                      Aucune review publiée.
                    </p>
                  )}
                  {contributions.reviews.slice(0, 5).map((r) => (
                    <div
                      key={r.id}
                      className="py-1.5 px-2 rounded bg-slate-900/40 mb-1"
                    >
                      <div className="text-[11px] font-medium">
                        {r.category} – score {r.score}/5
                      </div>
                      <div className="text-[10px] text-muted-foreground flex justify-between">
                        <span>Proposition liée</span>
                        <span>{formatDate(r.created_at)}</span>
                      </div>
                    </div>
                  ))}
                  {contributions.reviews.length > 5 && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      + {contributions.reviews.length - 5} autres…
                    </p>
                  )}
                </div>

                {/* Votes */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Votes
                    </h3>
                    <span className="font-mono text-[11px]">
                      {contributions.votes.length}
                    </span>
                  </div>
                  {contributions.votes.length === 0 && (
                    <p className="text-[11px] text-muted-foreground italic">
                      Aucun vote enregistré.
                    </p>
                  )}
                  {contributions.votes.slice(0, 5).map((v) => (
                    <div
                      key={v.id}
                      className="py-1.5 px-2 rounded bg-slate-900/40 mb-1"
                    >
                      <div className="text-[11px] font-medium">
                        Priorité {v.priority_score}/5, Impact {v.impact_score}/5
                      </div>
                      <div className="text-[10px] text-muted-foreground flex justify-between">
                        <span>Proposition liée</span>
                        <span>{formatDate(v.created_at)}</span>
                      </div>
                    </div>
                  ))}
                  {contributions.votes.length > 5 && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      + {contributions.votes.length - 5} autres…
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
