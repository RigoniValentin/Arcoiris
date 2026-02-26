import { useEffect, useRef } from "react";

const useBackgroundMusic = (audioSrc: string): void => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Crear el elemento de audio
    audioRef.current = new Audio(audioSrc);
    audioRef.current.loop = false; // Solo una vez por carga
    audioRef.current.volume = 0.3; // Volumen moderado
    audioRef.current.preload = "auto";

    // Event listeners
    const handleCanPlayThrough = () => {
      if (audioRef.current) {
        // Pequeño delay para asegurar que la página esté completamente cargada
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current
              .play()
              .then(() => {
                console.log("Música de bienvenida reproducida");
              })
              .catch((error) => {
                // Si el autoplay está bloqueado, simplemente logeamos
                console.log(
                  "Autoplay bloqueado por el navegador - la música no se pudo reproducir automáticamente",
                  error,
                );
              });
          }
        }, 1000); // Delay de 1 segundo
      }
    };

    const handleError = (error: any) => {
      console.warn("Error loading background music:", error);
    };

    audioRef.current.addEventListener("canplaythrough", handleCanPlayThrough);
    audioRef.current.addEventListener("error", handleError);

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener(
          "canplaythrough",
          handleCanPlayThrough,
        );
        audioRef.current.removeEventListener("error", handleError);
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioSrc]);
};

export default useBackgroundMusic;
