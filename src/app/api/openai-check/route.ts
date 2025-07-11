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

  // Enhanced punctuation checking
  sentences.forEach((sentence, index) => {
    const trimmed = sentence.trim();

    // 1. Missing periods at sentence ends
    if (index < sentences.length - 1 && trimmed.length > 0 && !/[.!?]$/.test(trimmed)) {
      punctuationIssues.push({
        text: trimmed,
        correction: trimmed + '.',
        position: content.indexOf(trimmed) + trimmed.length,
        message: 'Missing period at end of sentence',
        category: 'punctuation'
      });
    }

    // 2. Missing commas before conjunctions in compound sentences
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

    // 3. Question marks for questions
    if (trimmed.toLowerCase().startsWith('what') || trimmed.toLowerCase().startsWith('how') ||
        trimmed.toLowerCase().startsWith('why') || trimmed.toLowerCase().startsWith('when') ||
        trimmed.toLowerCase().startsWith('where') || trimmed.toLowerCase().startsWith('who') ||
        trimmed.toLowerCase().startsWith('which') || trimmed.toLowerCase().startsWith('do you') ||
        trimmed.toLowerCase().startsWith('can you') || trimmed.toLowerCase().startsWith('will you')) {
      if (!trimmed.endsWith('?')) {
        punctuationIssues.push({
          text: trimmed,
          correction: trimmed.replace(/[.!]?$/, '?'),
          position: content.indexOf(trimmed),
          message: 'Question should end with question mark (?)',
          category: 'punctuation'
        });
      }
    }

    // 4. Comma after introductory phrases
    const introPatterns = [
      /^(however|therefore|furthermore|moreover|nevertheless|consequently|meanwhile|finally|first|second|third|lastly),?\s+/i,
      /^(in conclusion|in summary|for example|for instance|on the other hand|in addition|as a result),?\s+/i,
      /^(after|before|when|while|since|because|although|though|if|unless)\s+\w+.*?,?\s+/i
    ];

    introPatterns.forEach(pattern => {
      const match = trimmed.match(pattern);
      if (match && !match[0].includes(',')) {
        const introPhrase = match[0].trim();
        punctuationIssues.push({
          text: introPhrase,
          correction: introPhrase + ',',
          position: content.indexOf(trimmed),
          message: 'Missing comma after introductory phrase',
          category: 'punctuation'
        });
      }
    });

    // 5. Semicolon usage - check for run-on sentences that should use semicolons
    if (trimmed.includes(' and ') || trimmed.includes(' but ') || trimmed.includes(' or ')) {
      const parts = trimmed.split(/\s+(and|but|or)\s+/);
      if (parts.length >= 3) {
        const firstPart = parts[0];
        const secondPart = parts[2];
        if (firstPart.split(' ').length > 5 && secondPart.split(' ').length > 5) {
          punctuationIssues.push({
            text: trimmed,
            correction: trimmed.replace(/\s+(and|but|or)\s+/, '; '),
            position: content.indexOf(trimmed),
            message: 'Consider using semicolon (;) to separate two independent clauses',
            category: 'punctuation'
          });
        }
      }
    }

    // 6. Colon usage - check for lists or explanations
    if (trimmed.includes(' such as ') || trimmed.includes(' including ') ||
        trimmed.includes(' for example ') || trimmed.includes(' namely ')) {
      if (!trimmed.includes(':')) {
        punctuationIssues.push({
          text: trimmed,
          correction: trimmed.replace(/(such as|including|for example|namely)/, ':'),
          position: content.indexOf(trimmed),
          message: 'Consider using colon (:) before list or explanation',
          category: 'punctuation'
        });
      }
    }
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

  // Enhanced verb position and agreement checking
  const verbPositionIssues: any[] = [];

  // 1. Subject-verb agreement patterns
  const agreementPatterns = [
    { pattern: /\b(he|she|it)\s+(are|were)\b/gi, message: 'Singular subject requires singular verb' },
    { pattern: /\b(they|we|you)\s+(is|was)\b/gi, message: 'Plural subject requires plural verb' },
    { pattern: /\bmany\s+\w+\s+is\b/gi, message: '"Many" requires plural verb "are"' },
    { pattern: /\beach\s+\w+\s+are\b/gi, message: '"Each" requires singular verb "is"' },
    { pattern: /\bevery\s+\w+\s+are\b/gi, message: '"Every" requires singular verb "is"' },
    { pattern: /\bpeople\s+is\b/gi, message: '"People" is plural and requires "are"' },
    { pattern: /\bchildren\s+is\b/gi, message: '"Children" is plural and requires "are"' }
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

  // 2. Verb position in questions (auxiliary verb placement)
  const questionVerbPatterns = [
    {
      pattern: /\b(what|how|why|when|where|who|which)\s+(\w+)\s+(do|does|did|can|will|would|should|could)\b/gi,
      message: 'In questions, auxiliary verb should come before the subject',
      fix: (match: string) => {
        const parts = match.split(/\s+/);
        return `${parts[0]} ${parts[2]} ${parts[1]}`;
      }
    }
  ];

  questionVerbPatterns.forEach(pattern => {
    const matches = [...content.matchAll(pattern.pattern)];
    matches.forEach(match => {
      if (match.index !== undefined) {
        verbPositionIssues.push({
          text: match[0],
          correction: pattern.fix(match[0]),
          position: match.index,
          message: pattern.message,
          category: 'verb_position'
        });
      }
    });
  });

  // 3. Modal verb position errors
  const modalPatterns = [
    {
      pattern: /\b(\w+)\s+(can|could|will|would|should|must|may|might)\s+(not)?\s*(\w+)/gi,
      message: 'Modal verbs should come before the main verb',
      check: (match: RegExpMatchArray) => {
        const words = match[0].split(/\s+/);
        const modals = ['can', 'could', 'will', 'would', 'should', 'must', 'may', 'might'];
        const modalIndex = words.findIndex(word => modals.includes(word.toLowerCase()));
        return modalIndex > 1; // Modal should be early in the phrase
      }
    }
  ];

  modalPatterns.forEach(pattern => {
    const matches = [...content.matchAll(pattern.pattern)];
    matches.forEach(match => {
      if (match.index !== undefined && pattern.check(match)) {
        verbPositionIssues.push({
          text: match[0],
          correction: match[0], // Would need more complex logic for correction
          position: match.index,
          message: pattern.message,
          category: 'verb_position'
        });
      }
    });
  });

  // 4. Verb tense consistency within sentences
  sentences.forEach(sentence => {
    const trimmed = sentence.trim();

    // Check for mixed tenses in same sentence
    const pastTenseVerbs = trimmed.match(/\b(was|were|had|did|went|came|saw|took|made|got)\b/gi) || [];
    const presentTenseVerbs = trimmed.match(/\b(is|are|have|has|do|does|go|come|see|take|make|get)\b/gi) || [];
    const futureMarkers = trimmed.match(/\b(will|shall|going to)\b/gi) || [];

    if (pastTenseVerbs.length > 0 && presentTenseVerbs.length > 0) {
      verbPositionIssues.push({
        text: trimmed,
        correction: trimmed, // Complex correction needed
        position: content.indexOf(trimmed),
        message: 'Mixed verb tenses in same sentence - maintain consistency',
        category: 'verb_tense_consistency'
      });
    }
  });

  // 5. Infinitive errors (to + verb)
  const infinitivePatterns = [
    {
      pattern: /\bto\s+(going|coming|running|walking|talking|working|playing|studying)\b/gi,
      message: 'After "to", use base form of verb, not -ing form',
      correction: (match: string) => match.replace(/ing\b/, '')
    },
    {
      pattern: /\b(want|need|like|love|hate|prefer)\s+(\w+ing)\b/gi,
      message: 'After verbs like "want", "need", use "to + infinitive"',
      correction: (match: string) => match.replace(/(\w+)ing/, 'to $1')
    }
  ];

  infinitivePatterns.forEach(pattern => {
    const matches = [...content.matchAll(pattern.pattern)];
    matches.forEach(match => {
      if (match.index !== undefined) {
        verbPositionIssues.push({
          text: match[0],
          correction: pattern.correction(match[0]),
          position: match.index,
          message: pattern.message,
          category: 'infinitive_error'
        });
      }
    });
  });

  // Add verb position issues to sentence structure issues
  sentenceStructureIssues.push(...verbPositionIssues);

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

**PUNCTUATION ERRORS TO FIND - CHECK EVERY SYMBOL:**
- Missing periods (.) at end of sentences
- Missing commas (,) in compound sentences (before and, but, or, so)
- Missing commas (,) after introductory phrases (However, Therefore, In conclusion,)
- Missing apostrophes (') in contractions (don't, can't, it's, won't)
- Missing apostrophes (') in possessives (student's, students', children's)
- Incorrect comma (,) usage in lists and series
- Missing question marks (?) for questions (What, How, Why, When, Where, Who)
- Wrong semicolon (;) usage - should separate independent clauses
- Missing colons (:) before lists or explanations
- Incorrect exclamation points (!) placement

**SENTENCE FORMATION ERRORS TO FIND:**
- Run-on sentences (two complete thoughts without proper punctuation)
- Comma splices (two sentences joined only by a comma)
- Sentence fragments (incomplete thoughts missing subject or verb)
- Awkward or unclear sentence structure
- Dangling modifiers

**GRAMMATICAL MISTAKES TO FIND:**
- Subject-verb agreement (he are → he is, they is → they are)
- Incorrect verb tenses and tense inconsistency within sentences
- Wrong article usage (a/an/the errors)
- Pronoun errors (he/him, who/whom, etc.)
- Wrong word forms (adjective vs adverb)
- Preposition errors

**VERB POSITION ERRORS TO FIND - CRITICAL:**
- Wrong auxiliary verb placement in questions (What you do? → What do you do?)
- Modal verb position errors (I tomorrow will go → I will go tomorrow)
- Infinitive errors (I want going → I want to go)
- Verb placement in negative sentences (I not like → I do not like)
- Past participle position (I have yesterday gone → I went yesterday)
- Continuous tense errors (I am go → I am going)
- Perfect tense formation (I have went → I have gone)

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
      if (analysisResult.overallScore === undefined || analysisResult.overallScore === null) {
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
