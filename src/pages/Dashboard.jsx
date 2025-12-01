// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [topTopics, setTopTopics] = useState([]);
  const [topProposals, setTopProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  // -------------------------------------------------------
  // LOAD ALL ANALYTICS
  // -------------------------------------------------------
  async function loadStats() {
    setLoading(true);

    // 1) Basic counts
    const [{ count: users }] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);

    const [{ count: topics }] = await Promise.all([
      supabase.from("topics").select("id", { count: "exact", head: true }),
    ]);

    const [{ count: issues }] = await Promise.all([
      supabase.from("issues").select("id", { count: "exact", head: true }),
    ]);

    const [{ count: proposals }] = await Promise.all([
      supabase.from("proposals").select("id", { count: "exact", head: true }),
    ]);

    const [{ count: votes }] = await Promise.all([
      supabase.from("votes").select("id", { count: "exact", head: true }),
    ]);

    const [{ count: reviews }] = await Promise.all([
      supabase.from("reviews").select("id", { count: "exact", head: true }),
    ]);

    setStats({
      users,
      topics,
      issues,
      proposals,
      votes,
      reviews,
    });

    // 2) Activity timeline (activity_log)
    const { data: logs } = await supabase
      .from("activity_log")
      .select("created_at")
      .order("created_at");

    const timelineData = logs.reduce((acc, log) => {
      const day = log.created_at.split("T")[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    setTimeline(
      Object.entries(timelineData).map(([day, count]) => ({
        day,
        count,
      }))
    );

    // 3) Top Topics Activity
    const { data: topicCounts } = await supabase.rpc("count_activity_by_topic");
    // (On va créer cette RPC dans un instant)

    setTopTopics(topicCounts || []);

    // 4) Top Proposal Votes
    const { data: proposalsVotes } = await supabase.rpc("proposal_vote_scores");
    // (On va aussi la créer après)

    setTopProposals(proposalsVotes || []);

    setLoading(false);
  }

  if (loading || !stats)
    return <div className="text-neutral-500 animate-pulse">Loading dashboard…</div>;

  return (
    <div className="space-y-12 max-w-6xl mx-auto">

      {/* ------------------------------------------------------ */}
      {/* SECTION 1 — OVERVIEW CARDS */}
      {/* ------------------------------------------------------ */}
      <h1 className="text-4xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-bold">{stats.users}</CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle>Topics</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-bold">{stats.topics}</CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle>Issues</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-bold">{stats.issues}</CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle>Proposals</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-bold">{stats.proposals}</CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle>Votes</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-bold">{stats.votes}</CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-bold">{stats.reviews}</CardContent>
        </Card>
      </div>

      <Separator className="bg-neutral-700" />

      {/* ------------------------------------------------------ */}
      {/* SECTION 2 — TIMELINE */}
      {/* ------------------------------------------------------ */}
      <h2 className="text-2xl font-semibold">Engagement Timeline</h2>

      <Card className="bg-neutral-900 border-neutral-700 p-6">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={timeline}>
            <CartesianGrid stroke="#333" />
            <XAxis dataKey="day" stroke="#aaa" />
            <YAxis stroke="#aaa" />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Separator className="bg-neutral-700" />

      {/* ------------------------------------------------------ */}
      {/* SECTION 3 — TOP TOPICS */}
      {/* ------------------------------------------------------ */}
      <h2 className="text-2xl font-semibold">Top Topics (Activity)</h2>

      <Card className="bg-neutral-900 border-neutral-700 p-6">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={topTopics}>
            <CartesianGrid stroke="#333" />
            <XAxis dataKey="topic" stroke="#aaa" />
            <YAxis stroke="#aaa" />
            <Tooltip />
            <Bar dataKey="count" fill="#3498db" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Separator className="bg-neutral-700" />

      {/* ------------------------------------------------------ */}
      {/* SECTION 4 — TOP PROPOSALS */}
      {/* ------------------------------------------------------ */}
      <h2 className="text-2xl font-semibold">Top Proposals (Vote Score)</h2>

      <Card className="bg-neutral-900 border-neutral-700 p-6">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={topProposals}>
            <CartesianGrid stroke="#333" />
            <XAxis dataKey="title" stroke="#aaa" />
            <YAxis stroke="#aaa" />
            <Tooltip />
            <Bar dataKey="total_score" fill="#f1c40f" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

    </div>
  );
}
