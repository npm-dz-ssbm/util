import * as $ from "./core.js";

function b6Char(n: number): string {
  const mLookup = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "-",
  ];
  return mLookup[n] || "_";
}

function b8sToB6s(...b8s: number[]) {
  const res: number[] = [];
  const incoming = [...b8s];
  incoming.reverse();
  for (const chunk of $.chunk(incoming, 3)) {
    const b0 = Math.pow(256, 0) * (chunk[0] || 0);
    const b1 = Math.pow(256, 1) * (chunk[1] || 0);
    const b2 = Math.pow(256, 2) * (chunk[2] || 0);
    let v = b0 + b1 + b2;
    for (let j = 0; j < 4; j++) {
      res.push(v % 64);
      v = Math.floor(v / 64);
    }
  }
  res.reverse();
  let start = 0;
  while (start < 4 && !res[start]) {
    start++;
  }
  return res.slice(start);
}

function strIdStr(s: string): string {
  const encoder = new TextEncoder();
  return b8sToB6s(...encoder.encode(s))
    .map((n) => b6Char(n))
    .join("");
}

export type Literal = null | undefined | string | number | boolean;

const OF_LITERALS = new Map<Literal, string>();
OF_LITERALS.set(undefined, "_");
OF_LITERALS.set(null, "0");
OF_LITERALS.set(true, "t");
OF_LITERALS.set(false, "f");

function str1(v: Literal): string {
  const litVal = OF_LITERALS.get(v);
  if (litVal) {
    return litVal;
  } else if (typeof v === "number") {
    return `N${strIdStr(`${v}`)}`;
  } else {
    return `S${strIdStr(v as string)}`;
  }
}

export function str(...vs: Literal[]): string {
  return vs.map(str1).join(".");
}
