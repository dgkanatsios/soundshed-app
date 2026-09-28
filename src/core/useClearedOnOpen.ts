import React from "react";

/**
 * Clears a search surface every time it is opened.
 *
 * Search results live in long-lived global stores, so they survive the panel or
 * modal being closed and reappear the next time it is opened. That stale list
 * looks like a fresh result set for whatever the user types next, so each surface
 * resets itself when it opens.
 *
 * `reset` is called on open and again on close, so nothing is left behind for the
 * next surface that reads the same store.
 *
 * @param isOpen whether the surface is currently open. Pass a constant `true` for
 *               a routed panel that unmounts when the user navigates away.
 */
export function useClearedOnOpen(isOpen: boolean, reset: () => void) {
    // Keep the latest reset without making it an effect dependency, so an inline
    // arrow function does not re-trigger the effect on every render.
    const resetRef = React.useRef(reset);
    resetRef.current = reset;

    React.useEffect(() => {
        if (!isOpen) return;

        resetRef.current();
        return () => resetRef.current();
    }, [isOpen]);
}
