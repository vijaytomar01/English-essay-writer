'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Newspaper, Clock, ExternalLink, BookOpen, Search, Eye, Share } from 'lucide-react';

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

export default function NewsReader() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'The Hindu': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'Hindustan Times': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const formatDate = (dateString: string) => {
    if (!mounted) return 'Recently';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recently';
    }
  };

  const handleReadArticle = async (article: NewsArticle) => {
    setSelectedArticle(article);
    await fetchArticleDetails(article);
  };

  const shareArticle = (article: NewsArticle) => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.description,
        url: article.url,
      });
    } else {
      navigator.clipboard.writeText(`${article.title}\n\n${article.description}\n\nRead more: ${article.url}`);
    }
  };

  if (!mounted) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">News Reader</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Read latest articles from The Hindu and Hindustan Times
          </p>
        </div>
        <button
          onClick={fetchNews}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Source Filter */}
        <div>
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            {sources.map((source) => (
              <option key={source} value={source}>
                {sourceNames[source as keyof typeof sourceNames]}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {categoryNames[category as keyof typeof categoryNames]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Articles Display */}
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
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Newspaper className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">{article.category}</span>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSourceColor(article.source)}`}>
                  {article.source}
                </span>
              </div>
              
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2 text-lg line-clamp-2">
                {article.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                {article.description}
              </p>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(article.publishedAt)}</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleReadArticle(article)}
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>Read</span>
                </button>
                
                <button
                  onClick={() => shareArticle(article)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Share article"
                >
                  <Share className="w-4 h-4" />
                </button>
                
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Open original"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredArticles.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
            No articles found
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            Try adjusting your search or filters, or refresh to get new articles.
          </p>
        </div>
      )}

      {/* Article Reading Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Newspaper className="w-6 h-6 text-blue-600" />
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
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
                >
                  ✕
                </button>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                {selectedArticle.title}
              </h1>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
                <span>Published: {formatDate(selectedArticle.publishedAt)}</span>
                <span>Source: {selectedArticle.source}</span>
              </div>

              {loadingDetails ? (
                <div className="space-y-4">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                </div>
              ) : articleDetails ? (
                <div className="space-y-6">
                  <div className="prose dark:prose-invert max-w-none">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">Summary</h3>
                      <p className="text-gray-700 dark:text-gray-300">{articleDetails.summary}</p>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Key Points</h3>
                      <ul className="space-y-2">
                        {articleDetails.keyPoints.map((point, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-gray-600 dark:text-gray-300">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Full Article</h3>
                      <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                        {articleDetails.content}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Related Topics</h3>
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
                  </div>
                </div>
              ) : (
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {selectedArticle.description}
                  </p>
                </div>
              )}
              
              <div className="flex space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => shareArticle(selectedArticle)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Share className="w-4 h-4" />
                  <span>Share</span>
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
