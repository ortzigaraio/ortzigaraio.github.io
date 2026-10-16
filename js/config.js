/* ==========================================================================
   CONFIGURACIÓN DEL PORTFOLIO — edita aquí tus datos.
   Todo lo que aparece en la web sale de este objeto.
   ========================================================================== */
window.PORTFOLIO = {
  owner: {
    name: "Ortzi Garaio",
    role: "Data Scientist · AI Engineer",
    location: "Euskadi, ES",
    github: "https://github.com/ortzigaraio",
    email: "ortzigar@gmail.com",
    photo: "foto_perfil_cv.png", // retrato; se muestra con el efecto activo
    bio: [
      "I am a data scientist. I like taking a model from the notebook to a service that runs on its own, with real data, alerts and metrics someone checks every morning.",
      "I now work on memory systems for agents: hybrid RAG, knowledge graphs and vector databases (Qdrant, Neo4j, pgvector) connected through MCP. Before that I worked on OCR, classic NLP and predictive modelling.",
      "I build with Python and deploy with Docker and AWS. If something can be measured, I measure it before optimising it."
    ]
  },

  /* Proyectos de la galería. `cover` acepta una URL de imagen; si es null,
     se genera una portada procedural con el efecto activo. */
  projects: [
    {
      id: "horain",
      title: "Horain",
      year: 2026,
      role: "Author · Full-stack · Product",
      summary: "Hyperlocal marketplace for the Basque Country with real stock: neighbours reserve for 15 minutes and shops upload their stock with a photo of the delivery note.",
      problem: "Local shops have no digital storefront and no time to maintain a catalogue. Neighbours cannot tell whether a product is in the village shop before going, and the big platforms do not rank by proximity.",
      solution: "TanStack Start app (React 19, SSR) deployed as a Cloudflare Worker on Supabase (Postgres with PostGIS and pgvector, Auth and Storage with RLS). Search combines keywords, Gemini embeddings and distance in a single SQL function. Express Reserve with a pickup code and a 15-minute countdown. The shop photographs the delivery note and Gemini returns lines with product, quantity, price and VAT, which are reviewed before publishing. Custom map of the Basque Country with MapLibre and a 3D view, and a “For you” personalisation computed only in the browser. Installable PWA in Basque and Spanish.",
      stack: ["TanStack Start", "React 19", "Cloudflare Workers", "Supabase", "PostGIS", "pgvector", "Gemini", "Tailwind v4", "MapLibre GL"],
      metrics: [["SQL migrations", "32"], ["App routes", "28"], ["Desktop CLS", "0.24 → 0.002"], ["Scope", "Basque Country"]],
      repo: "https://github.com/ortzigaraio/horain",
      live: "https://horain.ortzigar.org",
      cover: null,
      shots: ["img/projects/horain-home.webp"]
    },
    {
      id: "dither",
      title: "Dither",
      year: 2026,
      role: "Author · Graphics · Frontend",
      summary: "Turns images, video and webcam into generative art with 26 styles, all in the browser and without uploading anything.",
      problem: "ASCII, dithering and halftone tools are usually a single technique, upload your files to a server, or do not export to formats useful for plotters, print or video.",
      solution: "Static site with no framework or build: ES modules, WebGL2, Canvas2D and Web Workers. 26 styles in five families (text, pixel, vector, 3D and simulation), each one a module with its own parameter schema and generated controls. Smart subject cut-out, noise reduction, CRT post-effects and export to PNG, plotter SVG (A4/A3 with Inkscape layers), TXT, ANSI, PLY and video with sound. Six themes with WCAG AA contrast, ES/EN and keyboard shortcuts. Around 460 Playwright tests and axe-core with no violations.",
      stack: ["JavaScript (ES modules)", "WebGL2", "Canvas2D", "Web Workers", "Playwright", "GitHub Pages"],
      metrics: [["Styles", "26"], ["Tests", "≈ 460"], ["Server uploads", "0"], ["Languages", "ES / EN"]],
      repo: "https://github.com/ortzigaraio/Dither-art",
      live: "https://dither.ortzigar.org",
      cover: null,
      shots: ["img/projects/dither-studio-ascii.webp", "img/projects/dither-halftone-light.webp", "img/projects/dither-crt.webp"]
    },
    {
      id: "pdf-creator",
      title: "AI PDF Creator",
      year: 2026,
      role: "Author · AI · Automation",
      summary: "Engine that generates executive talent-assessment reports in PDF and Excel, with the narrative written by an LLM from data.",
      problem: "Preparing a talent report per person means writing strengths, risks and recommendations by hand, and keeping the PDF, the Excel and the assessor’s notes consistent.",
      solution: "A single JSON defines companies, target-profile weights across 7 dimensions and assessed people, validated with Pydantic v2. The engine computes fit and percentiles against the team, fires 6 async requests to Groq (Llama 3.3 70B) for strengths, leadership, critical points, catalysts and risk alert, and uses the assessor’s phrases as an anchor so the narrative does not contradict itself. Matplotlib draws radar, bar and scatter charts, Jinja2 + Playwright produce a high-fidelity PDF and openpyxl fills an Excel template with placeholders. Includes batch processing and a webhook server.",
      stack: ["Python", "Groq · Llama 3.3 70B", "Pydantic v2", "Playwright", "Jinja2", "Matplotlib", "openpyxl"],
      metrics: [["AI requests per report", "6"], ["Dimensions assessed", "7"], ["Outputs", "PDF + Excel"]],
      repo: "https://github.com/ortzigaraio/IA-PDF_creator",
      live: null,
      cover: null,
      shots: [null, null]
    },
    {
      id: "rag-boe",
      title: "RAG BOE Spain",
      year: 2026,
      role: "Author · RAG · Evaluation",
      summary: "Multimodal RAG for querying the BOE (Spain’s official gazette): it keeps tables, reads images with LLaVA and routes HR questions to structured data.",
      problem: "BOE codes are PDFs hundreds of pages long, full of tables. Finding a specific article by hand is slow, and a RAG that cuts text into fixed chunks breaks the tables and loses article numbers.",
      solution: "Ingestion converts each PDF to Markdown with PyMuPDF4LLM, keeping tables, splits by topic change (semantic chunking) and adds the folder category to the context in ChromaDB. Search combines BM25 and vectors with Reciprocal Rank Fusion and reranks with a BGE cross-encoder. A LangGraph router sends questions about laws to the RAG and employee questions to Pandas, and LLaVA checks whether a candidate image contains the answer. Everything runs locally with Ollama (Llama 3), with a FastAPI API, a Streamlit chat and a Telegram bot. Evaluated with RAGAS and retrieval metrics.",
      stack: ["Python", "LangGraph", "Ollama · Llama 3", "LLaVA", "ChromaDB", "BM25 + RRF", "BGE Reranker", "FastAPI", "Streamlit", "RAGAS", "Telegram Bot"],
      metrics: [["Hit Rate @3", "0.80"], ["MRR @10", "0.74"], ["Faithfulness (RAGAS)", "0.88"], ["BOE codes indexed", "25"]],
      repo: "https://github.com/ortzigaraio/RAG-BOE-ESPANA",
      live: null,
      cover: null,
      shots: ["img/projects/rag-boe-retrieval.png", "img/projects/rag-boe-ragas.png"]
    },
    {
      id: "whatsapp-rag",
      title: "WhatsApp Chatbot RAG",
      year: 2026,
      role: "Author · Automation · AI",
      summary: "WhatsApp chatbot in n8n that answers with RAG over company documentation and hands the conversation to a person when needed.",
      problem: "Customers write on WhatsApp at any hour and in bursts of several messages. Answering by hand does not scale, and a simple bot replies to each loose message with no context and no way to escalate to support.",
      solution: "A webhook receives the messages, checks whether they are text or documents and logs the lead in Supabase. A buffer waits 3 s to group consecutive messages into a single query. The agent (Groq + window memory) retrieves context from Supabase pgvector with Cohere embeddings and reranking, and a switch decides: reply in several messages, hand over to human mode, or alert support if there is no information. Admins extend the knowledge base by sending PDF, XLSX or TXT files through WhatsApp itself. A cron re-enables the bot in inactive chats and errors arrive by email.",
      stack: ["n8n", "WhatsApp Business API", "Supabase", "pgvector", "Groq", "Cohere Embed + Rerank", "LangChain"],
      metrics: [["Workflow nodes", "58"], ["Grouping buffer", "3 s"], ["Modes", "Bot / Human"]],
      repo: "https://github.com/ortzigaraio/N8N-Whatapp-chatbot",
      live: null,
      cover: null,
      shots: ["img/projects/n8n-workflow.png"]
    },
    {
      id: "yolo-mushrooms",
      title: "YOLO Mushrooms",
      year: 2026,
      role: "Author · Computer vision",
      summary: "Real-time mushroom detector with YOLO and TensorFlow Lite: 32 classes, with warnings for toxic and deadly species.",
      problem: "Mistaking an edible mushroom for a deadly one is easy and serious. Paper guides are no help in the field, and large detection models do not fit on a phone.",
      solution: "32-class dataset with bounding boxes (19 edible, 2 toxic, 7 deadly and 4 Pleurotus) trained with YOLOv8/v10 in PyTorch. The model is exported to ONNX, then to SavedModel and to TFLite with int8 quantisation for on-phone inference. Each detection reports edibility and toxic syndrome, and an interactive Leaflet map marks mushroom areas in Spain. It is an educational project: it never replaces a mycologist.",
      stack: ["Python", "PyTorch", "YOLOv8 / v10", "ONNX", "TensorFlow Lite", "Leaflet"],
      metrics: [["Classes", "32"], ["Labelled images", "12,817"], ["Model size", "−75% (int8)"]],
      repo: "https://github.com/ortzigaraio/Yolo_mushrooms",
      live: null,
      cover: null,
      shots: [null, null]
    },
    {
      id: "wallapop-bot",
      title: "Wallapop Bot",
      year: 2026,
      role: "Author · Backend · Data",
      summary: "24/7 bot that spots real bargains on Wallapop by comparing each listing with its market price.",
      problem: "Real bargains last minutes and the app’s filters only sort by price: they cannot tell whether €300 for a PS5 is cheap or a scam.",
      solution: "Watches specific products and scans whole categories. The market price is the median of at least 6 comparable listings; a listing is a bargain if it is 25% or more below, and if it drops more than 65% it is flagged as a possible scam. Alerts arrive via Discord, Telegram or push with the discount and the comparables used, also when an already-seen listing drops in price. Randomised intervals, backoff and redundancy to avoid being blocked or going down; controlled from Telegram.",
      stack: ["Python", "requests", "PyYAML", "Docker", "Telegram Bot", "Discord Webhooks"],
      metrics: [["Products watched", "14"], ["Categories scanned", "7"], ["Bargain threshold", "−25%"]],
      repo: "https://github.com/ortzigaraio/Wallapop_bot",
      live: null,
      cover: null,
      shots: [null, null]
    }
  ],

  /* Hard skills: nivel 0–5 (se dibuja como matriz de puntos). */
  skills: [
    { group: "Languages", items: [["Python", 5], ["SQL", 5], ["JavaScript", 4], ["TypeScript", 3], ["React", 3], ["WebGL", 3], ["R", 3], ["Spark", 3]] },
    { group: "IA / LLM", items: [["RAG", 5], ["LangGraph", 4], ["LangChain", 4], ["Ollama", 4], ["Groq", 3], ["RAGAS", 4]] },
    { group: "ML / Vision", items: [["PyTorch", 4], ["YOLO", 4], ["TensorFlow Lite", 3], ["Scikit-Learn", 5]] },
    { group: "Data", items: [["ChromaDB", 4], ["Supabase", 4], ["pgvector", 4], ["Qdrant", 3], ["Neo4j", 3], ["Pandas", 5], ["PostGIS", 3]] },
    { group: "Automation", items: [["n8n", 5], ["WhatsApp Business API", 4], ["Telegram Bot", 4], ["Power Automate", 3]] },
    { group: "Infra / Apps", items: [["Docker", 4], ["AWS", 3], ["FastAPI", 4], ["Streamlit", 4], ["Git", 5], ["Cloudflare Workers", 4], ["Playwright", 4]] }
  ],

  /* ---------- Ejemplos de dirección visual (seleccionables en "Laboratorio") ---------- */
  palettes: {
    hermes:    { label: "Monocromo", dark: { bg: "#0a0a0a", fg: "#f4f4f4", muted: "#8b8b86", line: "#262624", accent: "#f4f4f4" },
                                       light: { bg: "#f4f4f4", fg: "#0a0a0a", muted: "#6b6b66", line: "#d6d6d2", accent: "#0a0a0a" } },
    carbon:    { label: "Charcoal", dark: { bg: "#0a0a0a", fg: "#f4f4f4", muted: "#8b8b86", line: "#262624", accent: "#ff5b23" },
                                      light: { bg: "#f4f4f4", fg: "#0a0a0a", muted: "#6b6b66", line: "#d6d6d2", accent: "#e2440f" } },
    sello:     { label: "Stamp ink", dark: { bg: "#13110f", fg: "#efe8dc", muted: "#948b7d", line: "#2b2723", accent: "#e5322d" },
                                      light: { bg: "#efe8dc", fg: "#1a1613", muted: "#7a7064", line: "#d3c9b8", accent: "#c8221d" } },
    cianotipo: { label: "Cianotipo", dark: { bg: "#0a1626", fg: "#e6edf6", muted: "#7f93ad", line: "#1c2c44", accent: "#8fb8ff" },
                                      light: { bg: "#e9eef5", fg: "#0c1b30", muted: "#5d7088", line: "#c6d2e2", accent: "#2457c5" } },
    fosforo:   { label: "Phosphor", dark: { bg: "#060907", fg: "#d9f2df", muted: "#6f8a76", line: "#16231a", accent: "#5dffa0" },
                                      light: { bg: "#eef4ef", fg: "#0b1a10", muted: "#5d7363", line: "#cddbd0", accent: "#0f9a4e" } },
    piscina:   { label: "Poolside", dark: { bg: "#0f1a1c", fg: "#f3efe4", muted: "#86948f", line: "#203033", accent: "#ff8fb1" },
                                      light: { bg: "#f3efe4", fg: "#10201f", muted: "#6c7a76", line: "#d9d3c4", accent: "#e0577f" } }
  },

  fonts: {
    stamp:     { label: "Stamp RSPK Three", display: "'Stamp RSPK Three', 'Archivo', system-ui, sans-serif", mono: "'JetBrains Mono', ui-monospace, monospace" },
    tecnica:   { label: "Space Grotesk",    display: "'Space Grotesk', system-ui, sans-serif",              mono: "'JetBrains Mono', ui-monospace, monospace" },
    archivo:   { label: "Archivo Expanded", display: "'Archivo', system-ui, sans-serif",                    mono: "'IBM Plex Mono', ui-monospace, monospace", displayStretch: "125%" },
    shoulders: { label: "Big Shoulders",    display: "'Big Shoulders Display', system-ui, sans-serif",      mono: "'Space Mono', ui-monospace, monospace" }
  },

  effects: {
    ascii:    { label: "ASCII",     cell: 13 },
    braille:  { label: "Braille",   cell: 14 },
    dither:   { label: "Dithering", cell: 12 },
    halftone: { label: "Halftone",  cell: 9 },
    led:      { label: "LED matrix", cell: 10 },
    raw:      { label: "No filter", cell: 8 }
  },

  /* Fondo alrededor del cañón al inicio. */
  barrelBackgrounds: {
    black:   { label: "Black" },
    palette: { label: "Palette background" },
    accent:  { label: "Accent colour" },
    field:   { label: "Character field" }
  },

  defaults: {
    theme: "dark",
    palette: "hermes",
    font: "stamp",
    effect: "ascii",
    density: 1,          // multiplicador del tamaño de celda (0.6 – 1.6)
    hero: "orb",         // intro: "orb" (esfera + constelación) o "barrel" (cañón)
    click: "wave",       // efecto del clic sobre el fondo: wave | mix | detect | burst | cross | off
    bullet: false,       // bala sí / no (solo cañón)
    barrelBg: "black",
    field: true,         // fondo animado de caracteres
    music: 0             // pista inicial del reproductor
  }
};
