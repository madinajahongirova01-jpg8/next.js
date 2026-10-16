"use client";

import { useEffect, useState } from "react";
import { apiFetch, errorMessage, type Assignee, type Member } from "@/lib/api";

interface AssigneesSectionProps {
  issuePath: string;
  slug: string;
}

export default function AssigneesSection({ issuePath, slug }: AssigneesSectionProps) {
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [error, setError] = useState("");

  // Аъзоҳое, ки ҳанӯз таъин нашудаанд
  const available = members.filter(
    (m) => !assignees.some((a) => a.user_id === m.user_id),
  );

  useEffect(() => {
    async function loadAll() {
      try {
        const issueResponse = await apiFetch(issuePath);
        if (issueResponse.ok) {
          const issue = await issueResponse.json();
          setAssignees(issue.assignees);
        }

        const membersResponse = await apiFetch(`/workspaces/${slug}/members`);
        if (membersResponse.ok) {
          const data: Member[] = await membersResponse.json();
          setMembers(data);
        }
      } catch {
        setError("Сервер недоступен");
      }
    }
    loadAll();
  }, []);

  async function handleAssign() {
    if (!selectedUserId) return;
    setError("");

    try {
      const response = await apiFetch(`${issuePath}/assignees`, {
        method: "POST",
        body: JSON.stringify({ user_id: selectedUserId }),
      });

      if (!response.ok) {
        setError(errorMessage(response.status, { 409: "Уже назначен на эту задачу" }));
        return;
      }

      const issue = await response.json();
      setAssignees(issue.assignees);
      setSelectedUserId("");
    } catch {
      setError("Сервер недоступен");
    }
  }

  async function handleUnassign(userId: string) {
    setError("");

    try {
      const response = await apiFetch(`${issuePath}/assignees/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setError(errorMessage(response.status, {}));
        return;
      }

      const issue = await response.json();
      setAssignees(issue.assignees);
    } catch {
      setError("Сервер недоступен");
    }
  }

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold mb-3">Исполнители</h2>

      {assignees.length === 0 ? (
        <p className="text-gray-500 text-sm">Никто не назначен</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {assignees.map((a) => (
            <span
              key={a.user_id}
              className="flex items-center gap-2 bg-blue-50 border rounded-full px-3 py-1 text-sm"
            >
              {a.user.display_name}
              <button
                onClick={() => handleUnassign(a.user_id)}
                className="text-gray-400 hover:text-red-600"
                title="Снять"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {available.length > 0 && (
        <div className="flex gap-2 mt-3">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="border rounded px-3 py-2 flex-1"
          >
            <option value="">Выберите участника</option>
            {available.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.user.display_name} ({m.user.email})
              </option>
            ))}
          </select>
          <button
            onClick={handleAssign}
            disabled={!selectedUserId}
            className="bg-blue-600 text-white rounded px-4 disabled:opacity-50"
          >
            Назначить
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </section>
  );
}