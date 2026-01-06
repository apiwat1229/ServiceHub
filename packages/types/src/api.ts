// API Request/Response Types
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsDateString, IsEmail, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

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
    email?: string;
    username?: string;
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
export type UserRole =
    | 'admin'
    | 'md'
    | 'gm'
    | 'manager'
    | 'asst_mgr'
    | 'senior_sup'
    | 'supervisor'
    | 'senior_staff_2'
    | 'senior_staff_1'
    | 'staff_2'
    | 'staff_1'
    | 'op_leader'
    // Preserving existing roles for backward compatibility during migration
    | 'USER'
    | 'ADMIN';

export interface UserDto {
    id: string;
    email: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    department: string | null;
    position: string | null;
    role: UserRole;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    pinCode: string | null;
    hodId: string | null;
    avatar: string | null;
    createdAt: string;
    updatedAt: string;
}

export class CreateUserDto {
    @IsEmail()
    email!: string;

    @IsString()
    @IsNotEmpty()
    password!: string;

    @IsOptional()
    @IsString()
    username?: string;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    displayName?: string;

    @IsOptional()
    @IsString()
    department?: string;

    @IsOptional()
    @IsString()
    position?: string;

    @IsOptional()
    @IsString()
    role?: UserRole;

    @IsOptional()
    @IsString()
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

    @IsOptional()
    @IsString()
    employeeId?: string;

    @IsOptional()
    @IsString()
    pinCode?: string;

    @IsOptional()
    @IsString()
    hodId?: string;

    @IsOptional()
    @IsString()
    avatar?: string;

    @IsOptional()
    @IsString()
    roleId?: string;

    @IsOptional()
    @IsBoolean()
    forceChangePassword?: boolean;
}

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    username?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    password?: string;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    displayName?: string;

    @IsOptional()
    @IsString()
    department?: string;

    @IsOptional()
    @IsString()
    position?: string;

    @IsOptional()
    @IsString()
    role?: UserRole;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    pinCode?: string;

    @IsOptional()
    @IsString()
    employeeId?: string;

    @IsOptional()
    @IsString()
    hodId?: string;

    @IsOptional()
    @IsString()
    avatar?: string;

    @IsOptional()
    @IsBoolean()
    forceChangePassword?: boolean;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    lastLoginAt?: Date;

    @IsOptional()
    preferences?: any;

    @IsOptional()
    @IsString()
    roleId?: string;
}

export class CreateSupplierDto {
    @IsString()
    @IsNotEmpty()
    code!: string;

    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    taxId?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsNumber()
    provinceId?: number;

    @IsOptional()
    @IsNumber()
    districtId?: number;

    @IsOptional()
    @IsNumber()
    subdistrictId?: number;

    @IsOptional()
    @IsString()
    zipCode?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    avatar?: string;

    @IsOptional()
    @IsString()
    certificateNumber?: string;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    certificateExpire?: Date;

    @IsOptional()
    @IsNumber()
    score?: number;

    @IsOptional()
    @IsNumber()
    eudrQuotaUsed?: number;

    @IsOptional()
    @IsNumber()
    eudrQuotaCurrent?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    rubberTypeCodes?: string[];

    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateSupplierDto {
    @IsOptional()
    @IsString()
    code?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    taxId?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsNumber()
    provinceId?: number;

    @IsOptional()
    @IsNumber()
    districtId?: number;

    @IsOptional()
    @IsNumber()
    subdistrictId?: number;

    @IsOptional()
    @IsString()
    zipCode?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    avatar?: string;

    @IsOptional()
    @IsString()
    certificateNumber?: string;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    certificateExpire?: Date;

    @IsOptional()
    @IsNumber()
    score?: number;

    @IsOptional()
    @IsNumber()
    eudrQuotaUsed?: number;

    @IsOptional()
    @IsNumber()
    eudrQuotaCurrent?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    rubberTypeCodes?: string[];

    @IsOptional()
    @IsString()
    notes?: string;
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

// Role DTOs
export interface RoleDto {
    id: string;
    name: string;
    description: string | null;
    permissions: Record<string, any>;
    icon?: string;
    color?: string;
    usersCount?: number;
    isSystem?: boolean; // To protect system roles
    createdAt: string;
    updatedAt: string;
}

export class CreateRoleDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    permissions?: Record<string, any>;

    @IsOptional()
    @IsString()
    icon?: string;

    @IsOptional()
    @IsString()
    color?: string;
}

export class UpdateRoleDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    permissions?: Record<string, any>;

    @IsOptional()
    @IsString()
    icon?: string;

    @IsOptional()
    @IsString()
    color?: string;
}

// ==================== Notification DTOs ====================

export interface NotificationDto {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'REQUEST' | 'APPROVE';
    isRead: boolean;
    userId: string;
    createdAt: Date;
    readAt?: Date;
    actionUrl?: string;
}

export interface BroadcastDto {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'REQUEST' | 'APPROVE';
    senderId: string;
    recipientRoles?: string[];
    recipientUsers?: string[];
    recipientGroups?: string[];
    createdAt: Date;
}

export class CreateBroadcastDto {
    @IsString()
    @IsNotEmpty()
    title!: string;

    @IsString()
    @IsNotEmpty()
    message!: string;

    @IsOptional()
    @IsIn(['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'REQUEST', 'APPROVE'])
    type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'REQUEST' | 'APPROVE';

    @IsOptional()
    @IsArray()
    recipientRoles?: string[];

    @IsOptional()
    @IsArray()
    recipientUsers?: string[];

    @IsOptional()
    @IsArray()
    recipientGroups?: string[];

    @IsOptional()
    @IsString()
    actionUrl?: string;
}

export interface NotificationGroupDto {
    id: string;
    name: string;
    description?: string;
    memberIds: string[];
    icon?: string;
    color?: string;
    createdAt: Date;
    updatedAt: Date;
}

export class CreateNotificationGroupDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray()
    memberIds?: string[];

    @IsOptional()
    @IsString()
    icon?: string;

    @IsOptional()
    @IsString()
    color?: string;
}

export interface NotificationSettingDto {
    id: string;
    sourceApp: string;
    actionType: string;
    isActive: boolean;
    recipientRoles?: string[];
    recipientGroups?: string[];
    recipientUsers?: string[];
    channels: string[];
}

// ==================== Printer Usage DTOs ====================

export interface PrinterDepartmentDto {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export class CreatePrinterDepartmentDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdatePrinterDepartmentDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export interface PrinterUserMappingDto {
    id: string;
    userName: string;
    departmentId: string;
    department?: PrinterDepartmentDto;
    createdAt: Date;
    updatedAt: Date;
}

export class UpsertPrinterUserMappingDto {
    @IsString()
    @IsNotEmpty()
    userName!: string;

    @IsString()
    @IsNotEmpty()
    departmentId!: string;
}


export class SavePrinterUsageRecordDto {
    @IsDate()
    @Type(() => Date)
    period!: Date;

    @IsString()
    @IsNotEmpty()
    userName!: string;

    @IsString()
    @IsOptional()
    serialNo?: string;

    @IsNumber()
    printBW!: number;

    @IsNumber()
    printColor!: number;

    @IsNumber()
    copyBW!: number;

    @IsNumber()
    copyColor!: number;

    @IsNumber()
    total!: number;
}

// ==================== IT Asset DTOs ====================

export class CreateITAssetDto {
    @IsString()
    @IsNotEmpty()
    code!: string;

    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsNotEmpty()
    category!: string;

    @IsNumber()
    stock!: number;

    @IsNumber()
    @IsOptional()
    minStock?: number;

    @IsString()
    @IsOptional()
    location?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    image?: string;

    @IsNumber()
    @IsOptional()
    price?: number;

    @IsDateString()
    @IsOptional()
    // @Type(() => Date) - Removing Type transformer to keep it as string for validation, or let backend define it. 
    // Actually, if we use IsDateString, we can keep it as string in DTO or use Type to convert.
    // Ideally for API DTO: Input is string (JSON). 
    receivedDate?: Date | string;

    @IsString()
    @IsOptional()
    receiver?: string;

    @IsString()
    @IsOptional()
    serialNumber?: string;

    @IsString()
    @IsOptional()
    barcode?: string;
}

export class UpdateITAssetDto {
    @IsOptional()
    @IsString()
    code?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    serialNumber?: string;

    @IsOptional()
    @IsString()
    barcode?: string;

    @IsOptional()
    @IsNumber()
    stock?: number;

    @IsOptional()
    @IsNumber()
    minStock?: number;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    image?: string;

    @IsOptional()
    @IsNumber()
    price?: number;

    @IsOptional()
    @IsDateString()
    receivedDate?: Date | string;

    @IsOptional()
    @IsString()
    receiver?: string;
}
