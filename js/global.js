/**
 * @author Rex
 */

	var socket;
	var myname;
	var onlineNum;
	var isOwner;
	var delay;
	var updateOthers;
	
	var canvas;
	var weight;
	var height;
	var stage;
	var preload;
	var loadingField;
	var loadingInterval;
	var imageResources;
	var cover;
	var newButton;
	var room;
	var startButton;
	var readyButton;
	var playerList;
	var playerListBg;
	var background;
	var me;
	var others;
	var egg;
	var hp;
	var hpField;
	var food;
	var eggBullet;
	var winner;
	var loser
	
	var KEYCODE_SPACE = 32,
		KEYCODE_UP = 38,
		KEYCODE_DOWN = 40,
		KEYCODE_LEFT = 37,
		KEYCODE_RIGHT = 39;
	
	var spaceHeld = spaceFlag = false,
		keyupFlag = true,
		downHeld = downFlag = false,
		upHeld = upFlag = false,
		rightHeld = rightFlag = false,
		leftHeld = leftFlag = false;
	
	var downBoundary = 550,
		upBoundary = 100,
		leftBoundary = 50,
		rightBoundary = 750;
	
	
	
	