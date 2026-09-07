import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { DataAPIClient } from '@datastax/astra-db-ts';
import { generateEmbedding } from '../lib/embeddings';

dotenv.config({ path: '.env.local' });

const COLLECTION_NAME = process.env.ASTRA_DB_COLLECTION || 'ip_sakti_documents';

interface ChunkMetadata {
  document_id: string;
  title: string;
  authority: string;
  jurisdiction: string;
  domain: string;
  document_type: string;
  section: string;
  source_url: string;
  chunk_index: number;
  text: string;
  $vector?: number[];
}

function recursiveChunkText(text: string, chunkSize: number = 800, overlap: number = 120): string[] {
  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;
    if (endIndex < text.length) {
      // Break at nearest newline or sentence boundary
      const lastNewline = text.lastIndexOf('\n', endIndex);
      if (lastNewline > startIndex + chunkSize / 2) {
        endIndex = lastNewline;
      }
    } else {
      endIndex = text.length;
    }

    const chunkStr = text.slice(startIndex, endIndex).trim();
    if (chunkStr.length > 20) {
      chunks.push(chunkStr);
    }

    startIndex = endIndex - overlap;
    if (startIndex >= text.length || endIndex === text.length) break;
  }

  return chunks;
}

async function runIngestion() {
  console.log('🚀 Starting IP-SAKTI Sahayak Document Ingestion...');

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    console.error('❌ Data directory not found at:', dataDir);
    process.exit(1);
  }

  const endpoint = process.env.ASTRA_DB_API_ENDPOINT;
  const token = process.env.ASTRA_DB_APPLICATION_TOKEN;
  const namespace = process.env.ASTRA_DB_NAMESPACE;

  let collection: any = null;

  if (endpoint && token) {
    try {
      console.log('📡 Connecting to Astra DB Vector Database...');
      const client = new DataAPIClient(token);
      const db = client.db(endpoint, { namespace });

      // Create collection if it doesn't exist
      try {
        collection = await db.createCollection(COLLECTION_NAME, {
          vector: {
            dimension: 1536,
            metric: 'cosine',
          },
        });
        console.log(`✅ Created collection: ${COLLECTION_NAME}`);
      } catch (e) {
        // Collection might already exist
        collection = db.collection(COLLECTION_NAME);
        console.log(`ℹ️ Using existing collection: ${COLLECTION_NAME}`);
      }
    } catch (err) {
      console.warn('⚠️ Could not initialize Astra DB connection:', err);
    }
  } else {
    console.log('ℹ️ Astra DB credentials not provided in .env.local. Ingestion script will prepare local chunks.');
  }

  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.txt'));
  let totalChunksIngested = 0;

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    const rawContent = fs.readFileSync(filePath, 'utf-8');

    const titleMatch = rawContent.match(/(?:TITLE|Title|Source \/ Authority):\s*(.+)/i);
    const authorityMatch = rawContent.match(/(?:AUTHORITY|Authority):\s*(.+)/i);
    const jurisdictionMatch = rawContent.match(/(?:JURISDICTION|Jurisdiction):\s*(.+)/i);
    const domainMatch = rawContent.match(/(?:DOMAIN|Domain):\s*(.+)/i);
    const docTypeMatch = rawContent.match(/(?:DOCUMENT TYPE|Document Type):\s*(.+)/i);
    const sectionMatch = rawContent.match(/(?:SECTION|Section):\s*(.+)/i);
    const urlMatch = rawContent.match(/(?:SOURCE URL|source_url|source url)\s*=\s*(.+)/i) || rawContent.match(/(?:SOURCE URL|source_url|source url):\s*(.+)/i);

    const title = titleMatch ? titleMatch[1].trim() : file.replace(/\.txt$/, '').replace(/_/g, ' ');
    const authority = authorityMatch ? authorityMatch[1].trim() : 'Government Authority';
    const jurisdiction = jurisdictionMatch ? jurisdictionMatch[1].trim() : 'India';
    const domain = domainMatch ? domainMatch[1].trim() : 'Intellectual Property';
    const document_type = docTypeMatch ? docTypeMatch[1].trim() : 'Legal Statute';
    const section = sectionMatch ? sectionMatch[1].trim() : 'General';
    const source_url = urlMatch ? urlMatch[1].trim() : '';

    const bodyText = rawContent.split('CONTENT:')[1] || rawContent;
    const textChunks = recursiveChunkText(bodyText, 800, 120);

    console.log(`📄 Processing document [${file}]: ${textChunks.length} chunks generated.`);

    for (let i = 0; i < textChunks.length; i++) {
      const chunkText = `[DOCUMENT: ${title} | SECTION: ${section}]\n\n${textChunks[i]}`;
      const embedding = await generateEmbedding(chunkText);

      const record: ChunkMetadata = {
        document_id: file.replace('.txt', ''),
        title,
        authority,
        jurisdiction,
        domain,
        document_type,
        section,
        source_url,
        chunk_index: i,
        text: chunkText,
        $vector: embedding,
      };

      if (collection) {
        try {
          await collection.insertOne(record);
        } catch (e) {
          console.warn(`Failed inserting chunk ${i} of ${file} into Astra DB:`, e);
        }
      }
      totalChunksIngested++;
    }
  }

  console.log(`\n🎉 Ingestion Complete! Total Chunks Processed: ${totalChunksIngested}`);
}

runIngestion().catch((err) => {
  console.error('Fatal ingestion error:', err);
  process.exit(1);
});
