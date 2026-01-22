import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResourceService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.resource.findMany({
            include: {
                members: {
                    include: {
                        assignments: true,
                    },
                },
            },
        });
    }

    async findOne(id: string) {
        return this.prisma.resource.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        assignments: true,
                    },
                },
            },
        });
    }

    async create(data: any) {
        return this.prisma.resource.create({
            data,
            include: {
                members: true,
            },
        });
    }

    async update(id: string, data: any) {
        return this.prisma.resource.update({
            where: { id },
            data,
        });
    }

    async remove(id: string) {
        return this.prisma.resource.delete({
            where: { id },
        });
    }

    // Member actions
    async addMember(resourceId: string, memberData: any) {
        return this.prisma.teamMember.create({
            data: {
                ...memberData,
                resourceId,
            },
        });
    }

    async updateMember(memberId: string, updates: any) {
        return this.prisma.teamMember.update({
            where: { id: memberId },
            data: updates,
        });
    }

    async deleteMember(memberId: string) {
        return this.prisma.teamMember.delete({
            where: { id: memberId },
        });
    }

    // Assignment actions
    async assignToProject(memberId: string, assignmentData: any) {
        return this.prisma.projectAssignment.create({
            data: {
                ...assignmentData,
                memberId,
            },
        });
    }

    async removeAssignment(assignmentId: string) {
        return this.prisma.projectAssignment.delete({
            where: { id: assignmentId },
        });
    }
}
