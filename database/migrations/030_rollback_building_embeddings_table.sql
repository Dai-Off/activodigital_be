-- Migration: Rollback building embeddings table
-- Description: Removes the building_embeddings table and related objects since we're using the embedding column in buildings table instead

-- Drop the trigger first
DROP TRIGGER IF EXISTS trigger_update_building_embeddings_updated_at ON building_embeddings;

-- Drop the function
DROP FUNCTION IF EXISTS update_building_embeddings_updated_at();

-- Drop the table (this will also drop indexes and policies)
DROP TABLE IF EXISTS building_embeddings;

-- Note: We keep the vector extension as it might be used elsewhere
-- If you want to remove it completely, uncomment the line below:
-- DROP EXTENSION IF EXISTS vector;
