const fs = require('fs');
const config = require('./config');
const model = require('./model');

const configFile = fs.readFileSync("./configFiles/config3.json");
const configData = JSON.parse(configFile);

const modelConfig = config.loadConfig(configData);
modelConfig.displayConfig({ skipLines: 1 });
modelConfig.saveMonthlyData = true;

const results = [];
for (let i = 0; i < 30; i++) {
    modelConfig.monthlyPerformance.monthlyStd = 0.035 + (i * 0.001);
    console.log();
    console.log(`monthly std = ${ modelConfig.monthlyPerformance.monthlyStd }`);
    console.log();
    model.setConfig(modelConfig);
    const failureRate = model.runModel();
    results.push(failureRate);
}

let std = 0.035;
for (const res of results) {
    console.log(`${ Number(std).toFixed(3) }\t${ Number(res * 100).toFixed(2) }%`);
    std = std + 0.001;
}
//model.printMonthlyData();

process.exit();
