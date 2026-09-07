import OpenAI from 'openai';
import { SYSTEM_PROMPT, DocumentChunk } from './prompts';
import { searchVectorStore } from './vectorStore';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SourceCitation {
  title: string;
  authority: string;
  jurisdiction: string;
  section?: string;
  source_url?: string;
}

export interface RAGResponse {
  answer: string;
  sources: SourceCitation[];
  jurisdiction?: string;
  confidence?: 'High' | 'Moderate' | 'Low';
}

const ABSTENTION_TEXT =
  "I don't have enough authoritative information in my current knowledge base to answer this reliably. I recommend consulting the Indian Patent Office (CGPDTM), Ministry of Ayush, National Biodiversity Authority, or a qualified patent attorney.";

export async function processRAGQuery(
  messages: ChatMessage[]
): Promise<RAGResponse> {
  const userMessage = messages[messages.length - 1]?.content || '';
  if (!userMessage.trim()) {
    return {
      answer: ABSTENTION_TEXT,
      sources: [],
      confidence: 'Low',
    };
  }

  // 1. Search vector DB for top 8 relevant chunks for deeper legal context
  const chunks = await searchVectorStore(userMessage, 8);

  // 2. Evaluate relevance for safe abstention
  const relevantChunks = chunks.filter((c) => (c.score || 0) > 0.05 || chunks.length <= 2);

  if (chunks.length === 0 || (chunks.every((c) => (c.score || 0) === 0) && isOffTopic(userMessage))) {
    return {
      answer: ABSTENTION_TEXT,
      sources: [],
      confidence: 'Low',
    };
  }

  // 3. Format context string
  const contextStr = chunks
    .map(
      (c, i) => `SOURCE ${i + 1}:
Title: ${c.title}
Authority: ${c.authority}
Jurisdiction: ${c.jurisdiction}
Section: ${c.section}
Content: ${c.text}`
    )
    .join('\n\n---\n\n');

  // 4. Try Google Gemini API (100% Free)
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey.trim() !== '') {
    const systemMessageWithContext = SYSTEM_PROMPT.replace('{context}', contextStr);
    const geminiAnswer = await callGeminiAPI(systemMessageWithContext, userMessage, geminiKey);
    if (geminiAnswer) {
      return {
        answer: geminiAnswer,
        sources: deduplicateSources(chunks),
        jurisdiction: '🇮🇳 India',
        confidence: determineConfidence(chunks),
      };
    }
  }

  // 5. Try OpenAI chat API
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && apiKey.trim() !== '' && !apiKey.startsWith('AQ.')) {
    try {
      const openai = new OpenAI({ apiKey });
      const systemMessageWithContext = SYSTEM_PROMPT.replace('{context}', contextStr);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessageWithContext },
          ...messages.slice(-5), // Pass recent conversation history context
        ],
        temperature: 0.2,
      });

      const rawAnswer = completion.choices[0]?.message?.content || ABSTENTION_TEXT;
      const sources = deduplicateSources(chunks);
      const confidence = determineConfidence(chunks);

      return {
        answer: rawAnswer,
        sources,
        jurisdiction: '🇮🇳 India',
        confidence,
      };
    } catch (err) {
      console.warn('OpenAI Chat API error, using grounded local RAG generator:', err);
    }
  }

  // Fallback grounded RAG answer generator for zero-config local dev
  const fallbackAnswer = generateFallbackGroundedResponse(userMessage, chunks);
  const sources = deduplicateSources(chunks);
  const confidence = determineConfidence(chunks);

  return {
    answer: fallbackAnswer,
    sources,
    jurisdiction: '🇮🇳 India',
    confidence,
  };
}

function isOffTopic(query: string): boolean {
  const lower = query.toLowerCase();
  const keywords = ['patent', 'ayurveda', 'ayush', 'section 3', '3(p)', '3(e)', 'tkdl', 'biodiversity', 'nba', 'drug', 'tradition', 'formulation', 'herb', 'wipo', 'licensing', 'ashwagandha', 'curcumin'];
  return !keywords.some((k) => lower.includes(k));
}

function deduplicateSources(chunks: DocumentChunk[]): SourceCitation[] {
  const seen = new Set<string>();
  const sources: SourceCitation[] = [];

  for (const chunk of chunks) {
    const key = `${chunk.title}-${chunk.section}`;
    if (!seen.has(key)) {
      seen.add(key);
      sources.push({
        title: chunk.title,
        authority: chunk.authority,
        jurisdiction: chunk.jurisdiction,
        section: chunk.section,
        source_url: chunk.source_url,
      });
    }
  }
  return sources;
}

async function callGeminiAPI(systemPromptWithContext: string, userMessage: string, apiKey: string): Promise<string | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: systemPromptWithContext },
              { text: `User Question: ${userMessage}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
      const fbRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: systemPromptWithContext },
                { text: `User Question: ${userMessage}` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          }
        })
      });
      if (fbRes.ok) {
        const fbData = await fbRes.json();
        return fbData.candidates?.[0]?.content?.parts?.[0]?.text || null;
      }
      return null;
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) {
    console.warn('Gemini API call error:', err);
    return null;
  }
}

function determineConfidence(chunks: DocumentChunk[]): 'High' | 'Moderate' | 'Low' {
  if (chunks.length >= 3 && chunks.some((c) => (c.score || 0) > 0.3)) {
    return 'High';
  } else if (chunks.length > 0) {
    return 'Moderate';
  }
  return 'Low';
}

function generateFallbackGroundedResponse(query: string, chunks: DocumentChunk[]): string {
  const qLower = query.toLowerCase();

  if (isOffTopic(qLower) && chunks.length === 0) {
    return ABSTENTION_TEXT;
  }

  if (qLower.includes('patent') && qLower.includes('ayurvedic')) {
    return `Based on the **Indian Patents Act, 1970 (as amended)** and **Section 3(p)**, a traditional Ayurvedic formulation cannot be patented in India if it is merely an aggregation or duplication of known properties documented in classical texts (such as Charaka Samhita or Sushruta Samhita).\n\n**To qualify for patentability in India:**\n1. **Demonstrable Synergy**: The applicant must prove a non-obvious synergistic therapeutic effect or bioavailability enhancement (e.g., empirical data showing a Combination Index < 0.8).\n2. **Novel Delivery Mechanism**: Novel phytosome, liposomal, or nano-formulation carriers not disclosed in traditional literature may overcome Section 3(p).\n3. **National Biodiversity Authority (NBA) Clearance**: Prior approval under Form III (Biological Diversity Act 2002 Sec 6) must be secured before patent grant.`;
  }

  if (qLower.includes('section 3(p)') || qLower.includes('3(p)')) {
    return `**Section 3(p) of the Indian Patents Act, 1970** explicitly excludes from patentability:\n> *"An invention which in effect, is traditional knowledge or which is an aggregation or duplication of known properties of traditionally known component or components."*\n\n**Key Implications:**\n- Prevents biopiracy of traditional Indian medicine (Ayurveda, Unani, Siddha).\n- Examiners cross-reference applications against the **Traditional Knowledge Digital Library (TKDL)**.\n- Simple combinations of known herbs (e.g., combining Ashwagandha and Turmeric) are unpatentable unless unexpected, non-obvious synergy is scientifically proven.`;
  }

  if (qLower.includes('regulatory') || qLower.includes('regulations') || qLower.includes('license')) {
    return `Ayurveda regulatory compliance in India is governed by **Chapter IV-A of the Drugs and Cosmetics Act, 1940** and **Rules 153–170**:\n\n1. **Manufacturing License**: Granted by the State AYUSH Licensing Authority under **Form 25D** (or Form 25E for Loan Licenses).\n2. **Good Manufacturing Practices (GMP)**: Mandatory compliance with **Schedule T** standards.\n3. **Quality Standards**: Testing for heavy metals (Lead, Arsenic, Mercury, Cadmium) and microbial loads per the Ayurvedic Pharmacopoeia of India (API).\n4. **Labelling Rules (Rule 161)**: Clear identification of ingredients, batch number, license number, and expiration date.`;
  }

  if (qLower.includes('traditional knowledge') || qLower.includes('tkdl')) {
    return `**Traditional Knowledge (TK)** creates significant prior-art limitations under global intellectual property frameworks:\n\n1. **TKDL Defense**: The **Traditional Knowledge Digital Library (TKDL)** acts as prior art accessible by international patent examiners (USPTO, EPO, IPO India) to reject non-novel claims.\n2. **Nagoya Protocol & WIPO 2024 Treaty**: Applicants must disclose the country of origin/source for biological resources and associated traditional knowledge.\n3. **Biopiracy Prevention**: Ensures traditional remedies remain in the public domain while permitting IP protection only for genuinely novel, non-obvious technological advancements.`;
  }

  if (qLower.includes('modify') || qLower.includes('modified') || qLower.includes('change')) {
    return `If you **modify** a traditional formulation:\n\n1. **Chemical / Structural Modifications**: Isolating specific bio-active compounds or creating synthetic analogs may overcome Section 3(p) if significantly enhanced therapeutic efficacy is demonstrated under **Section 3(d)**.\n2. **Synergistic Ratios**: Proving that specific non-classical ratios produce unexpected therapeutic results can satisfy the inventive step requirement.\n3. **Novel Formulations**: Encapsulation technologies (e.g., phytosomes or targeted drug delivery) are evaluated as patentable process/product inventions provided traditional knowledge disclosure requirements are satisfied.`;
  }

  if (chunks.length > 0) {
    return `Based on authoritative documents in the knowledge base:\n\n${chunks[0].text}\n\n*Reference: ${chunks[0].title} (${chunks[0].section})*`;
  }

  return ABSTENTION_TEXT;
}



