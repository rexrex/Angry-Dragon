/**
 * @author Rex
 */

	function start(){
		
		stage.removeAllChildren();
		
		background = new Shape();
		var g = background.graphics;
		g.beginBitmapFill(imageResources['background']);
		g.drawRect(0,0,600,600);
		background.x = 100;
		stage.addChild(background);
		
		others = []; //other players' copy 
		if(isOwner) socket.emit('reqInit'); //由房主请求初始化数据，服务器收到消息则广播
		socket.on('recvInitData', function(data){
			var players = data.playersInfo;
			for(var i=0,len=players.length; i<len; i++){
				var playerInfo = players[i];
				var playerSprite = createPlayerSprite(playerInfo.hasEgg);
				if( myname == playerInfo.name ){
					me = createPlayer(playerInfo, playerSprite);
					stage.addChild(me);
				}
				else {
					others.push(createPlayer(playerInfo, playerSprite));
					stage.addChild(others[others.length-1]);
				}
			}
			createLifeValue();
			
			updateOthers = [];
			for(var i=0,len=others.length; i<len; i++) updateOthers[i] = [];
			socket.on('updateRes', handleUpdate);
		});
		socket.on('createBullet', function(){
			if(eggBullet){
				stage.removeChild(eggBullet);
				eggBullet = null;
			}
			var fps = Ticker.getMeasuredFPS();
			socket.emit('created',{fps: fps});
			setTimeout(function(){
				eggBullet = createBullet();
				stage.addChild(eggBullet);
			},delay);
		});
		socket.on('attacked', function(data){
			for(var i=0,len=others.length; i<len; i++){
				if(others[i].name == data.name){
					others[i].hp = data.hp;
					if(others[i].hp <= 0){
						stage.removeChild(others[i]);
						others.splice(i,1);
						onlineNum --;
					}
				}
			}
		});
		socket.on('eggHolderChange', function(data){
			if(me.name == data.who){
				me.hasEgg = true;
			}
			for(var i=0,len=others.length; i<len; i++){
				if(others[i].name == data.who) others[i].hasEgg = true;
				if(data.from && others[i].name == data.from) others[i].hasEgg = false;
			}
		});
		socket.on('gameover', function(data){
			Ticker.setPaused(true);
			if(me.name == data.winner) {
				createWinner();
			}
			else {
				createLoser();
			}
			stage.update();
			socket.emit('gameoverDone');
		});
		socket.on('sbDisc', function(data){ //somebody disconnect
			
			for(var i=0,len=others.length; i<len; i++){
				if(others[i].name == data.name){
					stage.removeChild(others[i]);
					others.splice(i, 1);
				}
			}
			
		});
		
		Ticker.setFPS(60);
		Ticker.useRAF = true;
		Ticker.addListener(window);

	}
	
	function createRoom(){
		room = new Shape();
		var g1 = room.graphics;
		g1.beginBitmapFill(imageResources['room']);
		g1.drawRect(0,0,600,600);
		room.x = 100;
		stage.addChild(room);
	}
	
	function createPlayerList(i, name){
		playerListBg[i] = new Shape();
		var g = playerListBg[i].graphics;
		g.beginBitmapFill(imageResources['playerlist']);
		g.drawRect(0,0,225,97);
		playerListBg[i].x = 150;
		playerListBg[i].y = 170+95*i;
		stage.addChild(playerListBg[i]);
		
		playerList[i] = new Text(name, "bold 20px Arial", "#FFF");
		playerList[i].x = 250;
		playerList[i].y = 230+95*i;
		stage.addChild(playerList[i]);
	}
	
	function createStartButton(isowner){
		if(isowner){
			startButton = new Shape();
			var g1 = startButton.graphics;
			g1.beginBitmapFill(imageResources['start']);
			g1.drawRect(0,0,434,188);
			startButton.x = 475;
			startButton.y = 70;
			startButton.scaleX = 0.6;
			startButton.scaleY = 0.6;
			stage.addChild(startButton);
		}
		else{
			readyButton = new Shape();
			var g2 = readyButton.graphics;
			g2.beginBitmapFill(imageResources['start']);
			g2.drawRect(0,0,434,188);
			readyButton.x = 475;
			readyButton.y = 70;
			readyButton.scaleX = 0.6;
			readyButton.scaleY = 0.6;
			stage.addChild(readyButton);
		}
	}
	
	function createBullet(){
		var bullet = new Shape();
		var g6 = bullet.graphics;
		g6.beginFill("#FFF");
		g6.drawCircle(0,0,3);
		bullet.x = 400;
		bullet.y = 50;
		bullet.speed = 3;
		bullet.hurt = -20;
		
		return bullet;
	}
	
	function createPlayerSprite(hasEgg){
		
		var image = hasEgg ? imageResources['player'] : imageResources['player'];
		var playerSprite = new SpriteSheet({
			images: [image],
			frames: {width:32, height:48, count:16, regX:16, regY:24},
			animations: {
				down:	{	frames:[0,1,2,3],		next:"down",	frequency:4	},
				up:		{	frames:[12,13,14,15],	next:"up",		frequency:4	},
				left:	{	frames:[4,5,6,7],		next:"left",	frequency:4	},
				right:	{	frames:[8,9,10,11],		next:"right",	frequency:4	}
			}
		});
		return playerSprite;
		
	}
	
	function createPlayer(playerInfo, playerSprite){
		
		var player = new BitmapAnimation(playerSprite);
			player.name = playerInfo.name;
			player.x = playerInfo.x;
			player.y = playerInfo.y;
			player.death = false;
			player.hp = 100;
			player.speed = 1;
			player.hasEgg = playerInfo.hasEgg;
			player.direction = -1;
			player.gotoAndPlay('down');
			player.paused = true;
			
		return player;
		
	}
	
	function createLifeValue(){
		
		hpField = new Text("HP", "bold 18px Arial", "#333");
		hpField.textAlign = "center";
		hpField.x = 100;
		hpField.y = height - 20;
		stage.addChild(hpField);
		
		hp = new Shape();
		var g2 = hp.graphics;
		g2.beginFill("#FF0000");
		g2.drawRect(0,0,me.hp*2,18);
		hp.x = 120;
		hp.y = height - 38;
		hp.width = me.hp;
		stage.addChild(hp);
		
	}
	
	function createWinner(){
		winner = new Shape();
		var g = winner.graphics;
		g.beginBitmapFill(imageResources['win']);
		g.drawRect(0,0,292,204);
		winner.x = 254;
		winner.y = 198;
		stage.addChild(winner);
	}
	
	function createLoser(){
		loser = new Shape();
		var g = loser.graphics;
		g.beginBitmapFill(imageResources['lose']);
		g.drawRect(0,0,480,320);
		loser.x = 160;
		loser.y = 140;
		stage.addChild(loser);
	}
	
	
	
	
	
	
	
	
	
