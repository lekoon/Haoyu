/**
 * 项目交付效率驱动的资源利用率可视化看板
 * Delivery Efficiency-Driven Resource Utilization Dashboard
 * 
 * 核心功能:
 * 1. 全局效率指标 - 三维散点矩阵图
 * 2. 资源-效率关联分析矩阵
 * 3. 实时监控预警系统
 * 4. 智能优化建议
 */

import React, { useState, useMemo } from 'react';
import { useProjects, useResourcePool } from '../../store/useStore';
import {
    Activity,
    AlertTriangle,
    TrendingUp,
    Zap,
    Target,
    Clock,
    BarChart3,
    Lightbulb,
    Filter,
    Download
} from 'lucide-react';
import ThreeDimensionalScatterMatrix from './ThreeDimensionalScatterMatrix';
import ResourceEfficiencyMatrix from './ResourceEfficiencyMatrix';
import RealTimeAlertSystem from './RealTimeAlertSystem';
import SmartOptimizationPanel from './SmartOptimizationPanel';
import { calculateDeliveryMetrics, type DeliveryMetrics } from '../../utils/deliveryMetrics';

const DeliveryEfficiencyDashboard: React.FC = () => {
    const projects = useProjects();
    const resourcePool = useResourcePool();
    const [selectedView, setSelectedView] = useState<'overview' | 'matrix' | 'alerts' | 'optimization'>('overview');
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

    // 计算交付效率指标
    const deliveryMetrics = useMemo(() => {
        return calculateDeliveryMetrics(projects, resourcePool, timeRange);
    }, [projects, resourcePool, timeRange]);

    // 核心KPI指标
    const kpiMetrics = useMemo(() => {
        const activeProjects = projects.filter(p => p.status === 'active');
        const totalThroughput = deliveryMetrics.reduce((sum, m) => sum + m.throughput, 0);
        const avgLeadTime = deliveryMetrics.length > 0
            ? deliveryMetrics.reduce((sum, m) => sum + m.leadTime, 0) / deliveryMetrics.length
            : 0;
        const avgUtilization = deliveryMetrics.length > 0
            ? deliveryMetrics.reduce((sum, m) => sum + m.resourceUtilization, 0) / deliveryMetrics.length
            : 0;
        const criticalProjects = deliveryMetrics.filter(m =>
            m.resourceUtilization > 90 || m.leadTime > 30
        ).length;

        return {
            totalProjects: activeProjects.length,
            totalThroughput,
            avgLeadTime,
            avgUtilization,
            criticalProjects
        };
    }, [projects, deliveryMetrics]);

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        资源交付效率看板
                    </h1>
                    <p className="text-slate-600 mt-2">
                        实时监控项目交付效率与资源利用率，驱动数据决策优化
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Time Range Selector */}
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as any)}
                        className="px-4 py-2 border border-slate-200 rounded-lg bg-white hover:border-blue-400 transition-colors"
                    >
                        <option value="week">本周</option>
                        <option value="month">本月</option>
                        <option value="quarter">本季度</option>
                    </select>

                    {/* Export Button */}
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <Download size={18} />
                        导出报告
                    </button>
                </div>
            </div>

            {/* Core KPI Cards - 6指标法则 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* 活跃项目数 */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Target size={24} />
                        </div>
                        <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
                            活跃项目
                        </span>
                    </div>
                    <div className="text-4xl font-bold mb-1">{kpiMetrics.totalProjects}</div>
                    <div className="text-sm text-blue-100">正在进行中</div>
                </div>

                {/* 事务吞吐量 */}
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Activity size={24} />
                        </div>
                        <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
                            吞吐量
                        </span>
                    </div>
                    <div className="text-4xl font-bold mb-1">{kpiMetrics.totalThroughput.toFixed(1)}</div>
                    <div className="text-sm text-green-100">事务/周</div>
                </div>

                {/* 平均前置时间 */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Clock size={24} />
                        </div>
                        <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
                            前置时间
                        </span>
                    </div>
                    <div className="text-4xl font-bold mb-1">{kpiMetrics.avgLeadTime.toFixed(0)}</div>
                    <div className="text-sm text-purple-100">天 (P85)</div>
                </div>

                {/* 平均资源利用率 */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
                            资源利用率
                        </span>
                    </div>
                    <div className="text-4xl font-bold mb-1">{kpiMetrics.avgUtilization.toFixed(0)}%</div>
                    <div className="text-sm text-orange-100">平均水平</div>
                </div>

                {/* 预警项目数 */}
                <div className={`bg-gradient-to-br ${kpiMetrics.criticalProjects > 0
                        ? 'from-red-500 to-red-600'
                        : 'from-slate-500 to-slate-600'
                    } rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <AlertTriangle size={24} />
                        </div>
                        <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
                            预警项目
                        </span>
                    </div>
                    <div className="text-4xl font-bold mb-1">{kpiMetrics.criticalProjects}</div>
                    <div className="text-sm text-red-100">需要关注</div>
                </div>
            </div>

            {/* View Selector Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2">
                <div className="flex gap-2">
                    <button
                        onClick={() => setSelectedView('overview')}
                        className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${selectedView === 'overview'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <BarChart3 className="inline mr-2" size={18} />
                        全局效率视图
                    </button>
                    <button
                        onClick={() => setSelectedView('matrix')}
                        className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${selectedView === 'matrix'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <Filter className="inline mr-2" size={18} />
                        关联分析矩阵
                    </button>
                    <button
                        onClick={() => setSelectedView('alerts')}
                        className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${selectedView === 'alerts'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <AlertTriangle className="inline mr-2" size={18} />
                        实时预警
                    </button>
                    <button
                        onClick={() => setSelectedView('optimization')}
                        className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${selectedView === 'optimization'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <Lightbulb className="inline mr-2" size={18} />
                        智能优化
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="min-h-[600px]">
                {selectedView === 'overview' && (
                    <ThreeDimensionalScatterMatrix
                        metrics={deliveryMetrics}
                        timeRange={timeRange}
                    />
                )}

                {selectedView === 'matrix' && (
                    <ResourceEfficiencyMatrix
                        projects={projects}
                        resourcePool={resourcePool}
                        metrics={deliveryMetrics}
                    />
                )}

                {selectedView === 'alerts' && (
                    <RealTimeAlertSystem
                        metrics={deliveryMetrics}
                        resourcePool={resourcePool}
                    />
                )}

                {selectedView === 'optimization' && (
                    <SmartOptimizationPanel
                        projects={projects}
                        resourcePool={resourcePool}
                        metrics={deliveryMetrics}
                    />
                )}
            </div>
        </div>
    );
};

export default DeliveryEfficiencyDashboard;
