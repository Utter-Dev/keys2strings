import './style.css';
import { createPiano } from './piano';
import { createGuitar } from './guitar';
import { createControls } from './controls';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <div class="header">
    <h1>Keys2Strings</h1>
    <p>See how notes and chords translate between guitar and piano</p>
  </div>
  <div id="controls-container"></div>
  <div class="section">
    <span class="section-label">Piano</span>
    <div id="piano-container"></div>
  </div>
  <div class="section">
    <span class="section-label">Guitar</span>
    <div id="guitar-container"></div>
  </div>
`;

createControls(document.getElementById('controls-container')!);
createPiano(document.getElementById('piano-container')!);
createGuitar(document.getElementById('guitar-container')!);
