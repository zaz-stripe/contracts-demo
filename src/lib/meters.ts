export type Meter = {
  id: number
  displayName: string
  eventName: string
  aggregationMethod: string
  eventIngestion: "active" | "inactive"
  createdAt: string
}

export const METERS: Meter[] = [
  { id: 1, displayName: "API requests", eventName: "api_request", aggregationMethod: "Sum", eventIngestion: "active", createdAt: "2026-03-15" },
  { id: 2, displayName: "Edge function invocations", eventName: "edge_function_invocations", aggregationMethod: "Sum", eventIngestion: "active", createdAt: "2026-03-15" },
  { id: 3, displayName: "Bandwidth (GB)", eventName: "bandwidth_gb", aggregationMethod: "Sum", eventIngestion: "active", createdAt: "2026-03-15" },
  { id: 4, displayName: "Storage (GB-hours)", eventName: "storage_gb_hours", aggregationMethod: "Sum", eventIngestion: "active", createdAt: "2026-04-01" },
  { id: 5, displayName: "Emails sent", eventName: "emails_sent", aggregationMethod: "Count", eventIngestion: "active", createdAt: "2026-04-10" },
  { id: 6, displayName: "Active users (MAU)", eventName: "active_users_mau", aggregationMethod: "Count unique", eventIngestion: "active", createdAt: "2026-04-10" },
  { id: 7, displayName: "Function invocations", eventName: "function_invocations", aggregationMethod: "Sum", eventIngestion: "active", createdAt: "2026-03-15" },
  { id: 8, displayName: "Image optimizations", eventName: "image_optimizations", aggregationMethod: "Count", eventIngestion: "active", createdAt: "2026-03-22" },
  { id: 9, displayName: "Web analytics events", eventName: "web_analytics_events", aggregationMethod: "Count", eventIngestion: "active", createdAt: "2026-03-22" },
  { id: 10, displayName: "KV reads", eventName: "kv_reads", aggregationMethod: "Sum", eventIngestion: "active", createdAt: "2026-04-01" },
  { id: 11, displayName: "Postgres compute hours", eventName: "postgres_compute_hrs", aggregationMethod: "Sum", eventIngestion: "inactive", createdAt: "2026-04-15" },
  { id: 12, displayName: "Blob storage (GB)", eventName: "blob_storage_gb", aggregationMethod: "Sum", eventIngestion: "active", createdAt: "2026-05-01" },
]
