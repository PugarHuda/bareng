import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const TL = JSON.parse(readFileSync("timeline.json", "utf8"));
const ff = (args) => execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args]);

// 1) per-scene audio padded to its slot duration, then concat → voice.wav
const list = [];
TL.scenes.forEach((s, i) => {
  const out = `sc${String(i).padStart(2, "0")}.wav`;
  ff(["-i", s.mp3, "-af", "apad", "-t", String(s.dur), "-ar", "48000", "-ac", "2", out]);
  list.push(`file '${out}'`);
});
writeFileSync("concat.txt", list.join("\n"));
ff(["-f", "concat", "-safe", "0", "-i", "concat.txt", "-c", "copy", "voice.wav"]);
console.log("✓ voice track built");

// 2) SRT (subtitle shows during narration, hides during the tail)
const pad = (n, l = 2) => String(n).padStart(l, "0");
const fmt = (t) => `${pad(Math.floor(t / 3600))}:${pad(Math.floor((t % 3600) / 60))}:${pad(Math.floor(t % 60))},${pad(Math.round((t - Math.floor(t)) * 1000), 3)}`;
const wrap = (txt) => {
  const words = txt.replace(/—/g, "-").split(/\s+/); const lines = []; let cur = "";
  for (const w of words) { if ((cur + " " + w).trim().length > 46) { lines.push(cur.trim()); cur = w; } else cur += " " + w; }
  if (cur.trim()) lines.push(cur.trim());
  return lines.slice(0, 3).join("\n");
};
let srt = "";
TL.scenes.forEach((s, i) => { srt += `${i + 1}\n${fmt(s.start)} --> ${fmt(s.start + s.narr)}\n${wrap(s.text)}\n\n`; });
writeFileSync("demo.srt", srt);
console.log("✓ demo.srt written");

// 3) mux the recorded webm + voice + burned-in subtitles → mp4
const webm = readdirSync(".").find((f) => f.endsWith(".webm"));
if (!webm) throw new Error("no .webm recording found — run record.mjs first");
console.log("webm:", webm);
const style = "FontName=Arial,FontSize=15,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&HDD111111,BackColour=&H99000000,BorderStyle=1,Outline=2,Shadow=1,Alignment=2,MarginV=30";
ff(["-i", webm, "-i", "voice.wav",
  "-vf", `subtitles=demo.srt:force_style='${style}'`,
  "-map", "0:v:0", "-map", "1:a:0",
  "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-shortest", "bareng-demo.mp4"]);
console.log("✓ DONE → bareng-demo.mp4");
