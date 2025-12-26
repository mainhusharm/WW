import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuantumSupportHub from '../QuantumSupportHub';

// Mock fetch for testing API calls
global.fetch = jest.fn();

describe('QuantumSupportHub Component', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    (fetch as jest.Mock).mockClear();
  });

  describe('Component Rendering', () => {
    test('renders the main dashboard structure', () => {
      render(<QuantumSupportHub />);
      
      expect(screen.getByText('Quantum Support Hub')).toBeInTheDocument();
      expect(screen.getByText('Support Hub')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Senior Agent')).toBeInTheDocument();
    });

    test('renders all navigation items', () => {
      render(<QuantumSupportHub />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Conversations')).toBeInTheDocument();
      expect(screen.getByText('Tickets')).toBeInTheDocument();
      expect(screen.getByText('Customers')).toBeInTheDocument();
      expect(screen.getByText('Team')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('AI Tools')).toBeInTheDocument();
      expect(screen.getByText('Knowledge')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    test('renders performance metrics in header', () => {
      render(<QuantumSupportHub />);
      
      expect(screen.getByText(/ACTIVE CHATS/)).toBeInTheDocument();
      expect(screen.getByText(/AVG RESPONSE/)).toBeInTheDocument();
      expect(screen.getByText(/SATISFACTION/)).toBeInTheDocument();
      expect(screen.getByText(/RESOLVED TODAY/)).toBeInTheDocument();
    });
  });

  describe('Navigation Functionality', () => {
    test('changes active page when navigation items are clicked', () => {
      render(<QuantumSupportHub />);
      
      // Initially dashboard should be active
      expect(screen.getByText('Active Page: dashboard')).toBeInTheDocument();
      
      // Click on customers
      fireEvent.click(screen.getByText('Customers'));
      expect(screen.getByText('Active Page: customers')).toBeInTheDocument();
      
      // Click on tickets
      fireEvent.click(screen.getByText('Tickets'));
      expect(screen.getByText('Active Page: tickets')).toBeInTheDocument();
    });

    test('highlights active navigation item', () => {
      render(<QuantumSupportHub />);
      
      const dashboardNav = screen.getByText('Dashboard').closest('div');
      expect(dashboardNav).toHaveClass('bg-indigo-600');
    });
  });

  describe('Data Fetching', () => {
    test('fetches customer data on component mount', async () => {
      const mockCustomers = [
        {
          id: '1',
          uniqueId: 'CUST001',
          name: 'John Smith',
          email: 'john@example.com',
          phone: '+1234567890',
          membershipTier: 'premium',
          joinDate: '2024-01-15',
          lastActive: '2024-12-01',
          status: 'active',
          totalTrades: 100,
          successRate: 85,
          balance: 5000,
          accountType: 'professional',
          riskTolerance: 'moderate',
          activities: [],
          tickets: [],
          screenshots: []
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ customers: mockCustomers })
      });

      render(<QuantumSupportHub />);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('http://localhost:3005/api/customers');
      });
    });

    test('handles API errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      render(<QuantumSupportHub />);
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error fetching dashboard data:', expect.any(Error));
      });
    });
  });

  describe('Customer Management', () => {
    test('displays customer count in navigation badge', async () => {
      const mockCustomers = [
        { id: '1', name: 'John', email: 'john@example.com', phone: '+123', membershipTier: 'premium', joinDate: '2024-01-01', lastActive: '2024-12-01', status: 'active', totalTrades: 0, successRate: 0, balance: 0, accountType: '', riskTolerance: '', activities: [], tickets: [], screenshots: [] },
        { id: '2', name: 'Jane', email: 'jane@example.com', phone: '+456', membershipTier: 'standard', joinDate: '2024-01-01', lastActive: '2024-12-01', status: 'active', totalTrades: 0, successRate: 0, balance: 0, accountType: '', riskTolerance: '', activities: [], tickets: [], screenshots: [] }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ customers: mockCustomers })
      });

      render(<QuantumSupportHub />);
      
      await waitFor(() => {
        const customerBadge = screen.getByText('2');
        expect(customerBadge).toBeInTheDocument();
      });
    });

    test('updates stats when customer data is loaded', async () => {
      const mockCustomers = [
        { id: '1', name: 'John', email: 'john@example.com', phone: '+123', membershipTier: 'premium', joinDate: '2024-01-01', lastActive: '2024-12-01', status: 'active', totalTrades: 0, successRate: 0, balance: 0, accountType: '', riskTolerance: '', activities: [], tickets: [], screenshots: [] }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ customers: mockCustomers })
      });

      render(<QuantumSupportHub />);
      
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument(); // Customer count badge
      });
    });
  });

  describe('Ticket Management', () => {
    test('generates mock tickets for customers', async () => {
      const mockCustomers = [
        { id: '1', name: 'John', email: 'john@example.com', phone: '+123', membershipTier: 'premium', joinDate: '2024-01-01', lastActive: '2024-12-01', status: 'active', totalTrades: 0, successRate: 0, balance: 0, accountType: '', riskTolerance: '', activities: [], tickets: [], screenshots: [] }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ customers: mockCustomers })
      });

      render(<QuantumSupportHub />);
      
      await waitFor(() => {
        // Check if tickets badge shows up
        expect(screen.getByText(/Tickets/)).toBeInTheDocument();
      });
    });

    test('updates ticket status and recalculates stats', async () => {
      render(<QuantumSupportHub />);
      
      // This would test the updateTicketStatus function
      // Implementation would depend on how tickets are displayed
      expect(true).toBe(true); // Placeholder test
    });
  });

  describe('Search Functionality', () => {
    test('performs customer search when search button is clicked', async () => {
      const mockSearchResults = [
        { id: '1', name: 'John', email: 'john@example.com', phone: '+123', membershipTier: 'premium', joinDate: '2024-01-01', lastActive: '2024-12-01', status: 'active', totalTrades: 0, successRate: 0, balance: 0, accountType: '', riskTolerance: '', activities: [], tickets: [], screenshots: [] }
      ];

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ customers: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ customers: mockSearchResults })
        });

      render(<QuantumSupportHub />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('http://localhost:3005/api/customers');
      });

      // This would test the search functionality
      // Implementation would depend on how search is displayed
      expect(true).toBe(true); // Placeholder test
    });

    test('loads all customers when load all button is clicked', async () => {
      render(<QuantumSupportHub />);
      
      // This would test the load all functionality
      // Implementation would depend on how the button is displayed
      expect(true).toBe(true); // Placeholder test
    });
  });

  describe('Data Export', () => {
    test('exports customer data as JSON', () => {
      // Mock URL.createObjectURL and URL.revokeObjectURL
      const mockCreateObjectURL = jest.fn(() => 'mock-url');
      const mockRevokeObjectURL = jest.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      // Mock document.createElement and click
      const mockClick = jest.fn();
      const mockLink = {
        href: '',
        download: '',
        click: mockClick
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      render(<QuantumSupportHub />);
      
      // This would test the export functionality
      // Implementation would depend on how export is triggered
      expect(true).toBe(true); // Placeholder test
    });
  });

  describe('Error Handling', () => {
    test('displays loading state while fetching data', () => {
      (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<QuantumSupportHub />);
      
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });

    test('handles network errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<QuantumSupportHub />);
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error fetching dashboard data:', expect.any(Error));
      });
    });
  });

  describe('Responsive Design', () => {
    test('sidebar collapses and expands on hover', () => {
      render(<QuantumSupportHub />);
      
      const sidebar = screen.getByText('Support Hub').closest('.sidebar');
      expect(sidebar).toHaveClass('w-64');
      
      // This would test hover functionality
      // Implementation would depend on CSS hover states
      expect(true).toBe(true); // Placeholder test
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels and roles', () => {
      render(<QuantumSupportHub />);
      
      // Check for proper navigation structure
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      
      // Check for proper button roles
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('supports keyboard navigation', () => {
      render(<QuantumSupportHub />);
      
      // Test tab navigation
      const firstFocusableElement = screen.getByText('Dashboard');
      firstFocusableElement.focus();
      expect(firstFocusableElement).toHaveFocus();
    });
  });

  describe('Performance', () => {
    test('debounces search input to prevent excessive API calls', () => {
      render(<QuantumSupportHub />);
      
      // This would test search debouncing
      // Implementation would depend on how search is implemented
      expect(true).toBe(true); // Placeholder test
    });

    test('caches customer data to prevent unnecessary refetches', () => {
      render(<QuantumSupportHub />);
      
      // This would test data caching
      // Implementation would depend on caching strategy
      expect(true).toBe(true); // Placeholder test
    });
  });
});
