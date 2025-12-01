// src/pages/TopicDetail.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function TopicDetail() {
  const { id } = useParams();

  const [topic, setTopic] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // — Form modal states
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // -----------------------------
  // Load topic + issues
  // -----------------------------
  useEffect(() => {
    loadTopicAndIssues();
  }, [id]);

  async function loadTopicAndIssues() {
    setLoading(true);

    const { data: topicData } = await supabase
      .from("topics")
      .select("*")
      .eq("id", id)
      .single();

    const { data: issuesData } = await supabase
      .from("issues")
      .select("*")
      .eq("topic_id", id)
      .order("created_at", { ascending: false });

    setTopic(topicData);
    setIssues(issuesData || []);
    setLoading(false);
  }

  // -----------------------------
  // CREATE ISSUE
  // -----------------------------
  async function handleCreateIssue() {
    if (!newTitle.trim()) return;

    setCreating(true);

    const user = (await supabase.auth.getUser())?.data?.user;
    if (!user) {
      alert("You must be logged in to create an issue.");
      setCreating(false);
      return;
    }

    const { error } = await supabase.from("issues").insert({
      topic_id: id,
      title: newTitle,
      description: newDesc,
      created_by: user.id,
      data_sources: []
    });

    setCreating(false);

    if (error) {
      alert(error.message);
    } else {
      setNewTitle("");
      setNewDesc("");
      await loadTopicAndIssues();
    }
  }

  // -----------------------------
  // UI
  // -----------------------------
  if (loading) {
    return (
      <div className="animate-pulse text-neutral-500">Loading topic…</div>
    );
  }

  if (!topic) {
    return <div className="text-red-400">Topic not found.</div>;
  }

  return (
    <div className="space-y-10">

      {/* TOPIC HEADER */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-3xl font-semibold">
            {topic.name}
          </CardTitle>
          <p classname="text-neutral-300 mt-1">{topic.description}</p>
        </CardHeader>
      </Card>

      <Separator className="bg-neutral-700" />

      {/* HEADER + ADD ISSUE BUTTON */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Issues</h2>

        {/* DIALOG ADD ISSUE */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white">+ New issue</Button>
          </DialogTrigger>

          <DialogContent className="bg-neutral-900 border-neutral-700 text-white">
            <DialogHeader>
              <DialogTitle>Create an issue</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <Input
                placeholder="Issue title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />

              <Textarea
                rows={4}
                placeholder="Describe the issue"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />

              <Button
                disabled={creating}
                className="bg-primary text-white"
                onClick={handleCreateIssue}
              >
                {creating ? "Creating..." : "Create Issue"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ISSUE LIST */}
      <div className="space-y-4">
        {issues.length === 0 && (
          <div className="text-neutral-400 italic">No issues yet.</div>
        )}

        {issues.map((issue) => (
          <a
            key={issue.id}
            href={`/topics/${id}/issues/${issue.id}`}
            className="block p-4 rounded-lg border border-neutral-700 hover:border-neutral-500 hover:bg-neutral-900"
          >
            <h3 className="text-xl font-semibold">{issue.title}</h3>
            {issue.description && (
              <p className="text-neutral-400 text-sm mt-1 line-clamp-2">
                {issue.description}
              </p>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
