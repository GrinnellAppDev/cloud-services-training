import { getTempTaskId, isTempTaskId, asciiCompare } from "./util"

it("getTempTaskId generates string ids that isTempTaskId", () => {
  expect(typeof getTempTaskId()).toBe("string")
  expect(isTempTaskId(getTempTaskId())).toBe(true)
})

it("getTempTaskId generates strings that come after all alphanumeric strings in ascii ordering", () => {
  expect(asciiCompare("a", getTempTaskId())).toBeLessThan(0)
  expect(asciiCompare("1", getTempTaskId())).toBeLessThan(0)
  expect(asciiCompare("A", getTempTaskId())).toBeLessThan(0)
  expect(
    asciiCompare("1ba13SEFSsf32fssf3f3f3fs324rsf", getTempTaskId())
  ).toBeLessThan(0)
})

it("getTempTaskId generates strings that are sequential by creation time in ascii ordering", async () => {
  const id1 = getTempTaskId()
  await new Promise(res => requestAnimationFrame(res))
  const id2 = getTempTaskId()

  expect(asciiCompare(id1, id2)).toBeLessThan(0)
})

it("isTempTaskId returns false when given a regular-ish string", () => {
  expect(isTempTaskId("foo")).toBe(false)
  expect(isTempTaskId("~foo")).toBe(false)
  expect(isTempTaskId("!foo")).toBe(false)
})

it("isTempTaskId returns false when given a non-string input", () => {
  expect(isTempTaskId(undefined)).toBe(false)
  expect(isTempTaskId(null)).toBe(false)
  expect(isTempTaskId(533)).toBe(false)
  expect(isTempTaskId({ substring: () => "~" })).toBe(false)
  expect(isTempTaskId({ substring: () => "!" })).toBe(false)
})

describe("asciiCompare", () => {
  it("compares single char strings", () => {
    expect(asciiCompare("b", "~")).toBeLessThan(0)
    expect(asciiCompare("a", "b")).toBeLessThan(0)
    expect(asciiCompare("1", "a")).toBeLessThan(0)
    expect(asciiCompare("!", "1")).toBeLessThan(0)
    expect(asciiCompare("!", "~")).toBeLessThan(0)

    expect(asciiCompare("~", "b")).toBeGreaterThan(0)
    expect(asciiCompare("b", "a")).toBeGreaterThan(0)
    expect(asciiCompare("a", "1")).toBeGreaterThan(0)
    expect(asciiCompare("1", "!")).toBeGreaterThan(0)
    expect(asciiCompare("~", "!")).toBeGreaterThan(0)

    expect(asciiCompare("a", "a")).toBe(0)
    expect(asciiCompare("1", "1")).toBe(0)
    expect(asciiCompare("~", "~")).toBe(0)
    expect(asciiCompare("!", "!")).toBe(0)
  })

  it("compares multi char strings with matching first few letters", () => {
    expect(asciiCompare("abb", "ab~")).toBeLessThan(0)
    expect(asciiCompare("aba", "abb")).toBeLessThan(0)
    expect(asciiCompare("ab1", "aba")).toBeLessThan(0)
    expect(asciiCompare("ab!", "ab1")).toBeLessThan(0)
    expect(asciiCompare("ab!", "ab~")).toBeLessThan(0)

    expect(asciiCompare("ab~", "abb")).toBeGreaterThan(0)
    expect(asciiCompare("abb", "aba")).toBeGreaterThan(0)
    expect(asciiCompare("aba", "ab1")).toBeGreaterThan(0)
    expect(asciiCompare("ab1", "ab!")).toBeGreaterThan(0)
    expect(asciiCompare("ab~", "ab!")).toBeGreaterThan(0)

    expect(asciiCompare("aba", "aba")).toBe(0)
    expect(asciiCompare("ab1", "ab1")).toBe(0)
    expect(asciiCompare("ab~", "ab~")).toBe(0)
    expect(asciiCompare("ab!", "ab!")).toBe(0)
  })

  it("compares multi char strings with different lengths", () => {
    expect(asciiCompare("ab", "ab~")).toBeLessThan(0)
    expect(asciiCompare("ab", "abb")).toBeLessThan(0)
    expect(asciiCompare("ab", "aba")).toBeLessThan(0)
    expect(asciiCompare("ab", "ab1")).toBeLessThan(0)
    expect(asciiCompare("ab", "ab!")).toBeLessThan(0)

    expect(asciiCompare("ab~", "ab")).toBeGreaterThan(0)
    expect(asciiCompare("abb", "ab")).toBeGreaterThan(0)
    expect(asciiCompare("aba", "ab")).toBeGreaterThan(0)
    expect(asciiCompare("ab1", "ab")).toBeGreaterThan(0)
    expect(asciiCompare("ab!", "ab")).toBeGreaterThan(0)
  })

  it("compares multi char strings with different first chars", () => {
    expect(asciiCompare("!ba", "1ba")).toBeLessThan(0)
    expect(asciiCompare("1b1", "ab1")).toBeLessThan(0)
    expect(asciiCompare("ab~", "~b~")).toBeLessThan(0)
    expect(asciiCompare("!b!", "~b!")).toBeLessThan(0)
    0
    expect(asciiCompare("1ba", "!ba")).toBeGreaterThan(0)
    expect(asciiCompare("ab1", "1b1")).toBeGreaterThan(0)
    expect(asciiCompare("~b~", "ab~")).toBeGreaterThan(0)
    expect(asciiCompare("~b!", "!b!")).toBeGreaterThan(0)
  })

  it("sorts arrays", () => {
    expect("ab!~1A".split("").sort(asciiCompare)).toEqual("!1Aab~".split(""))
  })
})
