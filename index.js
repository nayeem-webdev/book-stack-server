require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

//!! Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));

//@@ Custom Middleware
const VerifyToken = (req, res, next) => {
  const token = req?.cookies?.token;

  //!! Check if token exists
  if (!token) {
    return res
      .status(401)
      .send({ message: "Access Not Authorized. Token missing." });
  }

  //$$ Verify the token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ message: "Invalid or expired token. Access Prohibited." });
    }

    //$$ If successful, attach decoded info to `req`
    req.decoded = decoded;
    next();
  });
};
//@@ Custom Middleware Ends

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
    //@@ Connect the client to the server
    await client.connect();
    const database = client.db("booksDB");
    const bookCollection = database.collection("books");

    //%% Auth APIs
    app.post("/jwt", (req, res) => {
      const data = req.body; // Payload/data
      const token = jwt.sign(data, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });

    //$$ GETting All Book
    app.get("/all-books", async (req, res) => {
      const cursor = bookCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //$$ GETting My Book UID
    app.get("/all-books/:uid", VerifyToken, async (req, res) => {
      const uid = req.params.uid;
      if (req.decoded.uid !== uid) {
        return res
          .status(403)
          .send({ message: "You are not authorized to access these books" });
      }
      const query = { uid: uid };
      const cursor = bookCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    //$$ GETting A Book
    app.get("/my-books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const book = await bookCollection.findOne(query);
      res.send(book);
    });

    //$$ POSTing New Book
    app.post("/my-books", async (req, res) => {
      const book = req.body;
      const result = await bookCollection.insertOne(book);
      res.send(result);
    });

    //$$ PUTing A Book
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

    //%% DELETing A Book
    app.delete("/my-books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
    //!! await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("bookStack server is running");
});

app.listen(port, () => {
  console.log("bookStack server is running on port", port);
});
