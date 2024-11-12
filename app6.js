const fs = require('fs');
const config = require('./config');
const model = require('./model');

const configFile = fs.readFileSync("./configFiles/config3.json");
const configData = JSON.parse(configFile);

const modelConfig = config.loadConfig(configData);
modelConfig.displayConfig({ skipLines: 1 });
modelConfig.saveMonthlyData = true;

// modelConfig.equityAllocationDelta = -0.0004;

const results = [];
for (let i = 0; i < 20; i++) {
    modelConfig.monthlyIncomeTarget = (100000 + (i * 5000)) / 12;
    console.log();
    console.log(`annual income target = ${ Number(modelConfig.monthlyIncomeTarget * 12).toFixed(2) }`);
    console.log();
    model.setConfig(modelConfig);
    const failureRate = model.runModel();
    results.push([modelConfig.monthlyIncomeTarget * 12, failureRate]);
}

for (const res of results) {
    console.log(`${ Number(res[0]).toFixed(2) }\t${ Number(res[1] * 100).toFixed(2) }%`);
}
//model.printMonthlyData();

process.exit();
