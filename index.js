const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://news-blog-efa6a.web.app',
    'https://news-blog-efa6a.firebaseapp.com',
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zi8pxok.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  }
});

// middlewares
const logger = (req, res, next) => {
  console.log('log: info',req.method, req.url);
  next();
}

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  // console.log('token in the middlewares:', token);
  if(!token){
    return res.status(401).send({ message: 'unauthorized access'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if(err){
      return res.status(401).send({ message: 'unauthorized access'})
    }
    req.user = decoded;
    next()
  })

}

const cookeOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  secure: process.env.NODE_ENV === 'production' ? true : false,
  
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const newsBlogCollection = client.db("sportsNews").collection("newsBlog");
    const wishlistCollection = client.db("sportsNews").collection("wishlist");
    // search
    await newsBlogCollection.createIndex({ title: 'text', short_description: 'text' })
    // comment
    const commentCollection = client.db("sportsNews").collection("comments");



    // auth related api
    app.post('/jwt', logger, async(req,res)=>{
      const user = req.body;
      console.log('user for token:',user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

      res.cookie('token', token, cookeOptions )
      .send({success: true})
    })

    // log out
    app.post('/logout', async(req, res) => {
      const user = req.body;
      console.log('user for logout:',user);
      res.clearCookie('token', {...cookeOptions, maxAge: 0}).send({success: true})
    })




    // comment add
    app.post('/comment', async (req, res) => {
        const newComment = req.body;
        console.log(newComment);
        const result = await commentCollection.insertOne(newComment);
        res.send(result)
    })

    // show comment data on id
    app.get('/comments', async (req, res) => {
        const id = req.query.id;
        const query = { id:  id };
        const result = await commentCollection.find(query).toArray();
        res.send(result)
    })

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


    // search
    app.get('/all', async (req, res) => {
      try{
        const query = req.query.search;
        const cursor = newsBlogCollection.find({$text: {$search: query}});
        const result = await cursor.toArray();
        res.send(result)
        
      }
      catch(err){
        console.log(err)
        res.status(500).json({message: 'Server error'})
      }
      
    })

    // one data show
    app.get('/allBlogs/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        // console.log(query);
        const result = await newsBlogCollection.findOne(query);
        res.send(result)
    })

    // update data
    app.put('/allBlogs/:id', async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updatedBlog = req.body;
        const blog = {
            $set: {
                title: updatedBlog.title,
                category: updatedBlog.category,
                short_description: updatedBlog.short_description,
                long_description: updatedBlog.long_description,
                image_url: updatedBlog.image_url,
            },
        }
        const result = await newsBlogCollection.updateOne(filter, blog, options);
        res.send(result)
        // console.log(result);
    })

    // add data in wishlist
    app.post('/addWishlist', async (req, res) => {
        const newWishlist = req.body;
        console.log(newWishlist);
        const result = await wishlistCollection.insertOne(newWishlist);
        res.send(result)
    })

    // show wishlist data and email query
    app.get('/wishlist', logger,verifyToken, async (req, res) => {
        // console.log(req.query.email);
        console.log('token owner infooooo',req.user);

        if(req.user.email !== req.query.email){
          return res.status(403).send({ message: 'forbidden access' })
        }

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
    // await client.db("admin").command({ ping: 1 });
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