import { fetchSiteIcon } from "@/lib/favicon";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("u")?.trim() || "";
  if (!raw) {
    return Response.json({ error: "Missing url." }, { status: 400 });
  }

  const icon = await fetchSiteIcon(raw);
  if (!icon) {
    return Response.json({ error: "No icon." }, { status: 404 });
  }

  const type =
    icon.type === "image/svg+xml" ? "image/svg+xml; charset=utf-8" : icon.type;

  return new Response(Uint8Array.from(icon.body), {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
