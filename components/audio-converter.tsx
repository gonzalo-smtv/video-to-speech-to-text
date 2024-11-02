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
import VideoToMp3Converter from "./VideoToMp3Converter";

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

  const [copied, setCopied] = useState(false);
  const [tabValue, setTabValue] = useState("video-to-audio");
  const [fragments, setFragments] = useState([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFragment, setCurrentFragment] = useState(0);

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result.split(",")[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const fetchAudioFromUrl = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return blob;
  };

  const processFragments = async () => {
    if (!fragments.length) return;

    setIsProcessing(true);

    try {
      for (let i = 0; i < fragments.length; i++) {
        setCurrentFragment(i + 1);
        const fragment = fragments[i];

        // Obtener el blob desde la URL del fragmento
        const audioBlob = await fetchAudioFromUrl(fragment.url);

        // Convertir a base64
        const base64Data = await blobToBase64(audioBlob);

        // Procesar el fragmento
        await getText(base64Data);
      }
    } catch (error) {
      console.error("Error processing fragments:", error);
    } finally {
      setIsProcessing(false);
      setCurrentFragment(0);
    }
  };

  // @ts-ignore
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  // @ts-ignore
  const getText = async (base64data) => {
    console.log("CONVERTING");
    setIsConverting(true);
    try {
      const resp = await fetch("/api/speechToText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio: base64data,
        }),
      });
      console.log("resp: ", resp);
      const response = await resp.json();
      console.log("response: ", response);
      const { text } = response;
      // @ts-ignore
      setTranscription((prev) => [...prev, text]);
      setIsConverting(false);
    } catch (error) {
      setIsConverting(false);
      console.log(error);
    }
  };

  useEffect(() => {
    console.log("transcription: ", transcription);
  }, [transcription]);

  const handleAudioToText = async () => {
    setTranscription([]);
    // @ts-ignore
    console.log("audioFile: ", audioFile);
    // @ts-ignore
    const audioBlob = new Blob([audioFile], { type: "audio/mp3" });
    console.log("%c audioBlob: ", "color: orange", audioBlob);

    const blob = await blobToBase64(audioBlob);
    await getText(blob);
  };

  // @ts-ignore
  const handleApiKeySubmit = (event) => {
    event.preventDefault();
    setIsModalOpen(false);
    handleAudioToText();
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
          </TabsContent>

          <TabsContent value="audio-fragments" className="space-y-4">
            <VideoToMp3Converter setFragments={setFragments} />
          </TabsContent>
        </Tabs>

        {fragments.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Fragmentos de audio:</h3>
            <ul className="space-y-2">
              {fragments.map((fragment, index) => (
                <li key={index}>
                  <a
                    // @ts-ignore
                    href={fragment.url}
                    // @ts-ignore
                    download={fragment.fileName}
                    className="text-blue-600 hover:underline"
                  >
                    {/* @ts-ignore */}
                    {fragment.fileName}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <button
                onClick={processFragments}
                disabled={isProcessing || !fragments.length}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                {isProcessing
                  ? `Procesando fragmento ${currentFragment} de ${fragments.length}...`
                  : "Procesar fragmentos"}
              </button>

              {fragments.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  {fragments.length} fragmentos disponibles para procesar
                </div>
              )}
            </div>
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
                    value={text}
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
