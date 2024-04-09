var express = require("express");
var router = express.Router();
var sha256 = require("crypto-js/sha256");
const { MongoClient, ServerApiVersion } = require("mongodb");
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
router.post("/compUser", async function (req, res, next) {
  const { email, password } = req.body;
  try {
    await client.connect();
    try {
      let compU = await client.db("diverweb").collection("users").findOne({
        email: email,
      });
      if (compU) {
        try {
          let comPass = await client
            .db("diverweb")
            .collection("users")
            .findOne({
              email: email,
              password: sha256(process.env.SK + password),
            });
          if (!comPass) {
            res.send("IEP");
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
              email: email,
              password: sha256(process.env.SK + password).toString(),
            });
          res.send(JSON.stringify(createU));
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
