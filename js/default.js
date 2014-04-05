// Browser Shamsteroids
(function () {
    "use strict";
    //WinJS.Binding.optimizeBindingReferences = true;

    //#region Constants

    var FIREBALLSPEED = 3;              //pixels to move per frame refresh
    var ASTEROIDSPEED = 1;              //pixels to move per frame refresh
    var SHAMSTERLATERALSPEED = 50;      //pixels to move per frame refresh
    var SHAMSTERVERTICALSPEED = 40;     //pixels to move per frame refresh
    var BACKGROUNDSPEED = 0.25;         //pixels to move per frame refresh
    var ASTEROIDHITBONUS = 25;          //points added to score when asteroid is hit
    var ASTEROIDGENERATIONRATE = 50;    //frames between each asteroid generation
    var NUMBEROFLIVES = 1;              //number of lives player starts with
    var LEVELUPTHRESHOLD = 50;        	//points needed to reach next level
	
	var KEYCODEUPARROW = 38;
	var KEYCODEDOWNARROW = 40;
	var KEYCODERIGHTARROW = 39;
	var KEYCODELEFTARROW = 37;
	var KEYCODESPACEBAR = 32;
	var KEYCODEESCAPE = 27;
	
    //#endregion


    //#region Local Variables

    var gameCanvas, context, stage;
    var backgroundOffset = 0;
    var margin = 10;
    var preload, stage;

    var shamsterImage, shamsterBitmap;
    var backgroundImage, backgroundBitmap;
    var scrollBackgroundImage, scrollBackgroundBitmap;
    var fireballImage, fireballBitmap;
    var asteroidImage, asteroidBitmap;
    var rockyAsteroidImage, rockyAsteroidBitmap;

    var shamsterExplosionImage = new Image();
    var shamsterExplosionSpritesheet;
    var shamsterExplosionSpritesheetData;
    var shamsterExplosionBitmapAnimation;

    var asteroidExplosionImage = new Image();
    var asteroidExplosionSpritesheet;
    var asteroidExplosionSpritesheetData;
    var asteroidExplosionBitmapAnimation;

    var fireballArray = new Array();
    var asteroidArray = new Array();

    var level = 1;
    var levelScreenText;
    var levelScreenTextValue;
    var score = 0;
    var scoreScreenText;
    var scoreScreenTextValue;
    var lives = NUMBEROFLIVES + 0;
    var livesScreenText;
    var livesScreenTextValue;
    var asteroidGenerationCounter = 0;
    var isShamsterDead = false;
    var isGameOver = false;
    var currentAsteroidSpeed = ASTEROIDSPEED + 0;
    var currentAsteroidGenerationRate = ASTEROIDGENERATIONRATE + 0;

    //#endregion

    //#region Initialization

    function initialize() {
        //Initialize Canvas
        gameCanvas = document.getElementById("gameCanvas");
        gameCanvas.width = window.innerWidth;
        gameCanvas.height = window.innerHeight;
        context = gameCanvas.getContext("2d");
        
        //Add Event Listeners to canvas
        //window.addEventListener("MSPointerDown", pointerDownHandler, false);
        window.onkeydown = keyDownHandler;

        //EaselJS Stage to manage the canvas
        stage = new createjs.Stage(gameCanvas);

        //Set initial score, level, and lives
        scoreScreenTextValue = new createjs.Text("Score: " + score, "20px sans-serif", "white");
        levelScreenTextValue = new createjs.Text("Level: " + level, "20px sans-serif", "white");
        livesScreenTextValue = new createjs.Text("Lives: " + lives, "20px sans-serif", "white");

        //Preload Images
        preload = new createjs.LoadQueue();
        preload.onComplete = prepareGame;
        var manifest = [
            { id: "shamsterImage", src: "images/ShamsterInJetSmall.png" },
            { id: "backgroundImage", src: "images/Galaxy13.jpg" },
            { id: "gameOverBackgroundImage", src: "images/Galaxy1.jpg" },
            { id: "asteroidImage", src: "images/asteroidSmall.png" },
            { id: "rockyAsteroidImage", src: "images/rockyAsteroidSmall.png" },
            { id: "fireballOne", src: "images/fireball1small.png" },
            { id: "shamsterExplosionSpritesheet", src: "images/Explosion1spritesheet.png" },
            { id: "asteroidExplosionSpritesheet", src: "images/Explosion1SpritesheetSmall.png" }
        ];
        preload.loadManifest(manifest);
		
    }

    function prepareGame() {
        //Draw Background
        backgroundImage = preload.getResult("backgroundImage");
        backgroundBitmap = new createjs.Bitmap(backgroundImage);
        stage.addChild(backgroundBitmap);
        
        //Draw Second Background for side scroll
        scrollBackgroundImage = preload.getResult("backgroundImage");
        scrollBackgroundBitmap = new createjs.Bitmap(scrollBackgroundImage);
        scrollBackgroundBitmap.x = backgroundImage.width;
        stage.addChild(scrollBackgroundBitmap);

        //Draw Shamster
        shamsterImage = preload.getResult("shamsterImage");
        shamsterBitmap = new createjs.Bitmap(shamsterImage);
        shamsterBitmap.x = margin;
        shamsterBitmap.y = gameCanvas.height / 2 - shamsterImage.height / 2;
        stage.addChild(shamsterBitmap);

        //Add Lives Left
        livesScreenText = livesScreenTextValue;
        livesScreenText.x = margin;
        livesScreenText.y = margin;
        stage.addChild(livesScreenText);

        //Add Level
        levelScreenText = levelScreenTextValue;
        levelScreenText.x = gameCanvas.width / 2 - levelScreenText.getMeasuredWidth() / 2;
        levelScreenText.y = margin;
        stage.addChild(levelScreenText);

        //Add Score
        scoreScreenText = scoreScreenTextValue;
        scoreScreenText.x = gameCanvas.width - margin - scoreScreenText.getMeasuredWidth();
        scoreScreenText.y = margin;
        stage.addChild(scoreScreenText);
        
        //Initialize Shamster Explosion image, spritesheet, and bitmap sequence
        shamsterExplosionImage = preload.getResult("shamsterExplosionSpritesheet");
        shamsterExplosionSpritesheetData = {
            images: [shamsterExplosionImage],
            frames: { width: 256, height: 256, count: 48 },
            animations: { explode: [0, 47, false, 1] } //setting 3rd param to false stops animation from looping
        }
        shamsterExplosionSpritesheet = new createjs.SpriteSheet(shamsterExplosionSpritesheetData);
        shamsterExplosionBitmapAnimation = new createjs.BitmapAnimation(shamsterExplosionSpritesheet);
        shamsterExplosionBitmapAnimation.speed = 1;
        shamsterExplosionBitmapAnimation.currentFrame = 0;

        //Initialize Asteroid Explosion image, spritesheet, and bitmap sequence
        asteroidExplosionImage = preload.getResult("asteroidExplosionSpritesheet");
        asteroidExplosionSpritesheetData = {
            images: [asteroidExplosionImage],
            frames: { width: 64, height: 64, count: 48 },
            animations: { explode: [0, 47, false, 2] } //setting 3rd param to false stops animation from looping
        }
        asteroidExplosionSpritesheet = new createjs.SpriteSheet(asteroidExplosionSpritesheetData);
        asteroidExplosionBitmapAnimation = new createjs.BitmapAnimation(asteroidExplosionSpritesheet);
        asteroidExplosionBitmapAnimation.speed = 1;
        asteroidExplosionBitmapAnimation.currentFrame = 0;
        
        //Update the UI and start the game
        stage.update();
        startGame();
    }

    //#endregion

    //#region Methods

    function startGame() {
        createjs.Ticker.setInterval(window.requestAnimationFrame);
        createjs.Ticker.addListener(gameLoop);        
    }
    
    function gameLoop() {
        slideBackground();
        update();
        draw();
    }

    function update() {
        //Move asteroids and fireballs
        asteroidArray.forEach(moveAsteroid);
        fireballArray.forEach(moveFireball);

        //Check if Shamster is dead
        if (!isShamsterDead) {
            //Update asteroid generation counter and check if asteroid should be generated
            asteroidGenerationCounter++;
            if (asteroidGenerationCounter >= currentAsteroidGenerationRate) {
                asteroidGenerationCounter = 0;
                generateAsteroid();
            }
        } else {
            //Wait until asteroids clear out before reviving Shamster
            if (asteroidArray.length === 0) {
                reviveShamster();
            }
        }
    }

    function draw() {
        stage.update();
    }

    function slideBackground() {
        backgroundBitmap.x = backgroundOffset;
        scrollBackgroundBitmap.x = backgroundOffset + backgroundImage.width;
        if (Math.abs(backgroundOffset) > backgroundImage.width) {
            backgroundOffset = 0;
        } else {
            backgroundOffset -= BACKGROUNDSPEED;
        }
    }

    function fireShot() {
        //Create and Draw fireball
        fireballImage = preload.getResult("fireballOne");
        fireballBitmap = new createjs.Bitmap(fireballImage);
        fireballBitmap.x = shamsterBitmap.x + shamsterImage.width;
        fireballBitmap.y = shamsterBitmap.y + shamsterImage.height / 2 - fireballImage.height / 2;
        fireballArray.push(fireballBitmap);
        stage.addChild(fireballBitmap);
        stage.update();
    }
    
    function moveFireball(fireball, index, array) {
        fireball.x += FIREBALLSPEED;
        
        if (fireball.x > gameCanvas.width) {
            array.splice(index, 1);
            stage.removeChild(fireball);
        } else {
            for (var i = 0; i < asteroidArray.length; i++) {
                checkFireballHit(fireball, asteroidArray[i], index, i);
            }
        }
    }

    function checkFireballHit(fireball, asteroid, fireballIndex, asteroidIndex) {
        if (asteroid.x <= fireball.x + fireballImage.width / 2 //cheat a lit bit to make it look better when rendering
            && asteroid.x + asteroidImage.width >= fireball.x
            && asteroid.y <= fireball.y + fireballImage.height
            && asteroid.y + asteroidImage.height >= fireball.y) { 
            processFireballHit(fireball, asteroid, fireballIndex, asteroidIndex);
        }
    }

    function processFireballHit(fireball, asteroid, fireballIndex, asteroidIndex) {
        if (!asteroid.isRocky) {
            //Show Explosion
            asteroidExplosionBitmapAnimation.x = asteroid.x - 5; //cheat left to center on asteroid
            asteroidExplosionBitmapAnimation.y = asteroid.y - 5; //cheat up to center on asteroid
            asteroidExplosionBitmapAnimation.gotoAndPlay("explode");
            stage.addChild(asteroidExplosionBitmapAnimation);

            //Remove asteroid
            stage.removeChild(asteroid);
            asteroidArray.splice(asteroidIndex, 1);

            updateScore(ASTEROIDHITBONUS);
        }
        //Remove fireball
        stage.removeChild(fireball);
        fireballArray.splice(fireballIndex, 1);
                
        stage.update();
    }

    function generateAsteroid() {
        //Create and draw asteroid
        var rand = Math.floor((Math.random() * 4));
        if (rand !== 1) {
            //Destroyable asteroid
            asteroidImage = preload.getResult("asteroidImage");
            asteroidBitmap = new createjs.Bitmap(asteroidImage);
            asteroidBitmap.x = gameCanvas.width - asteroidImage.width;
            asteroidBitmap.y = getRandomYvalue();
            asteroidBitmap.isRocky = false;
            asteroidArray.push(asteroidBitmap);
            stage.addChild(asteroidBitmap);
        } else {
            //Indestructible asteroid
            rockyAsteroidImage = preload.getResult("rockyAsteroidImage");
            rockyAsteroidBitmap = new createjs.Bitmap(rockyAsteroidImage);
            rockyAsteroidBitmap.x = gameCanvas.width - rockyAsteroidImage.width;
            rockyAsteroidBitmap.y = getRandomYvalue();
            rockyAsteroidBitmap.isRocky = true;
            asteroidArray.push(rockyAsteroidBitmap);
            stage.addChild(rockyAsteroidBitmap);
        }
        stage.update();
    }

    function moveAsteroid(asteroid, index, array) {
        asteroid.x -= currentAsteroidSpeed;
        if ((!asteroid.isRocky && asteroid.x <= 0 - asteroidImage.width)
            || (asteroid.isRocky && asteroid.x <= 0 - rockyAsteroidImage.width)) {
            array.splice(index, 1);
            stage.removeChild(asteroid);
        } else if (!isShamsterDead) {
            checkAsteroidHit(asteroid, index);
        }
    }

    function checkAsteroidHit(asteroid, asteroidIndex) {
        if (!asteroid.isRocky) {
            if (asteroid.x <= shamsterBitmap.x + shamsterImage.width - 10 //cheat a little bit to make it look better when rendering
                && asteroid.x + asteroidImage.width >= shamsterBitmap.x
                && asteroid.y <= shamsterBitmap.y + shamsterImage.height
                && asteroid.y + asteroidImage.height >= shamsterBitmap.y) {
                processAsteroidHit(asteroid, asteroidIndex);
            }
        } else {
            if (asteroid.x <= shamsterBitmap.x + shamsterImage.width - 10 //cheat a little bit to make it look better when rendering
                && asteroid.x + rockyAsteroidImage.width >= shamsterBitmap.x
                && asteroid.y <= shamsterBitmap.y + shamsterImage.height
                && asteroid.y + rockyAsteroidImage.height >= shamsterBitmap.y) {
                processAsteroidHit(asteroid, asteroidIndex);
            }
        }
    }

    function processAsteroidHit(asteroid, asteroidIndex) {
        //Show Explosion
        shamsterExplosionBitmapAnimation.x = shamsterBitmap.x + 0;
        shamsterExplosionBitmapAnimation.y = shamsterBitmap.y - 50; //cheat up to center on Shamjet
        shamsterExplosionBitmapAnimation.gotoAndPlay("explode");
        stage.addChild(shamsterExplosionBitmapAnimation);

        //Remove Asteroid and Shamster
        stage.removeChild(asteroid);
        asteroidArray.splice(asteroidIndex, 1);
        stage.removeChild(shamsterBitmap);

        //Handle Shamster's Demise
        processShamstersDeath();

        stage.update();
    }

    function processShamstersDeath() {
        //Update lives text
        lives--;
        livesScreenTextValue.text = "Lives: " + lives;

        //Set dead flag to true
        isShamsterDead = true;

        if (lives <= 0) {
            processGameOver();
        } 
    }

    function reviveShamster() {
        shamsterBitmap.x = margin;
        shamsterBitmap.y = gameCanvas.height / 2 - shamsterImage.height / 2;
        shamsterBitmap.skewX = 90;
        shamsterBitmap.setTransform(shamsterBitmap.x, shamsterBitmap.y, 1, 1, shamsterBitmap.rotation, 0, shamsterBitmap.skewY, shamsterBitmap.regX, shamsterBitmap.regX);
        isShamsterDead = false;
        stage.addChild(shamsterBitmap);
    }

    function updateScore(pointsToAdd) {
        //Update score screen text
        score += pointsToAdd;
        scoreScreenTextValue.text = "Score: " + score;
        scoreScreenText.x = gameCanvas.width - margin - scoreScreenText.getMeasuredWidth();

        //Check if player leveled up
        if (score % LEVELUPTHRESHOLD === 0) {
            updateLevel();
        }
    }

    function updateLevel() {
        //Update level screen text
        level++;
        levelScreenTextValue.text = "Level: " + level;
        
        //Increase game difficulty
        currentAsteroidSpeed += 0.25;       //Speed up asteroids
        currentAsteroidGenerationRate -= 1; //Decrease time between asteroid generation
    }

    function getRandomYvalue() {
        return Math.floor((Math.random() * gameCanvas.height) + 1);
    }

    function processGameOver() {
        isGameOver = true;

        stage.removeAllChildren();
        asteroidArray.splice(0, asteroidArray.length - 1);
        fireballArray.splice(0, fireballArray.length - 1);

        //Show Game Over screen and give option to try again
        var gameOverBackgroundBitmap = new createjs.Bitmap(preload.getResult("gameOverBackgroundImage"));
        gameOverBackgroundBitmap.x = 0;
        gameOverBackgroundBitmap.y = 0;
        stage.addChild(gameOverBackgroundBitmap);

        var gameOverLevelScreenText = new createjs.Text("Level: " + level, "20px sans-serif", "white");
        gameOverLevelScreenText.x = gameCanvas.width / 2 - gameOverLevelScreenText.getMeasuredWidth() / 2;
        gameOverLevelScreenText.y = gameCanvas.height / 2 - 200 - gameOverLevelScreenText.getMeasuredHeight();
        stage.addChild(gameOverLevelScreenText);

        var gameOverScreenText = new createjs.Text("GAME OVER", "48px sans-serif", "red");
        gameOverScreenText.x = gameCanvas.width / 2 - gameOverScreenText.getMeasuredWidth() / 2;
        gameOverScreenText.y = gameCanvas.height / 2 - gameOverScreenText.getMeasuredHeight() / 2;
        stage.addChild(gameOverScreenText);

        var gameOverScoreScreenText = new createjs.Text("Score: " + score, "20px sans-serif", "white");
        gameOverScoreScreenText.x = gameCanvas.width / 2 - gameOverScoreScreenText.getMeasuredWidth() / 2;
        gameOverScoreScreenText.y = gameCanvas.height / 2 + 200;
        stage.addChild(gameOverScoreScreenText);

        var gameOverRetryScreenText = new createjs.Text("Press Escape key to try again.", "16px sans-serif", "white");
        gameOverRetryScreenText.x = gameCanvas.width / 2 - gameOverRetryScreenText.getMeasuredWidth() / 2;
        gameOverRetryScreenText.y = gameCanvas.height - margin - gameOverRetryScreenText.getMeasuredHeight() / 2;
        stage.addChild(gameOverRetryScreenText);

        stage.update();

        //Pause game
        createjs.Ticker.setPaused(true);
    }

    function resetGame() {
        stage.removeAllChildren();
        asteroidArray.splice(0, asteroidArray.length);
        fireballArray.splice(0, fireballArray.length);

        //Reset default values
        isGameOver = false;
        isShamsterDead = false;
        currentAsteroidGenerationRate = ASTEROIDGENERATIONRATE;
        currentAsteroidSpeed = ASTEROIDSPEED;

        //Un-pause game
        createjs.Ticker.setPaused(false);

        //Prepare and start game
        resetLevel();
        resetScore();
        resetLives();
        prepareGame();
        
    }

    function resetLevel() {
        //Reset level screen text
        level = 1;
        levelScreenTextValue.text = "Level: " + level;

        //Reset game difficulty
        currentAsteroidSpeed = ASTEROIDSPEED + 0;       
        currentAsteroidGenerationRate = ASTEROIDGENERATIONRATE + 0; 
    }

    function resetScore() {
        //Update score screen text
        score = 0;
        scoreScreenTextValue.text = "Score: " + score;
        scoreScreenText.x = gameCanvas.width - margin - scoreScreenText.getMeasuredWidth();
    }

    function resetLives() {
        //Update score screen text
        lives = NUMBEROFLIVES + 0;
        livesScreenTextValue.text = "Lives: " + lives;
    }

    //#endregion

    //#region Event Handlers

    function pointerDownHandler(args) {
        fireShot();
    }

    function keyDownHandler(args) {
        //Esc Key Press
        if (isGameOver && args.keyCode === KEYCODEESCAPE) {
            resetGame();
        }
        //Right Key Press
        if (args.keyCode === KEYCODERIGHTARROW) {
            shamsterBitmap.x = shamsterBitmap.x + SHAMSTERLATERALSPEED;
        }
        //Left Key Press
        else if (args.keyCode === KEYCODELEFTARROW) {
            shamsterBitmap.x = shamsterBitmap.x - SHAMSTERLATERALSPEED;
        }
        //Up Key Press
        else if (args.keyCode === KEYCODEUPARROW) {
            shamsterBitmap.y = shamsterBitmap.y - SHAMSTERVERTICALSPEED;
        }
        //Down Key Press
        else if (args.keyCode === KEYCODEDOWNARROW) {
            shamsterBitmap.y = shamsterBitmap.y + SHAMSTERVERTICALSPEED;
        }
        //Space Bar Press
        else if (args.keyCode === KEYCODESPACEBAR) {
            fireShot();
        }

        //Ensure Shamster doesn't fly offscreen
        if (shamsterBitmap.x < margin) {
            shamsterBitmap.x = margin;
        } else if (shamsterBitmap.x > gameCanvas.width - margin - shamsterImage.width) {
            shamsterBitmap.x = gameCanvas.width - margin - shamsterImage.width;
        } else if (shamsterBitmap.y < margin) {
            shamsterBitmap.y = margin;
        } else if (shamsterBitmap.y > gameCanvas.height - margin - shamsterImage.height) {
            shamsterBitmap.y = gameCanvas.height - margin - shamsterImage.height;
        } 
        stage.update();
    }

    //#endregion

    //#region AppStart

    document.addEventListener("DOMContentLoaded", initialize, false);
    //app.start();

    //#endregion   
})();
