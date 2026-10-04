import { copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
for (const [original, data] of [['public/assets/resume.pdf', 'public/assets/resume-data.txt'], ['public/assets/audio/drowning-in-vertigo.mp3', 'public/assets/audio/track-data.txt']]) {
  copyFileSync(fileURLToPath(new URL(original, root)), fileURLToPath(new URL(data, root)));
}
