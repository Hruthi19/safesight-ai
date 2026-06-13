import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function SeverityChart({ data = [] }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 360;
    const height = 220;
    const margin = { top: 20, right: 20, bottom: 40, left: 20 };

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
        .text("No severity data");
      return;
    }

    const colors = { high: "#dc2626", medium: "#f59e0b", low: "#2563eb" };

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.severity))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count) || 1])
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("font-size", "11px");

    svg
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d) => x(d.severity))
      .attr("y", (d) => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - margin.bottom - y(d.count))
      .attr("fill", (d) => colors[d.severity] || "#64748b")
      .attr("rx", 4);

    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", 14)
      .attr("font-size", "12px")
      .attr("fill", "#64748b")
      .text("Incidents by severity");
  }, [data]);

  return <svg ref={svgRef} className="chart-svg" />;
}
