import React from 'react';
import { Network, Download } from 'lucide-react';
import { useProjects } from '../store/useStore';
import CrossProjectDependencyMap from '../components/CrossProjectDependencyMap';
import { exportDependenciesToCSV } from '../utils/pmoExportUtils';

const DependencyAnalysis: React.FC = () => {
    const projects = useProjects();

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
            {/* Premium Header */}
            <div className="relative p-8 rounded-[40px] bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400">
                                <Network size={20} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Strategy Oversight</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter sm:text-5xl">
                            跨项目依赖分析
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-2xl leading-relaxed">
                            Cross-Project Dependency Analysis — 深度洞察全球项目群拓扑关联，实时评估关键路径交付风险与连锁反应。
                        </p>
                    </div>
                    <button
                        onClick={() => exportDependenciesToCSV(projects)}
                        className="group flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[20px] text-sm font-black transition-all hover:scale-105 active:scale-95 shadow-2xl"
                    >
                        <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                        导出拓扑快报
                    </button>
                </div>
            </div>

            {/* Dependency Map */}
            <CrossProjectDependencyMap />

            {/* Help Section */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl shadow-sm border border-purple-200 dark:border-purple-800 p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                    使用指南
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">依赖类型</h4>
                        <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                            <li><strong>完成-开始 (FS):</strong> 项目A完成后项目B才能开始</li>
                            <li><strong>开始-开始 (SS):</strong> 两个项目同时开始</li>
                            <li><strong>完成-完成 (FF):</strong> 两个项目同时完成</li>
                            <li><strong>资源依赖:</strong> 共享相同的资源池</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">关键路径</h4>
                        <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                            <li>• 标记为红色边框的项目在关键路径上</li>
                            <li>• 关键路径上的任何延迟都会影响整体交付</li>
                            <li>• 优先关注关键路径上的项目</li>
                            <li>• 使用延迟模拟评估风险影响</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">延迟影响模拟</h4>
                        <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                            <li>1. 点击任意项目卡片</li>
                            <li>2. 设置模拟延迟天数</li>
                            <li>3. 查看受影响的下游项目</li>
                            <li>4. 评估连锁反应和风险</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">最佳实践</h4>
                        <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                            <li>• 定期审查项目间依赖关系</li>
                            <li>• 识别并消除不必要的依赖</li>
                            <li>• 为关键路径项目预留缓冲时间</li>
                            <li>• 建立跨项目沟通机制</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DependencyAnalysis;
