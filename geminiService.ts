import { GoogleGenAI } from "@google/genai";
import { AiAnalysis, VoteType, Source } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeClaimWithGemini = async (claimText: string): Promise<AiAnalysis> => {
  try {
    const prompt = `
      Agis comme un expert journaliste de vérification des faits (fact-checker).
      Analyse l'affirmation suivante : "${claimText}".
      
      Utilise Google Search pour trouver des informations récentes et fiables.
      
      Ta réponse doit suivre STRICTEMENT ce format (ne pas utiliser de markdown code blocks comme \`\`\`) :
      
      VERDICT: [VRAI | FAUX | MANIPULÉ | INCERTAIN]
      CONFIANCE: [Un nombre entre 0 et 100]
      RÉSUMÉ: [Une analyse détaillée de 2 à 3 paragraphes expliquant pourquoi, citant le contexte et les preuves]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2, // Low temperature for factual responses
      },
    });

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // Parse the text response manually since we can't use JSON schema with search grounding reliably yet
    const verdictMatch = text.match(/VERDICT:\s*(.*)/i);
    const confidenceMatch = text.match(/CONFIANCE:\s*(\d+)/i);
    const summaryMatch = text.match(/RÉSUMÉ:\s*([\s\S]*)/i);

    let verdictStr = verdictMatch ? verdictMatch[1].trim().toUpperCase() : "INCERTAIN";
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1], 10) : 0;
    const summary = summaryMatch ? summaryMatch[1].trim() : text;

    // Map French verdict to Enum
    let verdict = VoteType.UNCERTAIN;
    if (verdictStr.includes("VRAI")) verdict = VoteType.TRUE;
    else if (verdictStr.includes("FAUX")) verdict = VoteType.FALSE;
    else if (verdictStr.includes("MANIPULÉ") || verdictStr.includes("MANIPULE")) verdict = VoteType.MANIPULATED;

    // Extract sources from grounding metadata
    const sources: Source[] = groundingChunks
      .filter((chunk: any) => chunk.web?.uri && chunk.web?.title)
      .map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri,
      }));
      
    // Deduplicate sources
    const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

    return {
      verdict,
      confidence,
      summary,
      sources: uniqueSources,
      analyzedAt: Date.now(),
    };

  } catch (error) {
    console.error("Error analyzing claim:", error);
    throw new Error("L'analyse IA a échoué. Veuillez réessayer.");
  }
};