class SelectionCache {
    constructor() {
        this.cache = {
            text: '',
            timestamp: 0
        };
        this.CACHE_TIMEOUT = 5000; // 5 seconds cache timeout
        this.setupMutationObserver();
        this.setupSelectionListener();
    }

    setupMutationObserver() {
        this.observer = new MutationObserver(() => {
            this.updateFromEditor();
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    setupSelectionListener() {
        document.addEventListener('selectionchange', () => {
            this.updateFromEditor();
        });
    }

    updateFromEditor() {
        const activeLeaf = app?.workspace?.activeLeaf;
        const editor = activeLeaf?.view?.editor;
        
        if (editor && editor.getSelection) {
            const selection = editor.getSelection();
            if (selection) {
                this.updateCache(selection);
            }
        }
    }

    updateCache(text) {
        this.cache = {
            text: text,
            timestamp: Date.now()
        };
    }

    getSelection() {
        const activeLeaf = app?.workspace?.activeLeaf;
        const editor = activeLeaf?.view?.editor;
        
        // If we have an editor and it's in edit mode, use its selection
        if (editor && editor.getSelection) {
            const selection = editor.getSelection();
            if (selection) {
                return selection;
            }
        }

        // If cached selection is still valid (within timeout), return it
        const currentTime = Date.now();
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