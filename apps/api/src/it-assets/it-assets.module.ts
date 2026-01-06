import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ITAssetsController } from './it-assets.controller';
import { ITAssetsService } from './it-assets.service';

@Module({
    imports: [PrismaModule],
    controllers: [ITAssetsController],
    providers: [ITAssetsService],
})
export class ITAssetsModule { }
