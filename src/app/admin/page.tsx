"use client";

import { useState } from "react";

interface ClosingDay {
  date: string;
  reason?: string;
}

interface OpeningHours {
  timezone: string;
  openHour: number;
  closeHour: number;
  cacheTtlMinutes: number;
}

export default function AdminPage() {
  const [apiKey, setApiKey] = useState("");
  const [connected, setConnected] = useState(false);
  const [days, setDays] = useState<ClosingDay[]>([]);
  const [hours, setHours] = useState<OpeningHours | null>(null);
  const [tzInput, setTzInput] = useState("");
  const [openInput, setOpenInput] = useState("");
  const [closeInput, setCloseInput] = useState("");
  const [cacheInput, setCacheInput] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  function headers() {
    return { authorization: `Bearer ${apiKey}` };
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    const [daysRes, hoursRes] = await Promise.all([
      fetch("/api/admin/closing-days", { headers: headers() }),
      fetch("/api/admin/opening-hours", { headers: headers() }),
    ]);
    if (daysRes.ok && hoursRes.ok) {
      setDays(await daysRes.json());
      const h: OpeningHours = await hoursRes.json();
      setHours(h);
      setTzInput(h.timezone);
      setOpenInput(String(h.openHour));
      setCloseInput(String(h.closeHour));
      setCacheInput(String(h.cacheTtlMinutes));
      setConnected(true);
    } else {
      setError("Wrong API key.");
    }
  }

  async function handleSaveHours(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    const res = await fetch("/api/admin/opening-hours", {
      method: "PUT",
      headers: { "content-type": "application/json", ...headers() },
      body: JSON.stringify({
        timezone: tzInput,
        openHour: parseInt(openInput, 10),
        closeHour: parseInt(closeInput, 10),
        cacheTtlMinutes: parseInt(cacheInput, 10),
      }),
    });
    if (res.ok) {
      const saved: OpeningHours = await res.json();
      setHours(saved);
      setCacheInput(String(saved.cacheTtlMinutes));
      setStatus("Opening hours saved.");
    } else {
      try {
        const json = await res.json();
        setError(json.error ?? `Server error ${res.status}`);
      } catch {
        setError(`Server error ${res.status} — check Vercel logs`);
      }
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    const res = await fetch("/api/admin/closing-days", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers() },
      body: JSON.stringify({ date: newDate, reason: newReason || undefined }),
    });
    if (res.ok) {
      setNewDate("");
      setNewReason("");
      setStatus("Day added.");
      const list = await fetch("/api/admin/closing-days", { headers: headers() });
      if (list.ok) setDays(await list.json());
    } else {
      try {
        const json = await res.json();
        setError(json.error ?? `Server error ${res.status}`);
      } catch {
        setError(`Server error ${res.status} — check Vercel logs`);
      }
    }
  }

  async function handleDelete(date: string) {
    setError("");
    setStatus("");
    const res = await fetch(`/api/admin/closing-days/${date}`, {
      method: "DELETE",
      headers: headers(),
    });
    if (res.ok) {
      setStatus(`Removed ${date}.`);
      setDays((prev) => prev.filter((d) => d.date !== date));
    } else {
      setError("Failed to remove.");
    }
  }

  if (!connected) {
    return (
      <main className="max-w-sm mx-auto p-8 font-sans">
        <h1 className="text-2xl font-bold mb-6">Admin</h1>
        <form onSubmit={handleConnect} className="space-y-3">
          <label className="block text-sm font-medium">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter API key"
            required
            className="w-full border rounded px-3 py-2 text-sm"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-black text-white rounded px-4 py-2 text-sm hover:bg-gray-800"
          >
            Connect
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto p-8 font-sans">
      <h1 className="text-2xl font-bold mb-6">Admin</h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {status && <p className="text-green-600 text-sm mb-4">{status}</p>}

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-1">Opening Hours</h2>
        {hours && (
          <p className="text-sm text-gray-500 mb-3">
            Current: {hours.openHour}:00 – {hours.closeHour}:00 ({hours.timezone}) · cache {hours.cacheTtlMinutes === 0 ? "off" : `${hours.cacheTtlMinutes} min`}
          </p>
        )}
        <form onSubmit={handleSaveHours} className="space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={tzInput}
              onChange={(e) => setTzInput(e.target.value)}
              placeholder="Timezone (e.g. Europe/Copenhagen)"
              required
              className="border rounded px-3 py-2 text-sm flex-1"
            />
            <input
              type="number"
              value={openInput}
              onChange={(e) => setOpenInput(e.target.value)}
              placeholder="Open"
              min={0}
              max={23}
              required
              className="border rounded px-3 py-2 text-sm w-20"
            />
            <input
              type="number"
              value={closeInput}
              onChange={(e) => setCloseInput(e.target.value)}
              placeholder="Close"
              min={0}
              max={23}
              required
              className="border rounded px-3 py-2 text-sm w-20"
            />
            <input
              type="number"
              value={cacheInput}
              onChange={(e) => setCacheInput(e.target.value)}
              placeholder="Cache (min)"
              min={0}
              max={60}
              required
              className="border rounded px-3 py-2 text-sm w-24"
            />
            <button
              type="submit"
              className="bg-black text-white rounded px-4 py-2 text-sm hover:bg-gray-800"
            >
              Save
            </button>
          </div>
        </form>
      </section>

      <form onSubmit={handleAdd} className="mb-8 space-y-3">
        <h2 className="text-lg font-semibold">Add Closing Day</h2>
        <div className="flex gap-3">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            required
            className="border rounded px-3 py-2 text-sm flex-1"
          />
          <input
            type="text"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            placeholder="Reason (optional)"
            className="border rounded px-3 py-2 text-sm flex-1"
          />
          <button
            type="submit"
            className="bg-black text-white rounded px-4 py-2 text-sm hover:bg-gray-800"
          >
            Add
          </button>
        </div>
      </form>

      <h2 className="text-lg font-semibold mb-3">Scheduled Closing Days</h2>
      {days.length === 0 ? (
        <p className="text-gray-500 text-sm">No special closing days configured.</p>
      ) : (
        <ul className="space-y-2">
          {days.map((d) => (
            <li
              key={d.date}
              className="flex items-center justify-between border rounded px-4 py-2"
            >
              <span className="text-sm">
                <span className="font-mono font-medium">{d.date}</span>
                {d.reason && (
                  <span className="text-gray-500 ml-2">— {d.reason}</span>
                )}
              </span>
              <button
                onClick={() => handleDelete(d.date)}
                className="text-red-600 text-sm hover:underline ml-4"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
