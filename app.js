// App that listens to when users join the minecraft server

var express = require('express');
var apn = require('apn');
var request = require('request');
var Firebase = require('firebase');
var app = express();

var ref = new Firebase('https://notifyapp.firebaseIO.com');
//ref.push({deviceID: 'cda6d2396b4506e2880e16b519b66b935134d7bdb66c41a6b8b21a29eef24d2e'})
//ref.child('-JkMmnQeENZBBZxDhwh2').child('subscriptions').push({'url':'localhost'})

// Push Notification settings

var options = { 
  gateway:"gateway.sandbox.push.apple.com"
};

var apnConnection = new apn.Connection(options);
var devices = []

ref.child('users').once('value', function(s) {
  var data = s.val();
  for (i in data) {
    var user = data[i];
    devices.push(new apn.Device(user.deviceID));
  }
  // sendMessage('Next Mine: yay, it works!');
});

function sendMessage(message, device) {
  console.log('message sent')
  var note = new apn.Notification();

  note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
  note.badge = 0;
  note.sound = "default";
  note.alert = message;
  note.payload = {'messageFrom': 'notify'};
  apnConnection.pushNotification(note, device);
}

var scanMessages = function() {
  console.log('Probing servers');

  ref.child('users').once('value', function(s) {
    var data = s.val();
    for (i in data) {
      var user = data[i];
      var subscriptions = user.subscriptions;
      for (j in subscriptions) {
        var subscription = subscriptions[j];
        (function(s, uid, sid, did) {
          var s = s;
          var userID = uid;
          var subscriptionID = sid;
          var deviceID = did;
          if (s.url.indexOf('http') != 0) {
            reqURL = "http://" + s.url;
          } else {
            reqURL = s.url;
          }
          request(reqURL function(error, response, json){
            if (!error) {
              message = JSON.parse(json).message
              if (s.lastMessage != message) {
                ref.child('users/' + userID + '/subscriptions/' + subscriptionID).update({ lastMessage : message });
                sendMessage(message, new apn.Device(deviceID));
                console.log('Sending Message: ', message )
              }
            } else {
              console.log(error);
            }
          });
        }(subscription, i, j, user.deviceID));
      }
    }
  });
}

// scanMessages();
setInterval(scanMessages, 5000);

