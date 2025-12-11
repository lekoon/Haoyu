import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Network, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { Project, Risk } from '../types';
import { analyzeRiskCorrelations, analyzeProjectRiskImpacts } from '../utils/crossProjectRiskAnalysis';
import { getRiskCategoryInfo, getRiskPriorityColor } from '../utils/riskManagement';

interface CrossProjectRiskAnalysisProps {
    currentProject: Project;
    allProjects: Project[];
    currentRisk?: Risk;
}

const CrossProjectRiskAnalysis: React.FC<CrossProjectRiskAnalysisProps> = ({
    currentProject,
    allProjects,
    currentRisk,
}) => {
    // Analyze project-level impacts
    const projectImpacts = useMemo(() => {
        const impactMap = analyzeProjectRiskImpacts(allProjects);
        return impactMap.get(currentProject.id);
    }, [currentProject, allProjects]);

    // Analyze specific risk correlations if a risk is selected
    const riskCorrelations = useMemo(() => {
        if (!currentRisk) return null;
        return analyzeRiskCorrelations(currentRisk, currentProject, allProjects);
    }, [currentRisk, currentProject, allProjects]);

    return (
        <div className="space-y-6">
            {/* Project-Level Impact Analysis */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Network className="text-indigo-600 dark:text-indigo-400" size={20} />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        跨项目风险关联分析
                    </h3>
                </div>

                {projectImpacts && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Impacted By */}
                        <div>
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                                <TrendingUp size={16} className="text-orange-500" />
                                受其他项目影响
                            </h4>

                            {projectImpacts.impactedBy.length === 0 ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                                    暂无来自其他项目的风险影响
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {projectImpacts.impactedBy.map((impact) => (
                                        <motion.div
                                            key={impact.sourceProject.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="border border-orange-200 dark:border-orange-800 rounded-lg p-3 bg-orange-50 dark:bg-orange-900/20"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <p className="font-medium text-slate-800 dark:text-slate-100 text-sm">
                                                        {impact.sourceProject.name}
                                                    </p>
                                                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                                        {impact.riskCount} 个风险可能影响本项目
                                                    </p>
                                                </div>
                                                <span className="px-2 py-1 bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 rounded text-xs font-medium">
                                                    影响度: {impact.avgImpact.toFixed(1)}/5
                                                </span>
                                            </div>

                                            {impact.criticalRisks.length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-orange-300 dark:border-orange-700">
                                                    <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                                                        ⚠️ 极高风险 ({impact.criticalRisks.length})
                                                    </p>
                                                    {impact.criticalRisks.slice(0, 2).map((risk) => (
                                                        <p
                                                            key={risk.id}
                                                            className="text-xs text-slate-600 dark:text-slate-300 truncate"
                                                        >
                                                            • {risk.title}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Impacting */}
                        <div>
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                                <ArrowRight size={16} className="text-blue-500" />
                                影响其他项目
                            </h4>

                            {projectImpacts.impacting.length === 0 ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                                    本项目风险暂不影响其他项目
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {projectImpacts.impacting.map((impact) => (
                                        <motion.div
                                            key={impact.targetProject.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="border border-blue-200 dark:border-blue-800 rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <p className="font-medium text-slate-800 dark:text-slate-100 text-sm">
                                                        {impact.targetProject.name}
                                                    </p>
                                                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                                        {impact.riskCount} 个风险可能影响该项目
                                                    </p>
                                                </div>
                                                <span className="px-2 py-1 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                                                    影响度: {impact.avgImpact.toFixed(1)}/5
                                                </span>
                                            </div>

                                            {impact.criticalRisks.length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-blue-300 dark:border-blue-700">
                                                    <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                                                        ⚠️ 极高风险 ({impact.criticalRisks.length})
                                                    </p>
                                                    {impact.criticalRisks.slice(0, 2).map((risk) => (
                                                        <p
                                                            key={risk.id}
                                                            className="text-xs text-slate-600 dark:text-slate-300 truncate"
                                                        >
                                                            • {risk.title}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Specific Risk Correlations */}
            {riskCorrelations && riskCorrelations.relatedRisks.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="text-purple-600 dark:text-purple-400" size={20} />
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                            风险关联详情
                        </h3>
                    </div>

                    <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                            当前风险: {riskCorrelations.sourceRisk.title}
                        </p>
                        <p className="text-xs text-purple-700 dark:text-purple-200 mt-1">
                            在其他项目中发现 {riskCorrelations.relatedRisks.length} 个相关风险
                        </p>
                    </div>

                    <div className="space-y-3">
                        {riskCorrelations.relatedRisks.slice(0, 5).map((related) => {
                            const categoryInfo = getRiskCategoryInfo(related.risk.category);
                            const priorityColor = getRiskPriorityColor(related.risk.priority);

                            return (
                                <motion.div
                                    key={related.risk.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2 flex-1">
                                            <span className="text-lg">{categoryInfo.icon}</span>
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-800 dark:text-slate-100 text-sm">
                                                    {related.risk.title}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    {related.project.name}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColor}`}>
                                                {related.risk.priority}
                                            </span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                关联度: {(related.correlationScore * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded">
                                        <p className="text-xs text-slate-600 dark:text-slate-300">
                                            <span className="font-medium">关联类型:</span>{' '}
                                            {related.correlationType === 'direct' && '直接关联'}
                                            {related.correlationType === 'indirect' && '间接关联'}
                                            {related.correlationType === 'cascading' && '连锁反应'}
                                        </p>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                            <span className="font-medium">原因:</span> {related.reason}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {riskCorrelations.relatedRisks.length > 5 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4">
                            还有 {riskCorrelations.relatedRisks.length - 5} 个相关风险未显示
                        </p>
                    )}
                </div>
            )}

            {/* Summary */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
                <p className="text-sm text-indigo-900 dark:text-indigo-100">
                    💡 <strong>提示:</strong> 跨项目风险关联分析可以帮助您识别项目间的依赖关系和潜在连锁反应。
                    建议定期评审这些关联，并与相关项目团队协调风险应对措施。
                </p>
            </div>
        </div>
    );
};

export default CrossProjectRiskAnalysis;
