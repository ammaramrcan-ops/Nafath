import { useMemo } from "react";
import { motion } from "framer-motion";

export function MindMap({ title, nodes }: { title: string; nodes: unknown[] }) {
  const radius = 220;

  // Safely extract string titles from nodes whether they are strings, objects, or MindMapData
  const stringNodes: string[] = useMemo(() => {
    if (!Array.isArray(nodes)) return [];
    return nodes
      .map((n: unknown) => {
        if (!n) return null;
        if (typeof n === "string") {
          try {
            const parsed = JSON.parse(n);
            if (parsed && typeof parsed === "object") {
              if (Array.isArray(parsed.nodes)) {
                return parsed.nodes
                  .map((item: unknown) =>
                    item && typeof item === "object"
                      ? (item as Record<string, unknown>).text || (item as Record<string, unknown>).title
                      : null,
                  )
                  .filter(Boolean);
              }
              return parsed.text || parsed.title || parsed.name || null;
            }
          } catch {}
          return n;
        }
        if (typeof n === "object") {
          const nObj = n as Record<string, unknown>;
          if (Array.isArray(nObj.nodes)) {
            return nObj.nodes
              .map((item: unknown) =>
                item && typeof item === "object"
                  ? (item as Record<string, unknown>).text || (item as Record<string, unknown>).title
                  : null,
              )
              .filter(Boolean);
          }
          return nObj.text || nObj.title || nObj.name || null;
        }
        return String(n);
      })
      .flat()
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }, [nodes]);

  const displayNodes =
    stringNodes.length > 0
      ? stringNodes
      : ["المفهوم الرئيسي", "الفكرة الأساسية", "العناصر الفرعية"];

  return (
    <div className="relative mx-auto flex h-[520px] w-full max-w-[85vw] items-center justify-center bg-white rounded-[2.5rem] p-8 shadow-[0_20px_60px_-15px_rgba(11,28,48,0.08)] border border-slate-100">
      <svg className="absolute inset-0 h-full w-full" viewBox="-280 -270 560 540">
        {displayNodes.map((_, i) => {
          const angle = (i / displayNodes.length) * 2 * Math.PI - Math.PI / 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          return (
            <motion.line
              key={i}
              x1={0}
              y1={0}
              x2={x}
              y2={y}
              stroke="var(--zen-primary)"
              strokeOpacity={0.35}
              strokeWidth={2}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }}
            />
          );
        })}
      </svg>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative z-10 flex h-36 w-36 items-center justify-center rounded-full bg-zen-primary text-center text-sm sm:text-base font-black text-white shadow-xl p-4 leading-relaxed"
      >
        {String(title || "الموضوع")}
      </motion.div>

      {displayNodes.map((node, i) => {
        const angle = (i / displayNodes.length) * 2 * Math.PI - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
            animate={{ opacity: 1, scale: 1, x, y }}
            transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 150, damping: 18 }}
            className="absolute z-10 max-w-[160px] rounded-2xl bg-white px-5 py-3 text-center text-xs sm:text-sm font-black text-[#0b1c30] shadow-md border border-slate-200/80"
          >
            {String(node)}
          </motion.div>
        );
      })}
    </div>
  );
}
