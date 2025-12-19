export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'trading' | 'account' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  assignedTo?: string;
  adminNotes?: string;
  attachments?: string[];
  responses: TicketResponse[];
}

export interface TicketResponse {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorType: 'user' | 'admin';
  message: string;
  createdAt: string;
  isInternal?: boolean; // For admin-only notes
}

export interface SupportStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  averageResponseTime: number;
  userTickets: number;
}

export interface TicketFilter {
  status?: string;
  category?: string;
  priority?: string;
  assignedTo?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}
