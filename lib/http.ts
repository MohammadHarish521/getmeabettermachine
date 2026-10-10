export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function jsonError(error: unknown) {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  console.error(error);
  const detail =
    process.env.NODE_ENV !== "production" && error instanceof Error
      ? error.message
      : "Something went wrong.";
  return Response.json({ error: detail }, { status: 500 });
}
