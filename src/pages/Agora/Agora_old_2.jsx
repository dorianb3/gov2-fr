// src/pages/Agora/Agora.jsx
import { useEffect, useState, useMemo } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { supabase } from "../../supabase/client"

// UI
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Star,
  MessageCircle,
  FileText,
  Flame,
  Activity as ActivityIcon,
  AlertTriangle,
} from "lucide-react"

// Modals
import IssueModal from "@/components/modals/IssueModal"
import ProposalModal from "@/components/modals/ProposalModal"
import VoteModal from "@/components/modals/VoteModal"
import ReviewModal from "@/components/modals/ReviewModal"
import CommentModal from "@/components/modals/CommentModal"

export default function Agora() {
  const navigate = useNavigate()

  /* -------------------------------------------------- */
  /* ÉTATS GLOBAUX                                      */
  /* -------------------------------------------------- */

  // Utilisateur
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)

  // Sidebar topics
  const [topics, setTopics] = useState([])
  const [selectedTopicId, setSelectedTopicId] = useState(null)

  // Données principales
  const [issues, setIssues] = useState([])
  const [issuesPriority, setIssuesPriority] = useState({}) // issue_id -> { num_proposals, total_votes }
  const [proposals, setProposals] = useState([])
  const [proposalScores, setProposalScores] = useState({}) // proposal_id -> scores view

  // Créateurs
  const [issueCreators, setIssueCreators] = useState({})
  const [proposalCreators, setProposalCreators] = useState({})
  const [creatorReputation, setCreatorReputation] = useState({}) // user_id -> score

  // Système de follow
  const [following, setFollowing] = useState({
    topic: {},
    issue: {},
    proposal: {},
  })

  // Stats globales
  const [globalStats, setGlobalStats] = useState({
    topics: 0,
    issues: 0,
    proposals: 0,
    votes: 0,
    reviews: 0,
  })

  // Propositions tendances & activité
  const [trendingProposals, setTrendingProposals] = useState([])
  const [activityLog, setActivityLog] = useState([])

  // UI / filtres
  const [loading, setLoading] = useState(true)
  const [loadingTopic, setLoadingTopic] = useState(false)
  const [expandedIssues, setExpandedIssues] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [proposalStatusFilter, setProposalStatusFilter] = useState("all")
  const [minVotesFilter, setMinVotesFilter] = useState(0)

  const [searchParams, setSearchParams] = useSearchParams()

  /* Modals */
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [showVoteModal, setShowVoteModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showCommentModal, setShowCommentModal] = useState(false)

  const [proposalIssueId, setProposalIssueId] = useState(null)
  const [activeProposalId, setActiveProposalId] = useState(null)

  /* -------------------------------------------------- */
  /* CHARGEMENT INITIAL                                 */
  /* -------------------------------------------------- */

  useEffect(() => {
    async function init() {
      setLoading(true)

      // 1. Utilisateur + profil
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUser(user || null)

      let profile = null
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, username, role")
          .eq("id", user.id)
          .maybeSingle()
        profile = profileData || null
      }
      setUserProfile(profile)

      // 2. Charger topics + stats + trending + activity + follows
      await Promise.all([
        loadTopicsAndSelect(),
        loadGlobalStats(),
        loadTrending(),
        loadActivityLog(),
        loadFollows(user),
      ])

      setLoading(false)
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* -------------------------------------------------- */
  /* CHARGEMENT TOPICS & SÉLECTION                      */
  /* -------------------------------------------------- */

  async function loadTopicsAndSelect() {
    const { data: topicsData, error } = await supabase
      .from("topics")
      .select("*")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error loading topics", error)
      setTopics([])
      return
    }

    setTopics(topicsData || [])

    if (!topicsData || topicsData.length === 0) {
      setSelectedTopicId(null)
      return
    }

    // topic depuis l'URL si présent
    const topicFromUrl = searchParams.get("topic")
    const initialTopicId =
      topicFromUrl && topicsData.find(t => t.id === topicFromUrl) ? topicFromUrl : topicsData[0].id

    setSelectedTopicId(initialTopicId)
    setSearchParams({ topic: initialTopicId })
    await loadTopicData(initialTopicId)
  }

  /* -------------------------------------------------- */
  /* CHARGEMENT DATA GLOBAL (stats, trending, activity) */
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
      ])

      setGlobalStats({
        topics: topicsCount || 0,
        issues: issuesCount || 0,
        proposals: proposalsCount || 0,
        votes: votesCount || 0,
        reviews: reviewsCount || 0,
      })
    } catch (err) {
      console.error("Error loading global stats", err)
    }
  }

  async function loadTrending() {
    const { data, error } = await supabase
      .from("trending_proposals_view")
      .select("*")
      .order("recent_votes", { ascending: false })
      .limit(5)

    if (error) {
      console.error("Error loading trending proposals", error)
      setTrendingProposals([])
      return
    }
    setTrendingProposals(data || [])
  }

  async function loadActivityLog() {
    const { data: logData, error } = await supabase
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error loading activity log", error)
      setActivityLog([])
      return
    }

    // Récupérer les auteurs
    const userIds = [...new Set((logData || []).map(l => l.user_id).filter(Boolean))]
    let profilesMap = {}
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, role")
        .in("id", userIds)

      profilesMap = Object.fromEntries((profilesData || []).map(p => [p.id, p]))
    }

    const enriched = (logData || []).map(entry => ({
      ...entry,
      user: entry.user_id ? profilesMap[entry.user_id] : null,
    }))

    setActivityLog(enriched)
  }

  async function loadFollows(user) {
    if (!user) {
      setFollowing({
        topic: {},
        issue: {},
        proposal: {},
      })
      return
    }

    const { data, error } = await supabase
      .from("follows")
      .select("target_type, target_id")
      .eq("follower_id", user.id)

    if (error) {
      console.error("Error loading follows", error)
      return
    }

    const followState = { topic: {}, issue: {}, proposal: {} }
    for (const row of data || []) {
      if (followState[row.target_type]) {
        followState[row.target_type][row.target_id] = true
      }
    }
    setFollowing(followState)
  }

  /* -------------------------------------------------- */
  /* CHARGEMENT PAR TOPIC                               */
  /* -------------------------------------------------- */

  async function loadTopicData(topicId) {
    if (!topicId) return
    setLoadingTopic(true)

    try {
      /* ---------- Issues du topic ---------- */
      const { data: issuesData, error: issuesError } = await supabase
        .from("issues")
        .select("*")
        .eq("topic_id", topicId)
        .order("created_at", { ascending: false })

      if (issuesError) {
        console.error("Error loading issues", issuesError)
        setIssues([])
        setProposals([])
        setIssuesPriority({})
        setProposalScores({})
        return
      }

      setIssues(issuesData || [])

      // Priorité des issues (basé sur votes/proposals)
      const { data: priorityRows } = await supabase
        .from("issue_priority_view")
        .select("*")
        .eq("topic_id", topicId)

      const priorityMap = {}
      for (const row of priorityRows || []) {
        priorityMap[row.id] = {
          num_proposals: row.num_proposals,
          total_votes: row.total_votes,
        }
      }
      setIssuesPriority(priorityMap)

      /* ---------- Créateurs des issues ---------- */
      const issueAuthorIds = [...new Set((issuesData || []).map(i => i.created_by).filter(Boolean))]
      let issueCreatorsMap = {}
      if (issueAuthorIds.length > 0) {
        const { data: creators } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", issueAuthorIds)
        issueCreatorsMap = Object.fromEntries((creators || []).map(p => [p.id, p]))
      }
      setIssueCreators(issueCreatorsMap)

      /* ---------- Propositions du topic ---------- */
      const issueIds = (issuesData || []).map(i => i.id)
      let proposalsData = []
      if (issueIds.length > 0) {
        const { data: propsData, error: propsError } = await supabase
          .from("proposals")
          .select("*")
          .in("issue_id", issueIds)
          .order("created_at", { ascending: false })

        if (propsError) {
          console.error("Error loading proposals", propsError)
        } else {
          proposalsData = propsData || []
        }
      }
      setProposals(proposalsData)

      /* ---------- Scores des propositions ---------- */
      let scoresMap = {}
      if (issueIds.length > 0) {
        const { data: scoreRows, error: scoreError } = await supabase
          .from("proposal_scores_view")
          .select("*")
          .in("issue_id", issueIds)

        if (scoreError) {
          console.error("Error loading proposal scores", scoreError)
        } else {
          scoresMap = Object.fromEntries((scoreRows || []).map(r => [r.id, r]))
        }
      }
      setProposalScores(scoresMap)

      /* ---------- Créateurs & réputation des propositions ---------- */
      const proposalAuthorIds = [...new Set(proposalsData.map(p => p.created_by).filter(Boolean))]
      let proposalCreatorsMap = {}
      let reputationMap = {}
      if (proposalAuthorIds.length > 0) {
        const [{ data: creators }, { data: repData }] = await Promise.all([
          supabase.from("profiles").select("id, username, role").in("id", proposalAuthorIds),
          supabase.from("user_reputation").select("user_id, score").in("user_id", proposalAuthorIds),
        ])

        proposalCreatorsMap = Object.fromEntries((creators || []).map(p => [p.id, p]))
        reputationMap = Object.fromEntries((repData || []).map(r => [r.user_id, r.score]))
      }
      setProposalCreators(proposalCreatorsMap)
      setCreatorReputation(reputationMap)
    } finally {
      setLoadingTopic(false)
    }
  }

  /* -------------------------------------------------- */
  /* FOLLOW / UNFOLLOW                                  */
  /* -------------------------------------------------- */

  async function toggleFollow(targetType, targetId) {
    if (!currentUser) {
      alert("Tu dois être connecté pour suivre cet élément.")
      return
    }

    const isCurrentlyFollowing = !!following[targetType]?.[targetId]

    if (isCurrentlyFollowing) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUser.id)
        .eq("target_type", targetType)
        .eq("target_id", targetId)

      if (error) {
        console.error("Error unfollowing", error)
        return
      }

      setFollowing(prev => ({
        ...prev,
        [targetType]: { ...prev[targetType], [targetId]: false },
      }))
    } else {
      const { error } = await supabase.from("follows").insert({
        follower_id: currentUser.id,
        target_type: targetType,
        target_id: targetId,
      })

      if (error) {
        // Si la ligne existe déjà, on synchronise simplement l'état local
        if (error.code === "23505") {
          setFollowing(prev => ({
            ...prev,
            [targetType]: { ...prev[targetType], [targetId]: true },
          }))
        } else {
          console.error("Error following", error)
        }
        return
      }

      setFollowing(prev => ({
        ...prev,
        [targetType]: { ...prev[targetType], [targetId]: true },
      }))
    }
  }

  /* -------------------------------------------------- */
  /* HANDLERS UI                                        */
  /* -------------------------------------------------- */

  function handleSelectTopic(topicId) {
    setSelectedTopicId(topicId)
    setSearchParams({ topic: topicId })
    setExpandedIssues([])
    loadTopicData(topicId)
  }

  function openProposalModal(issueId) {
    setProposalIssueId(issueId)
    setShowProposalModal(true)
  }

  function openVoteModal(proposalId) {
    setActiveProposalId(proposalId)
    setShowVoteModal(true)
  }

  function openReviewModal(proposalId) {
    setActiveProposalId(proposalId)
    setShowReviewModal(true)
  }

  function openCommentModal(proposalId) {
    setActiveProposalId(proposalId)
    setShowCommentModal(true)
  }

  function toggleIssueExpand(issueId) {
    setExpandedIssues(prev =>
      prev.includes(issueId) ? prev.filter(id => id !== issueId) : [...prev, issueId],
    )
  }

  /* -------------------------------------------------- */
  /* DERIVÉS : FILTRAGE / GROUPEMENT                    */
  /* -------------------------------------------------- */

  const proposalsByIssue = useMemo(() => {
    const map = {}
    for (const p of proposals) {
      if (!map[p.issue_id]) map[p.issue_id] = []
      map[p.issue_id].push(p)
    }
    return map
  }, [proposals])

  function filterProposalList(issueId) {
    const list = proposalsByIssue[issueId] || []
    return list.filter(p => {
      const scores = proposalScores[p.id]
      const totalVotes = scores?.total_votes || 0

      if (proposalStatusFilter !== "all" && p.status !== proposalStatusFilter) {
        return false
      }

      if (minVotesFilter > 0 && totalVotes < minVotesFilter) {
        return false
      }

      if (searchTerm.trim().length > 0) {
        const search = searchTerm.toLowerCase()
        const haystack = `${p.title} ${p.content || ""} ${p.objectives || ""}`.toLowerCase()
        if (!haystack.includes(search)) return false
      }

      return true
    })
  }

  /* -------------------------------------------------- */
  /* RENDU UI                                           */
  /* -------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground text-sm">
        Chargement de l’agora citoyenne…
      </div>
    )
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
          {topics.map(t => {
            const isSelected = selectedTopicId === t.id
            const isFollowingTopic = !!following.topic[t.id]
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
                    onClick={e => {
                      e.stopPropagation()
                      toggleFollow("topic", t.id)
                    }}
                  />
                )}
              </button>
            )
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
        {/* <section className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">

          <Card className="bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal text-muted-foreground">
                Enjeux actifs
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <span className="text-2xl font-semibold">{issues.length}</span>
              <ActivityIcon className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal text-muted-foreground">
                Propositions
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <span className="text-2xl font-semibold">{proposals.length}</span>
              <FileText className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>



          <Card className="bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal text-muted-foreground">
                Votes enregistrés
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <span className="text-2xl font-semibold">{globalStats.votes}</span>
              <Star className="w-5 h-5 text-yellow-400" />
            </CardContent>
          </Card>

          <Card className="bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal text-muted-foreground">
                Reviews citoyennes
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <span className="text-2xl font-semibold">{globalStats.reviews}</span>
              <MessageCircle className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </section> */}

        {/* Barre de recherche + filtres */}
        <section className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex-1 flex items-center gap-2">
            <Input
              placeholder="Rechercher une proposition (titre, contenu, objectifs)…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2 text-xs items-center">
            <span className="text-muted-foreground mr-1">Filtrer propositions :</span>

            <select
              className="bg-background border border-border rounded px-2 py-1 text-xs"
              value={proposalStatusFilter}
              onChange={e => setProposalStatusFilter(e.target.value)}
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
              onChange={e => setMinVotesFilter(Number(e.target.value))}
            >
              <option value={0}>Tous les niveaux de votes</option>
              <option value={5}>≥ 5 votes</option>
              <option value={20}>≥ 20 votes</option>
              <option value={50}>≥ 50 votes</option>
            </select>
          </div>
        </section>

        {/* <div className="flex flex-wrap gap-6"> */}
          {/* Colonne principale : Issues + Propositions */}
          <section className="space-y-4 ">
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
                      <Button
                        className="mt-3"
                        size="sm"
                        onClick={() => setShowIssueModal(true)}
                      >
                        Proposer un premier enjeu
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {issues.map(issue => {
              const issuePropsAll = proposalsByIssue[issue.id] || []
              const issueProps = filterProposalList(issue.id)
              const priority = issuesPriority[issue.id]
              const totalVotes = priority?.total_votes || 0
              const numProps = priority?.num_proposals || issuePropsAll.length
              const isExpanded = expandedIssues.includes(issue.id)

              return (
                <Card key={issue.id} className="overflow-hidden max-w-[90vw]">
                  {/* Header desktop */}
                  <div className="flex flex-col items-start gap-3 px-4 pt-3 pb-2 text-xs border-b bg-muted/40 ">

                    <div className="flex flex-col w-full">
                      {/* Auteur */}
                      <div className="text-[11px] text-muted-foreground w-full flex justify-end">
                        Par : {issueCreators[issue.created_by]?.username || "Auteur inconnu"}
                      </div>
                      <span className="font-medium text-sm truncate">{issue.title}</span>
                      <span className="text-[11px] text-muted-foreground ">
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
                      {/* Chevron */}


                      {/* CTA */}
                      <div className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openProposalModal(issue.id)}>
                          <Plus className="w-3 h-3 mr-1" /> Proposer
                        </Button>
                      </div>
                    </div>

                  </div>

                  {/* Liste des propositions */}
                  {isExpanded && (
                    <div className="px-4 pb-3 pt-2 space-y-2 bg-background/60">
                      {issueProps.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">
                          Aucune proposition ne correspond aux filtres / recherche.
                        </p>
                      )}

                      {issueProps.map(p => {
                        const scores = proposalScores[p.id]
                        const totalVotesProp = scores?.total_votes || 0

                        const avgPriority = scores?.avg_priority ?? null
                        const avgImpact = scores?.avg_impact ?? null
                        const avgFeasibility = scores?.avg_feasibility ?? null
                        const avgAcceptability = scores?.avg_acceptability ?? null
                        const avgTrust = scores?.avg_trust ?? null
                        
                        const creator = proposalCreators[p.created_by]
                        const rep = creatorReputation[p.created_by] ?? 0
                        const isFollowingProposal = !!following.proposal[p.id]

                        return (
                          <div
                            key={p.id}
                            className="border border-border/60 rounded px-3 py-2 text-xs flex flex-col gap-2 bg-card/80"
                          >

                            {/* Colonne droite : auteur + follow */}
                            <div className="flex  w-full  justify-between ">
                              <span className="w-fit text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground">
                                {p.status}
                              </span>

                              {creator && (
                                <div className="text-right flex gap-2">
                                  <div className="text-[11px] font-medium">
                                    @{creator.username}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    Réputation : {rep}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                              <div className="flex-1">

                                <div className="flex gap-2">
                                {currentUser && (
                                  <button
                                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary"
                                    onClick={() => toggleFollow("proposal", p.id)}
                                  >
                                    <Star
                                      className={`w-3 h-3 ${
                                        isFollowingProposal
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-muted-foreground"
                                      }`}
                                    />
                                    {/* {isFollowingProposal ? "Suivie" : "Suivre"} */}
                                  </button>
                                )}
                                <button
                                  onClick={() => navigate(`/proposals/${p.id}`)}
                                  className="font-semibold text-left hover:underline text-sm"
                                >
                                  {p.title}
                                </button>
                                </div>

  
 
  
                                {p.objectives && (
                                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                                    Objectif : {p.objectives}
                                  </p>
                                )}
                                {p.territorial_scope && (
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    Portée : {p.territorial_scope}
                                  </p>
                                )}
                              </div>


                            </div>

                            {/* Scores & actions */}
                            <div className="mt-1 flex flex-col items-start  justify-start gap-2">
                              <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                                <span>
                                  Votes :{" "}
                                  <span className="font-semibold text-foreground">
                                    {totalVotesProp}
                                  </span>
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

                              <div className="flex  gap-2">
                                {/* <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full xs:w-auto"
                                  onClick={() => openVoteModal(p.id)}
                                >
                                  <Star className="w-3 h-3 mr-1" /> Voter
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full xs:w-auto"
                                  onClick={() => openReviewModal(p.id)}
                                >
                                  <FileText className="w-3 h-3 mr-1" /> Review
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full xs:w-auto"
                                  onClick={() => openCommentModal(p.id)}
                                >
                                  <MessageCircle className="w-3 h-3 mr-1" /> Commenter
                                </Button> */}


                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>
              )
            })}
          </section>

          {/* Colonne droite : tendances + activité */}
          <section className="space-y-4 ">
            {/* Propositions tendances */}
            <Card>
              <CardHeader className="pb-2 flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Propositions tendances (7 derniers jours)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {trendingProposals.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Aucune proposition n’émerge particulièrement pour l’instant.
                  </p>
                )}

                {trendingProposals.map(tp => (
                  <div
                    key={tp.id}
                    className="flex items-center justify-between text-xs py-1 border-b last:border-b-0 border-border/40"
                  >
                    <div className="flex-1 pr-2 truncate">{tp.title}</div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Star className="w-3 h-3 text-yellow-400" />
                      {tp.recent_votes}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Activité récente */}
            <Card>
              <CardHeader className="pb-2 flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ActivityIcon className="w-4 h-4 text-primary" />
                  Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[280px] overflow-y-auto">
                {activityLog.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Aucune activité récente enregistrée.
                  </p>
                )}

                {activityLog.map(entry => (
                  <div
                    key={entry.id}
                    className="flex flex-col text-xs border-b last:border-b-0 border-border/40 pb-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase text-muted-foreground">
                        {entry.action} / {entry.target_table}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[11px]">
                        {entry.user ? `@${entry.user.username}` : "Utilisateur inconnu"}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                        ID : {entry.target_id}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Alerte qualité / modération */}
            <Card className="border-amber-500/40 bg-amber-500/5">
              <CardHeader className="pb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <CardTitle className="text-sm">Qualité du débat</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>
                  Les votes sont pondérés par la réputation et la qualité des contributions. Les
                  contenus signalés peuvent être masqués par les modérateurs.
                </p>
                <p className="italic">
                  Objectif : structurer le débat, pas amplifier le bruit.
                </p>
              </CardContent>
            </Card>
          </section>
        {/* </div> */}

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
  )
}
