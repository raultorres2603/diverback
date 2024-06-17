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

function verifyToken(reqToken, uToken) {
  try {
    const reqTok = jwt.verify(reqToken, "c<|ua6zX/0tU(Qv70Pu");
    console.log(reqTok);
    try {
      const uTok = jwt.verify(uToken, "c<|ua6zX/0tU(Qv70Pu");
      console.log(uTok);
      if (reqTok.u == uTok.u) {
        return { actualTok: uToken };
      } else {
        return "NEQ";
      }
    } catch (error) {
      console.log(error);
      if (error.name == "TokenExpiredError") {
        let actuTok = jwt.sign({ u: uToken.u }, "c<|ua6zX/0tU(Qv70Pu", {
          expiresIn: "1h",
        });
        console.log("Token servidor actualizado");
        return { actuTok: actuTok };
      } else {
        console.log(error);
        return "!PVER";
      }
    }
  } catch (error) {
    console.log(error);
    if (error.name == "TokenExpiredError") {
      let actuTok = jwt.sign({ u: reqToken.u }, "c<|ua6zX/0tU(Qv70Pu", {
        expiresIn: "1h",
      });
      console.log("Token cliente actualizado");
      return { actuTok: actuTok };
    } else {
      console.log(error);
      return "!PVER";
    }
  }
}

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

/* POST users listing. */

router.post("/searchUser", async (req, res, next) => {
  try {
    await client.connect();
    try {
      const user = await client
        .db("diverweb")
        .collection("users")
        .findOne(
          { token: req.body.token },
          { projection: { password: 0, _id: 0 } }
        );
      const verifyT = verifyToken(req.body.token, user.token);
      if (verifyT != "NEQ" && verifyT != "!PVER" && !verifyT.actuTok) {
        const users = await client
          .db("diverweb")
          .collection("users")
          .find(
            { email: { $regex: req.body.search.toString(), $options: "i" } },
            { projection: { password: 0, _id: 0, token: 0 } }
          )
          .toArray();
        if (users.length == 0) {
          res.send(JSON.stringify({ res: "NOUSERS" }));
        } else {
          res.send(JSON.stringify({ res: users }));
        }
      } else if (verifyT.actuTok) {
        // update token of user
        try {
          await client
            .db("diverweb")
            .collection("users")
            .updateOne(
              { token: user.token },
              { $set: { token: verifyT.actuTok } }
            );
          const users = await client
            .db("diverweb")
            .collection("users")
            .find(
              { email: { $regex: req.body.search.toString(), $options: "i" } },
              { projection: { password: 0, _id: 0, token: 0 } }
            )
            .toArray();
          if (users.length == 0) {
            res.send(JSON.stringify({ res: "NOUSERS" }));
          } else {
            res.send(JSON.stringify({ res: users }));
          }
        } catch (error) {
          throw error;
        }
      } else {
        res.send(JSON.stringify({ res: "TOKERR" }));
      }
    } catch (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  }
});

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
              localField: "friends.id",
              foreignField: "_id",
              as: "friends",
            },
          },
          {
            $project: {
              password: 0,
              _id: 0,
            },
          },
        ])
        .toArray();
      if (user.length == 0) {
        res.send(JSON.stringify({ res: "TOKERR" }));
      } else {
        // verify token if it's expired or not
        const verifyT = verifyToken(req.body.userId, user[0].token);
        if (
          (verifyT == "NEQ" || verifyT == "!PVER") &&
          !verifyT.actuTok &&
          !verifyT.actualTok
        ) {
          res.send(JSON.stringify({ res: "TOKERR" }));
        } else if (verifyT.actuTok) {
          // update token of user
          try {
            await client
              .db("diverweb")
              .collection("users")
              .updateOne(
                { token: user[0].token },
                { $set: { token: verifyT.actuTok } }
              );
          } catch (error) {
            throw error;
          }
        } else if (verifyT.actualTok) {
          try {
            const verification = jwt.verify(
              req.body.userId,
              "c<|ua6zX/0tU(Qv70Pu"
            );
            console.log(verification);
            console.log(user);
            res.send(JSON.stringify(user[0]));
          } catch (error) {
            if (error == "TokenExpiredError") {
              res.send(JSON.stringify({ res: "TOKERR" }));
            }
          }
        }
      }
    } catch (error) {
      console.log(error);
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
          { token: req.body.token },
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

// post route to add the friend to the user's array of friends, we will add the ID's friend
router.post("/addFriend", async function (req, res, next) {
  try {
    await client.connect();
    try {
      // find _id of the friend
      const friend = await client
        .db("diverweb")
        .collection("users")
        .findOne({ email: req.body.friend.email });
      // add friend to user's friends
      try {
        await client
          .db("diverweb")
          .collection("users")
          .updateOne(
            { token: req.body.token },
            { $push: { friends: { id: friend._id, alias: friend.name } } }
          ); // { $set: req.body });
        res.send({ res: "OK" });
      } catch (error) {
        throw error;
      }
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
          token: req.body.token,
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
              { token: req.body.token },
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
            token: req.body.token,
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
              const verification = verifyToken(req.body.token, comPass.token);
              console.log(verification);
              if (verification != "NEQ" && verification != "!PVER") {
                try {
                  res.send(JSON.stringify({ res: comPass.token.toString() }));
                } catch (error) {
                  try {
                    await client
                      .db("diverweb")
                      .collection("users")
                      .updateOne(
                        { _id: new ObjectId(comPass._id) },
                        { $set: { token: verification } }
                      );
                    res.send(JSON.stringify({ res: verification.toString() }));
                  } catch (error) {
                    res.send(JSON.stringify({ res: "!PVER" }));
                  }
                }
              } else {
                if (verification == "NEQ") {
                  res.send(JSON.stringify({ res: "NEQ" }));
                } else {
                  try {
                    await client
                      .db("diverweb")
                      .collection("users")
                      .updateOne(
                        { _id: new ObjectId(comPass._id) },
                        { $set: { token: verification } }
                      );
                    res.send(JSON.stringify({ res: actuTok.toString() }));
                  } catch (error) {
                    res.send(JSON.stringify({ res: "!PVER" }));
                  }
                }
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
