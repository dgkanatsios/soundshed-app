import React from "react";
import { PGPresetQuery } from "../spork/src/devices/spark/sparkAPI";

export const FIRST_PAGE = 1;

/**
 * Builds the query sent to the PG ToneCloud API.
 *
 * The keyword is always included, even when blank. SparkAPI merges each query
 * into a single long-lived `presetQueryParams` object, so omitting the keyword
 * leaves the previous search term in place and a cleared search box would keep
 * returning the old filtered results.
 */
export function buildToneCloudQuery(
  keyword: string,
  page: number
): PGPresetQuery {
  return {
    page: clampPage(page),
    keyword: (keyword ?? "").trim(),
  };
}

export function clampPage(page: number): number {
  if (!Number.isFinite(page)) return FIRST_PAGE;
  return Math.max(FIRST_PAGE, Math.floor(page));
}

export function nextPage(page: number): number {
  return clampPage(page) + 1;
}

export function previousPage(page: number): number {
  return clampPage(clampPage(page) - 1);
}

export interface ToneCloudSearch {
  keyword: string;
  setKeyword: (keyword: string) => void;
  page: number;
  isFirstPage: boolean;
  search: () => void;
  goNext: () => void;
  goPrevious: () => void;
}

export type ToneCloudLoader = (query: PGPresetQuery) => unknown;

/**
 * Owns keyword + paging state for a ToneCloud result list.
 *
 * The loader is injected rather than imported so this can be exercised
 * directly, and so the same behaviour can back more than one search surface.
 */
export function useToneCloudSearch(load: ToneCloudLoader): ToneCloudSearch {
  const [keyword, setKeyword] = React.useState("");
  const [page, setPage] = React.useState(FIRST_PAGE);

  const runQuery = (targetPage: number) => {
    setPage(targetPage);
    load(buildToneCloudQuery(keyword, targetPage));
  };

  return {
    keyword,
    setKeyword,
    page,
    isFirstPage: page <= FIRST_PAGE,

    // A new search always restarts at page 1, otherwise the first page of
    // results for the new keyword is silently skipped.
    search: () => runQuery(FIRST_PAGE),

    goNext: () => runQuery(nextPage(page)),

    goPrevious: () => {
      const target = previousPage(page);
      if (target === page) return;
      runQuery(target);
    },
  };
}
