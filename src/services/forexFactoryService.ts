export interface ForexFactoryEvent {
  id: string;
  date: string;
  time: string;
  currency: string;
  impact: 'low' | 'medium' | 'high';
  event: string;
  actual?: string;
  forecast?: string;
  previous?: string;
  detail?: string;
  headline: string;
  source: string;
  url: string;
}

export interface ForexFactoryResponse {
  events: ForexFactoryEvent[];
  status: string;
}

const getRapidAPIForexNews = async (currency: string): Promise<ForexFactoryEvent[]> => {
  const RAPIDAPI_KEY = '68dc9d220amsh35ccd500e6b2ff1p13e4e9jsn989df0c5acd2';
  const RAPIDAPI_HOST = 'forex-factory-scraper1.p.rapidapi.com';
  
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    const url = `https://forex-factory-scraper1.p.rapidapi.com/get_calendar_details?year=${year}&month=${month}&day=${day}&currency=${currency}&event_name=ALL&timezone=GMT-06%3A00%20Central%20Time%20(US%20%26%20Canada)&time_format=12h`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`RapidAPI request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && Array.isArray(data)) {
      return data.slice(0, 20).map((item: any, index: number) => ({
        id: item.id || `news_${index}_${Date.now()}`,
        date: item.date || now.toISOString().split('T')[0],
        time: item.time || now.toLocaleTimeString(),
        currency: item.currency || currency,
        impact: item.impact || 'medium',
        event: item.event || item.title || 'Forex Event',
        headline: item.title || item.event || 'Forex Market Update',
        source: item.source || 'Forex Factory',
        url: item.url || '#',
        actual: item.actual,
        forecast: item.forecast,
        previous: item.previous,
        detail: item.detail
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching RapidAPI forex news:', error);
    // Fallback to mock data if API fails
    return getMockForexNews(currency);
  }
};

const getMockForexNews = (currency: string): ForexFactoryEvent[] => {
  const now = new Date();
  return [
    {
      id: `mock_1_${Date.now()}`,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString(),
      currency: currency === 'ALL' ? 'USD' : currency,
      impact: 'high',
      event: 'Federal Reserve Interest Rate Decision',
      headline: 'Fed Signals Potential Rate Changes in Q2 2024',
      source: 'Federal Reserve',
      url: '#',
      actual: '5.25%',
      forecast: '5.25%',
      previous: '5.25%'
    },
    {
      id: `mock_2_${Date.now()}`,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString(),
      currency: currency === 'ALL' ? 'EUR' : currency,
      impact: 'medium',
      event: 'ECB Economic Bulletin',
      headline: 'European Central Bank Maintains Current Policy Stance',
      source: 'European Central Bank',
      url: '#',
      actual: '4.50%',
      forecast: '4.50%',
      previous: '4.50%'
    }
  ];
};

export const fetchForexFactoryNews = async (
  selectedDate: Date = new Date(),
  currency: string = 'ALL'
): Promise<ForexFactoryEvent[]> => {
  try {
    // Try to get real-time news from RapidAPI first
    const newsData = await getRapidAPIForexNews(currency);
    
    if (newsData.length > 0) {
      return newsData;
    }
    
    // Fallback to mock data if no real data available
    return getMockForexNews(currency);
  } catch (error) {
    console.error('Error in fetchForexFactoryNews:', error);
    return getMockForexNews(currency);
  }
};

export const getImpactColor = (impact: 'low' | 'medium' | 'high'): string => {
  switch (impact) {
    case 'high':
      return 'bg-red-600 text-white';
    case 'medium':
      return 'bg-yellow-600 text-white';
    case 'low':
      return 'bg-green-600 text-white';
    default:
      return 'bg-gray-600 text-white';
  }
};

export const getImpactIcon = (impact: 'low' | 'medium' | 'high'): string => {
  switch (impact) {
    case 'high':
      return '🔴';
    case 'medium':
      return '🟡';
    case 'low':
      return '🟢';
    default:
      return '⚪';
  }
};

export const formatEventTime = (time: string | undefined, timezone: string = 'America/New_York'): string => {
  try {
    if (!time || typeof time !== 'string') {
      return '00:00';
    }

    // Handle cases where time might be in different formats
    if (!time.includes(':')) {
      return '00:00';
    }

    const [hoursStr, minutesStr] = time.split(':');
    const hoursNum = parseInt(hoursStr, 10);
    const minutesNum = parseInt(minutesStr || '0', 10);

    if (isNaN(hoursNum) || isNaN(minutesNum)) {
      return time || '00:00';
    }

    const timezoneOffsets: { [key: string]: number } = {
      'America/New_York': -5,
      'Europe/London': 0,
      'Asia/Tokyo': 9,
      'Australia/Sydney': 11,
      'Europe/Frankfurt': 1
    };

    const offset = timezoneOffsets[timezone] || 0;
    const adjustedHours = (hoursNum + offset + 24) % 24;
    
    const formattedHours = adjustedHours.toString().padStart(2, '0');
    const formattedMinutes = minutesNum.toString().padStart(2, '0');
    
    return `${formattedHours}:${formattedMinutes}`;
  } catch (error) {
    console.error('Error formatting event time:', error);
    return time || '00:00';
  }
};
