const express = require('express');
const app = express();
try {
  app.options('/{*splat}', (req, res) => res.send('ok'));
  console.log('/{*splat} worked');
} catch (e) {
  console.log('/{*splat} failed:', e.message);
}
try {
  app.options('/{*path}', (req, res) => res.send('ok'));
  console.log('/{*path} worked');
} catch (e) {
  console.log('/{*path} failed:', e.message);
}
try {
  app.options('/(.*)', (req, res) => res.send('ok')); // we saw this failed
} catch (e) {}
