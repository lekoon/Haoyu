import React, { useMemo, useState } from 'react';
import { useProjects, useResourcePool } from '../../store/useStore';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
    Users, Briefcase, TrendingUp, AlertCircle,
    ArrowUpRight, ArrowDownRight, Layers, Info
} from 'lucide-react';
import { Card, Button, Badge } from '../ui';
import type { Project, ResourcePoolItem } from '../../types';

// Utility to aggregate resources by category or department
const aggregateProjectResources = (project: Project, type: 'department' | 'category', pool: ResourcePoolItem[]) => {
    const planned = project.resourceRequirements || [];
    const actual = project.actualResourceUsage || [];

    const stats: Record<string, { planned: number; actual: number }> = {};

    planned.forEach(p => {
        const res = pool.find(r => r.id === p.resourceId);
        const group = (type === 'department' ? res?.department : res?.category) || 'Other';
        if (!stats[group]) stats[group] = { planned: 0, actual: 0 };
        stats[group].planned += p.count;
    });

    actual.forEach(a => {
        const group = (type === 'department' ? a.department : a.category) || 'Other';
        if (!stats[group]) stats[group] = { planned: 0, actual: 0 };
        stats[group].actual += a.count;
    });

    return Object.entries(stats).map(([name, data]) => ({
        name,
        planned: Number(data.planned.toFixed(1)),
        actual: Number(data.actual.toFixed(1)),
        variance: Number((data.actual - data.planned).toFixed(1)),
        variancePercent: data.planned > 0 ? Number(((data.actual - data.planned) / data.planned * 100).toFixed(1)) : 0
    }));
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const ResourceDeepDive: React.FC = () => {
    const projects = useProjects();
    const resourcePool = useResourcePool();
    const [selectedProjectId, setSelectedProjectId] = useState<string | 'all'>(projects[0]?.id || 'all');
    const [viewMetric, setViewMetric] = useState<'department' | 'category'>('category');

    const selectedProject = useMemo(() =>
        projects.find(p => p.id === selectedProjectId),
        [projects, selectedProjectId]);

    // 1. Single Project Comparison Data
    const comparisonData = useMemo(() => {
        if (!selectedProject) return [];
        return aggregateProjectResources(selectedProject, viewMetric, resourcePool);
    }, [selectedProject, viewMetric, resourcePool]);

    // 2. Cross-Project Portfolio Data for Tech Stack
    const portfolioData = useMemo(() => {
        const stats: Record<string, { total: number; projects: { name: string; value: number }[] }> = {};

        projects.forEach(p => {
            const usage = p.actualResourceUsage || [];
            usage.forEach(u => {
                const group = (viewMetric === 'department' ? u.department : u.category) || 'Other';
                if (!stats[group]) stats[group] = { total: 0, projects: [] };
                stats[group].total += u.count;
                stats[group].projects.push({ name: p.name, value: u.count });
            });
        });

        return Object.entries(stats).map(([name, data]) => ({
            name,
            value: Number(data.total.toFixed(1)),
            projects: data.projects
        })).sort((a, b) => b.value - a.value);
    }, [projects, viewMetric]);

    // 3. Efficiency Analysis
    const efficiencyData = useMemo(() => {
        return portfolioData.map(group => {
            const totalPlanned = projects.reduce((sum, p) => {
                const planned = p.resourceRequirements?.filter(r => {
                    const res = resourcePool.find(rp => rp.id === r.resourceId);
                    return (viewMetric === 'department' ? res?.department : res?.category) === group.name;
                }) || [];
                return sum + planned.reduce((s, r) => s + r.count, 0);
            }, 0);

            return {
                name: group.name,
                actual: group.value,
                planned: Number(totalPlanned.toFixed(1)),
                efficiency: totalPlanned > 0 ? Number((group.value / totalPlanned * 100).toFixed(1)) : 100
            };
        });
    }, [portfolioData, projects, resourcePool, viewMetric]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Top Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-5 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center gap-3 mb-2 text-blue-600 dark:text-blue-400">
                        <Users size={20} />
                        <span className="text-sm font-semibold uppercase tracking-wider">总人力投入 (Actual)</span>
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                        {efficiencyData.reduce((sum, d) => sum + d.actual, 0).toFixed(1)}
                        <span className="text-sm font-normal text-slate-500 ml-1">人天/月</span>
                    </div>
                </Card>

                <Card className="p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-100 dark:border-emerald-900/30">
                    <div className="flex items-center gap-3 mb-2 text-emerald-600 dark:text-emerald-400">
                        <TrendingUp size={20} />
                        <span className="text-sm font-semibold uppercase tracking-wider">资源偏差率</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                            {(() => {
                                const totalP = efficiencyData.reduce((sum, d) => sum + d.planned, 0);
                                const totalA = efficiencyData.reduce((sum, d) => sum + d.actual, 0);
                                return totalP > 0 ? ((totalA - totalP) / totalP * 100).toFixed(1) : '0';
                            })()}%
                        </div>
                        <Badge variant="warning" size="sm">Attention</Badge>
                    </div>
                </Card>

                <Card className="p-5 bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-100 dark:border-purple-900/30">
                    <div className="flex items-center gap-3 mb-2 text-purple-600 dark:text-purple-400">
                        <Layers size={20} />
                        <span className="text-sm font-semibold uppercase tracking-wider">核心部门 (Top)</span>
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                        {portfolioData[0]?.name || 'N/A'}
                    </div>
                </Card>

                <Card className="p-5 bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-100 dark:border-amber-900/30">
                    <div className="flex items-center gap-3 mb-2 text-amber-600 dark:text-amber-400">
                        <AlertCircle size={20} />
                        <span className="text-sm font-semibold uppercase tracking-wider">负载预警</span>
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                        {efficiencyData.filter(d => d.efficiency > 110).length}
                        <span className="text-sm font-normal text-red-500 ml-1">超支分类</span>
                    </div>
                </Card>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-6">
                    <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 p-1">
                        <button
                            onClick={() => setViewMetric('category')}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMetric === 'category' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            按技术栈
                        </button>
                        <button
                            onClick={() => setViewMetric('department')}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMetric === 'department' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            按部门
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500">主视图项目:</span>
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-900 border-none text-sm font-bold rounded-lg focus:ring-2 ring-blue-500 py-2 pl-3 pr-8"
                        >
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-slate-400">
                    <Info size={16} />
                    <span className="text-xs italic">数据每 15 分钟同步一次，支持跨项目偏差分析</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Project Detail Comparison */}
                <Card className="p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">预期 vs 实际投入 (项目级)</h3>
                            <p className="text-sm text-slate-500">对比当前所选项目的资源分配效能</p>
                        </div>
                        {selectedProject && <Badge variant={selectedProject.status === 'active' ? 'success' : 'neutral'}>{selectedProject.status}</Badge>}
                    </div>

                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={comparisonData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="planned" name="预计投入" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={20} />
                                <Bar dataKey="actual" name="实际投入" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                        {comparisonData.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                                </div>
                                <div className={`flex items-center gap-1 text-xs font-bold ${item.variance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {item.variance > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    {Math.abs(item.variancePercent)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* 2. Tech Stack Distribution Across Portfolio */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">跨项目资源分布 (组合级)</h3>
                            <p className="text-sm text-slate-500">显示该技术栈/部门在所有项目中的分布情况</p>
                        </div>
                    </div>

                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={portfolioData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={140}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {portfolioData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700">
                                                    <p className="font-bold text-slate-900 mb-2">{data.name}</p>
                                                    <div className="space-y-1">
                                                        {data.projects.map((p: any, i: number) => (
                                                            <div key={i} className="flex justify-between gap-4 text-xs">
                                                                <span className="text-slate-500">{p.name}</span>
                                                                <span className="font-bold text-blue-600">{p.value}人天</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-4 flex flex-wrap justify-center gap-4">
                        {portfolioData.map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="text-sm font-medium text-slate-600">{item.name}</span>
                                <span className="text-sm font-bold text-slate-900">{((item.value / portfolioData.reduce((s, d) => s + d.value, 0)) * 100).toFixed(0)}%</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* 3. Portfolio-Wide Efficiency Radar */}
            <Card className="p-8">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">资源效能雷达图 (Department/Skill Matrix)</h3>
                        <p className="text-slate-500">分析各技术栈/部门的规模投入偏差与效能平衡</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500/20 border-2 border-blue-500" />
                            <span className="text-sm font-semibold">实际消耗</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-slate-300" />
                            <span className="text-sm font-semibold">初始计划</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                    <div className="lg:col-span-2 h-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={efficiencyData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 700, fill: '#475569' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} axisLine={false} tick={false} />
                                <Radar
                                    name="Planned Assets"
                                    dataKey="planned"
                                    stroke="#94a3b8"
                                    fill="#94a3b8"
                                    fillOpacity={0.1}
                                    strokeWidth={2}
                                />
                                <Radar
                                    name="Actual Investment"
                                    dataKey="actual"
                                    stroke="#3b82f6"
                                    fill="#3b82f6"
                                    fillOpacity={0.3}
                                    strokeWidth={3}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b pb-4 border-slate-100 dark:border-slate-800">
                            关键偏差指标评级
                        </h4>
                        <div className="space-y-4">
                            {efficiencyData.map((item, i) => (
                                <div key={i} className="group cursor-default">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
                                        <span className={`text-sm font-black ${item.efficiency > 110 ? 'text-red-600' : item.efficiency < 90 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            {item.efficiency}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${item.efficiency > 110 ? 'bg-red-500' : item.efficiency < 90 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${Math.min(item.efficiency, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {item.efficiency > 110 ? '⚠️ 超量投入，需审视是否存在镀金或低效' : item.efficiency < 90 ? 'ℹ️ 投入不足，可能导致进度风险' : '✅ 投入模型完全符合基准计划'}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mt-8">
                            <div className="flex gap-3">
                                <Info className="text-blue-600 shrink-0" size={18} />
                                <div className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed font-medium">
                                    <strong>建议行动:</strong> 系统识别到 <strong>{efficiencyData.filter(d => d.efficiency > 110).length}</strong> 处显著超支点。建议调取项目周报，核实该技术栈在对应项目的工时填报真实性。
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Matrix View (Cross Project Table) */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">全量项目资源矩阵 (Resource Heat Matrix)</h3>
                        <p className="text-sm text-slate-500">横向对比各项目在各资源类别上的实际投入规模</p>
                    </div>
                    <Button variant="secondary" size="sm">导出矩阵</Button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">资源节点 / 项目</th>
                                {projects.map(p => (
                                    <th key={p.id} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center min-w-[120px]">
                                        {p.name.length > 10 ? p.name.substring(0, 10) + '...' : p.name}
                                    </th>
                                ))}
                                <th className="px-6 py-4 text-xs font-bold text-blue-600 uppercase text-center">合计投入</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {portfolioData.map((group, rowIdx) => (
                                <tr key={rowIdx} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-8 rounded-full" style={{ backgroundColor: COLORS[rowIdx % COLORS.length] }} />
                                            <span className="font-bold text-slate-900 dark:text-slate-100">{group.name}</span>
                                        </div>
                                    </td>
                                    {projects.map(p => {
                                        const usage = p.actualResourceUsage?.find(u => (viewMetric === 'department' ? u.department : u.category) === group.name);
                                        const amount = usage?.count || 0;
                                        return (
                                            <td key={p.id} className="px-6 py-4 text-center">
                                                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl text-sm font-bold ${amount > 5 ? 'bg-blue-600 text-white shadow-lg' :
                                                    amount > 2 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40' :
                                                        amount > 0 ? 'bg-slate-100 text-slate-600 dark:bg-slate-800' : 'text-slate-300'
                                                    }`}>
                                                    {amount || '-'}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-lg font-black text-slate-900 dark:text-slate-100">{group.value}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default ResourceDeepDive;
