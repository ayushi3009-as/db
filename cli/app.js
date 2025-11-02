const addPerson = require('./commands/addPerson');

const args = process.argv.slice(2);

if (args[0] === 'add-person') {
  addPerson();
} else {
  console.log("Available commands: add-person");
}
