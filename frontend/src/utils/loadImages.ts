// Uses import.meta.glob (supported in Vite) to import all images eagerly.
const images = Object.values(
  import.meta.glob("../assets/ImagenesCarrusel/*.{png,jpg,jpeg,svg}", {
    eager: true,
  }),
).map((mod: any) => mod.default);

export const loadImages = images;
