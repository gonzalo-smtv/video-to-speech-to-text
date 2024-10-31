"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileAudio, FileVideo, Loader2, Download } from "lucide-react";
import { blobToBase64 } from "@/utils";

export function AudioConverter() {
  const [videoFile, setVideoFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState(process.env.OPENAI_API_KEU);
  const [fragmentedFiles, setFragmentedFiles] = useState([]);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVideoFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith("video/")) {
      setVideoFile(selectedFile);
      setError(null);
    } else {
      setError("Por favor, seleccione un archivo de video válido.");
    }
  };

  const handleAudioFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith("audio/")) {
      setAudioFile(selectedFile);
      setError(null);
    } else {
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
        URL.createObjectURL(new Blob([videoFile], { type: "audio/wav" }))
      );
      setAudioFile(
        new File([videoFile], videoFile.name.replace(/\.[^/.]+$/, ".wav"), {
          type: "audio/wav",
        })
      );
    } catch (err) {
      setError("Error al convertir el video a audio.");
    } finally {
      setIsConverting(false);
    }
  };

  const getText = async (base64data) => {
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
      setTranscription(text);
      setIsConverting(false);
    } catch (error) {
      setIsConverting(false);
      console.log(error);
    }
  };

  const handleAudioToText = async () => {
    const audioBlob = new Blob([audioFile], { type: "audio/wav" });
    blobToBase64(audioBlob, getText);
  };

  const handleApiKeySubmit = (event) => {
    event.preventDefault();
    setIsModalOpen(false);
    handleAudioToText();
  };

  const fragmentFile = async () => {
    if (!audioFile) {
      setError("Por favor, seleccione un archivo de audio primero.");
      return;
    }

    const fragmentSize = 15 * 1024 * 1024; // 15 MB
    const fileBuffer = await audioFile.arrayBuffer();
    const fragments = [];

    setIsConverting(true);

    for (let i = 0; i < fileBuffer.byteLength; i += fragmentSize) {
      const fragmentBlob = new Blob([fileBuffer.slice(i, i + fragmentSize)], {
        type: audioFile.type,
      });
      const fragmentName = `${audioFile.name.replace(
        /\.[^/.]+$/,
        ""
      )}_fragment_${fragments.length + 1}.${audioFile.name.split(".").pop()}`;

      fragments.push(
        new File([fragmentBlob], fragmentName, { type: audioFile.type })
      );
      setProgress(Math.floor((i / fileBuffer.byteLength) * 100));
    }

    setFragmentedFiles(fragments);
    setIsConverting(false);
    setProgress(100);
  };

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

        <Tabs defaultValue="video-to-audio" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="video-to-audio">Video a Audio</TabsTrigger>
            <TabsTrigger value="audio-fragments">Fragmentar Audio</TabsTrigger>
            <TabsTrigger value="audio-to-text">Audio a Texto</TabsTrigger>
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
                  <source src={audioUrl} type="audio/wav" />
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
                  {audioFile ? audioFile.name : "Haga clic para subir un audio"}
                </span>
                <span className="text-sm text-gray-500">
                  Formatos soportados: wav, wav, M4A
                </span>
              </label>
            </div>

            {audioFile && (
              <div className="flex items-center justify-center space-x-2 text-gray-400">
                <FileAudio className="w-5 h-5" />
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

            <div className="relative">
              <textarea
                placeholder="La transcripción aparecerá aquí..."
                value={transcription}
                readOnly
                className="h-64 w-full bg-gray-800 text-gray-100 border-gray-700 p-4"
              />
              <button
                onClick={copyToClipboard}
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
                  {audioFile ? audioFile.name : "Haga clic para subir un audio"}
                </span>
                <span className="text-sm text-gray-500">
                  Formatos soportados: wav, MP3, M4A
                </span>
              </label>
            </div>

            {audioFile && (
              <div className="flex items-center justify-center space-x-2 text-gray-400">
                <FileAudio className="w-5 h-5" />
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
