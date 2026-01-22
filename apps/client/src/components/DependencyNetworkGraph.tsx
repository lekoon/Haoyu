import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    Maximize2, Minimize2, ZoomIn, ZoomOut,
    RefreshCcw, MousePointer2, Layers
} from 'lucide-react';
import type { Project, CrossProjectDependency } from '../types';
import { Badge } from './ui';

interface Node {
    id: string;
    project: Project;
    x: number;
    y: number;
    level: number;
}

interface Edge {
    id: string;
    source: string;
    target: string;
    dependency: CrossProjectDependency;
    path: string;
}

interface DependencyNetworkGraphProps {
    projects: Project[];
    dependencies: CrossProjectDependency[];
    criticalPath: string[];
    onNodeClick?: (projectId: string) => void;
    selectedProjectId?: string | null;
}

const DependencyNetworkGraph: React.FC<DependencyNetworkGraphProps> = ({
    projects,
    dependencies,
    criticalPath,
    onNodeClick,
    selectedProjectId
}) => {
    const [viewBox] = useState({ x: 0, y: 0, w: 1200, h: 800 });
    const [zoom, setZoom] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

    // Layout configuration
    const NODE_WIDTH = 220;
    const NODE_HEIGHT = 100;
    const LEVEL_SPACING = 350;
    const NODE_SPACING_Y = 150;

    const { nodes, edges } = useMemo(() => {
        if (projects.length === 0) return { nodes: [], edges: [] };

        const projectMap = new Map<string, Project>();
        projects.forEach(p => projectMap.set(p.id, p));

        // 1. Calculate levels (Topological Layering)
        const levels = new Map<string, number>();
        const inDegree = new Map<string, number>();
        const adj = new Map<string, string[]>();

        projects.forEach(p => {
            inDegree.set(p.id, 0);
            adj.set(p.id, []);
        });

        dependencies.forEach(dep => {
            adj.get(dep.sourceProjectId)?.push(dep.targetProjectId);
            inDegree.set(dep.targetProjectId, (inDegree.get(dep.targetProjectId) || 0) + 1);
        });

        const queue: string[] = [];
        inDegree.forEach((degree, id) => {
            if (degree === 0) queue.push(id);
        });

        let currentLevel = 0;
        const processed = new Set<string>();

        while (queue.length > 0) {
            const levelSize = queue.length;
            for (let i = 0; i < levelSize; i++) {
                const id = queue.shift()!;
                levels.set(id, currentLevel);
                processed.add(id);

                adj.get(id)?.forEach(targetId => {
                    inDegree.set(targetId, inDegree.get(targetId)! - 1);
                    if (inDegree.get(targetId) === 0) {
                        queue.push(targetId);
                    }
                });
            }
            currentLevel++;
        }

        // Catch projects with cycles or remaining processed
        projects.forEach(p => {
            if (!levels.has(p.id)) levels.set(p.id, 0);
        });

        // 2. Assign positions
        const levelGroups: Record<number, string[]> = {};
        levels.forEach((lvl, id) => {
            if (!levelGroups[lvl]) levelGroups[lvl] = [];
            levelGroups[lvl].push(id);
        });

        const layoutNodes: Node[] = [];
        Object.entries(levelGroups).forEach(([lvlStr, ids]) => {
            const lvl = parseInt(lvlStr);
            const totalHeight = ids.length * NODE_SPACING_Y;
            const startY = (viewBox.h - totalHeight) / 2;

            ids.forEach((id, index) => {
                const project = projectMap.get(id);
                if (project) {
                    layoutNodes.push({
                        id,
                        project,
                        x: lvl * LEVEL_SPACING + 50,
                        y: startY + index * NODE_SPACING_Y + 50,
                        level: lvl
                    });
                }
            });
        });

        // 3. Build edges with curved paths
        const layoutEdges: Edge[] = [];
        dependencies.forEach(dep => {
            const sourceNode = layoutNodes.find(n => n.id === dep.sourceProjectId);
            const targetNode = layoutNodes.find(n => n.id === dep.targetProjectId);

            if (sourceNode && targetNode) {
                const x1 = sourceNode.x + NODE_WIDTH;
                const y1 = sourceNode.y + NODE_HEIGHT / 2;
                const x2 = targetNode.x;
                const y2 = targetNode.y + NODE_HEIGHT / 2;

                const cp1x = x1 + (x2 - x1) / 2;
                const cp1y = y1;
                const cp2x = x1 + (x2 - x1) / 2;
                const cp2y = y2;

                layoutEdges.push({
                    id: dep.id,
                    source: dep.sourceProjectId,
                    target: dep.targetProjectId,
                    dependency: dep,
                    path: `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`
                });
            }
        });

        return { nodes: layoutNodes, edges: layoutEdges };
    }, [projects, dependencies, viewBox.h]);

    const handleZoom = (delta: number) => {
        setZoom(prev => Math.min(Math.max(0.5, prev + delta), 2));
    };

    const resetView = () => {
        setZoom(1);
    };

    return (
        <div className={`relative bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden transition-all duration-500 shadow-2xl ${isFullscreen ? 'fixed inset-0 z-[100]' : 'h-[700px]'}`}>
            <div className="absolute top-6 left-6 flex items-center gap-3 z-30">
                <div className="flex bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50">
                    <button onClick={() => handleZoom(0.1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-600 dark:text-slate-400">
                        <ZoomIn size={18} />
                    </button>
                    <button onClick={() => handleZoom(-0.1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-600 dark:text-slate-400">
                        <ZoomOut size={18} />
                    </button>
                    <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 self-center mx-1" />
                    <button onClick={resetView} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-600 dark:text-slate-400">
                        <RefreshCcw size={18} />
                    </button>
                </div>
                <button onClick={() => setIsFullscreen(!isFullscreen)} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
            </div>

            <div className="absolute top-6 right-6 z-30 flex flex-col gap-2">
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">图例说明</h4>
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">关键路径项目</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-0.5 bg-red-400 border-dashed" style={{ borderTop: '2px dashed #ef4444' }} />
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">里程碑强依赖</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-0.5 bg-blue-400 opacity-40" />
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">资源/分析依赖</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-6 left-6 z-30">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/10 dark:bg-white/5 backdrop-blur-sm rounded-full border border-slate-200/20">
                    <MousePointer2 size={14} className="text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">滚动缩放 · 点击卡片分析延迟影响</span>
                </div>
            </div>

            <div className="w-full h-full">
                <motion.svg
                    viewBox={`0 0 ${viewBox.w} ${viewBox.h}`}
                    className="w-full h-full"
                    style={{ scale: zoom }}
                >
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orientation="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                        </marker>
                        <marker id="arrowhead-critical" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orientation="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                        </marker>
                    </defs>

                    <g className="edges">
                        {edges.map(edge => {
                            const isCritical = criticalPath.includes(edge.source) && criticalPath.includes(edge.target);
                            const isSelected = selectedProjectId === edge.source || selectedProjectId === edge.target;
                            const isHovered = hoveredEdgeId === edge.id;

                            return (
                                <g key={edge.id}
                                    onMouseEnter={() => setHoveredEdgeId(edge.id)}
                                    onMouseLeave={() => setHoveredEdgeId(null)}
                                >
                                    <path
                                        d={edge.path}
                                        fill="none"
                                        stroke={isCritical ? '#ef4444' : isSelected ? '#3b82f6' : '#cbd5e1'}
                                        strokeWidth={isHovered || isSelected ? 3 : 2}
                                        strokeDasharray={edge.dependency.id.startsWith('auto') ? '5,5' : 'none'}
                                        markerEnd={isCritical ? 'url(#arrowhead-critical)' : 'url(#arrowhead)'}
                                        className="transition-all duration-300"
                                        style={{ opacity: selectedProjectId && !isSelected ? 0.1 : isHovered ? 1 : 0.6 }}
                                    />
                                </g>
                            );
                        })}
                    </g>

                    <AnimatePresence>
                        {nodes.map(node => {
                            const isCritical = criticalPath.includes(node.id);
                            const isSelected = selectedProjectId === node.id;
                            const isImpacted = selectedProjectId && dependencies.some(d => d.sourceProjectId === selectedProjectId && d.targetProjectId === node.id);

                            return (
                                <motion.g
                                    key={node.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ y: -5 }}
                                    onClick={() => onNodeClick?.(node.id)}
                                    className="cursor-pointer"
                                >
                                    <rect
                                        x={node.x}
                                        y={node.y}
                                        width={NODE_WIDTH}
                                        height={NODE_HEIGHT}
                                        rx="24"
                                        fill="white"
                                        className="dark:fill-slate-800 shadow-xl"
                                        stroke={isSelected ? '#3b82f6' : isCritical ? '#ef4444' : isImpacted ? '#f97316' : '#e2e8f0'}
                                        strokeWidth={isSelected || isCritical ? 3 : 1}
                                    />

                                    <foreignObject x={node.x} y={node.y} width={NODE_WIDTH} height={NODE_HEIGHT}>
                                        <div className="p-4 h-full flex flex-col justify-between overflow-hidden">
                                            <div>
                                                <div className="flex items-start justify-between">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                        PK:{node.project.rank || '-'}
                                                    </span>
                                                    {isCritical && (
                                                        <AlertTriangle size={14} className="text-red-500" />
                                                    )}
                                                </div>
                                                <h4 className={`text-sm font-black line-clamp-1 mt-1 ${isSelected ? 'text-blue-600' : isCritical ? 'text-red-600' : 'text-slate-800 dark:text-slate-100'}`}>
                                                    {node.project.name}
                                                </h4>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex -space-x-1.5">
                                                    {(node.project.milestoneDependencies || []).map((_, i) => (
                                                        <div key={i} className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center">
                                                            <Layers size={8} className="text-slate-400" />
                                                        </div>
                                                    ))}
                                                </div>
                                                <Badge variant={node.project.status === 'active' ? 'success' : 'neutral'} size="sm" className="scale-75 origin-right">
                                                    {node.project.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </foreignObject>
                                </motion.g>
                            );
                        })}
                    </AnimatePresence>
                </motion.svg>
            </div>
        </div>
    );
};

export default DependencyNetworkGraph;
