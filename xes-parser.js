/**
 * XesParser - Handles XES event log file parsing
 * Uses pm4js-core library to parse XES format
 */
class XesParser {
    /**
     * Parse XES file content into an event log object
     * @param {string} xesContent - Raw XES file content (XML string)
     * @returns {Object} Event log object from pm4js
     * @throws {Error} If parsing fails
     */
    static parse(xesContent) {
        try {
            if (!xesContent || xesContent.trim().length === 0) {
                throw new Error('XES content is empty');
            }

            // Check if XesImporter is available from pm4js-core
            if (typeof XesImporter === 'undefined') {
                throw new Error('PM4JS library not loaded. XesImporter is not available.');
            }

            // Parse XES using pm4js
            const eventLog = XesImporter.apply(xesContent);

            if (!eventLog) {
                throw new Error('Failed to parse XES file - no event log returned');
            }

            console.log('XES parsed successfully:', eventLog);
            return eventLog;

        } catch (error) {
            console.error('Error parsing XES file:', error);
            throw new Error(`XES parsing failed: ${error.message}`);
        }
    }

    /**
     * Validate basic XES file structure
     * @param {string} xesContent - Raw XES file content
     * @returns {boolean} True if basic structure is valid
     */
    static validate(xesContent) {
        if (!xesContent || xesContent.trim().length === 0) {
            return false;
        }

        // Basic XML structure check
        const hasXmlDeclaration = xesContent.includes('<?xml');
        const hasLogTag = xesContent.includes('<log');

        return hasXmlDeclaration || hasLogTag;
    }

    /**
     * Extract basic metadata from event log
     * @param {Object} eventLog - Parsed event log object
     * @returns {Object} Metadata including number of traces, events, etc.
     */
    static extractMetadata(eventLog) {
        try {
            const traces = eventLog.traces || [];
            let totalEvents = 0;
            const activities = new Set();

            traces.forEach(trace => {
                const events = trace.events || [];
                totalEvents += events.length;

                events.forEach(event => {
                    const activityName = event.attributes?.['concept:name']?.value || 'Unknown';
                    activities.add(activityName);
                });
            });

            return {
                traceCount: traces.length,
                eventCount: totalEvents,
                activityCount: activities.size,
                activities: Array.from(activities)
            };

        } catch (error) {
            console.error('Error extracting metadata:', error);
            return {
                traceCount: 0,
                eventCount: 0,
                activityCount: 0,
                activities: []
            };
        }
    }
}
