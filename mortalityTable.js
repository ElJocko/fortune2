const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const probability = require('./probability');

const groupFiles = {
    "white male" : "whiteMale.json",
    "white female" : "whitefemale.json"
};

function load(group, maxAge) {
    const filePath = path.join('./mortalityData', groupFiles[group]);
    const mortalityDataFile = fs.readFileSync(filePath);
    const mortalityThresholds = JSON.parse(mortalityDataFile);

    // Initialize the table with zeros
    const fullTable = Array(maxAge * 12).fill(0.0);

    // Fill in the table with the correct mortality rates
    _.range(maxAge).forEach(function(ageInYears) {
        mortalityThresholds.table.every(function(entry) {
            if (ageInYears < entry.age) {
                // Found the entry

                // Convert the rate from deaths/1000000 rate for an individual
                // Also convert from annual rate to montly rate
                const monthlyRate = probability.splitEvent((entry.rate / 100000.0), 12);

                // Set the value for all 12 months at the current age
                startMonth = ageInYears * 12;
                for (let i = 0; i < 12; ++i) {
                    fullTable[startMonth + i] = monthlyRate;
                }

                // Stop and move to next age
                return false;
            }
            else {
                // Go to next entry
                return true;
            }
        })
    });

    return fullTable;
}

function load2(dataFile) {
    const filePath = path.join('./mortalityData', dataFile);
    const mortalityDataFile = fs.readFileSync(filePath);
    const mortalityThresholds = JSON.parse(mortalityDataFile);

    // Initialize the table with zeros
    const fullTable = Array(mortalityThresholds.length * 12).fill(0.0);

    // Fill in the table with the correct mortality rates
    let ageInYears = 0;
    for (const mortality of mortalityThresholds) {
        // Convert from annual mortality to monthly mortality
        const monthlyMortality = probability.splitEvent(mortality, 12);

        // Set the value for all 12 months at the current age
        const startMonth = ageInYears * 12;
        for (let i = 0; i < 12; ++i) {
            fullTable[startMonth + i] = { deathProbability: monthlyMortality };
        }
        ageInYears++;
    }

    for (let i = 0; i < fullTable.length; i++) {
        // Set the default value
        fullTable[i].meanLifeExpectancy = fullTable.length - i;

        let cumulativeProbability = 1.0;
        let monthsElapsed = 0;
        for (let j = i; j < fullTable.length; j++) {
            cumulativeProbability = cumulativeProbability * (1.0 - fullTable[j].deathProbability);
            if (cumulativeProbability <= 0.5) {
                fullTable[i].meanLifeExpectancy = monthsElapsed;
                break;
            }
            monthsElapsed++;
        }
    }

    return fullTable;
}

const mortalityTable = {
    load : load2
};

module.exports = mortalityTable;
