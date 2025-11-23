/**
 * DfgRenderer - Renders DFG visualizations using Viz.js
 * Converts Graphviz DOT strings to SVG elements
 * Supports zoom and pan interactions
 */
class DfgRenderer {
    static vizInstance = null;
    static zoomStates = new Map(); // Track zoom/pan state for each container

    /**
     * Initialize Viz.js instance (async)
     * @returns {Promise} Resolves when Viz.js is ready
     */
    static async initialize() {
        if (this.vizInstance) {
            return this.vizInstance;
        }

        try {
            if (typeof Viz === 'undefined' || !Viz.instance) {
                throw new Error('Viz.js library not loaded');
            }

            this.vizInstance = await Viz.instance();
            console.log('Viz.js initialized successfully');
            return this.vizInstance;

        } catch (error) {
            console.error('Error initializing Viz.js:', error);
            throw new Error(`Viz.js initialization failed: ${error.message}`);
        }
    }

    /**
     * Render a Graphviz DOT string to an SVG element with zoom/pan controls
     * @param {string} graphvizDot - Graphviz DOT format string
     * @param {HTMLElement} container - DOM element to render into
     * @returns {Promise<void>}
     * @throws {Error} If rendering fails
     */
    static async render(graphvizDot, container) {
        try {
            if (!graphvizDot || graphvizDot.trim().length === 0) {
                throw new Error('Graphviz DOT string is empty');
            }

            if (!container) {
                throw new Error('Container element is null or undefined');
            }

            // Initialize Viz.js if not already done
            const viz = await this.initialize();

            // Clear container
            container.innerHTML = '';

            // Create zoom controls
            const controls = this.createZoomControls(container);
            container.appendChild(controls);

            // Create SVG wrapper for zoom/pan
            const svgWrapper = document.createElement('div');
            svgWrapper.className = 'dfg-svg-wrapper';
            container.appendChild(svgWrapper);

            // Render SVG element
            const svgElement = viz.renderSVGElement(graphvizDot);

            // Apply dark theme styling to SVG
            this.applyDarkTheme(svgElement);

            // Remove width/height attributes to allow flexible sizing
            svgElement.removeAttribute('width');
            svgElement.removeAttribute('height');
            svgElement.style.width = 'auto';
            svgElement.style.height = 'auto';

            // Add SVG to wrapper
            svgWrapper.appendChild(svgElement);

            // Initialize zoom/pan state
            this.initializeZoomPan(container, svgWrapper, svgElement);

            console.log('DFG rendered successfully with zoom/pan controls');

        } catch (error) {
            console.error('Error rendering DFG:', error);

            // Display error message in container
            container.innerHTML = `
                <div class="dfg-error">
                    <p>Failed to render DFG visualization</p>
                    <p class="error-details">${error.message}</p>
                </div>
            `;

            throw new Error(`DFG rendering failed: ${error.message}`);
        }
    }

    /**
     * Create zoom control buttons
     * @param {HTMLElement} container - Container element
     * @returns {HTMLElement} Controls div
     */
    static createZoomControls(container) {
        const controls = document.createElement('div');
        controls.className = 'dfg-zoom-controls';

        const zoomInBtn = document.createElement('button');
        zoomInBtn.className = 'zoom-btn zoom-in';
        zoomInBtn.innerHTML = '+';
        zoomInBtn.title = 'Zoom In';
        zoomInBtn.onclick = () => this.zoom(container, 1.2);

        const zoomOutBtn = document.createElement('button');
        zoomOutBtn.className = 'zoom-btn zoom-out';
        zoomOutBtn.innerHTML = '−';
        zoomOutBtn.title = 'Zoom Out';
        zoomOutBtn.onclick = () => this.zoom(container, 0.8);

        const resetBtn = document.createElement('button');
        resetBtn.className = 'zoom-btn zoom-reset';
        resetBtn.innerHTML = '⟲';
        resetBtn.title = 'Reset View';
        resetBtn.onclick = () => this.resetZoom(container);

        controls.appendChild(zoomInBtn);
        controls.appendChild(zoomOutBtn);
        controls.appendChild(resetBtn);

        return controls;
    }

    /**
     * Initialize zoom and pan functionality
     * @param {HTMLElement} container - Container element
     * @param {HTMLElement} wrapper - SVG wrapper element
     * @param {SVGElement} svgElement - SVG element
     */
    static initializeZoomPan(container, wrapper, svgElement) {
        // Initialize state
        const state = {
            scale: 1,
            translateX: 0,
            translateY: 0,
            isDragging: false,
            startX: 0,
            startY: 0
        };

        this.zoomStates.set(container, state);

        // Mouse wheel zoom
        wrapper.addEventListener('wheel', (e) => {
            e.preventDefault();

            const rect = wrapper.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Calculate zoom
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = Math.max(0.1, Math.min(10, state.scale * delta));

            // Adjust translation to zoom toward mouse position
            const scaleDiff = newScale - state.scale;
            state.translateX -= (mouseX - state.translateX) * (scaleDiff / state.scale);
            state.translateY -= (mouseY - state.translateY) * (scaleDiff / state.scale);
            state.scale = newScale;

            this.applyTransform(svgElement, state);
        });

        // Pan with mouse drag
        wrapper.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left mouse button
                state.isDragging = true;
                state.startX = e.clientX - state.translateX;
                state.startY = e.clientY - state.translateY;
                wrapper.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });

        wrapper.addEventListener('mousemove', (e) => {
            if (state.isDragging) {
                state.translateX = e.clientX - state.startX;
                state.translateY = e.clientY - state.startY;
                this.applyTransform(svgElement, state);
            }
        });

        wrapper.addEventListener('mouseup', () => {
            state.isDragging = false;
            wrapper.style.cursor = 'grab';
        });

        wrapper.addEventListener('mouseleave', () => {
            state.isDragging = false;
            wrapper.style.cursor = 'grab';
        });

        // Set initial cursor
        wrapper.style.cursor = 'grab';

        // Apply initial transform
        this.applyTransform(svgElement, state);
    }

    /**
     * Apply transform to SVG element
     * @param {SVGElement} svgElement - SVG element
     * @param {Object} state - Transform state
     */
    static applyTransform(svgElement, state) {
        svgElement.style.transform = `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`;
    }

    /**
     * Zoom in or out
     * @param {HTMLElement} container - Container element
     * @param {number} factor - Zoom factor
     */
    static zoom(container, factor) {
        const state = this.zoomStates.get(container);
        if (!state) return;

        const wrapper = container.querySelector('.dfg-svg-wrapper');
        const svgElement = wrapper.querySelector('svg');

        state.scale = Math.max(0.1, Math.min(10, state.scale * factor));
        this.applyTransform(svgElement, state);
    }

    /**
     * Reset zoom and pan to initial state
     * @param {HTMLElement} container - Container element
     */
    static resetZoom(container) {
        const state = this.zoomStates.get(container);
        if (!state) return;

        const wrapper = container.querySelector('.dfg-svg-wrapper');
        const svgElement = wrapper.querySelector('svg');

        state.scale = 1;
        state.translateX = 0;
        state.translateY = 0;
        this.applyTransform(svgElement, state);
    }

    /**
     * Apply dark theme styling to an SVG element
     * @param {SVGElement} svgElement - SVG element to style
     */
    static applyDarkTheme(svgElement) {
        if (!svgElement) return;

        // Set SVG background
        svgElement.style.backgroundColor = 'transparent';

        // Style all graph elements for dark theme
        const polygons = svgElement.querySelectorAll('polygon');
        polygons.forEach(polygon => {
            const fill = polygon.getAttribute('fill');
            if (fill === 'white' || fill === '#ffffff') {
                polygon.setAttribute('fill', '#1a1a2e');
            }
        });

        // Style all text elements
        const textElements = svgElement.querySelectorAll('text');
        textElements.forEach(text => {
            text.setAttribute('fill', '#e4e4e7');
        });

        // Style all paths (edges)
        const paths = svgElement.querySelectorAll('path');
        paths.forEach(path => {
            const stroke = path.getAttribute('stroke');
            if (stroke === 'black' || stroke === '#000000') {
                path.setAttribute('stroke', '#e4e4e7');
            }
        });

        // Style all ellipses (nodes)
        const ellipses = svgElement.querySelectorAll('ellipse');
        ellipses.forEach(ellipse => {
            const stroke = ellipse.getAttribute('stroke');
            if (stroke === 'black' || stroke === '#000000') {
                ellipse.setAttribute('stroke', '#60a5fa');
            }
            const fill = ellipse.getAttribute('fill');
            if (fill === 'none' || !fill) {
                ellipse.setAttribute('fill', '#1a1a2e');
            }
        });
    }

    /**
     * Render two DFGs side by side
     * @param {string} graphvizDot1 - Graphviz DOT for first DFG
     * @param {string} graphvizDot2 - Graphviz DOT for second DFG
     * @param {HTMLElement} container1 - Container for first DFG
     * @param {HTMLElement} container2 - Container for second DFG
     * @returns {Promise<void>}
     */
    static async renderSideBySide(graphvizDot1, graphvizDot2, container1, container2) {
        try {
            // Render both DFGs in parallel
            await Promise.all([
                this.render(graphvizDot1, container1),
                this.render(graphvizDot2, container2)
            ]);

            console.log('Both DFGs rendered successfully');

        } catch (error) {
            console.error('Error rendering side-by-side DFGs:', error);
            throw error;
        }
    }

    /**
     * Clear a DFG visualization container
     * @param {HTMLElement} container - Container to clear
     */
    static clear(container) {
        if (container) {
            container.innerHTML = '';
            // Remove zoom state
            this.zoomStates.delete(container);
        }
    }

    /**
     * Clear all DFG containers
     */
    static clearAll() {
        const container1 = document.getElementById('dfgViz1');
        const container2 = document.getElementById('dfgViz2');

        this.clear(container1);
        this.clear(container2);
    }
}
