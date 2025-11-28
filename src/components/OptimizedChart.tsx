/**
 * Optimized Chart Wrapper Component
 * Implements performance optimizations for Recharts
 */

import React, { memo, useMemo } from 'react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface OptimizedChartProps {
    type: 'bar' | 'line' | 'pie';
    data: any[];
    dataKey?: string;
    xKey?: string;
    colors?: string[];
    height?: number;
    showGrid?: boolean;
    showLegend?: boolean;
    showTooltip?: boolean;
    animate?: boolean;
}

// Memoized custom tooltip
const CustomTooltip = memo<{ active?: boolean; payload?: any[]; label?: string }>(
    ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;

        return (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                {label && <p className="font-semibold text-slate-900 mb-1">{label}</p>}
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: <span className="font-semibold">{entry.value}</span>
                    </p>
                ))}
            </div>
        );
    }
);

CustomTooltip.displayName = 'CustomTooltip';

const OptimizedChart: React.FC<OptimizedChartProps> = memo(
    ({
        type,
        data,
        dataKey = 'value',
        xKey = 'name',
        colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        height = 300,
        showGrid = true,
        showLegend = true,
        showTooltip = true,
        animate = true,
    }) => {
        // Memoize processed data to avoid recalculation
        const processedData = useMemo(() => {
            if (!data || data.length === 0) return [];

            // Limit data points for performance (max 100 points)
            if (data.length > 100) {
                const step = Math.ceil(data.length / 100);
                return data.filter((_, index) => index % step === 0);
            }

            return data;
        }, [data]);

        // Memoize chart config
        const chartConfig = useMemo(
            () => ({
                margin: { top: 5, right: 30, left: 20, bottom: 5 },
                animationDuration: animate ? 300 : 0,
            }),
            [animate]
        );

        if (!processedData || processedData.length === 0) {
            return (
                <div
                    className="flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200"
                    style={{ height }}
                >
                    <p className="text-slate-400">No data available</p>
                </div>
            );
        }

        const renderChart = () => {
            switch (type) {
                case 'bar':
                    return (
                        <BarChart data={processedData} {...chartConfig}>
                            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
                            <XAxis dataKey={xKey} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                            {showTooltip && <Tooltip content={<CustomTooltip />} />}
                            {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
                            <Bar
                                dataKey={dataKey}
                                fill={colors[0]}
                                radius={[4, 4, 0, 0]}
                                animationDuration={chartConfig.animationDuration}
                            />
                        </BarChart>
                    );

                case 'line':
                    return (
                        <LineChart data={processedData} {...chartConfig}>
                            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
                            <XAxis dataKey={xKey} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                            {showTooltip && <Tooltip content={<CustomTooltip />} />}
                            {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
                            <Line
                                type="monotone"
                                dataKey={dataKey}
                                stroke={colors[0]}
                                strokeWidth={2}
                                dot={{ fill: colors[0], r: 4 }}
                                activeDot={{ r: 6 }}
                                animationDuration={chartConfig.animationDuration}
                            />
                        </LineChart>
                    );

                case 'pie':
                    return (
                        <PieChart>
                            <Pie
                                data={processedData}
                                dataKey={dataKey}
                                nameKey={xKey}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label
                                animationDuration={chartConfig.animationDuration}
                            >
                                {processedData.map((_: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                            </Pie>
                            {showTooltip && <Tooltip content={<CustomTooltip />} />}
                            {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
                        </PieChart>
                    );

                default:
                    return null;
            }
        };

        return (
            <ResponsiveContainer width="100%" height={height}>
                {renderChart()}
            </ResponsiveContainer>
        );
    },
    (prevProps, nextProps) => {
        // Custom comparison for better performance
        return (
            prevProps.type === nextProps.type &&
            prevProps.data === nextProps.data &&
            prevProps.dataKey === nextProps.dataKey &&
            prevProps.xKey === nextProps.xKey &&
            prevProps.height === nextProps.height &&
            prevProps.animate === nextProps.animate
        );
    }
);

OptimizedChart.displayName = 'OptimizedChart';

export default OptimizedChart;

// Export helper function to prepare chart data
export function prepareChartData<T extends Record<string, any>>(
    items: T[],
    xKey: keyof T,
    yKey: keyof T,
    limit: number = 100
): Array<{ name: string; value: number }> {
    const data = items.map((item) => ({
        name: String(item[xKey]),
        value: Number(item[yKey]) || 0,
    }));

    // Limit data points
    if (data.length > limit) {
        const step = Math.ceil(data.length / limit);
        return data.filter((_, index) => index % step === 0);
    }

    return data;
}
