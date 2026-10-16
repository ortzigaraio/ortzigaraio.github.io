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
      "Soy científico de datos. Me gusta llevar un modelo desde el notebook hasta un servicio que funcione solo, con datos reales, alertas y métricas que alguien consulta cada mañana.",
      "Ahora trabajo con sistemas de memoria para agentes: RAG híbrido, grafos de conocimiento y bases vectoriales (Qdrant, Neo4j, pgvector) conectados por MCP. Antes pasé por OCR, NLP clásico y modelado predictivo.",
      "Construyo con Python y despliego con Docker y AWS. Si algo se puede medir, lo mido antes de optimizarlo."
    ]
  },

  /* Proyectos de la galería. `cover` acepta una URL de imagen; si es null,
     se genera una portada procedural con el efecto activo. */
  projects: [
    {
      id: "horain",
      title: "Horain",
      year: 2026,
      role: "Autor · Full-stack · Producto",
      summary: "Marketplace hiperlocal de Euskadi con stock real: los vecinos reservan 15 minutos y los comercios suben su stock con una foto del albarán.",
      problem: "El comercio local no tiene escaparate digital ni tiempo para mantener un catálogo. Los vecinos no saben si el producto está en la tienda del pueblo antes de ir, y las plataformas grandes no distinguen por cercanía.",
      solution: "App TanStack Start (React 19, SSR) desplegada como Cloudflare Worker sobre Supabase (Postgres con PostGIS y pgvector, Auth y Storage con RLS). El buscador combina palabras, embeddings de Gemini y distancia en una sola función SQL. Reserva Express con código de recogida y cuenta atrás de 15 minutos. El comercio fotografía el albarán y Gemini devuelve líneas con producto, cantidad, precio e IVA, que se revisan antes de publicar. Mapa propio de Euskadi con MapLibre y vista 3D, y personalización «Para ti» que se calcula solo en el navegador. PWA instalable y en euskera y castellano.",
      stack: ["TanStack Start", "React 19", "Cloudflare Workers", "Supabase", "PostGIS", "pgvector", "Gemini", "Tailwind v4", "MapLibre GL"],
      metrics: [["Migraciones SQL", "32"], ["Rutas de la app", "28"], ["CLS escritorio", "0,24 → 0,002"], ["Ámbito", "Euskadi"]],
      repo: "https://github.com/ortzigaraio/horain",
      live: "https://horain.ortzigar.org",
      cover: null,
      shots: ["img/projects/horain-home.webp"]
    },
    {
      id: "dither",
      title: "Dither",
      year: 2026,
      role: "Autor · Gráficos · Frontend",
      summary: "Convierte imágenes, vídeo y webcam en arte generativo con 26 estilos, todo en el navegador y sin subir nada.",
      problem: "Las herramientas de ASCII, tramado o halftone suelen ser una sola técnica, suben tus archivos a un servidor o no exportan en formatos útiles para plotter, impresión o vídeo.",
      solution: "Sitio estático sin framework ni build: ES modules, WebGL2, Canvas2D y Web Workers. 26 estilos en cinco familias (texto, píxel, vectorial, 3D y simulación), cada uno como un módulo con su esquema de parámetros y controles generados. Recorte inteligente del sujeto, reducción de ruido, post-efectos CRT y exportación a PNG, SVG para plotter (A4/A3 con capas de Inkscape), TXT, ANSI, PLY y vídeo con sonido. Seis temas con contraste WCAG AA, ES/EN y atajos de teclado. Cerca de 460 tests con Playwright y axe-core sin violaciones.",
      stack: ["JavaScript (ES modules)", "WebGL2", "Canvas2D", "Web Workers", "Playwright", "GitHub Pages"],
      metrics: [["Estilos", "26"], ["Tests", "≈ 460"], ["Subidas a servidor", "0"], ["Idiomas", "ES / EN"]],
      repo: "https://github.com/ortzigaraio/Dither-art",
      live: "https://dither.ortzigar.org",
      cover: null,
      shots: ["img/projects/dither-studio-ascii.webp", "img/projects/dither-halftone-light.webp", "img/projects/dither-crt.webp"]
    },
    {
      id: "pdf-creator",
      title: "IA PDF Creator",
      year: 2026,
      role: "Autor · IA · Automatización",
      summary: "Motor que genera informes ejecutivos en PDF y Excel de evaluación de talento, con la narrativa escrita por un LLM a partir de datos.",
      problem: "Preparar un informe de talento por persona exige redactar fortalezas, riesgos y recomendaciones a mano, y mantener coherentes el PDF, el Excel y las observaciones del evaluador.",
      solution: "Un único JSON define empresas, pesos del perfil objetivo en 7 dimensiones y personas evaluadas, validado con Pydantic v2. El motor calcula la compatibilidad y los percentiles frente al equipo, lanza 6 peticiones asíncronas a Groq (Llama 3.3 70B) para fortalezas, liderazgo, puntos críticos, catalizadores y alerta de riesgo, y usa las frases del evaluador como ancla para que la narrativa no se contradiga. Matplotlib dibuja radar, barras y dispersión, Jinja2 + Playwright producen un PDF de alta fidelidad y openpyxl rellena una plantilla Excel con marcadores. Incluye proceso por lotes y servidor de webhook.",
      stack: ["Python", "Groq · Llama 3.3 70B", "Pydantic v2", "Playwright", "Jinja2", "Matplotlib", "openpyxl"],
      metrics: [["Peticiones IA por informe", "6"], ["Dimensiones evaluadas", "7"], ["Salidas", "PDF + Excel"]],
      repo: "https://github.com/ortzigaraio/IA-PDF_creator",
      live: null,
      cover: null,
      shots: [null, null]
    },
    {
      id: "rag-boe",
      title: "RAG BOE España",
      year: 2026,
      role: "Autor · RAG · Evaluación",
      summary: "RAG multimodal para consultar el BOE: conserva las tablas, lee imágenes con LLaVA y lleva las preguntas de RR. HH. a datos estructurados.",
      problem: "Los códigos del BOE son PDFs de cientos de páginas llenos de tablas. Buscar un artículo concreto a mano es lento, y un RAG que corta el texto en trozos fijos rompe las tablas y pierde números de artículo.",
      solution: "La ingesta convierte cada PDF a Markdown con PyMuPDF4LLM conservando tablas, trocea por cambio de tema (chunking semántico) y añade la categoría de la carpeta al contexto en ChromaDB. La búsqueda combina BM25 y vectores con Reciprocal Rank Fusion y reordena con un cross-encoder BGE. Un router con LangGraph manda las preguntas sobre leyes al RAG y las de empleados a Pandas, y LLaVA comprueba si una imagen candidata contiene la respuesta. Todo corre en local con Ollama (Llama 3), con API en FastAPI, chat en Streamlit y bot de Telegram. Evaluado con RAGAS y métricas de recuperación.",
      stack: ["Python", "LangGraph", "Ollama · Llama 3", "LLaVA", "ChromaDB", "BM25 + RRF", "BGE Reranker", "FastAPI", "Streamlit", "RAGAS", "Telegram Bot"],
      metrics: [["Hit Rate @3", "0.80"], ["MRR @10", "0.74"], ["Faithfulness (RAGAS)", "0.88"], ["Códigos BOE indexados", "25"]],
      repo: "https://github.com/ortzigaraio/RAG-BOE-ESPANA",
      live: null,
      cover: null,
      shots: ["img/projects/rag-boe-retrieval.png", "img/projects/rag-boe-ragas.png"]
    },
    {
      id: "whatsapp-rag",
      title: "WhatsApp Chatbot RAG",
      year: 2026,
      role: "Autor · Automatización · IA",
      summary: "Chatbot de WhatsApp en n8n que responde con RAG sobre la documentación de la empresa y pasa la conversación a una persona cuando hace falta.",
      problem: "Los clientes escriben por WhatsApp a cualquier hora y en ráfagas de varios mensajes. Contestar a mano no escala, y un bot simple responde a cada mensaje suelto sin contexto ni forma de escalar a soporte.",
      solution: "Un webhook recibe los mensajes, valida si son texto o documento y registra el lead en Supabase. Un buffer espera 3 s para agrupar los mensajes seguidos en una sola consulta. El agente (Groq + memoria de ventana) recupera contexto de Supabase pgvector con embeddings y reranking de Cohere, y un switch decide: responder en varios mensajes, transferir a modo humano o avisar a soporte si no hay información. Los administradores amplían la base de conocimiento enviando PDF, XLSX o TXT por el propio WhatsApp. Un cron reactiva el bot en chats inactivos y los errores llegan por correo.",
      stack: ["n8n", "WhatsApp Business API", "Supabase", "pgvector", "Groq", "Cohere Embed + Rerank", "LangChain"],
      metrics: [["Nodos del flujo", "58"], ["Buffer de agrupación", "3 s"], ["Modos", "Bot / Humano"]],
      repo: "https://github.com/ortzigaraio/N8N-Whatapp-chatbot",
      live: null,
      cover: null,
      shots: ["img/projects/n8n-workflow.png"]
    },
    {
      id: "yolo-mushrooms",
      title: "YOLO Mushrooms",
      year: 2026,
      role: "Autor · Visión por computador",
      summary: "Detector de setas en tiempo real con YOLO y TensorFlow Lite: 32 clases, con aviso de las especies tóxicas y mortales.",
      problem: "Confundir una seta comestible con una mortal es fácil y grave. Las guías en papel no ayudan en el monte y los modelos de detección grandes no caben en un móvil.",
      solution: "Dataset de 32 clases con bounding boxes (19 comestibles, 2 tóxicas, 7 mortales y 4 Pleurotus) entrenado con YOLOv8/v10 en PyTorch. El modelo se exporta a ONNX, luego a SavedModel y a TFLite con cuantización int8 para inferencia en el móvil. Cada detección indica comestibilidad y síndrome tóxico, y un mapa interactivo con Leaflet marca zonas de setas en España. Es un proyecto educativo: nunca sustituye a un micólogo.",
      stack: ["Python", "PyTorch", "YOLOv8 / v10", "ONNX", "TensorFlow Lite", "Leaflet"],
      metrics: [["Clases", "32"], ["Imágenes etiquetadas", "12.817"], ["Peso del modelo", "−75 % (int8)"]],
      repo: "https://github.com/ortzigaraio/Yolo_mushrooms",
      live: null,
      cover: null,
      shots: [null, null]
    },
    {
      id: "wallapop-bot",
      title: "Wallapop Bot",
      year: 2026,
      role: "Autor · Backend · Datos",
      summary: "Bot 24/7 que detecta chollos reales en Wallapop comparando cada anuncio con su precio de mercado.",
      problem: "Las gangas de verdad duran minutos y los filtros de la app solo ordenan por precio: no saben si 300 € por una PS5 es barato o un timo.",
      solution: "Vigila productos concretos y escanea categorías enteras. El precio de mercado es la mediana de al menos 6 anuncios comparables; un anuncio es chollo si está un 25 % o más por debajo, y si baja más de un 65 % se avisa de posible estafa. Las alertas llegan por Discord, Telegram o push con el descuento y los comparables usados, también cuando un anuncio ya visto baja de precio. Intervalos con aleatoriedad, backoff y redundancia para no ser bloqueado ni caerse; se controla desde Telegram.",
      stack: ["Python", "requests", "PyYAML", "Docker", "Telegram Bot", "Discord Webhooks"],
      metrics: [["Productos vigilados", "14"], ["Categorías escaneadas", "7"], ["Umbral de chollo", "−25 %"]],
      repo: "https://github.com/ortzigaraio/Wallapop_bot",
      live: null,
      cover: null,
      shots: [null, null]
    }
  ],

  /* Hard skills: nivel 0–5 (se dibuja como matriz de puntos). */
  skills: [
    { group: "Lenguajes", items: [["Python", 5], ["SQL", 5], ["JavaScript", 4], ["TypeScript", 3], ["React", 3], ["WebGL", 3], ["R", 3], ["Spark", 3]] },
    { group: "IA / LLM", items: [["RAG", 5], ["LangGraph", 4], ["LangChain", 4], ["Ollama", 4], ["Groq", 3], ["RAGAS", 4]] },
    { group: "ML / Visión", items: [["PyTorch", 4], ["YOLO", 4], ["TensorFlow Lite", 3], ["Scikit-Learn", 5]] },
    { group: "Datos", items: [["ChromaDB", 4], ["Supabase", 4], ["pgvector", 4], ["Qdrant", 3], ["Neo4j", 3], ["Pandas", 5], ["PostGIS", 3]] },
    { group: "Automatización", items: [["n8n", 5], ["WhatsApp Business API", 4], ["Telegram Bot", 4], ["Power Automate", 3]] },
    { group: "Infra / Apps", items: [["Docker", 4], ["AWS", 3], ["FastAPI", 4], ["Streamlit", 4], ["Git", 5], ["Cloudflare Workers", 4], ["Playwright", 4]] }
  ],

  /* ---------- Ejemplos de dirección visual (seleccionables en "Laboratorio") ---------- */
  palettes: {
    hermes:    { label: "Monocromo", dark: { bg: "#0a0a0a", fg: "#f4f4f4", muted: "#8b8b86", line: "#262624", accent: "#f4f4f4" },
                                       light: { bg: "#f4f4f4", fg: "#0a0a0a", muted: "#6b6b66", line: "#d6d6d2", accent: "#0a0a0a" } },
    carbon:    { label: "Carbón",    dark: { bg: "#0a0a0a", fg: "#f4f4f4", muted: "#8b8b86", line: "#262624", accent: "#ff5b23" },
                                      light: { bg: "#f4f4f4", fg: "#0a0a0a", muted: "#6b6b66", line: "#d6d6d2", accent: "#e2440f" } },
    sello:     { label: "Tinta sello", dark: { bg: "#13110f", fg: "#efe8dc", muted: "#948b7d", line: "#2b2723", accent: "#e5322d" },
                                      light: { bg: "#efe8dc", fg: "#1a1613", muted: "#7a7064", line: "#d3c9b8", accent: "#c8221d" } },
    cianotipo: { label: "Cianotipo", dark: { bg: "#0a1626", fg: "#e6edf6", muted: "#7f93ad", line: "#1c2c44", accent: "#8fb8ff" },
                                      light: { bg: "#e9eef5", fg: "#0c1b30", muted: "#5d7088", line: "#c6d2e2", accent: "#2457c5" } },
    fosforo:   { label: "Fósforo",   dark: { bg: "#060907", fg: "#d9f2df", muted: "#6f8a76", line: "#16231a", accent: "#5dffa0" },
                                      light: { bg: "#eef4ef", fg: "#0b1a10", muted: "#5d7363", line: "#cddbd0", accent: "#0f9a4e" } },
    piscina:   { label: "Piscina",   dark: { bg: "#0f1a1c", fg: "#f3efe4", muted: "#86948f", line: "#203033", accent: "#ff8fb1" },
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
    led:      { label: "Matriz LED", cell: 10 },
    raw:      { label: "Sin filtro", cell: 8 }
  },

  /* Fondo alrededor del cañón al inicio. */
  barrelBackgrounds: {
    black:   { label: "Negro" },
    palette: { label: "Fondo de la paleta" },
    accent:  { label: "Color de acento" },
    field:   { label: "Campo de caracteres" }
  },

  defaults: {
    theme: "dark",
    palette: "hermes",
    font: "stamp",
    effect: "ascii",
    density: 1,          // multiplicador del tamaño de celda (0.6 – 1.6)
    hero: "orb",         // intro: "orb" (esfera + constelación) o "barrel" (cañón)
    click: "mix",        // efecto del clic sobre el fondo: mix | wave | detect | burst | cross | off
    bullet: false,       // bala sí / no (solo cañón)
    barrelBg: "black",
    field: true,         // fondo animado de caracteres
    music: 0             // pista inicial del reproductor
  }
};
