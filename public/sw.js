// Service Worker CoiffPro - version minimale
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', () => self.clients.claim())
// Pas de cache pour éviter les erreurs au premier chargement
