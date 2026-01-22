import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { ProjectService } from './project.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('projects')
@UseGuards(AuthGuard('jwt'))
export class ProjectController {
    constructor(private readonly projectService: ProjectService) { }

    @Get()
    findAll() {
        return this.projectService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.projectService.findOne(id);
    }

    @Post()
    create(@Body() data: any) {
        return this.projectService.create(data);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: any) {
        return this.projectService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.projectService.remove(id);
    }
}
