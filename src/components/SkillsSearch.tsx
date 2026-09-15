import { useEffect, useState, type FormEvent } from "react";
import { Check, Download, ExternalLink, Search, TrendingUp } from "lucide-react";
import { searchSkills, type SkillsShSkill } from "../skillsApi";
import type { MultiSelectControls } from "../types";

const defaultLimit = 50;

type SkillsSearchProps = {
  multiSelect?: MultiSelectControls;
};

export function SkillsSearch({ multiSelect }: SkillsSearchProps) {
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get("q") ?? "");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [results, setResults] = useState<SkillsShSkill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedSkillId, setCopiedSkillId] = useState<string | null>(null);

  async function runSearch(nextQuery: string) {
    const trimmedQuery = nextQuery.trim();

    if (trimmedQuery.length < 2) {
      setError("Search query must be at least 2 characters");
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);
    setSearchedQuery(trimmedQuery);

    try {
      const response = await searchSkills(trimmedQuery, defaultLimit);
      setResults(response.skills);
    } catch {
      setError("Could not reach skills.sh search right now. Please try again in a moment.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initialQuery = new URLSearchParams(window.location.search).get("q");
    if (!initialQuery || initialQuery.trim().length < 2) return;
    void runSearch(initialQuery);
  }, []);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    const params = new URLSearchParams(window.location.search);
    params.set("q", trimmedQuery);
    window.history.replaceState(null, "", `/search?${params.toString()}`);
    void runSearch(trimmedQuery);
  };

  const getInstallUrl = (skill: SkillsShSkill) => {
    // If there's a specific installUrl, use it
    if (skill.installUrl) {
      return `npx skills add ${skill.installUrl}`;
    }
    
    // For skills that are part of a repository (have a source and slug)
    // Use the format: npx skills add <source> --skill <slug>
    if (skill.source && skill.slug && skill.source !== skill.slug) {
      // Convert source to GitHub URL format if needed
      const githubUrl = skill.source.includes('github.com') 
        ? skill.source 
        : `https://github.com/${skill.source}`;
      return `npx skills add ${githubUrl} --skill ${skill.slug}`;
    }
    
    // Fallback for standalone skills
    return `npx skills add ${skill.source || skill.id}`;
  };

  const copyInstallCommand = async (skill: SkillsShSkill) => {
    await navigator.clipboard.writeText(getInstallUrl(skill));
    setCopiedSkillId(skill.id);
    window.setTimeout(() => setCopiedSkillId(null), 1400);
  };

  const toggleSelection = (skill: SkillsShSkill, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (multiSelect) {
      // Use skill ID as the selection key to ensure uniqueness
      multiSelect.toggle({
        title: skill.name,
        command: getInstallUrl(skill),
        id: skill.id
      });
    }
  };

  return (
    <section id="skills-search" className="skills-search-section">
      <div className="section-header">
        <div>
          <span className="section-eyebrow">skills.sh registry</span>
          <h2>Search public skills</h2>
        </div>
        <p>Find installable skills from the skills.sh catalog without leaving this page.</p>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills, sources, or workflows"
            className="search-input"
            disabled={loading}
          />
          <button type="submit" className="search-button" disabled={loading || query.length < 2}>
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {error && <div className="error-message">{error}</div>}

      {hasSearched && !loading && (
        <div className="search-results">
          <div className="results-header">
            <h3>
              {results.length} {results.length === 1 ? "result" : "results"} for "{searchedQuery}"
            </h3>
          </div>

          {results.length === 0 ? (
            <div className="no-results">
              <p>No skills found. Try a different search term.</p>
            </div>
          ) : (
            <div className="results-grid">
              {results.map((skill) => {
                const isSelected = multiSelect?.active && !!multiSelect.selected[skill.id];
                
                return (
                  <div key={skill.id} className={`skill-card ${isSelected ? "selected" : ""}`}>
                    <div className="skill-header">
                      <h4 className="skill-name">{skill.name}</h4>
                      <div className="skill-stats">
                        <span className="install-count" title="Install count">
                          <TrendingUp size={14} />
                          {skill.installs?.toLocaleString() || "0"}
                        </span>
                      </div>
                    </div>
                    
                    {skill.description && (
                      <p className="skill-description">{skill.description}</p>
                    )}
                    
                    <div className="skill-meta">
                      <span className="skill-source">{skill.source}</span>
                      {skill.isDuplicate && <span className="skill-flag">Duplicate</span>}
                    </div>

                    <div className="skill-actions">
                      {multiSelect?.active ? (
                        <button
                          type="button"
                          onClick={(e) => toggleSelection(skill, e)}
                          className={`selection-toggle ${isSelected ? "selected" : ""}`}
                          title={isSelected ? "Remove from selection" : "Add to selection"}
                        >
                          <Check size={16} aria-hidden="true" />
                          {isSelected ? "Selected" : "Select"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void copyInstallCommand(skill)}
                          className="copy-command-button"
                          title="Copy install command"
                        >
                          {copiedSkillId === skill.id ? <Check size={16} /> : <Download size={16} />}
                          {copiedSkillId === skill.id ? "Copied" : "Copy command"}
                        </button>
                      )}
                      <a
                        href={skill.url ?? `https://skills.sh/${skill.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="view-details-button"
                      >
                        <ExternalLink size={16} />
                        View Details
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
