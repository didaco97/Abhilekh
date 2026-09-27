export const sources = {
  daf: {
    id: "daf",
    institution: "Dr. Ambedkar Foundation",
    title: "About Dr. Ambedkar",
    url: "https://ambedkarfoundation.nic.in/know-ambedkar.html",
    type: "Institutional biography",
  },
  columbia: {
    id: "columbia",
    institution: "Columbia University",
    title: "Ambedkar: the Columbia years",
    url: "https://ccnmtl.columbia.edu/projects/mmt/ambedkar/web/timeline_files/timeline_content04.html",
    type: "University archive",
  },
  lse: {
    id: "lse",
    institution: "London School of Economics",
    title: "LSE then and now: religion and politics",
    url: "https://www.lse.ac.uk/research/research-for-the-world/politics/lse-then-and-now-religion-and-politics",
    type: "University history",
  },
  sci: {
    id: "sci",
    institution: "Supreme Court of India",
    title: "Centenary of Dr. B. R. Ambedkar’s enrolment as an advocate",
    url: "https://www.sci.gov.in/centenary-of-dr-b-r-ambedkars-enrolment-as-an-advocate/",
    type: "Institutional exhibit",
  },
  parliament: {
    id: "parliament",
    institution: "Parliament of India",
    title: "Dr. B. R. Ambedkar: life and public service",
    url: "https://sansad.in/ls/library/statue/186",
    type: "Parliamentary biography",
  },
  caste: {
    id: "caste",
    institution: "Columbia University",
    title: "Bhimrao Ramji Ambedkar",
    url: "https://globalcenters.columbia.edu/content/mumbai-bhimrao-ramji-ambedkar",
    type: "University collection guide",
  },
  speech: {
    id: "speech",
    institution: "Parliament Digital Library",
    title: "Select Proceedings of the Constituent Assembly",
    url: "https://eparlib.sansad.in/bitstream/123456789/782459/1/Golden_Jubilee_Republic_of_India.pdf",
    type: "Published parliamentary proceedings",
    date: "25 November 1949",
  },
  democracyText: {
    id: "democracyText",
    institution: "Judicial Academy repository",
    title: "Selected Works of Dr BR Ambedkar",
    url: "https://judicialacademy.nic.in/sites/default/files/1458100182_selected%20work%20of%20Dr%20B%20Rambedkar.pdf#page=2222",
    type: "Related reading · published collection",
    pageLabel: "Printed page 2221 · PDF page 2222",
    image: "/images/selected-works-page-2222.jpg",
    imageCaption:
      "A page from the published collection discussing social and economic democracy. Related reading, distinct from the 1949 speech.",
    excerpt:
      "Social and economic democracy are the tissues and the fibre of a political democracy.",
  },
};

export const photos = {
  portrait: {
    src: "/images/ambedkar-portrait.jpg",
    caption:
      "Portrait of Dr. B. R. Ambedkar. Contextual photograph, not a photograph of this event.",
    credit: "Wikimedia Commons · marked public domain in India",
    url: "https://commons.wikimedia.org/wiki/File:Dr._Bhimrao_Ambedkar.jpg",
  },
  student: {
    src: "/images/ambedkar-student.jpg",
    caption: "Ambedkar during his Columbia years, 1913–1916.",
    credit: "Wikimedia Commons · CC0",
    url: "https://commons.wikimedia.org/wiki/File:Dr._Babasaheb_Ambedkar_in_Columbia_University.jpg",
  },
  committee: {
    src: "/images/drafting-committee.jpg",
    caption:
      "Members of the Drafting Committee, 1947. Ambedkar is seated in the centre.",
    credit: "Wikimedia Commons · CC0",
    url: "https://commons.wikimedia.org/wiki/File:Drafting_Committee_for_the_Constitution_of_India._Dr._B._R._Ambedkar_in_the_center.jpg",
  },
};

export const eras = [
  { id: "all", label: "The whole journey", range: "1891—1956" },
  { id: "education", label: "The scholar", range: "1891—1923" },
  { id: "equality", label: "The reformer", range: "1924—1936" },
  { id: "republic", label: "The nation-builder", range: "1942—1949" },
  { id: "legacy", label: "The legacy", range: "1956" },
];

// Concise exhibit summaries, not verbatim historical transcripts. Source records
// remain separate from photographs, which are contextual unless stated otherwise.
export const events = [
  {
    id: "birth",
    year: 1891,
    date: "14 April 1891",
    era: "education",
    title: "A beginning in Mhow",
    place: "Mhow, Central India",
    eyebrow: "THE BEGINNING",
    summary:
      "Bhimrao Ramji Ambedkar was born in Mhow, in present-day Madhya Pradesh. His life would reshape India’s debates on dignity and citizenship.",
    sourceIds: ["daf"],
    photo: "portrait",
    tags: "birth born birthday childhood mhow bhimrao ramji early life",
    question: "Where did Dr. Ambedkar’s journey begin?",
  },
  {
    id: "columbia",
    year: 1913,
    date: "1913",
    era: "education",
    title: "A world of new ideas",
    place: "Columbia University, New York",
    eyebrow: "THE SCHOLAR",
    summary:
      "Ambedkar arrived at Columbia University to pursue graduate study. Economics, history and the social sciences became part of his intellectual formation.",
    sourceIds: ["columbia"],
    photo: "student",
    tags: "education university columbia new york america economics study student scholarship",
    question:
      "How did studying at Columbia shape Ambedkar’s intellectual journey?",
  },
  {
    id: "masters",
    year: 1915,
    date: "1915",
    era: "education",
    title: "Learning across disciplines",
    place: "Columbia University, New York",
    eyebrow: "THE SCHOLAR",
    summary:
      "He earned his master’s degree at Columbia in 1915. His studies connected economic questions with the organisation of society.",
    sourceIds: ["columbia"],
    photo: "student",
    tags: "masters ma degree education columbia economics",
    question: "What did Ambedkar study at Columbia?",
  },
  {
    id: "rupee",
    year: 1923,
    date: "1923",
    era: "education",
    title: "The economist’s lens",
    place: "London School of Economics",
    eyebrow: "THE ECONOMIST",
    summary:
      "His doctoral thesis, The Problem of the Rupee, was accepted in 1923 and published that year. It examined India’s monetary system.",
    sourceIds: ["lse"],
    photo: "student",
    tags: "rupee economics currency money monetary london lse doctorate doctoral thesis book",
    question: "What was The Problem of the Rupee about?",
  },
  {
    id: "sabha",
    year: 1924,
    date: "1924",
    era: "equality",
    title: "Organising for change",
    place: "Bombay",
    eyebrow: "THE ORGANISER",
    summary:
      "Ambedkar established the Bahishkrit Hitakarini Sabha to advance education and social improvement for communities excluded by caste.",
    sourceIds: ["parliament", "sci"],
    photo: "portrait",
    tags: "sabha bahishkrit hitakarini education organisation society social welfare",
    question: "Why did Ambedkar establish the Bahishkrit Hitakarini Sabha?",
  },
  {
    id: "mahad",
    year: 1927,
    date: "1927",
    era: "equality",
    title: "Water. Dignity. Equal rights.",
    place: "Mahad, Maharashtra",
    eyebrow: "THE REFORMER",
    summary:
      "The Mahad Satyagraha challenged caste-based exclusion from public water. Ambedkar made equal access to shared resources a public demand.",
    sourceIds: ["sci"],
    photo: "portrait",
    tags: "mahad satyagraha water tank chavdar equality discrimination caste dignity public rights",
    question: "Why was the Mahad Satyagraha a turning point?",
  },
  {
    id: "roundtable",
    year: 1930,
    date: "1930–1932",
    era: "equality",
    title: "A seat at the table",
    place: "London",
    eyebrow: "THE NEGOTIATOR",
    summary:
      "At the Round Table Conferences, Ambedkar argued for political safeguards and representation for the people then officially described as the Depressed Classes.",
    sourceIds: ["sci"],
    photo: "portrait",
    tags: "round table conference london representation political safeguards voting minority rights",
    question: "What did Ambedkar argue for at the Round Table Conferences?",
  },
  {
    id: "poona",
    year: 1932,
    date: "1932",
    era: "equality",
    title: "The question of representation",
    place: "Poona",
    eyebrow: "POLITICAL RIGHTS",
    summary:
      "The Poona Pact reshaped arrangements for the political representation of the Depressed Classes, providing reserved seats within joint electorates.",
    sourceIds: ["parliament"],
    photo: "portrait",
    tags: "poona pact pune representation reserved seats electorates voting gandhi",
    question: "What changed with the Poona Pact?",
  },
  {
    id: "annihilation",
    year: 1936,
    date: "1936",
    era: "equality",
    title: "Words that confront caste",
    place: "Published in India",
    eyebrow: "THE WRITER",
    summary:
      "Written for an address that was never delivered, Annihilation of Caste became a published critique of caste and a call for fundamental social change.",
    sourceIds: ["caste"],
    photo: "portrait",
    tags: "annihilation caste book writing speech reform liberty equality fraternity democracy",
    question: "Why was Annihilation of Caste never delivered as a speech?",
  },
  {
    id: "labour",
    year: 1942,
    date: "1942–1946",
    era: "republic",
    title: "Work, welfare and public service",
    place: "Government of India",
    eyebrow: "THE POLICYMAKER",
    summary:
      "As Labour Member of the Viceroy’s Executive Council, Ambedkar worked on labour welfare, employment and social security measures.",
    sourceIds: ["parliament"],
    photo: "portrait",
    tags: "labour labor workers employment welfare social security executive council work",
    question: "What areas did Ambedkar work on as Labour Member?",
  },
  {
    id: "drafting",
    year: 1947,
    date: "1947",
    era: "republic",
    title: "Giving a republic its framework",
    place: "Constituent Assembly, New Delhi",
    eyebrow: "THE CONSTITUTION",
    summary:
      "Ambedkar chaired the Drafting Committee of the Constituent Assembly. The Constitution emerged through committee work, successive drafts and debate in the Assembly.",
    sourceIds: ["parliament"],
    photo: "committee",
    tags: "constitution drafting committee chair chairman law minister republic assembly writing nation",
    question: "What was Ambedkar’s role in drafting the Constitution?",
  },
  {
    id: "democracy",
    year: 1949,
    date: "25 November 1949",
    era: "republic",
    title: "Democracy beyond the ballot",
    place: "Constituent Assembly, New Delhi",
    eyebrow: "A CONSTITUTIONAL VISION",
    summary:
      "In his concluding speech, Ambedkar connected political democracy with social democracy. He examined liberty, equality and fraternity as principles that must work together.",
    sourceIds: ["speech", "democracyText"],
    photo: "committee",
    tags: "democracy social political liberty equality fraternity constitution speech constitutional morality rights freedom 25 november",
    question:
      "Why did Ambedkar link democracy with liberty, equality and fraternity?",
  },
  {
    id: "conversion",
    year: 1956,
    date: "14 October 1956",
    era: "legacy",
    title: "A new chapter in Nagpur",
    place: "Nagpur, Maharashtra",
    eyebrow: "CONVICTION AND CHANGE",
    summary:
      "Ambedkar embraced Buddhism in Nagpur with many of his followers, marking a major moment in his search for equality and human dignity.",
    sourceIds: ["daf"],
    photo: "portrait",
    tags: "buddhism conversion nagpur deekshabhoomi dignity religion 14 october",
    question: "What happened in Nagpur in October 1956?",
  },
  {
    id: "legacy",
    year: 1956,
    date: "6 December 1956",
    era: "legacy",
    title: "A legacy still in conversation",
    place: "New Delhi",
    eyebrow: "AN ENDURING LEGACY",
    summary:
      "Ambedkar died on 6 December 1956. His writings and public work remain central to the study of equality, democracy and social justice.",
    sourceIds: ["daf"],
    photo: "portrait",
    tags: "death died legacy december writings remembrance social justice",
    question: "Where can I begin exploring Ambedkar’s legacy?",
  },
];

export const planned = [
  {
    id: "collections",
    title: "Manuscripts & collections",
    description:
      "A full catalogue of books, manuscripts and rare documents, with full-text reading and collection filters.",
    label: "Originals, preserved",
  },
  {
    id: "multilingual",
    title: "Translated exhibit stories",
    description:
      "Publish reviewed exhibit stories, captions and narration in multiple languages. Research answers and voice conversation already support a choice of languages.",
    label: "More ways to understand",
  },
  {
    id: "curator",
    title: "Curator workspace",
    description:
      "OCR review, source-version management and approval of stories before they reach institutional displays.",
    label: "Care behind every record",
  },
  {
    id: "maps",
    title: "Knowledge connections",
    description:
      "An interactive map connecting ideas, writings, people and events to their source records.",
    label: "Follow an idea further",
  },
];
