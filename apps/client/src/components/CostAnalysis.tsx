import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { calculatePortfolioCost, analyzeBudget, generateCostOptimizationSuggestions } from '../utils/costAnalysis';
import { DollarSign, TrendingUp, TrendingDown, Lightbulb, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    LineChart, Line, Legend, PieChart, Pie
} from 'recharts';
import { addMonths, format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

interface CostAnalysisProps {
    totalBudget?: number;
}

const CostAnalysis: React.FC<CostAnalysisProps> = ({ totalBudget }) => {
    const { projects, resourcePool } = useStore();
    const { t } = useTranslation();

    const portfolioCost = useMemo(() => {
        return calculatePortfolioCost(projects, resourcePool);
    }, [projects, resourcePool]);

    const budgetAnalysis = useMemo(() => {
        return analyzeBudget(projects, resourcePool, totalBudget);
    }, [projects, resourcePool, totalBudget]);

    const optimizationSuggestions = useMemo(() => {
        return generateCostOptimizationSuggestions(projects, resourcePool);
    }, [projects, resourcePool]);

    // 准备柱状图数据 (Top Projects)
    const projectCostData = portfolioCost.projectCosts
        .sort((a, b) => b.totalCost - a.totalCost)
        .slice(0, 10)
        .map(pc => ({
            name: pc.projectName.length > 15 ? pc.projectName.substring(0, 15) + '...' : pc.projectName,
            cost: parseFloat(pc.totalCost.toFixed(0))
        }));

    // 准备饼图数据 (Resource Distribution)
    const resourceCostData = portfolioCost.resourceUtilizationCost
        .sort((a, b) => b.totalCost - a.totalCost)
        .map(rc => ({
            name: rc.resourceName,
            value: parseFloat(rc.totalCost.toFixed(0))
        }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    // 准备 S-Curve 数据 (Cumulative Cost)
    const sCurveData = useMemo(() => {
        const months = 12;
        const start = startOfMonth(new Date());
        const data = [];
        let cumulativeCost = 0;
        let cumulativeBudget = 0; // Assuming linear budget distribution for simplicity or based on project duration

        for (let i = 0; i < months; i++) {
            const currentDate = addMonths(start, i);
            const monthStart = startOfMonth(currentDate);
            const monthEnd = endOfMonth(currentDate);
            const monthLabel = format(currentDate, 'MMM');

            let monthlyCost = 0;

            projects.forEach(p => {
                if (!p.startDate || !p.endDate) return;
                const pStart = parseISO(p.startDate);
                const pEnd = parseISO(p.endDate);

                // Simple check if project is active in this month
                if (pStart <= monthEnd && pEnd >= monthStart) {
                    // Calculate monthly cost for this project
                    // This is a simplified estimation: total cost / duration in months
                    const durationMonths = Math.max(1, (pEnd.getTime() - pStart.getTime()) / (1000 * 60 * 60 * 24 * 30));
                    const projectTotalCost = portfolioCost.projectCosts.find(pc => pc.projectId === p.id)?.totalCost || 0;
                    monthlyCost += projectTotalCost / durationMonths;
                }
            });

            cumulativeCost += monthlyCost;
            // Linear budget accumulation for demo
            cumulativeBudget += (budgetAnalysis.totalBudget / 12);

            data.push({
                name: monthLabel,
                actual: Math.round(cumulativeCost),
                budget: Math.round(cumulativeBudget)
            });
        }
        return data;
    }, [projects, portfolioCost, budgetAnalysis.totalBudget]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'under': return 'from-blue-500 to-cyan-500';
            case 'on-track': return 'from-green-500 to-emerald-500';
            case 'over': return 'from-red-500 to-orange-500';
            default: return 'from-slate-500 to-gray-500';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'under': return <TrendingDown className="text-blue-600" size={28} />;
            case 'on-track': return <DollarSign className="text-green-600" size={28} />;
            case 'over': return <TrendingUp className="text-red-600" size={28} />;
            default: return <DollarSign className="text-slate-600" size={28} />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Budget Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <DollarSign className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">{t('cost.totalBudget')}</p>
                            <h3 className="text-2xl font-bold text-slate-900">
                                ${budgetAnalysis.totalBudget.toLocaleString()}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <TrendingUp className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">{t('cost.totalCost')}</p>
                            <h3 className="text-2xl font-bold text-slate-900">
                                ${budgetAnalysis.totalCost.toLocaleString()}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <DollarSign className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">{t('cost.remaining')}</p>
                            <h3 className="text-2xl font-bold text-slate-900">
                                ${budgetAnalysis.remaining.toLocaleString()}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className={`bg-gradient-to-br ${getStatusColor(budgetAnalysis.status)} p-6 rounded-2xl shadow-lg`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-white/20 rounded-xl">
                            {getStatusIcon(budgetAnalysis.status)}
                        </div>
                        <div>
                            <p className="text-sm text-white/90 font-medium">{t('cost.utilization')}</p>
                            <h3 className="text-2xl font-bold text-white">
                                {budgetAnalysis.utilizationRate.toFixed(1)}%
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Charts Row 1: S-Curve & Top Projects */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cost S-Curve */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-900">累计成本预测 (S-Curve)</h3>
                        <Activity className="text-slate-400" size={20} />
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sCurveData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                                <YAxis tick={{ fill: '#64748b' }} tickFormatter={(value) => `$${value / 1000}k`} />
                                <Tooltip
                                    formatter={(value: number) => `$${value.toLocaleString()}`}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="budget" name="预算基线" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="actual" name="预测成本" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Project Costs */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-900">{t('cost.topProjectCosts')}</h3>
                        <TrendingUp className="text-slate-400" size={20} />
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={projectCostData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                <XAxis type="number" tick={{ fill: '#64748b' }} tickFormatter={(value) => `$${value / 1000}k`} />
                                <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 12 }} width={100} />
                                <Tooltip
                                    formatter={(value: number) => `$${value.toLocaleString()}`}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                                    {projectCostData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={index < 3 ? '#3b82f6' : '#94a3b8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Main Charts Row 2: Resource Distribution & Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Resource Cost Distribution */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-1">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-900">资源成本分布</h3>
                        <PieChartIcon className="text-slate-400" size={20} />
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={resourceCostData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {resourceCostData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => `$${value.toLocaleString()}`}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recommendations & Over Budget */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Over Budget Projects Alert */}
                    {budgetAnalysis.projectsOverBudget.length > 0 && (
                        <div className="bg-red-50 p-6 rounded-2xl border-2 border-red-200">
                            <div className="flex items-center gap-3 mb-4">
                                <TrendingUp className="text-red-600" size={24} />
                                <h3 className="text-lg font-bold text-red-900">{t('cost.overBudgetProjects')}</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {budgetAnalysis.projectsOverBudget.map(proj => (
                                    <div key={proj.projectId} className="bg-white p-4 rounded-xl border border-red-300 shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-slate-900">{proj.projectName}</h4>
                                                <div className="text-sm text-slate-600 mt-1">
                                                    <div>{t('cost.budget')}: <span className="font-medium">${proj.budget.toLocaleString()}</span></div>
                                                    <div>{t('cost.actual')}: <span className="font-medium">${proj.actualCost.toLocaleString()}</span></div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-red-600">
                                                    +${proj.variance.toLocaleString()}
                                                </div>
                                                <div className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full inline-block mt-1">
                                                    {((proj.variance / proj.budget) * 100).toFixed(1)}% {t('cost.over')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AI Recommendations */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <Lightbulb className="text-yellow-500" size={24} />
                            <h3 className="text-lg font-bold text-slate-900">{t('cost.recommendations')}</h3>
                        </div>
                        <div className="space-y-3">
                            {[...budgetAnalysis.recommendations, ...optimizationSuggestions].slice(0, 5).map((rec, idx) => (
                                <div key={idx} className="flex gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                    <div className="text-xl">💡</div>
                                    <p className="text-sm text-slate-700 flex-1 font-medium">{rec}</p>
                                </div>
                            ))}
                            {budgetAnalysis.recommendations.length === 0 && optimizationSuggestions.length === 0 && (
                                <p className="text-slate-500 text-center py-4">{t('cost.noRecommendations')}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CostAnalysis;
