let express = require("express");
let app = express();
app.use(express.json());
let sql3 = require("sqlite3");
let { open } = require("sqlite");
let jwt = require("jsonwebtoken");
let bcrypt = require("bcrypt");
let path = require("path");
let dbp = path.join(__dirname, "twitterClone.db");
console.log(dbp);
let db = null;
let authenticte = () => {};
let servinst = async () => {
  try {
    db = await open({ filename: dbp, driver: sql3.Database });
    app.listen(8000, () => {
      console.log("server starterd");
    });
  } catch (e) {
    console.log(e);
  }
};
let log_inuserId = null;
servinst();
app.post("/register/", async (req, resp) => {
  let { username, password, name, gender } = req.body;
  //console.log(password);
  let k = `select * from user where username='${username}';`;
  let usc = await db.get(k);
  console.log(usc);
  if (usc === undefined) {
    console.log(usc);
    let l = password.length;
    if (l < 6) {
      resp.status(400);
      resp.send("Password is too short");
    } else {
      let prevId = ` select user_id from user order by user_id desc limit 1;`;
      let user = await db.get(prevId);
      let k = user.user_id + 1;
      let pass = await bcrypt.hash(password, 10);
      let q = `insert into user values(${k},'${name}','${username}','${pass}','${gender}');`;
      let res = await db.run(q);
      resp.status(200);
      resp.send("User created successfully");
    }
  } else {
    resp.status(400);
    resp.send("User already exists");
  }
});
app.post("/login/", async (req, resp) => {
  let { username, password, name, gender } = req.body;
  //console.log(password);
  let k = `select * from user where username='${username}';`;
  console.log(username);
  let usc = await db.get(k);
  if (usc === undefined) {
    console.log(usc);
    resp.status(400);
    resp.send("Invalid user");
  } else {
    let l = await bcrypt.compare(password, usc.password);
    if (l) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      resp.send({ jwtToken });
      log_inuserId = usc.username;
    } else {
      console.log(usc);
      resp.status(400);
      resp.send("Invalid password");
    }
  }
});
let tempuser = null;
let authcheck = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        next();
      }
    });
  }
};
app.get("/user/tweets/feed/", authcheck, async (request, response) => {
  const { username, user_id } = request.body;
  console.log(username);
  let query = ` SELECT 
    user.username AS username,
    tweet.tweet AS tweet,
    tweet.date_time AS dateTime
  FROM user 
    JOIN tweet ON user.user_id = tweet.user_id
    JOIN follower ON tweet.user_id = follower.following_user_id
    WHERE follower.follower_user_id = '${user_id}'
  ORDER BY 
    date_time DESC limit 4 ;`;
  let res = await db.all(query);
  response.send(res);
  //console.log("entered");
});

module.exports = app;
