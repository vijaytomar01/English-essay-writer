import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Comprehensive local grammar checking function
function performLocalGrammarCheck(content: string) {
  const spellingIssues: any[] = [];
  const punctuationIssues: any[] = [];
  const capitalizationIssues: any[] = [];
  const sentenceStructureIssues: any[] = [];
  const subjectVerbAgreementIssues: any[] = [];

  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = content.toLowerCase().split(/\s+/);

  // Common spelling mistakes
  const commonMistakes = [
    { wrong: 'recieve', correct: 'receive' },
    { wrong: 'seperate', correct: 'separate' },
    { wrong: 'definately', correct: 'definitely' },
    { wrong: 'occured', correct: 'occurred' },
    { wrong: 'begining', correct: 'beginning' },
    { wrong: 'writting', correct: 'writing' },
    { wrong: 'grammer', correct: 'grammar' },
    { wrong: 'alot', correct: 'a lot' },
    { wrong: 'thier', correct: 'their' },
    { wrong: 'freind', correct: 'friend' },
    { wrong: 'importent', correct: 'important' },
    { wrong: 'techenology', correct: 'technology' },
    { wrong: 'informations', correct: 'information' }
  ];

  // Check spelling
  commonMistakes.forEach(mistake => {
    const regex = new RegExp(`\\b${mistake.wrong}\\b`, 'gi');
    const matches = [...content.matchAll(regex)];
    matches.forEach(match => {
      if (match.index !== undefined) {
        spellingIssues.push({
          word: match[0],
          correction: mistake.correct,
          position: match.index,
          message: `Spelling error: "${match[0]}" should be "${mistake.correct}"`,
          category: 'spelling'
        });
      }
    });
  });

  // Check punctuation
  sentences.forEach((sentence, index) => {
    const trimmed = sentence.trim();

    // Missing periods
    if (index < sentences.length - 1 && trimmed.length > 0 && !/[.!?]$/.test(trimmed)) {
      punctuationIssues.push({
        text: trimmed,
        correction: trimmed + '.',
        position: content.indexOf(trimmed) + trimmed.length,
        message: 'Missing period at end of sentence',
        category: 'punctuation'
      });
    }

    // Missing commas before conjunctions
    const conjunctionRegex = /\s+(and|but|or|so|yet)\s+/gi;
    const matches = [...trimmed.matchAll(conjunctionRegex)];
    matches.forEach(match => {
      if (match.index !== undefined) {
        const beforeConjunction = trimmed.substring(0, match.index);
        if (beforeConjunction.split(' ').length > 3 && !beforeConjunction.endsWith(',')) {
          punctuationIssues.push({
            text: match[0],
            correction: `, ${match[1]}`,
            position: content.indexOf(trimmed) + match.index,
            message: `Missing comma before "${match[1]}" in compound sentence`,
            category: 'punctuation'
          });
        }
      }
    });
  });

  // Check capitalization
  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    if (trimmed.length > 0 && /^[a-z]/.test(trimmed)) {
      capitalizationIssues.push({
        text: trimmed.charAt(0),
        correction: trimmed.charAt(0).toUpperCase(),
        position: content.indexOf(trimmed),
        message: 'First letter of sentence should be capitalized',
        category: 'capitalization'
      });
    }
  });

  // Check subject-verb agreement
  const agreementPatterns = [
    { pattern: /\b(he|she|it)\s+(are|were)\b/gi, message: 'Singular subject requires singular verb' },
    { pattern: /\b(they|we)\s+(is|was)\b/gi, message: 'Plural subject requires plural verb' },
    { pattern: /\bmany\s+\w+\s+is\b/gi, message: '"Many" requires plural verb "are"' },
    { pattern: /\beach\s+\w+\s+are\b/gi, message: '"Each" requires singular verb "is"' }
  ];

  agreementPatterns.forEach(pattern => {
    const matches = [...content.matchAll(pattern.pattern)];
    matches.forEach(match => {
      if (match.index !== undefined) {
        subjectVerbAgreementIssues.push({
          text: match[0],
          correction: match[0].replace(/\b(is|are|was|were)\b/gi, (verb) => {
            if (verb.toLowerCase() === 'is') return 'are';
            if (verb.toLowerCase() === 'are') return 'is';
            if (verb.toLowerCase() === 'was') return 'were';
            if (verb.toLowerCase() === 'were') return 'was';
            return verb;
          }),
          position: match.index,
          message: pattern.message,
          category: 'subject_verb_agreement'
        });
      }
    });
  });

  const totalIssues = spellingIssues.length + punctuationIssues.length +
                     capitalizationIssues.length + sentenceStructureIssues.length +
                     subjectVerbAgreementIssues.length;

  return {
    spellingIssues,
    punctuationIssues,
    capitalizationIssues,
    sentenceStructureIssues,
    subjectVerbAgreementIssues,
    totalIssues
  };
}

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const prompt = `You are an expert English teacher and academic writing assessor. Evaluate this essay comprehensively based on academic essay standards and provide detailed feedback.

**COMPREHENSIVE ESSAY EVALUATION CRITERIA:**

**1. ESSAY STRUCTURE (25 points):**
- Introduction: Hook, background, clear thesis statement
- Body Paragraphs: Logical organization, topic sentences, supporting evidence
- Conclusion: Summary of main points, reinforced thesis, final insight
- Overall coherence and flow between paragraphs

**2. THESIS STATEMENT & ARGUMENT DEVELOPMENT (20 points):**
- Clear, debatable thesis statement (1-2 sentences at end of introduction)
- Strong evidence and reasoning supporting claims
- Logical paragraph structure with topic sentences
- Effective use of examples, facts, and analysis

**3. LANGUAGE & STYLE (15 points):**
- Clarity and conciseness
- Active voice usage where appropriate
- Formal academic tone (no slang, contractions, abbreviations)
- Avoids repetition and wordiness

**4. GRAMMAR & MECHANICS (25 points):**
- Sentence structure (complete sentences, no fragments/run-ons)
- Subject-verb agreement ("The group IS", "Each student HAS")
- Punctuation (periods, commas, apostrophes)
- Spelling accuracy
- Proper capitalization

**5. ACADEMIC WRITING CONVENTIONS (15 points):**
- Appropriate academic vocabulary
- Consistent formal tone throughout
- Proper paragraph transitions
- Evidence of planning and organization

**SCORING GUIDE:**
- 90-100: Excellent (A) - Meets all criteria exceptionally
- 80-89: Good (B) - Meets most criteria well
- 70-79: Satisfactory (C) - Meets basic criteria
- 60-69: Needs Improvement (D) - Some criteria met
- Below 60: Unsatisfactory (F) - Major issues in multiple areas

Provide your response in this EXACT JSON format:
{
  "overallScore": number (0-100),
  "grade": "A" | "B" | "C" | "D" | "F",
  "totalIssues": number,
  "structureScore": number (0-25),
  "thesisScore": number (0-20),
  "languageScore": number (0-15),
  "grammarScore": number (0-25),
  "academicScore": number (0-15),
  "structureAnalysis": {
    "hasIntroduction": boolean,
    "hasThesis": boolean,
    "hasBodyParagraphs": boolean,
    "hasConclusion": boolean,
    "logicalFlow": boolean,
    "feedback": "specific feedback on structure"
  },
  "spellingIssues": [
    {
      "word": "incorrect word",
      "correction": "correct word",
      "position": number,
      "message": "specific spelling error explanation",
      "category": "spelling"
    }
  ],
  "sentenceStructureIssues": [
    {
      "text": "problematic sentence",
      "correction": "corrected sentence",
      "position": number,
      "message": "explanation (fragment, run-on, comma splice, etc.)",
      "category": "sentence_structure"
    }
  ],
  "subjectVerbAgreementIssues": [
    {
      "text": "incorrect agreement",
      "correction": "correct agreement",
      "position": number,
      "message": "subject-verb agreement rule explanation",
      "category": "subject_verb_agreement"
    }
  ],
  "capitalizationIssues": [
    {
      "text": "incorrect capitalization",
      "correction": "correct capitalization",
      "position": number,
      "message": "explanation of the capitalization rule",
      "category": "capitalization"
    }
  ],
  "punctuationIssues": [
    {
      "text": "text with punctuation error",
      "correction": "text with correct punctuation",
      "position": number,
      "message": "specific punctuation rule explanation",
      "category": "punctuation"
    }
  ],
  "strengths": ["list of positive aspects"],
  "improvements": ["list of suggestions for improvement"],
  "summary": "brief overall assessment"
}

Essay to analyze:
"${content}"

CRITICAL EVALUATION INSTRUCTIONS:

**STRUCTURE ANALYSIS:**
- Identify if essay has clear introduction, body, conclusion
- Check for thesis statement presence and clarity
- Evaluate logical flow and paragraph organization
- Assess topic sentences and paragraph coherence

**CONTENT EVALUATION:**
- Analyze argument development and evidence quality
- Check for academic tone and formal language
- Evaluate clarity and conciseness
- Assess overall academic writing standards

**GRAMMAR & MECHANICS - BE EXTREMELY THOROUGH:**

**PUNCTUATION ERRORS TO FIND:**
- Missing periods at end of sentences
- Missing commas in compound sentences (before and, but, or, so)
- Missing commas after introductory phrases
- Missing apostrophes in contractions (don't, can't, it's)
- Missing apostrophes in possessives (student's, students')
- Incorrect comma usage in lists
- Missing question marks and exclamation points

**SENTENCE FORMATION ERRORS TO FIND:**
- Run-on sentences (two complete thoughts without proper punctuation)
- Comma splices (two sentences joined only by a comma)
- Sentence fragments (incomplete thoughts missing subject or verb)
- Awkward or unclear sentence structure
- Dangling modifiers

**GRAMMATICAL MISTAKES TO FIND:**
- Subject-verb agreement (singular subjects with plural verbs, etc.)
- Incorrect verb tenses and tense inconsistency
- Wrong article usage (a/an/the errors)
- Pronoun errors (he/him, who/whom, etc.)
- Wrong word forms (adjective vs adverb)
- Preposition errors

**SPELLING & CAPITALIZATION TO FIND:**
- All misspelled words
- Missing capitalization at sentence beginnings
- Incorrect capitalization of proper nouns
- Unnecessary capitalization of common nouns

**SCORING INSTRUCTIONS:**
- Deduct points for EVERY error found
- Grammar errors: -2 points each
- Punctuation errors: -1 point each
- Spelling errors: -1 point each
- Sentence structure errors: -3 points each
- Provide specific, actionable feedback for each mistake
- Calculate overall score reflecting academic essay standards
- Give clear explanations for all identified issues

**CRITICAL REQUIREMENTS:**
1. FIND EVERY SINGLE ERROR - no matter how small
2. Check EVERY sentence for proper punctuation
3. Verify EVERY subject-verb agreement
4. Examine EVERY word for spelling accuracy
5. Analyze EVERY sentence for proper formation
6. Be as thorough as a professional editor

BE EXTREMELY COMPREHENSIVE AND THOROUGH - Find ALL mistakes like a strict English teacher.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert English teacher and grammar specialist with 20+ years of experience. You are extremely thorough in finding ALL types of errors - punctuation, grammar, spelling, and sentence formation. Always respond with valid JSON only, no additional text. Be as strict as a university professor grading essays."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.05,  // Lower temperature for more consistent, thorough analysis
      max_tokens: 3000    // More tokens for detailed error analysis
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    try {
      // Extract JSON from the response with better error handling
      let jsonString = responseText.trim();

      // Try to find JSON block
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }

      // Clean up common JSON issues
      jsonString = jsonString
        .replace(/,\s*}/g, '}')  // Remove trailing commas before }
        .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
        .replace(/\n/g, ' ')     // Replace newlines with spaces
        .replace(/\s+/g, ' ')    // Normalize whitespace
        .trim();

      // Try to parse the cleaned JSON
      let analysisResult;
      try {
        analysisResult = JSON.parse(jsonString);
      } catch (firstParseError) {
        // If parsing fails, try to fix truncated JSON
        if (jsonString.endsWith('"')) {
          jsonString += '}';
        } else if (!jsonString.endsWith('}')) {
          jsonString += '"}]}';
        }
        analysisResult = JSON.parse(jsonString);
      }
      
      // Validate the response structure
      if (!analysisResult.overallScore) {
        throw new Error('Invalid response structure');
      }

      // Ensure all issue arrays exist (for backward compatibility)
      if (!analysisResult.spellingIssues) {
        analysisResult.spellingIssues = [];
      }
      if (!analysisResult.capitalizationIssues) {
        analysisResult.capitalizationIssues = [];
      }
      if (!analysisResult.punctuationIssues) {
        analysisResult.punctuationIssues = [];
      }
      if (!analysisResult.sentenceStructureIssues) {
        analysisResult.sentenceStructureIssues = [];
      }
      if (!analysisResult.subjectVerbAgreementIssues) {
        analysisResult.subjectVerbAgreementIssues = [];
      }

      // Ensure structure analysis exists
      if (!analysisResult.structureAnalysis) {
        analysisResult.structureAnalysis = {
          hasIntroduction: false,
          hasThesis: false,
          hasBodyParagraphs: false,
          hasConclusion: false,
          logicalFlow: false,
          feedback: 'Structure analysis not available'
        };
      }

      // Ensure individual scores exist
      if (!analysisResult.structureScore) analysisResult.structureScore = 0;
      if (!analysisResult.thesisScore) analysisResult.thesisScore = 0;
      if (!analysisResult.languageScore) analysisResult.languageScore = 0;
      if (!analysisResult.grammarScore) analysisResult.grammarScore = 0;
      if (!analysisResult.academicScore) analysisResult.academicScore = 0;

      return NextResponse.json({
        success: true,
        analysis: analysisResult,
        provider: 'openai'
      });

    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Raw response:', responseText);

      // Use local grammar checking as fallback
      const localAnalysis = performLocalGrammarCheck(content);
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const words = content.split(/\s+/).filter(w => w.trim().length > 0);

      // Calculate scores based on local analysis
      const grammarScore = Math.max(5, 25 - (localAnalysis.totalIssues * 2));
      const overallScore = Math.max(40, 85 - (localAnalysis.totalIssues * 3));
      const grade = overallScore >= 90 ? 'A' : overallScore >= 80 ? 'B' :
                   overallScore >= 70 ? 'C' : overallScore >= 60 ? 'D' : 'F';

      return NextResponse.json({
        success: true,
        analysis: {
          overallScore,
          grade,
          totalIssues: localAnalysis.totalIssues,
          structureScore: sentences.length >= 3 ? 18 : 12,
          thesisScore: content.length > 200 ? 15 : 8,
          languageScore: 12,
          grammarScore,
          academicScore: 10,
          structureAnalysis: {
            hasIntroduction: sentences.length > 0,
            hasThesis: content.length > 100,
            hasBodyParagraphs: sentences.length >= 3,
            hasConclusion: sentences.length > 1,
            logicalFlow: sentences.length >= 2,
            feedback: `Essay has ${sentences.length} sentences and ${words.length} words. ${localAnalysis.totalIssues > 0 ? `Found ${localAnalysis.totalIssues} grammar/spelling issues.` : 'No major issues detected.'}`
          },
          spellingIssues: localAnalysis.spellingIssues,
          capitalizationIssues: localAnalysis.capitalizationIssues,
          punctuationIssues: localAnalysis.punctuationIssues,
          sentenceStructureIssues: localAnalysis.sentenceStructureIssues,
          subjectVerbAgreementIssues: localAnalysis.subjectVerbAgreementIssues,
          strengths: localAnalysis.totalIssues < 3 ? ['Good grammar overall', 'Clear writing'] : ['Essay completed'],
          improvements: localAnalysis.totalIssues > 0 ?
            [`Fix ${localAnalysis.totalIssues} grammar/spelling errors`, 'Review punctuation usage', 'Check sentence structure'] :
            ['Consider adding more detail', 'Strengthen thesis statement'],
          summary: `Local analysis found ${localAnalysis.totalIssues} issues. ${localAnalysis.totalIssues === 0 ? 'Good work!' : 'Please review the identified errors.'}`
        },
        provider: 'local-fallback'
      });
    }

  } catch (error) {
    console.error('OpenAI API error:', error);

    // Use local grammar checking when API completely fails
    try {
      const localAnalysis = performLocalGrammarCheck(content);
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const words = content.split(/\s+/).filter(w => w.trim().length > 0);

      const grammarScore = Math.max(5, 25 - (localAnalysis.totalIssues * 2));
      const overallScore = Math.max(40, 85 - (localAnalysis.totalIssues * 3));
      const grade = overallScore >= 90 ? 'A' : overallScore >= 80 ? 'B' :
                   overallScore >= 70 ? 'C' : overallScore >= 60 ? 'D' : 'F';

      return NextResponse.json({
        success: true,
        analysis: {
          overallScore,
          grade,
          totalIssues: localAnalysis.totalIssues,
          structureScore: sentences.length >= 3 ? 18 : 12,
          thesisScore: content.length > 200 ? 15 : 8,
          languageScore: 12,
          grammarScore,
          academicScore: 10,
          structureAnalysis: {
            hasIntroduction: sentences.length > 0,
            hasThesis: content.length > 100,
            hasBodyParagraphs: sentences.length >= 3,
            hasConclusion: sentences.length > 1,
            logicalFlow: sentences.length >= 2,
            feedback: `Local analysis: ${sentences.length} sentences, ${words.length} words. ${localAnalysis.totalIssues} issues found.`
          },
          spellingIssues: localAnalysis.spellingIssues,
          capitalizationIssues: localAnalysis.capitalizationIssues,
          punctuationIssues: localAnalysis.punctuationIssues,
          sentenceStructureIssues: localAnalysis.sentenceStructureIssues,
          subjectVerbAgreementIssues: localAnalysis.subjectVerbAgreementIssues,
          strengths: ['Essay analysis completed using local checking'],
          improvements: localAnalysis.totalIssues > 0 ?
            [`Review ${localAnalysis.totalIssues} identified errors`] : ['Consider expanding content'],
          summary: `Local grammar check completed. ${localAnalysis.totalIssues} issues detected.`
        },
        provider: 'local-emergency'
      });
    } catch (localError) {
      return NextResponse.json({
        success: false,
        error: 'All analysis methods failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }
}
