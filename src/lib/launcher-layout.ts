export interface LauncherHomeLayout {
  icons: Record<string, { panel: number; slot: number }>;
  widgets: Record<string, { panel: number; row: number; column: number }>;
}

export const DEFAULT_WIDGET_PLACEMENTS = {
  search: { panel: 0, row: 0, column: 0 },
  clock: { panel: 0, row: 1, column: 0 },
  gallery: { panel: 0, row: 3, column: 0 }
} as const;

type WidgetId = keyof typeof DEFAULT_WIDGET_PLACEMENTS;
type WidgetPosition = { panel: number; row: number; column: number };

const WIDGET_DIMENSIONS: Record<WidgetId, { width: number; height: number }> = {
  search: { width: 4, height: 1 },
  clock: { width: 2, height: 2 },
  gallery: { width: 4, height: 2 }
};

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

export function normalizeLauncherHomeLayout(value: unknown): LauncherHomeLayout {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const iconSource = source.icons && typeof source.icons === "object" && !Array.isArray(source.icons) ? source.icons as Record<string, unknown> : {};
  const widgetSource = source.widgets && typeof source.widgets === "object" && !Array.isArray(source.widgets) ? source.widgets as Record<string, unknown> : {};
  const icons: LauncherHomeLayout["icons"] = {};
  for (const [id, raw] of Object.entries(iconSource).slice(0, 128)) {
    if (!/^[a-z0-9-]{1,64}$/i.test(id) || !raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const item = raw as Record<string, unknown>;
    if (isIntegerInRange(item.panel, -1, 4) && isIntegerInRange(item.slot, -1, 15)
        && ((item.panel === -1 && item.slot === -1) || (item.panel >= 0 && item.slot >= 0))) {
      icons[id] = { panel: item.panel, slot: item.slot };
    }
  }
  const widgets: LauncherHomeLayout["widgets"] = {};
  for (const id of Object.keys(DEFAULT_WIDGET_PLACEMENTS) as WidgetId[]) {
    const raw = widgetSource[id];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const item = raw as Record<string, unknown>;
    const maxColumn = id === "clock" ? 2 : 0;
    if (isIntegerInRange(item.panel, 0, 4) && isIntegerInRange(item.row, 0, 8) && isIntegerInRange(item.column, 0, maxColumn)) {
      widgets[id] = { panel: item.panel, row: item.row, column: item.column };
    }
  }
  return { icons, widgets };
}

export function placeWidgetWithoutOverlap(
  widgetId: WidgetId,
  panel: number,
  row: number,
  column: number,
  current: Record<string, WidgetPosition>
): Record<string, WidgetPosition> {
  const size = WIDGET_DIMENSIONS[widgetId];
  const next = { ...current };
  let candidate = {
    panel: Math.max(0, Math.min(4, panel)),
    row: Math.max(0, Math.min(8, row)),
    column: Math.max(0, Math.min(4 - size.width, column))
  };
  const overlaps = (a: WidgetPosition, b: WidgetPosition, otherId: WidgetId) => {
    if (a.panel !== b.panel) return false;
    const other = WIDGET_DIMENSIONS[otherId];
    return a.column < b.column + other.width && a.column + size.width > b.column
      && a.row < b.row + other.height && a.row + size.height > b.row;
  };
  for (let attempt = 0; attempt < 9; attempt++) {
    const conflict = (Object.entries(next) as [string, WidgetPosition][]).some(([id, position]) =>
      id !== widgetId && id in WIDGET_DIMENSIONS && overlaps(candidate, position, id as WidgetId));
    if (!conflict) break;
    candidate = { ...candidate, row: Math.min(8, candidate.row + 1) };
  }
  next[widgetId] = candidate;
  return next;
}
