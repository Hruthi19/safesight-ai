const pool = require("../db/pool");

function parseBbox(bboxStr) {
  if (!bboxStr) return null;
  try {
    const arr = JSON.parse(bboxStr);
    if (Array.isArray(arr) && arr.length >= 4) {
      return {
        cx: (Number(arr[0]) + Number(arr[2])) / 2,
        cy: (Number(arr[1]) + Number(arr[3])) / 2,
      };
    }
  } catch {
    return null;
  }
  return null;
}

function buildHeatmapGrid(points, gridSize = 10) {
  const grid = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(0)
  );

  if (points.length === 0) {
    return { grid, gridSize, max: 0 };
  }

  let maxX = 1;
  let maxY = 1;
  for (const p of points) {
    maxX = Math.max(maxX, p.cx);
    maxY = Math.max(maxY, p.cy);
  }

  for (const p of points) {
    const col = Math.min(gridSize - 1, Math.floor((p.cx / maxX) * gridSize));
    const row = Math.min(gridSize - 1, Math.floor((p.cy / maxY) * gridSize));
    grid[row][col]++;
  }

  const max = Math.max(...grid.flat(), 1);
  return { grid, gridSize, max };
}

async function getAnalytics() {
  const [timeSeries, bySeverity, byType, byStatus, detections] =
    await Promise.all([
      pool.query(`
        SELECT DATE(created_at) AS date, COUNT(*)::int AS count
        FROM incidents
        WHERE created_at IS NOT NULL
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `),
      pool.query(`
        SELECT severity, COUNT(*)::int AS count
        FROM incidents
        GROUP BY severity
        ORDER BY count DESC
      `),
      pool.query(`
        SELECT incident_type, COUNT(*)::int AS count
        FROM incidents
        GROUP BY incident_type
        ORDER BY count DESC
      `),
      pool.query(`
        SELECT status, COUNT(*)::int AS count
        FROM incidents
        GROUP BY status
        ORDER BY count DESC
      `),
      pool.query(`
        SELECT bbox FROM detections WHERE bbox IS NOT NULL
        UNION ALL
        SELECT bbox FROM incidents WHERE bbox IS NOT NULL
      `),
    ]);

  const points = detections.rows
    .map((row) => parseBbox(row.bbox))
    .filter(Boolean);

  return {
    timeSeries: timeSeries.rows.map((r) => ({
      date: r.date,
      count: r.count,
    })),
    bySeverity: bySeverity.rows,
    byType: byType.rows,
    byStatus: byStatus.rows,
    heatmap: buildHeatmapGrid(points),
    summary: {
      totalIncidents: timeSeries.rows.reduce((s, r) => s + r.count, 0),
      detectionPoints: points.length,
    },
  };
}

module.exports = { getAnalytics, buildHeatmapGrid, parseBbox };
