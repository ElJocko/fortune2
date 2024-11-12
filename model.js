const probability = require('./probability');

const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });

const ageUtility = require('./lib/ageUtility');
const socialSecurityBenefit = require('./socialSecurityBenefit');

let config;

let monthlyData = [];

let maxAgeInMonths;
function setConfig(modelConfig) {
    config = modelConfig;
    maxAgeInMonths = config.maxAge * 12;
    monthlyData = [];
}

function runModel() {
    let numberTrialsWithZeroBalance = 0;
    let numberTrialsWithReducedWithdraw = 0;
    let zeroBalanceMonthsSum = 0;
    let ageAtDeathSum = 0;
    let ageAtDeathZeroBalanceSum = 0;
    let monthlyRateSumEquities = 0.0;
    let monthlyRateSumBonds = 0.0;
    let balanceAtDeathSum = 0.0;
    let incomeSum = 0.0;
    let incomeSumPV = 0.0;
    let withdrawSum = 0.0;
    let withdrawFromCashSum = 0.0;
    let withdrawSumPV = 0.0;
    let trialMonthsSum = 0;
    let withdrawMonthsSum = 0;
    let reducedWithdrawMonthsPerTrialSum = 0.0;
    const balanceAtDeath = [];
    const monthsToZeroBalance = [];
    for (let i = 0; i < config.numberOfTrials; ++i) {
        const trialResult = runTrial();
        trialMonthsSum += trialResult.trialMonths;
        incomeSum += trialResult.incomeSum;
        incomeSumPV += trialResult.incomeSumPV;
        withdrawSum += trialResult.withdrawSum;
        withdrawFromCashSum += trialResult.withdrawFromCashSum;
        withdrawSumPV += trialResult.withdrawSumPV;
        if (trialResult.zeroBalanceAtMonth !== 0) {
            numberTrialsWithZeroBalance++;
            zeroBalanceMonthsSum += trialResult.zeroBalanceAtMonth;
            withdrawMonthsSum += trialResult.zeroBalanceAtMonth;
            ageAtDeathZeroBalanceSum += trialResult.ageAtDeath / 12;
            monthsToZeroBalance.push(trialResult.zeroBalanceAtMonth);
        }
        else {
            balanceAtDeathSum += trialResult.balanceAtDeath;
            withdrawMonthsSum += trialResult.trialMonths;
            balanceAtDeath.push(trialResult.balanceAtDeath);
        }
        if (trialResult.reducedWithdrawMonths > 0) {
            numberTrialsWithReducedWithdraw++;
            reducedWithdrawMonthsPerTrialSum += trialResult.reducedWithdrawMonths / trialResult.trialMonths;
        }
        ageAtDeathSum += trialResult.ageAtDeath / 12;
        monthlyRateSumEquities += trialResult.meanMonthlyRateEquities;
        monthlyRateSumBonds += trialResult.meanMonthlyRateBonds;
    }

    let failureRate = numberTrialsWithZeroBalance / config.numberOfTrials;
    if (failureRate > 0) {
        console.log(`Reached zero balance in ${ Number(failureRate * 100.0).toFixed(2) }% of trials`);

        const meanMonthsToZero = zeroBalanceMonthsSum / numberTrialsWithZeroBalance;
        const medianMonthsToZero = getMedian(monthsToZeroBalance);
        console.log(`  Mean number of months until zero balance: ${ Number(meanMonthsToZero).toFixed(2) } (${Number(meanMonthsToZero / 12).toFixed(1) } years)`);
        console.log(`  Median number of months until zero balance: ${ Number(medianMonthsToZero).toFixed(2) } (${Number(medianMonthsToZero / 12).toFixed(1) } years)`);
    }
    else {
        console.log('No trials reached zero balance!');
    }
    console.log(`Reduced withdraw in ${ Number((numberTrialsWithReducedWithdraw / config.numberOfTrials) * 100.0).toFixed(2) }% of trials`);
    console.log(`  ${ Number((reducedWithdrawMonthsPerTrialSum / config.numberOfTrials) * 100.0).toFixed(2) }% of the months in those trials`);

    const meanMonthlyRateEquities = monthlyRateSumEquities / config.numberOfTrials;
    const meanMonthlyRateBonds = monthlyRateSumBonds / config.numberOfTrials;
    const meanAnnualRateEquities = probability.compoundInterest(meanMonthlyRateEquities, 12);
    const meanAnnualRateBonds = probability.compoundInterest(meanMonthlyRateBonds, 12);

    const medianBalanceAtDeath = getMedian(balanceAtDeath);

    console.log('Mean age at death:', Number(ageAtDeathSum / config.numberOfTrials).toFixed(2));
    console.log('Mean age at death (reached zero balance):', Number(ageAtDeathZeroBalanceSum / numberTrialsWithZeroBalance).toFixed(2));
    console.log(`Mean balance at death (if not zero): ${ formatter.format(balanceAtDeathSum / (config.numberOfTrials - numberTrialsWithZeroBalance)) }`);
    console.log(`Median balance at death (if not zero): ${formatter.format(medianBalanceAtDeath)}`);
    console.log(`Mean monthly rate of return (equities): ${ Number(meanMonthlyRateEquities).toFixed(6) } (annual rate ${ Number(meanAnnualRateEquities * 100).toFixed(4) } %)`);
    console.log(`Mean monthly rate of return (bonds): ${ Number(meanMonthlyRateBonds).toFixed(6) } (annual rate ${ Number(meanAnnualRateBonds * 100).toFixed(4) } %)`);

    console.log(`Mean trial months: ${ Number(trialMonthsSum / config.numberOfTrials).toFixed(2) }`);
    console.log(`Mean monthly income: ${ formatter.format(incomeSum / trialMonthsSum) }`);
    console.log(`Mean monthly income (inflation adjusted): ${ formatter.format(incomeSumPV / trialMonthsSum) }`);

    console.log(`Mean monthly withdraw: ${ formatter.format(withdrawSum / withdrawMonthsSum) }`);

    const meanMonthlyWithdrawIA = withdrawSumPV / withdrawMonthsSum;
    console.log(`Mean monthly withdraw (inflation adjusted): ${ formatter.format(meanMonthlyWithdrawIA) } (${ Number(((meanMonthlyWithdrawIA * 12) / config.startingBalance) * 100).toFixed(2) }% annual withdraw of starting balance)`);

    console.log(`Mean withdraw from cash: ${ formatter.format(withdrawFromCashSum / config.numberOfTrials) }`);

    return failureRate;
}

function runTrial() {
    let trialMonths = 0;
    const modelData = initializeModelData();

    // Investment configuration
    const monthlyRateOfReturnEquities = probability.reverseCompoundInterest(config.monthlyPerformanceEquities.annualRate, 12.0);
    const monthlyRateOfReturnBonds = probability.reverseCompoundInterest(config.monthlyPerformanceBonds.annualRate, 12.0);
    // const monthlyStd = config.monthlyPerformance.std / 3.46; // sqrt(12)
    const monthlyStdEquities = config.monthlyPerformanceEquities.monthlyStd;
    const monthlyStdBonds = config.monthlyPerformanceBonds.monthlyStd;
    // const monthlyVariance = (monthlyStd * monthlyStd);
    let equityBondCorrelation = config.baseEquityBondCorrelation;

    // Withdraw configuration
    let monthlyIncomeTarget = config.monthlyIncomeTarget;
    let monthlyWithdrawFloor = config.monthlyWithdrawFloor;
    let reducedWithdrawMonths = 0;

    let cumulativeInflation = 1.0;
    let monthlyRateSumEquities = 0.0;
    let monthlyRateSumBonds = 0.0;

    let incomeSum = 0.0;
    let incomeSumPV = 0.0;

    let withdrawSum = 0.0;
    let withdrawFromCashSum = 0.0
    let withdrawSumPV = 0.0;

    let prevPeriodNonCashBalance = modelData.accountBalance.equities + modelData.accountBalance.bonds;

    while (modelData.persons.some(p => p.alive)) {
        trialMonths++;

        // Preretirement Income
        let monthlyPreretirementIncome = 0.0;
        modelData.persons.forEach(function(person) {
            if (person.age < person.socialSecurityStartAge) {
                monthlyPreretirementIncome += person.monthlyPreretirementIncome;
            }
        });

        // Social Security Benefits
        let socialSecurityBenefits = 0.0;
        modelData.persons.forEach(function(person) {
            if (person.age >= person.socialSecurityStartAge) {
                socialSecurityBenefits += person.monthlySocialSecurityBenefit;
            }
        });

        // Calculate amount to withdraw from principle

        // Start with the inflation adjusted withdraw target
        let spending = monthlyIncomeTarget;

        // Apply age adjustment
        // const ageAdjustment = ageUtility.calculateAgeAdjustment1(modelData);
        const ageAdjustment = ageUtility.calculateAgeAdjustment2(modelData, config.annualSpendingAdjustmentSingle, config.annualSpendingAdjustmentCouple);
        spending = spending * ageAdjustment;

        // Adjust for social security and earned income
        let withdraw = spending - (socialSecurityBenefits + monthlyPreretirementIncome);

        if (withdraw < 0.0) {
            withdraw = 0.0;
        }

        // Do we need to reduce the withdraw amount?
        const minSafeWithdraw = calculateMinSafeWithdraw2(modelData, monthlyRateOfReturnEquities, monthlyRateOfReturnBonds);
        if (withdraw > minSafeWithdraw && modelData.totalBalance() > 0.0) {
            withdraw = Math.max(minSafeWithdraw, monthlyWithdrawFloor);
            reducedWithdrawMonths++;
        }

        if (modelData.totalBalance() > withdraw) {
            const startPeriodNonCashBalance = modelData.accountBalance.equities + modelData.accountBalance.bonds;
            if (startPeriodNonCashBalance >= prevPeriodNonCashBalance) {
                // Positive account in equities plus bonds
                if (startPeriodNonCashBalance > withdraw) {
                    let postWithdrawNonCashBalance = startPeriodNonCashBalance - withdraw;
                    prevPeriodNonCashBalance = postWithdrawNonCashBalance;

                    // Replenish cash reserve
                    const cashReserveDeficit = modelData.cashReserveTarget - modelData.accountBalance.cash;
                    if (cashReserveDeficit > 0) {
                        if (postWithdrawNonCashBalance > cashReserveDeficit) {
                            modelData.accountBalance.cash += cashReserveDeficit;
                            postWithdrawNonCashBalance -= cashReserveDeficit;
                        }
                        else {
                            modelData.accountBalance.cash += postWithdrawNonCashBalance;
                            postWithdrawNonCashBalance = 0;
                        }
                    }

                    modelData.accountBalance.equities = postWithdrawNonCashBalance * modelData.equityNonCashRatio;
                    modelData.accountBalance.bonds = postWithdrawNonCashBalance * (1.0 - modelData.equityNonCashRatio);
                }
                else {
                    const withdrawFromCash = withdraw - startPeriodNonCashBalance;
                    modelData.accountBalance.equities = 0.0;
                    modelData.accountBalance.bonds = 0.0;
                    modelData.accountBalance.cash -= withdrawFromCash;

                    withdrawFromCashSum += withdrawFromCash;
                }
            }
            else {
                // Loss in noncash balance
                if (modelData.accountBalance.cash > withdraw) {
                    // Cash can cover the entire withdraw
                    modelData.accountBalance.cash -= withdraw;

                    withdrawFromCashSum += withdraw;
                }
                else {
                    // Cash cannot cover the entire withdraw
                    const withdrawFromCash = modelData.accountBalance.cash;
                    const withdrawFromNonCash = withdraw - withdrawFromCash;

                    const postWithdrawNonCashBalance = startPeriodNonCashBalance - withdrawFromNonCash;
                    modelData.accountBalance.equities = postWithdrawNonCashBalance * modelData.equityNonCashRatio;
                    modelData.accountBalance.bonds = postWithdrawNonCashBalance * (1.0 - modelData.equityNonCashRatio);
                    modelData.accountBalance.cash = 0.0;

                    withdrawFromCashSum += withdrawFromCash;
                }
            }

            incomeSum += withdraw + socialSecurityBenefits + monthlyPreretirementIncome;
            incomeSumPV += (withdraw + socialSecurityBenefits + monthlyPreretirementIncome) / cumulativeInflation;

            withdrawSum += withdraw;
            withdrawSumPV += withdraw / cumulativeInflation;
       }
       else {
           // Zero balance
           if (modelData.zeroBalanceAtMonth === 0) {
               modelData.accountBalance.equities = 0.0;
               modelData.accountBalance.bonds = 0.0;
               modelData.accountBalance.cash = 0.0;
               modelData.zeroBalanceAtMonth = trialMonths;
               //console.log(`Hit zero balance (${ trialMonths })`);
           }
       }

        // Simulate market
        const monthlyReturns = probability.correlatedNormals(monthlyRateOfReturnEquities, monthlyStdEquities, monthlyRateOfReturnBonds, monthlyStdBonds, equityBondCorrelation);
        let monthlyReturnEquities = monthlyReturns[0];
        let monthlyReturnBonds = monthlyReturns[1];
        if (monthlyReturnEquities < -1.0 || monthlyReturnBonds < -1.0) {
            console.log('market crash!!!');
            monthlyReturnEquities = -1.0;
            monthlyReturnBonds = -1.0;
        }
        modelData.accountBalance.equities += (Math.abs(modelData.accountBalance.equities) * monthlyReturnEquities);
        modelData.accountBalance.bonds += (Math.abs(modelData.accountBalance.bonds) * monthlyReturnBonds);

        monthlyRateSumEquities += monthlyReturnEquities;
        monthlyRateSumBonds += monthlyReturnBonds;
        //if (trialMonths%12 === 0) {
            //console.log(annualRate);
            //annualRate = 0.0;
        //}
        //console.log(`trial month: ${ trialMonths }  balance: ${ modelData.accountBalance }`);

        // Apply inflation
        monthlyIncomeTarget = monthlyIncomeTarget * (1.0 + config.monthlyInflation);
        monthlyWithdrawFloor = monthlyWithdrawFloor * (1.0 + config.monthlyInflation);
        cumulativeInflation = cumulativeInflation * (1.0 + config.monthlyInflation);

        // Adjust desired equity ratio
        modelData.equityNonCashRatio += config.equityAllocationDelta;
        if (modelData.equityNonCashRatio > 1.0) {
            modelData.equityNonCashRatio = 1.0;
        }
        else if (modelData.equityNonCashRatio < 0.0) {
            modelData.equityNonCashRatio = 0.0;
        }

        // Test mortality
        modelData.persons.forEach(function(person) {
            testMortality(person);
            increaseAge(person);
        });

        if (config.saveMonthlyData) {
            monthlyData.push({ month: trialMonths, balance: modelData.totalBalance() });
        }
    }

    const trialResult = {
        trialMonths,
        ageAtDeath : modelData.persons.reduce((a, p) => Math.max(a, p.ageAtDeath), 0),
        zeroBalanceAtMonth: modelData.zeroBalanceAtMonth,
        balanceAtDeath: modelData.totalBalance(),
        incomeSum,
        incomeSumPV,
        withdrawSum,
        withdrawFromCashSum,
        withdrawSumPV,
        reducedWithdrawMonths,
        meanMonthlyRateEquities: monthlyRateSumEquities / trialMonths,
        meanMonthlyRateBonds: monthlyRateSumBonds / trialMonths
    };

    return trialResult;
}

function initializeModelData() {
    const initialCash = config.startingBalance * config.cashAllocation;
    const initialBonds = config.startingBalance * config.bondAllocation;

    const equityAllocation = 1.0 - (config.cashAllocation + config.bondAllocation);
    const modelData = {
        persons: [],
        accountBalance: {
            equities: config.startingBalance - (initialCash + initialBonds),
            bonds: initialBonds,
            cash: initialCash
        },
        cashReserveTarget: initialCash,
        equityNonCashRatio: equityAllocation / (equityAllocation + config.bondAllocation),
        zeroBalanceAtMonth: 0,
        totalBalance: function() {
            return this.accountBalance.equities + this.accountBalance.bonds + this.accountBalance.cash;
        }
    }

    // Initialize persons
    config.persons.forEach(function(personConfig) {
        const person = {
            age: personConfig.initialAge * 12,
            alive: true,
            mortalityTable: personConfig.mortalityTable,
            socialSecurityStartAge: personConfig.socialSecurityStartAge * 12,
            monthlyPreretirementIncome: personConfig.monthlyPreretirementIncome
        };
        person.monthlySocialSecurityBenefit = socialSecurityBenefit.calculateMonthlyBenefit(person.socialSecurityStartAge, personConfig.monthlySocialSecurityPrimaryInsuranceAmount);
        modelData.persons.push(person);
    });

    return modelData;
}

function printMonthlyData() {
    monthlyData.forEach(d => console.log(`${ d.month }, ${ d.balance }`));
}

function testMortality(person) {
    if (person.alive) {
        if (person.age > maxAgeInMonths) {
            person.ageAtDeath = person.age;
            person.alive = false;
        }
        else {
            const mortalityRate = person.mortalityTable[person.age].deathProbability;
            const mortalityScore = Math.random();
            if (mortalityScore < mortalityRate) {
                person.ageAtDeath = person.age;
                person.alive = false;
            }
        }
    }
}

function combinedLifeExpectancy(persons) {
    let lifeExpectancy = 0;
    for (const person of persons) {
        lifeExpectancy = Math.max(lifeExpectancy, person.mortalityTable[person.age].meanLifeExpectancy)
    }

    return lifeExpectancy;
}

function increaseAge(person) {
    if (person.alive) {
        person.age++;
    }
}

function getMedian(data) {
    const values = [...data];
    const v   = values.sort( (a, b) => a - b);
    const mid = Math.floor( v.length / 2);
    const median = (v.length % 2 !== 0) ? v[mid] : (v[mid - 1] + v[mid]) / 2;
    return median;
}

function calculateMinSafeWithdraw2(modelData, monthlyRateOfReturnEquities, monthlyRateOfReturnBonds) {
    const totalBalance = modelData.totalBalance();
    const proratedRateOfReturn =
        (modelData.accountBalance.equities / totalBalance) * monthlyRateOfReturnEquities +
        (modelData.accountBalance.bonds / totalBalance) * monthlyRateOfReturnBonds;
    return totalBalance * proratedRateOfReturn;
}


module.exports = {
    runModel : runModel,
    setConfig: setConfig,
    printMonthlyData: printMonthlyData
};
