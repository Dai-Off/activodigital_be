export async function generateBuildingEmbedding(buildingId: string): Promise<void> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.warn('No se pudo generar embeddings: faltan variables de entorno');
      return;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/generate-building-embedding`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ building_id: buildingId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error al generar embeddings para edificio ${buildingId}:`, errorText);
      return;
    }

    const result = await response.json();
    console.log(`Embeddings generados para edificio ${buildingId}:`, result);
  } catch (error) {
    console.error(`Error al llamar a edge function para edificio ${buildingId}:`, error);
  }
}

