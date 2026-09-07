import { DataAPIClient } from '@datastax/astra-db-ts';
import fs from 'fs';
import path from 'path';
import { DocumentChunk } from './prompts';
import { generateEmbedding } from './embeddings';

const COLLECTION_NAME = process.env.ASTRA_DB_COLLECTION || 'ip_sakti_documents';

export async function searchVectorStore(
  query: string,
  topK: number = 5
): Promise<DocumentChunk[]> {
  const endpoint = process.env.ASTRA_DB_API_ENDPOINT;
  const token = process.env.ASTRA_DB_APPLICATION_TOKEN;
  const namespace = process.env.ASTRA_DB_NAMESPACE;

  // If Astra DB credentials exist, attempt cloud vector search
  if (endpoint && token) {
    try {
      const client = new DataAPIClient(token);
      const db = client.db(endpoint, { namespace });
      const collection = db.collection(COLLECTION_NAME);

      const queryVector = await generateEmbedding(query);

      const cursor = collection.find(
        {},
        {
          sort: { $vector: queryVector },
          limit: topK,
          includeSimilarity: true,
        }
      );

      const results = await cursor.toArray();

      if (results && results.length > 0) {
        return results.map((doc: any) => ({
          text: doc.text || '',
          title: doc.title || 'Official Document',
          authority: doc.authority || 'Government Authority',
          jurisdiction: doc.jurisdiction || 'India',
          domain: doc.domain || 'Intellectual Property',
          document_type: doc.document_type || 'Legal Document',
          section: doc.section || 'General',
          source_url: doc.source_url || '',
          score: doc.$similarity || 0,
        }));
      }
    } catch (err) {
      console.warn('Astra DB vector search fallback engaged:', err);
    }
  }

  // Fallback local vector/keyword search over data/ files
  return searchLocalKnowledgeBase(query, topK);
}

export async function searchLocalKnowledgeBase(
  query: string,
  topK: number = 5
): Promise<DocumentChunk[]> {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) return [];

  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.txt'));
  const chunks: DocumentChunk[] = [];
  const queryLower = query.toLowerCase();

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Parse metadata headers
    const titleMatch = content.match(/(?:TITLE|Title|Source \/ Authority):\s*(.+)/i);
    const authorityMatch = content.match(/(?:AUTHORITY|Authority):\s*(.+)/i);
    const jurisdictionMatch = content.match(/(?:JURISDICTION|Jurisdiction):\s*(.+)/i);
    const domainMatch = content.match(/(?:DOMAIN|Domain):\s*(.+)/i);
    const docTypeMatch = content.match(/(?:DOCUMENT TYPE|Document Type):\s*(.+)/i);
    const sectionMatch = content.match(/(?:SECTION|Section):\s*(.+)/i);
    const urlMatch = content.match(/(?:SOURCE URL|source_url|source url)\s*=\s*(.+)/i) || content.match(/(?:SOURCE URL|source_url|source url):\s*(.+)/i);

    const title = titleMatch ? titleMatch[1].trim() : file.replace(/\.txt$/, '').replace(/_/g, ' ');
    const authority = authorityMatch ? authorityMatch[1].trim() : 'Government Authority';
    const jurisdiction = jurisdictionMatch ? jurisdictionMatch[1].trim() : 'India';
    const domain = domainMatch ? domainMatch[1].trim() : 'Intellectual Property';
    const document_type = docTypeMatch ? docTypeMatch[1].trim() : 'Regulatory Text';
    const section = sectionMatch ? sectionMatch[1].trim() : 'General';
    const source_url = urlMatch ? urlMatch[1].trim() : '';

    const contentBody = content.split('CONTENT:')[1] || content;
    const paragraphs = contentBody
      .split('\n\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 30);

    for (const paragraph of paragraphs) {
      // Calculate keyword relevance score
      const pLower = paragraph.toLowerCase();
      let matchCount = 0;
      const terms = queryLower.split(/\s+/).filter((t) => t.length > 3);
      for (const term of terms) {
        if (pLower.includes(term)) matchCount++;
      }

      if (matchCount > 0 || queryLower.length < 5) {
        chunks.push({
          text: paragraph,
          title,
          authority,
          jurisdiction,
          domain,
          document_type,
          section,
          source_url,
          score: matchCount / (terms.length || 1),
        });
      }
    }
  }

  // Sort by relevance score descending
  chunks.sort((a, b) => (b.score || 0) - (a.score || 0));
  return chunks.slice(0, topK);
}
