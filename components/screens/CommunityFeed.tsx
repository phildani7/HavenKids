"use client";
/* CommunityFeed — real persisted feed (posts + comments + image upload).
   Contained component; slots into CommunityPage without touching its other tabs. */

import { useEffect, useRef, useState } from "react";
import { listPostsAction, listCommentsAction, createPostAction, addCommentAction } from "@/app/app/content/actions";
import { requestUpload, recordUpload } from "@/app/app/content/media-actions";
import type { FeedPost, FeedComment } from "@/lib/content";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function errorMessage(error: string | undefined): string | null {
  if (!error) return null;
  if (error === "flagged") return "Gabriel paused that — let’s keep it kind 💛";
  if (error === "notallowed") return "A parent needs to finish setup before posting.";
  if (error === "auth") return "Please pick a profile.";
  return null;
}

// ---------------------------------------------------------------------------
// ImageUploader — three-step upload, inline in composer
// ---------------------------------------------------------------------------

interface ImageUploaderProps {
  onUploaded: () => void;
}

function ImageUploader({ onUploaded }: ImageUploaderProps) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setStatus("uploading");
    try {
      // Step 1: get signed URL
      const fd1 = new FormData();
      fd1.append("filename", file.name);
      const r1 = await requestUpload(fd1);
      if (!r1.ok || !r1.signedUrl || !r1.path) {
        setStatus("error");
        return;
      }
      // Step 2: PUT directly to storage
      await fetch(r1.signedUrl, {
        method: "PUT",
        body: file,
        headers: { "content-type": file.type },
      });
      // Step 3: record the media row (pending/quarantined)
      const fd3 = new FormData();
      fd3.append("path", r1.path);
      fd3.append("mime", file.type);
      fd3.append("bytes", String(file.size));
      const r3 = await recordUpload(fd3);
      if (!r3.ok) {
        setStatus("error");
        return;
      }
      setStatus("done");
      onUploaded();
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="tiny muted" style={{ marginTop: 6 }}>
        📎 Image added — pending review before it appears
      </div>
    );
  }
  if (status === "uploading") {
    return <div className="tiny muted" style={{ marginTop: 6 }}>Uploading…</div>;
  }
  if (status === "error") {
    return <div className="tiny" style={{ marginTop: 6, color: "#E85C47" }}>Upload failed — try again.</div>;
  }
  return (
    <div style={{ marginTop: 6 }}>
      <label
        style={{ fontSize: 13, fontWeight: 700, cursor: "pointer", color: "var(--ink-soft)" }}
        title="Images are reviewed before they appear"
      >
        📎 Add image
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </label>
      <span className="tiny muted" style={{ marginLeft: 8 }}>images are reviewed before they appear</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PostItem — single post with lazy comment thread
// ---------------------------------------------------------------------------

interface PostItemProps {
  post: FeedPost;
}

function PostItem({ post }: PostItemProps) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  async function loadComments() {
    setLoadingComments(true);
    const result = await listCommentsAction(post.id);
    setComments(result);
    setLoadingComments(false);
  }

  function toggleComments() {
    if (!showComments && comments.length === 0) {
      loadComments();
    }
    setShowComments((v) => !v);
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    const body = commentBody.trim();
    if (!body) return;
    setSubmittingComment(true);
    setCommentError(null);
    const fd = new FormData();
    fd.append("postId", post.id);
    fd.append("body", body);
    const result = await addCommentAction(fd);
    setSubmittingComment(false);
    if (result.ok) {
      setCommentBody("");
      await loadComments();
    } else {
      const msg = errorMessage(result.error);
      if (msg) setCommentError(msg);
    }
  }

  const initials = post.author_name?.slice(0, 1).toUpperCase() || "?";

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
        {/* Avatar */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            background: "#FFF1D6",
            display: "grid",
            placeItems: "center",
            fontSize: 18,
            fontWeight: 900,
            flexShrink: 0,
          }}
        >
          {post.author_avatar || initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row" style={{ gap: 8 }}>
            <span style={{ fontWeight: 900, fontSize: 14 }}>{post.author_name}</span>
            <span className="tiny muted">{relTime(post.created_at)}</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.6 }}>{post.body}</div>
          <button
            onClick={toggleComments}
            className="btn btn-ghost"
            style={{ marginTop: 8, fontSize: 12, padding: "4px 10px" }}
          >
            💬 Comments{comments.length > 0 ? ` (${comments.length})` : ""}
          </button>
        </div>
      </div>

      {showComments && (
        <div style={{ marginTop: 12, paddingLeft: 50 }}>
          {loadingComments && <div className="tiny muted">Loading…</div>}
          {comments.length === 0 && !loadingComments && (
            <div className="tiny muted">No comments yet — be the first!</div>
          )}
          {comments.map((c) => (
            <div key={c.id} className="row" style={{ gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "#F0E9FF",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 13,
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                {c.author_avatar || c.author_name?.slice(0, 1).toUpperCase() || "?"}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 800, fontSize: 13 }}>{c.author_name}</span>
                <span className="tiny muted" style={{ marginLeft: 6 }}>{relTime(c.created_at)}</span>
                <div style={{ fontSize: 13, marginTop: 2 }}>{c.body}</div>
              </div>
            </div>
          ))}

          <form onSubmit={submitComment} style={{ marginTop: 8 }}>
            <div className="row" style={{ gap: 8 }}>
              <input
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Add a kind comment…"
                style={{
                  flex: 1,
                  padding: "7px 12px",
                  border: "2px solid #2B234014",
                  borderRadius: 999,
                  background: "#FFF8E8",
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={submittingComment || !commentBody.trim()}
                className="btn btn-gold"
                style={{ padding: "7px 14px", fontSize: 13 }}
              >
                {submittingComment ? "…" : "Send"}
              </button>
            </div>
            {commentError && (
              <div className="tiny" style={{ marginTop: 4, color: "#E85C47" }}>{commentError}</div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CommunityFeed — main export
// ---------------------------------------------------------------------------

export interface CommunityFeedProps {
  communityId: string;
  canPost: boolean;
}

export function CommunityFeed({ communityId, canPost }: CommunityFeedProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [postError, setPostError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);

  async function fetchPosts() {
    setLoading(true);
    const result = await listPostsAction(communityId);
    setPosts(result);
    setLoading(false);
  }

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setPostError(null);
    const fd = new FormData();
    fd.append("communityId", communityId);
    fd.append("body", trimmed);
    const result = await createPostAction(fd);
    setSubmitting(false);
    if (result.ok) {
      setBody("");
      setUploadDone(false);
      await fetchPosts();
    } else {
      const msg = errorMessage(result.error);
      if (msg) setPostError(msg);
      // "empty" silently ignored
    }
  }

  return (
    <div className="stack" style={{ gap: 14 }}>
      {/* Composer */}
      {canPost && (
        <div className="card" style={{ padding: 16 }}>
          <form onSubmit={submitPost}>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share something kind with this community…"
              rows={3}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "2px solid #2B234014",
                borderRadius: 14,
                background: "#FFF8E8",
                fontSize: 14,
                lineHeight: 1.5,
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <ImageUploader onUploaded={() => setUploadDone(true)} />
            {uploadDone && (
              <div className="tiny muted" style={{ marginTop: 4 }}>
                📎 Image queued for review
              </div>
            )}
            {postError && (
              <div
                className="tiny"
                style={{ marginTop: 6, color: "#E85C47", fontWeight: 700 }}
              >
                {postError}
              </div>
            )}
            <div className="row" style={{ marginTop: 10, justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={submitting || !body.trim()}
                className="btn btn-gold"
              >
                {submitting ? "Posting…" : "Post"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feed */}
      {loading && (
        <div className="card" style={{ padding: 20, textAlign: "center" }}>
          <div className="tiny muted">Loading posts…</div>
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="card" style={{ padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 40 }}>😇</div>
          <div
            style={{
              marginTop: 8,
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              fontSize: 20,
            }}
          >
            Be the first to share!
          </div>
          <div className="muted" style={{ marginTop: 4, fontSize: 14 }}>
            This community is waiting for your kind words.
          </div>
        </div>
      )}

      {posts.map((p) => (
        <PostItem key={p.id} post={p} />
      ))}
    </div>
  );
}
