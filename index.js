import dotenv from 'dotenv';
import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import { ChromaClient } from 'chromadb';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
const chromaClient = new ChromaClient({ path: 'http://localhost:8000' });
chromaClient.heartbeat();

const WEB_COLLECTION = `WEB_SCRAPED_DATA_COLLECTION-1`;

async function scrapeWebpage(url = '') {
    const internalLinks = new Set();
    const externalLinks = new Set();

    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const pageHead = $('head').html();
    const pageBody = $('body').html();


    $('a').each((_, el) => {
        const link = $(el).attr('href');
        if (link === '/' || link === '') return;
        if (link.startsWith('http') || link.startsWith('https')) {
            externalLinks.add(link);
        } else {
            internalLinks.add(link);
        }
    })

    return { head: pageHead, body: pageBody, internalLinks: Array.from(internalLinks), externalLinks: Array.from(externalLinks) };
}

async function generateVectorEmbeddings({ text }) {
    const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
    });

    return embedding.data[0].embedding;
}

async function insertIntoDB({ embedding, url, body = '', head }) {
    const collection = await chromaClient.getOrCreateCollection({ name: WEB_COLLECTION });
    await collection.add({
        ids: [url],
        documents: [url],
        metadatas: [{ url, body, head }],
        embeddings: [embedding]
    });
}

const visitedUrls = new Set();

async function ingest(url = '') {
    if (visitedUrls.has(url)) {
        console.log(`Already visited: ${url}`);
        return;
    }
    
    console.log(`Starting ingestion for: ${url}`);
    visitedUrls.add(url);

    try {
        const { head, body, internalLinks } = await scrapeWebpage(url);
        const bodyChunks = chunkText(body, 500);

        const headEmbedding = await generateVectorEmbeddings({ text: head });
        await insertIntoDB({ embedding: headEmbedding, url, body, head });

        for (const chunk of bodyChunks) {
            const bodyEmbedding = await generateVectorEmbeddings({ text: chunk });
            await insertIntoDB({ embedding: bodyEmbedding, url, head, body: chunk });
        }

        for (const link of internalLinks) {
            const _url = new URL(link, url).href;
            await ingest(_url);
        }
    } catch (error) {
        console.error(`Error ingesting ${url}:`, error.message);
    }
}


async function chat(question = '') {
    const questionEmbedding = await generateVectorEmbeddings({ text: question });
    const collectionResult = (await chromaClient.getCollection({ name: WEB_COLLECTION })).query({
        nResults: 1,
        queryEmbeddings: [questionEmbedding],
    });
    const body = (await collectionResult).metadatas[0].map((e) => e.body).filter(e => e.trim() !== '' && !!e);
    const url = (await collectionResult).metadatas[0].map((e) => e.url).filter(e => e.trim() !== '' && !!e);

    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
            { role: 'system', content: "You are an AI support agent expert in providing support to users on behalf of a webpage. Given the context about page content, reply the user accordingly." },
            { role: 'user', content: `Query: ${question}\n\nURL:${url.join(', ')}\n\nRetrived context: ${body}` }
        ]
    });

    console.log(response.choices[0].message.content);

}

function chunkText(text, chunkSize) {
    if (!text || chunkSize <= 0) return [];

    const words = text.split(/\s+/);
    const chunks = [];

    for (let i = 0; i < words.length; i += chunkSize) {
        chunks.push(words.slice(i, i + chunkSize).join(' '));
    }

    return chunks;
}

// ingest('https://www.ashu.to')
chat('How do we contact ashutosh?')