import React, { useMemo } from 'react';
import type { Risk } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { calculateRiskScore } from '../utils/riskManagement';

interface RiskTrendChartProps {
    risks: Risk[];
}

const RiskTrendChart: React.FC<RiskTrendChartProps> = ({ risks }) => {
    // Generate trend data for the last 30 days
    const trendData = useMemo(() => {
        const today = new Date();
        const thirtyDaysAgo = subDays(today, 30);
        const dateRange = eachDayOfInterval({ start: thirtyDaysAgo, end: today });

        return dateRange.map((date) => {
            // Count risks identified by this date
            const risksAtDate = risks.filter((r) => new Date(r.identifiedDate) <= date);

            // Calculate active risks (not resolved/accepted)
            const activeRisks = risksAtDate.filter(
                (r) => !r.resolvedDate || new Date(r.resolvedDate) > date
            ).filter((r) => r.status !== 'resolved' && r.status !== 'accepted');

            // Count by priority
            const critical = activeRisks.filter((r) => r.priority === 'critical').length;
            const high = activeRisks.filter((r) => r.priority === 'high').length;
            const medium = activeRisks.filter((r) => r.priority === 'medium').length;
            const low = activeRisks.filter((r) => r.priority === 'low').length;

            // Calculate average risk score
            const avgRiskScore =
                activeRisks.length > 0
                    ? activeRisks.reduce((sum, r) => sum + r.riskScore, 0) / activeRisks.length
                    : 0;

            return {
                date: format(date, 'MM-dd'),
                fullDate: format(date, 'yyyy-MM-dd'),
                total: activeRisks.length,
                critical,
                high,
                medium,
                low,
                avgScore: Math.round(avgRiskScore * 10) / 10,
            };
        });
    }, [risks]);

    // Calculate trend direction
    const trendDirection = useMemo(() => {
        if (trendData.length < 2) return 'stable';
        const recent = trendData.slice(-7).reduce((sum, d) => sum + d.total, 0) / 7;
        const previous = trendData.slice(-14, -7).reduce((sum, d) => sum + d.total, 0) / 7;

        if (recent > previous * 1.1) return 'increasing';
        if (recent < previous * 0.9) return 'decreasing';
        return 'stable';
    }, [trendData]);

    const getTrendColor = () => {
        switch (trendDirection) {
            case 'increasing':
                return 'text-red-600';
            case 'decreasing':
                return 'text-green-600';
            default:
                return 'text-blue-600';
        }
    };

    const getTrendIcon = () => {
        switch (trendDirection) {
            case 'increasing':
                return '📈';
            case 'decreasing':
                return '📉';
            default:
                return '➡️';
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">风险趋势分析</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">过去 30 天的风险变化趋势</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 ${getTrendColor()}`}>
                    <span className="text-2xl">{getTrendIcon()}</span>
                    <div>
                        <div className="text-xs font-medium">趋势</div>
                        <div className="text-sm font-bold">
                            {trendDirection === 'increasing' && '上升'}
                            {trendDirection === 'decreasing' && '下降'}
                            {trendDirection === 'stable' && '稳定'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Risk Count Trend */}
            <div className="mb-8">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">活跃风险数量趋势</h4>
                <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={trendData}>
                        <defs>
                            <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#eab308" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                            }}
                        />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="critical"
                            stackId="1"
                            stroke="#ef4444"
                            fillOpacity={1}
                            fill="url(#colorCritical)"
                            name="极高风险"
                        />
                        <Area
                            type="monotone"
                            dataKey="high"
                            stackId="1"
                            stroke="#f97316"
                            fillOpacity={1}
                            fill="url(#colorHigh)"
                            name="高风险"
                        />
                        <Area
                            type="monotone"
                            dataKey="medium"
                            stackId="1"
                            stroke="#eab308"
                            fillOpacity={1}
                            fill="url(#colorMedium)"
                            name="中风险"
                        />
                        <Area
                            type="monotone"
                            dataKey="low"
                            stackId="1"
                            stroke="#22c55e"
                            fillOpacity={1}
                            fill="url(#colorLow)"
                            name="低风险"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Average Risk Score Trend */}
            <div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">平均风险分数趋势</h4>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#64748b" style={{ fontSize: '12px' }} domain={[0, 25]} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="avgScore"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', r: 4 }}
                            activeDot={{ r: 6 }}
                            name="平均风险分数"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Insights */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 趋势洞察</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    {trendDirection === 'increasing' && (
                        <li>• 风险数量呈上升趋势，建议加强风险识别和缓解措施</li>
                    )}
                    {trendDirection === 'decreasing' && (
                        <li>• 风险数量呈下降趋势，风险管理工作成效显著</li>
                    )}
                    {trendDirection === 'stable' && <li>• 风险数量保持稳定，持续监控即可</li>}
                    <li>
                        • 当前活跃风险: {trendData[trendData.length - 1]?.total || 0} 个，平均风险分数:{' '}
                        {trendData[trendData.length - 1]?.avgScore || 0}
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default RiskTrendChart;
