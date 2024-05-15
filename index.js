const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 9000;

const app = express();

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://user-email-passwoed-auth.web.app",
    "https://user-email-passwoed-auth.firebaseapp.com",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fi65pdm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const booksCollection = client.db("libraryRoom").collection("books");
    const categoryCollection = client
      .db("libraryRoom")
      .collection("booksCategory");
    const borrowCollection = client.db("libraryRoom").collection("borrow");

    // jwt generate
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "7d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production" ? true : false,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // Get all books data from DB
    app.get("/books", async (req, res) => {
      const result = await booksCollection.find().toArray();
      res.send(result);
    });

    // Get all borrow books data from DB
    app.get("/borrow/:email", async (req, res) => {
      const result = await borrowCollection.find().toArray();
      res.send(result);
    });

    // Get all books data by id from DB
    app.get("/books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const book = await booksCollection.findOne(query);
      res.send(book);
    });

    // Get all category data from DB
    app.get("/category", async (req, res) => {
      const result = await categoryCollection.find().toArray();
      res.send(result);
    });

    // Update a book data in db
    app.put("/update/:id", async (req, res) => {
      const id = req.params.id;
      const bookData = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...bookData,
        },
      };
      const result = await booksCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    // Get data by category from DB
    // app.get("/books/:cat", async (req, res) => {
    //   const query = req.params.category;
    //   console.log(query);
    //   const result = await booksCollection.find().toArray();
    //   res.send(result);
    // });

    // Save a book data in db
    app.post("/book", async (req, res) => {
      const bookData = req.body;
      const result = await booksCollection.insertOne(bookData);
      res.send(result);
    });

    // Save a book data in borrow db
    app.post("/borrow", async (req, res) => {
      const bookData = req.body;
      const result = await borrowCollection.insertOne(bookData);
      res.send(result);
    });

    // Get all books data from DB for pagination
    app.get("/all-books", async (req, res) => {
      const size = parseInt(req.query.size);
      const page = parseInt(req.query.page) - 1;
      const filter = req.query.filter;
      const sort = req.query.sort;
      let query = {};
      if (filter) query = { category: filter };
      let options = {};
      if (sort) options = { sort: { rating: sort === "ascending" ? 1 : -1 } };
      const result = await booksCollection
        .find(query, options)
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    });

    // Get all books data count from DB
    app.get("/books-count", async (req, res) => {
      const filter = req.query.filter;
      let query = {};
      if (filter) query = { category: filter };
      const count = await booksCollection.countDocuments(query);
      res.send({ count });
    });

    // Delete a book data from DB
    app.delete("/borrow/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await borrowCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from Library Room server.....");
});

app.listen(port, () => console.log(`Server running on port ${port}`));
