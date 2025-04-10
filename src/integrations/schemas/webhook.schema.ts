import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum WebhookEvent {
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_DELETED = 'task.deleted',
  COMMENT_CREATED = 'comment.created',
  TASK_ASSIGNED = 'task.assigned',
  TASK_COMPLETED = 'task.completed',
}

@Schema({ timestamps: true })
export class Webhook {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  secret: string;

  @Prop({ type: [String], enum: WebhookEvent, required: true })
  events: WebhookEvent[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object })
  headers: Record<string, string>;

  @Prop({ default: 0 })
  failureCount: number;

  @Prop({ type: Date })
  lastFailure: Date;

  @Prop({ type: Date })
  lastSuccess: Date;
}

export type WebhookDocument = Webhook & Document;
export const WebhookSchema = SchemaFactory.createForClass(Webhook);
