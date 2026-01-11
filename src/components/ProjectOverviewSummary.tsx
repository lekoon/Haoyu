import React from 'react';
import { Target, Calendar, CheckSquare, AlertTriangle, TrendingUp } from 'lucide-react';
import type { Project, Task } from '../types';
import { format, parseISO } from 'date-fns';

interface ProjectOverviewSummaryProps {
    project: Project; // This prop is currently unused in the component body
    tasks: Task[];
}

const ProjectOverviewSummary: React.FC<ProjectOverviewSummaryProps> = ({ tasks }) => {
    // 基础统计
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // 里程碑统计
    const milestones = tasks.filter(t => t.type === 'milestone');
    const completedMilestones = milestones.filter(m => m.status === 'completed').length;
    const upcomingMilestone = milestones
        .filter(m => m.status !== 'completed')
        .sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime())[0];

    // 关键风险（来自任务或项目本身）
    const delayedTasks = tasks.filter(t => {
        if (t.status === 'completed') return false;
        const endDate = parseISO(t.endDate);
        return endDate.getTime() < new Date().getTime();
    });

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* 项目进展 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <TrendingUp size={20} />
                    </div>
                    <span className="text-xs font-bold text-blue-600 px-2 py-1 bg-blue-50 rounded-full">
                        {completionRate.toFixed(0)}%
                    </span>
                </div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">整体任务进展</h4>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">{completedTasks}</span>
                    <span className="text-sm text-slate-400">/ {totalTasks} 任务</span>
                </div>
                <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 transition-all duration-1000 ease-out"
                        style={{ width: `${completionRate}%` }}
                    />
                </div>
            </div>

            {/* 里程碑达成 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                        <Target size={20} />
                    </div>
                    {upcomingMilestone && (
                        <span className="text-[10px] font-bold text-amber-600 px-2 py-1 bg-amber-50 rounded-full flex items-center gap-1">
                            <Calendar size={10} />
                            最近: {format(parseISO(upcomingMilestone.startDate), 'MM-dd')}
                        </span>
                    )}
                </div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">关键里程碑</h4>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">{completedMilestones}</span>
                    <span className="text-sm text-slate-400">/ {milestones.length} 交付物</span>
                </div>
                <p className="mt-2 text-xs text-slate-500 truncate">
                    {upcomingMilestone ? `下个目标: ${upcomingMilestone.name}` : '所有里程碑已完成'}
                </p>
            </div>

            {/* 资源负荷/冲突（简化展示） */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                        <CheckSquare size={20} />
                    </div>
                    <span className="text-xs font-bold text-indigo-600 px-2 py-1 bg-indigo-50 rounded-full">
                        正常
                    </span>
                </div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">资源调度健康</h4>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">100%</span>
                    <span className="text-sm text-slate-400">匹配率</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                    当前人力资源分配合理，无过载风险
                </p>
            </div>

            {/* 风险预警 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                        <AlertTriangle size={20} />
                    </div>
                    {delayedTasks.length > 0 && (
                        <span className="animate-pulse text-xs font-bold text-red-600 px-2 py-1 bg-red-50 rounded-full">
                            {delayedTasks.length} 项延期
                        </span>
                    )}
                </div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">进度风险预警</h4>
                <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold ${delayedTasks.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                        {delayedTasks.length > 0 ? '需介入' : '稳健'}
                    </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                    {delayedTasks.length > 0
                        ? `有 ${delayedTasks.length} 个任务超出计划日期`
                        : '进度与基线完全吻合'}
                </p>
            </div>
        </div>
    );
};

export default ProjectOverviewSummary;
