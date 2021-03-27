// global npm imports 
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const dotenv = require('dotenv')
const {verifyFileGetter} = require('./controllers/file.js');

// set config prop file
dotenv.config({
  path: './configs/properties-dev.env'
})

// module imports
const LOG = require('./utils/log')
const DB = require("./models/dbConnect")

// import routes
const auth = require("./routes/auth")
const file = require("./routes/file")
const user = require("./routes/user")

// Initialize DB
const initDBConnection = async () =>{ await DB.connectDB(false) }
initDBConnection()

// create express app
const app = express()

// Add cors
const corsOptions = {
  origin: "localhost"
}
app.use(cors(corsOptions))

// Add body parser
app.use(bodyParser.json() )// parse requests of content-type - application/json 
app.use(bodyParser.urlencoded({ extended: true })) // parse content-type - application/x-www-form-urlencoded

// mount routers
app.use("/api/v1/auth", auth)
app.use("/api/v1/user", user)
app.use("/api/v1/file", file)
// app.use("/:filename", verifyFileGetter)
// app.use("/", express.static("./media/files"))

// start server
const PORT = process.env.PORT || 5001;
const server = app.listen(
  PORT,
  ()=>{
    LOG.message("-----------------------------------INIT COMPLETE-----------------------------------")
    LOG.route(
      `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    )
  }
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  LOG.error(`Error: ${err.message}`.red);
  // Close server & exit process
  // server.close(() => process.exit(1));
});