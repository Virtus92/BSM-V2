'use client';

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Trash2, Plus } from 'lucide-react'

interface ContactRequestNote {
  id: string
  content: string
  is_internal: boolean
  created_at: string
  created_by: string
}

interface ContactRequestNotesProps {
  requestId: string
  initialNotes: ContactRequestNote[]
}

export default function ContactRequestNotes({ requestId, initialNotes }: ContactRequestNotesProps) {
  const [notes, setNotes] = useState<ContactRequestNote[]>(initialNotes)
  const [creating, setCreating] = useState(false)
  const [content, setContent] = useState('')

  const createNote = async () => {
    if (!content.trim()) return
    setCreating(true)
    try {
      const res = await fetch(`/api/requests/${requestId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), is_internal: true })
      })

      if (res.ok) {
        const data = await res.json()
        setNotes(prev => [data.note, ...prev])
        setContent('')
      }
    } finally {
      setCreating(false)
    }
  }

  const deleteNote = async (noteId: string) => {
    const res = await fetch(`/api/requests/notes/${noteId}`, { method: 'DELETE' })
    if (res.ok) {
      setNotes(prev => prev.filter(n => n.id !== noteId))
    }
  }

  return (
    <div className="space-y-4">
      <Card className="modern-card">
        <CardContent className="p-4 space-y-3">
          <Textarea
            placeholder="Neue interne Notiz hinzufügen..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              onClick={createNote}
              disabled={creating || !content.trim()}
              className="mystery-button"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Notiz hinzufügen
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            Keine Notizen vorhanden.
          </div>
        ) : (
          notes.map((note) => (
            <Card key={note.id} className="modern-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {note.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-muted-foreground">
                        {new Date(note.created_at).toLocaleString('de-DE')}
                      </p>
                      {note.is_internal && (
                        <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded">
                          Intern
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10 ml-2"
                    onClick={() => deleteNote(note.id)}
                  >
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