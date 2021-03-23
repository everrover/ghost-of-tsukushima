module.exports = (JSON) => {
  for (let prop in JSON) {
    if (!JSON[prop] || JSON[prop] === null || JSON[prop] === undefined) {
      delete JSON[prop]
    }
  }
  return JSON
}