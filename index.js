const express = require('express');
const connectDB = require('./config/db')
const authrouter = require("./routes/authRouter")
const cookieParser = require('cookie-parser')
const app = express()
const port = 3000;


app.use(express.json());
app.use(cookieParser());


/* works when I add this */
const  dns = require("node:dns/promises");   
dns.setServers(["1.1.1.1", "1.0.0.1"]);


connectDB();

app.get('/',(req,res)=>{
    res.send("Ping pong..")
});

app.use("/api",authrouter);

app.listen(port,()=>{
    console.log(`listening on port ${port}`);
})