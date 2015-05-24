var chatroom = require('../models/chatrooms');
var message = require('../models/messages');
var user = require('../models/users');
var activeRooms = {};
var userSockets = {};

module.exports = function(io){
  io.sockets.on('connection', function(socket){
    console.log(socket.request.session.uid);

    socket.on('user-connected', function(email){
      console.log(email+" connected");
      socket.email = email;
      chatroom.findChatRoomsByUserEmail(email, function(err, results){
        // console.log(result);
        for(var i = 0; i < results.length; i++){
          if(activeRooms[results[i].id]){
            activeRooms[results[i].id].peopleInTheRoom += 1;
          }
          else{
            activeRooms[results[i].id] = { id : results[i].id
                                          , peopleInTheRoom : 1};
          }
          socket.join(results[i].id);
        }
        // console.log(activeRooms);
      });
      var userId = parseInt(socket.request.session.uid);
      if(userSockets[userId]){ //new session with existing user.
        userSockets[userId][socket.id] = socket;
      }
      else{ //new session with new comming user
        var tmp = {}
        tmp[socket.id] = socket;
        userSockets[userId] = tmp;
      }
      console.log(userSockets);
    });

    socket.on('group-chat-created', function(data){
      var chat_id = parseInt(data.chat_id);
      // console.log("group-chat-created: ready to join users to "+chat_id);
      chatroom.findUsersInAChatRoom(chat_id, function(err, userResults){
        if(!err){
          // console.log(JSON.stringify(userResults));
          for(var i=0;i<userResults.length;i++){
            if(userSockets[userResults[i].user_id]){
              for(var key in userSockets[userResults[i].user_id]){
                userSockets[userResults[i].user_id][key].join(chat_id);
              }
            }
          }
        }
      });
    });

    socket.on('message-sent', function(data){
      // console.log(data);
      if(data.chatroom){ //chat room does exist
        message.saveMessage(socket.request.session.uid
                            , data.chatroom
                            , data.message
                            , function(err, result){
                              if(!err){
                                // console.log(message);
                                user.getUserById(socket.request.session.uid, function(err, messageAuthor){
                                  if(!err){
                                    console.log(data.chatroom);
                                    chatroom.findAChatRoomDetailByChatId(parseInt(data.chatroom), function(err, chatResult){
                                      if(!err){
                                        var author = {
                                          username:messageAuthor.username
                                          , picture_url:messageAuthor.picture_url
                                          , email:messageAuthor.email
                                        }

                                        //update other users status for a chat to be unread no need to wait before sending out messages.
                                        chatroom.findUsersInAChatRoom(parseInt(data.chatroom), function(err, inChatUsers){
                                          var user_ids = [];
                                          for(var i=0;i<inChatUsers.length;i++){
                                            user_ids.push(inChatUsers[i].user_id);
                                          }
                                          chatroom.updateChatroomToUnreadForUsers(parseInt(data.chatroom), user_ids, function(err, r){});
                                        });

                                        var outgoingMessage = {author:author, message:data, chat:chatResult};
                                        console.log(outgoingMessage);
                                        io.to(parseInt(data.chatroom)).emit('message-received', outgoingMessage);
                                      }
                                    });
                                  }
                                });
                              }
                            });
      }
      else{ //create a new chat room and store messages
        chatroom.createNewChatroomForTwoPeople(socket.request.session.uid, data.contact_user_id, data.chat_room_name, data.message, function(err, result){
          if(!err){
            //join user to a new chat room.

            user.getUserById(socket.request.session.uid, function(err, messageAuthor){
              var author = {
                id:messageAuthor.id
                , username:messageAuthor.username
                , picture_url:messageAuthor.picture_url
                , email:messageAuthor.email
              }
              data.chatroom=result.chat.insertId;

              //join all users' sockets to a new room.
              var authorSocket = userSockets[parseInt(socket.request.session.uid)];
              for (var key in authorSocket) {
                console.log("Main: "+key+" join "+parseInt(data.chatroom));
                authorSocket[key].join(parseInt(data.chatroom));
              }
              var receiverSocket = userSockets[parseInt(data.contact_user_id)];
              if(receiverSocket){
                for (var key in receiverSocket) {
                  console.log("Secondary: "+key+" join "+parseInt(data.chatroom));
                  receiverSocket[key].join(parseInt(data.chatroom));
                }
              }
              chatroom.findAChatRoomDetailByChatId(data.chatroom, function(err, chatResult){

                //update other users status for a chat to be unread no need to wait before sending out messages.
                chatroom.findUsersInAChatRoom(parseInt(chatResult.id), function(err, inChatUsers){
                  var user_ids = [];
                  for(var i=0;i<inChatUsers.length;i++){
                    user_ids.push(inChatUsers[i].user_id);
                  }
                  chatroom.updateChatroomToUnreadForUsers(parseInt(data.chatroom), user_ids, function(err, r){});
                });

                var outgoingMessage = {author:author, message:data, chat:chatResult};
                io.to(parseInt(data.chatroom)).emit('message-received', outgoingMessage);
              });
            });
          }
        });
      }
    });

    socket.on('disconnect', function(){
      console.log(socket.email+' disconnected');
      // handle people leaving the rooms here 1.
      // handle leaving socket here. 2.
      var userId = parseInt(socket.request.session.uid);
      delete userSockets[userId][socket.id];
      socket.disconnect();
      // console.log(userSockets);
    });
  });
}
