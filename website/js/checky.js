// An example Parse.js Backbone application based on the todo app by
// [Jérôme Gravel-Niquet](http://jgn.me/). This demo uses Parse to persist
// the todo items and provide user authentication and sessions.

$(function() {

  Parse.$ = jQuery;
  window.fbAsyncInit = function() {
        FB.init({
          appId      : '407680106079301',
          xfbml      : true,
          version    : 'v2.3'
        },  {scope: 'publish_actions,manage_pages,publish_pages',
            enable_profile_selector: true});
        FB.login(function(response) {
           if (response.authResponse) {
             console.log('Welcome!  Fetching your information.... ');
             FB.api('/me', function(response) {
               console.log('Good to see you, ' + response.name + '.');
             });
           } else {
             console.log('User cancelled login or did not fully authorize.');
           }
         });
      };

      (function(d, s, id){
         var js, fjs = d.getElementsByTagName(s)[0];
         if (d.getElementById(id)) {return;}
         js = d.createElement(s); js.id = id;
         js.src = "http://connect.facebook.net/en_US/sdk.js";
         fjs.parentNode.insertBefore(js, fjs);
       }(document, 'script', 'facebook-jssdk'));



  // Initialize Parse with your Parse application javascript keys
  Parse.initialize("bbvNJHfvOXZ33SwTCYAq08pqe8MkmgALRI9NZC5f",
                   "ahzUgMB25URDB7V7sUv14mK9wtynAzEsGIkdPv3U");

  // Todo Model
  // ----------

  // Our basic Todo model has `content`, `order`, and `done` attributes.
  var Offer = Parse.Object.extend("Offer", 
  {

  });
  // Todo Collection
  // ---------------

  var OfferList = Parse.Collection.extend({
    model: Offer,
  });

  // Todo Item View
  // --------------

  // The DOM element for a todo item...
  var OfferView = Parse.View.extend({

    //... is a list tag.
    tagName:  "div",
    className: "col s4",

    // Cache the template function for a single item.
    template: _.template($('#item-template').html()),

    // The DOM events specific to an item.
    events: {
         "click .remove-offer" : "clear"
      // "click .toggle"              : "toggleDone",
      // "dblclick label.todo-content" : "edit",
      // "click .todo-destroy"   : "clear",
      // "keypress .edit"      : "updateOnEnter",
      // "blur .edit"          : "close"
    },

    // The OfferView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a Todo and a OfferView in this
    // app, we set a direct reference on the model for convenience.
    initialize: function() {
      _.bindAll(this, 'render', 'close', 'remove');
      this.model.bind('change', this.render);
      this.model.bind('destroy', this.remove);
    },

    // Re-render the contents of the todo item.
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.input = this.$('.edit');
      return this;
    },

    edit: function() {
      $(this.el).addClass("editing");
      this.input.focus();
    },

    // Close the `"editing"` mode, saving changes to the todo.
    close: function() {
      this.model.save({content: this.input.val()});
      $(this.el).removeClass("editing");
    },

    // If you hit `enter`, we're through editing the item.
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    // Remove the item, destroy the model.
    clear: function() {
      this.model.destroy();
    }

  });

  // The Application
  // ---------------

  // The main view that lets a user manage their todo items
  var ManageTodosView = Parse.View.extend({
    // Delegated events for creating new items, and clearing completed ones.
    events: {
         "click #add-offer": "addOffer",
         "click #triggerInput": "triggerInput",
         "change input:file": "selectedFile"
      // "keypress #new-todo":  "createOnEnter",
      // "click #clear-completed": "clearCompleted",
      // "click #toggle-all": "toggleAllComplete",
      // "click .log-out": "logOut",
      // "click ul#filters a": "selectFilter"
    },

    el: ".content",

    // At initialization we bind to the relevant events on the `Todos`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting todos that might be saved to Parse.
    initialize: function() {
      var self = this;

      // _.bindAll(this, 'addOne', 'addAll', 'addSome', 'render', 'toggleAllComplete', 'logOut', 'createOnEnter');

      // Main todo management template
      // Create our collection of Todos
      this.offers = new OfferList;

      // Setup the query for the collection to look for todos from the current user
      this.offers.query = new Parse.Query("Offer");
      this.offers.bind('add',     this.addOne);
      this.offers.bind('all',     this.render);

      // Fetch all the todo items for this user
      this.offers.fetch({success: function () {self.addAll()}});
    },
    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    render: function() {
      $('.addbox').html($('#add-template').html());
      
    },
    triggerInput: function () {
      $("#offer-img").click();
    },
    selectedFile: function () {
      console.log("selectedFile");
      var fileUploadControl = $("#offer-img")[0];
      if (fileUploadControl.files.length > 0) {
            $("#triggerInput").removeClass("hover-img");
            var reader = new FileReader();

            reader.onload = function (e) {
                $('#addImg').attr('src', e.target.result);
            }

            reader.readAsDataURL(fileUploadControl.files[0]);
      }

    },
    addOffer: function()
    {
      var self = this;
      var fileUploadControl = $("#offer-img")[0];
      if (fileUploadControl.files.length > 0) {
              var file = fileUploadControl.files[0];
              var name = "photo.jpg";
              var parseFile = new Parse.File(name, file);
              parseFile.save().then(function() {
                self.title = self.$("#offer-title");
                self.description = self.$("#offer-description");
                var offer;
                offer = self.offers.create({
                  Title: self.title.val(),
                  Description: self.description.val(),
                  Image: parseFile,
                  user:    Parse.User.current()
                }, { success: function() { 
                    console.log(offer);
                    FB.api(
                        "/1611227662447831/feed",
                        "POST",
                        {
                           "caption": offer.get("Title"),
                           "message": offer.get("Description"),
                           "picture": parseFile.url(),
                           "access_token": "CAAFyyGvnpEUBAPPNNuid2lBKtb2EIyrEnKvquEq2DWRQbPEsZBUpjKirQdWrFSmbwEw1S2zPAcziZBH32dQwmC8WTuFMDc0xdxWmEJPS6GWyjL3WCZCTmJspkZA2xdpOGvycxMVgyZCzZAP8KXl4MVM9dZB79PbFOUXmb2zKZA5DAlgZCtJlT1fGqA7bKysD8MIw3GQfuGOJm3jelZApe8zijx"
                        },
                        function (response) {
                          if (response && !response.error) {
                            /* handle the result */
                            $("#triggerInput").addClass("hover-img");
                            $('#addImg').attr('src', 'img/sign-27080_200.png');
                            offer.set("PostID", response.id); console.log(response + ":" + response.id + "offer:" + offer.get("PostID"));
                            offer.save();
                          }
                        });
                  }
                });
                self.title.val(''); // ver essas linhas o que fazem
                self.description.val('');
              }, function(error) {
                // The file either could not be read, or could not be saved to Parse.
         });
      }
    },

    // Add a single todo item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(offer, index) {
      var addRow = index % 3 == 0;
      console.log(index);
      console.log(addRow);
      var row;
      // if (addRow) {
      //   $(".content").append('<div class="row"></div>');
      // }
      var view = new OfferView({model: offer});
      $(view.render().el).insertAfter($(".addbox"));
    },

    // Add all items in the Todos collection at once.
    addAll: function(collection, filter) {
      $(".added").remove();
      this.offers.each(this.addOne);
    }
  });

  
  // The main view for the app
  var AppView = Parse.View.extend({
    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#app"),

    initialize: function() {
      this.render();
    },

    render: function() {
      new ManageTodosView();
      // if (Parse.User.current()) {
      //   new ManageTodosView();
      // } else {
      //   new LogInView();
      // }
    }
  });

  new AppView;
});
