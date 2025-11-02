const mongoose = require('./db');
const Person = require('./Person');
const Interaction = require('./Interaction');

async function seed() {
  try {
    // Clear old data
    await Person.deleteMany({});
    await Interaction.deleteMany({});

    // Insert sample people
    const people = await Person.insertMany([
      { name: "Sam", relationship: "friend", birthday: new Date("1998-05-12") },
      { name: "Mom", relationship: "family", birthday: new Date("1970-01-05") },
      { name: "Alice", relationship: "coworker", birthday: new Date("1995-08-09") }
    ]);

    // Insert sample interactions
    await Interaction.insertMany([
      { personId: people[0]._id, message: "Discussed project", sentiment: "positive" },
      { personId: people[1]._id, message: "Called about health", sentiment: "neutral" },
      { personId: people[2]._id, message: "Meeting review", sentiment: "positive" }
    ]);

    console.log('✅ Sample data inserted successfully');
    mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

seed();
