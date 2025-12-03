const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');

const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const memoryRoutes = require('./routes/memoryRoutes');

const app = express();
connectDB();

app.use(cors());
app.use(bodyParser.json());

// ✅ Register route prefixes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/memories', memoryRoutes); // ✅ ADD THIS LINE

app.get('/', (req, res) => res.send('EchoVault backend running successfully 🚀'));

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));