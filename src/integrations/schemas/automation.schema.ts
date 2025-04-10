import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum AutomationTrigger {
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_COMPLETED = 'task.completed',
  DUE_DATE_APPROACHING = 'due_date.approaching',
  COMMENT_ADDED = 'comment.added',
  TASK_ASSIGNED = 'task.assigned',
}

export enum AutomationAction {
  UPDATE_TASK = 'update_task',
  CREATE_TASK = 'create_task',
  SEND_EMAIL = 'send_email',
  SEND_NOTIFICATION = 'send_notification',
  ASSIGN_TASK = 'assign_task',
  SET_PRIORITY = 'set_priority',
}

@Schema({ timestamps: true })
export class Automation {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: AutomationTrigger })
  trigger: AutomationTrigger;

  @Prop({ type: Object, required: true })
  conditions: {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
    value: any;
  }[];

  @Prop({ type: [{
    type: {
      type: String,
      enum: AutomationAction,
      required: true
    },
    params: {
      type: Object,
      required: true
    }
  }], required: true })
  actions: {
    type: AutomationAction;
    params: Record<string, any>;
  }[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Number, default: 0 })
  executionCount: number;

  @Prop({ type: Date })
  lastExecution: Date;
}

export type AutomationDocument = Automation & Document;
export const AutomationSchema = SchemaFactory.createForClass(Automation);
