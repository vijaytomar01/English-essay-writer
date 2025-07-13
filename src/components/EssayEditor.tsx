'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FileText, Timer } from 'lucide-react';

interface EssayEditorProps {
  settings: {
    timeLimit: number;
    wordLimit: number;
    spacingAfterWords: number;
    autoSave: boolean;
    backspaceLimit: number;
  };
  essayData: {
    content: string;
    wordCount: number;
    timeSpent: number;
    grammarIssues: any[];
  };
  setEssayData: (data: any) => void;
  isTimerRunning: boolean;
  setIsTimerRunning: (running: boolean) => void;
  timeRemaining: number;
  timerStoppedBySubmission: boolean;
  setTimerStoppedBySubmission: (stopped: boolean) => void;
  formatTime: (seconds: number) => string;
  selectedTopic: any;
}

export default function EssayEditor({
  settings,
  essayData,
  setEssayData,
  isTimerRunning,
  setIsTimerRunning,
  timeRemaining,
  timerStoppedBySubmission,
  setTimerStoppedBySubmission,
  formatTime,
  selectedTopic
}: EssayEditorProps) {
  const [content, setContent] = useState(essayData.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mounted, setMounted] = useState(false);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasStartedWriting, setHasStartedWriting] = useState(false);
  const [charactersDeleted, setCharactersDeleted] = useState(0);
  const [previousContent, setPreviousContent] = useState('');

  // Count words function
  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Function to open Wordvice.ai for professional proofreading
  const openWordviceProofreading = (essayContent: string) => {
    try {
      const wordCount = countWords(essayContent);
      
      // Open Wordvice.ai proofreading page in the same tab
      const wordviceUrl = 'https://wordvice.ai/proofreading/78075180-e1e9-4aee-92d8-b5098745fe9f';
      
      console.log(`✅ Redirecting to Wordvice.ai for professional proofreading (${wordCount} words)`);
      
      // Redirect to Wordvice.ai in the same page
      window.location.href = wordviceUrl;
      
    } catch (error) {
      console.error('❌ Error opening Wordvice.ai:', error);
      // Fallback redirect
      window.location.href = 'https://wordvice.ai/proofreading/78075180-e1e9-4aee-92d8-b5098745fe9f';
    }
  };

  // Submit essay function with Wordvice.ai integration
  const submitEssay = async (isAutoSubmit = false) => {
    if (isSubmitted) return;

    // Auto-stop timer when essay is submitted
    if (isTimerRunning) {
      setIsTimerRunning(false);
      setTimerStoppedBySubmission(true);
      console.log('Timer auto-stopped - essay submitted');
    }

    setIsSubmitted(true);

    // Automatically copy essay to clipboard
    try {
      await navigator.clipboard.writeText(content);
      console.log('✅ Essay automatically copied to clipboard');
    } catch (error) {
      console.error('❌ Failed to copy essay to clipboard:', error);
    }

    // Open Wordvice.ai for professional proofreading (only for manual submissions)
    if (!isAutoSubmit) {
      openWordviceProofreading(content);
    }
  };

  // Handle keydown events to block backspace when limit exceeded
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isSubmitted) {
      e.preventDefault();
      return;
    }

    if (e.key === 'Backspace' && settings.backspaceLimit >= 0 && charactersDeleted >= settings.backspaceLimit) {
      e.preventDefault();
      console.log('Backspace blocked - limit exceeded');
      return;
    }

    if (e.key === 'Backspace') {
      setBackspaceCount(prev => prev + 1);
    }
  };

  // Handle content change with character deletion tracking
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newContent = e.target.value;

    if (isSubmitted) return;

    // Start timer when user begins typing
    if (!hasStartedWriting && newContent.trim().length > 0) {
      setHasStartedWriting(true);
      setIsTimerRunning(true);
      console.log('Timer started - user began writing');
    }

    // Track character deletions
    if (newContent.length < previousContent.length) {
      const deletedChars = previousContent.length - newContent.length;
      setCharactersDeleted(prev => prev + deletedChars);
    }

    setPreviousContent(newContent);
    setContent(newContent);

    const wordCount = countWords(newContent);

    // Update essay data
    setEssayData({
      content: newContent,
      wordCount,
      timeSpent: essayData.timeSpent,
      grammarIssues: []
    });

    // Auto-submit if word limit reached
    if (wordCount >= settings.wordLimit && !isSubmitted) {
      console.log(`Word limit reached: ${wordCount}/${settings.wordLimit}`);
      submitEssay(true);
    }
  };

  // Reset function
  const resetBackspaceTracking = () => {
    setBackspaceCount(0);
    setCharactersDeleted(0);
    setPreviousContent('');
    setHasStartedWriting(false);
    // Reset timer state for new essay
    setIsTimerRunning(false);
    setTimerStoppedBySubmission(false);
  };

  // Auto-submit if character deletion limit exceeded
  useEffect(() => {
    if (settings.backspaceLimit >= 0 && charactersDeleted > settings.backspaceLimit && !isSubmitted) {
      console.log(`Character deletion limit exceeded: ${charactersDeleted}/${settings.backspaceLimit}`);
      submitEssay(true);
    }
  }, [charactersDeleted, settings.backspaceLimit, isSubmitted]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining <= 0 && isTimerRunning && !isSubmitted) {
      console.log('Time limit reached - auto-submitting essay');
      submitEssay(true);
    }
  }, [timeRemaining, isTimerRunning, isSubmitted]);

  // Update essay data when content changes
  useEffect(() => {
    if (essayData.content !== content) {
      setPreviousContent(essayData.content);
      setContent(essayData.content);
    }
  }, [essayData.content]);

  if (!mounted) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-1/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">✍️ Essay Writer</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Write your essay with automatic Wordvice.ai integration
          </p>
        </div>
      </div>

      {/* Selected Topic Display */}
      {selectedTopic && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Selected Topic</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTopic.source}</p>
            </div>
          </div>
          <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{selectedTopic.title}</h4>
          {selectedTopic.details && (
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {selectedTopic.details.substring(0, 300)}...
            </p>
          )}
        </div>
      )}

      {/* Stats Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Timer */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              timeRemaining <= 300 ? 'bg-red-100 dark:bg-red-900/20' : 'bg-blue-100 dark:bg-blue-900/20'
            }`}>
              <Timer className={`w-5 h-5 ${
                timeRemaining <= 300 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
              }`} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${
                timeRemaining <= 300 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
              }`}>
                {formatTime(timeRemaining)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {isTimerRunning ? 'Running' : timerStoppedBySubmission ? 'Stopped' : 'Ready'}
              </div>
            </div>
          </div>
        </div>

        {/* Word Count */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 text-lg font-bold">W</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {countWords(content)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                / {settings.wordLimit} words
              </div>
            </div>
          </div>
        </div>

        {/* Character Deletions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              charactersDeleted >= settings.backspaceLimit ? 'bg-red-100 dark:bg-red-900/20' : 'bg-orange-100 dark:bg-orange-900/20'
            }`}>
              <span className={`text-lg font-bold ${
                charactersDeleted >= settings.backspaceLimit ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
              }`}>⌫</span>
            </div>
            <div>
              <div className={`text-2xl font-bold ${
                charactersDeleted >= settings.backspaceLimit ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
              }`}>
                {charactersDeleted}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                / {settings.backspaceLimit} deleted
              </div>
            </div>
          </div>
        </div>

        {/* Submit Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isSubmitted ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <span className={`text-lg ${
                isSubmitted ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
              }`}>
                {isSubmitted ? '✓' : '○'}
              </span>
            </div>
            <div>
              <div className={`text-lg font-bold ${
                isSubmitted ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {isSubmitted ? 'Submitted' : 'Draft'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Status
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wordvice.ai Integration Notice */}
      {!isSubmitted && content.trim().length > 0 && (
        <div className="mt-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🔗</span>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Wordvice.ai Integration Active</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                When you submit, your essay will be automatically copied and you'll be redirected to Wordvice.ai for professional proofreading
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Essay Editor */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder={selectedTopic ?
              `Write your essay about: ${selectedTopic.title}...` :
              "Start writing your essay here..."
            }
            className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-lg leading-relaxed"
            disabled={isSubmitted}
          />
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center">
            <button
              onClick={resetBackspaceTracking}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              disabled={isSubmitted}
            >
              Reset Tracking
            </button>

            <button
              onClick={() => submitEssay(false)}
              disabled={isSubmitted || content.trim().length === 0}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitted ? 'Essay Submitted' : 'Submit Essay'}
            </button>
          </div>
        </div>
      </div>

      {/* Submission Confirmation */}
      {isSubmitted && (
        <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-2xl">✓</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Essay Submitted Successfully!</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your essay has been copied to clipboard and Wordvice.ai has opened for professional proofreading.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
