import React from 'react';
import { Risk } from '../types';
import { getRiskPriorityColor } from '../utils/riskManagement';

interface RiskMatrixProps {
    risks: Risk[];
    onRiskClick?: (risk: Risk) => void;
}

const RiskMatrix: React.FC<RiskMatrixProps> = ({ risks, onRiskClick }) => {
    // Filter active risks only
    const activeRisks = risks.filter((r) => r.status !== 'resolved' && r.status !== 'accepted');

    // Group risks by probability and impact
    const getRisksInCell = (probability: number, impact: number): Risk[] => {
        return activeRisks.filter((r) => r.probability === probability && r.impact === impact);
    };

    // Get cell background color based on risk score
    const getCellColor = (probability: number, impact: number): string => {
        const score = probability * impact;
        if (score >= 16) return 'bg-red-100 hover:bg-red-200 border-red-300';
        if (score >= 10) return 'bg-orange-100 hover:bg-orange-200 border-orange-300';
        if (score >= 5) return 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300';
        return 'bg-green-50 hover:bg-green-100 border-green-200';
    };

    const impactLabels = ['极低', '低', '中', '高', '极高'];
    const probabilityLabels = ['极低', '低', '中', '高', '极高'];

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">风险矩阵</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    根据概率和影响评估风险等级
                </p>
            </div>

            <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                    {/* Matrix Grid */}
                    <div className="grid grid-cols-6 gap-1">
                        {/* Top-left corner (empty) */}
                        <div className="flex items-center justify-center p-2 bg-slate-50 dark:bg-slate-700 rounded-tl-lg">
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                概率 ↓ / 影响 →
                            </span>
                        </div>

                        {/* Impact headers (top row) */}
                        {impactLabels.map((label, idx) => (
                            <div
                                key={`impact-${idx}`}
                                className="flex items-center justify-center p-2 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600"
                            >
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                                    {label}
                                </span>
                            </div>
                        ))}

                        {/* Matrix cells */}
                        {[5, 4, 3, 2, 1].map((probability) => (
                            <React.Fragment key={`row-${probability}`}>
                                {/* Probability label (left column) */}
                                <div className="flex items-center justify-center p-2 bg-slate-50 dark:bg-slate-700 border-r border-slate-200 dark:border-slate-600">
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                                        {probabilityLabels[probability - 1]}
                                    </span>
                                </div>

                                {/* Risk cells */}
                                {[1, 2, 3, 4, 5].map((impact) => {
                                    const cellRisks = getRisksInCell(probability, impact);
                                    const cellColor = getCellColor(probability, impact);

                                    return (
                                        <div
                                            key={`cell-${probability}-${impact}`}
                                            className={`relative min-h-[80px] p-2 border ${cellColor} transition-colors cursor-pointer group`}
                                            onClick={() => {
                                                if (cellRisks.length > 0 && onRiskClick) {
                                                    onRiskClick(cellRisks[0]);
                                                }
                                            }}
                                        >
                                            {/* Risk count badge */}
                                            {cellRisks.length > 0 && (
                                                <div className="absolute top-1 right-1">
                                                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-slate-700 dark:bg-slate-600 rounded-full">
                                                        {cellRisks.length}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Risk titles (show first 2) */}
                                            <div className="space-y-1">
                                                {cellRisks.slice(0, 2).map((risk) => (
                                                    <div
                                                        key={risk.id}
                                                        className="text-xs text-slate-700 dark:text-slate-200 truncate bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded shadow-sm"
                                                        title={risk.title}
                                                    >
                                                        {risk.title}
                                                    </div>
                                                ))}
                                                {cellRisks.length > 2 && (
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                                                        +{cellRisks.length - 2} 更多...
                                                    </div>
                                                )}
                                            </div>

                                            {/* Hover tooltip */}
                                            {cellRisks.length > 0 && (
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                                    <div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl max-w-xs">
                                                        <div className="font-semibold mb-1">
                                                            {cellRisks.length} 个风险
                                                        </div>
                                                        {cellRisks.slice(0, 3).map((risk) => (
                                                            <div key={risk.id} className="truncate">
                                                                • {risk.title}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                            <span className="text-slate-600 dark:text-slate-300">低风险 (1-4)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
                            <span className="text-slate-600 dark:text-slate-300">中风险 (5-9)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded"></div>
                            <span className="text-slate-600 dark:text-slate-300">高风险 (10-15)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                            <span className="text-slate-600 dark:text-slate-300">极高风险 (16-25)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiskMatrix;
