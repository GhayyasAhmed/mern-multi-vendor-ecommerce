function resolveBackendBase(): string {
  const backendOrigin =
    process.env.BACKEND_API_URL ||
    (process.env.NEXT_PUBLIC_API_URL?.startsWith("http")
      ? process.env.NEXT_PUBLIC_API_URL
      : undefined);

  if (!backendOrigin) {
    throw new Error(
      "BACKEND_API_URL (or an absolute NEXT_PUBLIC_API_URL) must be set to fetch data during server rendering."
    );
  }

  return backendOrigin.replace(/\/$/, "");
}

export interface ServerFetchOptions {
  revalidate?: number | false;
  tags?: string[];
}

export async function serverApiFetch<T>(
  path: string,
  options: ServerFetchOptions = {}
): Promise<T | null> {
  const base = resolveBackendBase();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const res = await fetch(url, {
      next: {
        revalidate: options.revalidate ?? 60,
        tags: options.tags,
      },
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as T;
  } catch {
    return null;
  }
}