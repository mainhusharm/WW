import { SupportTicket, TicketResponse, SupportStats, TicketFilter } from '../types/support';

class SupportService {
  private tickets: Map<string, SupportTicket> = new Map();
  private listeners: Set<(tickets: SupportTicket[]) => void> = new Set();

  constructor() {
    this.loadTickets();
  }

  // Load tickets from localStorage
  private loadTickets() {
    try {
      const savedTickets = localStorage.getItem('support_tickets');
      if (savedTickets) {
        const ticketsArray = JSON.parse(savedTickets);
        this.tickets = new Map(ticketsArray.map((ticket: SupportTicket) => [ticket.id, ticket]));
      }
    } catch (error) {
      console.error('Error loading support tickets:', error);
    }
  }

  // Save tickets to localStorage
  private saveTickets() {
    try {
      const ticketsArray = Array.from(this.tickets.values());
      localStorage.setItem('support_tickets', JSON.stringify(ticketsArray));
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving support tickets:', error);
    }
  }

  // Subscribe to ticket updates
  subscribe(callback: (tickets: SupportTicket[]) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  private notifyListeners() {
    const tickets = Array.from(this.tickets.values());
    this.listeners.forEach(callback => callback(tickets));
  }

  // Create a new ticket
  async createTicket(ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'responses'>): Promise<SupportTicket> {
    const ticket: SupportTicket = {
      ...ticketData,
      id: `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responses: []
    };

    this.tickets.set(ticket.id, ticket);
    this.saveTickets();
    
    // TODO: Send to backend API
    return ticket;
  }

  // Get tickets for a specific user
  async getUserTickets(userId: string): Promise<SupportTicket[]> {
    const userTickets = Array.from(this.tickets.values())
      .filter(ticket => ticket.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return userTickets;
  }

  // Get all tickets (for admin)
  async getAllTickets(filter?: TicketFilter): Promise<SupportTicket[]> {
    let tickets = Array.from(this.tickets.values());

    if (filter) {
      if (filter.status) {
        tickets = tickets.filter(ticket => ticket.status === filter.status);
      }
      if (filter.category) {
        tickets = tickets.filter(ticket => ticket.category === filter.category);
      }
      if (filter.priority) {
        tickets = tickets.filter(ticket => ticket.priority === filter.priority);
      }
      if (filter.assignedTo) {
        tickets = tickets.filter(ticket => ticket.assignedTo === filter.assignedTo);
      }
      if (filter.dateRange) {
        const startDate = new Date(filter.dateRange.start);
        const endDate = new Date(filter.dateRange.end);
        tickets = tickets.filter(ticket => {
          const ticketDate = new Date(ticket.createdAt);
          return ticketDate >= startDate && ticketDate <= endDate;
        });
      }
    }

    return tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get a specific ticket
  async getTicket(ticketId: string): Promise<SupportTicket | null> {
    return this.tickets.get(ticketId) || null;
  }

  // Update ticket status
  async updateTicketStatus(ticketId: string, status: SupportTicket['status'], adminNotes?: string): Promise<boolean> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return false;

    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();
    
    if (status === 'resolved' || status === 'closed') {
      ticket.resolvedAt = new Date().toISOString();
    }
    
    if (adminNotes) {
      ticket.adminNotes = adminNotes;
    }

    this.tickets.set(ticketId, ticket);
    this.saveTickets();
    
    // TODO: Send to backend API
    return true;
  }

  // Assign ticket to admin
  async assignTicket(ticketId: string, assignedTo: string): Promise<boolean> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return false;

    ticket.assignedTo = assignedTo;
    ticket.updatedAt = new Date().toISOString();

    this.tickets.set(ticketId, ticket);
    this.saveTickets();
    
    // TODO: Send to backend API
    return true;
  }

  // Add response to ticket
  async addResponse(ticketId: string, response: Omit<TicketResponse, 'id' | 'createdAt'>): Promise<boolean> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return false;

    const newResponse: TicketResponse = {
      ...response,
      id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    ticket.responses.push(newResponse);
    ticket.updatedAt = new Date().toISOString();

    this.tickets.set(ticketId, ticket);
    this.saveTickets();
    
    // TODO: Send to backend API
    return true;
  }

  // Get support statistics
  async getSupportStats(): Promise<SupportStats> {
    const tickets = Array.from(this.tickets.values());
    
    const stats: SupportStats = {
      totalTickets: tickets.length,
      openTickets: tickets.filter(t => t.status === 'open').length,
      inProgressTickets: tickets.filter(t => t.status === 'in_progress').length,
      resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
      closedTickets: tickets.filter(t => t.status === 'closed').length,
      averageResponseTime: 0, // TODO: Calculate based on response times
      userTickets: tickets.length
    };

    return stats;
  }

  // Delete ticket (admin only)
  async deleteTicket(ticketId: string): Promise<boolean> {
    if (this.tickets.has(ticketId)) {
      this.tickets.delete(ticketId);
      this.saveTickets();
      return true;
    }
    return false;
  }
}

export const supportService = new SupportService();
export default supportService;
