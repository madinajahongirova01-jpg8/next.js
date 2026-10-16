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

export default function ProjectPage() {
  const params = useParams<{ slug: string; projectId: string }>();
  const router = useRouter();
  const base = `/workspaces/${params.slug}/projects/${params.projectId}`;

  const [project, setProject] = useState<Project | null>(null);
  const [states, setStates] = useState<State[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  // 🆕 Хотираи формаи сохтан
  const [title, setTitle] = useState("");
  const [newStateId, setNewStateId] = useState("");
  const [priority, setPriority] = useState<Priority>("none");
  const [error, setError] = useState("");

  async function loadProject() {
    const response = await apiFetch(base);
    if (!response.ok) {
      setPageError(
        errorMessage(response.status, {
          404: "Проект не найден",
          400: "Проект не найден",
          403: "Вы не являетесь участником этого пространства",
        }),
      );
      return;
    }
    const data: Project = await response.json();
    setProject(data);
  }

  async function loadStates() {
    const response = await apiFetch(`${base}/states`);
    if (response.ok) {
      const data: State[] = await response.json();
      setStates(data);

      // 🆕 Дар форма ҳолати пешфарз (Todo)-ро интихоб мекунем
      const defaultState = data.find((s) => s.is_default) ?? data[0];
      if (defaultState) setNewStateId(defaultState.id);
    }
  }

  async function loadIssues() {
    const response = await apiFetch(`${base}/issues`);
    if (response.ok) {
      const result = await response.json();
      setIssues(result.data);
    }
  }

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.replace("/login");
      return;
    }

    async function loadAll() {
      try {
        await loadProject();
        await loadStates();
        await loadIssues();
      } catch {
        setPageError("Сервер недоступен");
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  // 🆕 Сохтани вазифа
  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const response = await apiFetch(`${base}/issues`, {
        method: "POST",
        body: JSON.stringify({ title, state_id: newStateId, priority }),
      });

      if (!response.ok) {
        setError(
          errorMessage(response.status, {
            400: "Проверьте название и статус задачи",
            403: "Недостаточно прав",
          }),
        );
        return;
      }

      setTitle("");
      setPriority("none");
      loadIssues();
    } catch {
      setError("Сервер недоступен");
    }
  }

  // 🆕 Гузарондани вазифа ба сутуни дигар
  async function handleStateChange(issueId: string, stateId: string) {
    setError("");

    try {
      const response = await apiFetch(`${base}/issues/${issueId}`, {
        method: "PATCH",
        body: JSON.stringify({ state_id: stateId }),
      });

      if (!response.ok) {
        setError(errorMessage(response.status, {}));
        return;
      }

      loadIssues();
    } catch {
      setError("Сервер недоступен");
    }
  }

  // 🆕 Нест кардани вазифа
  async function handleDelete(issue: Issue) {
    const confirmed = window.confirm(`Удалить задачу "${issue.title}"?`);
    if (!confirmed) return;

    setError("");

    try {
      const response = await apiFetch(`${base}/issues/${issue.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setError(errorMessage(response.status, {}));
        return;
      }

      loadIssues();
    } catch {
      setError("Сервер недоступен");
    }
  }

  if (loading) {
    return <main className="p-8">Загрузка...</main>;
  }

  if (pageError || !project) {
    return (
      <main className="p-8">
        <p className="text-red-500 mb-4">{pageError}</p>
        <Link href={`/workspaces/${params.slug}`} className="text-blue-600 underline">
          ← Назад
        </Link>
      </main>
    );
  }

  return (
    <main className="p-8">
      <Link href={`/workspaces/${params.slug}`} className="text-blue-600 underline">
        ← Назад к пространству
      </Link>

      <div className="flex items-center gap-3 mt-4 mb-6">
        <span className="text-sm font-mono bg-blue-100 text-blue-700 rounded px-2 py-1">
          {project.identifier}
        </span>
        <h1 className="text-2xl font-bold">{project.name}</h1>
      </div>

      {/* 🆕 Формаи сохтан */}
      <h2 className="font-semibold mb-2">Новая задача</h2>
      <form onSubmit={handleCreate} className="flex gap-2 mb-2">
        <input
          placeholder="Название задачи"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="border rounded px-3 py-2 flex-1"
        />
        <select
          value={newStateId}
          onChange={(e) => setNewStateId(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {states.map((state) => (
            <option key={state.id} value={state.id}>
              {state.name}
            </option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="border rounded px-3 py-2"
        >
          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className="bg-blue-600 text-white rounded px-4">
          Создать
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      <div className="flex gap-4 overflow-x-auto pb-4 mt-6">
        {states.map((state) => {
          const columnIssues = issues.filter((i) => i.state_id === state.id);

          return (
            <div key={state.id} className="w-64 shrink-0 bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: state.color }}
                />
                <h2 className="font-semibold">{state.name}</h2>
                <span className="text-sm text-gray-500">({columnIssues.length})</span>
              </div>

              <div className="flex flex-col gap-2">
                {columnIssues.map((issue) => (
                  <div key={issue.id} className="bg-white border rounded p-3">
                    <div className="flex justify-between items-start">
                      <p className="text-xs text-gray-500 font-mono">
                        {project.identifier}-{issue.sequence_id}
                      </p>
                      {/* 🆕 Тугмаи нест кардан */}
                      <button
                        onClick={() => handleDelete(issue)}
                        className="text-gray-400 hover:text-red-600 text-sm"
                        title="Удалить"
                      >
                        ✕
                      </button>
                    </div>
                                        <Link
                      href={`${base}/issues/${issue.id}`}
                      className="font-medium hover:underline block"
                    >
                      {issue.title}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">
                      {PRIORITY_LABELS[issue.priority]}
                    </p>
                                        {issue.assignees.length > 0 && (
                      <p className="text-xs text-blue-700 mt-1">
                        👤 {issue.assignees.map((a) => a.user.display_name).join(", ")}
                      </p>
                    )}
                                        {issue.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {issue.labels.map((il) => (
                          <span
                            key={il.label_id}
                            className="text-xs rounded px-2 py-0.5 text-white"
                            style={{ backgroundColor: il.label.color }}
                          >
                            {il.label.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* 🆕 Гузарондан ба сутуни дигар */}
                    <select
                      value={issue.state_id}
                      onChange={(e) => handleStateChange(issue.id, e.target.value)}
                      className="mt-2 w-full border rounded px-2 py-1 text-sm"
                    >
                      {states.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}