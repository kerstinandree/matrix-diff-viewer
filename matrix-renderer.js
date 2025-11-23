/**
 * Matrix Renderer Module
 * Renders a single matrix with color-coded differences and hover tooltips
 */

class MatrixRenderer {
    static currentDiffResult = null;
    static currentMatrixNum = 1;

    /**
     * Render a single matrix with diff highlighting
     * @param {Object} diffResult - Result from DiffEngine.compare()
     * @param {HTMLElement} container - Container for matrix
     * @param {number} matrixNum - Matrix number (1 or 2)
     */
    static render(diffResult, container, matrixNum = 1) {
        // Store for toggling
        this.currentDiffResult = diffResult;
        this.currentMatrixNum = matrixNum;

        // Clear existing content
        container.innerHTML = '';

        // Create and render matrix table
        const table = this.createMatrixTable(diffResult, matrixNum);
        container.appendChild(table);

        // Add tooltip functionality
        this.initializeTooltips();
    }

    /**
     * Toggle between matrix 1 and matrix 2
     * @param {HTMLElement} container - Container for matrix
     * @param {number} matrixNum - Matrix number to display (1 or 2)
     */
    static toggleMatrix(container, matrixNum) {
        if (!this.currentDiffResult) return;

        this.render(this.currentDiffResult, container, matrixNum);
    }

    /**
     * Create a matrix table
     * @param {Object} diffResult - Diff result
     * @param {number} matrixNum - Matrix number (1 or 2)
     * @returns {HTMLTableElement} Table element
     */
    static createMatrixTable(diffResult, matrixNum) {
        const table = document.createElement('table');
        const { rows, cols, diffMap, matrix1, matrix2 } = diffResult;
        const currentMatrix = matrixNum === 1 ? matrix1 : matrix2;

        // Create header row
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        // Top-left corner cell
        const cornerCell = document.createElement('th');
        cornerCell.className = 'row-header';
        cornerCell.textContent = 'From \\ To';
        headerRow.appendChild(cornerCell);

        // Column headers
        cols.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col;
            th.title = col;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create table body
        const tbody = document.createElement('tbody');

        rows.forEach(row => {
            const tr = document.createElement('tr');

            // Row header
            const rowHeader = document.createElement('td');
            rowHeader.className = 'row-header';
            rowHeader.textContent = row;
            rowHeader.title = row;
            tr.appendChild(rowHeader);

            // Data cells
            cols.forEach(col => {
                const td = document.createElement('td');
                td.className = 'cell-content';

                const key = `${row}|${col}`;
                const changeInfo = diffMap.get(key);
                const cellData = matrixNum === 1 ? changeInfo.cell1 : changeInfo.cell2;

                // Set cell class based on change type
                td.classList.add(changeInfo.changeType);

                // Set cell content (symbols)
                if (cellData) {
                    const content = this.renderCellContent(cellData, changeInfo.changeType);
                    td.innerHTML = content;
                } else if (changeInfo.changeType === DiffEngine.CHANGE_TYPES.EMPTY) {
                    td.textContent = '';
                } else {
                    // For added/removed cells in the current view
                    td.textContent = '';
                }

                // Add data attributes for tooltip
                td.dataset.changeType = changeInfo.changeType;
                td.dataset.details = changeInfo.details || '';
                td.dataset.hasData = cellData ? 'true' : 'false';

                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        return table;
    }

    /**
     * Render cell content with symbols (show all dependencies)
     * @param {Object} cellData - Cell data
     * @param {string} changeType - Type of change
     * @returns {string} HTML string for cell content
     */
    static renderCellContent(cellData, changeType) {
        const parts = [];

        // Always show both temporal and existential if they exist
        if (cellData.temporal && cellData.temporal.symbol) {
            parts.push(`<span class="symbol-temporal">${this.escapeHtml(cellData.temporal.symbol)}</span>`);
        }

        if (cellData.existential && cellData.existential.symbol) {
            parts.push(`<span class="symbol-existential">${this.escapeHtml(cellData.existential.symbol)}</span>`);
        }

        if (parts.length === 0) {
            return '<span style="color: #71717a;">-</span>';
        }

        return `<div class="symbol-display">${parts.join(', ')}</div>`;
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Initialize tooltip functionality for all cells
     */
    static initializeTooltips() {
        let tooltip = document.querySelector('.tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.style.display = 'none';
            document.body.appendChild(tooltip);
        }

        const cells = document.querySelectorAll('.cell-content');

        cells.forEach(cell => {
            cell.addEventListener('mouseenter', (e) => {
                const details = e.target.dataset.details;
                const changeType = e.target.dataset.changeType;

                if (details && changeType !== DiffEngine.CHANGE_TYPES.EMPTY) {
                    tooltip.textContent = details;
                    tooltip.style.display = 'block';
                    this.positionTooltip(tooltip, e);
                }
            });

            cell.addEventListener('mousemove', (e) => {
                if (tooltip.style.display === 'block') {
                    this.positionTooltip(tooltip, e);
                }
            });

            cell.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        });
    }

    /**
     * Position tooltip near the cursor
     * @param {HTMLElement} tooltip - Tooltip element
     * @param {MouseEvent} event - Mouse event
     */
    static positionTooltip(tooltip, event) {
        const offset = 15;
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left = event.pageX + offset;
        let top = event.pageY + offset;

        // Adjust if tooltip goes off-screen to the right
        if (left + tooltipRect.width > viewportWidth + window.scrollX) {
            left = event.pageX - tooltipRect.width - offset;
        }

        // Adjust if tooltip goes off-screen at the bottom
        if (top + tooltipRect.height > viewportHeight + window.scrollY) {
            top = event.pageY - tooltipRect.height - offset;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }

    /**
     * Get statistics about the diff
     * @param {Object} diffResult - Diff result
     * @returns {Object} Statistics
     */
    static getStatistics(diffResult) {
        const stats = {
            total: 0,
            unchanged: 0,
            temporalOnly: 0,
            existentialOnly: 0,
            both: 0,
            added: 0,
            removed: 0,
            empty: 0
        };

        diffResult.diffMap.forEach(changeInfo => {
            stats.total++;

            switch (changeInfo.changeType) {
                case DiffEngine.CHANGE_TYPES.NO_CHANGE:
                    stats.unchanged++;
                    break;
                case DiffEngine.CHANGE_TYPES.TEMPORAL_ONLY:
                    stats.temporalOnly++;
                    break;
                case DiffEngine.CHANGE_TYPES.EXISTENTIAL_ONLY:
                    stats.existentialOnly++;
                    break;
                case DiffEngine.CHANGE_TYPES.BOTH:
                    stats.both++;
                    break;
                case DiffEngine.CHANGE_TYPES.ADDED:
                    stats.added++;
                    break;
                case DiffEngine.CHANGE_TYPES.REMOVED:
                    stats.removed++;
                    break;
                case DiffEngine.CHANGE_TYPES.EMPTY:
                    stats.empty++;
                    break;
            }
        });

        return stats;
    }
}
