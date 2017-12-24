// It should start with a ~ so it rises above all of the permanent ids in sort order
export const getTempTaskId = () => `~${Date.now()}`
export const isTempTaskId = x => typeof x === "string" && /^~\d+$/.test(x)

export const asciiCompare = (a, b) => {
  let comparison = 0

  for (let i = 0; comparison === 0 && (i < a.length || i < b.length); i++) {
    comparison = (a.charCodeAt(i) || -1) - (b.charCodeAt(i) || -1)
  }

  return comparison
}
