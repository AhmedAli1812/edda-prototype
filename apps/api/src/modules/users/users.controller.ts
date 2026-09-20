import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('المستخدمين والملفات الشخصية (Users)')
@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'استرجاع بيانات الحساب الحالي والملف الشخصي بدون تسريب بيانات حساسة' })
  async getMe(@CurrentUser('id') userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        technicianProfile: true,
        storeProfile: { include: { branches: true } },
        addresses: true,
        wallet: true,
      },
    });

    if (!user) {
      return { user: null };
    }

    // Sanitize user profile: remove passwordHash and encrypt/hash internals
    const { passwordHash, ...sanitizedUser } = user;

    let sanitizedTechnician = null;
    if (user.technicianProfile) {
      const {
        nationalIdEncrypted,
        nationalIdFingerprint,
        nationalIdKeyVersion,
        ...restTech
      } = user.technicianProfile;

      sanitizedTechnician = {
        ...restTech,
        isNationalIdVerified: !!nationalIdFingerprint,
      };
    }

    return {
      user: {
        ...sanitizedUser,
        technicianProfile: sanitizedTechnician,
      },
    };
  }
}
