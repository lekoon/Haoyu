import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/taskService';
import type { Task } from '@haoyu/shared';
import { handleApiOperation } from '../utils/apiHandler';

export const useTasks = (projectId: string | undefined) => {
    const queryClient = useQueryClient();

    const tasksQuery = useQuery({
        queryKey: ['tasks', projectId],
        queryFn: async () => {
            return handleApiOperation<Task[]>(
                async () => {
                    return await taskService.getTasks(projectId!);
                },
                'fetch tasks',
                {
                    fallbackValue: [],
                    isDemoMode: true
                }
            );
        },
        enabled: !!projectId,
    });

    const taskTreeQuery = useQuery({
        queryKey: ['tasks', 'tree', projectId],
        queryFn: async () => {
            return handleApiOperation<Task[]>(
                async () => {
                    return await taskService.getTaskTree(projectId!);
                },
                'fetch task tree',
                {
                    fallbackValue: [],
                    isDemoMode: true
                }
            );
        },
        enabled: !!projectId,
    });

    const createTaskMutation = useMutation({
        mutationFn: async (task: Partial<Task>) => {
            return handleApiOperation<Task>(
                async () => {
                    return await taskService.createTask(task);
                },
                'create task',
                {
                    fallbackValue: { ...task, id: `mock-task-${Date.now()}` } as Task,
                    isDemoMode: true
                }
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
        },
    });

    const updateTaskMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
            return handleApiOperation<Task>(
                async () => {
                    return await taskService.updateTask(id, updates);
                },
                'update task',
                {
                    fallbackValue: { id, ...updates } as Task,
                    isDemoMode: true
                }
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
        },
    });

    const deleteTaskMutation = useMutation({
        mutationFn: async (id: string) => {
            return handleApiOperation<void>(
                async () => {
                    return await taskService.deleteTask(id);
                },
                'delete task',
                {
                    fallbackValue: undefined,
                    isDemoMode: true
                }
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
        },
    });

    const syncTaskTreeMutation = useMutation({
        mutationFn: async (tasks: any[]) => {
            return handleApiOperation<any[]>(
                async () => {
                    return await taskService.syncTaskTree(projectId!, tasks);
                },
                'sync task tree',
                {
                    fallbackValue: tasks,
                    isDemoMode: true
                }
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
        },
    });

    return {
        tasks: tasksQuery.data || [],
        taskTree: taskTreeQuery.data || [],
        isLoading: tasksQuery.isLoading && !tasksQuery.data, // Only loading if really no data
        createTask: createTaskMutation.mutate,
        updateTask: updateTaskMutation.mutate,
        deleteTask: deleteTaskMutation.mutate,
        syncTaskTree: syncTaskTreeMutation.mutate,
    };
};
