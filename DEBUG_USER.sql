-- Debug: Prüfe User und Workspace Status
-- In Supabase Dashboard SQL Editor ausführen:

-- 1. Zeige alle Benutzer
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- 2. Zeige alle Workspaces
SELECT id, name, slug, created_by, created_at FROM workspaces ORDER BY created_at DESC;

-- 3. Zeige alle Workspace-Memberships
SELECT
    wm.id,
    wm.user_id,
    wm.workspace_id,
    wm.role,
    wm.is_default,
    w.name as workspace_name,
    u.email
FROM workspace_members wm
LEFT JOIN workspaces w ON w.id = wm.workspace_id
LEFT JOIN auth.users u ON u.id = wm.user_id
ORDER BY wm.created_at DESC;

-- 4. Prüfe ob Benutzer Workspace-Mitglied ist
-- ERSETZE 'user-email@example.com' mit deiner echten E-Mail
SELECT
    u.id as user_id,
    u.email,
    wm.workspace_id,
    wm.role,
    w.name as workspace_name
FROM auth.users u
LEFT JOIN workspace_members wm ON wm.user_id = u.id
LEFT JOIN workspaces w ON w.id = wm.workspace_id
WHERE u.email = 'DEINE-EMAIL-HIER';