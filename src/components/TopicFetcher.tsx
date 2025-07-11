'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Globe, BookOpen, Lightbulb, Copy, ExternalLink, Eye, Edit, Newspaper } from 'lucide-react';

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

interface TopicFetcherProps {
  onTopicSelect?: (topic: NewsArticle, details?: ArticleDetails) => void;
}

export default function TopicFetcher({ onTopicSelect }: TopicFetcherProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [articleDetails, setArticleDetails] = useState<ArticleDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [mounted, setMounted] = useState(false);

  const sources = ['all', 'thehindu', 'hindustantimes'];
  const sourceNames = {
    all: 'All Sources',
    thehindu: 'The Hindu',
    hindustantimes: 'Hindustan Times'
  };

  const categories = ['all', 'national', 'international', 'business', 'sports', 'opinion', 'scitech'];
  const categoryNames = {
    all: 'All Categories',
    national: 'National',
    international: 'International',
    business: 'Business',
    sports: 'Sports',
    opinion: 'Opinion',
    scitech: 'Science & Tech'
  };

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/news?source=${selectedSource}&category=${selectedCategory}`);
      const data = await response.json();

      if (data.success) {
        setArticles(data.articles);
      } else {
        console.error('Failed to fetch news:', data.error);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticleDetails = async (article: NewsArticle) => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`/api/article?id=${article.id}&url=${encodeURIComponent(article.url)}`);
      const data = await response.json();

      if (data.success) {
        setArticleDetails(data.article);
      } else {
        console.error('Failed to fetch article details:', data.error);
      }
    } catch (error) {
      console.error('Error fetching article details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchNews();
    }
  }, [selectedSource, selectedCategory, mounted]);

  const copyArticleToClipboard = (article: NewsArticle) => {
    const text = `Essay Topic: ${article.title}\n\nDescription: ${article.description}\n\nSource: ${article.source}\n\nPublished: ${new Date(article.publishedAt).toLocaleDateString()}\n\nURL: ${article.url}`;
    navigator.clipboard.writeText(text);
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'The Hindu': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'Hindustan Times': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const handleTopicSelect = (article: NewsArticle) => {
    if (onTopicSelect) {
      onTopicSelect(article, articleDetails || undefined);
    }
  };

  const handleExploreArticle = async (article: NewsArticle) => {
    setSelectedArticle(article);
    await fetchArticleDetails(article);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Latest News Topics</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Discover current topics from The Hindu and Hindustan Times for your essays
          </p>
        </div>
        <button
          onClick={fetchNews}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh News</span>
        </button>
      </div>

      {/* Source and Category Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Source Filter */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Newspaper className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">News Source</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {sources.map((source) => (
              <button
                key={source}
                onClick={() => setSelectedSource(source)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedSource === source
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {sourceNames[source as keyof typeof sourceNames]}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Globe className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Category</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {categoryNames[category as keyof typeof categoryNames]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-3"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
              <div className="flex space-x-2">
                <div className="h-6 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="h-6 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">{article.category}</span>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSourceColor(article.source)}`}>
                  {article.source}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 line-clamp-2">
                {article.title}
              </h3>

              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                {article.description}
              </p>

              <div className="flex items-center justify-between mb-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {mounted ? new Date(article.publishedAt).toLocaleDateString() : 'Recently'}
                </div>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleExploreArticle(article)}
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>Explore</span>
                </button>

                <button
                  onClick={() => handleTopicSelect(article)}
                  className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex-1"
                >
                  <Edit className="w-4 h-4" />
                  <span>Write Essay</span>
                </button>

                <button
                  onClick={() => copyArticleToClipboard(article)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Copy article details"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {articles.length === 0 && !loading && (
        <div className="text-center py-12">
          <Lightbulb className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
            No articles found
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            Try selecting a different source or category, or refresh to get new articles.
          </p>
        </div>
      )}

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  <span className="text-blue-600 font-medium">{selectedArticle.category}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSourceColor(selectedArticle.source)}`}>
                    {selectedArticle.source}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedArticle(null);
                    setArticleDetails(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                {selectedArticle.title}
              </h2>

              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Published: {mounted ? new Date(selectedArticle.publishedAt).toLocaleDateString() : 'Recently'} | Source: {selectedArticle.source}
              </div>

              {loadingDetails ? (
                <div className="space-y-4">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                </div>
              ) : articleDetails ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Summary</h4>
                    <p className="text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      {articleDetails.summary}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Key Points</h4>
                    <ul className="space-y-2">
                      {articleDetails.keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                          <span className="text-gray-600 dark:text-gray-300">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Related Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {articleDetails.relatedTopics.map((topic, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm rounded-full"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Full Content</h4>
                    <div className="max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
                        {articleDetails.content}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-300">
                  {selectedArticle.description}
                </p>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => handleTopicSelect(selectedArticle)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Write Essay on This Topic</span>
                </button>
                <button
                  onClick={() => copyArticleToClipboard(selectedArticle)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Details</span>
                </button>
                <a
                  href={selectedArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Read Original</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
