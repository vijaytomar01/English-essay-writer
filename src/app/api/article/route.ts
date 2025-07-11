import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface ArticleDetails {
  id: string;
  title: string;
  content: string;
  summary: string;
  keyPoints: string[];
  relatedTopics: string[];
  source: string;
  publishedAt: string;
  author?: string;
  imageUrl?: string;
  url: string;
}

// Mock detailed article content for fallback
const MOCK_ARTICLE_DETAILS: { [key: string]: ArticleDetails } = {
  '1': {
    id: '1',
    title: 'India\'s Digital Revolution: Transforming Education Through Technology',
    content: `India is witnessing an unprecedented transformation in its educational landscape through the strategic integration of digital technology. This revolution, accelerated by the National Education Policy 2020 and further catalyzed by the COVID-19 pandemic, is reshaping how students learn and teachers teach across the country.

The digital transformation in education encompasses multiple dimensions. In rural areas, where access to quality education has traditionally been limited, digital classrooms equipped with smart boards, tablets, and high-speed internet connectivity are bridging the urban-rural education divide. Students in remote villages now have access to the same quality of educational content as their urban counterparts.

Urban schools and universities are embracing advanced technologies such as artificial intelligence, virtual reality, and machine learning to create personalized learning experiences. AI-powered platforms can assess individual student performance and adapt teaching methods accordingly, ensuring that no student is left behind.

The government's Digital India initiative has played a crucial role in this transformation. Programs like PM eVIDYA, DIKSHA platform, and SWAYAM have democratized access to quality educational content. These platforms offer courses in multiple languages, making education more inclusive and accessible to diverse linguistic communities.

However, challenges remain. The digital divide, particularly in terms of device availability and internet connectivity, continues to affect students from economically disadvantaged backgrounds. Teacher training and digital literacy are other areas that require sustained attention and investment.

Looking ahead, the integration of emerging technologies like blockchain for credential verification, IoT for smart campus management, and advanced analytics for educational insights promises to further revolutionize the sector. India's digital education revolution is not just about technology adoption; it's about creating an inclusive, accessible, and quality education system for all.`,
    summary: 'India is undergoing a major digital transformation in education, driven by government initiatives and accelerated by the pandemic. While significant progress has been made in bridging educational gaps through technology, challenges like the digital divide and teacher training remain.',
    keyPoints: [
      'Digital classrooms bridging urban-rural education divide',
      'AI and VR creating personalized learning experiences',
      'Government initiatives like PM eVIDYA and DIKSHA democratizing education',
      'Challenges include digital divide and teacher training needs',
      'Future integration of blockchain, IoT, and analytics in education'
    ],
    relatedTopics: [
      'National Education Policy 2020',
      'Digital India Initiative',
      'AI in Education',
      'Rural Education Development',
      'Teacher Training Programs'
    ],
    source: 'The Hindu',
    publishedAt: new Date().toISOString(),
    author: 'Education Correspondent',
    url: 'https://www.thehindu.com/news/national/digital-education-india/article123456.ece'
  },
  '2': {
    id: '2',
    title: 'Climate Change Impact on Indian Agriculture: Challenges and Solutions',
    content: `Indian agriculture, which employs nearly half of the country's workforce and contributes significantly to the GDP, is facing unprecedented challenges due to climate change. The sector, heavily dependent on monsoon patterns, is experiencing severe disruptions that threaten food security and farmer livelihoods.

The most visible impact of climate change on Indian agriculture is the alteration of rainfall patterns. Traditional monsoon cycles, which farmers have relied upon for centuries, are becoming increasingly unpredictable. Some regions experience excessive rainfall leading to floods, while others face prolonged droughts. This unpredictability makes crop planning extremely difficult.

Rising temperatures are another major concern. Heat stress affects crop growth, particularly for temperature-sensitive crops like wheat and rice. Studies indicate that a 1°C increase in temperature can reduce wheat yields by 4-5% and rice yields by 3-4%. This is particularly concerning given India's role as a major producer of these staple crops.

Extreme weather events, including cyclones, hailstorms, and unseasonal rains, have become more frequent and intense. These events can destroy entire crops within hours, leading to massive economic losses for farmers. The increasing frequency of such events is making agriculture an increasingly risky profession.

However, innovative solutions are emerging. Climate-resilient crop varieties developed through advanced breeding techniques and biotechnology are showing promise. These varieties can withstand drought, flood, and heat stress while maintaining good yields. Precision farming techniques using satellite imagery, drones, and IoT sensors are helping farmers optimize water and fertilizer use.

The government has launched several initiatives to address these challenges. The National Mission for Sustainable Agriculture focuses on promoting climate-resilient practices. Crop insurance schemes are being expanded to provide financial protection to farmers against climate-related losses.

Water management is crucial for climate adaptation. Micro-irrigation systems, rainwater harvesting, and efficient water storage solutions are being promoted. The revival of traditional water conservation practices combined with modern technology offers hope for sustainable water management.

The path forward requires a multi-pronged approach involving policy support, technological innovation, and farmer education. Building climate resilience in Indian agriculture is not just an environmental imperative but an economic and social necessity.`,
    summary: 'Climate change is severely impacting Indian agriculture through altered rainfall patterns, rising temperatures, and extreme weather events. While challenges are significant, innovative solutions including climate-resilient crops and precision farming offer hope.',
    keyPoints: [
      'Unpredictable monsoon patterns disrupting traditional farming',
      'Rising temperatures reducing wheat and rice yields',
      'Extreme weather events causing massive crop losses',
      'Climate-resilient crop varieties showing promise',
      'Precision farming and water management as key solutions'
    ],
    relatedTopics: [
      'Monsoon Patterns in India',
      'Food Security',
      'Sustainable Agriculture',
      'Water Conservation',
      'Crop Insurance Schemes'
    ],
    source: 'Hindustan Times',
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    author: 'Agricultural Correspondent',
    url: 'https://www.hindustantimes.com/india-news/climate-agriculture-impact/story-789012.html'
  }
};

async function fetchArticleContent(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Try different selectors for article content based on common newspaper structures
    let content = '';
    
    // The Hindu selectors
    if (url.includes('thehindu.com')) {
      content = $('.article-content p, .content p, .story-content p').map((_, el) => $(el).text()).get().join('\n\n');
    }
    // Hindustan Times selectors
    else if (url.includes('hindustantimes.com')) {
      content = $('.story-details p, .detail-body p, .storyDetails p').map((_, el) => $(el).text()).get().join('\n\n');
    }
    // Generic selectors
    else {
      content = $('article p, .article p, .content p, .post-content p').map((_, el) => $(el).text()).get().join('\n\n');
    }

    return content.trim();
  } catch (error) {
    console.error('Error fetching article content:', error);
    return '';
  }
}

function generateSummary(content: string): string {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  return sentences.slice(0, 3).join('. ') + '.';
}

function extractKeyPoints(content: string): string[] {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 30);
  return sentences.slice(0, 5).map(s => s.trim());
}

function generateRelatedTopics(title: string, content: string): string[] {
  const keywords = [
    ...title.toLowerCase().split(/\s+/),
    ...content.toLowerCase().split(/\s+/)
  ];
  
  const topicKeywords = keywords.filter(word => 
    word.length > 4 && 
    !['that', 'this', 'with', 'from', 'they', 'have', 'been', 'will', 'were', 'said'].includes(word)
  );
  
  const uniqueTopics = [...new Set(topicKeywords)].slice(0, 5);
  return uniqueTopics.map(topic => topic.charAt(0).toUpperCase() + topic.slice(1));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('id');
    const articleUrl = searchParams.get('url');

    if (!articleId && !articleUrl) {
      return NextResponse.json({
        success: false,
        error: 'Article ID or URL is required'
      }, { status: 400 });
    }

    // Check if we have mock data for this article ID
    if (articleId && MOCK_ARTICLE_DETAILS[articleId]) {
      return NextResponse.json({
        success: true,
        article: MOCK_ARTICLE_DETAILS[articleId]
      });
    }

    // If URL is provided, try to fetch real content
    if (articleUrl) {
      try {
        const content = await fetchArticleContent(articleUrl);
        
        if (content) {
          const articleDetails: ArticleDetails = {
            id: articleId || 'fetched',
            title: 'Fetched Article',
            content: content,
            summary: generateSummary(content),
            keyPoints: extractKeyPoints(content),
            relatedTopics: generateRelatedTopics('', content),
            source: articleUrl.includes('thehindu.com') ? 'The Hindu' : 'Hindustan Times',
            publishedAt: new Date().toISOString(),
            url: articleUrl
          };

          return NextResponse.json({
            success: true,
            article: articleDetails
          });
        }
      } catch (error) {
        console.error('Error fetching article:', error);
      }
    }

    // Fallback to mock data
    const fallbackArticle = Object.values(MOCK_ARTICLE_DETAILS)[0];
    return NextResponse.json({
      success: true,
      article: fallbackArticle,
      note: 'Using sample article data'
    });

  } catch (error) {
    console.error('Error in article API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch article details'
    }, { status: 500 });
  }
}
