import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function HazardHeatmap({ heatmap }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !heatmap) return;

    const { grid, gridSize, max } = heatmap;
    const width = 360;
    const height = 360;
    const cellSize = Math.min(
      (width - 40) / gridSize,
      (height - 40) / gridSize
    );

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", height);

    const color = d3
      .scaleSequential(d3.interpolateYlOrRd)
      .domain([0, max || 1]);

    const g = svg
      .append("g")
      .attr("transform", `translate(20, 20)`);

    if (max === 0) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#94a3b8")
        .text("No detection positions yet");
      return;
    }

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const value = grid[row][col];
        g.append("rect")
          .attr("x", col * cellSize)
          .attr("y", row * cellSize)
          .attr("width", cellSize - 2)
          .attr("height", cellSize - 2)
          .attr("rx", 3)
          .attr("fill", value > 0 ? color(value) : "#f1f5f9")
          .append("title")
          .text(`Zone (${col},${row}): ${value} detection(s)`);
      }
    }

    svg
      .append("text")
      .attr("x", 20)
      .attr("y", 14)
      .attr("font-size", "12px")
      .attr("fill", "#64748b")
      .text("Hazard heatmap (detection density)");
  }, [heatmap]);

  return <svg ref={svgRef} className="chart-svg" />;
}
