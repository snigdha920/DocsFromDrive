const { all } = require("async");
const express = require("express");
const { google } = require("googleapis");
const OAuth2Data = require("./credentials.json");

const app = express();

app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URI = OAuth2Data.web.redirect_uris[0];
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
const scopes = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.readonly",
];
const allDocs = [];
var isAuthenticated = false;
function listFiles(auth, response) {
  const drive = google.drive({ version: "v3", auth });
  drive.files.list(
    {
      fields: "nextPageToken, files(id, name, webViewLink)",
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const files = res.data.files;
      if (files.length) {
        console.log("Files:");
        files.map((file) => {
          //   console.log(`${file.name} (${file.id})`);
          console.log(file);
          allDocs.push(file);
        });
        response.render("docs", { allDocs: allDocs });
      } else {
        console.log("No files found.");
      }
    }
  );
}
app.get("/", (req, res) => {
  if (isAuthenticated) {
    listFiles(oauth2Client, res);
  } else {
    const authenticationURL = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
    });
    // const authenticationURL = "https://www.googleapis.com/drive/v3/files";
    console.log(
      "Authenticate yourself by visiting this URL : " + authenticationURL
    );
    res.render("home", { authenticationURL: authenticationURL });
  }
});

app.get("/google/callback", (req, res) => {
  const authorizationCode = req.query.code;
  if (authorizationCode) {
    oauth2Client.getToken(authorizationCode, (err, token) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Authenticated.");
        oauth2Client.setCredentials(token);
        isAuthenticated = true;
        res.redirect("/");
      }
    });
  }
});

app.get("/logout", (req, res) => {
  isAuthenticated = false;
  res.redirect("/");
});

app.listen(3000, () => {
  console.log("Server is up and running on port 3000.");
});
