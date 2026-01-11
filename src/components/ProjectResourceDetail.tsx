import React, { useMemo, useState } from 'react';
import { Users, TrendingUp, Calendar, AlertCircle, CheckCircle, Download, Brain, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { predictResourceLoad } from '../utils/resourcePrediction';
import type { Project, ResourcePoolItem, ResourceRequirement } from '../types';
import { exportResourceReportToCSV } from '../utils/exportUtils';
import EnhancedResourceTimeline from './EnhancedResourceTimeline';
import { Badge } from './ui';

interface ProjectResourceDetailProps {
    project: Project;
    resourcePool: ResourcePoolItem[];
}

const ProjectResourceDetail: React.FC<ProjectResourceDetailProps> = ({ project, resourcePool }) => {
    const [viewMode, setViewMode] = useState<'details' | 'timeline' | 'prediction'>('details');

    // 计算资源详细信息
    const resourceDetails = useMemo(() => {
        return (project.resourceRequirements || []).map((req: ResourceRequirement) => {
            const resource = resourcePool.find(r => r.id === req.resourceId);
            if (!resource) return null;

            // 计算工作日
            const workDays = req.unit === 'day' ? req.duration :
                req.unit === 'month' ? req.duration * 22 :
                    req.unit === 'year' ? req.duration * 260 : 0;

            // 计算成本
            const estimatedCost = resource.hourlyRate
                ? resource.hourlyRate * workDays * 8 * req.count
                : resource.costPerUnit
                    ? resource.costPerUnit * req.duration * req.count
                    : 0;

            // 计算利用率
            const totalCapacity = resource.totalQuantity;
            const utilization = (req.count / totalCapacity) * 100;

            return {
                requirement: req,
                resource,
                workDays,
                estimatedCost,
                utilization,
                isOverAllocated: req.count > totalCapacity
            };
        }).filter(Boolean);
    }, [project.resourceRequirements, resourcePool]);

    // 计算总体统计
    const summary = useMemo(() => {
        const totalCost = resourceDetails.reduce((sum: number, detail: any) => sum + (detail?.estimatedCost || 0), 0);
        const totalHeadcount = resourceDetails.reduce((sum: number, detail: any) => sum + (detail?.requirement.count || 0), 0);
        const overAllocatedCount = resourceDetails.filter((detail: any) => detail?.isOverAllocated).length;
        const avgUtilization = resourceDetails.length > 0
            ? resourceDetails.reduce((sum: number, detail: any) => sum + (detail?.utilization || 0), 0) / resourceDetails.length
            : 0;

        return {
            totalCost,
            totalHeadcount,
            overAllocatedCount,
            avgUtilization
        };
    }, [resourceDetails]);

    return (
        <div className="h-full overflow-auto p-6 bg-slate-50">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* 顶部工具栏 */}
                <div className="flex justify-between items-center">
                    <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                        <button
                            onClick={() => setViewMode('details')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'details' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            分配详情
                        </button>
                        <button
                            onClick={() => setViewMode('timeline')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'timeline' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            时间线
                        </button>
                        <button
                            onClick={() => setViewMode('prediction')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'prediction' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            预测分析 (AI)
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => exportResourceReportToCSV(project, resourcePool)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <Download size={18} />
                            导出报表
                        </button>
                    </div>
                </div>

                {/* 视图切换容器 */}
                {viewMode === 'timeline' && (
                    <div className="bg-white rounded-lg border border-slate-200 p-4 h-[400px] animate-in fade-in duration-300">
                        <EnhancedResourceTimeline
                            resources={resourcePool}
                            projects={[project]}
                        />
                    </div>
                )}

                {viewMode === 'prediction' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-6 text-indigo-600">
                                <Brain size={20} />
                                <h3 className="font-bold text-lg">人力平衡预测趋势</h3>
                            </div>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={
                                        (() => {
                                            const reqs = project.resourceRequirements || [];
                                            const monthMap: Record<string, any> = {};
                                            reqs.forEach(req => {
                                                const resource = resourcePool.find(r => r.id === req.resourceId);
                                                if (resource) {
                                                    const pred = predictResourceLoad(resource, [project], 6);
                                                    pred.predictions.forEach(p => {
                                                        if (!monthMap[p.month]) monthMap[p.month] = { month: p.month };
                                                        monthMap[p.month][resource.name] = p.predicted;
                                                    });
                                                }
                                            });
                                            return Object.values(monthMap).sort((a: any, b: any) => a.month.localeCompare(b.month));
                                        })()
                                    }>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        {(project.resourceRequirements || []).map((req, i) => {
                                            const resource = resourcePool.find(r => r.id === req.resourceId);
                                            if (!resource) return null;
                                            const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                                            return (
                                                <Area
                                                    key={req.resourceId}
                                                    type="monotone"
                                                    dataKey={resource.name}
                                                    stroke={colors[i % colors.length]}
                                                    fill={colors[i % colors.length]}
                                                    fillOpacity={0.1}
                                                    strokeWidth={2}
                                                />
                                            );
                                        })}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-4 text-amber-600">
                                <AlertCircle size={20} />
                                <h3 className="font-bold text-lg">风险洞察与干预建议</h3>
                            </div>
                            <div className="space-y-4">
                                {(() => {
                                    const risks: string[] = [];
                                    const reqs = project.resourceRequirements || [];
                                    reqs.forEach(req => {
                                        const resource = resourcePool.find(r => r.id === req.resourceId);
                                        if (resource) {
                                            const pred = predictResourceLoad(resource, [project], 6);
                                            if (pred.peakLoad > resource.totalQuantity) {
                                                risks.push(`【${resource.name}】风险：预计在 ${pred.peakMonth} 出现缺口，峰值负载指数达 ${((pred.peakLoad / resource.totalQuantity) * 100).toFixed(0)}%。`);
                                            }
                                            if (pred.trend === 'increasing') {
                                                risks.push(`【${resource.name}】预判：需求呈持续上升趋势，建议在第二季度末启动人才储备或外包补位。`);
                                            }
                                        }
                                    });

                                    if (risks.length === 0) return (
                                        <div className="py-12 text-center">
                                            <Activity className="mx-auto text-emerald-500 mb-3 opacity-20" size={48} />
                                            <p className="text-slate-500 text-sm italic">当前项目资源平衡在预测周期内表现优异，暂无缺口风险。</p>
                                        </div>
                                    );

                                    return risks.map((risk, i) => (
                                        <div key={i} className="group p-4 bg-slate-50 hover:bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-amber-200 transition-all cursor-default">
                                            <div className="flex gap-3">
                                                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-lg h-fit">
                                                    <Brain size={16} />
                                                </div>
                                                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                                    {risk}
                                                </p>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'details' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* 概览卡片 */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users size={20} className="text-blue-600" />
                                    <span className="text-sm text-slate-600 font-medium">总人力投入</span>
                                </div>
                                <div className="text-2xl font-bold text-slate-900">{summary.totalHeadcount}</div>
                                <div className="text-xs text-slate-500 mt-1">项目累计分配人数</div>
                            </div>

                            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp size={20} className="text-green-600" />
                                    <span className="text-sm text-slate-600 font-medium">资源平均利用率</span>
                                </div>
                                <div className="text-2xl font-bold text-slate-900">{summary.avgUtilization.toFixed(1)}%</div>
                                <div className="text-xs text-slate-500 mt-1">当前周期占用负荷</div>
                            </div>

                            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar size={20} className="text-purple-600" />
                                    <span className="text-sm text-slate-600 font-medium">预估人力成本</span>
                                </div>
                                <div className="text-2xl font-bold text-slate-900">
                                    ¥{(summary.totalCost / 10000).toFixed(1)}万
                                </div>
                                <div className="text-xs text-slate-500 mt-1">基于岗位单价核算</div>
                            </div>

                            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    {summary.overAllocatedCount > 0 ? (
                                        <AlertCircle size={20} className="text-red-600" />
                                    ) : (
                                        <CheckCircle size={20} className="text-green-600" />
                                    )}
                                    <span className="text-sm text-slate-600 font-medium">资源调度状态</span>
                                </div>
                                <div className={`text-2xl font-bold ${summary.overAllocatedCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {summary.overAllocatedCount > 0 ? '资源告警' : '运行正常'}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    {summary.overAllocatedCount > 0 ? `当前有 ${summary.overAllocatedCount} 项分配冲突` : '暂无冲突风险'}
                                </div>
                            </div>
                        </div>

                        {/* 资源详细列表 */}
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                                <h3 className="font-bold text-slate-900">人力资源明细清单</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50/80 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">资源名称</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">分配数量</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">岗位容量</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">实时利用率</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">工期单位</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">总工作日</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">人力成本</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">状态</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {resourceDetails.map((detail: any, index: number) => (
                                            <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                                            <Users size={16} className="text-blue-500" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900">{detail.resource.name}</div>
                                                            {detail.resource.hourlyRate && (
                                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">¥{detail.resource.hourlyRate}/HOUR</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-bold text-slate-900">
                                                    {detail.requirement.count}
                                                </td>
                                                <td className="px-4 py-3 text-slate-500">
                                                    {detail.resource.totalQuantity}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
                                                            <div
                                                                className={`h-full rounded-full ${detail.utilization > 100 ? 'bg-red-500' :
                                                                    detail.utilization > 80 ? 'bg-yellow-500' :
                                                                        'bg-emerald-500'
                                                                    }`}
                                                                style={{ width: `${Math.min(detail.utilization, 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className={`text-xs font-black ${detail.utilization > 100 ? 'text-red-600' :
                                                            detail.utilization > 80 ? 'text-yellow-600' :
                                                                'text-emerald-600'
                                                            }`}>
                                                            {detail.utilization.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    {detail.requirement.duration} {
                                                        detail.requirement.unit === 'day' ? '天' :
                                                            detail.requirement.unit === 'month' ? '月' :
                                                                detail.requirement.unit === 'year' ? '年' : ''
                                                    }
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600 font-medium">{detail.workDays}天</td>
                                                <td className="px-4 py-3 font-bold text-slate-900">
                                                    ¥{(detail.estimatedCost / 10000).toFixed(2)}万
                                                </td>
                                                <td className="px-4 py-3">
                                                    {detail.isOverAllocated ? (
                                                        <Badge variant="danger" size="sm">超额</Badge>
                                                    ) : (
                                                        <Badge variant="success" size="sm">正常</Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 技能匹配分析 */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-6 border-l-4 border-indigo-500 pl-3">资源岗位技能适配度</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {resourceDetails.map((detail: any, index: number) => {
                                    if (!detail || !detail.resource.skills) return null;

                                    const requiredSkills = detail.requirement.requiredSkills || [];
                                    const availableSkills = detail.resource.skills.map((s: any) => s.name);
                                    const matchedSkills = requiredSkills.filter((rs: string) => availableSkills.includes(rs));
                                    const matchRate = requiredSkills.length > 0
                                        ? (matchedSkills.length / requiredSkills.length) * 100
                                        : 100;

                                    return (
                                        <div key={index} className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 hover:shadow-md transition-shadow">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-bold text-slate-900">{detail.resource.name}</h4>
                                                <div className={`px-2 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${matchRate === 100 ? 'bg-emerald-100 text-emerald-700' :
                                                    matchRate >= 50 ? 'bg-amber-100 text-amber-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    MATCH {matchRate.toFixed(0)}%
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-2">项目需求项:</div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {requiredSkills.length > 0 ? requiredSkills.map((skill: string, i: number) => (
                                                            <span key={i} className={`px-2 py-0.5 text-[11px] font-medium rounded-md ${matchedSkills.includes(skill)
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                                : 'bg-red-50 text-red-700 border border-red-100'
                                                                }`}>
                                                                {skill}
                                                            </span>
                                                        )) : <span className="text-xs text-slate-400 italic">常规基础技能</span>}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-2">人才画像特征:</div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {detail.resource.skills.map((skill: any, i: number) => (
                                                            <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-medium rounded-md border border-blue-100">
                                                                {skill.name} · {skill.level}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 成本预警面板 */}
                        {summary.totalCost > (project.budget || 0) && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm border-l-8 border-l-red-500">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-white rounded-xl shadow-sm text-red-600">
                                        <AlertCircle size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-red-900 text-lg mb-1">人力资本预算超支预警</h4>
                                        <p className="text-sm text-red-800/80 leading-relaxed font-medium">
                                            当前预估人力成本 ¥{(summary.totalCost / 10000).toFixed(2)}万 已超出项目初期核准预算
                                            ¥{((project.budget || 0) / 10000).toFixed(2)}万。
                                            <span className="block mt-2 font-bold underline decoration-2 underline-offset-4 decoration-red-300">
                                                当前缺口规模：¥{((summary.totalCost - (project.budget || 0)) / 10000).toFixed(2)}万，建议优先审视 P2 级以下资源岗位。
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectResourceDetail;
