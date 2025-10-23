import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

interface BuildingData {
  id: string;
  name: string;
  address: string;
  cadastral_reference?: string;
  construction_year?: number;
  typology?: string;
  num_floors?: number;
  num_units?: number;
  price?: number;
  rehabilitation_cost?: number;
  potential_value?: number;
  square_meters?: number;
}

interface EmbeddingRequest {
  building_id: string;
}

interface EmbeddingResponse {
  success: boolean;
  message: string;
  building_id: string;
  embedding_id?: string;
  error?: string;
}

/**
 * Generates text content for embedding from building data
 */
function generateBuildingContent(building: BuildingData): string {
  const parts: string[] = [];
  
  // Basic information
  if (building.name) parts.push(`Edificio: ${building.name}`);
  if (building.address) parts.push(`Dirección: ${building.address}`);
  if (building.cadastral_reference) parts.push(`Referencia catastral: ${building.cadastral_reference}`);
  
  // Construction details
  if (building.construction_year) parts.push(`Año de construcción: ${building.construction_year}`);
  if (building.typology) parts.push(`Tipología: ${building.typology}`);
  if (building.num_floors) parts.push(`Número de plantas: ${building.num_floors}`);
  if (building.num_units) parts.push(`Número de unidades: ${building.num_units}`);
  if (building.square_meters) parts.push(`Metros cuadrados: ${building.square_meters}`);
  
  // Financial information
  if (building.price) parts.push(`Precio: €${building.price.toLocaleString()}`);
  if (building.rehabilitation_cost) parts.push(`Costo de rehabilitación: €${building.rehabilitation_cost.toLocaleString()}`);
  if (building.potential_value) parts.push(`Valor potencial: €${building.potential_value.toLocaleString()}`);
  
  return parts.join('. ');
}

/**
 * Calls OpenAI API to generate embeddings
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { building_id }: EmbeddingRequest = await req.json();

    // Validate required fields
    if (!building_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'building_id is required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    console.log(`🏢 Generating embedding for building: ${building_id}`);

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get building data
    console.log(`📋 Fetching building data for: ${building_id}`);
    const { data: building, error: buildingError } = await supabase
      .from('buildings')
      .select('*')
      .eq('id', building_id)
      .single();

    if (buildingError) {
      console.error(`❌ Error fetching building:`, buildingError);
      throw new Error(`Building not found: ${buildingError.message}`);
    }

    if (!building) {
      throw new Error('Building not found');
    }

    console.log(`✅ Building found: ${building.name}`);

    // Generate text content for embedding
    const content = generateBuildingContent(building);
    console.log(`📝 Generated content: ${content.substring(0, 100)}...`);

    // Generate embedding using OpenAI
    console.log(`🤖 Generating embedding with OpenAI...`);
    const embedding = await generateEmbedding(content);
    console.log(`✅ Embedding generated (${embedding.length} dimensions)`);

    // Store embedding in database
    console.log(`💾 Storing embedding in database...`);
    const { data: embeddingData, error: embeddingError } = await supabase
      .from('building_embeddings')
      .upsert({
        building_id: building_id,
        embedding: embedding,
        content: content,
        content_type: 'building_data',
        model: 'text-embedding-ada-002'
      }, {
        onConflict: 'building_id,content_type'
      })
      .select()
      .single();

    if (embeddingError) {
      console.error(`❌ Error storing embedding:`, embeddingError);
      throw new Error(`Failed to store embedding: ${embeddingError.message}`);
    }

    console.log(`✅ Embedding stored successfully with ID: ${embeddingData.id}`);

    const response: EmbeddingResponse = {
      success: true,
      message: `Embedding generated and stored successfully for building ${building.name}`,
      building_id: building_id,
      embedding_id: embeddingData.id
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('❌ Error in generate-building-embedding function:', error);
    
    const response: EmbeddingResponse = {
      success: false,
      message: 'Failed to generate embedding',
      building_id: '',
      error: error.message
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
