"use client";

import { useEffect, useState, type FormEvent } from "react";
import { apiFetch, errorMessage, ROLE_LABELS, type Member } from "@/lib/api";

interface MembersSectionProps {
  slug: string;
}

export default function MembersSection({ slug }: MembersSectionProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [myId, setMyId] = useState("");

  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // 🆕 Нақши ман дар ин workspace
  const myRole = members.find((m) => m.user_id === myId)?.role;
  // 🆕 Оё ман метавонам аъзоҳоро идора кунам?
  const canManage = myRole === "owner" || myRole === "admin";

  async function loadMembers() {
    try {
      const response = await apiFetch(`/workspaces/${slug}/members`);
      if (response.ok) {
        const data: Member[] = await response.json();
        setMembers(data);
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
      // агар нашуд, танҳо нишони "(Вы)" намоён намешавад
    }
  }

  useEffect(() => {
    loadMe();
    loadMembers();
  }, []);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await apiFetch(`/workspaces/${slug}/members`, {
        method: "POST",
        body: JSON.stringify({ user_id: userId.trim(), role }),
      });

      if (!response.ok) {
        setError(
          errorMessage(response.status, {
            403: "Добавлять участников могут только администратор и владелец",
            404: "Пользователь с таким ID не найден",
            409: "Этот пользователь уже является участником",
            400: "Неверный формат ID",
          }),
        );
        return;
      }

      setUserId("");
      setRole("member");
      setMessage("Участник добавлен");
      loadMembers();
    } catch {
      setError("Сервер недоступен");
    }
  }

  // 🆕 Тағйири нақш
  async function handleRoleChange(memberUserId: string, newRole: string) {
    setError("");
    setMessage("");

    try {
      const response = await apiFetch(
        `/workspaces/${slug}/members/${memberUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ role: newRole }),
        },
      );

      if (!response.ok) {
        setError(
          errorMessage(response.status, {
            403: "Недостаточно прав для изменения роли",
            404: "Участник не найден",
          }),
        );
        return;
      }

      setMessage("Роль изменена");
      loadMembers();
    } catch {
      setError("Сервер недоступен");
    }
  }

  // 🆕 Хориҷ кардани аъзо
  async function handleRemove(member: Member) {
    const confirmed = window.confirm(
      `Удалить ${member.user.display_name} из пространства?`,
    );
    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await apiFetch(
        `/workspaces/${slug}/members/${member.user_id}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        setError(
          errorMessage(response.status, {
            403: "Недостаточно прав для удаления участника",
            404: "Участник не найден",
          }),
        );
        return;
      }

      setMessage("Участник удалён");
      loadMembers();
    } catch {
      setError("Сервер недоступен");
    }
  }

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold mb-3">
        Участники ({members.length})
      </h2>

      <ul className="flex flex-col gap-2">
        {members.map((member) => (
          <li
            key={member.user_id}
            className="flex items-center justify-between border rounded-lg p-3"
          >
            <div>
              <p className="font-semibold">
                {member.user.display_name}
                {member.user_id === myId && (
                  <span className="text-gray-500 font-normal"> (Вы)</span>
                )}
              </p>
              <p className="text-sm text-gray-500">{member.user.email}</p>
            </div>

            {/* 🆕 Агар идора карда тавонем ва ин owner ё худам набошад */}
            {canManage &&
            member.role !== "owner" &&
            member.user_id !== myId ? (
              <div className="flex items-center gap-2">
                <select
                  value={member.role}
                  onChange={(e) =>
                    handleRoleChange(member.user_id, e.target.value)
                  }
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="admin">Администратор</option>
                  <option value="member">Участник</option>
                  <option value="guest">Гость</option>
                </select>
                <button
                  onClick={() => handleRemove(member)}
                  className="border border-red-600 text-red-600 rounded px-2 py-1 text-sm"
                >
                  Удалить
                </button>
              </div>
            ) : (
              <span className="text-sm border rounded px-2 py-1">
                {ROLE_LABELS[member.role]}
              </span>
            )}
          </li>
        ))}
      </ul>

      {/* 🆕 Формаи илова танҳо барои admin ва owner */}
      {canManage && (
        <>
          <h3 className="font-semibold mt-6 mb-2">Добавить участника</h3>
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              placeholder="ID пользователя"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              className="border rounded px-3 py-2 flex-1"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="member">Участник</option>
              <option value="admin">Администратор</option>
              <option value="guest">Гость</option>
            </select>
            <button type="submit" className="bg-blue-600 text-white rounded px-4">
              Добавить
            </button>
          </form>
        </>
      )}

      {message && <p className="text-green-600 text-sm mt-2">{message}</p>}
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </section>
  );
}