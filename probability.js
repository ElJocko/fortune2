function splitEvent(p, n) {
    // Split a single event into n independent events, retaining the same overall probability
    return (1 - (Math.pow((1 - p), 1 / n)));
}

function combineEvents(p, n) {
    // Combine n independent events with probability p into a single probability
    return (1 - Math.pow((1 - p), n));
}

function compoundInterest(i, n) {
    // Compound interest i over n periods
    return (Math.pow((1 + i), n) - 1);
}

function reverseCompoundInterest(i, n) {
    // Calculate periodic interest rate over n periods if compound rate is i
    return (Math.pow((1 + i), (1 / n)) - 1);
}

function futureValue(principle, i, t) {
    const factor = Math.pow(1.0 + i, t);
    const fv = principle * factor;
    return fv;
}

function normal(mean, std) {
    const unscaledNormal = randn_bm();
    const scaledNormal = (unscaledNormal * std) + mean;

    return scaledNormal;
}

function correlatedNormals(mean0, std0, mean1, std1, rho) {
    const unscaled0 = randn_bm();
    const unscaled1 = randn_bm();

    const scaled0 = mean0 + (std0 * unscaled0);
    const rhoSqr = rho * rho;
    const correlatedUnscaled1 = (rho * unscaled0) + (Math.sqrt(1.0 - rhoSqr) * unscaled1);
    const scaled1 = mean1 + (std1 * correlatedUnscaled1);

    return [scaled0, scaled1];
}


function randn_bm() {
    var u = 0, v = 0;
    while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

function calculateVariance(values, mean) {
    const deviations = values.map(value => (value - mean) * (value - mean));
    return deviations.reduce((acc, v) => acc + v, 0) / values.length;
}

function calculateStandardDeviation(values, mean) {
    const variance = calculateVariance(values, mean);
    return Math.sqrt(variance);
}

module.exports = {
    splitEvent: splitEvent,
    combineEvents: combineEvents,
    compoundInterest: compoundInterest,
    reverseCompoundInterest: reverseCompoundInterest,
    futureValue: futureValue,
    normal: normal,
    correlatedNormals: correlatedNormals,
    randn_bm: randn_bm,
    calculateVariance,
    calculateStandardDeviation,
}

