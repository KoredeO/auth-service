import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: function() {
    return this.provider === 'local';
  }})
  password?: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  picture?: string;

  @Prop({ default: 'local' })
  provider: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  verificationToken?: string;

  @Prop()
  verificationTokenExpires?: Date;

  @Prop()
  twoFactorSecret?: string;

  @Prop({ default: false })
  twoFactorEnabled: boolean;

  @Prop([String])
  backupCodes?: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
