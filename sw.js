// Service Worker for Roadmap Study Tracker
// Provides offline functionality and caching

const CACHE_NAME = 'roadmap-teleologia-v1.0.0';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching files');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Service Worker: All files cached');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Cache failed', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activated');
            return self.clients.claim();
        })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip external requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if available
                if (response) {
                    console.log('Service Worker: Serving from cache', event.request.url);
                    return response;
                }
                
                // Otherwise, fetch from network
                console.log('Service Worker: Fetching from network', event.request.url);
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache if not a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response
                        const responseToCache = response.clone();
                        
                        // Add to cache
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch((error) => {
                        console.error('Service Worker: Fetch failed', error);
                        
                        // Return offline page for navigation requests
                        if (event.request.destination === 'document') {
                            return caches.match('./index.html');
                        }
                        
                        // Return a generic offline response for other requests
                        return new Response('Offline - Content not available', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Background sync for progress saving
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync-progress') {
        console.log('Service Worker: Background sync triggered');
        event.waitUntil(syncProgress());
    }
});

// Sync progress data when online
async function syncProgress() {
    try {
        // Get stored progress data
        const progressData = await getStoredProgress();
        
        if (progressData && progressData.needsSync) {
            console.log('Service Worker: Syncing progress data');
            
            // Mark as synced
            progressData.needsSync = false;
            progressData.lastSynced = new Date().toISOString();
            
            // Store updated data
            await storeProgress(progressData);
            
            // Notify main thread
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'PROGRESS_SYNCED',
                    data: progressData
                });
            });
        }
    } catch (error) {
        console.error('Service Worker: Progress sync failed', error);
    }
}

// Helper functions for IndexedDB operations
async function getStoredProgress() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('RoadmapDB', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['progress'], 'readonly');
            const store = transaction.objectStore('progress');
            const getRequest = store.get('current');
            
            getRequest.onsuccess = () => resolve(getRequest.result);
            getRequest.onerror = () => reject(getRequest.error);
        };
        
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('progress')) {
                db.createObjectStore('progress');
            }
        };
    });
}

async function storeProgress(data) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('RoadmapDB', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['progress'], 'readwrite');
            const store = transaction.objectStore('progress');
            const putRequest = store.put(data, 'current');
            
            putRequest.onsuccess = () => resolve();
            putRequest.onerror = () => reject(putRequest.error);
        };
    });
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'SAVE_PROGRESS':
            // Store progress data for background sync
            storeProgress({ ...data, needsSync: true })
                .then(() => {
                    event.ports[0].postMessage({ success: true });
                })
                .catch((error) => {
                    event.ports[0].postMessage({ success: false, error: error.message });
                });
            break;
            
        case 'GET_CACHE_STATUS':
            caches.has(CACHE_NAME)
                .then((hasCache) => {
                    event.ports[0].postMessage({ 
                        cached: hasCache,
                        version: CACHE_NAME 
                    });
                });
            break;
            
        default:
            console.log('Service Worker: Unknown message type', type);
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'progress-backup') {
        event.waitUntil(syncProgress());
    }
});

// Push notifications (for future use)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Nova atualização disponível!',
        icon: './manifest.json',
        badge: './manifest.json',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Ver Roadmap',
                icon: './manifest.json'
            },
            {
                action: 'close',
                title: 'Fechar',
                icon: './manifest.json'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Roadmap de Estudos', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('./')
        );
    }
});

// Error handling
self.addEventListener('error', (event) => {
    console.error('Service Worker: Error occurred', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker: Unhandled promise rejection', event.reason);
});

console.log('Service Worker: Script loaded');

