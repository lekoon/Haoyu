import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, TrendingUp, Edit2, Plus, Trash2, Check, X, DollarSign } from 'lucide-react';
// import { useTranslation } from 'react-i18next'; // Unused
import { format, parseISO, differenceInDays } from 'date-fns';
import CostRegistrationForm from '../components/CostRegistrationForm';
import type { CostEntry } from '../types';

interface Milestone {
    id: string;
    name: string;
    date: string;
    completed: boolean;
    description?: string;
}

const ProjectDetailEnhanced: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { projects, updateProject } = useStore();
    // const { t } = useTranslation(); // Unused for now

    const project = projects.find(p => p.id === projectId);

    // Initialize from project data
    const [isEditing, setIsEditing] = useState(false);
    const [milestones, setMilestones] = useState<Milestone[]>(
        project?.milestones || [
            { id: '1', name: '需求分析完成', date: '2024-01-15', completed: true },
            { id: '2', name: '设计评审', date: '2024-02-01', completed: true },
            { id: '3', name: '开发完成', date: '2024-03-15', completed: false },
            { id: '4', name: '测试完成', date: '2024-04-01', completed: false },
            { id: '5', name: '项目交付', date: '2024-04-15', completed: false },
        ]
    );
    const [newMilestone, setNewMilestone] = useState({ name: '', date: '', description: '' });
    const [showAddMilestone, setShowAddMilestone] = useState(false);
    const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);

    // Cost Management State - Initialize from project data
    const [activeTab, setActiveTab] = useState<'resources' | 'costs' | 'risks'>('resources');
    const [isCostFormOpen, setIsCostFormOpen] = useState(false);
    const [projectCosts, setProjectCosts] = useState<CostEntry[]>(project?.costHistory || []);
    const [projectBudget, setProjectBudget] = useState(project?.budget || 1000000);

    if (!project) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">项目未找到</h2>
                    <button
                        onClick={() => navigate('/projects')}
                        className="text-blue-600 hover:underline"
                    >
                        返回项目列表
                    </button>
                </div>
            </div>
        );
    }

    const projectDuration = useMemo(() => {
        if (!project.startDate || !project.endDate) return 0;
        return differenceInDays(parseISO(project.endDate), parseISO(project.startDate));
    }, [project.startDate, project.endDate]);

    const completedMilestones = milestones.filter(m => m.completed).length;
    const progress = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0;

    const handleAddMilestone = () => {
        if (newMilestone.name && newMilestone.date) {
            const updatedMilestones = [...milestones, {
                id: Date.now().toString(),
                name: newMilestone.name,
                date: newMilestone.date,
                completed: false,
                description: newMilestone.description
            }];
            setMilestones(updatedMilestones);
            setNewMilestone({ name: '', date: '', description: '' });
            setShowAddMilestone(false);

            // Persist to store
            updateProject(project.id, {
                ...project,
                milestones: updatedMilestones
            });
        }
    };

    const toggleMilestone = (id: string) => {
        const updatedMilestones = milestones.map(m =>
            m.id === id ? { ...m, completed: !m.completed } : m
        );
        setMilestones(updatedMilestones);

        // Persist to store
        updateProject(project.id, {
            ...project,
            milestones: updatedMilestones
        });
    };

    const deleteMilestone = (id: string) => {
        const updatedMilestones = milestones.filter(m => m.id !== id);
        setMilestones(updatedMilestones);

        // Persist to store
        updateProject(project.id, {
            ...project,
            milestones: updatedMilestones
        });
    };

    const updateMilestoneDate = (id: string, newDate: string) => {
        const updatedMilestones = milestones.map(m =>
            m.id === id ? { ...m, date: newDate } : m
        );
        setMilestones(updatedMilestones);

        // Persist to store
        updateProject(project.id, {
            ...project,
            milestones: updatedMilestones
        });
    };

    const handleSaveCosts = (costs: CostEntry[], budget?: number) => {
        setProjectCosts(costs);
        if (budget) setProjectBudget(budget);

        // Calculate total actual cost
        const totalActualCost = costs.reduce((sum, c) => sum + c.amount, 0);

        // Persist to store
        updateProject(project.id, {
            ...project,
            costHistory: costs,
            budget: budget || project.budget,
            actualCost: totalActualCost
        });
    };

    const totalCost = projectCosts.reduce((sum, c) => sum + c.amount, 0);
    const budgetUtilization = projectBudget > 0 ? (totalCost / projectBudget) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
                <ArrowLeft size={20} />
                返回
            </button>

            {/* Project Header Card */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${project.priority === 'P0' ? 'bg-red-500/20 border border-red-300' :
                                project.priority === 'P1' ? 'bg-orange-500/20 border border-orange-300' :
                                    'bg-blue-500/20 border border-blue-300'
                                }`}>
                                {project.priority || 'P2'}
                            </span>
                            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${project.status === 'active' ? 'bg-green-500/20 border border-green-300' :
                                project.status === 'planning' ? 'bg-blue-500/20 border border-blue-300' :
                                    project.status === 'completed' ? 'bg-purple-500/20 border border-purple-300' :
                                        'bg-orange-500/20 border border-orange-300'
                                }`}>
                                {project.status}
                            </span>
                        </div>
                        <h1 className="text-4xl font-bold mb-3">{project.name}</h1>
                        <p className="text-blue-100 text-lg mb-4">{project.description}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                                <div className="text-xs text-blue-100 mb-1">开始日期</div>
                                <div className="font-bold">{project.startDate}</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                                <div className="text-xs text-blue-100 mb-1">结束日期</div>
                                <div className="font-bold">{project.endDate}</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                                <div className="text-xs text-blue-100 mb-1">项目周期</div>
                                <div className="font-bold">{projectDuration} 天</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                                <div className="text-xs text-blue-100 mb-1">评分</div>
                                <div className="font-bold flex items-center gap-1">
                                    <TrendingUp size={16} />
                                    {project.score.toFixed(1)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg transition-colors"
                    >
                        <Edit2 size={18} />
                        编辑
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">项目进度</span>
                        <span className="text-sm font-bold">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-3">
                        <div
                            className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between items-center mt-2 text-xs text-blue-100">
                        <span>{completedMilestones} / {milestones.length} 里程碑完成</span>
                    </div>
                </div>
            </div>

            {/* Gantt Chart Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">项目甘特图</h2>
                        <p className="text-sm text-slate-500 mt-1">拖动里程碑可调整时间</p>
                    </div>
                    <button
                        onClick={() => setShowAddMilestone(!showAddMilestone)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        <Plus size={18} />
                        添加里程碑
                    </button>
                </div>

                {/* Add Milestone Form */}
                {showAddMilestone && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                placeholder="里程碑名称"
                                value={newMilestone.name}
                                onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                                className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="date"
                                value={newMilestone.date}
                                onChange={(e) => setNewMilestone({ ...newMilestone, date: e.target.value })}
                                className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAddMilestone}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                    <Check size={16} />
                                    添加
                                </button>
                                <button
                                    onClick={() => setShowAddMilestone(false)}
                                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Gantt Timeline */}
                <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                        {/* Timeline Header */}
                        <div className="flex border-b border-slate-200 pb-2 mb-4">
                            <div className="w-64 font-semibold text-slate-700">里程碑</div>
                            <div className="flex-1 flex justify-between text-xs text-slate-500">
                                {project.startDate && project.endDate && (
                                    <>
                                        <span>{format(parseISO(project.startDate), 'yyyy-MM-dd')}</span>
                                        <span>{format(parseISO(project.endDate), 'yyyy-MM-dd')}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Milestone Rows */}
                        <div className="space-y-3">
                            {milestones.map((milestone) => {
                                const milestoneDate = parseISO(milestone.date);
                                const projectStart = parseISO(project.startDate || '');
                                const totalDays = projectDuration;
                                const daysFromStart = differenceInDays(milestoneDate, projectStart);
                                const position = totalDays > 0 ? (daysFromStart / totalDays) * 100 : 0;

                                return (
                                    <div key={milestone.id} className="flex items-center group">
                                        <div className="w-64 flex items-center gap-2">
                                            <button
                                                onClick={() => toggleMilestone(milestone.id)}
                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${milestone.completed
                                                    ? 'bg-green-500 border-green-500'
                                                    : 'border-slate-300 hover:border-blue-500'
                                                    }`}
                                            >
                                                {milestone.completed && <Check size={14} className="text-white" />}
                                            </button>
                                            <span className={`text-sm ${milestone.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                                {milestone.name}
                                            </span>
                                        </div>
                                        <div className="flex-1 relative h-8 bg-slate-50 rounded">
                                            <div
                                                className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full cursor-pointer transition-colors hover:scale-125 ${milestone.completed ? 'bg-green-500' : 'bg-blue-500'
                                                    }`}
                                                style={{ left: `${Math.max(0, Math.min(100, position))}%` }}
                                                title={`${milestone.date} - 点击编辑日期`}
                                                onClick={() => setEditingMilestoneId(milestone.id)}
                                            />
                                            {editingMilestoneId === milestone.id ? (
                                                <input
                                                    type="date"
                                                    value={milestone.date}
                                                    onChange={(e) => updateMilestoneDate(milestone.id, e.target.value)}
                                                    onBlur={() => setEditingMilestoneId(null)}
                                                    autoFocus
                                                    className="absolute top-full mt-1 px-2 py-1 text-xs border border-blue-500 rounded shadow-lg z-10 bg-white"
                                                    style={{ left: `${Math.max(0, Math.min(100, position))}%`, transform: 'translateX(-50%)' }}
                                                />
                                            ) : (
                                                <div
                                                    className="absolute top-full mt-1 text-xs text-slate-500 whitespace-nowrap cursor-pointer hover:text-blue-600 hover:font-semibold transition-colors"
                                                    style={{ left: `${Math.max(0, Math.min(100, position))}%`, transform: 'translateX(-50%)' }}
                                                    onClick={() => setEditingMilestoneId(milestone.id)}
                                                    title="点击编辑日期"
                                                >
                                                    {milestone.date}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => deleteMilestone(milestone.id)}
                                            className="ml-2 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Resource & Cost Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex gap-4 border-b border-slate-200 mb-6">
                    <button
                        onClick={() => setActiveTab('resources')}
                        className={`px-4 py-2 font-medium transition-colors ${activeTab === 'resources' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        资源分配
                    </button>
                    <button
                        onClick={() => setActiveTab('costs')}
                        className={`px-4 py-2 font-medium transition-colors ${activeTab === 'costs' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        成本分析
                    </button>
                    <button
                        onClick={() => setActiveTab('risks')}
                        className={`px-4 py-2 font-medium transition-colors ${activeTab === 'risks' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        风险评估
                    </button>
                </div>

                {activeTab === 'resources' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {project.resourceRequirements.map((req, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-semibold text-slate-900">资源 #{idx + 1}</h4>
                                        <p className="text-sm text-slate-500">数量: {req.count}</p>
                                    </div>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                        {req.duration} {req.unit}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {project.resourceRequirements.length === 0 && (
                            <div className="col-span-2 text-center py-8 text-slate-400">
                                暂无资源分配
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'costs' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                <div className="text-sm text-blue-600 font-medium mb-1">总预算</div>
                                <div className="text-2xl font-bold text-slate-900">¥{projectBudget.toLocaleString()}</div>
                            </div>
                            <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                                <div className="text-sm text-green-600 font-medium mb-1">实际支出</div>
                                <div className="text-2xl font-bold text-slate-900">¥{totalCost.toLocaleString()}</div>
                            </div>
                            <div className={`p-6 rounded-xl border ${budgetUtilization > 100 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                                <div className={`text-sm font-medium mb-1 ${budgetUtilization > 100 ? 'text-red-600' : 'text-slate-600'}`}>预算使用率</div>
                                <div className="text-2xl font-bold text-slate-900">{budgetUtilization.toFixed(1)}%</div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">成本明细</h3>
                            <button
                                onClick={() => setIsCostFormOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                <DollarSign size={18} />
                                登记/管理成本
                            </button>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-200">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 font-semibold text-slate-600">日期</th>
                                        <th className="p-4 font-semibold text-slate-600">类别</th>
                                        <th className="p-4 font-semibold text-slate-600">说明</th>
                                        <th className="p-4 font-semibold text-slate-600 text-right">金额</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {projectCosts.length > 0 ? (
                                        projectCosts.map((cost) => (
                                            <tr key={cost.id} className="hover:bg-slate-50">
                                                <td className="p-4 text-slate-600">{cost.date}</td>
                                                <td className="p-4">
                                                    <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600 capitalize">
                                                        {cost.category}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-slate-900">{cost.description}</td>
                                                <td className="p-4 text-right font-medium text-slate-900">¥{cost.amount.toLocaleString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-slate-400">
                                                暂无成本记录
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'risks' && (
                    <div className="text-center py-12 text-slate-400">
                        风险评估模块开发中...
                    </div>
                )}
            </div>

            {/* Cost Registration Modal */}
            {isCostFormOpen && (
                <CostRegistrationForm
                    projectId={project.id}
                    projectName={project.name}
                    budget={projectBudget}
                    existingCosts={projectCosts}
                    onSave={handleSaveCosts}
                    onClose={() => setIsCostFormOpen(false)}
                />
            )}
        </div>
    );
};

export default ProjectDetailEnhanced;
