const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

//middleware
const app = express();
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://b9-assignment11-client.web.app",
    "https://b9-assignment11-client.firebaseapp.com",
  ],
  credentials: true,
  //   optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

//verify jwt middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).send({ message: "unauthorized access" });
  if (token) {
    jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, (err, decoded) => {
      if (err) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      req.user = decoded;
    });
    next();
  }
};
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
    //jwt generate
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_ACCESS_TOKEN, {
        expiresIn: "7d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "porduction" ? "none" : "strict",
        })
        .send({ success: true });
    });
    //clear token
    app.get("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "porduction" ? "none" : "strict",
          maxAge: 0,
        })
        .send({ success: true });
    });
    //get teaching services
    app.get("/teacher", async (req, res) => {
      const result = await services.find().toArray();
      const shuffledResult = result.sort(() => Math.random() - 0.5);
      const teachersToDisplay = shuffledResult.slice(0, 8);
      res.send(teachersToDisplay);
    });
    //

    app.get("/services", async (req, res) => {
      const result = await services.find().toArray();
      const shuffledResult = result.sort(() => Math.random() - 0.5);
      const servicesToDisplay = shuffledResult.slice(0, 6);
      res.send(servicesToDisplay);
    });
    app.get("/allservices", async (req, res) => {
      const search = req.query.search;
      let query = {
        name: { $regex: String(search), $options: "i" },
      };
      const result = await services.find(query).toArray();
      res.send(result);
    });
    //get single services
    app.get("/service/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await services.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    //get services of user
    app.get("/serviceprovider/:email", verifyToken, async (req, res) => {
        const email = req.params.email;
        const tokenEmail = req.user.email;
        console.log(email, tokenEmail);
        if (tokenEmail !== email) {
          return res.status(403).send({ message: "Forbiden access" });
        }
      const result = await services.find({ providerEmail: email }).toArray();
      res.send(result);
    });
    //send data in collection
    app.post("/bookservice", verifyToken, async (req, res) => {
      const bookData = req.body;
      //duplicate booking validation
      const query = {
        buyerEmail: bookData.buyerEmail,
        serviceId: bookData.serviceId,
      };
      const alreadyBooked = await bookServices.findOne(query);
      if (alreadyBooked) {
        return res.status(400).send("Already Booked the service");
      }
      const result = await bookServices.insertOne(bookData);
      res.send(result);
    });
    //get book services
    app.get("/bookedservices/:email", verifyToken, async (req, res) => {
      const tokenEmail = req.user.email;
      const email = req.params.email;
      if (tokenEmail !== email) {
        return res.status(403).send({ message: "Forbiden access" });
      }
      const result = await bookServices.find({ buyerEmail: email }).toArray();
      res.send(result);
    });
    //add services
    app.post("/addservices", verifyToken, async (req, res) => {
      const serviceData = req.body;
      const result = await services.insertOne(serviceData);
      res.send(result);
    });
    //delete service
    app.delete("/delete/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await services.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
      console.log(result);
    });
    //update service
    app.put("/update/:id", verifyToken, async (req, res) => {
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
    app.get("/todoservice/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const tokenEmail = req.user.email;
      if (tokenEmail !== email) {
        return res.status(403).send({ message: "Forbiden access" });
      }
      const result = await bookServices
        .find({ providerEmail: email })
        .toArray();
      res.send(result);
    });
    //update todo status
    app.patch("/updatestatus/:id", verifyToken, async (req, res) => {
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
