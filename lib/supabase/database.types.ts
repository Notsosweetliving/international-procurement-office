export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
type Row<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};
export interface Database {
  public: {
    Tables: {
      procurement_opportunities: Row<{
        id: string; source: string; source_opportunity_id: string; title: string;
        description: string | null; buyer_name: string | null; buyer_country: string | null;
        procurement_country: string | null; category: string | null; classification_codes: Json | null;
        estimated_value_min: number | null; estimated_value_max: number | null; currency: string | null;
        published_at: string | null; deadline_at: string | null; procedure_type: string | null;
        source_url: string | null; source_metadata: Json | null; source_updated_at: string | null;
        first_seen_at: string; last_seen_at: string; is_active: boolean; created_at: string;
        updated_at: string; search_vector: unknown;
      }>;
      procurement_source_sync_state: Row<{
        source: string; last_attempt_at: string | null; last_success_at: string | null;
        last_error_type: string | null; last_safe_error: string | null; records_fetched: number;
        records_inserted: number; records_updated: number; is_stale: boolean; updated_at: string;
        upstream_http_status: number | null;
      }>;
      profiles: Row<{
        id: string;
        email: string;
        display_name: string | null;
        marketing_opt_in: boolean;
        marketing_opt_in_at: string | null;
        created_at: string;
        updated_at: string;
      }>;
      provider_diagnostics: Row<{
        provider: string;
        configured: boolean;
        status: string;
        upstream_status: number | null;
        raw_result_count: number;
        normalized_result_count: number;
        result_count: number;
        duration_ms: number;
        error_type: string | null;
        safe_error_message: string | null;
        upstream_url: string;
        timeout: boolean;
        checked_at: string;
      }>;
      companies: Row<{
        id: string;
        user_id: string;
        name: string;
        country: string;
        website: string;
        min_contract_value: number | null;
        max_contract_value: number | null;
        preferred_currency: string | null;
        government_experience: string;
        created_at: string;
        updated_at: string;
      }>;
      company_business_models: Row<{
        company_id: string;
        business_model: string;
      }>;
      company_capabilities: Row<{ company_id: string; capability: string }>;
      company_regions: Row<{ company_id: string; region: string }>;
      company_certifications: Row<{
        id: string;
        company_id: string;
        certification_name: string;
      }>;
      saved_opportunities: Row<{
        id: string;
        user_id: string;
        source: string;
        source_opportunity_id: string;
        opportunity_title: string;
        buyer_name: string | null;
        source_url: string | null;
        saved_at: string;
      }>;
      ai_tender_analyses: Row<{
        id: string;
        user_id: string;
        source: string;
        source_opportunity_id: string;
        source_updated_at: string | null;
        model: string;
        analysis_json: Json;
        created_at: string;
        updated_at: string;
      }>;
      user_preferences: Row<{
        user_id: string;
        preferred_currency: string | null;
        created_at: string;
        updated_at: string;
      }>;
      tender_documents: Row<{
        id: string;
        user_id: string;
        source: string;
        source_opportunity_id: string;
        filename: string;
        storage_path: string;
        mime_type: string;
        file_size: number;
        processing_status: string;
        processing_error: string | null;
        created_at: string;
        updated_at: string;
      }>;
      tender_document_extractions: Row<{
        id: string;
        document_id: string;
        extraction_text: string;
        extraction_metadata: Json;
        created_at: string;
        updated_at: string;
      }>;
      tender_requirements: Row<{
        id: string;
        user_id: string;
        source: string;
        source_opportunity_id: string;
        requirement_type: string;
        title: string;
        description: string;
        source_document_id: string | null;
        source_reference: string | null;
        confidence: string;
        mandatory_status: string;
        created_at: string;
        updated_at: string;
      }>;
      bid_workspaces: Row<{
        id: string;
        user_id: string;
        source: string;
        source_opportunity_id: string;
        decision: string;
        readiness_score: number;
        notes: string;
        created_at: string;
        updated_at: string;
      }>;
      compliance_items: Row<{
        id: string;
        bid_workspace_id: string;
        requirement_id: string;
        status: string;
        suggested_status: string | null;
        user_note: string;
        evidence_document_id: string | null;
        created_at: string;
        updated_at: string;
      }>;
      bid_submission_items: Row<{
        id: string;
        bid_workspace_id: string;
        label: string;
        category: string;
        completed: boolean;
        source_requirement_id: string | null;
        created_at: string;
        updated_at: string;
      }>;
      suppliers: Row<{
        id: string;
        owner_user_id: string | null;
        name: string;
        website: string | null;
        country: string;
        description: string;
        supplier_type: string;
        verification_status: string;
        estimated_capacity_notes: string | null;
        lead_time_notes: string | null;
        minimum_order_notes: string | null;
        general_notes: string | null;
        created_at: string;
        updated_at: string;
      }>;
      supplier_capabilities: Row<{ supplier_id: string; capability: string }>;
      supplier_regions: Row<{ supplier_id: string; region: string }>;
      supplier_certifications: Row<{
        id: string;
        supplier_id: string;
        certification_name: string;
      }>;
      supplier_brands: Row<{
        id: string;
        supplier_id: string;
        brand_name: string;
      }>;
      supplier_contacts: Row<{
        id: string;
        supplier_id: string;
        contact_name: string | null;
        email: string | null;
        phone: string | null;
        role: string | null;
        source: string | null;
      }>;
      supplier_notes: Row<{
        id: string;
        user_id: string;
        supplier_id: string;
        note: string;
        created_at: string;
        updated_at: string;
      }>;
      workspace_suppliers: Row<{
        id: string;
        bid_workspace_id: string;
        supplier_id: string;
        role: string;
        status: string;
        quote_status: string;
        quoted_amount: number | null;
        quoted_currency: string | null;
        lead_time_days: number | null;
        quote_valid_until: string | null;
        notes: string | null;
        logistics_cost: number | null;
        other_cost: number | null;
        created_at: string;
        updated_at: string;
      }>;
      requirement_suppliers: Row<{
        id: string;
        requirement_id: string;
        supplier_id: string;
        workspace_supplier_id: string | null;
        suitability_status: string;
        notes: string | null;
        created_at: string;
        updated_at: string;
      }>;
      supplier_evidence: Row<{
        id: string;
        supplier_id: string;
        user_id: string;
        evidence_type: string;
        source_url: string | null;
        description: string | null;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
