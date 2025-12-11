import React, { useMemo } from 'react';
import { Risk } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { calculateRiskPriority } from '../utils/riskManagement';

interface RiskHeatmapProps {
    risks: Risk[];
    months?: number; // Number of months to display (default: 6)
}

const RiskHeatmap: React.FC<RiskHeatmapProps> = ({ risks, months = 6 }) => {
    const heatmapData = useMemo(() => {
        const today = new Date();
        const startDate = subMonths(startOfMonth(today), months - 1);
        const endDate = endOfMonth(today);

        // Generate all days in the range
        const allDays = eachDayOfInterval({ start: startDate, end: endDate });

        // Calculate risk score for each day
        return allDays.map((date) => {
            // Find risks that were active on this date
            const activeRisks = risks.filter((risk) => {
                const identifiedDate = new Date(risk.identifiedDate);
                const resolvedDate = risk.resolvedDate ? new Date(risk.resolvedDate) : null;

                // Risk is active if identified before or on this date, and not yet resolved
                return identifiedDate <= date && (!resolvedDate || resolvedDate > date);
            });

            // Calculate total risk score for the day
            const totalScore = activeRisks.reduce((sum, risk) => sum + risk.riskScore, 0);
            const avgScore = activeRisks.length > 0 ? totalScore / activeRisks.length : 0;

            // Count by priority
            const critical = activeRisks.filter((r) => r.priority === 'critical').length;
            const high = activeRisks.filter((r) => r.priority === 'high').length;
            const medium = activeRisks.filter((r) => r.priority === 'medium').length;
            const low = activeRisks.filter((r) => r.priority === 'low').length;

            return {
                date,
                count: activeRisks.length,
                avgScore,
                critical,
                high,
                medium,
                low,
            };
        });
    }, [risks, months]);

    // Group by month and week
    const monthlyData = useMemo(() => {
        const months: Map<string, typeof heatmapData> = new Map();

        heatmapData.forEach((day) => {
            const monthKey = format(day.date, 'yyyy-MM');
            if (!months.has(monthKey)) {
                months.set(monthKey, []);
            }
            months.get(monthKey)!.push(day);
        });

        return Array.from(months.entries()).map(([monthKey, days]) => ({
            month: monthKey,
            monthLabel: format(new Date(monthKey + '-01'), 'yyyy年MM月'),
            days,
        }));
    }, [heatmapData]);

    const getHeatColor = (avgScore: number, count: number) => {
        if (count === 0) return 'bg-slate-100 dark:bg-slate-800';
        if (avgScore >= 16) return 'bg-red-600';
        if (avgScore >= 12) return 'bg-red-500';
        if (avgScore >= 10) return 'bg-orange-500';
        if (avgScore >= 7) return 'bg-orange-400';
        if (avgScore >= 5) return 'bg-yellow-400';
        if (avgScore >= 3) return 'bg-yellow-300';
        return 'bg-green-300';
    };

    const maxCount = Math.max(...heatmapData.map((d) => d.count), 1);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                    风险热力图（时间维度）
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    过去 {months} 个月的风险分布和强度变化
                </p>
            </div>

            {/* Heatmap */}
            <div className="space-y-6 overflow-x-auto">
                {monthlyData.map((monthData) => (
                    <div key={monthData.month}>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                            {monthData.monthLabel}
                        </h4>
                        <div className="grid grid-cols-7 gap-1">
                            {/* Weekday headers */}
                            {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                                <div
                                    key={day}
                                    className="text-xs text-center text-slate-500 dark:text-slate-400 font-medium pb-1"
                                >
                                    {day}
                                </div>
                            ))}

                            {/* Add empty cells for alignment */}
                            {Array.from({ length: monthData.days[0].date.getDay() }).map((_, i) => (
                                <div key={`empty-${i}`} />
                            ))}

                            {/* Day cells */}
                            {monthData.days.map((day) => {
                                const heatColor = getHeatColor(day.avgScore, day.count);
                                const isToday = isSameDay(day.date, new Date());

                                return (
                                    <div
                                        key={day.date.toISOString()}
                                        className="group relative"
                                        title={`${format(day.date, 'yyyy-MM-dd')}: ${day.count} 个风险`}
                                    >
                                        <div
                                            className={`aspect-square rounded ${heatColor} ${isToday ? 'ring-2 ring-blue-500' : ''
                                                } transition-transform hover:scale-110 cursor-pointer`}
                                        />

                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                            <div className="bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl min-w-[200px]">
                                                <div className="font-semibold mb-2">
                                                    {format(day.date, 'yyyy年MM月dd日')}
                                                </div>
                                                <div className="space-y-1">
                                                    <div>活跃风险: {day.count} 个</div>
                                                    {day.count > 0 && (
                                                        <>
                                                            <div>平均分数: {day.avgScore.toFixed(1)}</div>
                                                            <div className="pt-1 border-t border-slate-700">
                                                                {day.critical > 0 && (
                                                                    <div className="text-red-400">
                                                                        极高: {day.critical}
                                                                    </div>
                                                                )}
                                                                {day.high > 0 && (
                                                                    <div className="text-orange-400">
                                                                        高: {day.high}
                                                                    </div>
                                                                )}
                                                                {day.medium > 0 && (
                                                                    <div className="text-yellow-400">
                                                                        中: {day.medium}
                                                                    </div>
                                                                )}
                                                                {day.low > 0 && (
                                                                    <div className="text-green-400">
                                                                        低: {day.low}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-2">风险强度</p>
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-500 dark:text-slate-400">低</span>
                            <div className="w-4 h-4 bg-green-300 rounded"></div>
                            <div className="w-4 h-4 bg-yellow-300 rounded"></div>
                            <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                            <div className="w-4 h-4 bg-orange-400 rounded"></div>
                            <div className="w-4 h-4 bg-orange-500 rounded"></div>
                            <div className="w-4 h-4 bg-red-500 rounded"></div>
                            <div className="w-4 h-4 bg-red-600 rounded"></div>
                            <span className="text-xs text-slate-500 dark:text-slate-400">高</span>
                        </div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-slate-100 dark:bg-slate-800 rounded"></div>
                            <span>无风险</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">最高风险日</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        {maxCount} 个
                    </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">平均活跃风险</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        {(heatmapData.reduce((sum, d) => sum + d.count, 0) / heatmapData.length).toFixed(1)}
                    </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">无风险天数</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        {heatmapData.filter((d) => d.count === 0).length}
                    </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">高风险天数</p>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                        {heatmapData.filter((d) => d.avgScore >= 10).length}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RiskHeatmap;
