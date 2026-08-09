/**
 * Seed data for IndusMate.
 *
 * Goals, in priority order:
 *  1. Every lifecycle state that a Deal row can occupy has one sitting in it,
 *     so the demo never shows an empty screen and the state machine is
 *     visibly real. (LISTED and BIDDING are deliberately never held by a Deal
 *     row — a Deal is created at the moment of acceptance. Those two states
 *     appear only in each deal's DealEvent history, which is exactly right.)
 *  2. At least one freight listing carries two sealed bids from different
 *     transporters — that is the masking moment in the demo script.
 *  3. A fly-ash byproduct listing exists whose ideal consumer (a cement plant)
 *     is also a seeded organisation, so the AI matcher can surface a real
 *     on-platform match rather than a generic industry list.
 *
 * Re-runnable: wipes and rebuilds. `npm run seed`.
 */

import {
  PrismaClient,
  OrgType,
  ListingType,
  AuctionDirection,
  ListingStatus,
  DealState,
  BidStatus,
  CounterParty,
} from "@prisma/client";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const now = new Date();
const days = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);
const hours = (n: number) => new Date(now.getTime() + n * 60 * 60 * 1000);

/** Lakhs → rupees, because Indian industrial pricing is quoted in lakhs. */
const lakh = (n: number) => Math.round(n * 100_000);

// ---------------------------------------------------------------------------
// Organisations — real coordinates across the MP industrial corridor
// ---------------------------------------------------------------------------

const ORGS = [
  // --- Malanpur industrial area (Bhind district, near Gwalior) -------------
  {
    id: "org_chambal_steel",
    name: "Chambal Steel & Alloys",
    legalName: "Chambal Steel & Alloys Private Limited",
    type: OrgType.MANUFACTURER,
    city: "Malanpur",
    lat: 26.3547,
    lng: 78.2831,
    rating: 4.6,
    dealCount: 214,
    onTimePct: 94,
    pseudonymHandle: "Verified Manufacturer #2208",
    contactName: "Rajeev Khandelwal",
    contactPhone: "+91 98260 41127",
    contactEmail: "rajeev.k@chambalsteel.in",
    gstin: "23AAGCC4471M1Z8",
  },
  {
    id: "org_mp_cargo",
    name: "MP Cargo Movers",
    legalName: "Madhya Pradesh Cargo Movers LLP",
    type: OrgType.TRANSPORTER,
    city: "Malanpur",
    lat: 26.3402,
    lng: 78.2604,
    rating: 4.7,
    dealCount: 128,
    onTimePct: 96,
    pseudonymHandle: "Verified Transporter #4471",
    contactName: "Sunil Yadav",
    contactPhone: "+91 94250 77310",
    contactEmail: "ops@mpcargomovers.com",
    gstin: "23AABCM8842K1ZP",
  },

  // --- Gwalior -------------------------------------------------------------
  {
    id: "org_gwalior_ferrous",
    name: "Gwalior Ferrous Works",
    legalName: "Gwalior Ferrous Works Limited",
    type: OrgType.MANUFACTURER,
    city: "Gwalior",
    lat: 26.2183,
    lng: 78.1828,
    rating: 4.3,
    dealCount: 167,
    onTimePct: 89,
    pseudonymHandle: "Verified Manufacturer #1903",
    contactName: "Anupam Sikarwar",
    contactPhone: "+91 99770 21884",
    contactEmail: "purchase@gwaliorferrous.in",
    gstin: "23AAACG1190P1ZR",
  },
  {
    id: "org_scindia_metals",
    name: "Scindia Metals Trading",
    legalName: "Scindia Metals Trading Company",
    type: OrgType.SUPPLIER,
    city: "Gwalior",
    lat: 26.2295,
    lng: 78.1734,
    rating: 4.4,
    dealCount: 96,
    onTimePct: 91,
    pseudonymHandle: "Verified Supplier #3312",
    contactName: "Mahesh Agrawal",
    contactPhone: "+91 98931 55402",
    contactEmail: "mahesh@scindiametals.co.in",
    gstin: "23AACFS6620L1ZQ",
  },
  {
    id: "org_sarthak_roadlines",
    name: "Sarthak Roadlines",
    legalName: "Sarthak Roadlines Private Limited",
    type: OrgType.TRANSPORTER,
    city: "Gwalior",
    lat: 26.1954,
    lng: 78.2261,
    rating: 4.4,
    dealCount: 87,
    onTimePct: 91,
    pseudonymHandle: "Verified Transporter #5127",
    contactName: "Devendra Tomar",
    contactPhone: "+91 93003 68219",
    contactEmail: "dispatch@sarthakroadlines.in",
    gstin: "23AAJCS2077N1ZK",
  },

  // --- Banmore (Morena district) ------------------------------------------
  {
    id: "org_banmore_cement",
    name: "Banmore Cement Industries",
    legalName: "Banmore Cement Industries Limited",
    type: OrgType.MANUFACTURER,
    city: "Banmore",
    lat: 26.4074,
    lng: 78.1923,
    rating: 4.5,
    dealCount: 189,
    onTimePct: 93,
    pseudonymHandle: "Verified Manufacturer #2764",
    contactName: "Prakash Bhadauria",
    contactPhone: "+91 97550 12276",
    contactEmail: "materials@banmorecement.com",
    gstin: "23AABCB3390H1ZW",
  },
  {
    id: "org_ecocycle",
    name: "EcoCycle Resource Recovery",
    legalName: "EcoCycle Resource Recovery Private Limited",
    type: OrgType.RECYCLER,
    city: "Banmore",
    lat: 26.3961,
    lng: 78.2118,
    rating: 4.8,
    dealCount: 74,
    onTimePct: 97,
    pseudonymHandle: "Verified Recycler #6620",
    contactName: "Shalini Rathore",
    contactPhone: "+91 90398 44715",
    contactEmail: "shalini@ecocyclerr.in",
    gstin: "23AAHCE7715J1ZD",
  },

  // --- Pithampur (Dhar district, near Indore) ------------------------------
  {
    id: "org_pithampur_auto",
    name: "Pithampur Auto Components",
    legalName: "Pithampur Auto Components Limited",
    type: OrgType.MANUFACTURER,
    city: "Pithampur",
    lat: 22.6013,
    lng: 75.6858,
    rating: 4.7,
    dealCount: 302,
    onTimePct: 95,
    pseudonymHandle: "Verified Manufacturer #1188",
    contactName: "Kiran Deshmukh",
    contactPhone: "+91 98931 20047",
    contactEmail: "scm@pithampurauto.com",
    gstin: "23AADCP1188E1ZL",
  },
  {
    id: "org_malwa_minerals",
    name: "Malwa Minerals & Aggregates",
    legalName: "Malwa Minerals and Aggregates Private Limited",
    type: OrgType.SUPPLIER,
    city: "Pithampur",
    lat: 22.6187,
    lng: 75.7024,
    rating: 4.2,
    dealCount: 118,
    onTimePct: 87,
    pseudonymHandle: "Verified Supplier #4409",
    contactName: "Nitin Patidar",
    contactPhone: "+91 94254 88136",
    contactEmail: "sales@malwaminerals.in",
    gstin: "23AAFCM4409G1ZN",
  },
  {
    id: "org_trishul_logistics",
    name: "Trishul Logistics",
    legalName: "Trishul Logistics Private Limited",
    type: OrgType.TRANSPORTER,
    city: "Pithampur",
    lat: 22.6342,
    lng: 75.7391,
    rating: 4.9,
    dealCount: 241,
    onTimePct: 98,
    pseudonymHandle: "Verified Transporter #7734",
    contactName: "Harpreet Singh Bhatia",
    contactPhone: "+91 99816 30052",
    contactEmail: "control@trishullogistics.co.in",
    gstin: "23AAGCT7734B1ZY",
  },

  // --- Mandideep (Raisen district, near Bhopal) ----------------------------
  {
    id: "org_vindhya_power",
    name: "Vindhya Thermal Power",
    legalName: "Vindhya Thermal Power Station Limited",
    type: OrgType.MANUFACTURER,
    city: "Mandideep",
    lat: 23.0993,
    lng: 77.5205,
    rating: 4.1,
    dealCount: 58,
    onTimePct: 85,
    pseudonymHandle: "Verified Manufacturer #8851",
    contactName: "S. Venkatesan",
    contactPhone: "+91 75096 41220",
    contactEmail: "byproducts@vindhyathermal.in",
    gstin: "23AABCV8851R1ZT",
  },
  {
    id: "org_narmada_polymers",
    name: "Narmada Polymers",
    legalName: "Narmada Polymers Private Limited",
    type: OrgType.SUPPLIER,
    city: "Mandideep",
    lat: 23.1104,
    lng: 77.5382,
    rating: 4.5,
    dealCount: 133,
    onTimePct: 92,
    pseudonymHandle: "Verified Supplier #2295",
    contactName: "Farhan Qureshi",
    contactPhone: "+91 88899 70413",
    contactEmail: "farhan@narmadapolymers.in",
    gstin: "23AAECN2295F1ZM",
  },
] as const;

// ---------------------------------------------------------------------------
// Listings — 15 across all five markets, one table, one engine
// ---------------------------------------------------------------------------

const LISTINGS = [
  // ===================== FREIGHT (the fully-built market) ==================
  {
    id: "lst_freight_malanpur_pithampur",
    type: ListingType.FREIGHT,
    title: "12t auto components — Malanpur to Pithampur",
    description:
      "Palletised transmission housings for a Tier-1 line. Loading bay open 06:00-18:00. Delivery window is firm; the receiving plant runs JIT and a late truck stops the line.",
    ownerOrgId: "org_chambal_steel",
    direction: AuctionDirection.REVERSE,
    status: ListingStatus.BIDDING,
    locationCity: "Malanpur",
    locationLat: 26.3547,
    locationLng: 78.2831,
    destCity: "Pithampur",
    destLat: 22.6013,
    destLng: 75.6858,
    windowStart: days(2),
    windowEnd: days(4),
    quantity: 12,
    unit: "tonnes",
    referencePrice: lakh(0.62),
    closesAt: hours(30),
    spec: {
      type: "FREIGHT",
      cargoType: "Palletised transmission housings",
      weightTonnes: 12,
      volumeCbm: 34,
      vehicleType: "32ft multi-axle",
      loadType: "FTL",
      hazmat: false,
      distanceKm: 486,
    },
  },
  {
    id: "lst_freight_banmore_gwalior",
    type: ListingType.FREIGHT,
    title: "28t bulk cement — Banmore to Gwalior",
    description:
      "Bagged OPC 53 grade, 560 bags. Covered vehicle mandatory — monsoon spoilage is on the transporter.",
    ownerOrgId: "org_banmore_cement",
    direction: AuctionDirection.REVERSE,
    status: ListingStatus.BIDDING,
    locationCity: "Banmore",
    locationLat: 26.4074,
    locationLng: 78.1923,
    destCity: "Gwalior",
    destLat: 26.2183,
    destLng: 78.1828,
    windowStart: days(1),
    windowEnd: days(2),
    quantity: 28,
    unit: "tonnes",
    referencePrice: lakh(0.24),
    closesAt: hours(18),
    spec: {
      type: "FREIGHT",
      cargoType: "Bagged OPC 53 grade cement",
      weightTonnes: 28,
      volumeCbm: 22,
      vehicleType: "22ft container",
      loadType: "FTL",
      hazmat: false,
      distanceKm: 39,
    },
  },
  {
    id: "lst_freight_mandideep_indore",
    type: ListingType.FREIGHT,
    title: "9t polymer granules — Mandideep to Pithampur",
    description: "25kg sacks on pallets. Return-leg pricing welcome.",
    ownerOrgId: "org_narmada_polymers",
    direction: AuctionDirection.REVERSE,
    status: ListingStatus.OPEN,
    locationCity: "Mandideep",
    locationLat: 23.0993,
    locationLng: 77.5205,
    destCity: "Pithampur",
    destLat: 22.6013,
    destLng: 75.6858,
    windowStart: days(3),
    windowEnd: days(5),
    quantity: 9,
    unit: "tonnes",
    referencePrice: lakh(0.31),
    closesAt: hours(44),
    spec: {
      type: "FREIGHT",
      cargoType: "HDPE granules in 25kg sacks",
      weightTonnes: 9,
      volumeCbm: 28,
      vehicleType: "19ft truck",
      loadType: "FTL",
      hazmat: false,
      distanceKm: 187,
    },
  },
  {
    id: "lst_freight_gwalior_mandideep",
    type: ListingType.FREIGHT,
    title: "18t steel billets — Gwalior to Mandideep",
    description: "Hot-rolled billets, open flatbed acceptable. Crane available both ends.",
    ownerOrgId: "org_gwalior_ferrous",
    direction: AuctionDirection.REVERSE,
    status: ListingStatus.AWARDED,
    locationCity: "Gwalior",
    locationLat: 26.2183,
    locationLng: 78.1828,
    destCity: "Mandideep",
    destLat: 23.0993,
    destLng: 77.5205,
    windowStart: days(-2),
    windowEnd: days(1),
    quantity: 18,
    unit: "tonnes",
    referencePrice: lakh(0.58),
    closesAt: days(-3),
    spec: {
      type: "FREIGHT",
      cargoType: "Hot-rolled steel billets",
      weightTonnes: 18,
      volumeCbm: 12,
      vehicleType: "Trailer / flatbed",
      loadType: "FTL",
      hazmat: false,
      distanceKm: 421,
    },
  },
  {
    id: "lst_freight_pithampur_malanpur",
    type: ListingType.FREIGHT,
    title: "6t machined parts — Pithampur to Malanpur",
    description: "Return leg. Crated precision parts, no stacking above two tiers.",
    ownerOrgId: "org_pithampur_auto",
    direction: AuctionDirection.REVERSE,
    status: ListingStatus.AWARDED,
    locationCity: "Pithampur",
    locationLat: 22.6013,
    locationLng: 75.6858,
    destCity: "Malanpur",
    destLat: 26.3547,
    destLng: 78.2831,
    windowStart: days(-8),
    windowEnd: days(-5),
    quantity: 6,
    unit: "tonnes",
    referencePrice: lakh(0.44),
    closesAt: days(-9),
    spec: {
      type: "FREIGHT",
      cargoType: "Crated machined components",
      weightTonnes: 6,
      volumeCbm: 19,
      vehicleType: "14ft tempo",
      loadType: "LTL",
      hazmat: false,
      distanceKm: 486,
    },
  },

  // ===================== BYPRODUCT (the innovation) ========================
  {
    id: "lst_byproduct_flyash",
    type: ListingType.BYPRODUCT,
    title: "Class F fly ash — 4,200 t/month, ESP-collected",
    description:
      "Dry ESP hopper collection from a 210 MW coal-fired unit. Consistent output, weighbridge on site, silo loading available. Currently going to an ash pond at a cost to us — we would rather it went somewhere useful.",
    ownerOrgId: "org_vindhya_power",
    direction: AuctionDirection.FORWARD,
    status: ListingStatus.BIDDING,
    locationCity: "Mandideep",
    locationLat: 23.0993,
    locationLng: 77.5205,
    windowStart: days(0),
    windowEnd: days(180),
    quantity: 4200,
    unit: "tonnes/month",
    referencePrice: lakh(0.009),
    closesAt: days(6),
    spec: {
      type: "BYPRODUCT",
      composition: "SiO2 58%, Al2O3 27%, Fe2O3 6.2%, CaO 2.8%, MgO 1.1%, LOI 2.4%",
      physicalForm: "Fine powder",
      moisturePct: 0.4,
      contaminants: ["Unburnt carbon 2.4%", "Trace heavy metals within CPCB limits"],
      monthlyVolumeTonnes: 4200,
      hazardClass: "Non-hazardous",
      sourceProcess: "Coal-fired boiler, electrostatic precipitator hopper collection",
    },
  },
  {
    id: "lst_byproduct_slag",
    type: ListingType.BYPRODUCT,
    title: "Granulated blast furnace slag — 1,800 t/month",
    description:
      "Water-quenched, glassy granulate. Stockpiled under cover. Suits grinding into GGBS or direct aggregate use.",
    ownerOrgId: "org_chambal_steel",
    direction: AuctionDirection.FORWARD,
    status: ListingStatus.OPEN,
    locationCity: "Malanpur",
    locationLat: 26.3547,
    locationLng: 78.2831,
    windowStart: days(0),
    windowEnd: days(120),
    quantity: 1800,
    unit: "tonnes/month",
    referencePrice: lakh(0.014),
    closesAt: days(9),
    spec: {
      type: "BYPRODUCT",
      composition: "CaO 38%, SiO2 34%, Al2O3 18%, MgO 8%",
      physicalForm: "Slag / aggregate",
      moisturePct: 8.5,
      contaminants: ["None"],
      monthlyVolumeTonnes: 1800,
      hazardClass: "Non-hazardous",
      sourceProcess: "Blast furnace iron making, water-granulated at tap",
    },
  },
  {
    id: "lst_byproduct_millscale",
    type: ListingType.BYPRODUCT,
    title: "Mill scale — 260 t/month, rolling mill",
    description:
      "Iron oxide scale from hot rolling. Magnetic, low oil content. Currently sold to a single buyer; opening it up.",
    ownerOrgId: "org_gwalior_ferrous",
    direction: AuctionDirection.FORWARD,
    status: ListingStatus.AWARDED,
    locationCity: "Gwalior",
    locationLat: 26.2183,
    locationLng: 78.1828,
    windowStart: days(0),
    windowEnd: days(90),
    quantity: 260,
    unit: "tonnes/month",
    referencePrice: lakh(0.11),
    closesAt: days(11),
    spec: {
      type: "BYPRODUCT",
      composition: "FeO 62%, Fe2O3 32%, SiO2 2%",
      physicalForm: "Coarse powder",
      moisturePct: 3.2,
      contaminants: ["Residual rolling oil <1%"],
      monthlyVolumeTonnes: 260,
      hazardClass: "Category A - inert",
      sourceProcess: "Hot rolling mill descaling, magnetic separation",
    },
  },

  // ===================== RAW MATERIAL ======================================
  {
    id: "lst_raw_tmt",
    type: ListingType.RAW_MATERIAL,
    title: "Fe 500D TMT bars — 140 t available",
    description: "BIS-marked, 8mm to 25mm mixed. Mill test certificates supplied per heat.",
    ownerOrgId: "org_scindia_metals",
    direction: AuctionDirection.FORWARD,
    status: ListingStatus.BIDDING,
    locationCity: "Gwalior",
    locationLat: 26.2295,
    locationLng: 78.1734,
    windowStart: days(0),
    windowEnd: days(21),
    quantity: 140,
    unit: "tonnes",
    referencePrice: lakh(0.545),
    closesAt: days(3),
    spec: {
      type: "RAW_MATERIAL",
      grade: "Fe 500D",
      physicalForm: "Lumps",
      purityPct: 99.2,
      packaging: "Bundled",
      hsnCode: "7214",
      minOrderQtyTonnes: 10,
    },
  },
  {
    id: "lst_raw_quartz",
    type: ListingType.RAW_MATERIAL,
    title: "Quartz powder 200 mesh — 90 t",
    description: "Low-iron washed quartz, suits glass and ceramic bodies.",
    ownerOrgId: "org_malwa_minerals",
    direction: AuctionDirection.FORWARD,
    status: ListingStatus.AWARDED,
    locationCity: "Pithampur",
    locationLat: 22.6187,
    locationLng: 75.7024,
    windowStart: days(0),
    windowEnd: days(30),
    quantity: 90,
    unit: "tonnes",
    referencePrice: lakh(0.038),
    closesAt: days(7),
    spec: {
      type: "RAW_MATERIAL",
      grade: "99.1% SiO2, low-iron",
      physicalForm: "Powder",
      purityPct: 99.1,
      packaging: "1 tonne jumbo bags",
      hsnCode: "2506",
      minOrderQtyTonnes: 5,
    },
  },
  {
    id: "lst_raw_hdpe",
    type: ListingType.RAW_MATERIAL,
    title: "HDPE blow-moulding granules — 45 t",
    description: "Virgin grade, MFI 0.35. Suits 5L to 20L container moulding.",
    ownerOrgId: "org_narmada_polymers",
    direction: AuctionDirection.FORWARD,
    status: ListingStatus.OPEN,
    locationCity: "Mandideep",
    locationLat: 23.1104,
    locationLng: 77.5382,
    windowStart: days(0),
    windowEnd: days(25),
    quantity: 45,
    unit: "tonnes",
    referencePrice: lakh(1.02),
    closesAt: days(5),
    spec: {
      type: "RAW_MATERIAL",
      grade: "HDPE BL-3, MFI 0.35",
      physicalForm: "Granules",
      purityPct: 100,
      packaging: "25kg bags",
      hsnCode: "3901",
      minOrderQtyTonnes: 2,
    },
  },

  // ===================== EQUIPMENT =========================================
  {
    id: "lst_equip_vmc",
    type: ListingType.EQUIPMENT,
    title: "CNC vertical machining centre — idle 2nd shift",
    description:
      "Second shift is unused four nights a week. Fanuc control, in-house operator available at extra cost.",
    ownerOrgId: "org_pithampur_auto",
    direction: AuctionDirection.FORWARD,
    status: ListingStatus.BIDDING,
    locationCity: "Pithampur",
    locationLat: 22.6013,
    locationLng: 75.6858,
    windowStart: days(1),
    windowEnd: days(45),
    quantity: 160,
    unit: "hours",
    referencePrice: 1450,
    closesAt: days(4),
    spec: {
      type: "EQUIPMENT",
      machineType: "CNC vertical machining centre",
      make: "Jyoti",
      model: "VMC 850",
      capacity: "800 x 500 x 500 mm, Fanuc 0i-MF",
      yearOfManufacture: 2021,
      operatorIncluded: true,
      minimumHours: 8,
      mobilisationRadiusKm: 0,
    },
  },
  {
    id: "lst_equip_crane",
    type: ListingType.EQUIPMENT,
    title: "25t hydraulic mobile crane — day rate",
    description: "Available between shutdown jobs. Operator and rigger included, fuel on hirer.",
    ownerOrgId: "org_chambal_steel",
    direction: AuctionDirection.FORWARD,
    status: ListingStatus.AWARDED,
    locationCity: "Malanpur",
    locationLat: 26.3547,
    locationLng: 78.2831,
    windowStart: days(2),
    windowEnd: days(20),
    quantity: 90,
    unit: "hours",
    referencePrice: 3200,
    closesAt: days(6),
    spec: {
      type: "EQUIPMENT",
      machineType: "Hydraulic mobile crane",
      make: "Escorts",
      model: "Hydra F15",
      capacity: "25 tonne, 32m boom",
      yearOfManufacture: 2019,
      operatorIncluded: true,
      minimumHours: 8,
      mobilisationRadiusKm: 120,
    },
  },

  // ===================== LABOUR ============================================
  {
    id: "lst_labour_welders",
    type: ListingType.LABOUR,
    title: "6G pipe welders — 6 heads, 14-day shutdown",
    description:
      "Boiler tube and header work during a planned shutdown. ASME IX qualification will be verified on site before work starts.",
    ownerOrgId: "org_vindhya_power",
    direction: AuctionDirection.REVERSE,
    status: ListingStatus.BIDDING,
    locationCity: "Mandideep",
    locationLat: 23.0993,
    locationLng: 77.5205,
    windowStart: days(12),
    windowEnd: days(26),
    quantity: 84,
    unit: "shifts",
    referencePrice: 2850,
    closesAt: days(5),
    spec: {
      type: "LABOUR",
      trade: "Certified welder - 6G pipe",
      certifications: ["ASME IX", "AWS D1.1"],
      headcount: 6,
      shiftHours: 12,
      experienceYears: 5,
      safetyTrained: true,
    },
  },
  {
    id: "lst_labour_electricians",
    type: ListingType.LABOUR,
    title: "Panel electricians — 4 heads, 10 days",
    description: "LT panel rewiring and VFD commissioning across two shop floors.",
    ownerOrgId: "org_gwalior_ferrous",
    direction: AuctionDirection.REVERSE,
    status: ListingStatus.AWARDED,
    locationCity: "Gwalior",
    locationLat: 26.2183,
    locationLng: 78.1828,
    windowStart: days(8),
    windowEnd: days(18),
    quantity: 40,
    unit: "shifts",
    referencePrice: 1950,
    closesAt: days(4),
    spec: {
      type: "LABOUR",
      trade: "Industrial panel electrician",
      certifications: ["ITI Electrician", "MP State wireman licence"],
      headcount: 4,
      shiftHours: 8,
      experienceYears: 3,
      safetyTrained: true,
    },
  },
] as const;

// ---------------------------------------------------------------------------
// Bids
// ---------------------------------------------------------------------------

const BIDS = [
  // THE MASKING MOMENT: two transporters, sealed, on the same freight leg.
  // Neither can see the other's number. The owner sees reputation, not names.
  {
    id: "bid_freight_mp_cargo",
    listingId: "lst_freight_malanpur_pithampur",
    bidderOrgId: "org_mp_cargo",
    amount: lakh(0.585),
    message: "Vehicle is already returning empty from Indore on that date. Can hold the delivery window.",
    status: BidStatus.ACTIVE,
  },
  {
    id: "bid_freight_trishul",
    listingId: "lst_freight_malanpur_pithampur",
    bidderOrgId: "org_trishul_logistics",
    amount: lakh(0.548),
    message: "GPS-tracked multi-axle, driver on our own payroll. Can load a day early if the bay is free.",
    status: BidStatus.ACTIVE,
  },
  {
    id: "bid_freight_sarthak",
    listingId: "lst_freight_malanpur_pithampur",
    bidderOrgId: "org_sarthak_roadlines",
    amount: lakh(0.61),
    message: "Covered body, tarpaulin backup. Firm price, no diesel escalation clause.",
    status: BidStatus.ACTIVE,
  },

  // A counter-offer in flight — owner has countered, bidder has not replied.
  {
    id: "bid_cement_sarthak",
    listingId: "lst_freight_banmore_gwalior",
    bidderOrgId: "org_sarthak_roadlines",
    amount: lakh(0.265),
    message: "Two trips, same day. Covered container.",
    status: BidStatus.COUNTERED,
    counterAmount: lakh(0.232),
    counterBy: CounterParty.OWNER,
    counterNote: "We have moved this leg at 23,200 before. Match it and it is yours.",
  },
  {
    id: "bid_cement_mp_cargo",
    listingId: "lst_freight_banmore_gwalior",
    bidderOrgId: "org_mp_cargo",
    amount: lakh(0.248),
    status: BidStatus.ACTIVE,
  },

  // Forward auction — buyers competing UP for scarce fly ash.
  {
    id: "bid_flyash_banmore",
    listingId: "lst_byproduct_flyash",
    bidderOrgId: "org_banmore_cement",
    amount: lakh(0.0115),
    message: "We can lift 2,000 t/month against our PPC blend. Own bulkers.",
    status: BidStatus.ACTIVE,
  },
  {
    id: "bid_flyash_ecocycle",
    listingId: "lst_byproduct_flyash",
    bidderOrgId: "org_ecocycle",
    amount: lakh(0.0104),
    message: "Full 4,200 t/month offtake for AAC block production. Single contract, no split.",
    status: BidStatus.ACTIVE,
  },

  // Forward auction on raw material.
  {
    id: "bid_tmt_chambal",
    listingId: "lst_raw_tmt",
    bidderOrgId: "org_chambal_steel",
    amount: lakh(0.552),
    status: BidStatus.ACTIVE,
  },
  {
    id: "bid_tmt_pithampur",
    listingId: "lst_raw_tmt",
    bidderOrgId: "org_pithampur_auto",
    amount: lakh(0.561),
    message: "Can lift the full 140 t in one movement.",
    status: BidStatus.ACTIVE,
  },

  // Equipment.
  {
    id: "bid_vmc_gwalior",
    listingId: "lst_equip_vmc",
    bidderOrgId: "org_gwalior_ferrous",
    amount: 1580,
    message: "Need roughly 120 hours over three weeks. Our own programmer, your operator.",
    status: BidStatus.ACTIVE,
  },

  // Labour — reverse auction, contractors competing down.
  {
    id: "bid_welders_ecocycle",
    listingId: "lst_labour_welders",
    bidderOrgId: "org_ecocycle",
    amount: 2690,
    message: "Six ASME IX welders available from the 12th. Shutdown experience at two thermal stations.",
    status: BidStatus.ACTIVE,
  },

  // --- Winning bids behind the seeded deals -------------------------------
  {
    id: "bid_billets_trishul",
    listingId: "lst_freight_gwalior_mandideep",
    bidderOrgId: "org_trishul_logistics",
    amount: lakh(0.535),
    message: "Flatbed with lashing certified for billets.",
    status: BidStatus.ACCEPTED,
  },
  {
    id: "bid_parts_mp_cargo",
    listingId: "lst_freight_pithampur_malanpur",
    bidderOrgId: "org_mp_cargo",
    amount: lakh(0.412),
    message: "Return leg, we are empty back to Malanpur anyway.",
    status: BidStatus.ACCEPTED,
  },
  // These four sit behind deals in the other four markets — proof the engine
  // is genuinely shared rather than freight-only.
  {
    id: "bid_quartz_pithampur",
    listingId: "lst_raw_quartz",
    bidderOrgId: "org_pithampur_auto",
    amount: lakh(0.041),
    message: "Full 90 t against our Q3 ceramic core requirement.",
    status: BidStatus.ACCEPTED,
  },
  {
    id: "bid_crane_banmore",
    listingId: "lst_equip_crane",
    bidderOrgId: "org_banmore_cement",
    amount: 3450,
    message: "Kiln shell segment lift, two days. Our riggers, your operator.",
    status: BidStatus.ACCEPTED,
  },
  {
    id: "bid_electricians_ecocycle",
    listingId: "lst_labour_electricians",
    bidderOrgId: "org_ecocycle",
    amount: 1875,
    message: "Four licensed panel electricians, VFD commissioning experience.",
    status: BidStatus.ACCEPTED,
  },
  {
    id: "bid_millscale_ecocycle",
    listingId: "lst_byproduct_millscale",
    bidderOrgId: "org_ecocycle",
    amount: lakh(0.118),
    message: "Monthly offtake for briquetting feed.",
    status: BidStatus.ACCEPTED,
  },
] as const;

// ---------------------------------------------------------------------------
// Deals — one parked at each lifecycle state
// ---------------------------------------------------------------------------

/**
 * `path` is walked in order to build the DealEvent audit log, so each deal
 * carries a believable history rather than appearing fully-formed. The last
 * element is the deal's current state.
 */
const DEALS = [
  {
    id: "deal_billets",
    listingId: "lst_freight_gwalior_mandideep",
    buyerOrgId: "org_gwalior_ferrous",
    sellerOrgId: "org_trishul_logistics",
    winningBidId: "bid_billets_trishul",
    price: lakh(0.535),
    path: [DealState.LISTED, DealState.BIDDING, DealState.ACCEPTED],
    // actor for each transition after LISTED
    actors: ["org_trishul_logistics", "org_gwalior_ferrous"],
    notes: ["Bid submitted", "Owner accepted — identities revealed to both parties"],
    ageHours: 20,
  },
  {
    id: "deal_parts",
    listingId: "lst_freight_pithampur_malanpur",
    buyerOrgId: "org_pithampur_auto",
    sellerOrgId: "org_mp_cargo",
    winningBidId: "bid_parts_mp_cargo",
    price: lakh(0.412),
    path: [
      DealState.LISTED,
      DealState.BIDDING,
      DealState.COUNTERED,
      DealState.ACCEPTED,
      DealState.CONTRACTED,
      DealState.IN_EXECUTION,
      DealState.SETTLED,
      DealState.RATED,
    ],
    actors: [
      "org_mp_cargo",
      "org_pithampur_auto",
      "org_mp_cargo",
      "org_pithampur_auto",
      "org_mp_cargo",
      "org_pithampur_auto",
      "org_pithampur_auto",
    ],
    notes: [
      "Bid submitted at ₹44,000",
      "Owner countered at ₹41,200",
      "Bidder accepted the counter — identities revealed",
      "Contract generated (stub e-way bill IM-EWB-88214)",
      "Vehicle loaded and departed Pithampur",
      "Delivered and POD uploaded; payment released from escrow (stub)",
      "Both parties rated",
    ],
    ageHours: 240,
  },

  // --- One deal per remaining lifecycle state, spread across the other four
  // --- markets. Same engine, different market — that is the whole thesis.
  {
    id: "deal_quartz",
    listingId: "lst_raw_quartz",
    buyerOrgId: "org_pithampur_auto",
    sellerOrgId: "org_malwa_minerals",
    winningBidId: "bid_quartz_pithampur",
    price: lakh(0.041),
    path: [DealState.LISTED, DealState.BIDDING, DealState.ACCEPTED, DealState.CONTRACTED],
    actors: ["org_pithampur_auto", "org_malwa_minerals", "org_malwa_minerals"],
    notes: [
      "Bid submitted at ₹4,100/t",
      "Seller accepted — identities revealed",
      "Supply contract issued (stub GST invoice IM-INV-40912)",
    ],
    ageHours: 52,
  },
  {
    id: "deal_crane",
    listingId: "lst_equip_crane",
    buyerOrgId: "org_banmore_cement",
    sellerOrgId: "org_chambal_steel",
    winningBidId: "bid_crane_banmore",
    price: 3450,
    path: [
      DealState.LISTED,
      DealState.BIDDING,
      DealState.ACCEPTED,
      DealState.CONTRACTED,
      DealState.IN_EXECUTION,
    ],
    actors: ["org_banmore_cement", "org_chambal_steel", "org_chambal_steel", "org_chambal_steel"],
    notes: [
      "Bid submitted at ₹3,450/hr",
      "Owner accepted — identities revealed",
      "Hire agreement issued, insurance rider attached (stub)",
      "Crane mobilised to Banmore, kiln shell lift underway",
    ],
    ageHours: 96,
  },
  {
    id: "deal_electricians",
    listingId: "lst_labour_electricians",
    buyerOrgId: "org_gwalior_ferrous",
    sellerOrgId: "org_ecocycle",
    winningBidId: "bid_electricians_ecocycle",
    price: 1875,
    path: [
      DealState.LISTED,
      DealState.BIDDING,
      DealState.COUNTERED,
      DealState.ACCEPTED,
      DealState.CONTRACTED,
      DealState.IN_EXECUTION,
      DealState.SETTLED,
    ],
    actors: [
      "org_ecocycle",
      "org_gwalior_ferrous",
      "org_ecocycle",
      "org_gwalior_ferrous",
      "org_ecocycle",
      "org_gwalior_ferrous",
    ],
    notes: [
      "Bid submitted at ₹1,950/shift",
      "Buyer countered at ₹1,875/shift",
      "Contractor accepted the counter — identities revealed",
      "Work order issued, site induction scheduled",
      "Crew on site, panel rewiring in progress",
      "Job signed off, payment released from escrow (stub)",
    ],
    ageHours: 400,
  },
  {
    id: "deal_millscale",
    listingId: "lst_byproduct_millscale",
    buyerOrgId: "org_ecocycle",
    sellerOrgId: "org_gwalior_ferrous",
    winningBidId: "bid_millscale_ecocycle",
    price: lakh(0.118),
    path: [DealState.LISTED, DealState.BIDDING, DealState.ACCEPTED, DealState.CANCELLED],
    actors: ["org_ecocycle", "org_gwalior_ferrous", "org_ecocycle"],
    notes: [
      "Bid submitted at ₹11,800/t",
      "Seller accepted — identities revealed",
      "Buyer cancelled: briquetting line down for unplanned maintenance",
    ],
    ageHours: 130,
  },
] as const;

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

async function main() {
  console.log("→ Clearing existing data…");
  // Order matters: children before parents.
  await prisma.rating.deleteMany();
  await prisma.dealEvent.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.organisation.deleteMany();

  console.log("→ Seeding organisations…");
  for (const org of ORGS) {
    await prisma.organisation.create({ data: { ...org, verified: true } });
  }

  console.log("→ Seeding listings…");
  for (const listing of LISTINGS) {
    await prisma.listing.create({
      data: { ...listing, spec: listing.spec as object },
    });
  }

  console.log("→ Seeding bids…");
  for (const bid of BIDS) {
    await prisma.bid.create({ data: { ...bid } });
  }

  console.log("→ Seeding deals and their audit trails…");
  for (const deal of DEALS) {
    const finalState = deal.path[deal.path.length - 1];
    const created = new Date(now.getTime() - deal.ageHours * 60 * 60 * 1000);

    await prisma.deal.create({
      data: {
        id: deal.id,
        listingId: deal.listingId,
        buyerOrgId: deal.buyerOrgId,
        sellerOrgId: deal.sellerOrgId,
        winningBidId: deal.winningBidId,
        price: deal.price,
        state: finalState,
        createdAt: created,
      },
    });

    // Walk the path, writing one DealEvent per transition.
    const stepMs = (deal.ageHours * 60 * 60 * 1000) / Math.max(deal.path.length, 1);
    for (let i = 1; i < deal.path.length; i++) {
      await prisma.dealEvent.create({
        data: {
          dealId: deal.id,
          fromState: deal.path[i - 1],
          toState: deal.path[i],
          actorOrgId: deal.actors[i - 1],
          note: deal.notes[i - 1],
          createdAt: new Date(created.getTime() + stepMs * i),
        },
      });
    }
  }

  console.log("→ Seeding ratings…");
  await prisma.rating.create({
    data: {
      dealId: "deal_parts",
      raterOrgId: "org_pithampur_auto",
      ratedOrgId: "org_mp_cargo",
      score: 5,
      comment: "On time, clean paperwork, driver called ahead. Would use again.",
    },
  });
  await prisma.rating.create({
    data: {
      dealId: "deal_parts",
      raterOrgId: "org_mp_cargo",
      ratedOrgId: "org_pithampur_auto",
      score: 4,
      comment: "Loading bay held us up by two hours, otherwise straightforward.",
    },
  });

  // ---- Verification --------------------------------------------------------
  const [orgs, listings, bids, deals, events, ratings] = await Promise.all([
    prisma.organisation.count(),
    prisma.listing.count(),
    prisma.bid.count(),
    prisma.deal.count(),
    prisma.dealEvent.count(),
    prisma.rating.count(),
  ]);

  const byType = await prisma.listing.groupBy({
    by: ["type"],
    _count: { _all: true },
  });
  const byState = await prisma.deal.groupBy({
    by: ["state"],
    _count: { _all: true },
  });

  console.log("\n─────────── SEED COMPLETE ───────────");
  console.log(`organisations : ${orgs}`);
  console.log(`listings      : ${listings}`);
  console.log(`bids          : ${bids}`);
  console.log(`deals         : ${deals}`);
  console.log(`deal events   : ${events}`);
  console.log(`ratings       : ${ratings}`);
  console.log("\nlistings by market:");
  for (const row of byType) console.log(`  ${row.type.padEnd(14)} ${row._count._all}`);
  console.log("\ndeals by lifecycle state:");
  for (const row of byState) console.log(`  ${row.state.padEnd(14)} ${row._count._all}`);
  console.log("─────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error("SEED FAILED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
