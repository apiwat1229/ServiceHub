// Domain Models (matching Prisma schema)

export enum Role {
    USER = 'staff_1',
    ADMIN = 'admin',
}

export interface User {
    id: string;
    email: string;
    name: string | null;
    password: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
}

export interface Post {
    id: string;
    title: string;
    content: string | null;
    published: boolean;
    authorId: string;
    createdAt: Date;
    updatedAt: Date;
}
