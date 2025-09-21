'use client';

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Trash2, Plus } from 'lucide-react'
import type { CustomerNote } from '@/lib/shared-types'

interface CustomerNotesProps {
  customerId: string
}

export default function CustomerNotes({ customerId }: CustomerNotesProps) {
  const [notes, setNotes] = useState<CustomerNote[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const loadNotes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/customers/${customerId}/notes`)
      const data = await res.json()
      setNotes(data.notes || [])
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    loadNotes()
  }, [customerId, loadNotes])

  const createNote = async () => {
    if (!content.trim()) return
    setCreating(true)
    try {
      await fetch(`/api/customers/${customerId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() || null, content: content.trim() })
      })
      setTitle('')
      setContent('')
      await loadNotes()
    } finally {
      setCreating(false)
    }
  }

  const deleteNote = async (noteId: string) => {
    await fetch(`/api/customers/notes/${noteId}`, { method: 'DELETE' })
    await loadNotes()
  }

  return (
    <div className="space-y-4">
      <Card className="modern-card">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Input
              placeholder="Titel (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="md:col-span-2"
            />
            <Textarea
              placeholder="Neue Notiz hinzufügen..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="md:col-span-3"
              rows={3}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={createNote} disabled={creating || !content.trim()} className="mystery-button">
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Notiz hinzufügen
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Notizen werden geladen...
          </div>
        ) : notes.length === 0 ? (
          <div className="text-sm text-muted-foreground">Keine Notizen vorhanden.</div>
        ) : (
          notes.map((n) => (
            <Card key={n.id} className="modern-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    {n.title && <h4 className="font-semibold mb-1">{n.title}</h4>}
                    <p className="text-sm text-foreground whitespace-pre-wrap">{n.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">{new Date(n.created_at || '').toLocaleString('de-DE')}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10" onClick={() => deleteNote(n.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
