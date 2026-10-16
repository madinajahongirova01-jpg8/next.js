"use client";

import { useEffect, useState } from "react";
import {
  apiFetch,
  PRIORITY_LABELS,
  type Activity,
  type Priority,
  type State,
} from "@/lib/api";

interface ActivitySectionProps {
  issuePath: string;
  projectPath: string;
}

const FIELD_LABELS: Record<string, string> = {
  title: "название",
  description: "описание",
  state_id: "статус",
  priority: "приоритет",
  parent_id: "родительскую задачу",
  start_date: "дату начала",
  due_date: "срок",
  estimate_points: "оценку",
};

export default function ActivitySection({ issuePath, projectPath }: ActivitySectionProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [error, setError] = useState("");

  function stateName(id: string | null): string {
    return states.find((s) => s.id === id)?.name ?? "—";
  }

  function priorityName(value: string | null): string {
    return PRIORITY_LABELS[value as Priority] ?? "—";
  }

  function describe(a: Activity): string {
    switch (a.action) {
      case "issue.created":
        return "создал(а) задачу";

      case "issue.updated":
        if (a.field === "state_id") {
          return `изменил(а) статус: ${stateName(a.old_value)} → ${stateName(a.new_value)}`;
        }
        if (a.field === "priority") {
          return `изменил(а) приоритет: ${priorityName(a.old_value)} → ${priorityName(a.new_value)}`;
        }
        if (a.field === "title") {
          return `изменил(а) название на «${a.new_value}»`;
        }
        return `изменил(а) ${FIELD_LABELS[a.field ?? ""] ?? a.field}`;

      case "issue.assignee_added":
        return "назначил(а) исполнителя";
      case "issue.assignee_removed":
        return "снял(а) исполнителя";
      case "issue.label_added":
        return "добавил(а) метку";
      case "issue.label_removed":
        return "убрал(а) метку";
      case "comment.created":
        return "написал(а) комментарий";
      case "comment.updated":
        return "изменил(а) комментарий";
      case "comment.deleted":
        return "удалил(а) комментарий";

      default:
        return a.action;
    }
  }

  async function loadActivity() {
    setError("");
    try {
      const response = await apiFetch(`${issuePath}/activity`);
      if (response.ok) {
        const result = await response.json();
        setActivities(result.data);
      }
    } catch {
      setError("Сервер недоступен");
    }
  }

  useEffect(() => {
    async function loadAll() {
      try {
        const statesResponse = await apiFetch(`${projectPath}/states`);
        if (statesResponse.ok) setStates(await statesResponse.json());
      } catch {
        // агар нашуд, ба ҷои номи ҳолат "—" нишон дода мешавад
      }
      await loadActivity();
    }
    loadAll();
  }, []);

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">История</h2>
        <button onClick={loadActivity} className="text-sm border rounded px-3 py-1">
          Обновить
        </button>
      </div>

      {activities.length === 0 ? (
        <p className="text-gray-500 text-sm">История пуста</p>
      ) : (
        <ul className="flex flex-col gap-2 border-l-2 border-gray-200 pl-4">
          {activities.map((a) => (
            <li key={a.id} className="text-sm">
              <b>{a.actor.display_name}</b> {describe(a)}
              <span className="text-gray-400 ml-2">
                {new Date(a.created_at).toLocaleString("ru-RU")}
              </span>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </section>
  );
}