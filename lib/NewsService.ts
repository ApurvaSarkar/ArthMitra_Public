import { Platform } from 'react-native';

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  image_url?: string;
  published_at: string;
  source: string;
  entities?: {
    symbol?: string;
    name?: string;
  }[];
}

export interface NewsResponse {
  data: NewsArticle[];
  meta: {
    found: number;
    returned: number;
    limit: number;
    page: number;
  };
}

const API_KEY = process.env.EXPO_PUBLIC_MARKETAUX_API_KEY;
const BASE_URL = 'https://api.marketaux.com/v1/news';

// Add a retry mechanism for API calls
const fetchWithRetry = async (url: string, options: RequestInit = {}, retries = 3): Promise<Response> => {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (retries <= 1) throw err;
    console.log(`Retrying fetch (${retries-1} attempts left)...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return fetchWithRetry(url, options, retries - 1);
  }
};

// Add a function to check API key validity
export const checkApiKeyValidity = async (): Promise<boolean> => {
  if (!API_KEY) {
    console.error('Marketaux API key not found in environment variables');
    return false;
  }
  
  try {
    // Make a minimal API call to check if the key is valid
    const params = new URLSearchParams({
      api_token: API_KEY,
      limit: '1'
    });
    
    const url = `${BASE_URL}?${params}`;
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API key validation failed: ${response.status}, response: ${errorText}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating API key:', error);
    return false;
  }
};

export const fetchEconomicNews = async (limit: number = 10): Promise<NewsArticle[]> => {
  try {
    if (!API_KEY) {
      console.error('Marketaux API key not found in environment variables');
      throw new Error('Marketaux API key not found in environment variables');
    }

    console.log('Fetching economic news with API key available:', !!API_KEY);
    
    const params = new URLSearchParams({
      api_token: API_KEY,
      countries: 'us,in,gb', // US, India, UK for broader economic coverage
      filter_entities: 'true',
      language: 'en',
      limit: limit.toString(),
      sort: 'published_desc'
    });

    const url = `${BASE_URL}?${params}`;
    console.log('Fetching from URL:', url.replace(API_KEY, '[REDACTED]'));
    
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: NewsResponse = await response.json();
    console.log('Received news data count:', data.data?.length || 0);
    
    if (data.data && data.data.length > 0) {
      return data.data;
    } else {
      console.warn('No news data returned from API, using mock data');
      return getMockNews();
    }
  } catch (error) {
    console.error('Error fetching economic news:', error);
    // Return mock data for development/fallback
    return getMockNews();
  }
};

export const fetchFinancialNews = async (symbols: string[] = [], limit: number = 5): Promise<NewsArticle[]> => {
  try {
    if (!API_KEY) {
      console.error('Marketaux API key not found in environment variables');
      throw new Error('Marketaux API key not found in environment variables');
    }

    console.log('Fetching financial news with API key available:', !!API_KEY);

    const params = new URLSearchParams({
      api_token: API_KEY,
      symbols: symbols.length > 0 ? symbols.join(',') : 'AAPL,GOOGL,MSFT,TSLA,AMZN',
      filter_entities: 'true',
      language: 'en',
      limit: limit.toString(),
      sort: 'published_desc'
    });

    const url = `${BASE_URL}?${params}`;
    console.log('Fetching from URL:', url.replace(API_KEY, '[REDACTED]'));

    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: NewsResponse = await response.json();
    console.log('Received financial news data count:', data.data?.length || 0);
    
    return data.data || [];
  } catch (error) {
    console.error('Error fetching financial news:', error);
    return getMockNews();
  }
};

const getMockNews = (): NewsArticle[] => {
  return [
    {
      title: "Federal Reserve Maintains Interest Rates Amid Economic Uncertainty",
      description: "The Federal Reserve decided to keep interest rates unchanged as economic indicators show mixed signals about inflation and growth.",
      url: "#",
      published_at: new Date().toISOString(),
      source: "Economic Times",
      entities: [{ symbol: "USD", name: "US Dollar" }]
    },
    {
      title: "Global Markets React to Latest Employment Data",
      description: "Stock markets worldwide showed volatility following the release of employment statistics that exceeded expectations.",
      url: "#",
      published_at: new Date(Date.now() - 3600000).toISOString(),
      source: "Financial News",
      entities: [{ symbol: "SPY", name: "S&P 500" }]
    },
    {
      title: "Cryptocurrency Market Shows Signs of Recovery",
      description: "Bitcoin and other major cryptocurrencies have gained momentum as institutional investors show renewed interest.",
      url: "#",
      published_at: new Date(Date.now() - 7200000).toISOString(),
      source: "Crypto Daily",
      entities: [{ symbol: "BTC", name: "Bitcoin" }]
    },
    {
      title: "Oil Prices Surge on Supply Chain Concerns",
      description: "Crude oil prices reached new highs this month due to ongoing supply chain disruptions and geopolitical tensions.",
      url: "#",
      published_at: new Date(Date.now() - 10800000).toISOString(),
      source: "Energy Report",
      entities: [{ symbol: "OIL", name: "Crude Oil" }]
    },
    {
      title: "Tech Stocks Lead Market Rally",
      description: "Technology companies posted strong quarterly results, driving broader market gains across major indices.",
      url: "#",
      published_at: new Date(Date.now() - 14400000).toISOString(),
      source: "Tech Finance",
      entities: [{ symbol: "TECH", name: "Technology Sector" }]
    }
  ];
};

export const formatNewsDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
};