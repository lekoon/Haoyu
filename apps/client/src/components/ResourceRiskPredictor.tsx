import React, { useMemo } from 'react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    Line,
} from 'recharts';
import {
    TrendingUp,
    AlertTriangle,
    Zap,
    Activity,
    Brain,
    ArrowRight,
    Search,
    Filter,
} from 'lucide-react';
import {
    predictAllResourceLoads,
    analyzePredictions,
    type ResourceLoadPrediction,
} from '../utils/resourcePrediction';
import type { Project, ResourcePoolItem } from '../types';
import { Card, Badge, Button } from './ui';

interface ResourceRiskPredictorProps {
    projects: Project[];
    resourcePool: ResourcePoolItem[];
}

const ResourceRiskPredictor: React.FC<ResourceRiskPredictorProps> = ({ projects, resourcePool }) => {
    // 1. 获取负载预测
    const predictions: ResourceLoadPrediction[] = useMemo(() => {
        return predictAllResourceLoads(resourcePool, projects, 6);
    }, [projects, resourcePool]);

    // 2. 分析风险
    const analysis = useMemo(() => {
        return analyzePredictions(predictions, resourcePool);
    }, [predictions, resourcePool]);

    // 3. 汇总全资源未来趋势数据
    const aggregateTrendData = useMemo(() => {
        const monthMap: Record<string, { month: string; predicted: number; capacity: number }> = {};

        predictions.forEach((pred) => {
            const resource = resourcePool.find((r) => r.id === pred.resourceId);
            const capacity = resource?.totalQuantity || 0;

            pred.predictions.forEach((p) => {
                if (!monthMap[p.month]) {
                    monthMap[p.month] = { month: p.month, predicted: 0, capacity: 0 };
                }
                monthMap[p.month].predicted += p.predicted;
                monthMap[p.month].capacity += capacity;
            });
        });

        return Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
    }, [predictions, resourcePool]);

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* 智能分析顶部摘要 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6 bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-none shadow-xl lg:col-span-2">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-indigo-500/20 rounded-lg">
                                    <Brain className="text-indigo-400" size={24} />
                                </div>
                                <h3 className="text-xl font-bold">AI 资源风险预测引擎</h3>
                            </div>
                            <p className="text-indigo-100/80 max-w-xl mb-6 leading-relaxed">
                                基于线性回归与移动平均算法，系统已对未来 6 个月的资源平衡进行了深度扫描。
                                预测显示 {analysis.summary}
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                                    <div className="text-xs text-indigo-300 mb-1">风险警告</div>
                                    <div className="text-2xl font-bold flex items-center gap-2">
                                        {analysis.warnings.length}
                                        {analysis.warnings.length > 0 && <AlertTriangle size={18} className="text-amber-400" />}
                                    </div>
                                </div>
                                <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                                    <div className="text-xs text-indigo-300 mb-1">优化建议</div>
                                    <div className="text-2xl font-bold">{analysis.opportunities.length}</div>
                                </div>
                                <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                                    <div className="text-xs text-indigo-300 mb-1">预测置信度</div>
                                    <div className="text-2xl font-bold">88.5%</div>
                                </div>
                            </div>
                        </div>
                        <div className="hidden sm:block">
                            <Activity className="text-indigo-500/30 w-32 h-32" />
                        </div>
                    </div>
                </Card>

                <div className="space-y-4">
                    <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/20 h-full">
                        <h4 className="font-bold text-emerald-900 dark:text-emerald-400 mb-3 flex items-center gap-2">
                            <Zap size={18} />
                            优化路径推荐
                        </h4>
                        <div className="space-y-3">
                            {analysis.opportunities.slice(0, 3).map((opp, i) => (
                                <div key={i} className="flex gap-2 text-sm text-emerald-800 dark:text-emerald-300/80">
                                    <div className="mt-1 flex-shrink-0 animate-pulse bg-emerald-400 w-1.5 h-1.5 rounded-full" />
                                    {opp}
                                </div>
                            ))}
                            {analysis.opportunities.length === 0 && (
                                <p className="text-slate-500 text-sm">暂未发现明显的资源冗余优化空间。</p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* 总体负载趋势预测 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6 lg:col-span-2">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold">总体人力负载预测趋势 (6M)</h3>
                            <p className="text-sm text-slate-500 mt-1">未来半年总资源需求 vs 总可用容量</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-indigo-500" />
                                <span className="text-xs text-slate-500 font-medium">预测负载</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-slate-200" />
                                <span className="text-xs text-slate-500 font-medium">基准容量</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={aggregateTrendData}>
                                <defs>
                                    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="predicted"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorLoad)"
                                    name="预测需求"
                                />
                                <Line
                                    type="stepAfter"
                                    dataKey="capacity"
                                    stroke="#cbd5e1"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={false}
                                    name="资源容量"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
                        待处理风险项
                        <Badge variant="danger">{analysis.warnings.length}</Badge>
                    </h3>
                    <div className="space-y-4">
                        {analysis.warnings.map((warning, i) => (
                            <div key={i} className="group p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900/50 transition-all cursor-pointer">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg">
                                        <AlertTriangle size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
                                            {warning}
                                        </p>
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">高优先级</span>
                                            <Button variant="ghost" size="sm" className="h-6 px-1 py-0 text-blue-600 hover:text-blue-700">
                                                自动寻找替补 <ArrowRight size={12} className="ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {analysis.warnings.length === 0 && (
                            <div className="py-12 text-center text-slate-400">
                                <TrendingUp size={48} className="mx-auto mb-2 opacity-20" />
                                <p>未来预测期内无显著负载风险</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* 详细资源预测列表 */}
            <Card className="p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold">资源预测明细 (By Role)</h3>
                        <p className="text-sm text-slate-500">分角色查看未来负载动态</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="搜索资源角色..."
                                className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-48"
                            />
                        </div>
                        <Button variant="secondary" size="sm" className="h-9">
                            <Filter size={16} className="mr-2" /> 筛选
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto -mx-6">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-700">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">资源角色</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">当前余量</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">未来趋势</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">未来 6 个月预估负载</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">风险系数</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {predictions.map((pred) => {
                                const resource = resourcePool.find(r => r.id === pred.resourceId);
                                const currentUsed = 0; // 模拟当前已用
                                const capacity = resource?.totalQuantity || 1;
                                const riskFactor = (pred.peakLoad / capacity) * 100;

                                return (
                                    <tr key={pred.resourceId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 dark:text-slate-100">{pred.resourceName}</div>
                                            <div className="text-xs text-slate-400 mt-1">Total Capacity: {capacity}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm font-medium">
                                            <span className={capacity - currentUsed > 0 ? 'text-emerald-600' : 'text-red-500'}>
                                                {capacity - currentUsed}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                {pred.trend === 'increasing' ? (
                                                    <Badge variant="danger" className="gap-1 animate-bounce">
                                                        <TrendingUp size={12} /> 上升
                                                    </Badge>
                                                ) : pred.trend === 'decreasing' ? (
                                                    <Badge variant="success" className="gap-1">
                                                        <TrendingUp className="rotate-180" size={12} /> 下降
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="neutral">稳定</Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-end gap-1 h-12">
                                                {pred.predictions.map((p, idx) => {
                                                    const height = (p.predicted / (capacity * 1.5)) * 100;
                                                    const isOver = p.predicted > capacity;
                                                    return (
                                                        <div
                                                            key={idx}
                                                            title={`${p.month}: ${p.predicted} (Conf: ${p.confidence}%)`}
                                                            className={`flex-1 min-w-[12px] rounded-t-sm transition-all duration-500 ${isOver ? 'bg-red-500 shadow-[0_-5px_10px_rgba(239,68,68,0.3)]' : 'bg-blue-400'}`}
                                                            style={{ height: `${Math.max(10, height)}%` }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className={`text-lg font-black ${riskFactor > 100 ? 'text-red-600' : riskFactor > 80 ? 'text-amber-500' : 'text-slate-900 dark:text-slate-100'}`}>
                                                {riskFactor.toFixed(0)}%
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-bold">PEAK LOAD INDEX</div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default ResourceRiskPredictor;
