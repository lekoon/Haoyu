import React, { useState } from 'react';
import type { CostEntry } from '../types';
import { X, Plus, DollarSign, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface CostRegistrationFormProps {
    projectId?: string;
    projectName: string;
    budget?: number;
    existingCosts?: CostEntry[];
    onSave: (costs: CostEntry[], budget?: number) => void;
    onClose: () => void;
}

const CostRegistrationForm: React.FC<CostRegistrationFormProps> = ({
    projectName,
    budget: initialBudget,
    existingCosts = [],
    onSave,
    onClose
}) => {
    const [budget, setBudget] = useState(initialBudget || 0);
    const [costs, setCosts] = useState<CostEntry[]>(existingCosts);
    const [newCost, setNewCost] = useState<Partial<CostEntry>>({
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        category: 'labor',
        description: ''
    });

    const categories = [
        { id: 'labor', label: '人力成本', color: '#3b82f6' },
        { id: 'equipment', label: '设备成本', color: '#8b5cf6' },
        { id: 'materials', label: '材料成本', color: '#10b981' },
        { id: 'overhead', label: '管理费用', color: '#f59e0b' },
        { id: 'other', label: '其他', color: '#6b7280' },
    ];

    const totalCost = costs.reduce((sum, cost) => sum + cost.amount, 0);
    const remaining = budget - totalCost;
    const utilizationRate = budget > 0 ? (totalCost / budget) * 100 : 0;

    const costByCategory = categories.map(cat => ({
        name: cat.label,
        value: costs.filter(c => c.category === cat.id).reduce((sum, c) => sum + c.amount, 0),
        color: cat.color
    })).filter(item => item.value > 0);

    const costTrend = costs
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .reduce((acc, cost) => {
            const existing = acc.find(item => item.date === cost.date);
            if (existing) {
                existing.amount += cost.amount;
            } else {
                const previousTotal = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
                acc.push({
                    date: cost.date,
                    amount: cost.amount,
                    cumulative: previousTotal + cost.amount
                });
            }
            return acc;
        }, [] as Array<{ date: string; amount: number; cumulative: number }>);

    const handleAddCost = () => {
        if (newCost.amount && newCost.amount > 0 && newCost.description) {
            const cost: CostEntry = {
                id: Date.now().toString(),
                date: newCost.date!,
                amount: newCost.amount,
                category: newCost.category as CostEntry['category'],
                description: newCost.description
            };
            setCosts([...costs, cost]);
            setNewCost({
                date: new Date().toISOString().split('T')[0],
                amount: 0,
                category: 'labor',
                description: ''
            });
        }
    };

    const handleDeleteCost = (id: string) => {
        setCosts(costs.filter(c => c.id !== id));
    };

    const handleSave = () => {
        onSave(costs, budget);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">成本登记</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                项目: {projectName}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <X size={24} className="text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Input & List */}
                        <div className="space-y-6">
                            {/* Budget Input */}
                            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                                <label className="block text-sm font-medium mb-2 text-blue-100">项目预算</label>
                                <div className="flex items-center gap-2">
                                    <DollarSign size={24} />
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={budget}
                                        onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                                        className="flex-1 px-4 py-3 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 text-xl font-bold"
                                        placeholder="输入预算金额"
                                    />
                                    <span className="text-xl font-bold">元</span>
                                </div>
                                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                                    <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                                        <div className="text-blue-100">已用</div>
                                        <div className="font-bold text-lg">¥{totalCost.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                                        <div className="text-blue-100">剩余</div>
                                        <div className={`font-bold text-lg ${remaining < 0 ? 'text-red-300' : ''}`}>
                                            ¥{remaining.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                                        <div className="text-blue-100">使用率</div>
                                        <div className={`font-bold text-lg ${utilizationRate > 100 ? 'text-red-300' : ''}`}>
                                            {utilizationRate.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Add Cost Form */}
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                                    <Plus size={20} />
                                    添加成本记录
                                </h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                日期
                                            </label>
                                            <input
                                                type="date"
                                                value={newCost.date}
                                                onChange={(e) => setNewCost({ ...newCost, date: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                金额
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={newCost.amount}
                                                onChange={(e) => setNewCost({ ...newCost, amount: parseFloat(e.target.value) })}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            类别
                                        </label>
                                        <select
                                            value={newCost.category}
                                            onChange={(e) => setNewCost({ ...newCost, category: e.target.value as CostEntry['category'] })}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            说明
                                        </label>
                                        <textarea
                                            value={newCost.description}
                                            onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                            rows={2}
                                            placeholder="描述此项成本..."
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddCost}
                                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus size={18} />
                                        添加记录
                                    </button>
                                </div>
                            </div>

                            {/* Cost List */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                        <FileText size={20} />
                                        成本记录 ({costs.length})
                                    </h3>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {costs.length === 0 ? (
                                        <div className="p-8 text-center text-slate-400">
                                            暂无成本记录
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                                            {costs.map(cost => {
                                                const category = categories.find(c => c.id === cost.category);
                                                return (
                                                    <div key={cost.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span
                                                                        className="px-2 py-0.5 rounded text-xs font-medium"
                                                                        style={{
                                                                            backgroundColor: `${category?.color}20`,
                                                                            color: category?.color
                                                                        }}
                                                                    >
                                                                        {category?.label}
                                                                    </span>
                                                                    <span className="text-xs text-slate-400">{cost.date}</span>
                                                                </div>
                                                                <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">
                                                                    {cost.description}
                                                                </p>
                                                                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                                                    ¥{cost.amount.toLocaleString()}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeleteCost(cost.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Charts */}
                        <div className="space-y-6">
                            {/* Cost Breakdown Pie Chart */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">成本构成</h3>
                                {costByCategory.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={costByCategory}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                            >
                                                {costByCategory.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-64 flex items-center justify-center text-slate-400">
                                        暂无数据
                                    </div>
                                )}
                            </div>

                            {/* Cost Trend Line Chart */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">成本趋势</h3>
                                {costTrend.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <LineChart data={costTrend}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="cumulative"
                                                stroke="#3b82f6"
                                                strokeWidth={2}
                                                name="累计成本"
                                                dot={{ fill: '#3b82f6', r: 4 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-64 flex items-center justify-center text-slate-400">
                                        暂无数据
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        总计: <strong className="text-slate-900 dark:text-slate-100 text-lg">¥{totalCost.toLocaleString()}</strong>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20"
                        >
                            保存成本数据
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CostRegistrationForm;
