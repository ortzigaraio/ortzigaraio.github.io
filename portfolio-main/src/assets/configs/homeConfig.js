import React from "react";
import { BsClipboardData } from "react-icons/bs";
import { DiCodeigniter } from "react-icons/di";
import { GiCommercialAirplane } from "react-icons/gi";
import { FaMobileAlt } from "react-icons/fa";
import { BiRocket } from "react-icons/bi";

const homeConfig = {
  greeting_i18n: {
    en: (
      <h1 className="heading">
        Hi 👋, I'm <strong className="main-name"> Ortzi Garaio</strong>
      </h1>
    ),
    es: (
      <h1 className="heading">
        ¡Hola 👋! Soy <strong className="main-name"> Ortzi Garaio</strong>
      </h1>
    ),
  },

  titles_i18n: {
    en: [
      "Data Scientist",
      "AI Enthusiast",
      "Machine Learning & NLP",
      "Turning Data into Impact",
    ],
    es: [
      "Científico de Datos",
      "Entusiasta de la IA",
      "Machine Learning & NLP",
      "Transformando Datos en Impacto",
    ],
  },

  about_i18n: {
    en: {
      start:
        "I am passionate about Data Science and Artificial Intelligence. I like building clear and maintainable solutions that connect good models with real, measurable business problems.",
      exit:
        "I love Predictive Modeling, finding insights, and I'm currently diving deep into RAG, OCR, and AWS-Docker architectures.",
    },
    es: {
      start:
        "Soy un apasionado de la Ciencia de Datos y la Inteligencia Artificial. Me gusta construir soluciones claras y mantenibles que conecten buenos modelos con problemas de negocio reales y medibles.",
      exit:
        "Me encanta el Modelado Predictivo, sacar conclusiones de ello y actualmente estoy profundizando en RAG, OCR y arquitecturas en AWS-Docker.",
    },
  },


  workTimeline: [
    {
      id: "work-4",
      title: "Sr ML Engineer",
      title_i18n: { en: "Sr ML Engineer", es: "Sr ML Engineer" },
      company: "EPAM",
      description_i18n: {
        en: "Working to build scalable ML solutions, LLMs, and RAG architectures.",
        es: "Construyo soluciones de ML escalables, LLMs y arquitecturas RAG.",
      },
      date: "2023-Present",
      icon: <BiRocket />,
      tags: ["ml", "mlops", "python", "azure", "llm", "automl"],
    },
    {
      id: "work-3",
      title: "Sr Data Scientist",
      title_i18n: { en: "Sr Data Scientist", es: "Sr Data Scientist" },
      company: "Globant",
      description_i18n: {
        en: "Built AutoML models and made them available to non-technical users from a graphical interface.",
        es: "Construí modelos AutoML y los hice accesibles para usuarios no técnicos desde una interfaz gráfica.",
      },
      date: "2021-2023",
      icon: <DiCodeigniter />,
      tags: ["ml", "automl", "python", "docker", "redshift", "superset"],
    },
    {
      id: "work-2",
      title: "BI Manager",
      title_i18n: { en: "BI Manager", es: "BI Manager" },
      company: "Rappi",
      description_i18n: {
        en: "Led a team of analysts and data scientists delivering ETLs, data lakes/warehouses, and ML models.",
        es: "Lideré un equipo de analistas y científicos de datos para ejecutar proyectos de ETLs, data lakes/warehouses y modelos de ML.",
      },
      date: "2019-2021",
      icon: <FaMobileAlt />,
      tags: ["ml", "airflow", "python", "docker", "snowflake", "postgres", "azure"],
    },
    {
      id: "work-1",
      title: "CRM Analytics Coordinator",
      title_i18n: { en: "CRM Analytics Coordinator", es: "Coordinador de Analítica CRM" },
      company: "Avianca",
      description_i18n: {
        en: "Tech lead for BI, Data Science and DBA team. Built forecasting models, a data warehouse and Power BI dashboards.",
        es: "Líder técnico de un equipo de BI, Ciencia de Datos y DBAs. Construí modelos de pronóstico, data warehouses y tableros en Power BI.",
      },
      date: "2018-2019",
      icon: <GiCommercialAirplane />,
      tags: ["ml", "mssql", "python", "docker", "pbi", "azure"],
    },
    {
      id: "work-0",
      title: "BI Analyst",
      title_i18n: { en: "BI Analyst", es: "Analista de BI" },
      company: "Onelink BPO",
      description_i18n: {
        en: "Built interactive dashboards, ETLs and SQL queries to show company KPIs.",
        es: "Construí tableros interactivos, ETLs y consultas SQL para mostrar los KPIs de la compañía.",
      },
      date: "2016-2018",
      icon: <BsClipboardData />,
      tags: ["python", "mssql", "pbi", "excel"],
    },
  ],
};

export default homeConfig;
