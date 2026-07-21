/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["escpos", "escpos-usb", "usb"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
