import { createApp } from './app.js';

const port = Number(process.env.PORT || 4102);
const app = createApp();

app.listen(port, () => {
  console.log('Bharat UPI Interdict API listening on http://127.0.0.1:' + port);
});

