require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const github = require('octonode')
const cors = require('cors');
const app = express()

app.use(cors({
    origin: 'https://mkniddaygitissues.herokuapp.com'
}))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cookieParser())

app.use(function (req, res, next) {
    let client;
    if (req.query.access_token && req.query.access_token !== 'undefined') {
        client = github.client(req.query.access_token)
    } else {
        client = github.client()
    }
    // Return client
    req.client = client
    next()
})

app.use(function (error, req, res, next) {
    let client = github.client()
    // Return client
    req.client = client
    next()
})

// Generate the auth url
app.get('/auth_url', function (req, res, next) {
    // Get the authentication url
    const auth_url = github.auth.config({
        id: process.env.CLIENT_ID,
        secret: process.env.CLIENT_SECRET
    }).login(['user', 'repo', 'gist']);
    res.status(200).json(auth_url);
})

// The user api requests
app.get('/user/login', function (req, res, next) {
    const code = req.query.code
    github.auth.login(code, function (err, token) {
        if (err) {
            return next(err)
        } else {
            const options = {
                maxAge: 1000 * 60 * 15, // would expire after 15 minutes
            }
            res.cookie('access_token', token, options)
            res.status(200).json(token)
        }
    })
})

app.get('/user/info', function (req, res, next) {
    req.client.me().info(function (err, user) {
        if (err) {
            return next(err)
        }
        res.status(200).json(user)
    })
})

app.get('/user/repos', function (req, res, next) {
    req.client.me().repos((err, repos) => {
        if (err) {
            return next(err)
        }
        res.status(200).json(repos)
    })
})

app.post('/repo', function (req, res, next) {
    req.client.repo(req.body.values).info(function (err, info) {
        if (err) (next(err))
        res.status(200).json(info)
    })
})

// The issues api url
app.post('/user/issues', function (req, res, next) {
    const config = req.body
    const repo = req.query.repo
    req.client.repo(repo).issues(config, function (err, issues) {
        if (err) {
            return next(err)
        }
        return res.status(200).json(issues)
    })
})

app.post('/search/issues', function (req, res, next) {
    req.client.search().issues({
        q: req.body.q,
        page: req.body.page,
        per_page: 20
    }, function (err, issues) {
        if (err) {
            return next(err)
        }
        res.status(200).json(issues)
    })
})

app.use((error, req, res, next) => {
    console.log(error)
    if (error && error.statusCode) {
        res.status(error.statusCode).json(error.message)
    } else {
        res.status(500).json('Something Went Wrong')
    }
})

app.listen(process.env.PORT || 4000);
console.log('Protocol initiated sir mknidday ;)')