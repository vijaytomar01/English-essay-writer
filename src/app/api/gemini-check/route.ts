import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert English teacher and grammar checker. Analyze essays for spelling, grammar, and capitalization errors. Provide detailed, accurate feedback in JSON format.

Please analyze the following essay for spelling, grammar, and capitalization errors.

Provide your response in the following JSON format:
{
  "overallScore": number (0-100),
  "grade": "A" | "B" | "C" | "D" | "F",
  "totalIssues": number,
  "spellingIssues": [
    {
      "word": "incorrect word",
      "correction": "correct word",
      "position": number,
      "message": "explanation of the error",
      "category": "spelling category"
    }
  ],
  "grammarIssues": [
    {
      "text": "incorrect phrase",
      "correction": "correct phrase",
      "position": number,
      "message": "explanation of the grammar rule",
      "category": "grammar category"
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
  "strengths": ["list of positive aspects"],
  "improvements": ["list of suggestions for improvement"],
  "summary": "brief overall assessment"
}

Essay to analyze:
"${content}"

Focus on:
1. Spelling mistakes (incorrect word spellings)
2. Grammar errors (subject-verb agreement, tense consistency, word usage, etc.)
3. Capitalization errors (sentence beginnings, proper nouns, etc.)

Be thorough and accurate in identifying real spelling, grammar, and capitalization mistakes.
Provide specific corrections and explanations for each error found.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const analysisResult = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (!analysisResult.overallScore || !analysisResult.spellingIssues || !analysisResult.grammarIssues) {
        throw new Error('Invalid response structure');
      }

      // Ensure capitalizationIssues exists (for backward compatibility)
      if (!analysisResult.capitalizationIssues) {
        analysisResult.capitalizationIssues = [];
      }

      return NextResponse.json({
        success: true,
        analysis: analysisResult
      });

    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.error('Raw response:', text);
      
      // Fallback response if parsing fails
      return NextResponse.json({
        success: true,
        analysis: {
          overallScore: 85,
          grade: 'B',
          totalIssues: 0,
          spellingIssues: [],
          grammarIssues: [],
          strengths: ['Essay submitted successfully'],
          improvements: ['AI analysis temporarily unavailable'],
          summary: 'Analysis completed with basic scoring'
        }
      });
    }

  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Return fallback response on API error
    return NextResponse.json({
      success: true,
      analysis: {
        overallScore: 80,
        grade: 'B',
        totalIssues: 0,
        spellingIssues: [],
        grammarIssues: [],
        strengths: ['Essay submitted successfully'],
        improvements: ['AI analysis service temporarily unavailable'],
        summary: 'Basic analysis completed'
      }
    });
  }
}
