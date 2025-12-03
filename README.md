# PersistDo - Persistent Daily To-Do

A clean, offline-first daily task manager built with React, TypeScript, and Tailwind CSS.

## Features
- **Auto-Restore**: Tasks uncheck themselves after 12 or 24 hours.
- **Persistence**: All data stored in localStorage.
- **Streak Tracking**: Keeps track of daily activity.
- **Dark Mode**: Toggleable theme.
- **Focus Mode**: View one task at a time.

## Editing Logic
- **Intervals**: Edit `App.tsx` logic inside `checkResets` function if you need custom intervals beyond 12/24h.
- **Colors**: Modified in `index.html` (Tailwind config) or `components/TaskItem.tsx`.
- **Animations**: Defined in `index.html` tailwind config.

## Deployment Guide

This is a static React application.

### 1. Build Process
If you are using a bundler (Vite/CRA):
1. Run `npm run build`.
2. The output folder (usually `dist` or `build`) contains the static files.

### 2. Deploy to Vercel (Recommended)
1. Push code to GitHub.
2. Login to Vercel -> "Add New Project".
3. Import your repository.
4. Framework Preset: Select "Vite" or "Create React App" depending on your setup.
5. Click **Deploy**.

### 3. Deploy to Netlify
1. Drag and drop the `dist` folder into Netlify Drop.
2. OR connect GitHub repo and set build command `npm run build` and publish directory `dist`.

### 4. Deploy to GitHub Pages
1. Install `gh-pages` package.
2. Add `"homepage": "https://<user>.github.io/<repo>"` to package.json.
3. Run `npm run deploy`.

### 5. Replit
1. Create a React (TypeScript) repl.
2. Copy these files into the `src` folder.
3. Hit Run.
