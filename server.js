/**
 * @author Rex
 */

	var app = require('http').createServer(handler)
	var io = require('socket.io').listen(app);
	var fs = require('fs');
	var url = require('url');
	var path = require('path');
	var mime = require('./type').types;

		app.listen(8000);

	function handler (req, res) {
		
		var pathname = url.parse(req.url).pathname;
		var realpath = __dirname + pathname;
	
		if(pathname == "/") {
			res.writeHead(200, {'Content-Type': "text/plain"});
			res.write("Hello, welcome");
			res.end();
		}
		else {
			var ext = path.extname(pathname);
				ext = ext ? ext.slice(1) : 'unknown';
			var contentType = mime[ext] || "text/plain";
	
			path.exists(realpath, function(exists) {
				if(!exists) {
					res.writeHead(404, {'Content-Type': contentType});
					res.write("This request URL " + realpath + " was not in server.");
					res.end();
				}
				else {
					fs.readFile(realpath, 'binary', function (err, data) {
						if (err) {
							res.writeHead(500, {'Content-Type': contentType});
							res.end(err);
						}
						else {
							res.writeHead(200, {'Content-Type': contentType});
							res.write(data, "binary");
							res.end();
						} 
					});
				}
			});
		}
	}


	var isStart = allRight = false;
	var players = [];
	//var playersNum = [];
	var delay = [];
	var readys = 0;
	var owner;
	var cordinate = [[54,250],[165,374],[317,441],[483,441],[735,374],[746,250]];
	var whoHasEgg;
	var playerWithEggX, playerWithEggY;
	var eggX = 400, eggY = 50, eggSpeed = 3;
	var attackInterval;
	var walkInterval;

	io.sockets.on('connection', function (socket) {
		
		var socketName;
	
		socket.emit('serverAck', {isStart: isStart}); //服务端已连接，发送确认
		socket.on('allRight', function(data){
			if(isStart) return; //防止修改前端脚本的攻击，XSS攻击
			allRight = true;
			owner = players.length==0 ? data.playerName : owner;
			socketName = data.playerName;
			//playersNum.push(players.length);
			var joining = {
				name: data.playerName,
				x: 0,
				y: 0,
				hasEgg: false,
				hp: 100,
				death: false
			};
			players.push(joining);
			socket.join("room");
		});
		
		socket.on('playerInfo', function(){
			if(!allRight) return;
			io.sockets.in("room").emit('playerOnline', {total: players, roomOwner: owner});
		});
		
		socket.on('tryToStart', function(data){
			var name = data.playerName;
			if(name == owner){
				if(players.length >1 && readys == players.length-1) {
					isStart = true;
					init();
					readys = 0;
					socket.emit('start');
					socket.broadcast.to("room").emit('allReady');
				}
				//else socket.emit('is everyone ready?')
			}
		});
		socket.on('ready', function(){
			readys ++;
			socket.emit('ready');
		});
		
		socket.on('checkTimeBegin', function(data){
			socket.emit('checkTimeEnd', {time: data.time});
			socket.on('checkTimeFin', function(data){
				for(var i=0,len=players.length; i<len; i++){
					if(players[i].name == data.name) delay[i] = data.delay;
				}
			});
		});
		
		socket.on('reqInit', function(){
			io.sockets.in("room").emit('recvInitData', {playersInfo: players});
			setTimeout(function(){
				io.sockets.in("room").emit('createBullet');
				socket.on('created', function(data){
					if( attackInterval ) return;
					attackInterval = setInterval(attackPlayer, 1000/(data.fps|0));
				});
			}, 3000);
		});
		
		socket.on('update', function(data){
			socket.broadcast.to("room").emit('updateRes', data);
			for(var i=0,len=players.length; i<len; i++){
				if(players[i].name == data.name) var id = i;
			}
			var s = (1000/(data.fps|0)*delay[id]) | 0;
			var direction = data.direction, speed = data.speed;
			players[id].x = data.x + (direction==2?(-1*s):(direction==3?s:0));
			players[id].y = data.y + (direction==1?(-1*s):(direction==0?s:0));
			players[id].hasEgg = data.hasEgg;
			if(data.hasEgg) {
				whoHasEgg = id;
				playerWithEggX = players[id].x;
				playerWithEggY = players[id].y;
			}
			
			clearInterval(walkInterval);
			if(direction != -1)
				walkInterval = setInterval(walkPlayer, 1000/data.fps, [id,direction,speed]);
		});

		socket.on('eggHolderChange', function(data){
			socket.broadcast.to("room").emit('eggHolderChange', {who:data.to, from:data.from});
			var totalDelay = 0;
			for(var i=0,len=players.length; i<len; i++) totalDelay += delay[i];
			var averageDelay = totalDelay/players.length|0;
			for(var i=0,len=players.length; i<len; i++) {
				if(data.from == players[i].name) var from = i;
				if(data.to == players[i].name) var to = i;
			}
			setTimeout(function(){
				players[from].hasEgg = false;
				players[to].hasEgg = true;
				whoHasEgg = to;
			}, averageDelay);
		});
		
		socket.on('gameoverDone', restart);
		
		socket.on('disconnect', function(){
			for(var i=0; i<players.length; i++){
				if(socketName == players[i].name) players.splice(i,1);
			}
			
			if(isStart) {
				if(players.length <= 1)	checkGameover();
				else io.sockets.in("room").emit('sbDisc', {name: socketName});
			} 
			else {
				if(players.length >= 1) {console.log('enter!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
					owner = players[0].name;
					io.sockets.in("room").emit('playerOnline', {total: players, roomOwner: owner});
				}
				if(players.length == 0) restart();
			}
			
		});
	});


	function init(){
		var num = players.length;
		var pos = [];
			pos = pos.concat(cordinate);
		for(var i=0; i<6; i++){
			var random = (Math.random()*6) | 0;
			var tmp = pos[i];
				pos[i] = pos[random];
				pos[random] = tmp;
		}
		for(var i=0; i<num; i++){
			players[i].x = pos[i][0];
			players[i].y = pos[i][1];
		}
		whoHasEgg = Math.floor(Math.random()*num);
		players[whoHasEgg].hasEgg = true;
		playerWithEggX = players[whoHasEgg].x;
		playerWithEggY = players[whoHasEgg].y;
	}
	
	function walkPlayer(id, direction, speed) {
		if(direction == 0 && players[id].y<downBoundary) {
			players[id].y += speed;
		}
		else if(direction == 1 && players[id].y>upBoundary) {
			players[id].y -= speed;
		}
		else if(direction == 2 && players[id].x>leftBoundary) {
			players[id].x -= speed;
		}
		else if(direction == 3 && players[id].x<rightBoundary) {
			players[id].x += speed;
		}
	}
	
	function attackPlayer(){
		var angle = attack(playerWithEggX, playerWithEggY, eggX, eggY);
		var vX = eggSpeed * angle[0];
		var vY = eggSpeed * angle[1];
		eggX += vX;
		eggY += vY;
		if(distance(eggX, eggY, playerWithEggX, playerWithEggY, 5)){
			players[whoHasEgg].hp -= 20;
			io.sockets.in("room").emit('attacked', {
				name: players[whoHasEgg].name,
				hp: players[whoHasEgg].hp
			});
			clearInterval(attackInterval), attackInterval = null;
			eggX = 400, eggY = 50;
			if( players[whoHasEgg].hp<=0 ) {
				//players.death = true;
				//del(whoHasEgg);
				players[whoHasEgg].hasEgg = false;
				players[whoHasEgg].death = true;
				players.splice(whoHasEgg,1);
				delay.splice(whoHasEgg, 1);
				if( checkGameover() ) return;
				whoHasEgg = Math.random()*players.length | 0;
				players[whoHasEgg].hasEgg = true;
				playerWithEggX = players[whoHasEgg].x;
				playerWithEggY = players[whoHasEgg].y;
				io.sockets.in("room").emit('eggHolderChange', {who: players[whoHasEgg].name});
			}
			
			setTimeout(function(){	io.sockets.in("room").emit('createBullet');	}, 1000);
		}
	}
	
	function checkGameover(){
		if(players.length == 1){
			io.sockets.in("room").emit('gameover', { winner: players[0].name });
			return true;
		}
		if(players.length == 0){
			restart();
			return true;
		}
		return false;
	}
	
	function restart(){
		
		players = [];
		delay = [];
		readys = 0;
		eggX = 400, eggY = 50;
		isStart = allRight = false;
		clearInterval(attackInterval);
		clearInterval(walkInterval);
		
	}
	
	function distance(x1, y1, x2, y2, r){
		var deltaX = x1 - x2;
		var deltaY = y1 - y2;
		var dist = deltaX*deltaX + deltaY*deltaY;
			r = r*r;
		return dist>r ? false : true;
	}
	
	function attack(x1, y1, x2, y2){
		var deltaX = x1 - x2;
		var deltaY = y1 - y2;
		var dist = Math.sqrt(deltaX*deltaX+deltaY*deltaY);
			//dist = dist.toFixed(1);
		var cosAngle = deltaX / dist;
		var sinAngle = deltaY / dist;
		
		return [cosAngle, sinAngle];
	}








