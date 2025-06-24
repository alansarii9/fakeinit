// ✅ تحديث: إخفاء السؤال عن المضيف وعدم إظهاره على الشاشة الكبيرة

import React, { useState, useEffect } from "react";
import { nanoid } from "nanoid";

const questions = [
  "ارفع يدك إذا تحب الشاي أكثر من القهوة",
  "أظهر عدد أصابع يمثل عدد إخوتك",
  "اشّر على شخص تظن أنه يغش في الألعاب",
  "ارفع يدك إذا أكلت اليوم فطور",
  "كم مرة تسافر في السنة؟ أظهرها بأصابعك"
];

export default function App() {
  const [roomCode, setRoomCode] = useState("");
  const [name, setName] = useState("");
  const [stage, setStage] = useState("welcome");
  const [players, setPlayers] = useState([]);
  const [fakerId, setFakerId] = useState(null);
  const [question, setQuestion] = useState("");
  const [seconds, setSeconds] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);

  const createRoom = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setRoomCode(code);
    setPlayers([]);
    setStage("host");
  };

  const joinRoom = () => {
    if (!name || !roomCode) return alert("أدخل الاسم ورمز الغرفة");
    const newPlayer = { id: nanoid(), name };
    setPlayers(prev => [...prev, newPlayer]);
    setCurrentPlayerId(newPlayer.id);
    setStage("player");
  };

  const simulatePlayers = () => {
    const fakePlayers = ["أحمد", "سارة", "فهد"].map(n => ({ id: nanoid(), name: n }));
    setPlayers(fakePlayers);
  };

  const startRound = () => {
    if (players.length < 3) return alert("يجب أن يكون هناك 3 لاعبين على الأقل");
    const randomFaker = players[Math.floor(Math.random() * players.length)].id;
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    setFakerId(randomFaker);
    setQuestion(randomQuestion);
    setSeconds(30);
    setTimerActive(true);
  };

  useEffect(() => {
    if (!timerActive || seconds === 0) return;
    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev === 1) setTimerActive(false);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, seconds]);

  if (stage === "welcome") {
    return (
      <div style={{ textAlign: "center", padding: 40, direction: "rtl" }}>
        <h1>🎭 لعبة من هو الفيك؟</h1>
        <button onClick={createRoom}>🎬 إنشاء غرفة</button>
        <hr style={{ margin: 20 }} />
        <h3>🎮 الدخول إلى غرفة موجودة</h3>
        <input placeholder="اسمك" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="رمز الغرفة" value={roomCode} onChange={e => setRoomCode(e.target.value)} />
        <button onClick={joinRoom}>🚪 دخول</button>
      </div>
    );
  }

  if (stage === "host") {
    return (
      <div style={{ padding: 30, direction: "rtl", fontFamily: "Arial" }}>
        <h2>📺 الغرفة جاهزة</h2>
        <p>رمز الغرفة: <strong>{roomCode}</strong></p>
        <h3>👥 اللاعبين:</h3>
        <ul>
          {players.map(p => <li key={p.id}>{p.name}</li>)}
        </ul>
        {!question && (
          <>
            <button onClick={startRound}>🚀 بدء الجولة</button>
            <button onClick={simulatePlayers} style={{ marginRight: 10 }}>🧪 أضف لاعبين وهميين</button>
          </>
        )}
        {question && (
          <div>
            <h2>⏳ الوقت المتبقي: {seconds} ثانية</h2>
            {!timerActive && <p>✋ يلا جاوبوا الآن بالإشارة!</p>}
          </div>
        )}
      </div>
    );
  }

  if (stage === "player") {
    const isFaker = fakerId && currentPlayerId === fakerId;
    return (
      <div style={{ padding: 30, textAlign: "center", direction: "rtl" }}>
        <h2>✅ انضممت إلى الغرفة!</h2>
        <p>رمز الغرفة: {roomCode}</p>
        {question && (
          isFaker ? (
            <h3>🤫 أنت الفيك! لا تعرف السؤال</h3>
          ) : (
            <h3>❓ السؤال: {question}</h3>
          )
        )}
        {timerActive && <p>⏳ الوقت: {seconds} ثانية</p>}
        {!timerActive && question && <p>✋ جاوب الآن بالإشارة!</p>}
      </div>
    );
  }

  return null;
}
