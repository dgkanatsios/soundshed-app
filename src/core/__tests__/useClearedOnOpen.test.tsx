// @vitest-environment jsdom
import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "../../testing/componentTestSetup";
import { useClearedOnOpen } from "../useClearedOnOpen";

const Surface = ({ isOpen, reset }: { isOpen: boolean; reset: () => void }) => {
  useClearedOnOpen(isOpen, reset);
  return null;
};

describe("useClearedOnOpen", () => {
  it("clears a surface that is already open when it mounts", () => {
    const reset = vi.fn();

    render(<Surface isOpen={true} reset={reset} />);

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("does not clear while the surface stays closed", () => {
    const reset = vi.fn();

    render(<Surface isOpen={false} reset={reset} />);

    expect(reset).not.toHaveBeenCalled();
  });

  it("clears when a closed surface is opened", () => {
    const reset = vi.fn();
    const { rerender } = render(<Surface isOpen={false} reset={reset} />);

    rerender(<Surface isOpen={true} reset={reset} />);

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("clears again on close, leaving nothing behind for the next surface", () => {
    const reset = vi.fn();
    const { rerender } = render(<Surface isOpen={true} reset={reset} />);
    reset.mockClear();

    rerender(<Surface isOpen={false} reset={reset} />);

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("clears on unmount", () => {
    const reset = vi.fn();
    const { unmount } = render(<Surface isOpen={true} reset={reset} />);
    reset.mockClear();

    unmount();

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("clears once per open, not on every render", () => {
    const reset = vi.fn();
    const { rerender } = render(<Surface isOpen={true} reset={reset} />);

    rerender(<Surface isOpen={true} reset={reset} />);
    rerender(<Surface isOpen={true} reset={reset} />);

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("clears once per open even when given a new callback each render", () => {
    // Callers pass an inline arrow, so a fresh function identity every render
    // must not be mistaken for the surface being reopened.
    const reset = vi.fn();
    const { rerender } = render(<Surface isOpen={true} reset={() => reset()} />);

    rerender(<Surface isOpen={true} reset={() => reset()} />);

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("clears on each reopen", () => {
    const reset = vi.fn();
    const { rerender } = render(<Surface isOpen={true} reset={reset} />);
    reset.mockClear();

    rerender(<Surface isOpen={false} reset={reset} />);
    reset.mockClear();
    rerender(<Surface isOpen={true} reset={reset} />);

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("uses the newest callback when clearing on close", () => {
    const stale = vi.fn();
    const fresh = vi.fn();
    const { rerender } = render(<Surface isOpen={true} reset={stale} />);

    rerender(<Surface isOpen={true} reset={fresh} />);
    rerender(<Surface isOpen={false} reset={fresh} />);

    expect(fresh).toHaveBeenCalled();
    expect(stale).toHaveBeenCalledTimes(1); // only the initial open
  });
});
