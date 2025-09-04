const express = require('express');
const connectDB = require('./data/db.js');
const cors = require('cors');
const dotenv = require('dotenv');

const menuRoutes = require('./menu/router.js');
const paymentsRoutes = require('./payments/routes.js');
const signInRoutes = require('./signIn/route.js');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();


app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/menu', menuRoutes);
app.use('/payment', paymentsRoutes);
app.use('/pos', signInRoutes);



app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});