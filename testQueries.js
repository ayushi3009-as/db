const mongoose = require('./db');
const Person = require('./Person');
const Interaction = require('./Interaction');

async function test() {
  try {
    // 1. Find all people
    const people = await Person.find();
    console.log("All People:", people);

    // 2. Find interactions with Sam
    const sam = await Person.findOne({ name: "Sam" });
    const interactions = await Interaction.find({ personId: sam._id });
    console.log("Sam's Interactions:", interactions);

    // 3. Aggregation: Most contacted person
    const agg = await Interaction.aggregate([
      { $group: { _id: "$personId", totalInteractions: { $sum: 1 } } },
      { $sort: { totalInteractions: -1 } },
      { $lookup: { from: "people", localField: "_id", foreignField: "_id", as: "personInfo" } }
    ]);
    console.log("Most Contacted Person:", agg);

    // 4. Find inactive people (>7 days)
    const inactive = await Person.find({ lastContact: { $lt: new Date(Date.now() - 7*24*60*60*1000) } });
    console.log("Inactive People (>7 days):", inactive);

    mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

test();
