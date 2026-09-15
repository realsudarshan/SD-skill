import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

declare const process: {
  env: Record<string, string | undefined>;
};

export default defineConfig({
  plugins: [
    react(),
    {
      name: "skills-search-api",
      configureServer(server) {
        server.middlewares.use("/api/skills-search", async (request, response) => {
          const requestUrl = new URL((request as { url?: string }).url ?? "", "http://localhost");
          const query = requestUrl.searchParams.get("q")?.trim() ?? "";
          const limit = requestUrl.searchParams.get("limit") ?? "50";

          response.setHeader("Content-Type", "application/json");

          if (query.length < 2) {
            response.statusCode = 400;
            response.end(JSON.stringify({ message: "Search query must be at least 2 characters" }));
            return;
          }

          try {
            const payload = await fetchSkillsSearch(query, limit);
            response.statusCode = 200;
            response.end(JSON.stringify(payload));
          } catch (error) {
            response.statusCode = 502;
            response.end(
              JSON.stringify({
                message: error instanceof Error ? error.message : "Could not reach skills.sh search."
              })
            );
          }
        });
      }
    }
  ],
  build: {
    sourcemap: true
  }
});

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
