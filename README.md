<p align="center">
  <h1 align="center">Hi 👋, I'm <a href="https://github.com/ortzigaraio">Ortzi Garaio</a></h1>
</p>

<p align="center">
  <a align="center" href="https://github.com/DenverCoder1/readme-typing-svg">
    <img src="https://readme-typing-svg.herokuapp.com?&font=IBM+Plex+Sans&color=38BDF8&size=25&lines=Data+Scientist;AI+Enthusiast;Machine+Learning+%26+NLP;Turning+Data+into+Impact" />
  </a>
</p>

<p>
Soy un apasionado de la <b>Ciencia de Datos</b> y la <b>Inteligencia Artificial</b>. Me gusta construir soluciones claras y mantenibles que conecten buenos modelos con problemas de negocio reales y medibles.
</p>

<ul>
  <li>👋 Hola, soy @ortzigaraio</li>
  <li>❤️ Me encanta el Modelado Predictivo y la Visualización de Datos.</li>
  <li>🌱 Actualmente profundizando en NLP, Transformers y arquitecturas en AWS.</li>
  <li>💼 Data Scientist enfocado en transformar datos complejos en historias visuales.</li>
  <li>🧐 Portfolio: <a href="https://ortzigaraio.github.io">ortzigaraio.github.io</a></li>
</ul>

#### 🛠️ My Data Science Stack
```javascript
const ortzi = {
  pronouns: "He" | "Him",
  code: ["Python", "R", "SQL", "JavaScript"],
  askMeAbout: ["machine learning", "deep learning", "nlp", "data viz"],
  technologies: {
    libraries: ["Pandas", "Scikit-Learn", "PyTorch", "Plotly"],
    visualization: ["Matplotlib", "Seaborn", "Power BI", "Streamlit"],
    cloud: ["AWS", "Docker"]
  }
}


graph TD
    A[📊 Sensores IoT<br/>Telemetría] --> B[🔌 Kafka<br/>topic: telemetria]
    
    B --> C[Spark Structured Streaming<br/>Zeppelin Notebook]
    
    C --> D{🔄 Procesamiento<br/>en tiempo real?}
    
    D -->|Raw Data| E[🏭 Bronze Layer<br/>HDFS<br/>/datalake/bronze/telemetry<br/>dt=YYYY-MM-DD/hour=HH<br/>part-*.json]
    
    D -->|Limpieza + Tipado| F[🧼 Silver Layer<br/>HDFS<br/>/datalake/silver/]
    
    F --> F1[silver_telemetry<br/>dt=YYYY-MM-DD<br/>part-*.parquet<br/>ts, device_id, location,<br/>metric, value, status]
    F --> F2[silver_alerts<br/>dt=YYYY-MM-DD<br/>part-*.parquet<br/>alert_ts, device_id,<br/>metric, severity, reason]
    
    C --> G[📈 Generación Alertas<br/>3 tipos]
    
    G --> G1[Umbral fuera rango<br/>min_ok/max_ok<br/>desde metrics.json]
    G --> G2[Picos/Spikes<br/>Ventanas temporales]
    G --> G3[Dispositivos Offline<br/>X minutos sin datos]
    
    G1 --> F2
    G2 --> F2
    G3 --> F2
    
    F --> H[🐝 Hive Metastore<br/>Tablas externas<br/>PARTITIONED BY dt]
    
    H --> H1[bronze_telemetry_raw<br/>→ /datalake/bronze/…]
    H --> H2[silver_telemetry<br/>→ /datalake/silver/telemetry/…]
    H --> H3[silver_alerts<br/>→ /datalake/silver/alerts/…]
    
    C --> I[📊 Capa Gold<br/>HDFS<br/>/datalake/gold/]
    
    I --> I1[gold_kpi_hourly<br/>dt=YYYY-MM-DD<br/>hour_ts, metric, location,<br/>avg_value, max_value, p95,<br/>alert_count]
    I --> I2[gold_kpi_daily<br/>dt=YYYY-MM-DD<br/>metric, location,<br/>avg_value, devices_reporting,<br/>alerts_total]
    
    H --> J[Spark SQL<br/>Zeppelin/Hue<br/>10+ consultas analíticas]
    
    J --> K[📈 KPIs & Dashboards<br/>• Media/hora por ubicación<br/>• Top dispositivos problemáticos<br/>• Tendencias métricas<br/>• Alertas por severidad]
    
    L[📁 Dimensiones estáticas<br/>HDFS /dimensions/]<br/>devices.json<br/>locations.json<br/>metrics.json
    L --> C
    L --> G
    
    style A fill:#e8f5e8
    style B fill:#fff3e0
    style C fill:#e1f5fe
    style E fill:#f3e5f5
    style F fill:#fce4ec
    style H fill:#fff3cd
    style I fill:#d1ecf1
    style J fill:#e1f5fe
    style K fill:#f3e5f5
    style L fill:#f8f9fa
