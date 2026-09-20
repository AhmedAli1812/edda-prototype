-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `role` ENUM('CUSTOMER', 'TECHNICIAN', 'STORE_PARTNER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    `status` ENUM('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION') NOT NULL DEFAULT 'ACTIVE',
    `rewardPoints` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_phone_key`(`phone`),
    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_phone_idx`(`phone`),
    INDEX `User_role_status_idx`(`role`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RefreshToken` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `familyId` VARCHAR(191) NOT NULL,
    `verifierHash` VARCHAR(191) NOT NULL,
    `isRevoked` BOOLEAN NOT NULL DEFAULT false,
    `revokedAt` DATETIME(3) NULL,
    `replacedByTokenId` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RefreshToken_userId_idx`(`userId`),
    INDEX `RefreshToken_familyId_idx`(`familyId`),
    INDEX `RefreshToken_isRevoked_idx`(`isRevoked`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeviceToken` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DeviceToken_token_key`(`token`),
    INDEX `DeviceToken_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OtpCode` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `codeHash` VARCHAR(191) NOT NULL,
    `purpose` ENUM('REGISTRATION', 'LOGIN', 'ARRIVAL_VERIFICATION', 'COMPLETION_VERIFICATION', 'STORE_PICKUP') NOT NULL,
    `deliveryStatus` ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `providerMessageId` VARCHAR(191) NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `maxAttempts` INTEGER NOT NULL DEFAULT 5,
    `expiresAt` DATETIME(3) NOT NULL,
    `consumedAt` DATETIME(3) NULL,
    `ipHash` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OtpCode_phone_purpose_consumedAt_idx`(`phone`, `purpose`, `consumedAt`),
    INDEX `OtpCode_createdAt_idx`(`createdAt`),
    INDEX `OtpCode_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OtpRateLimit` (
    `phone` VARCHAR(191) NOT NULL,
    `lastSentAt` DATETIME(3) NOT NULL,
    `hourlyCount` INTEGER NOT NULL DEFAULT 1,
    `windowStart` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ipHash` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `OtpRateLimit_lastSentAt_idx`(`lastSentAt`),
    PRIMARY KEY (`phone`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OnboardingToken` (
    `id` VARCHAR(191) NOT NULL,
    `jti` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `consumedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `OnboardingToken_jti_key`(`jti`),
    INDEX `OnboardingToken_phone_consumedAt_idx`(`phone`, `consumedAt`),
    INDEX `OnboardingToken_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Address` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `governorate` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `district` VARCHAR(191) NOT NULL,
    `street` VARCHAR(191) NOT NULL,
    `building` VARCHAR(191) NULL,
    `floor` VARCHAR(191) NULL,
    `apartment` VARCHAR(191) NULL,
    `landmark` VARCHAR(191) NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `maskedAddress` VARCHAR(191) NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Address_userId_idx`(`userId`),
    INDEX `Address_latitude_longitude_idx`(`latitude`, `longitude`),
    INDEX `Address_governorate_city_idx`(`governorate`, `city`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TechnicianProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `nationalIdEncrypted` TEXT NULL,
    `nationalIdFingerprint` VARCHAR(191) NULL,
    `nationalIdKeyVersion` INTEGER NOT NULL DEFAULT 1,
    `bio` TEXT NULL,
    `categories` JSON NULL,
    `kycStatus` ENUM('NOT_SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'NOT_SUBMITTED',
    `isOnline` BOOLEAN NOT NULL DEFAULT false,
    `serviceRadiusKm` INTEGER NOT NULL DEFAULT 15,
    `currentLatitude` DOUBLE NULL,
    `currentLongitude` DOUBLE NULL,
    `rating` DOUBLE NOT NULL DEFAULT 5.0,
    `totalCompletedJobs` INTEGER NOT NULL DEFAULT 0,
    `acceptanceRate` DOUBLE NOT NULL DEFAULT 100.0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TechnicianProfile_userId_key`(`userId`),
    UNIQUE INDEX `TechnicianProfile_nationalIdFingerprint_key`(`nationalIdFingerprint`),
    INDEX `TechnicianProfile_isOnline_idx`(`isOnline`),
    INDEX `TechnicianProfile_currentLatitude_currentLongitude_idx`(`currentLatitude`, `currentLongitude`),
    INDEX `TechnicianProfile_rating_idx`(`rating`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StoreProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `storeName` VARCHAR(191) NOT NULL,
    `commercialRegNumber` VARCHAR(191) NULL,
    `taxNumber` VARCHAR(191) NULL,
    `kycStatus` ENUM('NOT_SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'NOT_SUBMITTED',
    `commissionRatePercent` DOUBLE NOT NULL DEFAULT 8.0,
    `rating` DOUBLE NOT NULL DEFAULT 5.0,
    `contactPhone` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StoreProfile_userId_key`(`userId`),
    UNIQUE INDEX `StoreProfile_commercialRegNumber_key`(`commercialRegNumber`),
    UNIQUE INDEX `StoreProfile_taxNumber_key`(`taxNumber`),
    INDEX `StoreProfile_rating_idx`(`rating`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StoreBranch` (
    `id` VARCHAR(191) NOT NULL,
    `storeId` VARCHAR(191) NOT NULL,
    `branchName` VARCHAR(191) NOT NULL,
    `governorate` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `district` VARCHAR(191) NOT NULL,
    `addressDetails` TEXT NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `contactPhone` VARCHAR(191) NULL,
    `isPickupAvailable` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StoreBranch_storeId_idx`(`storeId`),
    INDEX `StoreBranch_latitude_longitude_idx`(`latitude`, `longitude`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerificationDocument` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('NATIONAL_ID_FRONT', 'NATIONAL_ID_BACK', 'CRIMINAL_RECORD', 'COMMERCIAL_REGISTER', 'TAX_CARD', 'PROFESSIONAL_LICENSE', 'DISPUTE_EVIDENCE', 'SERVICE_PHOTO', 'PRODUCT_IMAGE') NOT NULL,
    `documentUrl` TEXT NOT NULL,
    `status` ENUM('NOT_SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING_REVIEW',
    `reviewerNotes` TEXT NULL,
    `verifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VerificationDocument_userId_type_idx`(`userId`, `type`),
    INDEX `VerificationDocument_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceCategory` (
    `id` VARCHAR(191) NOT NULL,
    `nameAr` VARCHAR(191) NOT NULL,
    `nameEn` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `iconName` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ServiceCategory_slug_key`(`slug`),
    INDEX `ServiceCategory_slug_idx`(`slug`),
    INDEX `ServiceCategory_isActive_sortOrder_idx`(`isActive`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `storeId` VARCHAR(191) NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `titleAr` VARCHAR(191) NOT NULL,
    `titleEn` VARCHAR(191) NULL,
    `descriptionAr` TEXT NOT NULL,
    `descriptionEn` TEXT NULL,
    `sku` VARCHAR(191) NOT NULL,
    `priceMinorUnits` INTEGER NOT NULL,
    `compareAtPriceMinorUnits` INTEGER NULL,
    `costPriceMinorUnits` INTEGER NULL,
    `stockQuantity` INTEGER NOT NULL DEFAULT 0,
    `isPlatformOwned` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Product_sku_key`(`sku`),
    INDEX `Product_sku_idx`(`sku`),
    INDEX `Product_storeId_idx`(`storeId`),
    INDEX `Product_categoryId_idx`(`categoryId`),
    INDEX `Product_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductImage` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `imageUrl` TEXT NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProductImage_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventoryMovement` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `type` ENUM('STOCK_IN', 'ORDER_RESERVED', 'ORDER_DISPATCHED', 'CHANGE_ORDER_DISPATCHED', 'RETURN_RESTOCK', 'MANUAL_ADJUSTMENT') NOT NULL,
    `quantityChange` INTEGER NOT NULL,
    `quantityAfter` INTEGER NOT NULL,
    `referenceType` VARCHAR(191) NULL,
    `referenceId` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InventoryMovement_productId_idx`(`productId`),
    INDEX `InventoryMovement_referenceType_referenceId_idx`(`referenceType`, `referenceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceRequest` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `addressId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `preferredTimeType` VARCHAR(191) NOT NULL DEFAULT 'ASAP',
    `scheduledAt` DATETIME(3) NULL,
    `expectedBudgetMinMinorUnits` INTEGER NULL,
    `expectedBudgetMaxMinorUnits` INTEGER NULL,
    `status` ENUM('DRAFT', 'OPEN_FOR_BIDS', 'OFFER_ACCEPTED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'OPEN_FOR_BIDS',
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `maskedDistrict` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ServiceRequest_customerId_idx`(`customerId`),
    INDEX `ServiceRequest_categoryId_idx`(`categoryId`),
    INDEX `ServiceRequest_status_idx`(`status`),
    INDEX `ServiceRequest_latitude_longitude_idx`(`latitude`, `longitude`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceRequestMedia` (
    `id` VARCHAR(191) NOT NULL,
    `serviceRequestId` VARCHAR(191) NOT NULL,
    `mediaUrl` TEXT NOT NULL,
    `mediaType` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ServiceRequestMedia_serviceRequestId_idx`(`serviceRequestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Offer` (
    `id` VARCHAR(191) NOT NULL,
    `serviceRequestId` VARCHAR(191) NOT NULL,
    `technicianId` VARCHAR(191) NOT NULL,
    `priceMinorUnits` INTEGER NOT NULL,
    `estimatedArrivalMinutes` INTEGER NOT NULL,
    `warrantyDurationDays` INTEGER NOT NULL DEFAULT 30,
    `warrantyNotes` TEXT NULL,
    `notes` TEXT NULL,
    `status` ENUM('SUBMITTED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN') NOT NULL DEFAULT 'SUBMITTED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Offer_serviceRequestId_idx`(`serviceRequestId`),
    INDEX `Offer_technicianId_idx`(`technicianId`),
    INDEX `Offer_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Job` (
    `id` VARCHAR(191) NOT NULL,
    `serviceRequestId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `technicianId` VARCHAR(191) NOT NULL,
    `offerId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING_PAYMENT', 'CONFIRMED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'CHANGE_ORDER_PENDING', 'COMPLETED', 'DISPUTE_OPEN', 'DISPUTE_RESOLVED', 'SETTLED', 'CANCELLED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    `arrivalOtpHash` VARCHAR(191) NULL,
    `arrivalOtpVerifiedAt` DATETIME(3) NULL,
    `completionOtpHash` VARCHAR(191) NULL,
    `completionOtpVerifiedAt` DATETIME(3) NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `disputeWindowEndsAt` DATETIME(3) NULL,
    `invoiceNumber` VARCHAR(191) NULL,
    `warrantyUntil` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Job_serviceRequestId_key`(`serviceRequestId`),
    UNIQUE INDEX `Job_invoiceNumber_key`(`invoiceNumber`),
    INDEX `Job_customerId_idx`(`customerId`),
    INDEX `Job_technicianId_idx`(`technicianId`),
    INDEX `Job_status_idx`(`status`),
    INDEX `Job_disputeWindowEndsAt_idx`(`disputeWindowEndsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChangeOrder` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `technicianId` VARCHAR(191) NOT NULL,
    `type` ENUM('SPARE_PART', 'EXTRA_LABOR', 'BOTH') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `laborAmountMinorUnits` INTEGER NOT NULL DEFAULT 0,
    `sparePartAmountMinorUnits` INTEGER NOT NULL DEFAULT 0,
    `totalAmountMinorUnits` INTEGER NOT NULL,
    `sparePartProductId` VARCHAR(191) NULL,
    `sparePartStoreId` VARCHAR(191) NULL,
    `storePickupQrCode` VARCHAR(191) NULL,
    `status` ENUM('PROPOSED', 'APPROVED', 'DECLINED', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'PROPOSED',
    `paymentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ChangeOrder_jobId_idx`(`jobId`),
    INDEX `ChangeOrder_technicianId_idx`(`technicianId`),
    INDEX `ChangeOrder_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Dispute` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `raisedByUserId` VARCHAR(191) NOT NULL,
    `reasonCategory` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `evidenceUrls` JSON NULL,
    `status` ENUM('OPEN', 'UNDER_REVIEW', 'RESOLVED_REFUND_CUSTOMER', 'RESOLVED_PAY_TECHNICIAN', 'RESOLVED_SPLIT', 'DISMISSED') NOT NULL DEFAULT 'OPEN',
    `adminNotes` TEXT NULL,
    `resolutionDetails` TEXT NULL,
    `refundAmountMinorUnits` INTEGER NULL,
    `resolvedAt` DATETIME(3) NULL,
    `resolvedByUserId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Dispute_jobId_idx`(`jobId`),
    INDEX `Dispute_status_idx`(`status`),
    INDEX `Dispute_raisedByUserId_idx`(`raisedByUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Review` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `technicianId` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Review_technicianId_idx`(`technicianId`),
    INDEX `Review_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Invoice` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NULL,
    `storeOrderId` VARCHAR(191) NULL,
    `invoiceNumber` VARCHAR(191) NOT NULL,
    `subtotalMinorUnits` INTEGER NOT NULL,
    `taxMinorUnits` INTEGER NOT NULL DEFAULT 0,
    `discountMinorUnits` INTEGER NOT NULL DEFAULT 0,
    `totalMinorUnits` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'EGP',
    `pdfUrl` TEXT NULL,
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Invoice_invoiceNumber_key`(`invoiceNumber`),
    INDEX `Invoice_invoiceNumber_idx`(`invoiceNumber`),
    INDEX `Invoice_jobId_idx`(`jobId`),
    INDEX `Invoice_storeOrderId_idx`(`storeOrderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Warranty` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `durationDays` INTEGER NOT NULL DEFAULT 30,
    `validUntil` DATETIME(3) NOT NULL,
    `termsArabic` TEXT NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Warranty_jobId_idx`(`jobId`),
    INDEX `Warranty_validUntil_idx`(`validUntil`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cancellation` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `cancelledBy` VARCHAR(191) NOT NULL,
    `reason` TEXT NOT NULL,
    `feeChargedMinorUnits` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Cancellation_jobId_idx`(`jobId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cart` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Cart_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CartItem` (
    `id` VARCHAR(191) NOT NULL,
    `cartId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CartItem_cartId_productId_key`(`cartId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Coupon` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `discountPercent` DOUBLE NULL,
    `discountMinorUnits` INTEGER NULL,
    `minOrderMinorUnits` INTEGER NULL,
    `maxDiscountMinorUnits` INTEGER NULL,
    `usageLimit` INTEGER NULL,
    `usageCount` INTEGER NOT NULL DEFAULT 0,
    `validFrom` DATETIME(3) NOT NULL,
    `validUntil` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Coupon_code_key`(`code`),
    INDEX `Coupon_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StoreOrder` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `storeId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NULL,
    `jobId` VARCHAR(191) NULL,
    `couponId` VARCHAR(191) NULL,
    `totalAmountMinorUnits` INTEGER NOT NULL,
    `commissionMinorUnits` INTEGER NOT NULL,
    `storePayoutMinorUnits` INTEGER NOT NULL,
    `pickupType` ENUM('BRANCH_PICKUP', 'DELIVERY') NOT NULL DEFAULT 'BRANCH_PICKUP',
    `pickupQrCode` VARCHAR(191) NULL,
    `pickupQrVerifiedAt` DATETIME(3) NULL,
    `status` ENUM('PENDING_PAYMENT', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StoreOrder_pickupQrCode_key`(`pickupQrCode`),
    INDEX `StoreOrder_customerId_idx`(`customerId`),
    INDEX `StoreOrder_storeId_idx`(`storeId`),
    INDEX `StoreOrder_status_idx`(`status`),
    INDEX `StoreOrder_pickupQrCode_idx`(`pickupQrCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StoreOrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `storeOrderId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unitPriceMinorUnits` INTEGER NOT NULL,
    `totalPriceMinorUnits` INTEGER NOT NULL,

    INDEX `StoreOrderItem_storeOrderId_idx`(`storeOrderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NULL,
    `storeOrderId` VARCHAR(191) NULL,
    `gatewayProvider` VARCHAR(191) NOT NULL,
    `gatewayTransactionId` VARCHAR(191) NULL,
    `idempotencyKey` VARCHAR(191) NOT NULL,
    `amountMinorUnits` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'EGP',
    `status` ENUM('INITIATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED', 'VOIDED', 'REQUIRES_ACTION') NOT NULL DEFAULT 'INITIATED',
    `paymentMethod` ENUM('CARD', 'WALLET', 'VALU', 'INSTALLMENTS') NOT NULL DEFAULT 'CARD',
    `metadata` JSON NULL,
    `authorizedAt` DATETIME(3) NULL,
    `capturedAt` DATETIME(3) NULL,
    `voidedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Payment_gatewayTransactionId_key`(`gatewayTransactionId`),
    UNIQUE INDEX `Payment_idempotencyKey_key`(`idempotencyKey`),
    INDEX `Payment_idempotencyKey_idx`(`idempotencyKey`),
    INDEX `Payment_gatewayTransactionId_idx`(`gatewayTransactionId`),
    INDEX `Payment_customerId_idx`(`customerId`),
    INDEX `Payment_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `paymentId` VARCHAR(191) NOT NULL,
    `attemptNumber` INTEGER NOT NULL,
    `gatewayResponse` JSON NULL,
    `errorMessage` TEXT NULL,
    `status` ENUM('INITIATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED', 'VOIDED', 'REQUIRES_ACTION') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PaymentAttempt_paymentId_idx`(`paymentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Refund` (
    `id` VARCHAR(191) NOT NULL,
    `paymentId` VARCHAR(191) NOT NULL,
    `disputeId` VARCHAR(191) NULL,
    `amountMinorUnits` INTEGER NOT NULL,
    `reason` TEXT NOT NULL,
    `gatewayRefundRef` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'COMPLETED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Refund_gatewayRefundRef_key`(`gatewayRefundRef`),
    INDEX `Refund_paymentId_idx`(`paymentId`),
    INDEX `Refund_disputeId_idx`(`disputeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentWebhookEvent` (
    `id` VARCHAR(191) NOT NULL,
    `gatewayEventId` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `isProcessed` BOOLEAN NOT NULL DEFAULT false,
    `processedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PaymentWebhookEvent_gatewayEventId_key`(`gatewayEventId`),
    INDEX `PaymentWebhookEvent_gatewayEventId_idx`(`gatewayEventId`),
    INDEX `PaymentWebhookEvent_provider_isProcessed_idx`(`provider`, `isProcessed`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IdempotencyKey` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `response` JSON NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `IdempotencyKey_key_key`(`key`),
    INDEX `IdempotencyKey_key_idx`(`key`),
    INDEX `IdempotencyKey_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Wallet` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `availableBalanceMinorUnits` INTEGER NOT NULL DEFAULT 0,
    `pendingBalanceMinorUnits` INTEGER NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'EGP',
    `isLocked` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Wallet_userId_key`(`userId`),
    INDEX `Wallet_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transaction` (
    `id` VARCHAR(191) NOT NULL,
    `walletId` VARCHAR(191) NOT NULL,
    `type` ENUM('DEPOSIT', 'PAYMENT_HOLD', 'PAYMENT_RELEASE', 'COMMISSION_DEDUCTION', 'CHANGE_ORDER_PAYMENT', 'WITHDRAWAL', 'REFUND', 'REWARD_POINTS_CASHBACK') NOT NULL,
    `direction` ENUM('CREDIT', 'DEBIT') NOT NULL,
    `amountMinorUnits` INTEGER NOT NULL,
    `balanceAfterMinorUnits` INTEGER NOT NULL,
    `referenceType` VARCHAR(191) NOT NULL,
    `referenceId` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Transaction_walletId_idx`(`walletId`),
    INDEX `Transaction_referenceType_referenceId_idx`(`referenceType`, `referenceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PayoutAccount` (
    `id` VARCHAR(191) NOT NULL,
    `walletId` VARCHAR(191) NOT NULL,
    `bankName` VARCHAR(191) NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `iban` VARCHAR(191) NULL,
    `beneficiaryName` VARCHAR(191) NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PayoutAccount_walletId_idx`(`walletId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommissionRule` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `percentage` DOUBLE NOT NULL,
    `fixedFeeMinorUnits` INTEGER NOT NULL DEFAULT 0,
    `minFeeMinorUnits` INTEGER NOT NULL DEFAULT 0,
    `maxFeeMinorUnits` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SettlementBatch` (
    `id` VARCHAR(191) NOT NULL,
    `beneficiaryType` VARCHAR(191) NOT NULL,
    `beneficiaryId` VARCHAR(191) NOT NULL,
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `totalGrossMinorUnits` INTEGER NOT NULL,
    `totalCommissionMinorUnits` INTEGER NOT NULL,
    `totalNetPayoutMinorUnits` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'TRANSFERRED', 'FAILED', 'FROZEN_FOR_DISPUTE') NOT NULL DEFAULT 'PENDING',
    `bankTransferRef` VARCHAR(191) NULL,
    `processedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SettlementBatch_beneficiaryType_beneficiaryId_idx`(`beneficiaryType`, `beneficiaryId`),
    INDEX `SettlementBatch_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatConversation` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ChatConversation_jobId_key`(`jobId`),
    INDEX `ChatConversation_jobId_idx`(`jobId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatMessage` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `messageText` TEXT NOT NULL,
    `isFlagged` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatMessage_conversationId_idx`(`conversationId`),
    INDEX `ChatMessage_senderId_idx`(`senderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatAntiCircumventionLog` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `recipientId` VARCHAR(191) NOT NULL,
    `originalMessage` TEXT NOT NULL,
    `flaggedReason` VARCHAR(191) NOT NULL,
    `riskLevel` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    `actionTaken` ENUM('NONE', 'BLOCKED', 'WARNING_ISSUED', 'FLAGGED_FOR_REVIEW', 'ACCOUNT_SUSPENDED') NOT NULL DEFAULT 'WARNING_ISSUED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatAntiCircumventionLog_senderId_idx`(`senderId`),
    INDEX `ChatAntiCircumventionLog_riskLevel_idx`(`riskLevel`),
    INDEX `ChatAntiCircumventionLog_jobId_idx`(`jobId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `actorRole` ENUM('CUSTOMER', 'TECHNICIAN', 'STORE_PARTNER', 'ADMIN') NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `details` JSON NULL,
    `riskScore` INTEGER NOT NULL DEFAULT 0,
    `isFlagged` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_userId_idx`(`userId`),
    INDEX `AuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `AuditLog_isFlagged_idx`(`isFlagged`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `titleAr` VARCHAR(191) NOT NULL,
    `bodyAr` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `dataPayload` JSON NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_isRead_idx`(`userId`, `isRead`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RefreshToken` ADD CONSTRAINT `RefreshToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeviceToken` ADD CONSTRAINT `DeviceToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OtpCode` ADD CONSTRAINT `OtpCode_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Address` ADD CONSTRAINT `Address_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TechnicianProfile` ADD CONSTRAINT `TechnicianProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreProfile` ADD CONSTRAINT `StoreProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreBranch` ADD CONSTRAINT `StoreBranch_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `StoreProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VerificationDocument` ADD CONSTRAINT `VerificationDocument_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `StoreProfile`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `ServiceCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductImage` ADD CONSTRAINT `ProductImage_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryMovement` ADD CONSTRAINT `InventoryMovement_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceRequest` ADD CONSTRAINT `ServiceRequest_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceRequest` ADD CONSTRAINT `ServiceRequest_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `ServiceCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceRequest` ADD CONSTRAINT `ServiceRequest_addressId_fkey` FOREIGN KEY (`addressId`) REFERENCES `Address`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceRequestMedia` ADD CONSTRAINT `ServiceRequestMedia_serviceRequestId_fkey` FOREIGN KEY (`serviceRequestId`) REFERENCES `ServiceRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Offer` ADD CONSTRAINT `Offer_serviceRequestId_fkey` FOREIGN KEY (`serviceRequestId`) REFERENCES `ServiceRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Offer` ADD CONSTRAINT `Offer_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `TechnicianProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_serviceRequestId_fkey` FOREIGN KEY (`serviceRequestId`) REFERENCES `ServiceRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `TechnicianProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_offerId_fkey` FOREIGN KEY (`offerId`) REFERENCES `Offer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChangeOrder` ADD CONSTRAINT `ChangeOrder_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChangeOrder` ADD CONSTRAINT `ChangeOrder_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `TechnicianProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChangeOrder` ADD CONSTRAINT `ChangeOrder_sparePartProductId_fkey` FOREIGN KEY (`sparePartProductId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChangeOrder` ADD CONSTRAINT `ChangeOrder_sparePartStoreId_fkey` FOREIGN KEY (`sparePartStoreId`) REFERENCES `StoreProfile`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dispute` ADD CONSTRAINT `Dispute_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dispute` ADD CONSTRAINT `Dispute_raisedByUserId_fkey` FOREIGN KEY (`raisedByUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `TechnicianProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_storeOrderId_fkey` FOREIGN KEY (`storeOrderId`) REFERENCES `StoreOrder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Warranty` ADD CONSTRAINT `Warranty_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cancellation` ADD CONSTRAINT `Cancellation_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cart` ADD CONSTRAINT `Cart_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_cartId_fkey` FOREIGN KEY (`cartId`) REFERENCES `Cart`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreOrder` ADD CONSTRAINT `StoreOrder_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreOrder` ADD CONSTRAINT `StoreOrder_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `StoreProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreOrder` ADD CONSTRAINT `StoreOrder_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `StoreBranch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreOrder` ADD CONSTRAINT `StoreOrder_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreOrder` ADD CONSTRAINT `StoreOrder_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `Coupon`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreOrderItem` ADD CONSTRAINT `StoreOrderItem_storeOrderId_fkey` FOREIGN KEY (`storeOrderId`) REFERENCES `StoreOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreOrderItem` ADD CONSTRAINT `StoreOrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_storeOrderId_fkey` FOREIGN KEY (`storeOrderId`) REFERENCES `StoreOrder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentAttempt` ADD CONSTRAINT `PaymentAttempt_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Refund` ADD CONSTRAINT `Refund_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Refund` ADD CONSTRAINT `Refund_disputeId_fkey` FOREIGN KEY (`disputeId`) REFERENCES `Dispute`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Wallet` ADD CONSTRAINT `Wallet_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_walletId_fkey` FOREIGN KEY (`walletId`) REFERENCES `Wallet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayoutAccount` ADD CONSTRAINT `PayoutAccount_walletId_fkey` FOREIGN KEY (`walletId`) REFERENCES `Wallet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatConversation` ADD CONSTRAINT `ChatConversation_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `ChatConversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

