import React from 'react';
import {
    ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis,
    Tooltip, Cell, BarChart, Bar, CartesianGrid, RadarChart,
    PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
    TrendingUp, Shield, Activity, DollarSign, Users,
    Layers, Zap, ArrowUpRight, Calendar, Network
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui';
import clsx from 'clsx';
import { differenceInMonths, parseISO, startOfMonth, addMonths } from 'date-fns';

const PMODashboard: React.FC = () => {
    const { projects } = useStore();

    // 1. Data Processing for Portfolio Heatmap
    const heatmapData = projects.map(p => ({
        name: p.name,
        x: p.score || 0, // Priority/Value Score
        y: p.status === 'planning' ? 1 : p.status === 'active' ? 2 : p.status === 'on-hold' ? 1.5 : 3, // Status Mapping
        z: p.pmoMetrics?.rdInvestment || 0, // R&D Investment (Bubble Size)
        consistency: p.pmoMetrics?.strategicConsistency || 0, // Strategic Consistency (Color)
        statusLabel: p.status === 'planning' ? '规划中' : p.status === 'active' ? '进行中' : p.status === 'on-hold' ? '暂停' : '已上市'
    }));

    const getConsistencyColor = (score: number) => {
        if (score <= 2) return '#ef4444'; // Red - Low consistency
        if (score <= 3.5) return '#f59e0b'; // Amber - Medium
        return '#02dc9a'; // Brand Teal/Green - High
    };

    // 2. Data Processing for Resource Load
    const months = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];
    const aiLoadData = months.map(month => {
        const data: any = { month };
        projects.forEach(p => {
            const aiUsage = p.pmoMetrics?.resourceLoad.find(rl => rl.roleId === 'ai')?.monthlyUsage[month] || 0;
            if (aiUsage > 0) data[p.name] = aiUsage;
        });
        return data;
    });

    const hardwareLoadData = months.map(month => {
        const data: any = { month };
        projects.forEach(p => {
            const hwUsage = p.pmoMetrics?.resourceLoad.find(rl => rl.roleId === 'hardware')?.monthlyUsage[month] || 0;
            if (hwUsage > 0) data[p.name] = hwUsage;
        });
        return data;
    });

    // 3. Strategic Roadmap Calculation
    const timelineStart = startOfMonth(parseISO('2026-01-01'));
    const totalTimelineMonths = 36; // 3 year vision

    const platformGrouping = projects.reduce((acc: any, p) => {
        const platform = p.pmoMetrics?.techPlatform || 'Other';
        if (!acc[platform]) acc[platform] = [];
        acc[platform].push(p);
        return acc;
    }, {});

    // 4. Value Risk Radar Aggregation
    const radarData = [
        { subject: '商业回报', A: projects.reduce((sum, p) => sum + (p.pmoMetrics?.valueRiskMetrics.commercialROI || 0), 0) / (projects.length || 1), fullMark: 5 },
        { subject: '战略契合', A: projects.reduce((sum, p) => sum + (p.pmoMetrics?.valueRiskMetrics.strategicFit || 0), 0) / (projects.length || 1), fullMark: 5 },
        { subject: '技术可行', A: projects.reduce((sum, p) => sum + (p.pmoMetrics?.valueRiskMetrics.technicalFeasibility || 0), 0) / (projects.length || 1), fullMark: 5 },
        { subject: '市场窗口', A: projects.reduce((sum, p) => sum + (p.pmoMetrics?.valueRiskMetrics.marketWindow || 0), 0) / (projects.length || 1), fullMark: 5 },
        { subject: '资源依赖', A: projects.reduce((sum, p) => sum + (p.pmoMetrics?.valueRiskMetrics.resourceDependency || 0), 0) / (projects.length || 1), fullMark: 5 },
    ];

    // 5. Cash Flow Waterfall
    const currentInvestmentTotal = projects.reduce((sum, p) => sum + (p.pmoMetrics?.cashFlow.currentInvestment || 0), 0);
    const totalAnnualBudget = projects.reduce((sum, p) => sum + (p.pmoMetrics?.cashFlow.annualBudget || 0), 0);
    const futureROI_Y1 = projects.reduce((sum, p) => sum + (p.pmoMetrics?.cashFlow.futureROI[0] || 0), 0);
    const futureROI_Y2 = projects.reduce((sum, p) => sum + (p.pmoMetrics?.cashFlow.futureROI[1] || 0), 0);
    const futureROI_Y3 = projects.reduce((sum, p) => sum + (p.pmoMetrics?.cashFlow.futureROI[2] || 0), 0);

    const waterfallData = [
        { name: '年度总预算', value: totalAnnualBudget, color: '#3b82f6', display: `¥${totalAnnualBudget}W` },
        { name: '已投入成本', value: -currentInvestmentTotal, color: '#f43f5e', display: `-¥${currentInvestmentTotal}W` },
        { name: 'Y1 预期回报', value: futureROI_Y1, color: '#10b981', display: `+¥${futureROI_Y1}W` },
        { name: 'Y2 预期回报', value: futureROI_Y2, color: '#10b981', display: `+¥${futureROI_Y2}W` },
        { name: 'Y3 预期回报', value: futureROI_Y3, color: '#10b981', display: `+¥${futureROI_Y3}W` },
    ];

    const npv = totalAnnualBudget - currentInvestmentTotal + futureROI_Y1 + futureROI_Y2 + futureROI_Y3;

    return (
        <div className="space-y-8 pb-24 max-w-[1700px] mx-auto animate-in fade-in duration-700">
            {/* Premium Header - Glassmorphism */}
            <div className="relative p-10 rounded-[48px] bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -mr-48 -mt-48 blur-[100px] animate-pulse" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/5 rounded-full -ml-24 -mb-24 blur-[80px]" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/30">
                                <TrendingUp size={22} />
                            </div>
                            <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em]">Executive Insight</span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter sm:text-6xl leading-[0.9]">
                            PMO <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">战略透视</span> 板
                        </h1>
                        <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
                            数字化项目组合管控中心：实时解码研发价值密度、资源负载极限与长期财务 ROI 链路。
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                            <button
                                onClick={() => window.location.hash = '#/pmo/dependencies'}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105"
                            >
                                <Network size={14} /> 切换依赖图谱
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <div className="p-6 bg-white dark:bg-slate-900/80 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm min-w-[160px]">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">组合净现值 (NPV)</div>
                            <div className="text-3xl font-black text-slate-900 dark:text-white">¥{npv}W</div>
                            <div className="flex items-center gap-1 text-green-500 text-[10px] font-bold mt-1">
                                <ArrowUpRight size={12} /> +12.5% vs 去年同期
                            </div>
                        </div>
                        <div className="p-6 bg-blue-600 rounded-[32px] shadow-2xl shadow-blue-600/30 min-w-[160px] text-white">
                            <div className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-1">在研项目总投入</div>
                            <div className="text-3xl font-black">¥{(currentInvestmentTotal / 100).toFixed(1)}M</div>
                            <div className="text-[10px] font-bold text-blue-100/70 mt-1 uppercase tracking-tighter">占年度研发预算 64%</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* 1. Portfolio Heatmap - Large Section */}
                <Card className="lg:col-span-8 p-10 rounded-[40px] shadow-xl border-none bg-white dark:bg-slate-800/80 overflow-hidden group">
                    <div className="flex items-center justify-between mb-10">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Activity className="text-rose-500" size={18} />
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">项目组合投资热力图</h3>
                            </div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase">X:项目价值评分 | Y:生命周期状态 | 气泡:投入规模 | 颜色:战略一致性</p>
                        </div>
                    </div>

                    <div className="h-[450px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" strokeOpacity={0.4} />
                                <XAxis
                                    type="number"
                                    dataKey="x"
                                    name="项目价值"
                                    domain={[0, 10]}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fontWeight: '800', fill: '#94a3b8' }}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="y"
                                    name="状态"
                                    domain={[0.5, 3.5]}
                                    ticks={[1, 2, 3]}
                                    tickFormatter={(v) => v === 1 ? '规划' : v === 2 ? '开发' : '上市'}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fontWeight: '800', fill: '#94a3b8' }}
                                />
                                <ZAxis type="number" dataKey="z" range={[200, 3000]} name="投入" unit="万" />
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800">
                                                    <div className="text-sm font-black text-slate-900 dark:text-white mb-2">{data.name}</div>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[10px] gap-4">
                                                            <span className="text-slate-400 font-bold uppercase">当前状态</span>
                                                            <span className="text-blue-600 font-black">{data.statusLabel}</span>
                                                        </div>
                                                        <div className="flex justify-between text-[10px] gap-4">
                                                            <span className="text-slate-400 font-bold uppercase">投资额</span>
                                                            <span className="text-slate-900 dark:text-white font-black">¥{data.z}W</span>
                                                        </div>
                                                        <div className="flex justify-between text-[10px] gap-4">
                                                            <span className="text-slate-400 font-bold uppercase">战略评分</span>
                                                            <span className="font-black" style={{ color: getConsistencyColor(data.consistency) }}>{data.consistency.toFixed(1)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Scatter name="Projects" data={heatmapData}>
                                    {heatmapData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={getConsistencyColor(entry.consistency)}
                                            stroke={getConsistencyColor(entry.consistency)}
                                            fillOpacity={0.7}
                                            strokeWidth={2}
                                            className="hover:fill-opacity-100 transition-all cursor-pointer"
                                        />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex flex-wrap gap-8 mt-10 pt-8 border-t border-slate-50 dark:border-slate-700/50">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">战略脱节项</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">一般契合度</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(2,220,154,0.5)]" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">核心战略锚点</span>
                        </div>
                    </div>
                </Card>

                {/* 4. Value vs Risk Radar - Sidebar */}
                <Card className="lg:col-span-4 p-10 rounded-[40px] shadow-xl border-none bg-gradient-to-b from-slate-900 to-slate-800 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="p-2.5 bg-white/10 rounded-2xl text-purple-400">
                                <Zap size={18} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-black uppercase tracking-tighter">价值 vs 风险平衡器</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">组合多维度综合评估</p>
                            </div>
                        </div>

                        <div className="flex-1 min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#475569" strokeDasharray="3 3" />
                                    <PolarAngleAxis
                                        dataKey="subject"
                                        tick={{ fontSize: 10, fontWeight: '900', fill: '#94a3b8' }}
                                    />
                                    <PolarRadiusAxis angle={30} domain={[0, 5]} hide />
                                    <Radar
                                        name="组合均值"
                                        dataKey="A"
                                        stroke="#a855f7"
                                        fill="#a855f7"
                                        fillOpacity={0.4}
                                        strokeWidth={3}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-4 mt-8">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 font-mono">Strategic Health Check</div>
                                <div className="text-xs font-medium leading-relaxed">
                                    组合整体战略契合度极高 ({radarData[1].A.toFixed(1)}/5.0)，主要资源瓶颈集中在跨团队依赖与国产化适配。
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* 2. Resource Load - AI */}
                <Card className="lg:col-span-6 p-10 rounded-[40px] shadow-xl border-none bg-white dark:bg-slate-800/80">
                    <div className="flex items-center justify-between mb-8">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-orange-500 rounded-2xl text-white shadow-lg shadow-orange-500/20">
                                    <Users size={18} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">AI 算法团队 资源负载链</h3>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">可用产能上限: 20 人月/月</p>
                        </div>
                    </div>

                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={aiLoadData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" strokeOpacity={0.4} />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fontWeight: '800', fill: '#94a3b8' }}
                                    tickFormatter={(v) => v.split('-')[1] + '月'}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fontWeight: '800', fill: '#94a3b8' }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc', opacity: 0.5 }}
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)' }}
                                />
                                {projects.map((p, i) => (
                                    <Bar
                                        key={p.id}
                                        dataKey={p.name}
                                        stackId="a"
                                        fill={['#3b82f6', '#8b5cf6', '#0ea5e9', '#6366f1', '#4f46e5'][i % 5]}
                                        radius={i === projects.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* 2. Resource Load - Hardware */}
                <Card className="lg:col-span-6 p-10 rounded-[40px] shadow-xl border-none bg-white dark:bg-slate-800/80">
                    <div className="flex items-center justify-between mb-8">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                                    <Shield size={18} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">硬件工程团队 关键负荷</h3>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">可用产能上限: 35 人月/月</p>
                        </div>
                    </div>

                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hardwareLoadData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" strokeOpacity={0.4} />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fontWeight: '800', fill: '#94a3b8' }}
                                    tickFormatter={(v) => v.split('-')[1] + '月'}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fontWeight: '800', fill: '#94a3b8' }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc', opacity: 0.5 }}
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)' }}
                                />
                                {projects.map((p, i) => (
                                    <Bar
                                        key={p.id}
                                        dataKey={p.name}
                                        stackId="a"
                                        fill={['#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#818cf8'][i % 5]}
                                        radius={i === projects.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* 5. Cash Flow Waterfall */}
                <Card className="lg:col-span-12 p-10 rounded-[48px] shadow-xl border-none bg-white dark:bg-slate-800/80">
                    <div className="flex items-center justify-between mb-12">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-teal-500 rounded-2xl text-white shadow-lg shadow-teal-500/20">
                                    <DollarSign size={20} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">研发投资生命周期瀑布</h3>
                            </div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">年度预算分配 &rarr; 项目群投资消耗 &rarr; 未来 3 年动态回报脉络</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-center">
                        <div className="lg:col-span-3 h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={waterfallData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" strokeOpacity={0.4} />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 12, fontWeight: '900', fill: '#64748b' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9', opacity: 0.4 }}
                                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={80}>
                                        {waterfallData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-6">
                            {waterfallData.map((item, idx) => (
                                <div key={idx} className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 flex justify-between items-center group hover:scale-[1.02] transition-transform">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">{item.name}</span>
                                    </div>
                                    <span className={clsx(
                                        "text-sm font-black monospace",
                                        item.value < 0 ? "text-rose-500" : "text-emerald-500"
                                    )}>{item.display}</span>
                                </div>
                            ))}
                            <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[28px] text-white shadow-xl shadow-blue-500/20">
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Portfolio Dynamic NPV</div>
                                <div className="text-3xl font-black">¥{npv}W</div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* 3. Strategic Technology Roadmap */}
                <Card className="lg:col-span-12 p-10 rounded-[48px] shadow-xl border-none bg-slate-900 text-white overflow-hidden relative">
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:40px_40px]" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-16">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-white/10 rounded-2xl text-blue-400">
                                        <Layers size={20} />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter">战略技术演进全景 (Roadmap 2026-2028)</h3>
                                </div>
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">按技术平台解构代际演进通路 | 已对齐上市关键里程碑与资源投入时序</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                                    <Calendar size={14} /> Quarter View
                                </div>
                            </div>
                        </div>

                        <div className="space-y-16">
                            {Object.entries(platformGrouping).map(([platform, platformProjects]: [string, any]) => (
                                <div key={platform} className="space-y-6">
                                    <div className="flex items-center gap-6">
                                        <div className="min-w-[140px] px-5 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-2xl text-xs font-black uppercase tracking-widest text-center">
                                            {platform}
                                        </div>
                                        <div className="h-px flex-1 bg-white/5" />
                                    </div>

                                    <div className="space-y-10 pl-4">
                                        {platformProjects.map((p: any) => {
                                            const start = p.startDate ? parseISO(p.startDate) : timelineStart;
                                            const end = p.endDate ? parseISO(p.endDate) : addMonths(start, 12);

                                            let startMonths = differenceInMonths(start, timelineStart);
                                            let durationMonths = differenceInMonths(end, start);

                                            // Clamping for visualization
                                            if (startMonths < 0) {
                                                durationMonths += startMonths;
                                                startMonths = 0;
                                            }
                                            if (startMonths > totalTimelineMonths) startMonths = totalTimelineMonths;
                                            if (startMonths + durationMonths > totalTimelineMonths) durationMonths = totalTimelineMonths - startMonths;
                                            if (durationMonths < 1) durationMonths = 3; // Min 3 months for visibility

                                            const leftPercent = (startMonths / totalTimelineMonths) * 100;
                                            const widthPercent = (durationMonths / totalTimelineMonths) * 100;

                                            return (
                                                <div key={p.id} className="grid grid-cols-12 items-center gap-8">
                                                    <div className="col-span-3 lg:col-span-2">
                                                        <div className="text-sm font-black uppercase tracking-tighter leading-[1.1] truncate group">
                                                            {p.name}
                                                            <div className="h-0.5 w-4 bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left mt-1" />
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <div className={clsx(
                                                                "w-1.5 h-1.5 rounded-full animate-pulse",
                                                                p.status === 'active' ? 'bg-blue-500' : 'bg-slate-600'
                                                            )} />
                                                            <span className="text-[9px] font-bold text-slate-500 uppercase">{p.status}</span>
                                                        </div>
                                                    </div>

                                                    <div className="col-span-9 lg:col-span-10 relative h-10 bg-white/[0.03] rounded-3xl group/bar">
                                                        {/* Quarterly markers */}
                                                        <div className="absolute inset-0 flex justify-between pointer-events-none px-0">
                                                            {Array.from({ length: 12 }).map((_, i) => (
                                                                <div key={i} className="h-full border-r border-white/5" />
                                                            ))}
                                                        </div>

                                                        {/* Project Bar */}
                                                        <div
                                                            className={clsx(
                                                                "absolute h-full flex items-center px-4 transition-all duration-500 hover:scale-[1.01] hover:brightness-110 z-10 rounded-[14px] shadow-2xl",
                                                                p.status === 'active' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' :
                                                                    p.status === 'planning' ? 'bg-slate-700 text-slate-400' : 'bg-emerald-600 text-white'
                                                            )}
                                                            style={{
                                                                left: `${leftPercent}%`,
                                                                width: `${widthPercent}%`,
                                                            }}
                                                        >
                                                            <span className="text-[9px] font-black uppercase whitespace-nowrap overflow-hidden tracking-tighter opacity-80 group-hover/bar:opacity-100">
                                                                {durationMonths}M Dev Phase
                                                            </span>

                                                            {/* Milestone Markers */}
                                                            <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-400 rounded-full border-[3px] border-slate-900 shadow-xl group-hover/bar:scale-125 transition-transform" />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Timeline Labels */}
                        <div className="mt-16 pt-8 border-t border-white/5 flex justify-between px-[16.6%] lg:px-[16.6%]">
                            <span className="text-[10px] font-black text-slate-600 uppercase">2026 Q1</span>
                            <span className="text-[10px] font-black text-slate-600 uppercase">2026 Q3</span>
                            <span className="text-[10px] font-black text-slate-600 uppercase">2027 Q1</span>
                            <span className="text-[10px] font-black text-slate-600 uppercase">2027 Q3</span>
                            <span className="text-[10px] font-black text-slate-600 uppercase">2028 Q1</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PMODashboard;
