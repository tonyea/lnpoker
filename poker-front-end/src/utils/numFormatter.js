const nFormatter = (num, digits) => {
  const si = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" }
  ];
  // regex
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;

  let i;
  for (i = si.length - 1; i > 0; i--) {
    if (num >= si[i].value) {
      break;
    }
  }
  return (num / si[i].value).toFixed(digits).replace(rx, "$1") + si[i].symbol;
};

/*
 * Tests
 */
// const tests = [
//   { num: 1234, digits: 1 },
//   { num: 100000000, digits: 1 },
//   { num: 299792458, digits: 1 },
//   { num: 759878, digits: 1 },
//   { num: 759878, digits: 0 },
//   { num: 123, digits: 1 },
//   { num: 123.456, digits: 1 },
//   { num: 123.456, digits: 2 },
//   { num: 123.456, digits: 4 }
// ];
// let i;
// for (i = 0; i < tests.length; i++) {
//   console.log(
//     "nFormatter(" +
//       tests[i].num +
//       ", " +
//       tests[i].digits +
//       ") = " +
//       nFormatter(tests[i].num, tests[i].digits)
//   );
// }

export default nFormatter;
