import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { Project, Risk } from '../types';
import { suggestRisks, getRiskInsights } from '../utils/aiRiskSuggestion';
import { getRiskCategoryInfo } from '../utils/riskManagement';

interface AIRiskSuggestionPanelProps {
    project: Project;
    allProjects: Project[];
    existingRisks: Risk[];
    onAcceptSuggestion: (templateId: string) => void;
}

const AIRiskSuggestionPanel: React.FC<AIRiskSuggestionPanelProps> = ({
    project,
    allProjects,
    existingRisks,
    onAcceptSuggestion,
}) => {
    const suggestions = useMemo(() => {
        return suggestRisks(project, allProjects);
    }, [project, allProjects]);

    const insights = useMemo(() => {
        return getRiskInsights(existingRisks);
    }, [existingRisks]);

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return 'text-red-600 bg-red-50 border-red-200';
        if (confidence >= 0.6) return 'text-orange-600 bg-orange-50 border-orange-200';
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    };

    const getConfidenceLabel = (confidence: number) => {
        if (confidence >= 0.8) return '高';
        if (confidence >= 0.6) return '中';
        return '低';
    };

    return (
        <div className="space-y-6">
            {/* AI Insights */}
            {insights.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="text-blue-600 dark:text-blue-400" size={20} />
                        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">AI 洞察</h3>
                    </div>
                    <div className="space-y-2">
                        {insights.map((insight, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-start gap-3 text-sm text-blue-800 dark:text-blue-200"
                            >
                                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                <span>{insight}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Risk Suggestions */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="text-purple-600 dark:text-purple-400" size={20} />
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                            AI 风险建议
                        </h3>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        基于项目特征和历史数据分析
                    </span>
                </div>

                {suggestions.length === 0 ? (
                    <div className="text-center py-8">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
                        <p className="text-slate-600 dark:text-slate-300 font-medium">暂无风险建议</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            项目状态良好，继续保持！
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {suggestions.map((suggestion, index) => {
                            const categoryInfo = getRiskCategoryInfo(suggestion.template.category);
                            const confidenceColor = getConfidenceColor(suggestion.confidence);

                            return (
                                <motion.div
                                    key={suggestion.template.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors group"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2 flex-1">
                                            <span className="text-xl">{categoryInfo.icon}</span>
                                            <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                                                {suggestion.template.name}
                                            </h4>
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-xs font-medium border ${confidenceColor}`}
                                            >
                                                置信度: {getConfidenceLabel(suggestion.confidence)}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => onAcceptSuggestion(suggestion.template.id)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Plus size={14} />
                                            <span className="text-xs">采纳</span>
                                        </button>
                                    </div>

                                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                                        {suggestion.template.description}
                                    </p>

                                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 mb-3">
                                        <p className="text-xs font-medium text-purple-900 dark:text-purple-100 mb-1">
                                            💡 AI 分析原因
                                        </p>
                                        <p className="text-xs text-purple-800 dark:text-purple-200">
                                            {suggestion.reason}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">相关因素:</span>
                                        {suggestion.relatedFactors.map((factor) => (
                                            <span
                                                key={factor}
                                                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-xs"
                                            >
                                                {factor}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                        <details className="text-xs">
                                            <summary className="cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                                                查看建议的缓解策略
                                            </summary>
                                            <div className="mt-2 pl-4 space-y-2">
                                                <div>
                                                    <p className="font-medium text-slate-700 dark:text-slate-200">
                                                        缓解策略:
                                                    </p>
                                                    <p className="text-slate-600 dark:text-slate-300">
                                                        {suggestion.template.mitigationStrategy}
                                                    </p>
                                                </div>
                                                {suggestion.template.contingencyPlan && (
                                                    <div>
                                                        <p className="font-medium text-slate-700 dark:text-slate-200">
                                                            应急计划:
                                                        </p>
                                                        <p className="text-slate-600 dark:text-slate-300">
                                                            {suggestion.template.contingencyPlan}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </details>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {suggestions.length > 0 && (
                    <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            💡 <strong>提示:</strong> AI 建议基于项目特征、历史数据和行业最佳实践生成。
                            您可以根据实际情况选择性采纳，并进一步自定义风险详情。
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIRiskSuggestionPanel;
