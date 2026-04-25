const canvas = document.getElementById('pitch');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const PITCH = { x: 60, y: 40, w: WIDTH - 120, h: HEIGHT - 80 };
const GOAL_H = 130;
const DT = 1 / 60;

const keys = new Set();
window.addEventListener('keydown', (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
  keys.add(e.key.toLowerCase());
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

class Ball {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = WIDTH / 2;
    this.y = HEIGHT / 2;
    this.vx = 0;
    this.vy = 0;
    this.owner = null;
  }

  update() {
    if (this.owner) {
      const o = this.owner;
      this.x = o.x + Math.cos(o.angle) * 14;
      this.y = o.y + Math.sin(o.angle) * 14;
      this.vx = 0;
      this.vy = 0;
      return;
    }

    this.x += this.vx * DT;
    this.y += this.vy * DT;
    this.vx *= 0.985;
    this.vy *= 0.985;

    if (this.y < PITCH.y) {
      this.y = PITCH.y;
      this.vy *= -0.45;
    }
    if (this.y > PITCH.y + PITCH.h) {
      this.y = PITCH.y + PITCH.h;
      this.vy *= -0.45;
    }

    if (this.x < PITCH.x || this.x > PITCH.x + PITCH.w) {
      if (this.y > HEIGHT / 2 - GOAL_H / 2 && this.y < HEIGHT / 2 + GOAL_H / 2) return;
      this.x = clamp(this.x, PITCH.x, PITCH.x + PITCH.w);
      this.vx *= -0.45;
    }
  }

  kick(angle, power) {
    this.owner = null;
    this.vx = Math.cos(angle) * power;
    this.vy = Math.sin(angle) * power;
  }
}

class Player {
  constructor(team, x, y, role, number) {
    this.team = team;
    this.homeX = x;
    this.homeY = y;
    this.x = x;
    this.y = y;
    this.role = role;
    this.number = number;
    this.radius = 8;
    this.angle = 0;
    this.speed = role === 'goleiro' ? 128 : 145;
    this.stamina = 100;
    this.mood = 1;
    this.cooldown = 0;
  }

  update(ball, controlled = false) {
    this.cooldown = Math.max(0, this.cooldown - DT);

    if (controlled) this.updateControlled(ball);
    else this.updateAI(ball);

    this.x = clamp(this.x, PITCH.x + 2, PITCH.x + PITCH.w - 2);
    this.y = clamp(this.y, PITCH.y + 2, PITCH.y + PITCH.h - 2);

    if (!keys.has('shift')) this.stamina = clamp(this.stamina + 10 * DT, 30, 100);

    if (!ball.owner && dist(this, ball) < this.radius + 8 && this.cooldown <= 0) {
      ball.owner = this;
    }
  }

  updateControlled(ball) {
    const up = keys.has('arrowup') || keys.has('w');
    const down = keys.has('arrowdown') || keys.has('s');
    const left = keys.has('arrowleft') || keys.has('a');
    const right = keys.has('arrowright') || keys.has('d');
    const sprint = keys.has('shift') && this.stamina > 0;

    let dx = (right ? 1 : 0) - (left ? 1 : 0);
    let dy = (down ? 1 : 0) - (up ? 1 : 0);

    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      this.angle = Math.atan2(dy, dx);

      let speed = this.speed * (0.86 + 0.14 * this.mood);
      if (sprint) {
        speed *= 1.34;
        this.stamina = clamp(this.stamina - 26 * DT, 0, 100);
      }

      this.x += dx * speed * DT;
      this.y += dy * speed * DT;
    }

    if (keys.has('j') && this.cooldown <= 0) this.passOrTackle(ball);
    if (keys.has('k') && this.cooldown <= 0) this.shoot(ball);
  }

  updateAI(ball) {
    const teamHasBall = ball.owner?.team === this.team;
    const defensiveBias = this.team.style === 'compacta' ? 1.5 : 1;

    let tx = this.homeX;
    let ty = this.homeY;

    if (teamHasBall) {
      tx += this.team.direction * (this.role === 'ataque' ? 86 : 28);
    } else {
      tx -= this.team.direction * 24 * defensiveBias;
      if (this.role !== 'goleiro') {
        const d = dist(this, ball);
        if (d < 175) {
          tx = ball.x;
          ty = ball.y;
        }
      }
    }

    if (this.role === 'goleiro') {
      tx = this.team.direction > 0 ? PITCH.x + 28 : PITCH.x + PITCH.w - 28;
      ty = clamp(ball.y, HEIGHT / 2 - 70, HEIGHT / 2 + 70);
      if (dist(this, ball) < 36 && (!ball.owner || ball.owner.team !== this.team)) {
        ball.owner = this;
      }
    }

    const dx = tx - this.x;
    const dy = ty - this.y;
    const len = Math.hypot(dx, dy);
    if (len > 2) {
      this.angle = Math.atan2(dy, dx);
      const aiSpeed = this.speed * 0.86;
      this.x += (dx / len) * aiSpeed * DT;
      this.y += (dy / len) * aiSpeed * DT;
    }

    if (ball.owner === this) {
      const toGoalX = this.team.direction > 0 ? PITCH.x + PITCH.w : PITCH.x;
      const goalDist = Math.abs(toGoalX - this.x);

      if (goalDist < 190 && Math.random() < 0.06) this.shoot(ball, true);
      else if (Math.random() < 0.04) this.passOrTackle(ball, true);
    } else if (ball.owner && ball.owner.team !== this.team && dist(this, ball.owner) < 22 && this.cooldown <= 0) {
      this.passOrTackle(ball, true);
    }
  }

  passOrTackle(ball, ai = false) {
    this.cooldown = ai ? 0.34 : 0.22;

    if (ball.owner === this) {
      const mates = this.team.players.filter(p => p !== this);
      let bestMate = mates[0];
      let bestScore = -Infinity;

      for (const mate of mates) {
        const forward = (mate.x - this.x) * this.team.direction;
        const lane = 150 - Math.abs(mate.y - this.y);
        const pressure = this.team.game.getNearestOpponentDist(mate, this.team);
        const score = forward * 1.35 + lane + pressure * 0.25;
        if (score > bestScore) {
          bestScore = score;
          bestMate = mate;
        }
      }

      const angle = Math.atan2(bestMate.y - this.y, bestMate.x - this.x);
      const power = 300 + Math.random() * 120;
      ball.kick(angle, power);
      this.team.game.lastAction = `${this.team.name}: passe`;
      return;
    }

    const target = ball.owner;
    if (!target || target.team === this.team) return;
    if (dist(this, target) > 25) return;

    if (Math.random() < 0.56 + this.mood * 0.22) {
      ball.owner = this;
      this.team.game.lastAction = `${this.team.name}: desarme`;
      this.team.game.emotionPulse(this.team, 0.06);
    } else {
      this.team.game.lastAction = `${this.team.name}: errou o bote`;
      this.team.game.emotionPulse(this.team, -0.03);
    }
  }

  shoot(ball, ai = false) {
    if (ball.owner !== this) return;
    this.cooldown = ai ? 0.45 : 0.32;

    const gx = this.team.direction > 0 ? PITCH.x + PITCH.w + 10 : PITCH.x - 10;
    const gy = HEIGHT / 2 + (Math.random() - 0.5) * 82;
    const angle = Math.atan2(gy - this.y, gx - this.x);
    const fatiguePenalty = (100 - this.stamina) * 1.65;
    const power = clamp(510 - fatiguePenalty + Math.random() * 105, 280, 620);
    ball.kick(angle, power);
    this.team.game.lastAction = `${this.team.name}: chute`;
  }

  render(selected = false) {
    ctx.beginPath();
    ctx.fillStyle = this.team.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    if (selected) {
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 8px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.number.toString(), this.x, this.y + 3);
  }
}

class Team {
  constructor(game, name, color, direction, style, formation) {
    this.game = game;
    this.name = name;
    this.color = color;
    this.direction = direction;
    this.style = style;
    this.score = 0;
    this.players = formation.map((playerData, idx) => (
      new Player(this, playerData.x, playerData.y, playerData.role, idx + 1)
    ));
  }

  reset() {
    for (const p of this.players) {
      p.x = p.homeX;
      p.y = p.homeY;
      p.cooldown = 0;
      p.stamina = 100;
    }
  }
}

class Match {
  constructor() {
    this.time = 0;
    this.maxTime = 240;
    this.lastAction = 'Início de jogo';

    this.home = new Team(this, 'Azul', '#3b82f6', 1, 'posse', this.createFormation(true));
    this.away = new Team(this, 'Vermelho', '#ef4444', -1, 'compacta', this.createFormation(false));

    this.ball = new Ball();
    this.userTeam = this.home;
    this.finished = false;

    this.centerKickoff();
  }

  createFormation(isLeftSide) {
    const sx = isLeftSide ? 1 : -1;
    const anchor = isLeftSide ? PITCH.x : PITCH.x + PITCH.w;
    const x = (offset) => anchor + sx * offset;

    return [
      { x: x(28), y: HEIGHT / 2, role: 'goleiro' },

      { x: x(155), y: HEIGHT / 2 - 170, role: 'defesa' },
      { x: x(170), y: HEIGHT / 2 - 65, role: 'defesa' },
      { x: x(170), y: HEIGHT / 2 + 65, role: 'defesa' },
      { x: x(155), y: HEIGHT / 2 + 170, role: 'defesa' },

      { x: x(305), y: HEIGHT / 2 - 110, role: 'meio' },
      { x: x(330), y: HEIGHT / 2, role: 'meio' },
      { x: x(305), y: HEIGHT / 2 + 110, role: 'meio' },

      { x: x(460), y: HEIGHT / 2 - 130, role: 'ataque' },
      { x: x(500), y: HEIGHT / 2, role: 'ataque' },
      { x: x(460), y: HEIGHT / 2 + 130, role: 'ataque' },
    ];
  }

  getNearestOpponentDist(player, team) {
    const opponents = team === this.home ? this.away.players : this.home.players;
    let minD = Infinity;
    for (const op of opponents) {
      minD = Math.min(minD, dist(player, op));
    }
    return minD;
  }

  emotionPulse(team, delta) {
    for (const p of team.players) {
      p.mood = clamp(p.mood + delta, 0.75, 1.25);
    }
  }

  centerKickoff() {
    this.home.reset();
    this.away.reset();
    this.ball.reset();
    this.ball.owner = Math.random() < 0.5 ? this.home.players[9] : this.away.players[9];
  }

  getControlledPlayer() {
    if (this.ball.owner && this.ball.owner.team === this.userTeam) return this.ball.owner;

    let nearest = this.userTeam.players[0];
    let best = dist(nearest, this.ball);
    for (const p of this.userTeam.players) {
      const d = dist(p, this.ball);
      if (d < best) {
        best = d;
        nearest = p;
      }
    }
    return nearest;
  }

  update() {
    if (keys.has('r')) this.restart();
    if (this.finished) return;

    this.time += DT;
    if (this.time >= this.maxTime) {
      this.finished = true;
      this.lastAction = 'Fim de jogo';
    }

    const controlled = this.getControlledPlayer();
    for (const p of this.home.players) p.update(this.ball, p === controlled);
    for (const p of this.away.players) p.update(this.ball, false);

    this.ball.update();
    this.checkGoal();
    this.dynamicEmotion();
  }

  dynamicEmotion() {
    const diff = this.home.score - this.away.score;
    if (diff > 0) {
      this.emotionPulse(this.home, 0.0007);
      this.emotionPulse(this.away, -0.0005);
    } else if (diff < 0) {
      this.emotionPulse(this.away, 0.0007);
      this.emotionPulse(this.home, -0.0005);
    }
  }

  checkGoal() {
    const inGoalY = this.ball.y > HEIGHT / 2 - GOAL_H / 2 && this.ball.y < HEIGHT / 2 + GOAL_H / 2;
    if (!inGoalY) return;

    if (this.ball.x < PITCH.x - 6) {
      this.away.score += 1;
      this.lastAction = 'Gol do Vermelho!';
      this.centerKickoff();
    } else if (this.ball.x > PITCH.x + PITCH.w + 6) {
      this.home.score += 1;
      this.lastAction = 'Gol do Azul!';
      this.centerKickoff();
    }
  }

  restart() {
    this.time = 0;
    this.finished = false;
    this.home.score = 0;
    this.away.score = 0;
    this.lastAction = 'Reinício';
    this.centerKickoff();
  }

  renderPitch() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#166534';
    ctx.fillRect(PITCH.x, PITCH.y, PITCH.w, PITCH.h);

    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
      ctx.fillRect(PITCH.x + (PITCH.w / 10) * i, PITCH.y, PITCH.w / 10, PITCH.h);
    }

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(PITCH.x, PITCH.y, PITCH.w, PITCH.h);

    ctx.beginPath();
    ctx.moveTo(WIDTH / 2, PITCH.y);
    ctx.lineTo(WIDTH / 2, PITCH.y + PITCH.h);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(WIDTH / 2, HEIGHT / 2, 72, 0, Math.PI * 2);
    ctx.stroke();

    const boxW = 150;
    const boxH = 250;
    ctx.strokeRect(PITCH.x, HEIGHT / 2 - boxH / 2, boxW, boxH);
    ctx.strokeRect(PITCH.x + PITCH.w - boxW, HEIGHT / 2 - boxH / 2, boxW, boxH);

    ctx.strokeRect(PITCH.x - 10, HEIGHT / 2 - GOAL_H / 2, 10, GOAL_H);
    ctx.strokeRect(PITCH.x + PITCH.w, HEIGHT / 2 - GOAL_H / 2, 10, GOAL_H);
  }

  renderHUD() {
    const min = Math.floor(this.time / 60);
    const sec = Math.floor(this.time % 60).toString().padStart(2, '0');
    const controlled = this.getControlledPlayer();

    ctx.fillStyle = 'rgba(15,23,42,0.75)';
    ctx.fillRect(12, 10, 430, 100);
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'left';
    ctx.font = 'bold 25px Inter, Arial';
    ctx.fillText(`${this.home.name} ${this.home.score} x ${this.away.score} ${this.away.name}`, 22, 42);
    ctx.font = '17px Inter, Arial';
    ctx.fillText(`Tempo: ${min}:${sec} / 4:00`, 22, 67);
    ctx.fillText(`Ação: ${this.lastAction}`, 22, 90);

    ctx.fillStyle = 'rgba(15,23,42,0.75)';
    ctx.fillRect(WIDTH - 280, 10, 268, 100);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`Controlado: #${controlled.number} (${controlled.role})`, WIDTH - 270, 42);
    ctx.fillText(`Stamina: ${Math.round(controlled.stamina)}%`, WIDTH - 270, 67);
    ctx.fillText(`Emoção: ${controlled.mood.toFixed(2)}`, WIDTH - 270, 90);

    if (this.finished) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 52px Inter, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('FIM DE JOGO', WIDTH / 2, HEIGHT / 2 - 8);
      ctx.font = '24px Inter, Arial';
      ctx.fillText('Pressione R para jogar novamente', WIDTH / 2, HEIGHT / 2 + 30);
    }
  }

  render() {
    this.renderPitch();

    const controlled = this.getControlledPlayer();
    this.home.players.forEach((p) => p.render(p === controlled));
    this.away.players.forEach((p) => p.render(false));

    ctx.beginPath();
    ctx.fillStyle = '#ffffff';
    ctx.arc(this.ball.x, this.ball.y, 5.5, 0, Math.PI * 2);
    ctx.fill();

    this.renderHUD();
  }
}

const match = new Match();

function frame() {
  match.update();
  match.render();
  requestAnimationFrame(frame);
}

frame();
