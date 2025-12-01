import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "@/supabase/client"
import { useAuth } from "@/context/AuthContext"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export default function Topics() {
  const { session } = useAuth()
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  // Fetch user profile (role)
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session) return setProfile(null)

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, role")
        .eq("id", session.user.id)
        .single()

      if (!error) setProfile(data)
    }

    fetchProfile()
  }, [session])

  // Fetch topics
  useEffect(() => {
    const loadTopics = async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error) setTopics(data)
      setLoading(false)
    }

    loadTopics()
  }, [])

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold tracking-tight">Topics</h1>

        {/* Only moderators can add topics */}
        {profile?.role === "moderator" && (
          <Button asChild>
            <Link to="/topics/new">Add Topic</Link>
          </Button>
        )}
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-40 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          ))}
        </div>
      )}

      {/* NO TOPICS */}
      {!loading && topics.length === 0 && (
        <p className="opacity-60">No topics yet.</p>
      )}

      {/* TOPICS LIST */}
      <div className="grid md:grid-cols-2 gap-6">
        {topics.map((t) => (
          <Card key={t.id} className="p-6 border border-white/5 bg-slate-900/40">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-xl text-white">{t.name}</CardTitle>
              {t.description && (
                <CardDescription className="text-sm opacity-80 mt-1">
                  {t.description}
                </CardDescription>
              )}
            </CardHeader>

            <Button asChild className="mt-2">
              <Link to={`/topics/${t.id}`}>
                View Topic
              </Link>
            </Button>
          </Card>
        ))}
      </div>

    </div>
  )
}
