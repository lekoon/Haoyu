import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Query,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
    constructor(private readonly taskService: TaskService) { }

    @Get()
    async findAll(@Query('projectId') projectId: string) {
        return this.taskService.findAll(projectId);
    }

    @Get('tree')
    async getTree(@Query('projectId') projectId: string) {
        return this.taskService.getTaskTree(projectId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.taskService.findOne(id);
    }

    @Post()
    async create(@Body() data: any) {
        return this.taskService.create(data);
    }

    @Post('sync/:projectId')
    async syncTree(@Param('projectId') projectId: string, @Body() tasks: any[]) {
        return this.taskService.syncTaskTree(projectId, tasks);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() data: any) {
        return this.taskService.update(id, data);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.taskService.remove(id);
    }
}
