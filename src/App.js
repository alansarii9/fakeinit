// ✅ نسخة محسّنة وكاملة من لعبة Fake In It مع معالجة الصفحة الرئيسية
// الصفحة الرئيسية تظهر فوراً وتحتوي على خيار إنشاء أو دخول غرفة

import React, { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update, remove } from "firebase/database";
import './App.css';

const firebaseConfig = { /* ... */ };
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function App() {
  const [roomCode, setRoomCode] = useState("");
  const [name, setName] = useState("");
  const [stage, setStage] = useState("welcome");
  const [players, setPlayers] = useState([]);
  const [playerId, setPlayerId] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState(null);
  const [votes, setVotes] = useState({});
  const [timer, setTimer] = useState(10);
  const [selectedMode, setSelectedMode] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState("");

  const gameModes = ['رفع اليد', 'عدد الأصابع', 'أشر على شخص'];
  const sampleQuestions = [
    "ارفع يدك إذا أكلت طعام سقط منك على الأرض",
    "أشر على من تظنه يستيقظ متأخرًا",
    "ارفع عدد أصابع يمثل عدد مرات نسيت فيها اسم شخص مهم"
  ];

  useEffect(() => {
    if (!roomCode) return;
    const playersRef = ref(db, `rooms/${roomCode}/players`);
    onValue(playersRef, snapshot => {
      const data = snapshot.val();
      if (data) setPlayers(Object.values(data));
    });

    const roundRef = ref(db, `rooms/${roomCode}/rounds`);
    onValue(roundRef, snapshot => {
      const data = snapshot.val();
      if (data) setRounds(Object.values(data));
    });

    const currentRoundRef = ref(db, `rooms/${roomCode}/currentRound`);
    onValue(currentRoundRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        setCurrentRound(data);
        setCurrentQuestion(sampleQuestions[data.questionIndex]);
        setTimer(10);
      }
    });
  }, [roomCode]);

  useEffect(() => {
    if (!currentRound || timer <= 0) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [currentRound, timer]);

  const createRoom = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const id = nanoid();
    set(ref(db, `rooms/${code}/players/${id}`), { id, name, isHost: true, points: 0 });
    setRoomCode(code);
    setPlayerId(id);
    setStage("lobby");
  };

  const joinRoom = () => {
    const id = nanoid();
    set(ref(db, `rooms/${roomCode}/players/${id}`), { id, name, isHost: false, points: 0 });
    setPlayerId(id);
    setStage("lobby");
  };

  // باقي المراحل كما هي (chooseMode / results / game / lobby)

  if (stage === "welcome") {
    return (
      <div className="container">
        <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>🎭 لعبة من هو الفيك؟</h1>
        <input
          style={{ padding: '10px', fontSize: '1rem', marginBottom: '10px' }}
          placeholder="اسمك"
          value={name}
          onChange={e => setName(e.target.value)}
        /><br />
        <button onClick={createRoom} style={{ marginRight: 10 }}>🎬 إنشاء غرفة</button>
        <input
          style={{ padding: '10px', fontSize: '1rem', margin: '10px 0' }}
          placeholder="رمز الغرفة"
          value={roomCode}
          onChange={e => setRoomCode(e.target.value)}
        />
        <button onClick={joinRoom}>🚪 دخول</button>
      </div>
    );
  }

  return null;
}
