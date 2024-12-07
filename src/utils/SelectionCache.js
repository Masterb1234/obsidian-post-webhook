class SelectionCache {
    constructor() {
        this.cache = {
            text: '',
            timestamp: 0
        };
        this.CACHE_TIMEOUT = 5000; // 5 seconds cache timeout
        this.setupMutationObserver();
        this.setupSelectionListener();
        this.setupTouchSelectionListener();
    }

    setupMutationObserver() {
        this.observer = new MutationObserver(() => {
            const selection = document.getSelection();
            if (selection && selection.toString().trim()) {
                this.updateCache(selection.toString());
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    setupSelectionListener() {
        document.addEventListener('selectionchange', () => {
            const selection = document.getSelection();
            if (selection && selection.toString().trim()) {
                this.updateCache(selection.toString());
            }
        });
    }

    setupTouchSelectionListener() {
        // Handle touch end events for mobile selection
        document.addEventListener('touchend', () => {
            setTimeout(() => {
                const selection = document.getSelection();
                if (selection && selection.toString().trim()) {
                    this.updateCache(selection.toString());
                }
            }, 100); // Small delay to ensure selection is complete
        });
    }

    updateCache(text) {
        this.cache = {
            text: text,
            timestamp: Date.now()
        };
    }

    getSelection() {
        const currentTime = Date.now();
        const activeSelection = document.getSelection()?.toString().trim();

        // If there's an active selection, return it
        if (activeSelection) {
            return activeSelection;
        }

        // If cached selection is still valid (within timeout), return it
        if (currentTime - this.cache.timestamp < this.CACHE_TIMEOUT) {
            return this.cache.text;
        }

        return '';
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

module.exports = SelectionCache;