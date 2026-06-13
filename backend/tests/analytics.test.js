const { buildHeatmapGrid, parseBbox } = require("../src/services/analyticsService");

describe("Analytics Service", () => {
  it("should parse bbox JSON", () => {
    const point = parseBbox("[10, 20, 30, 40]");
    expect(point).toEqual({ cx: 20, cy: 30 });
  });

  it("should build heatmap grid from points", () => {
    const points = [
      { cx: 100, cy: 100 },
      { cx: 100, cy: 100 },
      { cx: 900, cy: 900 },
    ];
    const { grid, max } = buildHeatmapGrid(points, 5);
    expect(max).toBeGreaterThan(0);
    expect(grid.length).toBe(5);
  });
});
