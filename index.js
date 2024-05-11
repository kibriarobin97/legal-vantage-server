const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;


// middleware
const corsOptions = {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174'
    ],
    credentials: true,
    optionSuccessStatus: 200,
  }
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());


const verifyToken = (req, res, next) => {
    const token = req.cookies?.token
    if (!token) return res.status(401).send({ message: 'unauthorized access' })
    if (token) {
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          console.log(err)
          return res.status(401).send({ message: 'unauthorized access' })
        }
        console.log(decoded)
  
        req.user = decoded
        next()
      })
    }
  }
  



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mahb0di.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const serviceCollection = client.db('legalVantage').collection('services')
    const bookingCollection = client.db('legalVantage').collection('booking')

    app.post('/jwt', async (req, res) => {
        const email = req.body
        const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: '1d',
        })
        res
          .cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          })
          .send({ success: true })
      })

      app.get('/logout', (req, res) => {
        res
          .clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 0,
          })
          .send({ success: true })
      })

    app.get('/services', async(req, res) => {
        const cursor = serviceCollection.find().limit(6)
        const result = await cursor.toArray()
        res.send(result)
    })

    app.get('/all-services', async(req, res) => {
        const search = req.query.search
        let query = {
            name: { $regex: search, $options: 'i' },
          }
        const cursor = serviceCollection.find(query)
        const result = await cursor.toArray()
        res.send(result)
    })

    app.get('/services/:id', async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await serviceCollection.findOne(query)
        res.send(result)
    })

    app.get('/my-service/:email', verifyToken, async(req, res) => {
        const tokenEmail = req.user.email;
        const email = req.params.email;
        if (tokenEmail !== email) {
            return res.status(403).send({ message: 'forbidden access' })
          }
        const query = {providerEmail: email}
        console.log(query)
        const result = await serviceCollection.find(query).toArray();
        res.send(result)
    })

    app.post('/services', async(req, res) => {
        const newService = req.body;
        // console.log(newService)
        const result = await serviceCollection.insertOne(newService)
        res.send(result)
    })
    
    app.delete('/services/:id', async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await serviceCollection.deleteOne(query)
        res.send(result)
    })

    app.put('/services/:id', verifyToken, async(req, res) => {
        const id = req.params.id;
        const serviceData = req.body;
        const query = {_id: new ObjectId(id)}
        const options = {upsert: true}
        const updateDoc = {
          $set: {
            ...serviceData
          }
        }
        const result = await serviceCollection.updateOne(query, updateDoc, options)
        res.send(result)
    })


    // booking service

    app.get('/my-booked/:email', verifyToken, async(req, res) => {
        const tokenEmail = req.user.email;
        const email = req.params.email;
        if (tokenEmail !== email) {
            return res.status(403).send({ message: 'forbidden access' })
          }
        const query = {userEmail: email}
        const result = await bookingCollection.find(query).toArray();
        res.send(result)
    } )
    
    app.post('/booking', async(req, res) => {
        const newBooking = req.body;
        const result = await bookingCollection.insertOne(newBooking)
        res.send(result)
    })

    app.get('/booked/:email', verifyToken, async(req, res) => {
        const tokenEmail = req.user.email;
        const email = req.params.email;
        if (tokenEmail !== email) {
            return res.status(403).send({ message: 'forbidden access' })
          }
        const query = {providerEmail: email}
        console.log(query)
        const result = await bookingCollection.find(query).toArray()
        res.send(result)
    })

    app.patch('/booked-service/:id', async (req, res) => {
        const id = req.params.id
        const status = req.body
        const query = { _id: new ObjectId(id) }
        const updateDoc = {
          $set: status,
        }
        const result = await bookingCollection.updateOne(query, updateDoc)
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
    res.send('legal vantage server is running')
})

app.listen(port, () => {
    console.log(`legal vantage server is running on port: ${port}`)
})