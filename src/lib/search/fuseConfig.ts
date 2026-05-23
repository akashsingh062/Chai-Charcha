import Fuse, { IFuseOptions } from "fuse.js";
import { SearchItem } from "@/types/search";

export const FUSE_OPTIONS: IFuseOptions<SearchItem> = {
  includeScore: true,
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
  keys: [
    { name: "title", weight: 0.6 },
    { name: "tags", weight: 0.25 },
    { name: "description", weight: 0.15 },
  ],
};
