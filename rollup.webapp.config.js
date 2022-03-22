import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import replace from '@rollup/plugin-replace';
import css from 'rollup-plugin-import-css';
import execute from 'rollup-plugin-shell'



import external from "rollup-plugin-peer-deps-external";

import pkg from "./package.json";
import { readdirSync } from "fs";
import { resolve } from "path";

export default {
  input: pkg.webapp.source,
  output: [
    { file: pkg.webapp.main, format: "cjs", sourcemap: true, inlineDynamicImports: true },
    { file: pkg.webapp.module, format: "esm", sourcemap: true, inlineDynamicImports: true },
  ],
  plugins: [
    typescript({ tsconfig: "./tsconfig.webapp.json" }),
    external(),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify('development')
    }),
    babel({
      presets: ["@babel/preset-react"],
      exclude: "node_modules/**",
      babelHelpers: "bundled",
    }),
    nodeResolve(),
    commonjs(),
    json(),
    css(),
    {
      name: 'watch-external',
      buildStart() {
        const files = readdirSync('public');
        for (const file of files) {
          this.addWatchFile(resolve(`public/${file}`));
        }
      }
    },
    execute({ commands: ["cp public/* dist/webapp"], watch: true, hook: "writeBundle" }),
  ]
};
