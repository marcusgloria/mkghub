// Roadmap Study Progress Tracker
// JavaScript for Teleology and Christian Purpose of Life Study Guide

class RoadmapTracker {
    constructor() {
        this.currentPhase = 1;
        this.progress = this.loadProgress();
        this.phases = {
            1: { name: 'Fundamentos em Teleologia', materials: 11, activities: 4 },
            2: { name: 'Teleologia e Religião', materials: 7, activities: 4 },
            3: { name: 'Antigo Testamento', materials: 14, activities: 4 },
            4: { name: 'Novo Testamento', materials: 16, activities: 5 },
            5: { name: 'Visões Contemporâneas', materials: 9, activities: 5 }
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updatePhaseColors();
        this.updateProgressBars();
        this.showPhase(this.currentPhase);
        this.setupServiceWorker();
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const phase = parseInt(link.dataset.phase);
                this.showPhase(phase);
            });
        });

        // Mobile navigation toggle
        const navToggle = document.getElementById('navToggle');
        const navList = document.getElementById('navList');
        
        if (navToggle && navList) {
            navToggle.addEventListener('click', () => {
                navList.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
        }

        // Progress tracking checkboxes
        document.querySelectorAll('.material-checkbox, .activity-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.updateProgress(e.target.id, e.target.checked);
                this.updateProgressBars();
                this.saveProgress();
            });
        });

        // Action buttons
        document.getElementById('resetProgress')?.addEventListener('click', () => {
            this.resetProgress();
        });

        document.getElementById('exportProgress')?.addEventListener('click', () => {
            this.exportProgress();
        });

        document.getElementById('importBtn')?.addEventListener('click', () => {
            document.getElementById('importProgress').click();
        });

        document.getElementById('importProgress')?.addEventListener('change', (e) => {
            this.importProgress(e.target.files[0]);
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.navigatePhase(-1);
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.navigatePhase(1);
                        break;
                    case 's':
                        e.preventDefault();
                        this.exportProgress();
                        break;
                }
            }
        });

        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Phase Navigation
    showPhase(phaseNumber) {
        // Hide all phases
        document.querySelectorAll('.phase-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected phase
        const targetPhase = document.getElementById(`phase${phaseNumber}`);
        if (targetPhase) {
            targetPhase.classList.add('active');
            this.currentPhase = phaseNumber;
            
            // Update navigation
            this.updateNavigation(phaseNumber);
            
            // Update colors
            this.updatePhaseColors();
            
            // Animate phase transition
            this.animatePhaseTransition();
            
            // Update URL hash
            window.history.replaceState(null, null, `#phase${phaseNumber}`);
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    navigatePhase(direction) {
        const newPhase = this.currentPhase + direction;
        if (newPhase >= 1 && newPhase <= 5) {
            this.showPhase(newPhase);
        }
    }

    updateNavigation(activePhase) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (parseInt(link.dataset.phase) === activePhase) {
                link.classList.add('active');
            }
        });
    }

    // Color Theme Management
    updatePhaseColors() {
        const body = document.body;
        
        // Remove all phase classes
        body.classList.remove('phase-1', 'phase-2', 'phase-3', 'phase-4', 'phase-5');
        
        // Add current phase class
        body.classList.add(`phase-${this.currentPhase}`);
        
        // Update theme color meta tag
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        const colors = {
            1: '#2E4057',
            2: '#5D4E75',
            3: '#8B4513',
            4: '#228B22',
            5: '#B22222'
        };
        
        if (themeColorMeta) {
            themeColorMeta.content = colors[this.currentPhase];
        }
    }

    // Progress Management
    updateProgress(itemId, checked) {
        if (!this.progress.items) {
            this.progress.items = {};
        }
        
        this.progress.items[itemId] = checked;
        
        // Add visual feedback
        const item = document.getElementById(itemId)?.closest('.material-item, .activity-item');
        if (item) {
            if (checked) {
                item.classList.add('completed');
                this.showCompletionAnimation(item);
            } else {
                item.classList.remove('completed');
            }
        }
    }

    updateProgressBars() {
        // Calculate overall progress
        const totalItems = this.getTotalItems();
        const completedItems = this.getCompletedItems();
        const overallPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
        
        // Update overall progress
        const overallProgressBar = document.getElementById('overallProgress');
        const overallProgressText = document.getElementById('progressText');
        
        if (overallProgressBar) {
            overallProgressBar.style.width = `${overallPercentage}%`;
        }
        
        if (overallProgressText) {
            overallProgressText.textContent = `${overallPercentage}% Concluído`;
        }
        
        // Update individual phase progress
        for (let phase = 1; phase <= 5; phase++) {
            const phaseProgress = this.getPhaseProgress(phase);
            const progressBar = document.querySelector(`[data-progress="phase${phase}"]`);
            const progressText = document.querySelector(`[data-progress-text="phase${phase}"]`);
            
            if (progressBar) {
                progressBar.style.width = `${phaseProgress}%`;
            }
            
            if (progressText) {
                progressText.textContent = `${phaseProgress}% Concluído`;
            }
        }
        
        // Update progress in storage
        this.progress.lastUpdated = new Date().toISOString();
        this.progress.overallProgress = overallPercentage;
    }

    getPhaseProgress(phase) {
        const phaseItems = this.getPhaseItems(phase);
        const completedPhaseItems = phaseItems.filter(id => this.progress.items[id]).length;
        return phaseItems.length > 0 ? Math.round((completedPhaseItems / phaseItems.length) * 100) : 0;
    }

    getPhaseItems(phase) {
        const items = [];
        const phaseSection = document.getElementById(`phase${phase}`);
        
        if (phaseSection) {
            phaseSection.querySelectorAll('.material-checkbox, .activity-checkbox').forEach(checkbox => {
                items.push(checkbox.id);
            });
        }
        
        return items;
    }

    getTotalItems() {
        return document.querySelectorAll('.material-checkbox, .activity-checkbox').length;
    }

    getCompletedItems() {
        return Object.values(this.progress.items || {}).filter(Boolean).length;
    }

    // Animation Effects
    animatePhaseTransition() {
        const activePhase = document.querySelector('.phase-section.active');
        if (activePhase) {
            activePhase.style.opacity = '0';
            activePhase.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                activePhase.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                activePhase.style.opacity = '1';
                activePhase.style.transform = 'translateY(0)';
            }, 50);
        }
    }

    showCompletionAnimation(element) {
        element.style.transform = 'scale(1.02)';
        element.style.transition = 'transform 0.3s ease';
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 300);
        
        // Add a subtle glow effect
        element.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.3)';
        setTimeout(() => {
            element.style.boxShadow = '';
        }, 1000);
    }

    // Data Persistence
    loadProgress() {
        try {
            const saved = localStorage.getItem('roadmapProgress');
            if (saved) {
                const progress = JSON.parse(saved);
                
                // Restore checkbox states
                if (progress.items) {
                    Object.entries(progress.items).forEach(([id, checked]) => {
                        const checkbox = document.getElementById(id);
                        if (checkbox) {
                            checkbox.checked = checked;
                            if (checked) {
                                const item = checkbox.closest('.material-item, .activity-item');
                                if (item) {
                                    item.classList.add('completed');
                                }
                            }
                        }
                    });
                }
                
                return progress;
            }
        } catch (error) {
            console.error('Error loading progress:', error);
        }
        
        return { items: {}, lastUpdated: new Date().toISOString() };
    }

    saveProgress() {
        try {
            localStorage.setItem('roadmapProgress', JSON.stringify(this.progress));
        } catch (error) {
            console.error('Error saving progress:', error);
            this.showNotification('Erro ao salvar progresso', 'error');
        }
    }

    resetProgress() {
        if (confirm('Tem certeza de que deseja limpar todo o progresso? Esta ação não pode ser desfeita.')) {
            // Clear localStorage
            localStorage.removeItem('roadmapProgress');
            
            // Reset all checkboxes
            document.querySelectorAll('.material-checkbox, .activity-checkbox').forEach(checkbox => {
                checkbox.checked = false;
                const item = checkbox.closest('.material-item, .activity-item');
                if (item) {
                    item.classList.remove('completed');
                }
            });
            
            // Reset progress object
            this.progress = { items: {}, lastUpdated: new Date().toISOString() };
            
            // Update progress bars
            this.updateProgressBars();
            
            this.showNotification('Progresso limpo com sucesso!', 'success');
        }
    }

    exportProgress() {
        try {
            const exportData = {
                ...this.progress,
                exportDate: new Date().toISOString(),
                version: '1.0',
                roadmapTitle: 'Teleologia e Propósito Cristão da Vida'
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `roadmap-progress-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showNotification('Progresso exportado com sucesso!', 'success');
        } catch (error) {
            console.error('Error exporting progress:', error);
            this.showNotification('Erro ao exportar progresso', 'error');
        }
    }

    importProgress(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (importedData.items) {
                    // Confirm import
                    if (confirm('Importar progresso irá substituir o progresso atual. Continuar?')) {
                        this.progress = importedData;
                        this.saveProgress();
                        
                        // Reload page to apply imported progress
                        window.location.reload();
                    }
                } else {
                    this.showNotification('Arquivo de progresso inválido', 'error');
                }
            } catch (error) {
                console.error('Error importing progress:', error);
                this.showNotification('Erro ao importar progresso', 'error');
            }
        };
        
        reader.readAsText(file);
    }

    // Notifications
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Service Worker for Offline Support
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('Service Worker registered successfully:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }

    // Search Functionality
    setupSearch() {
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Buscar materiais...';
        searchInput.className = 'search-input';
        
        searchInput.style.cssText = `
            width: 100%;
            max-width: 400px;
            padding: 10px 15px;
            border: 2px solid var(--current-accent);
            border-radius: 25px;
            font-size: 14px;
            margin: 20px auto;
            display: block;
            outline: none;
            transition: all 0.3s ease;
        `;
        
        // Add search to each phase
        document.querySelectorAll('.materials-section').forEach(section => {
            const searchContainer = document.createElement('div');
            searchContainer.appendChild(searchInput.cloneNode(true));
            section.insertBefore(searchContainer, section.querySelector('.material-category'));
        });
        
        // Search functionality
        document.querySelectorAll('.search-input').forEach(input => {
            input.addEventListener('input', (e) => {
                this.performSearch(e.target.value, e.target.closest('.materials-section'));
            });
        });
    }

    performSearch(query, section) {
        const materials = section.querySelectorAll('.material-item');
        const searchTerm = query.toLowerCase();
        
        materials.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // Statistics
    getStatistics() {
        const stats = {
            totalItems: this.getTotalItems(),
            completedItems: this.getCompletedItems(),
            overallProgress: this.progress.overallProgress || 0,
            phaseProgress: {},
            timeSpent: this.calculateTimeSpent(),
            lastActivity: this.progress.lastUpdated
        };
        
        for (let phase = 1; phase <= 5; phase++) {
            stats.phaseProgress[phase] = this.getPhaseProgress(phase);
        }
        
        return stats;
    }

    calculateTimeSpent() {
        // Simple time tracking based on progress updates
        const startDate = new Date(this.progress.startDate || new Date().toISOString());
        const lastUpdate = new Date(this.progress.lastUpdated);
        const diffTime = Math.abs(lastUpdate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
            days: diffDays,
            estimatedHours: this.getCompletedItems() * 0.5 // Estimate 30 minutes per item
        };
    }

    // Accessibility Features
    setupAccessibility() {
        // Add ARIA labels
        document.querySelectorAll('.material-checkbox, .activity-checkbox').forEach(checkbox => {
            const label = checkbox.nextElementSibling;
            if (label) {
                checkbox.setAttribute('aria-label', label.textContent.trim());
            }
        });
        
        // Add keyboard shortcuts info
        const shortcutsInfo = document.createElement('div');
        shortcutsInfo.innerHTML = `
            <details style="margin: 20px 0; padding: 15px; background: var(--light-gray); border-radius: 8px;">
                <summary style="cursor: pointer; font-weight: 600;">Atalhos do Teclado</summary>
                <ul style="margin-top: 10px; padding-left: 20px;">
                    <li><kbd>Ctrl/Cmd + ←</kbd> - Fase anterior</li>
                    <li><kbd>Ctrl/Cmd + →</kbd> - Próxima fase</li>
                    <li><kbd>Ctrl/Cmd + S</kbd> - Exportar progresso</li>
                    <li><kbd>Tab</kbd> - Navegar entre elementos</li>
                    <li><kbd>Space</kbd> - Marcar/desmarcar checkbox</li>
                </ul>
            </details>
        `;
        
        const firstPhase = document.querySelector('.phase-section');
        if (firstPhase) {
            firstPhase.insertBefore(shortcutsInfo, firstPhase.firstChild);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const tracker = new RoadmapTracker();
    
    // Make tracker globally available for debugging
    window.roadmapTracker = tracker;
    
    // Handle initial hash navigation
    const hash = window.location.hash;
    if (hash && hash.startsWith('#phase')) {
        const phaseNumber = parseInt(hash.replace('#phase', ''));
        if (phaseNumber >= 1 && phaseNumber <= 5) {
            tracker.showPhase(phaseNumber);
        }
    }
    
    // Setup additional features
    tracker.setupAccessibility();
    
    // Show welcome message for first-time users
    if (!localStorage.getItem('roadmapProgress')) {
        setTimeout(() => {
            tracker.showNotification('Bem-vindo ao Roadmap de Estudos! Seu progresso será salvo automaticamente.', 'info');
        }, 1000);
    }
});

// Handle page visibility changes for better performance
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && window.roadmapTracker) {
        // Refresh progress when page becomes visible
        window.roadmapTracker.updateProgressBars();
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    if (window.roadmapTracker) {
        window.roadmapTracker.showNotification('Conexão restaurada', 'success');
    }
});

window.addEventListener('offline', () => {
    if (window.roadmapTracker) {
        window.roadmapTracker.showNotification('Modo offline ativado', 'info');
    }
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoadmapTracker;
}

