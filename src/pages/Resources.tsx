import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import type { ResourcePoolItem, TeamMember } from '../types';
import { Plus, LayoutGrid, Calendar, BarChart2, Activity, AlertTriangle, DollarSign, Target, Gauge } from 'lucide-react';
import { generateTimeBuckets, calculateResourceLoad } from '../utils/resourcePlanning';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    rectSortingStrategy
} from '@dnd-kit/sortable';

// Components
import DraggableResourceCard from '../components/DraggableResourceCard';
import ResourceGanttChart from '../components/ResourceGanttChart';
import ResourceUtilizationAnalysis from '../components/ResourceUtilizationAnalysis';
import ResourceConflictDetector from '../components/ResourceConflictDetector';
import CostAnalysis from '../components/CostAnalysis';
import SkillMatchingAnalysis from '../components/SkillMatchingAnalysis';
import DashboardCards from '../components/resource-viz/DashboardCards';
import ResourceHeatmap from '../components/resource-viz/ResourceHeatmap';
import ProjectProgressCards from '../components/resource-viz/ProjectProgressCards';
import ResourceDetailForm from '../components/ResourceDetailForm';

type ViewMode = 'dashboard' | 'pool' | 'capacity' | 'gantt' | 'analysis' | 'conflicts' | 'costs' | 'skills';

const Resources: React.FC = () => {
    const { resourcePool, projects, addResource, updateResource, deleteResource, reorderResources } = useStore();
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<ResourcePoolItem>>({ name: '', totalQuantity: 0 });

    // Member Management State
    const [selectedResource, setSelectedResource] = useState<ResourcePoolItem | null>(null);
    const [editingMember, setEditingMember] = useState<TeamMember | undefined>(undefined);
    const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);

    // Sensors for Drag and Drop
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor)
    );

    // Capacity Planning Data
    const buckets = useMemo(() => generateTimeBuckets(projects, 12), [projects]);
    const resourceLoads = useMemo(() => calculateResourceLoad(projects, resourcePool, buckets), [projects, resourcePool, buckets]);

    // Calculate utilization for each resource (current month)
    const resourceUtilization = useMemo(() => {
        const currentMonthLabel = buckets[0]?.label;
        const utilizationMap = new Map<string, number>();

        resourceLoads.forEach(load => {
            const currentAlloc = load.allocations[currentMonthLabel];
            const used = currentAlloc ? currentAlloc.total : 0;
            const percentage = load.capacity > 0 ? (used / load.capacity) * 100 : 0;
            utilizationMap.set(load.resourceId, percentage);
        });

        return utilizationMap;
    }, [resourceLoads, buckets]);

    // Analysis Data
    const analysisData = useMemo(() => {
        const currentMonthLabel = buckets[0]?.label;
        return resourceLoads.map(load => {
            const currentAlloc = load.allocations[currentMonthLabel];
            const used = currentAlloc ? currentAlloc.total : 0;
            const utilization = load.capacity > 0 ? (used / load.capacity) * 100 : 0;

            return {
                resourceName: load.resourceName,
                capacity: load.capacity,
                used,
                utilization
            };
        });
    }, [resourceLoads, buckets]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = resourcePool.findIndex((item) => item.id === active.id);
            const newIndex = resourcePool.findIndex((item) => item.id === over.id);

            reorderResources(arrayMove(resourcePool, oldIndex, newIndex));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name && formData.totalQuantity !== undefined) {
            addResource({
                id: `res-${Date.now()}`,
                name: formData.name,
                totalQuantity: formData.totalQuantity,
                members: [] // Initialize with empty members
            });
            setIsModalOpen(false);
            setFormData({ name: '', totalQuantity: 0 });
        }
    };

    const handleEditResource = (resource: ResourcePoolItem) => {
        setSelectedResource(resource);
    };

    const handleSaveMember = (memberData: Partial<TeamMember>) => {
        if (!selectedResource) return;

        const updatedMembers = [...(selectedResource.members || [])];

        if (editingMember) {
            // Update existing member
            const index = updatedMembers.findIndex(m => m.id === editingMember.id);
            if (index !== -1) {
                updatedMembers[index] = { ...updatedMembers[index], ...memberData };
            }
        } else {
            // Add new member
            const newMember: TeamMember = {
                id: `mem-${Date.now()}`,
                name: memberData.name || 'New Member',
                role: memberData.role || selectedResource.name,
                skills: memberData.skills || [],
                availability: memberData.availability || 40,
                assignments: [],
                ...memberData
            } as TeamMember;
            updatedMembers.push(newMember);
        }

        updateResource(selectedResource.id, { members: updatedMembers });
        setIsMemberFormOpen(false);
        setEditingMember(undefined);
    };

    const handleDeleteMember = (memberId: string) => {
        if (!selectedResource) return;
        const updatedMembers = selectedResource.members?.filter(m => m.id !== memberId) || [];
        updateResource(selectedResource.id, { members: updatedMembers });
    };

    const getCellColor = (used: number, capacity: number) => {
        if (capacity === 0) return 'bg-slate-100 text-slate-400';
        const ratio = used / capacity;
        if (ratio > 1) return 'bg-red-100 text-red-700 font-bold';
        if (ratio > 0.8) return 'bg-yellow-100 text-yellow-700';
        if (ratio > 0) return 'bg-green-100 text-green-700';
        return 'bg-slate-50 text-slate-400';
    };

    // 生成模拟的团队成员数据用于演示
    const resourcesWithMembers = useMemo(() => {
        return resourcePool.map(resource => {
            if (!resource.members || resource.members.length === 0) {
                // 为每个资源生成模拟成员
                const memberCount = Math.min(resource.totalQuantity, 5);
                const members: TeamMember[] = Array.from({ length: memberCount }).map((_, i) => ({
                    id: `${resource.id}-member-${i}`,
                    name: `${resource.name.split(' ')[0]} ${i + 1}`,
                    role: resource.name,
                    skills: [],
                    availability: 40,
                    assignments: []
                }));
                return { ...resource, members };
            }
            return resource;
        });
    }, [resourcePool]);

    // 计算仪表盘指标
    const dashboardMetrics = useMemo(() => {
        const totalProjects = projects.filter(p => p.status === 'active' || p.status === 'planning').length;
        const overloadedCount = 3; // 模拟数据
        const p0Projects = projects.filter(p => p.priority === 'P0');
        const p0SatisfactionRate = p0Projects.length > 0 ? 85 : 100;
        const totalManDays = projects.reduce((sum, p) =>
            sum + (p.resourceRequirements || []).reduce((s, r) => s + r.count * r.duration, 0), 0
        );
        return { totalProjects, overloadedCount, p0SatisfactionRate, totalManDays };
    }, [projects]);

    const tabs = [
        { id: 'dashboard', label: t('resources.dashboard'), icon: Gauge },
        { id: 'pool', label: t('resources.poolManagement'), icon: LayoutGrid },
        { id: 'capacity', label: t('resources.capacityPlanning'), icon: Calendar },
        { id: 'gantt', label: t('resources.gantt.title'), icon: Activity },
        { id: 'analysis', label: t('resources.analysis.title'), icon: BarChart2 },
        { id: 'conflicts', label: t('resources.conflicts'), icon: AlertTriangle },
        { id: 'skills', label: t('resources.skillMatching'), icon: Target },
        { id: 'costs', label: t('resources.costAnalysis'), icon: DollarSign },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{t('resources.title')}</h1>
                    <p className="text-slate-500 mt-1">{t('resources.subtitle')}</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
                >
                    <Plus size={20} />
                    {t('resources.addResource')}
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setViewMode(tab.id as ViewMode)}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                                viewMode === tab.id
                                    ? "bg-slate-100 text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            )}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {viewMode === 'dashboard' && (
                    <div className="space-y-6">
                        {/* Dashboard Cards */}
                        <DashboardCards
                            totalProjects={dashboardMetrics.totalProjects}
                            overloadedCount={dashboardMetrics.overloadedCount}
                            p0SatisfactionRate={dashboardMetrics.p0SatisfactionRate}
                            totalManDays={dashboardMetrics.totalManDays}
                        />

                        {/* Project Progress Cards */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-4">{t('resources.projectProgress')}</h3>
                            <ProjectProgressCards projects={projects} />
                        </div>

                        {/* Resource Heatmap */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-4">{t('resources.resourceHeatmap')}</h3>
                            <ResourceHeatmap resources={resourcesWithMembers} />
                        </div>
                    </div>
                )}

                {viewMode === 'pool' && (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={resourcePool.map(r => r.id)}
                            strategy={rectSortingStrategy}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {resourcePool.map((resource) => (
                                    <DraggableResourceCard
                                        key={resource.id}
                                        resource={resource}
                                        onUpdate={updateResource}
                                        onDelete={deleteResource}
                                        onEdit={handleEditResource}
                                        utilizationPercentage={resourceUtilization.get(resource.id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}

                {viewMode === 'capacity' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">{t('resources.resourceCapacityTimeline')}</h3>
                                <p className="text-sm text-slate-500">{t('resources.monthlyAllocation')}</p>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span>{t('resources.safe')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <span>{t('resources.highLoad')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <span>{t('resources.overbooked')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="p-4 font-bold text-slate-700 sticky left-0 bg-slate-50 z-10 w-64 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                            {t('resources.resourceName')}
                                        </th>
                                        <th className="p-4 font-bold text-slate-700 w-32">{t('resources.capacity')}</th>
                                        {buckets.map(bucket => (
                                            <th key={bucket.label} className="p-4 font-semibold text-slate-600 min-w-[100px] text-center whitespace-nowrap">
                                                {bucket.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {resourceLoads.map(load => (
                                        <tr key={load.resourceId} className="hover:bg-slate-50/50">
                                            <td className="p-4 font-medium text-slate-900 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                                {load.resourceName}
                                            </td>
                                            <td className="p-4 text-slate-500">
                                                {load.capacity} {t('analysis.units')}
                                            </td>
                                            {buckets.map(bucket => {
                                                const data = load.allocations[bucket.label];
                                                const used = data.total;
                                                const remaining = load.capacity - used;

                                                return (
                                                    <td key={bucket.label} className="p-2 text-center">
                                                        <div className="group relative">
                                                            <div className={clsx("py-2 px-1 rounded-lg text-sm transition-colors cursor-default", getCellColor(used, load.capacity))}>
                                                                <span className="font-bold">{used}</span>
                                                                <span className="opacity-60 mx-1">/</span>
                                                                <span className="opacity-60">{load.capacity}</span>
                                                            </div>

                                                            {/* Tooltip */}
                                                            {data.projects.length > 0 && (
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white text-xs rounded-xl p-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                                                                    <div className="font-bold mb-2 border-b border-slate-700 pb-1">{t('resources.allocations')} ({bucket.label})</div>
                                                                    <div className="space-y-1">
                                                                        {data.projects.map((p, i) => (
                                                                            <div key={i} className="flex justify-between">
                                                                                <span className="truncate max-w-[140px]">{p.name}</span>
                                                                                <span className={p.status === 'active' ? 'text-green-400' : 'text-blue-400'}>
                                                                                    {p.amount} ({p.status[0].toUpperCase()})
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <div className="mt-2 pt-1 border-t border-slate-700 text-right font-bold">
                                                                        {t('resources.remaining')}: {remaining}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {viewMode === 'gantt' && (
                    <ResourceGanttChart
                        projects={projects}
                        resources={resourcePool}
                    />
                )}

                {viewMode === 'analysis' && (
                    <ResourceUtilizationAnalysis data={analysisData} />
                )}

                {viewMode === 'conflicts' && (
                    <ResourceConflictDetector />
                )}

                {viewMode === 'skills' && (
                    <SkillMatchingAnalysis />
                )}

                {viewMode === 'costs' && (
                    <CostAnalysis />
                )}
            </div>

            {/* Add Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">{t('resources.addNewResource')}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('resources.resourceName')}</label>
                                <input
                                    required
                                    type="text"
                                    placeholder={t('resources.resourceNamePlaceholder')}
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('resources.totalCapacity')}</label>
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.totalQuantity}
                                    onChange={e => setFormData({ ...formData, totalQuantity: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="flex justify-end gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"
                                >
                                    {t('resources.addResource')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Member Management Modal */}
            {selectedResource && !isMemberFormOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{selectedResource.name} - {t('resources.members')}</h2>
                                <p className="text-sm text-slate-500">Manage team members and their details</p>
                            </div>
                            <button onClick={() => setSelectedResource(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                                <LayoutGrid size={24} className="text-slate-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Add New Member Card */}
                                <button
                                    onClick={() => {
                                        setEditingMember(undefined);
                                        setIsMemberFormOpen(true);
                                    }}
                                    className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-all group min-h-[200px]"
                                >
                                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <Plus size={24} />
                                    </div>
                                    <span className="font-bold text-slate-600 group-hover:text-blue-600">Add Team Member</span>
                                </button>

                                {/* Member Cards */}
                                {selectedResource.members?.map(member => (
                                    <div key={member.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900">{member.name}</h3>
                                                    <p className="text-xs text-slate-500">{member.role}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => {
                                                        setEditingMember(member);
                                                        setIsMemberFormOpen(true);
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Activity size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMember(member.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <AlertTriangle size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between text-slate-600">
                                                <span>Availability:</span>
                                                <span className="font-medium">{member.availability}h/week</span>
                                            </div>
                                            <div className="flex justify-between text-slate-600">
                                                <span>Skills:</span>
                                                <span className="font-medium">{member.skills.length}</span>
                                            </div>
                                            {member.department && (
                                                <div className="flex justify-between text-slate-600">
                                                    <span>Dept:</span>
                                                    <span className="font-medium">{member.department}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Resource Detail Form */}
            {isMemberFormOpen && (
                <ResourceDetailForm
                    member={editingMember}
                    onSave={handleSaveMember}
                    onClose={() => setIsMemberFormOpen(false)}
                />
            )}
        </div>
    );
};

export default Resources;
