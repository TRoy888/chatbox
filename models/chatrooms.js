var pool = require('./chatbox_pool');
var chatroom = {};

chatroom.findChatRoomsByUserId = function(user_id, cb){
  pool.getConnection(function(err, connection){
    if (err) {
      connection.release();
      cb(err, null);
      return;
    }

    var criteria = [parseInt(user_id)];
    connection.query("SELECT chats.*, user_chat.is_read FROM users, chats, user_chat where users.id=user_chat.user_id and user_chat.chat_id = chats.id and users.id = ?", criteria, function(err, result){
        connection.release();
        cb(err, result);
    });
  });
}

chatroom.findChatRoomsByUserEmail = function(email, cb){
  pool.getConnection(function(err, connection){
    if (err) {
      connection.release();
      cb(err, null);
      return;
    }

    var criteria = [email];
    connection.query("SELECT chats.* FROM users, chats, user_chat where users.id=user_chat.user_id and user_chat.chat_id = chats.id and users.email = ?", criteria, function(err, result){
        connection.release();
        cb(err, result);
    });
  });
}

chatroom.findChatContentsByChatId = function(chat_id, cb){
  pool.getConnection(function(err, connection){
    if (err) {
      connection.release();
      cb(err, null);
      return;
    }

    var criteria = [parseInt(chat_id)];
    connection.query("SELECT messages.*, users.username, users.picture_url  FROM messages, users WHERE messages.user_id = users.id and messages.chat_id = ? order by time", criteria, function(err, result){
        connection.release();
        cb(err, result);
    });
  });
}

chatroom.findUsersInAChatRoom = function(chat_id, cb){
  pool.getConnection(function(err, connection){
    if (err) {
      connection.release();
      cb(err, null);
      return;
    }

    var criteria = [parseInt(chat_id)];
    connection.query("SELECT user_id FROM user_chat WHERE chat_id = ?", criteria, function(err, result){
        connection.release();
        cb(err, result);
    });
  });
}

chatroom.findTwoPeopleChatroomIdByUserId = function(user_id_01, user_id_02, cb){
  console.log("user01:"+user_id_01);
  console.log("user02:"+user_id_02);
  pool.getConnection(function(err, connection){
    if (err) {
      connection.release();
      cb(err, null);
      return;
    }

    var criteria = [parseInt(user_id_01), parseInt(user_id_02)];
    connection.query("SELECT chats.id FROM chats, user_chat WHERE chats.id = user_chat.chat_id AND chats.is_group_chat IS FALSE AND (user_chat.user_id = ? OR user_chat.user_id = ?) GROUP BY chats.id HAVING COUNT(1)=2", criteria, function(err, result){
        connection.release();
        if(result.toString()){
          cb(err, result);
        }
        else{
          cb(err, null);
        }
    });
  });
}

chatroom.findAChatRoomDetailByChatId = function(chat_id, cb){
  pool.getConnection(function(err, connection){
    if (err) {
      connection.release();
      cb(err, null);
      return;
    }

    var criteria = [parseInt(chat_id)];
    connection.query("SELECT * FROM chats WHERE id = ?", criteria, function(err, result){
        connection.release();
        if(result.length>0){
          cb(err, result[0]);
        }
        else{
          cb(err, null);
        }
    });
  });
}

chatroom.createNewChatroomForTwoPeople = function(user_id_01, user_id_02, chat_name, message, cb){
  console.log("create new Chatroom for user01:"+user_id_01+" and user02:"+user_id_02);

  pool.getConnection(function(err, connection){
    if (err) {
      connection.release();
      cb(err, null);
      return;
    }

    connection.beginTransaction(function(err) {
      if (err) { throw err; }
      var chat = {name:chat_name};
      connection.query('INSERT INTO chats SET ?', chat, function(err, chatResult) {
        if (err) {
          connection.rollback(function() {
            // throw err;
            cb(err, null);
            return;
          });
        }
        var chat_users = [
          [chatResult.insertId, user_id_01]
          , [chatResult.insertId, user_id_02]]
        connection.query('INSERT INTO user_chat (chat_id, user_id) VALUES ?', [chat_users], function(err, userChatResult) {
          if (err) {
            connection.rollback(function() {
              // throw err;
              cb(err, null);
              return;
            });
          }
          var messageModel = {
            message : message
            , user_id : user_id_01
            , chat_id : chatResult.insertId
          }
          connection.query('INSERT INTO messages SET ?', messageModel, function(err, messageResult){
            if (err) {
              connection.rollback(function() {
                // throw err;
                cb(err, null);
                return;
              });
            }

            connection.commit(function(err) {
              if (err) {
                connection.rollback(function() {
                  // throw err;
                  cb(err, null);
                  return;
                });
              }
              connection.release();
              cb(err, {chat:chatResult, message: messageResult});
              console.log('success!');
            });
          });
        });
      });
    });
  });
}

chatroom.createGroupChatroomForUsers = function(group_name, user_ids, cb){
  pool.getConnection(function(err, connection){
    if (err) {
      connection.release();
      cb(err, null);
      return;
    }

    connection.beginTransaction(function(err) {
      if (err) { throw err; }
      var chat = {name:group_name, is_group_chat:true};
      connection.query('INSERT INTO chats SET ?', chat, function(err, chatResult) {
        if (err) {
          connection.rollback(function() {
            // throw err;
            cb(err, null);
            return;
          });
        }

        var chat_users = [];
        for(var i=0;i<user_ids.length;i++){
          var tmpChatUser = [chatResult.insertId, user_ids[i]];
          chat_users.push(tmpChatUser);
        }
        connection.query('INSERT INTO user_chat (chat_id, user_id) VALUES ?', [chat_users], function(err, userChatResult) {
          if (err) {
            connection.rollback(function() {
              // throw err;
              cb(err, null);
              return;
            });
          }

          connection.commit(function(err) {
            if (err) {
              connection.rollback(function() {
                // throw err;
                cb(err, null);
                return;
              });
            }
            connection.release();
            cb(err, {chat_id:chatResult.insertId, user_chat: userChatResult});
            console.log('success!');
          });
        });
      });
    });
  });
}

chatroom.addUsersToAGroupChat = function(chat_id, user_ids, cb){
  pool.getConnection(function(err, connection){
    if (err) {
      cb(err, null);
      return;
    }
    var chat_users = [];
    for(var i=0;i<user_ids.length;i++){
      var tmpChatUser = [chat_id, user_ids[i]];
      chat_users.push(tmpChatUser);
    }
    connection.query('INSERT INTO user_chat (chat_id, user_id) VALUES ?', [chat_users], function(err, userChatResult) {
      connection.release();
      if(err){
        console.log(err);
      }
      cb(err, userChatResult);
    });
  });
}

chatroom.updateChatroomToUnreadForUsers = function(chat_id, user_ids, cb){
  pool.getConnection(function(err, connection){
    if (err) {
      connection.rollback(function() {
        // throw err;
        cb(err, null);
        return;
      });
    }

    var chat_users = [parseInt(chat_id)];
    var sql = "";
    for(var i=0; i<user_ids.length; i++){
      if(sql){
        sql+=",";
      }
      sql+="?";
      chat_users.push(user_ids[i]);
    }
    console.log(sql);
    console.log(chat_users);
    connection.query('UPDATE user_chat SET is_read = 0 WHERE chat_id = ? and user_id IN ('+sql+')', chat_users, function(err, userChatResult) {
      connection.release();
      if(err)
        throw err;
      cb(err, userChatResult);
    });
  });
}

chatroom.updateChatroomToReadForUsers = function(chat_id, user_ids, cb){
  pool.getConnection(function(err, connection){
    if (err) {
      connection.rollback(function() {
        // throw err;
        cb(err, null);
        return;
      });
    }
    var chat_users = [parseInt(chat_id)];
    var sql = "";
    for(var i=0; i<user_ids.length; i++){
      if(sql){
        sql+=",";
      }
      sql+="?";
      chat_users.push(user_ids[i]);
    }

    connection.query('UPDATE user_chat SET is_read = 1 WHERE chat_id = ? and user_id IN ('+sql+')', chat_users, function(err, userChatResult) {
      connection.release();
      if(err)
        throw err;
      cb(err, userChatResult);
    });
  });
}

module.exports = chatroom;
