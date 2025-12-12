import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ZoomIn, ZoomOut, Undo2, Redo2, Download, Grid3x3,
} from 'lucide-react';
import {
    format, addDays, differenceInDays, startOfWeek,
    parseISO, startOfMonth
} from 'date-fns';
import type { Task, Milestone } from '../types';

interface InteractiveGanttChartProps {
    tasks: Task[];
    milestones?: Milestone[];
    onTaskUpdate: (task: Task) => void;
    onTaskDelete: (taskId: string) => void;
    onTaskAdd: (task: Partial<Task>) => void;
    onMilestoneAdd?: (milestone: Milestone) => void;
    onMilestoneUpdate?: (milestone: Milestone) => void;
    onMilestoneDelete?: (milestoneId: string) => void;
    onDependencyAdd?: (sourceId: string, targetId: string) => void;
    onDependencyDelete?: (sourceId: string, targetId: string) => void;
    onEditTask?: (task: Task) => void;
}

type ViewMode = 'Day' | 'Week' | 'Month';

const ROW_HEIGHT = 48; // Height of a task row

const InteractiveGanttChart: React.FC<InteractiveGanttChartProps> = ({
    tasks,
    milestones = [],
    onTaskUpdate,
    onTaskDelete,
    onTaskAdd: _onTaskAdd,
    onMilestoneAdd,
    onMilestoneUpdate,
    onMilestoneDelete,
    onDependencyAdd,
    onDependencyDelete,
    onEditTask,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('Day');
    const [zoomLevel, setZoomLevel] = useState(1);
    const [scrollPos, setScrollPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
    const [showGridLines, setShowGridLines] = useState(true);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, taskId: string } | null>(null);
    const [showMilestoneForm, setShowMilestoneForm] = useState(false);

    // Interaction states
    const [draggingTask, setDraggingTask] = useState<{ id: string, type: 'move' | 'resize-l' | 'resize-r', startX: number, status?: string } | null>(null);
    const [linkingState, setLinkingState] = useState<{ sourceId: string, endX: number, endY: number } | null>(null);

    // Calculate timeline range
    const { startDate, totalDays } = useMemo(() => {
        if (tasks.length === 0) {
            const start = startOfWeek(new Date());
            return { startDate: start, endDate: addDays(start, 30), totalDays: 30 };
        }

        const timestamps = tasks.flatMap(t => [new Date(t.startDate).getTime(), new Date(t.endDate).getTime()]);
        const min = new Date(Math.min(...timestamps));
        const max = new Date(Math.max(...timestamps));

        // Add buffer
        const start = addDays(startOfWeek(min), -7);
        const end = addDays(max, 14);

        return {
            startDate: start,
            endDate: end,
            totalDays: differenceInDays(end, start)
        };
    }, [tasks]);

    // Handle Zoom & View Mode
    const getBaseWidth = () => {
        switch (viewMode) {
            case 'Week': return 20;
            case 'Month': return 8;
            default: return 50;
        }
    };
    const currentCellWidth = getBaseWidth() * zoomLevel;

    // Helper: Date to Position
    const getXFromDate = (date: Date | string) => {
        const d = typeof date === 'string' ? parseISO(date) : date;
        return differenceInDays(d, startDate) * currentCellWidth;
    };

    // Mouse Event Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        // Only start pan if accessing the container directly (or non-interactive elements)
        if (e.target === containerRef.current || (e.target as Element).tagName === 'svg') {
            if (e.button === 0) { // Left click only
                setIsDragging(true);
                setDragStart({ x: e.clientX + scrollPos.x, y: e.clientY + scrollPos.y });
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        // Handle Pan
        if (isDragging) {
            setScrollPos({
                x: dragStart.x - e.clientX,
                y: dragStart.y - e.clientY
            });
            return;
        }

        // Handle Linking Line
        if (linkingState && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setLinkingState(prev => prev ? {
                ...prev,
                endX: e.clientX - rect.left - scrollPos.x,
                endY: e.clientY - rect.top - scrollPos.y
            } : null);
        }

        // Handle Task Dragging
        if (draggingTask) {
            const task = tasks.find(t => t.id === draggingTask.id);
            if (!task) return;

            const deltaPixels = e.clientX - draggingTask.startX;
            const deltaDays = Math.round(deltaPixels / currentCellWidth);

            if (deltaDays === 0) return;

            try {
                const originals = JSON.parse(draggingTask.status || '{}');
                if (!originals.start || !originals.end) return;

                const originalStart = parseISO(originals.start);
                const originalEnd = parseISO(originals.end);

                if (draggingTask.type === 'move') {
                    const newStart = addDays(originalStart, deltaDays);
                    const newEnd = addDays(originalEnd, deltaDays);

                    if (format(newStart, 'yyyy-MM-dd') !== task.startDate) {
                        onTaskUpdate({ ...task, startDate: format(newStart, 'yyyy-MM-dd'), endDate: format(newEnd, 'yyyy-MM-dd') });
                    }
                } else if (draggingTask.type === 'resize-l') {
                    const newStart = addDays(originalStart, deltaDays);
                    if (differenceInDays(originalEnd, newStart) > 0) {
                        onTaskUpdate({ ...task, startDate: format(newStart, 'yyyy-MM-dd') });
                    }
                } else if (draggingTask.type === 'resize-r') {
                    const newEnd = addDays(originalEnd, deltaDays);
                    if (differenceInDays(newEnd, originalStart) > 0) {
                        onTaskUpdate({ ...task, endDate: format(newEnd, 'yyyy-MM-dd') });
                    }
                }
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
        }
        if (linkingState) {
            setLinkingState(null);
        }
        if (draggingTask) {
            setDraggingTask(null);
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            // Zoom
            const delta = -e.deltaY;
            setZoomLevel(prev => Math.min(3, Math.max(0.1, prev + delta * 0.001)));
        } else {
            // Pan
            setScrollPos(prev => ({
                x: prev.x + e.deltaX,
                y: prev.y + e.deltaY
            }));
        }
    };

    // --- Task Manipulation ---
    const handleTaskDragStart = (e: React.MouseEvent, task: Task, type: 'move' | 'resize-l' | 'resize-r') => {
        e.stopPropagation();
        setDraggingTask({
            id: task.id,
            type,
            startX: e.clientX,
            status: JSON.stringify({ start: task.startDate, end: task.endDate })
        });
    };

    const startLinking = (e: React.MouseEvent, sourceId: string) => {
        e.stopPropagation();
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setLinkingState({
                sourceId,
                endX: e.clientX - rect.left - scrollPos.x,
                endY: e.clientY - rect.top - scrollPos.y
            });
        }
    };

    const finishLinking = (e: React.MouseEvent, targetId: string) => {
        e.stopPropagation();
        if (linkingState && linkingState.sourceId !== targetId) {
            if (onDependencyAdd) {
                onDependencyAdd(linkingState.sourceId, targetId);
            }
        }
        setLinkingState(null);
    };

    // --- Render Header ---
    const renderHeader = () => {
        const months = [];
        let iter = startOfMonth(startDate);
        const end = addDays(startDate, totalDays);

        while (iter <= end) {
            months.push(iter);
            iter = addDays(iter, 32);
            iter = startOfMonth(iter);
        }

        const showDays = currentCellWidth >= 20;
        const showWeeks = currentCellWidth >= 5 && currentCellWidth < 20;

        return (
            <div className="h-12 bg-white border-b flex-shrink-0 relative overflow-hidden z-20 shadow-sm select-none">
                <div
                    className="absolute top-0 left-0 h-full"
                    style={{
                        transform: `translate(${-scrollPos.x}px, 0px)`,
                        width: totalDays * currentCellWidth
                    }}
                >
                    {/* Top Tier: Months */}
                    <div className="h-1/2 border-b flex relative bg-slate-50 text-xs font-semibold text-slate-600">
                        {months.map((date, i) => {
                            const left = getXFromDate(date);
                            const nextMonth = addDays(date, 32);
                            const startNext = startOfMonth(nextMonth);
                            let width = differenceInDays(startNext, date) * currentCellWidth;

                            return (
                                <div
                                    key={i}
                                    className="absolute top-0 border-r flex items-center px-2 whitespace-nowrap overflow-hidden"
                                    style={{ left, width, height: '100%' }}
                                >
                                    {format(date, 'yyyy年 M月')}
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom Tier: Days / Weeks */}
                    <div className="h-1/2 relative bg-white text-[10px] text-slate-500">
                        {showDays ? (
                            Array.from({ length: totalDays }).map((_, i) => {
                                const date = addDays(startDate, i);
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                return (
                                    <div
                                        key={i}
                                        className={`absolute border-r h-full flex items-center justify-center ${isWeekend ? 'bg-slate-50 text-slate-400' : ''}`}
                                        style={{ left: i * currentCellWidth, width: currentCellWidth }}
                                    >
                                        {format(date, 'd')}
                                    </div>
                                );
                            })
                        ) : showWeeks ? (
                            (() => {
                                const weeks = [];
                                let curr = startOfWeek(startDate, { weekStartsOn: 1 });
                                const endRange = addDays(startDate, totalDays);
                                while (curr < endRange) {
                                    weeks.push(curr);
                                    curr = addDays(curr, 7);
                                }
                                return weeks.map((date, i) => {
                                    const left = getXFromDate(date);
                                    return (
                                        <div
                                            key={i}
                                            className="absolute border-r h-full flex items-center justify-center px-1"
                                            style={{ left, width: 7 * currentCellWidth }}
                                        >
                                            {format(date, 'd')}
                                        </div>
                                    );
                                });
                            })()
                        ) : (
                            // Month view low details
                            <div className="w-full h-full flex items-center pl-2 text-slate-300">
                                ...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 border rounded-xl overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="h-12 bg-white border-b flex items-center px-4 justify-between z-30 relative shrink-0">
                <div className="flex items-center gap-2">
                    <div className="flex bg-slate-100 p-0.5 rounded-lg mr-2">
                        {(['Day', 'Week', 'Month'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => {
                                    // Logic to switch view and center
                                    const containerWidth = containerRef.current?.clientWidth || 800;
                                    const centerX = scrollPos.x + containerWidth / 2;
                                    const daysFromStart = centerX / currentCellWidth;

                                    setViewMode(mode);
                                }}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === mode ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {mode === 'Day' ? '日' : mode === 'Week' ? '周' : '月'}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setZoomLevel(z => Math.max(0.1, z - 0.1))} className="p-1.5 hover:bg-slate-100 rounded text-slate-600">
                        <ZoomOut size={18} />
                    </button>
                    <span className="text-sm font-medium w-12 text-center">{(zoomLevel * 100).toFixed(0)}%</span>
                    <button onClick={() => setZoomLevel(z => Math.min(3, z + 0.1))} className="p-1.5 hover:bg-slate-100 rounded text-slate-600">
                        <ZoomIn size={18} />
                    </button>
                    <div className="w-px h-6 bg-slate-200 mx-1" />
                    <button
                        onClick={() => setShowGridLines(!showGridLines)}
                        className={`p-1.5 rounded transition-colors ${showGridLines
                            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        title={showGridLines ? '隐藏网格线' : '显示网格线'}
                    >
                        <Grid3x3 size={18} />
                    </button>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button className="p-1.5 hover:bg-slate-100 rounded text-slate-600"><Undo2 size={18} /></button>
                    <button className="p-1.5 hover:bg-slate-100 rounded text-slate-600"><Redo2 size={18} /></button>
                    <div className="w-px h-6 bg-slate-200 mx-1" />
                    <button className="p-1.5 hover:bg-slate-100 rounded text-slate-600"><Download size={18} /></button>
                </div>
            </div>

            {/* Header */}
            {renderHeader()}

            {/* Canvas */}
            <div
                className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing select-none bg-slate-50"
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onContextMenu={(e) => e.preventDefault()}
            >
                <div
                    className="absolute transition-transform duration-75 ease-out origin-top-left"
                    style={{
                        transform: `translate(${-scrollPos.x}px, ${-scrollPos.y}px)`
                    }}
                >
                    {/* Grid Background */}
                    <div className="absolute top-0 bottom-0 left-0 right-0 flex pointer-events-none z-0">
                        {/* Weekend highlighting */}
                        {Array.from({ length: totalDays }).map((_, i) => {
                            const date = addDays(startDate, i);
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                            if (!isWeekend) return null;

                            return (
                                <div
                                    key={`weekend-${i}`}
                                    className="absolute top-0 bottom-0 bg-slate-100/20"
                                    style={{
                                        left: i * currentCellWidth,
                                        width: currentCellWidth
                                    }}
                                />
                            );
                        })}

                        {/* Grid Lines - subtle vertical lines */}
                        {showGridLines && currentCellWidth > 5 && Array.from({ length: totalDays }).map((_, i) => {
                            // Only show grid lines at reasonable intervals
                            const date = addDays(startDate, i);
                            const isMonthStart = date.getDate() === 1;
                            const isWeekStart = date.getDay() === 1; // Monday

                            // Show monthly lines always, weekly lines when zoomed in
                            if (isMonthStart || (currentCellWidth > 20 && isWeekStart)) {
                                return (
                                    <div
                                        key={`grid-${i}`}
                                        className="absolute top-0 bottom-0"
                                        style={{
                                            left: i * currentCellWidth,
                                            borderLeft: isMonthStart
                                                ? '1px solid rgba(148, 163, 184, 0.3)'
                                                : '1px dashed rgba(203, 213, 225, 0.3)'
                                        }}
                                    />
                                );
                            }
                            return null;
                        })}

                        {/* Current Time Line */}
                        <div
                            className="absolute top-0 bottom-0 border-l-2 border-red-500 z-10 pointer-events-none"
                            style={{ left: getXFromDate(new Date()) }}
                        >
                            <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-red-500" />
                        </div>
                    </div>

                    {/* Dependencies Lines (SVG) */}
                    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible z-0">
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                            </marker>
                        </defs>
                        {tasks.flatMap(task =>
                            (task.dependencies || []).map(depId => {
                                const targetTask = tasks.find(t => t.id === depId);
                                if (!targetTask) return null;
                                const startX = getXFromDate(task.endDate) + currentCellWidth;
                                const startY = tasks.findIndex(t => t.id === task.id) * ROW_HEIGHT + 20 + 16;
                                const endX = getXFromDate(targetTask.startDate);
                                const endY = tasks.findIndex(t => t.id === targetTask.id) * ROW_HEIGHT + 20 + 16;
                                const path = `M ${startX} ${startY} C ${startX + 50} ${startY}, ${endX - 50} ${endY}, ${endX} ${endY}`;
                                return (
                                    <path
                                        key={`${task.id}-${targetTask.id}`}
                                        d={path}
                                        stroke="#cbd5e1"
                                        strokeWidth="2"
                                        fill="none"
                                        markerEnd="url(#arrowhead)"
                                    />
                                );
                            })
                        )}
                        {linkingState && (() => {
                            const sourceTask = tasks.find(t => t.id === linkingState.sourceId);
                            if (!sourceTask) return null;
                            const startX = getXFromDate(sourceTask.endDate) + currentCellWidth;
                            const startY = tasks.findIndex(t => t.id === sourceTask.id) * ROW_HEIGHT + 20 + 16;
                            return (
                                <line
                                    x1={startX} y1={startY}
                                    x2={linkingState.endX} y2={linkingState.endY}
                                    stroke="#3b82f6" strokeWidth="2" strokeDasharray="5 5"
                                    markerEnd="url(#arrowhead)"
                                />
                            );
                        })()}
                    </svg>

                    {/* Tasks */}
                    <div className="relative z-1 pt-4 pb-20 select-none" style={{ minHeight: '100%' }}>
                        {tasks.map((task, index) => {
                            const x = getXFromDate(task.startDate);
                            const width = Math.max(currentCellWidth, differenceInDays(parseISO(task.endDate), parseISO(task.startDate)) * currentCellWidth + currentCellWidth);
                            const top = index * ROW_HEIGHT + 20;
                            const isSelected = selectedTasks.has(task.id);

                            return (
                                <motion.div
                                    key={task.id}
                                    className={`absolute group h-8 rounded-lg shadow-sm border border-black/10 flex items-center ${isSelected ? 'ring-2 ring-blue-500 z-20' : 'hover:shadow-md z-10'}`}
                                    style={{
                                        left: x, width, top,
                                        backgroundColor: task.color || '#3b82f6',
                                        cursor: 'move'
                                    }}
                                    onMouseDown={(e) => handleTaskDragStart(e, task, 'move')}
                                    onDoubleClick={(e) => { e.stopPropagation(); onEditTask?.(task); }}
                                    onContextMenu={(e) => {
                                        e.stopPropagation(); e.preventDefault();
                                        setContextMenu({ x: e.clientX, y: e.clientY, taskId: task.id });
                                        setSelectedTasks(new Set([task.id]));
                                    }}
                                >
                                    <div className="px-2 text-xs text-white font-medium truncate w-full drop-shadow-md pointer-events-none flex items-center gap-1">
                                        {/* Priority Badge */}
                                        {task.priority && (
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${task.priority === 'high' ? 'bg-red-500/90' :
                                                task.priority === 'medium' ? 'bg-orange-500/90' :
                                                    'bg-blue-500/90'
                                                }`}>
                                                {task.priority === 'high' ? 'H' : task.priority === 'medium' ? 'M' : 'L'}
                                            </span>
                                        )}
                                        <span className="truncate">{task.name}</span>
                                    </div>
                                    {/* Left Handle */}
                                    <div
                                        className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-white/20 z-20"
                                        onMouseDown={(e) => handleTaskDragStart(e, task, 'resize-l')}
                                    />
                                    {/* Right Handle */}
                                    <div
                                        className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-white/20 z-20"
                                        onMouseDown={(e) => handleTaskDragStart(e, task, 'resize-r')}
                                    />
                                    {/* Link dots */}
                                    <div
                                        className="absolute -right-3 w-5 h-5 rounded-full bg-transparent flex items-center justify-center cursor-crosshair z-30 group-hover:opacity-100 opacity-0 transition-opacity"
                                        onMouseDown={(e) => startLinking(e, task.id)}
                                        onMouseUp={(e) => finishLinking(e, task.id)}
                                    >
                                        <div className="w-3 h-3 bg-white border border-blue-500 rounded-full shadow-sm" />
                                    </div>
                                    <div
                                        className="absolute -left-3 w-5 h-5 rounded-full bg-transparent flex items-center justify-center cursor-crosshair z-30 group-hover:opacity-100 opacity-0 transition-opacity"
                                        onMouseUp={(e) => finishLinking(e, task.id)}
                                    >
                                        <div className="w-3 h-3 bg-white border border-slate-400 rounded-full shadow-sm" />
                                    </div>
                                </motion.div>
                            );
                        })}

                        {/* Milestones */}
                        {milestones.map((milestone) => {
                            const x = getXFromDate(milestone.date);

                            return (
                                <motion.div
                                    key={milestone.id}
                                    className="absolute group cursor-pointer z-30"
                                    style={{ left: x - 12, top: 10 }}
                                    whileHover={{ scale: 1.2 }}
                                    title={`${milestone.name}\n${milestone.date}`}
                                >
                                    <div className="relative">
                                        <div className="text-2xl">⭐</div>
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-amber-500 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                                            {milestone.name}
                                        </div>
                                    </div>
                                    {/* Vertical line */}
                                    <div
                                        className="absolute top-6 left-1/2 transform -translate-x-1/2 w-0.5 bg-amber-400/50 pointer-events-none"
                                        style={{ height: `${tasks.length * ROW_HEIGHT + 20}px` }}
                                    />
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Context Menu (Simplified) */}
            <AnimatePresence>
                {contextMenu && (
                    <div
                        className="fixed bg-white shadow-xl border rounded-md py-1 z-50 w-32"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                    >
                        <button className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50" onClick={() => { onEditTask?.(tasks.find(t => t.id === contextMenu.taskId)!); setContextMenu(null); }}>编辑</button>
                        <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50" onClick={() => { onTaskDelete(contextMenu.taskId); setContextMenu(null); }}>删除</button>
                        <div className="border-t my-1" />
                        <button className="w-full text-left px-4 py-2 text-sm text-slate-400" onClick={() => setContextMenu(null)}>取消</button>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InteractiveGanttChart;
