import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { usePMOStore } from '../store/usePMOStore';
import {
    TrendingUp, AlertTriangle, CheckCircle, Users, GitBranch, FileText,
    Network, LayoutDashboard, DollarSign, Target, Briefcase
} from 'lucide-react';
import { Card, Badge, Button } from '../components/ui';
import ProjectHealthMonitor from '../components/ProjectHealthMonitor';
import ProjectHealthGrid from '../components/ProjectHealthGrid';
import DependencyAnalysis from './DependencyAnalysis';
import ResourceRiskPredictor from '../components/ResourceRiskPredictor';
import { calculatePortfolioMetrics } from '../utils/portfolioHealth';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import ChangeRequestDetailModal from '../components/ChangeRequestDetailModal';
import { approveGate, rejectGate } from '../utils/stageGateManagement';
import type { ChangeRequest, StageGate } from '../types';

type TabType = 'overview' | 'dependencies' | 'risks';

const OverviewContent: React.FC<{
    projects: any[];
    stats: any;
    changeRequests: any[];
    setSelectedRequest: (cr: any) => void;
    navigate: any;
    setActiveTab: (tab: TabType) => void;
}> = ({ projects, stats, changeRequests, setSelectedRequest, navigate, setActiveTab }) => {
    const portfolioMetrics = useMemo(() => {
        return calculatePortfolioMetrics(projects);
    }, [projects]);

    const healthChartData = [
        { name: '健康', value: portfolioMetrics.healthDistribution.green, color: '#10b981' },
        { name: '警告', value: portfolioMetrics.healthDistribution.amber, color: '#f59e0b' },
        { name: '风险', value: portfolioMetrics.healthDistribution.red, color: '#ef4444' }
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 1. 战略级核心指标 (Hero Scoreboard) - 增加视觉冲击力 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                <Card className="lg:col-span-2 p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-xl relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Target size={140} />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-4 opacity-80">
                                <GitBranch size={20} />
                                <span className="text-sm font-bold uppercase tracking-widest">战略执行总览 (CTPM Portfolio)</span>
                            </div>
                            <div className="flex items-end justify-between">
                                <div>
                                    <div className="text-4xl font-black mb-1">{stats.activeProjects} / {stats.totalProjects}</div>
                                    <p className="text-blue-100 text-sm">活跃项目数 / 总项目库</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-emerald-300">{stats.completionRate.toFixed(1)}%</div>
                                    <p className="text-blue-200 text-xs text-nowrap">全组合平均进度</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 w-full bg-white/20 h-2 rounded-full overflow-hidden">
                            <div className="bg-white h-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000" style={{ width: `${stats.completionRate}%` }} />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg flex flex-col justify-between hover:shadow-xl transition-all">
                    <div>
                        <div className="flex items-center gap-2 mb-4 text-orange-500">
                            <AlertTriangle size={20} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">关键变更审批</span>
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-slate-100">{stats.pendingChangeRequests}</div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-red-500 uppercase">Urgent Action Required</span>
                        <Button size="sm" variant="ghost" onClick={() => navigate('/pmo')} className="hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600"><FileText size={16} /></Button>
                    </div>
                </Card>

                <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg flex flex-col justify-between hover:shadow-xl transition-all">
                    <div>
                        <div className="flex items-center gap-2 mb-4 text-emerald-500">
                            <DollarSign size={20} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">组合预算执行</span>
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-slate-100">¥{(portfolioMetrics.totalBudget / 10000).toFixed(0)}w</div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-[10px]">
                        <div className="flex justify-between text-slate-500 mb-1 font-bold">
                            <span>BUDGET BURN</span>
                            <span className="text-emerald-600">{(portfolioMetrics.totalSpent / portfolioMetrics.totalBudget * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(portfolioMetrics.totalSpent / portfolioMetrics.totalBudget * 100)}%` }} />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg flex flex-col justify-between hover:shadow-xl transition-all">
                    <div>
                        <div className="flex items-center gap-2 mb-4 text-indigo-500">
                            <Users size={20} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">人力资源效能</span>
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-slate-100">{portfolioMetrics.resourceUtilizationRate}%</div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="neutral" className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 border-none font-bold text-[9px]">{portfolioMetrics.totalResourcesAllocated} RESOURCES ACTIVE</Badge>
                        </div>
                    </div>
                </Card>
            </div>

            {/* 2. 项目健康监控矩阵 (Main Engine) - 横向巨幕布局 */}
            <div className="grid grid-cols-1 gap-6">
                <ProjectHealthGrid projects={projects} />
            </div>

            {/* 3. 系统防御与管控中心 (Analysis & Command) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 组合健康分布图 - 占据 4/12 */}
                <Card className="lg:col-span-4 p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mb-6 flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2 uppercase tracking-tight">
                            <TrendingUp size={18} className="text-emerald-500" />
                            Health Status Distribution
                        </div>
                        <Badge variant="success">LIVE DATA</Badge>
                    </h3>
                    <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={healthChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={85}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {healthChartData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* 防御状态报告 (Command Center Module) - 占据 8/12 */}
                <Card className="lg:col-span-8 p-0 bg-slate-900 border-none shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[300px] group">
                    <div className="p-8 flex-1 flex flex-col justify-between">
                        <div>
                            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                                PMO INTELLIGENCE SHIELD
                            </h3>
                            <div className="space-y-6">
                                <div className="bg-slate-800/80 p-5 rounded-2xl border border-white/5 backdrop-blur-sm">
                                    <p className="text-slate-500 text-[10px] font-black uppercase mb-2 tracking-widest flex items-center gap-2">
                                        <CheckCircle size={12} className="text-emerald-500" />
                                        Autonomous Analytics Report
                                    </p>
                                    <p className="text-slate-200 text-sm leading-relaxed font-medium">
                                        系统防御层运行稳定。检测到 <span className="text-red-400 font-black px-1.5 py-0.5 bg-red-500/10 rounded">{portfolioMetrics.criticalRisks}</span> 项关键风险暴露，
                                        建议针对当前环境负载为 <span className="text-emerald-400 font-black">{((1 - stats.availableEnvironments / Math.max(1, stats.totalEnvironments)) * 100).toFixed(0)}%</span> 的瓶颈项开启推演。
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mt-8">
                            <Button
                                onClick={() => navigate('/simulation')}
                                variant="primary"
                                className="bg-blue-600 hover:bg-blue-500 text-white border-none px-6 py-6 font-bold shadow-xl shadow-blue-900/40 rounded-xl"
                            >
                                <TrendingUp className="mr-2 h-4 w-4" /> 开启 What-If 推演
                            </Button>
                            <Button
                                onClick={() => setActiveTab('dependencies')}
                                variant="secondary"
                                className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 px-6 py-6 font-bold rounded-xl"
                            >
                                <Network className="mr-2 h-4 w-4" /> 跨项目深度分析
                            </Button>
                        </div>
                    </div>
                    <div className="bg-white/5 p-8 w-full md:w-72 border-l border-white/5 flex flex-col justify-center backdrop-blur-xl">
                        <div className="space-y-8">
                            <div className="relative">
                                <div className="text-[10px] font-black text-slate-500 mb-1 tracking-widest uppercase">需求交付完成率</div>
                                <div className="text-4xl font-black text-white">{stats.requirementCompletionRate.toFixed(0)}<span className="text-lg opacity-40 ml-1">%</span></div>
                                <div className="absolute -left-3 top-0 bottom-0 w-1 bg-emerald-500 rounded-full" />
                            </div>
                            <div className="relative">
                                <div className="text-[10px] font-black text-slate-500 mb-1 tracking-widest uppercase">环境可用资源</div>
                                <div className="text-4xl font-black text-white">{stats.availableEnvironments}<span className="text-lg opacity-40 ml-1">/{stats.totalEnvironments}</span></div>
                                <div className="absolute -left-3 top-0 bottom-0 w-1 bg-indigo-500 rounded-full" />
                            </div>
                            <div className="pt-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black border border-emerald-500/20">
                                    <CheckCircle size={14} /> DEFENSE SECURE
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* 4. 底层管控：变更流转与健康指标识别 (Log & Monitoring) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 待审变更请求清单 - 占据 7/12 */}
                <Card className="lg:col-span-7 p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8 border-b pb-4 border-slate-100 dark:border-slate-700">
                        <h3 className="text-base font-black flex items-center gap-2 uppercase tracking-tight">
                            <FileText size={18} className="text-blue-500" />
                            Pending Change Control
                        </h3>
                        <Button variant="ghost" size="sm" className="text-[10px] uppercase font-black text-blue-600 tracking-widest" onClick={() => navigate('/pmo')}>
                            Open Control Center
                        </Button>
                    </div>
                    {changeRequests.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-700">
                                        <th className="pb-4 font-black text-[10px] uppercase tracking-widest">Project Name</th>
                                        <th className="pb-4 font-black text-[10px] uppercase tracking-widest">Type</th>
                                        <th className="pb-4 font-black text-[10px] uppercase tracking-widest">Priority</th>
                                        <th className="pb-4 font-black text-[10px] uppercase tracking-widest text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {changeRequests.slice(0, 5).map((cr) => (
                                        <tr
                                            key={cr.id}
                                            onClick={() => setSelectedRequest(cr)}
                                            className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                        >
                                            <td className="py-5 font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{cr.projectName}</td>
                                            <td className="py-5">
                                                <Badge variant="neutral" className="bg-slate-100 dark:bg-slate-700 border-none text-[9px] font-black uppercase">{cr.category}</Badge>
                                            </td>
                                            <td className="py-5">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${cr.status === 'pending' ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{cr.status}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 text-right text-slate-400 font-mono text-[10px]">{new Date(cr.requestDate).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-20 text-center">
                            <Briefcase size={40} className="mx-auto text-slate-200 mb-4 opacity-50" />
                            <p className="text-slate-400 text-sm font-medium">变更请求队列为空</p>
                        </div>
                    )}
                </Card>

                {/* 异常项监控看板 - 占据 5/12 */}
                <Card className="lg:col-span-5 p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-base font-black mb-8 flex items-center gap-2 uppercase tracking-tight border-b pb-4 border-slate-100 dark:border-slate-700">
                        <AlertTriangle size={18} className="text-red-500" />
                        Exception Watchlist
                    </h3>
                    <div className="max-h-[380px] overflow-y-auto no-scrollbar scroll-smooth">
                        <ProjectHealthMonitor projects={projects} />
                    </div>
                </Card>
            </div>
        </div>
    );
};

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
                    <OverviewContent projects={projects} stats={stats} changeRequests={recentChangeRequests} setSelectedRequest={setSelectedRequest} navigate={navigate} setActiveTab={setActiveTab} />
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
