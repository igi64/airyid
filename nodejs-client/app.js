/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var https = require('https');
var path = require('path');
var fs = require('fs');
var passport = require('passport');
//var util = require('util');
var LeadictStrategy = require('passport-openidconnect').Strategy;

var LEADICT_CLIENT_ID = "--insert-leadict-client-id-here--"
var LEADICT_CLIENT_SECRET = "--insert-leadict-client-secret-here--";

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

// Use the LeadictStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an Issuer, User ID, User profile,
//   accessToken and refreshToken), and invoke a callback with a user object.
passport.use(new LeadictStrategy({
        scope: 'profile email',
        clientID: LEADICT_CLIENT_ID,
        clientSecret: LEADICT_CLIENT_SECRET,
        callbackURL: 'https://localhost.airybox.org/auth/leadict/callback',
        authorizationURL: 'https://id.leadict.com/authorize',
        tokenURL: 'https://id.leadict.com/token',
        userInfoURL: 'https://id.leadict.com/userinfo'},
    function(iss, sub, profile, accessToken, refreshToken, done) {
        //User.findOrCreate({ id: profile.id }, function (err, user) {
        process.nextTick(function () {
            //return done(err, user);
            return done(null, user);
        });
    }
));

var ssl_key = fs.readFileSync('keys/ssl.key');
var ssl_cert = fs.readFileSync('keys/ssl.crt');
var ssl_ca = fs.readFileSync('keys/signing-ca-1.crt');

var options = {
    key: ssl_key,
    cert: ssl_cert,
    ca: ssl_ca
};

var apps = express();

// all environments
apps.set('port', process.env.PORT || 443);
apps.set('views', path.join(__dirname, 'views'));
apps.set('view engine', 'ejs');
apps.use(express.favicon());
apps.use(express.logger('dev'));
apps.use(express.json());
apps.use(express.urlencoded());
apps.use(express.methodOverride());
apps.use(express.cookieParser('your secret here'));
apps.use(express.session());
apps.use(passport.initialize());
apps.use(passport.session());
apps.use(apps.router);
apps.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == apps.get('env')) {
    apps.use(express.errorHandler());
}

apps.get('/', routes.index);
apps.get('/users', user.list);

apps.get('/login', function(req, res){
    res.send('{"error":"Unauthenticated identity."}');
});

apps.get('/auth/leadict',  passport.authenticate('openidconnect'));

apps.get('/auth/leadict/callback',
    passport.authenticate('openidconnect', { failureRedirect: '/login' }),
    //passport.authenticate('openidconnect', { scope: ['profile', 'email'] }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
});

https.createServer(options, apps).listen(apps.get('port'), function(){
    console.log("Express server listening on port " + apps.get('port'));
});

