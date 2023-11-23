//html에  id들을 불러옴
var redata1 =prompt("선공 플레이어의 평균 다마는?",100);
var redata2 =prompt("후공 플레이어의 평균 다마는?", 100);
var help = document.getElementById("help_btn");
var hit = document.getElementById("hit_btn");
var player = document.getElementById("player_change");
var elem = document.getElementById("myBar");
//드래그 와 드롭을 하기 위한 마우스 현재좌표
var mouseX = 0, mouseY = 0;
var nowdegree = 0;
var cursor_grab = "url(DATA URI), move";
var cursor_drag = "url(DATA URI), move";
var degreeToRadian = Math.PI / 180; //각도 계산
//html dom 트리에 캔버스 요소 추가
var canvas = document.querySelector('canvas'),
    //캔버스에 2d로 그릴 수 있도록 준비
    ctx = canvas.getContext('2d'),
    w = window.innerWidth,
    h = window.innerHeight,
    points = 4,  //공의 위치
    colors = ['#feca28', '#f8f6ea', '#e51515', '#e51515'], //공 색깔을 넣어줌, 노 흰 빨 빨
    balls = [],
    table, //당구다이
    mouse = { //마우스를 사용하기위한
        down: false,
        button: 1,
        x: 0,
        y: 0,
        px: 0,
        py: 0
    },
    elasticity = .8, //탄력성
    refreshHz = 60, //화면 재생 빈도율
    velocityCutoff = 0.01, //속도 감소
    bounceLoss = .85,//쿠션에 부딪혔을때 감속
    cue,// 당구대
    tableFriction = 0.00003 , //테이블 마찰력
    count = 0;//쿠션 부딪힘을 표현
canvas.width = w;
canvas.height = h;
var power = 0;
xlocations = [670, 133, 266, 670], ylocations = [420, 270, 270, 270];//공의 위치 노,흰,빨,빨
nowPlayer = 0;//현재 플레이어
shootend = false;
var scoreinfo = [redata1/10, redata2/10];//점수표기 자신이 100을 친다고하면 10개 200을친다고하면 20

//리페인트 이전에 실행할 콜백을 받습니다
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function (callback) {
        //1초
            window.setTimeout(callback, 1000 / refreshHz);
        };
})();
//window가 로드 되면
window.onload = function () {

    canvas.addEventListener('mousemove', updateCanvas, false);    //움직일때
    canvas.addEventListener('mousedown', startDrag, false); // 버튼을 누를때
    canvas.addEventListener('mouseup', stopDrag, false);  // 버튼을 놓을때

    player.addEventListener('click', playerChange, false); //선수교체 누를때
    hit.addEventListener('mousedown', startGauge, false); //공을치다 누를때
    hit.addEventListener('mouseup', stopGauge, false); //공을치다 땟을때
    help.addEventListener('mousedown', help_alert, false);//도움말 누를때

    document.addEventListener("keydown", keyEvent1); //
    document.addEventListener("keyup", keyEvent2);

    draw();
};


//큐대
//공의 위치를 받아서 그 자리에서 60을 더한자리에 위치한다 그리고 마우스와 드래그는 입력받지 않는 상태이다
var Cue = function (ball) {
    this.x = ball.x + 60;
    this.y = ball.y + 60;
    this.degree = 0;
    this.mouse = false;
    this.drag = false;
    this.visible = true;
}
//큐대 이미지를 그리고 위치를 잡는다
function draw_cue() {

    if (cue.visible) {
        ctx.clearRect(0, 0, w, h);
        table.draw();
        for (var i = 0; i < points; i++) {
            var temp = balls[i];
            temp.TestImpact();
            temp.Update(table);
            temp.draw(table);
        }

        var degree = cue.degree * degreeToRadian;
        var x1_start = cue.x + 40 * Math.cos(degree + degreeToRadian * 5);
        var x2_start = cue.x + 40 * Math.cos(degree - degreeToRadian * 5);
        var x3_start = cue.x + 50 * Math.cos(degree + degreeToRadian * 5);
        var x4_start = cue.x + 50 * Math.cos(degree - degreeToRadian * 5);
        var y1_start = cue.y + 40 * Math.sin(degree + degreeToRadian * 5);
        var y2_start = cue.y + 40 * Math.sin(degree - degreeToRadian * 5);
        var y3_start = cue.y + 50 * Math.sin(degree + degreeToRadian * 5);
        var y4_start = cue.y + 50 * Math.sin(degree - degreeToRadian * 5);


        ctx.beginPath();
        ctx.moveTo(x1_start, y1_start);
        ctx.lineTo(x2_start, y2_start);
        ctx.lineTo(x4_start, y4_start);
        ctx.lineTo(x3_start, y3_start);
        ctx.fillStyle = "#f8f6ea";
        ctx.fill();

        var x1_end = cue.x + 700 * Math.cos(degree + degreeToRadian * 0.6);
        var x2_end = cue.x + 700 * Math.cos(degree - degreeToRadian * 0.6);
        var y1_end = cue.y + 700 * Math.sin(degree + degreeToRadian * 0.6);
        var y2_end = cue.y + 700 * Math.sin(degree - degreeToRadian * 0.6);


        ctx.fillStyle = "#f6dfbd";
        ctx.beginPath();
        ctx.save();
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = 10;
        ctx.shadowColor = "rgba(0,0,0,.3)";
        ctx.shadowBlur = 5;
        ctx.moveTo(x1_start, y1_start);
        ctx.lineTo(x2_start, y2_start);
        ctx.lineTo(x2_end, y2_end);
        ctx.lineTo(x1_end, y1_end);
        ctx.isPointInPath(mouseX, mouseY) ? cue.mouse = true : cue.mouse = false;  //현재 경로에 포함되있는지 확인
        ctx.fill();

        var x1_middle = cue.x + 520 * Math.cos(degree + degreeToRadian * 0.6);
        var x2_middle = cue.x + 520 * Math.cos(degree - degreeToRadian * 0.6);
        var x3_middle = cue.x + 450 * Math.cos(degree);
        var x4_middle = cue.x + 680 * Math.cos(degree + degreeToRadian * 0.6);
        var x5_middle = cue.x + 680 * Math.cos(degree - degreeToRadian * 0.6);

        var y1_middle = cue.y + 520 * Math.sin(degree + degreeToRadian * 0.6);
        var y2_middle = cue.y + 520 * Math.sin(degree - degreeToRadian * 0.6);
        var y3_middle = cue.y + 450 * Math.sin(degree);
        var y4_middle = cue.y + 680 * Math.sin(degree + degreeToRadian * 0.6);
        var y5_middle = cue.y + 680 * Math.sin(degree - degreeToRadian * 0.6);

        ctx.fillStyle = "#1a1a18";

        ctx.beginPath();
        ctx.moveTo(x1_middle, y1_middle);
        ctx.lineTo(x3_middle, y3_middle);
        ctx.lineTo(x2_middle, y2_middle);
        ctx.lineTo(x5_middle, y5_middle);
        ctx.lineTo(x4_middle, y4_middle);
        ctx.fill();
        ctx.closePath();

        ctx.restore();
        draw_guide_1();

    }
}

//테이블 펑션
var Table = function () {
    this.xPos = 60;
    this.yPos = 60;
    this.width = 1080;
    this.height = 550;
}
//테이블 그리는 펑션
Table.prototype.draw = function () {
    var tw = this.width + 120;
    var th = this.height + 120;

    // 테이블 테두리 그리기
    ctx.setLineDash([]);
    ctx.fillStyle = "#6a5746";
    ctx.fillRect(0, 0, tw, th);
    //쿠션 그리기
    ctx.fillStyle = "#3456af";
    ctx.fillRect(45, 45, tw - 90, th - 90);
    //쿠션그리기
    ctx.fillStyle = "#4370d7"
    ctx.fillRect(60, 60, tw - 120, th - 120);

    //큐대 치는 모션
    ctx.beginPath();//경로설정
    ctx.moveTo(0, 0);
    ctx.lineTo(60, 60);
    ctx.stroke();
    ctx.closePath(); //하위경로 연결
    //서서히 뒤로빠짐
    ctx.beginPath();
    ctx.moveTo(tw, 0);
    ctx.lineTo(tw - 60, 60);
    ctx.stroke();
    ctx.closePath();
    //서서히 뒤로빠짐
    ctx.beginPath();
    ctx.moveTo(0, th);
    ctx.lineTo(60, th - 60);
    ctx.stroke();
    ctx.closePath();
    //앞으로가면서 치게됨
    ctx.beginPath();
    ctx.moveTo(tw, th);
    ctx.lineTo(tw - 60, th - 60);
    ctx.stroke();
    ctx.closePath();

    ctx.fillStyle = "#b0b0b0"; //쿠션 포인트

    for (var i = 1; i <= 7; i++) {
        ctx.beginPath();
//arc(중심점x, 중심점y, 반지름, 시작각도, 끝각도, 방향)
//true : 반시계 방향 , false : 시계 방향
        ctx.arc(60 + (tw - 120) / 8 * i, 30, 5, 0, Math.PI * 2, true);
        ctx.strokeStyle = "#0";
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(60 + (tw - 120) / 8 * i, th - 30, 5, 0, Math.PI * 2, true);
        ctx.strokeStyle = "#0";
        ctx.fill();
        ctx.closePath();
    }

    for (var i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(30, 60 + (th - 120) / 4 * i, 5, 0, Math.PI * 2, true);
        ctx.strokeStyle = "#0";
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(tw - 30, 60 + (th - 120) / 4 * i, 5, 0, Math.PI * 2, true);
        ctx.strokeStyle = "#0";
        ctx.fill();
        ctx.closePath();
    }
}


var Ball = function (i) {
    this.r = 17; //공의 크기
    this.x = xlocations[i % points]; //공의 x축
    this.y = ylocations[i % points]; //공의 y축
    this.opacity = 1; // 투명도
    this.xVelocity = 0; //x속도
    this.yVelocity = 0; //y속도
    this.xAccel = 0; //x 가속도
    this.yAccel = 0; //y  가속도
    this.bounceLoss = bounceLoss; //충돌혔을때 감속
    this.tableFriction = tableFriction; //테이블 마찰력
    this.c = colors[i % points]; //공 위치에따른 색깔
    this.index = i;
    // this.move = false;
    this.red1 = false; //1번 빨간공
    this.red2 = false; //2번 빨간공
    this.loss = false; //플레이어 볼
    this.count = 0; //쿠션 맞은 수
}

Ball.prototype.draw = function (table) {
    ctx.fillStyle = this.c; // 공에 색을 부여
    ctx.globalAlpha = this.opacity;
    ctx.beginPath();
    ctx.save();
    ctx.shadowOffsetX = 10;
    ctx.shadowOffsetY = 10;
    ctx.shadowColor = "rgba(0,0,0,.3)";
    ctx.shadowBlur = 5;
    ctx.arc(this.x + table.xPos,
        this.y + table.yPos,
        this.r, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
};

Ball.prototype.Update = function (table) {
    var dT = 1000 / refreshHz; //화면 재생 빈도율
    this.xAccel = this.xVelocity * -this.tableFriction * dT; //x축 속도 x -테이블마찰력 x 화면재생 빈도율
    this.yAccel = this.yVelocity * -this.tableFriction * dT; //y축 속도 x -테이블마찰력 x 화면재생 빈도율
    this.xVelocity += this.xAccel * dT; //x축 가속도를 x 속도에 계속 더해준다
    this.yVelocity += this.yAccel * dT; //y축 가속도를 y 속도에 계속 더해준다
    this.y += this.yVelocity * dT;
    this.x += this.xVelocity * dT;

    // console.log("X 가속도: " + this.xAccel);
    // console.log("y 가속도: " + this.yAccel);
    // console.log("x 속도: " + this.xVelocity);
    // console.log("y 속도: " + this.yVelocity);
    // console.log("쿠션 " + this.count);

    var bounce = false; //쿠션에 부딪칠때 발생하는 함수
    if (this.y >= table.height - this.r) // 아래쪽 쿠션
    {
        this.y = table.height - this.r;
        this.yVelocity = -this.yVelocity;
        this.yAccel = -this.yAccel+0.0000000000000000000005;
        bounce = true;
        this.count++;  //쿠션이 부딪힐때마다 카운트 +1 해서 3쿠션이상 맞으면 3쿠션 처리
    }
    else if (this.y <= this.r) // 위쪽쿠션
    {
        this.y = this.r;
        this.yVelocity = -this.yVelocity;
        this.yAccel = -this.yAccel+0.0000000000000000000005;
        bounce = true;
        this.count++; //쿠션이 부딪힐때마다 카운트 +1 해서 3쿠션이상 맞으면 3쿠션 처리
    }

    if (this.x >= table.width - this.r) //  오른쪽 쿠션
    {

        this.x = table.width - this.r;
        // "Bounce" it
        this.xVelocity = -this.xVelocity;
        this.xAccel = -this.xAccel+0.0000000000000000000005;
        bounce = true;
        this.count++;//쿠션이 부딪힐때마다 카운트 +1 해서 3쿠션이상 맞으면 3쿠션 처리
    }
    else if (this.x <= this.r) // 왼쪽쿠션
    {
        this.x = this.r;
        this.xVelocity = -this.xVelocity;
        this.xAccel = -this.xAccel+0.0000000000000000000005;
        bounce = true;
        this.count++;//쿠션이 부딪힐때마다 카운트 +1 해서 3쿠션이상 맞으면 3쿠션 처리
    }

    // 감속
    if (bounce) {
        this.xVelocity *= this.bounceLoss;
        this.yVelocity *= this.bounceLoss;
    }
    // 정지
    if (Math.abs(this.xVelocity) + Math.abs(this.yVelocity) < velocityCutoff) {
        this.yVelocity = 0;
        this.yAccel = 0;
        this.xVelocity = 0;
        this.xAccel = 0;
    }

};

Ball.prototype.Strike = function (xImpact, yImpact) {
    this.xVelocity += xImpact;
    this.yVelocity += yImpact;
};

function CollideBalls(ball, ball2) {
    // 충돌 감지

    var lossball;
    sound_collision.play();

    lossball = (nowPlayer + 1) % 2;
    //공을 치는 사람일경우 다른 공은 실점되는 공이되고 red1 , red2가활성화된다
    if (ball == balls[nowPlayer]) {
        if (ball2 == balls[lossball])
            balls[nowPlayer].loss = true;
        if (ball2 == balls[2])
            balls[nowPlayer].red1 = true;
        if (ball2 == balls[3])
            balls[nowPlayer].red2 = true;

    }

    var Del = ball2.r + ball.r;
    var dX = ball2.x - ball.x;
    var dY = ball2.y - ball.y;
    var dVX = ball2.xVelocity - ball.xVelocity;
    var dVY = ball2.yVelocity - ball.yVelocity;
    var dSq = dX * dX + dY * dY;
    var alpha = (1 + elasticity) / 2 * (dX * dVX + dY * dVY) / dSq;

    //충돌했을때 충돌한 공이 나아 갈수 있도록함
    ball.xVelocity += dX * alpha;
    ball.yVelocity += dY * alpha;
    ball2.xVelocity -= dX * alpha;
    ball2.yVelocity -= dY * alpha;
    //충돌했을때 공이 붙지 않게 함
    var DDist = ((Del + 1) / Math.sqrt(dSq) - 1) / 2;
    ball.x -= dX * DDist;
    ball.y -= dY * DDist;
    ball2.x += dX * DDist;
    ball2.y += dY * DDist;

}

Ball.prototype.TestImpact = function () {
    for (var i = this.index + 1; i < points; i++) {
        var ball = balls[i];
        if (Dist(this.x, this.y, ball.x, ball.y) > this.r + ball.r) {
            continue;
        }
        CollideBalls(this, ball);
    }
}

//공을쳤을때 움직이는 공식
function HitBall() {
    d_power = power * 0.75;

    var mouseDownX = cue.x - d_power * Math.cos(cue.degree * degreeToRadian);
    var mouseDownY = cue.y - d_power * Math.sin(cue.degree * degreeToRadian);

    var dX = mouseDownX - balls[nowPlayer].x - 60;
    var dY = mouseDownY - balls[nowPlayer].y - 60;
    shootend = true;
    balls[nowPlayer].Strike(dX / 50.0, dY / 50.0);

}

function Dist(x1, y1, x2, y2) {
    var diffX = x2 - x1;
    var diffY = y2 - y1;
    return Math.sqrt((diffX * diffX) + (diffY * diffY));
}


(function init() {

        for (var i = 0; i < points; i++) {
            balls.push(new Ball(i));
        }

        for (var i = this.index + 1; i < points; i++) {
            var ball = balls[i];
            if (Dist(this.x, this.y, ball.x, ball.y) > this.r + ball.r) {
                continue;
            }
        }

        table = new Table();
        cue = new Cue(balls[nowPlayer]);
    }
)();

//실시간으로 움직일수 있게끔
function draw() {
    var stop = true;
    ctx.clearRect(0, 0, w, h);
    table.draw();
    for (var i = 0; i < points; i++) {
        var temp = balls[i];
        temp.TestImpact();
        temp.Update(table);
        temp.draw(table);
    }

    for (var i = 0; i < points; i++) {
        var temp = balls[i];
        stop = stop && (temp.xVelocity == 0 && temp.yVelocity == 0)
    }


    if (stop) {//공이 모두 멈췄을때
        cue.x = balls[nowPlayer].x + 60;
        cue.y = balls[nowPlayer].y + 60;
        cue.visible = true;
        hit.disabled = false;
        player.disabled = false;
        waite = true;
        stop = !stop;

        if (shootend) {
            getscore();
            shootend = false;
        }
    }

    else {// 공이 움직일때
        hit.disabled = true;
        player.disabled = true;
    }
    //큐가 보이지 않으면 보이게함
    draw_cue();

    if (!cue.visible) {
        requestAnimFrame(draw);
    }
}




