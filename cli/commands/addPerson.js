const inquirer = require('inquirer');
const Person = require('../../Person');
require('../../db');

async function addPerson() {
  const answers = await inquirer.prompt([
    { name: 'name', message: 'Enter person name:' },
    { name: 'relationship', message: 'Enter relationship (friend/family/coworker):' },
    { name: 'birthday', message: 'Enter birthday (YYYY-MM-DD):' }
  ]);

  const person = new Person({
    name: answers.name,
    relationship: answers.relationship,
    birthday: new Date(answers.birthday)
  });

  await person.save();
  console.log('✅ Person added successfully!');
  process.exit();
}

module.exports = addPerson;
