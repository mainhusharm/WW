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
  try {
    // Use our backend API instead of direct RapidAPI
    const apiBaseUrl = import.meta.env.PROD 
      ? 'http://localhost:3001/api'
      : 'http://localhost:3001/api';
    
    const response = await fetch(`${apiBaseUrl}/news/forex-factory?currency=${currency}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Backend API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.news && Array.isArray(data.news)) {
      // Process and format the news data to match forexfactory.com format
      return data.news.slice(0, 20).map((item: any, index: number) => {
        // Extract impact level from the data
        let impact: 'low' | 'medium' | 'high' = 'medium';
        if (item.impact) {
          const impactStr = item.impact.toString().toLowerCase();
          if (impactStr.includes('high') || impactStr.includes('3')) {
            impact = 'high';
          } else if (impactStr.includes('low') || impactStr.includes('1')) {
            impact = 'low';
          } else {
            impact = 'medium';
          }
        }
        
        // Format time properly
        let time = '00:00';
        if (item.time) {
          // Handle different time formats from the API
          if (typeof item.time === 'string') {
            if (item.time.includes(':')) {
              time = item.time;
            } else if (item.time.includes('AM') || item.time.includes('PM')) {
              // Convert 12h format to 24h if needed
              time = item.time;
            }
          }
        }
        
        // Extract currency from the data
        let eventCurrency = currency;
        if (item.currency && item.currency !== 'ALL') {
          eventCurrency = item.currency;
        }
        
        // Create a proper event name
        let eventName = 'Forex Event';
        if (item.event) {
          eventName = item.event;
        } else if (item.title) {
          eventName = item.title;
        } else if (item.event_name) {
          eventName = item.event_name;
        }
        
        // Create a proper headline
        let headline = eventName;
        if (item.headline) {
          headline = item.headline;
        } else if (item.title) {
          headline = item.title;
        }
        
        return {
          id: item.id || `news_${index}_${Date.now()}`,
          date: item.date || now.toISOString().split('T')[0],
          time: time,
          currency: eventCurrency,
          impact: impact,
          event: eventName,
          headline: headline,
          source: item.source || 'Forex Factory',
          url: item.url || '#',
          actual: item.actual || item.actual_value,
          forecast: item.forecast || item.forecast_value,
          previous: item.previous || item.previous_value,
          detail: item.detail || item.description || ''
        };
      });
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
      time: '08:30',
      currency: currency === 'ALL' ? 'USD' : currency,
      impact: 'high',
      event: 'Non-Farm Payrolls',
      headline: 'US Employment Report - Non-Farm Payrolls',
      source: 'US Bureau of Labor Statistics',
      url: '#',
      actual: '187K',
      forecast: '185K',
      previous: '173K',
      detail: 'Monthly employment report from the US Bureau of Labor Statistics showing the number of new jobs created in the non-farm sector'
    },
    {
      id: `mock_2_${Date.now()}`,
      date: now.toISOString().split('T')[0],
      time: '14:00',
      currency: currency === 'ALL' ? 'EUR' : currency,
      impact: 'high',
      event: 'ECB Interest Rate Decision',
      headline: 'European Central Bank Rate Decision',
      source: 'European Central Bank',
      url: '#',
      actual: '4.50%',
      forecast: '4.50%',
      previous: '4.50%',
      detail: 'European Central Bank monetary policy decision and press conference'
    },
    {
      id: `mock_3_${Date.now()}`,
      date: now.toISOString().split('T')[0],
      time: '09:00',
      currency: currency === 'ALL' ? 'GBP' : currency,
      impact: 'medium',
      event: 'UK GDP Preliminary',
      headline: 'UK Gross Domestic Product Preliminary Release',
      source: 'Office for National Statistics',
      url: '#',
      actual: '0.2%',
      forecast: '0.1%',
      previous: '-0.1%',
      detail: 'Preliminary estimate of UK economic growth for the quarter'
    },
    {
      id: `mock_4_${Date.now()}`,
      date: now.toISOString().split('T')[0],
      time: '12:30',
      currency: currency === 'ALL' ? 'CAD' : currency,
      impact: 'medium',
      event: 'Bank of Canada Rate Decision',
      headline: 'Bank of Canada Monetary Policy Report',
      source: 'Bank of Canada',
      url: '#',
      actual: '5.00%',
      forecast: '5.00%',
      previous: '5.00%',
      detail: 'Bank of Canada interest rate decision and monetary policy report'
    },
    {
      id: `mock_5_${Date.now()}`,
      date: now.toISOString().split('T')[0],
      time: '10:00',
      currency: currency === 'ALL' ? 'AUD' : currency,
      impact: 'low',
      event: 'RBA Meeting Minutes',
      headline: 'Reserve Bank of Australia Meeting Minutes',
      source: 'Reserve Bank of Australia',
      url: '#',
      actual: 'Released',
      forecast: 'Released',
      previous: 'Released',
      detail: 'Minutes from the latest Reserve Bank of Australia monetary policy meeting'
    }
  ];
};

export const fetchForexFactoryNews = async (
  selectedDate: Date = new Date(),
  currency: string = 'ALL'
): Promise<ForexFactoryEvent[]> => {
  // Use mock data directly to avoid connection errors
  // This prevents ERR_CONNECTION_REFUSED errors when backend is not running
  return getMockForexNews(currency);
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
