// Only complete social utterances take this path. Never discard a question
// just because it begins with a greeting, including native-script transcripts.
const phrases = {
  greeting: [
    "hello", "hi", "hey", "hello there", "hi there", "good morning", "good afternoon", "good evening",
    "namaskar", "namaskaar", "namaskara", "namaskaram", "namaste", "namastey", "vanakkam", "nomoshkar", "jai bhim", "jay bhim",
    "नमस्कार", "नमस्ते", "हॅलो", "हेलो", "हाय", "सुप्रभात", "शुभ सकाळ", "शुभ संध्याकाळ", "जय भीम", "जयभीम",
    "வணக்கம்", "காலை வணக்கம்", "నమస్కారం", "నమస్తే", "নমস্কার", "সুপ্রভাত", "નમસ્તે", "નમસ્કાર", "ನಮಸ್ಕಾರ",
  ],
  checkin: [
    "how are you", "how are you doing", "how is it going", "how's it going", "hows it going", "are you there", "can you hear me",
    "kase aahat", "tumhi kase aahat", "kasa ahes", "kaise ho", "aap kaise hain", "kem cho",
    "कसे आहात", "तुम्ही कसे आहात", "तुम्ही कसे आहात आज", "कसा आहेस", "तू कसा आहेस", "काय म्हणता", "ऐकू येतंय का", "ऐकू येत आहे का",
    "कैसे हो", "आप कैसे हैं", "सुन रहे हो", "क्या आप मुझे सुन सकते हैं",
    "நீங்கள் எப்படி இருக்கிறீர்கள்", "எப்படி இருக்கீங்க", "మీరు ఎలా ఉన్నారు", "ఎలా ఉన్నారు", "আপনি কেমন আছেন", "কেমন আছেন", "તમે કેમ છો", "કેમ છો", "ನೀವು ಹೇಗಿದ್ದೀರಿ", "ಹೇಗಿದ್ದೀರಾ",
  ],
  thanks: [
    "thanks", "thank you", "thank you very much", "thanks a lot", "thank you so much", "dhanyavaad", "dhanyavad", "shukriya",
    "धन्यवाद", "धन्यवाद खूप खूप", "खूप धन्यवाद", "खूप खूप धन्यवाद", "आभारी आहे", "शुक्रिया", "बहुत धन्यवाद", "बहुत बहुत धन्यवाद",
    "நன்றி", "மிக்க நன்றி", "ధన్యవాదాలు", "ధন্যবাদ", "આભાર", "ખૂબ આભાર", "ಧನ್ಯವಾದಗಳು",
  ],
};
const addressees = ["abhilekh", "guide", "sir", "madam", "अभिलेख", "सर", "मॅडम", "जी"];
const normalize = text => text.normalize("NFKC").toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, "")
  .replace(/[\p{P}\p{S}]/gu, " ").replace(/\s+/g, " ").trim();
const entries = Object.entries(phrases).flatMap(([intent, values]) => values.map(value => ({ text: normalize(value), intent })))
  .sort((a, b) => b.text.length - a.text.length);

export function socialIntent(query) {
  let rest = normalize(query);
  if (!rest || rest.length > 160) return null;
  const intents = [];
  // Bounded, full-message matching keeps factual questions and ambiguous
  // acknowledgements ("yes", "okay", "tell me more") in the research path.
  for (let part = 0; rest && part < 6; part++) {
    const entry = entries.find(item => rest === item.text || rest.startsWith(item.text + " "));
    if (entry) {
      intents.push(entry.intent);
      rest = rest.slice(entry.text.length).trim();
      continue;
    }
    const name = addressees.find(item => rest === item || rest.startsWith(item + " "));
    if (!name) return null;
    rest = rest.slice(name.length).trim();
  }
  if (rest || !intents.length) return null;
  return intents.includes("checkin") ? "checkin" : intents.includes("thanks") ? "thanks" : "greeting";
}

const replies = {
  en: {
    greeting: "Hello! Welcome. What would you like to talk about?",
    checkin: "I'm here and ready to help. What would you like to talk about?",
    thanks: "You're welcome! Feel free to ask if there's anything else you'd like to know.",
  },
  mr: {
    greeting: "नमस्कार! तुमचं स्वागत आहे. तुम्हाला कशाबद्दल बोलायला आवडेल?",
    checkin: "मी इथेच आहे, तुमची मदत करायला तयार! तुम्हाला कशाबद्दल बोलायचं आहे?",
    thanks: "नक्कीच! आणखी काही जाणून घ्यायचं असेल तर जरूर विचारा.",
  },
  hi: {
    greeting: "नमस्ते! आपका स्वागत है। आप किस बारे में बात करना चाहेंगे?",
    checkin: "मैं यहाँ हूँ और आपकी मदद के लिए तैयार हूँ। आप किस बारे में बात करना चाहेंगे?",
    thanks: "ज़रूर! और कुछ जानना हो तो बेझिझक पूछिए।",
  },
  ta: {
    greeting: "வணக்கம்! உங்களை வரவேற்கிறேன். எதைப் பற்றிப் பேச விரும்புகிறீர்கள்?",
    checkin: "நான் இங்கே இருக்கிறேன், உதவத் தயார். எதைப் பற்றிப் பேச விரும்புகிறீர்கள்?",
    thanks: "மகிழ்ச்சி! வேறு ஏதாவது தெரிந்துகொள்ள விரும்பினால் கேளுங்கள்.",
  },
  te: {
    greeting: "నమస్కారం! స్వాగతం. మీరు దేని గురించి మాట్లాడాలనుకుంటున్నారు?",
    checkin: "నేను ఇక్కడే ఉన్నాను, సహాయం చేయడానికి సిద్ధంగా ఉన్నాను. దేని గురించి మాట్లాడాలనుకుంటున్నారు?",
    thanks: "సంతోషం! ఇంకా ఏమైనా తెలుసుకోవాలనుకుంటే అడగండి.",
  },
  bn: {
    greeting: "নমস্কার! আপনাকে স্বাগত। আপনি কী নিয়ে কথা বলতে চান?",
    checkin: "আমি এখানেই আছি, সাহায্য করতে প্রস্তুত। আপনি কী নিয়ে কথা বলতে চান?",
    thanks: "অবশ্যই! আর কিছু জানতে চাইলে জিজ্ঞেস করুন।",
  },
  gu: {
    greeting: "નમસ્તે! તમારું સ્વાગત છે. તમે શેના વિશે વાત કરવા માંગો છો?",
    checkin: "હું અહીં જ છું, મદદ કરવા તૈયાર છું. તમે શેના વિશે વાત કરવા માંગો છો?",
    thanks: "અવશ્ય! બીજું કંઈ જાણવું હોય તો જરૂર પૂછો.",
  },
  kn: {
    greeting: "ನಮಸ್ಕಾರ! ಸ್ವಾಗತ. ನೀವು ಯಾವ ವಿಷಯದ ಬಗ್ಗೆ ಮಾತನಾಡಲು ಬಯಸುತ್ತೀರಿ?",
    checkin: "ನಾನು ಇಲ್ಲೇ ಇದ್ದೇನೆ, ಸಹಾಯ ಮಾಡಲು ಸಿದ್ಧ. ನೀವು ಯಾವ ವಿಷಯದ ಬಗ್ಗೆ ಮಾತನಾಡಲು ಬಯಸುತ್ತೀರಿ?",
    thanks: "ಖಂಡಿತ! ಇನ್ನೇನಾದರೂ ತಿಳಿಯಬೇಕಿದ್ದರೆ ಕೇಳಿ.",
  },
};

export function conversationalReply(input) {
  if (input.responseStyle !== "voice") return null;
  const intent = socialIntent(input.query);
  if (!intent) return null;
  const language = input.language || "en";
  return { mode: "conversation", intent, language, answer: replies[language][intent], citations: [], evidence: "not-applicable", truncated: false };
}
