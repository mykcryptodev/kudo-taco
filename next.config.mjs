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
  webpack: async (config, {}) => {
    // Dynamically import webpack's IgnorePlugin
    const webpack = await import('webpack');
    const IgnorePlugin = webpack.IgnorePlugin;
    // Ignore the solidity folder
    // eslint-disable-next-line
    config.plugins.push(new IgnorePlugin({ resourceRegExp: /solidity/ }));

    // Prevent bundling of solidity files

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    config.externals = config.externals || [];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    config.externals.push(/solidity/);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return config;
  }
};

export default config;
