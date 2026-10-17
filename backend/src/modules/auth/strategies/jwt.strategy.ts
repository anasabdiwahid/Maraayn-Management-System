import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../../schemas/user.schema.js';
import { UserStatus } from '../../../common/constants/roles.enum.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'maraayn-super-secret-jwt-key-2026',
    });
  }

  async validate(payload: any) {
    const user = await this.userModel.findById(payload.sub).select('-passwordHash').exec();
    if (!user) {
      throw new UnauthorizedException('User account no longer exists');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Your user account has been deactivated');
    }
    return user;
  }
}

