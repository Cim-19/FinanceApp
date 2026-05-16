-- CreateTable
CREATE TABLE "FamilyBudget" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilySavingGoal" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetAmount" DECIMAL(12,2) NOT NULL,
    "currentAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3),
    "emoji" TEXT NOT NULL DEFAULT '🎯',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilySavingGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FamilyBudget_familyId_idx" ON "FamilyBudget"("familyId");

-- CreateIndex
CREATE INDEX "FamilyBudget_familyId_month_year_idx" ON "FamilyBudget"("familyId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyBudget_familyId_categoryId_month_year_key" ON "FamilyBudget"("familyId", "categoryId", "month", "year");

-- CreateIndex
CREATE INDEX "FamilySavingGoal_familyId_idx" ON "FamilySavingGoal"("familyId");

-- AddForeignKey
ALTER TABLE "FamilyBudget" ADD CONSTRAINT "FamilyBudget_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyBudget" ADD CONSTRAINT "FamilyBudget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilySavingGoal" ADD CONSTRAINT "FamilySavingGoal_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
