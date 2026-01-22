export * from '@haoyu/shared';

// Re-export specific local types if they don't exist in shared yet
export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: string;
    read: boolean;
}

export interface Alert {
    id: string;
    type: 'resource_conflict' | 'deadline_risk' | 'budget_overflow';
    severity: 'high' | 'medium' | 'low';
    message: string;
    projectId: string;
    timestamp: string;
    read: boolean;
}

// Any other local-only types...
