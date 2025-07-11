'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, BookOpen, Lightbulb, TrendingUp, Edit3, Eye, RotateCcw } from 'lucide-react';

interface Correction {
  type: 'grammar' | 'spelling' | 'punctuation' | 'style' | 'vocabulary';
  originalText: string;
  correctedText: string;
  position: number;
  explanation: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
  acceptReject: boolean;
  grammarTip: string;
  accepted?: boolean;
}

interface StyleEnhancement {
  originalPhrase: string;
  enhancedPhrase: string;
  reason: string;
  position: number;
  acceptReject: boolean;
  accepted?: boolean;
}

interface ProofreadingData {
  correctedText: string;
  corrections: Correction[];
  styleEnhancements: StyleEnhancement[];
  overallFeedback: {
    strengths: string[];
    improvements: string[];
    writingScore: number;
    academicTone: string;
    clarity: string;
  };
  statistics: {
    totalCorrections: number;
    grammarErrors: number;
    spellingErrors: number;
    punctuationErrors: number;
    styleImprovements: number;
    vocabularyEnhancements: number;
  };
}

interface AutomatedProofreadingProps {
  originalText: string;
  onClose: () => void;
}

export default function AutomatedProofreading({ originalText, onClose }: AutomatedProofreadingProps) {
  const [proofreading, setProofreading] = useState<ProofreadingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'corrections' | 'style' | 'feedback'>('corrections');
  const [showOriginal, setShowOriginal] = useState(false);
  const [finalText, setFinalText] = useState('');

  useEffect(() => {
    analyzeText();
  }, [originalText]);

  const analyzeText = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/automated-proofreading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: originalText }),
      });

      const result = await response.json();
      if (result.success && result.proofreading) {
        const data = result.proofreading;
        // Initialize acceptance status
        data.corrections = data.corrections.map((c: Correction) => ({ ...c, accepted: true }));
        data.styleEnhancements = data.styleEnhancements.map((s: StyleEnhancement) => ({ ...s, accepted: true }));
        
        setProofreading(data);
        setFinalText(data.correctedText);
      }
    } catch (error) {
      console.error('Proofreading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCorrection = (index: number, type: 'correction' | 'style') => {
    if (!proofreading) return;

    const updated = { ...proofreading };
    if (type === 'correction') {
      updated.corrections[index].accepted = !updated.corrections[index].accepted;
    } else {
      updated.styleEnhancements[index].accepted = !updated.styleEnhancements[index].accepted;
    }
    
    setProofreading(updated);
    updateFinalText(updated);
  };

  const updateFinalText = (data: ProofreadingData) => {
    let text = originalText;
    
    // Apply accepted corrections
    data.corrections.forEach((correction) => {
      if (correction.accepted) {
        text = text.replace(new RegExp(correction.originalText, 'gi'), correction.correctedText);
      }
    });

    // Apply accepted style enhancements
    data.styleEnhancements.forEach((enhancement) => {
      if (enhancement.accepted) {
        text = text.replace(new RegExp(enhancement.originalPhrase, 'gi'), enhancement.enhancedPhrase);
      }
    });

    setFinalText(text);
  };

  const acceptAllCorrections = () => {
    if (!proofreading) return;
    
    const updated = { ...proofreading };
    updated.corrections = updated.corrections.map(c => ({ ...c, accepted: true }));
    updated.styleEnhancements = updated.styleEnhancements.map(s => ({ ...s, accepted: true }));
    
    setProofreading(updated);
    updateFinalText(updated);
  };

  const rejectAllCorrections = () => {
    if (!proofreading) return;
    
    const updated = { ...proofreading };
    updated.corrections = updated.corrections.map(c => ({ ...c, accepted: false }));
    updated.styleEnhancements = updated.styleEnhancements.map(s => ({ ...s, accepted: false }));
    
    setProofreading(updated);
    setFinalText(originalText);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              🤖 AI Proofreading in Progress
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Analyzing grammar, spelling, style, and vocabulary...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!proofreading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md mx-4">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Analysis Failed
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Unable to analyze the essay. Please try again.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">🤖 Automated Proofreading & Enhancement</h2>
              <p className="text-blue-100">
                AI-powered grammar, spelling, and style corrections with explanations
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{proofreading.statistics.totalCorrections}</div>
              <div className="text-xs text-blue-100">Total Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{proofreading.statistics.grammarErrors}</div>
              <div className="text-xs text-blue-100">Grammar</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{proofreading.statistics.spellingErrors}</div>
              <div className="text-xs text-blue-100">Spelling</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{proofreading.statistics.punctuationErrors}</div>
              <div className="text-xs text-blue-100">Punctuation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{proofreading.statistics.styleImprovements}</div>
              <div className="text-xs text-blue-100">Style</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{proofreading.overallFeedback.writingScore}</div>
              <div className="text-xs text-blue-100">Score</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'corrections', label: 'Corrections', icon: Edit3, count: proofreading.corrections.length },
              { id: 'style', label: 'Style Enhancement', icon: TrendingUp, count: proofreading.styleEnhancements.length },
              { id: 'feedback', label: 'Overall Feedback', icon: BookOpen, count: 0 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {activeTab === 'corrections' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Grammar, Spelling & Punctuation Corrections
                </h3>
                <div className="space-x-2">
                  <button
                    onClick={acceptAllCorrections}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={rejectAllCorrections}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    Reject All
                  </button>
                </div>
              </div>
              
              {proofreading.corrections.map((correction, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    correction.accepted
                      ? 'border-green-200 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 bg-gray-50 dark:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          correction.type === 'spelling' ? 'bg-red-100 text-red-700' :
                          correction.type === 'grammar' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {correction.category}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          correction.severity === 'high' ? 'bg-red-200 text-red-800' :
                          correction.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-green-200 text-green-800'
                        }`}>
                          {correction.severity}
                        </span>
                      </div>
                      
                      <div className="mb-2">
                        <span className="text-red-600 line-through font-medium">"{correction.originalText}"</span>
                        <span className="mx-2 text-gray-400">→</span>
                        <span className="text-green-600 font-medium">"{correction.correctedText}"</span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {correction.explanation}
                      </p>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-sm">
                        <Lightbulb className="w-4 h-4 inline mr-1 text-blue-500" />
                        <strong>Tip:</strong> {correction.grammarTip}
                      </div>
                    </div>
                    
                    <div className="ml-4 flex space-x-2">
                      <button
                        onClick={() => toggleCorrection(index, 'correction')}
                        className={`p-2 rounded-full ${
                          correction.accepted
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                        }`}
                        title={correction.accepted ? 'Accepted' : 'Rejected'}
                      >
                        {correction.accepted ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {proofreading.corrections.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>No grammar, spelling, or punctuation errors found!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'style' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Style & Vocabulary Enhancements
              </h3>
              
              {proofreading.styleEnhancements.map((enhancement, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    enhancement.accepted
                      ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 bg-gray-50 dark:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2">
                        <span className="text-orange-600 font-medium">"{enhancement.originalPhrase}"</span>
                        <span className="mx-2 text-gray-400">→</span>
                        <span className="text-blue-600 font-medium">"{enhancement.enhancedPhrase}"</span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Improvement:</strong> {enhancement.reason}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => toggleCorrection(index, 'style')}
                      className={`p-2 rounded-full ml-4 ${
                        enhancement.accepted
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                      }`}
                      title={enhancement.accepted ? 'Accepted' : 'Rejected'}
                    >
                      {enhancement.accepted ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
              
              {proofreading.styleEnhancements.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 text-blue-500" />
                  <p>No style enhancements suggested. Your writing style is good!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-3">
                    ✅ Strengths
                  </h4>
                  <ul className="space-y-2">
                    {proofreading.overallFeedback.strengths.map((strength, index) => (
                      <li key={index} className="text-green-700 dark:text-green-400 flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-orange-800 dark:text-orange-300 mb-3">
                    📈 Areas for Improvement
                  </h4>
                  <ul className="space-y-2">
                    {proofreading.overallFeedback.improvements.map((improvement, index) => (
                      <li key={index} className="text-orange-700 dark:text-orange-400 flex items-start">
                        <span className="text-orange-500 mr-2">•</span>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {proofreading.overallFeedback.writingScore}/100
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-400">Writing Score</div>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-purple-600 mb-1">
                    {proofreading.overallFeedback.academicTone}
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-400">Academic Tone</div>
                </div>
                
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-indigo-600 mb-1">
                    {proofreading.overallFeedback.clarity}
                  </div>
                  <div className="text-sm text-indigo-700 dark:text-indigo-400">Clarity & Flow</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Text Preview */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
              {showOriginal ? 'Original Text' : 'Corrected Text'}
            </h4>
            <div className="space-x-2">
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 flex items-center space-x-1"
              >
                <Eye className="w-4 h-4" />
                <span>{showOriginal ? 'Show Corrected' : 'Show Original'}</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Apply Changes
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-32 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
              {showOriginal ? originalText : finalText}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
