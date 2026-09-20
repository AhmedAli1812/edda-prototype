import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, Min, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentMethodType } from '@prisma/client';

export class AuthorizeServicePaymentDto {
  @ApiProperty({ description: 'ID of the job being booked' })
  @IsNotEmpty()
  @IsString()
  jobId: string;

  @ApiProperty({ example: 'IDEMP-JOB-2048-001', description: 'Unique idempotency key' })
  @IsNotEmpty()
  @IsString()
  idempotencyKey: string;

  @ApiProperty({ example: 35000, description: 'Amount in Egyptian Piasters (integer minor units)' })
  @IsInt()
  @Min(100)
  amountMinorUnits: number;

  @ApiProperty({ enum: PaymentMethodType, default: PaymentMethodType.CARD })
  @IsEnum(PaymentMethodType)
  paymentMethod: PaymentMethodType = PaymentMethodType.CARD;
}

export class ProcessRefundDto {
  @ApiProperty({ description: 'Payment ID to refund' })
  @IsNotEmpty()
  @IsString()
  paymentId: string;

  @ApiProperty({ example: 35000, description: 'Amount in Egyptian Piasters to refund' })
  @IsInt()
  @Min(1)
  amountMinorUnits: number;

  @ApiProperty({ example: 'Dispute resolved in favor of customer' })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiProperty({ example: 'REFUND-IDEMP-001' })
  @IsNotEmpty()
  @IsString()
  idempotencyKey: string;
}
