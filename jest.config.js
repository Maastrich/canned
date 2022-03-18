/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const { defaults: tsjPreset } = require("ts-jest/presets");

module.exports = {
  testEnvironment: "jsdom",
  transform: {
    ...tsjPreset.transform,
    "\\.[jt]sx?$": "babel-jest",
  },
};
