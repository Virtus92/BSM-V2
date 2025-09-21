-- Duplikate Workspaces bereinigen
-- In Supabase Dashboard SQL Editor ausführen:

-- 1. Zeige alle Workspaces (zum Debuggen)
SELECT id, name, slug, created_at, created_by FROM workspaces ORDER BY created_at DESC;

-- 2. Lösche Workspace-Memberships für Duplikate
DELETE FROM workspace_members
WHERE workspace_id IN (
  -- Finde alle Duplikat-Workspace-IDs (behalte nur das älteste pro Name)
  SELECT id FROM workspaces w1
  WHERE EXISTS (
    SELECT 1 FROM workspaces w2
    WHERE w2.name = w1.name
    AND w2.created_at < w1.created_at
  )
);

-- 3. Lösche die Duplikat-Workspaces (behalte nur das älteste pro Name)
DELETE FROM workspaces
WHERE id IN (
  SELECT id FROM workspaces w1
  WHERE EXISTS (
    SELECT 1 FROM workspaces w2
    WHERE w2.name = w1.name
    AND w2.created_at < w1.created_at
  )
);

-- 4. Prüfe das Ergebnis
SELECT id, name, slug, created_at FROM workspaces ORDER BY created_at;