function calculateMonthlyBenefit(startingAge, primaryInsuranceAmount) {
    const minRetirementAge = 62 * 12;
    const fullRetirementAge = 67 * 12;
    const maxRetirementAge = 70 * 12;
    const earlyFactor1 = (5.0 / 9.0) / 100.0;
    const earlyFactor2 = (5.0 / 12.0) / 100.0;
    const lateFactor = (2.0 / 3.0) / 100.0;

    if (startingAge < minRetirementAge) {
        return 0;
    }
    else if (startingAge < fullRetirementAge) {
        const monthsEarly = fullRetirementAge - startingAge;
        if (monthsEarly <= 36) {
            const earlyPenalty = monthsEarly * earlyFactor1 * primaryInsuranceAmount;
            return primaryInsuranceAmount - earlyPenalty;
        }
        else {
            const earlyPenalty1 = 36 * earlyFactor1 * primaryInsuranceAmount;
            const earlyPenalty2 = (monthsEarly - 36) * earlyFactor2 * primaryInsuranceAmount;
            const totalPenalty = earlyPenalty1 + earlyPenalty2;
            return primaryInsuranceAmount - totalPenalty;
        }
    }
    else if (startingAge === fullRetirementAge) {
        return primaryInsuranceAmount;
    }
    else if (startingAge <= maxRetirementAge) {
        const monthsLate = startingAge - fullRetirementAge;
        const lateBonus = monthsLate * lateFactor * primaryInsuranceAmount;
        return primaryInsuranceAmount + lateBonus;
    }
    else {
        const monthsLate = maxRetirementAge - fullRetirementAge;
        const lateBonus = monthsLate * lateFactor * primaryInsuranceAmount;
        return primaryInsuranceAmount + lateBonus;
    }
}

module.exports = { calculateMonthlyBenefit };