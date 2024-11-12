const fs = require('fs');
const config = require('./config');
const model = require('./model');
const stats = require('./probability');

// This code runs the model with different numbers of trials and presents a short statistical analysis of the results.
// These results can be used to determine the number of trials necessary to ensure that outliers aren't skewing the
// model results.
const configFile = fs.readFileSync("./configFiles/config3.json");
const configData = JSON.parse(configFile);

const modelConfig = config.loadConfig(configData);
modelConfig.displayConfig({ skipLines: 1 });
modelConfig.saveMonthlyData = true;
// modelConfig.equityAllocationDelta = -0.00;

const results = [];
for (let i = 1; i < 6; i++) {
    modelConfig.numberOfTrials = Math.pow(10, i) / 2;
    console.log();
    console.log(`Test ${ i }: Running model with ${ modelConfig.numberOfTrials } trials`);
    console.log();
    const testResults = [];
    for (let j = 0; j < 10; j++) {
        console.log(`Run ${ j }:`);
        model.setConfig(modelConfig);
        const failureRate = model.runModel();
        testResults.push(failureRate);
    }

    const testMean = testResults.reduce((acc, val) => acc + val, 0) / testResults.length;
    const testStd = stats.calculateStandardDeviation(testResults, testMean);

    results.push([modelConfig.numberOfTrials, testMean, testStd]);
}

for (const res of results) {
    console.log(`${ res[0] }\tmean = ${ Number(res[1] * 100).toFixed(2) }% std = ${ Number(res[2] * 100).toFixed(2) }`);
}
//model.printMonthlyData();

process.exit();
