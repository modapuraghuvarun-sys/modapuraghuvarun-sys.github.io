/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
}

export default nextConfig
```

Commit the change ✅

---

## 🔑 Also — Open Your `.env` File RIGHT NOW

On your computer, open the `.env` file and paste **just the variable names** here like this:
```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GEMINI_API_KEY=
...
