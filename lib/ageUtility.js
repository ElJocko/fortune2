const modelUtility = require('./modelUtility');
const probability = require('../probability');

const inactivityThreshold = 840;
const healthThreshold = 900;

const steadyChangeThreshold = 780;

const inactivityAdjustment = -0.002;
const healthAdjustment = 0.004;

function calculateAgeAdjustment1(modelData) {
    const meanAge = modelUtility.getMeanAge(modelData.persons);
    let adjustment = 1.0;
    if (meanAge >= inactivityThreshold) {
        adjustment += (meanAge - inactivityThreshold) * inactivityAdjustment;
    }

    if (meanAge >= healthThreshold) {
        adjustment += (meanAge - healthThreshold) * healthAdjustment;
    }

    if (adjustment < 0) {
        console.warn('age adjustment less than 0');
        adjustment = 0;
    }

    return adjustment;
}

function calculateAgeAdjustment2(modelData, annualSpendingAdjustmentSingle, annualSpendingAdjustmentCouple) {
    const livingPersonCount = modelData.persons.filter(p => p.alive).length;
    const minAge = modelUtility.getMinAge(modelData.persons);
    let adjustment = 1.0;

    if (minAge >= steadyChangeThreshold) {
        // if (livingPersonCount === 1) {
        //     adjustment += (minAge - steadyChangeThreshold) * annualSpendingAdjustmentSingle;
        // }
        // else {
        const monthlySpendingAdjustment = annualSpendingAdjustmentSingle / 12;
        const period = minAge - steadyChangeThreshold;
        const cumulativeSpendingAdjustment = probability.compoundInterest(monthlySpendingAdjustment, period);
        adjustment += cumulativeSpendingAdjustment;
        // }
    }

    if (adjustment < 0) {
        console.warn('age adjustment less than 0');
        adjustment = 0;
    }

    return adjustment;
}

module.exports = {
    calculateAgeAdjustment1 : calculateAgeAdjustment1,
    calculateAgeAdjustment2 : calculateAgeAdjustment2
};
