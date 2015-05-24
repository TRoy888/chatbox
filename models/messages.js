var pool = require('./chatbox_pool');
var message = {};

message.saveMessage = function(author_id, chat_id, message, cb){
  pool.getConnection(function(err, connection){
    if (err) {
      connection.release();
      cb(err, null);
      return;
    }

    var data = {user_id:parseInt(author_id), chat_id:parseInt(chat_id), message:message}
    connection.query("INSERT INTO messages SET ?", data, function(err, result){
        connection.release();
        cb(err, result);
    });
  });
}



module.exports = message;
