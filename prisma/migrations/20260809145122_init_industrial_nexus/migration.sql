-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('MANUFACTURER', 'SUPPLIER', 'TRANSPORTER', 'RECYCLER');

-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('RAW_MATERIAL', 'BYPRODUCT', 'EQUIPMENT', 'LABOUR', 'FREIGHT');

-- CreateEnum
CREATE TYPE "AuctionDirection" AS ENUM ('REVERSE', 'FORWARD');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('OPEN', 'BIDDING', 'AWARDED', 'CLOSED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DealState" AS ENUM ('LISTED', 'BIDDING', 'COUNTERED', 'ACCEPTED', 'CONTRACTED', 'IN_EXECUTION', 'SETTLED', 'RATED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('ACTIVE', 'COUNTERED', 'WITHDRAWN', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CounterParty" AS ENUM ('OWNER', 'BIDDER');

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrgType" NOT NULL,
    "city" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.5,
    "dealCount" INTEGER NOT NULL DEFAULT 0,
    "onTimePct" INTEGER NOT NULL DEFAULT 90,
    "pseudonymHandle" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "gstin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "type" "ListingType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ownerOrgId" TEXT NOT NULL,
    "direction" "AuctionDirection" NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'OPEN',
    "spec" JSONB NOT NULL,
    "locationCity" TEXT NOT NULL,
    "locationLat" DOUBLE PRECISION NOT NULL,
    "locationLng" DOUBLE PRECISION NOT NULL,
    "destCity" TEXT,
    "destLat" DOUBLE PRECISION,
    "destLng" DOUBLE PRECISION,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "referencePrice" INTEGER NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "bidderOrgId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "message" TEXT,
    "status" "BidStatus" NOT NULL DEFAULT 'ACTIVE',
    "counterAmount" INTEGER,
    "counterBy" "CounterParty",
    "counterNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerOrgId" TEXT NOT NULL,
    "sellerOrgId" TEXT NOT NULL,
    "winningBidId" TEXT NOT NULL,
    "state" "DealState" NOT NULL DEFAULT 'ACCEPTED',
    "price" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealEvent" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "fromState" "DealState",
    "toState" "DealState" NOT NULL,
    "actorOrgId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "raterOrgId" TEXT NOT NULL,
    "ratedOrgId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organisation_pseudonymHandle_key" ON "Organisation"("pseudonymHandle");

-- CreateIndex
CREATE INDEX "Organisation_type_idx" ON "Organisation"("type");

-- CreateIndex
CREATE INDEX "Organisation_city_idx" ON "Organisation"("city");

-- CreateIndex
CREATE INDEX "Listing_type_idx" ON "Listing"("type");

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "Listing"("status");

-- CreateIndex
CREATE INDEX "Listing_locationCity_idx" ON "Listing"("locationCity");

-- CreateIndex
CREATE INDEX "Listing_ownerOrgId_idx" ON "Listing"("ownerOrgId");

-- CreateIndex
CREATE INDEX "Bid_listingId_idx" ON "Bid"("listingId");

-- CreateIndex
CREATE INDEX "Bid_bidderOrgId_idx" ON "Bid"("bidderOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "Bid_listingId_bidderOrgId_key" ON "Bid"("listingId", "bidderOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_winningBidId_key" ON "Deal"("winningBidId");

-- CreateIndex
CREATE INDEX "Deal_state_idx" ON "Deal"("state");

-- CreateIndex
CREATE INDEX "Deal_buyerOrgId_idx" ON "Deal"("buyerOrgId");

-- CreateIndex
CREATE INDEX "Deal_sellerOrgId_idx" ON "Deal"("sellerOrgId");

-- CreateIndex
CREATE INDEX "DealEvent_dealId_idx" ON "DealEvent"("dealId");

-- CreateIndex
CREATE INDEX "DealEvent_createdAt_idx" ON "DealEvent"("createdAt");

-- CreateIndex
CREATE INDEX "Rating_ratedOrgId_idx" ON "Rating"("ratedOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_dealId_raterOrgId_key" ON "Rating"("dealId", "raterOrgId");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_ownerOrgId_fkey" FOREIGN KEY ("ownerOrgId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_bidderOrgId_fkey" FOREIGN KEY ("bidderOrgId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_buyerOrgId_fkey" FOREIGN KEY ("buyerOrgId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_sellerOrgId_fkey" FOREIGN KEY ("sellerOrgId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_winningBidId_fkey" FOREIGN KEY ("winningBidId") REFERENCES "Bid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealEvent" ADD CONSTRAINT "DealEvent_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealEvent" ADD CONSTRAINT "DealEvent_actorOrgId_fkey" FOREIGN KEY ("actorOrgId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_raterOrgId_fkey" FOREIGN KEY ("raterOrgId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_ratedOrgId_fkey" FOREIGN KEY ("ratedOrgId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
