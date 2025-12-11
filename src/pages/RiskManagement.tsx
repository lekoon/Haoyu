import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    Plus,
    TrendingUp,
    Shield,
    CheckCircle2,
    Edit2,
    Trash2,
    ChevronDown,
    ChevronUp,
    Filter,
    Download,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Risk, RiskCategory, RiskStatus } from '../types';
import {
    updateRisk,
    calculateProjectRiskScore,
    getRiskPriorityDistribution,
    getRiskCategoryInfo,
    getRiskStatusInfo,
    getRiskPriorityColor,
} from '../utils/riskManagement';
import { exportRisksToCSV, exportRisksToExcel, printRiskReport } from '../utils/riskExport';
import RiskMatrix from '../components/RiskMatrix';
import RiskFormModal from '../components/RiskFormModal';
import RiskTrendChart from '../components/RiskTrendChart';
import RiskTemplateSelector from '../components/RiskTemplateSelector';
import AIRiskSuggestionPanel from '../components/AIRiskSuggestionPanel';
import RiskHeatmap from '../components/RiskHeatmap';
import CrossProjectRiskAnalysis from '../components/CrossProjectRiskAnalysis';
import type { RiskTemplate } from '../utils/riskTemplates';
import { createRiskFromTemplate, RISK_TEMPLATES } from '../utils/riskTemplates';
import { createRisk as createRiskUtil } from '../utils/riskManagement';

const RiskManagement: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { projects, updateProject, user } = useStore();

    const project = projects.find((p) => p.id === projectId);
    const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
    const [isAddingRisk, setIsAddingRisk] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [filterCategory, setFilterCategory] = useState<RiskCategory | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<RiskStatus | 'all'>('all');
    const [expandedRisks, setExpandedRisks] = useState<Set<string>>(new Set());

    if (!project) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">项目未找到</h2>
                    <button
                        onClick={() => navigate('/projects')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        返回项目列表
                    </button>
                </div>
            </div>
        );
    }

    const risks = project.risks || [];

    // Statistics
    const stats = useMemo(() => {
        const activeRisks = risks.filter((r) => r.status !== 'resolved' && r.status !== 'accepted');
        const criticalRisks = activeRisks.filter((r) => r.priority === 'critical');
        const projectRiskScore = calculateProjectRiskScore(risks);
        const distribution = getRiskPriorityDistribution(risks);

        return {
            total: risks.length,
            active: activeRisks.length,
            critical: criticalRisks.length,
            resolved: risks.filter((r) => r.status === 'resolved').length,
            projectRiskScore,
            distribution,
        };
    }, [risks]);

    // Filtered risks
    const filteredRisks = useMemo(() => {
        return risks.filter((risk) => {
            if (filterCategory !== 'all' && risk.category !== filterCategory) return false;
            if (filterStatus !== 'all' && risk.status !== filterStatus) return false;
            return true;
        });
    }, [risks, filterCategory, filterStatus]);

    const toggleRiskExpansion = (riskId: string) => {
        setExpandedRisks((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(riskId)) {
                newSet.delete(riskId);
            } else {
                newSet.add(riskId);
            }
            return newSet;
        });
    };

    const handleAddRisk = (newRisk: Risk) => {
        const updatedRisks = [...risks, newRisk];
        updateProject(project.id, { risks: updatedRisks });
        setIsAddingRisk(false);
    };

    const handleUpdateRisk = (riskId: string, updates: Partial<Risk>) => {
        const updatedRisks = risks.map((r) =>
            r.id === riskId
                ? updateRisk(r, updates, user?.id || 'system', user?.name || '系统')
                : r
        );
        updateProject(project.id, { risks: updatedRisks });
    };

    const handleDeleteRisk = (riskId: string) => {
        if (confirm('确定要删除这个风险吗？')) {
            const updatedRisks = risks.filter((r) => r.id !== riskId);
            updateProject(project.id, { risks: updatedRisks });
        }
    };

    const handleSelectTemplate = (template: RiskTemplate) => {
        // Create risk from template
        const riskData = createRiskFromTemplate(template, project.id, user?.id || 'system');
        const newRisk = createRiskUtil(
            project.id,
            riskData.title,
            riskData.category,
            riskData.probability,
            riskData.impact,
            riskData.owner,
            riskData.description
        );

        // Apply additional template data
        const completeRisk: Risk = {
            ...newRisk,
            mitigationStrategy: riskData.mitigationStrategy,
            contingencyPlan: riskData.contingencyPlan,
            tags: riskData.tags,
        };

        handleAddRisk(completeRisk);
    };

    const handleAcceptAISuggestion = (templateId: string) => {
        const template = RISK_TEMPLATES.find((t) => t.id === templateId);
        if (template) {
            handleSelectTemplate(template);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                            风险管理 - {project.name}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            识别、评估和缓解项目风险
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Export Dropdown */}
                        <div className="relative group">
                            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                <Download size={18} />
                                <span>导出</span>
                            </button>
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                <button
                                    onClick={() => exportRisksToCSV(risks, project.name)}
                                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-200 rounded-t-lg"
                                >
                                    📄 导出为 CSV
                                </button>
                                <button
                                    onClick={() => exportRisksToExcel(risks, project.name)}
                                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-200"
                                >
                                    📊 导出为 Excel
                                </button>
                                <button
                                    onClick={() => printRiskReport(risks, project)}
                                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-200 rounded-b-lg"
                                >
                                    🖨️ 打印 / PDF
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsTemplateModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>从模板创建</span>
                        </button>

                        <button
                            onClick={() => setIsAddingRisk(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={18} />
                            <span>添加风险</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">总风险数</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                                {stats.total}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <AlertTriangle className="text-blue-600 dark:text-blue-400" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">活跃风险</p>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                                {stats.active}
                            </p>
                        </div>
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <TrendingUp className="text-orange-600 dark:text-orange-400" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">极高风险</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                                {stats.critical}
                            </p>
                        </div>
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <Shield className="text-red-600 dark:text-red-400" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">已解决</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                                {stats.resolved}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <CheckCircle2 className="text-green-600 dark:text-green-400" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Risk Matrix */}
            <div className="mb-6">
                <RiskMatrix risks={risks} onRiskClick={(risk) => setSelectedRisk(risk)} />
            </div>

            {/* Risk Trend Chart */}
            {risks.length > 0 && (
                <div className="mb-6">
                    <RiskTrendChart risks={risks} />
                </div>
            )}

            {/* AI Risk Suggestions */}
            <div className="mb-6">
                <AIRiskSuggestionPanel
                    project={project}
                    allProjects={projects}
                    existingRisks={risks}
                    onAcceptSuggestion={handleAcceptAISuggestion}
                />
            </div>

            {/* Risk Heatmap */}
            {risks.length > 0 && (
                <div className="mb-6">
                    <RiskHeatmap risks={risks} months={6} />
                </div>
            )}

            {/* Cross-Project Risk Analysis */}
            {projects.length > 1 && (
                <div className="mb-6">
                    <CrossProjectRiskAnalysis
                        currentProject={project}
                        allProjects={projects}
                        currentRisk={selectedRisk || undefined}
                    />
                </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 mb-6">
                <div className="flex items-center gap-4">
                    <Filter size={18} className="text-slate-500" />
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value as RiskCategory | 'all')}
                        className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                    >
                        <option value="all">所有类别</option>
                        <option value="schedule">进度风险</option>
                        <option value="cost">成本风险</option>
                        <option value="resource">资源风险</option>
                        <option value="technical">技术风险</option>
                        <option value="external">外部风险</option>
                        <option value="quality">质量风险</option>
                        <option value="scope">范围风险</option>
                    </select>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as RiskStatus | 'all')}
                        className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                    >
                        <option value="all">所有状态</option>
                        <option value="identified">已识别</option>
                        <option value="analyzing">分析中</option>
                        <option value="mitigating">缓解中</option>
                        <option value="monitoring">监控中</option>
                        <option value="resolved">已解决</option>
                        <option value="accepted">已接受</option>
                    </select>

                    <div className="ml-auto text-sm text-slate-500 dark:text-slate-400">
                        显示 {filteredRisks.length} / {risks.length} 个风险
                    </div>
                </div>
            </div>

            {/* Risk List */}
            <div className="space-y-4">
                {filteredRisks.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-12 text-center">
                        <Shield className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
                            暂无风险
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            点击"添加风险"按钮开始识别项目风险
                        </p>
                    </div>
                ) : (
                    filteredRisks.map((risk) => {
                        const isExpanded = expandedRisks.has(risk.id);
                        const categoryInfo = getRiskCategoryInfo(risk.category);
                        const statusInfo = getRiskStatusInfo(risk.status);

                        return (
                            <motion.div
                                key={risk.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden"
                            >
                                {/* Risk Header */}
                                <div className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-lg">{categoryInfo.icon}</span>
                                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                                                    {risk.title}
                                                </h3>
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRiskPriorityColor(
                                                        risk.priority
                                                    )}`}
                                                >
                                                    {risk.priority.toUpperCase()}
                                                </span>
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                                                >
                                                    {statusInfo.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                                                {risk.description}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                                <span>概率: {risk.probability}/5</span>
                                                <span>影响: {risk.impact}/5</span>
                                                <span>风险分数: {risk.riskScore}</span>
                                                <span className={categoryInfo.color}>{categoryInfo.label}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleRiskExpansion(risk.id)}
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            >
                                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </button>
                                            <button
                                                onClick={() => setSelectedRisk(risk)}
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRisk(risk.id)}
                                                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                                                        缓解策略
                                                    </h4>
                                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                                        {risk.mitigationStrategy || '暂无缓解策略'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                                                        应急计划
                                                    </h4>
                                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                                        {risk.contingencyPlan || '暂无应急计划'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Mitigation Actions */}
                                            {risk.mitigationActions.length > 0 && (
                                                <div className="mt-4">
                                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                                                        缓解措施 ({risk.mitigationActions.length})
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {risk.mitigationActions.map((action) => (
                                                            <div
                                                                key={action.id}
                                                                className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-lg"
                                                            >
                                                                <CheckCircle2
                                                                    size={16}
                                                                    className={
                                                                        action.status === 'completed'
                                                                            ? 'text-green-600'
                                                                            : 'text-slate-300'
                                                                    }
                                                                />
                                                                <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">
                                                                    {action.description}
                                                                </span>
                                                                <span className="text-xs text-slate-500">
                                                                    {action.status}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Risk Form Modal */}
            <RiskFormModal
                isOpen={isAddingRisk || selectedRisk !== null}
                onClose={() => {
                    setIsAddingRisk(false);
                    setSelectedRisk(null);
                }}
                onSave={(risk) => {
                    if (selectedRisk) {
                        // Update existing risk
                        handleUpdateRisk(risk.id, risk);
                    } else {
                        // Add new risk
                        handleAddRisk(risk);
                    }
                    setSelectedRisk(null);
                }}
                projectId={project.id}
                existingRisk={selectedRisk}
                currentUserId={user?.id || 'system'}
            />

            {/* Risk Template Selector */}
            <RiskTemplateSelector
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                onSelectTemplate={handleSelectTemplate}
            />
        </div>
    );
};

export default RiskManagement;
