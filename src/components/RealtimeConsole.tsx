"use client";

import { useRef, useState } from "react";
import { Loader2, Mic, Send, PhoneOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "idle" | "connecting" | "connected" | "error";

export const RealtimeConsole = () => {
  const [status, setStatus] = useState<Status>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  const appendLog = (message: string) =>
    setLogs((prev) => [...prev.slice(-8), `${new Date().toLocaleTimeString()} · ${message}`]);

  const connect = async () => {
    if (status === "connecting" || status === "connected") return;
    setStatus("connecting");
    appendLog("Initialisation de la session Realtime…");

    try {
      const sessionResponse = await fetch("/api/realtime-session", { method: "POST" });
      if (!sessionResponse.ok) {
        throw new Error("Impossible de créer un token Realtime.");
      }
      const session = await sessionResponse.json();

      const pc = new RTCPeerConnection();
      peerRef.current = pc;

      const dataChannel = pc.createDataChannel("oai-events");
      dataChannelRef.current = dataChannel;
      dataChannel.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type === "response.output_text.delta") {
            appendLog(`Helios: ${payload.delta}`);
          } else if (payload?.type === "response.completed") {
            appendLog("Helios a terminé sa réponse.");
          }
        } catch {
          appendLog(`Flux brut: ${event.data}`);
        }
      };

      pc.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };

      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const response = await fetch(`https://api.openai.com/v1/realtime?model=${session.model}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.client_secret?.value}`,
          "Content-Type": "application/sdp",
          "OpenAI-Beta": "realtime=v1",
        },
        body: offer.sdp,
      });

      const answer = {
        type: "answer",
        sdp: await response.text(),
      } as RTCSessionDescriptionInit;

      await pc.setRemoteDescription(answer);
      setStatus("connected");
      appendLog("Session Realtime connectée. Parlez ou envoyez du texte.");
    } catch (error) {
      console.error(error);
      appendLog("Erreur lors de la connexion Realtime.");
      setStatus("error");
    }
  };

  const disconnect = () => {
    peerRef.current?.close();
    peerRef.current = null;
    dataChannelRef.current = null;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    setStatus("idle");
    appendLog("Session terminée.");
  };

  const sendText = () => {
    const message = input.trim();
    if (!message || !dataChannelRef.current) return;

    dataChannelRef.current.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: message }],
        },
      }),
    );
    dataChannelRef.current.send(
      JSON.stringify({
        type: "response.create",
        response: {
          instructions: "Réponds en français, ton concis, propose max 2 idées.",
          modalities: ["audio", "text"],
        },
      }),
    );
    appendLog(`Vous: ${message}`);
    setInput("");
  };

  return (
    <div className="space-y-4 rounded-3xl border border-emerald-200/20 bg-emerald-400/5 p-6 text-white">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={connect}
          disabled={status === "connecting" || status === "connected"}
          className={cn(
            "inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold transition",
            status === "connecting" || status === "connected"
              ? "opacity-60"
              : "hover:bg-emerald-400",
          )}
        >
          {status === "connecting" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
          Lancer session audio/WebRTC
        </button>
        <button
          type="button"
          onClick={disconnect}
          disabled={status !== "connected"}
          className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:opacity-40"
        >
          <PhoneOff className="h-4 w-4" />
          Couper
        </button>
        <span className="text-xs uppercase tracking-wide text-emerald-200">
          Statut : {status === "idle" ? "En attente" : status === "connecting" ? "Connexion…" : status === "connected" ? "Session active" : "Erreur"}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="rounded-2xl bg-black/30 p-4">
          <div className="flex items-end gap-2">
            <textarea
              rows={2}
              className="min-h-[72px] flex-1 resize-none rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/80 focus:outline-none"
              placeholder="Tapez une instruction à envoyer à Helios (ex: demande un résumé imm. )"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendText();
                }
              }}
            />
            <button
              type="button"
              onClick={sendText}
              disabled={!input.trim() || status !== "connected"}
              className="mb-2 rounded-2xl bg-white/90 p-3 text-emerald-800 transition hover:bg-white disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-white/60">
            Le microphone est utilisé automatiquement dès la connexion. Les réponses audio sont diffusées ci-dessous.
          </p>
          <audio ref={remoteAudioRef} autoPlay className="mt-4 w-full rounded-2xl" />
        </div>

        <div className="rounded-2xl bg-black/40 p-4 text-xs text-emerald-100">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-200">Logs</p>
          <div className="h-40 overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <p className="text-white/60">Aucun événement pour le moment.</p>
            ) : (
              logs.map((log) => <p key={log}>{log}</p>)
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

