export type Role = 'ADMIN' | 'MANAGER' | 'USER' | 'READONLY' | 'PMO' | 'admin' | 'manager' | 'user' | 'readonly' | 'pmo';

export interface User {
    id: string;
    username: string;
    password?: string;
    name?: string;
    email?: string;
    role: Role | string;
    avatar?: string;
    managedProjects?: Project[];
    createdProjects?: Project[];
    assignedTasks?: Task[];
    ownedRisks?: Risk[];
    createdAt?: string;
    updatedAt?: string;
}

export interface FactorDefinition {
    id: string;
    name: string;
    weight: number; // 0-100
    description?: string;
}

export type ResourceUnit = 'day' | 'month' | 'year';
export type BaySize = 'S' | 'M' | 'L';
export type ResourceStatus = 'available' | 'occupied' | 'maintenance' | 'offline';

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
    usageType?: 'test' | 'development' | 'demo' | 'validation' | string;
    status?: 'planned' | 'active' | 'completed' | 'cancelled' | string;
    initialStatusConfirmed?: boolean;
    returnStatusConfirmed?: boolean;
}

export type ProjectStage = 'initiation' | 'planning' | 'execution' | 'monitoring' | 'closing';

export interface Task {
    id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    progress: number;
    color?: string;
    type: 'task' | 'milestone' | 'group' | string;
    parentId?: string;
    parent?: Task;
    children?: Task[];
    projectId: string;
    project?: Project;
    assigneeId?: string;
    assignee?: User | string;
    status: string;
    priority?: string;
    dependencies?: string[];
    x?: number;
    y?: number;
    height?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface Milestone {
    id: string;
    name: string;
    date: string;
    completed: boolean;
    description?: string;
    projectId: string;
    project?: Project;
    createdAt?: string;
    updatedAt?: string;
}

export type RiskStatus = 'identified' | 'assessed' | 'mitigated' | 'occurred' | 'closed' | string;
export type RiskCategory = 'technical' | 'resource' | 'schedule' | 'budget' | 'external' | 'scope' | 'other' | string;
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical' | string;
export type RiskPriority = 'low' | 'medium' | 'high' | 'critical' | string;

export interface RiskMitigationAction {
    id: string;
    title?: string;
    description: string;
    ownerId?: string;
    owner?: string;
    dueDate?: string;
    completedDate?: string;
    status: 'pending' | 'in_progress' | 'completed' | string;
}

export interface RiskHistoryEntry {
    id: string;
    date: string;
    userId: string;
    userName: string;
    action: string;
    description: string;
    oldValue?: any;
    newValue?: any;
}

export interface Risk {
    id: string;
    title: string;
    description?: string;
    category: RiskCategory;
    status: RiskStatus;
    priority: RiskLevel | string;
    probability: number; // 1-5
    impact: number;      // 1-5
    riskScore: number;   // probability * impact
    projectId: string;
    project?: Project;
    ownerId?: string;
    owner?: User | string;
    mitigationStrategy?: string;
    contingencyPlan?: string;
    estimatedCostImpact?: number;
    mitigationCost?: number;
    mitigationActions: RiskMitigationAction[];
    tags?: string[];
    identifiedDate?: string;
    resolvedDate?: string;
    lastReviewDate?: string;
    nextReviewDate?: string;
    history?: RiskHistoryEntry[];
    createdAt?: string;
    updatedAt?: string;
}

export interface EnvironmentRequirement {
    environmentId: string;
    environmentName: string;
    startDate: string;
    endDate: string;
    purpose: string;
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
    level: SkillLevel | string;
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface ResourcePoolItem {
    id: string;
    name: string;
    department?: string;
    category?: string;
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
    gender?: '男' | '女' | '其他' | string;
    department?: string;
    position?: string;
    avatar?: string;
    email?: string;
    phone?: string;
    joinDate?: string;
    skills: string[];
    certifications?: string[];
    availability: number;
    hourlyRate?: number;
    assignments: ProjectAssignment[];
}

export interface ProjectAssignment {
    id: string;
    projectId: string;
    projectName: string;
    hours: number;
    startDate: string;
    endDate: string;
    memberId?: string;
    member?: TeamMember;
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

export interface EVMMetrics {
    projectId: string;
    asOfDate: string;
    plannedValue: number;
    pv: number;
    earnedValue: number;
    ev: number;
    actualCost: number;
    ac: number;
    bac: number;
    schedulePerformanceIndex: number;
    spi: number;
    costPerformanceIndex: number;
    cpi: number;
    scheduleVariance: number;
    sv: number;
    costVariance: number;
    cv: number;
    estimateAtCompletion: number;
    eac: number;
    estimateToComplete: number;
    etc: number;
    varianceAtCompletion: number;
    vac: number;
    toCompletePerformanceIndex: number;
    tcpi: number;
    status: {
        schedule: 'ahead' | 'on_track' | 'behind' | string;
        cost: 'under_budget' | 'on_track' | 'over_budget' | string;
    };
}

export interface VarianceMetrics {
    scheduleVariance: number;
    costVariance: number;
    schedulePerformanceIndex: number;
    costPerformanceIndex: number;
    budgetVariancePercent?: number;
}

export interface ProjectBaseline {
    id: string;
    projectId: string;
    name: string;
    description?: string;
    createdAt: string;
    createdDate?: string; // Alias
    createdBy: string;
    createdByName?: string;
    snapshot: {
        tasks: Task[];
        milestones: Milestone[];
        budget?: number;
    };
    isActive: boolean;
}

export interface ActivityLog {
    id: string;
    projectId?: string;
    userId: string;
    userName?: string;
    userAvatar?: string;
    action: string;
    entityType: string;
    entityId: string;
    entityName?: string;
    description?: string;
    details?: string;
    metadata?: any;
    timestamp: string;
}

export type EnvironmentType = 'dev' | 'test' | 'staging' | 'prod' | 'production' | 'integration' | 'device' | 'license' | string;
export type EnvironmentStatus = 'running' | 'stopped' | 'deploying' | 'failed' | 'available' | 'occupied' | 'maintenance' | 'offline' | string;

export interface CrossProjectDependency {
    id: string;
    projectId?: string; // Added for some components
    sourceProjectId: string;
    targetProjectId: string;
    sourceTaskId: string;
    targetTaskId: string;
    type: 'FS' | 'SS' | 'FF' | 'SF' | string;
    lag?: number;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'mention' | 'assignment' | 'deadline' | 'status_change' | 'comment' | 'system' | string;
    timestamp: string;
    createdAt?: string; // Alias
    read: boolean;
    duration?: number;
    userId?: string;
}

export type NotificationItem = Notification;

export interface ChangeRequest {
    id: string;
    title: string;
    description?: string;
    type: string;
    category?: string;
    status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled' | string;
    priority: 'low' | 'medium' | 'high' | 'critical' | string;
    estimatedCostIncrease: number;
    estimatedEffortHours?: number;
    scheduleImpactDays: number;
    impactLevel?: string;
    businessJustification?: string;
    projectId: string;
    project?: Project;
    projectName?: string;
    creatorId: string;
    requestedBy?: string;
    requestedByName?: string;
    requestDate?: string;
    approvedBy?: string;
    approvedByName?: string;
    approvalDate?: string;
    rejectionReason?: string;
    metadata?: any;
    createdAt: string;
    updatedAt: string;
    creatorName?: string; // Added for some components
}

export interface PMOMetrics {
    rdInvestment?: number;
    strategicConsistency?: number;
    techPlatform?: string;
    resourceLoad: Array<{
        roleId: string;
        monthlyUsage: Record<string, number>;
    }>;
    valueRiskMetrics: {
        commercialROI: number;
        strategicFit: number;
        technicalFeasibility: number;
        marketWindow: number;
        resourceDependency: number;
    };
    cashFlow: {
        currentInvestment: number;
        annualBudget: number;
        futureROI: number[];
    };
}

export interface ProjectHealthIndicators {
    overallHealth: 'red' | 'amber' | 'green' | string;
    scheduleHealth?: string;
    budgetHealth?: string;
    scopeHealth?: string;
    qualityHealth?: string;
    riskHealth?: string;
    trend?: 'up' | 'down' | 'stable' | string;
}

export interface Project {
    id: string;
    name: string;
    code?: string;
    description?: string;
    status: string;
    priority: string;
    startDate: string;
    endDate: string;
    progress?: number;
    category?: string;
    department?: string;
    managerId?: string;
    manager?: User | string;
    creatorId?: string;
    creator?: User;
    factors?: Record<string, number>;
    score?: number;
    rank?: number;
    budget?: number;
    actualCost?: number;
    estimatedCost?: number;
    tasks?: Task[];
    risks?: Risk[];
    milestones?: Milestone[];
    changeRequests?: ChangeRequest[];
    requirements?: Requirement[];
    assignments?: ProjectAssignment[];
    baselines?: ProjectBaseline[];
    activeBaselineId?: string;
    tags?: string[];
    owner?: string;
    milestoneDependencies?: any[];
    dependencies?: CrossProjectDependency[];
    actualResourceUsage?: any[];
    resourceAllocations?: any[];
    resourceRequirements?: ResourceRequirement[];
    environmentRequirements?: EnvironmentRequirement[];
    currentStage?: ProjectStage;
    gates?: StageGate[];
    pdsgMembers?: TeamMember[];
    costHistory?: CostEntry[];
    pmoMetrics?: PMOMetrics;
    healthIndicators?: ProjectHealthIndicators;
    pmoAdvice?: string;
    projectType?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CostEntry {
    id: string;
    date: string;
    amount: number;
    category: string;
    description: string;
    projectId: string;
    createdBy?: string;
}

export interface GateRequirement {
    id: string;
    description: string;
    required: boolean;
    completed: boolean;
    completedDate?: string;
    completedBy?: string;
    evidence?: string;
}

export type GateStatus = 'pending' | 'requested' | 'approved' | 'rejected' | 'conditional';

export interface StageGate {
    id: string;
    stage: ProjectStage;
    name: string;
    status: GateStatus;
    description?: string;
    requirements: GateRequirement[];
    approvedBy?: string;
    approvedByName?: string;
    approvalDate?: string;
    comments?: string;
    conditions?: string[];
}

export interface ProjectWithStageGate extends Project {
    currentStage: ProjectStage;
    gates: StageGate[];
}

export interface EnvironmentResource {
    id: string;
    name: string;
    type: string;
    status: EnvironmentStatus;
    description?: string;
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
    status: 'active' | 'cancelled' | 'completed' | 'planned' | string;
    createdAt: string;
    updatedAt?: string;
}

export interface Requirement {
    id: string;
    projectId: string;
    title: string;
    description?: string;
    priority: 'must' | 'should' | 'could' | 'wont' | string;
    status: 'draft' | 'analyzing' | 'approved' | 'implemented' | 'validated' | string;
    relatedTaskIds?: string[];
    createdAt: string;
    updatedAt?: string;
}

export interface ApprovalWorkflow {
    id: string;
    entityType: 'change_request' | 'project' | 'budget' | string;
    entityId: string;
    entityName?: string;
    type?: string;
    status: 'pending' | 'approved' | 'rejected' | string;
    overallStatus?: string;
    steps: any[];
    approvers: any[];
    requestedBy?: string;
    requestedByName?: string;
    requestDate?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface ProjectSimulation {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: string;
    impactAnalysis: any;
    updatedAt?: string;
}

export interface GhostTaskReport {
    id: string;
    projectId: string;
    tasks: any[];
    generatedAt: string;
    updatedAt?: string;
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
    currentProjectName?: string;
    currentBayName?: string;
    currentBayId?: string;
    softwareHistory?: SoftwareHistoryRecord[];
    replacementHistory?: ReplacementRecord[];
}

export interface ReplacementRecord {
    id: string;
    date: string;
    partName: string;
    reason: string;
    cost: number;
}

export interface SoftwareHistoryRecord {
    id: string;
    date: string;
    version: string;
    notes: string;
}

export interface Comment {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    timestamp: string;
    replies?: Comment[];
}

export interface ScopeCreepMetrics {
    totalChangeRequests: number;
    approvedChangeRequests: number;
    estimatedCostImpact: number;
    scheduleImpactDays: number;
    requiresRebaseline: boolean;
}

export type Alert = {
    id: string;
    type: 'resource_conflict' | 'deadline_risk' | 'budget_overflow' | 'error' | 'warning' | string;
    severity: 'high' | 'medium' | 'low' | string;
    message: string;
    projectId: string;
    timestamp: string;
    date?: string;
    read: boolean;
}

export type RAGStatus = 'red' | 'amber' | 'green' | 'gray';

export type RAGStatusInfo = {
    status: RAGStatus;
    label: string;
    color: string;
    description: string;
}

export interface RiskPriorityInfo {
    label: string;
    color: string;
    icon: string;
}

export interface RiskTemplate {
    id: string;
    name: string;
    category: RiskCategory;
    description: string;
    probability: number;
    impact: number;
    mitigationStrategy: string;
    contingencyPlan?: string;
    tags: string[];
    applicableProjectTypes?: string[];
}
