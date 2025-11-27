/**
 * CreatorOS Branding Kit
 * -----------------------------------------------------------
 * Zentraler Brand-Definitionen Hub für die gesamte App.
 * Jede UI-Komponente kann diese Konstanten importieren,
 * um Farben, Texte und Guidelines konsistent zu halten.
 */

export const creatorOSBranding = {
  name: "CreatorOS",
  shortName: "COS",
  tagline: "The Operating System for Modern Creators.",
  palette: {
    primary: "#6C47FF",
    accent1: "#8F6BFF",
    accent2: "#B497FF",
    background: "#0D0D0F",
    panel: "#1A1A1E",
    text: "#ECECEC",
    textMuted: "#A0A0A5",
    success: "#4CFFB3",
    danger: "#FF5C5C",
    warning: "#FFCC4D"
  },
  gradients: {
    primaryCTA: "linear-gradient(135deg, #6C47FF 0%, #8F6BFF 50%, #B497FF 100%)",
    panelGlow: "linear-gradient(180deg, rgba(108,71,255,0.25), rgba(13,13,15,0))"
  },
  typography: {
    primaryFont: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    usage: {
      headings: "Inter Bold / SemiBold, Tracking +0.5%",
      body: "Inter Regular, 16px/150%",
      captions: "Inter Medium, 13px/140% muted color"
    }
  },
  logos: {
    textLogo: {
      name: "CreatorOS Wordmark",
      description: "Set in Inter Bold with subtle tracking, uppercase CREATOR with lighter OS suffix.",
      usage: "Sidebar top, login hero, PDF exports."
    },
    iconLogo: {
      name: "COS Glyph",
      description: "Rounded square badge, gradient background (#6C47FF → #B497FF) with white COS letters.",
      usage: "Favicon, loading indicators, share thumbnails."
    }
  },
  brandingRules: {
    do: [
      "Nutze die Purple-Gradient-Buttons für primäre CTAs.",
      "Halte ausreichend Kontrast zwischen Text und Hintergrund.",
      "Verwende abgerundete 8px Cards mit subtiler Shadow.",
      "Setze Tone-of-Voice Guidelines in allen Texten um."
    ],
    dont: [
      "Keine rein weißen Hintergründe verwenden.",
      "Keine zufälligen Farbverläufe oder Neonfarben mischen.",
      "Kein verspielter oder informeller Ton in Produkttexten.",
      "Keine Capitalization-Mischung im Logo (immer CreatorOS)."
    ]
  },
  toneOfVoice: {
    pillars: [
      "Professionell und beratend",
      "Modern & leicht futuristisch",
      "Datengetrieben, aber zugänglich",
      "Motivierend statt belehrend"
    ],
    guidance: [
      "Sprich Creators auf Augenhöhe an (du/ihr in DE, you im EN Kontext).",
      "Vermeide Jargon ohne Erklärung, setze stattdessen präzise Benefits.",
      "Nutze aktive Formulierungen („Skaliere schneller“, „Analysiere tiefer“).",
      "Transportiere Vertrauen durch Fakten, nicht durch Übertreibung."
    ]
  },
  marketingSlogans: [
    "The Operating System for Modern Creators.",
    "Your entire creator workflow — powered by AI.",
    "Upload. Analyze. Create. Grow.",
    "Create smarter. Scale faster.",
    "From raw data to viral content in minutes.",
    "Every insight. Every asset. One OS.",
    "Command center for TikTok, IG & YouTube.",
    "AI copilots for every creative step.",
    "Turn creator chaos into clarity.",
    "Make content decisions backed by data.",
    "Creator-grade analytics meets AI automation.",
    "One hub for DNA, ideas, scripts and launches.",
    "Trusted intelligence for modern creator teams.",
    "Strategize, script, schedule — in CreatorOS.",
    "Unify insights, execution and growth.",
    "Creator pipelines, automated.",
    "See patterns, act faster, ship daily.",
    "The control room for cross-platform virality.",
    "Precision analytics and AI craft in one suite.",
    "Scale creative output without losing your voice."
  ],
  webCopy: {
    hero: {
      title: "CreatorOS — The Operating System for Modern Creators.",
      subtitle:
        "Eine AI-native Plattform, die deinen gesamten Content-Workflow verbindet: Upload, Analyse, Creator DNA, Ideen, Skripte, Hooks, Captions, Kalender & Team.",
      primaryCTA: "Jetzt CreatorOS testen",
      secondaryCTA: "Produkt-Tour ansehen"
    },
    about: {
      title: "Warum CreatorOS?",
      body: [
        "CreatorOS vereint professionelle Analyse-Tools mit AI-Automation, damit Teams Content schneller und konsistenter liefern.",
        "Vom TikTok JSON Upload über Creator DNA Profile bis zu Batch-Generatoren und Kalendern: jede Funktion ist auf skalierende Social Brands ausgelegt.",
        "Security, Multi-Workspace und geteilte Styleguides sorgen dafür, dass CreatorOS auch für Agenturen und größere Teams funktioniert."
      ]
    },
    features: [
      {
        title: "Upload & Analyze",
        description:
          "Importiere komplette TikTok/Instagram Exporte, erkenne automatisch echte Creator-Videos und erhalte Best Times, Virality Insights und Creator DNA Scores."
      },
      {
        title: "Creator DNA Wizard",
        description:
          "Lerne deine einzigartige Tonalität, Storytelling-Muster und Signature Hooks kennen – inklusive automatisierter Guidelines für andere Teammitglieder."
      },
      {
        title: "AI Content Studio",
        description:
          "Batch Generator, Hooks, Scripts, Captions, Titles und Trend Finder – alle Tools greifen auf deine Creator DNA und aktuelle Performance-Daten zu."
      },
      {
        title: "Operating Calendar",
        description:
          "Plane, tagge und tracke Content-Status von Idea bis Published. Verbinde Insights mit Produktionsaufgaben und Team-Kommentaren."
      }
    ],
    faq: [
      {
        question: "Welche Plattformen unterstützt CreatorOS?",
        answer: "Aktuell TikTok (vollständig), Instagram und Facebook (Beta). YouTube & Shorts folgen in der nächsten Iteration."
      },
      {
        question: "Wer nutzt CreatorOS?",
        answer:
          "Creator-Teams, Agenturen, Social-Media-Manager und Influencer, die datengetriebene Content-Workflows aufsetzen möchten."
      },
      {
        question: "Brauche ich Coding Skills?",
        answer:
          "Nein. CreatorOS funktioniert komplett no-code. Upload, Analyse und AI-Generatoren lassen sich per UI oder API nutzen."
      }
    ]
  }
};

export default creatorOSBranding;

