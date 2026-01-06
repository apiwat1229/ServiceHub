import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { KnowledgeBook } from '@prisma/client';
import * as fs from 'fs/promises';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateBookDto {
    title: string;
    description?: string;
    category: string;
    fileType: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    coverImage?: string;
    author?: string;
    tags?: string[];
    uploadedBy: string;
    trainingDate?: Date;
    attendees?: number;
}

export interface UpdateBookDto {
    title?: string;
    description?: string;
    category?: string;
    author?: string;
    tags?: string[];
    isPublished?: boolean;
    trainingDate?: Date;
    attendees?: number;
}

export interface BookFilters {
    category?: string;
    search?: string;
    tags?: string[];
    uploadedBy?: string;
    isPublished?: boolean;
}

@Injectable()
export class KnowledgeBooksService {
    private readonly logger = new Logger(KnowledgeBooksService.name);

    constructor(private prisma: PrismaService) { }

    async create(data: CreateBookDto): Promise<KnowledgeBook> {

        return this.prisma.knowledgeBook.create({
            data: {
                title: data.title,
                description: data.description,
                category: data.category,
                fileType: data.fileType,
                fileName: data.fileName,
                filePath: data.filePath,
                fileSize: data.fileSize,
                coverImage: data.coverImage,
                author: data.author,
                tags: data.tags || [],
                uploadedBy: data.uploadedBy,
                trainingDate: data.trainingDate,
                attendees: data.attendees,
            },
            include: {
                uploader: {
                    select: {
                        id: true,
                        displayName: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    async findAll(filters?: BookFilters) {
        const where: any = {};

        if (filters?.category) {
            where.category = filters.category;
        }

        if (filters?.uploadedBy) {
            where.uploadedBy = filters.uploadedBy;
        }

        if (filters?.isPublished !== undefined) {
            where.isPublished = filters.isPublished;
        }

        if (filters?.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
                { author: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        if (filters?.tags && filters.tags.length > 0) {
            where.tags = { hasSome: filters.tags };
        }

        return this.prisma.knowledgeBook.findMany({
            where,
            include: {
                uploader: {
                    select: {
                        id: true,
                        displayName: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                _count: {
                    select: {
                        viewHistory: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async findOne(id: string) {
        const book = await this.prisma.knowledgeBook.findUnique({
            where: { id },
            include: {
                uploader: {
                    select: {
                        id: true,
                        displayName: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                _count: {
                    select: {
                        viewHistory: true,
                    },
                },
            },
        });

        if (!book) {
            throw new NotFoundException(`Book with ID ${id} not found`);
        }

        return book;
    }

    async update(id: string, data: UpdateBookDto) {
        await this.findOne(id); // Check if exists

        return this.prisma.knowledgeBook.update({
            where: { id },
            data,
            include: {
                uploader: {
                    select: {
                        id: true,
                        displayName: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    async remove(id: string) {
        const book = await this.findOne(id);

        // Delete file from storage
        try {
            if (book.filePath) {
                try {
                    await fs.unlink(book.filePath);
                } catch (e) { /* ignore */ }
            }
            if (book.coverImage) {
                try {
                    await fs.unlink(book.coverImage);
                } catch (e) { /* ignore */ }
            }
        } catch (error) {
            console.error('Error deleting files:', error);
        }

        return this.prisma.knowledgeBook.delete({
            where: { id },
        });
    }

    async trackView(bookId: string, userId: string) {
        // Create view record
        await this.prisma.bookView.create({
            data: {
                bookId,
                userId,
            },
        });

        // Increment view count
        await this.prisma.knowledgeBook.update({
            where: { id: bookId },
            data: {
                views: {
                    increment: 1,
                },
            },
        });
    }

    async incrementDownload(id: string) {
        return this.prisma.knowledgeBook.update({
            where: { id },
            data: {
                downloads: {
                    increment: 1,
                },
            },
        });
    }

    async getCategories() {
        const books = await this.prisma.knowledgeBook.findMany({
            where: { isPublished: true },
            select: { category: true },
            distinct: ['category'],
        });

        return books.map((b) => b.category);
    }

    async getStats() {
        const [total, byCategory, topViewed] = await Promise.all([
            this.prisma.knowledgeBook.count({ where: { isPublished: true } }),
            this.prisma.knowledgeBook.groupBy({
                by: ['category'],
                where: { isPublished: true },
                _count: true,
            }),
            this.prisma.knowledgeBook.findMany({
                where: { isPublished: true },
                orderBy: { views: 'desc' },
                take: 10,
                select: {
                    id: true,
                    title: true,
                    views: true,
                    downloads: true,
                },
            }),
        ]);

        return {
            total,
            byCategory,
            topViewed,
        };
    }
}
