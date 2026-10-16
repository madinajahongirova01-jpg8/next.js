"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("🤬🤬🤬🤬🤬");
        } else {
          setError(" Попробуйте позже");
        }
        return;
      }
      const data = await response.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);

      router.push("/workspaces");
    } catch {
      setError("Сервер недоступен");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="flex flex-1 items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-80 flex flex-col gap-3 border rounded-lg p-6"
      >
        <h1 className="text-2xl font-bold">Вход</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border rounded px-3 py-2"
        />

        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border rounded px-3 py-2"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white rounded py-2 disabled:opacity-50"
        >
          {loading ? "Подождите..." : "Войти"}
        </button>

        <p className="text-sm">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-blue-600 underline">
            Зарегистрироваться
          </Link>
        </p>
      </form>
    </main>
  );
}