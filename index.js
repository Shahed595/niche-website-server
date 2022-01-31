const express = require('express')
const { MongoClient } = require('mongodb');
const ObjectId=require('mongodb').ObjectId;
const cors=require('cors');
const admin = require("firebase-admin");

require('dotenv').config()

const app = express()
const port = process.env.PORT || 5000





//firbase jwt token setup
const serviceAccount = require('./final-assignment-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



//middleWare
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${ process.env.DB_USER}:${ process.env.DB_PASS}@cluster0.dyo1y.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function verifyToken(req,res,next){
  if(req.headers?.authorization?.startsWith('Bearer ')){
    const token=req.headers.authorization.split(' ')[1];

    try{
      const decodeUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail= decodeUser.email;
    }
    catch{

    }
  }  
  next();
}

async function run(){
    try{
        await client.connect();
        const database=client.db('final-assignment');
        const productsCollection=database.collection('products');
        const ordersCollection=database.collection('orders');
        const reviewsCollection=database.collection('reviews');
        const usersCollection=database.collection('users');

        //POST products API
    app.post('/products',async(req,res)=>{
      const product=req.body;  
      // console.log("hit the post api",product);
        const result=await productsCollection.insertOne(product);
        // console.log(result);
        res.json(result);
      });
       
      //GET products API
      app.get('/products',async(req,res)=>{
        const cursor=productsCollection.find({});
        const products=await cursor.toArray();
        res.send(products);
      });

      //GET SINGLE product API
      app.get('/products/:id',async(req,res)=>{
        const id=req.params.id;
        // console.log('Getting Specefric Product',id);
        const query={_id:ObjectId(id)};
        const product=await productsCollection.findOne(query);
        res.json(product);
      });

      //DELETE products API
    app.delete('/products/:id',async(req,res)=>{
      const id=req.params.id;
      //SELECT ID TO DELETING
      const query={_id:ObjectId(id)};
      const result = await productsCollection.deleteOne(query);
      // console.log('Deleting users with id',result);
      res.json(result);
    });

    //UPDATE products API
    app.put('/products/:id',async(req,res)=>{
      const id=req.params.id;
      const updateProduct=req.body;
      const filter = { _id:ObjectId(id)};
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name:updateProduct.name,
          description:updateProduct.description,
          price:updateProduct.price,
          img:updateProduct.img,
        },
      };
      const result = await productsCollection.updateOne(filter, updateDoc, options);
      res.json(result);
  });


       //POST orders API
    app.post('/orders',async(req,res)=>{
      const product=req.body;  
      // console.log("hit the post api",product);
        const result=await ordersCollection.insertOne(product);
        // console.log(result);
        res.json(result);
      });

      //GET orders API
      app.get('/orders',async(req,res)=>{
        const cursor=ordersCollection.find({});
        const orders=await cursor.toArray();
        res.send(orders);
      });

      //DELETE orders API
    app.delete('/orders/:id',async(req,res)=>{
      const id=req.params.id;
      //SELECT ID TO DELETING
      const query={_id:ObjectId(id)};
      const result = await ordersCollection.deleteOne(query);
      // console.log('Deleting users with id',result);
      res.json(result);
    });

      //POST reviews API
      app.post('/reviews',async(req,res)=>{
        const review=req.body;
        const result=await reviewsCollection.insertOne(review);
        res.json(result);
      });

      //GET review API
      app.get('/reviews',async(req,res)=>{
        const cursor=reviewsCollection.find({});
        const reviews=await cursor.toArray({});
        res.send(reviews);
      });

      //POST users API
      app.post('/users',async(req,res)=>{
        const user=req.body;
        const result=await usersCollection.insertOne(user);
        console.log(result);
        res.json(result);
      });

      //Put or upsert users aoi for google sign in
      app.put('/users',async(req,res)=>{
        const user=req.body;
        const filter={email: user.email};
        const options = { upsert: true };
        const updateDoc={$set:user};
        const result=await usersCollection.updateOne(filter,updateDoc,options);
        // console.log(result);
        res.json(result);
      });

      //put to set admin role
      app.put('/users/admin',verifyToken,async(req,res)=>{
        const user=req.body;
        // console.log('put', req.decodedEmail);
        const requester=req.decodedEmail;
        if(requester){
          const requesterAccount= await usersCollection.findOne({email: requester});
          if(requesterAccount.role === 'admin'){
            const filter={email: user.email};
            const updateDoc={$set: {role:'admin'}};
            const result=await usersCollection.updateOne(filter,updateDoc);
            res.json(result);
          }
        }
        else{
          res.status(403).json({message:'You Do Not Have Permission To Make An Admin'});
        }
      });

      //GET admin to verify an admin
      app.get('/users/:email',async(req,res)=>{
         const email=req.params.email;
         const query={email: email};
         const user= await usersCollection.findOne(query);
         let isAdmin=false;
         if(user?.role === 'admin'){
           isAdmin=true;
         }
         res.json({admin:isAdmin}); 
      });

    }
    finally{
        // await client.close();
    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello from final assignment!')
})

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})

