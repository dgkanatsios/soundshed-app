// @vitest-environment jsdom
import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "../../testing/componentTestSetup";
import { LessonStateStore } from "../../stores/lessonstate";

const getVideoSearchResults = vi.fn();

// lessons.tsx pulls lessonManager from components/app, which would drag in the
// whole application (routing, electron bridges, device managers) on import.
vi.mock("../app", () => ({
  lessonManager: {
    getVideoSearchResults: (...args: any[]) => getVideoSearchResults(...args),
    storeFavourite: vi.fn(),
    deleteFavourite: vi.fn(),
    loadFavourites: vi.fn(),
  },
}));

vi.mock("react-player/youtube", () => ({ default: () => null }));

vi.mock("../../env", () => ({
  default: { YoutubeAPIKey: "test-key", IsWebMode: true },
}));

import LessonsControl from "../lessons";

const setState = (patch: Record<string, any>) =>
  LessonStateStore.update((s) => Object.assign(s, patch));

const resetStore = () =>
  setState({
    searchResults: [],
    favourites: [],
    playingVideoUrl: null,
    isSearching: false,
    searchError: null,
    hasSearched: false,
  });

const searchBox = () => screen.getByPlaceholderText(/search backing tracks/i);

// The panel clears the store when it mounts, so state a test wants on screen has
// to be applied after the render rather than before it.
const renderLessons = (patch: Record<string, any> = {}) => {
  const result = render(<LessonsControl />);
  if (Object.keys(patch).length > 0) act(() => setState(patch));
  return result;
};

describe("Jam backing-track search", () => {
  beforeEach(() => {
    getVideoSearchResults.mockReset();
    getVideoSearchResults.mockResolvedValue([]);
    resetStore();
  });

  describe("triggering a search", () => {
    it("searches when Enter is pressed in the field", async () => {
      const user = userEvent.setup();
      render(<LessonsControl />);
      getVideoSearchResults.mockClear();

      await user.type(searchBox(), "enter sandman{Enter}");

      expect(getVideoSearchResults).toHaveBeenCalledWith(
        false,
        "backing track enter sandman"
      );
    });

    it("searches when the button is clicked", async () => {
      const user = userEvent.setup();
      render(<LessonsControl />);
      getVideoSearchResults.mockClear();

      await user.type(searchBox(), "enter sandman");
      await user.click(screen.getByRole("button", { name: /^search$/i }));

      expect(getVideoSearchResults).toHaveBeenCalledWith(
        false,
        "backing track enter sandman"
      );
    });

    it("does not search on every keystroke", async () => {
      const user = userEvent.setup();
      render(<LessonsControl />);
      getVideoSearchResults.mockClear();

      await user.type(searchBox(), "blues");

      expect(getVideoSearchResults).not.toHaveBeenCalled();
    });

    it("falls back to a plain query when the box is blank", async () => {
      const user = userEvent.setup();
      render(<LessonsControl />);
      getVideoSearchResults.mockClear();

      await user.type(searchBox(), "   {Enter}");

      expect(getVideoSearchResults).toHaveBeenCalledWith(
        false,
        "backing track"
      );
    });

    it("ignores a second search while one is already running", async () => {
      const user = userEvent.setup();
      renderLessons({ isSearching: true });
      getVideoSearchResults.mockClear();

      await user.type(searchBox(), "x{Enter}");

      expect(getVideoSearchResults).not.toHaveBeenCalled();
    });
  });

  describe("opening the panel", () => {
    it("does not run a search of its own", () => {
      renderLessons();

      expect(getVideoSearchResults).not.toHaveBeenCalled();
    });

    it("discards results left over from a previous visit", () => {
      setState({
        searchResults: [
          {
            itemId: "a",
            url: "u",
            title: "Stale Track",
            channelTitle: "C",
            description: "",
            thumbnailUrl: "t",
            channelId: "c",
            datePublished: new Date(),
          },
        ],
        hasSearched: true,
      });

      renderLessons();

      expect(screen.queryByText("Stale Track")).toBeNull();
      expect(screen.getByText(/no results yet/i)).toBeTruthy();
    });

    it("leaves the search box empty", () => {
      renderLessons();

      expect((searchBox() as HTMLInputElement).value).toBe("");
    });

    it("clears results again on the way out, for the next visit", () => {
      const { unmount } = renderLessons({ hasSearched: true });

      unmount();

      expect(LessonStateStore.getRawState().hasSearched).toBe(false);
      expect(LessonStateStore.getRawState().searchResults).toEqual([]);
    });
  });

  describe("reporting state", () => {
    it("shows the failure message and hides the result list", () => {
      renderLessons({ searchError: "Quota is gone." });

      expect(screen.getByRole("alert")).toHaveTextContent("Quota is gone.");
      expect(screen.queryByText(/no results yet/i)).toBeNull();
    });

    it("offers a retry that runs the search again", async () => {
      const user = userEvent.setup();
      renderLessons({ searchError: "Quota is gone." });
      getVideoSearchResults.mockClear();

      await user.click(screen.getByRole("button", { name: /try again/i }));

      expect(getVideoSearchResults).toHaveBeenCalledTimes(1);
    });

    it("shows a busy indicator and disables the button while searching", () => {
      renderLessons({ isSearching: true });

      expect(screen.getByRole("status", { name: /searching/i })).toBeTruthy();
      expect(
        (screen.getByRole("button", { name: /^search$/i }) as HTMLButtonElement)
          .disabled
      ).toBe(true);
    });

    it("says nothing has been searched yet before the first search", () => {
      renderLessons();

      expect(screen.getByText(/no results yet/i)).toBeTruthy();
    });

    it("says nothing matched once a search has run", () => {
      renderLessons({ hasSearched: true });

      expect(screen.getByText(/no backing tracks matched/i)).toBeTruthy();
    });

    it("says it is searching while a search is in flight", () => {
      renderLessons({ isSearching: true });

      expect(screen.getByText(/searching/i)).toBeTruthy();
    });
  });
});
