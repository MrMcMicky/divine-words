# Divine Words - Bible Verse Webapp

## Project Overview
Divine Words is a beautiful Bible verse web application with romantic design, featuring multi-language support (German/English) and daily encouraging verses.

## Production Status
- **Status**: ✅ ACTIVE (Production)
- **URL**: https://divine-words.assistent.my.id
- **Port**: 8016
- **Start Command**: `./start-service.sh`
- **SSL**: ✅ Configured (expires 2025-10-25)

## Features
- 🌐 **Multi-language Support**: Switch between German and English
- 📖 **Multiple Bible Translations**: 
  - German: Elberfelder 1905, Luther 1912, Schlachter 1951
  - English: King James Version, World English Bible, American Standard Version
- 🔍 **Verse Search**: Search any Bible verse by book, chapter, and verse
- ✨ **Daily Encouraging Verse**: Automatically displays a new encouraging verse each day in both languages
- 💕 **Romantic Design**: Beautiful UI with soft colors, hearts animation, and elegant typography
- 📱 **Responsive**: Works perfectly on all devices

## Technology Stack
- **Frontend**: Vue 3 + Vite
- **Styling**: Tailwind CSS with custom romantic theme
- **API**: bible-api.com (free Bible verse API)
- **Icons**: Heroicons
- **Font**: Playfair Display (serif), Dancing Script (decorative)

## Project Structure
```
/var/www/divine-words/
├── dist/               # Production build
├── src/                # Source files
│   ├── App.vue        # Main component
│   ├── main.js        # Entry point
│   └── style.css      # Global styles
├── public/            # Static assets
│   └── heart.svg      # Favicon
├── package.json       # Dependencies
├── vite.config.js     # Vite configuration
├── tailwind.config.js # Tailwind configuration
├── start-service.sh   # Service start script
└── README.md          # Project documentation
```

## Deployment
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start service
./start-service.sh

# Service runs on port 8016
# Nginx proxies divine-words.assistent.my.id to localhost:8016
```

## Git Repository
- **Repository**: https://github.com/MrMcMicky/divine-words
- **Branch**: main
- **Status**: ✅ Pushed to GitHub

## Monitoring
Check service status:
```bash
lsof -i :8016
```

View logs:
```bash
tail -f service.log
```

## Updates & Fixes
- 2025-01-27: Initial creation with all requested features