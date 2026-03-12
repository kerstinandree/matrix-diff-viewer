/**
 * Graph Distance Calculator - Implements D(G,F) distance measurement for DFGs
 * Compares two DFGs G and F based on the frequency of their directly-follows relations
 */

class GraphDistanceCalculator {
    /**
     * Calculate the graph similarity score between two DFGs based on the provided formula
     * Formula: D(G,F) = 1 - max(|w_G(a,b) - w_F(a,b)| / sum(w_G(x,y)), |w_G(a,b) - w_F(a,b)| / sum(w_F(x,y)))
     * Note: This formula actually produces a similarity score (higher = more similar) despite being called "distance"
     *
     * @param {Object} dfg1 - First DFG object with pathsFrequency
     * @param {Object} dfg2 - Second DFG object with pathsFrequency
     * @returns {number} Similarity value between 0 and 1 (0 = maximally different, 1 = identical)
     */
    static calculateSimilarity(dfg1, dfg2) {
        try {
            // Extract paths frequency from both DFGs
            const paths1 = dfg1.pathsFrequency || {};
            const paths2 = dfg2.pathsFrequency || {};

            // Get all unique paths from both DFGs
            const allPaths = new Set([
                ...Object.keys(paths1),
                ...Object.keys(paths2)
            ]);

            // Calculate total weights for normalization
            const totalWeight1 = this.calculateTotalWeight(paths1);
            const totalWeight2 = this.calculateTotalWeight(paths2);

            // If both DFGs are empty, they are identical
            if (totalWeight1 === 0 && totalWeight2 === 0) {
                return 1; // identical
            }

            let sumMaxDiff = 0; // Sum of all maximums

            for (const path of allPaths) {
                const weight1 = paths1[path] || 0;
                const weight2 = paths2[path] || 0;
                const absoluteDiff = Math.abs(weight1 - weight2);

                // Calculate ratios for normalization, defaulting to 0
                let ratio1 = 0;
                let ratio2 = 0;
                if (totalWeight1 > 0) {
                    ratio1 = absoluteDiff / totalWeight1;
                }
                if (totalWeight2 > 0) {
                    ratio2 = absoluteDiff / totalWeight2;
                }

                sumMaxDiff += Math.max(ratio1, ratio2);
            }

            //Calculate similarity
            const similarity = 1 - (sumMaxDiff / allPaths.size);

            // Ensure the result is between 0 and 1
            return Math.max(0, Math.min(1, similarity));

        } catch (error) {
            console.error('Error calculating graph similarity:', error);
            throw new Error(`Graph similarity calculation failed: ${error.message}`);
        }
    }

    /**
     * Calculate the graph "distance" as defined in the paper (actually a similarity score)
     * This follows the exact formula from the paper: D(G,F) = 1 - max(...)
     *
     * @param {Object} dfg1 - First DFG object with pathsFrequency
     * @param {Object} dfg2 - Second DFG object with pathsFrequency
     * @returns {number} Similarity value between 0 and 1 (0 = maximally different, 1 = identical)
     */
    static calculateDistance(dfg1, dfg2) {
        // The paper's definition of "distance" is actually a similarity score
        return this.calculateSimilarity(dfg1, dfg2);
    }

    /**
     * Calculate the true distance (1 - similarity) for intuitive understanding
     *
     * @param {Object} dfg1 - First DFG object with pathsFrequency
     * @param {Object} dfg2 - Second DFG object with pathsFrequency
     * @returns {number} Distance value between 0 and 1 (0 = identical, 1 = maximally different)
     */
    static calculateTrueDistance(dfg1, dfg2) {
        const similarity = this.calculateSimilarity(dfg1, dfg2);
        return 1 - similarity;  // True distance (0 = identical, 1 = different)
    }

    /**
     * Calculate total weight of all paths in a pathsFrequency object
     * @param {Object} pathsFrequency - Object containing path weights
     * @returns {number} Sum of all path weights
     */
    static calculateTotalWeight(pathsFrequency) {
        let total = 0;
        for (const path in pathsFrequency) {
            total += pathsFrequency[path];
        }
        return total;
    }

    /**
     * Get detailed comparison data for analysis
     * @param {Object} dfg1 - First DFG object
     * @param {Object} dfg2 - Second DFG object
     * @returns {Object} Detailed comparison including distance and path differences
     */
    static getDetailedComparison(dfg1, dfg2) {
        const paths1 = dfg1.pathsFrequency || {};
        const paths2 = dfg2.pathsFrequency || {};

        const allPaths = new Set([
            ...Object.keys(paths1),
            ...Object.keys(paths2)
        ]);

        const differences = [];

        const totalWeight1 = this.calculateTotalWeight(paths1);
        const totalWeight2 = this.calculateTotalWeight(paths2);

        let sumMaxDiff = 0;

        for (const path of allPaths) {
            const weight1 = paths1[path] || 0;
            const weight2 = paths2[path] || 0;
            const absoluteDiff = Math.abs(weight1 - weight2);

            let ratio1 = 0;
            let ratio2 = 0;
            if (totalWeight1 > 0) {
                ratio1 = absoluteDiff / totalWeight1;
            }
            if (totalWeight2 > 0) {
                ratio2 = absoluteDiff / totalWeight2;
            }

            sumMaxDiff += Math.max(ratio1, ratio2);

            differences.push({
                path: path,
                weight1: weight1,
                weight2: weight2,
                absoluteDiff: absoluteDiff,
                relativeDiff1: totalWeight1 > 0 ? absoluteDiff / totalWeight1 : 0,
                relativeDiff2: totalWeight2 > 0 ? absoluteDiff / totalWeight2 : 0
            });
        }

        const similarityScore = this.calculateSimilarity(dfg1, dfg2);
        const distance = 1 - similarityScore; // True distance

        return {
            similarity: similarityScore,
            distance: distance,
            totalWeight1,
            totalWeight2,
            differences,
            sumMaxDiff
        };
    }

    /**
     * Calculate similarity percentage from the paper's definition (0-100%)
     * @param {Object} dfg1 - First DFG object
     * @param {Object} dfg2 - Second DFG object
     * @returns {number} Similarity percentage as a value between 0 and 100
     */
    static calculateSimilarityPercentage(dfg1, dfg2) {
        const similarity = this.calculateSimilarity(dfg1, dfg2); // Paper's similarity score
        return similarity * 100; // Convert to percentage
    }

    /**
     * Calculate distance percentage (0-100%) for intuitive understanding
     * @param {Object} dfg1 - First DFG object
     * @param {Object} dfg2 - Second DFG object
     * @returns {number} Distance percentage as a value between 0 and 100
     */
    static calculateDistancePercentage(dfg1, dfg2) {
        const distance = this.calculateTrueDistance(dfg1, dfg2);
        return distance * 100; // Convert to percentage
    }
}
