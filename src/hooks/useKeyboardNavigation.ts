import { KeyboardEvent } from "react";
import { useSearchStore } from "@/store/searchStore";

export function useKeyboardNavigation(
  itemsCount: number,
  onSelect: (index: number) => void,
  onClose: () => void
) {
  const { activeIndex, setActiveIndex } = useSearchStore();

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (itemsCount === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = activeIndex + 1 >= itemsCount ? 0 : activeIndex + 1;
      setActiveIndex(nextIndex);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = activeIndex - 1 < 0 ? itemsCount - 1 : activeIndex - 1;
      setActiveIndex(prevIndex);
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < itemsCount) {
        e.preventDefault();
        onSelect(activeIndex);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return { handleKeyDown };
}
