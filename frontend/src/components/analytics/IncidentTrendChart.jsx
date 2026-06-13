import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function IncidentTrendChart({ data = [] }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 560;
    const height = 280;
    const margin = { top: 20, right: 20, bottom: 40, left: 45 };

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", height);

    if (data.length === 0) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#94a3b8")
        .text("No incident data yet");
      return;
    }

    const parsed = data.map((d) => ({
      date: new Date(d.date),
      count: d.count,
    }));

    const x = d3
      .scaleTime()
      .domain(d3.extent(parsed, (d) => d.date))
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(parsed, (d) => d.count) || 1])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const line = d3
      .line()
      .x((d) => x(d.date))
      .y((d) => y(d.count))
      .curve(d3.curveMonotoneX);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%b %d")))
      .selectAll("text")
      .attr("font-size", "11px");

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .attr("font-size", "11px");

    svg
      .append("path")
      .datum(parsed)
      .attr("fill", "none")
      .attr("stroke", "#2563eb")
      .attr("stroke-width", 2.5)
      .attr("d", line);

    svg
      .selectAll("circle")
      .data(parsed)
      .join("circle")
      .attr("cx", (d) => x(d.date))
      .attr("cy", (d) => y(d.count))
      .attr("r", 4)
      .attr("fill", "#2563eb");

    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", 14)
      .attr("font-size", "12px")
      .attr("fill", "#64748b")
      .text("Incidents over time");
  }, [data]);

  return <svg ref={svgRef} className="chart-svg" />;
}
