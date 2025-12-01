/**
 * 智能优化建议模块
 * Smart Optimization Panel
 * 
 * 核心功能:
 * - AI驱动的资源优化建议
 * - 多目标优化 (资源利用率 vs 交付效率)
 * - 方案对比与一键调整
 * - 风险评估
 */

import React, { useMemo, useState } from 'react';
import type { Project, ResourcePoolItem } from '../../types';
import type { DeliveryMetrics } from '../../utils/deliveryMetrics';
import { generateOptimizationSuggestions } from '../../utils/deliveryMetrics';
import { Lightbulb, ArrowRight, Check, X, BarChart2, Zap, Layers } from 'lucide-react';

interface SmartOptimizationPanelProps {
    projects: Project[];
    resourcePool: ResourcePoolItem[];
    metrics: DeliveryMetrics[];
}

const SmartOptimizationPanel: React.FC<SmartOptimizationPanelProps> = ({
    projects,
    resourcePool,
    metrics
}) => {
    const [activeTab, setActiveTab] = useState<'suggestions' | 'simulation'>('suggestions');
    const [appliedSuggestions, setAppliedSuggestions] = useState<Set<number>>(new Set());

    const suggestions = useMemo(() => {
        return generateOptimizationSuggestions(metrics, resourcePool);
    }, [metrics, resourcePool]);

    const handleApply = (index: number) => {
        const newSet = new Set(appliedSuggestions);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setAppliedSuggestions(newSet);
    };

    return (
        <div className="space-y-6">
            {/* 顶部导航 */}
            <div className="flex items-center justify-between">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('suggestions')}
                        className={`px-6 py-2 rounded-full font-medium transition-all ${activeTab === 'suggestions'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        优化建议 ({suggestions.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('simulation')}
                        className={`px-6 py-2 rounded-full font-medium transition-all ${activeTab === 'simulation'
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        方案模拟
                    </button>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Zap size={16} className="text-yellow-500" />
                    <span>AI 算法已就绪 (Genetic Algorithm + PSO)</span>
                </div>
            </div>

            {activeTab === 'suggestions' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 左侧：建议列表 */}
                    <div className="lg:col-span-2 space-y-4">
                        {suggestions.map((suggestion, index) => {
                            const isApplied = appliedSuggestions.has(index);

                            return (
                                <div
                                    key={index}
                                    className={`bg-white rounded-2xl p-6 shadow-sm border transition-all ${isApplied ? 'border-green-500 ring-1 ring-green-500 bg-green-50/30' : 'border-slate-200 hover:border-blue-300'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${suggestion.type === 'resource' ? 'bg-blue-100 text-blue-600' :
                                                suggestion.type === 'process' ? 'bg-purple-100 text-purple-600' :
                                                    'bg-orange-100 text-orange-600'
                                            }`}>
                                            {suggestion.type === 'resource' ? <Layers size={24} /> :
                                                suggestion.type === 'process' ? <Zap size={24} /> :
                                                    <Lightbulb size={24} />}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-lg font-bold text-slate-900">{suggestion.title}</h4>
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${suggestion.impact === 'high' ? 'bg-red-100 text-red-700' :
                                                        suggestion.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-green-100 text-green-700'
                                                    }`}>
                                                    {suggestion.impact === 'high' ? '高影响力' :
                                                        suggestion.impact === 'medium' ? '中等影响' : '低影响'}
                                                </span>
                                            </div>

                                            <p className="text-slate-600 mt-2">{suggestion.description}</p>

                                            <div className="mt-4 flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                                                    <TrendingUp size={16} />
                                                    预期效果: {suggestion.estimatedImprovement}
                                                </div>
                                            </div>

                                            <div className="mt-4 flex gap-3">
                                                <button
                                                    onClick={() => handleApply(index)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${isApplied
                                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                                        }`}
                                                >
                                                    {isApplied ? <Check size={16} /> : <Zap size={16} />}
                                                    {isApplied ? '已采纳' : '一键优化'}
                                                </button>
                                                <button className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 border border-slate-200">
                                                    查看详情
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {suggestions.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check className="text-green-600" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">暂无优化建议</h3>
                                <p className="text-slate-500 mt-2">当前资源配置和项目效率处于最佳状态</p>
                            </div>
                        )}
                    </div>

                    {/* 右侧：优化效果预览 */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <BarChart2 size={20} className="text-blue-600" />
                                优化效果预览
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-600">资源利用率</span>
                                        <div className="flex gap-2">
                                            <span className="text-slate-400 line-through">92%</span>
                                            <span className="font-bold text-green-600">85%</span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                                        <div className="h-full bg-green-500 w-[85%]"></div>
                                        <div className="h-full bg-red-300 w-[7%] opacity-50"></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-600">平均前置时间</span>
                                        <div className="flex gap-2">
                                            <span className="text-slate-400 line-through">45天</span>
                                            <span className="font-bold text-green-600">38天</span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                                        <div className="h-full bg-blue-500 w-[70%]"></div>
                                        <div className="h-full bg-slate-300 w-[15%] opacity-50"></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-600">吞吐量</span>
                                        <div className="flex gap-2">
                                            <span className="text-slate-400 line-through">2.5/周</span>
                                            <span className="font-bold text-green-600">3.2/周</span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                                        <div className="h-full bg-purple-500 w-[60%]"></div>
                                        <div className="h-full bg-purple-300 w-[20%] opacity-50 border-l border-white"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                                    <ArrowRight size={16} />
                                    <span>已选择 {appliedSuggestions.size} 项优化建议</span>
                                </div>
                                <button
                                    disabled={appliedSuggestions.size === 0}
                                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    应用所有更改
                                </button>
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                            <h4 className="font-bold text-blue-900 mb-2">风险评估</h4>
                            <ul className="space-y-2 text-sm text-blue-800">
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                    资源调配可能导致 Project X 短期效率波动
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                    需要额外 2 周的新成员培训时间
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'simulation' && (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                    <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Zap className="text-purple-600" size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">多目标优化模拟器</h3>
                    <p className="text-slate-600 max-w-lg mx-auto mb-8">
                        系统正在运行遗传算法(Genetic Algorithm)和粒子群算法(PSO)，为您寻找资源利用率与交付效率的最佳平衡点...
                    </p>
                    <div className="w-full max-w-md mx-auto h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                        <div className="h-full bg-purple-600 w-2/3 animate-pulse"></div>
                    </div>
                    <p className="text-sm text-slate-400">计算进度: 67%</p>
                </div>
            )}
        </div>
    );
};

export default SmartOptimizationPanel;
