require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const menuRoutes = require('./routes/menuRoutes');


const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('../public'));

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// Use Routes
app.use('/api/menu', menuRoutes);     
app.use('/api/menus', menuRoutes);     


// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});