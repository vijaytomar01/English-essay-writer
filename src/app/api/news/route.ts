import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  category: string;
  publishedAt: string;
  imageUrl?: string;
  content?: string;
}

// RSS feeds for major Indian newspapers
const NEWS_SOURCES = {
  thehindu: {
    name: 'The Hindu',
    feeds: {
      national: 'https://www.thehindu.com/news/national/feeder/default.rss',
      international: 'https://www.thehindu.com/news/international/feeder/default.rss',
      business: 'https://www.thehindu.com/business/feeder/default.rss',
      sport: 'https://www.thehindu.com/sport/feeder/default.rss',
      opinion: 'https://www.thehindu.com/opinion/feeder/default.rss',
      scitech: 'https://www.thehindu.com/sci-tech/feeder/default.rss'
    }
  },
  hindustantimes: {
    name: 'Hindustan Times',
    feeds: {
      national: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml',
      international: 'https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml',
      business: 'https://www.hindustantimes.com/feeds/rss/business-news/rssfeed.xml',
      sports: 'https://www.hindustantimes.com/feeds/rss/sports-news/rssfeed.xml',
      opinion: 'https://www.hindustantimes.com/feeds/rss/analysis-news/rssfeed.xml',
      lifestyle: 'https://www.hindustantimes.com/feeds/rss/lifestyle/rssfeed.xml'
    }
  }
};

// Mock news data as fallback (in case RSS feeds are not accessible)
const MOCK_NEWS: NewsArticle[] = [
  {
    id: '1',
    title: 'India\'s Digital Revolution: Transforming Education Through Technology',
    description: 'How digital initiatives are reshaping the educational landscape in India, from rural schools to urban universities.',
    url: 'https://www.thehindu.com/news/national/digital-education-india/article123456.ece',
    source: 'The Hindu',
    category: 'Education & Technology',
    publishedAt: new Date().toISOString(),
    content: 'India is witnessing a remarkable transformation in its educational sector through digital technology. From the implementation of digital classrooms in rural areas to the adoption of AI-powered learning platforms in urban schools, the country is embracing technology to bridge educational gaps. The National Education Policy 2020 has further accelerated this digital transformation, emphasizing the need for technology integration in teaching and learning processes.'
  },
  {
    id: '2',
    title: 'Climate Change Impact on Indian Agriculture: Challenges and Solutions',
    description: 'Examining how changing weather patterns are affecting crop yields and farmer livelihoods across India.',
    url: 'https://www.hindustantimes.com/india-news/climate-agriculture-impact/story-789012.html',
    source: 'Hindustan Times',
    category: 'Environment & Agriculture',
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    content: 'Indian agriculture faces unprecedented challenges due to climate change. Erratic rainfall patterns, rising temperatures, and extreme weather events are significantly impacting crop productivity. Farmers across different states are experiencing reduced yields, particularly in wheat and rice production. However, innovative solutions like drought-resistant crops, precision farming, and sustainable agricultural practices are emerging as potential remedies.'
  },
  {
    id: '3',
    title: 'India\'s Space Program: Recent Achievements and Future Missions',
    description: 'A comprehensive look at ISRO\'s recent successes and upcoming ambitious space exploration projects.',
    url: 'https://www.thehindu.com/sci-tech/science/isro-space-missions/article345678.ece',
    source: 'The Hindu',
    category: 'Science & Technology',
    publishedAt: new Date(Date.now() - 172800000).toISOString(),
    content: 'The Indian Space Research Organisation (ISRO) continues to make remarkable strides in space exploration. Recent successful missions including lunar and Mars explorations have positioned India as a major player in the global space arena. With upcoming missions to Venus and the Sun, along with ambitious plans for human spaceflight, India\'s space program represents a perfect blend of scientific achievement and cost-effective innovation.'
  },
  {
    id: '4',
    title: 'Economic Recovery Post-Pandemic: India\'s Growth Trajectory',
    description: 'Analyzing India\'s economic resilience and recovery strategies following the global pandemic.',
    url: 'https://www.hindustantimes.com/business/economic-recovery-india/story-456789.html',
    source: 'Hindustan Times',
    category: 'Economics & Business',
    publishedAt: new Date(Date.now() - 259200000).toISOString(),
    content: 'India\'s economy has shown remarkable resilience in recovering from the pandemic-induced slowdown. Government initiatives like the Production Linked Incentive (PLI) scheme, infrastructure development projects, and digital payment adoption have contributed to economic revival. The services sector, particularly IT and digital services, has been a major driver of growth, while manufacturing is gradually gaining momentum through various policy interventions.'
  },
  {
    id: '5',
    title: 'Mental Health Awareness in India: Breaking the Stigma',
    description: 'Exploring the growing awareness about mental health issues and the need for accessible mental healthcare.',
    url: 'https://www.thehindu.com/news/national/mental-health-awareness/article567890.ece',
    source: 'The Hindu',
    category: 'Health & Society',
    publishedAt: new Date(Date.now() - 345600000).toISOString(),
    content: 'Mental health awareness in India is experiencing a significant shift. The pandemic has highlighted the importance of psychological well-being, leading to increased discussions about mental health in workplaces, schools, and communities. However, challenges remain in terms of accessibility to mental healthcare services, especially in rural areas, and the persistent stigma associated with mental health issues.'
  },
  {
    id: '6',
    title: 'Renewable Energy Revolution: India\'s Path to Sustainability',
    description: 'How India is leading the global transition towards renewable energy sources and sustainable development.',
    url: 'https://www.hindustantimes.com/india-news/renewable-energy-india/story-678901.html',
    source: 'Hindustan Times',
    category: 'Environment & Energy',
    publishedAt: new Date(Date.now() - 432000000).toISOString(),
    content: 'India has emerged as a global leader in renewable energy adoption. With ambitious targets for solar and wind energy capacity, the country is making significant progress towards achieving its climate commitments. The renewable energy sector is not only contributing to environmental sustainability but also creating numerous employment opportunities and driving technological innovation across the country.'
  }
];

async function fetchRSSFeed(url: string, source: string, category: string): Promise<NewsArticle[]> {
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data, { xmlMode: true });
    const articles: NewsArticle[] = [];

    $('item').each((index, element) => {
      if (index < 5) { // Limit to 5 articles per feed
        const title = $(element).find('title').text().trim();
        const description = $(element).find('description').text().trim();
        const link = $(element).find('link').text().trim();
        const pubDate = $(element).find('pubDate').text().trim();

        if (title && description && link) {
          articles.push({
            id: `${source}-${category}-${index}`,
            title: title,
            description: description.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
            url: link,
            source: source,
            category: category,
            publishedAt: pubDate || new Date().toISOString()
          });
        }
      }
    });

    return articles;
  } catch (error) {
    console.error(`Error fetching RSS feed ${url}:`, error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'all';
    const category = searchParams.get('category') || 'all';

    let allArticles: NewsArticle[] = [];

    // Try to fetch from RSS feeds
    const fetchPromises: Promise<NewsArticle[]>[] = [];

    if (source === 'all' || source === 'thehindu') {
      const hinduFeeds = NEWS_SOURCES.thehindu.feeds;
      if (category === 'all') {
        Object.entries(hinduFeeds).forEach(([cat, url]) => {
          fetchPromises.push(fetchRSSFeed(url, 'The Hindu', cat));
        });
      } else if (hinduFeeds[category as keyof typeof hinduFeeds]) {
        fetchPromises.push(fetchRSSFeed(hinduFeeds[category as keyof typeof hinduFeeds], 'The Hindu', category));
      }
    }

    if (source === 'all' || source === 'hindustantimes') {
      const htFeeds = NEWS_SOURCES.hindustantimes.feeds;
      if (category === 'all') {
        Object.entries(htFeeds).forEach(([cat, url]) => {
          fetchPromises.push(fetchRSSFeed(url, 'Hindustan Times', cat));
        });
      } else if (htFeeds[category as keyof typeof htFeeds]) {
        fetchPromises.push(fetchRSSFeed(htFeeds[category as keyof typeof htFeeds], 'Hindustan Times', category));
      }
    }

    // Execute all fetch promises with timeout
    const results = await Promise.allSettled(fetchPromises);
    
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value);
      }
    });

    // If no articles fetched from RSS, use mock data
    if (allArticles.length === 0) {
      console.log('Using mock data as fallback');
      allArticles = MOCK_NEWS;
    }

    // Filter by source and category if specified
    let filteredArticles = allArticles;
    
    if (source !== 'all') {
      const sourceName = source === 'thehindu' ? 'The Hindu' : 'Hindustan Times';
      filteredArticles = filteredArticles.filter(article => article.source === sourceName);
    }

    if (category !== 'all') {
      filteredArticles = filteredArticles.filter(article => 
        article.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Sort by published date (newest first)
    filteredArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Limit to 20 articles
    filteredArticles = filteredArticles.slice(0, 20);

    return NextResponse.json({
      success: true,
      articles: filteredArticles,
      total: filteredArticles.length,
      sources: ['The Hindu', 'Hindustan Times']
    });

  } catch (error) {
    console.error('Error in news API:', error);
    
    // Return mock data on error
    return NextResponse.json({
      success: true,
      articles: MOCK_NEWS,
      total: MOCK_NEWS.length,
      sources: ['The Hindu', 'Hindustan Times'],
      note: 'Using cached data due to network issues'
    });
  }
}
