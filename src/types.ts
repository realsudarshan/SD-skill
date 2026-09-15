export type SelectionItem = {
  title: string;
  command: string;
  id?: string; // Optional unique identifier for selection
};

export type MultiSelectControls = {
  active: boolean;
  selected: Record<string, SelectionItem>;
  toggle: (item: SelectionItem) => void;
};
