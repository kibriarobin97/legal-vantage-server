const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());



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

    app.get('/services', async(req, res) => {
        const cursor = serviceCollection.find().limit(6)
        const result = await cursor.toArray()
        res.send(result)
    })

    app.get('/all-services', async(req, res) => {
        const cursor = serviceCollection.find()
        const result = await cursor.toArray()
        res.send(result)
    })

    app.get('/services/:id', async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await serviceCollection.findOne(query)
        res.send(result)
      })

    app.get('/my-service/:email', async(req, res) => {
        const email = req.params.email;
        const query = {providerEmail: email}
        console.log(query)
        const result = await serviceCollection.find(query).toArray();
        res.send(result)
    })

    app.post('/services', async(req, res) => {
        const newService = req.body;
        console.log(newService)
        const result = await serviceCollection.insertOne(newService)
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