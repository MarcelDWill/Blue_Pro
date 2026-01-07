-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('plumbing', 'electrical', 'roofing', 'hvac', 'general_repair', 'carpentry', 'painting', 'landscaping');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('pending', 'assigned', 'accepted', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "AppointmentPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "lat" DECIMAL(10,8),
    "lng" DECIMAL(11,8),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technicians" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "hourlyRate" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technicians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ServiceCategory" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technician_skills" (
    "id" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "technician_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_areas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "county" TEXT,
    "state" CHAR(2) NOT NULL,
    "zipCodes" TEXT[],
    "centerLat" DECIMAL(10,8) NOT NULL,
    "centerLng" DECIMAL(11,8) NOT NULL,
    "radiusMiles" DECIMAL(5,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technician_work_areas" (
    "id" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "workAreaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "technician_work_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "working_hours" (
    "id" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "working_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_appointments" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "technicianId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serviceType" "ServiceCategory" NOT NULL,
    "workAreaId" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "scheduledDateTime" TIMESTAMP(3) NOT NULL,
    "estimatedDuration" INTEGER NOT NULL DEFAULT 120,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'pending',
    "priority" "AppointmentPriority" NOT NULL DEFAULT 'medium',
    "customerFeedback" JSONB,
    "assignedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completionNotes" TEXT,
    "referenceNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_skills" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_skills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "addresses_zipCode_idx" ON "addresses"("zipCode");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "technicians_email_key" ON "technicians"("email");

-- CreateIndex
CREATE UNIQUE INDEX "technicians_employeeId_key" ON "technicians"("employeeId");

-- CreateIndex
CREATE INDEX "technicians_email_idx" ON "technicians"("email");

-- CreateIndex
CREATE INDEX "technicians_employeeId_idx" ON "technicians"("employeeId");

-- CreateIndex
CREATE INDEX "technicians_isActive_idx" ON "technicians"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE INDEX "skills_name_idx" ON "skills"("name");

-- CreateIndex
CREATE INDEX "skills_category_idx" ON "skills"("category");

-- CreateIndex
CREATE INDEX "technician_skills_technicianId_idx" ON "technician_skills"("technicianId");

-- CreateIndex
CREATE INDEX "technician_skills_skillId_idx" ON "technician_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "technician_skills_technicianId_skillId_key" ON "technician_skills"("technicianId", "skillId");

-- CreateIndex
CREATE INDEX "work_areas_city_state_idx" ON "work_areas"("city", "state");

-- CreateIndex
CREATE INDEX "technician_work_areas_technicianId_idx" ON "technician_work_areas"("technicianId");

-- CreateIndex
CREATE INDEX "technician_work_areas_workAreaId_idx" ON "technician_work_areas"("workAreaId");

-- CreateIndex
CREATE UNIQUE INDEX "technician_work_areas_technicianId_workAreaId_key" ON "technician_work_areas"("technicianId", "workAreaId");

-- CreateIndex
CREATE INDEX "working_hours_technicianId_dayOfWeek_idx" ON "working_hours"("technicianId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "working_hours_effectiveDate_idx" ON "working_hours"("effectiveDate");

-- CreateIndex
CREATE UNIQUE INDEX "service_appointments_referenceNumber_key" ON "service_appointments"("referenceNumber");

-- CreateIndex
CREATE INDEX "service_appointments_customerId_idx" ON "service_appointments"("customerId");

-- CreateIndex
CREATE INDEX "service_appointments_technicianId_idx" ON "service_appointments"("technicianId");

-- CreateIndex
CREATE INDEX "service_appointments_status_idx" ON "service_appointments"("status");

-- CreateIndex
CREATE INDEX "service_appointments_scheduledDateTime_idx" ON "service_appointments"("scheduledDateTime");

-- CreateIndex
CREATE INDEX "service_appointments_workAreaId_idx" ON "service_appointments"("workAreaId");

-- CreateIndex
CREATE INDEX "service_appointments_referenceNumber_idx" ON "service_appointments"("referenceNumber");

-- CreateIndex
CREATE INDEX "appointment_skills_appointmentId_idx" ON "appointment_skills"("appointmentId");

-- CreateIndex
CREATE INDEX "appointment_skills_skillId_idx" ON "appointment_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_skills_appointmentId_skillId_key" ON "appointment_skills"("appointmentId", "skillId");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "addresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_skills" ADD CONSTRAINT "technician_skills_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "technicians"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_skills" ADD CONSTRAINT "technician_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_work_areas" ADD CONSTRAINT "technician_work_areas_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "technicians"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_work_areas" ADD CONSTRAINT "technician_work_areas_workAreaId_fkey" FOREIGN KEY ("workAreaId") REFERENCES "work_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "technicians"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "technicians"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_workAreaId_fkey" FOREIGN KEY ("workAreaId") REFERENCES "work_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_skills" ADD CONSTRAINT "appointment_skills_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "service_appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_skills" ADD CONSTRAINT "appointment_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
