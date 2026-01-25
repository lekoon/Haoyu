import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import type { Project } from '../types';
import { useStore } from '../store/useStore';
import { handleApiOperation } from '../utils/apiHandler';

export const useProjectsData = () => {
    const queryClient = useQueryClient();
    const { projects: storeProjects, setProjects, addProject, updateProject: storeUpdateProject, deleteProject: storeDeleteProject } = useStore();

    const projectsQuery = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            return handleApiOperation<Project[]>(
                async () => {
                    const response = await apiClient.get<Project[]>('/projects', { timeout: 3000 });
                    // On success, sync to local store
                    setProjects(response.data);
                    return response.data;
                },
                'fetch projects',
                {
                    fallbackValue: storeProjects,
                    isDemoMode: true // Allow fallback to local store if backend fails
                }
            );
        },
        initialData: storeProjects.length > 0 ? storeProjects : undefined,
    });

    const createProjectMutation = useMutation({
        mutationFn: async (newProject: Partial<Project>) => {
            return handleApiOperation<Project>(
                async () => {
                    const response = await apiClient.post<Project>('/projects', newProject);
                    return response.data;
                },
                'create project',
                {
                    // Fallback: Simulate local creation
                    fallbackValue: (() => {
                        const mockId = `mock-p-${Date.now()}`;
                        const mockProject = {
                            ...newProject,
                            id: mockId,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        } as Project;
                        // Update local store immediately for optimistic UI
                        addProject(mockProject);
                        return mockProject;
                    })(),
                    isDemoMode: true
                }
            );
        },
        onSuccess: (data) => {
            // Invalidate to refetch from backend (or re-confirm local state)
            queryClient.setQueryData(['projects'], (old: Project[] | undefined) => {
                const list = old || [];
                return list.some(p => p.id === data.id) ? list : [...list, data];
            });
            // Also invalidate key to ensure sync
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });

    const updateProjectMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Project> }) => {
            return handleApiOperation<Project>(
                async () => {
                    const response = await apiClient.put<Project>(`/projects/${id}`, updates);
                    return response.data;
                },
                'update project',
                {
                    fallbackValue: (() => {
                        storeUpdateProject(id, updates);
                        return { id, ...updates } as Project;
                    })(),
                    isDemoMode: true
                }
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });

    const deleteProjectMutation = useMutation({
        mutationFn: async (id: string) => {
            return handleApiOperation<void>(
                async () => {
                    await apiClient.delete(`/projects/${id}`);
                },
                'delete project',
                {
                    fallbackValue: (() => {
                        storeDeleteProject(id);
                    })(),
                    isDemoMode: true
                }
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });

    return {
        projects: projectsQuery.data || storeProjects,
        isLoading: projectsQuery.isLoading && storeProjects.length === 0,
        isError: projectsQuery.isError, // Now correctly reflects if both backend AND fallback failed (unlikely)
        error: projectsQuery.error,
        createProject: createProjectMutation.mutate,
        updateProject: updateProjectMutation.mutate,
        deleteProject: deleteProjectMutation.mutate,
    };
};

export const useProjectDetail = (id: string | undefined) => {
    const { projects } = useStore();

    return useQuery({
        queryKey: ['projects', id],
        queryFn: async () => {
            if (!id) return null;

            return handleApiOperation<Project | undefined>(
                async () => {
                    const response = await apiClient.get<Project>(`/projects/${id}`, { timeout: 3000 });
                    return response.data;
                },
                `fetch project detail ${id}`,
                {
                    // Fallback: search in local store
                    fallbackValue: (() => {
                        const found = useStore.getState().projects.find(p => p.id === id);
                        if (found) return found;

                        // Last resort mock if even local store doesn't have it (e.g. direct link)
                        console.warn(`Project ${id} not found in store, generating mock`);
                        return {
                            id: id,
                            name: `Project ${id}`,
                            description: 'Auto-generated fallback project',
                            status: 'planning',
                            priority: 'P2',
                            startDate: new Date().toISOString(),
                            endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
                            progress: 0,
                            factors: { strategic_alignment: 5, financial_roi: 5, risk_level: 5, market_urgency: 5, tech_feasibility: 5 },
                            pmoMetrics: {
                                strategicConsistency: 3,
                                rdInvestment: 0,
                                techPlatform: 'Traditional',
                                valueRiskMetrics: { commercialROI: 3, strategicFit: 3, technicalFeasibility: 3, marketWindow: 3, resourceDependency: 3 },
                                cashFlow: { annualBudget: 0, currentInvestment: 0, futureROI: [] },
                                resourceLoad: []
                            }
                        } as Project;
                    })(),
                    isDemoMode: true
                }
            );
        },
        enabled: !!id,
        initialData: () => projects.find(p => p.id === id),
    });
};
