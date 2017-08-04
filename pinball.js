
var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'pinball', { preload: preload, create: create, update: update, render: render });

var outlineVertices = [144,-318.659,137.696,-319.595,102.388,-219.434,134.545,-196.125,134.545,-66.3375,
    63.8684,-48.0341,16.0054,-15.4361,15.0206,47.1008,-31.8575,47.0023,-31.9559,-15.3376,
    -80.0158,-48.0341,-151.935,-61.921,-151.823,-198.898,-114.738,-217.573,-142.931,-315.217,
    -150.01,-319.552,-149.251,-339.968,-143.882,-386.733,-130.907,-413.241,-111.222,-435.164,
    -78.7851,-454.067,-38.9666,-467.041,13.9843,-477.828,65.592,-484.615,87.2006,-483.787,
    106.714,-479.227,123.626,-470.002,137.463,-458.471,148.034,-444.057,155.721,-427.145,
    160.165,-399.259,160.141,-371.219,160.411,-219.786,181.472,-223.437,184.877,-205.755,
    160,-200.304,160,-17.1408,144.293,-16.9434,143.95,-66.3941];

var launcherVertices = [140.135,-22.4963,163.198,-22.4963];
var guide1Vertices = [-82.5819,-74.6541,-77.1419,-85.3487,-128,-112,-128,-175.999,-136,-175.999,
    -136,-95.9993];
var guide2Vertices = [66.3001,-74.313,61.4862,-85.5893,111.991,-112.182,112.33,-176.068,120.008,-175.999,
    120.008,-95.9993];
var guide3Vertices = [-111.681,-175.355,-111.898,-127.767,-87.8975,-111.767];
var guide4Vertices = [72.1698,-112.855,95.6731,-128.232,95.6731,-176.232];
var gutterVertices = [-48.0857,41.3599,29.3837,41.3599];

var bouncer1 = [-104.247,-176.321,-82.6297,-116.074];
var bouncer2 = [88.3433,-176.701,66.9858,-117.173];

var smallCircles = [140.6,-318.389,-1320,-175.999,-107.886,-175.303,-86.188,-115.205,91.8723,-176.08,116.008,-175.999,70.487,-116.138];
var mediumCircles = [-150.082,-313.263,-86.6447,-316.329,-29.0006,-307.423,18.7945,-341.555,61.4227,-307.423,-45.1581,-223.234,39.6293,-224.2];
var largeCircles = [-44.6686,-370.469,30.9841,-413.362,99.5658,-359.505];

var leftFlipperVertices = [36,3.,36,-3.2,-25,-6.4,-25,6.4];
var rightFlipperVertices = [25,6.4,25,-6.4,-36,-3.2,-36,3.2];

var ballStart = [17.5016, -21.318];


var ballBody;
var flipperJoints = [];
var PTM = 10; // conversion ratio for values in arrays above
var needReset = false;

function preload() {
  game.load.image('pinball', 'pinball.png');
  game.load.image('leftFlipper', 'leftFlipper.png');
  game.load.image('rightFlipper', 'rightFlipper.png');
  game.load.image('background', 'gameboard.png');
}

function create() {

    game.world.setBounds(-400, -520, 800, 600);

    game.stage.backgroundColor = '#FFFFFF';
    game.add.image(-203, -496, 'background');

    // Enable Box2D physics
    game.physics.startSystem(Phaser.Physics.BOX2D);
    game.physics.box2d.ptmRatio = 50;
    game.physics.box2d.gravity.y = 500; // large gravity to make scene feel smaller
    game.physics.box2d.friction = 0.19;

    // Make the ground body
    var mainBody = new Phaser.Physics.Box2D.Body(this.game, null, 0, 0, 0);

    // Add bounce-less fixtures
    game.physics.box2d.restitution = 0.1;
    mainBody.addLoop(outlineVertices);
    mainBody.addLoop(guide1Vertices);
    mainBody.addLoop(guide2Vertices);
    mainBody.addChain(guide3Vertices);
    mainBody.addChain(guide4Vertices);

    // Add bouncy fixtures
    game.physics.box2d.restitution = 1;
    mainBody.addEdge(bouncer1[0], bouncer1[1], bouncer1[2], bouncer1[3]);
    mainBody.addEdge(bouncer2[0], bouncer2[1], bouncer2[2], bouncer2[3]);

    for (var i = 0; i < smallCircles.length / 2; i++)
    {
        mainBody.addCircle(0.35 * PTM, smallCircles[2 * i + 0], smallCircles[2 * i + 1]);
    }

    for (var i = 0; i < mediumCircles.length / 2; i++)
    {
        mainBody.addCircle(1 * PTM, mediumCircles[2 * i + 0], mediumCircles[2 * i + 1]);
    }

    for (var i = 0; i < largeCircles.length / 2; i++)
    {
        mainBody.addCircle(2.8 * PTM, largeCircles[2 * i + 0], largeCircles[2 * i + 1]);
    }

    // Add gutter fixture
    gutterFixture = mainBody.addEdge(gutterVertices[0], gutterVertices[1], gutterVertices[2], gutterVertices[3]);
    gutterFixture.SetSensor(true);

    // Set restitution for launcher
    game.physics.box2d.restitution = 2;
    mainBody.addEdge(launcherVertices[0], launcherVertices[1], launcherVertices[2], launcherVertices[3]);

    // ball
    game.physics.box2d.restitution = .1;
    ball = game.add.sprite(ballStart[0]*PTM, ballStart[1]*PTM, 'pinball')
    game.physics.box2d.enable(ball, false)
    ball.scale.set(.035)
    //ball.body = new Phaser.Physics.Box2D.Body(this.game, null, ballStart[0] * PTM, ballStart[1] * PTM);
    ball.body.setCircle(0.64 * PTM)
    ball.body.setFixtureContactCallback(gutterFixture, onHitGutter, this)
    ball.body.bullet = true

    // Flippers
    game.physics.box2d.restitution = 0.1;

    var leftFlipper = game.add.sprite(null,null, 'leftFlipper')
    leftFlipper.scale.set(.35);
    game.physics.box2d.enable(leftFlipper, false)
    var leftFlipperBody = leftFlipper.body;
    leftFlipperBody.clearFixtures()
    leftFlipperBody.addPolygon(leftFlipperVertices);

    var rightFlipper = game.add.sprite(null,null, 'rightFlipper')
    rightFlipper.scale.set(.35);
    game.physics.box2d.enable(rightFlipper, false)
    var rightFlipperBody = rightFlipper.body;
    rightFlipperBody.clearFixtures()
    rightFlipperBody.addPolygon(rightFlipperVertices);


    // Flipper joints
    var motorSpeed = 2;
    var motorTorque = 100;
    // bodyA, bodyB, ax, ay, bx, by, motorSpeed, motorTorque, motorEnabled, lowerLimit, upperLimit, limitEnabled
    flipperJoints[0] = game.physics.box2d.revoluteJoint(mainBody,  leftFlipperBody,  -8*PTM,-7.99956*PTM, -25,0, motorSpeed, motorTorque, true, -25, 25, true );
    flipperJoints[1] = game.physics.box2d.revoluteJoint(mainBody, rightFlipperBody, 6.4*PTM,-7.99956*PTM, 25,0, motorSpeed, motorTorque, true, -25, 25, true );

    cursors = game.input.keyboard.createCursorKeys();

    var caption = game.add.text(5, 5, 'Left/right arrow keys to control flippers.', { fill: '#000000', font: '14pt Arial' });
    caption.fixedToCamera = true;
}

function onHitGutter(body1, body2, fixture1, fixture2, begin) {
    needReset = true; // this occurs inside the world Step, so don't do the actual reset here
}

function update() {

    if (needReset)
    {
        ball.body.x = ballStart[0]*PTM;
        ball.body.y = ballStart[1]*PTM;
        ball.body.velocity.x = 0;
        ball.body.velocity.y = 0;
        ball.body.angularVelocity = 0;
        needReset = false;
    }

    var flipperSpeed = 20; // rad/s

    if (cursors.left.isDown)
    {
        flipperJoints[0].SetMotorSpeed(-flipperSpeed);
    }
    else
    {
        flipperJoints[0].SetMotorSpeed(flipperSpeed);
    }
    
    if (cursors.right.isDown)
    {
        flipperJoints[1].SetMotorSpeed(flipperSpeed);
    }
    else
    {
        flipperJoints[1].SetMotorSpeed(-flipperSpeed);
    }

}

function render() {

    //game.debug.box2dWorld();

}
