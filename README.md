# Web Scraper AI Agent

This project is an AI-powered web scraper that fetches webpage content, extracts useful information, and allows users to query the scraped data using OpenAI's GPT models.

## Features
- Web scraping using `axios` and `cheerio`
- Vector embeddings for webpage content using OpenAI API
- Storage and retrieval using ChromaDB
- Conversational AI interaction for querying the stored webpage data

## Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Docker](https://www.docker.com/)
- OpenAI API Key (sign up at [OpenAI](https://openai.com))

## Installation

1. Clone this repository:

   ```sh
   git clone https://github.com/ashutoshvjti/web-scraper-ai-agent.git
   cd web-scraper-ai-agent
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Set up environment variables:

   ```sh
   cp .env.example .env
   ```

   Then, update `.env` with your OpenAI API key.

## Running the Project

1. Start the ChromaDB service using Docker:

   ```sh
   docker-compose up -d
   ```

2. Run the script:

   ```sh
   node index.js
   ```

## Usage

### Web Scraping

To scrape a webpage and store its content:

```javascript
await ingest('https://example.com');
```

### Querying the AI Agent

To ask a question based on the scraped content:

```javascript
await chat('How do we contact support?');
```

## Configuration

Modify the following constants in `index.js` as needed:

- `WEB_COLLECTION`: The collection name used in ChromaDB.
- `chunkSize`: Controls how text content is split into smaller pieces before embedding.

## Dependencies

- `axios` - Fetch webpage content
- `cheerio` - Parse HTML content
- `chromadb` - Store and retrieve vector embeddings
- `dotenv` - Manage environment variables
- `openai` - Generate embeddings and process queries

## Troubleshooting

### ChromaDB Connection Issues

If ChromaDB fails to connect, ensure Docker is running:

```sh
docker ps
```

If needed, restart the container:

```sh
docker-compose restart
```

### OpenAI API Errors

Ensure your API key is set correctly in `.env` and that you have sufficient credits.

## Contributing

Feel free to submit pull requests or open issues to improve this project!

## License

This project is licensed under the MIT License.
