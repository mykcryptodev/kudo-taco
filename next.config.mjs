/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.mjs");

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
  webpack: (config, {}) => {
    // exclude the solidity folder from next.js build
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-var-requires
    config.plugins.push(new (require('webpack').IgnorePlugin)({ resourceRegExp: /^\.\/solidity$/, contextRegExp: /next$/ }));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return config;
  }
};

export default config;
