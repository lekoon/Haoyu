import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
    ChangeRequest,
    EnvironmentResource,
    EnvironmentBooking,
    Requirement,
    ApprovalWorkflow,
    ProjectSimulation,
    GhostTaskReport,
} from '@haoyu/shared';

interface PMOStoreState {
    // Change Requests
    changeRequests: ChangeRequest[];
    addChangeRequest: (changeRequest: Omit<ChangeRequest, 'id' | 'createdAt'>) => void;
    updateChangeRequest: (id: string, updates: Partial<ChangeRequest>) => void;
    approveChangeRequest: (id: string, approverId: string, approverName: string) => void;
    rejectChangeRequest: (id: string, approverId: string, approverName: string, reason: string) => void;
    getChangeRequestsByProject: (projectId: string) => ChangeRequest[];

    // Environment Resources
    environmentResources: EnvironmentResource[];
    addEnvironmentResource: (resource: Omit<EnvironmentResource, 'id' | 'createdAt' | 'bookings'>) => void;
    updateEnvironmentResource: (id: string, updates: Partial<EnvironmentResource>) => void;
    deleteEnvironmentResource: (id: string) => void;
    bookEnvironment: (booking: Omit<EnvironmentBooking, 'id' | 'createdAt'>) => void;
    cancelEnvironmentBooking: (environmentId: string, bookingId: string) => void;
    getAvailableEnvironments: (startDate: string, endDate: string, type?: string) => EnvironmentResource[];

    // Requirements (for RTM)
    requirements: Requirement[];
    addRequirement: (requirement: Omit<Requirement, 'id' | 'createdAt'>) => void;
    updateRequirement: (id: string, updates: Partial<Requirement>) => void;
    deleteRequirement: (id: string) => void;
    linkRequirementToTask: (requirementId: string, taskId: string) => void;
    unlinkRequirementFromTask: (requirementId: string, taskId: string) => void;
    getRequirementsByProject: (projectId: string) => Requirement[];

    // Approval Workflows
    approvalWorkflows: ApprovalWorkflow[];
    createApprovalWorkflow: (workflow: Omit<ApprovalWorkflow, 'id' | 'createdAt'>) => void;
    updateApprovalStep: (workflowId: string, stepNumber: number, decision: 'approve' | 'reject', comments?: string) => void;
    getWorkflowsByEntity: (entityId: string) => ApprovalWorkflow[];

    // Project Simulations
    simulations: ProjectSimulation[];
    createSimulation: (simulation: Omit<ProjectSimulation, 'id' | 'createdAt'>) => void;
    updateSimulation: (id: string, updates: Partial<ProjectSimulation>) => void;
    deleteSimulation: (id: string) => void;
    setActiveSimulation: (id: string | null) => void;
    getActiveSimulation: () => ProjectSimulation | null;

    // Ghost Task Reports
    ghostTaskReports: GhostTaskReport[];
    generateGhostTaskReport: (report: GhostTaskReport) => void;
    clearGhostTaskReports: (projectId: string) => void;
}

export const usePMOStore = create<PMOStoreState>()(
    persist(
        (set, get) => ({
            // Initial State
            changeRequests: [],
            environmentResources: [],
            requirements: [],
            approvalWorkflows: [],
            simulations: [],
            ghostTaskReports: [],

            // Change Request Actions
            addChangeRequest: (changeRequest) => {
                const newChangeRequest: ChangeRequest = {
                    ...changeRequest,
                    id: `cr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    createdAt: new Date().toISOString(),
                };
                set((state) => ({
                    changeRequests: [...state.changeRequests, newChangeRequest],
                }));
            },

            updateChangeRequest: (id, updates) => {
                set((state) => ({
                    changeRequests: state.changeRequests.map((cr) =>
                        cr.id === id ? { ...cr, ...updates, updatedAt: new Date().toISOString() } : cr
                    ),
                }));
            },

            approveChangeRequest: (id, approverId, approverName) => {
                set((state) => ({
                    changeRequests: state.changeRequests.map((cr) =>
                        cr.id === id
                            ? {
                                ...cr,
                                status: 'approved',
                                approvedBy: approverId,
                                approvedByName: approverName,
                                approvalDate: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                            }
                            : cr
                    ),
                }));
            },

            rejectChangeRequest: (id, approverId, approverName, reason) => {
                set((state) => ({
                    changeRequests: state.changeRequests.map((cr) =>
                        cr.id === id
                            ? {
                                ...cr,
                                status: 'rejected',
                                approvedBy: approverId,
                                approvedByName: approverName,
                                rejectionReason: reason,
                                approvalDate: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                            }
                            : cr
                    ),
                }));
            },

            getChangeRequestsByProject: (projectId) => {
                return get().changeRequests.filter((cr) => cr.projectId === projectId);
            },

            // Environment Resource Actions
            addEnvironmentResource: (resource) => {
                const newResource: EnvironmentResource = {
                    ...resource,
                    id: `env-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    bookings: [],
                    createdAt: new Date().toISOString(),
                };
                set((state) => ({
                    environmentResources: [...state.environmentResources, newResource],
                }));
            },

            updateEnvironmentResource: (id, updates) => {
                set((state) => ({
                    environmentResources: state.environmentResources.map((env) =>
                        env.id === id ? { ...env, ...updates, updatedAt: new Date().toISOString() } : env
                    ),
                }));
            },

            deleteEnvironmentResource: (id) => {
                set((state) => ({
                    environmentResources: state.environmentResources.filter((env) => env.id !== id),
                }));
            },

            bookEnvironment: (booking) => {
                const newBooking: EnvironmentBooking = {
                    ...booking,
                    id: `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    createdAt: new Date().toISOString(),
                };

                set((state) => ({
                    environmentResources: state.environmentResources.map((env) =>
                        env.id === booking.environmentId
                            ? { ...env, bookings: [...env.bookings, newBooking] }
                            : env
                    ),
                }));
            },

            cancelEnvironmentBooking: (environmentId, bookingId) => {
                set((state) => ({
                    environmentResources: state.environmentResources.map((env) =>
                        env.id === environmentId
                            ? {
                                ...env,
                                bookings: env.bookings.map((b) =>
                                    b.id === bookingId
                                        ? { ...b, status: 'cancelled', updatedAt: new Date().toISOString() }
                                        : b
                                ),
                            }
                            : env
                    ),
                }));
            },

            getAvailableEnvironments: (startDate, endDate, type) => {
                const start = new Date(startDate);
                const end = new Date(endDate);

                return get().environmentResources.filter((env) => {
                    // Filter by type if specified
                    if (type && env.type !== type) return false;

                    // Check if environment is available (not in maintenance)
                    if (env.status !== 'available') return false;

                    // Check for booking conflicts
                    const hasConflict = env.bookings.some((booking) => {
                        if (booking.status === 'cancelled' || booking.status === 'completed') return false;

                        const bookingStart = new Date(booking.startDate);
                        const bookingEnd = new Date(booking.endDate);

                        // Check for overlap
                        return start < bookingEnd && end > bookingStart;
                    });

                    return !hasConflict;
                });
            },

            // Requirement Actions
            addRequirement: (requirement) => {
                const newRequirement: Requirement = {
                    ...requirement,
                    id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    createdAt: new Date().toISOString(),
                };
                set((state) => ({
                    requirements: [...state.requirements, newRequirement],
                }));
            },

            updateRequirement: (id, updates) => {
                set((state) => ({
                    requirements: state.requirements.map((req) =>
                        req.id === id ? { ...req, ...updates, updatedAt: new Date().toISOString() } : req
                    ),
                }));
            },

            deleteRequirement: (id) => {
                set((state) => ({
                    requirements: state.requirements.filter((req) => req.id !== id),
                }));
            },

            linkRequirementToTask: (requirementId, taskId) => {
                set((state) => ({
                    requirements: state.requirements.map((req) =>
                        req.id === requirementId
                            ? {
                                ...req,
                                relatedTaskIds: [...req.relatedTaskIds, taskId],
                                updatedAt: new Date().toISOString(),
                            }
                            : req
                    ),
                }));
            },

            unlinkRequirementFromTask: (requirementId, taskId) => {
                set((state) => ({
                    requirements: state.requirements.map((req) =>
                        req.id === requirementId
                            ? {
                                ...req,
                                relatedTaskIds: req.relatedTaskIds.filter((id) => id !== taskId),
                                updatedAt: new Date().toISOString(),
                            }
                            : req
                    ),
                }));
            },

            getRequirementsByProject: (projectId) => {
                return get().requirements.filter((req) => req.projectId === projectId);
            },

            // Approval Workflow Actions
            createApprovalWorkflow: (workflow) => {
                const newWorkflow: ApprovalWorkflow = {
                    ...workflow,
                    id: `wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    createdAt: new Date().toISOString(),
                };
                set((state) => ({
                    approvalWorkflows: [...state.approvalWorkflows, newWorkflow],
                }));
            },

            updateApprovalStep: (workflowId, stepNumber, decision, comments) => {
                set((state) => ({
                    approvalWorkflows: state.approvalWorkflows.map((wf) => {
                        if (wf.id !== workflowId) return wf;

                        const updatedApprovers = wf.approvers.map((approver) => {
                            if (approver.stepNumber !== stepNumber) return approver;

                            return {
                                ...approver,
                                status: decision === 'approve' ? 'approved' : 'rejected',
                                decision,
                                comments,
                                decidedAt: new Date().toISOString(),
                            };
                        });

                        // Determine overall status
                        const hasRejection = updatedApprovers.some((a) => a.status === 'rejected');
                        const allApproved = updatedApprovers.every((a) => !a.isRequired || a.status === 'approved');

                        let overallStatus: 'pending' | 'approved' | 'rejected' | 'cancelled' = 'pending';
                        if (hasRejection) overallStatus = 'rejected';
                        else if (allApproved) overallStatus = 'approved';

                        return {
                            ...wf,
                            approvers: updatedApprovers,
                            currentStepIndex: stepNumber,
                            overallStatus,
                            completedAt: overallStatus !== 'pending' ? new Date().toISOString() : undefined,
                        };
                    }),
                }));
            },

            getWorkflowsByEntity: (entityId) => {
                return get().approvalWorkflows.filter((wf) => wf.entityId === entityId);
            },

            // Simulation Actions
            createSimulation: (simulation) => {
                const newSimulation: ProjectSimulation = {
                    ...simulation,
                    id: `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    createdAt: new Date().toISOString(),
                };
                set((state) => ({
                    simulations: [...state.simulations, newSimulation],
                }));
            },

            updateSimulation: (id, updates) => {
                set((state) => ({
                    simulations: state.simulations.map((sim) => (sim.id === id ? { ...sim, ...updates } : sim)),
                }));
            },

            deleteSimulation: (id) => {
                set((state) => ({
                    simulations: state.simulations.filter((sim) => sim.id !== id),
                }));
            },

            setActiveSimulation: (id) => {
                set((state) => ({
                    simulations: state.simulations.map((sim) => ({
                        ...sim,
                        isActive: sim.id === id,
                    })),
                }));
            },

            getActiveSimulation: () => {
                return get().simulations.find((sim) => sim.isActive) || null;
            },

            // Ghost Task Report Actions
            generateGhostTaskReport: (report) => {
                set((state) => ({
                    ghostTaskReports: [
                        ...state.ghostTaskReports.filter((r) => r.projectId !== report.projectId),
                        report,
                    ],
                }));
            },

            clearGhostTaskReports: (projectId) => {
                set((state) => ({
                    ghostTaskReports: state.ghostTaskReports.filter((r) => r.projectId !== projectId),
                }));
            },
        }),
        {
            name: 'pmo-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

// Selectors
export const useChangeRequests = () => usePMOStore((state) => state.changeRequests);
export const useEnvironmentResources = () => usePMOStore((state) => state.environmentResources);
export const useRequirements = () => usePMOStore((state) => state.requirements);
export const useApprovalWorkflows = () => usePMOStore((state) => state.approvalWorkflows);
export const useSimulations = () => usePMOStore((state) => state.simulations);
export const useGhostTaskReports = () => usePMOStore((state) => state.ghostTaskReports);
