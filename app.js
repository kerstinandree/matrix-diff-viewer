/**
 * Main Application Module
 * Orchestrates file upload, parsing, diff calculation, and rendering
 */

class MatrixDiffApp {
    constructor() {
        // Matrix mode state
        this.file1 = null;
        this.file2 = null;
        this.matrix1 = null;
        this.matrix2 = null;
        this.currentView = 1; // 1 for "Before", 2 for "After"

        // DFG mode state
        this.xesFile1 = null;
        this.xesFile2 = null;
        this.eventLog1 = null;
        this.eventLog2 = null;
        this.dfgResult1 = null;
        this.dfgResult2 = null;

        // Current mode: 'matrix' or 'dfg'
        this.currentMode = 'matrix';

        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners for UI elements
     */
    initializeEventListeners() {
        // Tab navigation
        const matrixTab = document.getElementById('matrixTab');
        const dfgTab = document.getElementById('dfgTab');
        matrixTab.addEventListener('click', () => this.switchTab('matrix'));
        dfgTab.addEventListener('click', () => this.switchTab('dfg'));

        // Matrix mode listeners
        const file1Input = document.getElementById('file1');
        const file2Input = document.getElementById('file2');
        const compareBtn = document.getElementById('compareBtn');
        const matrixToggle = document.getElementById('matrixToggle');

        file1Input.addEventListener('change', (e) => this.handleFileSelect(e, 1));
        file2Input.addEventListener('change', (e) => this.handleFileSelect(e, 2));
        compareBtn.addEventListener('click', () => this.compareMatrices());
        matrixToggle.addEventListener('change', (e) => this.handleToggle(e));

        // DFG mode listeners
        const xesFile1Input = document.getElementById('xesFile1');
        const xesFile2Input = document.getElementById('xesFile2');
        const analyzeBtn = document.getElementById('analyzeBtn');

        xesFile1Input.addEventListener('change', (e) => this.handleXesFileSelect(e, 1));
        xesFile2Input.addEventListener('change', (e) => this.handleXesFileSelect(e, 2));
        analyzeBtn.addEventListener('click', () => this.analyzeDfgs());
    }

    /**
     * Handle file selection
     * @param {Event} event - File input change event
     * @param {number} fileNum - File number (1 or 2)
     */
    handleFileSelect(event, fileNum) {
        const file = event.target.files[0];
        const filenameDisplay = document.getElementById(`filename${fileNum}`);

        if (file) {
            if (fileNum === 1) {
                this.file1 = file;
            } else {
                this.file2 = file;
            }

            filenameDisplay.textContent = file.name;
            filenameDisplay.style.color = '#10b981';
            filenameDisplay.style.fontStyle = 'normal';
        } else {
            if (fileNum === 1) {
                this.file1 = null;
            } else {
                this.file2 = null;
            }

            filenameDisplay.textContent = 'No file selected';
            filenameDisplay.style.color = '#71717a';
            filenameDisplay.style.fontStyle = 'italic';
        }

        // Enable compare button only if both files are selected
        this.updateCompareButton();
    }

    /**
     * Update compare button state
     */
    updateCompareButton() {
        const compareBtn = document.getElementById('compareBtn');
        compareBtn.disabled = !(this.file1 && this.file2);
    }

    /**
     * Switch between tabs (matrix and DFG modes)
     * @param {string} mode - 'matrix' or 'dfg'
     */
    switchTab(mode) {
        this.currentMode = mode;

        // Update tab button states
        const matrixTab = document.getElementById('matrixTab');
        const dfgTab = document.getElementById('dfgTab');

        if (mode === 'matrix') {
            matrixTab.classList.add('active');
            dfgTab.classList.remove('active');

            // Show matrix sections, hide DFG sections
            document.getElementById('matrixUploadSection').style.display = 'block';
            document.getElementById('xesUploadSection').style.display = 'none';

            // Show/hide result sections based on data availability
            if (this.matrix1 && this.matrix2) {
                this.showMatrix();
                this.showLegend();
            } else {
                this.hideMatrix();
                this.hideLegend();
            }

            this.hideDfgSections();

        } else if (mode === 'dfg') {
            dfgTab.classList.add('active');
            matrixTab.classList.remove('active');

            // Show DFG sections, hide matrix sections
            document.getElementById('xesUploadSection').style.display = 'block';
            document.getElementById('matrixUploadSection').style.display = 'none';

            // Show/hide result sections based on data availability
            if (this.dfgResult1 && this.dfgResult2) {
                this.showDfgSections();
            } else {
                this.hideDfgSections();
            }

            this.hideMatrix();
            this.hideLegend();
        }

        console.log(`Switched to ${mode} mode`);
    }

    /**
     * Handle XES file selection
     * @param {Event} event - File input change event
     * @param {number} fileNum - File number (1 or 2)
     */
    handleXesFileSelect(event, fileNum) {
        const file = event.target.files[0];
        const filenameDisplay = document.getElementById(`xesFilename${fileNum}`);

        if (file) {
            if (fileNum === 1) {
                this.xesFile1 = file;
            } else {
                this.xesFile2 = file;
            }

            filenameDisplay.textContent = file.name;
            filenameDisplay.style.color = '#10b981';
            filenameDisplay.style.fontStyle = 'normal';
        } else {
            if (fileNum === 1) {
                this.xesFile1 = null;
            } else {
                this.xesFile2 = null;
            }

            filenameDisplay.textContent = 'No file selected';
            filenameDisplay.style.color = '#71717a';
            filenameDisplay.style.fontStyle = 'italic';
        }

        // Enable analyze button only if both files are selected
        this.updateAnalyzeButton();
    }

    /**
     * Update analyze button state
     */
    updateAnalyzeButton() {
        const analyzeBtn = document.getElementById('analyzeBtn');
        analyzeBtn.disabled = !(this.xesFile1 && this.xesFile2);
    }

    /**
     * Analyze DFGs from XES event logs
     */
    async analyzeDfgs() {
        this.hideError();
        this.hideDfgSections();

        try {
            console.log('Starting DFG analysis...');

            // Read both XES files
            const content1 = await this.readFile(this.xesFile1);
            const content2 = await this.readFile(this.xesFile2);

            // Parse XES files
            console.log('Parsing XES files...');
            this.eventLog1 = XesParser.parse(content1);
            this.eventLog2 = XesParser.parse(content2);

            // Generate DFGs
            console.log('Generating DFGs...');
            this.dfgResult1 = DfgGenerator.generateComplete(this.eventLog1);
            this.dfgResult2 = DfgGenerator.generateComplete(this.eventLog2);

            // Display statistics
            this.displayDfgStatistics(this.dfgResult1.stats, this.dfgResult2.stats);

            // Render DFG visualizations
            console.log('Rendering DFG visualizations...');
            const container1 = document.getElementById('dfgViz1');
            const container2 = document.getElementById('dfgViz2');

            await DfgRenderer.renderSideBySide(
                this.dfgResult1.graphviz,
                this.dfgResult2.graphviz,
                container1,
                container2
            );

            // Show DFG sections
            this.showDfgSections();

            console.log('DFG analysis completed successfully');

        } catch (error) {
            this.showError(`DFG Analysis Error: ${error.message}`);
            console.error('Error analyzing DFGs:', error);
        }
    }

    /**
     * Display DFG statistics
     * @param {Object} stats1 - Statistics for DFG 1
     * @param {Object} stats2 - Statistics for DFG 2
     */
    displayDfgStatistics(stats1, stats2) {
        // Event Log 1 stats
        document.getElementById('dfgActivities1').textContent = stats1.activityCount;
        document.getElementById('dfgPaths1').textContent = stats1.pathCount;
        document.getElementById('dfgStarts1').textContent = stats1.startActivityCount;
        document.getElementById('dfgEnds1').textContent = stats1.endActivityCount;

        // Event Log 2 stats
        document.getElementById('dfgActivities2').textContent = stats2.activityCount;
        document.getElementById('dfgPaths2').textContent = stats2.pathCount;
        document.getElementById('dfgStarts2').textContent = stats2.startActivityCount;
        document.getElementById('dfgEnds2').textContent = stats2.endActivityCount;
    }

    /**
     * Show DFG sections
     */
    showDfgSections() {
        document.getElementById('dfgStatsSection').style.display = 'block';
        document.getElementById('dfgSection').style.display = 'block';
    }

    /**
     * Hide DFG sections
     */
    hideDfgSections() {
        document.getElementById('dfgStatsSection').style.display = 'none';
        document.getElementById('dfgSection').style.display = 'none';
    }

    /**
     * Handle toggle between matrices
     * @param {Event} event - Toggle change event
     */
    handleToggle(event) {
        const isChecked = event.target.checked;
        this.currentView = isChecked ? 2 : 1;

        // Update title
        const title = document.getElementById('matrixTitle');
        title.textContent = isChecked ? 'Matrix 2 (After)' : 'Matrix 1 (Before)';

        // Re-render with new matrix
        const container = document.getElementById('matrixContainer');
        MatrixRenderer.toggleMatrix(container, this.currentView);
    }

    /**
     * Compare matrices
     */
    async compareMatrices() {
        this.hideError();
        this.hideMatrix();

        try {
            // Read and parse both files
            const content1 = await this.readFile(this.file1);
            const content2 = await this.readFile(this.file2);

            this.matrix1 = YAMLParser.parse(content1);
            this.matrix2 = YAMLParser.parse(content2);

            // Perform diff
            const diffResult = DiffEngine.compare(this.matrix1, this.matrix2);

            // Reset toggle to show matrix 1 (Before)
            const matrixToggle = document.getElementById('matrixToggle');
            matrixToggle.checked = false;
            this.currentView = 1;

            // Update title
            const title = document.getElementById('matrixTitle');
            title.textContent = 'Matrix 1 (Before)';

            // Render matrix
            const container = document.getElementById('matrixContainer');
            MatrixRenderer.render(diffResult, container, this.currentView);

            // Show results
            this.showMatrix();
            this.showLegend();

            // Display statistics
            const stats = MatrixRenderer.getStatistics(diffResult);
            this.displayStatistics(stats);
            console.log('Diff Statistics:', stats);

        } catch (error) {
            this.showError(error.message);
            console.error('Error comparing matrices:', error);
        }
    }

    /**
     * Read file contents
     * @param {File} file - File to read
     * @returns {Promise<string>} File contents
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                resolve(e.target.result);
            };

            reader.onerror = (e) => {
                reject(new Error(`Failed to read file: ${file.name}`));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const errorSection = document.getElementById('errorSection');
        const errorMessage = document.getElementById('errorMessage');

        errorMessage.textContent = message;
        errorSection.style.display = 'block';
    }

    /**
     * Hide error message
     */
    hideError() {
        const errorSection = document.getElementById('errorSection');
        errorSection.style.display = 'none';
    }

    /**
     * Show matrix section
     */
    showMatrix() {
        const matrixSection = document.getElementById('matrixSection');
        matrixSection.style.display = 'flex';
    }

    /**
     * Hide matrix section
     */
    hideMatrix() {
        const matrixSection = document.getElementById('matrixSection');
        matrixSection.style.display = 'none';
    }

    /**
     * Show legend section
     */
    showLegend() {
        const legendSection = document.getElementById('statsLegendSection');
        legendSection.style.display = 'grid';
    }

    /**
     * Hide legend section
     */
    hideLegend() {
        const legendSection = document.getElementById('statsLegendSection');
        legendSection.style.display = 'none';
    }

    /**
     * Display statistics
     * @param {Object} stats - Statistics object
     */
    displayStatistics(stats) {
        // Calculate non-empty relationships
        const totalRelationships = stats.total - stats.empty;

        document.getElementById('statTotal').textContent = totalRelationships;
        document.getElementById('statTemporal').textContent = stats.temporalOnly;
        document.getElementById('statExistential').textContent = stats.existentialOnly;
        document.getElementById('statBoth').textContent = stats.both;
        document.getElementById('statAdded').textContent = stats.added;
        document.getElementById('statRemoved').textContent = stats.removed;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new MatrixDiffApp();
    console.log('Matrix Diff Viewer initialized');
});
