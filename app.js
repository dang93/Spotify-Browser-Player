const SpotifyWebApi = require(`spotify-web-api-node`)
const express = require(`express`)
const bodyParser = require(`body-parser`)
const app = express()
const request = require(`request`)
const querystring = require(`querystring`);
const cookieParser = require(`cookie-parser`);
const timeout = require(`connect-timeout`)


app.set(`view engine`, `ejs`)
app.use(express.static(`public`))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())

// Spotify account settings
var stateKey = `spotify_auth_state`;
var client_id = `dc22a60a7718498d9c2e430632fbe602`; 
var client_secret = `d230f4d5b0ad495da53bbf74e3bb5304`;
var redirect_uri = `http://localhost:3000/callback`;
var dev_id = `a`;

// Spotify handle
var spotifyApi = new SpotifyWebApi({
    clientId: client_id,
    clientSecret: client_secret,
    redirectUri: redirect_uri
})

// Helper function
var generateRandomString = function(length) {
    var text = ``;
    var possible = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`;
  
    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

//Homepage
app.get(`/`, function (req, res) {
    res.render(`index`, {data:null})
})

// Player page
app.get(`/player`, function(req, res) {
    console.log(`client_id: `, spotifyApi._credentials.clientId)
    res.render(`player`, {spot: null, dev: null})
})

app.get(`/to-player`, function(req, res) {
    res.render(`player`, {spot: spotifyApi, dev: null})
})

// Spotify login, authorize
app.get(`/login-authorize`, function(req, res) {
    var state = generateRandomString(16)
    res.cookie(stateKey, state)

    //Request authorization
    var scope = 
        `user-read-private` +
        ` user-read-email` +
        ` playlist-read-private` +
        ` user-read-birthdate` +
        ` streaming` +
        ` user-read-playback-state` +
        ` user-modify-playback-state`;

    res.redirect(`https://accounts.spotify.com/authorize?` +
    querystring.stringify({
        response_type: `code`,
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
    }));
})

// Callback
app.get(`/callback`, function(req, res) {
    
    res.redirect(`/`)

    // Read query parameters 
    var code = req.query.code; //authorization code
    var state = req.query.state
    
    // Get access token 
    spotifyApi.authorizationCodeGrant(code)
    .then(function(data) {
        console.log(`Received access token`)
        console.log(`The token expires in ` + data.body[`expires_in`])
        spotifyApi.setAccessToken(data.body[`access_token`])
        return spotifyApi.getMe()
    }).then(function(data) {
        console.log('Retrieved data for ' + data.body.id);
        console.log('Email is ' + data.body.email);
        console.log('This user has a ' + data.body.product + ' account');
    }).catch(function(err) {
        console.log('Something went wrong (/callback)', err.message);
    });
})

// Display devices
app.get(`/devices`, function (req, res) {
    spotifyApi.getMyDevices()
    .then(function(data) {
        dev_id = data.body.devices[0].id
        console.log(`Device id: `, data.body.devices[0].id)
        console.log(`Device name: `, data.body.devices[0].name)
        res.end()
    }, function(err) {
        console.log(err.message)
        console.log(`something went wrong (/devices)`)
    })
})

// Start a song in browser
app.get(`/test-play`, function(req, res) {
    // First get device ID
    spotifyApi.getMyDevices()
    .then(function(data) {
        dev_id = data.body.devices[0].id
        console.log(`Device id: `, data.body.devices[0].id)
        console.log(`Device name: `, data.body.devices[0].name)
        res.end()
    }, function(err) {
        console.log(err.message)
        console.log(`something went wrong (/devices)`)
    })
    
    spotifyApi.play({ 
        device_id: dev_id, 
        context_uri: `spotify:album:5ht7ItJgpBH7W6vJ5BqpPr`,
        offset: {position: 5}})
    .then(function(data){
        console.log("Started playing song.")
        res.end()
    }, function(err) {
        console.log(err.message)
        console.log(`something went wrong (/test-play)`)
    })
})

// Pause playback
app.get(`/pause`, function(req, res) {
    spotifyApi.pause({ device_id: dev_id})
    .then(function(data) {
        console.log(`Pausing playback`)
        res.end()
    }, function(err) {
        console.log(`something went wrong (/pause)`, err)
    })
})

// Resume playback
app.get(`/resume`, function(req, res) {
    spotifyApi.play({ device_id: dev_id})
    .then(function(data) {
        console.log(`Resuming playback`)
        res.end()
    }, function(err) {
        console.log(`something went wrong (/pause)`, err)
    })
})

// Display users playlists
app.get(`/show-playlist`, function(req, res, data) {
    res.render(`show-playlists`, data)
})

// Get users playlists
app.get(`/my-playlists`, function(req, res) {
    spotifyApi.getUserPlaylists(options={limit: 1, offset : 0})
    .then(function(data) {
        res.render(`show-playlists`, {info: data})
    })
    .catch(function(err) {
        console.log(`something went wrong`, err.message)
    })
})

//server
app.listen(3000, function() {
    console.log(`now listening on port 3000...`)
})