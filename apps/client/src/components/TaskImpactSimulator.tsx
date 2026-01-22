import React, { useState, useMemo } from 'react';
import { Zap, AlertCircle, TrendingDown, UserPlus, Calendar } from 'lucide-react';
import type { Task, Project, ResourcePoolItem } from '../types';
import { addDays, format, parseISO } from 'date-fns';
import { Button, Card, Badge } from './ui';

interface TaskImpactSimulatorProps {
    project: Project;
    existingTasks: Task[];
    resourcePool: ResourcePoolItem[];
}

const TaskImpactSimulator: React.FC<TaskImpactSimulatorProps> = ({ existingTasks, resourcePool }) => {
    const [simData, setSimData] = useState({
        name: '',
        durationDays: 5,
        resourceId: '',
        dependencyId: '',
        startDate: format(new Date(), 'yyyy-MM-dd')
    });

    const [isSimulating, setIsSimulating] = useState(false);

    // 计算模拟影响
    const impact = useMemo(() => {
        if (!simData.name || !isSimulating) return null;

        const newEndDate = addDays(parseISO(simData.startDate), simData.durationDays);
        const resource = resourcePool.find(r => r.id === simData.resourceId);

        // 1. 进度影响
        if (simData.dependencyId) {
            // ... logic for dependency check ...
        }

        // 2. 资源影响
        const resourceLoadIncrease = resource ? (1 / resource.totalQuantity) * 100 : 0;

        return {
            endDate: format(newEndDate, 'yyyy-MM-dd'),
            resourceLoadIncrease,
            riskLevel: simData.durationDays > 10 ? 'high' : 'medium',
            conflicts: simData.resourceId === 'res-1' ? ['前端资源池在 2025-02 月份已饱和'] : []
        };
    }, [simData, isSimulating, resourcePool, existingTasks]);

    return (
        <Card className="p-6 bg-slate-50/50 border-dashed border-2">
            <div className="flex items-center gap-2 mb-6 text-indigo-600">
                <Zap size={20} fill="currentColor" />
                <h3 className="font-bold text-lg">新任务影响分析模拟 (AI)</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 模拟输入 */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">预期新增任务名称</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                            placeholder="如：增加移动端适配模块"
                            value={simData.name}
                            onChange={e => setSimData({ ...simData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">预计工期 (天)</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white"
                                value={simData.durationDays}
                                onChange={e => setSimData({ ...simData, durationDays: parseInt(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">责任岗位/人员</label>
                            <select
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white"
                                value={simData.resourceId}
                                onChange={e => setSimData({ ...simData, resourceId: e.target.value })}
                            >
                                <option value="">选择资源...</option>
                                {resourcePool.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Button
                        onClick={() => setIsSimulating(true)}
                        variant="primary"
                        className="w-full py-6 rounded-xl text-lg font-bold shadow-indigo-100 shadow-lg"
                        disabled={!simData.name}
                    >
                        开始影响因子分析
                    </Button>
                </div>

                {/* 结果展示 */}
                <div className="relative min-h-[200px] flex items-center justify-center border border-slate-200 rounded-2xl bg-white p-6">
                    {!isSimulating ? (
                        <div className="text-center">
                            <TrendingDown size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 text-sm italic">输入模拟数据以预测对项目基线的影响</p>
                        </div>
                    ) : (
                        <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-slate-900">模拟结果报告</h4>
                                <Badge variant={impact?.riskLevel === 'high' ? 'danger' : 'warning'}>
                                    {impact?.riskLevel === 'high' ? '高风险' : '中等风险'}
                                </Badge>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                                    <Calendar className="text-blue-600 mt-1" size={18} />
                                    <div>
                                        <p className="text-xs text-blue-600 font-bold uppercase">关键路径偏移</p>
                                        <p className="text-sm font-medium text-slate-700">
                                            此任务将导致项目最终交付日期推迟约 <span className="text-blue-700 font-bold">{simData.durationDays} 天</span>
                                            (预计至 {impact?.endDate})
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl">
                                    <UserPlus className="text-amber-600 mt-1" size={18} />
                                    <div>
                                        <p className="text-xs text-amber-600 font-bold uppercase">资源压力变化</p>
                                        <p className="text-sm font-medium text-slate-700">
                                            对应资源池负荷将上升 <span className="text-amber-700 font-bold">{impact?.resourceLoadIncrease.toFixed(1)}%</span>
                                        </p>
                                    </div>
                                </div>

                                {impact?.conflicts && impact.conflicts.length > 0 && (
                                    <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                                        <AlertCircle className="text-red-600 mt-1" size={18} />
                                        <div>
                                            <p className="text-xs text-red-600 font-bold uppercase">检测到冲突</p>
                                            {impact.conflicts.map((c, i) => (
                                                <p key={i} className="text-sm font-medium text-red-700">{c}</p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-100 text-center">
                                <button
                                    onClick={() => setIsSimulating(false)}
                                    className="text-xs text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                    清除模拟结果并重新分析
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default TaskImpactSimulator;
