// Shared allowlist: the server uses these fixed names, never client prompt text.
export const RESEARCH_LANGUAGES = [
  { code: "en", locale: "en-IN", name: "English", label: "English", placeholder: "Ask about his life, ideas or writings…" },
  { code: "hi", locale: "hi-IN", name: "Hindi", label: "हिन्दी · Hindi", placeholder: "उनके जीवन, विचारों या लेखन के बारे में पूछें…" },
  { code: "mr", locale: "mr-IN", name: "Marathi", label: "मराठी · Marathi", placeholder: "त्यांचे जीवन, विचार किंवा लेखनाबद्दल विचारा…" },
  { code: "ta", locale: "ta-IN", name: "Tamil", label: "தமிழ் · Tamil", placeholder: "வாழ்க்கை, சிந்தனைகள் அல்லது எழுத்துகள் பற்றி கேளுங்கள்…" },
  { code: "te", locale: "te-IN", name: "Telugu", label: "తెలుగు · Telugu", placeholder: "జీవితం, ఆలోచనలు లేదా రచనల గురించి అడగండి…" },
  { code: "bn", locale: "bn-IN", name: "Bengali", label: "বাংলা · Bengali", placeholder: "জীবন, ভাবনা বা লেখার বিষয়ে জিজ্ঞাসা করুন…" },
  { code: "gu", locale: "gu-IN", name: "Gujarati", label: "ગુજરાતી · Gujarati", placeholder: "જીવન, વિચારો અથવા લખાણ વિશે પૂછો…" },
  { code: "kn", locale: "kn-IN", name: "Kannada", label: "ಕನ್ನಡ · Kannada", placeholder: "ಜೀವನ, ಚಿಂತನೆ ಅಥವಾ ಬರಹಗಳ ಬಗ್ಗೆ ಕೇಳಿ…" },
];
export const findResearchLanguage = (code) => RESEARCH_LANGUAGES.find((item) => item.code === code);
