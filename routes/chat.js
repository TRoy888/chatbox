var express = require('express');
var router = express.Router();
var user = require('../models/users');
var chatroom = require('../models/chatrooms');

router.get('/', function(req, res, next){
  user.getUserById(req.session.uid, function(err, result){
    if(err || result == null){
      chatHanddleError(next);
    }
    else{
      res.render('chats/chat', {title:'Chat', userName:result.username, user_image:result.picture_url, user_email:result.email, user_last_chat_id:result.last_chat_id});
    }
  });
});

router.post('/chatrooms', function(req, res, next){
  chatroom.findChatRoomsByUserId(req.session.uid, function(err, results){
    if(err){
      chatHanddleError(next);
    }
    else{
      res.send(results);
    }
  });
});

router.post('/chatrooms/by_user', function(req, res, next){
  var callback = function(err, result){
    if(err){
      res.send("Error");
    }
    else{
      if(result){
        console.log(result[0].id);
        findChatContents(result[0].id, req.session.uid, function(results){
          res.send(results);
        });
      }
      else{
        res.send({messages:[], users:[parseInt(req.session.uid), parseInt(req.body.contact_user_id)], chat:{}});
      }
    }
  };
  chatroom.findTwoPeopleChatroomIdByUserId(req.body.contact_user_id
                                          , req.session.uid
                                          , callback);
});

router.get('/chatrooms/:chat_id?', function(req, res, next){
  // console.log(req.params.chat_id);
  findChatContents(req.params.chat_id, req.session.uid, function(results){
    res.send(results);
  });
});


router.post('/chatrooms/add_users', function(req, res, next){
  console.log(req.body);
  if(req.body.chat_id){ // current chat room exists
    chatroom.findAChatRoomDetailByChatId(req.body.chat_id, function(err, chatDetail){
      if(err){
        res.send("Error");
      }
      else{
        if(chatDetail.is_group_chat){ // existing is a group room
          chatroom.addUsersToAGroupChat(chatDetail.id, JSON.parse(req.body.users), function(err, result){
            chatroom.findUsersInAChatRoom(chatDetail.id, function(err, users){
              var inChatUsers = [];
              for(var i=0;i<users.length;i++){
                inChatUsers.push(users[i].user_id);
              }
              var resultModel = {
                chat_id:chatDetail.id
                , user_chat:result
                , current_user_in_chat:inChatUsers
              }
              res.send(resultModel);
            });
          });
        }
        else{ //existing is not a group room
          createANewGroupConversation(req.body.group_name, JSON.parse(req.body.users), function(err, result){
            if(err){
              res.send("Error");
            }
            res.send(result);
          });
        }
      }
    });
  }
  else{ //current chat room does not exist.
    createANewGroupConversation(req.body.group_name, JSON.parse(req.body.users), function(err, result){
      if(err){
        res.send("Error");
      }
      res.send(result);
    });
  }
});

router.post('/chatrooms/update_is_read', function(req, res, next){
  //update other users status for a chat to be read
  chatroom.updateChatroomToReadForUsers(parseInt(req.body.chat_id), [parseInt(req.session.uid)], function(err, r){});
});

function createANewGroupConversation(group_name, user_ids, cb){
  chatroom.createGroupChatroomForUsers(group_name, user_ids, function(err, results){
    cb(err, results);
  });
}

function findChatContents(chat_id, user_id, cb){
  chatroom.findChatContentsByChatId(chat_id, function(err, messageResults){
    if(err){
      chatHanddleError(next);
    }
    else{
      messageResults = checkMessageOwner(messageResults, user_id);
      chatroom.findUsersInAChatRoom(chat_id, function(err, userResults){
        if(err){
          res.send("Error");
        }
        else{
          var inChatUsers = [];
          for(var i=0;i<userResults.length;i++){
            // console.log(userResults[i].user_id);
            inChatUsers.push(parseInt(userResults[i].user_id));
          }
          console.log(inChatUsers);
          chatroom.findAChatRoomDetailByChatId(chat_id, function(err, chatResult){
            var resultModel = {
              messages: messageResults
              , users: inChatUsers
              , chat: chatResult
            }

            //update last chat room of a user no need to wait until it finishes.
            user.updateUserLastChatId(user_id, chat_id, function(){});

            //update other users status for a chat to be read no need to wait until it finishes
            chatroom.updateChatroomToReadForUsers(parseInt(chatResult.id), [parseInt(user_id)], function(err, r){});


            cb(resultModel);
          });
        }
      });
    }
  });
}

function checkMessageOwner(messages, owner_id){
  for(var i=0; i<messages.length; i++){
    if(messages[i].user_id == owner_id){
      messages[i].owner = true;
    }
  }
  return messages;
}

function chatHanddleError(next){
  var err = new Error('Internal Server Error!');
  err.status = 500;
  next(err);
};

module.exports = router;
