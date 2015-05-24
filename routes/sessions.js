var express = require('express');
var router = express.Router();
var user = require('../models/users');

router.get('/:var(login|create)?', function(req, res, next){
  if(req.session.uid){
    res.redirect('/chat');
  }else{
    res.render('sessions/login', { title: 'Login'});
  }
});

router.post('/:var(login|create)?', function(req, res, next){
  user.authenticate(req.body.email
                    , req.body.password
                    , function(err, result){
                        if(err){
                          var message = 'Internal Server Error!!';
                          res.render('custom_error', {message:message});
                        }
                        else{
                          if(result.length>0){
                            req.session.uid=result[0].id;
                            res.redirect('/chat');
                          }else{
                            res.render('sessions/login', {title: 'Login', message:'Login Fail!!'});
                          }
                        }
                    });
});

router.get('/logout', function(req, res, next){
  req.session.destroy(function(err){
    if(err){
      console.log(err);
    }
    else{
      res.redirect('/sessions/login');
    }
  });
});


module.exports = router;
