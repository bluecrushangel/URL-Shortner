require('dotenv').config();
const express = require('express');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // lets express read JSON request bodies

app.use('/', routes);

app.listen(PORT, () => {
  console.log(`URL Service running on port ${PORT}`);
});