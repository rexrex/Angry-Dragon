/**
 * @author Rex
 */

	function tick(){
		
		if(!me.death){	
			
			if(downHeld){
				if( !downFlag ){
					me.direction = 0;
					me.gotoAndPlay("down");
					me.paused = false;
					downFlag = true;
					stateSync();
				}
				if(me.y<downBoundary) me.y += me.speed;
				
			} else if(upHeld){
				if( !upFlag ){
					me.direction = 1;
					me.gotoAndPlay("up");
					me.paused = false;
					upFlag = true;
					stateSync();
				}
				if(me.y>upBoundary) me.y -= me.speed;
				
			} else if(leftHeld){
				if( !leftFlag ){
					me.direction = 2;
					me.gotoAndPlay("left");
					me.paused = false;
					leftFlag = true;
					stateSync();
				}
				if(me.x>leftBoundary) me.x -= me.speed;
				
			} else if(rightHeld){
				if( !rightFlag ){
					me.direction = 3;
					me.gotoAndPlay("right");
					me.paused = false;
					rightFlag = true;
					stateSync();
				}
				if(me.x<rightBoundary) me.x += me.speed;
				
			} else {
				if( keyupFlag ){
					me.direction = -1;
					me.paused = true;
					stateSync();
					keyupFlag = false;
				}
			}
			
			if( me.hasEgg && spaceHeld ){ 
				if( !spaceFlag ){
					spaceFlag = true;
					var min = 1000;
					var index;
					for(var i=0,len=others.length; i<len; i++){
						var d = distance(others[i].x, others[i].y, me.x, me.y);
						if(min>d) min = d, index = i;
					}
					if(min < 100) {
						setTimeout(function(){me.hasEgg = false;others[index].hasEgg = true; spaceFlag = false;}, delay*2);
						socket.emit('eggHolderChange', {from: me.name, to: others[index].name});
					}
					spaceHeld = false;
				}
			}
						
			if(me.hasEgg && eggBullet){
				
				var angle = attack(me.x, me.y, eggBullet.x, eggBullet.y);
				var vX = eggBullet.speed * angle[0];
				var vY = eggBullet.speed * angle[1];
				eggBullet.x += vX;
				eggBullet.y += vY;
				
				if(distance(eggBullet.x, eggBullet.y, me.x, me.y, 5)){
					hp.width = me.hp;
					me.hp += eggBullet.hurt;
					hp.scaleX *= me.hp/hp.width;
					stage.removeChild(eggBullet);
					eggBullet = null;
					if( me.hp<=0 ) {
						me.death = true;
						stage.removeChild(me);
					}
				}
			}
		}
		
		
		for(var i=0,len=others.length; i<len; i++){
			var one = others[i];
			if(one.direction == 0) {
				one.gotoAndPlay('down');
				one.paused = false;
				one.direction = 4;
			}
			else if(one.direction == 1) {
				one.gotoAndPlay('up');
				one.paused = false;
				one.direction = 5;
			}
			else if(one.direction == 2) {
				one.gotoAndPlay('left');
				one.paused = false;
				one.direction = 6;
			}
			else if(one.direction == 3) {
				one.gotoAndPlay('right');
				one.paused = false;
				one.direction = 7;
			}
			else if(one.direction == -1) {
				one.paused = true;
			}
			if(one.direction == 4) {
				if(one.y<downBoundary) one.y += one.speed;
			}
			else if(one.direction == 5) {
				if(one.y>upBoundary) one.y -= one.speed;
			}
			else if(one.direction == 6) {
				if(one.x>leftBoundary) one.x -= one.speed;
			}
			else if(one.direction == 7) {
				if(one.x<rightBoundary) one.x += one.speed;
			}
			
			if( one.hasEgg && eggBullet ){
				var angle = attack(one.x, one.y, eggBullet.x, eggBullet.y);
				var vX = eggBullet.speed * angle[0];
				var vY = eggBullet.speed * angle[1];
				eggBullet.x += vX;
				eggBullet.y += vY;
				
				if(distance(eggBullet.x, eggBullet.y, one.x, one.y, 5)){
					//hp.width = me.hp;
					//me.hp += eggBullet.hurt;
					//hp.scaleX *= me.hp/hp.width;
					stage.removeChild(eggBullet);
					eggBullet = null;
					
				}
			}
		}
			
		stage.update();
		
	}
	
	function distance(x1, y1, x2, y2, r){
		var deltaX = x1 - x2;
		var deltaY = y1 - y2;
		var dist = deltaX*deltaX + deltaY*deltaY;
		if(!r) return Math.sqrt(dist);
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

	function handleUpdate(data){
		for(var i=0,len=others.length; i<len; i++){
			if(data.name == others[i].name){
				others[i].direction = data.direction;
				others[i].speed = data.speed;
			}
		}
	}
	
	function stateSync() {
		var fps = Ticker.getMeasuredFPS();
		var packet = {
			name: myname,
			x: me.x,
			y: me.y,
			speed: me.speed,
			direction: me.direction,
			hasEgg: me.hasEgg,
			hp: me.hp,
			fps: fps
		};
		socket.emit('update', packet);
	}













