const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zi8pxok.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const newsBlogCollection = client.db("sportsNews").collection("newsBlog");
    const wishlistCollection = client.db("sportsNews").collection("wishlist");

    // data add
    app.post('/addBlogs', async (req, res) => {
        const newBlog = req.body;
        console.log(newBlog);
        const result = await newsBlogCollection.insertOne(newBlog);
        res.send(result)
    })

    // data show
    app.get('/allBlogs', async (req, res) => {
        const cursor = newsBlogCollection.find();
        const result = await cursor.toArray();
        res.send(result)
    })

    // one data show
    app.get('/allBlogs/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await newsBlogCollection.findOne(query);
        res.send(result)
    })

    // add data in wishlist
    app.post('/addWishlist', async (req, res) => {
        const newWishlist = req.body;
        const result = await wishlistCollection.insertOne(newWishlist);
        res.send(result)
    })

    // show wishlist data and email query
    app.get('/wishlist', async (req, res) => {
        console.log(req.query.email);
        let query = {};
        if (req.query.email) {
            query = { email: req.query.email }
        }
        const result = await wishlistCollection.find(query).toArray();
        res.send(result)
    })
    // delete wishlist data
    app.delete('/wishlist/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await wishlistCollection.deleteOne(query);
        res.send(result)
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Sports news server is running......')
})

app.listen(port, () => {
    console.log(`Sports news server running on port: ${port}`)
})