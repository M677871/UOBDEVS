const env = require('./config/env');
const app = require('./app');

app.listen(env.port, () => {
  console.log(`Backend server running on port ${env.port}`);
});
