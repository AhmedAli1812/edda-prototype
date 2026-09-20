import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { AuthorizeServicePaymentDto, ProcessRefundDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('المدفوعات الآمنة (SafePay)')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('authorize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'حجز ودفع قيمة الخدمة بنظام SafePay (تفويض الدفع)' })
  @ApiResponse({ status: 200, description: 'تم تفويض الحجز بنجاح' })
  async authorizePayment(
    @CurrentUser('id') customerId: string,
    @Body() dto: AuthorizeServicePaymentDto,
  ) {
    return this.paymentsService.authorizeJobPayment(customerId, dto);
  }

  @Post('refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'معالجة استرداد مالي للعميل (خاص بالإدارة والنزاعات)' })
  async processRefund(@Body() dto: ProcessRefundDto) {
    return this.paymentsService.processRefund(dto);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'استقبال أحداث بوابة الدفع ومعالجتها بضمان عدم التكرار' })
  async handleWebhook(@Body() body: any, @Headers() headers: Record<string, any>) {
    return this.paymentsService.handleWebhook(body, headers);
  }
}
