const ageUtility = require('./lib/ageUtility');

for (let i = 62*12; i < 100*12; i++) {
    const persons = [{ alive: true, age: i }];
    const adjustment = ageUtility.calculateAgeAdjustment1({ persons });
    console.log(`age: ${ Math.floor(i/12) } years ${ i%12 } months, adjustment: ${ Number.parseFloat(adjustment * 100).toFixed(1) }%`);
}


process.exit();
