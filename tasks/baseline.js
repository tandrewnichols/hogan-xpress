module.exports = {
  options: {
    baselinePath: 'reports/baseline.json',
    failIfSlower: true,
    useColors: true,
    minTime: 3
  },
  compare: {
    src: 'bench/render.js'
  },
  update: {
    options: {
      updateBaseline: true
    },
    src: 'bench/render.js'
  }
};
