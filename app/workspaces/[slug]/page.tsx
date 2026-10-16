"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch, errorMessage, type Workspace } from "@/lib/api";
import MembersSection from "@/componenrs/MembersSection";
import ProjectsSection from "@/components/ProjectsSection";

export default function WorkspacePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadWorkspace() {
    try {
      const response = await apiFetch(`/workspaces/${params.slug}`);

      if (!response.ok) {
        setPageError(
          errorMessage(response.status, {
            404: "Пространство не найдено",
            403: "Вы не являетесь участником этого пространства",
          }),
        );
        return;
      }

      const data: Workspace = await response.json();
      setWorkspace(data);
      setName(data.name);
      setSlug(data.slug);
    } catch {
      setPageError("Сервер недоступен");
    } finally {
      setLoading(false);
    }
  }
   

  /// агар токен набошад ба логин рав агар бошад ба loadWorkspace  рав 
//                                  ||
//                                  \/
  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.replace("/login");
      return;
    }
    loadWorkspace();
  }, []);

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await apiFetch(`/workspaces/${params.slug}`, {
        method: "PATCH",
        body: JSON.stringify({ name, slug }),
      });

      if (!response.ok) {
        setError(
          errorMessage(response.status, {
            403: "Изменять могут только администратор и владелец",
            409: "Такой slug уже занят",
            400: "Slug: только маленькие буквы",
          }),
        );
        return;
      }

      const data: Workspace = await response.json();
      setWorkspace(data);
      setMessage("Изменения сохранены");

      if (data.slug !== params.slug) {
        router.replace(`/workspaces/${data.slug}`);
      }
    } catch {
      setError("Сервер недоступен");
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Удалить  "${workspace?.name}"? Это действие нельзя отменить.`,
    );
    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await apiFetch(`/workspaces/${params.slug}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setError(
          errorMessage(response.status, {
            403: "Удалить пространство может только владелец",
          }),
        );
        return;
      }

      router.push("/workspaces");
    } catch {
      setError("Сервер недоступен");
    }
  }

  if (loading) {
    return <main className="p-8">Загрузка...</main>;
  }

  if (pageError || !workspace) {
    return (
      <main className="w-full max-w-2xl mx-auto p-8">
        <p className="text-red-500 mb-4">{pageError}</p>
        <Link href="/workspaces" className="text-blue-600 underline">
          ← Все пространства
        </Link>
      </main>
    );
  }

  return (
    <main className="w-full max-w-2xl mx-auto p-8">
      <Link href="/workspaces" className="text-blue-600 underline">
        ← Все пространства
      </Link>
      <h1 className="text-2xl font-bold mt-4">{workspace.name}</h1>
      <p className="text-gray-500">/{workspace.slug}</p>
            <ProjectsSection slug={params.slug} />
                  <ProjectsSection slug={params.slug} />
      <h2 className="text-lg font-semibold mt-10 mb-3">Настройки</h2>
      <form onSubmit={handleUpdate} className="flex flex-col gap-3">
        <input
          placeholder="Название"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="border rounded px-3 py-2"
        />
        <input
          placeholder="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          className="border rounded px-3 py-2"
        />
        <button type="submit" className="bg-blue-600 text-white rounded py-2">
          Сохранить
        </button>
      </form>
      {message && <p className="text-green-600 text-sm mt-2">{message}</p>}
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      <MembersSection slug={params.slug} />
      <button
        onClick={handleDelete}
        className="mt-10 border border-red-600 text-red-600 rounded px-4 py-2"
      >
        Удалить пространство
      </button>
    </main>
  );
}