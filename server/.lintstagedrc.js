/* eslint-env node */
module.exports = {
  "client/**/*.{js,jsx,ts,tsx}": (filenames) => {
    const files = filenames.map((f) => f.replace("client/", "")).join(" ");
    return [
      `cd client && NODE_OPTIONS=--max-old-space-size=4096 eslint --fix ${files}`,
      `cd client && prettier --write ${files}`,
    ];
  },
  "server/**/*.{js,jsx,ts,tsx}": (filenames) => {
    const files = filenames.map((f) => f.replace("server/", "")).join(" ");
    return [
      `cd server && eslint --fix ${files}`,
      `cd server && prettier --write ${files}`,
    ];
  },
};
