import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { UserProfile } from './userService';
import { RefreshCw } from 'lucide-react';

interface KnowledgeGraphProps {
  profile: UserProfile;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ profile }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    let width = svgRef.current.clientWidth;
    const height = 400;

    const render = () => {
      if (!svgRef.current) return;
      width = svgRef.current.clientWidth;

      // Clear previous graph
      d3.select(svgRef.current).selectAll("*").remove();

      const svg = d3.select(svgRef.current)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto;");

      const container = svg.append("g");

      const zoom = d3.zoom()
        .scaleExtent([0.1, 8])
        .on("zoom", (event) => {
          container.attr("transform", event.transform);
        });

      svg.call(zoom as any);

      // Prepare data
      const nodes: any[] = [{ id: "Me", group: 0, radius: 20, color: "#10b981" }];
      const links: any[] = [];

      // Add skills
      profile.skills.forEach((skill) => {
        nodes.push({ id: skill, group: 1, radius: 12, color: "#3b82f6", type: 'skill' });
        links.push({ source: "Me", target: skill });
      });

      // Add top memories as clusters
      profile.memories.slice(0, 15).forEach((memory, i) => {
        const memoryId = memory.content.slice(0, 20) + '...';
        nodes.push({ id: memoryId, group: 2, radius: 10, color: "#8b5cf6", type: 'memory', fullContent: memory.content });
        links.push({ source: "Me", target: memoryId });
      });

      // Add preferences
      Object.entries(profile.preferences).forEach(([key, value]) => {
        const prefId = `${key}: ${value}`;
        nodes.push({ id: prefId, group: 3, radius: 14, color: "#f59e0b", type: 'preference' });
        links.push({ source: "Me", target: prefId });
      });

      const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance(120))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius((d: any) => d.radius + 10));

      const link = container.append("g")
        .attr("stroke", "#27272a")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", 1.5);

      const node = container.append("g")
        .attr("stroke", "#09090b")
        .attr("stroke-width", 1.5)
        .selectAll("g")
        .data(nodes)
        .join("g")
        .call(d3.drag<any, any>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

      node.append("circle")
        .attr("r", (d: any) => d.radius)
        .attr("fill", (d: any) => d.color)
        .attr("class", "transition-all duration-300 hover:brightness-125 cursor-pointer shadow-lg")
        .on("mouseover", function(event, d: any) {
          d3.select(this).attr("stroke", "#fff").attr("stroke-width", 2);
          if (d.fullContent) {
            svg.append("text")
              .attr("id", "tooltip")
              .attr("x", 10)
              .attr("y", height - 20)
              .text(d.fullContent.slice(0, 100) + (d.fullContent.length > 100 ? '...' : ''))
              .attr("fill", "#fff")
              .attr("font-size", "12px")
              .attr("class", "pointer-events-none bg-black/50 p-1 rounded");
          }
        })
        .on("mouseout", function() {
          d3.select(this).attr("stroke", "#09090b").attr("stroke-width", 1.5);
          svg.select("#tooltip").remove();
        });

      node.append("text")
        .attr("dx", (d: any) => d.radius + 5)
        .attr("dy", ".35em")
        .text((d: any) => d.id)
        .attr("fill", "#a1a1aa")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .attr("class", "pointer-events-none select-none");

      simulation.on("tick", () => {
        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);

        node
          .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      });

      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return simulation;
    };

    let currentSimulation = render();

    const resizeObserver = new ResizeObserver(() => {
      if (currentSimulation) currentSimulation.stop();
      currentSimulation = render();
    });

    resizeObserver.observe(svgRef.current);

    return () => {
      if (currentSimulation) currentSimulation.stop();
      resizeObserver.disconnect();
    };
  }, [profile]);

  return (
    <div className="w-full glass-panel rounded-[32px] border-white/5 overflow-hidden bg-zinc-950/50">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          خريطة المعرفة التفاعلية
          <button 
            onClick={() => {
              if (svgRef.current) {
                d3.select(svgRef.current).selectAll("*").remove();
                // This will trigger the useEffect again because we're not changing profile, 
                // but we can force a re-render by adding a dummy state if needed.
                // For now, let's just use a simple trick.
                window.dispatchEvent(new Event('resize'));
              }
            }}
            className="p-1 hover:bg-white/5 rounded-md text-zinc-600 hover:text-emerald-500 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </h4>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[9px] text-zinc-500 font-bold uppercase">أنا</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[9px] text-zinc-500 font-bold uppercase">مهارات</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-[9px] text-zinc-500 font-bold uppercase">ذكريات</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[9px] text-zinc-500 font-bold uppercase">تفضيلات</span>
          </div>
        </div>
      </div>
      <svg ref={svgRef} className="w-full h-[300px] md:h-[400px]" />
    </div>
  );
};
