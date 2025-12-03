# PersistDo - Persistent Daily To-Do

## [text](https://todo-app-liard-eta-64.vercel.app/)

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

