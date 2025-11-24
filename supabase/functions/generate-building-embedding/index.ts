import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

function block(title: string, content: string): string {
  return `\n=== ${title.toUpperCase()} ===\n${content.trim()}\n`;
}

function stringify(obj: any): string {
  return JSON.stringify(obj ?? {}, null, 2);
}

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405
      });
    }

    const { building_id } = await req.json();

    if (!building_id) {
      return new Response(JSON.stringify({
        error: "building_id requerido"
      }), {
        status: 400
      });
    }

    const { data: building } = await supabase.from("buildings").select("*").eq("id", building_id).single();

    if (!building) {
      return new Response(JSON.stringify({
        error: "Edificio no encontrado"
      }), {
        status: 404
      });
    }

    const { data: snapshotRows, error: snapshotError } = await supabase.from("financial_snapshots").select("*").eq("building_id", building_id).order("created_at", {
      ascending: false
    });

    if (snapshotError) {
      console.error("snapshotError", snapshotError);
    }

    const snapshot = snapshotRows && snapshotRows.length > 0 ? snapshotRows[0] : null;
    let metaBlock = "Sin meta adicional";
    if (snapshot?.meta) {
      try {
        const metaObj = typeof snapshot.meta === "string" ? JSON.parse(snapshot.meta) : snapshot.meta;
        if (metaObj && typeof metaObj === "object") {
          const lines = Object.entries(metaObj).map(([key, value]) => `${key}: ${value}`);
          metaBlock = lines.join("\n");
        }
      } catch (e) {
        console.error("Error parseando meta snapshot", e);
        metaBlock = String(snapshot.meta);
      }
    }

    let snapshotBlock = "No hay snapshot financiero para este edificio.";
    if (snapshot) {
      snapshotBlock = `
Periodo inicio (period_start): ${snapshot.period_start ?? "Sin dato"}
Periodo fin (period_end): ${snapshot.period_end ?? "Sin dato"}
Moneda (currency): ${snapshot.currency ?? "Sin dato"}
Ingresos anuales brutos (gross_annual_revenue_eur): ${snapshot.gross_annual_revenue_eur ?? "Sin dato"}
Otros ingresos anuales (other_annual_revenue_eur): ${snapshot.other_annual_revenue_eur ?? "Sin dato"}
WALT (meses) (walt_months): ${snapshot.walt_months ?? "Sin dato"}
Concentración top tenant (%) (top_tenant_concentration_pct): ${snapshot.top_tenant_concentration_pct ?? "Sin dato"}
Cláusula de indexación (has_indexation_clause): ${snapshot.has_indexation_clause ?? "Sin dato"}
Tasa de morosidad 12m (delinquency_rate_12m): ${snapshot.delinquency_rate_12m ?? "Sin dato"}
OPEX anual total (total_annual_opex_eur): ${snapshot.total_annual_opex_eur ?? "Sin dato"}
OPEX anual energía (annual_energy_opex_eur): ${snapshot.annual_energy_opex_eur ?? "Sin dato"}
OPEX anual mantenimiento (annual_maintenance_opex_eur): ${snapshot.annual_maintenance_opex_eur ?? "Sin dato"}
OPEX anual seguros (annual_insurance_opex_eur): ${snapshot.annual_insurance_opex_eur ?? "Sin dato"}
OPEX anual otros (annual_other_opex_eur): ${snapshot.annual_other_opex_eur ?? "Sin dato"}
DSCR (dscr): ${snapshot.dscr ?? "Sin dato"}
Servicio de deuda anual (annual_debt_service_eur): ${snapshot.annual_debt_service_eur ?? "Sin dato"}
Penalización alta por prepago (has_high_prepayment_penalty): ${snapshot.has_high_prepayment_penalty ?? "Sin dato"}
Principal pendiente (outstanding_principal_eur): ${snapshot.outstanding_principal_eur ?? "Sin dato"}
CAPEX de rehabilitación estimado (estimated_rehab_capex_eur): ${snapshot.estimated_rehab_capex_eur ?? "Sin dato"}
Ahorro energético estimado (%) (estimated_energy_savings_pct): ${snapshot.estimated_energy_savings_pct ?? "Sin dato"}
Revalorización estimada (%) (estimated_price_uplift_pct): ${snapshot.estimated_price_uplift_pct ?? "Sin dato"}
Duración estimada de la rehabilitación (semanas) (estimated_rehab_duration_weeks): ${snapshot.estimated_rehab_duration_weeks ?? "Sin dato"}
Meta técnica (meta):
${metaBlock}
Fechas snapshot:
Creado: ${snapshot.created_at ?? "Sin fecha"}
Actualizado: ${snapshot.updated_at ?? "Sin fecha"}
      `.trim();
    }

    const { data: energyCert } = await supabase.from("energy_certificates").select("*").eq("building_id", building_id).order("issue_date", {
      ascending: false
    }).maybeSingle();

    const { data: esgScore } = await supabase.from("esg_scores").select("*").eq("building_id", building_id).maybeSingle();

    const { data: digitalBooks } = await supabase.from("digital_books").select("*").eq("building_id", building_id);

    const content = `

${block("Información básica del edificio", stringify({
      id: building.id,
      name: building.name,
      address: building.address,
      cadastral_reference: building.cadastral_reference,
      construction_year: building.construction_year,
      typology: building.typology,
      status: building.status,
      coordinates: [
        building.lat,
        building.lng
      ],
      square_meters: building.square_meters
    }))}

${block("Información financiera estática del edificio (buildings)", stringify({
      price: building.price,
      rehabilitation_cost: building.rehabilitation_cost,
      potential_value: building.potential_value
    }))}

${block("Snapshot financiero (financial_snapshots)", snapshotBlock)}

${block("Certificado energético (energy_certificates)", stringify(energyCert))}

${block("ESG Score (esg_scores)", stringify(esgScore))}

${block("Libros digitales ambientales (digital_books.campos_ambientales)", stringify((digitalBooks ?? []).map((b: any) => ({
        id: b.id,
        campos_ambientales: b.campos_ambientales,
        sections: b.sections,
        status: b.status ?? b.estado,
        progress: b.progress
      }))))}

${block("Fechas edificio", stringify({
      created_at: building.created_at,
      updated_at: building.updated_at
    }))}

    `.trim();

    const embedResp = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: content
      })
    });

    const embedJson = await embedResp.json();
    const embedding = embedJson.data[0].embedding;

    const metadata = {
      source_table: "building_financial_documents",
      building_id,
      has_snapshot: !!snapshot,
      financial_snapshot_id: snapshot?.id ?? null,
      period_start: snapshot?.period_start ?? null,
      period_end: snapshot?.period_end ?? null,
      currency: snapshot?.currency ?? null,
      price: building.price ?? null,
      rehabilitation_cost: building.rehabilitation_cost ?? null,
      potential_value: building.potential_value ?? null,
      has_energy_certificate: !!energyCert,
      has_esg_score: !!esgScore,
      digital_books_count: digitalBooks?.length ?? 0,
      rating: energyCert?.rating ?? null,
      emissions: energyCert?.emissions_kg_co2_per_m2_year ?? null,
      primary_energy: energyCert?.primary_energy_kwh_per_m2_year ?? null
    };

    await supabase.from("building_financial_documents").upsert({
      building_id,
      financial_snapshot_id: snapshot?.id ?? null,
      period_start: snapshot?.period_start ?? null,
      period_end: snapshot?.period_end ?? null,
      currency: snapshot?.currency ?? null,
      content,
      embedding,
      metadata,
      updated_at: new Date().toISOString()
    }, {
      onConflict: "building_id"
    }).select();

    return new Response(JSON.stringify({
      ok: true
    }), {
      status: 200
    });

  } catch (e) {
    console.error("ERROR:", e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    const errorStack = e instanceof Error ? e.stack : undefined;
    
    return new Response(JSON.stringify({
      error: "Error interno",
      message: errorMessage,
      stack: errorStack
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});
