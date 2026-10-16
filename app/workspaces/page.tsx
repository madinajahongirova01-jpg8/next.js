"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, errorMessage, logout, type Workspace } from "@/lib/api";

export default function WorkspacesPage() {
  const router = useRouter();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");

  async function loadWorkspaces() {
    try {
      const response = await apiFetch("/workspaces");
      if (response.ok) {
        const data: Workspace[] = await response.json();
        setWorkspaces(data);
      }
    } catch {
      setError("Сервер недоступен");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.replace("/login");
      return;
    }
    loadWorkspaces();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const response = await apiFetch("/workspaces", {
        method: "POST",
        body: JSON.stringify({ name, slug }),
      });

      if (!response.ok) {
        setError(
          errorMessage(response.status, {
            409: "Такой slug уже занят",
            400: 'Slug: только маленькие латинские буквы, цифры и "-"',
          }),
        );
        return;
      }

      setName("");
      setSlug("");
      loadWorkspaces();
    } catch {
      setError("Сервер недоступен");
    }
  }

  return (
    <main className="w-full max-w-2xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Рабочие пространства</h1>
        <button onClick={logout} className="border rounded px-4 py-2">
          Выйти
        </button>
      </div>

      {loading ? (
        <p>Загрузка...</p>
      ) : workspaces.length === 0 ? (
        <p className="text-gray-500">У вас пока нет рабочих пространств</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {workspaces.map((ws) => (
            <li key={ws.id}>
              <Link
                href={`/workspaces/${ws.slug}`}
                className="block border rounded-lg p-4 hover:bg-gray-100"
              >
                <p className="font-semibold">{ws.name}</p>
                <p className="text-sm text-gray-500">/{ws.slug}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className="text-lg font-semibold mt-10 mb-3">
        Создать новое пространство
      </h2>
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          placeholder="Название"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="border rounded px-3 py-2 flex-1"
        />
        <input
          placeholder="slug (например: my-team)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          className="border rounded px-3 py-2 flex-1"
        />
        <button type="submit" className="bg-blue-600 text-white rounded px-4">
          Создать
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </main>
  );
}