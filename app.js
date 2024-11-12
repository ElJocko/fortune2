const fs = require('fs');
const config = require('./config');
const model = require('./model');

const configFile = fs.readFileSync("./configFiles/config2.json");
const configData = JSON.parse(configFile);


for (let i = 0; i < 10; i++) {
    const modelConfig = config.loadConfig(configData);
    modelConfig.displayConfig({ skipLines: 1 });

    model.setConfig(modelConfig);
    model.runModel();

    console.log(`Run ${ i } complete\n`);

    configData.annualWithdrawTargetRate += 0.005;
}

console.log("Model Runs Complete\n");

process.exit();
