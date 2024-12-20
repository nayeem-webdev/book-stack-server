require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");

// middle ware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// mongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hl8mn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    //* Connect the client to the server
    await client.connect();
    const database = client.db("booksDB");
    const bookCollection = database.collection("books");

    // Auth APIs
    app.post("/jwt", (req, res) => {
      const data = req.body; // Payload/data
      const token = jwt.sign(data, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5h",
      });
    });

    //* GETting All Book
    app.get("/my-books", async (req, res) => {
      const cursor = bookCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //* GETting A Book
    app.get("/my-books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const book = await bookCollection.findOne(query);
      res.send(book);
    });

    //* POSTing New Book
    app.post("/my-books", async (req, res) => {
      const book = req.body;
      const result = await bookCollection.insertOne(book);
      res.send(result);
    });

    //* PUTing A Book
    app.put("/my-books/:id", async (req, res) => {
      console.log(req, res);
      const id = req.params.id;
      const book = req.body;
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const updatedBook = {
        $set: {
          photoUrl: book.photoUrl,
          category: book.category,
          price: book.price,
          pageRead: book.pageRead,
          review: book.review,
        },
      };
      const result = await bookCollection.updateOne(
        filter,
        updatedBook,
        option
      );
      res.send(result);
    });

    //* DELETing A Book
    app.delete("/my-books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("bookStack server is running");
});

app.listen(port, () => {
  console.log("bookStack server is running on port", port);
});
