/**
 * AI-driven byproduct symbiosis matching.
 *
 * THE POINT: a byproduct is listed by SPECIFICATION, never by name. Nobody
 * searches for "slag". So the matcher is given the composition, physical form,
 * moisture, contaminants and source process — and NOT the listing title, which
 * would give the answer away. It has to work outward from chemistry to the
 * industries that can eat it.
 *
 * That is a deliberate handicap. It is also the proof of concept: the platform never told
 * the model the words "fly ash", and the model came back with cement, bricks
 * and road base anyway.
 *
 * SECURITY (invariant 5 in CLAUDE.md): GEMINI_API_KEY is read from
 * process.env here, in a module that is only ever imported by a route handler.
 * It is never NEXT_PUBLIC_ and this file must never be imported by a client
 * component. The org roster sent upstream carries only fields that are already
 * public on every listing page — name, type, city. No legalName, no contact
 * details, no GSTIN ever leaves this server.
 */

import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import type { Listing, Organisation } from "@prisma/client";

import { prisma } from "./prisma";
import type { ByproductSpec } from "./listing-spec";

/**
 * Pinned deliberately, not `gemini-flash-latest`. An alias can move under us
 * between deployments, and the one thing worse than a slow matcher is
 * one that behaved differently ten minutes ago.
 */
export const SYMBIOSIS_MODEL = "gemini-3.6-flash";

// ---------------------------------------------------------------------------
// Result shapes
// ---------------------------------------------------------------------------

export type MatchConfidence = "HIGH" | "MEDIUM" | "LOW";

/** One industrial use the material can be sold into. */
export interface SymbiosisMatch {
  industry: string;
  application: string;
  /** Why this composition suits this use, in one operator-readable sentence. */
  whyItFits: string;
  /** The virgin input it displaces — the reason anyone pays for waste. */
  substitutesFor: string;
  valueLowInrPerTonne: number;
  valueHighInrPerTonne: number;
  /** "None — as received", or the treatment step required first. */
  processingRequired: string;
  /** Indian standard or regulation that governs the use, if any. */
  standard: string;
  confidence: MatchConfidence;
}

/** A match against an organisation that is already on IndusMate. */
export interface OnPlatformMatch {
  orgId: string;
  name: string;
  type: Organisation["type"];
  city: string;
  verified: boolean;
  rating: number;
  dealCount: number;
  /** Which of the industry matches above this org corresponds to. */
  reason: string;
}

export interface SymbiosisResult {
  /** What the model believes the material is, from composition alone. */
  identifiedMaterial: string;
  /** The evidence it used. Shown so a judge can check the reasoning. */
  identificationBasis: string;
  identificationConfidence: MatchConfidence;
  matches: SymbiosisMatch[];
  onPlatform: OnPlatformMatch[];
  /** Handling, regulatory or contamination warnings. */
  cautions: string[];
  model: string;
  /** ISO timestamp of generation. */
  generatedAt: string;
  /** True when served from the in-process cache rather than a fresh call. */
  cached: boolean;
}

/** Typed failure so the route can pick a status code and a human message. */
export class SymbiosisError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "SymbiosisError";
  }
}

// ---------------------------------------------------------------------------
// The response schema — strict JSON, not prose we then regex
// ---------------------------------------------------------------------------

const CONFIDENCE = ["HIGH", "MEDIUM", "LOW"] as const;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  required: [
    "identifiedMaterial",
    "identificationBasis",
    "identificationConfidence",
    "matches",
    "onPlatform",
    "cautions",
  ],
  properties: {
    identifiedMaterial: {
      type: Type.STRING,
      description:
        "The common industrial name of this material, deduced from composition and source process. E.g. 'Class F fly ash'.",
    },
    identificationBasis: {
      type: Type.STRING,
      description:
        "One sentence naming the specific figures that led to that identification.",
    },
    identificationConfidence: { type: Type.STRING, enum: [...CONFIDENCE] },
    matches: {
      type: Type.ARRAY,
      description:
        "Four or five distinct industries that can consume this as feedstock. Each entry is one industry, never a merged pair.",
      items: {
        type: Type.OBJECT,
        required: [
          "industry",
          "application",
          "whyItFits",
          "substitutesFor",
          "valueLowInrPerTonne",
          "valueHighInrPerTonne",
          "processingRequired",
          "standard",
          "confidence",
        ],
        properties: {
          industry: { type: Type.STRING, description: "E.g. 'Cement manufacturing'." },
          application: {
            type: Type.STRING,
            description: "The specific use, e.g. 'Pozzolanic replacement in PPC clinker grinding'.",
          },
          whyItFits: {
            type: Type.STRING,
            description:
              "One sentence citing the actual numbers from the specification given.",
          },
          substitutesFor: {
            type: Type.STRING,
            description: "The virgin input displaced, e.g. 'OPC clinker'.",
          },
          valueLowInrPerTonne: {
            type: Type.INTEGER,
            description: "Realistic Indian ex-works floor price per tonne, INR.",
          },
          valueHighInrPerTonne: {
            type: Type.INTEGER,
            description: "Realistic Indian ex-works ceiling price per tonne, INR.",
          },
          processingRequired: {
            type: Type.STRING,
            description: "'None — usable as received' or the treatment needed first.",
          },
          standard: {
            type: Type.STRING,
            description:
              "Governing Indian standard or rule, e.g. 'IS 3812 Part 1'. 'No specific standard' if none.",
          },
          confidence: { type: Type.STRING, enum: [...CONFIDENCE] },
        },
      },
    },
    onPlatform: {
      type: Type.ARRAY,
      description:
        "Organisations from the supplied roster that could consume this. Empty array if none genuinely fit. Never invent an id.",
      items: {
        type: Type.OBJECT,
        required: ["orgId", "reason"],
        properties: {
          orgId: { type: Type.STRING, description: "Must be copied exactly from the roster." },
          reason: {
            type: Type.STRING,
            description:
              "One sentence linking this organisation's business to one of the matches above.",
          },
        },
      },
    },
    cautions: {
      type: Type.ARRAY,
      description: "Handling, contamination or regulatory warnings. Empty if genuinely none.",
      items: { type: Type.STRING },
    },
  },
};

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const SYSTEM_INSTRUCTION = `You are an industrial ecology analyst working on byproduct symbiosis in India.

You receive a waste stream described ONLY by its measured specification. You are never told what it is called. Deduce the material from its chemistry and source process, then identify which industries can consume it as feedstock.

Rules:
- Reason from the composition figures given. Cite them.
- Return four or five DISTINCT consuming industries. Never merge two industries into one entry — cement manufacturing, ready-mix concrete, brick making and road construction are four separate answers, not one.
- Indian context only. Prices are ex-works INR per tonne at Indian market rates, not global averages. A material that is a disposal cost may legitimately carry a low value — say so rather than inflating it.
- Cite the governing Indian standard where one exists (IS codes, MoEFCC/CPCB rules, the Fly Ash Utilisation Notification, SPCB authorisation for hazardous categories).
- If the hazard class is anything other than non-hazardous, say what that restricts.
- Match against the supplied organisation roster only where the fit is real. An empty onPlatform array is a correct answer. Copy orgId values exactly; never invent one.
- Be concrete and brief. An operations manager reads this on a phone.`;

function buildPrompt(input: {
  spec: ByproductSpec;
  quantity: number;
  unit: string;
  locationCity: string;
  roster: RosterEntry[];
}): string {
  const { spec, roster } = input;

  return `## Waste stream specification

- Chemical composition: ${spec.composition}
- Physical form: ${spec.physicalForm}
- Moisture content: ${spec.moisturePct}%
- Known contaminants: ${spec.contaminants.length ? spec.contaminants.join("; ") : "none declared"}
- Available volume: ${spec.monthlyVolumeTonnes} tonnes per month
- Hazard class: ${spec.hazardClass}
- Source process: ${spec.sourceProcess}
- Located at: ${input.locationCity}, Madhya Pradesh, India
- Listed quantity: ${input.quantity} ${input.unit}

The name of this material has been deliberately withheld. Deduce it.

## Organisations currently on the platform

${roster.map((o) => `- ${o.id} | ${o.name} | ${o.type} | ${o.city}`).join("\n")}

Return three to five consuming industries ranked by how well they fit this exact specification, and any organisations from the roster above that could genuinely take it.`;
}

// ---------------------------------------------------------------------------
// The roster — public fields only
// ---------------------------------------------------------------------------

export interface RosterEntry {
  id: string;
  name: string;
  type: Organisation["type"];
  city: string;
}

/**
 * Organisations the matcher may consider.
 *
 * The select is explicit and narrow on purpose. This data leaves our server
 * for a third-party API, so it carries only what is already printed on every
 * public listing page. Adding a field here sends it to Google — think first.
 */
async function loadRoster(excludeOrgId: string): Promise<RosterEntry[]> {
  return prisma.organisation.findMany({
    where: { id: { not: excludeOrgId } },
    select: { id: true, name: true, type: true, city: true },
    orderBy: { name: "asc" },
  });
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

/**
 * In-process cache, keyed by listing id and its updatedAt stamp so an edited
 * listing re-matches automatically.
 *
 * Performance optimisation: a repeated request for the same unchanged listing
 * returns instantly instead of making a redundant API call, and repeated
 * requests do not consume API quota unnecessarily. It is deliberately not
 * Redis — a Map dies with the process, which is the correct lifetime for
 * something this cheap to recompute.
 */
const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = new Map<string, { at: number; result: SymbiosisResult }>();

function cacheKey(listing: Listing): string {
  return `${listing.id}:${listing.updatedAt.getTime()}`;
}

/** Exposed for tests and for the seed-refresh path. */
export function clearSymbiosisCache(): void {
  cache.clear();
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * Match one byproduct listing against consuming industries and against
 * organisations already on the platform.
 *
 * Throws SymbiosisError with a status the route can pass straight through.
 * Never returns fabricated matches on failure — a wrong answer presented
 * confidently is worse than an honest error card.
 */
export async function findSymbiosisMatches(
  listing: Listing,
  opts: { force?: boolean } = {},
): Promise<SymbiosisResult> {
  if (listing.type !== "BYPRODUCT") {
    throw new SymbiosisError(
      "Symbiosis matching only applies to byproduct listings.",
      400,
    );
  }

  const key = cacheKey(listing);
  if (!opts.force) {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      return { ...hit.result, cached: true };
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new SymbiosisError(
      "The matcher is not configured on this deployment — GEMINI_API_KEY is missing.",
      503,
    );
  }

  const spec = listing.spec as unknown as ByproductSpec;
  if (!spec?.composition || !spec?.sourceProcess) {
    throw new SymbiosisError(
      "This listing has no composition or source process recorded, so there is nothing to match on.",
      422,
    );
  }

  const roster = await loadRoster(listing.ownerOrgId);

  const ai = new GoogleGenAI({ apiKey });

  let text: string | undefined;
  try {
    const response = await ai.models.generateContent({
      model: SYMBIOSIS_MODEL,
      contents: buildPrompt({
        spec,
        quantity: listing.quantity,
        unit: listing.unit,
        locationCity: listing.locationCity,
        roster,
      }),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        // Low but not zero: the numbers should be stable across runs,
        // while the prose stays readable.
        temperature: 0.2,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });
    text = response.text;
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    // Quota and key problems are the two that actually happen on a free tier.
    if (/quota|RESOURCE_EXHAUSTED|429/i.test(detail)) {
      throw new SymbiosisError(
        "The matcher has hit its free-tier rate limit. Wait a minute and try again.",
        429,
      );
    }
    if (/API key|API_KEY_INVALID|PERMISSION_DENIED|401|403/i.test(detail)) {
      throw new SymbiosisError(
        "The matcher's API key was rejected. Check GEMINI_API_KEY on this deployment.",
        502,
      );
    }
    throw new SymbiosisError(`The matcher could not be reached: ${detail}`, 502);
  }

  if (!text) {
    throw new SymbiosisError("The matcher returned an empty response.", 502);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new SymbiosisError("The matcher returned a response we could not read.", 502);
  }

  const result = await normalise(raw, roster);
  cache.set(key, { at: Date.now(), result });
  return result;
}

// ---------------------------------------------------------------------------
// Normalisation — the model is an untrusted input source
// ---------------------------------------------------------------------------

export function str(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

export function int(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

export function confidence(v: unknown): MatchConfidence {
  const s = String(v).toUpperCase();
  return s === "HIGH" || s === "MEDIUM" || s === "LOW" ? s : "MEDIUM";
}

/**
 * Turn the model's raw `matches` array into our type, discarding anything
 * malformed. Pure — no I/O — so it is exercised directly in tests rather
 * than through a live API call.
 */
export function normaliseMatches(raw: unknown): SymbiosisMatch[] {
  return Array.isArray(raw)
    ? raw
        .map((m) => {
          const r = (m ?? {}) as Record<string, unknown>;
          const industry = str(r.industry);
          if (!industry) return null;

          const low = int(r.valueLowInrPerTonne);
          const high = int(r.valueHighInrPerTonne);

          return {
            industry,
            application: str(r.application, "—"),
            whyItFits: str(r.whyItFits, ""),
            substitutesFor: str(r.substitutesFor, "—"),
            // Guard the ordering rather than trusting it: a reversed range
            // renders as a nonsense price band.
            valueLowInrPerTonne: Math.min(low, high),
            valueHighInrPerTonne: Math.max(low, high),
            processingRequired: str(r.processingRequired, "Not stated"),
            standard: str(r.standard, "No specific standard"),
            confidence: confidence(r.confidence),
          } satisfies SymbiosisMatch;
        })
        .filter((m): m is SymbiosisMatch => m !== null)
    : [];
}

/**
 * Which of the model's claimed on-platform matches are legitimate — i.e.
 * their orgId was actually in the roster we sent, deduplicated. Pure — the
 * DB fetch of display fields is a separate step in `normalise` below, kept
 * out of this function so the trust boundary is unit-testable without a
 * database.
 */
export function verifyOnPlatformClaims(
  raw: unknown,
  roster: RosterEntry[],
): Map<string, string> {
  const rosterIds = new Set(roster.map((o) => o.id));
  const claimed = Array.isArray(raw) ? raw : [];

  const wanted = new Map<string, string>();
  for (const entry of claimed) {
    const r = (entry ?? {}) as Record<string, unknown>;
    const orgId = str(r.orgId);
    if (!orgId || !rosterIds.has(orgId) || wanted.has(orgId)) continue;
    wanted.set(orgId, str(r.reason, "Matched on the material specification."));
  }
  return wanted;
}

/**
 * Turn the model's JSON into our types, discarding anything malformed.
 *
 * The important step is the on-platform pass: every orgId the model returned
 * is checked against the roster we actually sent, and any it invented is
 * dropped. A hallucinated business partner on a live platform would be a worse
 * failure than no match at all. The org fields shown come from our database,
 * never from the model's echo of them.
 */
async function normalise(raw: unknown, roster: RosterEntry[]): Promise<SymbiosisResult> {
  const obj = (raw ?? {}) as Record<string, unknown>;

  const matches = normaliseMatches(obj.matches);

  if (matches.length === 0) {
    throw new SymbiosisError(
      "The matcher could not identify a use for this specification. Add more detail to the composition and try again.",
      422,
    );
  }

  const wanted = verifyOnPlatformClaims(obj.onPlatform, roster);

  let onPlatform: OnPlatformMatch[] = [];
  if (wanted.size > 0) {
    const orgs = await prisma.organisation.findMany({
      where: { id: { in: [...wanted.keys()] } },
      // Reputation, not identity. This renders on a public listing page.
      select: {
        id: true,
        name: true,
        type: true,
        city: true,
        verified: true,
        rating: true,
        dealCount: true,
      },
    });
    onPlatform = orgs.map((o) => ({
      orgId: o.id,
      name: o.name,
      type: o.type,
      city: o.city,
      verified: o.verified,
      rating: o.rating,
      dealCount: o.dealCount,
      reason: wanted.get(o.id) ?? "",
    }));
  }

  return {
    identifiedMaterial: str(obj.identifiedMaterial, "Unidentified material"),
    identificationBasis: str(obj.identificationBasis, ""),
    identificationConfidence: confidence(obj.identificationConfidence),
    matches,
    onPlatform,
    cautions: Array.isArray(obj.cautions)
      ? obj.cautions.map((c) => str(c)).filter(Boolean)
      : [],
    model: SYMBIOSIS_MODEL,
    generatedAt: new Date().toISOString(),
    cached: false,
  };
}
