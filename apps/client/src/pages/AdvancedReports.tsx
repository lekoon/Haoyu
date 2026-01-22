import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { FileText, Download, Filter, Calendar, BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

type ReportType = 'overview' | 'resource' | 'cost' | 'timeline' | 'performance';
type ChartType = 'bar' | 'line' | 'pie' | 'radar';

const AdvancedReports: React.FC = () => {
    const { projects, resourcePool } = useStore();
    const { t } = useTranslation();

    const [selectedReport, setSelectedReport] = useState<ReportType>('overview');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedChart, setSelectedChart] = useState<ChartType>('bar');

    // 项目状态分布数据
    const statusData = useMemo(() => {
        const counts = {
            planning: 0,
            active: 0,
            'on-hold': 0,
            completed: 0
        };
        projects.forEach(p => {
            counts[p.status as keyof typeof counts]++;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [projects]);

    // 优先级分布数据
    const priorityData = useMemo(() => {
        const counts = { P0: 0, P1: 0, P2: 0, P3: 0 };
        projects.forEach(p => {
            const priority = p.priority || 'P2';
            counts[priority as keyof typeof counts]++;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [projects]);

    // 资源利用率数据
    const resourceUtilizationData = useMemo(() => {
        return resourcePool.map(resource => {
            let allocated = 0;
            projects.forEach(project => {
                (project.resourceRequirements || []).forEach(req => {
                    if (req.resourceId === resource.id) {
                        allocated += req.count;
                    }
                });
            });
            return {
                name: resource.name,
                allocated,
                total: resource.totalQuantity,
                utilization: (allocated / resource.totalQuantity) * 100
            };
        });
    }, [projects, resourcePool]);

    // 项目评分分布
    const scoreDistributionData = useMemo(() => {
        const ranges = [
            { name: '0-3', min: 0, max: 3, count: 0 },
            { name: '3-5', min: 3, max: 5, count: 0 },
            { name: '5-7', min: 5, max: 7, count: 0 },
            { name: '7-9', min: 7, max: 9, count: 0 },
            { name: '9-10', min: 9, max: 10, count: 0 }
        ];
        projects.forEach(p => {
            const score = p.score || 0;
            const range = ranges.find(r => score >= r.min && score < r.max);
            if (range) range.count++;
        });
        return ranges;
    }, [projects]);

    // 成本分析数据
    const costAnalysisData = useMemo(() => {
        return projects.map(p => ({
            name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
            cost: p.estimatedCost || 0,
            priority: p.priority || 'P2'
        })).sort((a, b) => b.cost - a.cost).slice(0, 10);
    }, [projects]);

    // 雷达图数据 - 项目健康度
    const healthRadarData = useMemo(() => {
        const avgScore = projects.reduce((sum, p) => sum + (p.score || 0), 0) / projects.length || 0;
        const activeRate = (projects.filter(p => p.status === 'active').length / projects.length) * 100 || 0;
        const avgUtilization = resourceUtilizationData.reduce((sum, r) => sum + r.utilization, 0) / resourceUtilizationData.length || 0;
        const onTimeRate = 80; // 模拟数据
        const budgetCompliance = 75; // 模拟数据

        return [
            { subject: t('reports.projectScore'), value: (avgScore / 10) * 100, fullMark: 100 },
            { subject: t('reports.activeRate'), value: activeRate, fullMark: 100 },
            { subject: t('reports.resourceUtilization'), value: avgUtilization, fullMark: 100 },
            { subject: t('reports.onTimeDelivery'), value: onTimeRate, fullMark: 100 },
            { subject: t('reports.budgetCompliance'), value: budgetCompliance, fullMark: 100 }
        ];
    }, [projects, resourceUtilizationData, t]);

    const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

    const handleExportReport = () => {
        alert(t('reports.exportingReport'));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{t('reports.advancedReports')}</h1>
                    <p className="text-slate-500 mt-1">{t('reports.comprehensiveAnalytics')}</p>
                </div>
                <button
                    onClick={handleExportReport}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    <Download size={18} />
                    {t('reports.exportReport')}
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <Filter size={16} className="inline mr-1" />
                            {t('reports.reportType')}
                        </label>
                        <select
                            value={selectedReport}
                            onChange={(e) => setSelectedReport(e.target.value as ReportType)}
                            className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="overview">{t('reports.overview')}</option>
                            <option value="resource">{t('reports.resourceAnalysis')}</option>
                            <option value="cost">{t('reports.costAnalysis')}</option>
                            <option value="timeline">{t('reports.timelineAnalysis')}</option>
                            <option value="performance">{t('reports.performanceMetrics')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <Calendar size={16} className="inline mr-1" />
                            {t('reports.startDate')}
                        </label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <Calendar size={16} className="inline mr-1" />
                            {t('reports.endDate')}
                        </label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <BarChart3 size={16} className="inline mr-1" />
                            {t('reports.chartType')}
                        </label>
                        <select
                            value={selectedChart}
                            onChange={(e) => setSelectedChart(e.target.value as ChartType)}
                            className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="bar">{t('reports.barChart')}</option>
                            <option value="line">{t('reports.lineChart')}</option>
                            <option value="pie">{t('reports.pieChart')}</option>
                            <option value="radar">{t('reports.radarChart')}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Project Status Distribution */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <PieChartIcon size={20} className="text-blue-600" />
                        {t('reports.projectStatusDistribution')}
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {statusData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Priority Distribution */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <BarChart3 size={20} className="text-purple-600" />
                        {t('reports.priorityDistribution')}
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={priorityData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                            <YAxis tick={{ fill: '#64748b' }} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Resource Utilization */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-green-600" />
                        {t('reports.resourceUtilization')}
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={resourceUtilizationData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#64748b' }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="allocated" fill="#3b82f6" name={t('reports.allocated')} radius={[8, 8, 0, 0]} />
                            <Bar dataKey="total" fill="#e2e8f0" name={t('reports.total')} radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Project Health Radar */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <FileText size={20} className="text-orange-600" />
                        {t('reports.projectHealth')}
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={healthRadarData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b' }} />
                            <Radar name={t('reports.healthScore')} dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                            <Tooltip />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Score Distribution */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">{t('reports.scoreDistribution')}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={scoreDistributionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                            <YAxis tick={{ fill: '#64748b' }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="count" stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899', r: 5 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Cost Analysis */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">{t('reports.topCostProjects')}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={costAnalysisData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis type="number" tick={{ fill: '#64748b' }} />
                            <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 11 }} width={100} />
                            <Tooltip formatter={(value: number) => `¥${(value / 10000).toFixed(1)}万`} />
                            <Bar dataKey="cost" fill="#f59e0b" radius={[0, 8, 8, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Summary Statistics */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">{t('reports.summaryStatistics')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                        <p className="text-sm text-blue-600 mb-1">{t('reports.totalProjects')}</p>
                        <p className="text-3xl font-bold text-blue-700">{projects.length}</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                        <p className="text-sm text-green-600 mb-1">{t('reports.activeProjects')}</p>
                        <p className="text-3xl font-bold text-green-700">
                            {projects.filter(p => p.status === 'active').length}
                        </p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-xl">
                        <p className="text-sm text-purple-600 mb-1">{t('reports.avgScore')}</p>
                        <p className="text-3xl font-bold text-purple-700">
                            {(projects.reduce((sum, p) => sum + (p.score || 0), 0) / projects.length || 0).toFixed(1)}
                        </p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-xl">
                        <p className="text-sm text-orange-600 mb-1">{t('reports.totalResources')}</p>
                        <p className="text-3xl font-bold text-orange-700">
                            {resourcePool.reduce((sum, r) => sum + r.totalQuantity, 0)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedReports;
