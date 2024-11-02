"use client";

import { Download, FileAudio, FileVideo, Loader2, Upload } from "lucide-react";
import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { blobToBase64 } from "@/utils";

export function AudioConverter() {
  const [videoFile, setVideoFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState(process.env.OPENAI_API_KEU);
  const [fragmentedFiles, setFragmentedFiles] = useState([]);
  const [copied, setCopied] = useState(false);
  const [tabValue, setTabValue] = useState("video-to-audio");

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVideoFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith("video/")) {
      // @ts-ignore
      setVideoFile(selectedFile);
      setError(null);
    } else {
      // @ts-ignore
      setError("Por favor, seleccione un archivo de video válido.");
    }
  };

  // @ts-ignore
  const handleAudioFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith("audio/")) {
      setAudioFile(selectedFile);
      setError(null);
    } else {
      // @ts-ignore
      setError("Por favor, seleccione un archivo de audio válido.");
    }
  };

  const handleVideoToAudio = async () => {
    if (!videoFile) return;

    setIsConverting(true);
    setProgress(0);

    try {
      // Simulate video to audio conversion
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // In a real implementation, you would convert the video to audio here
      setAudioUrl(
        URL.createObjectURL(new Blob([videoFile], { type: "audio/mp3" }))
      );
      setAudioFile(
        // @ts-ignore
        new File([videoFile], videoFile.name.replace(/\.[^/.]+$/, ".mp3"), {
          type: "audio/mp3",
        })
      );

      setTabValue("audio-fragments");

      // @ts-expect
    } catch (err) {
      // @ts-ignore
      setError("Error al convertir el video a audio.");
    } finally {
      setIsConverting(false);
    }
  };

  useEffect(() => {
    if (tabValue === "audio-fragments" && audioFile) {
      fragmentFile();
    }
  }, [tabValue]);

  // @ts-ignore
  const getText = async (base64data) => {
    setTranscription([]);
    console.log("CONVERTING");
    setIsConverting(true);
    try {
      const response = await fetch("/api/speechToText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio: base64data,
        }),
      }).then((res) => res.json());
      console.log("response: ", response);
      const { text } = response;
      setTranscription((prev) => [...prev, text]);
      setIsConverting(false);
    } catch (error) {
      setIsConverting(false);
      console.log(error);
    }
  };

  const handleAudioToText = async () => {
    // @ts-ignore
    console.log("audioFile: ", audioFile);
    const audioBlob = new Blob([audioFile], { type: "audio/mp3" });
    console.log("%c audioBlob: ", "color: orange", audioBlob);

    const blob = await blobToBase64(audioBlob);
    await getText(blob);
  };

  const handleFragmentToText = async () => {
    console.log("FRAGMENT TO TEXT");
    for (let i = 0; i < fragmentedFiles.length; i++) {
      try {
        const fragment = fragmentedFiles[i];
        console.log("fragment: ", fragment);
        const fragmentBlob = new Blob([fragment], { type: "audio/mp3" });
        console.log("%c fragmentBlob: ", "color: orange", fragmentBlob);
        const blob = await blobToBase64(fragmentBlob);
        await getText(blob);
      } catch (error) {
        console.log(error);
      }
      console.log("FINISH: ", i);
    }
  };

  // @ts-ignore
  const handleApiKeySubmit = (event) => {
    event.preventDefault();
    setIsModalOpen(false);
    handleAudioToText();
  };

  const fragmentFile = async () => {
    setTranscription([]);
    setProgress(0);
    setFragmentedFiles([]);
    if (!audioFile) {
      // @ts-ignore
      setError("Por favor, seleccione un archivo de audio primero.");
      return;
    }

    const fragmentSize = 15 * 1024 * 1024; // 15 MB
    // @ts-ignore
    const fileBuffer = await audioFile.arrayBuffer();
    const fragments = [];

    setIsConverting(true);

    for (let i = 0; i < fileBuffer.byteLength; i += fragmentSize) {
      const fragmentBlob = new Blob([fileBuffer.slice(i, i + fragmentSize)], {
        // @ts-ignore
        type: audioFile.type,
      });
      // @ts-ignore
      const fragmentName = `${audioFile.name.replace(
        /\.[^/.]+$/,
        ""
        // @ts-ignore
      )}_fragment_${fragments.length + 1}.${audioFile.name.split(".").pop()}`;

      fragments.push(
        // @ts-ignore
        new File([fragmentBlob], fragmentName, { type: audioFile.type })
      );
      setProgress(Math.floor((i / fileBuffer.byteLength) * 100));
    }
    // @ts-ignore
    setFragmentedFiles(fragments);
    setIsConverting(false);
    setProgress(100);
  };
  // @ts-ignore
  const downloadFragment = (fragment) => {
    const url = URL.createObjectURL(fragment);
    const link = document.createElement("a");
    link.href = url;
    link.download = fragment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl space-y-8">
        <h1 className="text-3xl font-bold text-center">
          Conversor de Audio y Video
        </h1>

        <Tabs defaultValue="video-to-audio" value={tabValue} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="video-to-audio"
              onClick={() => setTabValue("video-to-audio")}
            >
              Video a Audio
            </TabsTrigger>
            <TabsTrigger
              value="audio-fragments"
              onClick={() => setTabValue("audio-fragments")}
            >
              Fragmentar Audio
            </TabsTrigger>
            <TabsTrigger
              value="audio-to-text"
              onClick={() => {
                // if (!apiKey) {
                //   setIsModalOpen(true);
                // } else {
                setTabValue("audio-to-text");
                // }
              }}
            >
              Audio a Texto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="video-to-audio" className="space-y-4">
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoFileChange}
                className="hidden"
                id="video-upload"
              />
              <label
                htmlFor="video-upload"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <Upload className="w-12 h-12 mb-4 text-gray-400" />
                <span className="text-lg mb-2">
                  {/* @ts-ignore */}
                  {videoFile ? videoFile.name : "Haga clic para subir un video"}
                </span>
                <span className="text-sm text-gray-500">
                  Formatos soportados: MP4, MOV, AVI
                </span>
              </label>
            </div>

            {videoFile && (
              <div className="flex items-center justify-center space-x-2 text-gray-400">
                <FileVideo className="w-5 h-5" />
                {/* @ts-ignore */}
                <span>{videoFile.name}</span>
              </div>
            )}

            <Button
              onClick={handleVideoToAudio}
              disabled={!videoFile || isConverting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isConverting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Convirtiendo...
                </>
              ) : (
                "Convertir Video a Audio"
              )}
            </Button>

            {isConverting && <Progress value={progress} className="w-full" />}

            {audioUrl && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">
                  Audio Convertido:
                </h3>
                <audio controls className="w-full">
                  <source src={audioUrl} type="audio/mp3" />
                  Su navegador no soporta el elemento de audio.
                </audio>
              </div>
            )}
          </TabsContent>

          <TabsContent value="audio-to-text" className="space-y-4">
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioFileChange}
                className="hidden"
                id="audio-upload"
              />
              <label
                htmlFor="audio-upload"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <Upload className="w-12 h-12 mb-4 text-gray-400" />
                <span className="text-lg mb-2">
                  {/* @ts-ignore */}
                  {audioFile ? audioFile.name : "Haga clic para subir un audio"}
                </span>
                <span className="text-sm text-gray-500">
                  Formatos soportados: mp3, mp3, M4A
                </span>
              </label>
            </div>

            {audioFile && (
              <div className="flex items-center justify-center space-x-2 text-gray-400">
                <FileAudio className="w-5 h-5" />
                {/* @ts-ignore */}
                <span>{audioFile.name}</span>
              </div>
            )}

            <Button
              onClick={handleAudioToText}
              disabled={!audioFile || isConverting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isConverting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transcribiendo...
                </>
              ) : (
                "Convertir Audio a Texto"
              )}
            </Button>

            {isConverting && <Progress value={progress} className="w-full" />}

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {fragmentedFiles.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">
                  Fragmentos generados: {fragmentedFiles.length}
                </h3>
                <h5 className="mt-10 text-lg font-semibold mb-2">
                  Deseas convertir los fragmentos a texto?
                </h5>
                <Button
                  onClick={handleFragmentToText}
                  disabled={!audioFile || isConverting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Transcribiendo...
                    </>
                  ) : (
                    "Convertir fragmentos a Texto"
                  )}
                </Button>
              </div>
            )}
            {transcription.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Transcripción:</h3>
                <div className="space-y-2">
                  {transcription.map((text, index) => (
                    <div className="relative" key={index}>
                      <textarea
                        placeholder="La transcripción aparecerá aquí..."
                        value={transcription}
                        readOnly
                        className="h-64 w-full bg-gray-800 text-gray-100 border-gray-700 p-4"
                      />
                      <button
                        onClick={() => copyToClipboard(text)}
                        className="absolute top-4 right-4 bg-gray-700 text-gray-100 p-2 rounded hover:bg-gray-600"
                        title="Copiar al portapapeles"
                      >
                        Copiar
                      </button>
                      {copied && (
                        <span className="text-green-500 absolute top-16 right-4">
                          ¡Copiado!
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="audio-fragments" className="space-y-4">
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioFileChange}
                className="hidden"
                id="audio-fragment-upload"
              />
              <label
                htmlFor="audio-fragment-upload"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <Upload className="w-12 h-12 mb-4 text-gray-400" />
                <span className="text-lg mb-2">
                  {/* @ts-ignore */}
                  {audioFile ? audioFile.name : "Haga clic para subir un audio"}
                </span>
              </label>
            </div>

            {audioFile && (
              <div className="flex items-center justify-center space-x-2 text-gray-400">
                <FileAudio className="w-5 h-5" />
                {/* @ts-ignore */}
                <span>{audioFile.name}</span>
              </div>
            )}

            <Button
              onClick={fragmentFile}
              disabled={!audioFile || isConverting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isConverting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fragmentando...
                </>
              ) : (
                "Fragmentar Audio"
              )}
            </Button>

            {isConverting && <Progress value={progress} className="w-full" />}

            {fragmentedFiles.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">
                  Fragmentos generados:
                </h3>
                <div className="space-y-2">
                  {fragmentedFiles.map((fragment, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-gray-800 p-2 rounded"
                    >
                      {/* @ts-ignore */}
                      <span>{fragment.name}</span>
                      <Button
                        size="sm"
                        onClick={() => downloadFragment(fragment)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Descargar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-800 text-gray-100">
          <DialogHeader>
            <DialogTitle>Introduzca su clave API de OpenAI</DialogTitle>
            <DialogDescription>
              Se requiere una clave API válida para usar el servicio de
              transcripción de OpenAI.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleApiKeySubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="apiKey" className="text-right">
                  Clave API
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="col-span-3 bg-gray-700 text-gray-100 border-gray-600"
                  placeholder="sk-..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!apiKey}>
                Confirmar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
