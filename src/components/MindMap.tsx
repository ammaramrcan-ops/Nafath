import { motion } from "framer-motion";

export function MindMap({ title, nodes }: { title: string; nodes: string[] }) {
  const radius = 160;
  return (
    <div className="relative mx-auto flex h-[420px] w-full max-w-md items-center justify-center">
      <svg className="absolute inset-0 h-full w-full" viewBox="-200 -210 400 420">
        {nodes.map((_, i) => {
          const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
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
              strokeOpacity={0.25}
              strokeWidth={1}
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
        className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full bg-zen-primary text-center text-[13px] font-medium text-white shadow-[var(--shadow-fab)]"
      >
        {title}
      </motion.div>

      {nodes.map((node, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return (
          <motion.div
            key={node}
            initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
            animate={{ opacity: 1, scale: 1, x, y }}
            transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 150, damping: 18 }}
            className="absolute z-10 max-w-[120px] rounded-full bg-white px-4 py-2 text-center text-[12px] font-medium text-zen-on-surface shadow-[var(--shadow-soft)]"
          >
            {node}
          </motion.div>
        );
      })}
    </div>
  );
}
