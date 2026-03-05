require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:5173'
}));
app.use(express.json());
app.use('/', routes);

app.listen(PORT, () => {
  console.log(`URL Service running on port ${PORT}`);
});