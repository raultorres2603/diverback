var express = require("express");
var router = express.Router();
var CryptoJS = require("crypto-js");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri =
  "mongodb+srv://raultorraco:ih14t5BL6VYBWXeg@diverweb.hvgpvsg.mongodb.net/?retryWrites=true&w=majority&appName=diverweb";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

/* POST users listing. */

router.post("/getInfo", async function (req, res, next) {
  try {
    await client.connect();
    const user = await client
      .db("diverweb")
      .collection("users")
      .findOne({ _id: new ObjectId(req.body.userId) });
    res.send(JSON.stringify(user));
  } catch (error) {
    throw error;
  } finally {
    await client.close();
  }
});

router.post("/update", async function (req, res, next) {
  try {
    await client.connect();
    try {
      const user = await client
        .db("diverweb")
        .collection("users")
        .updateOne(
          { _id: new ObjectId(req.body.id) },
          {
            $set: {
              name: req.body.name,
              fname: req.body.fname,
              genre: req.body.genre,
              profile: req.body.profile,
              birthday: new Date(req.body.birthday),
            },
          }
        ); // { $set: req.body });
      res.send("OK");
    } catch (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  } finally {
    await client.close();
  }
});

router.post("/compUser", async function (req, res, next) {
  try {
    await client.connect();
    try {
      let compU = await client.db("diverweb").collection("users").findOne({
        email: req.body.email,
      });
      if (compU) {
        try {
          let comPass = await client
            .db("diverweb")
            .collection("users")
            .findOne({
              email: req.body.email,
              password: CryptoJS.MD5(process.env.SK + req.body.pass).toString(),
            });
          console.log("ComPass:", comPass);
          if (!comPass) {
            res.send(JSON.stringify({ res: "IEP" }));
          } else {
            res.send(JSON.stringify({ res: comPass._id.toString() }));
          }
        } catch (error) {
          throw error;
        }
      } else {
        try {
          const createU = await client
            .db("diverweb")
            .collection("users")
            .insertOne({
              email: req.body.email,
              password: CryptoJS.MD5(process.env.SK + req.body.pass).toString(),
            });
          res.send(JSON.stringify({ res: createU.insertedId.toString() }));
        } catch (error) {
          throw error;
        }
      }
    } catch (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  } finally {
    await client.close();
  }
});

module.exports = router;
