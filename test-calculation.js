// Simple test for the graph distance calculation
// This script tests the mathematical implementation of the formula

// Mock the DFG structure as it would be returned by PM4JS
const dfg1 = {
    pathsFrequency: {
        'A>B': 10,
        'B>C': 8,
        'C>D': 5
    }
};

const dfg2 = {
    pathsFrequency: {
        'A>B': 12,  // Different weight
        'B>C': 6,   // Different weight
        'C>D': 5    // Same weight
    }
};

const dfg3 = {
    pathsFrequency: {
        'A>B': 10,
        'B>C': 8,
        'C>D': 5
    }
};

// Manual calculation based on the provided formula:
// D(G,F)=1-max(|w_G(a,b)-w_F(a,b)|/sum(w_G(x,y)), |w_G(a,b)-w_F(a,b)|/sum(w_F(x,y)))
// This actually calculates a similarity score (higher = more similar), not distance

function calculateSimilarity(dfg1, dfg2) {
    // Get all unique paths
    const allPaths = new Set([
        ...Object.keys(dfg1.pathsFrequency || {}),
        ...Object.keys(dfg2.pathsFrequency || {})
    ]);

    // Calculate total weights
    const totalWeight1 = Object.values(dfg1.pathsFrequency || {}).reduce((sum, val) => sum + val, 0);
    const totalWeight2 = Object.values(dfg2.pathsFrequency || {}).reduce((sum, val) => sum + val, 0);

    console.log(`Total weight DFG1: ${totalWeight1}, Total weight DFG2: ${totalWeight2}`);

    // Calculate maximum difference ratios
    let maxDiffRatio1 = 0; // Max |w1 - w2| / sum(w1)
    let maxDiffRatio2 = 0; // Max |w1 - w2| / sum(w2)

    for (const path of allPaths) {
        const weight1 = dfg1.pathsFrequency[path] || 0;
        const weight2 = dfg2.pathsFrequency[path] || 0;
        const absoluteDiff = Math.abs(weight1 - weight2);

        console.log(`Path: ${path}, Weight1: ${weight1}, Weight2: ${weight2}, Diff: ${absoluteDiff}`);

        if (totalWeight1 > 0) {
            const ratio1 = absoluteDiff / totalWeight1;
            maxDiffRatio1 = Math.max(maxDiffRatio1, ratio1);
            console.log(`  Ratio1 (${absoluteDiff}/${totalWeight1}): ${ratio1.toFixed(4)}`);
        }

        if (totalWeight2 > 0) {
            const ratio2 = absoluteDiff / totalWeight2;
            maxDiffRatio2 = Math.max(maxDiffRatio2, ratio2);
            console.log(`  Ratio2 (${absoluteDiff}/${totalWeight2}): ${ratio2.toFixed(4)}`);
        }
    }

    const maxRatio = Math.max(maxDiffRatio1, maxDiffRatio2);
    console.log(`Max ratio: ${maxRatio.toFixed(4)}`);

    // Calculate final similarity: Similarity = 1 - maxRatio
    const similarity = 1 - maxRatio;
    console.log(`Similarity (per paper): ${similarity.toFixed(4)}`);

    // Ensure the result is between 0 and 1
    return Math.max(0, Math.min(1, similarity));
}

function calculateDistance(dfg1, dfg2) {
    const similarity = calculateSimilarity(dfg1, dfg2);
    return 1 - similarity; // True distance (0 = identical, 1 = different)
}

console.log('Testing graph distance calculation:');
console.log('DFG1:', dfg1.pathsFrequency);
console.log('DFG2:', dfg2.pathsFrequency);
console.log('');

const distance = calculateDistance(dfg1, dfg2);
const similarity = calculateSimilarity(dfg1, dfg2);
console.log(`\nCalculated Distance: ${distance.toFixed(4)}, Similarity: ${similarity.toFixed(4)}`);

console.log('\nTesting with identical DFGs (should be 0.0 distance / 1.0 similarity):');
const identicalDistance = calculateDistance(dfg1, dfg3);
const identicalSimilarity = calculateSimilarity(dfg1, dfg3);
console.log(`Identical DFGs - Distance: ${identicalDistance.toFixed(4)}, Similarity: ${identicalSimilarity.toFixed(4)}`);