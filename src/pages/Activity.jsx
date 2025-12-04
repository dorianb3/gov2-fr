// src/pages/Activity.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { getCurrentUser } from "@/services/authService";
import {
  getGlobalEnrichedActivity,
  getEnrichedActivityForUser,
} from "@/services/userActivityService";
import { getPersonalizedFeed } from "@/services/activityFeedService";

import { Globe2, Users, GitCommit, FileText, MessageCircle } from "lucide-react";

// Helpers
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

function mapTargetType(table) {
  switch (table) {
    case "proposals":
      return { label: "Proposition", color: "bg-blue-500/20 text-blue-200" };
    case "issues":
      return { label: "Enjeu", color: "bg-emerald-500/20 text-emerald-200" };
    case "reviews":
      return { label: "Review", color: "bg-amber-500/20 text-amber-200" };
    default:
      return { label: table, color: "bg-slate-500/20 text-slate-200" };
  }
}

function formatActionLabel(action, table, targetLabel) {
  const base = targetLabel || "";
  const act = (action || "").toUpperCase();

  if (table === "proposals") {
    if (act === "INSERT") return `a créé la proposition « ${base} »`;
    if (act === "UPDATE") return `a mis à jour la proposition « ${base} »`;
    if (act === "DELETE") return `a supprimé une proposition`;
    return `a interagi avec la proposition « ${base} »`;
  }

  if (table === "issues") {
    if (act === "INSERT") return `a ouvert l’enjeu « ${base} »`;
    if (act === "UPDATE") return `a mis à jour l’enjeu « ${base} »`;
    if (act === "DELETE") return `a fermé un enjeu`;
    return `a interagi avec l’enjeu « ${base} »`;
  }

  if (table === "reviews") {
    if (act === "INSERT") return "a publié une review";
    if (act === "UPDATE") return "a mis à jour une review";
    if (act === "DELETE") return "a supprimé une review";
    return "a interagi avec une review";
  }

  return `a réalisé une action sur ${table}`;
}

function passesTypeFilter(item, filter) {
  if (filter === "all") return true;
  if (filter === "proposals") return item.target_table === "proposals";
  if (filter === "issues") return item.target_table === "issues";
  if (filter === "reviews") return item.target_table === "reviews";
  if (filter === "other")
    return !["proposals", "issues", "reviews"].includes(item.target_table);
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

// Composant d’un événement individuel
function ActivityItem({ event, onOpenUser, onOpenTarget }) {
  const { label, color } = mapTargetType(event.target_table);

  const ActionIcon =
    event.target_table === "proposals"
      ? FileText
      : event.target_table === "issues"
      ? GitCommit
      : event.target_table === "reviews"
      ? MessageCircle
      : GitCommit;

  const sentence = formatActionLabel(
    event.action,
    event.target_table,
    event.target_label
  );

  return (
    <div className="flex gap-3 py-2 border-b border-border/40 last:border-b-0">
      {/* Avatar + colonne gauche */}
      <button
        onClick={onOpenUser}
        className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 text-[11px] font-semibold text-slate-100 flex items-center justify-center hover:ring-2 hover:ring-primary/60 transition"
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
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenUser}
            className="font-medium hover:underline text-[11px]"
          >
            @{event.user_username || "citoyen.ne"}
          </button>

          <span className="text-[10px] text-muted-foreground mx-1">·</span>

          <span className="text-[10px] text-muted-foreground">
            {formatDate(event.created_at)}
          </span>
        </div>

        <div className="flex items-start gap-2">
          <ActionIcon className="w-3 h-3 mt-[3px] text-muted-foreground" />
          <p className="text-xs leading-snug">{sentence}</p>
        </div>

        <div className="flex items-center justify-between mt-1">
          <Badge
            className={`border-none text-[10px] px-2 py-0.5 rounded-full ${color}`}
          >
            {label}
          </Badge>

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
  );
}

// PAGE PRINCIPALE
export default function Activity() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("global"); // "global" | "personal"

  const [globalActivity, setGlobalActivity] = useState([]);
  const [personalActivity, setPersonalActivity] = useState([]);

  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [loadingPersonal, setLoadingPersonal] = useState(true);
  const [errorGlobal, setErrorGlobal] = useState(null);
  const [errorPersonal, setErrorPersonal] = useState(null);

  const [typeFilter, setTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("7d");

  // --------------------------------------------------
  // INIT : user + deux feeds
  // --------------------------------------------------
  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const user = await getCurrentUser();
        if (!active) return;
        setCurrentUser(user || null);

        // activité globale
        setLoadingGlobal(true);
        const global = await getGlobalEnrichedActivity(100);
        if (!active) return;
        setGlobalActivity(global);
        setErrorGlobal(null);
      } catch (err) {
        console.error("Activity global error:", err);
        if (active) setErrorGlobal("LOAD_ERROR");
      } finally {
        if (active) setLoadingGlobal(false);
      }

      // fil perso seulement si connecté
      try {
        if (!active) return;
        if (!currentUser && !(await getCurrentUser())) {
          setPersonalActivity([]);
          setErrorPersonal("AUTH_REQUIRED");
          return;
        }

        setLoadingPersonal(true);
        const feed = await getPersonalizedFeed(100);
        console.log("feed", feed)
        if (!active) return;
        setPersonalActivity(feed);
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
  // Dérivés : listes filtrées
  // --------------------------------------------------
  const globalFiltered = useMemo(
    () =>
      globalActivity.filter(
        (ev) =>
          passesTypeFilter(ev, typeFilter) &&
          passesTimeFilter(ev, timeFilter)
      ),
    [globalActivity, typeFilter, timeFilter]
  );

  const personalFiltered = useMemo(
    () =>
      personalActivity.filter(
        (ev) =>
          passesTypeFilter(ev, typeFilter) &&
          passesTimeFilter(ev, timeFilter)
      ),
    [personalActivity, typeFilter, timeFilter]
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
    if (!ev?.target_table || !ev?.target_id) return;
    if (ev.target_table === "proposals") {
      navigate(`/proposals/${ev.target_id}`);
    } else if (ev.target_table === "issues") {
      // Pour l’instant, on redirige vers l’Agora globale.
      // Plus tard : ajouter param ?issue=... et highlight.
      navigate("/agora");
    } else {
      // fallback générique
      navigate("/agora");
    }
  }

  // --------------------------------------------------
  // Rendu
  // --------------------------------------------------
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-primary" />
            Fil citoyen
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Suis en temps réel l&apos;activité de la communauté : enjeux
            ouverts, propositions, reviews… et ton propre réseau politique.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs items-center">
          <span className="text-muted-foreground mr-1">Filtrer :</span>

          <select
            className="bg-background border border-border rounded px-2 py-1 text-xs"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">Tous types</option>
            <option value="proposals">Propositions</option>
            <option value="issues">Enjeux</option>
            <option value="reviews">Reviews</option>
            <option value="other">Autres</option>
          </select>

          <select
            className="bg-background border border-border rounded px-2 py-1 text-xs"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="24h">Dernières 24h</option>
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="all">Tout</option>
          </select>

          <Button
            size="xs"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Actualiser
          </Button>
        </div>
      </section>

      {/* TABS */}
      <section>
        <div className="flex gap-2 text-xs mb-3">
          <button
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs transition ${
              activeTab === "global"
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:bg-accent"
            }`}
            onClick={() => setActiveTab("global")}
          >
            <Globe2 className="w-3 h-3" />
            Activité globale
          </button>

          <button
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs transition ${
              activeTab === "personal"
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:bg-accent"
            }`}
            onClick={() => setActiveTab("personal")}
          >
            <Users className="w-3 h-3" />
            Mon fil
          </button>
        </div>

        <Card className="border-border/60 bg-slate-950/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>
                {activeTab === "global"
                  ? "Activité de toute la plateforme"
                  : "Activité des éléments que tu suis"}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {activeList.length} évènement(s)
              </span>
            </CardTitle>
          </CardHeader>

          <Separator className="opacity-40" />

          <CardContent className="pt-3 max-h-[520px] overflow-y-auto text-xs">
            {activeTab === "personal" &&
              errorPersonal === "AUTH_REQUIRED" && (
                <div className="text-xs text-muted-foreground space-y-2">
                  <p>
                    Connecte-toi et commence à suivre des enjeux,
                    propositions ou utilisateurs pour voir ton fil
                    personnalisé.
                  </p>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => navigate("/login")}
                  >
                    Se connecter
                  </Button>
                </div>
              )}

            {loadingActive && (
              <p className="text-xs text-muted-foreground">
                Chargement du fil…
              </p>
            )}

            {!loadingActive && errorActive === "LOAD_ERROR" && (
              <p className="text-xs text-red-400">
                Impossible de charger l&apos;activité pour le moment.
              </p>
            )}

            {!loadingActive &&
              !errorActive &&
              activeList.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  Aucune activité ne correspond aux filtres sélectionnés.
                </p>
              )}

            {!loadingActive &&
              !errorActive &&
              activeList.length > 0 && (
                <div className="divide-y divide-border/40">
                  {activeList.map((ev) => (
                    <ActivityItem
                      key={ev.id}
                      event={ev}
                      onOpenUser={() => goToUser(ev.user_id)}
                      onOpenTarget={() => goToTarget(ev)}
                    />
                  ))}
                </div>
              )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
