import React, { useState, useRef, useEffect } from 'react';
import { format, differenceInDays, addDays, eachMonthOfInterval, parseISO } from 'date-fns';
import { GripVertical, Plus, Flag } from 'lucide-react';

interface Task {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    color: string;
    progress: number;
    assignee?: string;
}

interface Milestone {
    id: string;
    name: string;
    date: string;
    color: string;
    completed: boolean;
}

interface EnhancedGanttChartProps {
    projectStartDate: string;
    projectEndDate: string;
    tasks: Task[];
    milestones: Milestone[];
    onTasksChange: (tasks: Task[]) => void;
    onMilestonesChange: (milestones: Milestone[]) => void;
}

const EnhancedGanttChart: React.FC<EnhancedGanttChartProps> = ({
    projectStartDate,
    projectEndDate,
    tasks,
    milestones,
    onTasksChange,
    onMilestonesChange
}) => {
    const [draggingTask, setDraggingTask] = useState<string | null>(null);
    const [resizingTask, setResizingTask] = useState<{ id: string; edge: 'start' | 'end' } | null>(null);
    const [dragOffset, setDragOffset] = useState(0);
    const chartRef = useRef<HTMLDivElement>(null);

    const startDate = parseISO(projectStartDate);
    const endDate = parseISO(projectEndDate);
    const totalDays = differenceInDays(endDate, startDate);
    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    const COLORS = [
        { value: '#3B82F6', label: '蓝色' },
        { value: '#10B981', label: '绿色' },
        { value: '#F59E0B', label: '橙色' },
        { value: '#EF4444', label: '红色' },
        { value: '#8B5CF6', label: '紫色' },
        { value: '#EC4899', label: '粉色' },
        { value: '#06B6D4', label: '青色' },
    ];

    // Calculate task position and width
    const getTaskStyle = (task: Task) => {
        const taskStart = parseISO(task.startDate);
        const taskEnd = parseISO(task.endDate);
        const daysFromStart = differenceInDays(taskStart, startDate);
        const taskDuration = differenceInDays(taskEnd, taskStart);

        const left = (daysFromStart / totalDays) * 100;
        const width = (taskDuration / totalDays) * 100;

        return { left: `${left}%`, width: `${width}%` };
    };

    // Calculate milestone position
    const getMilestoneStyle = (milestone: Milestone) => {
        const milestoneDate = parseISO(milestone.date);
        const daysFromStart = differenceInDays(milestoneDate, startDate);
        const left = (daysFromStart / totalDays) * 100;
        return { left: `${left}%` };
    };

    // Handle task drag
    const handleTaskMouseDown = (e: React.MouseEvent, taskId: string) => {
        if ((e.target as HTMLElement).classList.contains('resize-handle')) return;

        setDraggingTask(taskId);
        const chartRect = chartRef.current?.getBoundingClientRect();
        if (chartRect) {
            const clickX = e.clientX - chartRect.left;
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                const taskStart = parseISO(task.startDate);
                const daysFromStart = differenceInDays(taskStart, startDate);
                const taskLeft = (daysFromStart / totalDays) * chartRect.width;
                setDragOffset(clickX - taskLeft);
            }
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!chartRef.current) return;

        const chartRect = chartRef.current.getBoundingClientRect();
        const mouseX = e.clientX - chartRect.left;

        if (draggingTask) {
            const newLeft = mouseX - dragOffset;
            const newDaysFromStart = Math.round((newLeft / chartRect.width) * totalDays);
            const newStartDate = addDays(startDate, Math.max(0, Math.min(totalDays, newDaysFromStart)));

            const task = tasks.find(t => t.id === draggingTask);
            if (task) {
                const duration = differenceInDays(parseISO(task.endDate), parseISO(task.startDate));
                const newEndDate = addDays(newStartDate, duration);

                onTasksChange(tasks.map(t =>
                    t.id === draggingTask
                        ? { ...t, startDate: format(newStartDate, 'yyyy-MM-dd'), endDate: format(newEndDate, 'yyyy-MM-dd') }
                        : t
                ));
            }
        } else if (resizingTask) {
            const task = tasks.find(t => t.id === resizingTask.id);
            if (!task) return;

            const newDaysFromStart = Math.round((mouseX / chartRect.width) * totalDays);
            const newDate = addDays(startDate, Math.max(0, Math.min(totalDays, newDaysFromStart)));

            if (resizingTask.edge === 'start') {
                const endDate = parseISO(task.endDate);
                if (newDate < endDate) {
                    onTasksChange(tasks.map(t =>
                        t.id === resizingTask.id
                            ? { ...t, startDate: format(newDate, 'yyyy-MM-dd') }
                            : t
                    ));
                }
            } else {
                const startDate = parseISO(task.startDate);
                if (newDate > startDate) {
                    onTasksChange(tasks.map(t =>
                        t.id === resizingTask.id
                            ? { ...t, endDate: format(newDate, 'yyyy-MM-dd') }
                            : t
                    ));
                }
            }
        }
    };

    const handleMouseUp = () => {
        setDraggingTask(null);
        setResizingTask(null);
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

    const addNewTask = () => {
        const newTask: Task = {
            id: Date.now().toString(),
            name: '新任务',
            startDate: format(startDate, 'yyyy-MM-dd'),
            endDate: format(addDays(startDate, 30), 'yyyy-MM-dd'),
            color: COLORS[0].value,
            progress: 0
        };
        onTasksChange([...tasks, newTask]);
    };

    const addNewMilestone = () => {
        const newMilestone: Milestone = {
            id: Date.now().toString(),
            name: '新里程碑',
            date: format(startDate, 'yyyy-MM-dd'),
            color: COLORS[3].value,
            completed: false
        };
        onMilestonesChange([...milestones, newMilestone]);
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">项目甘特图</h2>
                    <p className="text-sm text-slate-500 mt-1">拖动时间块调整任务，点击里程碑编辑</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={addNewTask}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg"
                    >
                        <Plus size={18} />
                        添加任务
                    </button>
                    <button
                        onClick={addNewMilestone}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-lg"
                    >
                        <Flag size={18} />
                        添加里程碑
                    </button>
                </div>
            </div>

            {/* Timeline */}
            <div className="overflow-x-auto">
                <div className="min-w-[1200px]">
                    {/* Month Headers */}
                    <div className="flex border-b-2 border-slate-300 mb-4 pb-2">
                        {months.map((month, idx) => {
                            const monthStart = month;
                            const monthEnd = idx < months.length - 1 ? months[idx + 1] : endDate;
                            const monthDays = differenceInDays(monthEnd, monthStart);
                            const width = (monthDays / totalDays) * 100;

                            return (
                                <div
                                    key={month.toISOString()}
                                    style={{ width: `${width}%` }}
                                    className="text-center font-bold text-slate-700 text-sm border-r border-slate-200 last:border-r-0"
                                >
                                    {format(month, 'yyyy年M月')}
                                </div>
                            );
                        })}
                    </div>

                    {/* Chart Area */}
                    <div ref={chartRef} className="relative min-h-[600px] bg-slate-50 rounded-xl p-4 border-2 border-slate-200">
                        {/* Grid Lines */}
                        {months.map((month) => {
                            const monthStart = month;
                            const daysFromStart = differenceInDays(monthStart, startDate);
                            const left = (daysFromStart / totalDays) * 100;

                            return (
                                <div
                                    key={month.toISOString()}
                                    className="absolute top-0 bottom-0 border-l border-slate-300"
                                    style={{ left: `${left}%` }}
                                />
                            );
                        })}

                        {/* Tasks */}
                        {tasks.map((task, index) => {
                            const style = getTaskStyle(task);
                            const isDragging = draggingTask === task.id;

                            return (
                                <div
                                    key={task.id}
                                    className="absolute h-12 group"
                                    style={{
                                        ...style,
                                        top: `${index * 60 + 20}px`,
                                        cursor: isDragging ? 'grabbing' : 'grab'
                                    }}
                                    onMouseDown={(e) => handleTaskMouseDown(e, task.id)}
                                >
                                    {/* Task Bar */}
                                    <div
                                        className={`h-full rounded-lg shadow-md transition-all ${isDragging ? 'opacity-70 scale-105' : 'hover:shadow-xl'
                                            }`}
                                        style={{ backgroundColor: task.color }}
                                    >
                                        {/* Progress Bar */}
                                        <div
                                            className="h-full rounded-lg bg-black/20"
                                            style={{ width: `${task.progress}%` }}
                                        />

                                        {/* Task Info */}
                                        <div className="absolute inset-0 flex items-center px-3 text-white font-medium text-sm">
                                            <GripVertical size={16} className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <span className="truncate">{task.name}</span>
                                            <span className="ml-auto text-xs opacity-90">
                                                {differenceInDays(parseISO(task.endDate), parseISO(task.startDate))}天
                                            </span>
                                        </div>

                                        {/* Resize Handles */}
                                        <div
                                            className="resize-handle absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/30 transition-opacity"
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                setResizingTask({ id: task.id, edge: 'start' });
                                            }}
                                        />
                                        <div
                                            className="resize-handle absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/30 transition-opacity"
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                setResizingTask({ id: task.id, edge: 'end' });
                                            }}
                                        />
                                    </div>

                                    {/* Task Label */}
                                    <div className="absolute -top-6 left-0 text-xs font-medium text-slate-700 whitespace-nowrap">
                                        {format(parseISO(task.startDate), 'MM/dd')} - {format(parseISO(task.endDate), 'MM/dd')}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Milestones */}
                        {milestones.map((milestone) => {
                            const style = getMilestoneStyle(milestone);

                            return (
                                <div
                                    key={milestone.id}
                                    className="absolute top-0 bottom-0 group"
                                    style={style}
                                >
                                    {/* Milestone Line */}
                                    <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400 group-hover:w-1 transition-all" style={{ backgroundColor: milestone.color }} />

                                    {/* Milestone Flag */}
                                    <div
                                        className="absolute top-2 -left-3 w-6 h-6 rounded-full shadow-lg flex items-center justify-center cursor-pointer transform group-hover:scale-125 transition-transform"
                                        style={{ backgroundColor: milestone.color }}
                                    >
                                        <Flag size={14} className="text-white" />
                                    </div>

                                    {/* Milestone Label */}
                                    <div
                                        className="absolute top-10 -left-12 w-24 text-center text-xs font-bold p-2 rounded-lg shadow-md text-white"
                                        style={{ backgroundColor: milestone.color }}
                                    >
                                        {milestone.name}
                                        <div className="text-[10px] opacity-90 mt-1">
                                            {format(parseISO(milestone.date), 'yyyy-MM-dd')}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="mt-6 flex items-center gap-6 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-500 rounded"></div>
                            <span>任务时间块（可拖动）</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Flag size={16} className="text-purple-600" />
                            <span>里程碑（时间点）</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <GripVertical size={16} />
                            <span>拖动调整位置</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-4 bg-slate-300 rounded"></div>
                            <span>边缘拖动调整时长</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnhancedGanttChart;
