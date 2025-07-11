import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    // Try Grok API first
    if (process.env.GROQ_API_KEY) {
      try {
        const prompt = `You are an expert proofreading AI assistant specializing in automated error correction and style enhancement. Analyze the following essay and provide comprehensive corrections and improvements.

TASK: Provide automated proofreading with the following features:

1. GRAMMAR CORRECTION: Fix all grammatical errors including:
   - Subject-verb agreement
   - Tense consistency
   - Sentence fragments
   - Run-on sentences
   - Pronoun usage

2. SPELLING & PUNCTUATION: Correct all:
   - Misspelled words
   - Missing or incorrect punctuation
   - Capitalization errors
   - Apostrophe usage

3. STYLE & VOCABULARY ENHANCEMENT: Suggest improvements for:
   - Word choice and vocabulary
   - Sentence structure and flow
   - Academic tone and formality
   - Clarity and conciseness
   - Redundancy elimination

4. REAL-TIME FEEDBACK: Provide explanations for each correction

Return your analysis in this exact JSON format:
{
  "correctedText": "The fully corrected and enhanced version of the essay",
  "corrections": [
    {
      "type": "grammar|spelling|punctuation|style|vocabulary",
      "originalText": "exact original text with error",
      "correctedText": "corrected version",
      "position": number,
      "explanation": "detailed explanation of why this correction was made",
      "category": "specific category like 'Subject-Verb Agreement', 'Spelling', etc.",
      "severity": "high|medium|low",
      "acceptReject": true,
      "grammarTip": "educational tip to help improve writing skills"
    }
  ],
  "styleEnhancements": [
    {
      "originalPhrase": "original awkward or informal phrase",
      "enhancedPhrase": "improved academic/formal version",
      "reason": "explanation of improvement",
      "position": number,
      "acceptReject": true
    }
  ],
  "overallFeedback": {
    "strengths": ["list of writing strengths"],
    "improvements": ["specific areas for improvement"],
    "writingScore": number (0-100),
    "academicTone": "assessment of academic appropriateness",
    "clarity": "assessment of clarity and flow"
  },
  "statistics": {
    "totalCorrections": number,
    "grammarErrors": number,
    "spellingErrors": number,
    "punctuationErrors": number,
    "styleImprovements": number,
    "vocabularyEnhancements": number
  }
}

Essay to proofread and enhance:
"${content}"

Be thorough, accurate, and educational. Focus on helping the user learn from corrections.`;

        const completion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "llama-3.1-70b-versatile",
          temperature: 0.1,
          max_tokens: 4000,
        });

        const responseText = completion.choices[0]?.message?.content;
        
        if (responseText) {
          let grokAnalysis;
          try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              grokAnalysis = JSON.parse(jsonMatch[0]);
            } else {
              grokAnalysis = JSON.parse(responseText);
            }
            
            return NextResponse.json({
              success: true,
              proofreading: grokAnalysis,
              provider: 'grok'
            });
          } catch (parseError) {
            console.error('Failed to parse Grok response:', parseError);
            // Fall through to local analysis
          }
        }
      } catch (error) {
        console.error('Grok API error:', error);
        // Fall through to local analysis
      }
    }

    // Enhanced local proofreading analysis
    const localProofreading = performLocalProofreading(content);
    
    return NextResponse.json({
      success: true,
      proofreading: localProofreading,
      provider: 'local-enhanced'
    });

  } catch (error) {
    console.error('Proofreading API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      proofreading: {
        correctedText: content,
        corrections: [],
        styleEnhancements: [],
        overallFeedback: {
          strengths: ["Essay submitted for analysis"],
          improvements: ["Continue practicing to improve writing skills"],
          writingScore: 75,
          academicTone: "Needs improvement",
          clarity: "Fair"
        },
        statistics: {
          totalCorrections: 0,
          grammarErrors: 0,
          spellingErrors: 0,
          punctuationErrors: 0,
          styleImprovements: 0,
          vocabularyEnhancements: 0
        }
      }
    });
  }
}

// Enhanced local proofreading function
function performLocalProofreading(text: string) {
  const corrections: any[] = [];
  const styleEnhancements: any[] = [];
  let correctedText = text;
  let position = 0;

  // Grammar and spelling corrections
  const grammarRules = [
    { pattern: /\btheir\s+are\b/gi, correction: 'there are', type: 'grammar', category: 'Pronoun Usage', explanation: 'Use "there are" for existence, "their" for possession' },
    { pattern: /\bits\s+a\b/gi, correction: "it's a", type: 'grammar', category: 'Contraction', explanation: 'Use "it\'s" (it is) instead of "its" (possessive)' },
    { pattern: /\byour\s+welcome\b/gi, correction: "you're welcome", type: 'grammar', category: 'Contraction', explanation: 'Use "you\'re" (you are) instead of "your" (possessive)' },
    { pattern: /\bto\s+much\b/gi, correction: 'too much', type: 'grammar', category: 'Word Choice', explanation: 'Use "too" for excess, "to" for direction' }
  ];

  const spellingRules = [
    { pattern: /\bimportent\b/gi, correction: 'important', type: 'spelling', explanation: 'Correct spelling is "important"' },
    { pattern: /\bknowlegeable\b/gi, correction: 'knowledgeable', type: 'spelling', explanation: 'Correct spelling includes "dge"' },
    { pattern: /\bcriticaly\b/gi, correction: 'critically', type: 'spelling', explanation: 'Adverb form requires "ally" ending' },
    { pattern: /\bsucess\b/gi, correction: 'success', type: 'spelling', explanation: 'Correct spelling has double "c"' },
    { pattern: /\brecieve\b/gi, correction: 'receive', type: 'spelling', explanation: 'Remember: "i before e except after c"' },
    { pattern: /\bseperate\b/gi, correction: 'separate', type: 'spelling', explanation: 'Correct spelling has "a" in the middle' }
  ];

  // Apply corrections
  [...grammarRules, ...spellingRules].forEach((rule, index) => {
    const matches = [...text.matchAll(rule.pattern)];
    matches.forEach((match, matchIndex) => {
      if (match.index !== undefined) {
        corrections.push({
          type: rule.type,
          originalText: match[0],
          correctedText: rule.correction,
          position: match.index,
          explanation: rule.explanation,
          category: rule.category || (rule.type === 'spelling' ? 'Spelling' : 'Grammar'),
          severity: 'medium',
          acceptReject: true,
          grammarTip: `Tip: ${rule.explanation}`
        });
        
        correctedText = correctedText.replace(rule.pattern, rule.correction);
      }
    });
  });

  // Style enhancements
  const styleRules = [
    { pattern: /\bvery good\b/gi, enhancement: 'excellent', reason: 'More precise and academic language' },
    { pattern: /\ba lot of\b/gi, enhancement: 'numerous', reason: 'More formal academic expression' },
    { pattern: /\bget\b/gi, enhancement: 'obtain', reason: 'More formal verb choice' },
    { pattern: /\bbig\b/gi, enhancement: 'significant', reason: 'More academic and precise' },
    { pattern: /\bthing\b/gi, enhancement: 'aspect', reason: 'More specific and academic' }
  ];

  styleRules.forEach((rule) => {
    const matches = [...text.matchAll(rule.pattern)];
    matches.forEach((match) => {
      if (match.index !== undefined) {
        styleEnhancements.push({
          originalPhrase: match[0],
          enhancedPhrase: rule.enhancement,
          reason: rule.reason,
          position: match.index,
          acceptReject: true
        });
      }
    });
  });

  // Fix capitalization and punctuation
  correctedText = correctedText.replace(/^[a-z]/gm, (match) => match.toUpperCase());
  correctedText = correctedText.replace(/([.!?])\s*([a-z])/g, (match, punct, letter) => punct + ' ' + letter.toUpperCase());
  
  // Add missing periods
  const lines = correctedText.split('\n');
  correctedText = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.length > 10 && !/[.!?]$/.test(trimmed)) {
      return line + '.';
    }
    return line;
  }).join('\n');

  return {
    correctedText,
    corrections,
    styleEnhancements,
    overallFeedback: {
      strengths: ["Clear topic focus", "Good essay structure", "Relevant examples"],
      improvements: ["Grammar accuracy", "Vocabulary enhancement", "Sentence variety"],
      writingScore: Math.max(60, 100 - (corrections.length * 5)),
      academicTone: corrections.length < 3 ? "Good" : "Needs improvement",
      clarity: styleEnhancements.length < 2 ? "Good" : "Can be improved"
    },
    statistics: {
      totalCorrections: corrections.length + styleEnhancements.length,
      grammarErrors: corrections.filter(c => c.type === 'grammar').length,
      spellingErrors: corrections.filter(c => c.type === 'spelling').length,
      punctuationErrors: corrections.filter(c => c.type === 'punctuation').length,
      styleImprovements: styleEnhancements.length,
      vocabularyEnhancements: styleEnhancements.length
    }
  };
}
