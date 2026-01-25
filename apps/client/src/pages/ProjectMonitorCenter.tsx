import React, { useState, useMemo } from 'react';
import {
    Activity,
    AlertCircle,
    CheckCircle2,
    Clock,
    DollarSign,
    TrendingUp,
    Users,
    Zap,
    LayoutGrid,
    LayoutList,
    ArrowUpRight,
    Layers,
    Search,
    MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Card, Badge, Button } from '../components/ui';
import {
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import clsx from 'clsx';

// Constants for health colors
const HEALTH_COLORS = {
    stable: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    warning: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    critical: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
};

const ProjectMonitorCenter: React.FC = () => {
    const { projects } = useStore();
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPlatform, setFilterPlatform] = useState<string>('all');

    // Extract unique platforms
    const platforms = useMemo(() => {
        const pSet = new Set<string>();
        projects.forEach(p => {
            if (p.pmoMetrics?.techPlatform) pSet.add(p.pmoMetrics.techPlatform);
        });
        return ['all', ...Array.from(pSet)];
    }, [projects]);

    // Filter projects
    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.code?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesPlatform = filterPlatform === 'all' || p.pmoMetrics?.techPlatform === filterPlatform;
            return matchesSearch && matchesPlatform;
        });
    }, [projects, searchTerm, filterPlatform]);

    // Calculate aggregate stats
    const stats = useMemo(() => {
        const total = projects.length;
        const critical = projects.filter(p => (p.pmoMetrics?.valueRiskMetrics?.resourceDependency || 0) > 4).length;
        const delayed = projects.filter(p => p.status === 'on-hold').length; // Simplified logic
        const investment = projects.reduce((sum, p) => sum + (p.pmoMetrics?.cashFlow?.currentInvestment || 0), 0);

        return { total, critical, delayed, investment };
    }, [projects]);

    const getHealthStatus = (project: any) => {
        const risk = project.pmoMetrics?.valueRiskMetrics?.resourceDependency || 0;
        if (risk > 4) return 'critical';
        if (risk > 3) return 'warning';
        return 'stable';
    };

    return (
        <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                        <Activity size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">项目运行监控中心</h1>
                        <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-widest">Global Project Health & Performance Monitor</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={clsx("p-2.5 rounded-xl transition-all", viewMode === 'grid' ? "bg-white dark:bg-slate-700 shadow-lg text-indigo-600" : "text-slate-400 hover:text-slate-600")}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={clsx("p-2.5 rounded-xl transition-all", viewMode === 'table' ? "bg-white dark:bg-slate-700 shadow-lg text-indigo-600" : "text-slate-400 hover:text-slate-600")}
                        >
                            <LayoutList size={18} />
                        </button>
                    </div>
                    <Button variant="outline" className="h-12 border-slate-200 dark:border-slate-700 rounded-2xl font-black bg-white dark:bg-slate-800">
                        生成健康报告
                    </Button>
                </div>
            </div>

            {/* Metric Summary Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: '纳管项目总数', value: stats.total, icon: Layers, color: 'indigo', detail: '跨平台项目协同' },
                    { label: '高风险预警', value: stats.critical, icon: AlertCircle, color: 'rose', detail: '需立即介入决策' },
                    { label: '资源饱和度', value: '92%', icon: Users, color: 'amber', detail: '跨团队负载均值' },
                    { label: '累计研发投入', value: `¥${stats.investment}W`, icon: DollarSign, color: 'teal', detail: '年度预算执行进度' }
                ].map((stat, i) => (
                    <Card key={i} className="p-6 border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-[32px] hover:scale-[1.02] transition-transform">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2.5 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-500`}>
                                <stat.icon size={20} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</span>
                            <span className="text-[10px] font-bold text-emerald-500">+12%</span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-400 mt-2 uppercase tracking-tight">{stat.detail}</p>
                    </Card>
                ))}
            </div>

            {/* Filter & Search Section */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-slate-50/50 dark:bg-slate-900/40 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800">
                <div className="relative flex-1 w-full max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="检索项目名称, 编号或代码..."
                        className="w-full h-14 pl-12 pr-6 rounded-2xl border-none bg-white dark:bg-slate-800 shadow-sm focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                    {platforms.map((p) => (
                        <button
                            key={p}
                            onClick={() => setFilterPlatform(p)}
                            className={clsx(
                                "px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border",
                                filterPlatform === p
                                    ? "bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-600 shadow-lg"
                                    : "bg-white text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50"
                            )}
                        >
                            {p === 'all' ? '全部平台' : p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content: Project Panorama Cards */}
            <AnimatePresence mode="wait">
                {viewMode === 'grid' ? (
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8"
                    >
                        {filteredProjects.map((project, idx) => {
                            const health = getHealthStatus(project);
                            const healthLabel = project.healthIndicators?.overallHealth === 'red' ? '重度偏离' :
                                project.healthIndicators?.overallHealth === 'amber' ? '存在偏差' :
                                    project.healthIndicators?.overallHealth === 'green' ? '运行稳定' :
                                        health === 'stable' ? '运行稳定' : health === 'warning' ? '存在偏差' : '重度偏离';

                            const displayProgress = project.progress !== undefined ? project.progress : Math.floor(((project.progress || 0) + (project.score || 0)) % 100);

                            return (
                                <Card
                                    key={project.id}
                                    className="group relative p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-none shadow-xl hover:shadow-2xl rounded-[40px] overflow-hidden transition-all hover:-translate-y-2"
                                >
                                    {/* Sidebar Health Indicator */}
                                    <div className={clsx("absolute left-0 top-0 bottom-0 w-2",
                                        project.healthIndicators?.overallHealth === 'green' ? "bg-emerald-500" :
                                            project.healthIndicators?.overallHealth === 'amber' ? "bg-amber-500" :
                                                project.healthIndicators?.overallHealth === 'red' ? "bg-rose-500" :
                                                    health === 'stable' ? "bg-emerald-500" : health === 'warning' ? "bg-amber-500" : "bg-rose-500"
                                    )} />

                                    <div className="flex justify-between items-start mb-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="neutral" size="sm" className="text-[9px] font-black uppercase tracking-tighter">
                                                    {project.pmoMetrics?.techPlatform || 'GENERIC'}
                                                </Badge>
                                                <span className="text-[10px] font-black text-slate-300"># {project.code || idx + 101}</span>
                                            </div>
                                            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                                                {project.name}
                                            </h3>
                                        </div>
                                        <div className={clsx("flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest translate-x-2",
                                            project.healthIndicators?.overallHealth ? (
                                                project.healthIndicators.overallHealth === 'green' ? HEALTH_COLORS.stable :
                                                    project.healthIndicators.overallHealth === 'amber' ? HEALTH_COLORS.warning : HEALTH_COLORS.critical
                                            ) : HEALTH_COLORS[health]
                                        )}>
                                            <div className={clsx("w-1.5 h-1.5 rounded-full animate-pulse",
                                                project.healthIndicators?.overallHealth === 'green' ? "bg-emerald-500" :
                                                    project.healthIndicators?.overallHealth === 'amber' ? "bg-amber-500" :
                                                        project.healthIndicators?.overallHealth === 'red' ? "bg-rose-500" :
                                                            health === 'stable' ? "bg-emerald-500" : health === 'warning' ? "bg-amber-500" : "bg-rose-500"
                                            )} />
                                            {healthLabel}
                                        </div>
                                    </div>

                                    {/* Progress Pulse */}
                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <Clock size={12} /> 开发进度
                                            </span>
                                            <span className="text-lg font-black text-slate-700 dark:text-slate-200">{displayProgress}%</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${displayProgress}%` }}
                                                transition={{ duration: 1, delay: idx * 0.1 }}
                                                className={clsx("h-full rounded-full shadow-lg relative",
                                                    health === 'stable' ? "bg-gradient-to-r from-emerald-500 to-teal-400" :
                                                        health === 'warning' ? "bg-gradient-to-r from-amber-500 to-orange-400" :
                                                            "bg-gradient-to-r from-rose-500 to-pink-500"
                                                )}
                                            >
                                                <div className="absolute top-0 right-0 w-8 h-full bg-white/20 skew-x-12 animate-pulse" />
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Dimensions Grid */}
                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="p-4 rounded-3xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-50 dark:border-slate-800">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Users size={14} className="text-indigo-500" />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">资源投入</span>
                                            </div>
                                            <div className="text-sm font-black text-slate-700 dark:text-slate-200">
                                                {project.pmoMetrics?.resourceLoad?.reduce((sum, r) => sum + Object.values(r.monthlyUsage || {}).reduce((s, u) => s + (u || 0), 0), 0) || 0} Man-Day
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-3xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-50 dark:border-slate-800">
                                            <div className="flex items-center gap-2 mb-2">
                                                <DollarSign size={14} className="text-emerald-500" />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">实际支出</span>
                                            </div>
                                            <div className="text-sm font-black text-slate-700 dark:text-slate-200">
                                                ¥{project.actualCost || project.pmoMetrics?.cashFlow?.currentInvestment || 0}W
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-3xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-50 dark:border-slate-800">
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertCircle size={14} className="text-rose-500" />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">冲突预警</span>
                                            </div>
                                            <div className="text-sm font-black text-slate-700 dark:text-slate-200">
                                                {project.healthIndicators?.riskHealth === 'red' ? 'CRITICAL' : (project.pmoMetrics?.valueRiskMetrics?.resourceDependency || 0) > 3 ? 'HIGH' : 'LOW'}
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-3xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-50 dark:border-slate-800">
                                            <div className="flex items-center gap-2 mb-2">
                                                <TrendingUp size={14} className="text-blue-500" />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">基线偏差</span>
                                            </div>
                                            <div className="text-sm font-black text-slate-700 dark:text-slate-200">
                                                {project.healthIndicators?.scheduleHealth === 'red' ? '> 15D' : 'STABLE'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mini Activity Sparkline */}
                                    <div className="h-20 w-full mb-6 relative group/spark">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={[
                                                { v: 10 }, { v: 15 }, { v: 12 }, { v: 18 }, { v: 24 }, { v: 22 }, { v: 30 }
                                            ]}>
                                                <defs>
                                                    <linearGradient id={`grad-${project.id}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <Area
                                                    type="monotone"
                                                    dataKey="v"
                                                    stroke="#6366f1"
                                                    strokeWidth={3}
                                                    fill={`url(#grad-${project.id})`}
                                                    isAnimationActive={true}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover/spark:opacity-100 transition-opacity">
                                            <span className="text-[8px] font-black text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">30D Pulse</span>
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="pt-6 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                                        <div className="flex -space-x-2">
                                            {(project.pdsgMembers ? project.pdsgMembers.slice(0, 3) : [1, 2, 3]).map((a: any, i: number) => (
                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 overflow-hidden shadow-sm">
                                                    <img src={a.avatar || `https://i.pravatar.cc/32?u=${project.id}-${i}`} alt="team" />
                                                </div>
                                            ))}
                                            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">+{project.pdsgMembers?.length || 4}</div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            className="group/btn h-10 px-4 rounded-xl text-xs font-black hover:bg-slate-100 dark:hover:bg-slate-700"
                                        >
                                            透视详情 <ArrowUpRight size={14} className="ml-2 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                        </Button>
                                    </div>
                                </Card>
                            );
                        })}
                    </motion.div>
                ) : (
                    <motion.div
                        key="table"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-2xl overflow-hidden"
                    >
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/30 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
                                    <th className="px-8 py-6">项目资产信息</th>
                                    <th className="px-8 py-6">当前阶段/进度</th>
                                    <th className="px-8 py-6">健康指数 (360°)</th>
                                    <th className="px-8 py-6">关键里程碑</th>
                                    <th className="px-8 py-6">PMO 决策建议</th>
                                    <th className="px-8 py-6 shrink-0"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {filteredProjects.map((p) => {
                                    const displayProgress = p.progress !== undefined ? p.progress : Math.floor(((p.progress || 0) + (p.score || 0)) % 100);
                                    const lastMilestone = p.milestones && p.milestones.length > 0
                                        ? p.milestones.find(m => !m.completed) || p.milestones[p.milestones.length - 1]
                                        : null;

                                    return (
                                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <Zap size={20} className="text-indigo-500" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-slate-800 dark:text-slate-100">{p.name}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{p.pmoMetrics?.techPlatform || 'Platform'} · {p.code || 'ID-001'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-sm font-black text-slate-600 dark:text-slate-300">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between w-40">
                                                        <span className="text-[10px] uppercase">{p.status}</span>
                                                        <span>{displayProgress}%</span>
                                                    </div>
                                                    <div className="h-2 w-40 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500" style={{ width: `${displayProgress}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <Badge className={clsx("h-8 px-4 rounded-xl font-black text-[10px]",
                                                    p.healthIndicators?.overallHealth ? (
                                                        p.healthIndicators.overallHealth === 'green' ? HEALTH_COLORS.stable :
                                                            p.healthIndicators.overallHealth === 'amber' ? HEALTH_COLORS.warning : HEALTH_COLORS.critical
                                                    ) : HEALTH_COLORS[getHealthStatus(p)]
                                                )}>
                                                    {(p.healthIndicators?.overallHealth || getHealthStatus(p)).toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-black text-slate-700 dark:text-slate-200 truncate max-w-[150px]">
                                                        {lastMilestone?.name || '---'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                                        {lastMilestone?.completed ? 'COMPLETED' : `Due: ${lastMilestone?.date || '---'}`}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                {p.pmoAdvice ? (
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-xl border border-amber-100/50">
                                                        <AlertCircle size={12} /> {p.pmoAdvice}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-xl border border-emerald-100/50">
                                                        <CheckCircle2 size={12} /> 无异常，继续推进
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="p-3 hover:bg-white dark:hover:bg-slate-700 rounded-2xl transition-all shadow-sm">
                                                    <MoreHorizontal size={20} className="text-slate-400" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProjectMonitorCenter;
