'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  Calendar as CalendarIcon,
  Clock,
  Video,
  MapPin,
  Users,
  Mail,
  Phone,
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  User,
  Building,
  FileText,
  Link
} from 'lucide-react'
import { format } from 'date-fns'

interface Interview {
  id: string
  candidateId: string
  candidateName: string
  candidateAvatar?: string
  position: string
  type: 'phone' | 'video' | 'onsite'
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  date: Date
  duration: number // minutes
  interviewers: string[]
  location?: string
  meetingLink?: string
  notes?: string
  feedback?: string
  rating?: number
  stage: 'screening' | 'technical' | 'behavioral' | 'final'
}

interface Message {
  id: string
  candidateId: string
  candidateName: string
  subject: string
  content: string
  timestamp: Date
  type: 'email' | 'sms' | 'system'
  status: 'sent' | 'delivered' | 'read' | 'replied'
  isFromCandidate: boolean
}

interface CommunicationTemplate {
  id: string
  name: string
  subject: string
  content: string
  type: 'interview_invitation' | 'interview_reminder' | 'rejection' | 'offer' | 'follow_up'
}

const mockInterviews: Interview[] = [
  {
    id: '1',
    candidateId: 'c1',
    candidateName: 'Sarah Chen',
    candidateAvatar: '/placeholder-user.jpg',
    position: 'Senior Full Stack Developer',
    type: 'video',
    status: 'scheduled',
    date: new Date('2024-01-20T14:00:00'),
    duration: 60,
    interviewers: ['John Smith', 'Emily Davis'],
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    stage: 'technical',
    notes: 'Focus on React and Node.js experience'
  },
  {
    id: '2',
    candidateId: 'c2',
    candidateName: 'Michael Rodriguez',
    position: 'Frontend Developer',
    type: 'onsite',
    status: 'completed',
    date: new Date('2024-01-18T10:00:00'),
    duration: 45,
    interviewers: ['Sarah Johnson'],
    location: 'Conference Room A',
    stage: 'behavioral',
    feedback: 'Strong communication skills, good cultural fit',
    rating: 4
  },
  {
    id: '3',
    candidateId: 'c3',
    candidateName: 'Lisa Wang',
    position: 'Backend Developer',
    type: 'phone',
    status: 'scheduled',
    date: new Date('2024-01-22T16:30:00'),
    duration: 30,
    interviewers: ['David Kim'],
    stage: 'screening'
  }
]

const mockMessages: Message[] = [
  {
    id: '1',
    candidateId: 'c1',
    candidateName: 'Sarah Chen',
    subject: 'Interview Confirmation',
    content: 'Thank you for scheduling the interview. I confirm my availability for January 20th at 2:00 PM.',
    timestamp: new Date('2024-01-19T09:30:00'),
    type: 'email',
    status: 'read',
    isFromCandidate: true
  },
  {
    id: '2',
    candidateId: 'c2',
    candidateName: 'Michael Rodriguez',
    subject: 'Interview Invitation - Frontend Developer Position',
    content: 'We would like to invite you for an interview for the Frontend Developer position...',
    timestamp: new Date('2024-01-17T14:15:00'),
    type: 'email',
    status: 'replied',
    isFromCandidate: false
  }
]

const mockTemplates: CommunicationTemplate[] = [
  {
    id: '1',
    name: 'Interview Invitation',
    subject: 'Interview Invitation - {{position}} Position',
    content: 'Dear {{candidateName}},\n\nWe are pleased to invite you for an interview for the {{position}} position at our company.\n\nInterview Details:\nDate: {{date}}\nTime: {{time}}\nDuration: {{duration}} minutes\nType: {{type}}\n\nPlease confirm your availability.\n\nBest regards,\nHiring Team',
    type: 'interview_invitation'
  },
  {
    id: '2',
    name: 'Interview Reminder',
    subject: 'Reminder: Interview Tomorrow - {{position}}',
    content: 'Dear {{candidateName}},\n\nThis is a friendly reminder about your interview scheduled for tomorrow:\n\nDate: {{date}}\nTime: {{time}}\nLocation/Link: {{location}}\n\nWe look forward to speaking with you.\n\nBest regards,\nHiring Team',
    type: 'interview_reminder'
  }
]

export default function InterviewScheduler() {
  const [activeTab, setActiveTab] = useState('interviews')
  const [interviews, setInterviews] = useState<Interview[]>(mockInterviews)
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [templates, setTemplates] = useState<CommunicationTemplate[]>(mockTemplates)
  const [showNewInterview, setShowNewInterview] = useState(false)
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [newInterview, setNewInterview] = useState<Partial<Interview>>({
    type: 'video',
    duration: 60,
    stage: 'screening'
  })
  const [newMessage, setNewMessage] = useState({
    candidateId: '',
    subject: '',
    content: '',
    type: 'email' as const
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-600'
      case 'completed': return 'bg-green-600'
      case 'cancelled': return 'bg-red-600'
      case 'no-show': return 'bg-orange-600'
      default: return 'bg-gray-600'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />
      case 'phone': return <Phone className="h-4 w-4" />
      case 'onsite': return <MapPin className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Send className="h-4 w-4 text-blue-500" />
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'read': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'replied': return <MessageSquare className="h-4 w-4 text-purple-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const handleScheduleInterview = () => {
    if (newInterview.candidateName && selectedDate) {
      const interview: Interview = {
        id: `int-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        candidateId: `cand-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        candidateName: newInterview.candidateName!,
        position: newInterview.position || 'Developer',
        type: newInterview.type || 'video',
        status: 'scheduled',
        date: selectedDate,
        duration: newInterview.duration || 60,
        interviewers: newInterview.interviewers || [],
        stage: newInterview.stage || 'screening',
        meetingLink: newInterview.type === 'video' ? 'https://meet.google.com/generated-link' : undefined,
        location: newInterview.type === 'onsite' ? newInterview.location : undefined,
        notes: newInterview.notes
      }
      setInterviews([...interviews, interview])
      setShowNewInterview(false)
      setNewInterview({ type: 'video', duration: 60, stage: 'screening' })
      setSelectedDate(new Date())
    }
  }

  const handleSendMessage = () => {
    if (newMessage.candidateId && newMessage.subject && newMessage.content) {
      const message: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        candidateId: newMessage.candidateId,
        candidateName: 'Selected Candidate',
        subject: newMessage.subject,
        content: newMessage.content,
        timestamp: new Date(),
        type: newMessage.type,
        status: 'sent',
        isFromCandidate: false
      }
      setMessages([message, ...messages])
      setShowNewMessage(false)
      setNewMessage({ candidateId: '', subject: '', content: '', type: 'email' })
    }
  }

  const upcomingInterviews = interviews.filter(interview => 
    interview.status === 'scheduled' && interview.date > new Date()
  )

  const todayInterviews = interviews.filter(interview => {
    const today = new Date()
    const interviewDate = new Date(interview.date)
    return interviewDate.toDateString() === today.toDateString()
  })

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Today's Interviews</p>
                <p className="text-2xl font-bold text-white">{todayInterviews.length}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-black/40 border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Upcoming</p>
                <p className="text-2xl font-bold text-white">{upcomingInterviews.length}</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-black/40 border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Completed This Week</p>
                <p className="text-2xl font-bold text-white">{interviews.filter(i => i.status === 'completed').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-black/40 border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Unread Messages</p>
                <p className="text-2xl font-bold text-white">{messages.filter(m => m.status !== 'read').length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList className="bg-black/60 border-white/10">
            <TabsTrigger value="interviews" className="text-white data-[state=active]:bg-blue-600">Interviews</TabsTrigger>
            <TabsTrigger value="messages" className="text-white data-[state=active]:bg-blue-600">Messages</TabsTrigger>
            <TabsTrigger value="templates" className="text-white data-[state=active]:bg-blue-600">Templates</TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
            <Dialog open={showNewInterview} onOpenChange={setShowNewInterview}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Interview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-black/95 border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white">Schedule New Interview</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">Candidate Name</label>
                      <Input 
                        placeholder="Enter candidate name"
                        value={newInterview.candidateName || ''}
                        onChange={(e) => setNewInterview({...newInterview, candidateName: e.target.value})}
                        className="bg-black/40 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">Position</label>
                      <Input 
                        placeholder="Enter position"
                        value={newInterview.position || ''}
                        onChange={(e) => setNewInterview({...newInterview, position: e.target.value})}
                        className="bg-black/40 border-white/20 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">Interview Type</label>
                      <Select value={newInterview.type} onValueChange={(value: any) => setNewInterview({...newInterview, type: value})}>
                        <SelectTrigger className="bg-black/40 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/20">
                          <SelectItem value="video" className="text-white">Video Call</SelectItem>
                          <SelectItem value="phone" className="text-white">Phone Call</SelectItem>
                          <SelectItem value="onsite" className="text-white">On-site</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">Duration (minutes)</label>
                      <Select value={newInterview.duration?.toString()} onValueChange={(value) => setNewInterview({...newInterview, duration: parseInt(value)})}>
                        <SelectTrigger className="bg-black/40 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/20">
                          <SelectItem value="30" className="text-white">30 minutes</SelectItem>
                          <SelectItem value="45" className="text-white">45 minutes</SelectItem>
                          <SelectItem value="60" className="text-white">60 minutes</SelectItem>
                          <SelectItem value="90" className="text-white">90 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">Stage</label>
                      <Select value={newInterview.stage} onValueChange={(value: any) => setNewInterview({...newInterview, stage: value})}>
                        <SelectTrigger className="bg-black/40 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/20">
                          <SelectItem value="screening" className="text-white">Screening</SelectItem>
                          <SelectItem value="technical" className="text-white">Technical</SelectItem>
                          <SelectItem value="behavioral" className="text-white">Behavioral</SelectItem>
                          <SelectItem value="final" className="text-white">Final</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">Date & Time</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal bg-black/40 border-white/20 text-white hover:bg-white/5">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, 'PPP p') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-black border-white/20">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          className="text-white"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {newInterview.type === 'onsite' && (
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">Location</label>
                      <Input 
                        placeholder="Enter location"
                        value={newInterview.location || ''}
                        onChange={(e) => setNewInterview({...newInterview, location: e.target.value})}
                        className="bg-black/40 border-white/20 text-white"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">Notes</label>
                    <Textarea 
                      placeholder="Add any notes or special instructions"
                      value={newInterview.notes || ''}
                      onChange={(e) => setNewInterview({...newInterview, notes: e.target.value})}
                      className="bg-black/40 border-white/20 text-white"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowNewInterview(false)} className="border-white/20 text-white hover:bg-white/5">
                      Cancel
                    </Button>
                    <Button onClick={handleScheduleInterview} className="bg-blue-600 hover:bg-blue-700 text-white">
                      Schedule Interview
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/5">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-black/95 border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white">Send Message</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">Candidate</label>
                      <Select value={newMessage.candidateId} onValueChange={(value) => setNewMessage({...newMessage, candidateId: value})}>
                        <SelectTrigger className="bg-black/40 border-white/20 text-white">
                          <SelectValue placeholder="Select candidate" />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/20">
                          <SelectItem value="c1" className="text-white">Sarah Chen</SelectItem>
                          <SelectItem value="c2" className="text-white">Michael Rodriguez</SelectItem>
                          <SelectItem value="c3" className="text-white">Lisa Wang</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">Type</label>
                      <Select value={newMessage.type} onValueChange={(value: any) => setNewMessage({...newMessage, type: value})}>
                        <SelectTrigger className="bg-black/40 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/20">
                          <SelectItem value="email" className="text-white">Email</SelectItem>
                          <SelectItem value="sms" className="text-white">SMS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">Subject</label>
                    <Input 
                      placeholder="Enter subject"
                      value={newMessage.subject}
                      onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                      className="bg-black/40 border-white/20 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">Message</label>
                    <Textarea 
                      placeholder="Enter your message"
                      value={newMessage.content}
                      onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                      className="bg-black/40 border-white/20 text-white min-h-[120px]"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowNewMessage(false)} className="border-white/20 text-white hover:bg-white/5">
                      Cancel
                    </Button>
                    <Button onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="interviews" className="mt-6">
          <div className="space-y-4">
            {interviews.map(interview => (
              <Card key={interview.id} className="bg-black/40 border-white/5">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={interview.candidateAvatar} />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {interview.candidateName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{interview.candidateName}</h3>
                        <p className="text-gray-300">{interview.position}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{format(interview.date, 'MMM dd, yyyy')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{format(interview.date, 'h:mm a')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {getTypeIcon(interview.type)}
                            <span className="capitalize">{interview.type}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{interview.duration} min</span>
                          </div>
                        </div>
                        {interview.interviewers.length > 0 && (
                          <p className="text-sm text-gray-400 mt-1">
                            Interviewers: {interview.interviewers.join(', ')}
                          </p>
                        )}
                        {interview.notes && (
                          <p className="text-sm text-gray-300 mt-2">{interview.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`${getStatusColor(interview.status)} text-white mb-2`}>
                        {interview.status}
                      </Badge>
                      <Badge variant="secondary" className="bg-gray-700 text-gray-300 block">
                        {interview.stage}
                      </Badge>
                      {interview.rating && (
                        <div className="flex items-center space-x-1 mt-2">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < interview.rating! ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} 
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {(interview.meetingLink || interview.location) && (
                    <div className="mt-4 p-3 bg-black/60 rounded-lg">
                      {interview.meetingLink && (
                        <div className="flex items-center space-x-2 text-blue-400">
                          <Link className="h-4 w-4" />
                          <a href={interview.meetingLink} className="hover:underline">{interview.meetingLink}</a>
                        </div>
                      )}
                      {interview.location && (
                        <div className="flex items-center space-x-2 text-gray-300">
                          <MapPin className="h-4 w-4" />
                          <span>{interview.location}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/5">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <div className="space-y-4">
            {messages.map(message => (
              <Card key={message.id} className="bg-black/40 border-white/5">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={`${message.isFromCandidate ? 'bg-green-600' : 'bg-blue-600'} text-white`}>
                          {message.candidateName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-white">{message.candidateName}</h3>
                          <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-xs">
                            {message.type}
                          </Badge>
                          {message.isFromCandidate && (
                            <Badge className="bg-green-600 text-white text-xs">Inbound</Badge>
                          )}
                        </div>
                        <p className="text-gray-300 font-medium mt-1">{message.subject}</p>
                        <p className="text-gray-400 text-sm mt-2 line-clamp-2">{message.content}</p>
                        <p className="text-xs text-gray-500 mt-2">{format(message.timestamp, 'MMM dd, yyyy h:mm a')}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getMessageStatusIcon(message.status)}
                      <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/5">
                        Reply
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map(template => (
              <Card key={template.id} className="bg-black/40 border-white/5">
                <CardHeader>
                  <CardTitle className="text-white">{template.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-400">Subject</label>
                      <p className="text-white text-sm">{template.subject}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Content Preview</label>
                      <p className="text-gray-300 text-sm line-clamp-3">{template.content}</p>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/5">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        Use Template
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}