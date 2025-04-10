import { IsString, IsOptional, IsEnum, IsDate, IsNumber, IsBoolean, IsArray, IsMongoId } from 'class-validator';
import { Priority, TaskStatus } from '../schemas/task.schema';
import { Types } from 'mongoose';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsDate()
  @IsOptional()
  dueDate?: Date;

  @IsNumber()
  @IsOptional()
  estimatedTime?: number;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  assignees?: Types.ObjectId[];

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @IsString()
  @IsOptional()
  recurrencePattern?: string;

  @IsMongoId()
  @IsOptional()
  parentTask?: Types.ObjectId;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  dependencies?: Types.ObjectId[];
}



export class UpdateTaskDto {
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
  @IsString()
  @IsOptional()
  title?  : string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsDate()
  @IsOptional()
  dueDate?: Date;

  @IsNumber()
  @IsOptional()
  estimatedTime?: number;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  assignees?: Types.ObjectId[];

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @IsString()
  @IsOptional()
  recurrencePattern?: string;

  @IsMongoId()
  @IsOptional()
  parentTask?: Types.ObjectId;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  dependencies?: Types.ObjectId[];
}

export class TaskFilterDto {
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsDate()
  @IsOptional()
  dueDateStart?: Date;

  @IsDate()
  @IsOptional()
  dueDateEnd?: Date;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;
}

export class CreateSubtaskDto {
  @IsString()
  title: string;

  @IsOptional() // Optional description
  @IsString()
  description?: string;

  // @IsEnum(TaskStatus)
  // status: TaskStatus;

  // @IsEnum(Priority)
  // priority: Priority;
}