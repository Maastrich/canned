import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

import external from "rollup-plugin-peer-deps-external";

import pkg from "./package.json";

export default {
  input: pkg.source,
  output: [{ file: pkg.module, format: "esm", exports: "named" }],
  plugins: [
    typescript({ tsconfig: "./tsconfig.json" }),
    external(),
    babel({
      exclude: ["node_modules/**", "src/webapp/**"],
      babelHelpers: "bundled",
    }),
    nodeResolve(),
    commonjs(),
    json(),
  ],
};
