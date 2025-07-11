'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle, RotateCcw, Delete, Timer, FileText, Edit3 } from 'lucide-react';
import AutomatedProofreading from './AutomatedProofreading';

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
  onEssaySubmit: (data: any) => void;
}

interface GrammarIssue {
  id: string;
  type: 'grammar' | 'spelling' | 'style';
  message: string;
  start: number;
  end: number;
  suggestions: string[];
  category?: string;
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
  selectedTopic,
  onEssaySubmit
}: EssayEditorProps) {
  const [content, setContent] = useState(essayData.content);
  const [grammarIssues, setGrammarIssues] = useState<GrammarIssue[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mounted, setMounted] = useState(false);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [hasStartedWriting, setHasStartedWriting] = useState(false);
  const [charactersDeleted, setCharactersDeleted] = useState(0);
  const [previousContent, setPreviousContent] = useState('');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentAnalysisStep, setCurrentAnalysisStep] = useState('');
  const [detailedIssues, setDetailedIssues] = useState<{[key: string]: GrammarIssue[]}>({});
  const [showProofreading, setShowProofreading] = useState(false);
  const [realTimeMistakes, setRealTimeMistakes] = useState<GrammarIssue[]>([]);
  const [showMistakeTooltip, setShowMistakeTooltip] = useState<{show: boolean, mistake: GrammarIssue | null, x: number, y: number}>({
    show: false,
    mistake: null,
    x: 0,
    y: 0
  });
  const [realTimeCheckTimeout, setRealTimeCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  // Count words function
  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Enhanced AI grammar, spelling, and punctuation checker with detailed analysis
  const checkGrammar = (text: string): GrammarIssue[] => {
    const issues: GrammarIssue[] = [];
    if (!text || text.trim().length === 0) return issues;

    // Comprehensive Grammar mistakes
    const grammarMistakes = [
      { pattern: /\bwould\s+of\b/gi, correct: 'would have', message: 'Grammar: Use "would have" instead of "would of"', category: 'Modal Verbs' },
      { pattern: /\bcould\s+of\b/gi, correct: 'could have', message: 'Grammar: Use "could have" instead of "could of"', category: 'Modal Verbs' },
      { pattern: /\bshould\s+of\b/gi, correct: 'should have', message: 'Grammar: Use "should have" instead of "should of"', category: 'Modal Verbs' },
      { pattern: /\byour\s+welcome\b/gi, correct: "you're welcome", message: 'Grammar: Use "you\'re welcome" (you are welcome)', category: 'Contractions' },
      { pattern: /\bits\s+raining\b/gi, correct: "it's raining", message: 'Grammar: Use "it\'s" (it is) instead of "its"', category: 'Contractions' },
      { pattern: /\bto\s+much\b/gi, correct: 'too much', message: 'Grammar: Use "too much" (excessive amount)', category: 'Homophones' },
      { pattern: /\bto\s+many\b/gi, correct: 'too many', message: 'Grammar: Use "too many" (excessive quantity)', category: 'Homophones' },
      { pattern: /\bthere\s+is\s+many\b/gi, correct: 'there are many', message: 'Grammar: Use "there are" with plural nouns', category: 'Subject-Verb Agreement' },
      { pattern: /\bI\s+are\b/gi, correct: 'I am', message: 'Grammar: Use "I am" not "I are"', category: 'Subject-Verb Agreement' },
      { pattern: /\bhe\s+are\b/gi, correct: 'he is', message: 'Grammar: Use "he is" not "he are"', category: 'Subject-Verb Agreement' },
      { pattern: /\bshe\s+are\b/gi, correct: 'she is', message: 'Grammar: Use "she is" not "she are"', category: 'Subject-Verb Agreement' },
      { pattern: /\bwe\s+is\b/gi, correct: 'we are', message: 'Grammar: Use "we are" not "we is"', category: 'Subject-Verb Agreement' },
      { pattern: /\bthey\s+is\b/gi, correct: 'they are', message: 'Grammar: Use "they are" not "they is"', category: 'Subject-Verb Agreement' },
      { pattern: /\bdon't\s+got\b/gi, correct: "don't have", message: 'Grammar: Use "don\'t have" instead of "don\'t got"', category: 'Verb Forms' },
      { pattern: /\bain't\b/gi, correct: "isn't/aren't", message: 'Grammar: Use "isn\'t" or "aren\'t" instead of "ain\'t"', category: 'Informal Language' },
    ];

    // Comprehensive Spelling mistakes
    const spellingMistakes = [
      { pattern: /\brecieve\b/gi, correct: 'receive', message: 'Spelling: "i before e except after c"', category: 'Common Misspellings' },
      { pattern: /\boccured\b/gi, correct: 'occurred', message: 'Spelling: double "r" in occurred', category: 'Double Letters' },
      { pattern: /\bseperate\b/gi, correct: 'separate', message: 'Spelling: "separate" has "a" in the middle', category: 'Common Misspellings' },
      { pattern: /\bdefinately\b/gi, correct: 'definitely', message: 'Spelling: "definitely" ends with "-itely"', category: 'Common Misspellings' },
      { pattern: /\bneccessary\b/gi, correct: 'necessary', message: 'Spelling: "necessary" has one "c" and two "s"', category: 'Double Letters' },
      { pattern: /\bembarrass\b/gi, correct: 'embarrass', message: 'Spelling: "embarrass" has double "r" and double "s"', category: 'Double Letters' },
      { pattern: /\baccommodate\b/gi, correct: 'accommodate', message: 'Spelling: "accommodate" has double "c" and double "m"', category: 'Double Letters' },
      { pattern: /\bbeginning\b/gi, correct: 'beginning', message: 'Spelling: "beginning" has double "n"', category: 'Double Letters' },
      { pattern: /\bcommittee\b/gi, correct: 'committee', message: 'Spelling: "committee" has double "m" and double "t"', category: 'Double Letters' },
      { pattern: /\benvironment\b/gi, correct: 'environment', message: 'Spelling: "environment" has "n" before "ment"', category: 'Common Misspellings' },
      { pattern: /\bwierd\b/gi, correct: 'weird', message: 'Spelling: "weird" is an exception to "i before e"', category: 'Common Misspellings' },
      { pattern: /\bthier\b/gi, correct: 'their', message: 'Spelling: "their" not "thier"', category: 'Common Misspellings' },
      { pattern: /\bfreinds\b/gi, correct: 'friends', message: 'Spelling: "friends" not "freinds"', category: 'Common Misspellings' },
      { pattern: /\bbelive\b/gi, correct: 'believe', message: 'Spelling: "believe" has "ie" not "iv"', category: 'Common Misspellings' },
      { pattern: /\bacheive\b/gi, correct: 'achieve', message: 'Spelling: "achieve" has "ie" not "ei"', category: 'Common Misspellings' },
    ];

    // Note: Punctuation checking removed as per user request

    // Process only spelling and grammar mistakes (no punctuation)
    [...grammarMistakes, ...spellingMistakes].forEach((mistake, index) => {
      const matches = [...text.matchAll(mistake.pattern)];
      matches.forEach((match, matchIndex) => {
        if (match.index !== undefined) {
          issues.push({
            id: `mistake-${index}-${matchIndex}`,
            type: grammarMistakes.includes(mistake) ? 'grammar' : 'spelling',
            message: mistake.message,
            start: match.index,
            end: match.index + match[0].length,
            suggestions: [mistake.correct],
            category: mistake.category || 'General'
          });
        }
      });
    });

    return issues;
  };

  // Enhanced real-time line-by-line mistake checking
  const checkRealTimeMistakes = async (text: string) => {
    if (!text || text.trim().length < 3) {
      setRealTimeMistakes([]);
      return;
    }

    // Perform instant local analysis for immediate feedback
    const mistakes = performRealTimeAnalysis(text);
    setRealTimeMistakes(mistakes);
  };

  // Get line number from text position
  const getLineNumber = (text: string, position: number): number => {
    const beforePosition = text.substring(0, position);
    return beforePosition.split('\n').length;
  };

  // Enhanced real-time analysis for instant feedback while typing
  const performRealTimeAnalysis = (text: string): GrammarIssue[] => {
    const mistakes: GrammarIssue[] = [];
    const lines = text.split('\n');

    lines.forEach((line, lineIndex) => {
      const lineNumber = lineIndex + 1;
      const lineStartPosition = text.split('\n').slice(0, lineIndex).join('\n').length + (lineIndex > 0 ? 1 : 0);

      // Skip empty lines
      if (line.trim().length === 0) return;

      // Real-time spelling mistakes (most common errors)
      const commonSpellingMistakes = [
        { wrong: /\bimportent\b/gi, correct: 'important', type: 'spelling' },
        { wrong: /\bknowlegeable\b/gi, correct: 'knowledgeable', type: 'spelling' },
        { wrong: /\bcriticaly\b/gi, correct: 'critically', type: 'spelling' },
        { wrong: /\bsucess\b/gi, correct: 'success', type: 'spelling' },
        { wrong: /\brecieve\b/gi, correct: 'receive', type: 'spelling' },
        { wrong: /\bseperate\b/gi, correct: 'separate', type: 'spelling' },
        { wrong: /\bdefinately\b/gi, correct: 'definitely', type: 'spelling' },
        { wrong: /\boccured\b/gi, correct: 'occurred', type: 'spelling' },
        { wrong: /\bneccessary\b/gi, correct: 'necessary', type: 'spelling' },
        { wrong: /\bbeginning\b/gi, correct: 'beginning', type: 'spelling' },
        { wrong: /\benvironment\b/gi, correct: 'environment', type: 'spelling' },
        { wrong: /\bgovernment\b/gi, correct: 'government', type: 'spelling' }
      ];

      // Check each word for spelling mistakes
      commonSpellingMistakes.forEach((mistake, mistakeIndex) => {
        const matches = [...line.matchAll(mistake.wrong)];
        matches.forEach((match, matchIndex) => {
          if (match.index !== undefined) {
            const position = lineStartPosition + match.index;
            mistakes.push({
              id: `realtime-line-${lineNumber}-spelling-${mistakeIndex}-${matchIndex}`,
              type: 'spelling',
              message: `Line ${lineNumber}: "${match[0]}" should be "${mistake.correct}"`,
              start: position,
              end: position + match[0].length,
              suggestions: [mistake.correct],
              category: 'Spelling',
              severity: 'medium',
              originalText: match[0],
              correctedText: mistake.correct,
              lineNumber: lineNumber
            });
          }
        });
      });

      // Real-time grammar mistakes
      const commonGrammarMistakes = [
        { wrong: /\btheir\s+are\b/gi, correct: 'there are', explanation: 'Use "there are" for existence' },
        { wrong: /\bthere\s+is\s+many\b/gi, correct: 'there are many', explanation: 'Use "there are" with plural nouns' },
        { wrong: /\byour\s+welcome\b/gi, correct: "you're welcome", explanation: 'Use "you\'re" (you are)' },
        { wrong: /\bits\s+a\b/gi, correct: "it's a", explanation: 'Use "it\'s" (it is)' },
        { wrong: /\bto\s+much\b/gi, correct: 'too much', explanation: 'Use "too" for excess' },
        { wrong: /\bto\s+many\b/gi, correct: 'too many', explanation: 'Use "too" for excess quantity' }
      ];

      commonGrammarMistakes.forEach((mistake, mistakeIndex) => {
        const matches = [...line.matchAll(mistake.wrong)];
        matches.forEach((match, matchIndex) => {
          if (match.index !== undefined) {
            const position = lineStartPosition + match.index;
            mistakes.push({
              id: `realtime-line-${lineNumber}-grammar-${mistakeIndex}-${matchIndex}`,
              type: 'grammar',
              message: `Line ${lineNumber}: ${mistake.explanation}`,
              start: position,
              end: position + match[0].length,
              suggestions: [mistake.correct],
              category: 'Grammar',
              severity: 'high',
              originalText: match[0],
              correctedText: mistake.correct,
              lineNumber: lineNumber
            });
          }
        });
      });

      // Check for capitalization at start of line (first word only)
      if (line.trim().length > 0 && /^[a-z]/.test(line.trim())) {
        const firstWord = line.trim().split(/\s+/)[0];
        const correctedWord = firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
        mistakes.push({
          id: `realtime-line-${lineNumber}-capitalization`,
          type: 'grammar',
          message: `Line ${lineNumber}: First word should be capitalized`,
          start: lineStartPosition + line.indexOf(firstWord),
          end: lineStartPosition + line.indexOf(firstWord) + firstWord.length,
          suggestions: [correctedWord],
          category: 'Capitalization',
          severity: 'high',
          originalText: firstWord,
          correctedText: correctedWord,
          lineNumber: lineNumber
        });
      }

      // Check for missing punctuation at end of line
      if (line.trim().length > 10 && !/[.!?]$/.test(line.trim())) {
        const lastWord = line.trim().split(/\s+/).pop() || '';
        const position = lineStartPosition + line.lastIndexOf(lastWord);
        mistakes.push({
          id: `realtime-line-${lineNumber}-punctuation`,
          type: 'grammar',
          message: `Line ${lineNumber}: Missing end punctuation`,
          start: position + lastWord.length,
          end: position + lastWord.length + 1,
          suggestions: [lastWord + '.'],
          category: 'Punctuation',
          severity: 'medium',
          originalText: lastWord,
          correctedText: lastWord + '.',
          lineNumber: lineNumber
        });
      }
    });

    return mistakes;
  };

  // Handle keydown events to block backspace when limit exceeded
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isSubmitted) {
      e.preventDefault();
      return;
    }

    // Block backspace/delete keys when character deletion limit is exceeded
    if ((e.key === 'Backspace' || e.key === 'Delete') && charactersDeleted >= settings.backspaceLimit) {
      e.preventDefault();
      console.log('Backspace/Delete blocked - character deletion limit reached');
      return;
    }

    // Count backspace presses for statistics
    if (e.key === 'Backspace') {
      setBackspaceCount(prev => prev + 1);
    }
  };

  // Handle content change with character deletion tracking
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newContent = e.target.value;

    // Auto-start timer when user starts writing for the first time
    if (!hasStartedWriting && newContent.length > 0) {
      setHasStartedWriting(true);
      if (!isTimerRunning) {
        setIsTimerRunning(true);
        console.log('Timer auto-started - user began writing');
      }
    }

    // Track character deletions
    if (previousContent.length > newContent.length) {
      const deletedCount = previousContent.length - newContent.length;
      setCharactersDeleted(prev => {
        const newCount = prev + deletedCount;
        console.log(`Characters deleted: ${deletedCount}, Total: ${newCount}/${settings.backspaceLimit}`);

        // Check if limit exceeded and auto-submit
        if (settings.backspaceLimit >= 0 && newCount > settings.backspaceLimit && !isSubmitted) {
          setTimeout(() => {
            console.log('Auto-submitting due to character deletion limit exceeded');
            submitEssay(true);
          }, 100);
        }

        return newCount;
      });
    }

    // Update previous content for next comparison
    setPreviousContent(newContent);
    setContent(newContent);

    const wordCount = countWords(newContent);
    const issues = isSubmitted ? checkGrammar(newContent) : [];

    setGrammarIssues(issues);
    setEssayData({
      ...essayData,
      content: newContent,
      wordCount,
      grammarIssues: issues
    });

    // Real-time mistake checking disabled
    // Clear any existing timeout
    if (realTimeCheckTimeout) {
      clearTimeout(realTimeCheckTimeout);
    }

    // Clear real-time mistakes when disabled
    if (realTimeMistakes.length > 0) {
      setRealTimeMistakes([]);
    }
  };

  // Submit essay function with Google Gemini AI analysis
  const submitEssay = async (isAutoSubmit = false) => {
    if (isSubmitted) return;

    // Auto-stop timer when essay is submitted
    if (isTimerRunning) {
      setIsTimerRunning(false);
      setTimerStoppedBySubmission(true);
      console.log('Timer auto-stopped - essay submitted');
    }

    setIsSubmitted(true);
    if (isAutoSubmit) {
      setAutoSubmitted(true);
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setCurrentAnalysisStep('Starting AI analysis...');

    let progressInterval: NodeJS.Timeout | undefined;

    try {
      // Quick progress updates without delays
      setAnalysisProgress(25);
      setCurrentAnalysisStep('🔍 Connecting to OpenAI GPT...');

      // Small delay only for UI feedback
      await new Promise(resolve => setTimeout(resolve, 200));
      setAnalysisProgress(50);
      setCurrentAnalysisStep('📝 OpenAI analyzing grammar & style...');

      // Update progress during API call
      progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(90, prev + 5));
      }, 2000);

      // Call OpenAI API for comprehensive analysis (more reliable than Gemini)
      const fetchPromise = fetch('/api/openai-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      );

      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      setAnalysisProgress(75);
      setCurrentAnalysisStep('🧠 Processing AI results...');

      if (result.success && result.analysis) {
        const geminiAnalysis = result.analysis;

        // Convert Gemini results to our format
        const issues: GrammarIssue[] = [];

        // Add spelling issues
        if (geminiAnalysis.spellingIssues && Array.isArray(geminiAnalysis.spellingIssues)) {
          geminiAnalysis.spellingIssues.forEach((issue: any, index: number) => {
            issues.push({
              id: `spelling-${index}`,
              type: 'spelling',
              message: issue.message,
              start: issue.position || 0,
              end: (issue.position || 0) + (issue.word?.length || 0),
              suggestions: [issue.correction],
              category: issue.category || 'Spelling'
            });
          });
        }

        // Add grammar issues (legacy support)
        if (geminiAnalysis.grammarIssues && Array.isArray(geminiAnalysis.grammarIssues)) {
          geminiAnalysis.grammarIssues.forEach((issue: any, index: number) => {
            issues.push({
              id: `grammar-${index}`,
              type: 'grammar',
              message: issue.message,
              start: issue.position || 0,
              end: (issue.position || 0) + (issue.text?.length || 0),
              suggestions: [issue.correction],
              category: issue.category || 'Grammar'
            });
          });
        }

        // Add capitalization issues
        if (geminiAnalysis.capitalizationIssues && Array.isArray(geminiAnalysis.capitalizationIssues)) {
          geminiAnalysis.capitalizationIssues.forEach((issue: any, index: number) => {
            issues.push({
              id: `capitalization-${index}`,
              type: 'grammar', // Treat as grammar for display purposes
              message: issue.message,
              start: issue.position || 0,
              end: (issue.position || 0) + (issue.text?.length || 0),
              suggestions: [issue.correction],
              category: issue.category || 'Capitalization'
            });
          });
        }

        // Add punctuation issues
        if (geminiAnalysis.punctuationIssues && Array.isArray(geminiAnalysis.punctuationIssues)) {
          geminiAnalysis.punctuationIssues.forEach((issue: any, index: number) => {
            issues.push({
              id: `punctuation-${index}`,
              type: 'grammar', // Treat as grammar for display purposes
              message: issue.message,
              start: issue.position || 0,
              end: (issue.position || 0) + (issue.text?.length || 0),
              suggestions: [issue.correction],
              category: issue.category || 'Punctuation'
            });
          });
        }

        // Add sentence structure issues (OpenAI specific)
        if (geminiAnalysis.sentenceStructureIssues && Array.isArray(geminiAnalysis.sentenceStructureIssues)) {
          geminiAnalysis.sentenceStructureIssues.forEach((issue: any, index: number) => {
            issues.push({
              id: `sentence-structure-${index}`,
              type: 'grammar',
              message: issue.message,
              start: issue.position || 0,
              end: (issue.position || 0) + (issue.text?.length || 0),
              suggestions: [issue.correction],
              category: issue.category || 'Sentence Structure'
            });
          });
        }

        // Add subject-verb agreement issues (OpenAI specific)
        if (geminiAnalysis.subjectVerbAgreementIssues && Array.isArray(geminiAnalysis.subjectVerbAgreementIssues)) {
          geminiAnalysis.subjectVerbAgreementIssues.forEach((issue: any, index: number) => {
            issues.push({
              id: `subject-verb-${index}`,
              type: 'grammar',
              message: issue.message,
              start: issue.position || 0,
              end: (issue.position || 0) + (issue.text?.length || 0),
              suggestions: [issue.correction],
              category: issue.category || 'Subject-Verb Agreement'
            });
          });
        }

        setGrammarIssues(issues);

        // Categorize issues for detailed display
        const categorizedIssues: {[key: string]: GrammarIssue[]} = {};
        issues.forEach(issue => {
          const category = issue.category || 'Other';
          if (!categorizedIssues[category]) {
            categorizedIssues[category] = [];
          }
          categorizedIssues[category].push(issue);
        });
        setDetailedIssues(categorizedIssues);

        // Quick completion update
        setAnalysisProgress(100);
        setCurrentAnalysisStep('✅ OpenAI analysis complete!');

        // Use Gemini's analysis results
        const wordCount = countWords(content);
        const grammarIssues = issues.filter(i => i.type === 'grammar');
        const spellingIssues = issues.filter(i => i.type === 'spelling');

        // Use Gemini's score but adjust for typing discipline
        let finalScore = geminiAnalysis.overallScore;
        let grade = geminiAnalysis.grade;

        // Adjust score for character deletion limit
        if (charactersDeleted > settings.backspaceLimit) {
          finalScore = Math.max(0, finalScore - 20); // Significant penalty
          grade = 'F'; // Automatic fail for exceeding limit
        }

        // Comprehensive AI analysis using Gemini results
        const analysis = {
          overallScore: finalScore,
          grade,
          strengths: geminiAnalysis.strengths || ['Keep practicing to improve'],
          improvements: geminiAnalysis.improvements || ['Great work! Keep it up'],
          summary: geminiAnalysis.summary || 'Analysis completed',
          metrics: {
            wordCount,
            grammarIssues: grammarIssues.length,
            spellingIssues: spellingIssues.length,
            totalIssues: issues.length,
            charactersDeleted: charactersDeleted,
            deletionLimit: settings.backspaceLimit,
            timeSpent: essayData.timeSpent,
            completionPercentage: Math.min(100, (wordCount / settings.wordLimit) * 100)
          },
          detailedAnalysis: {
            spellingErrors: geminiAnalysis.spellingIssues?.map((issue: any) => ({
              message: issue.message,
              suggestion: issue.correction,
              word: issue.word,
              category: issue.category
            })) || [],
            grammarErrors: geminiAnalysis.grammarIssues?.map((issue: any) => ({
              message: issue.message,
              suggestion: issue.correction,
              text: issue.text,
              category: issue.category
            })) || [],
            topIssues: issues.slice(0, 5).map(issue => ({
              type: issue.type,
              message: issue.message,
              suggestion: issue.suggestions[0] || 'Review and correct'
            }))
          }
        };

        setAiAnalysis(analysis);
        setIsAnalyzing(false);

        // Save to progress
        if (onEssaySubmit) {
          onEssaySubmit({
            content,
            analysis,
            submittedAt: new Date(),
            topic: selectedTopic,
            autoSubmitted: isAutoSubmit,
            metrics: analysis.metrics
          });
        }

      } else {
        throw new Error('Failed to get analysis from Gemini API');
      }

    } catch (error) {
      console.error('Error during AI analysis:', error);

      // Clear progress interval if it exists
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      // Check if it's a timeout error
      const isTimeout = error instanceof Error && error.message.includes('timeout');
      setCurrentAnalysisStep(isTimeout ? '⏱️ OpenAI timeout - using smart local analysis...' : '⚡ Using smart local analysis...');

      // Enhanced local analysis focusing on academic essay structure and grammar
      const wordCount = countWords(content);
      const localIssues: GrammarIssue[] = [];

      // ESSAY STRUCTURE ANALYSIS
      const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
      const totalWords = wordCount;

      // Check for basic essay structure
      let structureScore = 25;
      let thesisScore = 20;
      let languageScore = 15;
      let grammarScore = 25;
      let academicScore = 15;

      // Structure evaluation
      if (paragraphs.length < 3) {
        localIssues.push({
          id: 'structure-paragraphs',
          type: 'grammar',
          message: 'Essay should have at least 3 paragraphs (introduction, body, conclusion)',
          start: 0,
          end: content.length,
          suggestions: ['Add more paragraphs to create proper essay structure'],
          category: 'Essay Structure'
        });
        structureScore -= 10;
      }

      // Check for thesis statement indicators
      const thesisIndicators = ['argue', 'thesis', 'main point', 'purpose', 'will show', 'will demonstrate', 'will prove'];
      const hasThesisIndicators = thesisIndicators.some(indicator =>
        content.toLowerCase().includes(indicator)
      );

      if (!hasThesisIndicators && totalWords > 50) {
        localIssues.push({
          id: 'thesis-missing',
          type: 'grammar',
          message: 'Essay should include a clear thesis statement',
          start: 0,
          end: Math.min(200, content.length),
          suggestions: ['Add a clear thesis statement in your introduction'],
          category: 'Thesis Statement'
        });
        thesisScore -= 10;
      }

      // 1. CAPITALIZATION - Check sentence beginnings and proper nouns
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      sentences.forEach((sentence, index) => {
        const trimmed = sentence.trim();
        if (trimmed.length > 0 && /^[a-z]/.test(trimmed)) {
          localIssues.push({
            id: `cap-${index}`,
            type: 'grammar',
            message: 'Sentence must start with a capital letter',
            start: content.indexOf(trimmed),
            end: content.indexOf(trimmed) + trimmed.length,
            suggestions: [trimmed.charAt(0).toUpperCase() + trimmed.slice(1)],
            category: 'Capitalization'
          });
        }
      });

      // 2. SENTENCE STRUCTURE - Check for fragments and run-ons
      sentences.forEach((sentence, index) => {
        const trimmed = sentence.trim();
        if (trimmed.length > 0) {
          // Check for sentence fragments (very short sentences without proper structure)
          if (trimmed.length < 10 && !trimmed.match(/\b(yes|no|ok|okay|hello|hi|bye|goodbye)\b/i)) {
            localIssues.push({
              id: `fragment-${index}`,
              type: 'grammar',
              message: 'This may be a sentence fragment - ensure it has a subject and verb',
              start: content.indexOf(trimmed),
              end: content.indexOf(trimmed) + trimmed.length,
              suggestions: ['Expand into a complete sentence'],
              category: 'Sentence Structure'
            });
          }

          // Check for potential run-on sentences (very long sentences)
          if (trimmed.length > 150 && !trimmed.includes(',') && !trimmed.includes(';')) {
            localIssues.push({
              id: `runon-${index}`,
              type: 'grammar',
              message: 'This sentence may be too long - consider breaking it into shorter sentences',
              start: content.indexOf(trimmed),
              end: content.indexOf(trimmed) + trimmed.length,
              suggestions: ['Break into shorter sentences'],
              category: 'Sentence Structure'
            });
          }
        }
      });

      // 3. SUBJECT-VERB AGREEMENT - Check common agreement errors
      const agreementErrors = [
        { pattern: /\bthe group are\b/gi, correction: 'the group is', message: 'Collective noun "group" takes singular verb' },
        { pattern: /\beach student have\b/gi, correction: 'each student has', message: '"Each" takes singular verb' },
        { pattern: /\bevery student have\b/gi, correction: 'every student has', message: '"Every" takes singular verb' },
        { pattern: /\bthe team are\b/gi, correction: 'the team is', message: 'Collective noun "team" takes singular verb' },
        { pattern: /\bthe class are\b/gi, correction: 'the class is', message: 'Collective noun "class" takes singular verb' },
        { pattern: /\bthe family are\b/gi, correction: 'the family is', message: 'Collective noun "family" takes singular verb' },
        { pattern: /\bone of the students are\b/gi, correction: 'one of the students is', message: '"One" is the subject, takes singular verb' },
        { pattern: /\bneither.*are\b/gi, correction: 'neither...is', message: '"Neither" takes singular verb' },
        { pattern: /\beither.*are\b/gi, correction: 'either...is', message: '"Either" takes singular verb' }
      ];

      agreementErrors.forEach((error, index) => {
        let match;
        while ((match = error.pattern.exec(content)) !== null) {
          localIssues.push({
            id: `agreement-${index}-${match.index}`,
            type: 'grammar',
            message: error.message,
            start: match.index,
            end: match.index + match[0].length,
            suggestions: [error.correction],
            category: 'Subject-Verb Agreement'
          });
        }
      });

      // 4. SPELLING - Check for common spelling mistakes
      const commonMistakes: {[key: string]: string} = {
        'teh': 'the',
        'adn': 'and',
        'recieve': 'receive',
        'seperate': 'separate',
        'definately': 'definitely',
        'occured': 'occurred',
        'begining': 'beginning',
        'writting': 'writing',
        'grammer': 'grammar',
        'wich': 'which'
      };

      Object.keys(commonMistakes).forEach(mistake => {
        const regex = new RegExp(`\\b${mistake}\\b`, 'gi');
        let match;
        while ((match = regex.exec(content)) !== null) {
          localIssues.push({
            id: `spell-${match.index}`,
            type: 'spelling',
            message: `"${mistake}" should be "${commonMistakes[mistake]}"`,
            start: match.index,
            end: match.index + mistake.length,
            suggestions: [commonMistakes[mistake]],
            category: 'Spelling'
          });
        }
      });

      // 5. PUNCTUATION - Check for punctuation errors

      // 6. Check for punctuation errors
      const sentencesForPunctuation = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

      // Check for missing periods at end of sentences
      if (content.trim().length > 0 && !/[.!?]$/.test(content.trim())) {
        localIssues.push({
          id: `missing-period-end`,
          type: 'grammar',
          message: 'Missing punctuation at the end of the essay',
          start: content.length - 1,
          end: content.length,
          suggestions: [content.trim() + '.'],
          category: 'Punctuation'
        });
      }

      // Check for missing commas in lists
      const listPattern = /\b\w+\s+\w+\s+and\s+\w+\b/g;
      let listMatch;
      while ((listMatch = listPattern.exec(content)) !== null) {
        if (!listMatch[0].includes(',')) {
          const words = listMatch[0].split(' ');
          if (words.length >= 4) {
            const corrected = words.slice(0, -2).join(', ') + ', and ' + words[words.length - 1];
            localIssues.push({
              id: `missing-comma-${listMatch.index}`,
              type: 'grammar',
              message: 'Missing comma in series',
              start: listMatch.index,
              end: listMatch.index + listMatch[0].length,
              suggestions: [corrected],
              category: 'Punctuation'
            });
          }
        }
      }

      // Check for missing apostrophes in contractions
      const contractionErrors = {
        'dont': "don't",
        'cant': "can't",
        'wont': "won't",
        'isnt': "isn't",
        'arent': "aren't",
        'wasnt': "wasn't",
        'werent': "weren't",
        'hasnt': "hasn't",
        'havent': "haven't",
        'hadnt': "hadn't",
        'wouldnt': "wouldn't",
        'couldnt': "couldn't",
        'shouldnt': "shouldn't",
        'mustnt': "mustn't",
        'neednt': "needn't",
        'darent': "daren't",
        'shant': "shan't"
      };

      Object.keys(contractionErrors).forEach(error => {
        const regex = new RegExp(`\\b${error}\\b`, 'gi');
        let match;
        while ((match = regex.exec(content)) !== null) {
          localIssues.push({
            id: `apostrophe-${match.index}`,
            type: 'grammar',
            message: `Missing apostrophe in contraction`,
            start: match.index,
            end: match.index + error.length,
            suggestions: [contractionErrors[error]],
            category: 'Punctuation'
          });
        }
      });

      // 7. Check for double spaces
      const doubleSpaceRegex = /  +/g;
      let spaceMatch;
      while ((spaceMatch = doubleSpaceRegex.exec(content)) !== null) {
        localIssues.push({
          id: `space-${spaceMatch.index}`,
          type: 'grammar',
          message: 'Multiple spaces should be single space',
          start: spaceMatch.index,
          end: spaceMatch.index + spaceMatch[0].length,
          suggestions: [' '],
          category: 'Formatting'
        });
      }

      setGrammarIssues(localIssues);

      // Categorize issues for detailed display
      const categorizedIssues: {[key: string]: GrammarIssue[]} = {};
      localIssues.forEach(issue => {
        const category = issue.category || 'Other';
        if (!categorizedIssues[category]) {
          categorizedIssues[category] = [];
        }
        categorizedIssues[category].push(issue);
      });
      setDetailedIssues(categorizedIssues);

      // Calculate comprehensive score based on structure and grammar
      const finalStructureScore = Math.max(0, structureScore);
      const finalThesisScore = Math.max(0, thesisScore);
      const finalLanguageScore = Math.max(0, languageScore);
      const finalGrammarScore = Math.max(0, grammarScore - (localIssues.length * 2));
      const finalAcademicScore = Math.max(0, academicScore);

      const comprehensiveScore = finalStructureScore + finalThesisScore + finalLanguageScore + finalGrammarScore + finalAcademicScore;

      const fallbackAnalysis = {
        overallScore: comprehensiveScore,
        grade: (comprehensiveScore >= 90 ? 'A' : comprehensiveScore >= 80 ? 'B' : comprehensiveScore >= 70 ? 'C' : comprehensiveScore >= 60 ? 'D' : 'F') as const,
        structureScore: finalStructureScore,
        thesisScore: finalThesisScore,
        languageScore: finalLanguageScore,
        grammarScore: finalGrammarScore,
        academicScore: finalAcademicScore,
        structureAnalysis: {
          hasIntroduction: paragraphs.length > 0,
          hasThesis: hasThesisIndicators,
          hasBodyParagraphs: paragraphs.length >= 2,
          hasConclusion: paragraphs.length >= 3,
          logicalFlow: paragraphs.length >= 3,
          feedback: `Essay has ${paragraphs.length} paragraph${paragraphs.length !== 1 ? 's' : ''}. ${hasThesisIndicators ? 'Thesis indicators found.' : 'Consider adding a clear thesis statement.'}`
        },
        strengths: [
          ...(localIssues.length === 0 ? ['No obvious grammar errors detected'] : []),
          ...(paragraphs.length >= 3 ? ['Good paragraph structure'] : []),
          ...(hasThesisIndicators ? ['Thesis statement indicators present'] : []),
          ...(wordCount >= 100 ? ['Adequate length'] : [])
        ],
        improvements: [
          ...(localIssues.length > 0 ? [`Fix ${localIssues.length} grammar issue${localIssues.length > 1 ? 's' : ''}`] : []),
          ...(paragraphs.length < 3 ? ['Add more paragraphs for proper essay structure'] : []),
          ...(!hasThesisIndicators ? ['Include a clear thesis statement'] : []),
          ...(wordCount < 100 ? ['Expand essay content'] : [])
        ],
        summary: `Comprehensive analysis: ${comprehensiveScore}/100 points. Structure: ${finalStructureScore}/25, Grammar: ${finalGrammarScore}/25, Thesis: ${finalThesisScore}/20, Language: ${finalLanguageScore}/15, Academic: ${finalAcademicScore}/15`,
        metrics: {
          wordCount,
          grammarIssues: localIssues.filter(i => i.type === 'grammar').length,
          spellingIssues: localIssues.filter(i => i.type === 'spelling').length,
          totalIssues: localIssues.length,
          charactersDeleted: charactersDeleted,
          deletionLimit: settings.backspaceLimit,
          timeSpent: essayData.timeSpent,
          completionPercentage: Math.min(100, (wordCount / settings.wordLimit) * 100)
        },
        detailedAnalysis: {
          spellingErrors: localIssues.filter(i => i.type === 'spelling'),
          grammarErrors: localIssues.filter(i => i.type === 'grammar'),
          topIssues: localIssues.slice(0, 5)
        }
      };

      setGrammarIssues([]);
      setDetailedIssues({});
      setAiAnalysis(fallbackAnalysis);
      setIsAnalyzing(false);
      setAnalysisProgress(100);
      setCurrentAnalysisStep(`⚡ Smart local analysis complete! Found ${localIssues.length} issue${localIssues.length !== 1 ? 's' : ''}`);

      // Save fallback results
      if (onEssaySubmit) {
        onEssaySubmit({
          content,
          analysis: fallbackAnalysis,
          submittedAt: new Date(),
          topic: selectedTopic,
          autoSubmitted: isAutoSubmit,
          metrics: fallbackAnalysis.metrics
        });
      }
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
  }, [charactersDeleted, isSubmitted, settings.backspaceLimit]);

  // Mount effect
  useEffect(() => {
    setMounted(true);
    setPreviousContent(essayData.content);
  }, []);

  const wordLimitReached = essayData.wordCount >= settings.wordLimit;

  return (
    <div className="p-8">


      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">🤖 AI Essay Writer</h2>

          {/* Stats Cards - Right Side, Smaller */}
          <div className="flex items-center gap-2">
            {/* Timer Card - Compact */}
            <div className="flex items-center space-x-2 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/30 dark:to-indigo-900/30 backdrop-blur-sm rounded-lg px-3 py-2 border border-blue-200/60 dark:border-blue-800/60 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="relative flex-shrink-0">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center shadow-sm">
                  <Timer className="w-3 h-3 text-white" />
                </div>
                {isTimerRunning && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse border border-white dark:border-gray-800"></div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className={'font-mono text-sm font-bold tracking-tight transition-colors duration-300 ' + (timeRemaining < 300 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-gray-900 dark:text-white')}>
                  {formatTime(timeRemaining)}
                </span>
                <button
                  onClick={() => {
                    setIsTimerRunning(!isTimerRunning);
                    if (timerStoppedBySubmission) {
                      setTimerStoppedBySubmission(false);
                    }
                  }}
                  className={'text-xs font-medium px-1.5 py-0.5 rounded-md transition-all duration-200 ' + (
                    timerStoppedBySubmission
                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300'
                      : isTimerRunning
                      ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300'
                      : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300'
                  )}
                >
                  {timerStoppedBySubmission ? '✓ Auto-Stopped' : isTimerRunning ? (hasStartedWriting ? '⏸ Pause' : '🔄 Auto-Running') : (hasStartedWriting ? '▶ Start' : '⏱ Auto-Start')}
                </button>
              </div>
            </div>

            {/* Word Count Card - Compact */}
            <div className="flex items-center space-x-2 bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-900/30 dark:to-emerald-900/30 backdrop-blur-sm rounded-lg px-3 py-2 border border-green-200/60 dark:border-green-800/60 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-md flex items-center justify-center shadow-sm flex-shrink-0">
                <FileText className="w-3 h-3 text-white" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-baseline space-x-1">
                  <span className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
                    {essayData.wordCount}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    / {settings.wordLimit}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    words
                  </span>
                  <div className="w-6 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((essayData.wordCount / settings.wordLimit) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden status tracking - functionality works in background */}

        {/* Essay Editor */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder={`Start writing your essay here...

💡 AI Features:
• Grammar, spelling & punctuation checking
• Automatic submission when complete
• Enhanced writing assistance
• Professional essay analysis
• Educational explanations for mistakes

📝 Write your essay and submit for comprehensive AI analysis!`}
              className={`w-full h-96 p-4 resize-none focus:outline-none bg-transparent text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 leading-relaxed text-lg ${
                wordLimitReached || isSubmitted ? 'cursor-not-allowed opacity-75' : ''
              }`}
              disabled={wordLimitReached || isSubmitted}
            />

            {/* Real-time checking indicator - Hidden */}
            {false && !isSubmitted && content.trim().length > 0 && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>⚡ Real-time grammar checking active</span>
                </div>
                {realTimeMistakes.length > 0 && (
                  <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                    {realTimeMistakes.length} mistake{realTimeMistakes.length !== 1 ? 's' : ''} detected
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              💡 You can submit your essay at any time - even if it's not complete!
            </p>
          </div>
          <div className="flex justify-center space-x-4">
          <button
            onClick={() => {
              resetBackspaceTracking();
              setContent('');
              setPreviousContent('');
              setEssayData({
                content: '',
                wordCount: 0,
                timeSpent: 0,
                grammarIssues: [],
              });
              setIsSubmitted(false);
              setAutoSubmitted(false);
              setAiAnalysis(null);
            }}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Reset Essay</span>
          </button>

          <button
            onClick={() => submitEssay(false)}
            disabled={isSubmitted || content.trim().length === 0}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-medium ${
              isSubmitted
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : content.trim().length === 0
                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            <span>{isSubmitted ? 'Submitted' : 'Submit Essay'}</span>
          </button>
          </div>
        </div>

        {/* Real-Time Mistakes Display - Hidden */}
        {false && realTimeMistakes.length > 0 && (
          <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                    ⚡ Real-Time Mistake Detection
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    {realTimeMistakes.length} mistake{realTimeMistakes.length !== 1 ? 's' : ''} found while typing
                  </p>
                </div>
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full animate-pulse">
                ⚡ Live Checking
              </div>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {(() => {
                // Group mistakes by line number
                const mistakesByLine = realTimeMistakes.reduce((acc, mistake) => {
                  const lineNum = mistake.lineNumber || 1;
                  if (!acc[lineNum]) acc[lineNum] = [];
                  acc[lineNum].push(mistake);
                  return acc;
                }, {} as {[key: number]: GrammarIssue[]});

                return Object.entries(mistakesByLine)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .slice(0, 8) // Show first 8 lines with mistakes
                  .map(([lineNumber, mistakes]) => (
                    <div key={lineNumber} className="bg-white dark:bg-gray-800 rounded-lg border border-yellow-200 dark:border-yellow-700 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-xs px-3 py-1 rounded-full font-bold">
                            Line {lineNumber}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            mistakes.length === 1 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                            mistakes.length <= 3 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                            'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                          }`}>
                            {mistakes.length} issue{mistakes.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Real-time detection
                        </div>
                      </div>

                      <div className="space-y-2">
                        {mistakes.slice(0, 3).map((mistake) => (
                          <div key={mistake.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border-l-4 border-l-yellow-400">
                            <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                              mistake.type === 'spelling' ? 'bg-red-500' :
                              mistake.type === 'grammar' ? 'bg-blue-500' : 'bg-purple-500'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  mistake.type === 'spelling'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                    : mistake.type === 'grammar'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                }`}>
                                  {mistake.category}
                                </span>
                                {mistake.severity && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                    mistake.severity === 'high' ? 'bg-red-200 text-red-800 dark:bg-red-800/40 dark:text-red-200' :
                                    mistake.severity === 'medium' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800/40 dark:text-yellow-200' :
                                    'bg-green-200 text-green-800 dark:bg-green-800/40 dark:text-green-200'
                                  }`}>
                                    {mistake.severity}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                {mistake.message.replace(`Line ${lineNumber}: `, '')}
                              </p>
                              {mistake.originalText && mistake.correctedText && (
                                <div className="text-xs bg-white dark:bg-gray-800 p-2 rounded border">
                                  <span className="text-red-600 dark:text-red-400 line-through font-medium">"{mistake.originalText}"</span>
                                  <span className="mx-2 text-gray-400">→</span>
                                  <span className="text-green-600 dark:text-green-400 font-medium">"{mistake.correctedText}"</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {mistakes.length > 3 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                            ... and {mistakes.length - 3} more mistake{mistakes.length - 3 !== 1 ? 's' : ''} on this line
                          </div>
                        )}
                      </div>
                    </div>
                  ));
              })()}
              {Object.keys(realTimeMistakes.reduce((acc, mistake) => {
                const lineNum = mistake.lineNumber || 1;
                acc[lineNum] = true;
                return acc;
              }, {} as {[key: number]: boolean})).length > 8 && (
                <div className="text-center text-sm text-yellow-600 dark:text-yellow-400 py-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  ... showing first 8 lines with mistakes. Submit essay for complete analysis.
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Analysis Progress */}
        {isAnalyzing && (
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800 shadow-xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center animate-pulse">
                <span className="text-white text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Google Gemini AI Analysis</h3>
                <p className="text-gray-600 dark:text-gray-400">Professional-grade spelling and grammar checking</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{currentAnalysisStep}</span>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{analysisProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${analysisProgress}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className={`p-3 rounded-lg transition-all ${analysisProgress >= 25 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <div className="text-2xl mb-1">{analysisProgress >= 25 ? '✅' : '⏳'}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Gemini Connection</div>
              </div>
              <div className={`p-3 rounded-lg transition-all ${analysisProgress >= 50 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <div className="text-2xl mb-1">{analysisProgress >= 50 ? '✅' : '⏳'}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">AI Analysis</div>
              </div>
              <div className={`p-3 rounded-lg transition-all ${analysisProgress >= 100 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <div className="text-2xl mb-1">{analysisProgress >= 100 ? '✅' : '⏳'}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Results Ready</div>
              </div>
            </div>
          </div>
        )}

        {/* AI Analysis Results */}
        {aiAnalysis && (
          <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-indigo-200 dark:border-indigo-800 shadow-xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Google Gemini AI Results</h3>
                <p className="text-gray-600 dark:text-gray-400">Professional spelling and grammar analysis</p>
                {aiAnalysis.summary && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 italic">"{aiAnalysis.summary}"</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Overall Score */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <div className="text-center">
                  <div className={`text-6xl font-bold mb-2 ${
                    aiAnalysis.overallScore >= 80 ? 'text-green-600' :
                    aiAnalysis.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {aiAnalysis.overallScore}
                  </div>
                  <div className={`text-3xl font-bold mb-4 ${
                    aiAnalysis.grade === 'A' ? 'text-green-600' :
                    aiAnalysis.grade === 'B' ? 'text-blue-600' :
                    aiAnalysis.grade === 'C' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    Grade: {aiAnalysis.grade}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">Overall Score</p>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4">📊 Writing Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Word Count:</span>
                    <span className="font-medium text-gray-800 dark:text-white">{aiAnalysis.metrics.wordCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Grammar Issues:</span>
                    <span className={`font-medium ${aiAnalysis.metrics.grammarIssues === 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {aiAnalysis.metrics.grammarIssues}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Spelling Issues:</span>
                    <span className={`font-medium ${aiAnalysis.metrics.spellingIssues === 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {aiAnalysis.metrics.spellingIssues}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Characters Deleted:</span>
                    <span className={`font-medium ${aiAnalysis.metrics.charactersDeleted > aiAnalysis.metrics.deletionLimit ? 'text-red-600' : 'text-green-600'}`}>
                      {aiAnalysis.metrics.charactersDeleted}/{aiAnalysis.metrics.deletionLimit}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths and Improvements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Strengths */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-green-100 dark:border-green-800">
                <h4 className="text-lg font-bold text-green-800 dark:text-green-300 mb-4 flex items-center">
                  <span className="text-2xl mr-2">✅</span>
                  Strengths
                </h4>
                <ul className="space-y-2">
                  {aiAnalysis.strengths.map((strength: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-orange-100 dark:border-orange-800">
                <h4 className="text-lg font-bold text-orange-800 dark:text-orange-300 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Areas for Improvement
                </h4>
                <ul className="space-y-2">
                  {aiAnalysis.improvements.map((improvement: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-gray-700 dark:text-gray-300">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                <span className="text-2xl mr-2">📋</span>
                AI Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{aiAnalysis.metrics.totalIssues}</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">Total Issues</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{Math.round(aiAnalysis.metrics.completionPercentage)}%</div>
                  <div className="text-xs text-green-600 dark:text-green-400">Completion</div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{aiAnalysis.metrics.timeSpent}s</div>
                  <div className="text-xs text-purple-600 dark:text-purple-400">Time Spent</div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {aiAnalysis.metrics.charactersDeleted <= aiAnalysis.metrics.deletionLimit ? '✓' : '✗'}
                  </div>
                  <div className="text-xs text-orange-600 dark:text-orange-400">Typing Discipline</div>
                </div>
              </div>
            </div>

            {/* Automated Proofreading Button */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowProofreading(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-medium mx-auto"
              >
                <Edit3 className="w-5 h-5" />
                <span>🤖 Automated Proofreading & Error Correction</span>
              </button>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Get detailed corrections with explanations and accept/reject suggestions
              </p>
            </div>
          </div>
        )}

        {/* Detailed Mistakes Breakdown */}
        {aiAnalysis && Object.keys(detailedIssues).length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl p-8 border border-red-200 dark:border-red-800 shadow-xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-2xl">🔍</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Detailed Mistake Analysis</h3>
                <p className="text-gray-600 dark:text-gray-400">Every spelling and grammar issue found</p>
              </div>
            </div>

            <div className="space-y-6">
              {Object.entries(detailedIssues).map(([category, issues]) => (
                <div key={category} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                    <span className="text-2xl mr-3">
                      {issues[0]?.type === 'spelling' ? '📝' : '📚'}
                    </span>
                    {category} ({issues.length} issue{issues.length !== 1 ? 's' : ''})
                  </h4>

                  <div className="space-y-3">
                    {issues.map((issue, index) => (
                      <div key={issue.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-red-400">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 dark:text-white mb-1">
                              Issue #{index + 1}: {issue.message}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              Found at position {issue.start}-{issue.end} in your essay
                            </p>
                            {issue.suggestions.length > 0 && (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium text-green-600 dark:text-green-400">Suggestion:</span>
                                <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded">
                                  {issue.suggestions[0]}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${
                            issue.type === 'spelling' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                            'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                          }`}>
                            {issue.type}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {Object.keys(detailedIssues).length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 dark:text-green-400 text-2xl">✅</span>
                </div>
                <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Perfect Writing!</h4>
                <p className="text-gray-600 dark:text-gray-400">No spelling or grammar mistakes found.</p>
              </div>
            )}
          </div>
        )}

        {/* Automated Proofreading Modal */}
        {showProofreading && (
          <AutomatedProofreading
            originalText={content}
            onClose={() => setShowProofreading(false)}
          />
        )}
      </div>
    </div>
  );
}
