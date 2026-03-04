import React from 'react';
import { Box, Button, Chip, Container, Stack, Typography } from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SecurityIcon from '@mui/icons-material/Security';
import { useLang } from '../utils/i18n';
import { withUtm } from '../utils/withUtm';

const UI = {
  en: {
    h1_a: 'Turning ',
    h1_b: 'Data into Impact ',
    h1_c: 'Effectively',
    sub: 'I build clear, maintainable solutions that connect good models with real, measurable business problems. Focused on Generative AI, RAG, and Agents.',
    bullets: [
      { icon: <RocketLaunchIcon />, label: 'Generative AI' },
      { icon: <AutoAwesomeIcon />, label: 'RAG Systems & Agents' },
      { icon: <SecurityIcon />, label: 'Predictive Modeling' },
    ],
    ctaPrimary: 'Get in Touch',
    ctaSecondary: 'View Projects',
    subject: 'Contact form',
    seenIn: 'Working on',
  },
  es: {
    h1_a: 'Transformando ',
    h1_b: 'Datos en Impacto ',
    h1_c: 'Real',
    sub: 'Construyo soluciones claras y mantenibles que conectan buenos modelos con problemas de negocio reales y medibles. Enfocado en IA Generativa, RAG y Agentes.',
    bullets: [
      { icon: <RocketLaunchIcon />, label: 'IA Generativa' },
      { icon: <AutoAwesomeIcon />, label: 'Sistemas RAG & Agentes' },
      { icon: <SecurityIcon />, label: 'Modelado Predictivo' },
    ],
    ctaPrimary: 'Contactar',
    ctaSecondary: 'Ver proyectos',
    subject: 'Contacto',
    seenIn: 'Trabajando en',
  },
};

export default function Hero() {
  const [lang] = useLang();
  const t = UI[lang] || UI.en;
  const EMAIL = process.env.EMAIL || '';
  const mailHref = EMAIL
    ? withUtm(`mailto:${EMAIL}?subject=${encodeURIComponent(t.subject)}`, 'hero_cta')
    : '#';

  return (
    <Box
      sx={(theme) => ({
        position: 'relative',
        color: '#fff',
        py: { xs: 8, md: 12 },
        // Layered gradients for a premium look
        background: `radial-gradient(1200px 600px at 20% -10%, ${theme.palette.secondary.main}33, transparent 60%),
                     linear-gradient(180deg, ${theme.palette.primary.main} 0%, #0b1220 60%, #08101a 100%)`,
        overflow: 'hidden',
      })}
    >
      {/* subtle glow ornament */}
      <Box sx={{
        position: 'absolute',
        width: 280,
        height: 280,
        right: -80,
        top: -80,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.35) 0%, rgba(6,182,212,0) 60%)',
        filter: 'blur(6px)',
        pointerEvents: 'none',
      }} />

      <Container maxWidth="lg">
        <Stack spacing={4} alignItems="center" textAlign="center">
          {/* Headline with gradient-highlight */}
          <Typography variant="h1" sx={{ fontWeight: 900, letterSpacing: -1, lineHeight: 1.1, fontSize: { xs: 36, md: 56 } }}>
            {t.h1_a}
            <Box component="span" sx={{
              background: (th) => `linear-gradient(90deg, ${th.palette.secondary.main}, #7dd3fc)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              textShadow: '0 0 24px rgba(125,211,252,.25)'
            }}>
              {t.h1_b}
            </Box>
            {t.h1_c}
          </Typography>

          {/* Subheadline */}
          <Typography sx={{ maxWidth: 900, fontSize: { xs: 16, md: 18 }, color: 'rgba(255,255,255,.86)' }}>
            {t.sub}
          </Typography>

          {/* Proof points */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center" justifyContent="center">
            {t.bullets.map((b, i) => (
              <Chip key={i} icon={b.icon} label={b.label} color="default" sx={{
                bgcolor: 'rgba(255,255,255,0.12)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.25)',
                fontWeight: 700,
              }} />
            ))}
          </Stack>

          {/* CTAs */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button href={mailHref} variant="contained" color="secondary" size="large" aria-label={t.ctaPrimary}>
              {t.ctaPrimary}
            </Button>
            <Button component="a" href="/projects" variant="outlined" size="large" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,.5)' }}>
              {t.ctaSecondary}
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

