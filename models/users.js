var pool = require('./chatbox_pool');
var crypto = require('crypto');

var user = {};

user.register = function(email, username, password, cb){
  pool.getConnection(function(err, connection){
    if (err) {
      connection.release();
      cb(err, null);
      return;
    }

    var user = {
      email:email,
      username:username,
      password:crypto.createHash('sha256').update(password).digest('base64')
    }
    connection.query("INSERT INTO users SET ?"
                    , user
                    , function(err, result){
                        connection.release();
                        cb(err, result);
    });
  });
};

user.authenticate = function(email, password, cb){
  pool.getConnection(function(err, connection){
    if (err) {
      connection.release();
      cb(err, null);
      return;
    }

    var criteria = [email, crypto.createHash('sha256').update(password).digest('base64')];
    connection.query("SELECT * FROM users WHERE email = ? and password = ?", criteria, function(err, result){
        connection.release();
        cb(err, result);
    });
  });
};

/**
* get all users except the current users.
*/
user.getUsers = function(user_id, cb){
  pool.getConnection(function(err, connection){
    if (err) {
      connection.release();
      cb(err, null);
      return;
    }

    var criteria = [parseInt(user_id)];
    connection.query("SELECT * FROM users where id <> ? ORDER BY username", criteria, function(err, result){
        connection.release();
        cb(err, result);
    });
  });
};

/**
* get next ten users from start parameter except the current users.
*/
user.getUsersFrom = function(start, user_id, cb){
  pool.getConnection(function(err, connection){
    if (err) {
      connection.release();
      cb(err, null);
      return;
    }

    var criteria = [parseInt(user_id), parseInt(start)];
    connection.query("SELECT * FROM users where id <> ? ORDER BY username limit ?, 10", criteria, function(err, result){
        connection.release();
        cb(err, result);
    });
  });
};

user.getUserById = function(user_id, cb){
  pool.getConnection(function(err, connection){
    if (err) {
      connection.release();
      cb(err, null);
      return;
    }

    var criteria = [parseInt(user_id)];
    // console.log(user_id);
    connection.query("SELECT * FROM users where id = ?", criteria, function(err, result){
        connection.release();
        if(result.length==0){
          cb(err, null);
        }
        else{
          cb(err, result[0]);
        }
    });
  });
}

user.findUsersExceptIds = function(user_ids, cb){
  pool.getConnection(function(err, connection){
    if (err) {
      connection.release();
      cb(err, null);
      return;
    }
    var sql = "";
    for(var i=0;i<user_ids.length;i++){
      if(sql){
        sql+=",";
      }
      sql+=user_ids[i];
    }
    connection.query("SELECT * FROM users where id NOT IN ("+sql+")", user_ids, function(err, result){
        connection.release();
        cb(err, result);
    });
  });
}

user.updateUserLastChatId = function(user_id, chat_id, cb){
  pool.getConnection(function(err, connection){
    if (err) {
      connection.release();
      cb(err, null);
      return;
    }
    var criteria = [chat_id, user_id];
    connection.query("UPDATE users SET last_chat_id = ? WHERE id = ?", criteria, function(err, result){
        connection.release();
        cb(err, result);
    });
  });
}

user.updateUserPicture = function(user_id, new_pic, cb){
  pool.getConnection(function(err, connection){
    if (err) {
      connection.release();
      cb(err, null);
      return;
    }
    var criteria = [new_pic, parseInt(user_id)];
    connection.query("UPDATE users SET picture_url = ? WHERE id = ?", criteria, function(err, result){
        connection.release();
        cb(err, result);
    });
  });
};

module.exports = user;
