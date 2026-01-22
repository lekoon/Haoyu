import React, { useMemo } from 'react';
import { GitBranch, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import type { Project } from '../types';
import { Card, Badge } from './ui';

interface ProjectDependencyViewerProps {
    projects: Project[];
    selectedProjectId?: string;
}

export const ProjectDependencyViewer: React.FC<ProjectDependencyViewerProps> = ({
    projects,
    selectedProjectId,
}) => {
    const dependencyData = useMemo(() => {
        const selectedProject = selectedProjectId
            ? projects.find((p) => p.id === selectedProjectId)
            : null;

        if (!selectedProject) {
            return {
                upstream: [],
                downstream: [],
                hasCircular: false,
            };
        }

        // 查找上游依赖（被依赖的项目）
        const upstream = projects.filter((p) =>
            selectedProject.dependencies?.some((dep) => dep.projectId === p.id)
        );

        // 查找下游依赖（依赖此项目的项目）
        const downstream = projects.filter((p) =>
            p.dependencies?.some((dep) => dep.projectId === selectedProject.id)
        );

        // 简单的循环依赖检测
        const hasCircular = upstream.some((up) =>
            up.dependencies?.some((dep) => dep.projectId === selectedProject.id)
        );

        return {
            upstream,
            downstream,
            hasCircular,
        };
    }, [projects, selectedProjectId]);

    if (!selectedProjectId) {
        return (
            <Card className="p-6 text-center">
                <GitBranch className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">
                    选择一个项目以查看其依赖关系
                </p>
            </Card>
        );
    }

    const selectedProject = projects.find((p) => p.id === selectedProjectId);
    if (!selectedProject) return null;

    return (
        <div className="space-y-4">
            {/* 循环依赖警告 */}
            {dependencyData.hasCircular && (
                <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <div>
                            <h4 className="font-semibold text-red-900 dark:text-red-100">
                                检测到循环依赖
                            </h4>
                            <p className="text-sm text-red-700 dark:text-red-300">
                                此项目与其依赖项之间存在循环引用，可能导致死锁
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* 当前项目 */}
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <GitBranch className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                            {selectedProject.name}
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            当前选中项目
                        </p>
                    </div>
                    <Badge
                        variant={
                            selectedProject.status === 'active'
                                ? 'success'
                                : selectedProject.status === 'completed'
                                    ? 'neutral'
                                    : 'warning'
                        }
                    >
                        {selectedProject.status}
                    </Badge>
                </div>
            </Card>

            {/* 上游依赖 */}
            <div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    上游依赖 ({dependencyData.upstream.length})
                </h4>
                {dependencyData.upstream.length > 0 ? (
                    <div className="space-y-2">
                        {dependencyData.upstream.map((project) => {
                            const isDelayed =
                                project.status === 'active' &&
                                new Date(project.endDate) < new Date();

                            return (
                                <Card
                                    key={project.id}
                                    className={`p-3 ${isDelayed
                                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                                            : ''
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {project.status === 'completed' ? (
                                                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                            ) : isDelayed ? (
                                                <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                            ) : (
                                                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            )}
                                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                {project.name}
                                            </span>
                                        </div>
                                        <Badge
                                            variant={
                                                project.status === 'completed'
                                                    ? 'success'
                                                    : isDelayed
                                                        ? 'warning'
                                                        : 'primary'
                                            }
                                            size="sm"
                                        >
                                            {project.status}
                                        </Badge>
                                    </div>
                                    {isDelayed && (
                                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                            ⚠️ 此项目已延期，可能影响当前项目进度
                                        </p>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="p-4 text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            无上游依赖
                        </p>
                    </Card>
                )}
            </div>

            {/* 下游依赖 */}
            <div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    下游依赖 ({dependencyData.downstream.length})
                </h4>
                {dependencyData.downstream.length > 0 ? (
                    <div className="space-y-2">
                        {dependencyData.downstream.map((project) => (
                            <Card key={project.id} className="p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <GitBranch className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {project.name}
                                        </span>
                                    </div>
                                    <Badge variant="neutral" size="sm">
                                        {project.status}
                                    </Badge>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="p-4 text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            无下游依赖
                        </p>
                    </Card>
                )}
            </div>

            {/* 影响分析 */}
            {dependencyData.downstream.length > 0 && (
                <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                    <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-100 mb-2">
                        💡 影响分析
                    </h4>
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                        此项目的延期将直接影响 {dependencyData.downstream.length} 个下游项目。
                        建议密切监控进度，必要时启动依赖熔断机制。
                    </p>
                </Card>
            )}
        </div>
    );
};

export default ProjectDependencyViewer;
