import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getHomeSnapshot } from "@/lib/queries";
import { formatUsd } from "@/lib/format";

export const runtime = "nodejs";
export const alt = "Raise My Mac";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Image() {
  let raised = 0;
  let chip = "Mac mini";
  let specs = "Nothing unlocked yet";
  try {
    const data = await getHomeSnapshot();
    raised = data.funding.raised;
    if (data.funding.current) {
      chip = `${data.funding.current.machineName} ${data.funding.current.chip}`;
      specs = `${data.funding.current.memory} · ${data.funding.current.storage}`;
    } else if (data.funding.next) {
      specs = `Next: ${data.funding.next.chip} ${data.funding.next.memory}`;
    }
  } catch {
    // Build environments without sqlite still get a usable card.
  }

  const logo = await readFile(join(process.cwd(), "public/mac-mini-logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          color: "#171614",
          padding: "72px",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img
            src={logoSrc}
            width={36}
            height={36}
            alt=""
            style={{ borderRadius: 8, objectFit: "cover" }}
          />
          <div style={{ fontSize: 28, letterSpacing: -0.8 }}>Raise My Mac</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 72, fontWeight: 500, letterSpacing: -3 }}>
            {formatUsd(raised)} raised
          </div>
          <div style={{ marginTop: 12, fontSize: 28, color: "#6d6963" }}>{chip}</div>
          <div style={{ marginTop: 6, fontSize: 24, color: "#9a958c" }}>{specs}</div>
        </div>
        <div style={{ fontSize: 22, color: "#6d6963" }}>Pick a spot on the machine</div>
      </div>
    ),
    { ...size },
  );
}
