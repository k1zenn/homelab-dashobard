import { NextResponse } from "next/server";

type DoDroplet = {
  id: number;
  name: string;
  status: string;
  created_at: string;
  region?: { slug?: string; name?: string };
  image?: { distribution?: string; name?: string };

};

type DoListResponse = {
  droplets: DoDroplet[];
};

function formatUptime(createdAt: string): string {
  const created = new Date(createdAt).getTime();
  const now = Date.now();

  if (Number.isNaN(created) || created > now) return "N/A";

  const diffMs = now - created;
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

export async function GET() {
  const token = process.env.DIGITALOCEAN_TOKEN;
  const targetId = process.env.DIGITALOCEAN_DROPLET_ID;
  const targetName = process.env.DIGITALOCEAN_DROPLET_NAME;

  if (!token) {
    return NextResponse.json(
      { error: "DIGITALOCEAN_TOKEN is not set on server" },
      { status: 500 },
    );
  }

  try {
    const response = await fetch("https://api.digitalocean.com/v2/droplets?per_page=200", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `DigitalOcean API error: ${response.status}` },
        { status: response.status },
      );
    }

    const data = (await response.json()) as DoListResponse;
    const droplets = data.droplets ?? [];

    let droplet: DoDroplet | undefined;

    if (targetId) {
      const parsed = Number(targetId);
      droplet = droplets.find((d) => d.id === parsed);
    }

    if (!droplet && targetName) {
      droplet = droplets.find((d) => d.name.toLowerCase() === targetName.toLowerCase());
    }

    if (!droplet) {
      droplet = droplets[0];
    }

    if (!droplet) {
      return NextResponse.json({ error: "No droplets found" }, { status: 404 });
    }

    return NextResponse.json({
      status: droplet.status,
      uptime: formatUptime(droplet.created_at),
      region: droplet.region?.name ?? droplet.region?.slug ?? "N/A",
      distro: droplet.image?.distribution ?? droplet.image?.name ?? "N/A",
      checkedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch droplet status" }, { status: 500 });
  }
}
