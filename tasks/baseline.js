module.exports = {
  options: {
    baselinePath: `reports/baseline-${ process.version.split('.')[0] }.json`,
    failIfSlower: true,
    useColors: true,
    minTime: 3
  },
  compare: {
    src: 'bench/render.js'
  },
  update: {
    options: {
      baselinePath: `reports/baseline-${ process.version.split('.')[0] }.json`,
      updateBaseline: true
    },
    src: 'bench/render.js'
  }
};
