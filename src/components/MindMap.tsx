import { motion } from "framer-motion";

export function MindMap({ title, nodes }: { title: string; nodes: string[] }) {
  const radius = 160;
  return (
    <div className="relative mx-auto flex h-[420px] w-full max-w-md items-center justify-center">
      {/* Lines */}
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
              stroke="var(--brand)"
              strokeOpacity={0.3}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }}
            />
          );
        })}
      </svg>

      {/* Center */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full bg-brand text-center text-sm font-bold text-brand-foreground shadow-[var(--shadow-soft)]"
      >
        {title}
      </motion.div>

      {/* Nodes */}
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
            className="absolute z-10 max-w-[120px] rounded-full border-2 border-brand/30 bg-brand-soft px-3 py-2 text-center text-xs font-semibold text-foreground"
          >
            {node}
          </motion.div>
        );
      })}
    </div>
  );
}
