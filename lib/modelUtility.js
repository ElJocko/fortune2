function getMeanAge(persons) {
    let livingPersonCount = 0;
    let totalMonths = 0;
    for (const person of persons) {
        if (person.alive) {
            livingPersonCount++;
            totalMonths += person.age;
        }
    }

    return totalMonths / livingPersonCount;
}

function getMinAge(persons) {
    const livingPersons = persons.filter(p => p.alive);
    const ages = livingPersons.map(p => p.age);
    return Math.min(...ages);
}

module.exports = {
    getMeanAge: getMeanAge,
    getMinAge: getMinAge
};
