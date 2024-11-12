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
for (let i = 15; i < 81; i=i+5) {
    modelConfig.bondAllocation = i / 100;
    console.log();
    console.log(`bond allocation = ${ Number(modelConfig.bondAllocation).toFixed(2) }`);
    console.log();
    model.setConfig(modelConfig);
    const failureRate = model.runModel();
    results.push([modelConfig.bondAllocation, failureRate]);
}

for (const res of results) {
    console.log(`${ Number(res[0]).toFixed(2) }\t${ Number(res[1] * 100).toFixed(2) }%`);
}
//model.printMonthlyData();

process.exit();
