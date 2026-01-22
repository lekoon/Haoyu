export enum Role {
    ADMIN = 'admin',
    MANAGER = 'manager',
    USER = 'user',
    READONLY = 'readonly',
    PMO = 'pmo'
}

export interface User {
    id: string;
    username: string;
    role: Role;
    name?: string;
    email?: string;
    avatar?: string;
}

export interface FactorDefinition {
    id: string;
    name: string;
    weight: number; // 0-100
    description?: string;
}

export type ResourceUnit = 'day' | 'month' | 'year';
export type BaySize = 'S' | 'M' | 'L';
export type ResourceStatus = 'available' | 'occupied' | 'maintenance';

export interface ResourceBooking {
    id: string;
    projectId: string;
    projectName: string;
    startDate: string;
    endDate: string;
    reservedBy: string; // User ID
    reservedByName?: string;
    reservedByDept?: string;
    purpose?: string;
    usageType?: 'test' | 'development' | 'demo' | 'validation';
    status?: 'planned' | 'active' | 'completed' | 'cancelled';
    initialStatusConfirmed?: boolean;
    returnStatusConfirmed?: boolean;
}

export interface Project {
    id: string;
    name: string;
    code?: string;
    description: string;
    status: 'planning' | 'active' | 'completed' | 'on-hold';
    priority: 'P0' | 'P1' | 'P2' | 'P3';
    startDate: string;
    endDate: string;
    managerId?: string;
    category?: string;
    score?: number;
    budget?: number;
    actualCost?: number;
    factors?: Record<string, number>;
    milestones?: Milestone[];
    tasks?: any[];
    resourceRequirements?: ResourceRequirement[];
    environmentRequirements?: EnvironmentRequirement[];
    baselines?: ProjectBaseline[];
    activeBaselineId?: string;
    currentStage?: ProjectStage;
    gates?: StageGate[];
    keyTasks?: ProjectKeyTask[];
    pdsgMembers?: TeamMember[];
    risks?: Risk[];
    costHistory?: CostEntry[];
    department?: string;
    healthIndicators?: any;
    pmoAdvice?: string;
}

export interface Risk {
    id: string;
    projectId: string;
    title: string;
    description?: string;
    category: string;
    status: 'identified' | 'mitigated' | 'resolved' | 'accepted';
    priority: 'low' | 'medium' | 'high' | 'critical';
    probability: number;
    impact: number;
    riskScore: number;
    ownerId?: string;
    mitigationStrategy?: string;
    identifiedDate: string;
    resolvedDate?: string;
}

export interface EnvironmentRequirement {
    environmentId: string;
    environmentName: string;
    startDate: string;
    endDate: string;
    purpose: string;
}

export interface ProjectBaseline {
    id: string;
    name: string;
    description?: string;
    createdDate: string;
    createdBy: string;
    snapshot: any;
}

export interface ActualResourceUsage {
    resourceId: string;
    resourceName: string;
    count: number;
    duration: number;
    unit: ResourceUnit;
    department?: string;
    category?: string;
}

export interface Milestone {
    id: string;
    name: string;
    date: string;
    completed: boolean;
    description?: string;
}

export interface ResourceRequirement {
    resourceId: string;
    count: number;
    duration: number;
    unit: ResourceUnit;
    requiredSkills?: string[];
    estimatedCost?: number;
}

export interface Skill {
    id: string;
    name: string;
    level: SkillLevel;
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface ResourcePoolItem {
    id: string;
    name: string;
    department?: string;
    category?: 'frontend' | 'backend' | 'design' | 'testing' | 'hardware' | 'management' | 'other';
    totalQuantity: number;
    costPerUnit?: number;
    skills?: Skill[];
    hourlyRate?: number;
    members?: TeamMember[];
}

export interface TeamMember {
    id: string;
    name: string;
    role: string;
    gender?: '男' | '女' | '其他';
    department?: string;
    position?: string;
    avatar?: string;
    email?: string;
    phone?: string;
    joinDate?: string;
    skills: string[];
    availability: number;
    hourlyRate?: number;
    assignments: Array<{
        projectId: string;
        projectName: string;
        hours: number;
        startDate: string;
        endDate: string;
    }>;
}

export interface KeyTaskDefinition {
    id: string;
    name: string;
    color: string;
}

export interface ProjectKeyTask {
    definitionId: string;
    startDate: string;
    endDate: string;
    notes?: string;
}

export interface ChangeRequest {
    id: string;
    projectId: string;
    title: string;
    description: string;
    type: 'scope' | 'schedule' | 'budget' | 'resource';
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    priority: 'high' | 'medium' | 'low';
    createdAt: string;
    updatedAt?: string;
    creatorId: string;
    creatorName: string;
    requestedBy: string;
    requestedByName: string;
    requestDate: string;
    category: string;
    estimatedEffortHours: number;
    estimatedCostIncrease: number;
    scheduleImpactDays: number;
    impactLevel: 'low' | 'medium' | 'high' | 'critical';
    businessJustification?: string;
    approvedBy?: string;
    approvedByName?: string;
    approvalDate?: string;
    impactAnalysis?: any;
}

export interface EnvironmentResource {
    id: string;
    name: string;
    type: string;
    status: ResourceStatus;
    bookings: EnvironmentBooking[];
    createdAt: string;
    updatedAt?: string;
}

export interface EnvironmentBooking {
    id: string;
    environmentId: string;
    projectId: string;
    projectName: string;
    startDate: string;
    endDate: string;
    status: 'active' | 'cancelled' | 'completed' | 'planned';
    createdAt: string;
    updatedAt?: string;
}

export interface Requirement {
    id: string;
    projectId: string;
    title: string;
    description: string;
    priority: 'must' | 'should' | 'could' | 'wont';
    status: 'draft' | 'analyzing' | 'approved' | 'implemented' | 'validated';
    relatedTaskIds: string[];
    createdAt: string;
    updatedAt?: string;
}

export interface ApprovalWorkflow {
    id: string;
    entityType: 'change_request' | 'project' | 'budget';
    entityId: string;
    status: 'pending' | 'approved' | 'rejected';
    steps: any[];
    createdAt: string;
    approvers: any[];
}

export interface ProjectSimulation {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: string;
    impactAnalysis: any;
}

export interface GhostTaskReport {
    id: string;
    projectId: string;
    tasks: any[];
    generatedAt: string;
}

export interface ProjectTemplate {
    id: string;
    name: string;
    description: string;
    category?: string;
    department?: string;
    icon?: string;
    defaultDuration: number;
    defaultBudget?: number;
    defaultFactors: Record<string, number>;
    defaultResources: ResourceRequirement[];
    isBuiltIn?: boolean;
    createdAt: string;
}

export interface ProjectTypeDefinition {
    id: string;
    name: string;
    color: string;
}

export interface BayResource {
    id: string;
    name: string;
    size: BaySize;
    status: ResourceStatus;
    currentProjectId?: string;
    currentProjectName?: string;
    currentMachineId?: string;
    currentMachineName?: string;
    health: number; // 0-100
    lastMaintenance: string;
    nextMaintenance: string;
    bookings: ResourceBooking[];
    conflicts?: string[];
    softwareVersion?: string;
}

export interface MachineResource {
    id: string;
    name: string;
    model: string;
    platform?: string;
    status: ResourceStatus;
    health: number;
    lastMaintenance: string;
    nextMaintenance: string;
    bookings: ResourceBooking[];
    conflicts?: string[];
    softwareVersion?: string;
}

export interface Task {
    id: string;
    projectId: string;
    name: string;
    description?: string;
    status: 'planning' | 'active' | 'completed' | 'on-hold';
    priority: 'P0' | 'P1' | 'P2' | 'P3';
    startDate: string;
    endDate: string;
    progress: number;
    type: 'task' | 'milestone' | 'group';
    parentId?: string;
    assignee?: string;
    color?: string;
    dependencies?: string[];
    y?: number; // Visual position
}

export interface CostEntry {
    id: string;
    projectId: string;
    amount: number;
    category: string;
    description: string;
    date: string;
    createdBy: string;
}

export type ProjectStage = 'initiation' | 'planning' | 'execution' | 'monitoring' | 'closing';

export interface StageGate {
    id: string;
    stage: ProjectStage;
    name: string;
    status: 'pending' | 'completed' | 'blocked';
    description?: string;
    approverId?: string;
    approvalDate?: string;
}

export interface ProjectWithStageGate extends Project {
    currentStage: ProjectStage;
    gates: StageGate[];
}
