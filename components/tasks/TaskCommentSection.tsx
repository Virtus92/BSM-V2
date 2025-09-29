'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { MessageSquare, Send, Clock } from 'lucide-react';
import { formatUserDate, getUserDisplayName } from '@/lib/user-utils';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
}

interface TaskCommentSectionProps {
  taskId: string;
  comments: Comment[];
  currentUser: any;
}

export function TaskCommentSection({ taskId, comments, currentUser }: TaskCommentSectionProps) {
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (response.ok) {
        setNewComment('');
        toast({
          title: 'Erfolg',
          description: 'Kommentar wurde hinzugefügt.',
        });
        // Refresh the page to show new comment
        window.location.reload();
      } else {
        const error = await response.json();
        toast({
          title: 'Fehler',
          description: error.error || 'Fehler beim Hinzufügen des Kommentars.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Comment submission error:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Hinzufügen des Kommentars.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="modern-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Kommentare ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Comment */}
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <Textarea
            placeholder="Kommentar hinzufügen..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            rows={3}
          />
          <Button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            size="sm"
            className="mystery-button"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Wird hinzugefügt...' : 'Kommentar hinzufügen'}
          </Button>
        </form>

        {/* Existing Comments */}
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-3 bg-background/50 rounded-lg border">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {getUserDisplayName(comment.user).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {getUserDisplayName(comment.user)}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatUserDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Noch keine Kommentare vorhanden.</p>
            <p className="text-sm">Fügen Sie den ersten Kommentar hinzu!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}