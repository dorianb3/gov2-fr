// src/pages/Agora/Agora.jsx
import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { supabase } from "../../supabase/client"

// UI
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ChevronRight, ChevronDown, Plus, Star, MessageCircle, FileText } from "lucide-react"

// Modals externalisés
import IssueModal from "@/components/modals/IssueModal"
import ProposalModal from "@/components/modals/ProposalModal"
import VoteModal from "@/components/modals/VoteModal"
import ReviewModal from "@/components/modals/ReviewModal"
import CommentModal from "@/components/modals/CommentModal"

export default function Agora() {
  /* -------------------------------------------------- */
  /* ETATS                                               */
  /* -------------------------------------------------- */

  // Sidebar topics
  const [topics, setTopics] = useState([])
  const [selectedTopicId, setSelectedTopicId] = useState(null)

  // Main data
  const [issues, setIssues] = useState([])
  const [proposals, setProposals] = useState([])

  const [issueCreators, setIssueCreators] = useState({})
  const [proposalCreators, setProposalCreators] = useState({})

  const [voteStats, setVoteStats] = useState({ total: 0, byProposal: {} })
  const [reviewStats, setReviewStats] = useState({ total: 0, byProposal: {} })

  const [loading, setLoading] = useState(true)
  const [expandedIssues, setExpandedIssues] = useState([])

  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  /* Modals */
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [showVoteModal, setShowVoteModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showCommentModal, setShowCommentModal] = useState(false)

  /* Form State */
  const [proposalIssueId, setProposalIssueId] = useState(null)
  const [activeProposalId, setActiveProposalId] = useState(null)

  /* -------------------------------------------------- */
  /* CHARGEMENT DES TOPICS                               */
  /* -------------------------------------------------- */
  useEffect(() => {
    async function loadTopics() {
      const { data } = await supabase
        .from("topics")
        .select("*")
        .order("created_at", { ascending: true })

      setTopics(data || [])

      const urlTopic = searchParams.get("topic")
      if (urlTopic) {
        setSelectedTopicId(urlTopic)
      } else if (data?.length > 0) {
        setSelectedTopicId(data[0].id)
        setSearchParams({ topic: data[0].id })
      }
    }
    loadTopics()
  }, [])

  /* -------------------------------------------------- */
  /* CHARGEMENT DES ISSUES + PROPOSALS + STATS          */
  /* -------------------------------------------------- */
  useEffect(() => {
    if (selectedTopicId) loadTopicData(selectedTopicId)
  }, [selectedTopicId])


  async function loadTopicData(topicId) {
    setLoading(true)

    /* ---------- Load Issues ---------- */
    const { data: issuesData } = await supabase
      .from("issues")
      .select("*")
      .eq("topic_id", topicId)
      .order("created_at", { ascending: false })

    setIssues(issuesData || [])

    /* Creators */
    const issueAuthorIds = [...new Set((issuesData || []).map(i => i.created_by))]
    if (issueAuthorIds.length > 0) {
      const { data: creators } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", issueAuthorIds)
      const map = Object.fromEntries(creators.map(p => [p.id, p]))
      setIssueCreators(map)
    } else setIssueCreators({})

    /* ---------- Load Proposals ---------- */
    const issueIds = (issuesData || []).map(i => i.id)
    let proposalsData = []

    if (issueIds.length > 0) {
      const { data } = await supabase
        .from("proposals")
        .select("*")
        .in("issue_id", issueIds)
        .order("created_at", { ascending: false })

      proposalsData = data || []
    }
    setProposals(proposalsData)

    /* Proposal creators */
    const proposalAuthorIds = [...new Set(proposalsData.map(p => p.created_by))]
    if (proposalAuthorIds.length > 0) {
      const { data: creators } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", proposalAuthorIds)
      const map = Object.fromEntries(creators.map(p => [p.id, p]))
      setProposalCreators(map)
    } else setProposalCreators({})

    /* ---------- Votes ---------- */
    const proposalIds = proposalsData.map(p => p.id)
    if (proposalIds.length > 0) {
      const { data: votes } = await supabase
        .from("votes")
        .select("proposal_id, priority_score, impact_score, feasibility_score, acceptability_score, trust_score")
        .in("proposal_id", proposalIds)

      const byProposal = {}
      let total = 0

      votes?.forEach(v => {
        total++
        const sum =
          v.priority_score +
          v.impact_score +
          v.feasibility_score +
          v.acceptability_score +
          v.trust_score

        if (!byProposal[v.proposal_id]) byProposal[v.proposal_id] = { count: 0, sum: 0 }
        byProposal[v.proposal_id].count++
        byProposal[v.proposal_id].sum += sum
      })

      setVoteStats({ total, byProposal })
    } else setVoteStats({ total: 0, byProposal: {} })

    /* ---------- Reviews ---------- */
    if (proposalIds.length > 0) {
      const { data: reviews } = await supabase
        .from("reviews")
        .select("proposal_id")
        .in("proposal_id", proposalIds)

      const byProposal = {}
      let total = 0

      reviews?.forEach(r => {
        total++
        if (!byProposal[r.proposal_id]) byProposal[r.proposal_id] = { count: 0 }
        byProposal[r.proposal_id].count++
      })

      setReviewStats({ total, byProposal })
    } else setReviewStats({ total: 0, byProposal: {} })

    setLoading(false)
  }

  /* -------------------------------------------------- */
  /* HELPERS                                            */
  /* -------------------------------------------------- */
  const currentTopic = topics.find(t => t.id === selectedTopicId)

  const toggleIssueExpand = id => {
    setExpandedIssues(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const proposalsFor = issueId =>
    proposals.filter(p => p.issue_id === issueId)

  const proposalStats = proposalId => {
    const v = voteStats.byProposal[proposalId]
    const r = reviewStats.byProposal[proposalId]

    const avg = v && v.count > 0 ? v.sum / (v.count * 5) : null

    return {
      votes: v?.count || 0,
      reviews: r?.count || 0,
      avg
    }
  }

  /* -------------------------------------------------- */
  /* ACTIONS (ouvrir modals)                            */
  /* -------------------------------------------------- */
  const openProposalModal = issueId => {
    setProposalIssueId(issueId)
    setShowProposalModal(true)
  }

  const openVoteModal = proposalId => {
    setActiveProposalId(proposalId)
    setShowVoteModal(true)
  }

  const openReviewModal = proposalId => {
    setActiveProposalId(proposalId)
    setShowReviewModal(true)
  }

  const openCommentModal = proposalId => {
    setActiveProposalId(proposalId)
    setShowCommentModal(true)
  }

  /* -------------------------------------------------- */
  /* RENDER                                             */
  /* -------------------------------------------------- */

  return (
    <div className="flex min-h-[80vh] gap-6">
      {/* ---------------- SIDEBAR ---------------- */}
      <aside className="w-64 border-r pr-4">
        <h2 className="text-lg font-semibold mb-4">Sujets</h2>

        <div className="flex flex-col gap-2">
          {topics.map(t => (
            <button
              key={t.id}
              className={`px-3 py-2 rounded text-left text-sm transition
                ${
                  selectedTopicId === t.id
                    ? "bg-primary/20 border border-primary text-primary"
                    : "hover:bg-accent"
                }`}
              onClick={() => {
                setSelectedTopicId(t.id)
                setSearchParams({ topic: t.id })
                setExpandedIssues([])
              }}
            >
              {t.name}
            </button>
          ))}

          {topics.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              Aucun topic pour l’instant.
            </p>
          )}
        </div>
      </aside>

      {/* ---------------- MAIN PANEL ---------------- */}
      <main className="flex-1 space-y-8">

        {/* HEADER */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-semibold">
                Agora — {currentTopic?.name || "Choisis un sujet"}
              </h1>
              {currentTopic?.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {currentTopic.description}
                </p>
              )}
            </div>

            <Button size="sm" onClick={() => setShowIssueModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Ajouter un enjeu
            </Button>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card><CardHeader><CardTitle>Enjeux</CardTitle></CardHeader><CardContent>{issues.length}</CardContent></Card>
            <Card><CardHeader><CardTitle>Propositions</CardTitle></CardHeader><CardContent>{proposals.length}</CardContent></Card>
            <Card><CardHeader><CardTitle>Votes</CardTitle></CardHeader><CardContent>{voteStats.total}</CardContent></Card>
            <Card><CardHeader><CardTitle>Revues</CardTitle></CardHeader><CardContent>{reviewStats.total}</CardContent></Card>
          </div>
        </section>

        {/* ---------------- ISSUES & PROPOSALS ---------------- */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Enjeux</h2>

          {loading ? (
            <p className="text-muted-foreground">Chargement…</p>
          ) : issues.length === 0 ? (
            <p className="text-muted-foreground italic">
              Aucune issue pour ce sujet.
            </p>
          ) : (
            <Card>
              <CardContent className="p-0">

                {/* Header */}
                <div className="grid grid-cols-[24px,2fr,1fr,1fr,1fr,auto] px-4 py-2 text-xs uppercase text-muted-foreground border-b">
                  <span />
                  <span>Titre</span>
                  <span>Auteur</span>
                  <span>Propositions</span>
                  <span>Votes</span>
                  <span className="text-right">Créée le</span>
                </div>

                {/* Rows */}
                {issues.map(issue => {
                  const issueProps = proposalsFor(issue.id)
                  const totalVotes = issueProps.reduce(
                    (acc, p) => acc + proposalStats(p.id).votes,
                    0
                  )

                  return (
                    <div key={issue.id} className="border-b">
                      {/* ISSUE ROW */}
                      <button
                        className="w-full grid grid-cols-[24px,2fr,1fr,1fr,1fr,auto] px-4 py-3 text-sm hover:bg-accent transition text-start"
                        onClick={() => toggleIssueExpand(issue.id)}
                      >
                        <span className="flex justify-center">
                          {expandedIssues.includes(issue.id)
                            ? <ChevronDown className="w-4 text-muted-foreground" />
                            : <ChevronRight className="w-4 text-muted-foreground" />}
                        </span>

                        <span className="font-medium truncate">{issue.title}</span>
                        <span>{issueCreators[issue.created_by]?.username || "—"}</span>
                        <span>{issueProps.length}</span>
                        <span>{totalVotes}</span>
                        <span className="text-right text-xs text-muted-foreground">
                          {new Date(issue.created_at).toLocaleDateString()}
                        </span>
                      </button>

                      {/* ACTION BAR issue */}
                      <div className="flex justify-between items-center px-4 pb-2 text-xs text-muted-foreground">
                        <span>
                          {issue.description?.slice(0, 120)}
                          {issue.description?.length > 120 && "…"}
                        </span>
                        <Button size="sm" onClick={() => openProposalModal(issue.id)}>
                          <Plus className="w-3 h-3 mr-1" /> Faire une proposition
                        </Button>
                      </div>

                      {/* EXPANDED PROPOSALS */}
                      {expandedIssues.includes(issue.id) && issueProps.length > 0 && (
                        <div className="px-8 py-3 space-y-2 border-t">
                          {issueProps.map(p => {
                            const stats = proposalStats(p.id)
                            const creator = proposalCreators[p.created_by]

                            return (
                              <div key={p.id} className="py-2 border-b last:border-0">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <button
                                      onClick={() => navigate(`/proposals/${p.id}`)}
                                      className="font-semibold text-left hover:underline"
                                    >
                                      {p.title}
                                    </button>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      par <span>{creator?.username || "—"}</span>
                                      {" · "}
                                      {stats.votes} votes · {stats.reviews} revues
                                      {stats.avg !== null && (
                                        <> · Score : <span className="text-yellow-500">{stats.avg.toFixed(1)}/5</span></>
                                      )}
                                    </div>
                                  </div>

                                  {/* ACTIONS proposal */}
                                  <div className="flex items-center gap-2">
                                    <Button size="xs" variant="outline" className="text-xs px-2 py-1" onClick={() => openVoteModal(p.id)}>
                                      <Star className="w-3 h-3 mr-1" /> Voter
                                    </Button>
                                    <Button size="xs" variant="outline" className="text-xs px-2 py-1" onClick={() => openReviewModal(p.id)}>
                                      <FileText className="w-3 h-3 mr-1" /> Revue
                                    </Button>
                                    <Button size="xs" variant="outline" className="text-xs px-2 py-1" onClick={() => openCommentModal(p.id)}>
                                      <MessageCircle className="w-3 h-3 mr-1" /> Commenter
                                    </Button>
                                  </div>
                                </div>

                                <p className="text-xs text-muted-foreground line-clamp-2">{p.content}</p>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </section>
      </main>

      {/* ------------ MODALS ------------ */}
      <IssueModal
        open={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        topicId={selectedTopicId}
        onCreated={() => loadTopicData(selectedTopicId)}
      />

      <ProposalModal
        open={showProposalModal}
        onClose={() => setShowProposalModal(false)}
        issueId={proposalIssueId}
        onCreated={() => loadTopicData(selectedTopicId)}
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
  )
}
