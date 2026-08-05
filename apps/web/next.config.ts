import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Railway sirve la app desde un contenedor: standalone deja en
  // .next/standalone un server.js con solo las dependencias que hacen falta,
  // en lugar de arrastrar node_modules entero a la imagen.
  output: "standalone",
  // El monorepo vive dos niveles por encima de apps/web y ahí está el
  // package-lock, que es lo que Next usa para deducir la raíz a la hora de
  // recopilar los ficheros del standalone.
  outputFileTracingRoot: new URL("../../", import.meta.url).pathname,
};

export default nextConfig;
