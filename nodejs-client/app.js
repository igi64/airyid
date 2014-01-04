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

var LEADICT_CLIENT_ID = "3349f973-c672-4a7a-a946-8caa31234923"
var LEADICT_CLIENT_SECRET = "Ax5MiCbjBT4nAFtVQetdN64NTgC0VobS2oKLTr-wJhoNCr7akOPaPCPL_7bs05HVWYE7sXp2oyXHM6V25OwxUA";
var LEADICT_REG_ACCESS_TOKEN = 'eyJhbGciOiJSUzI1NiJ9.eyJhdWQiOlsiMzM0OWY5NzMtYzY3Mi00YTdhLWE5NDYtOGNhYTMxMjM0OTIzIl0sImlzcyI6Imh0dHBzOlwvXC9pZC5sZWFkaWN0LmNvbVwvIiwianRpIjoiZTIyMDc1MWYtZmYzYS00ZTlhLWEzZGMtZjY5Zjg5ZTRhNzVhIiwiaWF0IjoxMzg4MjY3MjE4fQ.qI0xgpnNfMwcJSc-Zayy791XiiG_zopCpxwmyne8qAXhnhHKnwpZDiTGsIgM_h_aV6tBfYwI-FNVOyq3DCH1phvePTbXt_wk2FJBPHoeTLZUWDZjqefGX_WuLZjGv17h6BbefOyGJHqW3jbjzWBjUb1Hv_EFndADbJLol3zqMFw';
var LEADICT_CLIENT_CONF_URL = 'https://id.leadict.com/register/3349f973-c672-4a7a-a946-8caa31234923';

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
// https://localhost.airybox.org/auth/oidc?resource=acct:admin@leadict.com
passport.use(new LeadictStrategy({
        identifierField: 'resource',
        scope: 'profile email'/*,
        clientID: LEADICT_CLIENT_ID,
        clientSecret: LEADICT_CLIENT_SECRET,
        callbackURL: 'https://localhost.airybox.org/auth/leadict/callback',
        authorizationURL: 'https://id.leadict.com/authorize',
        tokenURL: 'https://id.leadict.com/token',
        userInfoURL: 'https://id.leadict.com/userinfo'*/},
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
    /*passport.disco('zboran@leadict.com',
        function(req, res) {
            // Successful authentication, redirect home.
            res.redirect('/');
        });*/
    res.send('{"error":"Unauthenticated identity."}');
});

apps.get('/auth/oidc',  passport.authenticate('openidconnect'));

apps.get('/auth/oidc/callback',
    passport.authenticate('openidconnect', { failureRedirect: '/login' }),
    //passport.authenticate('openidconnect', { scope: ['profile', 'email'] }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
});

https.createServer(options, apps).listen(apps.get('port'), function(){
    console.log("Express server listening on port " + apps.get('port'));
});

