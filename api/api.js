let express = require('express');
let router = express.Router();
let randtoken = require('rand-token');
let mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/auth');
let bcrypt =require ('bcrypt');
let db = mongoose.connection;
let User;
let salt = bcrypt.genSaltSync(10);

db.on('error', console.error);
db.once('open', function() {
    var userSchema = new mongoose.Schema({
        name: String,
        hash: String,
        email: String
    });
    User = mongoose.model('User', userSchema);
    var sessionSchema = new mongoose.Schema({
        userid: String,
        token: String,
        begin: Number,
        end: Number
    });
    Session = mongoose.model('Session', sessionSchema);
});

router.route('/register')    
    .post(function(req, res) {
        if(!req.body.password){
            res.status(400).send({error:'no password'});
        }else if(!req.body.email){
            res.status(400).send({error:'no email'});
        }else{
            User.find({'email':req.body.email},function(err,user){
                if(user[0]!=undefined){
                    res.status(400).send({error:'email is used'});
                }else{
                    var hash = bcrypt.hashSync(req.body.password, salt);
                    let user = new User({
                        name: req.body.name,
                        hash: hash,
                        email:  req.body.email
                    });
                    user.save(function(err, user) {
                        let token = randtoken.generate(16);
                        let ses = new Session({
                            userid: user._id,
                            token: token,
                            begin: Date.now(),
                            end: 0
                        });
                        ses.save(function() {
                            res.status(201).send({token:token});
                        });
                    }); 
                }                  
            });
        }
    });
router.route('/login')
    .post(function(req, res) {
        User.find({'email':req.body.email},function(err,user){
            if(bcrypt.hashSync(req.body.password, salt)==user[0].hash){
                let token = randtoken.generate(16);
                let ses = new Session({
                    userid: user[0]._id,
                    token: token,
                    begin: Date.now(),
                    end: 0
                });
                ses.save(function() {
                    res.status(200).send({token:token});
                });                
            }
        })
    });
router.route('/logout')
    .post(function(req, res) {
        Session.find({'token':req.body.token},function(err,session){
             Session.update( { token:session[0].token } , { $set: { end:Date.now()} },function(){
                 res.status(200).send({token:session[0].token});
             } );
        })
    });
router.route('/profile')
    .get(function(req, res) {
        if(req.header('authorization')==undefined){
            res.status(401).send({error:'no such token'});
        }else {
            let token = req.header('authorization').split(' ')[1];
            Session.find({'token': token}, function (err, session) {

                User.find({'_id': session[0].userid}, function (err, user) {
                    res.status(200).send({email: user[0].email});
                });
            });
        }
    });
module.exports = router;