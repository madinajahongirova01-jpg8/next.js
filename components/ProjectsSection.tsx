"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { apiFetch, errorMessage, type Project } from "@/lib/api";

interface ProjectsSectionProps {
  slug: string;
}

export default function ProjectsSection({ slug }: ProjectsSectionProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadProjects() {
    try {
      const response = await apiFetch(`/workspaces/${slug}/projects`);
      if (response.ok) {
        const data: Project[] = await response.json();
        setProjects(data);
      }
    } catch {
      setError("Сервер недоступен");
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await apiFetch(`/workspaces/${slug}/projects`, {
        method: "POST",
        body: JSON.stringify({
          name,
          identifier,
          description: description || undefined,
        }),
      });

      if (!response.ok) {
        setError(
          errorMessage(response.status, {
            403: "Создавать проекты могут только администратор и владелец",
            409: "Проект с таким ключом уже существует",
            400: "Ключ: только заглавные латинские буквы и цифры (до 10)",
          }),
        );
        return;
      }

      setName("");
      setIdentifier("");
      setDescription("");
      setMessage("Проект создан");
      loadProjects();
    } catch {
      setError("Сервер недоступен");
    }
  }

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold mb-3">
        Проекты ({projects.length})
      </h2>

      {projects.length === 0 ? (
        <p className="text-gray-500">Пока нет проектов</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/workspaces/${slug}/projects/${project.id}`}
                className="flex items-center gap-3 border rounded-lg p-3 hover:bg-gray-100"
              >
                <span className="text-sm font-mono bg-blue-100 text-blue-700 rounded px-2 py-1">
                  {project.identifier}
                </span>
                <div>
                  <p className="font-semibold">{project.name}</p>
                  {project.description && (
                    <p className="text-sm text-gray-500">{project.description}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h3 className="font-semibold mt-6 mb-2">Создать проект</h3>
      <form onSubmit={handleCreate} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            placeholder="Название"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="border rounded px-3 py-2 flex-1"
          />
          <input
            placeholder="Ключ (MOB)"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
            required
            maxLength={10}
            className="border rounded px-3 py-2 w-32"
          />
        </div>
        <input
          placeholder="Описание (необязательно)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <button type="submit" className="bg-blue-600 text-white rounded py-2">
          Создать
        </button>
      </form>

      {message && <p className="text-green-600 text-sm mt-2">{message}</p>}
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </section>
  );
}