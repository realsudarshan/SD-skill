type ApiRequest = {
  query: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  status(code: number): {
    json(payload: unknown): void;
  };
};

export default async function handler(request: ApiRequest, response: ApiResponse) {
  const query = Array.isArray(request.query.q) ? request.query.q[0] : request.query.q;
  const limit = Array.isArray(request.query.limit) ? request.query.limit[0] : request.query.limit;
  const trimmedQuery = query?.trim() ?? "";

  if (trimmedQuery.length < 2) {
    response.status(400).json({ message: "Search query must be at least 2 characters" });
    return;
  }

  try {
    const payload = await fetchSkillsSearch(trimmedQuery, limit ?? "50");
    response.status(200).json(payload);
  } catch (error) {
    response.status(502).json({
      message: error instanceof Error ? error.message : "Could not reach skills.sh search."
    });
  }
}

async function fetchSkillsSearch(query: string, limit: string) {
  const params = new URLSearchParams({ q: query, limit });
  const token = process.env.VERCEL_OIDC_TOKEN;

  if (token) {
    const authenticatedResponse = await fetch(`https://skills.sh/api/v1/skills/search?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (authenticatedResponse.ok) {
      return authenticatedResponse.json();
    }
  }

  const publicResponse = await fetch(`https://skills.sh/api/search?${params.toString()}`);

  if (!publicResponse.ok) {
    throw new Error(`skills.sh search returned ${publicResponse.status}`);
  }

  return publicResponse.json();
}
