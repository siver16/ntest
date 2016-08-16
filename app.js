'use strict';

let express = require('express');
let app = express();
let bodyParser = require('body-parser');

var api = require ('./api/api');

app.use(bodyParser.json());
app.use('/api',api);

module.exports = app;