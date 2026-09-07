# IP-SAKTI Sahayak

> A source-cited, RAG-based AI assistant for Intellectual Property (IP) and regulatory guidance related to Ayurveda.

Developed as a Smart India Hackathon prototype demonstrating grounded conversational AI, jurisdiction awareness (🇮🇳 India), legal citations, and safe abstention.

---

## 🌟 What It Does

- **Conversational RAG Assistance**: Answers complex questions regarding traditional knowledge, patent eligibility, ASU drug licensing, and international biodiversity compliance.
- **Source Citation & Grounding**: Every answer is backed by authoritative legal/regulatory source cards citing specific statutory sections (Patents Act Sec 3(p), Drugs & Cosmetics Rules 153-170, Biological Diversity Act Sec 6, WIPO treaties).
- **Jurisdiction Tagging**: Identifies regulatory jurisdictions (primarily 🇮🇳 India and global WIPO standards).
- **Safe Abstention**: Abstains from answering when retrieved context is insufficient, preventing hallucinations and referring users to official bodies (CGPDTM, Ministry of Ayush, NBA).
- **Session History Support**: Supports follow-up questions in context without requiring user accounts or persistent storage.
- **Zero Document Uploads**: Strictly preloaded authoritative knowledge base maintains data integrity and compliance.

---

## 🏗️ Architecture

```text
Authoritative Documents (/data)
       ↓
ingest.ts (npm run ingest)
       ↓
Text Chunking (800 chars, 120 overlap)
       ↓
OpenAI Embeddings (text-embedding-3-small)
       ↓
Astra DB Vector Store (ip_sakti_documents)
       ↓
Conversational Query → Vector Search
       ↓
Grounded LLM Generation (/api/chat)
       ↓
Source-Cited Next.js UI
```

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Next.js Server-side Route Handlers (`/api/chat`).
- **AI & RAG**: OpenAI API (`gpt-4o-mini`, `text-embedding-3-small`), LangChain.js.
- **Vector Database**: Astra DB / DataStax (`@datastax/astra-db-ts`) with local vector search fallback.

---

## 🔐 Environment Variables

Create `.env.local` in the project root:

```text
OPENAI_API_KEY=your_openai_api_key_here

ASTRA_DB_API_ENDPOINT=https://<your-astra-db-id>-<region>.apps.astra.datastax.com
ASTRA_DB_APPLICATION_TOKEN=AstraCS:...
ASTRA_DB_NAMESPACE=default_keyspace
ASTRA_DB_COLLECTION=ip_sakti_documents
```

*Note: The application includes a built-in fallback search engine so it runs seamlessly out-of-the-box even before cloud API keys are added.*

---

## 🚀 How to Run

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Ingest Knowledge Base Documents**:
   ```bash
   npm run ingest
   ```

3. **Start Local Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

4. **Build Production App**:
   ```bash
   npm run build
   ```

---

## 📚 How RAG & Ingestion Work

1. Authoritative plain-text legislation and regulatory guidelines are maintained in `/data`:
   - `patents-section-3.txt` (Indian Patents Act 1970)
   - `ayurveda-regulations.txt` (Drugs & Cosmetics Act & Rules)
   - `biodiversity.txt` (Biological Diversity Act 2002 & NBA ABS)
   - `traditional-knowledge.txt` (TKDL prior-art protection)
   - `wipo-tk.txt` (WIPO international frameworks)
2. `npm run ingest` parses metadata headers, splits text into ~800-character overlapping chunks, generates embeddings, and writes to Astra DB.
3. User queries sent to `/api/chat` trigger similarity vector search, retrieve top-5 relevant chunks, construct a grounded prompt, and stream/return cited answers.

---

## ⚠️ Limitations & MVP Scope

- **Informational Guidance Only**: IP-SAKTI Sahayak is an educational prototype and does not constitute formal legal advice or binding regulatory decisions.
- **No Document Upload**: Users cannot upload external PDFs or documents.
- **Primary Jurisdiction**: Geared primarily for Indian patent & AYUSH regulations.

---

## 🔮 Future Improvements

- Full Bhashini API integration for multi-lingual Indian speech-to-text.
- Expanded multi-country international IP routing database.
- Integration with live public patent office API feeds.
