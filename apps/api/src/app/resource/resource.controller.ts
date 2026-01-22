import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ResourceService } from './resource.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('resources')
@UseGuards(JwtAuthGuard)
export class ResourceController {
    constructor(private readonly resourceService: ResourceService) { }

    @Get()
    async findAll() {
        return this.resourceService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.resourceService.findOne(id);
    }

    @Post()
    async create(@Body() data: any) {
        return this.resourceService.create(data);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() data: any) {
        return this.resourceService.update(id, data);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.resourceService.remove(id);
    }

    // Member Management
    @Post(':id/members')
    async addMember(@Param('id') resourceId: string, @Body() data: any) {
        return this.resourceService.addMember(resourceId, data);
    }

    @Put('members/:memberId')
    async updateMember(@Param('memberId') memberId: string, @Body() data: any) {
        return this.resourceService.updateMember(memberId, data);
    }

    @Delete('members/:memberId')
    async deleteMember(@Param('memberId') memberId: string) {
        return this.resourceService.deleteMember(memberId);
    }

    // Assignment Management
    @Post('members/:memberId/assignments')
    async assignToProject(@Param('memberId') memberId: string, @Body() data: any) {
        return this.resourceService.assignToProject(memberId, data);
    }

    @Delete('assignments/:assignmentId')
    async removeAssignment(@Param('assignmentId') assignmentId: string) {
        return this.resourceService.removeAssignment(assignmentId);
    }
}
