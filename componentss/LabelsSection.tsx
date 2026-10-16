"use client";

import { useEffect, useState, type FormEvent } from "react";
import { apiFetch, errorMessage, type IssueLabel, type Label } from "@/lib/api";

interface LabelsSectionProps {
  issuePath: string;
  projectPath: string;
}

export default function LabelsSection({ issuePath, projectPath }: LabelsSectionProps) {
  const [issueLabels, setIssueLabels] = useState<IssueLabel[]>([]);
  const [projectLabels, setProjectLabels] = useState<Label[]>([]);
  const [selectedLabelId, setSelectedLabelId] = useState("");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [error, setError] = useState("");

  // Тамғаҳое, ки ҳанӯз ба вазифа гузошта нашудаанд
  const available = projectLabels.filter(
    (l) => !issueLabels.some((il) => il.label_id === l.id),
  );

  async function loadProjectLabels() {
    const response = await apiFetch(`${projectPath}/labels`);
    if (response.ok) {
      const data: Label[] = await response.json();
      setProjectLabels(data);
    }
  }

  useEffect(() => {
    async function loadAll() {
      try {
        const issueResponse = await apiFetch(issuePath);
        if (issueResponse.ok) {
          const issue = await issueResponse.json();
          setIssueLabels(issue.labels);
        }
        await loadProjectLabels();
      } catch {
        setError("Сервер недоступен");
      }
    }
    loadAll();
  }, []);

  async function handleAttach() {
    if (!selectedLabelId) return;
    setError("");

    try {
      const response = await apiFetch(`${issuePath}/labels`, {
        method: "POST",
        body: JSON.stringify({ label_id: selectedLabelId }),
      });

      if (!response.ok) {
        setError(errorMessage(response.status, { 409: "Эта метка уже добавлена" }));
        return;
      }

      const issue = await response.json();
      setIssueLabels(issue.labels);
      setSelectedLabelId("");
    } catch {
      setError("Сервер недоступен");
    }
  }

  async function handleDetach(labelId: string) {
    setError("");

    try {
      const response = await apiFetch(`${issuePath}/labels/${labelId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setError(errorMessage(response.status, {}));
        return;
      }

      const issue = await response.json();
      setIssueLabels(issue.labels);
    } catch {
      setError("Сервер недоступен");
    }
  }

  async function handleCreateLabel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const response = await apiFetch(`${projectPath}/labels`, {
        method: "POST",
        body: JSON.stringify({ name: newName, color: newColor }),
      });

      if (!response.ok) {
        setError(
          errorMessage(response.status, {
            403: "Создавать метки могут только администратор и владелец",
            409: "Метка с таким названием уже существует",
            400: "Проверьте название и цвет",
          }),
        );
        return;
      }

      setNewName("");
      loadProjectLabels();
    } catch {
      setError("Сервер недоступен");
    }
  }

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold mb-3">Метки</h2>

      {issueLabels.length === 0 ? (
        <p className="text-gray-500 text-sm">Меток нет</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {issueLabels.map((il) => (
            <span
              key={il.label_id}
              className="flex items-center gap-2 border rounded-full px-3 py-1 text-sm"
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: il.label.color }}
              />
              {il.label.name}
              <button
                onClick={() => handleDetach(il.label_id)}
                className="text-gray-400 hover:text-red-600"
                title="Убрать"
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
            value={selectedLabelId}
            onChange={(e) => setSelectedLabelId(e.target.value)}
            className="border rounded px-3 py-2 flex-1"
          >
            <option value="">Выберите метку</option>
            {available.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAttach}
            disabled={!selectedLabelId}
            className="bg-blue-600 text-white rounded px-4 disabled:opacity-50"
          >
            Добавить
          </button>
        </div>
      )}

      <form onSubmit={handleCreateLabel} className="flex gap-2 mt-3">
        <input
          placeholder="Новая метка (например: Bug)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          required
          className="border rounded px-3 py-2 flex-1"
        />
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className="w-12 h-10 border rounded"
        />
        <button type="submit" className="border rounded px-4">
          Создать
        </button>
      </form>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </section>
  );
}