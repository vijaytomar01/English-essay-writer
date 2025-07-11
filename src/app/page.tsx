'use client';

import { useState, useEffect } from 'react';
import { Timer, Settings, TrendingUp, FileText, CheckCircle, AlertCircle, AlertTriangle, BookOpen } from 'lucide-react';
import EssayEditor from '@/components/EssayEditor';
import SettingsPanel from '@/components/SettingsPanel';
import TopicFetcher from '@/components/TopicFetcher';
import PerformanceDashboard from '@/components/PerformanceDashboard';
import NewsReader from '@/components/NewsReader';

export default function Home() {
  const [activeTab, setActiveTab] = useState('write');
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState({
    timeLimit: 30,
    wordLimit: 500,
    spacingAfterWords: 1,
    autoSave: true,
    backspaceLimit: 10,
  });
  const [essayData, setEssayData] = useState({
    content: '',
    wordCount: 0,
    timeSpent: 0,
    grammarIssues: [],
  });
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60);
  const [submittedEssays, setSubmittedEssays] = useState([]);
  const [timerStoppedBySubmission, setTimerStoppedBySubmission] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeRemaining(settings.timeLimit * 60);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    let interval: NodeJS.Timeout | undefined;
    if (isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
        setEssayData(prev => ({ ...prev, timeSpent: prev.timeSpent + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeRemaining, mounted]);

  useEffect(() => {
    if (mounted) {
      setTimeRemaining(settings.timeLimit * 60);
    }
  }, [settings.timeLimit, mounted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
  };

  const handleTopicSelect = (topic, details) => {
    setSelectedTopic({ ...topic, details });
    setActiveTab('write');
  };

  const handleEssaySubmit = (submissionData) => {
    // Stop the timer automatically when essay is submitted
    setIsTimerRunning(false);
    setTimerStoppedBySubmission(true);

    // Add submission timestamp and timer info to the submission data
    const enhancedSubmissionData = {
      ...submissionData,
      timerStoppedAt: new Date(),
      finalTimeRemaining: timeRemaining,
      totalTimeUsed: (settings.timeLimit * 60) - timeRemaining
    };

    setSubmittedEssays(prev => [...prev, enhancedSubmissionData]);
    // Auto-switch to dashboard to show results
    setActiveTab('dashboard');
  };

  const restartProgress = () => {
    setSubmittedEssays([]);
    setEssayData({
      content: '',
      wordCount: 0,
      timeSpent: 0,
      grammarIssues: [],
    });
    setSelectedTopic(null);
    setIsTimerRunning(false);
    setTimeRemaining(settings.timeLimit * 60);
    setTimerStoppedBySubmission(false);
    setActiveTab('write');
  };

  const getHeaderContent = () => {
    switch (activeTab) {
      case 'write':
        return {
          title: 'AI Essay Writer',
          subtitle: 'Craft compelling essays with intelligent writing assistance',
          icon: '✍️',
          gradient: 'from-blue-600 to-purple-600'
        };
      case 'topics':
        return {
          title: 'Topic Explorer',
          subtitle: 'Discover trending topics from leading news sources',
          icon: '🔍',
          gradient: 'from-green-600 to-teal-600'
        };
      case 'news':
        return {
          title: 'News Reader',
          subtitle: 'Stay informed with latest articles and insights',
          icon: '📰',
          gradient: 'from-orange-600 to-red-600'
        };
      case 'dashboard':
        return {
          title: 'Performance Analytics',
          subtitle: 'Track your writing progress and achievements',
          icon: '📊',
          gradient: 'from-purple-600 to-pink-600'
        };
      case 'settings':
        return {
          title: 'Preferences',
          subtitle: 'Customize your writing environment',
          icon: '⚙️',
          gradient: 'from-gray-600 to-slate-600'
        };
      default:
        return {
          title: 'AI Essay Writer',
          subtitle: 'Smart writing assistant with grammar checking and performance tracking',
          icon: '✍️',
          gradient: 'from-blue-600 to-purple-600'
        };
    }
  };

  const headerContent = getHeaderContent();

  const tabs = [
    { id: 'write', label: 'Write Essay', icon: FileText },
    { id: 'topics', label: 'Get Topics', icon: TrendingUp },
    { id: 'news', label: 'Read News', icon: BookOpen },
    { id: 'dashboard', label: 'Performance', icon: CheckCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="relative overflow-hidden bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-3xl shadow-2xl mb-8 border border-gray-200/50 dark:border-gray-700/50">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
          </div>

          {/* Dynamic Gradient Overlay */}
          <div className={'absolute inset-0 bg-gradient-to-br ' + headerContent.gradient + ' opacity-[0.08] dark:opacity-[0.12]'}></div>

          {/* Main Header Content */}
          <div className="relative p-8 lg:p-10">
            <div className="space-y-6">
              {/* Top Section - Title & Icon */}
              <div className="flex items-center space-x-5">
                <div className={'w-18 h-18 rounded-3xl bg-gradient-to-br ' + headerContent.gradient + ' flex items-center justify-center text-3xl shadow-xl ring-4 ring-white/20 dark:ring-gray-800/20 transform hover:scale-105 transition-all duration-300'}>
                  <span className="drop-shadow-sm">{headerContent.icon}</span>
                </div>
                <div className="space-y-1">
                  <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent leading-tight">
                    {headerContent.title}
                  </h1>
                  <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-300 font-medium leading-relaxed max-w-2xl">
                    {headerContent.subtitle}
                  </p>
                </div>
              </div>


            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl mb-8 border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={'relative flex items-center space-x-3 px-8 py-5 font-semibold transition-all duration-300 flex-1 group ' + (
                    isActive
                      ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg transform scale-105'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 hover:shadow-md'
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-90"></div>
                  )}
                  
                  <div className="relative flex items-center space-x-3">
                    <div className={'w-8 h-8 rounded-lg flex items-center justify-center transition-all ' + (
                      isActive 
                        ? 'bg-white/20 backdrop-blur-sm' 
                        : 'bg-gray-100 dark:bg-gray-600 group-hover:bg-gray-200 dark:group-hover:bg-gray-500'
                    )}>
                      <Icon className={'w-5 h-5 ' + (isActive ? 'text-white' : 'text-gray-600 dark:text-gray-300')} />
                    </div>
                    <span className="hidden sm:block">{tab.label}</span>
                  </div>
                  
                  {index < tabs.length - 1 && !isActive && (
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-px h-8 bg-gray-200 dark:bg-gray-600"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {activeTab === 'write' && mounted && (
            <EssayEditor
              settings={settings}
              essayData={essayData}
              setEssayData={setEssayData}
              isTimerRunning={isTimerRunning}
              setIsTimerRunning={setIsTimerRunning}
              timeRemaining={timeRemaining}
              timerStoppedBySubmission={timerStoppedBySubmission}
              setTimerStoppedBySubmission={setTimerStoppedBySubmission}
              formatTime={formatTime}
              selectedTopic={selectedTopic}
              onEssaySubmit={handleEssaySubmit}
            />
          )}
          {activeTab === 'topics' && mounted && <TopicFetcher onTopicSelect={handleTopicSelect} />}
          {activeTab === 'news' && mounted && <NewsReader />}
          {activeTab === 'dashboard' && mounted && (
            <PerformanceDashboard
              essayData={essayData}
              submittedEssays={submittedEssays}
              onRestartProgress={restartProgress}
            />
          )}
          {activeTab === 'settings' && mounted && (
            <SettingsPanel settings={settings} setSettings={setSettings} />
          )}
          {!mounted && (
            <div className="p-12 text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-20 animate-pulse"></div>
              </div>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 font-medium">Loading your workspace...</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Preparing the best writing experience</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
