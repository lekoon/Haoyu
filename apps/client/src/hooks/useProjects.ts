import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import type { Project } from '../types';
import { useStore } from '../store/useStore';

export const useProjectsData = () => {
    const queryClient = useQueryClient();
    const setProjects = useStore((state) => state.setProjects);

    const projectsQuery = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const response = await apiClient.get<Project[]>('/projects');
            setProjects(response.data);
            return response.data;
        },
    });

    const createProjectMutation = useMutation({
        mutationFn: async (newProject: Partial<Project>) => {
            const response = await apiClient.post<Project>('/projects', newProject);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });

    const updateProjectMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Project> }) => {
            const response = await apiClient.put<Project>(`/projects/${id}`, updates);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });

    const deleteProjectMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/projects/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });

    return {
        projects: projectsQuery.data || [],
        isLoading: projectsQuery.isLoading,
        isError: projectsQuery.isError,
        error: projectsQuery.error,
        createProject: createProjectMutation.mutate,
        updateProject: updateProjectMutation.mutate,
        deleteProject: deleteProjectMutation.mutate,
    };
};

export const useProjectDetail = (id: string | undefined) => {
    return useQuery({
        queryKey: ['projects', id],
        queryFn: async () => {
            if (!id) return null;
            const response = await apiClient.get<Project>(`/projects/${id}`);
            return response.data;
        },
        enabled: !!id,
    });
};
