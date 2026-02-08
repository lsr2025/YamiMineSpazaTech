import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar, Tag, AlertCircle, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

export default function CoordinatorDiary() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['agentNotes'],
    queryFn: () => base44.entities.AgentNote.list('-created_date', 200)
  });

  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    note_type: 'daily_observation',
    priority: 'medium',
    location: '',
    tags: [],
    follow_up_required: false
  });

  const createNoteMutation = useMutation({
    mutationFn: (data) => base44.entities.AgentNote.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agentNotes']);
      setIsDialogOpen(false);
      setNewNote({
        title: '',
        content: '',
        note_type: 'daily_observation',
        priority: 'medium',
        location: '',
        tags: [],
        follow_up_required: false
      });
    }
  });

  const handleSubmit = () => {
    createNoteMutation.mutate({
      ...newNote,
      agent_email: user?.email
    });
  };

  const filteredNotes = filterType === 'all' 
    ? notes 
    : notes.filter(n => n.note_type === filterType);

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Field Notes & Diary</h1>
            <p className="text-gray-600 mt-1">Daily observations and reports</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-900 hover:bg-blue-800 gap-2">
                <Plus className="w-4 h-4" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Type</Label>
                  <Select value={newNote.note_type} onValueChange={(v) => setNewNote({...newNote, note_type: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily_observation">Daily Observation</SelectItem>
                      <SelectItem value="incident_report">Incident Report</SelectItem>
                      <SelectItem value="shop_visit">Shop Visit</SelectItem>
                      <SelectItem value="general_note">General Note</SelectItem>
                      <SelectItem value="team_update">Team Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Title</Label>
                  <Input
                    value={newNote.title}
                    onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                    placeholder="Brief summary..."
                  />
                </div>
                <div>
                  <Label>Content</Label>
                  <Textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                    placeholder="Detailed notes..."
                    className="min-h-32"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Priority</Label>
                    <Select value={newNote.priority} onValueChange={(v) => setNewNote({...newNote, priority: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Location/Ward</Label>
                    <Input
                      value={newNote.location}
                      onChange={(e) => setNewNote({...newNote, location: e.target.value})}
                      placeholder="e.g., Ward 12"
                    />
                  </div>
                </div>
                <Button onClick={handleSubmit} className="w-full bg-blue-900 hover:bg-blue-800">
                  Save Note
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Notes</SelectItem>
              <SelectItem value="daily_observation">Daily Observations</SelectItem>
              <SelectItem value="incident_report">Incident Reports</SelectItem>
              <SelectItem value="shop_visit">Shop Visits</SelectItem>
              <SelectItem value="general_note">General Notes</SelectItem>
              <SelectItem value="team_update">Team Updates</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notes List */}
        <div className="space-y-4">
          {filteredNotes.length === 0 ? (
            <Card className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No notes yet</h3>
              <p className="text-gray-600 mb-4">Start documenting your field observations</p>
              <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-900 hover:bg-blue-800">
                Create First Entry
              </Button>
            </Card>
          ) : (
            filteredNotes.map((note) => (
              <Card key={note.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{note.title}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {note.note_type.replace('_', ' ')}
                        </Badge>
                        <Badge className={priorityColors[note.priority]}>
                          {note.priority}
                        </Badge>
                        {note.location && (
                          <Badge variant="outline" className="text-xs">
                            {note.location}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(note.created_date), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs">{format(new Date(note.created_date), 'h:mm a')}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                  {note.follow_up_required && (
                    <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      <span className="text-sm text-orange-800">Follow-up required</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}