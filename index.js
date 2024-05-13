const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

//middleware
const app = express();
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5173"],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors({ corsOptions }));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.i7qzqrj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const services = client.db("allservices").collection("services");
    const bookServices = client.db("allservices").collection("bookservices");
    //get teaching services
    app.get("/services", async (req, res) => {
      const result = await services.find().limit(6).toArray();
      res.send(result);
    });
    app.get("/allservices", async (req, res) => {
      const result = await services.find().toArray();
      res.send(result);
    });
    //get single services
    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const result = await services.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    //get services of user
    app.get("/serviceprovider/:email", async (req, res) => {
      const email = req.params.email;
      const result = await services.find({ providerEmail: email }).toArray();
      res.send(result);
    });
    //send data in collection
    app.post("/bookservice", async (req, res) => {
      const bookData = req.body;
      const result = await bookServices.insertOne(bookData);
      res.send(result);
    });
    //get book services
    app.get("/bookedservices/:email", async (req, res) => {
      const email = req.params.email;
      const result = await bookServices.find({ buyerEmail: email }).toArray();
      res.send(result);
    });
    //add services
    app.post("/addservices", async (req, res) => {
      const serviceData = req.body;
      const result = await services.insertOne(serviceData);
      res.send(result);
    });
    //delete service
    app.delete("/delete/:id", async (req, res) => {
      const id = req.params.id;
      const result = await services.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
      console.log(result);
    });
    //update service
    app.put("/update/:id", async (req, res) => {
      const id = req.params.id;
      const serviceData = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateService = {
        $set: {
          ...serviceData,
        },
      };
      const result = await services.updateOne(query, updateService, options);
      res.send(result);
    });
    //service todo
    app.get("/todoservice/:email", async (req, res) => {
      const email = req.params.email;
      const result = await bookServices
        .find({ providerEmail: email })
        .toArray();
      res.send(result);
    });
    //update todo status
    app.patch("/updatestatus/:id", async (req, res) => {
      const id = req.params.id;
      const serviceStatus = req.body;
      console.log(serviceStatus, id);
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateService = {
        $set: { ...serviceStatus },
      };
      const result = await bookServices.updateOne(
        query,
        updateService,
        options
      );
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server of mastaar");
});
app.listen(port, () => {
  console.log(`server is running on ${port}`);
});
