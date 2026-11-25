import { describe, expect, it } from "vitest";
import { isDownwardSwipe, normalizeLauncherHomeLayout, placeWidgetWithoutOverlap, removeWidgetPlacement } from "../src/lib/launcher-layout";

describe("launcher home layout validation", () => {
  it("keeps valid icon and widget positions", () => {
    expect(normalizeLauncherHomeLayout({
      icons: { about: { panel: 3, slot: 7 } },
      widgets: { clock: { panel: 2, row: 4, column: 2 } }
    })).toEqual({
      icons: { about: { panel: 3, slot: 7 } },
      widgets: { clock: { panel: 2, row: 4, column: 2 } }
    });
  });

  it("drops unknown ids, malformed positions and out-of-range values", () => {
    expect(normalizeLauncherHomeLayout({
      icons: { "bad id": { panel: 0, slot: 0 }, hidden: { panel: 9, slot: 0 }, malformedHidden: { panel: -1, slot: 2 } },
      widgets: { clock: { panel: 0, row: 99, column: 0 }, badWideColumn: { panel: 0, row: 0, column: 1 }, unknown: { panel: 0, row: 0, column: 0 } }
    })).toEqual({ icons: {}, widgets: {} });
  });

  it("moves a colliding widget down while preserving other positions", () => {
    const next = placeWidgetWithoutOverlap("gallery", 0, 1, 0, {
      search: { panel: 0, row: 1, column: 0 },
      clock: { panel: 1, row: 1, column: 0 }
    });
    expect(next.search).toEqual({ panel: 0, row: 1, column: 0 });
    expect(next.clock).toEqual({ panel: 1, row: 1, column: 0 });
    expect(next.gallery).toEqual({ panel: 0, row: 2, column: 0 });
  });

  it("moves a widget onto a different home-screen page", () => {
    const next = placeWidgetWithoutOverlap("clock", 2, 3, 2, {
      search: { panel: 0, row: 0, column: 0 },
      gallery: { panel: 1, row: 2, column: 0 }
    });
    expect(next.clock).toEqual({ panel: 2, row: 3, column: 2 });
    expect(next.search.panel).toBe(0);
    expect(next.gallery.panel).toBe(1);
  });

  it("clamps a wide widget to the leftmost grid column", () => {
    const next = placeWidgetWithoutOverlap("search", 4, 3, 3, {});
    expect(next.search).toEqual({ panel: 4, row: 3, column: 0 });
  });
});

describe("launcher gestures and widget removal", () => {
  it("removes a selected widget without disturbing other placements", () => {
    const current = {
      search: { panel: 0, row: 0, column: 0 },
      clock: { panel: 0, row: 1, column: 0 },
      gallery: { panel: 2, row: 3, column: 0 }
    };
    expect(removeWidgetPlacement("gallery", current)).toEqual({
      search: current.search,
      clock: current.clock
    });
    expect(current.gallery).toEqual({ panel: 2, row: 3, column: 0 });
  });

  it("recognizes downward swipes and rejects horizontal or short gestures", () => {
    expect(isDownwardSwipe(100, 100, 110, 190)).toBe(true);
    expect(isDownwardSwipe(100, 100, 190, 110)).toBe(false);
    expect(isDownwardSwipe(100, 100, 110, 150)).toBe(false);
  });
});
