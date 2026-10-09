export function env(name: string) {
  return process.env[name]?.trim() || "";
}

export function getAppUrl() {
  return env("APP_URL").replace(/\/$/, "") || "http://localhost:3000";
}
