const express = require('express');

const app = express();
app.use(express.json());
require('dotenv').config()

app.get('/', function (req, res) {
    res.send('Hello World')
})

// Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
