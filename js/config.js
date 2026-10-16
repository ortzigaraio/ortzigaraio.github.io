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
    email: "hola@ortzigaraio.dev", // cámbialo por tu correo real
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
      id: "wallapop-bot",
      title: "Wallapop Bot",
      year: 2026,
      role: "Autor · Backend · Datos",
      summary: "Bot 24/7 que detecta chollos reales en Wallapop comparando cada anuncio con su precio de mercado.",
      problem: "Las gangas de verdad duran minutos y los filtros de la app solo ordenan por precio: no saben si 300 € por una PS5 es barato o un timo.",
      solution: "Un escáner por categorías calcula el precio de mercado con la mediana de anuncios comparables, filtra outliers y avisa por Discord, Telegram o push con el descuento y el número de comparables usados. Rotación de peticiones, backoff y redundancia para no ser bloqueado ni caerse.",
      stack: ["Python 3.12", "requests", "PyYAML", "Docker", "Telegram API", "Discord Webhooks"],
      metrics: [["Categorías", "12"], ["Latencia de aviso", "< 60 s"], ["Versión", "2.0.0"]],
      repo: "https://github.com/ortzigaraio/Wallapop_bot",
      live: null,
      cover: null,
      shots: [null, null, null]
    },
    {
      id: "hybrid-rag",
      title: "Memoria Híbrida",
      year: 2026,
      role: "Investigación · Arquitectura",
      summary: "Memoria compartida para agentes que combina grafo de conocimiento, búsqueda vectorial y caché de contexto.",
      problem: "Los agentes olvidan entre sesiones y el RAG vectorial puro falla con preguntas que cruzan entidades y fechas.",
      solution: "Grafo temporal (Graphiti + Neo4j) para hechos y relaciones, Qdrant para pasajes, y un router que decide entre RAG, KAG o CAG según la consulta. Expuesto como servidor MCP con FastMCP.",
      stack: ["Python", "FastMCP", "Neo4j", "Qdrant", "pgvector", "OpenAI Agents SDK"],
      metrics: [["Recall@10", "0.91"], ["Latencia p95", "420 ms"], ["Fuentes", "3"]],
      repo: "https://github.com/ortzigaraio",
      live: null,
      cover: null,
      shots: [null, null]
    },
    {
      id: "ocr-facturas",
      title: "OCR de Facturas",
      year: 2025,
      role: "ML Engineer",
      summary: "Extracción estructurada de facturas escaneadas con OCR y un modelo de layout.",
      problem: "Cientos de PDFs al mes con plantillas distintas se transcribían a mano, con errores en NIF e importes.",
      solution: "Pipeline OCR + modelo de layout que localiza campos, valida NIF e IVA con reglas y deja en revisión solo los casos de baja confianza.",
      stack: ["Python", "PyTorch", "Tesseract", "LayoutLM", "FastAPI", "AWS Lambda"],
      metrics: [["Precisión campo", "97.4 %"], ["Revisión manual", "−82 %"], ["Docs/mes", "1.200"]],
      repo: "https://github.com/ortzigaraio",
      live: null,
      cover: null,
      shots: [null, null, null]
    },
    {
      id: "demanda-energia",
      title: "Previsión de Demanda",
      year: 2025,
      role: "Data Scientist",
      summary: "Modelo de previsión horaria de demanda eléctrica con variables meteorológicas.",
      problem: "La planificación usaba la media de semanas anteriores y fallaba en festivos y olas de calor.",
      solution: "Gradient boosting con calendario, temperatura y lags, validado con backtesting por ventanas. Seguimiento de experimentos en MLflow y panel en Streamlit.",
      stack: ["Python", "LightGBM", "Pandas", "MLflow", "Streamlit", "Plotly"],
      metrics: [["MAPE", "3.1 %"], ["Horizonte", "72 h"], ["Mejora vs. base", "−41 %"]],
      repo: "https://github.com/ortzigaraio",
      live: null,
      cover: null,
      shots: [null, null]
    },
    {
      id: "nlp-resenas",
      title: "Lector de Reseñas",
      year: 2024,
      role: "NLP · Visualización",
      summary: "Clasificación de temas y sentimiento en reseñas de clientes, en castellano y euskera.",
      problem: "Miles de reseñas al mes sin leer: nadie sabía qué quejas crecían.",
      solution: "Transformer multilingüe ajustado para aspecto + sentimiento y un panel en Power BI con tendencias semanales por tema.",
      stack: ["Python", "Transformers", "Scikit-Learn", "spaCy", "Power BI"],
      metrics: [["F1 macro", "0.87"], ["Idiomas", "2"], ["Reseñas", "48k"]],
      repo: "https://github.com/ortzigaraio",
      live: null,
      cover: null,
      shots: [null, null, null]
    }
  ],

  /* Hard skills: nivel 0–5 (se dibuja como matriz de puntos). */
  skills: [
    { group: "Lenguajes", items: [["Python", 5], ["SQL", 5], ["JavaScript", 3], ["R", 3], ["Spark", 3]] },
    { group: "ML / IA", items: [["PyTorch", 4], ["Scikit-Learn", 5], ["Transformers", 4], ["LangChain", 4], ["RAG / KAG", 4]] },
    { group: "Datos", items: [["Neo4j", 3], ["Qdrant", 4], ["pgvector", 4], ["Pandas", 5], ["MLflow", 4]] },
    { group: "Infra", items: [["Docker", 4], ["AWS", 3], ["Git", 5], ["FastAPI", 4], ["MCP", 4]] },
    { group: "Visualización", items: [["Streamlit", 4], ["Power BI", 4], ["Plotly", 4]] }
  ],

  /* ---------- Ejemplos de dirección visual (seleccionables en "Laboratorio") ---------- */
  palettes: {
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
    palette: "carbon",
    font: "stamp",
    effect: "ascii",
    density: 1,          // multiplicador del tamaño de celda (0.6 – 1.6)
    bullet: true,        // bala sí / no
    barrelBg: "black",
    field: true,         // fondo animado de caracteres
    music: 0             // pista inicial del reproductor
  }
};
