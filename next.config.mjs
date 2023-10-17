// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.mjs");
const rulesToProcess = [/\.m?js/, /\.(js|cjs|mjs)$/].map(String);
const dirToIgnore = /solidity/;

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  /**
   * If you are using `appDir` then you must comment the below `i18n` config out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  /**
   *
   * @param {import('webpack').Configuration} config
   * @param {import('next/dist/server/config-shared').WebpackConfigContext} context
   * @returns {import('webpack').Configuration}
   */
  webpack: (config) => {
    config.module.rules = config.module.rules.map((rule) => {
      if (rule !== "..." && rulesToProcess.indexOf(String(rule.test)) > -1) {
        rule.exclude = [dirToIgnore];
      }
      return rule;
    });
    return config;
  },
};

export default config;
