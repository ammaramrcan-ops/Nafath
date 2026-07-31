import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  X,
  Palette,
  Shapes,
  Sparkles,
  Sliders,
  Move,
  GitMerge,
  Scaling,
} from "lucide-react";
import {
  SHAPE_LABELS,
  LINE_COLORS,
  LINE_THICKNESSES,
  type MindMapData,
  type MindMapNode,
  type NodeShape,
  type LineStyle,
} from "@/lib/mind-map-types";
import { toast } from "sonner";
import { generateSecureId, secureRandomFloat } from "@/lib/utils";

function calculateConnectionPath(
  parent: MindMapNode,
  child: MindMapNode,
  visibleNodes: MindMapNode[],
): {
  pathD: string;
  lineColor: string;
  lineThickness: number;
  isDashed: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
} {
  const pW = parent.width || 200;
  const pH = parent.height || 70;
  const cW = child.width || 200;
  const cH = child.height || 70;

  const parentCenterX = parent.x + pW / 2;
  const parentCenterY = parent.y + pH / 2;
  const childCenterX = child.x + cW / 2;
  const childCenterY = child.y + cH / 2;

  const deltaX = childCenterX - parentCenterX;
  const deltaY = childCenterY - parentCenterY;

  let startX: number;
  let startY: number;
  let endX: number;
  let endY: number;
  let pathD: string;

  const siblings = visibleNodes.filter(
    (n) => n.parentId === parent.id || (n.parentIds && n.parentIds.includes(parent.id)),
  );
  const siblingIdx = siblings.findIndex((s) => s.id === child.id);
  const siblingCount = Math.max(1, siblings.length);
  const yPortion = siblingCount > 1 ? (siblingIdx + 0.5) / siblingCount : 0.5;
  const distributedStartY = parent.y + pH * 0.15 + pH * 0.7 * yPortion + 2000;

  if (Math.abs(deltaY) > Math.abs(deltaX) * 0.8) {
    if (deltaY > 0) {
      startX = parentCenterX + 2000;
      startY = parent.y + pH + 2000;
      endX = childCenterX + 2000;
      endY = child.y + 2000;
      const dy = Math.abs(endY - startY) * 0.5;
      pathD = `M ${startX} ${startY} C ${startX} ${startY + dy}, ${endX} ${endY - dy}, ${endX} ${endY}`;
    } else {
      startX = parentCenterX + 2000;
      startY = parent.y + 2000;
      endX = childCenterX + 2000;
      endY = child.y + cH + 2000;
      const dy = Math.abs(endY - startY) * 0.5;
      pathD = `M ${startX} ${startY} C ${startX} ${startY - dy}, ${endX} ${endY + dy}, ${endX} ${endY}`;
    }
  } else {
    if (deltaX < 0) {
      startX = parent.x + 2000;
      startY = distributedStartY;
      endX = child.x + cW + 2000;
      endY = childCenterY + 2000;
      const dx = Math.abs(endX - startX) * 0.5;
      pathD = `M ${startX} ${startY} C ${startX - dx} ${startY}, ${endX + dx} ${endY}, ${endX} ${endY}`;
    } else {
      startX = parent.x + pW + 2000;
      startY = distributedStartY;
      endX = child.x + 2000;
      endY = childCenterY + 2000;
      const dx = Math.abs(endX - startX) * 0.5;
      pathD = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
    }
  }

  return {
    pathD,
    lineColor: parent.lineColor || "#F59E0B",
    lineThickness: parent.lineThickness || 4,
    isDashed: parent.lineStyle === "dashed",
    startX,
    startY,
    endX,
    endY,
  };
}

export function MindMapCanvas({
  mapData,
  onUpdateMap,
  readOnly = false,
  hideSideControls = false,
}: {
  mapData: MindMapData;
  onUpdateMap?: (newMap: MindMapData) => void;
  readOnly?: boolean;
  hideSideControls?: boolean;
}) {
  const [nodes, setNodes] = useState<MindMapNode[]>(mapData.nodes || []);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Canvas Viewport Pan & Zoom State
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Ctrl + Mouse Wheel Zoom Listener
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.12 : -0.12;
        setScale((prev) => Math.min(2.5, Math.max(0.3, prev + delta)));
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  // Canvas Drag vs Node Drag State
  const [isCanvasDragging, setIsCanvasDragging] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const nodeDragOffsetRef = useRef({ x: 0, y: 0 });

  // Link Mode State
  const [linkingParentId, setLinkingParentId] = useState<string | null>(null);

  // Text Editing State
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    setNodes(mapData.nodes || []);
  }, [mapData]);

  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  const updateNodesAndSave = (newNodes: MindMapNode[]) => {
    setNodes(newNodes);
    onUpdateMap?.({ ...mapData, nodes: newNodes });
  };

  const handleResetCanvas = () => {
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
    toast.success("تم إعادة ضبط الشاشة وتوسيط الخريطة! 🎯");
  };

  const handleZoom = (delta: number) => {
    setScale((prev) => Math.min(2.2, Math.max(0.3, prev + delta)));
  };

  // Node Drag Handlers
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setDraggingNodeId(nodeId);

    const targetNode = nodes.find((n) => n.id === nodeId);
    if (targetNode) {
      nodeDragOffsetRef.current = {
        x: e.clientX / scale - targetNode.x,
        y: e.clientY / scale - targetNode.y,
      };
    }
  };

  // Canvas Drag Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".mind-node")) return;
    setIsCanvasDragging(true);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId) {
      const newX = e.clientX / scale - nodeDragOffsetRef.current.x;
      const newY = e.clientY / scale - nodeDragOffsetRef.current.y;

      const updated = nodes.map((n) =>
        n.id === draggingNodeId ? { ...n, x: Math.round(newX), y: Math.round(newY) } : n,
      );
      updateNodesAndSave(updated);
    } else if (isCanvasDragging) {
      setPanOffset({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsCanvasDragging(false);
    setDraggingNodeId(null);
  };

  // Toggle Collapse/Expand connected children by clicking handle
  const handleToggleHandleCollapse = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const updated = nodes.map((n) => (n.id === nodeId ? { ...n, isCollapsed: !n.isCollapsed } : n));
    updateNodesAndSave(updated);
    const target = nodes.find((n) => n.id === nodeId);
    if (target?.isCollapsed) {
      toast.success("تم إظهار العقد والأسهم المرتبطة! 👁️");
    } else {
      toast.success("تم طي وإخفاء العقد والأسهم المرتبطة لتنظيف الرؤية! 🙈");
    }
  };

  // Calculate visible nodes filtering out collapsed branches
  const visibleNodes = useMemo(() => {
    const hiddenSet = new Set<string>();

    const collectHidden = (parentId: string) => {
      const children = nodes.filter(
        (n) => n.parentId === parentId || (n.parentIds && n.parentIds.includes(parentId)),
      );
      children.forEach((c) => {
        hiddenSet.add(c.id);
        collectHidden(c.id);
      });
    };

    nodes.forEach((n) => {
      if (n.isCollapsed) {
        collectHidden(n.id);
      }
    });

    return nodes.filter((n) => !hiddenSet.has(n.id));
  }, [nodes]);

  // Node Editing Functions
  const handleAddChildNode = (parentId: string) => {
    const parent = nodes.find((n) => n.id === parentId);
    const parentX = parent ? parent.x : 400;
    const parentY = parent ? parent.y : 300;

    const newChild: MindMapNode = {
      id: generateSecureId("node"),
      text: "عقدة فرعية جديدة 📌",
      shape: "rounded-square",
      x: parentX - 250,
      y: parentY + (secureRandomFloat() * 90 - 45),
      width: 200,
      height: 65,
      backgroundColor: "#E0E7FF",
      textColor: "#1E1B4B",
      borderColor: "#6366F1",
      lineColor: parent?.lineColor || "#6366F1",
      lineThickness: parent?.lineThickness || 4,
      lineStyle: parent?.lineStyle || "solid",
      parentId: parentId,
      isCollapsed: false,
    };

    const updated = [...nodes, newChild];
    updateNodesAndSave(updated);
    setSelectedNodeId(newChild.id);
    toast.success("تم إنشاء العقدة والسهم المرتبط بنجاح! ➕");
  };

  // CONNECT NODES (MULTI-PARENT SAFE: Keeps existing parent arrows intact!)
  const handleConnectNodes = (targetChildId: string) => {
    if (!linkingParentId || linkingParentId === targetChildId) return;

    const targetNode = nodes.find((n) => n.id === targetChildId);
    if (!targetNode) return;

    // Check if link already exists
    const existingParents = new Set<string>();
    if (targetNode.parentId) existingParents.add(targetNode.parentId);
    if (targetNode.parentIds) targetNode.parentIds.forEach((id) => existingParents.add(id));

    if (existingParents.has(linkingParentId)) {
      toast.error("هذان العقدتان مرتبطان بالسهم بالفعل!");
      setLinkingParentId(null);
      return;
    }

    // Add new parent arrow to parentIds array WITHOUT deleting parentId!
    const newParentIds = Array.from(new Set([...Array.from(existingParents), linkingParentId]));

    const updated = nodes.map((n) =>
      n.id === targetChildId
        ? {
            ...n,
            parentIds: newParentIds,
          }
        : n,
    );

    updateNodesAndSave(updated);
    setLinkingParentId(null);
    toast.success("تم إضافة السهم الإضافي بنجاح مع الحفاظ على السهم الأصلي 100%! 🔀🔗");
  };

  const handleDeleteNode = (nodeId: string) => {
    if (nodes.length <= 1) {
      toast.error("لا يمكنك حذف آخر عقدة بالخريطة!");
      return;
    }
    const updated = nodes.filter(
      (n) =>
        n.id !== nodeId && n.parentId !== nodeId && (!n.parentIds || !n.parentIds.includes(nodeId)),
    );
    updateNodesAndSave(updated);
    setSelectedNodeId(null);
    toast.success("تم حذف العقدة والأسهم المترتبة عليها. 🗑️");
  };

  const handleSaveTextEdit = (nodeId: string) => {
    if (!editingText.trim()) return;
    const updated = nodes.map((n) => (n.id === nodeId ? { ...n, text: editingText.trim() } : n));
    updateNodesAndSave(updated);
    setEditingNodeId(null);
    toast.success("تم حفظ النص! ✏️");
  };

  // Connections List (Includes single parent & multi-parent Summary Node connections!)
  const allConnections = useMemo(() => {
    const list: { parentId: string; childId: string }[] = [];

    visibleNodes.forEach((node) => {
      if (node.parentId && visibleNodes.some((n) => n.id === node.parentId)) {
        list.push({ parentId: node.parentId, childId: node.id });
      }
      if (node.parentIds && node.parentIds.length > 0) {
        node.parentIds.forEach((pid) => {
          if (visibleNodes.some((n) => n.id === pid)) {
            list.push({ parentId: pid, childId: node.id });
          }
        });
      }
    });

    return list;
  }, [visibleNodes]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-screen bg-[#0b1329] overflow-hidden dir-rtl text-right select-none"
      dir="rtl"
    >
      {/* Top Floating Control Bar */}
      {/* Floating Canvas Zoom & Pan Controls (Bottom Left Stitch UI) */}
      <div className="fixed bottom-8 left-8 z-40 flex flex-col gap-2 bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-[#e0c0b1]/50 shadow-2xl">
        <button
          type="button"
          onClick={() => handleZoom(0.15)}
          className="w-10 h-10 rounded-xl bg-[#eff4ff] hover:bg-[#dce9ff] text-[#9d4300] flex items-center justify-center transition cursor-pointer shadow-xs"
          title="تكبير (+)"
        >
          <ZoomIn className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => handleZoom(-0.15)}
          className="w-10 h-10 rounded-xl bg-[#eff4ff] hover:bg-[#dce9ff] text-[#9d4300] flex items-center justify-center transition cursor-pointer shadow-xs"
          title="تصغير (-)"
        >
          <ZoomOut className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={handleResetCanvas}
          className="w-10 h-10 rounded-xl bg-[#9d4300] text-white flex items-center justify-center hover:bg-[#833800] transition cursor-pointer shadow-xs"
          title="إعادة ضبط الشاشة (100%)"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <span className="text-[10px] text-center font-mono font-bold text-[#584237] mt-0.5">
          {Math.round(scale * 100)}%
        </span>
      </div>

      {/* Main Interactive Canvas Surface */}
      <div
        className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden relative bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:24px_24px]"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div
          className="absolute inset-0 origin-center"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
          }}
        >
          {/* SVG Overlay Layer */}
          <svg
            style={{
              position: "absolute",
              top: -2000,
              left: -2000,
              width: 8000,
              height: 8000,
              overflow: "visible",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            <defs>
              <marker
                id="default-arrowhead"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="8"
                markerHeight="8"
                orient="auto"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#F59E0B" />
              </marker>

              {LINE_COLORS.map((c, i) => (
                <marker
                  key={i}
                  id={`arrow-${c.color.replace("#", "")}`}
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="8"
                  markerHeight="8"
                  orient="auto"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill={c.color} />
                </marker>
              ))}
            </defs>

            {/* Render Curves for all Single & Multi-Parent Connections */}
            {allConnections.map(({ parentId, childId }, idx) => {
              const parent = visibleNodes.find((n) => n.id === parentId);
              const child = visibleNodes.find((n) => n.id === childId);
              if (!parent || !child) return null;

              const { pathD, lineColor, lineThickness, isDashed, startX, startY, endX, endY } =
                calculateConnectionPath(parent, child, visibleNodes);

              return (
                <g key={`conn_${parentId}_${childId}_${idx}`}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={lineThickness + 3}
                    strokeOpacity={0.25}
                  />

                  <path
                    d={pathD}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={lineThickness}
                    strokeDasharray={isDashed ? "8 6" : undefined}
                    markerEnd={`url(#arrow-${lineColor.replace("#", "")})`}
                  />

                  <circle
                    cx={startX}
                    cy={startY}
                    r={5}
                    fill="#FFFFFF"
                    stroke={lineColor}
                    strokeWidth={2}
                  />
                  <circle
                    cx={endX}
                    cy={endY}
                    r={5}
                    fill={lineColor}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                </g>
              );
            })}
          </svg>

          {/* Render All Visible Mind Map Nodes */}
          {visibleNodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isEditing = editingNodeId === node.id;
            const isLinking = linkingParentId === node.id;
            const isCollapsed = Boolean(node.isCollapsed);

            const childCount = nodes.filter(
              (n) => n.parentId === node.id || (n.parentIds && n.parentIds.includes(node.id)),
            ).length;

            const textLen = node.text?.length || 10;
            const autoWidth = Math.max(160, Math.min(360, textLen * 9 + 45));
            const autoHeight = Math.max(55, Math.min(130, Math.ceil(textLen / 22) * 26 + 32));

            const width = node.width || autoWidth;
            const height = node.height || autoHeight;

            const shapeStyle =
              node.shape === "circle"
                ? "rounded-full"
                : node.shape === "pill"
                  ? "rounded-full px-6"
                  : node.shape === "hexagon"
                    ? "rounded-3xl border-dashed"
                    : node.shape === "rectangle"
                      ? "rounded-xl"
                      : "rounded-2xl"; // rounded-square

            return (
              <div
                key={node.id}
                onMouseDown={(e) => {
                  if (linkingParentId) {
                    handleConnectNodes(node.id);
                  } else {
                    handleNodeMouseDown(e, node.id);
                  }
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingNodeId(node.id);
                  setEditingText(node.text);
                }}
                className={`mind-node absolute transition-all duration-75 cursor-grab active:cursor-grabbing border-2 font-bold text-sm flex items-center justify-center p-4 text-center shadow-xl select-none group z-10 ${shapeStyle} ${
                  isSelected
                    ? "ring-4 ring-amber-400 ring-offset-4 ring-offset-slate-900 scale-105"
                    : "hover:scale-102"
                } ${isLinking ? "ring-4 ring-emerald-400 animate-pulse" : ""} ${
                  node.isSummaryNode ? "border-amber-400 ring-2 ring-rose-500" : ""
                }`}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                  backgroundColor: node.backgroundColor,
                  color: node.textColor,
                  borderColor: node.borderColor,
                }}
              >
                {/* Connection Handle Dots on Edges */}
                <button
                  type="button"
                  onClick={(e) => handleToggleHandleCollapse(e, node.id)}
                  className={`absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-amber-500 shadow-md flex items-center justify-center text-[9px] font-black hover:scale-125 transition cursor-pointer z-20 ${
                    isCollapsed
                      ? "bg-amber-400 text-amber-950 ring-2 ring-amber-300"
                      : "text-amber-700"
                  }`}
                  title={isCollapsed ? "إظهار الفروع المرتبطة" : "طي وإخفاء الفروع المرتبطة"}
                >
                  {isCollapsed ? "+" : childCount > 0 ? childCount : ""}
                </button>

                <button
                  type="button"
                  onClick={(e) => handleToggleHandleCollapse(e, node.id)}
                  className={`absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-amber-500 shadow-md flex items-center justify-center text-[9px] font-black hover:scale-125 transition cursor-pointer z-20 ${
                    isCollapsed
                      ? "bg-amber-400 text-amber-950 ring-2 ring-amber-300"
                      : "text-amber-700"
                  }`}
                  title={isCollapsed ? "إظهار الفروع المرتبطة" : "طي وإخفاء الفروع المرتبطة"}
                >
                  {isCollapsed ? "+" : childCount > 0 ? childCount : ""}
                </button>

                {/* Summary Badge */}
                {node.isSummaryNode && (
                  <span className="absolute -top-3 right-4 bg-rose-600 text-white px-2 py-0.5 rounded-full text-[9px] font-black shadow-xs flex items-center gap-1">
                    <GitMerge className="h-2.5 w-2.5" />
                    <span>عقدة ملخص</span>
                  </span>
                )}

                {/* Collapsed Count Badge */}
                {isCollapsed && childCount > 0 && (
                  <span className="absolute -bottom-2 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black shadow-md animate-bounce">
                    مخفي ({childCount} عقد) 🙈
                  </span>
                )}

                <Move className="absolute top-1.5 right-2 h-3 w-3 opacity-0 group-hover:opacity-40 text-slate-700 transition" />

                {isEditing ? (
                  <div
                    className="flex items-center gap-1 w-full z-20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveTextEdit(node.id)}
                      onBlur={() => handleSaveTextEdit(node.id)}
                      className="w-full bg-white px-2 py-1 rounded text-xs text-slate-900 border outline-none font-bold text-center"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveTextEdit(node.id)}
                      className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="leading-snug font-extrabold" title="انقر مرتين للتعديل المباشر">
                    {node.text}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Side Control Panel & Bottom Hint (Disabled in readOnly mode or when hideSideControls is true) */}
      {!readOnly && !hideSideControls && (
        <AnimatePresence>
          {selectedNode ? (
            <motion.aside
              drag
              dragMomentum={false}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="fixed right-6 top-24 w-80 max-h-[82vh] overflow-y-auto rounded-3xl bg-white/95 backdrop-blur-md border border-[#e0c0b1]/60 shadow-2xl flex flex-col p-6 gap-5 z-[99999] text-right font-body-md text-[#0b1c30]"
              dir="rtl"
            >
              {/* Draggable Header Handle */}
              <div className="flex items-center justify-between border-b border-[#e0c0b1]/30 pb-3 cursor-grab active:cursor-grabbing">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#ffdbca] flex items-center justify-center text-[#9d4300]">
                    <Move className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0b1c30] leading-tight flex items-center gap-1.5">
                      <span>تحكم العقدة</span>
                      <span className="text-[10px] font-normal text-[#584237]/60 bg-[#eff4ff] px-2 py-0.5 rounded-full">
                        عائمة 🖐️
                      </span>
                    </h3>
                    <p className="text-xs text-[#584237]/70 font-medium">
                      اسحب النافذة لأي مكان في الشاشة
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1.5 rounded-full text-[#584237]/60 hover:bg-black/5 transition cursor-pointer"
                  title="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Live Node Text Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#584237]">عنوان العقدة</label>
                <input
                  type="text"
                  value={selectedNode.text}
                  onChange={(e) => {
                    const updated = nodes.map((n) =>
                      n.id === selectedNode.id ? { ...n, text: e.target.value } : n,
                    );
                    updateNodesAndSave(updated);
                  }}
                  placeholder="أدخل عنوان العقدة هنا..."
                  className="w-full bg-[#eff4ff] border border-[#e0c0b1]/40 rounded-2xl px-4 py-2.5 text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#9d4300] transition"
                />
              </div>

              {/* Node Size Controls */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#584237] flex items-center gap-1">
                    <Scaling className="w-3.5 h-3.5 text-[#9d4300]" />
                    <span>حجم العقدة</span>
                  </label>
                  <span className="text-[10px] font-extrabold text-[#9d4300] bg-[#ffdbca] px-2 py-0.5 rounded-full">
                    {selectedNode.width || 200}x{selectedNode.height || 70}px
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 bg-[#eff4ff] p-1.5 rounded-2xl border border-[#e0c0b1]/30">
                  {[
                    { label: "صغير", w: 150, h: 55 },
                    { label: "متوسط", w: 200, h: 70 },
                    { label: "كبير", w: 260, h: 85 },
                    { label: "ضخم", w: 320, h: 105 },
                  ].map((sizeOpt, idx) => {
                    const isActive = (selectedNode.width || 200) === sizeOpt.w;
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => {
                          const updated = nodes.map((n) =>
                            n.id === selectedNode.id
                              ? { ...n, width: sizeOpt.w, height: sizeOpt.h }
                              : n,
                          );
                          updateNodesAndSave(updated);
                        }}
                        className={`py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                          isActive
                            ? "bg-[#9d4300] text-white shadow-xs"
                            : "text-[#584237] hover:bg-black/5"
                        }`}
                      >
                        {sizeOpt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions Grid (4 Actions) */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Add Child Node */}
                <button
                  type="button"
                  onClick={() => handleAddChildNode(selectedNode.id)}
                  className="flex flex-col items-center justify-center p-3.5 bg-[#ffdbca]/60 text-[#9d4300] rounded-2xl hover:bg-[#ffdbca] transition active:scale-95 cursor-pointer font-bold border border-[#9d4300]/20"
                >
                  <Plus className="w-5 h-5 mb-1" />
                  <span className="text-xs">إضافة عقدة</span>
                </button>

                {/* Cycle Shape */}
                <button
                  type="button"
                  onClick={() => {
                    const shapes: NodeShape[] = [
                      "rectangle",
                      "rounded-square",
                      "circle",
                      "pill",
                      "hexagon",
                    ];
                    const currentIndex = shapes.indexOf(selectedNode.shape);
                    const nextShape = shapes[(currentIndex + 1) % shapes.length];
                    const updated = nodes.map((n) =>
                      n.id === selectedNode.id ? { ...n, shape: nextShape } : n,
                    );
                    updateNodesAndSave(updated);
                  }}
                  className="flex flex-col items-center justify-center p-3.5 bg-[#eff4ff] text-[#0b1c30] rounded-2xl hover:bg-[#dce9ff] transition active:scale-95 cursor-pointer font-bold border border-[#e0c0b1]/30"
                >
                  <Shapes className="w-5 h-5 mb-1 text-[#9d4300]" />
                  <span className="text-xs">الشكل ({SHAPE_LABELS[selectedNode.shape].label})</span>
                </button>

                {/* Cycle Line Style */}
                <button
                  type="button"
                  onClick={() => {
                    const nextStyle: LineStyle =
                      selectedNode.lineStyle === "dashed" ? "solid" : "dashed";
                    const updated = nodes.map((n) =>
                      n.id === selectedNode.id ? { ...n, lineStyle: nextStyle } : n,
                    );
                    updateNodesAndSave(updated);
                  }}
                  className="flex flex-col items-center justify-center p-3.5 bg-[#eff4ff] text-[#0b1c30] rounded-2xl hover:bg-[#dce9ff] transition active:scale-95 cursor-pointer font-bold border border-[#e0c0b1]/30"
                >
                  <Sliders className="w-5 h-5 mb-1 text-[#8127cf]" />
                  <span className="text-xs">
                    {selectedNode.lineStyle === "dashed" ? "منقط - -" : "متصل ──"}
                  </span>
                </button>

                {/* Delete Node */}
                <button
                  type="button"
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  className="flex flex-col items-center justify-center p-3.5 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition active:scale-95 cursor-pointer font-bold border border-red-200"
                >
                  <Trash2 className="w-5 h-5 mb-1" />
                  <span className="text-xs">حذف</span>
                </button>
              </div>

              {/* Color Swatches */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#584237] block">
                  لون العقدة والخلفية
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { bg: "#FEF3C7", text: "#78350F", border: "#F59E0B" },
                    { bg: "#E0E7FF", text: "#1E1B4B", border: "#6366F1" },
                    { bg: "#DCFCE7", text: "#064E3B", border: "#10B981" },
                    { bg: "#F3E8FF", text: "#581C87", border: "#A855F7" },
                    { bg: "#FFE4E6", text: "#881337", border: "#F43F5E" },
                  ].map((palette, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => {
                        const updated = nodes.map((n) =>
                          n.id === selectedNode.id
                            ? {
                                ...n,
                                backgroundColor: palette.bg,
                                textColor: palette.text,
                                borderColor: palette.border,
                              }
                            : n,
                        );
                        updateNodesAndSave(updated);
                      }}
                      className="w-7 h-7 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: palette.bg }}
                    />
                  ))}
                  <label
                    htmlFor="node-bg-color-picker"
                    className="w-7 h-7 rounded-full flex items-center justify-center border border-[#e0c0b1] cursor-pointer hover:bg-black/5 transition"
                    title="لون مخصص"
                  >
                    <Palette className="w-3.5 h-3.5 text-[#584237]" />
                    <input
                      id="node-bg-color-picker"
                      type="color"
                      value={selectedNode.backgroundColor || "#FEF3C7"}
                      onChange={(e) => {
                        const updated = nodes.map((n) =>
                          n.id === selectedNode.id ? { ...n, backgroundColor: e.target.value } : n,
                        );
                        updateNodesAndSave(updated);
                      }}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              {/* Line Thickness & Line Color Picker */}
              <div className="space-y-2 pt-2 border-t border-[#e0c0b1]/30">
                <span className="text-xs font-bold text-[#584237] block">
                  سُمك ولون السهم الرابط
                </span>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1 bg-[#eff4ff] p-1 rounded-xl">
                    {LINE_THICKNESSES.map((thick) => (
                      <button
                        type="button"
                        key={thick.value}
                        onClick={() => {
                          const updated = nodes.map((n) =>
                            n.id === selectedNode.id ? { ...n, lineThickness: thick.value } : n,
                          );
                          updateNodesAndSave(updated);
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          (selectedNode.lineThickness || 4) === thick.value
                            ? "bg-[#9d4300] text-white shadow-xs"
                            : "text-[#584237] hover:bg-black/5"
                        }`}
                      >
                        {thick.value}px
                      </button>
                    ))}
                  </div>

                  <label
                    htmlFor="node-line-color-picker"
                    className="flex items-center gap-1 text-xs font-bold text-[#584237] cursor-pointer bg-[#eff4ff] px-2 py-1 rounded-xl border border-[#e0c0b1]/30"
                  >
                    <span>لون السهم:</span>
                    <input
                      id="node-line-color-picker"
                      type="color"
                      value={selectedNode.lineColor || "#F59E0B"}
                      onChange={(e) => {
                        const updated = nodes.map((n) =>
                          n.id === selectedNode.id ? { ...n, lineColor: e.target.value } : n,
                        );
                        updateNodesAndSave(updated);
                      }}
                      className="h-5 w-6 rounded border border-[#e0c0b1] cursor-pointer bg-transparent"
                    />
                  </label>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedNodeId(null)}
                className="w-full py-3 bg-[#9d4300] text-white font-bold text-sm rounded-2xl hover:bg-[#833800] transition-colors shadow-md mt-1 cursor-pointer"
              >
                تم / إغلاق اللوحة
              </button>
            </motion.aside>
          ) : (
            /* Bottom Hint when no node selected */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#0b1c30] text-white px-6 py-3 rounded-full text-xs font-bold shadow-2xl z-40 flex items-center gap-3 border border-white/10"
            >
              <Sparkles className="w-4 h-4 text-[#ffdbca]" />
              <span>اضغط على أي عقدة لبدء التحرير الفوري من لوحة التحكم</span>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
