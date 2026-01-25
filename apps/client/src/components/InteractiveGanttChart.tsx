import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ZoomIn, ZoomOut, Undo2, Redo2, Download, Grid3x3, Target, PanelLeftOpen, PanelLeftClose,
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
const SIDEBAR_WIDTH = 320; // Width of the task list sidebar

const InteractiveGanttChart: React.FC<InteractiveGanttChartProps> = ({
    tasks,
    milestones = [],
    onTaskUpdate,
    onTaskDelete,
    onTaskAdd: _onTaskAdd,
    onDependencyAdd,
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
    const [showSidebar, setShowSidebar] = useState(true);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, taskId: string } | null>(null);

    // Interaction states
    const [draggingTask, setDraggingTask] = useState<{ id: string, type: 'move' | 'resize-l' | 'resize-r', startX: number, status?: string } | null>(null);
    const [linkingState, setLinkingState] = useState<{ sourceId: string, endX: number, endY: number } | null>(null);

    // --- Auto Scroll to Today ---
    React.useEffect(() => {
        if (containerRef.current) {
            const todayX = getXFromDate(new Date());
            const containerWidth = containerRef.current.clientWidth;
            setScrollPos(prev => ({ ...prev, x: Math.max(0, todayX - containerWidth / 3) }));
        }
    }, [viewMode]);

    const scrollToToday = () => {
        const todayX = getXFromDate(new Date());
        const containerWidth = containerRef.current?.clientWidth || 800;
        setScrollPos(prev => ({ ...prev, x: Math.max(0, todayX - containerWidth / 3) }));
    };

    // Calculate timeline range
    const { startDate, totalDays } = useMemo(() => {
        if (tasks.length === 0) {
            const start = startOfWeek(new Date());
            return { startDate: start, totalDays: 30 };
        }

        const timestamps = tasks.flatMap(t => [new Date(t.startDate).getTime(), new Date(t.endDate).getTime()]);
        const min = new Date(Math.min(...timestamps));
        const max = new Date(Math.max(...timestamps));

        const start = addDays(startOfWeek(min), -14);
        const end = addDays(max, 30);

        return {
            startDate: start,
            totalDays: differenceInDays(end, start)
        };
    }, [tasks]);

    // Handle Zoom & View Mode
    const getBaseWidth = () => {
        switch (viewMode) {
            case 'Week': return 25;
            case 'Month': return 10;
            default: return 60;
        }
    };
    const currentCellWidth = getBaseWidth() * zoomLevel;

    // Helper: Date to Position
    const getXFromDate = (date: Date | string) => {
        const d = typeof date === 'string' ? parseISO(date) : date;
        return differenceInDays(d, startDate) * currentCellWidth;
    };

    const handleTaskDragStart = (e: React.MouseEvent, task: Task, type: 'move' | 'resize-l' | 'resize-r') => {
        e.stopPropagation();
        setDraggingTask({ id: task.id, type, startX: e.clientX });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            setScrollPos({
                x: Math.max(0, scrollPos.x - dx),
                y: Math.max(0, scrollPos.y - dy)
            });
            setDragStart({ x: e.clientX, y: e.clientY });
            return;
        }

        if (draggingTask) {
            const dx = e.clientX - draggingTask.startX;
            const daysDiff = Math.round(dx / currentCellWidth);
            if (daysDiff === 0) return;

            const task = tasks.find(t => t.id === draggingTask.id);
            if (!task) return;

            let updatedTask = { ...task };
            if (draggingTask.type === 'move') {
                updatedTask.startDate = addDays(parseISO(task.startDate), daysDiff).toISOString();
                updatedTask.endDate = addDays(parseISO(task.endDate), daysDiff).toISOString();
            } else if (draggingTask.type === 'resize-l') {
                const newStart = addDays(parseISO(task.startDate), daysDiff);
                if (newStart < parseISO(task.endDate)) {
                    updatedTask.startDate = newStart.toISOString();
                }
            } else {
                const newEnd = addDays(parseISO(task.endDate), daysDiff);
                if (newEnd > parseISO(task.startDate)) {
                    updatedTask.endDate = newEnd.toISOString();
                }
            }

            onTaskUpdate(updatedTask);
            setDraggingTask({ ...draggingTask, startX: e.clientX });
        }

        if (linkingState) {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                setLinkingState({
                    ...linkingState,
                    endX: e.clientX - rect.left + scrollPos.x,
                    endY: e.clientY - rect.top + scrollPos.y
                });
            }
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.target === containerRef.current || (e.target as Element).tagName === 'svg') {
            setIsDragging(true);
            setDragStart({ x: e.clientX, y: e.clientY });
            setContextMenu(null);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setDraggingTask(null);
        setLinkingState(null);
    };

    const startLinking = (e: React.MouseEvent, taskId: string) => {
        e.stopPropagation();
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            setLinkingState({
                sourceId: taskId,
                endX: e.clientX - rect.left + scrollPos.x,
                endY: e.clientY - rect.top + scrollPos.y
            });
        }
    };

    const finishLinking = (_e: React.MouseEvent, targetId: string) => {
        if (linkingState && linkingState.sourceId !== targetId) {
            onDependencyAdd?.(linkingState.sourceId, targetId);
        }
        setLinkingState(null);
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setZoomLevel(z => Math.max(0.1, Math.min(3, z * delta)));
        } else {
            setScrollPos({
                x: Math.max(0, scrollPos.x + e.deltaX),
                y: Math.max(0, scrollPos.y + e.deltaY)
            });
        }
    };

    const renderHeader = () => {
        const months: Date[] = [];
        let iter = startOfMonth(startDate);
        const end = addDays(startDate, totalDays);
        while (iter <= end) {
            months.push(iter);
            iter = addDays(iter, 32);
            iter = startOfMonth(iter);
        }

        return (
            <div className="h-12 bg-white border-b flex-shrink-0 relative overflow-hidden z-20 shadow-sm select-none">
                <div
                    className="absolute top-0 left-0 h-full"
                    style={{
                        transform: `translate(${-scrollPos.x}px, 0px)`,
                        width: totalDays * currentCellWidth
                    }}
                >
                    <div className="h-1/2 border-b flex relative bg-slate-50 text-xs font-semibold text-slate-600">
                        {months.map((date, i) => {
                            const left = getXFromDate(date);
                            const width = differenceInDays(startOfMonth(addDays(date, 32)), date) * currentCellWidth;
                            return (
                                <div
                                    key={i}
                                    className="absolute top-0 border-r flex items-center justify-center px-2 whitespace-nowrap overflow-hidden"
                                    style={{ left, width, height: '100%' }}
                                >
                                    {format(date, 'yyyy年 M月')}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 border rounded-xl overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="h-12 bg-white border-b flex items-center px-4 justify-between z-40 relative shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className={`p-1.5 rounded-lg transition-colors ${showSidebar ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
                        title={showSidebar ? "隐藏任务列表" : "显示任务列表"}
                    >
                        {showSidebar ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                    </button>

                    <div className="flex bg-slate-100 p-0.5 rounded-lg">
                        {(['Day', 'Week', 'Month'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${viewMode === mode ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {mode === 'Day' ? '天 (d)' : mode === 'Week' ? '周 (w)' : '月 (m)'}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-1">
                        <button onClick={() => setZoomLevel(z => Math.max(0.1, z - 0.1))} className="p-1.5 hover:bg-slate-100 rounded text-slate-600">
                            <ZoomOut size={18} />
                        </button>
                        <span className="text-sm font-medium w-12 text-center text-slate-500">{(zoomLevel * 100).toFixed(0)}%</span>
                        <button onClick={() => setZoomLevel(z => Math.min(3, z + 0.1))} className="p-1.5 hover:bg-slate-100 rounded text-slate-600">
                            <ZoomIn size={18} />
                        </button>
                    </div>

                    <div className="w-px h-6 bg-slate-200" />

                    <button
                        onClick={() => setShowGridLines(!showGridLines)}
                        className={`p-1.5 rounded transition-colors ${showGridLines ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100'}`}
                        title="切换网格线"
                    >
                        <Grid3x3 size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={scrollToToday}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-all flex items-center gap-1.5"
                    >
                        <Target size={14} /> 跳转今天
                    </button>
                    <div className="w-px h-6 bg-slate-200 mx-1" />
                    <button className="p-1.5 hover:bg-slate-100 rounded text-slate-600"><Undo2 size={18} /></button>
                    <button className="p-1.5 hover:bg-slate-100 rounded text-slate-600"><Redo2 size={18} /></button>
                    <div className="w-px h-6 bg-slate-200 mx-1" />
                    <button className="p-1.5 hover:bg-slate-100 rounded text-slate-600"><Download size={18} /></button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Fixed Sidebar for Task Data */}
                <AnimatePresence>
                    {showSidebar && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: SIDEBAR_WIDTH, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="bg-white border-r flex-shrink-0 flex flex-col z-30 shadow-[4px_0_12px_-2px_rgba(0,0,0,0.05)]"
                        >
                            <div className="h-12 border-b bg-slate-50 flex items-center px-4 font-bold text-xs text-slate-500 uppercase tracking-wider">
                                <div className="flex-1">任务名称</div>
                                <div className="w-24 text-center">周期</div>
                            </div>
                            <div
                                className="flex-1 overflow-hidden"
                                onWheel={(e) => {
                                    setScrollPos(prev => ({ ...prev, y: Math.max(0, prev.y + e.deltaY) }));
                                }}
                            >
                                <div style={{ transform: `translateY(${-scrollPos.y}px)` }} className="pt-4">
                                    {tasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className={`h-[48px] px-4 flex items-center text-sm border-b border-slate-50 hover:bg-blue-50/50 transition-colors group cursor-pointer ${selectedTasks.has(task.id) ? 'bg-blue-50' : ''}`}
                                            onClick={() => setSelectedTasks(new Set([task.id]))}
                                            onDoubleClick={() => onEditTask?.(task)}
                                        >
                                            <div className="flex-1 truncate font-medium text-slate-700">
                                                <span className="text-blue-500 opacity-0 group-hover:opacity-100 mr-1.5">●</span>
                                                {task.name}
                                            </div>
                                            <div className="w-24 text-[10px] text-slate-400 font-mono text-center flex flex-col leading-tight">
                                                <span>{format(parseISO(task.startDate), 'MM/dd')}</span>
                                                <span className="opacity-40">→</span>
                                                <span>{format(parseISO(task.endDate), 'MM/dd')}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {tasks.length === 0 && (
                                        <div className="p-8 text-center text-slate-400 text-xs">列表为空</div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Gantt Canvas Area */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {renderHeader()}

                    <div
                        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing bg-slate-50"
                        ref={containerRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onWheel={handleWheel}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <div
                            className="absolute top-0 left-0 transition-transform duration-75 ease-out"
                            style={{ transform: `translate(${-scrollPos.x}px, ${-scrollPos.y}px)` }}
                        >
                            {/* Grid Background */}
                            <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none z-0">
                                {/* Weekends */}
                                {Array.from({ length: totalDays }).map((_, i) => {
                                    const date = addDays(startDate, i);
                                    if (date.getDay() !== 0 && date.getDay() !== 6) return null;
                                    return (
                                        <div
                                            key={`weekend-${i}`}
                                            className="absolute top-0 bottom-0 bg-slate-200/20 shadow-inner"
                                            style={{ left: i * currentCellWidth, width: currentCellWidth }}
                                        />
                                    );
                                })}

                                {/* Rows */}
                                {tasks.map((_, i) => (
                                    <div
                                        key={`row-bg-${i}`}
                                        className={`absolute left-0 right-0 h-[48px] border-b border-slate-100 ${i % 2 === 1 ? 'bg-slate-400/5' : 'bg-transparent'}`}
                                        style={{ top: i * ROW_HEIGHT + 20 }}
                                    />
                                ))}

                                {/* Today */}
                                <div
                                    className="absolute top-0 bottom-0 border-l-2 border-red-500 z-10"
                                    style={{ left: getXFromDate(new Date()) }}
                                >
                                    <div className="absolute top-0 -left-1.5 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-sm shadow-sm whitespace-nowrap">今天</div>
                                    <div className="h-full w-px bg-red-500/20" />
                                </div>
                            </div>

                            {/* SVG Layer */}
                            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible z-10">
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
                                        return (
                                            <path
                                                key={`${task.id}-${targetTask.id}`}
                                                d={`M ${startX} ${startY} C ${startX + 30} ${startY}, ${endX - 30} ${endY}, ${endX} ${endY}`}
                                                stroke="#cbd5e1" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)"
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
                                        <line x1={startX} y1={startY} x2={linkingState.endX} y2={linkingState.endY} stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrowhead)" />
                                    );
                                })()}
                            </svg>

                            {/* Task Items */}
                            <div className="relative pt-4 pb-20 select-none z-20">
                                {tasks.map((task, index) => {
                                    const x = getXFromDate(task.startDate);
                                    const width = Math.max(currentCellWidth, differenceInDays(parseISO(task.endDate), parseISO(task.startDate)) * currentCellWidth + currentCellWidth);
                                    const top = index * ROW_HEIGHT + 20;
                                    const isSelected = selectedTasks.has(task.id);

                                    if (task.type === 'milestone') {
                                        return (
                                            <motion.div
                                                key={task.id}
                                                className={`absolute cursor-pointer z-30 ${isSelected ? 'ring-2 ring-blue-500 rounded-full scale-110 shadow-lg' : 'hover:scale-110'}`}
                                                style={{ left: x - 16, top: top - 4 }}
                                                onClick={() => setSelectedTasks(new Set([task.id]))}
                                                onDoubleClick={() => onEditTask?.(task)}
                                            >
                                                <div className="relative text-center group">
                                                    <div className="text-4xl drop-shadow-md">⭐</div>
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded shadow-sm whitespace-nowrap z-50">
                                                        {task.name}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    }

                                    return (
                                        <motion.div
                                            key={task.id}
                                            className={`absolute h-8 rounded-lg shadow-sm border border-black/5 flex items-center group overflow-hidden ${isSelected ? 'ring-2 ring-blue-500 z-30 shadow-md' : 'hover:shadow-md z-20'}`}
                                            style={{ left: x, width, top, backgroundColor: task.color || '#3b82f6' }}
                                            onMouseDown={(e) => handleTaskDragStart(e, task, 'move')}
                                            onDoubleClick={() => onEditTask?.(task)}
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                setContextMenu({ x: e.clientX, y: e.clientY, taskId: task.id });
                                                setSelectedTasks(new Set([task.id]));
                                            }}
                                        >
                                            <div className="absolute top-0 left-0 h-full bg-black/15 pointer-events-none transition-all duration-300" style={{ width: `${task.progress || 0}%` }} />
                                            <div className="px-3 text-xs text-white font-bold truncate w-full flex items-center justify-between gap-2 z-10 pointer-events-none drop-shadow-sm">
                                                <span className="truncate">{task.name}</span>
                                                <span className="text-[10px] opacity-90">{task.progress || 0}%</span>
                                            </div>

                                            {/* Handles */}
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/30 z-20" onMouseDown={(e) => handleTaskDragStart(e, task, 'resize-l')} />
                                            <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/30 z-20" onMouseDown={(e) => handleTaskDragStart(e, task, 'resize-r')} />

                                            {/* Connector Dot */}
                                            <div className="absolute -right-3 w-6 h-6 flex items-center justify-center cursor-crosshair opacity-0 group-hover:opacity-100 transition-opacity z-30" onMouseDown={(e) => startLinking(e, task.id)} onMouseUp={() => finishLinking(null as any, task.id)}>
                                                <div className="w-2.5 h-2.5 bg-white border-2 border-blue-500 rounded-full shadow-sm" />
                                            </div>
                                        </motion.div>
                                    );
                                })}

                                {milestones.map((milestone) => {
                                    const x = getXFromDate(milestone.date);
                                    return (
                                        <div key={milestone.id} className="absolute group cursor-pointer z-30" style={{ left: x - 12, top: 10 }}>
                                            <div className="text-2xl drop-shadow-sm">⭐</div>
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded shadow-sm whitespace-nowrap">
                                                {milestone.name}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {contextMenu && (
                    <div className="fixed bg-white shadow-2xl border border-slate-200 rounded-xl py-1.5 z-[100] w-40 overflow-hidden" style={{ top: contextMenu.y, left: contextMenu.x }}>
                        <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 transition-colors" onClick={() => { onEditTask?.(tasks.find(t => t.id === contextMenu.taskId)!); setContextMenu(null); }}>编辑任务</button>
                        <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors" onClick={() => { onTaskDelete(contextMenu.taskId); setContextMenu(null); }}>删除任务</button>
                        <div className="border-t border-slate-100 my-1" />
                        <button className="w-full text-left px-4 py-2 text-sm text-slate-400 font-medium" onClick={() => setContextMenu(null)}>取消操作</button>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InteractiveGanttChart;
