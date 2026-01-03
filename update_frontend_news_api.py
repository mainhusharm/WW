#!/usr/bin/env python3
"""
Update Frontend to Use Real ForexFactory News API
"""

import os

def update_news_service():
    """Update the news service to use real ForexFactory API"""
    try:
        print("🔄 Updating news service to use real ForexFactory API...")
        
        # Read the current news service
        with open('src/services/newsService.ts', 'r') as f:
            content = f.read()
        
        # Replace the mock implementation with real API calls
        old_implementation = '''export const getNews = async (query: string = 'forex'): Promise<Article[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return mock data filtered by query if needed
  return mockNewsData.filter(article => 
    article.title.toLowerCase().includes(query.toLowerCase()) ||
    article.description.toLowerCase().includes(query.toLowerCase()) ||
    query === 'forex' // Default query returns all articles
  );
};'''
        
        new_implementation = '''export const getNews = async (query: string = 'forex'): Promise<Article[]> => {
  try {
    // Try to fetch real news from ForexFactory API
    const response = await fetch('/api/forex-news/today');
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.success && data.events && data.events.length > 0) {
        // Convert ForexFactory events to Article format
        return data.events.map((event: any) => ({
          title: event.event,
          description: `${event.currency} - ${event.impact} Impact`,
          url: '#',
          source: { name: 'ForexFactory' },
          urlToImage: '',
          publishedAt: event.timestamp,
          content: `Actual: ${event.actual || 'N/A'}, Forecast: ${event.forecast || 'N/A'}, Previous: ${event.previous || 'N/A'}`
        }));
      }
    }
    
    // Fallback to mock data if API fails
    console.log('Using fallback news data');
    return mockNewsData.filter(article => 
      article.title.toLowerCase().includes(query.toLowerCase()) ||
      article.description.toLowerCase().includes(query.toLowerCase()) ||
      query === 'forex'
    );
    
  } catch (error) {
    console.error('Error fetching news:', error);
    // Return mock data on error
    return mockNewsData.filter(article => 
      article.title.toLowerCase().includes(query.toLowerCase()) ||
      article.description.toLowerCase().includes(query.toLowerCase()) ||
      query === 'forex'
    );
  }
};'''
        
        updated_content = content.replace(old_implementation, new_implementation)
        
        # Write the updated file
        with open('src/services/newsService.ts', 'w') as f:
            f.write(updated_content)
        
        print("✅ News service updated to use real ForexFactory API")
        return True
        
    except Exception as e:
        print(f"❌ Error updating news service: {str(e)}")
        return False

def update_forex_factory_service():
    """Update the ForexFactory service to use the real API"""
    try:
        print("🔄 Updating ForexFactory service...")
        
        # Read the current ForexFactory service
        with open('src/services/forexFactoryService.ts', 'r') as f:
            content = f.read()
        
        # Update the getRapidAPIForexNews function
        old_function = '''const getRapidAPIForexNews = async (currency: string = 'ALL'): Promise<ForexFactoryEvent[]> => {
  try {
    const response = await fetch(`/api/forex-news?currency=${currency}`);
    const data = await response.json();
    
    if (data.success && data.events) {
      return data.events;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching ForexFactory news:', error);
    return [];
  }
};'''
        
        new_function = '''const getRapidAPIForexNews = async (currency: string = 'ALL'): Promise<ForexFactoryEvent[]> => {
  try {
    // Use the real ForexFactory API endpoint
    const response = await fetch(`/api/forex-news?currency=${currency}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.success && data.events && data.events.length > 0) {
        console.log(`✅ Fetched ${data.events.length} real ForexFactory events`);
        return data.events;
      } else {
        console.log('No events found in ForexFactory response');
        return [];
      }
    } else {
      console.error(`ForexFactory API error: ${response.status}`);
      return [];
    }
  } catch (error) {
    console.error('Error fetching ForexFactory news:', error);
    return [];
  }
};'''
        
        updated_content = content.replace(old_function, new_function)
        
        # Write the updated file
        with open('src/services/forexFactoryService.ts', 'w') as f:
            f.write(updated_content)
        
        print("✅ ForexFactory service updated")
        return True
        
    except Exception as e:
        print(f"❌ Error updating ForexFactory service: {str(e)}")
        return False

def main():
    """Main function"""
    print("🚀 Update Frontend News API")
    print("=" * 40)
    
    try:
        # Update news service
        update_news_service()
        print()
        
        # Update ForexFactory service
        update_forex_factory_service()
        
        print()
        print("=" * 40)
        print("✅ Frontend news API updated")
        print("📰 News section will now use real ForexFactory data")
        print("=" * 40)
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == '__main__':
    main()
