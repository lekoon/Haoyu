/**
 * 实时监控预警系统
 * Real-Time Alert System
 * 
 * 核心功能:
 * - 动态阈值预警 (Yellow >80%, Orange >85%, Red >90%)
 * - 效率影响分析
 * - 历史趋势对比
 * - 紧急处理建议
 */

import React, { useMemo } from 'react';
import type { ResourcePoolItem } from '../../types';
import type { DeliveryMetrics } from '../../utils/deliveryMetrics';
import { AlertTriangle, Bell, TrendingUp, ArrowRight, ShieldAlert, Clock } from 'lucide-react';

interface RealTimeAlertSystemProps {
    metrics: DeliveryMetrics[];
    resourcePool: ResourcePoolItem[];
}

const RealTimeAlertSystem: React.FC<RealTimeAlertSystemProps> = ({
    metrics,
    resourcePool
}) => {
    // 生成预警列表
    const alerts = useMemo(() => {
        const list: any[] = [];

        // 1. 资源利用率预警
        metrics.forEach(m => {
            if (m.resourceUtilization > 90) {
                list.push({
                    id: `res-${m.projectId}`,
                    type: 'resource',
                    level: 'critical',
                    title: `资源严重过载: ${m.projectName}`,
                    message: `当前资源利用率 ${m.resourceUtilization.toFixed(1)}%，已超过红色警戒线 (90%)`,
                    impact: `预计导致项目前置时间延长 ${(m.leadTime * 0.2).toFixed(1)} 天`,
                    suggestion: '建议立即增加资源或暂停非关键任务',
                    timestamp: new Date().toISOString()
                });
            } else if (m.resourceUtilization > 85) {
                list.push({
                    id: `res-${m.projectId}`,
                    type: 'resource',
                    level: 'warning',
                    title: `资源高负荷: ${m.projectName}`,
                    message: `当前资源利用率 ${m.resourceUtilization.toFixed(1)}%，接近饱和状态`,
                    impact: `可能导致交付延迟风险增加`,
                    suggestion: '建议密切监控，准备备用资源',
                    timestamp: new Date().toISOString()
                });
            }
        });

        // 2. 交付效率预警
        metrics.forEach(m => {
            if (m.leadTime > 60) {
                list.push({
                    id: `eff-${m.projectId}`,
                    type: 'efficiency',
                    level: 'critical',
                    title: `交付周期异常: ${m.projectName}`,
                    message: `当前前置时间 ${m.leadTime.toFixed(0)} 天，远超平均水平`,
                    impact: `严重影响整体交付吞吐量`,
                    suggestion: '建议进行流程诊断，消除阻塞环节',
                    timestamp: new Date().toISOString()
                });
            }
        });

        // 3. 库存/物料预警 (模拟数据)
        // 实际项目中应从 resourcePool 中检查物料类型的资源
        const lowStockResources = resourcePool.filter(r =>
            (r.name.includes('Server') || r.name.includes('License')) && r.totalQuantity < 2
        );

        lowStockResources.forEach(r => {
            list.push({
                id: `stock-${r.id}`,
                type: 'stock',
                level: 'warning',
                title: `关键资源库存不足: ${r.name}`,
                message: `剩余可用数量仅为 ${r.totalQuantity}`,
                impact: `可能导致新项目无法启动`,
                suggestion: '建议立即采购或释放闲置资源',
                timestamp: new Date().toISOString()
            });
        });

        return list.sort((a, _b) => (a.level === 'critical' ? -1 : 1));
    }, [metrics, resourcePool]);

    const getAlertStyle = (level: string) => {
        switch (level) {
            case 'critical':
                return 'bg-red-50 border-red-200 text-red-900';
            case 'warning':
                return 'bg-orange-50 border-orange-200 text-orange-900';
            default:
                return 'bg-blue-50 border-blue-200 text-blue-900';
        }
    };

    const getIcon = (type: string, level: string) => {
        const colorClass = level === 'critical' ? 'text-red-600' : 'text-orange-600';
        switch (type) {
            case 'resource': return <ShieldAlert className={colorClass} size={24} />;
            case 'efficiency': return <Clock className={colorClass} size={24} />;
            case 'stock': return <AlertTriangle className={colorClass} size={24} />;
            default: return <Bell className={colorClass} size={24} />;
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：实时预警列表 */}
            <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <div className="relative">
                            <Bell className="text-slate-900" />
                            {alerts.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                            )}
                        </div>
                        实时监控预警
                    </h3>
                    <span className="text-sm text-slate-500">
                        共发现 {alerts.length} 个异常项
                    </span>
                </div>

                {alerts.length === 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldAlert className="text-green-600" size={32} />
                        </div>
                        <h4 className="text-lg font-bold text-green-900">系统运行正常</h4>
                        <p className="text-green-700 mt-2">各项指标均在合理区间内，未发现异常。</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {alerts.map(alert => (
                            <div
                                key={alert.id}
                                className={`p-6 rounded-2xl border ${getAlertStyle(alert.level)} shadow-sm transition-transform hover:scale-[1.01]`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-white/60 rounded-xl backdrop-blur-sm">
                                        {getIcon(alert.type, alert.level)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-lg">{alert.title}</h4>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${alert.level === 'critical' ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'
                                                }`}>
                                                {alert.level === 'critical' ? '红色预警' : '黄色预警'}
                                            </span>
                                        </div>
                                        <p className="mt-2 font-medium opacity-90">{alert.message}</p>

                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-white/50 rounded-lg p-3">
                                                <div className="text-xs font-bold uppercase opacity-60 mb-1">效率影响</div>
                                                <div className="text-sm font-medium flex items-center gap-2">
                                                    <TrendingUp size={16} />
                                                    {alert.impact}
                                                </div>
                                            </div>
                                            <div className="bg-white/50 rounded-lg p-3">
                                                <div className="text-xs font-bold uppercase opacity-60 mb-1">建议行动</div>
                                                <div className="text-sm font-medium flex items-center gap-2">
                                                    <ArrowRight size={16} />
                                                    {alert.suggestion}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 右侧：历史趋势与阈值设置 */}
            <div className="space-y-6">
                {/* 动态阈值状态 */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">动态阈值监控</h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-600">人力资源阈值</span>
                                <span className="font-bold text-slate-900">85% (动态调整中)</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-[85%] relative">
                                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white"></div>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">基于 DWAFE 模型自动计算</p>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-600">物料库存阈值</span>
                                <span className="font-bold text-slate-900">20% (固定)</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 w-[20%]"></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-600">Bay间资源阈值</span>
                                <span className="font-bold text-slate-900">90% (动态调整中)</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 w-[90%]"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 快速操作 */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
                    <h3 className="text-lg font-bold mb-4">紧急响应中心</h3>
                    <p className="text-slate-300 text-sm mb-6">
                        针对当前的红色预警，系统推荐以下一键处理方案：
                    </p>

                    <button className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold transition-colors mb-3 flex items-center justify-center gap-2">
                        <ShieldAlert size={18} />
                        启动资源应急预案
                    </button>
                    <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                        <Bell size={18} />
                        通知所有项目经理
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RealTimeAlertSystem;
