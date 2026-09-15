import { SkillsSearch } from "../components/SkillsSearch";
import type { MultiSelectControls } from "../types";

type SearchPageProps = {
  multiSelect: MultiSelectControls;
};

export function SearchPage({ multiSelect }: SearchPageProps) {
  return (
    <main className="search-page-section">
      <SkillsSearch multiSelect={multiSelect} />
    </main>
  );
}
