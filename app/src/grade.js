// Colour grades for Panel Heat covers.
//
// A grade is a canvas filter string (applied while the photo is drawn) plus
// two translucent gradient washes painted over the photo: a warm sunset wash
// running top to bottom and a teal-to-pink split tone running diagonally.
// Each grade also names the accent colours the caption lettering uses.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Vice Sunset',
    filter: 'saturate(1.3) contrast(1.12) brightness(1.04)',
    washTop: 'rgba(255, 110, 64, 0.16)',
    washMid: 'rgba(255, 60, 120, 0.05)',
    washBottom: 'rgba(214, 40, 130, 0.28)',
    splitStart: 'rgba(64, 224, 255, 0.12)',
    splitEnd: 'rgba(255, 64, 170, 0.14)',
    accent: '#ffb03a',
    titleTop: '#fff7e0',
    titleBottom: '#ff9d2e',
    tagline: '#ffd9ec',
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    filter: 'saturate(1.5) contrast(1.2) brightness(0.97)',
    washTop: 'rgba(20, 40, 140, 0.20)',
    washMid: 'rgba(120, 0, 160, 0.08)',
    washBottom: 'rgba(10, 10, 60, 0.34)',
    splitStart: 'rgba(0, 240, 255, 0.20)',
    splitEnd: 'rgba(255, 0, 190, 0.20)',
    accent: '#2ee6ff',
    titleTop: '#e8fdff',
    titleBottom: '#2ec5ff',
    tagline: '#ffb3ec',
  },
  {
    id: 'gold',
    name: 'Golden Hour',
    filter: 'saturate(1.18) contrast(1.06) brightness(1.09) sepia(0.28)',
    washTop: 'rgba(255, 190, 80, 0.14)',
    washMid: 'rgba(255, 150, 60, 0.05)',
    washBottom: 'rgba(160, 70, 20, 0.24)',
    splitStart: 'rgba(255, 230, 150, 0.10)',
    splitEnd: 'rgba(255, 120, 60, 0.12)',
    accent: '#ffe08a',
    titleTop: '#fffbe8',
    titleBottom: '#ffc94d',
    tagline: '#ffe9c9',
  },
  {
    id: 'noir',
    name: 'Midnight Noir',
    filter: 'saturate(0.22) contrast(1.32) brightness(0.92)',
    washTop: 'rgba(30, 34, 48, 0.22)',
    washMid: 'rgba(20, 22, 30, 0.06)',
    washBottom: 'rgba(0, 0, 0, 0.42)',
    splitStart: 'rgba(160, 190, 255, 0.08)',
    splitEnd: 'rgba(0, 0, 0, 0.10)',
    accent: '#e8ecf4',
    titleTop: '#ffffff',
    titleBottom: '#b9c2d4',
    tagline: '#d5dbe8',
  },
  {
    id: 'raw',
    name: 'Raw Photo',
    filter: 'saturate(1.03) contrast(1.03) brightness(1.0)',
    washTop: 'rgba(0, 0, 0, 0)',
    washMid: 'rgba(0, 0, 0, 0)',
    washBottom: 'rgba(0, 0, 0, 0.10)',
    splitStart: 'rgba(0, 0, 0, 0)',
    splitEnd: 'rgba(0, 0, 0, 0)',
    accent: '#ffffff',
    titleTop: '#ffffff',
    titleBottom: '#f2f2f2',
    tagline: '#ffffff',
  },
];

export function gradeById(id) {
  return GRADES.find((grade) => grade.id === id) ?? GRADES[0];
}

// Paints the grade's washes over whatever photo is already drawn inside the
// rectangle (x, y, w, h) of ctx. The caller clips to the panel first.
export function paintGradeWashes(ctx, grade, x, y, w, h) {
  const wash = ctx.createLinearGradient(x, y, x, y + h);
  wash.addColorStop(0, grade.washTop);
  wash.addColorStop(0.45, grade.washMid);
  wash.addColorStop(1, grade.washBottom);
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);

  const split = ctx.createLinearGradient(x, y, x + w, y + h);
  split.addColorStop(0, grade.splitStart);
  split.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  split.addColorStop(1, grade.splitEnd);
  ctx.fillStyle = split;
  ctx.fillRect(x, y, w, h);
}
