//      pintheweb.js
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

var ptw = {

	prefs: null,
	user: "",
	password: "",
	interval: 0,
	saved_locations: {},
	force_refresh: true,
	filter_public: true,
	filter_friends: true,
	
	/*
	 *  Pin a note when click in the status panel
	 */
	pin: function(event)
	{	
		if (event.button != 2 && !this.pin_click_active) {
			this.pin_click_active=true;
			window.top.content.document.removeEventListener("mouseover", ptw.pin_over, true);
			window.top.content.document.removeEventListener("mouseout", ptw.pin_out, true);
			window.top.content.document.removeEventListener("click",ptw.pin_click, true);

			window.top.content.document.addEventListener("click", this.pin_click, true);
			window.top.content.document.addEventListener("mouseover", this.pin_over, true);
			window.top.content.document.addEventListener("mouseout", this.pin_out, true);
		}else if (this.pin_click_active == true) 
			this.pin_click_active=false;
	},
	
	/*
	 *  Click event handler
	 */
	pin_click: function(event) {
		var theNode = event.originalTarget;
		event.stopPropagation();
		event.preventDefault();
		ptw.insert_pin(theNode, '', ptw.user, event.layerX, event.layerY, false );
	},
	
	/* 
	 *  Insert a pin
	 */ 
	insert_pin: function(theNode, theNote, theUser, xposition, yposition, isFriend) {
		if (theUser==ptw.user || ( ptw.filter_public==true && isFriend!='1') || 
			(ptw.filter_friends==true && isFriend=='1') ) {
			currentPlacementNode = top.content.document.createElement("div");
			currentPlacementNode.setAttribute("class", "ptw_pinnote");
			currentPlacementNode.setAttribute("style", "");

			currentPlacementNode.style.zIndex = 999;
			currentPlacementNode.style.position = "static";
			
			var innerNode = top.content.document.createElement("img");
			innerNode.src = "chrome://pintheweb/skin/pin.png";
			var str_click = this.strings.getString("ClickToShowHide");
			innerNode.setAttribute("title", str_click);
			innerNode.style.width = "32px";
			innerNode.style.height = "32px";
			innerNode.style.zIndex = 999;
			innerNode.style.position = "absolute";
			innerNode.style.cursor = "pointer";
			innerNode.style.top=yposition-28+'px';
			innerNode.style.left=xposition-22+'px';
			innerNode.style.opacity = "0.9";
			innerNode.style.cssFloat = "none";
			innerNode.style.clip = "rect("+yposition-28+"px,"+"5px, 5px, "+xposition-22+")";
			innerNode.setAttribute("ptwuser", theUser);
			
			currentPlacementNode.appendChild(innerNode);
			currentPlacementNode.firstChild.addEventListener("click", ptw.show_note, true);
			currentPlacementNode.firstChild.addEventListener("dblclick", ptw.change_pin, true);

			theNode.insertBefore(currentPlacementNode, theNode.firstChild);
			theNode.style.backgroundColor = theNode.originalBackgroundColor;
			theNode.style.cursor="auto";
					
			window.top.content.document.removeEventListener("mouseover", ptw.pin_over, true);
			window.top.content.document.removeEventListener("mouseout", ptw.pin_out, true);
			window.top.content.document.removeEventListener("click", ptw.pin_click, true);
			
			innerNode = top.content.document.createElement("textarea");
			innerNode.setAttribute("class", "ptw_note");
			if (theNote.length>0) {			
				theUserRef=(theUser==ptw.user)?"":theUser+": ";
				innerNode.value=theUserRef+'"'+theNote+'"';
				innerNode.style.border = "1px solid grey";
				innerNode.setAttribute("readonly", "true");				
				innerNode.style.overflow = "hidden";	
			}
			else
			{
				innerNode.value="";
				innerNode.style.border = "1px dotted red";
				innerNode.setAttribute("title", this.strings.getString("PinANote"));
				innerNode.style.overflow = "scroll";
			}
			innerNode.setAttribute("ptwuser", theUser);
			innerNode.style.zIndex = 999;
			innerNode.style.position = "absolute";
			innerNode.style.opacity = "0.75";
			innerNode.style.width = "180px";
			innerNode.style.height = "70px";
			innerNode.style.top=yposition+'px';
			innerNode.style.left=xposition+'px';
			innerNode.style.cssFloat = "none";

			note=currentPlacementNode.appendChild(innerNode);
			note.addEventListener("change", ptw.grab_note, true);
		}
	},
	
	/*
	 * Launch settings
	 */
	settings: function() {
		window.openDialog("chrome://pintheweb/content/settings.xul", "", "chrome,dialog,centerscreen","");
	},
	
	/*
	 * Launch about
	 */ 
	about: function() {
		window.openDialog("chrome://pintheweb/content/about.xul", "", "chrome,dialog,centerscreen","");
	},
		
	/*
	 * set filter
	 */
	set_filter: function(filter) {
		if (filter=='public') {
			ptw.filter_public=(ptw.filter_public)?false:true;
			ptw.refresh();
		}
		else if (filter=='friends') {
			ptw.filter_friends=(ptw.filter_friends)?false:true;
			ptw.refresh();
		}
	},	
	
	/* 
	 * remove a pin
	 */
	remove_pin: function(event) {
		var element = document.popupNode.parentNode;
		if (element.getAttribute('class')=='ptw_pinnote') 
			while(element.hasChildNodes()){
				element.removeChild(element.firstChild);
			}
	},

	/* 
	 * follow user
	 */
	follow_user: function(follow) {
		var element = document.popupNode.parentNode;
		follow=document.popupNode.parentNode.lastChild.getAttribute("ptwuser");
		var httpRequest = null;
		if (ptw.user==follow) {
			alert (this.strings.getString("SameUser"));
			return;
		}	
		var fullUrl = "http://www.pintheweb.com/services/followuser.php?user="+encodeURIComponent(ptw.user)+"&follow="+encodeURIComponent(follow);
		function infoReceived()
		{
			var output = httpRequest.responseText;
			if (output.length)
			{
				alert(ptw.strings.getString(output));//check
			}
		}
			
		httpRequest = new XMLHttpRequest();
			
		httpRequest.open("GET", fullUrl, true);
		httpRequest.onload = infoReceived;
		httpRequest.send(null);
	},
	
	/* 
	 * change the color of a pin
	 * in the future will mean different scope
	 */
	change_pin: function(event) {
		theNode=event.originalTarget;		
		
		if (theNode.src=="chrome://pintheweb/skin/pin.png") {
			theNode.src="chrome://pintheweb/skin/cyanpin.png";
		} else {
			theNode.src="chrome://pintheweb/skin/pin.png";
		}
	},
	
	/* 
	 * expand/unexpand a note
	 */
	show_note: function(event) {
		event.preventDefault();
		event.stopPropagation();

		theNode=event.originalTarget;
		if (event.button==1) 
		{
			theNode.style.cursor='crosshair';
		}else
		{
			theNode.style.cursor='pointer';
		}

		if (theNode.parentNode.lastChild.style.visibility=="hidden") {			
			theNode.parentNode.lastChild.style.visibility="visible"; //lastchild!! mentre no n'hi hagi mes
			//theNode.parentNode.lastChild.style.zIndex = theNode.parentNode.lastChild.style.zIndex - 1;
		}
		else {
			theNode.parentNode.lastChild.style.visibility="hidden"; //mentre no n'hi hagi mes
			//theNode.parentNode.lastChild.style.zIndex = theNode.parentNode.lastChild.style.zIndex + 1;
		}
	},
	
	/*
	 * expand all notes
	 */
	expand_all: function() {
		var pins=this.getElementsByClass('ptw_note',top.content.document,'TEXTAREA');
		for (i=0;i<pins.length;i++)
		{
			pin=pins[i];
			pin.style.visibility = "visible";
		}
	},

	/* 
	 * contract all notes
	 */ 
	contract_all: function() {
		var pins=this.getElementsByClass('ptw_note',top.content.document,'TEXTAREA');
		for (i=0;i<pins.length;i++)
		{
			pin=pins[i];
			pin.style.visibility = "hidden";
		}
	},

	/*
	 * Show all notes
	 */	
	show_all: function() {
		var pins=this.getElementsByClass('ptw_pinnote',top.content.document,'DIV');
		for (i=0;i<pins.length;i++)
		{
			pin=pins[i];
			pin.style.visibility = "visible";
		}
		this.expand_all();
	},
	
	/*
	 * Hide all notes
	 */ 
	hide_all: function() {
		this.contract_all();
		var pins=this.getElementsByClass('ptw_pinnote',top.content.document,'DIV');
		for (i=0;i<pins.length;i++)
		{
			pin=pins[i];
			pin.style.visibility = "hidden";
		}
	},

	/* 
	 * update notes
	 */
	grab_note: function(event) {
		theNode=event.originalTarget;
		theNode.style.border = "1px solid red";
		theNode.style.cursor = 'auto';
		theNode.style.visibility = "hidden";
		
		var httpRequest = null;

		var ptw_settings = {
  			util: new naanExUtils("pintheweb"),  			
  		}
  		ptw.logins=ptw_settings.util.getPassword();
  		ptw.password=ptw.logins[ptw.user];
  		ptw.pwdhash=md5(ptw.password);
  		
		var theNote={ 
		"user" : encodeURIComponent(ptw.user),
		"pwd" : encodeURIComponent(ptw.pwdhash),
		"title" : encodeURIComponent(content.document.title),
		"tags" : encodeURIComponent(""),
		"url" : encodeURIComponent(content.location.href), 
		"positionx" : theNode.style.left, 
		"positiony" : theNode.style.top,
		"note" : encodeURIComponent(theNode.value) };
		
		theNote = YBJSON.stringify(theNote);

		var fullUrl = "http://www.pintheweb.com/services/grabnote.php?note="+theNote;

		function infoReceived()
		{
			var output = httpRequest.responseText;		
			if (output.length)
			{
				alert("Error: "+output);
			}
		}
		
		httpRequest = new XMLHttpRequest();
		
		httpRequest.open("GET", fullUrl, true);
		httpRequest.onload = infoReceived;
		httpRequest.send(null);	
	},

	/* 
	 * mouseover handler
	 */
	pin_over: function(event) {
		var node = event.originalTarget;
		event.stopPropagation();
		event.preventDefault();

    	node.originalBackgroundColor = node.style.backgroundColor;
    	node.style.cursor = 'crosshair';
	},

	/*
	 * mouseout handler
	 */
	pin_out: function(event) {
		var node = event.originalTarget;
		event.stopPropagation();
		event.preventDefault();
		node.style.cursor = 'auto';	
	},

	/*
	 * util: open URL
	 */	
	openURL: function(url) {
		var tabbrowser = gBrowser;
		var tabs = tabbrowser.tabContainer.childNodes;
		for (var i = 0; i < tabs.length; ++i) {
		  var tab = tabs[i];
		  try {
			var browser = tabbrowser.getBrowserForTab(tab);
			if (browser) {
			  var doc = browser.contentDocument;
			  var loc = doc.location.toString();
			  if (loc == url) {
				gBrowser.selectedTab = tab;
				return;
			  }
			}
		  }
		  catch (e) {
		  }
		}

		// There is no tab. open new tab...
		var tab = gBrowser.addTab(url, null, null);
		gBrowser.selectedTab = tab;
	},
	
	/* 
	 * util: get elements by class
	 */ 
	getElementsByClass: function(searchClass,node,tag) {
		var classElements = new Array();
		if ( node == null )
			node = document;
		if ( tag == null )
			tag = '*';
		var els = node.getElementsByTagName(tag);
		var elsLen = els.length;
		var pattern = new RegExp("(^|\\\\s)"+searchClass+"(\\\\s|$)");
		for (i = 0, j = 0; i < elsLen; i++) {
			if ( pattern.test(els[i].className) ) {
				classElements[j] = els[i];
				j++;
			}
		}
		return classElements;
	},
	
	/* 
	 * starting listeners
	 */
	startup: function()
	{
		this.strings = document.getElementById("ptw-strings");

		// Register to receive notifications of preference changes
		this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
				.getService(Components.interfaces.nsIPrefService)
				.getBranch("ptw.");
		this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		this.prefs.addObserver("", this, false);
		// llegim dades actuals
		this.user = this.prefs.getCharPref("currentUser");
		this.interval = this.prefs.getIntPref("interval");
		this.login = this.prefs.getBoolPref("login");
		
		this.last_interval=window.setInterval(this.refresh, this.interval*60*1000);
	},
	
	/*
	 * sets interval
	 */ 
	set_interval: function() 
	{
		window.clearInterval(this.last_interval);
		this.interval = this.prefs.getIntPref("interval");
		this.last_interval=window.setInterval(this.refresh, this.interval*60*1000);
	},
                    
	/*
	 * closing
	 */
	shutdown: function()
	{
		this.prefs.removeObserver("", this);
	},
	
	/*
	 *  Called when events occur on the preferences
	 */
	observe: function(subject, topic, data)
	{
		if (topic != "nsPref:changed")
		{
			return;
		}

		switch(data)
		{
			case "currentUser":
				ptw.user = this.prefs.getCharPref("currentUser");
				this.refresh();
			break;
			
			case "interval":
				this.set_interval();
			break;			
		}
	},

	/*
	 * change the status bar label
	 */
	change_status_label: function(pinCount) 
	{
		if (pinCount==1)
			document.getElementById("pintheweb-statusbar-label").setAttribute("label", pinCount+" pin");
		else if (pinCount==0 || pinCount>1)
			document.getElementById("pintheweb-statusbar-label").setAttribute("label", pinCount+" pins");
		else
			document.getElementById("pintheweb-statusbar-label").setAttribute("label", "· pins");				
	},
	
	/* 
	 * Get pins
	 */
	refresh: function()
	{
		var httpRequest = null;
		var loc=content.location.href;
		if (loc=="about:blank") return;
		var current_tab=gBrowser.mTabContainer.selectedIndex;

		if (ptw.saved_locations[loc+current_tab] && !ptw.force_refresh)
		{			
			// refresh skipped
			ptw.change_status_label(ptw.saved_locations[loc+current_tab].pins);
			return;			
		}
		
		var ptw_settings = {
  			util: new naanExUtils("pintheweb"),  			
  		}
  		ptw.logins=ptw_settings.util.getPassword();
  		ptw.password=ptw.logins[ptw.user];
  		ptw.pwdhash=md5(ptw.password);
		
		var fullUrl = "http://www.pintheweb.com/services/getpins.php?user="+encodeURIComponent(ptw.user)+"&pwd="+encodeURIComponent(ptw.pwdhash)+"&loc="+encodeURIComponent(loc);
		
		function infoReceived()
		{
			var output = httpRequest.responseText;
			if (output.length)
			{
				var data = YBJSON.parse(output);	
				var pin_count=data['total'];
				
				ptw.change_status_label(pin_count);
				current_tab=gBrowser.mTabContainer.selectedIndex;
				ptw.saved_locations[loc+current_tab]={"tab": current_tab, "pins": pin_count};
				var pins=ptw.getElementsByClass('ptw_pinnote',top.content.document,'DIV');
				for (i=0;i<pins.length;i++)
				{
					var remove_pin=pins[i];					
					var remove_node=remove_pin;
					while(remove_node.hasChildNodes()){
						remove_node.removeChild(remove_node.firstChild);
					}
				}
		
				document.getElementById("pintheweb-statusbar-label").setAttribute("state", "active");	
				
				var notes=data['notes'];
				for(i=0;i<notes.length;i++)
				{					
					var theId=notes[i]['id'];
					var theNode=top.content.document.getElementsByTagName('BODY')[0];
					var theNote=notes[i]['note'];
					var thePosX=notes[i]['positionx'];thePosX=thePosX.replace(/px/i, "");
					var thePosY=notes[i]['positiony'];thePosY=thePosY.replace(/px/i, "");
					var theUser=notes[i]['nickname'];
					var isFriend=notes[i]['isfriend'];
					ptw.insert_pin(theNode, theNote, theUser, thePosX, thePosY, isFriend);
				}
			}
		}
		
		httpRequest = new XMLHttpRequest();
		
		httpRequest.open("GET", fullUrl, true);
		httpRequest.onload = infoReceived;
		httpRequest.send(null);

		return true;
	}
	
}

// Install load and unload handlers
window.addEventListener("load", function(e) { ptw.startup();myExtension.init(); }, false);
window.addEventListener("unload", function(e) { ptw.shutdown();myExtension.uninit() }, false);

/* Extensions */
var myExt_urlBarListener = {
	QueryInterface: function(aIID)
	{
		if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
		   aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
		   aIID.equals(Components.interfaces.nsISupports))
		 return this;
		throw Components.results.NS_NOINTERFACE;
	},

	onLocationChange: function(aProgress, aRequest, aURI)
	{
		myExtension.processNewURL(aURI);
	},

	onStateChange: function(aProgress, aRequest, flags, status) {},
	onProgressChange: function(aProgress, aRequest, a ,b ,curMax ,maxMax ) {},
	onStatusChange: function(aProgress, aRequest, aStatus, aMsg) {},
	onSecurityChange: function(aProgress, aRequest, aState) {},
	onLinkIconAvailable: function(aProgress, aRequest, aURI) {}
};

var myExtension = {
	oldURL: null,
  
	init: function() {
		// Listen for webpage loads
		gBrowser.addProgressListener(myExt_urlBarListener,
			Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);
  	},
  
	uninit: function() {
		gBrowser.removeProgressListener(myExt_urlBarListener);

  	},
	processNewURL: function(aURI) {
    	if (aURI.spec == this.oldURL)
      		return;

		this.oldURL = aURI.spec;
		ptw.force_refresh=false;
		ptw.refresh();
		ptw.force_refresh=true;
	}
};
