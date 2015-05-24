var express = require('express');
var router = express.Router();
var user = require('../models/users');

router.post('/', function(req, res, next){
  user.getUsers(req.session.uid
                    , function(err, result){
                        if(err){
                          var err = new Error('Internal Server Error!!');
                          err.status = 500;
                          next(err);
                        }
                        else{
                          var userResults = [];
                          for(var i=0; i<result.length; i++){
                            var userTmp = {id:result[i].id
                                            ,email:result[i].email
                                            ,username:result[i].username
                                            ,picture_url:result[i].picture_url};
                            userResults.push(userTmp);
                          }
                          res.send(userResults);
                        }
  });
});

router.post('/forAddToChat', function(req, res, next){
  var current_users = JSON.parse(req.body.current_users);
  console.log("current users in a chat room:"+current_users);
  if(current_users && current_users.length>0){
    user.findUsersExceptIds(current_users, function(err, userResults){
      var users = [];
      for(var i=0; i<userResults.length; i++){
        var userTmp = {
          username:userResults[i].username
          , picture_url:userResults[i].picture_url
          , id: userResults[i].id
        }
        users.push(userTmp);
      }
      // console.log(users);
      res.send(users);
    });
  }
  else{
    res.send([]);
  }
});

router.get('/create', function(req, res, next){
  res.render('users/user_create', { title: 'Register' });
});

router.post('/create', function(req, res, next){
  user.register(req.body.email
                , req.body.username
                , req.body.password
                , function(err, result){
                  if(err){
                    if('ER_DUP_ENTRY'===err.code){
                      var message = 'Email '+req.body.email+' has already been used in the system!';
                      res.render('custom_error', {message:message});
                    }
                    else{
                      var err = new Error('Error! User\'s information provided canoot be registered!');
                      err.status = 500;
                      next(err);
                    }
                  }
                  else{
                    var success = { title: 'Registered Successfully'
                                  , message: 'Registered Successfully'};
                    res.render('users/user_create', success);
                  }
                });
});

router.post('/update_user_picture', function(req, res, next){
  user.updateUserPicture(req.session.uid, req.body.user_picture_url, function(err, result){
    if(err){
      res.send({error:true});
    }
    else{
      res.send({success:true, picture_url:req.body.user_picture_url});
    }
  });
});

module.exports = router;
