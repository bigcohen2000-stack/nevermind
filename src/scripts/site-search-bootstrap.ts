import { localSiteSearch, mergeSearchResults } from "../lib/local-site-search";

declare global {
  interface Window {
    __nmLocalSiteSearch?: typeof localSiteSearch;
    __nmMergeSearchResults?: typeof mergeSearchResults;
  }
}

window.__nmLocalSiteSearch = localSiteSearch;
window.__nmMergeSearchResults = mergeSearchResults;
