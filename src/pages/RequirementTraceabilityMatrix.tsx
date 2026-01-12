import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { usePMOStore } from '../store/usePMOStore';
import { ArrowLeft, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { detectGhostTasks } from '../utils/scopeManagement';
import { Card, Button, Badge } from '../components/ui';

const RequirementTraceabilityMatrix: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { projects } = useStore();
    const { getRequirementsByProject } = usePMOStore();

    const project = projects.find((p) => p.id === projectId);
    const projectRequirements = useMemo(
        () => (projectId ? getRequirementsByProject(projectId) : []),
        [projectId, getRequirementsByProject]
    );

    // 检测幽灵任务
    const ghostTasks = useMemo(() => {
        if (!project) return [];
        return detectGhostTasks(project, projectRequirements);
    }, [project, projectRequirements]);

    if (!project) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">项目未找到</h2>
                    <button onClick={() => navigate('/projects')} className="text-blue-600 hover:underline">
                        返回项目列表
                    </button>
                </div>
            </div>
        );
    }

    const tasks = project.tasks || [];
    const totalTasks = tasks.length;
    const linkedTasks = tasks.filter((task) =>
        projectRequirements.some((req) => req.relatedTaskIds.includes(task.id))
    ).length;
    const coveragePercentage = totalTasks > 0 ? (linkedTasks / totalTasks) * 100 : 0;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
            <div className="max-w-[1920px] mx-auto w-full">
                <button
                    onClick={() => navigate(`/projects/${projectId}`)}
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    返回项目详情
                </button>

                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                        需求追踪矩阵 - {project.name}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        建立需求、任务和交付物的全链路追踪，识别幽灵任务
                    </p>
                </div>

                {/* 统计卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">总需求数</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    {projectRequirements.length}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">任务覆盖率</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {coveragePercentage.toFixed(0)}%
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">已关联任务</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    {linkedTasks} / {totalTasks}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">幽灵任务</p>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                    {ghostTasks.length}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* 幽灵任务警告 */}
                {ghostTasks.length > 0 && (
                    <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                                    发现 {ghostTasks.length} 个幽灵任务
                                </h3>
                                <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                                    以下任务未关联任何需求，可能是团队私自添加的"镀金"功能，建议审查或移除。
                                </p>
                                <div className="space-y-2">
                                    {ghostTasks.slice(0, 5).map((ghost) => (
                                        <div
                                            key={ghost.taskId}
                                            className="bg-white dark:bg-slate-800 rounded-lg p-3 text-sm"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                                    {ghost.taskName}
                                                </span>
                                                <Badge variant="danger">
                                                    {ghost.estimatedEffort}h
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                    {ghostTasks.length > 5 && (
                                        <p className="text-xs text-red-700 dark:text-red-300">
                                            还有 {ghostTasks.length - 5} 个幽灵任务...
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* 需求列表 */}
                {projectRequirements.length > 0 ? (
                    <div className="space-y-4">
                        {projectRequirements.map((requirement) => {
                            const relatedTasks = tasks.filter((task) =>
                                requirement.relatedTaskIds.includes(task.id)
                            );

                            return (
                                <Card key={requirement.id} className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                                    {requirement.title}
                                                </h3>
                                                <Badge
                                                    variant={
                                                        requirement.status === 'completed'
                                                            ? 'success'
                                                            : requirement.status === 'in-progress'
                                                                ? 'primary'
                                                                : 'neutral'
                                                    }
                                                >
                                                    {requirement.status}
                                                </Badge>
                                                <Badge variant={requirement.priority === 'P0' ? 'danger' : 'neutral'}>
                                                    {requirement.priority}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {requirement.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 关联的任务 */}
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            关联任务 ({relatedTasks.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {relatedTasks.map((task) => (
                                                <div
                                                    key={task.id}
                                                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                                                >
                                                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                    <span className="text-sm text-slate-900 dark:text-slate-100">
                                                        {task.name}
                                                    </span>
                                                </div>
                                            ))}
                                            {relatedTasks.length === 0 && (
                                                <p className="text-sm text-slate-400 text-center py-2">
                                                    暂无关联任务
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="p-12 text-center">
                        <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                            暂无需求
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-4">
                            添加需求以建立完整的追踪矩阵
                        </p>
                        <Button onClick={() => navigate(`/projects/${projectId}`)}>
                            返回项目详情
                        </Button>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default RequirementTraceabilityMatrix;
