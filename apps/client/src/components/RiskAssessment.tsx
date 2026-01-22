import React, { useState, useMemo } from 'react';
import { AlertTriangle, TrendingUp, Users, X, Plus, Shield, DollarSign, Clock } from 'lucide-react';
import type { Project, Risk } from '../types';

interface RiskAssessmentProps {
    project: Project;
    risks: Risk[];
    onCreate?: (risk: Partial<Risk>) => void;
    onUpdate?: (id: string, updates: Partial<Risk>) => void;
    onDelete?: (id: string) => void;
    onClose?: () => void;
}

const RiskAssessment: React.FC<RiskAssessmentProps> = ({ project, risks, onCreate, onUpdate, onDelete, onClose }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isAddingRisk, setIsAddingRisk] = useState(false);
    const [newRisk, setNewRisk] = useState<Partial<Risk>>({
        category: 'schedule',
        probability: 3,
        impact: 3,
        status: 'identified',
        ownerId: '',
        mitigationStrategy: ''
    });

    const categories = [
        { id: 'all', label: '全部', icon: Shield, color: 'slate' },
        { id: 'schedule', label: '进度', icon: Clock, color: 'blue' },
        { id: 'cost', label: '成本', icon: DollarSign, color: 'green' },
        { id: 'resource', label: '资源', icon: Users, color: 'purple' },
        { id: 'technical', label: '技术', icon: TrendingUp, color: 'orange' },
        { id: 'external', label: '外部', icon: AlertTriangle, color: 'red' },
    ];

    // Calculate risk score (probability × impact)
    const getRiskScore = (risk: Risk) => risk.probability * risk.impact;

    // Get risk level based on score
    const getRiskLevel = (score: number): { label: string; color: string; bgColor: string; darkColor: string; darkBgColor: string } => {
        if (score >= 20) return { label: '极高', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200', darkColor: 'text-red-400', darkBgColor: 'dark:bg-red-900/20 dark:border-red-800' };
        if (score >= 15) return { label: '高', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200', darkColor: 'text-orange-400', darkBgColor: 'dark:bg-orange-900/20 dark:border-orange-800' };
        if (score >= 10) return { label: '中', color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-200', darkColor: 'text-yellow-400', darkBgColor: 'dark:bg-yellow-900/20 dark:border-yellow-800' };
        if (score >= 5) return { label: '低', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200', darkColor: 'text-blue-400', darkBgColor: 'dark:bg-blue-900/20 dark:border-blue-800' };
        return { label: '极低', color: 'text-slate-700', bgColor: 'bg-slate-50 border-slate-200', darkColor: 'text-slate-400', darkBgColor: 'dark:bg-slate-700/50 dark:border-slate-700' };
    };

    // Calculate overall project risk
    const overallRisk = useMemo(() => {
        if (risks.length === 0) return { score: 0, level: getRiskLevel(0) };

        const activeRisks = risks.filter(r => r.status !== 'resolved');
        const totalScore = activeRisks.reduce((sum, r) => sum + getRiskScore(r), 0);
        const avgScore = totalScore / activeRisks.length;

        return { score: avgScore, level: getRiskLevel(avgScore) };
    }, [risks]);

    // Filter risks
    const filteredRisks = selectedCategory === 'all'
        ? risks
        : risks.filter(r => r.category === selectedCategory);

    // Group risks by level
    const risksByLevel = useMemo(() => {
        const grouped: { [key: string]: Risk[] } = {
            '极高': [],
            '高': [],
            '中': [],
            '低': [],
            '极低': []
        };

        filteredRisks.forEach(risk => {
            const score = getRiskScore(risk);
            const level = getRiskLevel(score);
            grouped[level.label].push(risk);
        });

        return grouped;
    }, [filteredRisks]);

    const handleAddRisk = () => {
        if (!newRisk.title || !newRisk.description) {
            alert('请填写风险标题和描述');
            return;
        }

        const score = (newRisk.probability || 3) * (newRisk.impact || 3);
        const priority = score >= 20 ? 'critical' : score >= 15 ? 'high' : score >= 10 ? 'medium' : 'low';

        const risk: Partial<Risk> = {
            projectId: project.id,
            category: newRisk.category as Risk['category'],
            title: newRisk.title!,
            description: newRisk.description!,
            probability: newRisk.probability || 3,
            impact: newRisk.impact || 3,
            riskScore: score,
            priority: priority as any,
            mitigationStrategy: newRisk.mitigationStrategy || '',
            ownerId: newRisk.ownerId || '',
            status: 'identified',
            identifiedDate: new Date().toISOString(),
        };

        onCreate?.(risk);
        setNewRisk({
            category: 'schedule',
            probability: 3,
            impact: 3,
            status: 'identified',
            ownerId: '',
            mitigationStrategy: ''
        });
        setIsAddingRisk(false);
    };

    const handleDeleteRisk = (id: string) => {
        onDelete?.(id);
    };

    const handleUpdateRiskStatus = (id: string, status: Risk['status']) => {
        onUpdate?.(id, { status });
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield size={32} className="text-blue-600 dark:text-blue-400" />
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">风险评估</h2>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">项目: {project.name}</p>
                </div>

                {/* Overall Risk Score */}
                <div className={`px-6 py-4 rounded-xl border-2 ${overallRisk.level.bgColor} ${overallRisk.level.darkBgColor}`}>
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">综合风险等级</div>
                    <div className={`text-3xl font-bold ${overallRisk.level.color} ${overallRisk.level.darkColor}`}>
                        {overallRisk.level.label}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                        评分: {overallRisk.score.toFixed(1)} / 25
                    </div>
                </div>

                {onClose && (
                    <button
                        onClick={onClose}
                        className="ml-4 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                )}
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                {categories.map(cat => {
                    const Icon = cat.icon;
                    const count = cat.id === 'all' ? risks.length : risks.filter(r => r.category === cat.id).length;
                    const isActive = selectedCategory === cat.id;

                    const activeClasses: Record<string, string> = {
                        slate: 'bg-slate-600 text-white shadow-md',
                        blue: 'bg-blue-600 text-white shadow-md',
                        green: 'bg-green-600 text-white shadow-md',
                        purple: 'bg-purple-600 text-white shadow-md',
                        orange: 'bg-orange-600 text-white shadow-md',
                        red: 'bg-red-600 text-white shadow-md'
                    };

                    const inactiveClasses: Record<string, string> = {
                        slate: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300',
                        blue: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
                        green: 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400',
                        purple: 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
                        orange: 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
                        red: 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                    };

                    return (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${isActive ? activeClasses[cat.color] : inactiveClasses[cat.color]}`}
                        >
                            <Icon size={16} />
                            <span>{cat.label}</span>
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Add Risk Button */}
            <div className="mb-6">
                <button
                    onClick={() => setIsAddingRisk(!isAddingRisk)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg"
                >
                    <Plus size={18} />
                    添加风险
                </button>
            </div>

            {/* Add Risk Form */}
            {isAddingRisk && (
                <div className="mb-6 p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <h3 className="font-bold text-slate-900 mb-4">新增风险</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">风险类别</label>
                            <select
                                value={newRisk.category}
                                onChange={(e) => setNewRisk({ ...newRisk, category: e.target.value as Risk['category'] })}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="schedule">进度风险</option>
                                <option value="cost">成本风险</option>
                                <option value="resource">资源风险</option>
                                <option value="technical">技术风险</option>
                                <option value="external">外部风险</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">负责人</label>
                            <input
                                type="text"
                                value={newRisk.ownerId || ''}
                                onChange={(e) => setNewRisk({ ...newRisk, ownerId: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="风险负责人"
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">风险标题</label>
                        <input
                            type="text"
                            value={newRisk.title || ''}
                            onChange={(e) => setNewRisk({ ...newRisk, title: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="简要描述风险"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">风险描述</label>
                        <textarea
                            value={newRisk.description || ''}
                            onChange={(e) => setNewRisk({ ...newRisk, description: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="详细描述风险情况"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                发生概率 (1-5): {newRisk.probability}
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={newRisk.probability}
                                onChange={(e) => setNewRisk({ ...newRisk, probability: parseInt(e.target.value) })}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                                <span>极低</span>
                                <span>极高</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                影响程度 (1-5): {newRisk.impact}
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={newRisk.impact}
                                onChange={(e) => setNewRisk({ ...newRisk, impact: parseInt(e.target.value) })}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                                <span>极低</span>
                                <span>极高</span>
                            </div>
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">缓解措施</label>
                        <textarea
                            value={newRisk.mitigationStrategy || ''}
                            onChange={(e) => setNewRisk({ ...newRisk, mitigationStrategy: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                            placeholder="如何降低或消除此风险"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddRisk}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                        >
                            添加
                        </button>
                        <button
                            onClick={() => setIsAddingRisk(false)}
                            className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
                        >
                            取消
                        </button>
                    </div>
                </div>
            )}

            {/* Risks List */}
            <div className="space-y-6">
                {Object.entries(risksByLevel).map(([level, levelRisks]) => {
                    if (levelRisks.length === 0) return null;

                    const levelInfo = getRiskLevel(level === '极高' ? 25 : level === '高' ? 18 : level === '中' ? 12 : level === '低' ? 7 : 3);

                    return (
                        <div key={level}>
                            <h3 className={`font-bold text-lg mb-3 ${levelInfo.color}`}>
                                {level}风险 ({levelRisks.length})
                            </h3>
                            <div className="space-y-3">
                                {levelRisks.map(risk => {
                                    const score = getRiskScore(risk);
                                    const riskLevel = getRiskLevel(score);

                                    return (
                                        <div
                                            key={risk.id}
                                            className={`p-5 rounded-xl border-2 ${riskLevel.bgColor} ${riskLevel.darkBgColor} transition-all hover:shadow-lg`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h4 className="font-bold text-lg text-slate-900 dark:text-slate-100">{risk.title}</h4>
                                                        <span className={`text-xs font-semibold px-2 py-1 rounded uppercase ${riskLevel.color} ${riskLevel.darkColor} ${riskLevel.bgColor} ${riskLevel.darkBgColor}`}>
                                                            {riskLevel.label}
                                                        </span>
                                                        <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded">
                                                            {categories.find(c => c.id === risk.category)?.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{risk.description}</p>
                                                    {risk.mitigationStrategy && (
                                                        <div className="text-sm text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-black/20 p-2 rounded">
                                                            <strong>缓解措施:</strong> {risk.mitigationStrategy}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteRisk(risk.id)}
                                                    className="ml-4 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-4">
                                                    <div>
                                                        <span className="text-slate-600">概率:</span>
                                                        <span className="ml-2 font-bold">{risk.probability}/5</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-600">影响:</span>
                                                        <span className="ml-2 font-bold">{risk.impact}/5</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-600">评分:</span>
                                                        <span className="ml-2 font-bold">{score}/25</span>
                                                    </div>
                                                    {risk.ownerId && (
                                                        <div>
                                                            <span className="text-slate-600">负责人:</span>
                                                            <span className="ml-2 font-medium">{risk.ownerId}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <select
                                                    value={risk.status}
                                                    onChange={(e) => handleUpdateRiskStatus(risk.id, e.target.value as Risk['status'])}
                                                    className="px-3 py-1 rounded-lg border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="identified">已识别</option>
                                                    <option value="mitigating">缓解中</option>
                                                    <option value="resolved">已解决</option>
                                                </select>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {filteredRisks.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        <Shield size={64} className="mx-auto mb-4 opacity-50" />
                        <p>暂无风险记录</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RiskAssessment;
