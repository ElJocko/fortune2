const probability = require('./probability');

const series0 = [];
const series1 = [];
// for (let i = 0; i < 10000; i++) {
//     const x = probability.normal(10.00, 0.3);
//     series0.push(x);
// }
//
const rho = -0.2;
// const rhoSqr = rho * rho;
// for (let i = 0; i < 10000; i++) {
//     const x = probability.normal(6.00, 0.1);
//     const cx = (rho * series0[i]) + (Math.sqrt(1.0 - rhoSqr) * x);
//     series1.push(cx);
// }

for (let i = 0; i < 10000; i++) {
    const correlatedValues = probability.correlatedNormals(10.00, 0.3, 6.00, 0.1, rho);
    series0.push(correlatedValues[0]);
    series1.push(correlatedValues[1]);
}

const sum0 = series0.reduce((acc, x) => acc + x);
const sum1 = series1.reduce((acc, x) => acc + x);

const mean0 = sum0 / series0.length;
const mean1 = sum1 / series1.length;

console.log(`mean0 = ${ mean0 }`);
console.log(`mean1 = ${ mean1 }`);

let sumXY = 0;
for (let i = 0; i < series0.length; i++) {
    sumXY += series0[i] * series1[i];
}

console.log(`E[XY] = ${ sumXY / series0.length }`);
console.log(`E[x]E[Y] = ${ mean0 * mean1 }`);

const covariance = (sumXY / series0.length) - (mean0 * mean1);
console.log(`E[XY] - E[x]E[Y] = ${ covariance }`);

console.log();

let sumDiffSqr = 0;
for (let i = 0; i < series0.length; i++) {
    const diff = mean0 - series0[i];
    sumDiffSqr += diff * diff;
}

const variance0 = sumDiffSqr / series0.length;
const std0 = Math.sqrt(variance0);

sumDiffSqr = 0;
for (let i = 0; i < series1.length; i++) {
    const diff = mean1 - series1[i];
    sumDiffSqr += diff * diff;
}

const variance1 = sumDiffSqr / series1.length;
const std1 = Math.sqrt(variance1);

console.log(`variance0 = ${ variance0 }`);
console.log(`std0 = ${ Math.sqrt(variance0) }`);
console.log(`variance1 = ${ variance1 }`);
console.log(`std1 = ${ Math.sqrt(variance1) }`);

const correlationCoefficient = covariance / Math.sqrt(variance0 * variance1);

console.log(`correlation coefficient = ${ correlationCoefficient }`);
