"""One-time replacement of the flat preview and timeline with the exhibit component."""
from pathlib import Path
path=Path(__file__).resolve().parents[1]/'src/App.jsx'
s=path.read_text(encoding='utf-8')
s=s.replace('import ReactMarkdown from "react-markdown";','import ReactMarkdown from "react-markdown";\nimport TimelineExhibit from "./TimelineExhibit.jsx";')
start=s.index('            <section className="journey-preview">')
end=s.index('            <section className="conversation-banner">',start)
s=s[:start]+'''            <TimelineExhibit compact onOpen={openEvent} onAsk={knowMore}
              onAll={()=>navigate("timeline")} onCredits={()=>setCredits(true)}
              reducedMotion={reduceMotion} paused={Boolean(eventModal||credits||access)} />
'''+s[end:]
start=s.index('        {view === "timeline" && (')
end=s.index('        {view === "research" && (',start)
s=s[:start]+'''        {view === "timeline" && (
          <div className="timeline-museum-view view-enter">
            <TimelineExhibit onOpen={openEvent} onAsk={knowMore}
              onCredits={()=>setCredits(true)} reducedMotion={reduceMotion}
              paused={Boolean(eventModal||credits||access)} />
          </div>
        )}
'''+s[end:]
start=s.index('  const filteredEvents = events.filter(')
end=s.index('  function navigate(next)',start)
s=s[:start]+s[end:]
start=s.index('  function pickEra(id)')
end=s.index('  const sourceButtons',start)
s=s[:start]+s[end:]
for line in ['const introEvent = events.find((e) => e.id === "drafting");\n',
 '  const [era, setEra] = useState("all");\n','  const [activeEvent, setActiveEvent] = useState(introEvent);\n',
 '  const timelineRef = useRef(null);\n','  const [playing, setPlaying] = useState(false);\n',
 '    setPlaying(false);\n','    setActiveEvent(event);\n',
 '                  if (e.target.checked) setPlaying(false);\n']:
    s=s.replace(line,'')
path.write_text(s,encoding='utf-8')
print('Replaced both flat timeline layouts; existing modal and research handlers retained.')
