import React, { useState } from 'react';
import { Play, RotateCcw, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { usePMOStore } from '../store/usePMOStore';
import { Card, Button, Badge } from '../components/ui';

const WhatIfSimulation: React.FC = () => {
    const { simulations, createSimulation, getActiveSimulation } = usePMOStore();

    const [simulationName, setSimulationName] = useState('');
    const [selectedScenario, setSelectedScenario] = useState<'resource_change' | 'priority_change' | 'new_project' | 'delay_simulation'>('delay_simulation');
    const [isRunning, setIsRunning] = useState(false);

    const activeSimulation = getActiveSimulation();

    // 模拟计算影响
    const calculateImpact = () => {
        setIsRunning(true);

        // 模拟计算（实际应该有复杂的算法）
        setTimeout(() => {
            const totalDelayDays = Math.floor(Math.random() * 60) + 10;
            const resourceConflicts = Math.floor(Math.random() * 5);
            const budgetImpact = Math.floor(Math.random() * 500000) + 100000;

            createSimulation({
                name: simulationName || `模拟 ${new Date().toLocaleString()}`,
                description: `场景：${selectedScenario}`,
                scenarioType: selectedScenario,
                changes: [],
                impactAnalysis: {
                    affectedProjects: [],
                    totalDelayDays,
                    resourceConflicts,
                    budgetImpact,
                },
                createdBy: 'current-user',
                createdByName: '当前用户',
                isActive: true,
            });
            setIsRunning(false);
        }, 2000);
    };

    const resetSimulation = () => {
        setSimulationName('');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                        What-If 沙盘推演
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        模拟不同场景对项目组合的影响，辅助决策
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 左侧：场景配置 */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                                场景配置
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        模拟名称
                                    </label>
                                    <input
                                        type="text"
                                        value={simulationName}
                                        onChange={(e) => setSimulationName(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800"
                                        placeholder="例如：Q1 新项目插入影响分析"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        场景类型
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { value: 'new_project', label: '插入新项目', icon: '➕' },
                                            { value: 'delay_simulation', label: '项目延期', icon: '⏱️' },
                                            { value: 'resource_change', label: '资源调配', icon: '👥' },
                                            { value: 'priority_change', label: '优先级调整', icon: '🎯' },
                                        ].map((scenario) => (
                                            <button
                                                key={scenario.value}
                                                onClick={() => setSelectedScenario(scenario.value as any)}
                                                className={`p-4 rounded-lg border-2 transition-all ${selectedScenario === scenario.value
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                                    }`}
                                            >
                                                <div className="text-2xl mb-2">{scenario.icon}</div>
                                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                    {scenario.label}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                        场景说明
                                    </h4>
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        {selectedScenario === 'new_project' && '模拟在当前项目组合中插入一个新的高优先级项目，分析对现有项目的资源和进度影响。'}
                                        {selectedScenario === 'delay_simulation' && '模拟某个关键项目延期，分析对依赖项目和整体交付的影响。'}
                                        {selectedScenario === 'resource_change' && '模拟从一个项目抽调资源支援另一个项目，分析双方的影响。'}
                                        {selectedScenario === 'priority_change' && '模拟调整项目优先级，分析资源重新分配的影响。'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <Button
                                    onClick={calculateImpact}
                                    disabled={isRunning || !simulationName}
                                    className="flex-1"
                                >
                                    {isRunning ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                            计算中...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 mr-2" />
                                            运行模拟
                                        </>
                                    )}
                                </Button>
                                <Button onClick={resetSimulation} variant="secondary">
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    重置
                                </Button>
                            </div>
                        </Card>

                        {/* 影响分析结果 */}
                        {activeSimulation?.impactAnalysis && (
                            <Card className="p-6">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                                    影响分析结果
                                </h3>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                                总延期天数
                                            </span>
                                        </div>
                                        <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                                            {activeSimulation.impactAnalysis.totalDelayDays}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">天</p>
                                    </div>

                                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                                资源冲突
                                            </span>
                                        </div>
                                        <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                                            {activeSimulation.impactAnalysis.resourceConflicts}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">个</p>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 col-span-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                                预算影响
                                            </span>
                                        </div>
                                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                            ¥{(activeSimulation.impactAnalysis.budgetImpact / 10000).toFixed(1)}万
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">预计增加成本</p>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                                        💡 决策建议
                                    </h4>
                                    <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                                        <li>• 考虑延后优先级较低的项目以释放资源</li>
                                        <li>• 增加预算以加速关键路径上的项目</li>
                                        <li>• 评估是否需要外部资源支持</li>
                                    </ul>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* 右侧：历史模拟 */}
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                                历史模拟 ({simulations.length})
                            </h3>

                            <div className="space-y-3">
                                {simulations.slice(0, 10).map((sim) => (
                                    <div
                                        key={sim.id}
                                        className={`p-3 rounded-lg border-2 transition-all ${sim.isActive
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-slate-200 dark:border-slate-700'
                                            }`}
                                    >
                                        <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm mb-1">
                                            {sim.name}
                                        </h4>
                                        <p className="text-xs text-slate-500 mb-2">
                                            {new Date(sim.createdAt).toLocaleString()}
                                        </p>
                                        {sim.impactAnalysis && (
                                            <div className="flex gap-2 text-xs">
                                                <Badge variant="danger" size="sm">
                                                    延期 {sim.impactAnalysis.totalDelayDays}天
                                                </Badge>
                                                <Badge variant="warning" size="sm">
                                                    冲突 {sim.impactAnalysis.resourceConflicts}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {simulations.length === 0 && (
                                    <div className="text-center py-8 text-slate-400 text-sm">
                                        暂无历史模拟
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhatIfSimulation;
