import { SITE_DEFAULTS } from "@/config/site";

export type XProfile = {
  name: string;
  handle: string;
  url: string;
  description: string;
  followers: number;
  avatarUrl: string;
};

const HANDLE = "Harish_521";
const TTL_MS = 60 * 60 * 1000;

let cached: { at: number; profile: XProfile } | null = null;

function fallback(): XProfile {
  return {
    name: SITE_DEFAULTS.creator.name || "Harish",
    handle: HANDLE,
    url: SITE_DEFAULTS.creator.xUrl || `https://x.com/${HANDLE}`,
    description: "",
    followers: SITE_DEFAULTS.socialProof.xFollowing ?? 0,
    avatarUrl: "",
  };
}

export async function getXProfile(): Promise<XProfile> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.profile;

  try {
    const response = await fetch(`https://api.fxtwitter.com/${HANDLE}`, {
      headers: { accept: "application/json" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return cached?.profile ?? fallback();
    const body = (await response.json()) as {
      user?: {
        name?: string;
        screen_name?: string;
        url?: string;
        description?: string;
        followers?: number;
        avatar_url?: string;
      };
    };
    const user = body.user;
    if (!user?.screen_name) return cached?.profile ?? fallback();
    const profile: XProfile = {
      name: user.name || fallback().name,
      handle: user.screen_name,
      url: user.url || `https://x.com/${user.screen_name}`,
      description: user.description || "",
      followers: Number(user.followers) || 0,
      avatarUrl: (user.avatar_url || "").replace("_normal.", "_400x400."),
    };
    cached = { at: Date.now(), profile };
    return profile;
  } catch {
    return cached?.profile ?? fallback();
  }
}
