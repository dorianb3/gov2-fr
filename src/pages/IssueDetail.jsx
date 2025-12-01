// src/pages/IssueDetail.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase/client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function IssueDetail() {
  const { id, issueId } = useParams();

  const [issue, setIssue] = useState(null);
  const [creator, setCreator] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal: new proposal
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [creating, setCreating] = useState(false);

  // -----------------------------------------------------
  // LOAD ISSUE + CREATOR + PROPOSALS
  // -----------------------------------------------------
  useEffect(() => {
    loadIssue();
  }, [issueId]);

  async function loadIssue() {
    setLoading(true);

    const { data: issueData } = await supabase
      .from("issues")
      .select("*")
      .eq("id", issueId)
      .single();

    if (!issueData) {
      setIssue(null);
      setLoading(false);
      return;
    }

    setIssue(issueData);

    // Load creator
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url, role")
      .eq("id", issueData.created_by)
      .single();

    setCreator(profile);

    // Load proposals
    const { data: proposalsData } = await supabase
      .from("proposals")
      .select("*")
      .eq("issue_id", issueId)
      .order("created_at", { ascending: false });

    setProposals(proposalsData || []);

    setLoading(false);
  }

  // -----------------------------------------------------
  // CREATE PROPOSAL
  // -----------------------------------------------------
  async function handleCreateProposal() {
    if (!newTitle.trim() || !newContent.trim()) return;

    setCreating(true);

    const user = (await supabase.auth.getUser())?.data?.user;
    if (!user) {
      alert("You must be logged in.");
      setCreating(false);
      return;
    }

    const { error } = await supabase.from("proposals").insert({
      issue_id: issueId,
      title: newTitle,
      content: newContent,
      created_by: user.id,
      status: "draft",
      data_sources: []
    });

    setCreating(false);

    if (error) {
      alert(error.message);
    } else {
      setNewTitle("");
      setNewContent("");
      loadIssue();
    }
  }

  // -----------------------------------------------------
  // UI
  // -----------------------------------------------------

  if (loading) {
    return <div className="text-neutral-500 animate-pulse">Loading issue…</div>;
  }

  if (!issue) {
    return <div className="text-red-400">Issue not found.</div>;
  }

  return (
    <div className="space-y-12">

      {/* ------------------------------------------------------------- */}
      {/* ISSUE HEADER */}
      {/* ------------------------------------------------------------- */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-3xl font-semibold">{issue.title}</CardTitle>

          <CardDescription className="text-neutral-300 mt-2">
            {issue.description}
          </CardDescription>

          {creator && (
            <div className="mt-4 text-sm text-neutral-400">
              Created by <span className="text-neutral-200">{creator.username}</span>
              {creator.role && (
                <> — <span className="italic">{creator.role}</span></>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      <Separator className="bg-neutral-700" />

      {/* ------------------------------------------------------------- */}
      {/* PROPOSALS HEADER */}
      {/* ------------------------------------------------------------- */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Proposals</h2>

        {/* Dialog create proposal */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white">+ New proposal</Button>
          </DialogTrigger>

          <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle>Create a Proposal</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <Input
                placeholder="Proposal title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />

              <Textarea
                rows={6}
                placeholder="Describe your proposed solution"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />

              <Button
                disabled={creating}
                onClick={handleCreateProposal}
                className="bg-primary text-white"
              >
                {creating ? "Creating..." : "Submit Proposal"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PROPOSAL LIST */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4">
        {proposals.length === 0 && (
          <div className="text-neutral-400 italic">No proposals yet.</div>
        )}

        {proposals.map((p) => (
          <a
            key={p.id}
            href={`/proposals/${p.id}`}
            className="block p-5 rounded-lg border border-neutral-700 hover:border-neutral-500 hover:bg-neutral-900 transition"
          >
            <h3 className="text-xl font-semibold">{p.title}</h3>

            {p.content && (
              <p className="text-neutral-400 text-sm mt-1 line-clamp-2">
                {p.content}
              </p>
            )}

            <div className="text-xs text-neutral-500 mt-2">
              Status: <span className="text-neutral-300">{p.status}</span>
            </div>
          </a>
        ))}
      </div>

    </div>
  );
}
