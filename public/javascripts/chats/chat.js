var chat={
  userContainerId : ''
  , chatContainerId : ''
  , chatContentId : ''
  , count : 0
  , activeChatId : ''
  , activeChatType : ''
  , chatTypes: {group:'group', private:'private'}
  , activeContactUserId : ''
  , currentUsersInACurrentChat : []
  , noChats:false
  , currentTab:""
  , setUserContainerId : function(id){
    this.userContainerId = id;
    $("#"+this.userContainerId).addClass("users");
  }
  , setChatContainerId : function(id){
    this.chatContainerId = id;
    $("#"+this.chatContainerId).addClass("chats");
  }
  , setChatContentId : function(id){
    this.chatContentId = id;
    $("#"+this.chatContentId).addClass("chat-contents");
  }
  , loadMoreUser : function(start){
    var self = this;
    $.post( "/users", {start:start}, function(data) {
      var container = $("#"+self.userContainerId)
      , template = $("#template").find("div.user");
      for(var i=0; i<data.length; i++){
        var userTemplate = template.clone();
        userTemplate.click({contact_user : data[i], caller:self}, self.loadAChatRoom);
        userTemplate.attr("id", "user-panel-id-"+data[i].id);
        userTemplate.find(".image").css("background-image", 'url("'+data[i].picture_url+'")');
        userTemplate.find(".name").html("<span>"+data[i].username+"</span>");
        container.append(userTemplate);
      }
    });
  }
  , loadMoreChat : function(start, cb){
    var self = this;
    $.post( "/chat/chatrooms", {start:start}, function(data) {
      // console.log(data);
      var container = $("#"+self.chatContainerId)
        , template = $("#template").find("div.chat");
      for(var i=0; i<data.length; i++){
        var chatTemplate = template.clone();
        chatTemplate.click({chat_id:data[i].id, chat_name:data[i].name, caller:self}, self.loadAChatRoom);
        chatTemplate.attr("id", "chat-panel-id-"+data[i].id);
        chatTemplate.find(".name").html("<span>"+data[i].name+"</span>");

        ///add notification icons
        var chat_notification = $("<span id='chat-panel-notification-id-"+data[i].id+"' class='fa fa-comment chat-notification'></span>");
        if(data[i].is_read){
          chat_notification.css("display","none");
        }
        else{
          $("#incoming-message-notification").show();
        }
        chatTemplate.find(".name").append(chat_notification);
        ///

        container.append(chatTemplate);
      }
      if(cb){
        cb();
      }
    });
  }
  , loadAChatRoom : function(event, first_load){
    if(!first_load){
      $("#incoming-message-notification").hide();
    }
    //clear out the notification icon if any
    if(event.data.chat_id){
      $("#chat-panel-notification-id-"+event.data.chat_id).hide();
    }

    // console.log(this);
    var eventData = event.data;
    if(eventData.chat_id){//from clicking chat
      if(eventData.caller.activeChatId != eventData.chat_id){
        console.log("find chat by chat room");
        //highlight the clicked panel
        $("#chat-panel-id-"+eventData.caller.activeChatId).removeClass("chat-active");
        eventData.caller.activeChatId = eventData.chat_id;
        eventData.caller.activeContactUserId = "";
        $("#chat-panel-id-"+eventData.caller.activeChatId).addClass("chat-active");

        //request for chat contents from the server.
        $.get( "/chat/chatrooms/"+eventData.chat_id, {}, function(dataModel) {
          var data = dataModel.messages;
          eventData.caller.currentUsersInACurrentChat = dataModel.users;
          eventData.caller.setActiveChatType(dataModel.chat);

          // console.log(data);
          $("#active-chat-room").html(": "+eventData.chat_name + ((dataModel.chat.is_group_chat)?" (Group)":""));
          var container = $("#"+eventData.caller.chatContentId)
            , template = $("#template").find("div.message-container");
          container.empty();
          for(var i = 0; i<data.length; i++){
            var message = template.clone();
            message.find(".message-author").html(data[i].username);
            message.find(".message-img").css("background-image","url('"+data[i].picture_url+"')");
            message.find(".message-content").html(data[i].message);
            if(data[i].owner){
              message.find(".message-img").addClass("message-right");
              message.find(".message-author").addClass("message-right");
              message.find(".message-content").addClass("message-content-right");
            }
            else{
              message.find(".message-img").addClass("message-left");
              message.find(".message-author").addClass("message-left");
              message.find(".message-content").addClass("message-content-left");
            }
            container.append(message);
            if(i==data.length-1){
              container.animate({
                scrollTop: message.offset().top+container.scrollTop()
              });
            }
          }
        });
      }
    }
    else{ //from clicking users
      // console.log("find chat by a user");
      $.post( "/chat/chatrooms/by_user", {contact_user_id:eventData.contact_user.id, contact_user_email:eventData.contact_user.email}, function(dataModel) {
        // console.log(data);
        var data = dataModel.messages;
        eventData.caller.currentUsersInACurrentChat = dataModel.users;
        eventData.caller.setActiveChatType(dataModel.chat);

        if(data.length==0){
          $("#active-chat-room").html(": "+currentUserName+"-"+eventData.contact_user.username);
          $("#"+eventData.caller.chatContentId).empty();

          //unhighlight chat panel as a new user is clicked.
          $("#chat-panel-id-"+eventData.caller.activeChatId).removeClass("chat-active");
          eventData.caller.activeChatId = "";
          eventData.caller.activeContactUserId = eventData.contact_user.id;
        }
        else{
          //highlight chat panel corresponded with user clicked.
          $("#chat-panel-id-"+eventData.caller.activeChatId).removeClass("chat-active");
          eventData.caller.activeChatId = data[0].chat_id;
          eventData.caller.activeContactUserId = "";
          $("#chat-panel-id-"+eventData.caller.activeChatId).addClass("chat-active");

          $("#active-chat-room").html(": "+currentUserName+"-"+eventData.contact_user.username);
          var container = $("#"+eventData.caller.chatContentId)
            , template = $("#template").find("div.message-container");
          container.empty();
          for(var i = 0; i<data.length; i++){
            var message = template.clone();
            message.find(".message-author").html(data[i].username);
            message.find(".message-img").css("background-image","url('"+data[i].picture_url+"')");
            message.find(".message-content").html(data[i].message);
            if(data[i].owner){
              message.find(".message-img").addClass("message-right");
              message.find(".message-author").addClass("message-right");
              message.find(".message-content").addClass("message-content-right");
            }
            else{
              message.find(".message-img").addClass("message-left");
              message.find(".message-author").addClass("message-left");
              message.find(".message-content").addClass("message-content-left");
            }
            container.append(message);
            if(i==data.length-1){
              container.animate({
                scrollTop: message.offset().top+container.scrollTop()
              });
            }
          }
        }
      });
    }
  }
  , updateMessage : function(message, author, chat, isOwner){
    if(!chat.noChats
      && (this.activeChatId == message.chatroom
          || (this.activeChatId === "" && (this.activeContactUserId == message.contact_user_id || this.activeContactUserId == author.id))
        )
      ){

      if(this.activeChatId==="" && isOwner){
        this.loadMoreChat(0);
      }
      if(this.activeContactUserId == message.contact_user_id){
        this.activeChatId = message.chatroom;
        this.activeContactUserId = "";
      }
      var container = $("#"+this.chatContentId)
        , template = $("#template").find("div.message-container");
      var messageDom = template.clone();
      messageDom.find(".message-author").html(author.username);
      messageDom.find(".message-img").css("background-image","url('"+author.picture_url+"')");
      messageDom.find(".message-content").html(message.message);
      if(isOwner){
        messageDom.find(".message-img").addClass("message-right");
        messageDom.find(".message-author").addClass("message-right");
        messageDom.find(".message-content").addClass("message-content-right");
      }
      else{
        messageDom.find(".message-img").addClass("message-left");
        messageDom.find(".message-author").addClass("message-left");
        messageDom.find(".message-content").addClass("message-content-left");
      }
      container.append(messageDom);
      container.animate({
        scrollTop: messageDom.offset().top+container.scrollTop()
      });

      //user is opening the chat page send the message back to the server to update is_read = true and not need to do anything in callback.
      $.post( "/chat/chatrooms/update_is_read", {chat_id:this.activeChatId}, function(data) {});
    }
    else{
      //load inexisting chat rooms.
      if($("#chat-panel-notification-id-"+message.chatroom).length==0){
        this.loadMoreChat(0, function(){
          // show notification on the chat icon
          $("#incoming-message-notification").show();
          $("#chat-panel-notification-id-"+message.chatroom).show();
        });
      }
      else{
        $("#incoming-message-notification").show();
        $("#chat-panel-notification-id-"+message.chatroom).show();
      }
    }
  }
  , addUserToARoom : function(user_ids, group_name, cb){
    $.post( "/chat/chatrooms/add_users", {chat_id:this.activeChatId, group_name:group_name, users:JSON.stringify(user_ids)}, function(data) {
      if(data.current_user_in_chat){
        chat.currentUsersInACurrentChat=data.current_user_in_chat;
      }
      console.log(data);
      cb(data.chat_id);
    });
  }
  , setActiveChatType : function(chat){
    if(chat.is_group_chat){
      this.activeChatType = this.chatTypes.group;
    }
    else{
      this.activeChatType = this.chatTypes.private;
    }
  }
  , clearLeftChatPanel : function(){
    $("#"+this.chatContainerId).empty();
  }
}

function reconfigureSize(){
  //set contents' height
  $(".left-content").css("height",$(window).height()-$(".left-content").offset().top+"px");
  var chatTop = $(".chat-contents").offset().top
  var wH = $(window).height();
  var leftH = wH-$("#users").offset().top-6;
  $("#users").css("height",leftH+"px");
  $("#chats").css("height",leftH+"px");
  $(".chat-contents").css("height", wH-142+"px");

  //set contents' width
  var rightSpace = $(".container div.row").width()-$(".container .left-content").width()-parseInt($(".container .right-content").css("margin-left").replace("px",""))-10;
  $(".chat-contents").css("width", rightSpace+"px");
  $(".right-content").css("width", rightSpace+"px");
  $(".textarea-chat").css("width", rightSpace-100+"px");
}

var addedUsers={};
$(document).ready(function(){
  chat.setUserContainerId("users");
  chat.setChatContainerId("chats");
  chat.setChatContentId("chat-contents-id");
  chat.loadMoreUser(0);
  chat.loadMoreChat(0, function(){
    if(currentUserLastChatId){
      $("#chat-panel-id-"+currentUserLastChatId).trigger("click", "first_load");
    }
    else{
      if($("#chats .chat").first().length>0){
        $("#chats .chat").first().trigger("click", "first_load");
      }
      else{
        chat.noChats = true;
      }
    }
  });

  var refreshAfterLeftClicked = function(){
    var lastLeftElement = $("#addUserModal .user-modal-left .user").last();
    var leftContainer = $("#addUserModal .user-modal-left");
    if(lastLeftElement.length==0)
      return;
    var lTop = lastLeftElement.offset().top;
    var lH = lastLeftElement.height();
    var lCTop = leftContainer.offset().top
    if(lTop+lH-lCTop<leftContainer.height()){
      leftContainer.css("overflow-y","hidden");
    }

    var lastRightElement = $("#addUserModal .user-modal-right .user").last();
    var rightContainer = $("#addUserModal .user-modal-right");
    var rTop = lastRightElement.offset().top;
    var rH = lastRightElement.height();
    var rCTop = rightContainer.offset().top
    if(rTop+rH-rCTop>rightContainer.height()){
      rightContainer.css("overflow-y","auto");
    }
  };

  var refreshAfterRightClicked = function(){
    var lastLeftElement = $("#addUserModal .user-modal-left .user").last();
    var leftContainer = $("#addUserModal .user-modal-left");
    var lTop = lastLeftElement.offset().top;
    var lH = lastLeftElement.height();
    var lCTop = leftContainer.offset().top
    if(lTop+lH-lCTop>leftContainer.height()){
      leftContainer.css("overflow-y","auto");
    }

    var lastRightElement = $("#addUserModal .user-modal-right .user").last();
    var rightContainer = $("#addUserModal .user-modal-right");
    if(lastRightElement.length==0)
      return;
    var rTop = lastRightElement.offset().top;
    var rH = lastRightElement.height();
    var rCTop = rightContainer.offset().top
    if(rTop+rH-rCTop<rightContainer.height()){
      rightContainer.css("overflow-y","hidden");
    }
  }

  var leftClicked = function(event){
    addedUsers[event.data.contact_user.id] = event.data.contact_user;
    $(this).detach();
    $(this).unbind("click");
    $(this).click(event.data, rightClicked);
    $("#addUserModal .user-modal-right").append($(this));
    setTimeout(function(){
      refreshAfterLeftClicked();
    }, 500);
  }

  var rightClicked = function(event){
    delete addedUsers[event.data.contact_user.id];
    $(this).detach();
    $(this).unbind("click");
    $(this).click(event.data, leftClicked);
    $("#addUserModal .user-modal-left").append($(this));
    setTimeout(function(){
      refreshAfterRightClicked();
    }, 500);
  }

  $('#addUserModal').on('show.bs.modal', function (e) {
    $.post( "/users/forAddToChat", {start:0, current_users:JSON.stringify(chat.currentUsersInACurrentChat)}, function(data) {
      $("#addUserModal .user-modal-left").empty();
      $("#addUserModal .user-modal-right").empty();
      if(chat.activeChatType==chat.chatTypes.group){
        $("#group-name-modal-input").prop('disabled', true);
        $("#group-name-modal-input").val($("#active-chat-room").html().replace(":","").trim());
      }
      var container = $("#addUserModal .user-modal-left")
      , template = $("#template").find("div.user");
      for(var i=0; i<data.length; i++){
        var userTemplate = template.clone();
        userTemplate.click({contact_user: data[i], caller: this}, leftClicked);
        // userTemplate.attr("id", "user-panel-modal-id-"+data[i].id);
        userTemplate.find(".image").css("background-image", 'url("'+data[i].picture_url+'")');
        userTemplate.find(".name").html("<span>"+data[i].username+"</span>");
        container.append(userTemplate);
      }
    });
  });
  $('#addUserModal').on('hidden.bs.modal', function (e) {
    addedUsers = {};
    $("#create-group-message").html("");
    $("#group-name-modal-input").val("")
    $("#group-name-modal-input").prop('disabled', false);;
  });

  $('#save-added-user').click(function(){
    var user_ids = [];
    if(chat.activeChatType!=chat.chatTypes.group){
      for(var i=0;i<chat.currentUsersInACurrentChat.length;i++){
        user_ids.push(parseInt(chat.currentUsersInACurrentChat[i]));
      }
    }
    var count = 0;
    for (var key in addedUsers) {
      user_ids.push(parseInt(addedUsers[key].id));
      count++;
    }
    if($("#group-name-modal-input").val() && count>0){
      chat.addUserToARoom(user_ids, $("#group-name-modal-input").val(), function(chat_id){
        socket.emit('group-chat-created', {chat_id:chat_id});
        chat.clearLeftChatPanel();
        chat.loadMoreChat(0, function(){
          $("#chat-panel-id-"+chat_id).trigger("click");
        });
      });
      $('#addUserModal').modal('hide');
    }
    else{
      $("#create-group-message").html("(Group Name or Selected Users cannot be empty)");
    }
  });

  $("#update-user-picture-submit").click(function(){
    // console.log($("#user-update-picture-url").val());
    $.post( "/users/update_user_picture", {user_picture_url:$("#user-update-picture-url").val()}, function(result) {
      if(result.success){
        $('#current-user-image').attr('src', result.picture_url);
      }
      $('#update-user-picture').modal('hide');
    });
  });
  var leftContentWidthCss = "0px";
  $("#hide-left-content-btn").click(function(){
    var btn = $("#hide-left-content-btn")
    , leftContent = $(".row .left-content");
    if(btn.attr("status")==="hide"){
      leftContentWidth=leftContent.css("width");
      leftContent.css("width","0px")
        .css("display","none");
      btn.html("Show")
        .attr("status", "show")
        .removeClass("glyphicon-chevron-left")
        .addClass("glyphicon-chevron-right");
    }
    else{
      leftContent.css("width", "160px")
        .css("display","block");
      btn.html("Hide")
        .attr("status", "hide")
        .addClass("glyphicon-chevron-left")
        .removeClass("glyphicon-chevron-right");
    }
    reconfigureSize();
  });

  reconfigureSize();
  $(window).resize(function() {
    reconfigureSize();
  });
});

$(function () {
    $('#myTab a:last').tab('show')
})
