import React, { useState } from 'react';
import { Users, Plus, X, Search, UserPlus, Shield } from 'lucide-react';
import type { Project, TeamMember, ResourcePoolItem } from '../types';
import { Badge, Button, Card } from './ui';

interface PDSGManagementProps {
    project: Project;
    resourcePool: ResourcePoolItem[];
    onUpdateMembers: (members: TeamMember[]) => void;
}

const PDSGManagement: React.FC<PDSGManagementProps> = ({
    project,
    resourcePool,
    onUpdateMembers
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Get all available members from resource pool
    const allAvailableMembers = React.useMemo(() => {
        const members: TeamMember[] = [];
        resourcePool.forEach(pool => {
            if (pool.members) {
                pool.members.forEach(member => {
                    // Avoid duplicates
                    if (!members.find(m => m.id === member.id)) {
                        members.push({
                            ...member,
                            department: pool.name // Use pool name as department
                        });
                    }
                });
            }
        });
        return members;
    }, [resourcePool]);

    const currentMembers = project.pdsgMembers || [];

    const filteredMembers = allAvailableMembers.filter(m =>
        (m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.role.toLowerCase().includes(searchTerm.toLowerCase())) &&
        !currentMembers.find(cm => cm.id === m.id)
    );

    const handleAddMember = (member: TeamMember) => {
        onUpdateMembers([...currentMembers, member]);
    };

    const handleRemoveMember = (memberId: string) => {
        onUpdateMembers(currentMembers.filter(m => m.id !== memberId));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Shield className="text-indigo-600" size={24} />
                        PDSG 核心管理小组
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">负责项目核心决策与关键节点执行，所有任务可指派给小组成员</p>
                </div>
                <Button
                    variant="primary"
                    icon={Plus}
                    onClick={() => setIsAdding(true)}
                >
                    添加核心成员
                </Button>
            </div>

            {/* Current Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentMembers.map(member => (
                    <Card key={member.id} className="p-4 hover:shadow-md transition-all border-l-4 border-indigo-500 relative group">
                        <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={16} />
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg overflow-hidden border border-indigo-200">
                                {member.avatar ? (
                                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                ) : (
                                    member.name.substring(0, 1)
                                )}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">{member.name}</h4>
                                <p className="text-xs text-slate-500">{member.role}</p>
                                <div className="flex gap-2 mt-2">
                                    <Badge size="sm" variant="primary">{member.department || '核心组'}</Badge>
                                    <Badge size="sm" variant="neutral">{member.position || '专家'}</Badge>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}

                {currentMembers.length === 0 && (
                    <div className="col-span-full py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                        <Users size={48} className="mb-4 opacity-20" />
                        <p>暂未设置 PDSG 成员，点击右上角添加</p>
                    </div>
                )}
            </div>

            {/* Add Member Modal */}
            {isAdding && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl bg-white shadow-2xl rounded-[32px] overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
                                    <UserPlus size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">选择核心成员</h3>
                                    <p className="text-sm text-slate-500">从资源池中筛选符合资质的人员加入 PDSG</p>
                                </div>
                            </div>
                            <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="p-8 flex-1 overflow-y-auto">
                            <div className="relative mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="搜索姓名、角色或技能..."
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-lg"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="space-y-3">
                                {filteredMembers.map(member => (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                                        onClick={() => handleAddMember(member)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                                                {member.name.substring(0, 1)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{member.name}</div>
                                                <div className="text-xs text-slate-500">{member.role} · {member.department}</div>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="ghost" className="text-indigo-600 font-bold">选择</Button>
                                    </div>
                                ))}
                                {filteredMembers.length === 0 && (
                                    <div className="text-center py-12 text-slate-400">
                                        没有找到匹配的成员
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <Button variant="secondary" onClick={() => setIsAdding(false)}>关闭</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default PDSGManagement;
