import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateITTicketDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNotEmpty()
    @IsString()
    category: string;

    @IsOptional()
    @IsString()
    priority?: string;

    @IsOptional()
    @IsString()
    location?: string;
}

export class UpdateITTicketDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    priority?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    @IsOptional()
    @IsString()
    assigneeId?: string;
}

export class CreateTicketCommentDto {
    @IsNotEmpty()
    @IsString()
    content: string;
}
