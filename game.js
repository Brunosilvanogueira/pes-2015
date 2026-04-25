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
      this.x = o.x + Math.cos(o.angle) * 16;
      this.y = o.y + Math.sin(o.angle) * 16;
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
  constructor(team, x, y, role, controlled = false) {
    this.team = team;
    this.homeX = x;
    this.homeY = y;
    this.x = x;
    this.y = y;
    this.role = role;
    this.controlled = controlled;
    this.radius = 11;
    this.angle = 0;
    this.speed = 155;
    this.stamina = 100;
    this.mood = 1;
    this.cooldown = 0;
  }

  update(ball, isUserControlled = false) {
    this.cooldown = Math.max(0, this.cooldown - DT);
    if (isUserControlled) this.updateUser(ball);
    else this.updateAI(ball);

    this.x = clamp(this.x, PITCH.x + 4, PITCH.x + PITCH.w - 4);
    this.y = clamp(this.y, PITCH.y + 4, PITCH.y + PITCH.h - 4);

    if (!keys.has('shift')) this.stamina = clamp(this.stamina + 11 * DT, 30, 100);

    if (!ball.owner && dist(this, ball) < this.radius + 10 && this.cooldown <= 0) {
      ball.owner = this;
    }
  }

  updateUser(ball) {
    const up = keys.has('w'), down = keys.has('s'), left = keys.has('a'), right = keys.has('d');
    const sprint = keys.has('shift') && this.stamina > 0;
    let dx = (right ? 1 : 0) - (left ? 1 : 0);
    let dy = (down ? 1 : 0) - (up ? 1 : 0);

    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      this.angle = Math.atan2(dy, dx);

      let speed = this.speed * (0.85 + 0.15 * this.mood);
      if (sprint) {
        speed *= 1.35;
        this.stamina = clamp(this.stamina - 26 * DT, 0, 100);
      }

      this.x += dx * speed * DT;
      this.y += dy * speed * DT;
    }

    if (keys.has('j') && this.cooldown <= 0) this.passOrTackle(ball);
    if (keys.has('k') && this.cooldown <= 0) this.shoot(ball);
  }

  updateAI(ball) {
    const defensiveBias = this.team.style === 'compacta' ? 1.5 : 1;
    let tx = this.homeX;
    let ty = this.homeY;

    const teamHasBall = ball.owner?.team === this.team;
    if (teamHasBall) {
      tx += this.team.direction * 40;
      if (this.role === 'ataque') tx += this.team.direction * 90;
    } else {
      if (this.role !== 'goleiro') {
        tx -= this.team.direction * 30 * defensiveBias;
      }
      if (!ball.owner || ball.owner.team !== this.team) {
        const d = dist(this, ball);
        if (d < 180 && this.role !== 'goleiro') {
          tx = ball.x;
          ty = ball.y;
        }
      }
    }

    const dx = tx - this.x;
    const dy = ty - this.y;
    const len = Math.hypot(dx, dy);
    if (len > 3) {
      this.angle = Math.atan2(dy, dx);
      const aiSpeed = this.speed * 0.88;
      this.x += (dx / len) * aiSpeed * DT;
      this.y += (dy / len) * aiSpeed * DT;
    }

    if (ball.owner === this) {
      const toGoalX = this.team.direction > 0 ? PITCH.x + PITCH.w : PITCH.x;
      const goalDist = Math.abs(toGoalX - this.x);

      if (goalDist < 220 && Math.random() < 0.05) {
        this.shoot(ball, true);
      } else if (Math.random() < 0.03) {
        this.passOrTackle(ball, true);
      }
    } else if (ball.owner && ball.owner.team !== this.team && dist(this, ball.owner) < 24 && this.cooldown <= 0) {
      this.passOrTackle(ball, true);
    }
  }

  passOrTackle(ball, ai = false) {
    this.cooldown = ai ? 0.35 : 0.25;
    if (ball.owner === this) {
      const mates = this.team.players.filter(p => p !== this);
      let best = mates[0];
      let bestScore = -Infinity;
      for (const m of mates) {
        const forward = (m.x - this.x) * this.team.direction;
        const spacing = 140 - Math.abs(m.y - this.y);
        const score = forward * 1.3 + spacing;
        if (score > bestScore) {
          bestScore = score;
          best = m;
        }
      }

      const angle = Math.atan2(best.y - this.y, best.x - this.x);
      const power = 320 + Math.random() * 120;
      ball.kick(angle, power);
      this.team.game.lastAction = `${this.team.name}: passe`;
    } else {
      const target = ball.owner;
      if (!target || target.team === this.team) return;
      if (dist(this, target) < 28) {
        if (Math.random() < 0.58 + 0.2 * this.mood) {
          ball.owner = this;
          this.team.game.lastAction = `${this.team.name}: bote certo`;
          this.team.game.emotionPulse(this.team, 0.08);
        } else {
          this.team.game.lastAction = `${this.team.name}: bote falhou`;
          this.team.game.emotionPulse(this.team, -0.03);
        }
      }
    }
  }

  shoot(ball, ai = false) {
    if (ball.owner !== this) return;
    this.cooldown = ai ? 0.5 : 0.35;
    const gx = this.team.direction > 0 ? PITCH.x + PITCH.w + 8 : PITCH.x - 8;
    const gy = HEIGHT / 2 + (Math.random() - 0.5) * 80;
    const angle = Math.atan2(gy - this.y, gx - this.x);
    const fatiguePenalty = (100 - this.stamina) * 1.7;
    const power = clamp(520 - fatiguePenalty + Math.random() * 100, 290, 620);
    ball.kick(angle, power);
    this.team.game.lastAction = `${this.team.name}: finalização`;
  }

  render(selected = false) {
    ctx.beginPath();
    ctx.fillStyle = this.team.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    if (selected) {
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

class Team {
  constructor(game, name, color, direction, style, layout) {
    this.game = game;
    this.name = name;
    this.color = color;
    this.direction = direction;
    this.style = style;
    this.score = 0;
    this.players = layout.map((p, i) => new Player(this, p.x, p.y, p.role, i === 0));
  }

  reset() {
    for (const p of this.players) {
      p.x = p.homeX;
      p.y = p.homeY;
      p.stamina = 100;
      p.cooldown = 0;
    }
  }
}

class Match {
  constructor() {
    this.time = 0;
    this.maxTime = 180;
    this.lastAction = 'Início de jogo';

    const left = [
      { x: PITCH.x + 70, y: HEIGHT / 2, role: 'goleiro' },
      { x: PITCH.x + 220, y: HEIGHT / 2 - 120, role: 'defesa' },
      { x: PITCH.x + 220, y: HEIGHT / 2 + 120, role: 'defesa' },
      { x: PITCH.x + 390, y: HEIGHT / 2 - 70, role: 'meio' },
      { x: PITCH.x + 430, y: HEIGHT / 2 + 80, role: 'ataque' },
    ];

    const right = left.map(p => ({ ...p, x: WIDTH - p.x }));

    this.home = new Team(this, 'Azul', '#60a5fa', 1, 'posse', left);
    this.away = new Team(this, 'Vermelho', '#f87171', -1, 'compacta', right);
    this.ball = new Ball();

    this.userTeam = this.home;
    this.selectedIndex = 2;

    this.coolKey = 0;
    this.finished = false;

    this.centerKickoff();
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
    const kicker = Math.random() < 0.5 ? this.home.players[3] : this.away.players[3];
    this.ball.owner = kicker;
  }

  update() {
    if (keys.has('r')) this.restart();
    if (this.finished) return;

    this.time += DT;
    if (this.time >= this.maxTime) {
      this.finished = true;
      this.lastAction = 'Fim de jogo';
    }

    this.coolKey = Math.max(0, this.coolKey - DT);
    if (keys.has('l') && this.coolKey <= 0) {
      this.selectedIndex = (this.selectedIndex + 1) % this.userTeam.players.length;
      this.coolKey = 0.25;
    }

    const selected = this.userTeam.players[this.selectedIndex];

    for (const p of this.home.players) p.update(this.ball, p === selected);
    for (const p of this.away.players) p.update(this.ball, false);

    this.ball.update();
    this.checkGoal();
    this.dynamicEmotion();
  }

  dynamicEmotion() {
    const diff = this.home.score - this.away.score;
    if (diff > 0) {
      this.emotionPulse(this.home, 0.0008);
      this.emotionPulse(this.away, -0.0006);
    } else if (diff < 0) {
      this.emotionPulse(this.away, 0.0008);
      this.emotionPulse(this.home, -0.0006);
    }
  }

  checkGoal() {
    const isGoalY = this.ball.y > HEIGHT / 2 - GOAL_H / 2 && this.ball.y < HEIGHT / 2 + GOAL_H / 2;
    if (!isGoalY) return;

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
    this.home.score = 0;
    this.away.score = 0;
    this.finished = false;
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
    ctx.arc(WIDTH / 2, HEIGHT / 2, 74, 0, Math.PI * 2);
    ctx.stroke();

    const boxW = 150, boxH = 250;
    ctx.strokeRect(PITCH.x, HEIGHT / 2 - boxH / 2, boxW, boxH);
    ctx.strokeRect(PITCH.x + PITCH.w - boxW, HEIGHT / 2 - boxH / 2, boxW, boxH);

    ctx.strokeRect(PITCH.x - 10, HEIGHT / 2 - GOAL_H / 2, 10, GOAL_H);
    ctx.strokeRect(PITCH.x + PITCH.w, HEIGHT / 2 - GOAL_H / 2, 10, GOAL_H);
  }

  renderHUD() {
    const min = Math.floor(this.time / 60);
    const sec = Math.floor(this.time % 60).toString().padStart(2, '0');
    const selected = this.userTeam.players[this.selectedIndex];

    ctx.fillStyle = 'rgba(15,23,42,0.72)';
    ctx.fillRect(12, 10, 380, 96);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 26px Inter, Arial';
    ctx.fillText(`${this.home.name} ${this.home.score} x ${this.away.score} ${this.away.name}`, 22, 44);

    ctx.font = '18px Inter, Arial';
    ctx.fillText(`Tempo: ${min}:${sec} / 3:00`, 22, 70);
    ctx.fillText(`Última ação: ${this.lastAction}`, 22, 95);

    ctx.fillStyle = 'rgba(15,23,42,0.72)';
    ctx.fillRect(WIDTH - 250, 10, 238, 95);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`Stamina: ${Math.round(selected.stamina)}%`, WIDTH - 240, 42);
    ctx.fillText(`Emoção: ${selected.mood.toFixed(2)}`, WIDTH - 240, 66);
    ctx.fillText(`Estilo IA: ${this.away.style}`, WIDTH - 240, 90);

    if (this.finished) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 52px Inter, Arial';
      ctx.fillText('FIM DE JOGO', WIDTH / 2 - 180, HEIGHT / 2 - 8);
      ctx.font = '24px Inter, Arial';
      ctx.fillText('Pressione R para jogar novamente', WIDTH / 2 - 185, HEIGHT / 2 + 32);
    }
  }

  render() {
    this.renderPitch();

    const selected = this.userTeam.players[this.selectedIndex];
    this.home.players.forEach(p => p.render(p === selected));
    this.away.players.forEach(p => p.render(false));

    ctx.beginPath();
    ctx.fillStyle = '#f8fafc';
    ctx.arc(this.ball.x, this.ball.y, 6, 0, Math.PI * 2);
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
