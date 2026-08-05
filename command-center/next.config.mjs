/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy API + sockets to the existing backend so the Command Center is same-origin.
  async rewrites() {
    const api = process.env.WORKORA_API || "http://localhost:7777";
    return [
      { source: "/api/:path*", destination: `${api}/api/:path*` },
      { source: "/socket.io/:path*", destination: `${api}/socket.io/:path*` },
    ];
  },
};
export default nextConfig;
