"use client";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { useState, useRef, useEffect } from "react";

// @ts-ignore
const VideoToMp3Converter = ({ setFragments }) => {
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const [loaded, setLoaded] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());
  const messageRef = useRef(null);

  const load = async () => {
    try {
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      const ffmpeg = ffmpegRef.current;
      ffmpeg.on("log", ({ message }) => {
        // @ts-ignore
        messageRef.current.innerHTML = message;
        console.log(message);
      });
      ffmpeg.on("progress", ({ progress }) => {
        // @ts-ignore
        setProgress((progress * 100).toFixed(0));
      });
      // toBlobURL is used to bypass CORS issue, urls with the same
      // domain can be used directly.
      await ffmpeg.load({
        coreURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.js`,
          "text/javascript"
        ),
        wasmURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.wasm`,
          "application/wasm"
        ),
      });
      setError(null);
      setLoaded(true);
    } catch (err) {
      // @ts-ignore
      setError("Error al inicializar FFmpeg: " + err.message);
    }
  };

  // Manejar la selección de archivo
  // @ts-ignore
  const handleFileSelect = async (event) => {
    setFragments([]);
    const ffmpeg = ffmpegRef.current;
    try {
      if (!loaded || !ffmpeg) {
        await load();
      }

      const file = event.target.files[0];
      if (!file) return;

      setIsConverting(true);
      setProgress(0);
      setError(null);

      // Leer el archivo como ArrayBuffer
      const fileData = await file.arrayBuffer();

      const fileName = file.name;

      // Escribir el archivo en el sistema de archivos virtual de FFmpeg
      await ffmpeg.writeFile(`${fileName}.mp4`, new Uint8Array(fileData));

      await ffmpeg.exec([
        "-i",
        `${fileName}.mp4`,
        "-f",
        "segment",
        "-segment_time",
        "900",
        "-q:a",
        "0",
        "-map",
        "a",
        `${fileName}_%03d.mp3`,
      ]);

      let segmentIndex = 0;
      let filesFound = true;
      while (filesFound) {
        try {
          const fileNameAudio = `${fileName}_${String(segmentIndex).padStart(
            3,
            "0"
          )}.mp3`;
          const data = await ffmpeg.readFile(fileNameAudio);

          // Crear y descargar el archivo
          const blob = new Blob([data], { type: "audio/mp3" });
          const url = URL.createObjectURL(blob);

          // @ts-ignore
          setFragments((prev) => [...prev, { url, fileName: fileNameAudio }]);

          segmentIndex++;
        } catch (err) {
          filesFound = false;
        }
      }

      setIsConverting(false);
    } catch (err) {
      // @ts-ignore
      setError("Error en la conversión: " + err.message);
      setIsConverting(false);
    }
  };

  useEffect(() => {
    if (!loaded && ffmpegRef.current === null) {
      load();
    }
  }, []);

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Convertir Video a MP3</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <div className="space-y-4">
        <input
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          disabled={isConverting}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />

        {isConverting && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 text-center">
              Progreso: {progress}%
            </p>
            <p ref={messageRef}></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoToMp3Converter;
