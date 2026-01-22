import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, useResourcePool } from '../store/useStore';
import { usePMOStore } from '../store/usePMOStore';
import { ArrowLeft, Edit2, Check, DollarSign, Layout, Users, AlertTriangle, BarChart3, Target, GitBranch, GitMerge, TrendingUp, Shield } from 'lucide-react';
import SmartTaskView from '../components/SmartTaskView';
import ProjectResourceDetail from '../components/ProjectResourceDetail';
import RiskAssessment from '../components/RiskAssessment';
import CostRegistrationForm from '../components/CostRegistrationForm';
import ProjectScoringPanel from '../components/ProjectScoringPanel';
import EnhancedHealthVisualization from '../components/EnhancedHealthVisualization';
import CostControlPanel from '../components/CostControlPanel';
import BaselineHistory from '../components/BaselineHistory';
import StageGateWorkflow from '../components/StageGateWorkflow';
import ScopeCreepMonitor from '../components/ScopeCreepMonitor';
import ChangeImpactAssessment from '../components/ChangeImpactAssessment';
import ProjectOverviewSummary from '../components/ProjectOverviewSummary';
import TaskImpactSimulator from '../components/TaskImpactSimulator';
import PDSGManagement from '../components/PDSGManagement';
import { calculateProjectHealth } from '../utils/projectHealth';
import { DEFAULT_STAGE_GATES, getNextStage, getStageName } from '../utils/stageGateManagement';
import type { CostEntry, Task, ProjectWithStageGate, StageGate, ProjectStage } from '../types';
import { Badge, Button } from '../components/ui';

import { useProjectDetail, useProjectsData } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { useRisks } from '../hooks/useRisks';

const ProjectDetailEnhanced: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { user } = useStore();
    const resourcePool = useResourcePool();
    const { addChangeRequest, getChangeRequestsByProject } = usePMOStore();

    const { data: project, isLoading: isProjectLoading } = useProjectDetail(projectId);
    const { tasks, isLoading: isTasksLoading, createTask, updateTask, deleteTask } = useTasks(projectId);
    const { risks, isLoading: isRisksLoading, createRisk, updateRisk, deleteRisk } = useRisks(projectId);
    const { updateProject } = useProjectsData();

    // Initialize state
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<'diagram' | 'resources' | 'costs' | 'risks' | 'analytics' | 'strategy' | 'baseline' | 'stagegate' | 'scope' | 'pdsg'>('diagram');
    const [isCostFormOpen, setIsCostFormOpen] = useState(false);
    const [showChangeAssessment, setShowChangeAssessment] = useState(false);
    const [showSimulator, setShowSimulator] = useState(false);

    if (isProjectLoading || isTasksLoading || isRisksLoading || !project) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{(isProjectLoading || isTasksLoading || isRisksLoading) ? '加载中...' : '项目未找到'}</h2>
                    {!(isProjectLoading || isTasksLoading || isRisksLoading) && <button onClick={() => navigate('/projects')} className="text-blue-600 hover:underline">返回项目列表</button>}
                </div>
            </div>
        );
    }

    const projectCosts = project.costHistory || [];
    const projectBudget = project.budget || 1000000;

    // Calculate health score for header display
    const healthMetrics = useMemo(() => {
        return calculateProjectHealth(project, tasks || [], []);
    }, [project, tasks]);

    const getHealthColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
        if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    // Unified Task Management Actions
    const handleTaskUpdate = (updatedTask: Task) => {
        updateTask({ id: updatedTask.id, updates: updatedTask });
    };

    const handleTaskAdd = (newTask: Task) => {
        createTask({ ...newTask, projectId: project.id });
    };

    const handleTaskDelete = (taskId: string) => {
        deleteTask(taskId);
    };

    const handleSaveCosts = (costs: CostEntry[], budget?: number) => {
        const totalActualCost = costs.reduce((sum, c) => sum + c.amount, 0);
        updateProject({
            id: project.id,
            updates: {
                ...project,
                costHistory: costs,
                budget: budget || project.budget,
                actualCost: totalActualCost
            }
        });
        setIsCostFormOpen(false);
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
            {/* Top Navigation Bar - Compact */}
            <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shadow-sm z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/projects')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="h-6 w-px bg-slate-200"></div>

                    {/* Inline Project Info Editing */}
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={project.name}
                                onChange={(e) => updateProject({ id: project.id, updates: { ...project, name: e.target.value } })}
                                className="font-bold text-lg border-b border-blue-500 focus:outline-none px-1"
                            />
                            <select
                                value={project.status}
                                onChange={(e) => updateProject({ id: project.id, updates: { ...project, status: e.target.value as any } })}
                                className="text-sm bg-slate-50 border rounded px-2 py-1"
                            >
                                <option value="planning">规划中</option>
                                <option value="active">进行中</option>
                                <option value="completed">已完成</option>
                                <option value="on-hold">暂停</option>
                            </select>
                            <select
                                value={project.priority}
                                onChange={(e) => updateProject({ id: project.id, updates: { ...project, priority: e.target.value as any } })}
                                className="text-sm bg-slate-50 border rounded px-2 py-1"
                            >
                                <option value="P0">P0 - 紧急</option>
                                <option value="P1">P1 - 高</option>
                                <option value="P2">P2 - 中</option>
                                <option value="P3">P3 - 低</option>
                            </select>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <h1 className="font-bold text-lg text-slate-800 dark:text-slate-100">{project.name}</h1>
                            <Badge
                                variant={project.status === 'active' ? 'success' : project.status === 'planning' ? 'primary' : 'neutral'}
                                size="sm"
                            >
                                {project.status}
                            </Badge>
                            <Badge
                                variant={project.priority === 'P0' ? 'danger' : project.priority === 'P1' ? 'warning' : 'primary'}
                                size="sm"
                            >
                                {project.priority}
                            </Badge>

                            {/* Integated Health Score Badge */}
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-bold ${getHealthColor(healthMetrics.overall)}`}>
                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                <span>{healthMetrics.overall} 分</span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`p-1.5 rounded-lg transition-colors ${isEditing ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100 text-slate-400'}`}
                    >
                        {isEditing ? <Check size={16} /> : <Edit2 size={16} />}
                    </button>
                </div>

                {/* View Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto no-scrollbar scroll-smooth">
                    <button
                        onClick={() => setActiveTab('diagram')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 flex items-center gap-2 transition-all ${activeTab === 'diagram' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Layout size={16} /> 任务视图
                    </button>
                    <button
                        onClick={() => setActiveTab('resources')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 flex items-center gap-2 transition-all ${activeTab === 'resources' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Users size={16} /> 资源池
                    </button>
                    <button
                        onClick={() => setActiveTab('pdsg')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 flex items-center gap-2 transition-all ${activeTab === 'pdsg' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Shield size={16} /> PDSG 核心组
                    </button>
                    <button
                        onClick={() => setActiveTab('risks')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 flex items-center gap-2 transition-all relative ${activeTab === 'risks' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <AlertTriangle size={16} /> 风险
                        {project.risks && project.risks.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                                {project.risks.filter(r => r.status !== 'resolved' && r.status !== 'accepted').length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('costs')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 flex items-center gap-2 transition-all ${activeTab === 'costs' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <DollarSign size={16} /> 成本
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 flex items-center gap-2 transition-all ${activeTab === 'analytics' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <BarChart3 size={16} /> 高级分析
                    </button>
                    <button
                        onClick={() => setActiveTab('strategy')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 flex items-center gap-2 transition-all ${activeTab === 'strategy' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Target size={16} /> 战略评分
                    </button>
                    <button
                        onClick={() => setActiveTab('baseline')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 flex items-center gap-2 transition-all ${activeTab === 'baseline' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <GitBranch size={16} /> 基线管理
                    </button>
                    <button
                        onClick={() => setActiveTab('stagegate')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 flex items-center gap-2 transition-all ${activeTab === 'stagegate' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <GitMerge size={16} /> 阶段门径
                    </button>
                    <button
                        onClick={() => setActiveTab('scope')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 flex items-center gap-2 transition-all ${activeTab === 'scope' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <TrendingUp size={16} /> 范围管理
                    </button>
                </div>
            </div>

            {/* Main Content Area - Full Screen */}
            <div className="flex-1 relative overflow-hidden bg-slate-50">
                {activeTab === 'diagram' && (
                    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
                        {/* 进展概览与统计 */}
                        <div className="p-6 pb-0 shrink-0">
                            <ProjectOverviewSummary
                                project={project}
                                tasks={project.tasks || []}
                            />

                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Layout size={20} className="text-blue-600" />
                                    任务编排与进度分析
                                </h3>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => setShowSimulator(!showSimulator)}
                                        variant={showSimulator ? 'primary' : 'secondary'}
                                        size="sm"
                                        icon={TrendingUp}
                                    >
                                        {showSimulator ? '隐藏分析器' : '开启影响分析模拟'}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* 影响模拟器 */}
                        {showSimulator && (
                            <div className="px-6 pb-6 shrink-0 animate-in slide-in-from-top duration-300">
                                <TaskImpactSimulator
                                    project={project}
                                    existingTasks={project.tasks || []}
                                    resourcePool={resourcePool}
                                />
                            </div>
                        )}

                        {/* 核心任务视图 */}
                        <div className="flex-1 overflow-hidden">
                            <SmartTaskView
                                tasks={project.tasks || []}
                                projectName={project.name}
                                pdsgMembers={project.pdsgMembers}
                                onTaskUpdate={handleTaskUpdate}
                                onTaskAdd={handleTaskAdd}
                                onTaskDelete={handleTaskDelete}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'risks' && (
                    <div className="h-full overflow-auto p-6 max-w-[1920px] mx-auto w-full">
                        <RiskAssessment
                            project={project}
                            risks={risks || []}
                            onCreate={createRisk}
                            onUpdate={(id, updates) => updateRisk({ id, updates })}
                            onDelete={deleteRisk}
                        />
                    </div>
                )}

                {activeTab === 'costs' && (
                    <div className="h-full overflow-auto p-6 max-w-[1920px] mx-auto w-full">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">成本概览</h3>
                                <p className="text-sm text-slate-500">预算: ${projectBudget.toLocaleString()} | 实际: ${projectCosts.reduce((sum, c) => sum + c.amount, 0).toLocaleString()}</p>
                            </div>
                            <Button
                                onClick={() => setIsCostFormOpen(true)}
                                variant="primary"
                                icon={DollarSign}
                            >
                                登记成本
                            </Button>
                        </div>

                        {/* Cost List */}
                        <div className="space-y-3">
                            {projectCosts.map(cost => (
                                <div key={cost.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <DollarSign size={20} />
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-900">{cost.description}</div>
                                            <div className="text-xs text-slate-500">{cost.date} · {cost.category}</div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-slate-900">
                                        ${cost.amount.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                            {projectCosts.length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    暂无成本记录
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 高级分析视图 */}
                {activeTab === 'analytics' && (
                    <div className="h-full overflow-auto p-6 max-w-[1920px] mx-auto w-full space-y-6">
                        {/* 项目健康度仪表板 - Enhanced Version */}
                        <EnhancedHealthVisualization
                            project={project}
                            tasks={tasks || []}
                            allProjects={[]}
                        />

                        {/* 成本控制面板 */}
                        <CostControlPanel
                            project={project}
                            tasks={project.tasks || []}
                        />
                    </div>
                )}

                {/* 战略评分视图 */}
                {activeTab === 'strategy' && (
                    <div className="h-full overflow-hidden max-w-[1920px] mx-auto w-full">
                        <ProjectScoringPanel
                            project={project}
                            onUpdate={(updates) => updateProject({ id: project.id, updates: { ...project, ...updates } })}
                        />
                    </div>
                )}

                {/* 资源详情视图 */}
                {activeTab === 'resources' && (
                    <ProjectResourceDetail
                        project={project}
                        resourcePool={resourcePool}
                    />
                )}

                {/* PDSG 管理视图 */}
                {activeTab === 'pdsg' && (
                    <div className="h-full overflow-auto p-8 max-w-[1920px] mx-auto w-full">
                        <PDSGManagement
                            project={project}
                            resourcePool={resourcePool}
                            onUpdateMembers={(members) => updateProject({ id: project.id, updates: { ...project, pdsgMembers: members } })}
                        />
                    </div>
                )}

                {/* 基线管理视图 */}
                {activeTab === 'baseline' && (
                    <div className="h-full overflow-auto p-6 max-w-[1920px] mx-auto w-full">
                        <BaselineHistory
                            project={project}
                            onCreateBaseline={(baseline) => {
                                const updatedBaselines = [...(project.baselines || []), baseline];
                                updateProject({
                                    id: project.id,
                                    updates: {
                                        ...project,
                                        baselines: updatedBaselines,
                                        activeBaselineId: baseline.id
                                    }
                                });
                            }}
                            onSetActiveBaseline={(baselineId) => {
                                updateProject({
                                    id: project.id,
                                    updates: {
                                        ...project,
                                        activeBaselineId: baselineId
                                    }
                                });
                            }}
                            currentUserId="current-user"
                            currentUserName={project.managerId || "项目经理"}
                        />
                    </div>
                )}

                {/* 阶段门径视图 */}
                {activeTab === 'stagegate' && (
                    <div className="h-full overflow-auto p-6 max-w-[1920px] mx-auto w-full">
                        <StageGateWorkflow
                            project={{
                                ...project,
                                currentStage: (project as any).currentStage || 'initiation',
                                gates: (project as any).gates || DEFAULT_STAGE_GATES.standard
                            } as ProjectWithStageGate}
                            onUpdateGate={(gate: StageGate) => {
                                const currentGates = project.gates || DEFAULT_STAGE_GATES.standard;
                                const updatedGates = currentGates.map((g: StageGate) =>
                                    g.id === gate.id ? gate : g
                                );
                                updateProject({
                                    id: project.id,
                                    updates: {
                                        ...project,
                                        gates: updatedGates
                                    } as any
                                });
                            }}
                            onMoveToNextStage={() => {
                                const currentStage = project.currentStage || 'initiation';
                                const nextStage = getNextStage(currentStage as ProjectStage);
                                if (nextStage) {
                                    updateProject({
                                        id: project.id,
                                        updates: {
                                            ...project,
                                            currentStage: nextStage
                                        } as any
                                    });
                                }
                            }}
                            currentUserId={user?.id || 'anonymous'}
                            currentUserName={user?.name || 'Anonymous User'}
                            userRole={(user?.role || 'user') as any}
                            onRequestApproval={(gate) => {
                                addChangeRequest({
                                    projectId: project.id,
                                    requestedBy: user?.id || 'anonymous',
                                    requestedByName: user?.name || '项目经理',
                                    requestDate: new Date().toISOString(),
                                    title: `阶段门径申请: ${getStageName(gate.stage)}`,
                                    description: `项目经理申请进入下一步阶段: ${gate.name}\n${gate.description}`,
                                    category: 'project_status',
                                    type: 'scope',
                                    priority: 'medium',
                                    creatorId: user?.id || 'anonymous',
                                    creatorName: user?.name || '项目经理',
                                    estimatedEffortHours: 0,
                                    estimatedCostIncrease: 0,
                                    scheduleImpactDays: 0,
                                    impactLevel: 'medium',
                                    businessJustification: '项目已完成当前阶段所有必需任务，申请进入下一流程节点。',
                                    status: 'pending'
                                });
                            }}
                        />
                    </div>
                )}

                {/* 范围管理视图 */}
                {activeTab === 'scope' && (
                    <div className="h-full overflow-auto p-6 max-w-[1920px] mx-auto w-full space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    范围管理与变更控制
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    监控范围蔓延，管理变更请求，防止项目失控
                                </p>
                            </div>
                            <Button
                                onClick={() => setShowChangeAssessment(true)}
                                variant="primary"
                                icon={TrendingUp}
                            >
                                提交变更请求
                            </Button>
                        </div>

                        {/* 范围蔓延监控 */}
                        <ScopeCreepMonitor
                            project={project}
                            changeRequests={getChangeRequestsByProject(project.id)}
                        />

                        {/* 变更请求列表 */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                                变更请求历史
                            </h3>
                            <div className="space-y-3">
                                {getChangeRequestsByProject(project.id).map((cr) => (
                                    <div
                                        key={cr.id}
                                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-medium text-slate-900 dark:text-slate-100">
                                                    {cr.title}
                                                </h4>
                                                <Badge
                                                    variant={
                                                        cr.status === 'approved'
                                                            ? 'success'
                                                            : cr.status === 'rejected'
                                                                ? 'danger'
                                                                : 'warning'
                                                    }
                                                >
                                                    {cr.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {cr.description}
                                            </p>
                                            <div className="flex gap-4 mt-2 text-xs text-slate-500">
                                                <span>工时: +{cr.estimatedEffortHours}h</span>
                                                <span>成本: +¥{cr.estimatedCostIncrease}</span>
                                                <span>延期: +{cr.scheduleImpactDays}天</span>
                                            </div>
                                        </div>
                                        <div className="text-sm text-slate-500">
                                            {new Date(cr.requestDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                                {getChangeRequestsByProject(project.id).length === 0 && (
                                    <div className="text-center py-8 text-slate-400">
                                        暂无变更请求
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Change Impact Assessment Modal */}
            {showChangeAssessment && (
                <ChangeImpactAssessment
                    project={project}
                    onSubmit={(changeRequest) => {
                        addChangeRequest(changeRequest);
                        setShowChangeAssessment(false);
                    }}
                    onCancel={() => setShowChangeAssessment(false)}
                    currentUser={{
                        id: 'current-user',
                        name: project.managerId || '项目经理',
                    }}
                />
            )}

            {/* Cost Registration Modal */}
            {isCostFormOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-900">登记项目成本</h3>
                                <button onClick={() => setIsCostFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <ArrowLeft size={24} className="rotate-180" />
                                </button>
                            </div>
                            <CostRegistrationForm
                                projectId={project.id}
                                projectName={project.name}
                                budget={projectBudget}
                                existingCosts={projectCosts}
                                onSave={handleSaveCosts}
                                onClose={() => setIsCostFormOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetailEnhanced;
