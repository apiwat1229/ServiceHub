// API Request/Response Types

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// Auth DTOs
export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    email: string;
    password: string;
    username?: string;
    firstName?: string;
    lastName?: string;
}

export interface AuthResponse {
    accessToken: string;
    user: UserDto;
}

// User DTOs
export interface UserDto {
    id: string;
    email: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    department: string | null;
    position: string | null;
    role: 'USER' | 'ADMIN';
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    pinCode: string | null;
    hodId: string | null;
    avatar: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateUserDto {
    email: string;
    password: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    department?: string;
    position?: string;
    role?: 'USER' | 'ADMIN';
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    pinCode?: string;
    hodId?: string;
    avatar?: string;
}

export class UpdateUserDto {
    username?: string;
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    department?: string;
    position?: string;
    role?: string;
    status?: string;
    pinCode?: string;
    hodId?: string;
    avatar?: string;
}

export class CreateSupplierDto {
    code!: string;
    name!: string;
    taxId?: string;
    address?: string;
    phone?: string;
    email?: string;
    status?: string;
}

export class UpdateSupplierDto {
    code?: string;
    name?: string;
    taxId?: string;
    address?: string;
    phone?: string;
    email?: string;
    status?: string;
}

// Post DTOs
export interface PostDto {
    id: string;
    title: string;
    content: string | null;
    published: boolean;
    authorId: string;
    author?: UserDto;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePostDto {
    title: string;
    content?: string;
    published?: boolean;
    authorId?: string; // Optional if inferred from auth
}

export interface UpdatePostDto {
    title?: string;
    content?: string;
    published?: boolean;
}
