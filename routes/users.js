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
var jwt = require("jsonwebtoken");

function decodeToken(token) {
  try {
    return jwt.verify(token, "c<|ua6zX/0tU(Qv70Pu", {
      algorithm: "RS256",
    });
  } catch (error) {
    return false;
  }
}

function verifyToken(reqToken, uToken) {
  try {
    const reqTok = jwt.verify(reqToken, "c<|ua6zX/0tU(Qv70Pu", {
      algorithm: "RS256",
    });
    try {
      const uTok = jwt.verify(uToken, "c<|ua6zX/0tU(Qv70Pu", {
        algorithm: "RS256",
      });
      if (reqTok.u == uTok.u) {
        return true;
      } else {
        return "NEQ";
      }
    } catch (error) {
      return "!PVER";
    }
  } catch (error) {
    return "!PVER";
  }
}

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

/* POST users listing. */

router.post("/getInfo", async (req, res, next) => {
  try {
    await client.connect();
    try {
      const user = await client
        .db("diverweb")
        .collection("users")
        .aggregate([
          {
            $match: {
              token: req.body.userId,
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "friends.id",
              as: "friends",
            },
          },
          {
            $project: {
              password: 0,
              token: 0,
            },
          },
        ])
        .toArray();
      console.log(user);
      res.send(JSON.stringify(user[0]));
    } catch (error) {
      res.send(JSON.stringify({ res: "!PVER" }));
    }
  } catch (error) {
    throw error;
  }
});

router.post("/update", async function (req, res, next) {
  try {
    await client.connect();
    try {
      await client
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
              avatar: req.body.avatar,
            },
          }
        ); // { $set: req.body });
      res.send({ res: "OK" });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  }
});

router.post("/addDiverDay", async function (req, res, next) {
  try {
    await client.connect();
    try {
      let comprobExists = await client
        .db("diverweb")
        .collection("users")
        .findOne({
          _id: new ObjectId(req.body.id),
          diverdays: { $in: [req.body.diverday] },
        });
      if (comprobExists) {
        res.send(JSON.stringify({ res: "EXISTS" }));
      } else {
        try {
          await client
            .db("diverweb")
            .collection("users")
            .updateOne(
              { _id: new ObjectId(req.body.id) },
              { $push: { diverdays: req.body.diverday } }
            ); // { $set: req.body });
          res.send({ res: "OK" });
        } catch (error) {
          throw error;
        }
      }
    } catch (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  }
});

router.post("/celebDiverday", async function (req, res, next) {
  try {
    await client.connect();
    try {
      await client
        .db("diverweb")
        .collection("users")
        .updateOne(
          {
            _id: new ObjectId(req.body.id),
            "diverdays.diverDay": req.body.diverday.diverDay,
          },
          {
            $set: {
              ["diverdays.$.diverPhotos"]: req.body.diverPhotos,
            },
          }
        ); // { $set: req.body });
      res.send({ res: "OK" });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    throw error;
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
            if (comPass.token && req.body.token) {
              let verification = verifyToken(req.body.token, comPass.token);
              console.log(verification);
              if (verification == true) {
                try {
                  jwt.verify(comPass.token, "c<|ua6zX/0tU(Qv70Pu");
                  res.send(JSON.stringify({ res: comPass.token.toString() }));
                } catch (error) {
                  if (error.name == "TokenExpiredError") {
                    const actuToken = jwt.sign(
                      { u: comPass._id.toString() },
                      "c<|ua6zX/0tU(Qv70Pu",
                      {
                        expiresIn: "1h",
                      }
                    );
                    try {
                      await client
                        .db("diverweb")
                        .collection("users")
                        .updateOne(
                          { _id: new ObjectId(comPass._id) },
                          { $set: { token: actuToken } }
                        );
                      res.send(JSON.stringify({ res: actuToken.toString() }));
                    } catch (error) {
                      res.send(JSON.stringify({ res: "!PVER" }));
                    }
                  }
                }
              } else {
                if (verification == "NEQ") {
                  res.send(JSON.stringify({ res: "NEQ" }));
                } else {
                  res.send(JSON.stringify({ res: "!PVER" }));
                }
              }
            } else if (!comPass.token && req.body.token) {
              const actuToken = jwt.sign(
                { u: comPass._id.toString() },
                "c<|ua6zX/0tU(Qv70Pu",
                {
                  expiresIn: "1h",
                }
              );
              try {
                await client
                  .db("diverweb")
                  .collection("users")
                  .updateOne(
                    { _id: new ObjectId(comPass._id) },
                    { $set: { token: actuToken } }
                  );
                res.send(JSON.stringify({ res: actuToken.toString() }));
              } catch (error) {
                res.send(JSON.stringify({ res: "!PVER" }));
              }
            } else if (!comPass.token && !req.body.token) {
              const actuToken = jwt.sign(
                { u: comPass._id.toString() },
                "c<|ua6zX/0tU(Qv70Pu",
                {
                  expiresIn: "1h",
                }
              );
              try {
                await client
                  .db("diverweb")
                  .collection("users")
                  .updateOne(
                    { _id: new ObjectId(comPass._id) },
                    { $set: { token: actuToken } }
                  );
                res.send(JSON.stringify({ res: actuToken.toString() }));
              } catch (error) {
                res.send(JSON.stringify({ res: "!PVER" }));
              }
            } else if (comPass.token && !req.body.token) {
              try {
                jwt.verify(comPass.token, "c<|ua6zX/0tU(Qv70Pu");
                res.send(JSON.stringify({ res: comPass.token.toString() }));
              } catch (error) {
                if (error.name == "TokenExpiredError") {
                  const actuToken = jwt.sign(
                    { u: comPass._id.toString() },
                    "c<|ua6zX/0tU(Qv70Pu",
                    {
                      expiresIn: "1h",
                    }
                  );
                  try {
                    await client
                      .db("diverweb")
                      .collection("users")
                      .updateOne(
                        { _id: new ObjectId(comPass._id) },
                        { $set: { token: actuToken } }
                      );
                    res.send(JSON.stringify({ res: actuToken.toString() }));
                  } catch (error) {
                    res.send(JSON.stringify({ res: "!PVER" }));
                  }
                }
              }
            }
          }
        } catch (error) {
          throw error;
        }
      } else {
        try {
          const tokenAut = jwt.sign(
            { u: req.body.email },
            "c<|ua6zX/0tU(Qv70Pu",
            {
              expiresIn: "1h",
            }
          );
          const createU = await client
            .db("diverweb")
            .collection("users")
            .insertOne({
              email: req.body.email,
              password: CryptoJS.MD5(process.env.SK + req.body.pass).toString(),
              token: tokenAut,
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
  }
});

module.exports = router;
