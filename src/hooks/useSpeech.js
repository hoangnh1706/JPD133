import { useState, useEffect, useRef, useCallback } from 'react';
import { cleanForTTS } from '../utils/japanese';

export function useSpeech(defaultRate = 1.0) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [rate, setRate] = useState(defaultRate);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const synthRef = useRef(null);
  const selectedVoiceRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;

      const updateVoices = () => {
        const voices = synthRef.current.getVoices();
        if (voices.length > 0) {
          // Ưu tiên voice tiếng Nhật chất lượng cao
          const jaVoice = voices.find(v => v.lang === 'ja-JP' || v.lang === 'ja_JP' || v.lang.startsWith('ja'));
          selectedVoiceRef.current = jaVoice || null;
          setVoicesLoaded(true);
        }
      };

      updateVoices();
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = updateVoices;
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setCurrentText('');
    }
  }, []);

  const speak = useCallback((rawText, customRate) => {
    if (!synthRef.current || !rawText) return;

    // Dừng phát âm hiện tại
    synthRef.current.cancel();

    // Làm sạch text (bỏ Hiragana trong ngoặc để tránh lặp âm)
    const cleanedText = cleanForTTS(rawText);
    if (!cleanedText) return;

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = 'ja-JP';
    utterance.rate = customRate !== undefined ? customRate : rate;
    utterance.pitch = 1.0;

    if (selectedVoiceRef.current) {
      utterance.voice = selectedVoiceRef.current;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentText(rawText);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentText('');
    };

    utterance.onerror = (e) => {
      // Bỏ qua lỗi canceled khi người dùng chuyển nhanh
      if (e.error !== 'canceled') {
        console.warn('SpeechSynthesis error:', e);
      }
      setIsSpeaking(false);
      setCurrentText('');
    };

    synthRef.current.speak(utterance);
  }, [rate]);

  return {
    speak,
    stop,
    isSpeaking,
    currentText,
    rate,
    setRate,
    voicesLoaded
  };
}
