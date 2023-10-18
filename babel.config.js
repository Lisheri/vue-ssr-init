module.exports = {
  presets: [['@vue/cli-plugin-babel/preset', {
    // polyfills: [
    //   'es.array.iterator',
    //   'es.object.assign',
    //   'es.promise',
    //   'es.promise.finally',
    //   'es.array.find',
    // ],
  }], '@babel/preset-env'],
  plugins: ['@babel/plugin-transform-runtime'],
}
