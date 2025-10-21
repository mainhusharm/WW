// Mock news data to avoid API key issues
const mockNewsData = [
  {
    source: { id: 'forex-news', name: 'Forex News' },
    author: 'Trading Analyst',
    title: 'EUR/USD Reaches New Weekly High Amid ECB Policy Speculation',
    description: 'The Euro strengthened against the Dollar as markets anticipate potential ECB policy changes in the upcoming meeting.',
    url: 'https://example.com/news/1',
    urlToImage: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg',
    publishedAt: new Date().toISOString(),
    content: 'European Central Bank policy speculation drives EUR/USD higher...'
  },
  {
    source: { id: 'market-watch', name: 'Market Watch' },
    author: 'Financial Reporter',
    title: 'Gold Prices Surge on Safe Haven Demand',
    description: 'Gold futures climb as investors seek safe haven assets amid global economic uncertainty.',
    url: 'https://example.com/news/2',
    urlToImage: 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg',
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    content: 'Gold prices continue their upward trajectory as global tensions rise...'
  },
  {
    source: { id: 'trading-central', name: 'Trading Central' },
    author: 'Market Strategist',
    title: 'USD/JPY Technical Analysis: Key Support Levels to Watch',
    description: 'Technical analysis reveals critical support and resistance levels for the USD/JPY currency pair.',
    url: 'https://example.com/news/3',
    urlToImage: 'https://images.pexels.com/photos/186461/pexels-photo-186461.jpeg',
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    content: 'USD/JPY faces key technical levels as traders watch for breakout signals...'
  }
];

export interface Article {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  content: string;
}

export const getNews = async (query: string = 'forex'): Promise<Article[]> => {
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
};
