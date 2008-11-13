//		settings.js
//
//      Copyright 2008 Ferran Martínez <soma@soma20.com>
//      
//      This program is free software; you can redistribute it and/or modify
//      it under the terms of the GNU General Public License as published by
//      the Free Software Foundation; either version 2 of the License, or
//      (at your option) any later version.
//      
//      This program is distributed in the hope that it will be useful,
//      but WITHOUT ANY WARRANTY; without even the implied warranty of
//      MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//      GNU General Public License for more details.
//      
//      You should have received a copy of the GNU General Public License
//      along with this program; if not, write to the Free Software
//      Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
//      MA 02110-1301, USA.

const ptw_settings = {

  util: new naanExUtils("pintheweb"),
 
  onLoad: function() {

    var $ = this.util.$;
    this.strings = document.getElementById("ptw-settings-strings");

    this.buildUserPopup();

    Components.classes["@mozilla.org/observer-service;1"]
        .getService(Components.interfaces.nsIObserverService)
        .addObserver(this, "status-bar", false);

    var interval = this.util.pref().getIntPref("interval");
    if (!interval || interval < 3) {
      interval = 3;
    }
   $("refresh-interval").value = interval;
  },

  onUnload: function() {
    Components.classes["@mozilla.org/observer-service;1"]
        .getService(Components.interfaces.nsIObserverService)
          .removeObserver(this, "status-bar");
    try {
      window.opener.ptw._prefWindow = null;
    }
    catch (e) {}
  },

  onAddAccount: function() {
    var prompt = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
    var msg = this.strings.getString("AddAccount");
    var user = {value: ""};
    var pass = {value: ""};
    var result = prompt.promptUsernameAndPassword(window, "Pin the Web", msg, user, pass, "", {value:false});
    if (result) {
      this.util.savePassword(user.value, pass.value);
      this.util.pref().setCharPref("currentUser", user.value);
      this.buildUserPopup();
      this.showMessage(this.strings.getFormattedString("AccountAdded", [user.value]));
    }
    this.accountChanged = true;
  },

  onRemoveAccount: function() {
    var prompt = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
    var user = this.util.$("username").value;
    var msg = this.strings.getFormattedString("RemoveAccountConfirm", [user]);
    var result = prompt.confirm(window, "Pin the Web", msg);
    if (result) {
      this.util.removePassword(user);
      this.buildUserPopup();
      this.showMessage(this.strings.getFormattedString("AccountRemoved", [user]));
    }
    this.accountChanged = true;
  },

  buildUserPopup: function() {
    this.accounts = this.util.getPassword();
    var menu = this.util.$("username");
    while (menu.firstChild) menu.removeChild(menu.firstChild);

    this.util.$("username").value = "";
    this.util.$("password").value = "";

    if (this.accounts == null) {
      this.util.$("username").disabled = true;
      this.util.$("password").disabled = true;
      this.util.$("remove-account-button").disabled = true;
      return;
    }
    else {
      this.util.$("username").disabled = false;
      this.util.$("password").disabled = false;
      this.util.$("remove-account-button").disabled = false;
    }

    var currentUser = this.util.pref().getCharPref("currentUser");
    if (!this.accounts[currentUser]) {
      currentUser = "";
    }

    for (var user in this.accounts) {
      if (this.accounts.hasOwnProperty(user)) {
        menu.appendItem(user, user);
        if (currentUser == "") {
          currentUser = user;
        }
        if (user == currentUser) {
          this.util.$("username").value = user;
          this.util.$("password").value = this.accounts[user];
        }
      }
    }
  },

  showMessage: function(msg) {
    this.util.$("message").value = msg;
  },

  observe: function(subject, topic, data) {
    /* do nothing here */
    return;
  },

  selectionChanged: function(elem) {
    var name = elem.value;

    this.accountChanged = true;
    try {
      if (this.accounts[name]) {
        this.util.$("password").value = this.accounts[name];
      }
    }
    catch (e) {}
  },

  onChange: function(elem) {
    this.accountChanged = true;
  },

  onAccept: function() {
    var $ = this.util.$;

    this.util.pref().setIntPref("interval", $("refresh-interval").value);
  
    this.util.savePassword($("username").value,
                           $("password").value);

    this.util.notify("updatePref");
    
    if (this.accountChanged) {
      this.util.pref().setCharPref("currentUser", $("username").value);
      this.util.notify("changeAccount");
      this.util.pref().setBoolPref("login", true);
    }

    return true;
  },

  onCancel: function() {
    try {
      window.opener.ptw._prefWindow = null;
    }
    catch (e) {}
  }
};

