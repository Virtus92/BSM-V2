// Safe no-op activity logger until activity storage is finalized
export async function logActivity(input: {
  entityType: string
  entityId: string
  action: string
  description?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
}) {
  try {
    // Intentionally no-op to avoid schema/type mismatches
    void input
  } catch {
    // ignore
  }
}
