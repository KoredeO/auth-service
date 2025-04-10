import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ default: TaskStatus.TODO })
  status: TaskStatus;

  @Prop({ default: Priority.MEDIUM })
  priority: Priority;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Date })
  dueDate: Date;

  @Prop({ type: Number })
  estimatedTime: number; // in minutes

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  assignees: Types.ObjectId[];

  @Prop({ type: Boolean, default: false })
  isRecurring: boolean;

  @Prop()
  recurrencePattern: string; // CRON expression

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Task' }] })
  subtasks: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Task' })
  parentTask: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Task' }] })
  dependencies: Types.ObjectId[];

  @Prop({ type: Number, default: 0 })
  delete_flag: number;
}

export type TaskDocument = Task & Document;
export const TaskSchema = SchemaFactory.createForClass(Task);
