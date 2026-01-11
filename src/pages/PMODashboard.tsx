import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { usePMOStore } from '../store/usePMOStore';
import {
    TrendingUp, AlertTriangle, CheckCircle, Users, GitBranch, FileText,
    Briefcase, Network, LayoutDashboard
} from 'lucide-react';
import { Card, Badge, Button } from '../components/ui';
import ProjectHealthMonitor from '../components/ProjectHealthMonitor';
import PortfolioDashboard from './PortfolioDashboard';
import DependencyAnalysis from './DependencyAnalysis';
import ResourceRiskPredictor from '../components/ResourceRiskPredictor';
import ChangeRequestDetailModal from '../components/ChangeRequestDetailModal';
import { approveGate, rejectGate } from '../utils/stageGateManagement';
import type { ChangeRequest, StageGate } from '../types';

type TabType = 'overview' | 'portfolio' | 'dependencies' | 'risks';

const PMODashboard: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab') as TabType;
    const { projects, updateProject, user, resourcePool } = useStore();
    const {
        changeRequests,
        approveChangeRequest,
        rejectChangeRequest,
        environmentResources,
        requirements,
        simulations
    } = usePMOStore();

    const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);

    const [activeTab, setActiveTab] = useState<TabType>(
        (tabParam && ['overview', 'portfolio', 'dependencies', 'risks'].includes(tabParam))
            ? tabParam
            : 'overview'
    );

    // Sync state when URL params change
    React.useEffect(() => {
        const newTab = searchParams.get('tab') as TabType;
        if (newTab && ['overview', 'portfolio', 'dependencies', 'risks'].includes(newTab)) {
            setActiveTab(newTab);
        }
    }, [searchParams]);

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    // 统计数据
    const stats = useMemo(() => {
        const activeProjects = projects.filter((p) => p.status === 'active');
        const totalProjects = projects.length;
        const completedProjects = projects.filter((p) => p.status === 'completed').length;

        const pendingChangeRequests = changeRequests.filter((cr) => cr.status === 'pending').length;
        const totalChangeRequests = changeRequests.length;

        const totalRequirements = requirements.length;
        const completedRequirements = requirements.filter((r) => r.status === 'completed').length;

        const availableEnvironments = environmentResources.filter(
            (env) => env.status === 'available'
        ).length;

        return {
            activeProjects: activeProjects.length,
            totalProjects,
            completedProjects,
            completionRate: totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0,
            pendingChangeRequests,
            totalChangeRequests,
            totalRequirements,
            completedRequirements,
            requirementCompletionRate:
                totalRequirements > 0 ? (completedRequirements / totalRequirements) * 100 : 0,
            availableEnvironments,
            totalEnvironments: environmentResources.length,
            totalSimulations: simulations.length,
        };
    }, [projects, changeRequests, requirements, environmentResources, simulations]);

    // 最近的变更请求
    const recentChangeRequests = useMemo(() => {
        return [...changeRequests]
            .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
            .slice(0, 5);
    }, [changeRequests]);

    return (
        <div className="animate-fadeIn">
            {/* 页面标题 */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                        PMO 战略管控中心
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        项目组合管理、范围防御、资源冲突管控一站式平台
                    </p>
                </div>
            </div>

            {/* 标签页导航 - 增加溢出处理 */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 mb-6 overflow-x-auto no-scrollbar scrollbar-hide whitespace-nowrap">
                <button
                    onClick={() => handleTabChange('overview')}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 font-medium transition-all whitespace-nowrap ${activeTab === 'overview'
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                        } `}
                >
                    <LayoutDashboard size={18} />
                    管控概览
                </button>
                <button
                    onClick={() => handleTabChange('portfolio')}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 font-medium transition-all whitespace-nowrap ${activeTab === 'portfolio'
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                        } `}
                >
                    <Briefcase size={18} />
                    项目组合
                </button>
                <button
                    onClick={() => handleTabChange('dependencies')}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 font-medium transition-all whitespace-nowrap ${activeTab === 'dependencies'
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                        } `}
                >
                    <Network size={18} />
                    依赖分析
                </button>
                <button
                    onClick={() => handleTabChange('risks')}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 font-medium transition-all whitespace-nowrap ${activeTab === 'risks'
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                        } `}
                >
                    <AlertTriangle size={18} />
                    风险预测
                </button>
            </div>

            {/* 条件渲染内容 */}
            <div className="space-y-6">
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* 核心指标卡片 - 使用响应式网格 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div onClick={() => navigate('/projects')} className="cursor-pointer">
                                <Card className="p-4 hover:shadow-lg transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                                            <GitBranch size={24} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">活跃项目</p>
                                            <div className="flex items-baseline gap-2">
                                                <h3 className="text-2xl font-bold">{stats.activeProjects}</h3>
                                                <span className="text-xs text-slate-400">/ {stats.totalProjects}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            <Card className="p-4 hover:shadow-lg transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                                        <TrendingUp size={24} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">待审批变更</p>
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="text-2xl font-bold">{stats.pendingChangeRequests}</h3>
                                            <span className="text-xs text-slate-400">急需处理</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-4 hover:shadow-lg transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                        <CheckCircle size={24} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">需求完成率</p>
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="text-2xl font-bold text-emerald-600">{stats.requirementCompletionRate.toFixed(0)}%</h3>
                                            <span className="text-xs text-slate-400">{stats.completedRequirements}/{stats.totalRequirements}</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <div onClick={() => navigate('/environments')} className="cursor-pointer">
                                <Card className="p-4 hover:shadow-lg transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                                            <Network size={24} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">可用环境</p>
                                            <div className="flex items-baseline gap-2">
                                                <h3 className="text-2xl font-bold">{stats.availableEnvironments}</h3>
                                                <span className="text-xs text-slate-400">/ {stats.totalEnvironments}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* 下方主要内容区域 */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* 左侧主要内容：变更请求和健康监控 */}
                            <div className="lg:col-span-2 space-y-6">
                                <Card className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            <FileText size={20} className="text-blue-500" />
                                            最近变更请求
                                        </h3>
                                        <Button variant="ghost" size="sm" onClick={() => navigate('/pmo')}>
                                            查看明细
                                        </Button>
                                    </div>
                                    <div className="space-y-4">
                                        {recentChangeRequests.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="text-left text-slate-500 border-b border-slate-100 dark:border-slate-700">
                                                            <th className="pb-2 font-medium">项目名称</th>
                                                            <th className="pb-2 font-medium">变更类型</th>
                                                            <th className="pb-2 font-medium">状态</th>
                                                            <th className="pb-2 font-medium text-right">日期</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                        {recentChangeRequests.map((cr) => (
                                                            <tr
                                                                key={cr.id}
                                                                onClick={() => setSelectedRequest(cr)}
                                                                className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                                            >
                                                                <td className="py-3 font-medium truncate max-w-[200px]">{cr.projectName}</td>
                                                                <td className="py-3">
                                                                    <Badge variant="neutral" className="text-[10px]">
                                                                        {cr.category === 'project_status' ? '项目状态' : cr.category}
                                                                    </Badge>
                                                                </td>
                                                                <td className="py-3">
                                                                    <Badge variant={cr.status === 'approved' ? 'success' : cr.status === 'rejected' ? 'danger' : 'warning'}>
                                                                        {cr.status === 'pending' ? '待审批' : cr.status === 'approved' ? '已通过' : '已拒绝'}
                                                                    </Badge>
                                                                </td>
                                                                <td className="py-3 text-right text-slate-400">{new Date(cr.requestDate).toLocaleDateString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="py-12 text-center text-slate-500">
                                                暂无最近变更记录
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                <Card className="p-6">
                                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                        <TrendingUp size={20} className="text-emerald-500" />
                                        项目健康度监控
                                    </h3>
                                    <ProjectHealthMonitor projects={projects} />
                                </Card>
                            </div>

                            {/* 右侧：快速操作和系统卡片 */}
                            <div className="space-y-6">
                                <Card className="p-6">
                                    <h3 className="text-lg font-semibold mb-4">快速管控操作</h3>
                                    <div className="space-y-3">
                                        <Button
                                            onClick={() => navigate('/simulation')}
                                            variant="primary"
                                            className="w-full justify-start h-12"
                                        >
                                            <TrendingUp className="mr-2 h-4 w-4" /> 沙盘推演 (What-If)
                                        </Button>
                                        <Button
                                            onClick={() => navigate('/environments')}
                                            variant="secondary"
                                            className="w-full justify-start h-12"
                                        >
                                            <Users className="mr-2 h-4 w-4" /> 环境管理
                                        </Button>
                                        <Button
                                            onClick={() => setActiveTab('portfolio')}
                                            variant="secondary"
                                            className="w-full justify-start h-12"
                                        >
                                            <Briefcase className="mr-2 h-4 w-4" /> 项目组合视图
                                        </Button>
                                    </div>
                                </Card>

                                <Card className="p-6 bg-slate-900 dark:bg-slate-800 text-white border-none shadow-2xl">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <AlertTriangle className="text-yellow-400" size={20} />
                                        系统防御状态报告
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-400">整体交付完成率</span>
                                            <span className="font-mono text-emerald-400 font-bold">{stats.completionRate.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-700 rounded-full h-2">
                                            <div
                                                className="bg-emerald-500 h-2 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                                style={{ width: `${stats.completionRate}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            当前项目组合运行稳定。已通过 AI 决策引擎优化资源分配，建议针对 {stats.pendingChangeRequests} 项待审批变更进行沙盘模拟。
                                        </p>
                                        <div className="pt-2">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold">
                                                <CheckCircle size={12} /> SECURE STATUS
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'portfolio' && (
                    <div className="animate-fadeIn">
                        <PortfolioDashboard />
                    </div>
                )}

                {activeTab === 'dependencies' && (
                    <div className="animate-fadeIn">
                        <DependencyAnalysis />
                    </div>
                )}



                {activeTab === 'risks' && (
                    <div className="animate-fadeIn">
                        <ResourceRiskPredictor projects={projects} resourcePool={resourcePool} />
                    </div>
                )}
            </div>

            {/* Change Request Detail Modal */}
            {selectedRequest && (
                <ChangeRequestDetailModal
                    request={selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    isPMO={user?.role === 'admin'}
                    onApprove={(id, comment) => {
                        if (!user) return;

                        // 1. Approve the change request in PMO store
                        approveChangeRequest(id, user.id, user.name || user.username);

                        // 2. If it's a stage gate, update the project's gate status
                        if (selectedRequest.category === 'project_status' && selectedRequest.metadata?.type === 'stage_gate') {
                            const project = projects.find(p => p.id === selectedRequest.projectId);
                            if (project && (project as any).gates && project.id) {
                                const gateId = selectedRequest.metadata.gateId;
                                const updatedGates = (project as any).gates.map((g: StageGate) => {
                                    if (g.id === gateId) {
                                        return approveGate(g, user.id, user.name || user.username, comment);
                                    }
                                    return g;
                                });
                                updateProject(project.id, { ...project, gates: updatedGates } as any);
                            }
                        }

                        setSelectedRequest(null);
                    }}
                    onReject={(id, reason) => {
                        if (!user) return;

                        // 1. Reject the change request in PMO store
                        rejectChangeRequest(id, user.id, user.name || user.username, reason);

                        // 2. If it's a stage gate, update the project's gate status
                        if (selectedRequest.category === 'project_status' && selectedRequest.metadata?.type === 'stage_gate') {
                            const project = projects.find(p => p.id === selectedRequest.projectId);
                            if (project && (project as any).gates && project.id) {
                                const gateId = selectedRequest.metadata.gateId;
                                const updatedGates = (project as any).gates.map((g: StageGate) => {
                                    if (g.id === gateId) {
                                        return rejectGate(g, user.id, user.name || user.username, reason);
                                    }
                                    return g;
                                });
                                updateProject(project.id, { ...project, gates: updatedGates } as any);
                            }
                        }

                        setSelectedRequest(null);
                    }}
                />
            )}
        </div>
    );
};

export default PMODashboard;
