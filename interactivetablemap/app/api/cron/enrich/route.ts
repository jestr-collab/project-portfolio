import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/** Max successful contact reveals per UTC day */
const DAILY_REVEAL_CAP = 50;
/** Only process signals at or above this score */
const MIN_SIGNAL_SCORE = 70;
/** Skip companies enriched within this many days */
const ENRICH_COOLDOWN_DAYS = 7;

/** One row per contact reveal for daily cap (rename to match your DB) */
const REVEALS_TABLE = "enrichment_contact_reveals";

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function startOfUtcDay(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

async function getRevealCountToday(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from(REVEALS_TABLE)
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfUtcDay());

  if (error) {
    console.error("[enrich] Failed to count daily reveals:", error.message);
    return 0;
  }
  return count ?? 0;
}

async function logContactReveal(
  supabase: SupabaseClient,
  companyId: string,
  signalId: string
): Promise<boolean> {
  const { error } = await supabase.from(REVEALS_TABLE).insert({
    company_id: companyId,
    signal_id: signalId,
  });

  if (error) {
    console.error("[enrich] Failed to log reveal:", error.message);
    return false;
  }
  return true;
}

function daysSince(dateIso: string | null): number | null {
  if (!dateIso) return null;
  const t = new Date(dateIso).getTime();
  if (!Number.isFinite(t)) return null;
  return (Date.now() - t) / (24 * 60 * 60 * 1000);
}

function assertCronAuth(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return;
  const header = req.headers.get("authorization");
  if (header !== `Bearer ${secret}`) {
    throw new Error("Unauthorized");
  }
}

/**
 * Replace with your real Apollo / enrichment pipeline.
 * Must return how many contacts were revealed (0 if none / skipped).
 */
async function revealContactsForSignal(_args: {
  supabase: SupabaseClient;
  companyId: string;
  companyName: string;
  signalId: string;
  score: number;
}): Promise<number> {
  // TODO: call Apollo + persist contacts; return number of reveals (usually 1 per signal or per person).
  return 0;
}

export async function GET(req: NextRequest) {
  return runEnrich(req);
}

export async function POST(req: NextRequest) {
  return runEnrich(req);
}

async function runEnrich(req: NextRequest) {
  try {
    assertCronAuth(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  let revealsToday = await getRevealCountToday(supabase);
  let capLogged = false;

  const { data: companies, error: companiesError } = await supabase
    .from("companies")
    .select("id, name, updated_at");

  if (companiesError || !companies) {
    console.error("[enrich] Failed to load companies:", companiesError?.message);
    return NextResponse.json({ error: "Failed to load companies" }, { status: 500 });
  }

  for (const company of companies) {
    if (revealsToday >= DAILY_REVEAL_CAP) {
      if (!capLogged) {
        console.log("[enrich] Daily cap reached — stopping enrichment");
        capLogged = true;
      }
      break;
    }

    const days = daysSince(company.updated_at as string | null);
    if (days !== null && days < ENRICH_COOLDOWN_DAYS) {
      const n = Math.max(0, Math.floor(days));
      console.log(`[enrich] Skipping ${company.name} — enriched ${n} days ago`);
      continue;
    }

    let revealsForThisCompany = 0;

    const { data: signals, error: sigErr } = await supabase
      .from("signals")
      .select("id, score")
      .eq("company_id", company.id)
      .gte("score", MIN_SIGNAL_SCORE);

    if (sigErr) {
      console.error(`[enrich] Signals load failed for ${company.name}:`, sigErr.message);
      continue;
    }

    if (!signals?.length) {
      continue;
    }

    for (const signal of signals) {
      if (revealsToday >= DAILY_REVEAL_CAP) {
        if (!capLogged) {
          console.log("[enrich] Daily cap reached — stopping enrichment");
          capLogged = true;
        }
        break;
      }

      const score = Number(signal.score);
      if (!Number.isFinite(score) || score < MIN_SIGNAL_SCORE) {
        continue;
      }

      const revealed = await revealContactsForSignal({
        supabase,
        companyId: company.id,
        companyName: company.name,
        signalId: signal.id,
        score,
      });

      for (let i = 0; i < revealed; i++) {
        if (revealsToday >= DAILY_REVEAL_CAP) {
          if (!capLogged) {
            console.log("[enrich] Daily cap reached — stopping enrichment");
            capLogged = true;
          }
          break;
        }
        const ok = await logContactReveal(supabase, company.id, signal.id);
        if (ok) {
          revealsToday += 1;
          revealsForThisCompany += 1;
        }
      }
    }

    if (revealsToday >= DAILY_REVEAL_CAP) {
      break;
    }

    if (revealsForThisCompany > 0) {
      await supabase
        .from("companies")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", company.id);
    }
  }

  return NextResponse.json({ ok: true, revealsToday });
}
