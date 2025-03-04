/* eslint-env node */ 
module.exports = {
  // For client files
  "client/**/*.{js,jsx,ts,tsx}": [
    "cd client && eslint --fix",
    "cd client && prettier --write",
  ],
  // For server files
  "server/**/*.{js,jsx,ts,tsx}": [
    "cd server && eslint --fix",
    "cd server && prettier --write",
  ],
};
