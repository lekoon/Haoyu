import type { ResourceRequest, ResourceRequestStatus, BookingType } from '../types';

/**
 * Create a new resource request
 */
export function createResourceRequest(
    projectId: string,
    projectName: string,
    requestedBy: string,
    requestedByName: string,
    roleRequired: string,
    skillsRequired: string[],
    quantity: number,
    startDate: string,
    endDate: string,
    hoursPerWeek: number
): ResourceRequest {
    return {
        id: `req-${Date.now()}`,
        projectId,
        projectName,
        requestedBy,
        requestedByName,
        requestDate: new Date().toISOString(),
        roleRequired,
        skillsRequired,
        quantity,
        startDate,
        endDate,
        hoursPerWeek,
        status: 'draft'
    };
}

/**
 * Submit resource request for approval
 */
export function submitResourceRequest(request: ResourceRequest): ResourceRequest {
    return {
        ...request,
        status: 'submitted'
    };
}

/**
 * Approve resource request
 */
export function approveResourceRequest(
    request: ResourceRequest,
    reviewedBy: string,
    reviewedByName: string,
    comments?: string
): ResourceRequest {
    return {
        ...request,
        status: 'approved',
        reviewedBy,
        reviewedByName,
        reviewDate: new Date().toISOString(),
        reviewComments: comments
    };
}

/**
 * Reject resource request
 */
export function rejectResourceRequest(
    request: ResourceRequest,
    reviewedBy: string,
    reviewedByName: string,
    comments: string
): ResourceRequest {
    return {
        ...request,
        status: 'rejected',
        reviewedBy,
        reviewedByName,
        reviewDate: new Date().toISOString(),
        reviewComments: comments
    };
}

/**
 * Allocate resource to approved request
 */
export function allocateResource(
    request: ResourceRequest,
    resourceId: string,
    resourceName: string,
    bookingType: BookingType
): ResourceRequest {
    return {
        ...request,
        status: 'allocated',
        allocatedResourceId: resourceId,
        allocatedResourceName: resourceName,
        bookingType
    };
}

/**
 * Get request status color
 */
export function getRequestStatusColor(status: ResourceRequestStatus): string {
    const colors: Record<ResourceRequestStatus, string> = {
        draft: 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-700',
        submitted: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20',
        approved: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20',
        rejected: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20',
        allocated: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20'
    };
    return colors[status];
}

/**
 * Get request status label
 */
export function getRequestStatusLabel(status: ResourceRequestStatus): string {
    const labels: Record<ResourceRequestStatus, string> = {
        draft: '草稿',
        submitted: '待审批',
        approved: '已批准',
        rejected: '已拒绝',
        allocated: '已分配'
    };
    return labels[status];
}

/**
 * Get booking type label
 */
export function getBookingTypeLabel(type: BookingType): string {
    return type === 'soft' ? '软预订' : '硬预订';
}

/**
 * Calculate request duration in days
 */
export function calculateRequestDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate total hours for request
 */
export function calculateTotalHours(
    hoursPerWeek: number,
    startDate: string,
    endDate: string
): number {
    const durationDays = calculateRequestDuration(startDate, endDate);
    const weeks = Math.ceil(durationDays / 7);
    return hoursPerWeek * weeks;
}
