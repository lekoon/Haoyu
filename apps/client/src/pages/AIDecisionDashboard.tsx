import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Target, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    analyzePriorityRecommendations,
    generateResourceOptimizations,
    predictProjectRisks,
    generateDecisionSummary
} from '../utils/aiDecision';

const AIDecisionDashboard: React.FC = () => {
    const { projects, resourcePool, factorDefinitions } = useStore();
    const { t } = useTranslation();

    const recommendations = useMemo(() =>
        analyzePriorityRecommendations(projects, factorDefinitions),
        [projects, factorDefinitions]
    );

    const optimizations = useMemo(() =>
        generateResourceOptimizations(projects, resourcePool),
        [projects, resourcePool]
    );

    const risks = useMemo(() =>
        predictProjectRisks(projects, resourcePool),
        [projects, resourcePool]
    );

    const summary = useMemo(() =>
        generateDecisionSummary(projects, resourcePool),
        [projects, resourcePool]
    );

    return (
        <div className="space-y-6">
            {/* AI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <Brain size={32} />
                        <div>
                            <p className="text-purple-100 text-sm">{t('ai.intelligentInsights')}</p>
                            <h3 className="text-2xl font-bold">{summary.topRecommendations.length}</h3>
                        </div>
                    </div>
                    <p className="text-sm text-purple-100">
                        {t('ai.aiPoweredAnalysis')}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle size={32} />
                        <div>
                            <p className="text-orange-100 text-sm">{t('ai.criticalRisks')}</p>
                            <h3 className="text-2xl font-bold">{summary.criticalRisks}</h3>
                        </div>
                    </div>
                    <p className="text-sm text-orange-100">
                        {t('ai.needsAttention')}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <Lightbulb size={32} />
                        <div>
                            <p className="text-green-100 text-sm">{t('ai.optimizations')}</p>
                            <h3 className="text-2xl font-bold">{summary.optimizationOpportunities}</h3>
                        </div>
                    </div>
                    <p className="text-sm text-green-100">
                        {t('ai.improvementOpportunities')}
                    </p>
                </div>
            </div>

            {/* Priority Recommendations */}
            {recommendations.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Target className="text-purple-600" size={24} />
                        <h2 className="text-xl font-bold text-slate-900">{t('ai.priorityRecommendations')}</h2>
                    </div>
                    <div className="space-y-4">
                        {recommendations.slice(0, 5).map((rec, idx) => (
                            <div key={idx} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-900 mb-1">{rec.projectName}</h3>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-slate-500">{t('ai.current')}:</span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${rec.currentPriority === 'P0' ? 'bg-red-100 text-red-700' :
                                                    rec.currentPriority === 'P1' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-blue-100 text-blue-700'
                                                }`}>
                                                {rec.currentPriority}
                                            </span>
                                            <span className="text-slate-400">→</span>
                                            <span className="text-slate-500">{t('ai.recommended')}:</span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${rec.recommendedPriority === 'P0' ? 'bg-red-100 text-red-700' :
                                                    rec.recommendedPriority === 'P1' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-blue-100 text-blue-700'
                                                }`}>
                                                {rec.recommendedPriority}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500">{t('ai.confidence')}</p>
                                            <p className="text-lg font-bold text-purple-600">{rec.confidence}%</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    {rec.reasons.map((reason, i) => (
                                        <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                            <Zap size={14} className="text-purple-500 mt-0.5 flex-shrink-0" />
                                            <span>{reason}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Resource Optimizations */}
            {optimizations.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <TrendingUp className="text-green-600" size={24} />
                        <h2 className="text-xl font-bold text-slate-900">{t('ai.resourceOptimizations')}</h2>
                    </div>
                    <div className="space-y-4">
                        {optimizations.slice(0, 5).map((opt, idx) => (
                            <div key={idx} className={`border-l-4 rounded-r-xl p-4 ${opt.priority === 'urgent' ? 'border-red-500 bg-red-50' :
                                    opt.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                                        'border-blue-500 bg-blue-50'
                                }`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${opt.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                                    opt.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-blue-100 text-blue-700'
                                                }`}>
                                                {opt.priority}
                                            </span>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${opt.type === 'hiring' ? 'bg-purple-100 text-purple-700' :
                                                    opt.type === 'training' ? 'bg-green-100 text-green-700' :
                                                        'bg-blue-100 text-blue-700'
                                                }`}>
                                                {t(`ai.${opt.type}`)}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 mb-2">{opt.description}</h3>
                                    </div>
                                </div>

                                {opt.estimatedImpact && (
                                    <div className="flex gap-4 mb-3 text-sm">
                                        {opt.estimatedImpact.costSaving && (
                                            <div className="flex items-center gap-1 text-green-700">
                                                <span className="font-medium">{t('ai.costSaving')}:</span>
                                                <span className="font-bold">¥{(opt.estimatedImpact.costSaving / 10000).toFixed(1)}万</span>
                                            </div>
                                        )}
                                        {opt.estimatedImpact.timeReduction && (
                                            <div className="flex items-center gap-1 text-blue-700">
                                                <span className="font-medium">{t('ai.timeReduction')}:</span>
                                                <span className="font-bold">{opt.estimatedImpact.timeReduction}%</span>
                                            </div>
                                        )}
                                        {opt.estimatedImpact.qualityImprovement && (
                                            <div className="flex items-center gap-1 text-purple-700">
                                                <span className="font-medium">{t('ai.qualityImprovement')}:</span>
                                                <span className="font-bold">{opt.estimatedImpact.qualityImprovement}%</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-600 mb-2">{t('ai.actionItems')}:</p>
                                    {opt.actionItems.map((action, i) => (
                                        <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                            <span className="text-green-600 font-bold">•</span>
                                            <span>{action}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Risk Predictions */}
            {risks.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <AlertTriangle className="text-orange-600" size={24} />
                        <h2 className="text-xl font-bold text-slate-900">{t('ai.riskPredictions')}</h2>
                    </div>
                    <div className="space-y-4">
                        {risks.slice(0, 5).map((risk, idx) => (
                            <div key={idx} className={`border-l-4 rounded-r-xl p-4 ${risk.severity === 'critical' ? 'border-red-500 bg-red-50' :
                                    risk.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                                        'border-yellow-500 bg-yellow-50'
                                }`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${risk.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                                    risk.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {risk.severity}
                                            </span>
                                            <span className="px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-700">
                                                {t(`ai.${risk.riskType}`)}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 mb-1">{risk.projectName}</h3>
                                        <p className="text-sm text-slate-700 mb-2">{risk.description}</p>
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="text-xs text-slate-500">{t('ai.probability')}</p>
                                        <p className="text-lg font-bold text-orange-600">{risk.probability}%</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-600 mb-2">{t('ai.mitigation')}:</p>
                                    {risk.mitigation.map((action, i) => (
                                        <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                            <span className="text-orange-600 font-bold">✓</span>
                                            <span>{action}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIDecisionDashboard;
