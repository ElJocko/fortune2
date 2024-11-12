const fs = require('fs');
const config = require('./config');
const model = require('./model');

const configFile = fs.readFileSync("./configFiles/config3.json");
const configData = JSON.parse(configFile);

const modelConfig = config.loadConfig(configData);
modelConfig.displayConfig({ skipLines: 1 });
modelConfig.saveMonthlyData = true;

model.setConfig(modelConfig);
model.runModel();
//model.printMonthlyData();

process.exit();
