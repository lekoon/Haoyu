import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, Calendar, TrendingUp, Edit2, ShieldAlert, CheckCircle2, Server, Flag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { usePMOStore } from '../store/usePMOStore';
import { Badge } from '../components/ui';
import { useProjectDetail } from '../hooks/useProjects';

const ProjectDetail: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { resourcePool, user } = useStore();
    const { simulations, changeRequests } = usePMOStore();
    const { t } = useTranslation();

    const { data: project, isLoading } = useProjectDetail(projectId);

    // 获取 PMO 维度的联动影响
    const pmoImpacts = useMemo(() => {
        if (!project) return [];

        const impacts = [];

        // 1. 活跃的沙盘推演影响
        const activeSim = simulations.find(s => s.isActive && s.impactAnalysis?.affectedProjects.includes(project.id));
        if (activeSim) {
            impacts.push({
                type: 'simulation',
                title: '沙盘推演联动',
                content: `本项目受 "${activeSim.name}" 推演影响，预计延期 ${activeSim.impactAnalysis?.totalDelayDays} 天`,
                level: 'warning'
            });
        }

        // 2. 待处理的变更请求
        const pendingCRs = changeRequests.filter(cr => cr.projectId === project.id && cr.status === 'pending');
        if (pendingCRs.length > 0) {
            impacts.push({
                type: 'change_request',
                title: '待审批变更',
                content: `当前有 ${pendingCRs.length} 个变更请求等待决策，可能触发进度重基线`,
                level: 'info'
            });
        }

        return impacts;
    }, [project, simulations, changeRequests]);

    // 计算资源投入数据
    const resourceData = useMemo(() => {
        if (!project) return [];

        const dataMap = new Map<string, { name: string; value: number; color: string }>();
        const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

        (project.resourceRequirements || []).forEach((req, idx) => {
            const resource = resourcePool.find(r => r.id === req.resourceId);
            if (resource) {
                const hours = req.count * req.duration * (req.unit === 'month' ? 160 : req.unit === 'day' ? 8 : 1920);
                dataMap.set(resource.id, {
                    name: resource.name,
                    value: hours,
                    color: colors[idx % colors.length]
                });
            }
        });

        return Array.from(dataMap.values());
    }, [project, resourcePool]);

    // 模拟历史趋势数据
    const trendData = useMemo(() => {
        return [
            { week: 'Week 1', hours: 120 },
            { week: 'Week 2', hours: 150 },
            { week: 'Week 3', hours: 180 },
            { week: 'Week 4', hours: 160 },
        ];
    }, []);

    // 本周分配明细
    const weeklyAllocations = useMemo(() => {
        if (!project) return [];

        return (project.resourceRequirements || []).map(req => {
            const resource = resourcePool.find(r => r.id === req.resourceId);
            return {
                employee: resource?.name || 'Unknown',
                role: resource?.name || 'N/A',
                hours: req.count * (req.unit === 'day' ? 8 : req.unit === 'month' ? 160 : 1920),
                projects: 1
            };
        });
    }, [project, resourcePool]);

    const totalHours = resourceData.reduce((sum, d) => sum + d.value, 0);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('projectDetail.notFound')}</h2>
                    <button
                        onClick={() => navigate('/projects')}
                        className="text-blue-600 hover:underline"
                    >
                        {t('projectDetail.backToProjects')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Project Header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
                >
                    <ArrowLeft size={20} />
                    {t('common.back')}
                </button>

                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded text-sm font-bold ${project.priority === 'P0' ? 'bg-red-100 text-red-700' :
                                project.priority === 'P1' ? 'bg-orange-100 text-orange-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                {project.priority || 'P2'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm ${project.status === 'active' ? 'bg-green-100 text-green-700' :
                                project.status === 'planning' ? 'bg-blue-100 text-blue-700' :
                                    project.status === 'completed' ? 'bg-slate-100 text-slate-700' :
                                        'bg-yellow-100 text-yellow-700'
                                }`}>
                                {project.status}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">{project.name}</h1>
                        <p className="text-slate-600 mb-4">{project.description}</p>
                        <div className="flex items-center gap-6 text-sm text-slate-500">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} />
                                <span>{project.startDate} - {project.endDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <TrendingUp size={16} />
                                <span>{t('projectDetail.score')}: {(project.score || 0).toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                    {user?.role !== 'user' && (
                        <button
                            onClick={() => navigate(`/resources?project=${project.id}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            <Edit2 size={18} />
                            {t('projectDetail.adjustResources')}
                        </button>
                    )}
                </div>
            </div>

            {/* PMO 维度联动影响 */}
            {pmoImpacts.length > 0 && (
                <div className="bg-orange-50/30 border border-orange-100 rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
                        <ShieldAlert size={20} />
                        PMO 维度联动影响分析
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pmoImpacts.map((impact, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-orange-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant={impact.level === 'warning' ? 'danger' : 'primary'} size="sm">{impact.title}</Badge>
                                </div>
                                <p className="text-sm text-slate-600">{impact.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Resource Investment & Historical Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">{t('projectDetail.resourceInvestment')}</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={resourceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                >
                                    {resourceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `${value}h`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-sm text-slate-500">{t('projectDetail.totalHours')}</p>
                        <p className="text-2xl font-bold text-slate-900">{totalHours}h</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">{t('projectDetail.historicalTrend')}</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="week" tick={{ fill: '#64748b' }} />
                                <YAxis tick={{ fill: '#64748b' }} />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="hours"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    name={t('projectDetail.hours')}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 里程碑进度 */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Flag className="text-blue-600" size={20} />
                            里程碑进度掌控
                        </h2>
                        <Badge variant="primary">{(project.milestones?.filter(m => m.completed).length || 0)}/{(project.milestones?.length || 0)} 已完成</Badge>
                    </div>
                    <div className="space-y-4">
                        {project.milestones?.map((milestone) => (
                            <div key={milestone.id} className="relative pl-8 pb-4 border-l-2 border-slate-100 last:border-0 last:pb-0">
                                <div className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${milestone.completed ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className={`text-sm font-bold ${milestone.completed ? 'text-slate-900' : 'text-slate-500'}`}>{milestone.name}</h4>
                                        <p className="text-xs text-slate-400">{milestone.date}</p>
                                    </div>
                                    {milestone.completed && <CheckCircle2 size={16} className="text-green-500" />}
                                </div>
                            </div>
                        ))}
                        {(!project.milestones || project.milestones.length === 0) && (
                            <div className="text-center py-6 text-slate-400 text-sm italic">暂未配置里程碑</div>
                        )}
                    </div>
                </div>

                {/* 环境资源使用情况 */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Server className="text-purple-600" size={20} />
                        环境资源独占/共享状态
                    </h2>
                    <div className="space-y-3">
                        {project.environmentRequirements?.map((req, idx) => (
                            <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-slate-700">{req.environmentName}</span>
                                    <Badge variant="neutral">{req.purpose}</Badge>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        {req.startDate} 至 {req.endDate}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!project.environmentRequirements || project.environmentRequirements.length === 0) && (
                            <div className="text-center py-6 text-slate-400 text-sm italic">暂未预定环境资源</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Weekly Allocation Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">{t('projectDetail.weeklyAllocation')}</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left p-3 text-sm font-semibold text-slate-600">
                                    {t('projectDetail.employee')}
                                </th>
                                <th className="text-left p-3 text-sm font-semibold text-slate-600">
                                    {t('projectDetail.role')}
                                </th>
                                <th className="text-center p-3 text-sm font-semibold text-slate-600">
                                    {t('projectDetail.allocatedHours')}
                                </th>
                                <th className="text-center p-3 text-sm font-semibold text-slate-600">
                                    {t('projectDetail.projectCount')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {weeklyAllocations.map((allocation, idx) => (
                                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                                                {allocation.employee.charAt(0)}
                                            </div>
                                            <span className="font-medium text-slate-900">{allocation.employee}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-slate-600">{allocation.role}</td>
                                    <td className="p-3 text-center">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                            {allocation.hours}h
                                        </span>
                                    </td>
                                    <td className="p-3 text-center text-slate-600">{allocation.projects}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetail;
