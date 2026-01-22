import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';

import { PrismaModule } from '../prisma/prisma.module';
import { PmoModule } from '../pmo/pmo.module';

@Module({
    imports: [PrismaModule, PmoModule],
    providers: [ProjectService],
    controllers: [ProjectController],
})
export class ProjectModule { }
