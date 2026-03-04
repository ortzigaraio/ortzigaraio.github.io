import React from 'react';
import { Card, CardHeader, CardContent, Typography, Box } from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const ortziCode = `const ortzi = {
  pronouns: "He" | "Him",
  role: "Data Scientist & AI Enthusiast",
  
  focus: ["Generative AI", "RAG Systems", "AI Agents","Prompt Engineering"],
  
  code: ["Python", "SQL", "JavaScript", "R", "Spark"],
  
  askMeAbout: {
    classic: ["Machine Learning", "Deep Learning", "NLP"],
    architectures: ["CNN", "RNN", "Transformers"],
    modern_stack: ["RAG", "Autonomous Agents", "MCP (Model Context Protocol)"]
  },

  technologies: {
    frameworks: ["PyTorch", "Scikit-Learn", "LangChain"],
    tools: ["Docker", "AWS", "Git", "MLflow", "Power Automate"],
    visualization: ["Streamlit", "Power BI", "Plotly"]
  }
};`;

const About = (props) => {
  const { about } = props || {};
  const { start, exit } = about || {};

  return (
    <Box id="about" sx={{ my: 4 }}>
      <Card sx={{ backgroundColor: '#263238', color: '#f5f5f5', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
        <CardHeader
          sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px' }}
          avatar={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box component="span" sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff5f56', mr: 1 }} />
              <Box component="span" sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ffbd2e', mr: 1 }} />
              <Box component="span" sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#27c93f' }} />
            </Box>
          }
        />
        <CardContent sx={{ fontSize: '110%', lineHeight: '150%', backgroundColor: '#F9F9F9', color: '#333', p: '1.5rem 2rem' }}>
          <Typography variant="body1" paragraph sx={{ fontWeight: 500 }}>
            {start}
          </Typography>
          <Typography variant="body1" paragraph>
            {exit}
          </Typography>
          <Box sx={{ mt: 4, borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <SyntaxHighlighter language="javascript" style={vscDarkPlus} customStyle={{ margin: 0, padding: '1.5rem', fontSize: '0.9rem' }}>
              {ortziCode}
            </SyntaxHighlighter>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default About;
