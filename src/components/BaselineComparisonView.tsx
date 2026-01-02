import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';
import type { Project, ProjectBaseline } from '../types';
import { compareWithBaseline } from '../utils/baselineComparison';
import { Card, Badge } from './ui';

interface BaselineComparisonViewProps {
    project: Project;
    baseline: ProjectBaseline;
}

export const BaselineComparisonView: React.FC<BaselineComparisonViewProps> = ({
    project,
    baseline,
}) => {
    const comparison = useMemo(
        () => compareWithBaseline(project, baseline),
        [project, baseline]
    );

    const getVarianceIcon = (variance: number) => {
        if (variance > 0) return <TrendingUp className="w-4 h-4 text-red-600 dark:text-red-400" />;
        if (variance < 0) return <TrendingDown className="w-4 h-4 text-green-600 dark:text-green-400" />;
        return <Minus className="w-4 h-4 text-slate-400" />;
    };

    const getVarianceColor = (variance: number) => {
        if (Math.abs(variance) < 5) return 'text-slate-600 dark:text-slate-400';
        return variance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
    };

    const getHealthBadge = () => {
        const health = comparison.performanceIndicators.overallHealth;
        if (health === 'good') {
            return (
                <Badge variant="success">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    健康
                </Badge>
            );
        }
        if (health === 'warning') {
            return (
                <Badge variant="warning">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    需关注
                </Badge>
            );
        }
        return (
            <Badge variant="danger">
                <AlertTriangle className="w-3 h-3 mr-1" />
                严重偏离
            </Badge>
        );
    };

    return (
        <div className="space-y-4">
            {/* 头部信息 */}
            <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            基线对比分析
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            基线: {comparison.baselineName}
                        </p>
                    </div>
                    {getHealthBadge()}
                </div>

                {/* 绩效指标 */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">进度绩效指数 (SPI)</p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                            {comparison.performanceIndicators.SPI.toFixed(2)}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            {comparison.performanceIndicators.SPI >= 1 ? '✅ 进度正常' : '⚠️ 进度落后'}
                        </p>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                        <p className="text-xs text-green-700 dark:text-green-300 mb-1">成本绩效指数 (CPI)</p>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                            {comparison.performanceIndicators.CPI.toFixed(2)}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            {comparison.performanceIndicators.CPI >= 1 ? '✅ 成本可控' : '⚠️ 成本超支'}
                        </p>
                    </div>
                </div>
            </Card>

            {/* 详细对比 */}
            <Card className="p-4">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    详细对比
                </h4>

                <div className="space-y-3">
                    {/* 任务数对比 */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-2">
                            {getVarianceIcon(comparison.variances.taskVariance)}
                            <span className="text-sm text-slate-700 dark:text-slate-300">任务数</span>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {comparison.currentState.totalTasks}
                                <span className="text-xs text-slate-500 ml-1">
                                    (基线: {comparison.baselineState.totalTasks})
                                </span>
                            </p>
                            <p className={`text-xs ${getVarianceColor(comparison.variances.taskVariance)}`}>
                                {comparison.variances.taskVariance > 0 ? '+' : ''}
                                {comparison.variances.taskVariance}
                            </p>
                        </div>
                    </div>

                    {/* 工时对比 */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-2">
                            {getVarianceIcon(comparison.variances.effortVariance)}
                            <span className="text-sm text-slate-700 dark:text-slate-300">总工时</span>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {comparison.currentState.totalEffort}h
                                <span className="text-xs text-slate-500 ml-1">
                                    (基线: {comparison.baselineState.totalEffort}h)
                                </span>
                            </p>
                            <p className={`text-xs ${getVarianceColor(comparison.variances.effortVariance)}`}>
                                {comparison.variances.effortVariance > 0 ? '+' : ''}
                                {comparison.variances.effortVariance}h
                            </p>
                        </div>
                    </div>

                    {/* 成本对比 */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-2">
                            {getVarianceIcon(comparison.variances.costVariance)}
                            <span className="text-sm text-slate-700 dark:text-slate-300">成本</span>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                ¥{comparison.currentState.actualCost.toLocaleString()}
                                <span className="text-xs text-slate-500 ml-1">
                                    (基线: ¥{comparison.baselineState.plannedCost.toLocaleString()})
                                </span>
                            </p>
                            <p className={`text-xs ${getVarianceColor(comparison.variances.costVariance)}`}>
                                {comparison.variances.costVariance > 0 ? '+' : ''}¥
                                {comparison.variances.costVariance.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* 进度对比 */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-2">
                            {getVarianceIcon(comparison.variances.scheduleVarianceDays)}
                            <span className="text-sm text-slate-700 dark:text-slate-300">结束日期</span>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {comparison.currentState.endDate}
                                <span className="text-xs text-slate-500 ml-1">
                                    (基线: {comparison.baselineState.endDate})
                                </span>
                            </p>
                            <p className={`text-xs ${getVarianceColor(comparison.variances.scheduleVarianceDays)}`}>
                                {comparison.variances.scheduleVarianceDays > 0 ? '+' : ''}
                                {comparison.variances.scheduleVarianceDays}天
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* 建议 */}
            {comparison.performanceIndicators.overallHealth !== 'good' && (
                <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                    <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                        💡 改进建议
                    </h4>
                    <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                        {comparison.performanceIndicators.SPI < 0.9 && (
                            <li>• 进度落后，建议增加资源或调整范围</li>
                        )}
                        {comparison.performanceIndicators.CPI < 0.9 && (
                            <li>• 成本超支，需要审查预算和资源使用</li>
                        )}
                        {comparison.variances.scheduleVarianceDays > 14 && (
                            <li>• 严重延期，建议重新评估项目计划</li>
                        )}
                        {comparison.variances.taskVariance > 10 && (
                            <li>• 范围蔓延严重，建议启用变更控制流程</li>
                        )}
                    </ul>
                </Card>
            )}
        </div>
    );
};

export default BaselineComparisonView;
