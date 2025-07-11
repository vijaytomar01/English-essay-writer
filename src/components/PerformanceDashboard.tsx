'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Trophy, Target, Clock, FileText, TrendingUp, Calendar, Award, BookOpen, RotateCcw, AlertTriangle } from 'lucide-react';

interface PerformanceDashboardProps {
  essayData: {
    content: string;
    wordCount: number;
    timeSpent: number;
    grammarIssues: any[];
  };
  submittedEssays?: any[];
  onRestartProgress?: () => void;
}

interface RealTimeStats {
  currentScore: number;
  improvementTrend: number;
  averageScore: number;
  bestScore: number;
  totalEssays: number;
}

export default function PerformanceDashboard({ essayData, submittedEssays = [], onRestartProgress }: PerformanceDashboardProps) {
  const [mounted, setMounted] = useState(false);
  const [realTimeStats, setRealTimeStats] = useState<RealTimeStats>({
    currentScore: 0,
    improvementTrend: 0,
    averageScore: 0,
    bestScore: 0,
    totalEssays: 0
  });

  // Calculate real-time statistics from actual submitted essays only
  useEffect(() => {
    setMounted(true);
    
    if (submittedEssays.length > 0) {
      const scores = submittedEssays.map(essay => essay.analysis?.overallScore || 0);
      const currentScore = scores[scores.length - 1] || 0;
      const previousScore = scores[scores.length - 2] || currentScore;
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const bestScore = Math.max(...scores);
      const improvementTrend = currentScore - previousScore;

      setRealTimeStats({
        currentScore,
        improvementTrend,
        averageScore: Math.round(averageScore),
        bestScore,
        totalEssays: submittedEssays.length
      });
    } else {
      setRealTimeStats({
        currentScore: 0,
        improvementTrend: 0,
        averageScore: 0,
        bestScore: 0,
        totalEssays: 0
      });
    }
  }, [submittedEssays]);

  // Calculate real-time metrics from submitted essays
  const totalEssays = submittedEssays.length;
  const totalWords = submittedEssays.reduce((sum, essay) => sum + (essay.metrics?.wordCount || 0), 0);
  const totalTime = submittedEssays.reduce((sum, essay) => sum + (essay.metrics?.timeSpent || 0), 0);
  const totalGrammarIssues = submittedEssays.reduce((sum, essay) => sum + (essay.metrics?.grammarIssues || 0), 0);
  const totalCharactersDeleted = submittedEssays.reduce((sum, essay) => sum + (essay.metrics?.charactersDeleted || 0), 0);
  
  const averageWords = totalEssays > 0 ? Math.round(totalWords / totalEssays) : 0;
  const averageTime = totalEssays > 0 ? Math.round(totalTime / totalEssays) : 0;
  const averageGrammarIssues = totalEssays > 0 ? Math.round(totalGrammarIssues / totalEssays) : 0;
  const averageCharactersDeleted = totalEssays > 0 ? Math.round(totalCharactersDeleted / totalEssays) : 0;
  const averageWordsPerMinute = totalTime > 0 ? Math.round(totalWords / totalTime) : 0;

  // Prepare real-time chart data
  const chartData = submittedEssays.map((essay, index) => ({
    date: new Date(essay.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    words: essay.metrics?.wordCount || 0,
    time: essay.metrics?.timeSpent || 0,
    issues: essay.metrics?.grammarIssues || 0,
    score: essay.analysis?.overallScore || 0,
    charactersDeleted: essay.metrics?.charactersDeleted || 0,
    essay: index + 1
  }));

  // Current session data for real-time tracking
  const currentSession = {
    wordCount: essayData.wordCount,
    timeSpent: essayData.timeSpent,
    grammarIssues: essayData.grammarIssues.length
  };

  // Real-time grammar breakdown from submitted essays
  const grammarData = totalEssays > 0 ? [
    { 
      name: 'Grammar', 
      value: submittedEssays.reduce((sum, essay) => sum + (essay.metrics?.grammarIssues || 0), 0), 
      color: '#ef4444' 
    },
    { 
      name: 'Spelling', 
      value: submittedEssays.reduce((sum, essay) => sum + (essay.metrics?.spellingIssues || 0), 0), 
      color: '#f59e0b' 
    },
    { 
      name: 'Punctuation', 
      value: submittedEssays.reduce((sum, essay) => sum + (essay.metrics?.punctuationIssues || 0), 0), 
      color: '#3b82f6' 
    }
  ] : [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">📊 Real-Time Performance Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Live tracking with performance comparisons - All mock data cleared
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {onRestartProgress && (
            <button
              onClick={onRestartProgress}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <RotateCcw className="w-5 h-5" />
              <span className="font-medium">Clear All Data</span>
            </button>
          )}
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {mounted ? new Date().toLocaleDateString() : 'Loading...'}
            </span>
          </div>
        </div>
      </div>

      {/* Real-Time Performance Summary */}
      {totalEssays > 0 ? (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Live Performance Tracking</h3>
              <p className="text-gray-600 dark:text-gray-400">Latest essay vs. your average performance</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold mb-1 ${
                realTimeStats.currentScore >= realTimeStats.averageScore ? 'text-green-600' : 'text-orange-600'
              }`}>
                {realTimeStats.currentScore}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Latest Score</div>
              <div className={`text-xs ${
                realTimeStats.improvementTrend > 0 ? 'text-green-600' : 
                realTimeStats.improvementTrend < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {realTimeStats.improvementTrend > 0 ? '+' : ''}{realTimeStats.improvementTrend} vs previous
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{realTimeStats.averageScore}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Average Score</div>
              <div className="text-xs text-gray-500">{totalEssays} essay{totalEssays !== 1 ? 's' : ''}</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">{realTimeStats.bestScore}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Best Score</div>
              <div className="text-xs text-gray-500">Personal record</div>
            </div>
            
            <div className="text-center">
              <div className={`text-3xl font-bold mb-1 ${
                realTimeStats.improvementTrend > 0 ? 'text-green-600' : 
                realTimeStats.improvementTrend < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {realTimeStats.improvementTrend > 0 ? '📈' : realTimeStats.improvementTrend < 0 ? '📉' : '➡️'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Trend</div>
              <div className="text-xs text-gray-500">
                {realTimeStats.improvementTrend > 0 ? 'Improving' : 
                 realTimeStats.improvementTrend < 0 ? 'Declining' : 'Stable'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No Performance Data Yet</h3>
          <p className="text-gray-600 dark:text-gray-400">Submit your first essay to start tracking your real-time performance!</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">All mock data has been cleared - only real submissions will be tracked</p>
        </div>
      )}

      {/* Detailed Mistakes History */}
      {totalEssays > 0 && (
        <div className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-2xl">📝</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Mistake History & Corrections</h3>
              <p className="text-gray-600 dark:text-gray-400">Track your common errors and learn from corrections</p>
            </div>
          </div>

          <div className="space-y-4">
            {submittedEssays.slice(-3).reverse().map((essay, essayIndex) => {
              const analysisData = essay.analysis;
              console.log('Essay analysis data:', analysisData); // Debug log

              // Check if we have any mistakes to display
              const hasSpellingErrors = analysisData?.detailedAnalysis?.spellingErrors?.length > 0;
              const hasGrammarErrors = analysisData?.detailedAnalysis?.grammarErrors?.length > 0;
              const hasAnyErrors = hasSpellingErrors || hasGrammarErrors;

              // Always show the essay, even if no errors
              if (!analysisData) {
                return null;
              }

              return (
                <div key={essayIndex} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                      Essay #{submittedEssays.length - essayIndex} - {new Date(essay.submittedAt).toLocaleDateString()}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        analysisData.grade === 'A' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                        analysisData.grade === 'B' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                        analysisData.grade === 'C' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                      }`}>
                        Grade: {analysisData.grade}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Score: {analysisData.overallScore}
                      </span>
                    </div>
                  </div>

                  {/* Spelling Mistakes */}
                  {hasSpellingErrors && (
                    <div className="mb-4">
                      <h5 className="text-md font-semibold text-yellow-800 dark:text-yellow-300 mb-3 flex items-center">
                        <span className="text-xl mr-2">📝</span>
                        Spelling Mistakes ({analysisData.detailedAnalysis.spellingErrors.length})
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {analysisData.detailedAnalysis.spellingErrors.map((error: any, index: number) => (
                          <div key={index} className="bg-yellow-50 dark:bg-yellow-900/10 rounded-lg p-3 border-l-4 border-yellow-400">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-sm font-medium text-red-600 dark:text-red-400 line-through">
                                    "{error.word || error.text || 'Unknown word'}"
                                  </span>
                                  <span className="text-gray-400">→</span>
                                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                    "{error.suggestion || error.correction || 'No suggestion'}"
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {error.message || 'Spelling correction needed'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grammar Mistakes */}
                  {hasGrammarErrors && (
                    <div className="mb-4">
                      <h5 className="text-md font-semibold text-red-800 dark:text-red-300 mb-3 flex items-center">
                        <span className="text-xl mr-2">📚</span>
                        Grammar Mistakes ({analysisData.detailedAnalysis.grammarErrors.length})
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {analysisData.detailedAnalysis.grammarErrors.map((error: any, index: number) => (
                          <div key={index} className="bg-red-50 dark:bg-red-900/10 rounded-lg p-3 border-l-4 border-red-400">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-sm font-medium text-red-600 dark:text-red-400 line-through">
                                    "{error.text || 'Unknown phrase'}"
                                  </span>
                                  <span className="text-gray-400">→</span>
                                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                    "{error.suggestion || error.correction || 'No suggestion'}"
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {error.message || 'Grammar correction needed'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Mistakes */}
                  {!hasAnyErrors && (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-green-600 dark:text-green-400 text-xl">✅</span>
                      </div>
                      <p className="text-green-600 dark:text-green-400 font-medium">Perfect! No mistakes found in this essay.</p>
                    </div>
                  )}

                  {/* Debug Information */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                      <p><strong>Debug Info:</strong></p>
                      <p>Has spelling errors: {hasSpellingErrors ? 'Yes' : 'No'}</p>
                      <p>Has grammar errors: {hasGrammarErrors ? 'Yes' : 'No'}</p>
                      <p>Analysis data exists: {analysisData ? 'Yes' : 'No'}</p>
                      <p>Detailed analysis exists: {analysisData?.detailedAnalysis ? 'Yes' : 'No'}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Session Real-Time Tracking */}
      <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Current Session</h3>
            <p className="text-gray-600 dark:text-gray-400">Live tracking of your current essay</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">{currentSession.wordCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Words Written</div>
            <div className="text-xs text-gray-500">
              {averageWords > 0 ? `Avg: ${averageWords}` : 'No comparison yet'}
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">{Math.floor(currentSession.timeSpent / 60)}:{(currentSession.timeSpent % 60).toString().padStart(2, '0')}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Time Spent</div>
            <div className="text-xs text-gray-500">
              {averageTime > 0 ? `Avg: ${Math.floor(averageTime / 60)}:${(averageTime % 60).toString().padStart(2, '0')}` : 'No comparison yet'}
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">{currentSession.grammarIssues}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Grammar Issues</div>
            <div className="text-xs text-gray-500">
              {averageGrammarIssues > 0 ? `Avg: ${averageGrammarIssues}` : 'No comparison yet'}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      {totalEssays > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Score Progress Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">📈 Score Progress</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="essay" />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value, name) => [value, name === 'score' ? 'Score' : name]}
                  labelFormatter={(label) => `Essay ${label}`}
                />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} name="Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Grammar Issues Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">🔍 Issues Breakdown</h3>
            {grammarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={grammarData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {grammarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No issues data yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detailed Metrics */}
      {totalEssays > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">📊 Detailed Performance Metrics</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{averageWords}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Words</div>
            </div>

            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{averageWordsPerMinute}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Words/Min</div>
            </div>

            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{averageGrammarIssues}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Issues</div>
            </div>

            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{averageCharactersDeleted}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Deletions</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
