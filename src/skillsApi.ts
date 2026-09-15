export interface SkillsShSkill {
  id: string;
  slug: string;
  name: string;
  source: string;
  installs: number;
  sourceType?: string;
  installUrl?: string | null;
  url?: string;
  isDuplicate?: boolean;
  description?: string;
}

export interface SkillsShSearchResponse {
  query: string;
  searchType: string;
  skills: SkillsShSkill[];
  count: number;
  durationMs: number;
}

export async function searchSkills(query: string, limit: number = 20): Promise<SkillsShSearchResponse> {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 2) {
    throw new Error("Search query must be at least 2 characters");
  }

  const params = new URLSearchParams({
    q: trimmedQuery,
    limit: String(limit)
  });
  const response = await fetch(`/api/skills-search?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? `Search failed with status ${response.status}`);
  }

  return normalizeSearchResponse(await response.json(), trimmedQuery);
}

type RawSkill = Partial<SkillsShSkill> & {
  skillId?: string;
};

type RawSearchResponse = {
  data?: RawSkill[];
  skills?: RawSkill[];
  query?: string;
  searchType?: string;
  count?: number;
  durationMs?: number;
  duration_ms?: number;
};

function normalizeSearchResponse(payload: RawSearchResponse, query: string): SkillsShSearchResponse {
  const rawSkills = payload.data ?? payload.skills ?? [];
  const skills = rawSkills
    .map((skill) => {
      const id = skill.id ?? [skill.source, skill.slug ?? skill.skillId].filter(Boolean).join("/");
      const slug = skill.slug ?? skill.skillId ?? id.split("/").at(-1) ?? id;

      return {
        id,
        slug,
        name: skill.name ?? slug,
        source: skill.source ?? id.replace(`/${slug}`, ""),
        installs: skill.installs ?? 0,
        sourceType: skill.sourceType,
        installUrl: skill.installUrl,
        url: skill.url,
        isDuplicate: skill.isDuplicate,
        description: skill.description
      };
    })
    .filter((skill) => skill.id && skill.slug);

  return {
    query: payload.query ?? query,
    searchType: payload.searchType ?? "registry",
    skills,
    count: payload.count ?? skills.length,
    durationMs: payload.durationMs ?? payload.duration_ms ?? 0
  };
}
