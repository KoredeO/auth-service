import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import * as qrcode from 'qrcode';

@Injectable()
export class TwoFactorService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async generateSecret(userId: string): Promise<{ secret: string; otpAuthUrl: string; qrCode: string }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(user.email, 'TodoApp', secret);
    
    // Generate QR code
    const qrCode = await qrcode.toDataURL(otpAuthUrl);
    
    // Save the secret to the user
    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: {
          twoFactorSecret: secret,
          twoFactorEnabled: false,
        },
      },
    );

    return {
      secret,
      otpAuthUrl,
      qrCode,
    };
  }

  async verifyCode(userId: string, code: string): Promise<boolean> {
    const user = await this.userModel.findById(userId);
    
    if (!user?.twoFactorSecret) {
      return false;
    }

    return authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });
  }

  async enableTwoFactor(userId: string, code: string): Promise<boolean> {
    const isValid = await this.verifyCode(userId, code);
    
    if (isValid) {
      await this.userModel.updateOne(
        { _id: userId },
        { $set: { twoFactorEnabled: true } },
      );
      return true;
    }
    
    return false;
  }

  async disableTwoFactor(userId: string, code: string): Promise<boolean> {
    const isValid = await this.verifyCode(userId, code);
    
    if (isValid) {
      await this.userModel.updateOne(
        { _id: userId },
        {
          $set: { twoFactorEnabled: false },
          $unset: { twoFactorSecret: 1 },
        },
      );
      return true;
    }
    
    return false;
  }

  async generateBackupCodes(userId: string): Promise<string[]> {
    const codes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substr(2, 8).toUpperCase(),
    );

    await this.userModel.updateOne(
      { _id: userId },
      { $set: { backupCodes: codes } },
    );

    return codes;
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const user = await this.userModel.findById(userId);
    
    if (!user?.backupCodes?.includes(code)) {
      return false;
    }

    // Remove the used backup code
    await this.userModel.updateOne(
      { _id: userId },
      { $pull: { backupCodes: code } },
    );

    return true;
  }
}
