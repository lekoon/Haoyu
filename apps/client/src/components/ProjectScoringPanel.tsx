import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import type { Project } from '../types';
import { calculateProjectScore } from '../utils/algorithm';
import { Sliders, Target, Info, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    project: Project;
    onUpdate: (updates: Partial<Project>) => void;
}

const ProjectScoringPanel: React.FC<Props> = ({ project, onUpdate }) => {
    const { factorDefinitions } = useStore();
    const currentFactors = project.factors || {};

    // Calculate dynamic stats
    const { totalScore: _totalScore, maxPossibleScore: _maxPossibleScore, normalizedScore } = useMemo(() => {
        const rawScore = calculateProjectScore(currentFactors, factorDefinitions);
        // Assuming rawScore is 0-10. Convert to 0-100 for display
        return {
            totalScore: rawScore, // 0-10
            maxPossibleScore: 10,
            normalizedScore: rawScore * 10 // 0-100
        };
    }, [currentFactors, factorDefinitions]);

    const handleScoreChange = (factorId: string, value: number) => {
        const newFactors = { ...currentFactors, [factorId]: value };
        // We update the local factors. The total score will be recalculated by the store/algorithm when needed, 
        // but we can also store the cached score on the project if we want.
        // According to algorithm.ts, rankProjects calculates score on the fly. 
        // But Project interface has 'score' field. It's good practice to keep it updated.
        const newScore = calculateProjectScore(newFactors, factorDefinitions);

        onUpdate({
            factors: newFactors,
            score: newScore
        });
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
        if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const colorClass = getScoreColor(normalizedScore);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full p-6">
            {/* Left Column: Score Overview */}
            <div className="lg:col-span-1 space-y-6">
                <div className={`p-6 rounded-2xl border-2 ${colorClass} flex flex-col items-center justify-center text-center shadow-sm`}>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">项目战略评分</h3>
                    <div className="relative mb-2">
                        <span className="text-6xl font-black tracking-tighter">
                            {normalizedScore.toFixed(0)}
                        </span>
                        <span className="text-sm font-medium text-slate-500 absolute -top-1 -right-6">/100</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm font-medium opacity-80">
                        {normalizedScore >= 80 && <><TrendingUp size={16} /> 极具潜力</>}
                        {normalizedScore >= 60 && normalizedScore < 80 && <><Target size={16} /> 值得关注</>}
                        {normalizedScore < 60 && <><AlertCircle size={16} /> 需重新评估</>}
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Info size={16} className="text-blue-500" />
                        评分说明
                    </h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        该评分用于评估项目的战略价值和优先级。
                        请根据下方定义的各项影响因素，为本项目进行打分（0-10分）。
                        系统将根据设定的权重自动计算最终得分。
                    </p>
                </div>
            </div>

            {/* Right Column: Factor Inputs */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Sliders size={18} className="text-slate-500" />
                        评分因素配置
                    </h3>
                    <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-1 rounded">
                        共 {factorDefinitions.length} 项指标
                    </span>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {factorDefinitions.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <p>尚未定义评分因素。</p>
                            <p className="text-sm mt-2">请前往 "设置" 页面配置评分模型。</p>
                        </div>
                    ) : (
                        factorDefinitions.map((factor) => {
                            const score = currentFactors[factor.id] || 0;
                            return (
                                <motion.div
                                    key={factor.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="group"
                                >
                                    <div className="flex justify-between items-end mb-2">
                                        <div>
                                            <div className="font-semibold text-slate-800">{factor.name}</div>
                                            <div className="text-xs text-slate-500">权重: {factor.weight}%</div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-2xl font-bold ${score > 8 ? 'text-green-600' : score > 5 ? 'text-blue-600' : 'text-slate-400'}`}>
                                                {score}
                                            </span>
                                            <span className="text-xs text-slate-400"> / 10</span>
                                        </div>
                                    </div>

                                    <div className="relative h-6 flex items-center">
                                        <input
                                            type="range"
                                            min="0"
                                            max="10"
                                            step="1"
                                            value={score}
                                            onChange={(e) => handleScoreChange(factor.id, parseInt(e.target.value))}
                                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 z-10 relative"
                                        />
                                        <div
                                            className="absolute left-0 top-1/2 -translate-y-1/2 h-2 rounded-l-lg pointer-events-none transition-all duration-3000 bg-blue-100"
                                            style={{ width: `${score * 10}%` }}
                                        />
                                    </div>

                                    <div className="flex justify-between text-[10px] text-slate-300 mt-1 px-1 font-mono">
                                        <span>0</span>
                                        <span>5</span>
                                        <span>10</span>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectScoringPanel;
