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
  message?: string;
}

const getFinnhubNews = async (currency: string): Promise<ForexFactoryEvent[]> => {
  const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
  const url = `https://finnhub.io/api/v1/news?category=forex&token=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (Array.isArray(data)) {
      return data.slice(0, 20).map((item: any) => ({
        id: item.id.toString(),
        date: new Date(item.datetime * 1000).toISOString().split('T')[0],
        time: new Date(item.datetime * 1000).toLocaleTimeString(),
        currency: item.related,
        impact: 'medium', // Finnhub API doesn't provide impact, so we'll default to medium
        event: item.headline,
        headline: item.headline,
        source: item.source,
        url: item.url,
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching Finnhub news:', error);
    return [];
  }
};

export const fetchForexFactoryNews = async (
  selectedDate: Date = new Date(),
  currency: string = 'ALL'
): Promise<ForexFactoryEvent[]> => {
  const newsData = await getFinnhubNews(currency);
  
  // Filter by currency if specified
  const filteredData = currency === 'ALL' 
    ? newsData 
    : newsData.filter((event: ForexFactoryEvent) => event.currency.includes(currency));
  
  return filteredData;
};

export const getImpactColor = (impact: 'low' | 'medium' | 'high'): string => {
  switch (impact) {
    case 'high':
      return 'text-red-400 bg-red-400/20';
    case 'medium':
      return 'text-yellow-400 bg-yellow-400/20';
    case 'low':
      return 'text-green-400 bg-green-400/20';
    default:
      return 'text-gray-400 bg-gray-400/20';
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
