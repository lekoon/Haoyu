/**
 * 三维散点矩阵图
 * Three-Dimensional Scatter Matrix
 * 
 * 同时展示三个核心指标:
 * - X轴: 事务吞吐量 (Throughput)
 * - Y轴: 事务前置时间 (Lead Time)
 * - Z轴 (气泡大小): 事务颗粒度 (Granularity)
 * - 颜色: 资源利用率 (红=高负荷, 黄=合理, 绿=低负荷, 蓝=优秀)
 */

import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import type { DeliveryMetrics } from '../../utils/deliveryMetrics';

interface ThreeDimensionalScatterMatrixProps {
    metrics: DeliveryMetrics[];
    timeRange: 'week' | 'month' | 'quarter';
}

const ThreeDimensionalScatterMatrix: React.FC<ThreeDimensionalScatterMatrixProps> = ({
    metrics,
    timeRange
}) => {
    // 准备散点图数据
    const scatterData = useMemo(() => {
        return metrics.map(m => ({
            name: m.projectName,
            throughput: m.throughput,
            leadTime: m.leadTime,
            granularity: m.granularity,
            utilization: m.resourceUtilization,
            size: Math.max(100, Math.min(1000, m.projectSize / 10)), // 气泡大小
            status: m.status
        }));
    }, [metrics]);

    // 获取颜色 (基于资源利用率)
    const getColor = (utilization: number) => {
        if (utilization > 95) return '#EF4444'; // 红色 - 超负荷
        if (utilization > 85) return '#F59E0B'; // 橙色 - 高负荷
        if (utilization >= 70) return '#10B981'; // 绿色 - 合理
        if (utilization >= 50) return '#3B82F6'; // 蓝色 - 正常
        return '#94A3B8'; // 灰色 - 低负荷
    };

    // 统计分析
    const stats = useMemo(() => {
        if (metrics.length === 0) return null;

        const avgThroughput = metrics.reduce((sum, m) => sum + m.throughput, 0) / metrics.length;
        const avgLeadTime = metrics.reduce((sum, m) => sum + m.leadTime, 0) / metrics.length;
        const avgUtilization = metrics.reduce((sum, m) => sum + m.resourceUtilization, 0) / metrics.length;

        const efficientCount = metrics.filter(m => m.status === 'efficient').length;
        const criticalCount = metrics.filter(m => m.status === 'critical').length;
        const warningCount = metrics.filter(m => m.status === 'warning').length;

        return {
            avgThroughput,
            avgLeadTime,
            avgUtilization,
            efficientCount,
            criticalCount,
            warningCount
        };
    }, [metrics]);

    // 自定义Tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-2">{data.name}</h4>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between gap-4">
                            <span className="text-slate-600">吞吐量:</span>
                            <span className="font-medium">{data.throughput.toFixed(2)} 事务/周</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-slate-600">前置时间:</span>
                            <span className="font-medium">{data.leadTime.toFixed(0)} 天</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-slate-600">任务颗粒度:</span>
                            <span className="font-medium">{data.granularity.toFixed(0)} 人天</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-slate-600">资源利用率:</span>
                            <span className={`font-medium ${data.utilization > 90 ? 'text-red-600' :
                                    data.utilization > 80 ? 'text-orange-600' :
                                        data.utilization >= 70 ? 'text-green-600' : 'text-blue-600'
                                }`}>
                                {data.utilization.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (!stats) {
        return (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
                <p className="text-slate-500">暂无数据</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="text-green-600" size={20} />
                        </div>
                        <span className="text-sm font-medium text-slate-600">高效项目</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{stats.efficientCount}</div>
                    <div className="text-xs text-slate-500 mt-1">运行良好</div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <AlertCircle className="text-yellow-600" size={20} />
                        </div>
                        <span className="text-sm font-medium text-slate-600">预警项目</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{stats.warningCount}</div>
                    <div className="text-xs text-slate-500 mt-1">需要关注</div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <TrendingDown className="text-red-600" size={20} />
                        </div>
                        <span className="text-sm font-medium text-slate-600">临界项目</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{stats.criticalCount}</div>
                    <div className="text-xs text-slate-500 mt-1">紧急处理</div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-5 shadow-lg text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-sm font-medium">平均吞吐量</span>
                    </div>
                    <div className="text-3xl font-bold">{stats.avgThroughput.toFixed(1)}</div>
                    <div className="text-xs text-blue-100 mt-1">事务/周</div>
                </div>
            </div>

            {/* 三维散点图 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">项目效率三维分析</h3>
                        <p className="text-sm text-slate-600 mt-1">
                            气泡大小代表项目规模，颜色代表资源利用率
                        </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-slate-600">超负荷 (&gt;95%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <span className="text-slate-600">高负荷 (85-95%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-slate-600">合理 (70-85%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="text-slate-600">正常 (50-70%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                            <span className="text-slate-600">低负荷 (&lt;50%)</span>
                        </div>
                    </div>
                </div>

                <div className="h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                            <XAxis
                                type="number"
                                dataKey="throughput"
                                name="吞吐量"
                                unit=" 事务/周"
                                tick={{ fill: '#64748B', fontSize: 12 }}
                                label={{
                                    value: '事务吞吐量 (事务/周)',
                                    position: 'bottom',
                                    offset: 40,
                                    style: { fill: '#475569', fontWeight: 600 }
                                }}
                            />
                            <YAxis
                                type="number"
                                dataKey="leadTime"
                                name="前置时间"
                                unit=" 天"
                                tick={{ fill: '#64748B', fontSize: 12 }}
                                label={{
                                    value: '前置时间 (天, P85)',
                                    angle: -90,
                                    position: 'left',
                                    offset: 40,
                                    style: { fill: '#475569', fontWeight: 600 }
                                }}
                            />
                            <ZAxis
                                type="number"
                                dataKey="size"
                                range={[100, 1000]}
                                name="项目规模"
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                            <Scatter
                                name="项目"
                                data={scatterData}
                                fillOpacity={0.7}
                            >
                                {scatterData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getColor(entry.utilization)} />
                                ))}
                            </Scatter>

                            {/* 参考线 - 平均值 */}
                            <line
                                x1="0"
                                y1={stats.avgLeadTime}
                                x2="100%"
                                y2={stats.avgLeadTime}
                                stroke="#94A3B8"
                                strokeDasharray="5 5"
                                strokeWidth={1}
                            />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>

                {/* 图表说明 */}
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <AlertCircle size={18} />
                        解读指南
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
                        <div>
                            <strong>理想区域:</strong> 高吞吐量 + 低前置时间 + 合理利用率 (70-85%)
                        </div>
                        <div>
                            <strong>优化目标:</strong> 将项目从右上角(低效)移向左下角(高效)
                        </div>
                        <div>
                            <strong>红色警示:</strong> 资源利用率超过95%，存在过载风险
                        </div>
                        <div>
                            <strong>气泡大小:</strong> 越大表示项目规模越大，需要更多关注
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThreeDimensionalScatterMatrix;
