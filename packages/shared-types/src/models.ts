import {
  UserRole,
  UserStatus,
  KycStatus,
  ServiceRequestStatus,
  OfferStatus,
  JobStatus,
  PaymentStatus,
  PaymentMethodType,
  ChangeOrderStatus,
  ChangeOrderType,
  DisputeStatus,
  StoreOrderStatus,
  PickupType,
  TransactionType,
  TransactionDirection,
  SettlementStatus,
  RiskLevel,
  AntiCircumventionAction,
  DocumentType,
} from './enums';

export interface UserDto {
  id: string;
  phone: string;
  email?: string | null;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  rewardPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddressDto {
  id: string;
  userId: string;
  title: string;
  governorate: string;
  city: string;
  district: string;
  street: string;
  building?: string | null;
  floor?: string | null;
  apartment?: string | null;
  landmark?: string | null;
  latitude: number;
  longitude: number;
  maskedAddress: string;
  isDefault: boolean;
}

export interface TechnicianProfileDto {
  id: string;
  userId: string;
  nationalIdNumber?: string | null;
  bio?: string | null;
  categories: string[];
  kycStatus: KycStatus;
  isOnline: boolean;
  serviceRadiusKm: number;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  rating: number;
  totalCompletedJobs: number;
  acceptanceRate: number;
}

export interface StoreProfileDto {
  id: string;
  userId: string;
  storeName: string;
  commercialRegNumber?: string | null;
  taxNumber?: string | null;
  kycStatus: KycStatus;
  commissionRatePercent: number;
  rating: number;
  contactPhone: string;
}

export interface ServiceCategoryDto {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  iconName: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ProductDto {
  id: string;
  storeId?: string | null;
  categoryId: string;
  titleAr: string;
  titleEn?: string | null;
  descriptionAr: string;
  sku: string;
  priceMinorUnits: number; // Stored in Egyptian Piasters (e.g. 10000 = 100.00 EGP)
  compareAtPriceMinorUnits?: number | null;
  stockQuantity: number;
  isPlatformOwned: boolean;
  isActive: boolean;
}

export interface ServiceRequestDto {
  id: string;
  customerId: string;
  categoryId: string;
  addressId: string;
  title: string;
  description: string;
  preferredTimeType: 'ASAP' | 'SCHEDULED';
  scheduledAt?: Date | null;
  expectedBudgetMinMinorUnits?: number | null;
  expectedBudgetMaxMinorUnits?: number | null;
  status: ServiceRequestStatus;
  latitude: number;
  longitude: number;
  maskedDistrict: string;
  createdAt: Date;
}

export interface OfferDto {
  id: string;
  serviceRequestId: string;
  technicianId: string;
  priceMinorUnits: number; // Egyptian Piasters
  estimatedArrivalMinutes: number;
  warrantyDurationDays: number;
  notes?: string | null;
  status: OfferStatus;
  createdAt: Date;
}

export interface JobDto {
  id: string;
  serviceRequestId: string;
  customerId: string;
  technicianId: string;
  offerId: string;
  status: JobStatus;
  arrivalOtpHash?: string | null;
  arrivalOtpVerifiedAt?: Date | null;
  completionOtpHash?: string | null;
  completionOtpVerifiedAt?: Date | null;
  disputeWindowEndsAt?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  invoiceNumber?: string | null;
}

export interface PaymentDto {
  id: string;
  customerId: string;
  jobId?: string | null;
  orderId?: string | null;
  gatewayProvider: string;
  gatewayTransactionId?: string | null;
  idempotencyKey: string;
  amountMinorUnits: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethodType;
  authorizedAt?: Date | null;
  capturedAt?: Date | null;
}

export interface ChangeOrderDto {
  id: string;
  jobId: string;
  technicianId: string;
  type: ChangeOrderType;
  title: string;
  description: string;
  laborAmountMinorUnits: number;
  sparePartAmountMinorUnits: number;
  totalAmountMinorUnits: number;
  sparePartProductId?: string | null;
  sparePartStoreId?: string | null;
  storePickupQrCode?: string | null;
  status: ChangeOrderStatus;
  paymentId?: string | null;
}

export interface DisputeDto {
  id: string;
  jobId: string;
  raisedByUserId: string;
  reasonCategory: string;
  description: string;
  status: DisputeStatus;
  refundAmountMinorUnits?: number | null;
  adminNotes?: string | null;
}

export interface WalletDto {
  id: string;
  userId: string;
  availableBalanceMinorUnits: number;
  pendingBalanceMinorUnits: number;
  currency: string;
  isLocked: boolean;
}

export interface TransactionDto {
  id: string;
  walletId: string;
  type: TransactionType;
  direction: TransactionDirection;
  amountMinorUnits: number;
  balanceAfterMinorUnits: number;
  referenceType: string;
  referenceId: string;
  description: string;
  createdAt: Date;
}
