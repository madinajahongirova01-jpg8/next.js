"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  apiFetch,
  errorMessage,
  PRIORITY_LABELS,
  type Issue,
  type Priority,
  type Project,
  type State,
} from "@/lib/api";
import CommentsSection from "@/component/CommentsSection";
import AssigneesSection from "@/componen/AssigneesSection";
import LabelsSection from "@/componentss/LabelsSection";
import ActivitySection from "@/Componentt/ActivitySection";

export default function IssuePage() {
  const params = useParams<{ slug: string; projectId: string; issueId: string }>();
  const router = useRouter();
  const projectPath = `/workspaces/${params.slug}/projects/${params.projectId}`;
  const issuePath = `${projectPath}/issues/${params.issueId}`;

  const [project, setProject] = useState<Project | null>(null);
  const [states, setStates] = useState<State[]>([]);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stateId, setStateId] = useState("");
  const [priority, setPriority] = useState<Priority>("none");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.replace("/login");
      return;
    }

    async function loadAll() {
      try {
        const issueResponse = await apiFetch(issuePath);
        if (!issueResponse.ok) {
          setPageError(
            errorMessage(issueResponse.status, {
              404: "Задача не найдена",
              400: "Задача не найдена",
              403: "Нет доступа",
            }),
          );
          return;
        }
        const issueData: Issue = await issueResponse.json();
        setIssue(issueData);
        setTitle(issueData.title);
        setDescription(issueData.description ?? "");
        setStateId(issueData.state_id);
        setPriority(issueData.priority);

        const projectResponse = await apiFetch(projectPath);
        if (projectResponse.ok) setProject(await projectResponse.json());

        const statesResponse = await apiFetch(`${projectPath}/states`);
        if (statesResponse.ok) setStates(await statesResponse.json());
      } catch {
        setPageError("Сервер недоступен");
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await apiFetch(issuePath, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          description: description || null,
          state_id: stateId,
          priority,
        }),
      });

      if (!response.ok) {
        setError(errorMessage(response.status, { 400: "Проверьте введённые данные" }));
        return;
      }

      const data: Issue = await response.json();
      setIssue(data);
      setMessage("Изменения сохранены");
    } catch {
      setError("Сервер недоступен");
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Удалить задачу "${issue?.title}"?`)) return;

    try {
      const response = await apiFetch(issuePath, { method: "DELETE" });
      if (!response.ok) {
        setError(errorMessage(response.status, {}));
        return;
      }
      router.push(projectPath);
    } catch {
      setError("Сервер недоступен");
    }
  }

  if (loading) {
    return <main className="p-8">Загрузка...</main>;
  }

  if (pageError || !issue) {
    return (
      <main className="p-8">
        <p className="text-red-500 mb-4">{pageError}</p>
        <Link href={projectPath} className="text-blue-600 underline">
          ← Назад к доске
        </Link>
      </main>
    );
  }

  return (
    <main className="w-full max-w-2xl mx-auto p-8">
      <Link href={projectPath} className="text-blue-600 underline">
        ← Назад к доске
      </Link>

      <p className="text-sm font-mono text-gray-500 mt-4">
        {project?.identifier}-{issue.sequence_id}
      </p>

      <form onSubmit={handleSave} className="flex flex-col gap-3 mt-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="text-2xl font-bold border rounded px-3 py-2"
        />
        <textarea
          placeholder="Описание"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="border rounded px-3 py-2"
        />
        <div className="flex gap-2">
          <select
            value={stateId}
            onChange={(e) => setStateId(e.target.value)}
            className="border rounded px-3 py-2 flex-1"
          >
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="border rounded px-3 py-2 flex-1"
          >
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 flex-1">
            Сохранить
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="border border-red-600 text-red-600 rounded px-4 py-2"
          >
            Удалить
          </button>
        </div>
      </form>

      {message && <p className="text-green-600 text-sm mt-2">{message}</p>}
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
             <AssigneesSection issuePath={issuePath} slug={params.slug} />
             <LabelsSection issuePath={issuePath} projectPath={projectPath} />
             <ActivitySection issuePath={issuePath} projectPath={projectPath} />
             <CommentsSection issuePath={issuePath} />
    </main>
  );
}