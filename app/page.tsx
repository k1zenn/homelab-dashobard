"use client";

import { useEffect, useMemo, useState } from "react";

type DropletStatus = {
  id: number;
  name: string;
  status: string;
  uptime: string;
  region: string;
  distro: string;
  ip: string;
  memoryMb: number | null;
  vcpus: number | null;
  diskGb: number | null;
  checkedAt: string;
};

export default function Home() {
  const [droplet, setDroplet] = useState<DropletStatus | null>(null);
  const [dropletError, setDropletError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDroplet = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/droplet-status", { cache: "no-store" });
        const data = (await res.json()) as DropletStatus & { error?: string };

        if (!res.ok) {
          setDroplet(null);
          setDropletError(data.error ?? "Could not load DigitalOcean status");
          return;
        }

        setDroplet(data);
        setDropletError(null);
      } catch {
        setDroplet(null);
        setDropletError("Could not load DigitalOcean status");
      } finally {
        setLoading(false);
      }
    };

    loadDroplet();
  }, []);

  const isOnline = useMemo(() => {
    if (!droplet || dropletError) return false;
    return droplet.status === "active";
  }, [droplet, dropletError]);

  return (
    <main className="min-h-screen bg-zinc-950 text-white px-6 py-8 md:px-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <p className="text-sm text-zinc-400">Personal Dashboard</p>
          <h1 className="text-3xl md:text-4xl font-bold mt-1">NodeWatch</h1>
          <p className="text-zinc-300 mt-2 text-sm md:text-base">
            Quick overview of my current setup.
          </p>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            <p className="text-xs text-zinc-400">Total VMs</p>
            <p className="text-xl font-semibold">1</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            <p className="text-xs text-zinc-400">Running</p>
            <p className={`text-xl font-semibold ${isOnline ? "text-green-400" : "text-red-400"}`}>
              {isOnline ? "1" : "0"}
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            <p className="text-xs text-zinc-400">Public Status</p>
            {loading ? (
              <p className="text-xl font-semibold text-zinc-300">Checking...</p>
            ) : (
              <p className={`text-xl font-semibold ${isOnline ? "text-green-400" : "text-red-400"}`}>
                {isOnline ? "Online" : "Offline"}
              </p>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5">
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
            <h2 className="text-lg font-semibold mb-3">☁️ DigitalOcean VM</h2>
            {loading ? (
              <p className="text-zinc-300">Status: Checking...</p>
            ) : droplet ? (
              <>
                <p className="text-zinc-300">Name: openclaw</p>
                <p className="text-zinc-300">
                  Status: {droplet.status === "active" ? "🟢 Active" : `🔴 ${droplet.status}`}
                </p>
                <p className="text-zinc-300">Uptime: {droplet.uptime}</p>
                <p className="text-zinc-300">Distro: {droplet.distro}</p>
                <p className="text-zinc-400 text-sm mt-2">{droplet.region}</p>
              </>
            ) : (
              <>
                <p className="text-zinc-300">Status: 🔴 Offline</p>
                {dropletError ? <p className="text-red-300 text-sm mt-2">{dropletError}</p> : null}
              </>
            )}
          </div>
        </section>

        <footer className="mt-8 text-xs text-zinc-500">Last updated manually • v0.4</footer>
      </div>
    </main>
  );
}
