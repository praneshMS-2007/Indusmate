/**
 * The typed spec payload for each of the five markets.
 *
 * This file is the reason there is one `Listing` table instead of five. The
 * database stores `spec` as an opaque JSON column; this discriminated union,
 * keyed on `type`, is what gives it a shape.
 *
 * It also drives the UI: `SPEC_FIELDS` below is read by the single listing
 * creation form to decide which inputs to render. Adding a sixth market means
 * adding a variant here and an enum value in schema.prisma — no new table, no
 * new form, no new endpoint.
 */

export const LISTING_TYPES = [
  "RAW_MATERIAL",
  "BYPRODUCT",
  "EQUIPMENT",
  "LABOUR",
  "FREIGHT",
] as const;

export type ListingType = (typeof LISTING_TYPES)[number];

// ---------------------------------------------------------------------------
// The five spec shapes
// ---------------------------------------------------------------------------

export interface RawMaterialSpec {
  type: "RAW_MATERIAL";
  grade: string;
  physicalForm: string;
  purityPct: number;
  packaging: string;
  hsnCode: string;
  minOrderQtyTonnes: number;
}

export interface ByproductSpec {
  type: "BYPRODUCT";
  /** Free-text chemical breakdown, e.g. "SiO2 58%, Al2O3 27%, Fe2O3 6%". */
  composition: string;
  physicalForm: string;
  moisturePct: number;
  /** Comma-separated in the form; stored as an array. */
  contaminants: string[];
  monthlyVolumeTonnes: number;
  hazardClass: string;
  /** The process that produced it — the strongest matching signal. */
  sourceProcess: string;
}

export interface EquipmentSpec {
  type: "EQUIPMENT";
  machineType: string;
  make: string;
  model: string;
  capacity: string;
  yearOfManufacture: number;
  operatorIncluded: boolean;
  minimumHours: number;
  mobilisationRadiusKm: number;
}

export interface LabourSpec {
  type: "LABOUR";
  trade: string;
  certifications: string[];
  headcount: number;
  shiftHours: number;
  experienceYears: number;
  safetyTrained: boolean;
}

export interface FreightSpec {
  type: "FREIGHT";
  cargoType: string;
  weightTonnes: number;
  volumeCbm: number;
  vehicleType: string;
  /** Full Truck Load or Less-than Truck Load. */
  loadType: "FTL" | "LTL";
  hazmat: boolean;
  distanceKm: number;
}

export type ListingSpec =
  | RawMaterialSpec
  | ByproductSpec
  | EquipmentSpec
  | LabourSpec
  | FreightSpec;

/** Narrows the union to the variant matching `T`. */
export type SpecFor<T extends ListingType> = Extract<ListingSpec, { type: T }>;

// ---------------------------------------------------------------------------
// Market metadata
// ---------------------------------------------------------------------------

export interface ListingTypeMeta {
  label: string;
  /** One line, shown under the type picker in the creation form. */
  blurb: string;
  /** Default auction direction. Reverse = price competes down. */
  defaultDirection: "REVERSE" | "FORWARD";
  defaultUnit: string;
  /**
   * Full, static Tailwind classes. NOT a colour stem to interpolate —
   * Tailwind scans source text at build time, so `text-${stem}-400` is
   * purged and renders colourless.
   */
  badgeClass: string;
  /** Hex for the Leaflet map markers in Block 5, which cannot use classes. */
  markerColor: string;
  /** Does this market have a destination as well as an origin? */
  hasDestination: boolean;
}

export const LISTING_TYPE_META: Record<ListingType, ListingTypeMeta> = {
  RAW_MATERIAL: {
    label: "Raw Material",
    blurb: "Suppliers list stock; manufacturers bid to buy.",
    defaultDirection: "REVERSE",
    defaultUnit: "tonnes",
    badgeClass: "border-amber-500/40 text-amber-400",
    markerColor: "#f59e0b",
    hasDestination: false,
  },
  BYPRODUCT: {
    label: "Industrial Byproduct",
    blurb: "List waste by specification. Other plants buy it as feedstock.",
    defaultDirection: "FORWARD",
    defaultUnit: "tonnes/month",
    badgeClass: "border-teal-500/40 text-teal-400",
    markerColor: "#2dd4bf",
    hasDestination: false,
  },
  EQUIPMENT: {
    label: "Equipment Sharing",
    blurb: "Rent out idle machinery by the hour.",
    defaultDirection: "FORWARD",
    defaultUnit: "hours",
    badgeClass: "border-sky-500/40 text-sky-400",
    markerColor: "#38bdf8",
    hasDestination: false,
  },
  LABOUR: {
    label: "Skilled Labour",
    blurb: "Certified technicians booked in scheduled blocks.",
    defaultDirection: "REVERSE",
    defaultUnit: "shifts",
    badgeClass: "border-violet-500/40 text-violet-400",
    markerColor: "#a78bfa",
    hasDestination: false,
  },
  FREIGHT: {
    label: "Freight",
    blurb: "Post an A-to-B transit need; transporters bid it down.",
    defaultDirection: "REVERSE",
    defaultUnit: "tonnes",
    badgeClass: "border-rose-500/40 text-rose-400",
    markerColor: "#fb7185",
    hasDestination: true,
  },
};

// ---------------------------------------------------------------------------
// Form field descriptors — read by the ONE creation form
// ---------------------------------------------------------------------------

export type SpecFieldKind = "text" | "number" | "boolean" | "select" | "list";

export interface SpecField {
  /** Key within the spec object. */
  name: string;
  label: string;
  kind: SpecFieldKind;
  placeholder?: string;
  /** Hint rendered under the input. */
  help?: string;
  options?: readonly string[];
  required?: boolean;
  /** Suffix shown inside number inputs, e.g. "%" or "km". */
  suffix?: string;
}

/**
 * Which inputs the creation form renders for each market.
 *
 * The form maps over this array. There are not five forms — there is one form
 * and this table.
 */
export const SPEC_FIELDS: Record<ListingType, readonly SpecField[]> = {
  RAW_MATERIAL: [
    { name: "grade", label: "Grade", kind: "text", placeholder: "Fe 500D", required: true },
    {
      name: "physicalForm",
      label: "Physical form",
      kind: "select",
      options: ["Powder", "Granules", "Lumps", "Billets", "Coils", "Sheets", "Liquid"],
      required: true,
    },
    { name: "purityPct", label: "Purity", kind: "number", suffix: "%", required: true },
    {
      name: "packaging",
      label: "Packaging",
      kind: "select",
      options: ["Loose / bulk", "50kg bags", "1 tonne jumbo bags", "Drums", "Bundled"],
      required: true,
    },
    { name: "hsnCode", label: "HSN code", kind: "text", placeholder: "7214", required: true },
    { name: "minOrderQtyTonnes", label: "Minimum order", kind: "number", suffix: "t", required: true },
  ],

  // Listed by SPECIFICATION, never by name — nobody searches for "slag".
  // These are the exact fields fed to the Gemini symbiosis matcher.
  BYPRODUCT: [
    {
      name: "composition",
      label: "Chemical composition",
      kind: "text",
      placeholder: "SiO2 58%, Al2O3 27%, Fe2O3 6%, CaO 3%",
      help: "The single strongest matching signal. Be specific — this is what the AI matcher reads.",
      required: true,
    },
    {
      name: "physicalForm",
      label: "Physical form",
      kind: "select",
      options: ["Fine powder", "Coarse powder", "Granules", "Slag / aggregate", "Sludge", "Slurry", "Scale"],
      required: true,
    },
    { name: "moisturePct", label: "Moisture content", kind: "number", suffix: "%", required: true },
    {
      name: "contaminants",
      label: "Known contaminants",
      kind: "list",
      placeholder: "Unburnt carbon, trace heavy metals",
      help: "Comma-separated. Write \"None\" if clean.",
    },
    { name: "monthlyVolumeTonnes", label: "Monthly volume", kind: "number", suffix: "t/mo", required: true },
    {
      name: "hazardClass",
      label: "Hazard class",
      kind: "select",
      options: ["Non-hazardous", "Category A - inert", "Category B - reactive", "Category C - toxic"],
      required: true,
    },
    {
      name: "sourceProcess",
      label: "Source process",
      kind: "text",
      placeholder: "Coal-fired boiler, ESP hopper collection",
      help: "How the material was produced. Determines what it can safely feed.",
      required: true,
    },
  ],

  EQUIPMENT: [
    { name: "machineType", label: "Machine type", kind: "text", placeholder: "CNC vertical machining centre", required: true },
    { name: "make", label: "Make", kind: "text", placeholder: "Jyoti", required: true },
    { name: "model", label: "Model", kind: "text", placeholder: "VMC 850", required: true },
    { name: "capacity", label: "Capacity / envelope", kind: "text", placeholder: "800 x 500 x 500 mm" },
    { name: "yearOfManufacture", label: "Year of manufacture", kind: "number", required: true },
    { name: "operatorIncluded", label: "Operator included", kind: "boolean" },
    { name: "minimumHours", label: "Minimum booking", kind: "number", suffix: "hrs", required: true },
    { name: "mobilisationRadiusKm", label: "Mobilisation radius", kind: "number", suffix: "km" },
  ],

  LABOUR: [
    { name: "trade", label: "Trade", kind: "text", placeholder: "Certified welder - 6G pipe", required: true },
    {
      name: "certifications",
      label: "Certifications",
      kind: "list",
      placeholder: "ASME IX, AWS D1.1",
      help: "Comma-separated.",
    },
    { name: "headcount", label: "Headcount", kind: "number", required: true },
    { name: "shiftHours", label: "Shift length", kind: "number", suffix: "hrs", required: true },
    { name: "experienceYears", label: "Minimum experience", kind: "number", suffix: "yrs" },
    { name: "safetyTrained", label: "Safety trained", kind: "boolean" },
  ],

  FREIGHT: [
    { name: "cargoType", label: "Cargo type", kind: "text", placeholder: "Palletised auto components", required: true },
    { name: "weightTonnes", label: "Weight", kind: "number", suffix: "t", required: true },
    { name: "volumeCbm", label: "Volume", kind: "number", suffix: "cbm" },
    {
      name: "vehicleType",
      label: "Vehicle required",
      kind: "select",
      options: ["32ft multi-axle", "22ft container", "19ft truck", "14ft tempo", "Trailer / flatbed", "Tanker"],
      required: true,
    },
    { name: "loadType", label: "Load type", kind: "select", options: ["FTL", "LTL"], required: true },
    { name: "hazmat", label: "Hazardous cargo", kind: "boolean" },
    { name: "distanceKm", label: "Distance", kind: "number", suffix: "km", required: true },
  ],
} as const;

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Coerce a raw form/JSON body into a typed spec for `type`.
 *
 * Deliberately forgiving about numeric strings (HTML inputs always yield
 * strings) and strict about missing required fields. Throws on invalid input
 * so the API route can return 400 rather than writing a malformed spec.
 */
export function parseSpec(type: ListingType, raw: unknown): ListingSpec {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("spec must be an object");
  }
  const input = raw as Record<string, unknown>;
  const out: Record<string, unknown> = { type };

  for (const field of SPEC_FIELDS[type]) {
    const value = input[field.name];

    if (value === undefined || value === null || value === "") {
      if (field.required) {
        throw new Error(`spec.${field.name} is required for ${type}`);
      }
      // Fill a type-appropriate empty so the shape stays stable.
      out[field.name] =
        field.kind === "number" ? 0 : field.kind === "boolean" ? false : field.kind === "list" ? [] : "";
      continue;
    }

    switch (field.kind) {
      case "number": {
        const n = typeof value === "number" ? value : Number(String(value).trim());
        if (Number.isNaN(n)) throw new Error(`spec.${field.name} must be a number`);
        out[field.name] = n;
        break;
      }
      case "boolean":
        out[field.name] = value === true || value === "true" || value === "on";
        break;
      case "list":
        out[field.name] = Array.isArray(value)
          ? value.map((v) => String(v).trim()).filter(Boolean)
          : String(value)
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean);
        break;
      case "select": {
        const s = String(value);
        if (field.options && !field.options.includes(s)) {
          throw new Error(`spec.${field.name} must be one of: ${field.options.join(", ")}`);
        }
        out[field.name] = s;
        break;
      }
      default:
        out[field.name] = String(value);
    }
  }

  // Built key-by-key from SPEC_FIELDS[type], so the shape is correct by
  // construction — but TypeScript cannot see that, hence the double cast.
  return out as unknown as ListingSpec;
}

/**
 * Read a spec back out of the database's Json column with its type narrowed.
 * Prisma returns `JsonValue`; the discriminant tells us which variant it is.
 */
export function readSpec(type: ListingType, json: unknown): ListingSpec {
  return { ...(json as object), type } as ListingSpec;
}

/**
 * Human-readable spec lines for listing cards and detail pages. Keeps display
 * logic out of components — one market's spec renders like any other's.
 */
export function specSummary(type: ListingType, json: unknown): Array<{ label: string; value: string }> {
  const spec = (json ?? {}) as Record<string, unknown>;
  return SPEC_FIELDS[type]
    .map((field) => {
      const raw = spec[field.name];
      if (raw === undefined || raw === null || raw === "") return null;

      let value: string;
      if (Array.isArray(raw)) {
        if (raw.length === 0) return null;
        value = raw.join(", ");
      } else if (typeof raw === "boolean") {
        value = raw ? "Yes" : "No";
      } else {
        value = String(raw);
      }
      if (field.suffix) value = `${value} ${field.suffix}`;

      return { label: field.label, value };
    })
    .filter((x): x is { label: string; value: string } => x !== null);
}
