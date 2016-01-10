this.Documents = new Mongo.Collection("documents");
EditingUsers = new Mongo.Collection("editingUsers");

if (Meteor.isClient) {

  Template.editor.helpers({
    docid:function(){
      var doc = Documents.findOne();
      if (doc){
        return doc._id;
      }
      else{
        return undefined;
      }
    },
    config:function(){
      return function(editor){
        editor.setOption("lineNumbers", true);
        editor.setOption("mode", "html");
        editor.on("change", function(cm_editor, info){
          $("#viewer_iframe").contents().find("html").html(cm_editor.getValue());
          Meteor.call("addEditingUser");
        });
      };
    }
  });

  Template.editingUsers.helpers({
    users:function(){
      var doc, eusers, users;
      doc = Documents.findOne();
      if (!doc){ return; } // give up
      eusers = EditingUsers.findOne({docid:doc._id});
      if (!eusers){ return; } // give up
      users = new Array();
      var i = 0;
      for(var user_id in eusers.users){
        users[i] = fixObjectKeys(eusers.users[]);
        i++;
      }
      return users;
    }
  });
} // end isClient...

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
    if (!Documents.findOne()){ // no documents yet
      Documents.insert({title: "my new document"});
    }
  });

  Meteor.methods({
    addEditingUser:function(){
      var doc, user, eusers;
      doc = Documents.findOne();
      if (!doc){ return; } // no doc, give up
      if (!this.userId){ return; } // no logged in user, give up
      // now I have a doc and possibly a user
      user = Meteor.user().profile;
      eusers = EditingUsers.findOne({docid:doc._id});
      if (!eusers){
        eusers = {
          docid:doc._id,
          users:{}
        }
      }
      user.lastEdit = new Date();
      eusers.users[this.userId] = user;

      EditingUsers.upsert({_id:eusers._id}, eusers);
    }
  });

  function fixObjectKeys(obj){
    var newObj = {};
    for (key in obj){
      var key2 = key.replace("-", "");
      newObj[key2] = obj[key];
    }
    return newObj;
  };
}
