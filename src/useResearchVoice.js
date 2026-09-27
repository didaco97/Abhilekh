import { useEffect, useRef, useState } from "react";
import { createSpeechSession, matchingVoice } from "./speech.js";
import { createCloudSpeechSession, recordingMimeType } from "./cloud-speech.js";

export default function useResearchVoice(onDraft, active, language) {
  const session = useRef(null);
  const [state, setState] = useState({ listening: false, transcribing: false, speakingId: null });
  const [cloud, setCloud] = useState(false);
  const [checking, setChecking] = useState(true);
  const [notice, setNotice] = useState("");
  const [voices, setVoices] = useState([]);
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const synthesis = window.speechSynthesis;
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    let cancelled = false;
    fetch("/api/voice", { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (!cancelled) setCloud(data?.cloud === true); })
      .catch(() => {})
      .finally(() => { clearTimeout(timeout); if (!cancelled) setChecking(false); });
    return () => { cancelled = true; clearTimeout(timeout); controller.abort(); };
  }, []);
  useEffect(() => {
    const controller = cloud ? createCloudSpeechSession({
      mediaDevices: navigator.mediaDevices, Recorder: window.MediaRecorder, AudioClass: window.Audio,
      onState: setState, onDraft, onNotice: setNotice,
    }) : createSpeechSession({
      Recognition, synthesis, Utterance: window.SpeechSynthesisUtterance,
      onState: setState, onDraft, onNotice: setNotice,
    });
    session.current = controller;
    const refreshVoices = () => setVoices(synthesis?.getVoices() || []);
    const hide = () => { if (document.hidden) controller.stopAll(); };
    refreshVoices();
    synthesis?.addEventListener("voiceschanged", refreshVoices);
    document.addEventListener("visibilitychange", hide);
    return () => {
      controller.dispose();
      session.current = null;
      synthesis?.removeEventListener("voiceschanged", refreshVoices);
      document.removeEventListener("visibilitychange", hide);
    };
  }, [Recognition, synthesis, onDraft, cloud]);
  useEffect(() => { session.current?.stopAll(); }, [active, language]);
  return {
    ...state, notice, cloud,
    inputSupported: !checking && window.isSecureContext && (cloud ? Boolean(navigator.mediaDevices?.getUserMedia && recordingMimeType(window.MediaRecorder)) : Boolean(Recognition)),
    canRead: locale => cloud || Boolean(window.SpeechSynthesisUtterance && matchingVoice(voices, locale)),
    start: prefix => session.current?.startListening({ locale: language.locale, language: language.code, prefix }),
    finish: () => session.current?.finishListening(),
    stop: () => session.current?.stopAll(),
    reset: () => session.current?.dispose(),
    read: (message, selected) => session.current?.speak({ id: message.id, text: message.answer, ...selected }),
  };
}
