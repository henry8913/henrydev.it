import { type CSSProperties, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

type FileId =
  | 'home.tsx'
  | 'about.html'
  | 'skills.json'
  | 'resume.ts'
  | 'portfolio.js'
  | 'certifications.js'
  | 'contact.css'
  | 'blog.html'
  | 'README.md'
  | 'resume.pdf'
  | 'index.html'

type FileEntry = {
  id: FileId
  label: string
  kind: 'file'
  ext: 'tsx' | 'html' | 'js' | 'json' | 'ts' | 'css' | 'md' | 'pdf'
}

type FolderEntry = {
  id: 'PORTFOLIO'
  label: string
  kind: 'folder'
  children: FileEntry[]
}

type PortfolioCategory = 'Web Development' | 'Applications' | 'Web Design'
type PortfolioFilter = 'All' | PortfolioCategory
type PortfolioProject = {
  title: string
  category: PortfolioCategory
  description: string
  cover?: string
  github?: string
  live?: string
}
type PortfolioContent = {
  title: string
  metaLine: string
  subtitle: string
  filters: readonly PortfolioFilter[]
  projects: readonly PortfolioProject[]
}

type CertificationItem = {
  title: string
  category: string
  year: string
  description: string
  cover: string
}

type BlogPostItem = {
  cover: string
  category: string
  dateISO: string
  dateLabel: string
  title: string
  excerpt: string
}

type ChatRole = 'user' | 'assistant'
type ChatMessage = {
  id: string
  role: ChatRole
  content: string
}

type ChatThread = {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

type TerminalEntryKind = 'cmd' | 'out' | 'err'
type TerminalEntry = {
  id: string
  kind: TerminalEntryKind
  text: string
  cwd?: string
}

const THEME_NAMES = [
  'Dark (Visual Studio)',
  'Solarized Dark',
  'Red',
  'Kimbie Dark',
  'Dark High Contrast',
] as const
type ThemeName = (typeof THEME_NAMES)[number]

const THEME_VARS: Record<ThemeName, Record<string, string>> = {
  'Dark (Visual Studio)': {
    '--vscode-bg': '#1e1e1e',
    '--vscode-fg': '#d4d4d4',
    '--vscode-muted': '#9da0a6',
    '--vscode-border': '#2a2a2a',
    '--vscode-elev': '#252526',
    '--vscode-elev-2': '#2d2d2d',
    '--vscode-tab': '#2d2d2d',
    '--vscode-tab-active': '#1e1e1e',
    '--vscode-accent': '#007acc',
    '--vscode-accent-2': '#c586c0',
    '--vscode-green': '#6a9955',
    '--vscode-orange': '#ce9178',
    '--vscode-blue': '#4fc1ff',
    '--vscode-pink': '#d16d9e',
    '--statusbar-bg': '#007acc',
    '--focus-ring': '0 0 0 2px rgba(0, 122, 204, 0.35)',
    colorScheme: 'dark',
  },
  'Solarized Dark': {
    '--vscode-bg': '#002b36',
    '--vscode-fg': '#93a1a1',
    '--vscode-muted': '#839496',
    '--vscode-border': '#073642',
    '--vscode-elev': '#073642',
    '--vscode-elev-2': '#0b3c49',
    '--vscode-tab': '#073642',
    '--vscode-tab-active': '#002b36',
    '--vscode-accent': '#268bd2',
    '--vscode-accent-2': '#b58900',
    '--vscode-green': '#859900',
    '--vscode-orange': '#cb4b16',
    '--vscode-blue': '#2aa198',
    '--vscode-pink': '#d33682',
    '--statusbar-bg': '#268bd2',
    '--focus-ring': '0 0 0 2px rgba(38, 139, 210, 0.4)',
    colorScheme: 'dark',
  },
  Red: {
    '--vscode-bg': '#2b0b0b',
    '--vscode-fg': '#f1dada',
    '--vscode-muted': '#caa7a7',
    '--vscode-border': '#4c1919',
    '--vscode-elev': '#351010',
    '--vscode-elev-2': '#421515',
    '--vscode-tab': '#421515',
    '--vscode-tab-active': '#2b0b0b',
    '--vscode-accent': '#ff5a5a',
    '--vscode-accent-2': '#ffb4b4',
    '--vscode-green': '#7ee787',
    '--vscode-orange': '#ff9b6a',
    '--vscode-blue': '#79c0ff',
    '--vscode-pink': '#ff77aa',
    '--statusbar-bg': '#b3261e',
    '--focus-ring': '0 0 0 2px rgba(255, 90, 90, 0.45)',
    colorScheme: 'dark',
  },
  'Kimbie Dark': {
    '--vscode-bg': '#221a0f',
    '--vscode-fg': '#d3af86',
    '--vscode-muted': '#b39b7d',
    '--vscode-border': '#3a2f21',
    '--vscode-elev': '#2a2216',
    '--vscode-elev-2': '#33291c',
    '--vscode-tab': '#33291c',
    '--vscode-tab-active': '#221a0f',
    '--vscode-accent': '#f06431',
    '--vscode-accent-2': '#f2c35e',
    '--vscode-green': '#889b4a',
    '--vscode-orange': '#dc9656',
    '--vscode-blue': '#7e9fc9',
    '--vscode-pink': '#c07a8a',
    '--statusbar-bg': '#a35b1f',
    '--focus-ring': '0 0 0 2px rgba(240, 100, 49, 0.45)',
    colorScheme: 'dark',
  },
  'Dark High Contrast': {
    '--vscode-bg': '#000000',
    '--vscode-fg': '#ffffff',
    '--vscode-muted': '#d0d0d0',
    '--vscode-border': '#bfbfbf',
    '--vscode-elev': '#0b0b0b',
    '--vscode-elev-2': '#111111',
    '--vscode-tab': '#111111',
    '--vscode-tab-active': '#000000',
    '--vscode-accent': '#ffb000',
    '--vscode-accent-2': '#00ffff',
    '--vscode-green': '#00ff00',
    '--vscode-orange': '#ffb000',
    '--vscode-blue': '#00b7ff',
    '--vscode-pink': '#ff4dff',
    '--statusbar-bg': '#000000',
    '--focus-ring': '0 0 0 2px rgba(255, 176, 0, 0.55)',
    colorScheme: 'dark',
  },
}

const THEME_STORAGE_KEY = 'henrydev.theme.v1'

function loadThemeFromStorage(): ThemeName {
  if (typeof window === 'undefined') return 'Dark (Visual Studio)'
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (!raw) return 'Dark (Visual Studio)'
    const parsed: unknown = JSON.parse(raw)
    const name = typeof parsed === 'string' ? parsed : parsed && typeof parsed === 'object' ? (parsed as { name?: unknown }).name : null
    if (typeof name === 'string' && (THEME_NAMES as readonly string[]).includes(name)) return name as ThemeName
    return 'Dark (Visual Studio)'
  } catch {
    return 'Dark (Visual Studio)'
  }
}

function saveThemeToStorage(name: ThemeName) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ version: 1, name }))
  } catch {
    return
  }
}

const FILE_TREE: FolderEntry = {
  id: 'PORTFOLIO',
  label: 'HENRYDEV.IT',
  kind: 'folder',
  children: [
    { id: 'home.tsx', label: 'home.tsx', kind: 'file', ext: 'tsx' },
    { id: 'about.html', label: 'about.html', kind: 'file', ext: 'html' },
    { id: 'skills.json', label: 'skills.json', kind: 'file', ext: 'json' },
    { id: 'resume.ts', label: 'resume.ts', kind: 'file', ext: 'ts' },
    { id: 'portfolio.js', label: 'portfolio.js', kind: 'file', ext: 'js' },
    { id: 'certifications.js', label: 'certifications.js', kind: 'file', ext: 'js' },
    { id: 'contact.css', label: 'contact.css', kind: 'file', ext: 'css' },
    { id: 'blog.html', label: 'blog.html', kind: 'file', ext: 'html' },
    { id: 'index.html', label: 'index.html', kind: 'file', ext: 'html' },
    { id: 'resume.pdf', label: 'resume.pdf', kind: 'file', ext: 'pdf' },
    { id: 'README.md', label: 'README.md', kind: 'file', ext: 'md' },
  ],
}

const CONTENT = {
  siteName: 'henrydev.it',
  profile: {
    firstName: 'Henry',
    lastName: 'Grecchi',
    roles: ['Full Stack Developer', '.NET', 'MERN'],
    companyBadge: {
      label: '@HenryAI',
    },
    tagline:
      'Software Developer in contesto internazionale, con focus su .NET e stack MERN.',
    stats: [
      { value: '1+', label: 'YEARS' },
      { value: '50+', label: 'PROJECTS' },
      { value: '∞', label: 'CURIOSITY' },
      { value: '↑', label: 'ALWAYS LEARNING' },
    ],
  },
  home: {
    heading: '',
    paragraphs: [
      'Buongiorno, mi chiamo Henry Grecchi e sono un Software Developer attualmente inserito in un contesto aziendale internazionale.',
      'La mia esperienza professionale odierna si focalizza sullo sviluppo di soluzioni enterprise in ambiente Microsoft .NET. Parallelamente, possiedo una specializzazione nello stack MERN, che mi permette di progettare applicazioni web moderne, responsive e scalabili.',
      "Ciò che mi distingue è l'unione tra queste basi tecniche e oltre dieci anni di esperienza a contatto con il pubblico. Questa maturità mi ha permesso di affinare competenze trasversali fondamentali orientate al risultato.",
    ],
    mainSkills: [
      {
        title: 'Backend Development (.NET & Node)',
        description:
          "Gestione dell'intero ciclo di vita del software: dall'integrazione di API REST alla gestione di database SQL Server (C#, Visual Studio) e MongoDB (Node.js, Express).",
      },
      {
        title: 'Frontend Development (MERN)',
        description:
          'Progettazione di interfacce web moderne, responsive e scalabili sfruttando React, Bootstrap e JavaScript (ES6+).',
      },
    ],
    featuredProjects: [
      {
        title: 'RMI Made in Italy',
        description:
          "Piattaforma completa dedicata al restauro, personalizzazione e manutenzione di auto d'epoca di lusso. Include front-end React, back-end Node.js e assistente AI.",
      },
      {
        title: 'Evergreen Resort',
        description:
          'Sistema completo di gestione alberghiera (PMS) abbinato a un portale web. Combina backend .NET 8 con frontend elegante e reattivo.',
      },
      {
        title: 'HenryAI',
        description:
          'Bot Discord che simula il comportamento di un membro umano in una community di sviluppatori, progettato per interagire in modo naturale.',
      },
      {
        title: 'EPICBooks',
        description:
          'E-commerce di libri online: API, ricerca avanzata, gestione del carrello, pagamento e design reattivo.',
      },
    ],
    quickContacts: [
      { label: 'Email', value: 'henry8913@hotmail.it', href: 'mailto:henry8913@hotmail.it' },
      {
        label: 'LinkedIn',
        value: 'Henry G.',
        href: 'https://www.linkedin.com/in/henry-g-full-web-stack-developer/',
      },
    ],
  },
  about: {
    title: 'About Me ✨',
    metaLine: '<!-- about.html - Henry Grecchi -->',
    subtitle: 'who I am · what I do · where I build',
    intro: [
      {
        text: 'Full Stack Developer inserito in un contesto aziendale internazionale, specializzato nello sviluppo di soluzioni applicative in ambiente Microsoft .NET (C#, SQL Server).',
        strong: 'Microsoft .NET (C#, SQL Server)',
      },
      {
        text: "Parallelamente, porto avanti una forte specializzazione nello stack MERN (React, Node.js, Express, MongoDB) per la creazione di applicazioni web moderne e responsive. La mia forza è l'unione tra queste competenze tecniche e oltre dieci anni di esperienza a contatto con il pubblico, sviluppando competenze comunicative e commerciali, capacità di comprendere le esigenze dei clienti e di collaborare efficacemente con team multidisciplinari e stakeholder.",
        strong: 'MERN (React, Node.js, Express, MongoDB)',
      },
    ],
    journeyTitle: 'Il mio percorso 🚀',
    journey: [
      "La mia esperienza professionale odierna si focalizza sullo sviluppo di soluzioni enterprise, dove gestisco l'intero ciclo di vita del software: dall'integrazione di API REST alla gestione di database SQL Server tramite C# e Visual Studio.",
      'Questa doppia competenza (MERN e .NET) mi consente di muovermi con estrema naturalezza sia su architetture backend robuste che su interfacce frontend dinamiche, garantendo sempre soluzioni scalabili e performanti.',
    ],
    softSkillsTitle: 'Competenze Trasversali 🤝',
    softSkills: [
      {
        title: 'Comunicazione tecnica e di business',
        text: 'Capacità di interfacciarmi con stakeholder e team multidisciplinari.',
      },
      {
        title: 'Analisi dei requisiti',
        text: 'Traduzione delle esigenze del cliente in task operativi e soluzioni digitali efficienti.',
      },
      {
        title: 'Problem solving e organizzazione',
        text: 'Gestione rigorosa di priorità e scadenze, con un approccio sempre orientato al risultato.',
      },
    ],
    developerSkillsTitle: 'Developer Skills 🧰',
    developerSkills: [
      { label: 'Linguaggi & Core', value: 'C#, JavaScript (ES6+), HTML5, CSS3, Python.' },
      { label: 'Frontend', value: 'React, Bootstrap, AJAX, DOM.' },
      { label: 'Backend', value: '.NET, Node.js, Express, REST API.' },
      { label: 'Database', value: 'SQL Server, MongoDB (NoSQL).' },
      { label: 'Strumenti', value: 'Visual Studio, VS Code, GIT.' },
    ],
    valuesTitle: 'I miei valori 🧭',
    values: [
      "Credo fermamente nell'importanza della formazione continua e nella condivisione della conoscenza. Affronto ogni sfida tecnologica con creatività e determinazione, puntando sempre a superare le aspettative.",
      "Per me, il successo di un progetto non si misura solo nell'efficienza del codice, ma soprattutto nell'impatto reale e positivo che le soluzioni digitali riescono ad avere sulle persone e sui processi aziendali.",
    ],
    whatImDoingTitle: "What I'm doing 🛠️",
    services: [
      {
        title: '⚙️ Backend Development',
        text: 'Sviluppo di architetture solide in ambiente Microsoft .NET (C#) e Node.js.',
      },
      {
        title: '🧩 Frontend Development',
        text: 'Progettazione di interfacce dinamiche e responsive sfruttando principalmente lo stack MERN.',
      },
      {
        title: '🔌 API Integration',
        text: 'Sviluppo e integrazione di API REST per soluzioni enterprise e di business.',
      },
      {
        title: '🗄️ Database Management',
        text: 'Gestione avanzata di database relazionali (SQL Server) e NoSQL (MongoDB).',
      },
    ],
  },
  resume: {
    title: 'Experience 🚀',
    metaLine: '// resume.ts - professional journey',
    subtitle: 'interface Career extends Timeline {}',
    experienceTitle: 'Experience 💼',
    educationTitle: 'Education & Specialization 🎓',
    stackTitle: 'Stack & Strumenti 🧰',
    experience: [
      {
        period: '2025 — Presente',
        title: 'Software Developer',
        company: 'International context',
        summary:
          'Attualmente inserito in un contesto aziendale internazionale, focalizzato sullo sviluppo di soluzioni enterprise.',
        tags: ['C#', '.NET', 'SQL Server', 'REST API', 'Stakeholder'],
      },
    ],
    education: [
      {
        period: '2024 — 2025',
        title: 'Full Stack Web Development (MERN)',
        company: 'Education & specialization',
        summary:
          'Forte specializzazione nello stack MERN per la creazione di applicazioni web moderne, responsive e scalabili.',
        tags: ['React', 'Hooks', 'Node.js', 'Express', 'MongoDB'],
      },
      {
        period: '2024',
        title: 'Frontend & Core Technologies',
        company: 'Education',
        summary: 'Consolidamento delle basi di programmazione e sviluppo di interfacce web avanzate.',
        tags: ['JavaScript', 'AJAX', 'DOM', 'HTML5', 'CSS3', 'Git'],
      },
    ],
  },
  portfolio: {
    title: 'Projects 🚀',
    metaLine: "// portfolio.js · things I've built ✨",
    subtitle: 'const projects = [...shipped, ...building]',
    filters: ['All', 'Web Development', 'Applications', 'Web Design'],
    projects: [
      /*{
        title: 'E-Core Hyperdrive',
        category: 'Web Development',
        description:
          "Una piattaforma sviluppata sfruttando la potenza di .NET 10, l'efficacia delle Razor Pages per un'interfaccia dinamica e la leggerezza di SQLite per una gestione dati agile e performante.",
        cover:
          'https://raw.githubusercontent.com/henry8913/E-Core-Hyperdrive/refs/heads/main/img/GitHub%20-%20Cover.png',
        github: 'https://github.com/henry8913/E-Core-Hyperdrive',
      },
      {
        title: 'Evergreen Resort',
        category: 'Web Development',
        description:
          'Un sistema completo di gestione alberghiera (PMS) abbinato a un portale web. Questo progetto combina un backend solido in .NET 8 con un frontend elegante e reattivo.',
        cover:
          'https://raw.githubusercontent.com/henry8913/EvergreenResort/refs/heads/main/EvergreenResort.Api/wwwroot/img/GitHub%20-%20Cover.png',
        github: 'https://github.com/henry8913/EvergreenResort',
      },*/
      {
        title: 'RMI Made in Italy',
        category: 'Web Development',
        description:
          "Piattaforma completa dedicata al restauro, personalizzazione e manutenzione di auto d'epoca di lusso. Include front-end React, back-end Node.js e assistente AI.",
        cover:
          'https://raw.githubusercontent.com/henry8913/7_RMI-Made-in-Italy_Front-end/refs/heads/main/public/img/Screenshot.png',
        live: 'https://7-rmi-made-in-italy-front-end.vercel.app/',
        github: 'https://github.com/henry8913/7_Capstone-Project_RMI-Made-in-Italy.git',
      },
      {
        title: 'HenryAI',
        category: 'Applications',
        description:
          'Bot Discord innovativo che simula il comportamento di un membro umano in una community di sviluppatori. Progettato per interagire in modo naturale, con personalità e comportamenti realistici.',
        cover: 'https://raw.githubusercontent.com/henry8913/HenryAI/refs/heads/main/img/cover.jpg',
        live:
          'https://discord.com/oauth2/authorize?client_id=1348393467402784849&permissions=469814326&integration_type=0&scope=applications.commands+bot',
        github: 'https://github.com/henry8913/HenryAI',
      },
      {
        title: 'Trattoria Bella Italia',
        category: 'Web Development',
        description:
          'Sito web responsive per un ristorante italiano che presenta menu, ambiente e servizi online. Include sezioni per il menu completo, informazioni sul ristorante, recensioni dei clienti e form di contatto.',
        cover:
          'https://github.com/henry8913/Vite-React-project/blob/main/src/assets/images/cover_a.gif?raw=true',
        live: 'https://vite-react-project-ten.vercel.app/',
        github: 'https://github.com/henry8913/Vite-React-project',
      },
      {
        title: 'HyperCar Hub',
        category: 'Web Development',
        description:
          "Demo di piattaforma e-commerce per la visualizzazione e l'acquisto simulato di auto di lusso. Implementa funzionalità di base di un e-commerce con tecnologie web moderne.",
        cover:
          'https://github.com/henry8913/4_JavaScript-Advanced-CH6/blob/main/img/cover_b.jpg?raw=true',
        live: 'https://4-java-script-advanced-ch-6.vercel.app/',
        github: 'https://github.com/henry8913/4_JavaScript-Advanced-CH6',
      },
      {
        title: 'Spotify Clone',
        category: 'Web Development',
        description:
          "Replica elegante dell'interfaccia Spotify con funzionalità di ricerca artisti, visualizzazione album e riproduzione anteprime musicali tramite API Deezer.",
        cover:
          'https://github.com/henry8913/4.1_Build-Week-CH1/blob/Team-1/img/cover_d.jpg?raw=true',
        live: 'https://4-1-build-week-ch-1.vercel.app/',
        github: 'https://github.com/henry8913/4.1_Build-Week-CH1',
      },
      {
        title: 'Clone Airbnb',
        category: 'Web Development',
        description:
          "Replica dell'interfaccia Airbnb con design responsivo, implementata utilizzando moderne tecnologie web per replicare l'esperienza di prenotazione online.",
        cover:
          'https://github.com/henry8913/3.1_Build-Week-CH1/blob/main/assets/img/cover_b.jpg?raw=true',
        live: 'https://3-1-build-week-ch-1.vercel.app/',
        github: 'https://github.com/henry8913/3.1_Build-Week-CH1',
      },
      {
        title: 'Pexels Clone',
        category: 'Web Development',
        description:
          "Applicazione web per la ricerca di immagini con integrazione API di Pexels. Include gestione asincrona delle richieste, visualizzazione dinamica dei risultati e interfaccia reattiva.",
        cover:
          'https://raw.githubusercontent.com/henry8913/4_JavaScript-Advanced-CH3/refs/heads/main/img/cover_b.jpg',
        live: 'https://4-java-script-advanced-ch-3.vercel.app/',
        github: 'https://github.com/henry8913/4_JavaScript-Advanced-CH3',
      },
      {
        title: 'TechAcademy',
        category: 'Web Design',
        description:
          'Progetto di design web avanzato focalizzato su tecniche CSS moderne, includendo Flexbox, Grid e animazioni personalizzate per creare layout responsive e interattivi.',
        cover: 'https://raw.githubusercontent.com/henry8913/3_Web-Design-CH6/refs/heads/main/img/cover.gif',
        live: 'https://3-web-design-ch-6.vercel.app/',
        github: 'https://github.com/henry8913/3_Web-Design-CH6',
      },
      {
        title: 'Soléa',
        category: 'Web Design',
        description:
          "Soléa è un sito innovativo che ti guida nella scoperta di mete da sogno, offrendo un design attraente e un'interfaccia intuitiva, ottimizzato per tutti i dispositivi.",
        cover: 'https://raw.githubusercontent.com/henry8913/3_Web-Design-CH4/refs/heads/main/img/cover.png',
        live: 'https://travel-agency-indol-eight.vercel.app/',
        github: 'https://github.com/henry8913/3_Web-Design-CH4',
      },
      {
        title: 'Henry Music',
        category: 'Web Design',
        description:
          'Studio pratico di pattern di design responsivo utilizzando CSS moderno. Focus su media queries, unità relative e best practices per la manutenibilità del codice.',
        cover: 'https://raw.githubusercontent.com/henry8913/3_Web-Design-CH3/refs/heads/main/img/cover.jpg',
        live: 'https://3-web-design-ch-3.vercel.app/',
        github: 'https://github.com/henry8913/3_Web-Design-CH3',
      },
      {
        title: 'Coming Soon Landing Page',
        category: 'Web Design',
        description:
          'Questo progetto è stato creato per intrattenere gli utenti mentre aspettano il ritorno online del sito principale. Nel frattempo, hanno la possibilità di giocare a Snake.',
        cover: 'https://raw.githubusercontent.com/henry8913/Website-Coming-Soon/refs/heads/main/img/cover.jpg',
        live: 'https://website-coming-soon-rho.vercel.app/',
        github: 'https://github.com/henry8913/Website-Coming-Soon',
      },
      {
        title: 'Acrylic Spider',
        category: 'Applications',
        description:
          'Progetto open-source che gestisce un robot ragno in acrilico, equipaggiato con servomotori, sensori e un mini PC Raspberry Pi. Grazie alla sua struttura modulare consente esplorazioni efficaci.',
        cover:
          'https://raw.githubusercontent.com/henry8913/Acrylic-Spider.py/refs/heads/main/spider.jpg',
        github: 'https://github.com/henry8913/Acrylic-Spider.py',
        live: 'https://github.com/henry8913/Acrylic-Spider.py',
      },
      {
        title: 'REST API Test and UI',
        category: 'Web Development',
        description:
          'Suite di test per API REST con interfaccia utente integrata. Strumento per testare endpoints e visualizzare risposte in tempo reale.',
        cover: 'https://raw.githubusercontent.com/henry8913/REST-API-Test-and-UI/refs/heads/main/img/cover.jpg',
        live: 'https://rest-api-test-and-ui.vercel.app/',
        github: 'https://github.com/henry8913/REST-API-Test-and-UI',
      },
      {
        title: 'EPICBooks',
        category: 'Web Development',
        description:
          'E-commerce di Libri Online: sfrutta le API e offre funzionalità come ricerca avanzata, gestione del carrello, sistema di pagamento e un design reattivo.',
        cover:
          'https://raw.githubusercontent.com/henry8913/4_JavaScript-Advanced-CH4/refs/heads/main/img/cover.b.jpg',
        live: 'https://4-java-script-advanced-ch-4.vercel.app/',
        github: 'https://github.com/henry8913/4_JavaScript-Advanced-CH4',
      },
      {
        title: 'ShushiDev',
        category: 'Applications',
        description:
          'Applicazione per la gestione di ordini di sushi con interfaccia intuitiva. Include sistema di carrello, gestione ordini e integrazione pagamenti.',
        cover:
          'https://raw.githubusercontent.com/henry8913/ShushiDev/refs/heads/main/rolls/static/rolls/cover.jpg',
        live: 'https://shushidev.onrender.com/',
        github: 'https://github.com/henry8913/ShushiDev',
      },
    ],
  },
  projects: [
    {
      name: 'e-core-hyperdrive',
      title: 'E-Core Hyperdrive',
      context:
        'Piattaforma sviluppata con .NET 10 e Razor Pages, con database SQLite per una gestione dati agile e performante.',
      stack: ['.NET 10', 'Razor Pages', 'SQLite'],
      links: [{ label: 'GitHub', href: 'https://github.com/henry8913/E-Core-Hyperdrive' }],
    },
    {
      name: 'evergreen-resort',
      title: 'Evergreen Resort',
      context:
        'Sistema completo di gestione alberghiera (PMS) abbinato a portale web: backend solido in .NET 8 con frontend elegante e reattivo.',
      stack: ['.NET 8', 'Web'],
      links: [{ label: 'GitHub', href: 'https://github.com/henry8913/EvergreenResort' }],
    },
    {
      name: 'rmi-made-in-italy',
      title: 'RMI Made in Italy',
      context:
        "Piattaforma completa dedicata al restauro, personalizzazione e manutenzione di auto d'epoca di lusso. Include front-end React, back-end Node.js e assistente AI.",
      stack: ['React', 'Node.js', 'AI'],
      links: [
        { label: 'Live', href: 'https://7-rmi-made-in-italy-front-end.vercel.app/' },
        { label: 'GitHub', href: 'https://github.com/henry8913/7_Capstone-Project_RMI-Made-in-Italy.git' },
      ],
    },
    {
      name: 'henryai',
      title: 'HenryAI',
      context:
        'Bot Discord che simula il comportamento di un membro umano in una community di sviluppatori, con interazioni naturali e comportamenti realistici.',
      stack: ['Discord', 'Bot'],
      links: [
        {
          label: 'Invite',
          href: 'https://discord.com/oauth2/authorize?client_id=1348393467402784849&permissions=469814326&integration_type=0&scope=applications.commands+bot',
        },
        { label: 'GitHub', href: 'https://github.com/henry8913/HenryAI' },
      ],
    },
    {
      name: 'epicbooks',
      title: 'EPICBooks',
      context:
        'E-commerce di libri online: ricerca avanzata, gestione del carrello, sistema di pagamento e design reattivo.',
      stack: ['JavaScript', 'APIs'],
      links: [{ label: 'GitHub', href: 'https://github.com/henry8913/4_JavaScript-Advanced-CH4' }],
    },
  ],
  skills: {
    stack: [
      { name: 'C# & .NET Environment', level: 85 },
      { name: 'React & JavaScript (ES6+)', level: 90 },
      { name: 'Node.js & Express', level: 85 },
      { name: 'SQL Server & MongoDB', level: 80 },
      { name: 'Visual Studio, VS Code & Git', level: 90 },
    ],
    skills: {
      'Linguaggi & Core': ['C#', 'JavaScript (ES6+)', 'HTML5', 'CSS3', 'Python'],
      Frontend: ['React', 'Bootstrap', 'AJAX', 'DOM'],
      Backend: ['.NET', 'Node.js', 'Express', 'REST API'],
      Database: ['SQL Server', 'MongoDB'],
      Strumenti: ['Visual Studio', 'VS Code', 'Git', 'GitHub'],
    },
  },
  certifications: [
    {
      title: 'Full Stack Developer',
      category: 'Web Developer',
      year: '2025',
      description: 'Sviluppo di applicazioni web moderne e scalabili attraverso vari linguaggi e tecnologie.',
      cover: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
    },
    {
      title: 'Python Intermediate',
      category: 'Python Development',
      year: '2025',
      description: 'Sviluppo di applicazioni, scripting e concetti intermedi del linguaggio Python.',
      cover:
        'https://images.unsplash.com/photo-1649180556628-9ba704115795?q=80&w=2062&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      title: 'AI & GitHub Copilot',
      category: 'AI Development',
      year: '2025',
      description: 'Utilizzo di AI & GitHub Copilot per ottimizzare la produttività e la qualità del codice.',
      cover:
        'https://images.unsplash.com/photo-1711831521065-e546a5aca68e?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      title: 'Backend Development & APIs',
      category: 'Web Developer',
      year: '2025',
      description: 'Node.js, Express, MongoDB, e sviluppo di API RESTful.',
      cover: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
    },
    {
      title: 'React Development',
      category: 'Web Developer',
      year: '2025',
      description: 'Sviluppo frontend avanzato con React, Redux e gestione dello stato.',
      cover: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
    },
    {
      title: 'Advanced JavaScript',
      category: 'Web Developer',
      year: '2025',
      description: 'JavaScript ES6+, programmazione asincrona e pattern avanzati.',
      cover: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a',
    },
    {
      title: 'JavaScript Fundamentals',
      category: 'Web Developer',
      year: '2024',
      description: 'Fondamenti di JavaScript e manipolazione del DOM.',
      cover: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479',
    },
    {
      title: 'CSS & Bootstrap',
      category: 'Web Developer',
      year: '2024',
      description: 'Styling avanzato con CSS3 e framework Bootstrap.',
      cover: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890',
    },
    {
      title: 'HTML & Web Basics',
      category: 'Web Developer',
      year: '2024',
      description: 'Fondamenti di HTML5 e struttura delle pagine web.',
      cover: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713',
    },
    {
      title: 'Unity & Character Creation',
      category: 'Game Development',
      year: '2024',
      description: 'Sviluppo di videogiochi con Unity e Visual Studio, focus sulla creazione di personaggi.',
      cover: 'https://images.unsplash.com/photo-1614294148960-9aa740632a87',
    },
  ],
  blogPosts: [
    {
      dateISO: '2026-12-29',
      dateLabel: '29 Dic 2026',
      category: 'Tech Trends',
      title: 'Riflessioni e Tech Trends 2027',
      excerpt:
        "Le tecnologie emergenti da tenere d'occhio per il prossimo anno: dall'AI avanzata a nuove architetture web.",
      cover:
        'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=2070&auto=format&fit=crop',
    },
    {
      dateISO: '2026-11-04',
      dateLabel: '04 Nov 2026',
      category: 'UI/UX',
      title: 'Design System Scalabili',
      excerpt: 'Come costruire e mantenere un Design System aziendale coerente tra diversi team e progetti.',
      cover:
        'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2000&auto=format&fit=crop',
    },
    {
      dateISO: '2026-10-17',
      dateLabel: '17 Ott 2026',
      category: 'Security',
      title: 'Sviluppo di API Sicure',
      excerpt: 'Best practices e pattern fondamentali per proteggere le tue API da attacchi moderni e vulnerabilità.',
      cover:
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop',
    },
    {
      dateISO: '2026-09-09',
      dateLabel: '09 Set 2026',
      category: 'Frontend',
      title: 'HTMX e UI Reattive',
      excerpt: 'Costruire interfacce utente dinamiche e veloci inviando HTML over the wire, senza pesanti framework JS.',
      cover:
        'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=2088&auto=format&fit=crop',
    },
    {
      dateISO: '2026-08-21',
      dateLabel: '21 Ago 2026',
      category: 'Database',
      title: 'Database Serverless',
      excerpt: 'Il futuro della persistenza dei dati: scalabilità automatica e pricing pay-per-use per applicazioni cloud.',
      cover:
        'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=2071&auto=format&fit=crop',
    },
    {
      dateISO: '2026-07-07',
      dateLabel: '07 Lug 2026',
      category: 'Frontend',
      title: 'Novità in Svelte 6',
      excerpt: "Analisi delle nuove feature e dei miglioramenti di performance nell'ultima major release di Svelte.",
      cover:
        'https://images.unsplash.com/photo-1550439062-609e1531270e?q=80&w=2070&auto=format&fit=crop',
    },
    {
      dateISO: '2026-06-28',
      dateLabel: '28 Giu 2026',
      category: 'DevOps',
      title: 'Kubernetes per Sviluppatori',
      excerpt: 'Guida pratica ai concetti essenziali di Kubernetes: pod, deployment e servizi per gestire app containerizzate.',
      cover:
        'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?q=80&w=2070&auto=format&fit=crop',
    },
    {
      dateISO: '2026-05-11',
      dateLabel: '11 Mag 2026',
      category: 'Security',
      title: 'Cybersecurity Trends',
      excerpt: 'Le principali minacce alla sicurezza informatica nel 2026 e le strategie difensive più efficaci.',
      cover:
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop',
    },
    {
      dateISO: '2026-04-25',
      dateLabel: '25 Apr 2026',
      category: 'React',
      title: 'Ottimizzazione con Next.js 16',
      excerpt: 'Sfruttare le nuove capacità di rendering e data fetching per costruire applicazioni React super veloci.',
      cover:
        'https://images.unsplash.com/photo-1768839726129-8dcb29a4e7b8?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      dateISO: '2026-03-03',
      dateLabel: '03 Mar 2026',
      category: 'Performance',
      title: 'Il potenziale di WebAssembly',
      excerpt: 'Come WASM sta portando performance di livello nativo nel browser per applicazioni ad alto calcolo.',
      cover:
        'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop',
    },
    {
      dateISO: '2026-02-19',
      dateLabel: '19 Feb 2026',
      category: 'Architecture',
      title: 'Micro Frontend Architecture',
      excerpt: 'Suddividere interfacce monolitiche in team indipendenti per scalare lo sviluppo e la delivery.',
      cover:
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',
    },
    {
      dateISO: '2026-01-08',
      dateLabel: '08 Gen 2026',
      category: 'Backend',
      title: 'Deno vs Node.js nel 2026',
      excerpt: "Confronto tra i due runtime JavaScript: performance, sicurezza e l'evoluzione dell'ecosistema.",
      cover:
        'https://images.unsplash.com/photo-1627398242454-45a1465c2479?q=80&w=2070&auto=format&fit=crop',
    },
    {
      dateISO: '2025-12-14',
      dateLabel: '14 Dic 2025',
      category: 'CSS',
      title: 'Tailwind CSS Tricks',
      excerpt: 'Tecniche avanzate e utility classes meno conosciute per creare layout complessi in pochissimo tempo.',
      cover:
        'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?q=80&w=2070&auto=format&fit=crop',
    },
    {
      dateISO: '2025-11-22',
      dateLabel: '22 Nov 2025',
      category: 'API',
      title: 'GraphQL vs REST',
      excerpt: "Quando scegliere GraphQL e quando rimanere con REST: pro e contro nell'architettura moderna.",
      cover:
        'https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=2070&auto=format&fit=crop',
    },
    {
      dateISO: '2025-10-05',
      dateLabel: '05 Ott 2025',
      category: 'AI',
      title: "L'impatto dell'AI nello Sviluppo Web",
      excerpt: "Come gli strumenti basati su Intelligenza Artificiale stanno trasformando il modo in cui scriviamo codice.",
      cover:
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2070&auto=format&fit=crop',
    },
    {
      dateISO: '2025-09-12',
      dateLabel: '12 Set 2025',
      category: 'Programming',
      title: 'Introduzione a Rust',
      excerpt: 'Perché Rust sta diventando il linguaggio preferito per lo sviluppo di tool ad alte prestazioni.',
      cover: 'https://miro.medium.com/v2/0*Eqqrv9zVpH99X726.png',
    },
    {
      dateISO: '2025-08-20',
      dateLabel: '20 Ago 2025',
      category: 'Cloud',
      title: 'Serverless Architecture',
      excerpt: "Vantaggi e sfide dell'architettura serverless per applicazioni moderne: casi d'uso e best practices.",
      cover: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31',
    },
    {
      dateISO: '2025-07-15',
      dateLabel: '15 Lug 2025',
      category: 'Mobile',
      title: 'Flutter vs React Native',
      excerpt: 'Confronto approfondito tra i due framework più popolari per lo sviluppo di app mobile cross-platform nel 2025.',
      cover:
        'https://images.unsplash.com/photo-1604637783927-a4ab04dcd463?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      dateISO: '2025-06-15',
      dateLabel: '15 Giu 2025',
      category: 'Frontend Development',
      title: 'Il Futuro dei Web Components',
      excerpt: 'Come i Web Components stanno rivoluzionando lo sviluppo di interfacce web moderne e riutilizzabili.',
      cover: 'https://images.unsplash.com/photo-1550439062-609e1531270e',
    },
    {
      dateISO: '2025-05-10',
      dateLabel: '10 Mag 2025',
      category: 'Security',
      title: 'Cybersecurity nel Web3',
      excerpt:
        "Nuove sfide e soluzioni per la sicurezza nell'era del Web3 e delle applicazioni decentralizzate.",
      cover: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5',
    },
    {
      dateISO: '2025-04-20',
      dateLabel: '20 Apr 2025',
      category: 'Infrastructure',
      title: 'Edge Computing e PWA',
      excerpt:
        "Come l'Edge Computing sta trasformando le Progressive Web Apps e migliorando l'esperienza utente.",
      cover: 'https://images.unsplash.com/photo-1623282033815-40b05d96c903',
    },
    {
      dateISO: '2025-03-15',
      dateLabel: '15 Mar 2025',
      category: 'Cloud Computing',
      title: 'Architetture Serverless',
      excerpt: "Vantaggi e sfide nell'implementazione di architetture serverless per applicazioni moderne.",
      cover: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81',
    },
    {
      dateISO: '2025-02-10',
      dateLabel: '10 Feb 2025',
      category: 'Frontend',
      title: 'Gestione Stato Moderna',
      excerpt: 'Analisi delle moderne soluzioni di state management: Redux Toolkit, Zustand, Jotai e XState a confronto.',
      cover: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2',
    },
    {
      dateISO: '2025-01-20',
      dateLabel: '20 Gen 2025',
      category: 'Performance',
      title: 'Core Web Vitals',
      excerpt: 'Ottimizzare le metriche Core Web Vitals per migliorare SEO e user experience delle applicazioni web.',
      cover: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3',
    },
    {
      dateISO: '2024-12-15',
      dateLabel: '15 Dic 2024',
      category: 'Testing',
      title: 'Testing E2E Moderno',
      excerpt: 'Best practices per il testing end-to-end con Cypress e Playwright nelle applicazioni web moderne.',
      cover: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479',
    },
    {
      dateISO: '2024-11-05',
      dateLabel: '5 Nov 2024',
      category: 'DevOps',
      title: 'CI/CD per Web Apps',
      excerpt: 'Implementare pipeline di continuous integration e deployment per applicazioni web scalabili.',
      cover: 'https://images.unsplash.com/photo-1552664730-d307ca884978',
    },
  ],
  experience: [
    {
      title: 'Software Developer',
      company: 'International environment',
      period: 'Presente',
      highlights: [
        'Sviluppo in ambiente Microsoft .NET (C#).',
        'Gestione database SQL Server e integrazione API REST.',
        'Collaborazione con team multidisciplinari e stakeholder.',
      ],
    },
    {
      title: 'Full Stack Web Development (MERN)',
      company: 'Education & specialization',
      period: '2024 — 2025',
      highlights: [
        'React: Hooks, routing e gestione dello stato.',
        'Node.js / Express: sviluppo di API RESTful.',
        'MongoDB e architetture NoSQL.',
      ],
    },
    {
      title: 'Frontend & Core Technologies',
      company: 'Education',
      period: '2024',
      highlights: [
        'JavaScript (ES6+), AJAX e manipolazione DOM.',
        'HTML5, CSS3, Bootstrap.',
        'Git e GitHub (version control).',
      ],
    },
  ],
  contact: {
    email: 'henry8913@hotmail.it',
    links: [
      { label: 'GitHub', href: 'https://github.com/henry8913' },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/henry-g-full-web-stack-developer/' },
      { label: 'WhatsApp', href: 'https://wa.me/393926936916' },
    ],
  },
} as const

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
type Tone = 'comment' | 'keyword' | 'accent' | 'plain'
type CodeLine = { content: string; tone?: Tone }

function codeLine(content: string, tone: Tone = 'plain'): CodeLine {
  return { content, tone }
}

function useEditorLineNumbers(maxLines: number = 200) {
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [lineCount, setLineCount] = useState(1)
  const [lineHeightPx, setLineHeightPx] = useState(20)
  const [padTopPx, setPadTopPx] = useState(24)
  const [padBottomPx, setPadBottomPx] = useState(18)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    const update = () => {
      const style = window.getComputedStyle(el)
      const paddingTop = Number.parseFloat(style.paddingTop) || 0
      const paddingBottom = Number.parseFloat(style.paddingBottom) || 0
      const lh = Number.parseFloat(style.lineHeight)
      const computedLineHeight = Number.isFinite(lh) && lh > 0 ? lh : 20
      const inner = Math.max(0, el.scrollHeight - paddingTop - paddingBottom)
      const next = clamp(Math.ceil(inner / computedLineHeight), 1, maxLines)

      setLineHeightPx((prev) => (prev === computedLineHeight ? prev : computedLineHeight))
      setPadTopPx((prev) => (prev === paddingTop ? prev : paddingTop))
      setPadBottomPx((prev) => (prev === paddingBottom ? prev : paddingBottom))
      setLineCount((prev) => (prev === next ? prev : next))
    }

    update()

    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => update())
    ro.observe(el)
    return () => ro.disconnect()
  }, [maxLines])

  return { contentRef, lineCount, lineHeightPx, padTopPx, padBottomPx }
}

function chatId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const CHAT_LEGACY_STORAGE_KEY = 'henryai.chat.v1'
const CHAT_STORAGE_KEY = 'henryai.chat.threads.v1'
const CHAT_MAX_SAVED_MESSAGES = 200
const CHAT_MAX_SAVED_THREADS = 30

function createChatThread(title: string, messages: ChatMessage[] = []): ChatThread {
  const now = Date.now()
  return {
    id: chatId(),
    title,
    messages: messages.slice(-CHAT_MAX_SAVED_MESSAGES),
    createdAt: now,
    updatedAt: now,
  }
}

function loadLegacyChatMessagesFromStorage(): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(CHAT_LEGACY_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    const messagesRaw =
      parsed && typeof parsed === 'object' && Array.isArray((parsed as { messages?: unknown }).messages)
        ? (parsed as { messages: unknown[] }).messages
        : Array.isArray(parsed)
          ? parsed
          : null
    if (!messagesRaw) return []

    const messages = messagesRaw
      .map((m) => {
        if (!m || typeof m !== 'object') return null
        const id = (m as { id?: unknown }).id
        const role = (m as { role?: unknown }).role
        const content = (m as { content?: unknown }).content
        if (typeof id !== 'string') return null
        if (role !== 'user' && role !== 'assistant') return null
        if (typeof content !== 'string') return null
        return { id, role, content } satisfies ChatMessage
      })
      .filter((m): m is ChatMessage => Boolean(m))

    return messages.slice(-CHAT_MAX_SAVED_MESSAGES)
  } catch {
    return []
  }
}

function loadChatStateFromStorage(): { threads: ChatThread[]; activeThreadId: string } {
  if (typeof window === 'undefined') {
    const t = createChatThread('Chat 1', [])
    return { threads: [t], activeThreadId: t.id }
  }

  const parseMessages = (messagesRaw: unknown[]): ChatMessage[] => {
    return messagesRaw
      .map((m) => {
        if (!m || typeof m !== 'object') return null
        const id = (m as { id?: unknown }).id
        const role = (m as { role?: unknown }).role
        const content = (m as { content?: unknown }).content
        if (typeof id !== 'string') return null
        if (role !== 'user' && role !== 'assistant') return null
        if (typeof content !== 'string') return null
        return { id, role, content } satisfies ChatMessage
      })
      .filter((m): m is ChatMessage => Boolean(m))
      .slice(-CHAT_MAX_SAVED_MESSAGES)
  }

  const parseThreads = (threadsRaw: unknown[]): ChatThread[] => {
    const now = Date.now()
    return threadsRaw
      .map((t) => {
        if (!t || typeof t !== 'object') return null
        const id = (t as { id?: unknown }).id
        const title = (t as { title?: unknown }).title
        const messages = (t as { messages?: unknown }).messages
        const createdAt = (t as { createdAt?: unknown }).createdAt
        const updatedAt = (t as { updatedAt?: unknown }).updatedAt
        if (typeof id !== 'string') return null
        if (typeof title !== 'string' || title.trim().length === 0) return null
        if (!Array.isArray(messages)) return null
        return {
          id,
          title,
          messages: parseMessages(messages),
          createdAt: typeof createdAt === 'number' ? createdAt : now,
          updatedAt: typeof updatedAt === 'number' ? updatedAt : now,
        } satisfies ChatThread
      })
      .filter((t): t is ChatThread => Boolean(t))
      .slice(-CHAT_MAX_SAVED_THREADS)
  }

  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      const threadsRaw =
        parsed && typeof parsed === 'object' && Array.isArray((parsed as { threads?: unknown }).threads)
          ? (parsed as { threads: unknown[] }).threads
          : null
      const activeThreadIdRaw =
        parsed && typeof parsed === 'object' ? (parsed as { activeThreadId?: unknown }).activeThreadId : undefined

      const threads = threadsRaw ? parseThreads(threadsRaw) : []
      if (threads.length) {
        const activeThreadId =
          typeof activeThreadIdRaw === 'string' && threads.some((t) => t.id === activeThreadIdRaw)
            ? activeThreadIdRaw
            : threads[0]?.id || ''
        return { threads, activeThreadId }
      }
    }
  } catch {
    //
  }

  const legacyMessages = loadLegacyChatMessagesFromStorage()
  const first = createChatThread('Chat 1', legacyMessages)
  return { threads: [first], activeThreadId: first.id }
}

function saveChatStateToStorage(threads: ChatThread[], activeThreadId: string) {
  if (typeof window === 'undefined') return
  try {
    const payload = {
      version: 1,
      activeThreadId,
      threads: threads.slice(-CHAT_MAX_SAVED_THREADS).map((t) => ({
        id: t.id,
        title: t.title,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        messages: t.messages.slice(-CHAT_MAX_SAVED_MESSAGES),
      })),
    }
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    return
  }
}

const TERMINAL_STORAGE_KEY = 'henrydev.terminal.v1'
const TERMINAL_MAX_SAVED_ENTRIES = 400
const TERMINAL_MAX_SAVED_HISTORY = 200

type TerminalCommandSpec = {
  name: string
  aliases?: string[]
  usage: string
  description: string
}

const TERMINAL_COMMANDS: readonly TerminalCommandSpec[] = [
  { name: 'help', aliases: ['man'], usage: 'help [cmd]', description: 'Lista comandi o dettagli su un comando' },
  { name: 'clear', aliases: ['cls'], usage: 'clear', description: 'Pulisce lo schermo del terminale' },
  { name: 'welcome', usage: 'welcome', description: 'Stampa il banner di benvenuto' },
  { name: 'reset', usage: 'reset', description: 'Reset terminale (welcome + cwd + history)' },
  { name: 'ls', usage: 'ls [path]', description: 'Lista file/cartelle (simulato)' },
  { name: 'tree', usage: 'tree', description: 'Stampa la struttura del progetto (simulato)' },
  { name: 'open', aliases: ['code'], usage: 'open <file>', description: 'Apre un file nell’editor' },
  { name: 'cat', usage: 'cat <file>', description: 'Mostra anteprima contenuto file' },
  { name: 'pwd', usage: 'pwd', description: 'Mostra la directory corrente' },
  { name: 'cd', usage: 'cd <path>', description: 'Cambia directory (simulato)' },
  { name: 'find', usage: 'find <query>', description: 'Cerca file per nome (simulato)' },
  { name: 'grep', usage: 'grep <pattern> <file>', description: 'Cerca testo dentro un file (simulato)' },
  { name: 'history', usage: 'history [-c]', description: 'Mostra o pulisce lo storico comandi' },
  { name: 'theme', usage: 'theme <name> | theme list', description: 'Cambia tema dell’editor' },
  { name: 'themes', usage: 'themes', description: 'Elenca i temi disponibili' },
  { name: 'echo', usage: 'echo <text>', description: 'Stampa testo' },
  { name: 'date', usage: 'date', description: 'Mostra data/ora' },
  { name: 'whoami', usage: 'whoami', description: 'Chi sei (spoiler: henry)' },
  { name: 'neofetch', usage: 'neofetch', description: 'System info “figata” (simulata)' },
  { name: 'fortune', usage: 'fortune', description: 'Una frase random' },
  { name: 'calc', usage: 'calc <expr>', description: 'Calcolatrice veloce (solo + - * / % () )' },
  { name: 'copy', usage: 'copy [--all|text]', description: 'Copia in clipboard l’output o del testo' },
  { name: 'links', usage: 'links', description: 'Link e contatti' },
  { name: 'henryai', aliases: ['chat'], usage: 'henryai', description: 'Apre la chat a destra' },
  { name: 'npm', usage: 'npm run <dev|build>', description: 'Simula script npm' },
  { name: 'git', usage: 'git status', description: 'Simula git status' },
]

function terminalWelcomeLines() {
  const liveUrl = `https://${CONTENT.siteName}/`
  return [
    'VITE ready — Local: http://localhost:5173/',
    `LIVE: ${liveUrl}`,
    'Tip: Cmd/Ctrl+P per Quick Open · Cmd/Ctrl+` per Terminal · Ctrl+L per clear',
    "Welcome! Type 'help' to see available commands.",
  ]
}

function defaultTerminalState(): { entries: TerminalEntry[]; cwd: string; history: string[] } {
  return {
    cwd: '~/henrydev.it',
    history: [],
    entries: terminalWelcomeLines().map((text) => ({ id: chatId(), kind: 'out', text })),
  }
}

function loadTerminalStateFromStorage(): { entries: TerminalEntry[]; cwd: string; history: string[] } {
  if (typeof window === 'undefined') return defaultTerminalState()
  try {
    const raw = window.localStorage.getItem(TERMINAL_STORAGE_KEY)
    if (!raw) return defaultTerminalState()
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return defaultTerminalState()

    const cwdRaw = (parsed as { cwd?: unknown }).cwd
    const historyRaw = (parsed as { history?: unknown }).history
    const entriesRaw = (parsed as { entries?: unknown }).entries

    const cwd = typeof cwdRaw === 'string' && cwdRaw.trim().length ? cwdRaw : '~/henrydev.it'

    const history =
      Array.isArray(historyRaw)
        ? historyRaw
            .map((h) => (typeof h === 'string' ? h : null))
            .filter((h): h is string => Boolean(h))
            .slice(-TERMINAL_MAX_SAVED_HISTORY)
        : []

    const entries =
      Array.isArray(entriesRaw)
        ? entriesRaw
            .map((e) => {
              if (!e || typeof e !== 'object') return null
              const id = (e as { id?: unknown }).id
              const kind = (e as { kind?: unknown }).kind
              const text = (e as { text?: unknown }).text
              const cwdEntry = (e as { cwd?: unknown }).cwd
              if (typeof id !== 'string') return null
              if (kind !== 'cmd' && kind !== 'out' && kind !== 'err') return null
              if (typeof text !== 'string') return null
              return {
                id,
                kind,
                text,
                ...(typeof cwdEntry === 'string' ? { cwd: cwdEntry } : {}),
              } satisfies TerminalEntry
            })
            .filter((e): e is TerminalEntry => Boolean(e))
            .slice(-TERMINAL_MAX_SAVED_ENTRIES)
        : []

    if (entries.length === 0) return { ...defaultTerminalState(), cwd, history }
    return { entries, cwd, history }
  } catch {
    return defaultTerminalState()
  }
}

function saveTerminalStateToStorage(state: { entries: TerminalEntry[]; cwd: string; history: string[] }) {
  if (typeof window === 'undefined') return
  try {
    const payload = {
      version: 1,
      cwd: state.cwd,
      history: state.history.slice(-TERMINAL_MAX_SAVED_HISTORY),
      entries: state.entries.slice(-TERMINAL_MAX_SAVED_ENTRIES),
    }
    window.localStorage.setItem(TERMINAL_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    return
  }
}

function buildHenryAISiteContext() {
  const profile = CONTENT.profile
  const about = CONTENT.about
  const resume = CONTENT.resume
  const skills = CONTENT.skills
  const portfolio = CONTENT.portfolio as PortfolioContent
  const certifications = CONTENT.certifications as readonly CertificationItem[]
  const posts = CONTENT.blogPosts as readonly BlogPostItem[]
  const contact = CONTENT.contact

  const projects = portfolio.projects
    .map((p) => {
      const links = [p.live ? `live: ${p.live}` : null, p.github ? `github: ${p.github}` : null].filter(Boolean).join(' · ')
      return `- ${p.title} (${p.category}) — ${p.description}${links ? `\n  ${links}` : ''}`
    })
    .join('\n')

  const certs = certifications.map((c) => `- ${c.title} — ${c.category} (${c.year})`).join('\n')

  const blog = posts
    .map((p) => `- ${p.title} — ${p.category} (${p.dateLabel})\n  ${p.excerpt}`)
    .join('\n')

  const stack = skills.stack.map((s) => `- ${s.name}: ${s.level}%`).join('\n')

  const contactLines = [
    `email: ${contact.email}`,
    ...contact.links.map((l) => `${l.label}: ${l.href}`),
  ].join('\n')

  return [
    `Sito: ${CONTENT.siteName}`,
    '',
    'Profilo',
    `- nome: ${profile.firstName} ${profile.lastName}`,
    `- ruoli: ${profile.roles.join(', ')}`,
    `- tagline: ${profile.tagline}`,
    '',
    'About',
    `- titolo: ${about.title}`,
    `- intro: ${about.intro.map((i) => i.text).join(' ')}`,
    `- competenze dev: ${about.developerSkills.map((s) => `${s.label}: ${s.value}`).join(' · ')}`,
    '',
    'Resume',
    `- experience: ${resume.experience.map((e) => `${e.period} ${e.title} @ ${e.company}`).join(' · ')}`,
    `- education: ${resume.education.map((e) => `${e.period} ${e.title}`).join(' · ')}`,
    '',
    'Skills',
    stack,
    '',
    'Progetti (Portfolio)',
    projects,
    '',
    'Certificazioni',
    certs,
    '',
    'Blog',
    blog,
    '',
    'Contatti',
    contactLines,
  ].join('\n')
}

function parseShellArgs(input: string) {
  const parts: string[] = []
  let current = ''
  let inSingle = false
  let inDouble = false

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i]

    if (ch === "'" && !inDouble) {
      inSingle = !inSingle
      continue
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble
      continue
    }
    if (!inSingle && !inDouble && /\s/.test(ch)) {
      if (current) {
        parts.push(current)
        current = ''
      }
      continue
    }
    current += ch
  }

  if (current) parts.push(current)
  return parts
}

function terminalPreviewForFile(id: FileId): string[] {
  if (id === 'about.html') {
    return [
      '<!-- about.html - Henry Grecchi -->',
      '<h1>About Me ✨</h1>',
      `<p>${CONTENT.about.subtitle}</p>`,
    ]
  }

  if (id === 'skills.json') {
    return [
      '{',
      '  "stack": [',
      ...CONTENT.skills.stack.slice(0, 5).map((s) => `    { "name": "${s.name}", "level": ${s.level} },`),
      '  ]',
      '}',
    ]
  }

  if (id === 'resume.ts') {
    return [
      '// resume.ts',
      ...CONTENT.resume.experience.slice(0, 3).map((e) => `- ${e.period} ${e.title} @ ${e.company}`),
      ...CONTENT.resume.education.slice(0, 2).map((e) => `- ${e.period} ${e.title} (${e.company})`),
    ]
  }

  if (id === 'portfolio.js') {
    const portfolio = CONTENT.portfolio as PortfolioContent
    return [
      '// portfolio.js',
      ...portfolio.projects.slice(0, 6).map((p) => `- ${p.title} (${p.category})`),
    ]
  }

  if (id === 'certifications.js') {
    const certifications = CONTENT.certifications as readonly CertificationItem[]
    return [
      '// certifications.js',
      ...certifications.slice(0, 6).map((c) => `- ${c.title} — ${c.category} (${c.year})`),
    ]
  }

  if (id === 'contact.css') {
    return ['/* contact.css */', `email: ${CONTENT.contact.email}`]
  }

  if (id === 'blog.html') {
    const posts = CONTENT.blogPosts as readonly BlogPostItem[]
    return ['<!-- blog.html -->', ...posts.slice(0, 4).map((p) => `- ${p.title} (${p.dateLabel})`)]
  }

  if (id === 'index.html') {
    return ['<!-- index.html -->', '<h1>Index</h1>', '<p>Scrivi HTML qui, direttamente nel sito.</p>']
  }

  if (id === 'resume.pdf') {
    return ['resume.pdf', 'Apri il file dal pannello editor per scaricarlo o visualizzarlo.']
  }

  if (id === 'README.md') {
    return ['# README.md', 'Apri il file dal pannello editor per visualizzarlo.']
  }

  return [id]
}

function statusLanguageForExt(ext?: FileEntry['ext']) {
  switch (ext) {
    case 'tsx':
      return 'TypeScript JSX'
    case 'ts':
      return 'TypeScript'
    case 'js':
      return 'JavaScript'
    case 'json':
      return 'JSON'
    case 'html':
      return 'HTML'
    case 'css':
      return 'CSS'
    case 'md':
      return 'Markdown'
    case 'pdf':
      return 'PDF'
    default:
      return 'Text'
  }
}

function extColor(ext: FileEntry['ext']) {
  switch (ext) {
    case 'tsx':
      return '#61dafb'
    case 'ts':
      return '#3178c6'
    case 'js':
      return '#f7df1e'
    case 'json':
      return '#cbcb41'
    case 'html':
      return '#e34c26'
    case 'css':
      return '#563d7c'
    case 'md':
      return '#9da0a6'
    case 'pdf':
      return '#ff5f56'
  }
}

function FileIcon({ ext }: { ext: FileEntry['ext'] }) {
  const color = extColor(ext)
  const codicon =
    ext === 'json'
      ? 'json'
      : ext === 'md'
        ? 'markdown'
        : ext === 'pdf'
          ? 'file-pdf'
          : 'file-code'
  return (
    <span className="file-icon" style={{ color }} aria-hidden="true">
      <Codicon name={codicon} />
    </span>
  )
}

type ActivityId =
  | 'explorer'
  | 'search'
  | 'scm'
  | 'run'
  | 'extensions'
  | 'remote'
  | 'github-actions'
  | 'package'
  | 'profile'
  | 'settings'

const ACTIVITY_TITLES: Record<ActivityId, string> = {
  explorer: 'EXPLORER',
  search: 'SEARCH',
  scm: 'SOURCE CONTROL',
  run: 'RUN AND DEBUG',
  extensions: 'EXTENSIONS',
  remote: 'REMOTE EXPLORER',
  'github-actions': 'GITHUB ACTIONS',
  package: 'CONTAINERS',
  profile: 'PROFILE',
  settings: 'SETTINGS',
}

function Codicon({
  name,
  title,
  className,
}: {
  name: string
  title?: string
  className?: string
}) {
  return (
    <span
      className={`codicon codicon-${name}${className ? ` ${className}` : ''}`}
      aria-hidden="true"
      title={title}
    />
  )
}

function chipTone(label: string) {
  const k = label.trim().toLowerCase()
  if (k === 'web development') return { fg: '#4fc1ff', border: 'rgba(79, 193, 255, 0.35)', bg: 'rgba(0, 122, 204, 0.12)' }
  if (k === 'applications') return { fg: '#faff5f', border: 'rgba(250, 255, 95, 0.35)', bg: 'rgba(250, 255, 95, 0.12)' }
  if (k === 'web design' || k.includes('ui') || k.includes('ux')) return { fg: '#d16d9e', border: 'rgba(209, 109, 158, 0.35)', bg: 'rgba(209, 109, 158, 0.14)' }
  if (k.includes('react')) return { fg: '#4fc1ff', border: 'rgba(79, 193, 255, 0.35)', bg: 'rgba(0, 122, 204, 0.12)' }
  if (k.includes('typescript') || k === 'ts' || k === 'c#') return { fg: '#4fc1ff', border: 'rgba(79, 193, 255, 0.35)', bg: 'rgba(0, 122, 204, 0.12)' }
  if (k.includes('.net') || k.includes('dotnet')) return { fg: '#4fc1ff', border: 'rgba(79, 193, 255, 0.35)', bg: 'rgba(0, 122, 204, 0.12)' }
  if (k.includes('node') || k.includes('express')) return { fg: '#6a9955', border: 'rgba(106, 153, 85, 0.35)', bg: 'rgba(106, 153, 85, 0.14)' }
  if (k.includes('mongo')) return { fg: '#6a9955', border: 'rgba(106, 153, 85, 0.35)', bg: 'rgba(106, 153, 85, 0.14)' }
  if (k.includes('sql')) return { fg: '#f76d55', border: 'rgba(247, 109, 85, 0.35)', bg: 'rgba(247, 109, 85, 0.14)' }
  if (k.includes('javascript') || k === 'js') return { fg: '#faff5f', border: 'rgba(250, 255, 95, 0.35)', bg: 'rgba(250, 255, 95, 0.12)' }
  if (k.includes('html') || k.includes('css')) return { fg: '#d16d9e', border: 'rgba(209, 109, 158, 0.35)', bg: 'rgba(209, 109, 158, 0.14)' }
  if (k.includes('python')) return { fg: '#4fc1ff', border: 'rgba(79, 193, 255, 0.35)', bg: 'rgba(0, 122, 204, 0.12)' }
  if (k.includes('git')) return { fg: '#f76d55', border: 'rgba(247, 109, 85, 0.35)', bg: 'rgba(247, 109, 85, 0.14)' }
  if (k.includes('github')) return { fg: '#c586c0', border: 'rgba(197, 134, 192, 0.35)', bg: 'rgba(197, 134, 192, 0.14)' }
  if (k.includes('linkedin')) return { fg: '#4fc1ff', border: 'rgba(79, 193, 255, 0.35)', bg: 'rgba(0, 122, 204, 0.12)' }
  if (k.includes('email') || k.includes('mail')) return { fg: '#f76d55', border: 'rgba(247, 109, 85, 0.35)', bg: 'rgba(247, 109, 85, 0.14)' }
  return { fg: '#d4d4d4', border: 'rgba(255, 255, 255, 0.14)', bg: 'rgba(255, 255, 255, 0.03)' }
}

function chipVars(label: string) {
  const t = chipTone(label)
  return {
    ['--chip-fg' as never]: t.fg,
    ['--chip-border' as never]: t.border,
    ['--chip-bg' as never]: t.bg,
  }
}

function Typewriter({
  phrases,
  className,
}: {
  phrases: readonly string[]
  className?: string
}) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [text, setText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const current = phrases[phraseIndex] ?? ''

  useEffect(() => {
    const typingMs = isDeleting ? 40 : 70
    const pauseAfterTypedMs = 1550
    const pauseAfterDeletedMs = 520

    const isFullyTyped = !isDeleting && text === current
    const isFullyDeleted = isDeleting && text.length === 0

    const delayMs = isFullyTyped ? pauseAfterTypedMs : isFullyDeleted ? pauseAfterDeletedMs : typingMs

    const t = window.setTimeout(() => {
      if (isFullyTyped) {
        setIsDeleting(true)
        return
      }

      if (isFullyDeleted) {
        setIsDeleting(false)
        setPhraseIndex((i) => (i + 1) % Math.max(phrases.length, 1))
        return
      }

      const nextLen = isDeleting ? Math.max(0, text.length - 1) : Math.min(current.length, text.length + 1)
      setText(current.slice(0, nextLen))
    }, delayMs)

    return () => window.clearTimeout(t)
  }, [current, isDeleting, phrases.length, text])

  return (
    <span className={`typewriter${className ? ` ${className}` : ''}`} aria-live="polite">
      <span className="typewriter-text">{text}</span>
      <span className="typewriter-caret" aria-hidden="true" />
    </span>
  )
}

function HomeView({ openFile, openChat }: { openFile: (id: FileId) => void; openChat: () => void }) {
  const profile = CONTENT.profile
  const home = CONTENT.home
  const { contentRef, lineCount, lineHeightPx, padTopPx, padBottomPx } = useEditorLineNumbers()
  const codiconForLink = (label: string) => {
    const k = label.trim().toLowerCase()
    if (k === 'github') return 'github'
    if (k === 'linkedin') return 'account'
    if (k === 'whatsapp') return 'comment-discussion'
    if (k === 'email') return 'mail'
    return 'link-external'
  }

  return (
    <div className="editor-scroll editor-lines" style={{ ['--editorLineHeight' as never]: `${lineHeightPx}px` }}>
      <div className="editor-gutter" style={{ paddingTop: `${padTopPx}px`, paddingBottom: `${padBottomPx}px` }} aria-hidden="true">
        {Array.from({ length: lineCount }, (_, idx) => (
          <div key={idx} className="editor-ln">
            {String(idx + 1).padStart(2, ' ')}
          </div>
        ))}
      </div>
      <div className="editor-lines-content">
        <div ref={contentRef} className="home">
        <div className="home-topline">// hello world !! welcome to my portfolio ✨</div>

        <div className="home-title">
          <span className="home-first">{profile.firstName}</span>
          <span className="home-last">{profile.lastName}</span>
        </div>

        <div className="home-badges">
          {profile.roles.map((role) => (
            <span key={role} className="pill" style={chipVars(role)}>
              <span className="pill-dot" style={{ background: chipTone(role).fg }} />
              {role}
            </span>
          ))}
          <button type="button" className="pill pill-link pill-highlight" onClick={openChat}>
            {profile.companyBadge.label}
          </button>
          <span className="cursor" aria-hidden="true" />
        </div>

        <div className="home-body">
          <div className="home-line">
            <Typewriter
              phrases={[
                'Building enterprise solutions in .NET and modern web apps in MERN. 🚀',
                'My peak creative hour? Coding at night with a fresh cup of coffee. ☕️',
              ]}
            />
          </div>
          <div className="home-paragraphs">
            <h2 className="home-h2">{home.heading}</h2>
            {home.paragraphs.map((p) => (
              <p key={p} className="home-paragraph">
                {p}
              </p>
            ))}
          </div>
        </div>

        <div className="home-actions">
          <button type="button" className="vs-button primary" onClick={() => openFile('portfolio.js')}>
            <Codicon name="repo" className="btn-icon" />
            Portfolio
          </button>
          <button type="button" className="vs-button" onClick={() => openFile('about.html')}>
            <Codicon name="account" className="btn-icon" />
            About Me
          </button>
          <button type="button" className="vs-button" onClick={() => openFile('contact.css')}>
            <Codicon name="mail" className="btn-icon" />
            Contact
          </button>
          <button type="button" className="vs-button" onClick={openChat}>
            <Codicon name="comment-discussion" className="btn-icon" />
            HenryAI
          </button>
        </div>

        <div className="home-stats">
          {profile.stats.map((s) => (
            <div key={s.label} className="stat-box">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="home-footer">
          {CONTENT.contact.links.map((l) => (
            <a key={l.label} className="footer-link" style={chipVars(l.label)} href={l.href} target="_blank" rel="noreferrer">
              <Codicon name={codiconForLink(l.label)} className="footer-icon" />
              <span>{l.label}</span>
            </a>
          ))}
          <a className="footer-link" style={chipVars('Email')} href={`mailto:${CONTENT.contact.email}`}>
            <Codicon name={codiconForLink('Email')} className="footer-icon" />
            <span>Email</span>
          </a>
        </div>
        </div>
      </div>
    </div>
  )
}

function AboutView() {
  const about = CONTENT.about
  const { contentRef, lineCount, lineHeightPx, padTopPx, padBottomPx } = useEditorLineNumbers()

  const renderWithStrong = (text: string, strongText: string) => {
    const idx = text.indexOf(strongText)
    if (idx < 0) return text
    const before = text.slice(0, idx)
    const after = text.slice(idx + strongText.length)
    return (
      <>
        {before}
        <strong className="about-accent">{strongText}</strong>
        {after}
      </>
    )
  }

  return (
    <div className="editor-scroll editor-lines" style={{ ['--editorLineHeight' as never]: `${lineHeightPx}px` }}>
      <div className="editor-gutter" style={{ paddingTop: `${padTopPx}px`, paddingBottom: `${padBottomPx}px` }} aria-hidden="true">
        {Array.from({ length: lineCount }, (_, idx) => (
          <div key={idx} className="editor-ln">
            {String(idx + 1).padStart(2, ' ')}
          </div>
        ))}
      </div>
      <div className="editor-lines-content">
      <div ref={contentRef} className="about-page">
        <div className="about-topline">{about.metaLine}</div>
        <h1 className="about-title">{about.title}</h1>
        <div className="about-subtitle">// {about.subtitle}</div>

        <div className="about-grid">
          <section className="about-card about-card-wide">
            {about.intro.map((p) => (
              <p key={p.text} className="about-paragraph">
                {renderWithStrong(p.text, p.strong)}
              </p>
            ))}
          </section>

          <section className="about-card about-card-wide">
            <h2 className="about-h2">{about.journeyTitle}</h2>
            {about.journey.map((p) => (
              <p key={p} className="about-paragraph">
                {p}
              </p>
            ))}
          </section>

          <section className="about-card">
            <h2 className="about-h2">{about.whatImDoingTitle}</h2>
            <div className="about-servicegrid">
              {about.services.map((s) => (
                <div key={s.title} className="about-service">
                  <div className="about-service-title">{s.title}</div>
                  <div className="about-service-text">{s.text}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="about-card">
            <h2 className="about-h2">{about.softSkillsTitle}</h2>
            <ul className="about-list">
              {about.softSkills.map((s) => (
                <li key={s.title} className="about-li">
                  <span className="about-li-strong">{s.title}:</span> <span>{s.text}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="about-card about-card-wide">
            <h2 className="about-h2">{about.developerSkillsTitle}</h2>
            <ul className="about-list">
              {about.developerSkills.map((s) => (
                <li key={s.label} className="about-li">
                  <span className="about-li-strong">{s.label}:</span> <span>{s.value}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="about-card about-card-wide">
            <h2 className="about-h2">{about.valuesTitle}</h2>
            {about.values.map((p) => (
              <p key={p} className="about-paragraph">
                {p}
              </p>
            ))}
          </section>
        </div>
      </div>
      </div>
    </div>
  )
}

function SkillsView() {
  const skills = CONTENT.skills
  const about = CONTENT.about
  const chips = Object.values(skills.skills).flat()
  const { contentRef, lineCount, lineHeightPx, padTopPx, padBottomPx } = useEditorLineNumbers()

  return (
    <div className="editor-scroll editor-lines" style={{ ['--editorLineHeight' as never]: `${lineHeightPx}px` }}>
      <div className="editor-gutter" style={{ paddingTop: `${padTopPx}px`, paddingBottom: `${padBottomPx}px` }} aria-hidden="true">
        {Array.from({ length: lineCount }, (_, idx) => (
          <div key={idx} className="editor-ln">
            {String(idx + 1).padStart(2, ' ')}
          </div>
        ))}
      </div>
      <div className="editor-lines-content">
      <div ref={contentRef} className="skills-page">
        <div className="skills-topline">// skills.json - developer skills ✨</div>
        <h1 className="skills-title">Skills 🧠</h1>
        <pre className="skills-meta" aria-label="Skills meta">
          {'{ '}
          <span className="tok tok-string">"status"</span>
          {': '}
          <span className="tok tok-string">"always_learning"</span>
          {', '}
          <span className="tok tok-string">"passion"</span>
          {': '}
          <span className="tok tok-string">"immeasurable"</span>
          {' }'}
        </pre>

        <div className="skills-grid">
          <section className="skills-card">
            <h2 className="skills-h2">Skill Levels 📈</h2>
            <div className="skills-bars">
              {skills.stack.map((s) => (
                <div key={s.name} className="skills-barrow">
                  <div className="skills-barlabel">{s.name}</div>
                  <div className="skills-bartrack" aria-hidden="true">
                    <div className="skills-barfill" style={{ width: `${s.level}%` }} />
                  </div>
                  <div className="skills-barvalue">{s.level}%</div>
                </div>
              ))}
            </div>
          </section>

          <section className="skills-card">
            <h2 className="skills-h2">Developer Skills 🧰</h2>
            <ul className="skills-list">
              {about.developerSkills.map((s) => (
                <li key={s.label} className="skills-li">
                  <span className="skills-li-strong">{s.label}:</span> <span>{s.value}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="skills-card skills-card-wide">
            <h2 className="skills-h2">Also Familiar With ✨</h2>
            <div className="skills-chips">
              {chips.map((c, idx) => (
                <span key={`${c}-${idx}`} className="skills-chip" style={chipVars(c)}>
                  {c}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>
      </div>
    </div>
  )
}

function ResumeTimelineSection({
  title,
  items,
}: {
  title: string
  items: readonly {
    readonly period: string
    readonly title: string
    readonly company: string
    readonly summary: string
    readonly tags: readonly string[]
  }[]
}) {
  return (
    <section className="resume-section">
      <h2 className="resume-h2">{title}</h2>
      <div className="resume-timeline" role="list">
        {items.map((it) => (
          <article key={`${it.period}-${it.title}`} className="resume-item" role="listitem">
            <div className="resume-itembody">
              <div className="resume-period">{it.period}</div>
              <div className="resume-role">{it.title}</div>
              <div className="resume-company">
                <span className="resume-at" aria-hidden="true">
                  @
                </span>{' '}
                {it.company}
              </div>
              <p className="resume-text">{it.summary}</p>
              <div className="resume-tags" aria-label="Tags">
                {it.tags.map((t) => (
                  <span key={t} className="resume-tag" style={chipVars(t)}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function ResumeView({ onOpenPdf }: { onOpenPdf: () => void }) {
  const resume = CONTENT.resume
  const stack = CONTENT.skills.stack
  const { contentRef, lineCount, lineHeightPx, padTopPx, padBottomPx } = useEditorLineNumbers()

  return (
    <div className="editor-scroll editor-lines" style={{ ['--editorLineHeight' as never]: `${lineHeightPx}px` }}>
      <div className="editor-gutter" style={{ paddingTop: `${padTopPx}px`, paddingBottom: `${padBottomPx}px` }} aria-hidden="true">
        {Array.from({ length: lineCount }, (_, idx) => (
          <div key={idx} className="editor-ln">
            {String(idx + 1).padStart(2, ' ')}
          </div>
        ))}
      </div>
      <div className="editor-lines-content">
      <div ref={contentRef} className="resume-page">
        <div className="resume-topline">{resume.metaLine}</div>
        <h1 className="resume-title">{resume.title}</h1>
        <div className="resume-subtitle">{resume.subtitle}</div>

        <div className="resume-actions" aria-label="Resume actions">
          <button type="button" className="vs-button primary" onClick={onOpenPdf}>
            <Codicon name="file-pdf" className="btn-icon" />
            Apri resume.pdf
          </button>
          <a className="vs-button" href={`mailto:${CONTENT.contact.email}`}>
            <Codicon name="mail" className="btn-icon" />
            Email
          </a>
          {CONTENT.contact.links?.[0]?.href ? (
            <a className="vs-button" href={CONTENT.contact.links[0].href} target="_blank" rel="noreferrer">
              <Codicon name="link-external" className="btn-icon" />
              {CONTENT.contact.links[0].label}
            </a>
          ) : null}
        </div>

        <ResumeTimelineSection title={resume.experienceTitle} items={resume.experience} />
        <ResumeTimelineSection title={resume.educationTitle} items={resume.education} />

        <section className="resume-section">
          <h2 className="resume-h2">{resume.stackTitle}</h2>
          <div className="resume-bars">
            {stack.map((s) => (
              <div key={s.name} className="resume-barrow">
                <div className="resume-barlabel">{s.name}</div>
                <div className="resume-bartrack" aria-hidden="true">
                  <div className="resume-barfill" style={{ width: `${s.level}%` }} />
                </div>
                <div className="resume-barvalue">{s.level}%</div>
              </div>
            ))}
          </div>
        </section>
      </div>
      </div>
    </div>
  )
}

function PortfolioView() {
  const portfolio = CONTENT.portfolio as PortfolioContent
  const [filter, setFilter] = useState<PortfolioFilter>('All')
  const { contentRef, lineCount, lineHeightPx, padTopPx, padBottomPx } = useEditorLineNumbers()

  const filtered = useMemo(() => {
    if (filter === 'All') return portfolio.projects
    return portfolio.projects.filter((p) => p.category === filter)
  }, [filter, portfolio.projects])

  const extractTags = (text: string) => {
    const dictionary = [
      { test: /\.net/i, tag: '.NET' },
      { test: /c#/i, tag: 'C#' },
      { test: /razor/i, tag: 'Razor Pages' },
      { test: /sqlite/i, tag: 'SQLite' },
      { test: /sql server/i, tag: 'SQL Server' },
      { test: /react/i, tag: 'React' },
      { test: /node\.js/i, tag: 'Node.js' },
      { test: /express/i, tag: 'Express' },
      { test: /mongodb/i, tag: 'MongoDB' },
      { test: /api/i, tag: 'API' },
      { test: /discord/i, tag: 'Discord' },
      { test: /css/i, tag: 'CSS' },
      { test: /flexbox/i, tag: 'Flexbox' },
      { test: /\bgrid\b/i, tag: 'Grid' },
    ] as const

    const tags: string[] = []
    dictionary.forEach(({ test, tag }) => {
      if (test.test(text) && !tags.includes(tag)) tags.push(tag)
    })
    return tags.slice(0, 6)
  }

  const categoryAccent = (category: string) => {
    if (category === 'Applications') return 'portfolio-accent-app'
    if (category === 'Web Design') return 'portfolio-accent-design'
    return 'portfolio-accent-dev'
  }

  return (
    <div className="editor-scroll editor-lines" style={{ ['--editorLineHeight' as never]: `${lineHeightPx}px` }}>
      <div className="editor-gutter" style={{ paddingTop: `${padTopPx}px`, paddingBottom: `${padBottomPx}px` }} aria-hidden="true">
        {Array.from({ length: lineCount }, (_, idx) => (
          <div key={idx} className="editor-ln">
            {String(idx + 1).padStart(2, ' ')}
          </div>
        ))}
      </div>
      <div className="editor-lines-content">
      <div ref={contentRef} className="portfolio-page">
        <div className="portfolio-topline">{portfolio.metaLine}</div>
        <h1 className="portfolio-title">{portfolio.title}</h1>
        <div className="portfolio-subtitle">{portfolio.subtitle}</div>

        <div className="portfolio-controls" role="tablist" aria-label="Project filters">
          {portfolio.filters.map((f) => (
            <button
              key={f}
              className={`portfolio-pill${f === filter ? ' is-active' : ''}`}
              onClick={() => setFilter(f)}
              type="button"
              role="tab"
              aria-selected={f === filter}
              style={f === 'All' ? undefined : chipVars(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="portfolio-grid">
          {filtered.map((p) => {
            const tags = extractTags(p.description)
            const live = p.live && p.live !== p.github ? p.live : undefined
            return (
              <article key={p.title} className={`portfolio-card ${categoryAccent(p.category)}`}>
                <div className="portfolio-thumb" aria-hidden="true">
                  {p.cover ? (
                    <img className="portfolio-thumbimg" src={p.cover} alt={p.title} loading="lazy" />
                  ) : (
                    <div className="portfolio-thumbplaceholder" />
                  )}
                </div>
                <div className="portfolio-cardhead">
                  <div className="portfolio-meta">
                    <div className="portfolio-kicker" style={chipVars(p.category)}>
                      {p.category.toUpperCase()}
                    </div>
                  </div>
                  <div className="portfolio-actions" aria-label="Links">
                    {p.github ? (
                      <a className="portfolio-action" href={p.github} target="_blank" rel="noreferrer">
                        GitHub
                      </a>
                    ) : null}
                    {live ? (
                      <a className="portfolio-action is-live" href={live} target="_blank" rel="noreferrer">
                        Live
                      </a>
                    ) : null}
                  </div>
                </div>
                <h3 className="portfolio-cardtitle">{p.title}</h3>
                <p className="portfolio-cardtext">{p.description}</p>
                {tags.length ? (
                  <div className="portfolio-tags" aria-label="Tech">
                    {tags.map((t) => (
                      <span key={t} className="portfolio-tag" style={chipVars(t)}>
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      </div>
      </div>
    </div>
  )
}

function CertificationsView() {
  const certifications = CONTENT.certifications as readonly CertificationItem[]
  const { contentRef, lineCount, lineHeightPx, padTopPx, padBottomPx } = useEditorLineNumbers()

  return (
    <div className="editor-scroll editor-lines" style={{ ['--editorLineHeight' as never]: `${lineHeightPx}px` }}>
      <div className="editor-gutter" style={{ paddingTop: `${padTopPx}px`, paddingBottom: `${padBottomPx}px` }} aria-hidden="true">
        {Array.from({ length: lineCount }, (_, idx) => (
          <div key={idx} className="editor-ln">
            {String(idx + 1).padStart(2, ' ')}
          </div>
        ))}
      </div>
      <div className="editor-lines-content">
      <div ref={contentRef} className="certs-page">
        <div className="certs-topline">// certifications.js - specializations & certificates ✨</div>
        <h1 className="certs-title">Certifications 🏅</h1>
        <div className="certs-subtitle">{'export const certifications = [...] // keep learning 🚀'}</div>

        <div className="certs-grid">
          {certifications.map((c) => (
            <article key={`${c.year}-${c.title}`} className="certs-card">
              <div className="certs-thumb" aria-hidden="true">
                <img className="certs-thumbimg" src={c.cover} alt={c.title} loading="lazy" />
              </div>
              <div className="certs-meta">
                <span className="certs-category" style={chipVars(c.category)}>
                  {c.category}
                </span>
                <span className="certs-dot" aria-hidden="true" />
                <span className="certs-year">{c.year}</span>
              </div>
              <h3 className="certs-cardtitle">{c.title}</h3>
              <p className="certs-cardtext">{c.description}</p>
            </article>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}

function BlogView() {
  const posts = CONTENT.blogPosts as readonly BlogPostItem[]
  const [selected, setSelected] = useState<BlogPostItem | null>(null)
  const { contentRef, lineCount, lineHeightPx, padTopPx, padBottomPx } = useEditorLineNumbers()

  useEffect(() => {
    if (!selected) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setSelected(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selected])

  type BlogBodyKey =
    | 'ai'
    | 'cloud'
    | 'mobile'
    | 'performance'
    | 'testing'
    | 'security'
    | 'database'
    | 'frontend'
    | 'css'
    | 'react'
    | 'architecture'
    | 'backend'
    | 'tech'
    | 'design'

  const bodyKeyForPost = (post: BlogPostItem): BlogBodyKey => {
    const category = post.category.trim().toLowerCase()
    const title = post.title.trim().toLowerCase()

    if (category === 'ai' || title.includes("l'impatto dell'ai")) return 'ai'
    if (category.includes('cloud') || category.includes('devops') || title.includes('serverless') || title.includes('kubernetes'))
      return 'cloud'
    if (category.includes('mobile') || title.includes('flutter') || title.includes('react native')) return 'mobile'
    if (category.includes('performance') || title.includes('core web vitals') || title.includes('webassembly') || title.includes('edge computing'))
      return 'performance'
    if (category.includes('testing')) return 'testing'
    if (category.includes('security') || title.includes('api sicure') || title.includes('cybersecurity')) return 'security'
    if (category.includes('database') || title.includes('database')) return 'database'
    if (category.includes('css') || title.includes('tailwind')) return 'css'
    if (category.includes('react') || title.includes('next.js')) return 'react'
    if (category.includes('ui/ux') || title.includes('design system')) return 'design'
    if (category.includes('architecture') || title.includes('micro frontend')) return 'architecture'
    if (category.includes('backend') || title.includes('deno') || title.includes('node.js')) return 'backend'
    if (category.includes('frontend')) return 'frontend'
    if (category.includes('tech trends')) return 'tech'
    return 'tech'
  }

  const renderBody = (post: BlogPostItem) => {
    const key = bodyKeyForPost(post)

    const closing = (
      <>
        <h4>Takeaway</h4>
        <ul>
          <li>Chiarisci obiettivo e vincoli prima di scegliere strumenti e architettura.</li>
          <li>Misura (metriche) e automatizza (pipeline) per mantenere qualità e velocità nel tempo.</li>
          <li>Riduci complessità: poche regole, pattern coerenti, documentazione minima ma utile.</li>
        </ul>
      </>
    )

    if (key === 'css') {
      return (
        <>
          <h4>Perché questo argomento conta</h4>
          <p>
            {post.title} nasce sempre da un bisogno pratico: spedire UI consistenti e mantenibili senza trasformare il CSS in un
            campo minato. Con Tailwind (o con un set di utility ben progettato) puoi ridurre la variabilità, velocizzare i layout e
            standardizzare le decisioni di design.
          </p>

          <h4>Strategia: utility-first senza caos</h4>
          <p>
            Il punto non è “scrivere zero CSS”, ma spostare la complessità in convenzioni: spacing coerenti, palette, typography scale,
            breakpoint, componenti composabili. Più il progetto cresce, più vince chi ha regole semplici e ripetibili.
          </p>
          <ul>
            <li>Definisci una scala di spacing e usala sempre (padding/margin/gap).</li>
            <li>Evita classi arbitrarie ovunque: usale solo quando serve davvero.</li>
            <li>Raggruppa pattern ripetuti in componenti (Button, Card, Input, Badge).</li>
          </ul>

          <h4>Trucchi pratici (che fanno davvero la differenza)</h4>
          <ul>
            <li>Layout: combina grid e flex con gap invece di margin “a mano”.</li>
            <li>Responsive: parti mobile-first e aggiungi breakpoint solo dove il layout lo richiede.</li>
            <li>Stati: standardizza hover/focus/disabled per accessibilità e coerenza.</li>
            <li>Dark mode: definisci token e usa varianti in modo sistematico.</li>
          </ul>

          <h4>Performance e DX</h4>
          <p>
            Un setup sano evita bundle gonfi e classi inutilizzate: assicurati che la build elimini ciò che non serve, e che l&apos;editor
            ti aiuti con autocomplete e linting. Il risultato è velocità percepita migliore e sviluppo più fluido.
          </p>

          <h4>Checklist per un progetto reale</h4>
          <ul>
            <li>Palette, spacing, font e radius definiti come standard.</li>
            <li>Componenti base (button/input/card) riusati ovunque.</li>
            <li>Regole per varianti e stati (success/error/loading).</li>
            <li>Revisione periodica per evitare duplicazioni e classi “one-off”.</li>
          </ul>
          {closing}
        </>
      )
    }

    if (key === 'react') {
      return (
        <>
          <h4>Obiettivo</h4>
          <p>
            In {post.title} l&apos;idea centrale è semplice: rendere l&apos;app più veloce e più facile da mantenere usando strategie moderne di
            rendering, caching e data fetching. Il guadagno non è solo tecnico: è anche UX (tempi, fluidità, stabilità).
          </p>

          <h4>Rendering e data fetching: cosa scegliere</h4>
          <ul>
            <li>Rendering lato server quando SEO e first load sono prioritari.</li>
            <li>Rendering client quando l&apos;interattività e i dati “live” dominano l&apos;esperienza.</li>
            <li>Incremental/partial rendering per pagine grandi con parti indipendenti.</li>
          </ul>

          <h4>Ottimizzazioni ad alto impatto</h4>
          <ul>
            <li>Riduci JS iniziale: code splitting mirato sulle route e sui componenti pesanti.</li>
            <li>Immagini: dimensioni giuste, lazy loading, priorità alle “hero”.</li>
            <li>Cache: invalida bene e osserva i pattern di traffico reali.</li>
            <li>Stato: mantieni locale ciò che è locale, sincronizza solo ciò che serve.</li>
          </ul>

          <h4>Misurare (non intuire)</h4>
          <p>
            Usa metriche e tracing: il collo di bottiglia raramente è dove lo immagini. Misura TTFB, LCP, CLS, INP e il costo reale delle
            richieste. Ogni ottimizzazione deve essere verificabile.
          </p>
          {closing}
        </>
      )
    }

    if (key === 'frontend') {
      return (
        <>
          <h4>Contesto</h4>
          <p>
            {post.title} riguarda un tema ricorrente: come costruire UI reattive e semplici da evolvere. Che si parli di HTMX, Svelte o state
            management, l&apos;obiettivo è ridurre complessità senza perdere qualità.
          </p>

          <h4>Pattern che funzionano</h4>
          <ul>
            <li>Componenti piccoli e “puri”: più sono prevedibili, più scalano.</li>
            <li>Stato vicino a dove serve: evita store globali per tutto.</li>
            <li>Contratti chiari: props e eventi coerenti, naming consistente.</li>
            <li>Accessibilità: focus, aria-label, tab order sempre considerati.</li>
          </ul>

          <h4>Decisioni da prendere presto</h4>
          <ul>
            <li>Struttura del progetto (feature-based vs layer-based).</li>
            <li>Convenzioni UI (spacing, typography, component library).</li>
            <li>Strategia di fetching (cache, retry, error state).</li>
            <li>Regole per performance (lazy, memo, list virtualization quando serve).</li>
          </ul>
          {closing}
        </>
      )
    }

    if (key === 'design') {
      return (
        <>
          <h4>Design System: il problema che risolve</h4>
          <p>
            Un design system non è una collezione di componenti: è un contratto tra design e engineering. Serve per ridurre ambiguità,
            standardizzare le decisioni e rendere le UI consistenti anche quando i team crescono.
          </p>

          <h4>Mattoni fondamentali</h4>
          <ul>
            <li>Token: colori, spacing, typography, radius e shadow.</li>
            <li>Componenti base: Button, Input, Card, Modal, Tooltip.</li>
            <li>Pattern: form validation, empty state, loading state.</li>
            <li>Documentazione: esempi d&apos;uso e “do / don&apos;t”.</li>
          </ul>

          <h4>Governance (la parte che viene ignorata)</h4>
          <p>
            Senza regole di evoluzione, il sistema si frammenta. Definisci ownership, processi di review, versioning e una roadmap. La coerenza
            si difende con disciplina, non con buona volontà.
          </p>
          {closing}
        </>
      )
    }

    if (key === 'security') {
      return (
        <>
          <h4>Threat model prima di tutto</h4>
          <p>
            {post.title} parte sempre da una domanda: cosa stiamo proteggendo e da chi? Senza threat model si finisce a “mettere toppe” invece di
            progettare sicurezza.
          </p>

          <h4>Fondamentali per web app e API</h4>
          <ul>
            <li>Validazione input + output encoding (difesa contro XSS e injection).</li>
            <li>Auth solida (scadenze, refresh, rotazione token) e autorizzazione per risorsa.</li>
            <li>Rate limit e protezione brute force.</li>
            <li>Logging utile ma senza dati sensibili.</li>
            <li>Headers e policy: CSP, HSTS, SameSite cookie, CORS ragionato.</li>
          </ul>

          <h4>Processo: sicurezza come pratica continua</h4>
          <ul>
            <li>Dipendenze: scansioni e aggiornamenti regolari.</li>
            <li>Pipeline: test automatici + controlli di sicurezza.</li>
            <li>Incident response: playbook minimo per eventi reali.</li>
          </ul>
          {closing}
        </>
      )
    }

    if (key === 'database') {
      return (
        <>
          <h4>Scelta del database: non è una guerra di religione</h4>
          <p>
            {post.title} si traduce spesso in una decisione architetturale: schema rigido e query complesse, oppure flessibilità e scalabilità
            orizzontale? La risposta dipende dai dati e dai carichi reali.
          </p>

          <h4>Criteri pratici</h4>
          <ul>
            <li>Modello dati: relazioni forti vs documenti indipendenti.</li>
            <li>Query: join, aggregazioni, reporting.</li>
            <li>Consistenza: transazioni, vincoli, integrità.</li>
            <li>Operatività: backup, osservabilità, costi, competenze del team.</li>
          </ul>

          <h4>Serverless database: opportunità e rischi</h4>
          <p>
            Il pay-per-use è ottimo quando il traffico è variabile, ma va capito bene il modello di pricing e le limitazioni. Misura, stima e
            imposta guardrail (limiti, alert, caching) prima che arrivi la prima sorpresa in fattura.
          </p>
          {closing}
        </>
      )
    }

    if (key === 'cloud') {
      return (
        <>
          <h4>Architetture cloud “che reggono”</h4>
          <p>
            {post.title} racconta un passaggio tipico: dalla singola app al sistema distribuito. Il cloud ti dà scalabilità, ma la complessità va
            gestita con disciplina.
          </p>

          <h4>Serverless e container: quando scegliere cosa</h4>
          <ul>
            <li>Serverless: eventi, picchi, workload intermittenti, time-to-market.</li>
            <li>Container/Kubernetes: controllo fine, workload persistenti, piattaforme interne.</li>
            <li>Ibrido: la soluzione più comune in prodotti reali.</li>
          </ul>

          <h4>Operatività (DevOps reale)</h4>
          <ul>
            <li>Osservabilità: log, metriche, tracing con correlation id.</li>
            <li>Deploy sicuri: canary, rollback, feature flag.</li>
            <li>Config e segreti: separati dal codice, rotazione e auditing.</li>
          </ul>
          {closing}
        </>
      )
    }

    if (key === 'performance') {
      return (
        <>
          <h4>Performance: una somma di dettagli</h4>
          <p>
            {post.title} riguarda un principio semplice: la velocità percepita è UX. Non basta “ottimizzare”: serve una strategia fatta di
            misurazioni, budget e interventi mirati.
          </p>

          <h4>Le leve principali</h4>
          <ul>
            <li>Riduci lavoro sul main thread: meno JS iniziale, meno re-render inutili.</li>
            <li>Immagini e font: compressione, dimensioni, preload ragionato.</li>
            <li>Cache: HTTP cache, service worker dove ha senso, CDN.</li>
            <li>Server: TTFB basso con query ottimizzate e caching lato backend.</li>
          </ul>

          <h4>Checklist rapida</h4>
          <ul>
            <li>Budget per LCP/INP/CLS e monitoraggio continuo.</li>
            <li>Code splitting e lazy dove davvero impatta.</li>
            <li>Evita regressioni: performance test in CI sulle pagine critiche.</li>
          </ul>
          {closing}
        </>
      )
    }

    if (key === 'testing') {
      return (
        <>
          <h4>Testing end-to-end che non rallenta il team</h4>
          <p>
            {post.title} punta a una cosa: ridurre bug in produzione senza trasformare la suite in un collo di bottiglia. E2E non sostituisce
            unit e integration: li completa.
          </p>

          <h4>Piramide dei test (pratica)</h4>
          <ul>
            <li>Unit: veloci, tanti, su logica pura.</li>
            <li>Integration: API e DB, meno numerosi ma significativi.</li>
            <li>E2E: pochi scenari critici (login, checkout, flussi core).</li>
          </ul>

          <h4>Stabilità prima di quantità</h4>
          <ul>
            <li>Dati test deterministici e ambienti isolati.</li>
            <li>Selector robusti e page object dove serve.</li>
            <li>Screenshot e trace solo quando fallisce (rumore minimo).</li>
          </ul>
          {closing}
        </>
      )
    }

    if (key === 'architecture') {
      return (
        <>
          <h4>Architettura: scalare team e delivery</h4>
          <p>
            {post.title} parla di una sfida comune: la UI cresce e il monolite diventa lento da cambiare. Micro frontend può aiutare, ma va
            introdotto con cautela e obiettivi chiari.
          </p>

          <h4>Quando ha senso</h4>
          <ul>
            <li>Team indipendenti con roadmap diverse e rilasci frequenti.</li>
            <li>Domini funzionali separabili con confini chiari.</li>
            <li>Necessità di evitare “big bang release”.</li>
          </ul>

          <h4>Rischi tipici</h4>
          <ul>
            <li>Duplicazione di dipendenze e bundle più grandi.</li>
            <li>Inconsistenza UI senza design system.</li>
            <li>Debug e observability più complessi.</li>
          </ul>
          {closing}
        </>
      )
    }

    if (key === 'backend') {
      return (
        <>
          <h4>Runtime moderni: cosa cambia davvero</h4>
          <p>
            {post.title} non è una gara di performance: è una scelta di ecosistema, sicurezza e DX. La domanda corretta è “cosa serve al mio
            prodotto e al mio team?”.
          </p>

          <h4>Punti di confronto utili</h4>
          <ul>
            <li>Sicurezza: permission model, dipendenze, auditing.</li>
            <li>Tooling: bundling, test runner, dev server.</li>
            <li>Compatibilità: librerie, runtime API, deploy target.</li>
            <li>Operatività: observability e debugging.</li>
          </ul>

          <h4>Scelta pragmatica</h4>
          <p>
            Se il progetto vive di librerie Node, la compatibilità è un valore enorme. Se invece vuoi un runtime più integrato (tooling incluso) e
            un approccio più “secure-by-default”, Deno/Bun possono diventare molto interessanti.
          </p>
          {closing}
        </>
      )
    }

    if (key === 'ai') {
      return (
        <>
          <h4>AI nello sviluppo: dove porta valore</h4>
          <p>
            {post.title} è un tema attualissimo: l&apos;AI accelera, ma non sostituisce il ragionamento. Funziona bene su task ripetitivi (boilerplate,
            refactor guidati, test scaffolding), meno su decisioni architetturali non formalizzate.
          </p>

          <h4>Use case concreti</h4>
          <ul>
            <li>Assistenza su debugging e comprensione del codice.</li>
            <li>Generazione di test e casi limite.</li>
            <li>Documentazione “living” da snippet e API.</li>
            <li>Automazioni in CI (lint, diff review, changelog).</li>
          </ul>

          <h4>Guardrail</h4>
          <ul>
            <li>Mai inserire segreti o dati sensibili nei prompt.</li>
            <li>Validare sempre output con test e code review.</li>
            <li>Standardizzare lo stile e le convenzioni del progetto.</li>
          </ul>
          {closing}
        </>
      )
    }

    if (key === 'tech') {
      return (
        <>
          <h4>Trend: separare hype da valore</h4>
          <p>
            {post.title} è un invito alla lucidità: le tecnologie emergenti hanno senso quando risolvono un problema reale (costi, time-to-market,
            qualità, scalabilità) e quando il team può sostenerle.
          </p>

          <h4>Come valutare una tecnologia</h4>
          <ul>
            <li>Maturità: community, documentazione, stabilità.</li>
            <li>Compatibilità: stack esistente, integrazioni, migrazioni.</li>
            <li>Costo: complessità, operatività, onboarding.</li>
            <li>Rischio: lock-in, vendor, ecosistema.</li>
          </ul>
          {closing}
        </>
      )
    }

    return closing
  }

  return (
    <div className="editor-scroll editor-lines" style={{ ['--editorLineHeight' as never]: `${lineHeightPx}px` }}>
      <div className="editor-gutter" style={{ paddingTop: `${padTopPx}px`, paddingBottom: `${padBottomPx}px` }} aria-hidden="true">
        {Array.from({ length: lineCount }, (_, idx) => (
          <div key={idx} className="editor-ln">
            {String(idx + 1).padStart(2, ' ')}
          </div>
        ))}
      </div>
      <div className="editor-lines-content">
      <div ref={contentRef} className="blog-page">
        <div className="blog-topline">{'<!-- blog.html · posts ✨ -->'}</div>
        <h1 className="blog-title">Blog ✍️</h1>
        <div className="blog-subtitle">{'<section class="blog-posts">…</section>'}</div>

        <div className="blog-grid">
          {posts.map((p) => (
            <article
              key={`${p.dateISO}-${p.title}`}
              className="blog-card blog-card-click"
              role="button"
              tabIndex={0}
              onClick={() => setSelected(p)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelected(p)
                }
              }}
            >
              <div className="blog-thumb" aria-hidden="true">
                <img className="blog-thumbimg" src={p.cover} alt={p.title} loading="lazy" />
              </div>
              <div className="blog-meta">
                    <span className="blog-category" style={chipVars(p.category)}>
                      {p.category}
                    </span>
                <span className="blog-dot" aria-hidden="true" />
                <time className="blog-date" dateTime={p.dateISO}>
                  {p.dateLabel}
                </time>
              </div>
              <h3 className="blog-cardtitle">{p.title}</h3>
              <p className="blog-cardtext">{p.excerpt}</p>
            </article>
          ))}
        </div>

        {selected ? (
          <div
            className="blog-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={selected.title}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setSelected(null)
            }}
          >
            <div className="blog-modal">
              <button type="button" className="blog-modal-close" onClick={() => setSelected(null)} aria-label="Close">
                <Codicon name="close" />
              </button>
              <div className="blog-modal-hero" aria-hidden="true">
                <img className="blog-modal-heroimg" src={selected.cover} alt={selected.title} loading="lazy" />
              </div>
              <div className="blog-modal-pad">
                <div className="blog-modal-meta">
                          <span className="blog-modal-category" style={chipVars(selected.category)}>
                            {selected.category}
                          </span>
                  <span className="blog-dot" aria-hidden="true" />
                  <time className="blog-date" dateTime={selected.dateISO}>
                    {selected.dateLabel}
                  </time>
                </div>
                <h2 className="blog-modal-title">{selected.title}</h2>
                <div className="blog-modal-body">
                  <p className="blog-modal-lead">{selected.excerpt}</p>
                  {renderBody(selected)}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      </div>
    </div>
  )
}

function ContactView() {
  const contact = CONTENT.contact
  const socials = [
    { label: 'Email', value: contact.email, href: `mailto:${contact.email}`, icon: 'mail' },
    ...contact.links.map((l) => {
      const k = l.label.trim().toLowerCase()
      const icon =
        k === 'github' ? 'github' : k === 'linkedin' ? 'account' : k === 'whatsapp' ? 'comment-discussion' : 'link'
      return { label: l.label, value: l.href.replace(/^https?:\/\//, ''), href: l.href, icon }
    }),
  ] as const
  const { contentRef, lineCount, lineHeightPx, padTopPx, padBottomPx } = useEditorLineNumbers()

  return (
    <div className="editor-scroll editor-lines" style={{ ['--editorLineHeight' as never]: `${lineHeightPx}px` }}>
      <div className="editor-gutter" style={{ paddingTop: `${padTopPx}px`, paddingBottom: `${padBottomPx}px` }} aria-hidden="true">
        {Array.from({ length: lineCount }, (_, idx) => (
          <div key={idx} className="editor-ln">
            {String(idx + 1).padStart(2, ' ')}
          </div>
        ))}
      </div>
      <div className="editor-lines-content">
      <div ref={contentRef} className="contact-page">
        <div className="contact-topline">/* contact.css · let&apos;s build something ✨ */</div>
        <h1 className="contact-title">Contact 💬</h1>
        <div className="contact-subtitle">// open to work, collabs & good conversations 🤝</div>

        <div className="contact-grid">
          <section className="contact-col">
            <h2 className="contact-h2">FIND ME ON 📍</h2>
            <div className="contact-links">
              {socials.map((s) => (
                <a
                  key={s.label}
                  className="contact-linkcard"
                  style={chipVars(s.label)}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="contact-iconbox" aria-hidden="true">
                    <Codicon name={s.icon} />
                  </span>
                  <span className="contact-linkmeta">
                    <span className="contact-linklabel">{s.label.toUpperCase()}</span>
                    <span className="contact-linkvalue">{s.value}</span>
                  </span>
                  <span className="contact-linkchev" aria-hidden="true">
                    <Codicon name="chevron-right" />
                  </span>
                </a>
              ))}
            </div>
          </section>

          <section className="contact-col">
            <h2 className="contact-h2">SEND A MESSAGE ✉️</h2>
            <form className="contact-form" action="https://formspree.io/f/mpwwpgzr" method="POST">
              <label className="contact-field">
                <span className="contact-label">// YOUR_NAME *</span>
                <input className="contact-input" name="name" type="text" placeholder="string" required />
              </label>
              <label className="contact-field">
                <span className="contact-label">// YOUR_EMAIL *</span>
                <input className="contact-input" name="email" type="email" placeholder="string" required />
              </label>
              <label className="contact-field">
                <span className="contact-label">// SUBJECT</span>
                <input className="contact-input" name="subject" type="text" placeholder="string" />
              </label>
              <label className="contact-field">
                <span className="contact-label">// MESSAGE *</span>
                <textarea
                  className="contact-textarea"
                  name="message"
                  placeholder={'"your message"'}
                  required
                />
              </label>
              <button className="contact-send" type="submit">
                <Codicon name="send" className="btn-icon" />
                Send message()
              </button>
              <div className="contact-powered">// Powered by Formspree (lands directly in my inbox)</div>
            </form>
          </section>
        </div>
      </div>
      </div>
    </div>
  )
}

function PdfView() {
  const { contentRef, lineCount, lineHeightPx, padTopPx, padBottomPx } = useEditorLineNumbers()
  const pdfName = 'Henry G. | Full Stack Developer.pdf'
  const pdfHref = `/${encodeURIComponent(pdfName)}`

  return (
    <div className="editor-scroll editor-lines" style={{ ['--editorLineHeight' as never]: `${lineHeightPx}px` }}>
      <div className="editor-gutter" style={{ paddingTop: `${padTopPx}px`, paddingBottom: `${padBottomPx}px` }} aria-hidden="true">
        {Array.from({ length: lineCount }, (_, idx) => (
          <div key={idx} className="editor-ln">
            {String(idx + 1).padStart(2, ' ')}
          </div>
        ))}
      </div>
      <div className="editor-lines-content">
        <div ref={contentRef} className="pdf-view">
          <div className="pdf-title">
            <Codicon name="file-pdf" className="btn-icon" /> Resume.pdf ✨
          </div>
          <div className="pdf-body">
            <p>
              Metti il tuo CV in <span className="inline-code">public/{pdfName}</span> e poi puoi aprirlo/scaricarlo da qui.
            </p>
            <div className="pdf-actions">
              <a className="link" style={chipVars('PDF')} href={pdfHref} target="_blank" rel="noreferrer">
                Apri /{pdfName} ↗
              </a>
              <a className="link" style={chipVars('Download')} href={pdfHref} download={pdfName}>
                Download ⬇︎
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

type HtmlCompletionKind = 'tag' | 'close' | 'attr' | 'css' | 'snippet'
type HtmlCompletionItem = {
  label: string
  kind: HtmlCompletionKind
  insertText: string
  cursorDelta: number
}

function escapeHtml(input: string) {
  return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function unclosedHtmlTags(source: string) {
  const voidTags = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
  ])
  const stack: string[] = []
  const tagRe = /<\/?([A-Za-z][A-Za-z0-9:-]*)\b[^>]*?>/g
  let m: RegExpExecArray | null
  while ((m = tagRe.exec(source))) {
    const full = m[0]
    const name = m[1].toLowerCase()
    const isClosing = full.startsWith('</')
    const isSelfClosing = full.endsWith('/>') || voidTags.has(name)
    if (isSelfClosing) continue
    if (isClosing) {
      const idx = stack.lastIndexOf(name)
      if (idx !== -1) stack.splice(idx, 1)
      continue
    }
    stack.push(name)
  }
  return stack
}

function isInsideTagPair(source: string, tag: string, cursor: number) {
  const before = source.slice(0, cursor).toLowerCase()
  const lastOpen = before.lastIndexOf(`<${tag}`)
  const lastClose = before.lastIndexOf(`</${tag}`)
  return lastOpen !== -1 && lastOpen > lastClose
}

function highlightHtmlToHtml(code: string) {
  const isSpace = (ch: string) => /\s/.test(ch)
  let out = ''
  let i = 0

  while (i < code.length) {
    if (code.startsWith('<!--', i)) {
      const end = code.indexOf('-->', i + 4)
      const endIdx = end === -1 ? code.length : end + 3
      out += `<span class="hl-comment">${escapeHtml(code.slice(i, endIdx))}</span>`
      i = endIdx
      continue
    }

    if (code[i] === '<') {
      if (code.startsWith('<!', i) && !code.startsWith('<!--', i)) {
        const end = code.indexOf('>', i + 2)
        const endIdx = end === -1 ? code.length : end + 1
        out += `<span class="hl-meta">${escapeHtml(code.slice(i, endIdx))}</span>`
        i = endIdx
        continue
      }

      const end = code.indexOf('>', i + 1)
      const endIdx = end === -1 ? code.length : end + 1
      const inner = code.slice(i + 1, endIdx - 1)
      let k = 0
      let closing = false

      out += `<span class="hl-punc">&lt;</span>`
      if (inner[k] === '/') {
        closing = true
        out += `<span class="hl-punc">/</span>`
        k += 1
      }

      const nameMatch = /^[A-Za-z][A-Za-z0-9:-]*/.exec(inner.slice(k))
      if (nameMatch) {
        out += `<span class="hl-tag">${escapeHtml(nameMatch[0])}</span>`
        k += nameMatch[0].length
      } else if (!closing && inner[k] === '/') {
        out += `<span class="hl-punc">/</span>`
        k += 1
      }

      while (k < inner.length) {
        const ch = inner[k]
        if (isSpace(ch)) {
          out += escapeHtml(ch)
          k += 1
          continue
        }
        if (ch === '/') {
          out += `<span class="hl-punc">/</span>`
          k += 1
          continue
        }

        const attrMatch = /^[^\s=/>]+/.exec(inner.slice(k))
        if (!attrMatch) {
          out += escapeHtml(ch)
          k += 1
          continue
        }
        const attrName = attrMatch[0]
        out += `<span class="hl-attr">${escapeHtml(attrName)}</span>`
        k += attrName.length

        while (k < inner.length && isSpace(inner[k])) {
          out += escapeHtml(inner[k])
          k += 1
        }

        if (inner[k] === '=') {
          out += `<span class="hl-punc">=</span>`
          k += 1
          while (k < inner.length && isSpace(inner[k])) {
            out += escapeHtml(inner[k])
            k += 1
          }
          const quote = inner[k]
          if (quote === '"' || quote === "'") {
            k += 1
            const valueStart = k
            while (k < inner.length && inner[k] !== quote) k += 1
            const value = inner.slice(valueStart, k)
            const q = escapeHtml(quote)
            out += `<span class="hl-string">${q}${escapeHtml(value)}${q}</span>`
            if (inner[k] === quote) k += 1
          } else {
            const valueMatch = /^[^\s>]+/.exec(inner.slice(k))
            if (valueMatch) {
              out += `<span class="hl-string">${escapeHtml(valueMatch[0])}</span>`
              k += valueMatch[0].length
            }
          }
        }
      }

      out += `<span class="hl-punc">&gt;</span>`
      i = endIdx
      continue
    }

    const nextTag = code.indexOf('<', i)
    const endIdx = nextTag === -1 ? code.length : nextTag
    out += escapeHtml(code.slice(i, endIdx))
    i = endIdx
  }

  return out
}

function formatHtml(code: string) {
  const voidTags = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
  ])

  const lines = code.split('\n')
  const out: string[] = []
  let indent = 0

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      out.push('')
      continue
    }

    const isCommentOrMeta = line.startsWith('<!--') || line.startsWith('<!') || line.startsWith('<?')
    const isClosing = /^<\/[A-Za-z]/.test(line)
    if (isClosing) indent = Math.max(0, indent - 1)

    out.push(`${'  '.repeat(indent)}${line}`)

    if (isCommentOrMeta || isClosing) continue
    const openMatch = /^<([A-Za-z][A-Za-z0-9:-]*)\b[^>]*>$/.exec(line)
    if (!openMatch) continue
    const tag = openMatch[1].toLowerCase()
    if (line.endsWith('/>') || voidTags.has(tag)) continue
    indent += 1
  }

  return out.join('\n')
}

function IndexHtmlView() {
  const storageKey = 'henrydev.index.html.v1'
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return ''
    const saved = window.localStorage.getItem(storageKey)
    if (saved != null) return saved
    return [
      '<!doctype html>',
      '<html lang="it">',
      '  <head>',
      '    <meta charset="UTF-8" />',
      '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      '    <title>henrydev.it • index.html</title>',
      '    <meta name="description" content="Personal website • VS Code-inspired UI" />',
      '  </head>',
      '  <body>',
      '    <main class="container">',
      '      <header>',
      '        <h1>Hello 👋</h1>',
      '        <p>I build web & software solutions. Let’s collaborate.</p>',
      '      </header>',
      '',
      '      <section>',
      '        <h2>Quick links</h2>',
      '        <ul>',
      '          <li><a href="https://henrydev.it" target="_blank" rel="noreferrer">Website</a></li>',
      '          <li><a href="https://github.com/" target="_blank" rel="noreferrer">GitHub</a></li>',
      '          <li><a href="mailto:henry8913@hotmail.it">Email</a></li>',
      '        </ul>',
      '      </section>',
      '    </main>',
      '  </body>',
      '</html>',
      '',
    ].join('\n')
  })

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const gutterRef = useRef<HTMLDivElement | null>(null)
  const highlightRef = useRef<HTMLPreElement | null>(null)
  const measureRef = useRef<HTMLSpanElement | null>(null)
  const [charWidth, setCharWidth] = useState(8)

  const [suggestOpen, setSuggestOpen] = useState(false)
  const [suggestItems, setSuggestItems] = useState<HtmlCompletionItem[]>([])
  const [suggestIndex, setSuggestIndex] = useState(0)
  const [suggestPos, setSuggestPos] = useState<{ top: number; left: number }>({ top: 40, left: 60 })
  const [suggestReplace, setSuggestReplace] = useState<{ start: number; end: number } | null>(null)

  const [mode, setMode] = useState<'code' | 'preview'>('code')
  const [previewKey, setPreviewKey] = useState(0)
  const [previewDoc, setPreviewDoc] = useState(() => value)

  const highlighted = useMemo(() => highlightHtmlToHtml(value), [value])
  const lineCount = useMemo(() => Math.max(1, value.split('\n').length), [value])
  const pad = useMemo(() => Math.max(2, String(lineCount).length), [lineCount])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(storageKey, value)
  }, [storageKey, value])

  // Preview: reload the iframe (debounced) so CSS/JS changes are applied reliably.
  // (Some browsers don't consistently re-run <script> when srcDoc changes.)
  useEffect(() => {
    if (mode !== 'preview') return
    const t = window.setTimeout(() => {
      setPreviewDoc(value)
      setPreviewKey((k) => k + 1)
    }, 350)
    return () => window.clearTimeout(t)
  }, [mode, value])

  useEffect(() => {
    const el = measureRef.current
    if (!el) return
    const w = el.getBoundingClientRect().width
    if (Number.isFinite(w) && w > 0) setCharWidth(w)
  }, [])

  const syncScroll = () => {
    const gutter = gutterRef.current
    const textarea = textareaRef.current
    const highlightEl = highlightRef.current
    if (!gutter || !textarea || !highlightEl) return
    gutter.scrollTop = textarea.scrollTop
    highlightEl.scrollTop = textarea.scrollTop
    highlightEl.scrollLeft = textarea.scrollLeft
  }

  const closeSuggest = () => {
    setSuggestOpen(false)
    setSuggestItems([])
    setSuggestIndex(0)
    setSuggestReplace(null)
  }

  const updateSuggestPosition = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    const cursor = textarea.selectionStart
    const before = value.slice(0, cursor)
    const lineIndex = before.split('\n').length - 1
    const lineStart = before.lastIndexOf('\n') + 1
    const col = cursor - lineStart

    const padTop = 14
    const padLeft = 16
    const lineHeight = 20
    const top = padTop + lineIndex * lineHeight - textarea.scrollTop + lineHeight
    const left = padLeft + col * charWidth - textarea.scrollLeft
    setSuggestPos({ top, left })
  }

  const computeCompletions = (nextValue: string) => {
    const textarea = textareaRef.current
    if (!textarea) return { items: [] as HtmlCompletionItem[], replace: null as { start: number; end: number } | null }
    const cursor = textarea.selectionStart

    // CSS completions inside <style>...</style>
    if (isInsideTagPair(nextValue, 'style', cursor) && !isInsideTagPair(nextValue, 'script', cursor)) {
      const before = nextValue.slice(0, cursor)
      const word = before.match(/[A-Za-z-]+$/)?.[0] ?? ''
      const replace = { start: cursor - word.length, end: cursor }
      const props = [
        'background',
        'background-color',
        'color',
        'display',
        'flex',
        'flex-direction',
        'justify-content',
        'align-items',
        'gap',
        'margin',
        'margin-top',
        'margin-bottom',
        'padding',
        'padding-top',
        'padding-bottom',
        'width',
        'height',
        'max-width',
        'min-height',
        'border',
        'border-radius',
        'box-shadow',
        'font-size',
        'font-weight',
        'line-height',
      ]
      const items = props
        .filter((p) => p.startsWith(word.toLowerCase()))
        .slice(0, 12)
        .map((p) => ({ label: p, kind: 'css' as const, insertText: `${p}: `, cursorDelta: `${p}: `.length }))
      return { items, replace }
    }

    const before = nextValue.slice(0, cursor)
    const lt = before.lastIndexOf('<')
    const gt = before.lastIndexOf('>')
    if (lt === -1 || lt < gt) return { items: [], replace: null }

    const inTag = before.slice(lt + 1)

    // Closing tag suggestions: </div>
    if (inTag.startsWith('/')) {
      const prefix = inTag.slice(1).replace(/[^A-Za-z0-9:-]/g, '')
      const replace = { start: cursor - prefix.length, end: cursor }
      const stack = unclosedHtmlTags(before)
      const candidates = [...new Set(stack.reverse())]
      const items = candidates
        .filter((t) => t.startsWith(prefix.toLowerCase()))
        .slice(0, 10)
        .map((t) => ({ label: t, kind: 'close' as const, insertText: t, cursorDelta: t.length }))
      return { items, replace }
    }

    if (inTag.startsWith('!') || inTag.startsWith('?') || inTag.startsWith('/')) return { items: [], replace: null }

    const hasSpace = /\s/.test(inTag)
    const tagPart = hasSpace ? inTag.split(/\s+/)[0] : inTag
    const prefix = tagPart.replace(/[^A-Za-z0-9:-]/g, '')
    const replace = { start: cursor - prefix.length, end: cursor }

    const tagList = [
      // snippets / structural
      'html',
      'head',
      'body',
      'main',
      'section',
      'article',
      'header',
      'footer',
      'nav',
      // text
      'a',
      'button',
      'div',
      'form',
      'h1',
      'h2',
      'h3',
      'img',
      'input',
      'label',
      'li',
      'link',
      'meta',
      'p',
      'script',
      'span',
      'style',
      'title',
      'ul',
    ]

    if (!hasSpace) {
      const items = tagList
        .filter((t) => t.startsWith(prefix.toLowerCase()))
        .slice(0, 10)
        .map((t) => ({ label: t, kind: 'tag' as const, insertText: t, cursorDelta: t.length }))
      return { items, replace }
    }

    const lastSpace = inTag.lastIndexOf(' ')
    const attrPrefixRaw = inTag.slice(lastSpace + 1)
    const attrPrefix = attrPrefixRaw.replace(/[^A-Za-z0-9:-]/g, '')
    const attrReplace = { start: cursor - attrPrefix.length, end: cursor }
    const attrList = [
      'class',
      'id',
      'href',
      'src',
      'alt',
      'title',
      'style',
      'rel',
      'target',
      'type',
      'name',
      'content',
      'charset',
      'lang',
      'placeholder',
      'value',
      'role',
      'aria-label',
      'aria-hidden',
      'tabindex',
    ]
    const items = attrList
      .filter((a) => a.startsWith(attrPrefix.toLowerCase()))
      .slice(0, 10)
      .map((a) => ({ label: a, kind: 'attr' as const, insertText: `${a}=""`, cursorDelta: a.length + 2 }))
    return { items, replace: attrReplace }
  }

  const openSuggestFromValue = (nextValue: string) => {
    const { items, replace } = computeCompletions(nextValue)
    if (items.length === 0 || !replace) {
      closeSuggest()
      return
    }
    setSuggestItems(items)
    setSuggestIndex(0)
    setSuggestOpen(true)
    setSuggestReplace(replace)
    updateSuggestPosition()
  }

  const applyCompletion = (item: HtmlCompletionItem) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const replace = suggestReplace
    if (!replace) return

    const next = `${value.slice(0, replace.start)}${item.insertText}${value.slice(replace.end)}`
    setValue(next)
    closeSuggest()

    requestAnimationFrame(() => {
      textarea.focus()
      const cursor = replace.start + item.cursorDelta
      textarea.setSelectionRange(cursor, cursor)
      syncScroll()
    })
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')
    const mod = isMac ? e.metaKey : e.ctrlKey

    // Cmd/Ctrl+S -> format document (VS Code-like)
    if (mod && (e.key === 's' || e.key === 'S')) {
      e.preventDefault()
      const textarea = textareaRef.current
      if (!textarea) return
      const cursor = textarea.selectionStart
      const next = formatHtml(value)
      setValue(next)
      closeSuggest()
      requestAnimationFrame(() => {
        textarea.focus()
        textarea.setSelectionRange(Math.min(cursor, next.length), Math.min(cursor, next.length))
        syncScroll()
      })
      return
    }

    // Auto-close tags on ">" (basic)
    if (e.key === '>' && !suggestOpen) {
      e.preventDefault()
      const textarea = textareaRef.current
      if (!textarea) return
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const before = value.slice(0, start)
      const after = value.slice(end)
      const insert = '>'
      const nextBase = `${before}${insert}${after}`

      // If we just closed an opening tag like "<div>", insert "</div>" and place cursor between.
      const lt = before.lastIndexOf('<')
      const gt = before.lastIndexOf('>')
      if (lt > gt) {
        const inner = before.slice(lt + 1)
        const tagName = inner.split(/\s+/)[0].replace(/[^A-Za-z0-9:-]/g, '').toLowerCase()
        const voidTags = new Set([
          'area',
          'base',
          'br',
          'col',
          'embed',
          'hr',
          'img',
          'input',
          'link',
          'meta',
          'param',
          'source',
          'track',
          'wbr',
        ])
        const isClosing = inner.startsWith('/')
        const isSelfClosing = inner.trim().endsWith('/') || voidTags.has(tagName)
        if (tagName && !isClosing && !isSelfClosing) {
          const closing = `</${tagName}>`
          const next = `${before}${insert}${closing}${after}`
          setValue(next)
          closeSuggest()
          requestAnimationFrame(() => {
            textarea.focus()
            const pos = start + insert.length
            textarea.setSelectionRange(pos, pos)
            syncScroll()
          })
          return
        }
      }

      setValue(nextBase)
      closeSuggest()
      requestAnimationFrame(() => {
        textarea.focus()
        const pos = start + insert.length
        textarea.setSelectionRange(pos, pos)
        syncScroll()
      })
      return
    }

    // Editor-like behavior: Tab inserts spaces instead of moving focus
    if (e.key === 'Tab' && !suggestOpen) {
      e.preventDefault()
      const textarea = textareaRef.current
      if (!textarea) return
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const insert = '  '
      const next = `${value.slice(0, start)}${insert}${value.slice(end)}`
      setValue(next)
      closeSuggest()
      requestAnimationFrame(() => {
        textarea.focus()
        const pos = start + insert.length
        textarea.setSelectionRange(pos, pos)
        syncScroll()
      })
      return
    }

    // Editor-like behavior: Enter keeps indentation (basic HTML indent)
    if (e.key === 'Enter' && !suggestOpen) {
      e.preventDefault()
      const textarea = textareaRef.current
      if (!textarea) return
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const before = value.slice(0, start)
      const after = value.slice(end)
      const lineStart = before.lastIndexOf('\n') + 1
      const currentLine = before.slice(lineStart)
      const baseIndent = (currentLine.match(/^\s+/)?.[0] ?? '')
      const trimmed = currentLine.trim()

      let extraIndent = ''
      const isCommentOrMeta = trimmed.startsWith('<!--') || trimmed.startsWith('<!') || trimmed.startsWith('<?')
      const isClosingTag = /^<\/[A-Za-z]/.test(trimmed)
      const isOpenTag = /^<([A-Za-z][A-Za-z0-9:-]*)\b[^>]*>$/.test(trimmed)
      const isSelfClosing = trimmed.endsWith('/>')

      if (!isCommentOrMeta && !isClosingTag && isOpenTag && !isSelfClosing) {
        extraIndent = '  '
      }

      const insert = `\n${baseIndent}${extraIndent}`
      const next = `${value.slice(0, start)}${insert}${after}`
      setValue(next)
      closeSuggest()
      requestAnimationFrame(() => {
        textarea.focus()
        const pos = start + insert.length
        textarea.setSelectionRange(pos, pos)
        syncScroll()
      })
      return
    }

    if (e.altKey && e.shiftKey && (e.key === 'f' || e.key === 'F')) {
      e.preventDefault()
      const textarea = textareaRef.current
      if (!textarea) return
      const cursor = textarea.selectionStart
      const next = formatHtml(value)
      setValue(next)
      closeSuggest()
      requestAnimationFrame(() => {
        textarea.focus()
        textarea.setSelectionRange(Math.min(cursor, next.length), Math.min(cursor, next.length))
        syncScroll()
      })
      return
    }

    if (!suggestOpen) return
    if (e.key === 'Escape') {
      e.preventDefault()
      closeSuggest()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSuggestIndex((v) => Math.min(v + 1, suggestItems.length - 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSuggestIndex((v) => Math.max(v - 1, 0))
      return
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      const item = suggestItems[suggestIndex]
      if (item) applyCompletion(item)
    }
  }

  return (
    <div className="editor-scroll index-editor">
      <div className="index-toolbar" aria-label="Index toolbar">
        <div className="index-toolbar-left">index.html</div>
        <div className="index-toolbar-right">
          <button
            type="button"
            className="iconbtn"
            aria-label={mode === 'preview' ? 'Show code' : 'Show preview'}
            title={mode === 'preview' ? 'Show code' : 'Show preview'}
            onClick={() => {
              setMode((m) => (m === 'preview' ? 'code' : 'preview'))
              closeSuggest()
            }}
          >
            <Codicon name={mode === 'preview' ? 'code' : 'open-preview'} />
          </button>
          <button
            type="button"
            className="iconbtn"
            aria-label="Refresh preview"
            title="Refresh preview"
            onClick={() => {
              setPreviewDoc(value)
              setPreviewKey((k) => k + 1)
            }}
          >
            <Codicon name="refresh" />
          </button>
        </div>
      </div>

      {mode === 'preview' ? (
        <div className="index-preview" role="region" aria-label="Preview">
          <iframe
            key={previewKey}
            className="index-preview-frame"
            title="index.html preview"
            // Allow HTML/CSS/JS to run like a real page while still isolating it from the app.
            // (No allow-same-origin, so it can't reach parent window.)
            sandbox="allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
            srcDoc={previewDoc}
          />
        </div>
      ) : (
        <>
          <div ref={gutterRef} className="index-gutter" aria-hidden="true">
            {Array.from({ length: lineCount }, (_, idx) => (
              <div key={idx} className="index-ln">
                {String(idx + 1).padStart(pad, ' ')}
              </div>
            ))}
          </div>
          <div className="index-wrap">
            <span ref={measureRef} className="index-measure">
              M
            </span>
            <pre
              ref={highlightRef}
              className="index-highlight"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
            <textarea
              ref={textareaRef}
              className="index-textarea"
              value={value}
              onChange={(e) => {
                const nextValue = e.target.value
                setValue(nextValue)
                openSuggestFromValue(nextValue)
              }}
              onScroll={syncScroll}
              onKeyDown={onKeyDown}
              onClick={() => openSuggestFromValue(value)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
            />
            {suggestOpen && suggestItems.length > 0 && (
              <div className="index-suggest" style={{ top: `${suggestPos.top}px`, left: `${suggestPos.left}px` }}>
                {suggestItems.map((it, idx) => (
                  <button
                    key={`${it.kind}-${it.label}`}
                    type="button"
                    className={`index-suggest-item${idx === suggestIndex ? ' is-active' : ''}`}
                    onMouseDown={(ev) => {
                      ev.preventDefault()
                      applyCompletion(it)
                    }}
                  >
                <span className="index-suggest-kind">{it.kind === 'close' ? 'tag' : it.kind}</span>
                    <span className="index-suggest-label">{it.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function CodeView({ lines }: { lines: CodeLine[] }) {
  return (
    <div className="editor-scroll">
      <pre className="code">
        {lines.map((l, idx) => (
          <div key={idx} className="code-line">
            <span className="ln">{String(idx + 1).padStart(2, ' ')}</span>
            <span className={`tok tok-${l.tone ?? 'plain'}`}>{l.content}</span>
          </div>
        ))}
      </pre>
    </div>
  )
}

function QuickOpen({
  open,
  query,
  setQuery,
  items,
  selectedIndex,
  setSelectedIndex,
  onSelect,
  onClose,
}: {
  open: boolean
  query: string
  setQuery: (v: string) => void
  items: FileEntry[]
  selectedIndex: number
  setSelectedIndex: (v: number) => void
  onSelect: (id: FileId) => void
  onClose: () => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(clamp(selectedIndex + 1, 0, Math.max(0, items.length - 1)))
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(clamp(selectedIndex - 1, 0, Math.max(0, items.length - 1)))
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        const item = items[selectedIndex]
        if (item) onSelect(item.id)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [items, onClose, onSelect, open, selectedIndex, setSelectedIndex])

  if (!open) return null

  return (
    <div className="quickopen-overlay" role="dialog" aria-modal="true">
      <div className="quickopen">
        <div className="quickopen-inputrow">
          <span className="quickopen-prefix">&gt;</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            className="quickopen-input"
            placeholder="Type to search files"
          />
        </div>
        <div className="quickopen-list" role="listbox">
          {items.length === 0 ? (
            <div className="quickopen-empty">No results</div>
          ) : (
            items.map((f, idx) => (
              <button
                key={f.id}
                type="button"
                className={`quickopen-item ${idx === selectedIndex ? 'active' : ''}`}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => onSelect(f.id)}
              >
                <FileIcon ext={f.ext} />
                <span className="quickopen-label">{f.label}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function TerminalText({ text }: { text: string }) {
  const urlRe = /(https?:\/\/[^\s)]+)(\)?)?/g
  const parts: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null = null
  while ((m = urlRe.exec(text))) {
    const url = m[1] || ''
    const idx = m.index
    if (idx > last) parts.push(text.slice(last, idx))
    parts.push(
      <a key={`${idx}-${url}`} className="terminal-link" href={url} target="_blank" rel="noreferrer">
        {url}
      </a>,
    )
    last = idx + url.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

function App() {
  const allFiles = FILE_TREE.children

  const [activeActivity, setActiveActivity] = useState<ActivityId>('explorer')
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(() => loadThemeFromStorage())
  const themeStyle = useMemo(() => THEME_VARS[selectedTheme] as unknown as CSSProperties, [selectedTheme])
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false)
  const themeMenuRef = useRef<HTMLDivElement | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return !window.matchMedia('(max-width: 900px)').matches
  })
  const [isTerminalOpen, setIsTerminalOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return !window.matchMedia('(max-width: 900px)').matches
  })
  const desktopRef = useRef<HTMLDivElement | null>(null)
  const cursorRef = useRef<HTMLDivElement | null>(null)
  const [isCursorVisible, setIsCursorVisible] = useState(false)
  const [isCursorHover, setIsCursorHover] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(300)
  const [chatWidth, setChatWidth] = useState(360)
  const resizeRef = useRef<{ kind: 'chat' | 'sidebar'; startX: number; startWidth: number } | null>(null)
  const [isOpenEditorsOpen, setIsOpenEditorsOpen] = useState(true)
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(true)
  const [isOutlineOpen, setIsOutlineOpen] = useState(false)
  const [isTimelineOpen, setIsTimelineOpen] = useState(false)

  const [openTabs, setOpenTabs] = useState<FileId[]>(['home.tsx'])
  const [activeTab, setActiveTab] = useState<FileId>('home.tsx')
  const activeTabRef = useRef<FileId>('home.tsx')
  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])

  const [isQuickOpenOpen, setIsQuickOpenOpen] = useState(false)
  const [quickOpenQuery, setQuickOpenQuery] = useState('')
  const [quickOpenSelectedIndex, setQuickOpenSelectedIndex] = useState(0)
  const [activeMacMenu, setActiveMacMenu] = useState<
    null | 'File' | 'Edit' | 'Selection' | 'View' | 'Go' | 'Run' | 'Terminal' | 'Help' | 'Copilot'
  >(null)
  const macbarRef = useRef<HTMLElement | null>(null)
  const [now, setNow] = useState(() => new Date())
  const initialChatState = useMemo(() => loadChatStateFromStorage(), [])
  const initialTerminalState = useMemo(() => loadTerminalStateFromStorage(), [])
  const [chatThreads, setChatThreads] = useState<ChatThread[]>(initialChatState.threads)
  const [activeChatThreadId, setActiveChatThreadId] = useState<string>(initialChatState.activeThreadId)
  const activeChatThreadIdRef = useRef(activeChatThreadId)
  const chatMessagesRef = useRef<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatIsSending, setChatIsSending] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const [terminalEntries, setTerminalEntries] = useState<TerminalEntry[]>(initialTerminalState.entries)
  const terminalEntriesRef = useRef<TerminalEntry[]>([])
  const fortuneIndexRef = useRef(0)
  const [terminalInput, setTerminalInput] = useState('')
  const [terminalCwd, setTerminalCwd] = useState(initialTerminalState.cwd)
  const [terminalHistory, setTerminalHistory] = useState<string[]>(initialTerminalState.history)
  const [terminalHistoryIndex, setTerminalHistoryIndex] = useState(-1)
  const terminalInputRef = useRef<HTMLInputElement | null>(null)
  const terminalEndRef = useRef<HTMLDivElement | null>(null)
  const terminalScrollRef = useRef<HTMLDivElement | null>(null)

  const activeFile = useMemo(() => {
    return allFiles.find((f) => f.id === activeTab)
  }, [activeTab, allFiles])

  const quickOpenItems = useMemo(() => {
    const q = quickOpenQuery.trim().toLowerCase()
    if (!q) return allFiles
    return allFiles.filter((f) => f.label.toLowerCase().includes(q))
  }, [allFiles, quickOpenQuery])

  const activeChatThread = useMemo(() => {
    return chatThreads.find((t) => t.id === activeChatThreadId) ?? chatThreads[0]!
  }, [activeChatThreadId, chatThreads])

  const chatMessages = activeChatThread.messages

  const closeSidebarOnMobile = () => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(max-width: 900px)').matches) {
      setIsSidebarOpen(false)
    }
  }

  const closeOverlaysOnMobile = () => {
    if (typeof window === 'undefined') return
    if (!window.matchMedia('(max-width: 900px)').matches) return
    setIsSidebarOpen(false)
    setIsChatOpen(false)
    setIsTerminalOpen(false)
  }

  const toggleTerminal = () => {
    setIsTerminalOpen((v) => {
      const next = !v
      if (typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches && next) {
        // On mobile: keep one overlay at a time (terminal vs chat)
        setIsChatOpen(false)
        // Also close the sidebar so the activitybar doesn't cover overlays
        setIsSidebarOpen(false)
      }
      return next
    })
  }

  const toggleChat = () => {
    setIsChatOpen((v) => {
      const next = !v
      if (typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches && next) {
        // On mobile: keep one overlay at a time (chat vs terminal)
        setIsTerminalOpen(false)
        // Also close the sidebar so the activitybar doesn't cover overlays
        setIsSidebarOpen(false)
      }
      return next
    })
  }

  const openQuickOpen = () => {
    setIsQuickOpenOpen(true)
    setQuickOpenQuery('')
    setQuickOpenSelectedIndex(0)
  }

  const openExternal = (url: string) => {
    if (typeof window === 'undefined') return
    window.open(url, '_blank', 'noreferrer')
  }

  const openSidebarFromActivity = (id: ActivityId) => {
    setActiveActivity(id)
    setIsSidebarOpen(true)
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches) {
      // On mobile: don't stack overlays
      setIsChatOpen(false)
      setIsTerminalOpen(false)
    }
  }

  const openFile = (id: FileId) => {
    setOpenTabs((tabs) => (tabs.includes(id) ? tabs : [...tabs, id]))
    setActiveTab(id)
    closeSidebarOnMobile()
  }

  const closeTab = useCallback((id: FileId) => {
    setOpenTabs((tabs) => {
      const idx = tabs.indexOf(id)
      const nextTabs = tabs.filter((t) => t !== id)

      if (id === activeTabRef.current) {
        const nextActive = nextTabs[idx] ?? nextTabs[idx - 1] ?? 'home.tsx'
        setActiveTab(nextActive)
      }

      return nextTabs.length === 0 ? ['home.tsx'] : nextTabs
    })
  }, [])

  const closeActiveTab = useCallback(() => closeTab(activeTabRef.current), [closeTab])

  const closeAllTabs = () => {
    setOpenTabs(['home.tsx'])
    setActiveTab('home.tsx')
  }

  useEffect(() => {
    activeChatThreadIdRef.current = activeChatThreadId
  }, [activeChatThreadId])

  const chatThreadsRef = useRef(chatThreads)
  useEffect(() => {
    chatThreadsRef.current = chatThreads
  }, [chatThreads])

  useEffect(() => {
    chatMessagesRef.current = chatMessages
  }, [chatMessages])

  useEffect(() => {
    saveChatStateToStorage(chatThreads, activeChatThreadId)
  }, [activeChatThreadId, chatThreads])

  useEffect(() => {
    saveThemeToStorage(selectedTheme)
  }, [selectedTheme])

  useEffect(() => {
    saveTerminalStateToStorage({ entries: terminalEntries, cwd: terminalCwd, history: terminalHistory })
  }, [terminalCwd, terminalEntries, terminalHistory])

  useEffect(() => {
    terminalEntriesRef.current = terminalEntries
  }, [terminalEntries])

  useEffect(() => {
    if (!isChatOpen) return
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [chatMessages, chatIsSending, isChatOpen])

  useEffect(() => {
    if (!isTerminalOpen) return
    terminalInputRef.current?.focus()
    const el = terminalScrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [isTerminalOpen, terminalEntries])

  const closeChatThread = (id: string) => {
    const activeId = activeChatThreadIdRef.current
    setChatThreads((prev) => {
      const idx = prev.findIndex((t) => t.id === id)
      const next = prev.filter((t) => t.id !== id)

      if (next.length === 0) {
        const t = createChatThread('Chat 1', [])
        setActiveChatThreadId(t.id)
        return [t]
      }

      if (activeId === id) {
        const fallback = next[idx] ?? next[idx - 1] ?? next[0]!
        setActiveChatThreadId(fallback.id)
      }

      return next
    })
  }

  const resetChat = () => {
    const nextIndex = chatThreads.length + 1
    const nextThread = createChatThread(`Chat ${nextIndex}`, [])
    setChatThreads((prev) => prev.slice(-Math.max(0, CHAT_MAX_SAVED_THREADS - 1)).concat(nextThread))
    setActiveChatThreadId(nextThread.id)
    setChatInput('')
    setChatError(null)
  }

  const sendChat = async (text: string) => {
    const content = text.trim()
    if (!content) return
    if (chatIsSending) return

    setChatError(null)
    setChatIsSending(true)

    const threadId = activeChatThreadIdRef.current
    const baseMessages = chatThreadsRef.current.find((t) => t.id === threadId)?.messages ?? []

    const userMsg: ChatMessage = { id: chatId(), role: 'user', content }
    const nextMessages = [...baseMessages, userMsg]
    const windowedMessages = nextMessages.slice(-12)
    setChatThreads((prev) =>
      prev.map((t) => {
        if (t.id !== threadId) return t
        return { ...t, messages: nextMessages.slice(-CHAT_MAX_SAVED_MESSAGES), updatedAt: Date.now() }
      }),
    )
    setChatInput('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: windowedMessages.map((m) => ({ role: m.role, content: m.content })),
          context: buildHenryAISiteContext(),
        }),
      })

      const data = (await res.json().catch(() => null)) as null | { content?: string; error?: string }
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)

      const assistantMsg: ChatMessage = {
        id: chatId(),
        role: 'assistant',
        content: (data?.content || '').trim() || 'Non sono riuscito a generare una risposta. Riprova.',
      }
      setChatThreads((prev) =>
        prev.map((t) => {
          if (t.id !== threadId) return t
          return { ...t, messages: [...t.messages, assistantMsg].slice(-CHAT_MAX_SAVED_MESSAGES), updatedAt: Date.now() }
        }),
      )
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Errore durante la richiesta. Riprova tra poco.'
      setChatError(message)
      const errMsg: ChatMessage = { id: chatId(), role: 'assistant', content: 'Ops, qualcosa è andato storto. Puoi riprovare?' }
      setChatThreads((prev) =>
        prev.map((t) => {
          if (t.id !== threadId) return t
          return { ...t, messages: [...t.messages, errMsg].slice(-CHAT_MAX_SAVED_MESSAGES), updatedAt: Date.now() }
        }),
      )
    } finally {
      setChatIsSending(false)
    }
  }

  const appendTerminal = (kind: TerminalEntryKind, lines: string[]) => {
    if (lines.length === 0) return
    const MAX = 800
    setTerminalEntries((prev) => {
      const next = [...prev, ...lines.map((t) => ({ id: chatId(), kind, text: t }) satisfies TerminalEntry)]
      return next.length > MAX ? next.slice(-MAX) : next
    })
  }

  const buildWelcomeEntries = useCallback(() => {
    return terminalWelcomeLines().map((text) => ({ id: chatId(), kind: 'out', text }) satisfies TerminalEntry)
  }, [])

  const copyToClipboard = async (text: string) => {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) throw new Error('clipboard unavailable')
      await navigator.clipboard.writeText(text)
      appendTerminal('out', ['Copied to clipboard ✅'])
    } catch {
      appendTerminal('err', ['Impossibile copiare in clipboard (permessi/blocco browser).'])
    }
  }

  const resolveFileId = (input: string): FileId | null => {
    const needle = input.trim()
    if (!needle) return null
    const byId = allFiles.find((f) => f.id === needle)
    if (byId) return byId.id
    const byLabel = allFiles.find((f) => f.label.toLowerCase() === needle.toLowerCase())
    return byLabel ? byLabel.id : null
  }

  const execTerminal = async (raw: string) => {
    const line = raw.trim()
    if (!line) return

    const cwdAtStart = terminalCwd
    setTerminalEntries((prev) => {
      const MAX = 800
      const next = [...prev, { id: chatId(), kind: 'cmd', text: line, cwd: cwdAtStart } satisfies TerminalEntry]
      return next.length > MAX ? next.slice(-MAX) : next
    })
    setTerminalHistory((prev) => [...prev, line])
    setTerminalHistoryIndex(-1)

    const args = parseShellArgs(line)
    const cmd = (args[0] || '').toLowerCase()
    const rest = args.slice(1)

    if (cmd === 'clear' || cmd === 'cls') {
      setTerminalEntries(buildWelcomeEntries())
      return
    }

    if (cmd === 'welcome') {
      appendTerminal('out', terminalWelcomeLines())
      return
    }

    if (cmd === 'reset') {
      setTerminalCwd('~/henrydev.it')
      setTerminalHistory([])
      setTerminalHistoryIndex(-1)
      setTerminalEntries(buildWelcomeEntries())
      return
    }

    if (cmd === 'help' || cmd === 'man') {
      const needle = (rest[0] || '').toLowerCase()
      if (!needle) {
        appendTerminal('out', [
          'Comandi disponibili:',
          ...TERMINAL_COMMANDS.map((c) => {
            const names = [c.name, ...(c.aliases || [])].join('|')
            return `- ${names.padEnd(16, ' ')} ${c.description}`
          }),
          '',
          "Tip: usa TAB per completare · ↑/↓ per history · Ctrl+L per clear",
        ])
        return
      }

      const spec = TERMINAL_COMMANDS.find(
        (c) => c.name === needle || Boolean(c.aliases?.some((a) => a.toLowerCase() === needle)),
      )
      if (!spec) {
        appendTerminal('err', [`help: comando sconosciuto: ${needle}`])
        return
      }
      appendTerminal('out', [
        `${spec.name}${spec.aliases?.length ? ` (alias: ${spec.aliases.join(', ')})` : ''}`,
        `usage: ${spec.usage}`,
        `desc:  ${spec.description}`,
      ])
      return
    }

    if (cmd === 'pwd') {
      appendTerminal('out', [terminalCwd.replace(/^~\//, '/workspace/')])
      return
    }

    if (cmd === 'cd') {
      const target = (rest[0] || '').trim()
      if (!target || target === '~' || target === '~/henrydev.it') {
        setTerminalCwd('~/henrydev.it')
        return
      }
      if (target === '..') {
        setTerminalCwd('~/henrydev.it')
        return
      }
      if (target === 'src') {
        setTerminalCwd('~/henrydev.it/src')
        return
      }
      if (target === 'public') {
        setTerminalCwd('~/henrydev.it/public')
        return
      }
      appendTerminal('err', [`cd: no such file or directory: ${target}`])
      return
    }

    if (cmd === 'ls') {
      const arg = rest.find((r) => !r.startsWith('-')) || ''
      const cwd = terminalCwd
      const listRoot = ['src/', 'public/', 'index.html', 'package.json', 'vite.config.ts', 'README.md']
      const listSrc = ['App.tsx', 'App.css', 'index.css', 'main.tsx', 'assets/']
      const listPublic = ['favicon.svg', 'icons.svg', 'img/']

      const target = arg.trim()
      if (!target) {
        appendTerminal('out', cwd.endsWith('/src') ? listSrc : cwd.endsWith('/public') ? listPublic : listRoot)
        return
      }
      if (target === 'src' || target === './src') return void appendTerminal('out', listSrc)
      if (target === 'public' || target === './public') return void appendTerminal('out', listPublic)
      appendTerminal('err', [`ls: cannot access '${target}': No such file or directory`])
      return
    }

    if (cmd === 'tree') {
      appendTerminal('out', [
        '.',
        '├── src',
        '│   ├── App.tsx',
        '│   ├── App.css',
        '│   ├── index.css',
        '│   └── main.tsx',
        '├── public',
        '│   ├── favicon.svg',
        '│   └── icons.svg',
        '├── index.html',
        '├── package.json',
        '└── vite.config.ts',
      ])
      return
    }

    if (cmd === 'open' || cmd === 'code') {
      const target = rest[0] || ''
      const id = resolveFileId(target)
      if (!id) {
        appendTerminal('err', [`open: file not found: ${target || '(missing)'}`])
        return
      }
      openFile(id)
      appendTerminal('out', [`Opened ${id}`])
      return
    }

    if (cmd === 'cat') {
      const target = rest[0] || ''
      const id = resolveFileId(target)
      if (!id) {
        appendTerminal('err', [`cat: ${target || '(missing)'}: No such file`])
        return
      }
      appendTerminal('out', terminalPreviewForFile(id))
      return
    }

    if (cmd === 'echo') {
      appendTerminal('out', [rest.join(' ')])
      return
    }

    if (cmd === 'date') {
      appendTerminal('out', [new Date().toString()])
      return
    }

    if (cmd === 'whoami') {
      appendTerminal('out', ['henry'])
      return
    }

    if (cmd === 'henryai' || cmd === 'chat') {
      setIsChatOpen(true)
      appendTerminal('out', ['HenryAI opened → pannello chat a destra'])
      return
    }

    if (cmd === 'history') {
      const opt = (rest[0] || '').toLowerCase()
      if (opt === '-c' || opt === 'clear') {
        setTerminalHistory([])
        setTerminalHistoryIndex(-1)
        appendTerminal('out', ['history cleared'])
        return
      }
      const start = Math.max(0, terminalHistory.length - 30)
      const lines = terminalHistory.slice(start).map((h, i) => `${start + i + 1}\t${h}`)
      appendTerminal('out', lines.length ? lines : ['(empty)'])
      return
    }

    if (cmd === 'themes') {
      appendTerminal('out', THEME_NAMES.map((t) => (t === selectedTheme ? `* ${t}` : `  ${t}`)))
      return
    }

    if (cmd === 'theme') {
      const arg = rest.join(' ').trim()
      if (!arg || arg.toLowerCase() === 'list') {
        appendTerminal('out', ['Temi disponibili:', ...THEME_NAMES.map((t) => (t === selectedTheme ? `* ${t}` : `- ${t}`))])
        return
      }
      const hit = THEME_NAMES.find((t) => t.toLowerCase() === arg.toLowerCase()) ?? THEME_NAMES.find((t) => t.toLowerCase().includes(arg.toLowerCase()))
      if (!hit) {
        appendTerminal('err', [`theme: tema non trovato: ${arg}`, "Suggerimento: usa 'theme list'"])
        return
      }
      setSelectedTheme(hit)
      appendTerminal('out', [`Theme set → ${hit}`])
      return
    }

    if (cmd === 'find') {
      const q = rest.join(' ').trim().toLowerCase()
      if (!q) {
        appendTerminal('err', ['usage: find <query>'])
        return
      }
      const hits = allFiles.filter((f) => f.label.toLowerCase().includes(q)).map((f) => f.label)
      appendTerminal('out', hits.length ? hits : ['(no matches)'])
      return
    }

    if (cmd === 'grep') {
      const pattern = rest[0] || ''
      const fileArg = rest[1] || ''
      if (!pattern || !fileArg) {
        appendTerminal('err', ['usage: grep <pattern> <file>'])
        return
      }
      const id = resolveFileId(fileArg)
      if (!id) {
        appendTerminal('err', [`grep: ${fileArg}: No such file`])
        return
      }
      const haystack = terminalPreviewForFile(id)
      let re: RegExp | null = null
      try {
        re = new RegExp(pattern, 'i')
      } catch {
        re = null
      }
      const hits = haystack
        .map((line, i) => ({ line, n: i + 1 }))
        .filter(({ line }) => (re ? re.test(line) : line.toLowerCase().includes(pattern.toLowerCase())))
        .slice(0, 80)
        .map(({ line, n }) => `${n}: ${line}`)
      appendTerminal('out', hits.length ? hits : ['(no matches)'])
      return
    }

    if (cmd === 'links') {
      const lines = [
        `email: ${CONTENT.contact.email}`,
        ...CONTENT.contact.links.map((l) => `${l.label}: ${l.href}`),
        '',
        'Tip: puoi cliccare i link direttamente dall’output.',
      ]
      appendTerminal('out', lines)
      return
    }

    if (cmd === 'neofetch') {
      const profile = CONTENT.profile
      const lines = [
        '      _                         _          ',
        '  ___| |__   ___ _ __ _ __   __| | _____   ',
        " / __| '_ \\ / _ \\ '__| '_ \\ / _` |/ _ \\ \\  ",
        "| (__| | | |  __/ |  | | | | (_| |  __/> > ",
        ' \\___|_| |_|\\___|_|  |_| |_|\\__,_|\\___/_/  ',
        '',
        `${profile.firstName} ${profile.lastName} @ ${CONTENT.siteName}`,
        `role:  ${profile.roles.join(' · ')}`,
        `stack: ${CONTENT.skills.stack.slice(0, 5).map((s) => s.name).join(' · ')}`,
        `cwd:   ${terminalCwd}`,
        `theme: ${selectedTheme}`,
        '',
        "Pro tip: prova 'theme solarized' oppure 'find html' 😄",
      ]
      appendTerminal('out', lines)
      return
    }

    if (cmd === 'fortune') {
      const fortunes = [
        'Ship small, ship often.',
        'Debugging is like being the detective in a crime movie where you are also the murderer.',
        'If it works, don’t touch it. If it doesn’t, write a test.',
        'Make it work, make it right, make it fast.',
        'Premature optimization is the root of (some) evil.',
      ]
      const idx = fortuneIndexRef.current % fortunes.length
      fortuneIndexRef.current = (fortuneIndexRef.current + 1) % fortunes.length
      appendTerminal('out', [fortunes[idx]!])
      return
    }

    if (cmd === 'calc') {
      const expr = rest.join(' ').trim()
      if (!expr) {
        appendTerminal('err', ['usage: calc <expr>'])
        return
      }
      if (!/^[0-9+\-*/().%\s]+$/.test(expr)) {
        appendTerminal('err', ['calc: espressione non valida (consentiti solo numeri e + - * / % ( ) )'])
        return
      }
      try {
        const value = Function(`"use strict"; return (${expr});`)() as unknown
        appendTerminal('out', [String(value)])
      } catch {
        appendTerminal('err', ['calc: errore nel calcolo'])
      }
      return
    }

    if (cmd === 'copy') {
      const arg = rest.join(' ').trim()
      if (arg === '--all') {
        const text = terminalEntriesRef.current
          .filter((e) => e.kind !== 'cmd')
          .map((e) => e.text)
          .join('\n')
        await copyToClipboard(text)
        return
      }
      if (arg) {
        await copyToClipboard(arg)
        return
      }
      const lastOut = [...terminalEntriesRef.current].reverse().find((e) => e.kind !== 'cmd')?.text || ''
      if (!lastOut) {
        appendTerminal('err', ['copy: niente da copiare'])
        return
      }
      await copyToClipboard(lastOut)
      return
    }

    if (cmd === 'npm' && rest[0] === 'run') {
      const script = rest[1] || ''
      if (script === 'dev') {
        const liveUrl = `https://${CONTENT.siteName}/`
        appendTerminal('out', [
          'vite v8 — dev server (simulato)',
          'VITE ready — Local: http://localhost:5173/',
          `LIVE: ${liveUrl}`,
        ])
        return
      }
      if (script === 'build') {
        const liveUrl = `https://${CONTENT.siteName}/`
        appendTerminal('out', ['tsc -b', 'vite build', '✓ built (simulato)', `Deployed: ${liveUrl}`])
        return
      }
      appendTerminal('err', [`npm: unknown script "${script}"`])
      return
    }

    if (cmd === 'git' && rest[0] === 'status') {
      appendTerminal('out', [
        'On branch main',
        'Your branch is up to date with origin/main.',
        '',
        'nothing to commit, working tree clean',
      ])
      return
    }

    appendTerminal('err', [`zsh: command not found: ${args[0]}`])
  }

  const renderEditor = () => {
    if (!activeFile) return null

    if (activeFile.id === 'home.tsx') {
      return <HomeView openFile={openFile} openChat={() => setIsChatOpen(true)} />
    }

    if (activeFile.id === 'about.html') {
      return <AboutView />
    }

    if (activeFile.id === 'skills.json') {
      return <SkillsView />
    }

    if (activeFile.id === 'portfolio.js') {
      return <PortfolioView />
    }

    if (activeFile.id === 'resume.ts') {
      return <ResumeView onOpenPdf={() => openFile('resume.pdf')} />
    }

    if (activeFile.id === 'certifications.js') {
      return <CertificationsView />
    }

    if (activeFile.id === 'blog.html') {
      return <BlogView />
    }

    if (activeFile.id === 'index.html') {
      return <IndexHtmlView />
    }

    if (activeFile.id === 'contact.css') {
      return <ContactView />
    }

    if (activeFile.id === 'README.md') {
      return (
        <CodeView
          lines={[
            codeLine('# henrydev.it ✨ (VS Code-style Portfolio)', 'keyword'),
            codeLine('', 'plain'),
            codeLine(
              'Questo portfolio è un’interfaccia ispirata a VS Code: file tree, tabs, quick open (Cmd/Ctrl+P), status bar, terminal panel e chat AI.',
              'plain',
            ),
            codeLine('', 'plain'),
            codeLine('- ✨ Apri i file dal pannello a sinistra per vedere contenuti diversi.', 'plain'),
            codeLine('- 🎨 Colori e chip sono coerenti su tutte le pagine.', 'plain'),
            codeLine('- 🧩 Personalizza nome, testi, progetti, skill e link dentro src/App.tsx.', 'plain'),
          ]}
        />
      )
    }

    if (activeFile.id === 'resume.pdf') {
      return <PdfView />
    }

    return null
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac')
      const mod = isMac ? e.metaKey : e.ctrlKey

      if (mod && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault()
        openQuickOpen()
        return
      }

      // Use `code` so it works across keyboard layouts (e.g. IT layout)
      if (mod && (e.code === 'Backquote' || e.key === '`')) {
        e.preventDefault()
        setIsTerminalOpen((v) => !v)
      }

      if (mod && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault()
        setIsSidebarOpen((v) => !v)
      }

      if (mod && (e.key === 't' || e.key === 'T')) {
        e.preventDefault()
        openQuickOpen()
      }

      if (mod && (e.key === 'w' || e.key === 'W')) {
        e.preventDefault()
        closeActiveTab()
      }

      if (mod && e.shiftKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault()
        toggleChat()
      }

      if (e.key === 'Escape') {
        if (activeMacMenu) {
          setActiveMacMenu(null)
          return
        }
        if (isQuickOpenOpen) {
          setIsQuickOpenOpen(false)
          return
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeMacMenu, closeActiveTab, isQuickOpenOpen])

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const root = macbarRef.current
      if (!root) return
      if (!(e.target instanceof Node)) return
      if (!root.contains(e.target)) setActiveMacMenu(null)
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [])

  useEffect(() => {
    const tick = () => setNow(new Date())
    tick()
    const intervalId = window.setInterval(tick, 30_000)
    return () => window.clearInterval(intervalId)
  }, [])

  const macDateTime = useMemo(() => {
    const parts = new Intl.DateTimeFormat('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now)

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
    const weekdayRaw = get('weekday').replace('.', '')
    const weekday = weekdayRaw ? `${weekdayRaw[0].toUpperCase()}${weekdayRaw.slice(1)}` : ''
    const day = get('day')
    const month = get('month').replace('.', '')
    const hour = get('hour')
    const minute = get('minute')

    return `${weekday} ${day} ${month} ${hour}:${minute}`.trim()
  }, [now])

  const workspaceLabel = CONTENT.siteName
  const activeFilename = activeFile?.label ?? 'home.tsx'
  const breadcrumb = `${workspaceLabel} › src › ${activeFilename}`
  const statusLanguage = statusLanguageForExt(activeFile?.ext)

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!resizeRef.current) return
      const dx = e.clientX - resizeRef.current.startX

      if (resizeRef.current.kind === 'chat') {
        const next = resizeRef.current.startWidth - dx
        setChatWidth(clamp(next, 280, 520))
        return
      }

      const next = resizeRef.current.startWidth + dx
      setSidebarWidth(clamp(next, 220, 520))
    }

    const onUp = () => {
      resizeRef.current = null
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  useEffect(() => {
    const root = desktopRef.current
    const cursor = cursorRef.current
    if (!root || !cursor) return

    const isClickable = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false
      return Boolean(
        target.closest(
          'a,button,[role="button"],input,textarea,select,label,.tab,.quickopen-item,.tree-item,.iconbtn,.status-item,.title-actionbtn,.macmenu-item,.left-resizer,.right-resizer',
        ),
      )
    }

    const onPointerMove = (e: PointerEvent) => {
      cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`
    }

    const onEnter = () => setIsCursorVisible(true)
    const onLeave = () => setIsCursorVisible(false)

    const onOver = (e: PointerEvent) => setIsCursorHover(isClickable(e.target))
    const onOut = (e: PointerEvent) => setIsCursorHover(isClickable(e.relatedTarget))

    root.addEventListener('pointermove', onPointerMove)
    root.addEventListener('pointerenter', onEnter)
    root.addEventListener('pointerleave', onLeave)
    root.addEventListener('pointerover', onOver)
    root.addEventListener('pointerout', onOut)

    return () => {
      root.removeEventListener('pointermove', onPointerMove)
      root.removeEventListener('pointerenter', onEnter)
      root.removeEventListener('pointerleave', onLeave)
      root.removeEventListener('pointerover', onOver)
      root.removeEventListener('pointerout', onOut)
    }
  }, [])

  useEffect(() => {
    if (!isThemeMenuOpen) return
    const onPointerDown = (e: PointerEvent) => {
      const el = themeMenuRef.current
      if (!el) return
      if (!(e.target instanceof Node)) return
      if (!el.contains(e.target)) setIsThemeMenuOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [isThemeMenuOpen])

  return (
    <div className="desktop" ref={desktopRef} style={themeStyle}>
      <header className="macbar" aria-label="Menu bar" ref={macbarRef}>
        <div className="macbar-left">
          <span className="mac-apple" aria-hidden="true">
            
          </span>
          <span className="mac-app">Code</span>
          <nav className="macmenu" aria-label="Application menu">
            {(
              ['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help', 'Copilot'] as const
            ).map((item) => (
              <div
                key={item}
                className="macmenu-root"
                onMouseEnter={() => {
                  if (activeMacMenu) setActiveMacMenu(item)
                }}
              >
                <button
                  type="button"
                  className="macmenu-item"
                  aria-haspopup="menu"
                  aria-expanded={activeMacMenu === item}
                  onClick={() => setActiveMacMenu((prev) => (prev === item ? null : item))}
                >
                  {item}
                </button>

                {activeMacMenu === item ? (
                  <div className="macmenu-popover" role="menu" aria-label={`${item} menu`}>
                    {item === 'File' ? (
                      <>
                        <button
                          type="button"
                          className="macmenu-dd-item"
                          role="menuitem"
                          onClick={() => {
                            openQuickOpen()
                            setActiveMacMenu(null)
                          }}
                        >
                          <span>New Tab</span>
                          <span className="macmenu-dd-shortcut">Ctrl+T</span>
                        </button>
                        <button
                          type="button"
                          className="macmenu-dd-item"
                          role="menuitem"
                          onClick={() => {
                            openQuickOpen()
                            setActiveMacMenu(null)
                          }}
                        >
                          <span>Open File…</span>
                          <span className="macmenu-dd-shortcut">Ctrl+P</span>
                        </button>
                        <div className="macmenu-sep" role="separator" />
                        <button
                          type="button"
                          className="macmenu-dd-item"
                          role="menuitem"
                          onClick={() => {
                            closeActiveTab()
                            setActiveMacMenu(null)
                          }}
                        >
                          <span>Close Tab</span>
                          <span className="macmenu-dd-shortcut">Ctrl+W</span>
                        </button>
                        <button
                          type="button"
                          className="macmenu-dd-item"
                          role="menuitem"
                          onClick={() => {
                            closeAllTabs()
                            setActiveMacMenu(null)
                          }}
                        >
                          <span>Close All Tabs</span>
                          <span className="macmenu-dd-shortcut" />
                        </button>
                        <div className="macmenu-sep" role="separator" />
                        <div className="macmenu-dd-header">OPEN RECENT</div>
                        {Array.from(new Set(openTabs.slice().reverse()))
                          .slice(0, 7)
                          .map((id) => {
                            const entry = allFiles.find((f) => f.id === id)
                            if (!entry) return null
                            return (
                              <button
                                key={id}
                                type="button"
                                className="macmenu-dd-item"
                                role="menuitem"
                                onClick={() => {
                                  openFile(id)
                                  setActiveMacMenu(null)
                                }}
                              >
                                <span>{entry.label}</span>
                                <span className="macmenu-dd-shortcut" />
                              </button>
                            )
                          })}
                        <div className="macmenu-sep" role="separator" />
                        <button
                          type="button"
                          className="macmenu-dd-item"
                          role="menuitem"
                          onClick={() => {
                            openFile('resume.pdf')
                            setActiveMacMenu(null)
                          }}
                        >
                          <span>Download Resume</span>
                          <span className="macmenu-dd-shortcut" />
                        </button>
                      </>
                    ) : null}

                    {item === 'Edit' ? (
                      <>
                        <button
                          type="button"
                          className="macmenu-dd-item"
                          role="menuitem"
                          onClick={() => {
                            openQuickOpen()
                            setActiveMacMenu(null)
                          }}
                        >
                          <span>Find…</span>
                          <span className="macmenu-dd-shortcut">Ctrl+F</span>
                        </button>
                        <button
                          type="button"
                          className="macmenu-dd-item"
                          role="menuitem"
                          onClick={() => {
                            document.execCommand?.('selectAll')
                            setActiveMacMenu(null)
                          }}
                        >
                          <span>Select All</span>
                          <span className="macmenu-dd-shortcut">Ctrl+A</span>
                        </button>
                        <button
                          type="button"
                          className="macmenu-dd-item"
                          role="menuitem"
                          onClick={() => {
                            document.execCommand?.('copy')
                            setActiveMacMenu(null)
                          }}
                        >
                          <span>Copy</span>
                          <span className="macmenu-dd-shortcut">Ctrl+C</span>
                        </button>
                      </>
                    ) : null}

                    {item === 'Selection' ? (
                      <>
                        <div className="macmenu-dd-header">SELECTION</div>
                        <button type="button" className="macmenu-dd-item is-disabled" role="menuitem" disabled>
                          <span>Expand Selection</span>
                          <span className="macmenu-dd-shortcut" />
                        </button>
                        <button type="button" className="macmenu-dd-item is-disabled" role="menuitem" disabled>
                          <span>Shrink Selection</span>
                          <span className="macmenu-dd-shortcut" />
                        </button>
                      </>
                    ) : null}

                    {item === 'View' ? (
                      <>
                        <button
                          type="button"
                          className="macmenu-dd-item"
                          role="menuitem"
                          onClick={() => {
                            openQuickOpen()
                            setActiveMacMenu(null)
                          }}
                        >
                          <span>Command Palette</span>
                          <span className="macmenu-dd-shortcut">Ctrl+P</span>
                        </button>
                        <button
                          type="button"
                          className="macmenu-dd-item"
                          role="menuitem"
                          onClick={() => {
                            setIsSidebarOpen((v) => !v)
                            setActiveMacMenu(null)
                          }}
                        >
                          <span>Toggle Sidebar</span>
                          <span className="macmenu-dd-shortcut">Ctrl+B</span>
                        </button>
                        <button
                          type="button"
                          className="macmenu-dd-item"
                          role="menuitem"
                          onClick={() => {
                            toggleTerminal()
                            setActiveMacMenu(null)
                          }}
                        >
                          <span>Toggle Terminal</span>
                          <span className="macmenu-dd-shortcut">Ctrl+`</span>
                        </button>
                        <button
                          type="button"
                          className="macmenu-dd-item"
                          role="menuitem"
                          onClick={() => {
                            toggleChat()
                            setActiveMacMenu(null)
                          }}
                        >
                          <span>Toggle Copilot ✨</span>
                          <span className="macmenu-dd-shortcut">Ctrl+Shift+C</span>
                        </button>
                        <div className="macmenu-sep" role="separator" />
                        <button
                          type="button"
                          className="macmenu-dd-item"
                          role="menuitem"
                          onClick={() => {
                            if (document.fullscreenElement) {
                              void document.exitFullscreen?.()
                            } else {
                              void document.documentElement.requestFullscreen?.()
                            }
                            setActiveMacMenu(null)
                          }}
                        >
                          <span>Enter Full Screen</span>
                          <span className="macmenu-dd-shortcut">F11</span>
                        </button>
                      </>
                    ) : null}

                    {item === 'Go' ? (
                      <>
                        <button
                          type="button"
                          className="macmenu-dd-item"
                          role="menuitem"
                          onClick={() => {
                            openQuickOpen()
                            setActiveMacMenu(null)
                          }}
                        >
                          <span>Go to File…</span>
                          <span className="macmenu-dd-shortcut">Ctrl+P</span>
                        </button>
                        <div className="macmenu-sep" role="separator" />
                        <div className="macmenu-dd-header">FILES</div>
                        {allFiles.slice(0, 12).map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            className="macmenu-dd-item"
                            role="menuitem"
                            onClick={() => {
                              openFile(f.id)
                              setActiveMacMenu(null)
                            }}
                          >
                            <span>{f.label}</span>
                            <span className="macmenu-dd-shortcut" />
                          </button>
                        ))}
                      </>
                    ) : null}

                    {item === 'Run' ? (
                      <>
                        <button
                          type="button"
                          className="macmenu-dd-item"
                          role="menuitem"
                          onClick={() => {
                            setIsTerminalOpen(true)
                            setActiveMacMenu(null)
                          }}
                        >
                          <span>Start Terminal</span>
                          <span className="macmenu-dd-shortcut">Ctrl+`</span>
                        </button>
                        <button
                          type="button"
                          className={`macmenu-dd-item ${terminalHistory.length === 0 ? 'is-disabled' : ''}`}
                          role="menuitem"
                          disabled={terminalHistory.length === 0}
                          onClick={() => {
                            const last = terminalHistory[terminalHistory.length - 1]
                            if (last) void execTerminal(last)
                            setActiveMacMenu(null)
                          }}
                        >
                          <span>Run Last Command</span>
                          <span className="macmenu-dd-shortcut" />
                        </button>
                      </>
                    ) : null}

                    {item === 'Terminal' ? (
                      <>
                        <button
                          type="button"
                          className="macmenu-dd-item"
                          role="menuitem"
                          onClick={() => {
                            setIsTerminalOpen(true)
                            setActiveMacMenu(null)
                          }}
                        >
                          <span>New Terminal</span>
                          <span className="macmenu-dd-shortcut">Ctrl+`</span>
                        </button>
                        <button
                          type="button"
                          className="macmenu-dd-item"
                          role="menuitem"
                          onClick={() => {
                            toggleTerminal()
                            setActiveMacMenu(null)
                          }}
                        >
                          <span>Toggle Terminal</span>
                          <span className="macmenu-dd-shortcut">Ctrl+`</span>
                        </button>
                        <div className="macmenu-sep" role="separator" />
                        <button
                          type="button"
                          className="macmenu-dd-item"
                          role="menuitem"
                          onClick={() => {
                            setTerminalEntries(buildWelcomeEntries())
                            setActiveMacMenu(null)
                          }}
                        >
                          <span>Clear Terminal</span>
                          <span className="macmenu-dd-shortcut" />
                        </button>
                      </>
                    ) : null}

                    {item === 'Help' ? (
                      <>
                        <button
                          type="button"
                          className="macmenu-dd-item"
                          role="menuitem"
                          onClick={() => {
                            openQuickOpen()
                            setActiveMacMenu(null)
                          }}
                        >
                          <span>Command Palette</span>
                          <span className="macmenu-dd-shortcut">Ctrl+P</span>
                        </button>
                        <div className="macmenu-sep" role="separator" />
                        <div className="macmenu-dd-header">KEYBOARD SHORTCUTS</div>
                        <div className="macmenu-kbrow">
                          <span className="macmenu-kbkey">Ctrl+P</span>
                          <span className="macmenu-kbtext">Go to file</span>
                        </div>
                        <div className="macmenu-kbrow">
                          <span className="macmenu-kbkey">Ctrl+B</span>
                          <span className="macmenu-kbtext">Toggle sidebar</span>
                        </div>
                        <div className="macmenu-kbrow">
                          <span className="macmenu-kbkey">Ctrl+`</span>
                          <span className="macmenu-kbtext">Toggle terminal</span>
                        </div>
                        <div className="macmenu-kbrow">
                          <span className="macmenu-kbkey">Ctrl+Shift+C</span>
                          <span className="macmenu-kbtext">Toggle Copilot ✨</span>
                        </div>
                        <div className="macmenu-kbrow">
                          <span className="macmenu-kbkey">Esc</span>
                          <span className="macmenu-kbtext">Close overlay</span>
                        </div>
                        <div className="macmenu-sep" role="separator" />
                        <button
                          type="button"
                          className="macmenu-dd-item"
                          role="menuitem"
                          onClick={() => {
                            openExternal('https://github.com/henry8913')
                            setActiveMacMenu(null)
                          }}
                        >
                          <span>GitHub ↗</span>
                          <span className="macmenu-dd-shortcut" />
                        </button>
                        <button
                          type="button"
                          className="macmenu-dd-item"
                          role="menuitem"
                          onClick={() => {
                            openFile('about.html')
                            setActiveMacMenu(null)
                          }}
                        >
                          <span>About</span>
                          <span className="macmenu-dd-shortcut" />
                        </button>
                      </>
                    ) : null}

                    {item === 'Copilot' ? (
                      <>
                        <button
                          type="button"
                          className="macmenu-dd-item"
                          role="menuitem"
                          onClick={() => {
                            resetChat()
                            setIsChatOpen(true)
                            setActiveMacMenu(null)
                          }}
                        >
                          <span>New Chat</span>
                          <span className="macmenu-dd-shortcut" />
                        </button>
                        <button
                          type="button"
                          className="macmenu-dd-item"
                          role="menuitem"
                          onClick={() => {
                            toggleChat()
                            setActiveMacMenu(null)
                          }}
                        >
                          <span>Toggle Copilot</span>
                          <span className="macmenu-dd-shortcut">Ctrl+Shift+C</span>
                        </button>
                        <div className="macmenu-sep" role="separator" />
                        <button
                          type="button"
                          className="macmenu-dd-item"
                          role="menuitem"
                          onClick={() => {
                            // ripulisce solo la chat corrente creando un nuovo thread
                            resetChat()
                            setActiveMacMenu(null)
                          }}
                        >
                          <span>Clear Chat</span>
                          <span className="macmenu-dd-shortcut" />
                        </button>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </nav>
        </div>
        <div className="macbar-right" aria-label="System status">
          <button type="button" className="macbar-btn" aria-label="Battery" title="Battery">
            <svg
              className="mac-svg"
              viewBox="0 0 28 24"
              width="18"
              height="16"
              aria-hidden="true"
              focusable="false"
            >
              <rect
                x="3"
                y="6.5"
                width="20"
                height="11"
                rx="2.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <rect x="24" y="10" width="2.5" height="4" rx="1" fill="currentColor" />
              <rect x="5.3" y="8.8" width="13.2" height="6.4" rx="1.6" fill="currentColor" />
            </svg>
          </button>
          <button type="button" className="macbar-btn" aria-label="Wi‑Fi" title="Wi‑Fi">
            <svg
              className="mac-svg"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M2.8 8.9C8.6 3.6 15.4 3.6 21.2 8.9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M5.8 12c4.2-3.8 8.2-3.8 12.4 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M9.1 15.1c2.3-2 3.5-2 5.8 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle cx="12" cy="18.4" r="1.3" fill="currentColor" />
            </svg>
          </button>
          <button type="button" className="macbar-btn" aria-label="Search" title="Search">
            <Codicon name="search" />
          </button>
          <button
            type="button"
            className="macbar-btn"
            aria-label="Control Center"
            title="Control Center"
          >
            <span className="mac-controlcenter" aria-hidden="true" />
          </button>
          <button type="button" className="macbar-btn" aria-label="Siri" title="Siri">
            <span className="mac-siri" aria-hidden="true" />
          </button>
          <div className="macbar-clock" aria-label="Date and time">
            {macDateTime}
          </div>
        </div>
      </header>

      <div
        className="vscode"
        style={{ ['--chatWidth' as never]: `${chatWidth}px`, ['--sidebarWidth' as never]: `${sidebarWidth}px` }}
      >
        <header className="titlebar">
        <div className="title-left">
          <button
            type="button"
            className="title-actionbtn mobile-hamburger"
            aria-label="Open Sidebar"
            title="Open Sidebar"
            onClick={() => openSidebarFromActivity(activeActivity)}
          >
            <Codicon name="menu" />
          </button>
          <div className="traffic" aria-hidden="true">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
        </div>
        <div className="title-center">
          <div className="title-nav" aria-label="Navigation controls">
            <button type="button" className="title-actionbtn" aria-label="Back" title="Back">
              <Codicon name="arrow-left" />
            </button>
            <button type="button" className="title-actionbtn" aria-label="Forward" title="Forward">
              <Codicon name="arrow-right" />
            </button>
            <button type="button" className="title-actionbtn" aria-label="Open in Browser" title="Open in Browser">
              <Codicon name="link-external" />
            </button>
          </div>
          <div className="title-divider" aria-hidden="true" />
          <button
            type="button"
            className="addressbar"
            aria-label="Address bar"
            onClick={() => {
              setIsQuickOpenOpen(true)
              setQuickOpenQuery('')
              setQuickOpenSelectedIndex(0)
            }}
          >
            <span className="addressbar-inner">
              <Codicon name="lock" />
              <span className="addressbar-text">{CONTENT.siteName}</span>
            </span>
          </button>
          <div className="title-divider" aria-hidden="true" />
          <button type="button" className="title-actionbtn" aria-label="Comments" title="Comments">
            <Codicon name="comment-add" />
          </button>
          <button type="button" className="title-actionbtn" aria-label="More" title="More">
            <Codicon name="chevron-down" />
          </button>
        </div>

        <div className="title-right">
          <button
            type="button"
            className="title-actionbtn"
            aria-label="Customize Layout"
            title="Customize Layout"
          >
            <Codicon name="layout" />
          </button>
          <button
            type="button"
            className="title-actionbtn"
            aria-label="Toggle Sidebar"
            title="Toggle Sidebar"
            onClick={() => setIsSidebarOpen((v) => !v)}
          >
            <Codicon name="layout-sidebar-left" />
          </button>
          <button
            type="button"
            className="title-actionbtn"
            aria-label="Toggle Panel"
            title="Toggle Panel"
            onClick={toggleTerminal}
          >
            <Codicon name="layout-panel" />
          </button>
          <button
            type="button"
            className="title-actionbtn"
            aria-label="Toggle Secondary Sidebar"
            title="Toggle Secondary Sidebar"
            onClick={toggleChat}
          >
            <Codicon name="layout-sidebar-right" />
          </button>
        </div>
      </header>

      <div
        className={`workbench ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'} ${isChatOpen ? 'chat-open' : 'chat-closed'} ${isTerminalOpen ? 'panel-open' : 'panel-closed'}`}
      >
        <aside className="activitybar" aria-label="Activity bar">
          <div className="activity-top">
            {(
              [
                { id: 'explorer', label: 'Explorer', icon: 'files' },
                { id: 'search', label: 'Search', icon: 'search' },
                { id: 'scm', label: 'Source Control', icon: 'source-control' },
                { id: 'run', label: 'Run and Debug', icon: 'debug-alt' },
                { id: 'extensions', label: 'Extensions', icon: 'extensions' },
                { id: 'remote', label: 'Remote Explorer', icon: 'remote-explorer' },
                { id: 'github-actions', label: 'GitHub Actions', icon: 'github-action' },
                { id: 'package', label: 'Containers', icon: 'package' },
              ] as const
            ).map((a) => (
              <button
                key={a.id}
                type="button"
                className={`activity-btn ${activeActivity === a.id ? 'active' : ''}`}
                aria-label={a.label}
                title={a.label}
                onClick={() => openSidebarFromActivity(a.id)}
              >
                {a.id === 'github-actions' ? (
                  <svg
                    className="activity-svg"
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <rect x="5" y="4" width="10" height="10" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    <rect x="9" y="10" width="10" height="10" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                ) : (
                  <Codicon name={a.icon} />
                )}
              </button>
            ))}
          </div>
          <div className="activity-bottom">
            <button
              type="button"
              className="activity-btn"
              aria-label="Profile"
              title="Profile"
              onClick={() => openSidebarFromActivity('profile')}
            >
              <Codicon name="account" />
            </button>
            <button
              type="button"
              className="activity-btn"
              aria-label="Settings"
              title="Settings"
              onClick={() => openSidebarFromActivity('settings')}
            >
              <Codicon name="settings-gear" />
            </button>
          </div>
        </aside>

        {(isSidebarOpen || isChatOpen || isTerminalOpen) && (
          <button
            type="button"
            className="mobile-backdrop"
            aria-label="Close overlays"
            onClick={closeOverlaysOnMobile}
          />
        )}

        {isSidebarOpen ? (
          <>
            <aside className="sidebar" aria-label={ACTIVITY_TITLES[activeActivity]}>
              <div className="sidebar-header">
                <div className="sidebar-title">{ACTIVITY_TITLES[activeActivity]}</div>
                <div className="sidebar-actions">
                  <button
                    type="button"
                    className="iconbtn sidebar-close"
                    aria-label="Close sidebar"
                    title="Close sidebar"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <Codicon name="close" />
                  </button>
                  <button type="button" className="iconbtn" aria-label="More actions" title="More actions">
                    <Codicon name="ellipsis" />
                  </button>
                </div>
              </div>

              <div className="tree">
                {activeActivity === 'settings' ? (
                  <div className="settings-panel">
                    <button
                      type="button"
                      className="settings-copilotbtn"
                      onClick={() => {
                        setIsChatOpen(true)
                        if (typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches) {
                          setIsTerminalOpen(false)
                        }
                        closeSidebarOnMobile()
                      }}
                    >
                      <span className="settings-copilotbtn-left">
                        <span className="settings-copilot-spark" aria-hidden="true">
                          ✦
                        </span>
                        <span>Open HenryAI&apos;s Copilot</span>
                      </span>
                      <span className="settings-copilotbtn-right">
                        <span className="settings-chip">AI</span>
                      </span>
                    </button>

                    <button
                      type="button"
                      className="settings-terminalbtn"
                      onClick={() => {
                        setIsTerminalOpen(true)
                        if (typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches) {
                          setIsChatOpen(false)
                        }
                        closeSidebarOnMobile()
                      }}
                    >
                      <span className="settings-terminalbtn-left">
                        <span className="settings-terminal-icon" aria-hidden="true">
                          <Codicon name="terminal" />
                        </span>
                        <span>Open Terminal</span>
                      </span>
                      <span className="settings-terminalbtn-right">
                        <span className="settings-chip settings-chip-terminal">TERM</span>
                      </span>
                    </button>

                    <div className="settings-section">
                      <div className="settings-sectiontitle">COLOR THEME</div>
                      <div className="settings-list">
                        {THEME_NAMES.map((name) => (
                            <button
                              key={name}
                              type="button"
                              className={`settings-item ${selectedTheme === name ? 'is-active' : ''}`}
                              onClick={() => setSelectedTheme(name)}
                            >
                              <span className="settings-dot" aria-hidden="true" />
                              <span className="settings-itemlabel">{name}</span>
                              {selectedTheme === name ? (
                                <span className="settings-check" aria-hidden="true">
                                  ✓
                                </span>
                              ) : null}
                            </button>
                          ))}
                      </div>
                    </div>

                    <div className="settings-section">
                      <div className="settings-sectiontitle">KEYBOARD SHORTCUTS</div>
                      <div className="settings-kb">
                        <div className="settings-kbrow">
                          <span className="settings-kbkey">Cmd/Ctrl+P</span>
                          <span className="settings-kbtext">Quick Open (cerca/apri file)</span>
                        </div>
                        <div className="settings-kbrow">
                          <span className="settings-kbkey">Cmd/Ctrl+B</span>
                          <span className="settings-kbtext">Toggle Sidebar</span>
                        </div>
                        <div className="settings-kbrow">
                          <span className="settings-kbkey">Cmd/Ctrl+`</span>
                          <span className="settings-kbtext">Toggle Terminal</span>
                        </div>
                        <div className="settings-kbrow">
                          <span className="settings-kbkey">Esc</span>
                          <span className="settings-kbtext">Chiudi Quick Open / overlay</span>
                        </div>
                      </div>
                    </div>

                    <div className="settings-section">
                      <div className="settings-sectiontitle">LINKS</div>
                      <div className="settings-list">
                        <a className="settings-link" href="https://github.com/henry8913" target="_blank" rel="noreferrer">
                          GitHub
                        </a>
                        <a
                          className="settings-link"
                          href="https://www.linkedin.com/in/henry-g-full-web-stack-developer/"
                          target="_blank"
                          rel="noreferrer"
                        >
                          LinkedIn
                        </a>
                        <a className="settings-link" href="https://medium.com" target="_blank" rel="noreferrer">
                          Medium
                        </a>
                      </div>
                    </div>
                  </div>
                ) : null}

                {activeActivity === 'profile' ? (
                  <div className="profile-panel">
                    <div className="profile-card">
                      <div className="profile-avatar" aria-hidden="true">
                        <Codicon name="account" />
                      </div>
                      <div className="profile-meta">
                        <div className="profile-name">
                          {CONTENT.profile.firstName} {CONTENT.profile.lastName}
                        </div>
                        <div className="profile-roles">{CONTENT.profile.roles.join(' · ')}</div>
                        <div className="profile-tagline">{CONTENT.profile.tagline}</div>
                      </div>
                    </div>

                    <div className="profile-actions">
                      <button
                        type="button"
                        className="settings-copilotbtn"
                        onClick={() => {
                          setIsChatOpen(true)
                          if (typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches) {
                            setIsTerminalOpen(false)
                          }
                          closeSidebarOnMobile()
                        }}
                      >
                        <span className="settings-copilotbtn-left">
                          <span className="settings-copilot-spark" aria-hidden="true">
                            ✦
                          </span>
                          <span>Open HenryAI&apos;s Copilot</span>
                        </span>
                        <span className="settings-copilotbtn-right">
                          <span className="settings-chip">AI</span>
                        </span>
                      </button>

                      <button
                        type="button"
                        className="settings-terminalbtn"
                        onClick={() => {
                          setIsTerminalOpen(true)
                          if (typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches) {
                            setIsChatOpen(false)
                          }
                          closeSidebarOnMobile()
                        }}
                      >
                        <span className="settings-terminalbtn-left">
                          <span className="settings-terminal-icon" aria-hidden="true">
                            <Codicon name="terminal" />
                          </span>
                          <span>Open Terminal</span>
                        </span>
                        <span className="settings-terminalbtn-right">
                          <span className="settings-chip settings-chip-terminal">TERM</span>
                        </span>
                      </button>
                    </div>

                    <div className="settings-section">
                      <div className="settings-sectiontitle">QUICK LINKS</div>
                      <div className="settings-list">
                        <button
                          type="button"
                          className="settings-link settings-link-btn"
                          onClick={() => {
                            openFile('about.html')
                            closeSidebarOnMobile()
                          }}
                        >
                          About
                        </button>
                        <button
                          type="button"
                          className="settings-link settings-link-btn"
                          onClick={() => {
                            openFile('portfolio.js')
                            closeSidebarOnMobile()
                          }}
                        >
                          Portfolio
                        </button>
                        <button
                          type="button"
                          className="settings-link settings-link-btn"
                          onClick={() => {
                            openFile('resume.pdf')
                            closeSidebarOnMobile()
                          }}
                        >
                          Resume (PDF)
                        </button>
                        <button
                          type="button"
                          className="settings-link settings-link-btn"
                          onClick={() => {
                            openFile('contact.css')
                            closeSidebarOnMobile()
                          }}
                        >
                          Contact
                        </button>
                      </div>
                    </div>

                    <div className="settings-section">
                      <div className="settings-sectiontitle">CONTACT</div>
                      <div className="settings-list">
                        <a className="settings-link" href={`mailto:${CONTENT.contact.email}`}>
                          Email
                        </a>
                        {CONTENT.contact.links.map((l) => (
                          <a key={l.href} className="settings-link" href={l.href} target="_blank" rel="noreferrer">
                            {l.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {activeActivity !== 'settings' && activeActivity !== 'profile' ? (
                  <>
                    <button type="button" className="section-header" onClick={() => setIsOpenEditorsOpen((v) => !v)}>
                  <span className="section-caret" aria-hidden="true">
                    {isOpenEditorsOpen ? <Codicon name="chevron-down" /> : <Codicon name="chevron-right" />}
                  </span>
                  <span className="section-title">OPEN EDITORS</span>
                  <span className="section-count">{openTabs.length}</span>
                </button>
                {isOpenEditorsOpen ? (
                  <div className="tree-children">
                    {openTabs.map((tabId) => {
                      const f = allFiles.find((x) => x.id === tabId)
                      if (!f) return null
                      return (
                        <button
                          key={tabId}
                          type="button"
                          className={`tree-item ${tabId === activeTab ? 'active' : ''}`}
                          onClick={() => {
                            setActiveTab(tabId)
                            closeSidebarOnMobile()
                          }}
                        >
                          <FileIcon ext={f.ext} />
                          <span className="tree-label">{f.label}</span>
                        </button>
                      )
                    })}
                  </div>
                ) : null}

                <button type="button" className="section-header" onClick={() => setIsPortfolioOpen((v) => !v)}>
                  <span className="section-caret" aria-hidden="true">
                    {isPortfolioOpen ? <Codicon name="chevron-down" /> : <Codicon name="chevron-right" />}
                  </span>
                  <span className="section-title">{FILE_TREE.label}</span>
                </button>

                {isPortfolioOpen ? (
                  <div className="tree-children">
                    {FILE_TREE.children.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className={`tree-item ${f.id === activeTab ? 'active' : ''}`}
                        onClick={() => openFile(f.id)}
                      >
                        <FileIcon ext={f.ext} />
                        <span className="tree-label">{f.label}</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                <button type="button" className="section-header" onClick={() => setIsOutlineOpen((v) => !v)}>
                  <span className="section-caret" aria-hidden="true">
                    {isOutlineOpen ? <Codicon name="chevron-down" /> : <Codicon name="chevron-right" />}
                  </span>
                  <span className="section-title">OUTLINE</span>
                </button>
                {isOutlineOpen ? <div className="section-empty">No symbols</div> : null}

                <button type="button" className="section-header" onClick={() => setIsTimelineOpen((v) => !v)}>
                  <span className="section-caret" aria-hidden="true">
                    {isTimelineOpen ? <Codicon name="chevron-down" /> : <Codicon name="chevron-right" />}
                  </span>
                  <span className="section-title">TIMELINE</span>
                </button>
                {isTimelineOpen ? <div className="section-empty">No timeline</div> : null}

                <button
                  type="button"
                  className={`tree-item tree-item-copilot ${isChatOpen ? '' : ''}`}
                  aria-label="Open AI chat"
                  onClick={() => {
                    setIsChatOpen(true)
                    // On mobile: don't stack chat on top of the terminal
                    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches) {
                      setIsTerminalOpen(false)
                    }
                    closeSidebarOnMobile()
                  }}
                >
                  <span className="file-icon" style={{ color: '#4fc1ff' }} aria-hidden="true">
                    <Codicon name="copilot" />
                  </span>
                  <span className="tree-label">HenryAI&apos;s Copilot</span>
                  <span className="tree-badge" aria-hidden="true">
                    AI
                  </span>
                </button>

                <button
                  type="button"
                  className="tree-item tree-item-terminal"
                  aria-label="Open terminal"
                  onClick={() => {
                    setIsTerminalOpen(true)
                    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches) {
                      setIsChatOpen(false)
                    }
                    closeSidebarOnMobile()
                  }}
                >
                  <span className="file-icon" style={{ color: 'rgba(106, 153, 85, 0.95)' }} aria-hidden="true">
                    <Codicon name="terminal" />
                  </span>
                  <span className="tree-label">Terminal</span>
                  <span className="tree-badge tree-badge-terminal" aria-hidden="true">
                    TERM
                  </span>
                </button>
                  </>
                ) : null}
              </div>
            </aside>
            <div
              className="left-resizer"
              role="separator"
              aria-label="Resize sidebar"
              onPointerDown={(e) => {
                resizeRef.current = { kind: 'sidebar', startX: e.clientX, startWidth: sidebarWidth }
                ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
              }}
            />
          </>
        ) : null}

        <section className="editor" aria-label="Editor">
          <div className="tabs" role="tablist">
            {openTabs.map((tabId) => {
              const tabFile = allFiles.find((f) => f.id === tabId)
              if (!tabFile) return null

              const isActive = tabId === activeTab

              return (
                <button
                  key={tabId}
                  type="button"
                  className={`tab ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(tabId)}
                  role="tab"
                  aria-selected={isActive}
                >
                  <FileIcon ext={tabFile.ext} />
                  <span className="tab-label">{tabFile.label}</span>
                  <span
                    className="tab-close"
                    role="button"
                    aria-label={`Close ${tabFile.label}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      closeTab(tabId)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') closeTab(tabId)
                    }}
                    tabIndex={0}
                  >
                    ×
                  </span>
                </button>
              )
            })}
          </div>
          <div className="breadcrumbbar" aria-label="Breadcrumbs">
            {breadcrumb}
          </div>

          <div className="editor-surface">{renderEditor()}</div>
        </section>

        {isChatOpen ? (
          <>
            <div
              className="right-resizer"
              role="separator"
              aria-label="Resize chat"
              onPointerDown={(e) => {
                resizeRef.current = { kind: 'chat', startX: e.clientX, startWidth: chatWidth }
                ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
              }}
            />
            <aside className="rightbar" aria-label="Chat">
              <div className="rightbar-header">
                <div className="rightbar-title">HENRYAI</div>
                <div className="rightbar-actions">
                  <button type="button" className="iconbtn" aria-label="New chat" title="New chat" onClick={resetChat}>
                    <Codicon name="add" />
                  </button>
                  <button
                    type="button"
                    className="iconbtn"
                    aria-label="Refresh"
                    title="Refresh"
                    onClick={() => setChatError(null)}
                  >
                    <Codicon name="refresh" />
                  </button>
                  <button
                    type="button"
                    className="iconbtn"
                    aria-label="Close chat"
                    title="Close chat"
                    onClick={() => setIsChatOpen(false)}
                  >
                    <Codicon name="close" />
                  </button>
                </div>
              </div>

              <div className="rightbar-subheader">
                <div className="rightbar-subtitle">
                  WORKSPACE · {CONTENT.siteName}
                  {activeChatThread?.title ? ` · ${activeChatThread.title}` : ''}
                </div>
                <div className="rightbar-subactions">
                  <button type="button" className="iconbtn" aria-label="More" title="More">
                    <Codicon name="kebab-vertical" />
                  </button>
                </div>
              </div>

              <div className="rightbar-body">
                {chatThreads.length > 1 ? (
                  <div className="chat-switcher" aria-label="Chats">
                    {chatThreads.map((t) => (
                      <div key={t.id} className={`chat-switcher-item${t.id === activeChatThreadId ? ' is-active' : ''}`}>
                        <button type="button" className="chat-switcher-btn" onClick={() => setActiveChatThreadId(t.id)}>
                          {t.title}
                        </button>
                        <button
                          type="button"
                          className="chat-switcher-close"
                          aria-label={`Close ${t.title}`}
                          title="Close"
                          onClick={() => closeChatThread(t.id)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                {chatMessages.length === 0 ? (
                  <div className="chat-welcome">
                    <div className="chat-welcome-logo" aria-hidden="true">
                      <Codicon name="copilot" />
                    </div>
                    <div className="chat-welcome-title">Hi! I&apos;m HenryAI&apos;s Copilot</div>
                    <div className="chat-welcome-subtitle">
                      Chiedimi qualsiasi cosa su progetti, skills, esperienza o contatti.
                    </div>
                    <div className="chat-suggestgrid" aria-label="Suggested questions">
                      {[
                        'Puoi presentarti in breve (chi sei e cosa fai)?',
                        'Quali sono i tuoi progetti migliori e che impatto hanno avuto?',
                        'Qual è il tuo stack e in cosa ti senti più forte?',
                        'Che tipo di ruoli/aziende stai cercando e su cosa vuoi lavorare?',
                        'Hai un CV? Puoi riassumere le tue esperienze principali?',
                        'Come posso contattarti per una proposta o una collaborazione?',
                      ].map((q) => (
                        <button key={q} type="button" className="chat-suggestbtn" onClick={() => void sendChat(q)}>
                          {q}
                        </button>
                      ))}
                    </div>
                    <div className="chat-welcome-footnote">
                      AI può sbagliare · per info critiche contattami direttamente
                    </div>
                  </div>
                ) : (
                  <div className="chat-thread" role="log" aria-label="Chat messages">
                    {chatMessages.map((m) => (
                      <div key={m.id} className={`chat-msg ${m.role}`}>
                        {m.role === 'assistant' ? (
                          <span className="chat-avatar" aria-hidden="true">
                            <Codicon name="copilot" />
                          </span>
                        ) : null}
                        <div className={`chat-bubble ${m.role}`}>{m.content}</div>
                      </div>
                    ))}
                    {chatIsSending ? (
                      <div className="chat-msg assistant">
                        <span className="chat-avatar" aria-hidden="true">
                          <Codicon name="copilot" />
                        </span>
                        <div className="chat-bubble assistant chat-typing">Sto scrivendo…</div>
                      </div>
                    ) : null}
                    {chatError ? <div className="chat-error">{chatError}</div> : null}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>

              <div className="rightbar-input">
                <textarea
                  className="chat-input"
                  placeholder="Ask about Henry’s projects, experience, skills…"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void sendChat(chatInput)
                    }
                  }}
                  rows={1}
                />
                <button
                  type="button"
                  className="chat-send"
                  aria-label="Send"
                  title="Send"
                  disabled={chatIsSending || chatInput.trim().length === 0}
                  onClick={() => void sendChat(chatInput)}
                >
                  <Codicon name="send" />
                </button>
              </div>
            </aside>
          </>
        ) : null}
        {isTerminalOpen ? (
          <section className="panel" aria-label="Panel">
            <div className="panel-tabs">
              <div className="panel-tabs-left">
                <div className="panel-tab active">TERMINAL</div>
                <div className="panel-subtab">zsh · {terminalCwd.replace(/^~\//, '') || '~'}</div>
              </div>
              <div className="panel-tabs-right">
                <button
                  type="button"
                  className="iconbtn"
                  aria-label="Clear terminal"
                  title="Clear terminal (Ctrl+L)"
                  onClick={() => setTerminalEntries(buildWelcomeEntries())}
                >
                  <Codicon name="trash" />
                </button>
                <button
                  type="button"
                  className="iconbtn"
                  aria-label="Copy output"
                  title="Copy output"
                  onClick={() => {
                    const text = terminalEntriesRef.current
                      .filter((e) => e.kind !== 'cmd')
                      .map((e) => e.text)
                      .join('\n')
                    void copyToClipboard(text)
                  }}
                >
                  <Codicon name="copy" />
                </button>
                <button
                  type="button"
                  className="iconbtn"
                  aria-label="Close terminal"
                  title="Close terminal"
                  onClick={() => setIsTerminalOpen(false)}
                >
                  <Codicon name="close" />
                </button>
              </div>
            </div>
            <div
              className="terminal"
              ref={terminalScrollRef}
              onMouseDown={(e) => {
                if ((e.target as HTMLElement | null)?.closest('input')) return
                terminalInputRef.current?.focus()
              }}
            >
              {terminalEntries.map((l) => {
                if (l.kind === 'cmd') {
                  return (
                    <div key={l.id} className="terminal-line terminal-cmd">
                      <span className="terminal-cwd">{(l.cwd || terminalCwd).replace(/^~\//, '')}</span>
                      <span className="terminal-prompt">%</span>
                      <span className="terminal-cmdtext">{l.text}</span>
                    </div>
                  )
                }
                return (
                  <div key={l.id} className={`terminal-line terminal-${l.kind}`}>
                    <TerminalText text={l.text} />
                  </div>
                )
              })}

              <div className="terminal-line terminal-inputrow">
                <span className="terminal-cwd">{terminalCwd.replace(/^~\//, '')}</span>
                <span className="terminal-prompt">%</span>
                <input
                  ref={terminalInputRef}
                  className="terminal-input"
                  value={terminalInput}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={(e) => {
                    const isMac = navigator.platform.toLowerCase().includes('mac')
                    const mod = isMac ? e.metaKey : e.ctrlKey

                    if (mod && (e.key === 'l' || e.key === 'L')) {
                      e.preventDefault()
                      setTerminalEntries(buildWelcomeEntries())
                      return
                    }

                    if (e.key === 'Escape') {
                      e.preventDefault()
                      setTerminalHistoryIndex(-1)
                      setTerminalInput('')
                      return
                    }

                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const next = terminalInput
                      setTerminalInput('')
                      void execTerminal(next)
                      return
                    }

                    if (e.key === 'ArrowUp') {
                      e.preventDefault()
                      if (terminalHistory.length === 0) return
                      const idx =
                        terminalHistoryIndex === -1
                          ? terminalHistory.length - 1
                          : Math.max(0, terminalHistoryIndex - 1)
                      setTerminalHistoryIndex(idx)
                      setTerminalInput(terminalHistory[idx] || '')
                      return
                    }

                    if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      if (terminalHistory.length === 0) return
                      if (terminalHistoryIndex === -1) return
                      const idx = terminalHistoryIndex + 1
                      if (idx >= terminalHistory.length) {
                        setTerminalHistoryIndex(-1)
                        setTerminalInput('')
                        return
                      }
                      setTerminalHistoryIndex(idx)
                      setTerminalInput(terminalHistory[idx] || '')
                      return
                    }

                    if (e.key === 'Tab') {
                      e.preventDefault()
                      const parsed = parseShellArgs(terminalInput)
                      const rawCmd = (parsed[0] || '').toLowerCase()

                      // Complete command name
                      if (parsed.length <= 1) {
                        const prefix = terminalInput.trim().toLowerCase()
                        if (!prefix) return
                        const candidates = Array.from(
                          new Set(TERMINAL_COMMANDS.flatMap((c) => [c.name, ...(c.aliases || [])])),
                        )
                        const hits = candidates.filter((c) => c.startsWith(prefix))
                        if (hits.length === 1) {
                          setTerminalInput(`${hits[0]} `)
                          return
                        }
                        if (hits.length > 1) {
                          appendTerminal('out', [hits.slice(0, 30).join('  ')])
                          return
                        }
                        return
                      }

                      const files = allFiles.map((f) => f.label)

                      // Complete file arg for open/code/cat
                      if ((rawCmd === 'open' || rawCmd === 'code' || rawCmd === 'cat') && parsed.length === 2) {
                        const partial = (parsed[1] || '').toLowerCase()
                        const hit = files.find((f) => f.toLowerCase().startsWith(partial))
                        if (!hit) return
                        setTerminalInput(`${rawCmd} ${hit}`)
                        return
                      }

                      // Complete file arg for grep <pattern> <file>
                      if (rawCmd === 'grep' && parsed.length === 3) {
                        const partial = (parsed[2] || '').toLowerCase()
                        const hit = files.find((f) => f.toLowerCase().startsWith(partial))
                        if (!hit) return
                        setTerminalInput(`grep ${parsed[1]} ${hit}`)
                        return
                      }

                      // Complete dirs for cd
                      if (rawCmd === 'cd' && parsed.length === 2) {
                        const partial = (parsed[1] || '').toLowerCase()
                        const dirs = ['~', '..', 'src', 'public']
                        const hit = dirs.find((d) => d.toLowerCase().startsWith(partial))
                        if (!hit) return
                        setTerminalInput(`cd ${hit}`)
                      }
                    }
                  }}
                />
              </div>
              <div ref={terminalEndRef} />
            </div>
          </section>
        ) : null}
      </div>

      <footer className="statusbar" aria-label="Status bar">
        <div className="status-left">
          <div className="status-item status-inline status-branch">
            <Codicon name="remote" />
            <Codicon name="git-branch" />
            <span>main</span>
          </div>
          <div className="status-item status-inline status-project">
            <Codicon name="sync" />
            <span>{FILE_TREE.label}</span>
          </div>
        </div>
        <div className="status-right">
          <div className="status-item status-loc">Ln 1, Col 1</div>
          <div className="status-item status-spaces">Spaces: 4</div>
          <div className="status-item status-utf">UTF-8</div>
          <div className="status-item status-eol">LF</div>
          <div className="status-item status-lang">{statusLanguage}</div>
          <div className="status-divider" aria-hidden="true" />
          <div className="status-item status-inline status-go">
            <Codicon name="radio-tower" />
            <span>Go Live</span>
          </div>
          <div className="status-theme-wrap" ref={themeMenuRef}>
            <button
              type="button"
              className="status-item status-dropdown status-theme"
              onClick={() => setIsThemeMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={isThemeMenuOpen}
              title="Cambia tema"
            >
              {selectedTheme} <Codicon name="chevron-down" className="status-dropdown-icon" />
            </button>
            {isThemeMenuOpen ? (
              <div className="status-menu" role="menu" aria-label="Theme menu">
                {THEME_NAMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="menuitem"
                    className={`status-menu-item${t === selectedTheme ? ' is-active' : ''}`}
                    onClick={() => {
                      setSelectedTheme(t)
                      setIsThemeMenuOpen(false)
                    }}
                  >
                    <span className="status-menu-label">{t}</span>
                    {t === selectedTheme ? (
                      <span className="status-menu-check" aria-hidden="true">
                        ✓
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="status-item status-icon status-copilot"
            aria-label="Apri HenryAI Copilot"
            title="Apri HenryAI Copilot"
            onClick={toggleChat}
          >
            <Codicon name="copilot" />
          </button>
          <div className="status-item status-icon status-bell">
            <Codicon name="bell" />
          </div>
        </div>
      </footer>

      <QuickOpen
        open={isQuickOpenOpen}
        query={quickOpenQuery}
        setQuery={setQuickOpenQuery}
        items={quickOpenItems}
        selectedIndex={quickOpenSelectedIndex}
        setSelectedIndex={setQuickOpenSelectedIndex}
        onSelect={(id) => {
          openFile(id)
          setIsQuickOpenOpen(false)
        }}
        onClose={() => setIsQuickOpenOpen(false)}
      />
      <div
        ref={cursorRef}
        className={`site-cursor${isCursorVisible ? ' is-visible' : ''}${isCursorHover ? ' is-hover' : ''}`}
        aria-hidden="true"
      >
        <svg className="cursor-svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="cursorGrad" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" style={{ stopColor: 'var(--cursor-stop-1)' }} />
              <stop offset="1" style={{ stopColor: 'var(--cursor-stop-2)' }} />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="32" fill="none" stroke="url(#cursorGrad)" strokeWidth="4" />
          <line x1="50" y1="0" x2="50" y2="34" stroke="url(#cursorGrad)" strokeWidth="5" strokeLinecap="square" />
          <line x1="50" y1="66" x2="50" y2="100" stroke="url(#cursorGrad)" strokeWidth="5" strokeLinecap="square" />
          <line x1="0" y1="50" x2="34" y2="50" stroke="url(#cursorGrad)" strokeWidth="5" strokeLinecap="square" />
          <line x1="66" y1="50" x2="100" y2="50" stroke="url(#cursorGrad)" strokeWidth="5" strokeLinecap="square" />
          <circle cx="50" cy="50" r="5" fill="url(#cursorGrad)" />
        </svg>
      </div>
      </div>
    </div>
  )
}

export default App
