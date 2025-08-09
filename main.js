import { Boot } from './state/Boot.js';
import { Game } from './state/Game.js';
import { UIManager } from './ui/UIManager.js';

// PixiJS via ESM CDN
import * as PIXI from 'https://cdn.jsdelivr.net/npm/pixi.js@8.3.5/dist/pixi.min.mjs';

// Global PIXI namespace export for tools that might expect window.PIXI
window.PIXI = PIXI;

const gameRoot = document.getElementById('game-root');

const app = new PIXI.Application();
await app.init({
  background: '#0b0e15',
  resizeTo: window,
  antialias: true,
  powerPreference: 'high-performance',
});

gameRoot.appendChild(app.canvas);

// Global registry
export const Services = {
  app,
  rng: new (class RNG {
    constructor(seed = Date.now()) { this.seed = seed >>> 0; }
    next() {
      // xorshift32
      let x = this.seed;
      x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
      this.seed = x >>> 0;
      return this.seed / 0xffffffff;
    }
    range(min, max){ return min + (max - min) * this.next(); }
    pick(arr){ return arr[Math.floor(this.range(0, arr.length))]; }
  })(),
};

// Scene graph roots
const world = new PIXI.Container();
world.sortableChildren = true;
app.stage.addChild(world);

// UI
const ui = new UIManager();
document.body.insertAdjacentHTML('afterbegin', `
  <div class="topbar">
    <div class="brand"><span class="dot"></span> Apartman Hayatı</div>
    <div class="hud">
      <div class="pill" id="day-pill">1. Gün - Sabah</div>
      <div class="pill meters">
        <span>İtibar</span>
        <span class="meter"><i id="rep-meter" style="width:60%"></i></span>
      </div>
      <button class="button" id="btn-next">Sonraki Olay</button>
    </div>
  </div>
`);

// Boot assets and then start
await Boot(Services);

const game = new Game(Services, { world, ui });
game.start();

// Hook UI buttons
document.getElementById('btn-next').addEventListener('click', () => game.triggerRandomEvent());

// Resize world scale for crisp pixel look
function resize() {
  const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  world.scale.set(scale);
  world.position.set((window.innerWidth - 1280 * scale) / 2, (window.innerHeight - 720 * scale) / 2);
}
window.addEventListener('resize', resize);
resize();


