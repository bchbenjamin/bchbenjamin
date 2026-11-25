/** Sort the launcher all-apps model by the user-visible app label (AOSP Launcher2 behaviour). */
const appNameCollator = new Intl.Collator("en", {
  usage: "sort",
  sensitivity: "base",
  numeric: true,
});

export function sortLauncherApps<T extends { id: string; name: string }>(apps: readonly T[]): T[] {
  return [...apps].sort(
    (a, b) => appNameCollator.compare(a.name, b.name) || a.id.localeCompare(b.id),
  );
}
