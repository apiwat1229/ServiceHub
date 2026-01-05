import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { KnowledgeBooksController } from './knowledge-books.controller';
import { KnowledgeBooksService } from './knowledge-books.service';

@Module({
    imports: [PrismaModule],
    controllers: [KnowledgeBooksController],
    providers: [KnowledgeBooksService],
    exports: [KnowledgeBooksService],
})
export class KnowledgeBooksModule { }
