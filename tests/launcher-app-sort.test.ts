import { describe, expect, it } from "vitest";
import { sortLauncherApps } from "../src/lib/launcher-app-sort";

describe("sortLauncherApps", () => {
  it("sorts by displayed label, ignoring registration order", () => {
    const apps = [
      { id: "z", name: "Zoom" },
      { id: "a", name: "about" },
      { id: "c", name: "Calendar" },
      { id: "b", name: "Browser" },
    ];
    expect(sortLauncherApps(apps).map(app => app.name)).toEqual(["about", "Browser", "Calendar", "Zoom"]);
  });

  it("sorts numeric labels naturally and uses the id as a stable tie-breaker", () => {
    const apps = [
      { id: "b", name: "App 10" },
      { id: "z", name: "App 2" },
      { id: "b", name: "Same" },
      { id: "a", name: "same" },
    ];
    expect(sortLauncherApps(apps).map(app => `${app.name}:${app.id}`)).toEqual([
      "App 2:z", "App 10:b", "same:a", "Same:b",
    ]);
  });

  it("does not mutate the source app list", () => {
    const apps = [{ id: "b", name: "Beta" }, { id: "a", name: "Alpha" }];
    const original = [...apps];
    sortLauncherApps(apps);
    expect(apps).toEqual(original);
  });
});
