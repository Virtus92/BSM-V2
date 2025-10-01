# Chat Channels System - Implementation Documentation

## Overview

Multi-channel chat system enabling context-based communication between customers and employees. Supports permanent channels (for assigned customers) and temporary channels (for specific requests or tasks).

## Architecture

### Database Schema

**Tables:**
- `chat_channels` - Main channel table
- `customer_chat_messages` - Extended with `channel_id` column

**Channel Types:**
- `permanent` - Long-term customer-employee assignment
- `request` - Temporary channel tied to a contact request
- `task` - Temporary channel tied to a task

**Channel Status:**
- `active` - Channel is open and accepting messages
- `closed` - Channel is closed (temporary channels only)

### Auto-Creation Triggers

**Permanent Channels:**
```sql
-- Triggers: trigger_auto_create_permanent_channel
-- When: customer.assigned_employee_id is set/updated
-- Action: Creates permanent channel if none exists
```

**Request Channels:**
```sql
-- Triggers: trigger_auto_create_request_channel
-- When: contact_request status = 'in_progress' AND assigned_to is set
-- Action: Creates request channel if none exists
```

**Task Channels:**
```sql
-- Triggers: trigger_auto_create_task_channel
-- When: task is assigned
-- Action: Creates task channel (can be implemented later)
```

### Auto-Close Triggers

**Request Channels:**
```sql
-- Triggers: trigger_auto_close_request_channel
-- When: contact_request status IN ('completed', 'responded', 'closed')
-- Action: Closes all active request channels for that request
```

**Task Channels:**
```sql
-- Triggers: trigger_auto_close_task_channel
-- When: task status IN ('done', 'completed')
-- Action: Closes all active task channels for that task
```

## API Routes

### GET /api/chat/channels

List chat channels with filtering.

**Query Parameters:**
- `status` - Filter by channel status ('active', 'closed', 'all')
- `type` - Filter by channel type ('permanent', 'request', 'task', 'all')
- `customer_id` - Filter by customer ID

**Access Control:**
- Customers: See only their own channels
- Employees: See only channels they're part of
- Admins: See all channels

**Response:**
```json
{
  "channels": [
    {
      "id": "uuid",
      "customer_id": "uuid",
      "employee_id": "uuid",
      "channel_type": "permanent",
      "channel_status": "active",
      "source_type": null,
      "source_id": null,
      "created_at": "timestamp",
      "closed_at": null,
      "customers": { "company_name": "..." },
      "user_profiles": { "first_name": "...", "last_name": "..." }
    }
  ],
  "count": 1
}
```

### POST /api/chat/channels

Create a new chat channel manually.

**Access:** Employees and Admins only

**Request Body:**
```json
{
  "customer_id": "uuid",
  "employee_id": "uuid",
  "channel_type": "permanent|request|task",
  "source_type": "contact_request|task",  // Required for temporary channels
  "source_id": "uuid"  // Required for temporary channels
}
```

**Validations:**
- Checks for duplicate active channels
- Enforces source requirements for temporary channels
- Prevents permanent channels from having source data

### POST /api/chat/channels/[id]/close

Close an active temporary channel.

**Access:** Assigned employee or Admin

**Restrictions:**
- Only temporary channels can be manually closed
- Permanent channels cannot be closed manually
- Channel must be active

## UI Components

### CustomerChatView (Portal - Customer-Facing)

**Location:** `components/portal/CustomerChatView.tsx`

**Features:**
- Multi-channel tabs (when > 1 channel)
- Channel type indicators
- Real-time message sync per channel
- Auto-selects permanent channel by default
- Disables input when no active channel

**Key Updates:**
- Fetches channels on mount
- Filters messages by `channel_id`
- Real-time subscription filters by `channel_id`
- Includes `channel_id` in message inserts

### EmployeeCustomerChatMultiChannel (Workspace - Employee-Facing)

**Location:** `components/customers/EmployeeCustomerChatMultiChannel.tsx`

**Features:**
- Multi-channel tabs with context display
- Active channels sidebar (shows all customer channels)
- Channel type/source display
- Real-time message sync per channel
- Customer info and recent requests

**Usage:**
Replace existing `EmployeeCustomerChat` import with:
```tsx
import { EmployeeCustomerChatMultiChannel } from '@/components/customers/EmployeeCustomerChatMultiChannel';
```

## RLS Policies

### chat_channels

**SELECT:**
- Admins: All channels
- Employees: Channels where they are the employee
- Customers: Channels where they are the customer

**INSERT:**
- Employees and Admins only

**UPDATE:**
- Employees and Admins only
- Used for closing channels

### customer_chat_messages (Updated)

**SELECT:**
- Messages from active channels where user is participant
- Backward compatible: also checks `customer_id` for old messages

**INSERT:**
- Must include valid `channel_id`
- Employee messages: must be from active channel
- Customer messages: must be from their active channel
- Validates `is_from_customer` matches user type

## Migration Status

**Applied Migrations:**
- ✅ `20250930100000_create_chat_channels.sql`
- ✅ `20250930000025_backfill_contact_requests_assigned_to.sql`

**Verification:**
```bash
npx tsx scripts/verify-chat-channels.ts
```

## Usage Examples

### Customer Creates Request → Channel Auto-Created

1. Customer submits contact request via portal
2. Admin/Employee assigns request to employee
3. Request status changes to 'in_progress'
4. **Trigger fires:** Creates request channel automatically
5. Both customer and employee can now chat in that channel
6. When request is completed, channel auto-closes

### Employee Views Customer Channels

1. Employee navigates to `/workspace/customers/chat/[customer-id]`
2. Component fetches all active channels for that customer
3. Shows tabs for permanent channel + any request/task channels
4. Employee can switch between channels
5. Messages are filtered by selected channel

### API: List Customer's Channels

```typescript
// Employee fetching channels for a customer
const response = await fetch(
  '/api/chat/channels?customer_id=uuid&status=active'
);
const { channels } = await response.json();
```

### API: Close Request Channel

```typescript
// Close a temporary channel when request is resolved
await fetch(`/api/chat/channels/${channelId}/close`, {
  method: 'POST'
});
```

## Testing Checklist

- [ ] Permanent channel auto-created when customer assigned
- [ ] Request channel auto-created when request assigned
- [ ] Request channel auto-closed when request completed
- [ ] Customer can see only their channels
- [ ] Employee can see only channels they're assigned to
- [ ] Messages filtered correctly by channel
- [ ] Real-time updates work per channel
- [ ] Channel tabs display correctly
- [ ] Input disabled when no active channel
- [ ] Manual channel creation works (API)
- [ ] Manual channel closing works (API)

## Known Limitations

1. **Task channels not fully implemented** - Triggers exist but need task assignment workflow
2. **Old messages without channel_id** - Backward compatible but should be migrated
3. **No channel history** - Closed channels and their messages are retained but not displayed in UI
4. **No channel reactivation** - Once closed, channels cannot be reopened

## Future Enhancements

- [ ] Channel history view (show closed channels)
- [ ] Channel reactivation for temporary channels
- [ ] Task-based channels (requires task assignment workflow)
- [ ] Channel metadata (subject, description, tags)
- [ ] Channel archiving (vs deleting)
- [ ] Bulk channel operations
- [ ] Channel search and filtering UI
- [ ] Channel analytics (message count, response time)

## Troubleshooting

### "No active channel" displayed

**Causes:**
- Customer not assigned to any employee (no permanent channel)
- No active requests/tasks (no temporary channels)

**Solutions:**
- Assign customer to employee (creates permanent channel)
- Create and assign request (creates request channel)

### Messages not showing in channel

**Causes:**
- Old messages without `channel_id`
- RLS policy blocking access
- Wrong channel selected

**Solutions:**
- Migrate old messages to add `channel_id`
- Verify RLS policies in Supabase Dashboard
- Check active channel ID matches message `channel_id`

### Channel not auto-created

**Causes:**
- Trigger not firing (check Supabase logs)
- RLS preventing trigger from writing
- Duplicate channel check failing

**Solutions:**
- Check trigger exists: `trigger_auto_create_permanent_channel`
- Verify function has SECURITY DEFINER
- Check for existing active channel

## Database Queries

### Find all channels for a customer

```sql
SELECT
  c.*,
  up.first_name,
  up.last_name
FROM chat_channels c
LEFT JOIN user_profiles up ON c.employee_id = up.id
WHERE c.customer_id = 'customer-uuid'
  AND c.channel_status = 'active'
ORDER BY c.created_at DESC;
```

### Find messages for a channel

```sql
SELECT
  m.*,
  up.first_name,
  up.last_name
FROM customer_chat_messages m
LEFT JOIN user_profiles up ON m.sender_id = up.id
WHERE m.channel_id = 'channel-uuid'
ORDER BY m.created_at ASC;
```

### Manually close a channel

```sql
UPDATE chat_channels
SET channel_status = 'closed',
    closed_at = NOW()
WHERE id = 'channel-uuid'
  AND channel_type != 'permanent';
```

## Support

For issues or questions:
1. Check Supabase logs for trigger errors
2. Verify RLS policies in Supabase Dashboard
3. Run verification script: `npx tsx scripts/verify-chat-channels.ts`
4. Check browser console for API errors
