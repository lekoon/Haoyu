import React, { useState, useEffect, useMemo } from 'react';
import { format, differenceInDays, addDays, startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameMonth, parseISO, isValid } from 'date-fns';
import { ZoomIn, ZoomOut, Plus } from 'lucide-react';

interface Task {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    progress: number;
    color?: string;
    type: 'task' | 'milestone' | 'group';
    parentId?: string;
    expanded?: boolean;
}

interface ProfessionalGanttChartProps {
    tasks: Task[];
    onTaskUpdate: (updatedTask: Task) => void;
    startDate?: string;
    endDate?: string;
}

type ViewMode = 'day' | 'week' | 'month';

const ProfessionalGanttChart: React.FC<ProfessionalGanttChartProps> = ({
    tasks: initialTasks,
    onTaskUpdate,
    startDate: projectStartDate,
    endDate: projectEndDate
}) => {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [viewMode, setViewMode] = useState<ViewMode>('day');
    const [columnWidth, setColumnWidth] = useState(40);
    const headerHeight = 60;
    const rowHeight = 40;

    // Sync internal state with props
    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    // Calculate timeline range
    const { minDate, maxDate, totalDays } = useMemo(() => {
        const dates = tasks.flatMap(t => [parseISO(t.startDate), parseISO(t.endDate)]).filter(isValid);
        if (projectStartDate) dates.push(parseISO(projectStartDate));
        if (projectEndDate) dates.push(parseISO(projectEndDate));

        if (dates.length === 0) {
            const now = new Date();
            return { minDate: startOfWeek(now), maxDate: endOfWeek(addDays(now, 30)), totalDays: 30 };
        }

        const min = new Date(Math.min(...dates.map(d => d.getTime())));
        const max = new Date(Math.max(...dates.map(d => d.getTime())));

        // Add padding
        const start = addDays(min, -7);
        const end = addDays(max, 14);

        return {
            minDate: start,
            maxDate: end,
            totalDays: differenceInDays(end, start) + 1
        };
    }, [tasks, projectStartDate, projectEndDate]);

    // Generate time columns
    const timeColumns = useMemo(() => {
        if (viewMode === 'day') {
            return eachDayOfInterval({ start: minDate, end: maxDate });
        } else if (viewMode === 'week') {
            return eachWeekOfInterval({ start: minDate, end: maxDate });
        } else {
            return eachMonthOfInterval({ start: minDate, end: maxDate });
        }
    }, [minDate, maxDate, viewMode]);

    // Drag and Drop State
    const [draggingTask, setDraggingTask] = useState<{ id: string, startX: number, originalStart: Date, originalEnd: Date } | null>(null);
    const [resizingTask, setResizingTask] = useState<{ id: string, startX: number, originalEnd: Date } | null>(null);

    const handleMouseDown = (e: React.MouseEvent, task: Task) => {
        if (task.type === 'group') return;
        setDraggingTask({
            id: task.id,
            startX: e.clientX,
            originalStart: parseISO(task.startDate),
            originalEnd: parseISO(task.endDate)
        });
    };

    const handleResizeStart = (e: React.MouseEvent, task: Task) => {
        e.stopPropagation();
        setResizingTask({
            id: task.id,
            startX: e.clientX,
            originalEnd: parseISO(task.endDate)
        });
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (draggingTask) {
            const diffX = e.clientX - draggingTask.startX;
            const daysDiff = Math.round(diffX / columnWidth);

            if (daysDiff !== 0) {
                const newStart = addDays(draggingTask.originalStart, daysDiff);
                const newEnd = addDays(draggingTask.originalEnd, daysDiff);

                // Update local state for smooth UI
                setTasks(prev => prev.map(t =>
                    t.id === draggingTask.id
                        ? { ...t, startDate: format(newStart, 'yyyy-MM-dd'), endDate: format(newEnd, 'yyyy-MM-dd') }
                        : t
                ));
            }
        } else if (resizingTask) {
            const diffX = e.clientX - resizingTask.startX;
            const daysDiff = Math.round(diffX / columnWidth);

            if (daysDiff !== 0) {
                const newEnd = addDays(resizingTask.originalEnd, daysDiff);
                const task = tasks.find(t => t.id === resizingTask.id);
                if (task && newEnd > parseISO(task.startDate)) {
                    setTasks(prev => prev.map(t =>
                        t.id === resizingTask.id
                            ? { ...t, endDate: format(newEnd, 'yyyy-MM-dd') }
                            : t
                    ));
                }
            }
        }
    };

    const handleMouseUp = () => {
        if (draggingTask) {
            const task = tasks.find(t => t.id === draggingTask.id);
            if (task) onTaskUpdate(task);
            setDraggingTask(null);
        }
        if (resizingTask) {
            const task = tasks.find(t => t.id === resizingTask.id);
            if (task) onTaskUpdate(task);
            setResizingTask(null);
        }
    };

    useEffect(() => {
        if (draggingTask || resizingTask) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [draggingTask, resizingTask, tasks]);

    // View Controls
    const zoomIn = () => {
        if (columnWidth < 100) setColumnWidth(prev => prev + 10);
    };

    const zoomOut = () => {
        if (columnWidth > 20) setColumnWidth(prev => prev - 10);
    };

    return (
        <div className="flex flex-col h-full bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-4">
                    <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                        <button
                            onClick={() => setViewMode('day')}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'day' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            日
                        </button>
                        <button
                            onClick={() => setViewMode('week')}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'week' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            周
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'month' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            月
                        </button>
                    </div>
                    <div className="h-6 w-px bg-slate-300 mx-2"></div>
                    <div className="flex items-center gap-2">
                        <button onClick={zoomOut} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all">
                            <ZoomOut size={18} className="text-slate-600" />
                        </button>
                        <button onClick={zoomIn} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all">
                            <ZoomIn size={18} className="text-slate-600" />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                        <span>进行中</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                        <span>已完成</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rotate-45 bg-purple-500 transform scale-75"></div>
                        <span>里程碑</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel: Task List */}
                <div className="w-[300px] flex-shrink-0 border-r border-slate-200 flex flex-col bg-white z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                    {/* Header */}
                    <div className="h-[60px] border-b border-slate-200 bg-slate-50 flex items-center px-4 font-semibold text-slate-700">
                        任务列表
                    </div>
                    {/* List */}
                    <div className="flex-1 overflow-y-hidden hover:overflow-y-auto">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex items-center px-4 border-b border-slate-100 hover:bg-slate-50 transition-colors group"
                                style={{ height: rowHeight }}
                            >
                                <div className="flex-1 flex items-center gap-2 min-w-0">
                                    {task.type === 'milestone' ? (
                                        <div className="w-2 h-2 rotate-45 bg-purple-500 flex-shrink-0" />
                                    ) : (
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`} />
                                    )}
                                    <span className="truncate text-sm font-medium text-slate-700">{task.name}</span>
                                </div>
                                <div className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {task.progress}%
                                </div>
                            </div>
                        ))}
                        <div className="p-2">
                            <button className="w-full py-2 flex items-center justify-center gap-2 text-sm text-slate-500 hover:bg-slate-50 rounded-lg border border-dashed border-slate-300 hover:border-blue-400 hover:text-blue-600 transition-all">
                                <Plus size={16} />
                                添加任务
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Timeline */}
                <div className="flex-1 overflow-auto bg-slate-50 relative">
                    <div style={{ width: timeColumns.length * columnWidth, minWidth: '100%' }}>
                        {/* Timeline Header */}
                        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm" style={{ height: headerHeight }}>
                            {/* Top Row: Months/Years */}
                            <div className="flex border-b border-slate-100 h-[30px]">
                                {timeColumns.map((date, i) => {
                                    const isNewMonth = i === 0 || !isSameMonth(date, timeColumns[i - 1]);
                                    if (isNewMonth) {
                                        return (
                                            <div key={`month-${i}`} className="px-2 text-xs font-bold text-slate-600 flex items-center border-l border-slate-200 sticky left-0 bg-white/90 backdrop-blur-sm">
                                                {format(date, 'yyyy年MM月')}
                                            </div>
                                        );
                                    }
                                    return <div key={i} style={{ width: columnWidth }}></div>;
                                })}
                            </div>
                            {/* Bottom Row: Days/Weeks */}
                            <div className="flex h-[30px]">
                                {timeColumns.map((date, i) => (
                                    <div
                                        key={i}
                                        className="flex-shrink-0 border-r border-slate-100 flex items-center justify-center text-[10px] text-slate-500"
                                        style={{ width: columnWidth }}
                                    >
                                        {viewMode === 'day' ? format(date, 'd') : format(date, 'w周')}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Grid & Tasks */}
                        <div className="relative">
                            {/* Vertical Grid Lines */}
                            <div className="absolute inset-0 flex pointer-events-none">
                                {timeColumns.map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex-shrink-0 border-r border-slate-200/50 h-full"
                                        style={{ width: columnWidth }}
                                    />
                                ))}
                            </div>

                            {/* Task Rows */}
                            {tasks.map((task) => {
                                const startDate = parseISO(task.startDate);
                                const endDate = parseISO(task.endDate);
                                const offsetDays = differenceInDays(startDate, minDate);
                                const durationDays = differenceInDays(endDate, startDate) + 1;

                                const left = offsetDays * columnWidth;
                                const width = durationDays * columnWidth;

                                return (
                                    <div
                                        key={task.id}
                                        className="relative border-b border-slate-100/50 hover:bg-blue-50/30 transition-colors"
                                        style={{ height: rowHeight }}
                                    >
                                        {/* Task Bar */}
                                        <div
                                            className={`absolute top-2 bottom-2 rounded-md shadow-sm group cursor-pointer ${task.type === 'milestone'
                                                ? 'w-6 h-6 rotate-45 bg-purple-500 top-2'
                                                : 'bg-white border border-blue-200'
                                                }`}
                                            style={{
                                                left,
                                                width: task.type === 'milestone' ? undefined : width,
                                                marginLeft: task.type === 'milestone' ? -12 : 0
                                            }}
                                            onMouseDown={(e) => handleMouseDown(e, task)}
                                        >
                                            {task.type !== 'milestone' && (
                                                <>
                                                    {/* Progress Fill */}
                                                    <div
                                                        className="absolute top-0 bottom-0 left-0 bg-blue-500 rounded-l-md opacity-80"
                                                        style={{ width: `${task.progress}%` }}
                                                    />

                                                    {/* Label */}
                                                    <div className="absolute left-full ml-2 top-0 bottom-0 flex items-center whitespace-nowrap text-xs text-slate-600 font-medium pointer-events-none">
                                                        {task.name}
                                                    </div>

                                                    {/* Resize Handle */}
                                                    <div
                                                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/10 rounded-r-md transition-colors"
                                                        onMouseDown={(e) => handleResizeStart(e, task)}
                                                    />
                                                </>
                                            )}

                                            {/* Tooltip on Hover */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                                                {task.startDate} ~ {task.endDate}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Today Line */}
                            {(() => {
                                const today = new Date();
                                const offset = differenceInDays(today, minDate);
                                if (offset >= 0 && offset <= totalDays) {
                                    return (
                                        <div
                                            className="absolute top-0 bottom-0 w-px bg-red-500 z-10 pointer-events-none"
                                            style={{ left: offset * columnWidth }}
                                        >
                                            <div className="absolute top-0 -translate-x-1/2 bg-red-500 text-white text-[10px] px-1 rounded-b">
                                                今天
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfessionalGanttChart;
