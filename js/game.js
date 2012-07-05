/**
 * @author Rex
 */

	
	document.onkeydown = handleKeydown;
	document.onkeyup = handleKeyup;
	
	function gameInit(){
		
		var manifest = [
			{id:"background", src:"./images/background.png"},
			{id:"cover", src:"./images/cover.png"},
			{id:"egg", src:"./images/egg.png"},
			{id:"lose", src:"./images/lose.png"},
			{id:"new", src:"./images/new.png"},
			{id:"player", src:"./images/player.png"},
			{id:"playerlist", src:"./images/playerlist.png"},
			{id:"room", src:"./images/room.png"},
			{id:"start", src:"./images/start.png"},
			{id:"win", src:"./images/win.png"}
		];
		imageResources = {};
		
		preload = new PreloadJS();
		preload.onFileLoad = handleFileLoad;
		preload.onComplete = doneLoading;
		preload.loadManifest(manifest);
		
		canvas = document.getElementById('mycanvas');
		width = canvas.width;
		height = canvas.height;
		stage = new Stage(canvas);
		loadingField = new Text("Loading", "bold 24px Arial", "#333333");
		loadingField.maxWidth = 800;
		loadingField.textAlign = "center";
		loadingField.x = width / 2;
		loadingField.y = height / 2;
		stage.addChild(loadingField);
		stage.update();
		
		loadingInterval = setInterval(updateLoading, 100);
		
	}
	
	function updateLoading(){
		loadingField.text = "Loading " + (preload.progress*100|0) + " %";
		stage.update();
	}
	function handleFileLoad(event){
		imageResources[event.id] = new Image();
		imageResources[event.id].src = event.src;
	}
	function doneLoading(){
		updateLoading();
		clearInterval(loadingInterval);
		stage.removeChild(loadingField);
		stage.update();
		preStart1();
		//start();
	}
	
	function preStart1(){
		
		cover = new Shape();
		var g1 = cover.graphics;
		g1.beginBitmapFill(imageResources['cover']);
		g1.drawRect(0,0,600,600);
		cover.x = 80;
		stage.addChild(cover);
		
		newButton = new Shape();
		var g2 = newButton.graphics;
		g2.beginBitmapFill(imageResources['new']);
		g2.drawRect(0,0,434,188);
		newButton.x = 475;
		newButton.y = 70;
		newButton.scaleX = 0.6;
		newButton.scaleY = 0.6;
		stage.addChild(newButton);
		
		stage.update();
		
		canvas.onclick = handleNewButtonClick;
		canvas.onmouseover = handleNewButtonOver;
		
	}
	
	function handleNewButtonOver(e){
		e = e || window.event;
		cursorX = e.clientX - this.offsetLeft;
		cursorY = e.clientY - this.offsetTop;
		if(cursorX>475 && cursorX<475+434*0.6 && cursorY>70 && cursorY<70+188*0.6){
			canvas.style.cursor = "point";
		}
		else {
			canvas.style.cursor = "";
		}
	}
	function handleNewButtonClick(e){
		e = e || window.event;
		cursorX = e.clientX - this.offsetLeft;
		cursorY = e.clientY - this.offsetTop;
		if(cursorX>475 && cursorX<475+434*0.6 && cursorY>70 && cursorY<70+188*0.6){
			myname = document.getElementById("myname").value;
			if(myname != ""){
				socket = io.connect('http://localhost:8000/');
				socket.on('serverAck', function(data){
					if(data.isStart) {
						socket=undefined;
						alert("The room is starting!");
						return;
					}
					canvas.onclick = null;
					canvas.onmouseover = null;
					preStart2();
				});
			}
		}
	}
	
	function preStart2(){
		
		socket.emit('allRight',{playerName: myname});
		
		stage.removeAllChildren();
		stage.update();
		
		socket.emit('playerInfo');
		socket.on('playerOnline', function(data){
			var total = data.total;
			var owner = data.roomOwner;
				isOwner = owner==myname ? true : false;
			createRoom();
			createStartButton(isOwner);
			
			playerList = [];
			playerListBg = [];
			onlineNum = total.length;
			for(var i=0; i<onlineNum; i++){	
				createPlayerList(i, total[i].name);
				stage.update();
			}
		});
		
		stage.update();
		
		canvas.onclick = handleStartButtonClick;
		canvas.onmouseover = handleStartButtonOver;
		
	}
	
	function handleStartButtonOver(e){
		
	}
	function handleStartButtonClick(e){
		e = e || window.event;
		cursorX = e.clientX - this.offsetLeft;
		cursorY = e.clientY - this.offsetTop;
		if(cursorX>475 && cursorX<475+434*0.6 && cursorY>70 && cursorY<70+188*0.6){
			if(isOwner) {
				socket.emit('tryToStart', {playerName: myname});
				socket.on('start',function(){
					canvas.onclick = null;
					canvas.onmousemove = null;
					checkTime();
				});
			}
			else {
				socket.emit('ready');
				socket.on('ready',function(){
					stage.removeChild(readyButton);
					stage.update();
					canvas.onclick = null;
					canvas.onmousemove = null;
					socket.on('allReady',function(){
						checkTime();
					});
				});
			}
		}
	}
	
	function checkTime(){
		socket.emit('checkTimeBegin',{time: +new Date()});
		socket.on('checkTimeEnd', function(data){
			var now = +new Date();
			delay = (now - data.time) / 2;
			socket.emit('checkTimeFin', {name: myname, delay: delay});
			start();
		});
	}
	
	function handleKeydown(e){
		e = e || window.event;
		switch (e.keyCode){
			case KEYCODE_SPACE: spaceHeld = true; return false;
			case KEYCODE_UP: upHeld = true; downHeld=leftHeld=rightHeld=false; return false;
			case KEYCODE_DOWN: downHeld = true; upHeld=leftHeld=rightHeld=false; return false;
			case KEYCODE_LEFT: leftHeld = true; upHeld=downHeld=rightHeld=false; return false;
			case KEYCODE_RIGHT: rightHeld = true; upHeld=downHeld=leftHeld=false; return false;
		}
	}
	
	function handleKeyup(e){
		e = e || window.event;
		keyupFlag = true;
		switch (e.keyCode){
			case KEYCODE_SPACE: spaceHeld = false; return false;
			case KEYCODE_UP: upHeld = false, upFlag = false; return false;
			case KEYCODE_DOWN: downHeld = false, downFlag = false; return false;
			case KEYCODE_LEFT: leftHeld = false, leftFlag = false; return false;
			case KEYCODE_RIGHT: rightHeld = false, rightFlag = false; return false;
		}
	}









