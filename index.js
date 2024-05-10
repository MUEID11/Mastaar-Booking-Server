const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;


//middleware
const app = express();
const corsOptions = {
    origin: ["http://localhost:5173", "http://localhost:5173"],
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors({corsOptions}))
app.use(express.json());


app.get('/', (req,res)=> {
    res.send('Server of mastaar');
})
app.listen(port, ()=>{
    console.log(`server is running on ${port}`)
})