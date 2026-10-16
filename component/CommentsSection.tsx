"use client";

import { useEffect, useState, type FormEvent } from "react";
import { apiFetch, errorMessage, type Comment } from "@/lib/api";

interface CommentsSectionProps {
  issuePath: string;
}

export default function CommentsSection({ issuePath }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [myId, setMyId] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  async function loadComments() {
    try {
      const response = await apiFetch(`${issuePath}/comments`);
      if (response.ok) {
        const data: Comment[] = await response.json();
        setComments(data);
      }
    } catch {
      setError("Сервер недоступен");
    }
  }

  async function loadMe() {
    try {
      const response = await apiFetch("/auth/me");
      if (response.ok) {
        const me = await response.json();
        setMyId(me.id);
      }
    } catch {
      // ҳеҷ
    }
  }

  useEffect(() => {
    loadMe();
    loadComments();
  }, []);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const response = await apiFetch(`${issuePath}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });

      if (!response.ok) {
        setError(errorMessage(response.status, { 400: "Комментарий не может быть пустым" }));
        return;
      }

      setBody("");
      loadComments();
    } catch {
      setError("Сервер недоступен");
    }
  }

  async function handleDelete(comment: Comment) {
    if (!window.confirm("Удалить комментарий?")) return;
    setError("");

    try {
      const response = await apiFetch(`${issuePath}/comments/${comment.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setError(
          errorMessage(response.status, {
            403: "Удалять можно только свои комментарии",
          }),
        );
        return;
      }

      loadComments();
    } catch {
      setError("Сервер недоступен");
    }
  }

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold mb-3">
        Комментарии ({comments.filter((c) => !c.deleted_at).length})
      </h2>

      <ul className="flex flex-col gap-3">
        {comments.map((comment) => (
          <li key={comment.id} className="border rounded-lg p-3">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>
                <b className="text-gray-800">{comment.author.display_name}</b> ·{" "}
                {new Date(comment.created_at).toLocaleString("ru-RU")}
              </span>
              {comment.author_id === myId && !comment.deleted_at && (
                <button
                  onClick={() => handleDelete(comment)}
                  className="hover:text-red-600"
                  title="Удалить"
                >
                  ✕
                </button>
              )}
            </div>
            {comment.deleted_at ? (
              <p className="italic text-gray-400">Комментарий удалён</p>
            ) : (
              <p className="whitespace-pre-wrap">{comment.body}</p>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={handleSend} className="flex gap-2 mt-4">
        <input
          placeholder="Написать комментарий..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          className="border rounded px-3 py-2 flex-1"
        />
        <button type="submit" className="bg-blue-600 text-white rounded px-4">
          Отправить
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </section>
  );
}