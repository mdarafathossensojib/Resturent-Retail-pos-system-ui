/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
        {
          protocol: "https",
          hostname: "images.unsplash.com",
          },
          {
          protocol: "https",
          hostname: "res.cloudinary.com",
          pathname: "/mdarafathossen/**",
        },
      ],
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
