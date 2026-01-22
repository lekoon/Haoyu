import React, { useMemo } from 'react';
import { AlertTriangle, TrendingUp, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { Project, ChangeRequest, ScopeCreepMetrics } from '../types';
import { calculateScopeCreepMetrics, generateScopeCreepWarning } from '../utils/scopeManagement';
import { Card, Badge } from './ui';

interface ScopeCreepMonitorProps {
    project: Project;
    changeRequests: ChangeRequest[];
}

export const ScopeCreepMonitor: React.FC<ScopeCreepMonitorProps> = ({
    project,
    changeRequests,
}) => {
    const metrics = useMemo(
        () => calculateScopeCreepMetrics(project, changeRequests),
        [project, changeRequests]
    );

    const warning = useMemo(
        () => generateScopeCreepWarning(metrics),
        [metrics]
    );

    const getCreepColor = (percentage: number) => {
        if (percentage < 10) return 'text-green-600 dark:text-green-400';
        if (percentage < 20) return 'text-yellow-600 dark:text-yellow-400';
        if (percentage < 30) return 'text-orange-600 dark:text-orange-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getCreepBgColor = (percentage: number) => {
        if (percentage < 10) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
        if (percentage < 20) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
        if (percentage < 30) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    };

    return (
        <div className="space-y-4">
            {/* Main Metrics Card */}
            <Card className={`border ${getCreepBgColor(metrics.creepPercentage)}`}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <TrendingUp className={`w-6 h-6 ${getCreepColor(metrics.creepPercentage)}`} />
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                范围蔓延指数
                            </h3>
                        </div>
                        {metrics.requiresRebaseline && (
                            <Badge variant="error">
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                需要重新基线
                            </Badge>
                        )}
                    </div>

                    {/* Creep Percentage */}
                    <div className="mb-6">
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className={`text-4xl font-bold ${getCreepColor(metrics.creepPercentage)}`}>
                                {metrics.creepPercentage.toFixed(1)}%
                            </span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                超出基线
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                            <div
                                className={`h-3 rounded-full transition-all ${metrics.creepPercentage < 10
                                        ? 'bg-green-500'
                                        : metrics.creepPercentage < 20
                                            ? 'bg-yellow-500'
                                            : metrics.creepPercentage < 30
                                                ? 'bg-orange-500'
                                                : 'bg-red-500'
                                    }`}
                                style={{ width: `${Math.min(metrics.creepPercentage, 100)}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <span>0%</span>
                            <span className="text-orange-500">30% 阈值</span>
                            <span>100%</span>
                        </div>
                    </div>

                    {/* Effort Hours Comparison */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-600 dark:text-slate-400">基线工时</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {metrics.baselineEffortHours.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500">小时</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-blue-500" />
                                <span className="text-sm text-slate-600 dark:text-slate-400">当前工时</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {metrics.currentEffortHours.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500">
                                +{(metrics.currentEffortHours - metrics.baselineEffortHours).toLocaleString()} 小时
                            </p>
                        </div>
                    </div>

                    {/* Change Requests Summary */}
                    <div className="grid grid-cols-4 gap-2">
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center">
                            <FileText className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                {metrics.totalChangeRequests}
                            </p>
                            <p className="text-xs text-slate-500">总变更</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                {metrics.approvedChanges}
                            </p>
                            <p className="text-xs text-slate-500">已批准</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center">
                            <Clock className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                            <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                                {metrics.pendingChanges}
                            </p>
                            <p className="text-xs text-slate-500">待审批</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center">
                            <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
                            <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                {metrics.rejectedChanges}
                            </p>
                            <p className="text-xs text-slate-500">已拒绝</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Warning Message */}
            {warning && (
                <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                                    范围蔓延警告
                                </h4>
                                <pre className="text-sm text-red-800 dark:text-red-200 whitespace-pre-wrap font-sans">
                                    {warning}
                                </pre>
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default ScopeCreepMonitor;
