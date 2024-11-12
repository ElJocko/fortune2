const fs = require('fs');
const mortalityTable = require('./mortalityTable');
const probability = require('./probability');

const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });

function loadConfig(configData) {
    const config = {
        persons: configData.persons,
        numberOfTrials : configData.numberOfTrials || 1000,
        maxAge : configData.maxAge || 120,
        startingBalance: configData.startingBalance,
        monthlyIncomeTarget: configData.annualIncomeTarget / 12.0,
        monthlyWithdrawFloor: configData.annualWithdrawFloor / 12.0,
        monthlyPerformanceEquities : configData.rateOfReturnEquities,
        monthlyPerformanceBonds : configData.rateOfReturnBonds,
        monthlyInflation: probability.reverseCompoundInterest(configData.annualInflation, 12),
        cashAllocation: configData.cashAllocation,
        bondAllocation: configData.bondAllocation,
        equityAllocationDelta: configData.equityAllocationDelta,
        baseEquityBondCorrelation: configData.baseEquityBondCorrelation,
        survivorAdjustment: configData.survivorAdjustment,
        annualSpendingAdjustmentSingle: configData.annualSpendingAdjustmentSingle,
        annualSpendingAdjustmentCouple: configData.annualSpendingAdjustmentCouple,

        configData: configData,

        displayConfig : displayConfig
    };

    for (const person of config.persons) {
        loadMortalityData(person);
    }

    return config;
}

const loadMortalityData = function(person) {
    person.mortalityTable = mortalityTable.load(person.mortalityData);
};

function displayConfig(options) {
    console.log('**Configuration**');
    console.log('Number of Trials:', this.numberOfTrials);
    console.log('Maximum Age:', this.maxAge);

    console.log('Number of Persons:', this.persons.length);
    for (let i = 0; i < this.persons.length; ++i) {
        const person = this.persons[i];
        console.log('  Person', i + 1);
        console.log('    Initial Age:', person.initialAge);
        console.log(`    Social Security Start Age: ${ person.socialSecurityStartAge }`);
    }

    console.log(`Starting Balance: ${ formatter.format(this.startingBalance) }`);
    console.log(`Monthly Income (target): ${ formatter.format(this.monthlyIncomeTarget) }`);
    console.log(`Monthly Withdraw (floor): ${ formatter.format(this.monthlyWithdrawFloor) }`);
    console.log(`Annual Inflation: ${ this.configData.annualInflation * 100 }%`);
    console.log(`Cash Allocation: ${ this.configData.cashAllocation * 100 }%`);
    console.log(`Bond Allocation: ${ this.configData.bondAllocation * 100 }%`);
    console.log(`Base Equity-Bond Correlation: ${ Number(this.configData.baseEquityBondCorrelation).toFixed(2) }`);
    console.log(`Survivor Adjustment: ${ Number(this.configData.survivorAdjustment * 100).toFixed(2) }%`);
    console.log(`Annual Spending Adjustment (single): ${ Number(this.configData.annualSpendingAdjustmentSingle * 100).toFixed(2) }%`);
    console.log(`Annual Spending Adjustment (couple): ${ Number(this.configData.annualSpendingAdjustmentCouple * 100).toFixed(2) }%`);

    if (options && options.skipLines) {
        for (let i = 0; i < options.skipLines; ++i) {
            console.log()
        }
    }
}

module.exports = {
    loadConfig: loadConfig
};
