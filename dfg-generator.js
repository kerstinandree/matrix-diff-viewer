/**
 * DfgGenerator - Generates Directly-Follows Graphs from event logs
 * Uses pm4js-core library for DFG discovery and visualization
 */
class DfgGenerator {
    /**
     * Generate a frequency DFG from an event log
     * @param {Object} eventLog - Event log object from pm4js XesImporter
     * @param {string} activityKey - Activity attribute key (default: "concept:name")
     * @returns {Object} Frequency DFG object
     * @throws {Error} If DFG generation fails
     */
    static generateFrequencyDfg(eventLog, activityKey = "concept:name") {
        try {
            if (!eventLog) {
                throw new Error('Event log is null or undefined');
            }

            // Check if FrequencyDfgDiscovery is available from pm4js-core
            if (typeof FrequencyDfgDiscovery === 'undefined') {
                throw new Error('PM4JS library not loaded. FrequencyDfgDiscovery is not available.');
            }

            // Generate frequency DFG using pm4js
            const frequencyDfg = FrequencyDfgDiscovery.apply(eventLog, activityKey);

            if (!frequencyDfg) {
                throw new Error('Failed to generate DFG - no result returned');
            }

            console.log('Frequency DFG generated successfully:', frequencyDfg);
            return frequencyDfg;

        } catch (error) {
            console.error('Error generating frequency DFG:', error);
            throw new Error(`DFG generation failed: ${error.message}`);
        }
    }

    /**
     * Convert a frequency DFG to Graphviz DOT format
     * @param {Object} frequencyDfg - Frequency DFG object from pm4js
     * @returns {string} Graphviz DOT string
     * @throws {Error} If conversion fails
     */
    static toGraphviz(frequencyDfg) {
        try {
            if (!frequencyDfg) {
                throw new Error('Frequency DFG is null or undefined');
            }

            // Check if FrequencyDfgGraphvizVisualizer is available from pm4js-core
            if (typeof FrequencyDfgGraphvizVisualizer === 'undefined') {
                throw new Error('PM4JS library not loaded. FrequencyDfgGraphvizVisualizer is not available.');
            }

            // Convert to Graphviz format using pm4js
            const graphvizDot = FrequencyDfgGraphvizVisualizer.apply(frequencyDfg);

            if (!graphvizDot || graphvizDot.trim().length === 0) {
                throw new Error('Failed to generate Graphviz - empty result');
            }

            console.log('Graphviz DOT generated successfully');
            return graphvizDot;

        } catch (error) {
            console.error('Error converting DFG to Graphviz:', error);
            throw new Error(`Graphviz conversion failed: ${error.message}`);
        }
    }

    /**
     * Extract statistics from a frequency DFG
     * @param {Object} frequencyDfg - Frequency DFG object
     * @returns {Object} Statistics including activity count, path count, etc.
     */
    static extractStatistics(frequencyDfg) {
        try {
            if (!frequencyDfg) {
                return {
                    activityCount: 0,
                    pathCount: 0,
                    startActivityCount: 0,
                    endActivityCount: 0
                };
            }

            // Extract counts from DFG structure
            const activities = frequencyDfg.activities || {};
            const startActivities = frequencyDfg.startActivities || {};
            const endActivities = frequencyDfg.endActivities || {};
            const pathsFrequency = frequencyDfg.pathsFrequency || {};

            return {
                activityCount: Object.keys(activities).length,
                pathCount: Object.keys(pathsFrequency).length,
                startActivityCount: Object.keys(startActivities).length,
                endActivityCount: Object.keys(endActivities).length,
                activities: activities,
                startActivities: startActivities,
                endActivities: endActivities,
                paths: pathsFrequency
            };

        } catch (error) {
            console.error('Error extracting DFG statistics:', error);
            return {
                activityCount: 0,
                pathCount: 0,
                startActivityCount: 0,
                endActivityCount: 0
            };
        }
    }

    /**
     * Generate DFG and Graphviz in one call
     * @param {Object} eventLog - Event log object from pm4js XesImporter
     * @param {string} activityKey - Activity attribute key
     * @returns {Object} Object containing DFG, Graphviz DOT, and statistics
     */
    static generateComplete(eventLog, activityKey = "concept:name") {
        const frequencyDfg = this.generateFrequencyDfg(eventLog, activityKey);
        const graphvizDot = this.toGraphviz(frequencyDfg);
        const statistics = this.extractStatistics(frequencyDfg);

        return {
            dfg: frequencyDfg,
            graphviz: graphvizDot,
            stats: statistics
        };
    }
}
