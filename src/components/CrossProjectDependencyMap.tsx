import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Network, AlertTriangle, TrendingDown, Info,
    Calendar, Clock, Layers, Filter
} from 'lucide-react';
import { useProjects } from '../store/useStore';
import { Badge } from './ui';
import {
    detectCrossProjectDependencies,
    calculateCriticalPath,
    simulateDelayImpact,
    getDependencyStatistics
} from '../utils/crossProjectDependencies';
import DependencyNetworkGraph from './DependencyNetworkGraph';

const CrossProjectDependencyMap: React.FC = () => {
    const projects = useProjects();
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [simulatedDelay, setSimulatedDelay] = useState<number>(7);

    const dependencies = useMemo(() => {
        return detectCrossProjectDependencies(projects);
    }, [projects]);

    const criticalPath = useMemo(() => {
        return calculateCriticalPath(projects, dependencies);
    }, [projects, dependencies]);

    const stats = useMemo(() => {
        return getDependencyStatistics(projects, dependencies);
    }, [projects, dependencies]);

    const impactAnalysis = useMemo(() => {
        if (!selectedProjectId) return [];
        return simulateDelayImpact(selectedProjectId, simulatedDelay, projects, dependencies);
    }, [selectedProjectId, simulatedDelay, projects, dependencies]);

    if (projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                <Network size={64} className="text-slate-200 dark:text-slate-700 mb-6 animate-pulse" />
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2 uppercase tracking-tighter">
                    暂无项目数据
                </h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                    创建项目并建立里程碑依赖后即可查看网络图
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: '全局依赖总数', value: stats.totalDependencies, icon: Network, color: 'blue' },
                    { label: '关键路径阻塞', value: stats.criticalDependencies, icon: AlertTriangle, color: 'red' },
                    { label: '高风险承接项目', value: stats.mostDependentProject?.count || 0, icon: TrendingDown, color: 'orange', sub: stats.mostDependentProject?.name },
                    { label: '核心交付阻塞源', value: stats.mostBlockingProject?.count || 0, icon: Clock, color: 'purple', sub: stats.mostBlockingProject?.name },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-${stat.color}-500/5 rounded-full transition-transform group-hover:scale-150`} />
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20 text-${stat.color}-600 dark:text-${stat.color}-400`}>
                                <stat.icon size={20} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                {stat.label}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter group-hover:scale-110 transition-transform origin-left">
                                {stat.value}
                            </span>
                            {stat.sub && (
                                <span className="text-[10px] font-bold text-slate-500 mt-1 truncate max-w-full italic">
                                    {stat.sub}
                                </span>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Interactive Graph Container */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <Layers size={20} className="text-blue-600" />
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">全局依赖拓扑视图</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="primary" className="font-black text-[10px] uppercase tracking-widest">
                            Real-time Sync
                        </Badge>
                    </div>
                </div>

                <DependencyNetworkGraph
                    projects={projects}
                    dependencies={dependencies}
                    criticalPath={criticalPath}
                    onNodeClick={setSelectedProjectId}
                    selectedProjectId={selectedProjectId}
                />
            </div>

            {/* Simulation & Detail Panel */}
            <AnimatePresence>
                {selectedProjectId && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2.5 bg-blue-500/20 rounded-2xl text-blue-400 border border-blue-500/30">
                                            <Calendar size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">级联延期影响仿真</h3>
                                            <p className="text-slate-400 text-sm">模拟该项目交付节点变动对下游战略里程碑的连锁反应</p>
                                        </div>
                                    </div>

                                    <div className="flex items-end gap-6 mb-8">
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                                                设定偏差天数 (Delay Offset)
                                            </label>
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="90"
                                                    value={simulatedDelay}
                                                    onChange={(e) => setSimulatedDelay(parseInt(e.target.value))}
                                                    className="flex-1 accent-blue-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                                />
                                                <div className="w-16 px-3 py-1.5 bg-slate-800 rounded-xl border border-slate-700 text-center text-blue-400 font-black text-xl">
                                                    {simulatedDelay}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {impactAnalysis.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {impactAnalysis.map(impact => (
                                                    <div key={impact.projectId} className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs font-bold text-slate-300 truncate max-w-[150px]">{impact.projectName}</span>
                                                            <span className="text-xs font-black text-orange-400">+{impact.delayDays}D</span>
                                                        </div>
                                                        <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: '100' }}
                                                                className="h-full bg-gradient-to-r from-orange-600 to-amber-400"
                                                                style={{ width: `${(impact.delayDays / 90) * 100}%` }}
                                                            />
                                                        </div>
                                                        <div className="flex justify-between mt-2">
                                                            <span className="text-[10px] text-slate-500">{impact.originalEndDate}</span>
                                                            <span className="text-[10px] text-orange-500 font-bold">{impact.newEndDate}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-8 bg-green-500/10 rounded-2xl border border-green-500/20">
                                                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-3">
                                                    <Info size={24} />
                                                </div>
                                                <p className="text-green-400 font-bold">该项目处于非关键支路，延期不影响全局进度</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
                                    <Filter size={18} className="text-blue-600" />
                                    关键路径快报
                                </h3>
                                <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-700 space-y-8">
                                    {criticalPath.slice(0, 5).map((id, idx) => {
                                        const p = projects.find(it => it.id === id);
                                        if (!p) return null;
                                        return (
                                            <div key={id} className="relative">
                                                <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-4 border-white dark:border-slate-800 ${criticalPath.includes(id) ? 'bg-red-500' : 'bg-slate-300'}`} />
                                                <div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{idx + 1}. Step</div>
                                                    <div className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</div>
                                                    <div className="text-xs text-slate-500 mt-1">{p.endDate} 交付计划</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {criticalPath.length > 5 && (
                                        <div className="text-xs text-slate-400 italic mt-4 text-center">... 还有 {criticalPath.length - 5} 个后续步序</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CrossProjectDependencyMap;
