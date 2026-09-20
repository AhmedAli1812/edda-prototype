import { PrismaClient, UserRole, UserStatus, KycStatus, JobStatus, PaymentStatus, PaymentMethodType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Edda marketplace database...');

  const passwordHash = await bcrypt.hash('EddaSecure2026!', 10);

  // 1. Admin User
  const admin = await prisma.user.upsert({
    where: { phone: '01000000001' },
    update: {},
    create: {
      phone: '01000000001',
      email: 'admin@edda.eg',
      fullName: 'أحمد الإداري (إدارة المنصة)',
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // 2. Customer User
  const customer = await prisma.user.upsert({
    where: { phone: '01012345678' },
    update: {},
    create: {
      phone: '01012345678',
      email: 'mohamed@example.com',
      fullName: 'محمد أدهم',
      passwordHash,
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      rewardPoints: 1250,
      wallet: {
        create: {
          availableBalanceMinorUnits: 18000, // 180.00 EGP
          pendingBalanceMinorUnits: 0,
        },
      },
      addresses: {
        create: {
          title: 'المنزل',
          governorate: 'القاهرة',
          city: 'مدينة نصر',
          district: 'المنطقة الأولى',
          street: 'شارع الطيران',
          building: '14',
          floor: '3',
          apartment: '302',
          latitude: 30.0561,
          longitude: 31.3301,
          maskedAddress: 'مدينة نصر • بالقرب من شارع الطيران',
          isDefault: true,
        },
      },
    },
    include: { addresses: true },
  });

  // 3. Technician User & Profile
  const technician = await prisma.user.upsert({
    where: { phone: '01123456789' },
    update: {},
    create: {
      phone: '01123456789',
      email: 'ahmed.salem@example.com',
      fullName: 'أحمد سالم',
      passwordHash,
      role: UserRole.TECHNICIAN,
      status: UserStatus.ACTIVE,
      wallet: {
        create: {
          availableBalanceMinorUnits: 486000, // 4,860.00 EGP
          pendingBalanceMinorUnits: 29900,   // 299.00 EGP (held during dispute window)
        },
      },
      technicianProfile: {
        create: {
          nationalIdNumber: '29001010101234',
          bio: 'فني كهرباء منازل معتمد خبرة 12 سنة بمدينة نصر ومصر الجديدة',
          categories: ['كهرباء'],
          kycStatus: KycStatus.APPROVED,
          isOnline: true,
          serviceRadiusKm: 15,
          currentLatitude: 30.058,
          currentLongitude: 31.335,
          rating: 4.9,
          totalCompletedJobs: 146,
          acceptanceRate: 92.0,
        },
      },
    },
    include: { technicianProfile: true },
  });

  // 4. Partner Store User & Profile
  const storeUser = await prisma.user.upsert({
    where: { phone: '01234567890' },
    update: {},
    create: {
      phone: '01234567890',
      email: 'bayt.kahrabaa@example.com',
      fullName: 'بيت الكهرباء (شريك موثّق)',
      passwordHash,
      role: UserRole.STORE_PARTNER,
      status: UserStatus.ACTIVE,
      wallet: {
        create: {
          availableBalanceMinorUnits: 1274000, // 12,740.00 EGP
          pendingBalanceMinorUnits: 0,
        },
      },
      storeProfile: {
        create: {
          storeName: 'بيت الكهرباء',
          commercialRegNumber: 'CR-90812',
          taxNumber: 'TX-44129',
          kycStatus: KycStatus.APPROVED,
          commissionRatePercent: 8.0,
          rating: 4.9,
          contactPhone: '01234567890',
          branches: {
            create: {
              branchName: 'فرع مدينة نصر',
              governorate: 'القاهرة',
              city: 'مدينة نصر',
              district: 'شارع عباس العقاد',
              addressDetails: '22 شارع عباس العقاد، بجوار البنك الأهلي',
              latitude: 30.062,
              longitude: 31.338,
              isPickupAvailable: true,
            },
          },
        },
      },
    },
    include: { storeProfile: { include: { branches: true } } },
  });

  // 5. Service Categories
  const categoriesData = [
    { nameAr: 'كهرباء', nameEn: 'Electricity', slug: 'electricity', iconName: 'bolt', sortOrder: 1 },
    { nameAr: 'سباكة', nameEn: 'Plumbing', slug: 'plumbing', iconName: 'pipe', sortOrder: 2 },
    { nameAr: 'تكييف', nameEn: 'Air Conditioning', slug: 'ac', iconName: 'ac', sortOrder: 3 },
    { nameAr: 'نقاشة', nameEn: 'Painting', slug: 'painting', iconName: 'paint', sortOrder: 4 },
    { nameAr: 'أجهزة منزلية', nameEn: 'Appliances', slug: 'appliances', iconName: 'appliance', sortOrder: 5 },
    { nameAr: 'أقفال', nameEn: 'Locks', slug: 'locks', iconName: 'lock', sortOrder: 6 },
    { nameAr: 'نجارة', nameEn: 'Carpentry', slug: 'carpentry', iconName: 'wrench', sortOrder: 7 },
  ];

  for (const cat of categoriesData) {
    await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  const electricityCategory = await prisma.serviceCategory.findUnique({ where: { slug: 'electricity' } });

  // 6. Products
  const productsData = [
    {
      titleAr: 'مفتاح شنايدر أصلي 16 أمبير',
      titleEn: 'Schneider Original Switch 16A',
      descriptionAr: 'مفتاح كهرباء أوتوماتيك عالي الجودة مطابق للمواصفات القياسية.',
      sku: 'SKU-SCH-16A',
      priceMinorUnits: 9500, // 95.00 EGP
      stockQuantity: 45,
      storeId: storeUser.storeProfile?.id,
      categoryId: electricityCategory!.id,
    },
    {
      titleAr: 'مفك كهرباء معزول 1000 فولت',
      titleEn: 'Insulated Screwdriver 1000V',
      descriptionAr: 'مفك اختبار معزول ضد الصدمات الكهربائية للمحترفين.',
      sku: 'SKU-TOOL-V1000',
      priceMinorUnits: 18500, // 185.00 EGP
      stockQuantity: 20,
      storeId: storeUser.storeProfile?.id,
      categoryId: electricityCategory!.id,
    },
  ];

  for (const prod of productsData) {
    await prisma.product.upsert({
      where: { sku: prod.sku },
      update: {},
      create: prod,
    });
  }

  // 7. Example Service Request
  const customerAddress = customer.addresses[0];
  if (!customerAddress) {
    throw new Error('Customer address was not created during seed');
  }
  const serviceRequest = await prisma.serviceRequest.create({
    data: {
      customerId: customer.id,
      categoryId: electricityCategory!.id,
      addressId: customerAddress.id,
      title: 'إصلاح عطل كهربائي بالمطبخ',
      description: 'مفتاح الكهرباء يفصل باستمرار مع صوت أزيز خفيف عند تشغيل الفرن.',
      preferredTimeType: 'ASAP',
      expectedBudgetMinMinorUnits: 30000,
      expectedBudgetMaxMinorUnits: 50000,
      latitude: customerAddress.latitude,
      longitude: customerAddress.longitude,
      maskedDistrict: customerAddress.maskedAddress,
      media: {
        create: [
          { mediaUrl: 'https://assets.edda.eg/demo/fault1.jpg', mediaType: 'image' },
        ],
      },
    },
  });

  // 8. Technician Offer
  const offer = await prisma.offer.create({
    data: {
      serviceRequestId: serviceRequest.id,
      technicianId: technician.technicianProfile!.id,
      priceMinorUnits: 34000, // 340.00 EGP
      estimatedArrivalMinutes: 45,
      warrantyDurationDays: 30,
      warrantyNotes: 'السعر يشمل المعاينة والإصلاح وضمان 30 يوم.',
      notes: 'متاح فورا وموجود بالحي السابع بمدينة نصر.',
    },
  });

  // 9. Example Job in progress with SafePay authorization
  const job = await prisma.job.create({
    data: {
      serviceRequestId: serviceRequest.id,
      customerId: customer.id,
      technicianId: technician.technicianProfile!.id,
      offerId: offer.id,
      status: JobStatus.EN_ROUTE,
      arrivalOtpHash: await bcrypt.hash('4821', 8), // Customer displays '4821' to technician
      completionOtpHash: await bcrypt.hash('9102', 8),
      invoiceNumber: 'INV-2026-SRV-2048',
      payments: {
        create: {
          customerId: customer.id,
          gatewayProvider: 'mock',
          gatewayTransactionId: 'TXN-SAFE-90184',
          idempotencyKey: 'IDEMP-JOB-INIT-2048',
          amountMinorUnits: 35000, // 350.00 EGP (340 + 25 protection fee - 15 points discount)
          status: PaymentStatus.AUTHORIZED,
          paymentMethod: PaymentMethodType.CARD,
          authorizedAt: new Date(),
        },
      },
    },
  });

  console.log('Edda database seeded successfully with Admin, Customer, Technician, Store, Products, and Job!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
