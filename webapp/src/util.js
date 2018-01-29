export const getTempTaskId = () => `~${Date.now()}`
export const isTempTaskId = x => typeof x === "string" && /^~\d+$/.test(x)

export const asciiCompare = (a, b) => {
  let comparison = 0

  for (let i = 0; comparison === 0 && (i < a.length || i < b.length); i++) {
    comparison = (a.charCodeAt(i) || 0) - (b.charCodeAt(i) || 0)
  }

  return comparison
}
