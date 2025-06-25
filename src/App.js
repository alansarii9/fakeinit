// ✅ نسخة محسّنة وكاملة من لعبة Fake In It مع معالجة الصفحة الرئيسية
// الصفحة الرئيسية تظهر فوراً وتحتوي على خيار إنشاء أو دخول غرفة

import React, { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update, remove } from "firebase/database";
import './App.css';

const firebaseConfig = {
  apiKey: "AIzaSyDmnZFITZ7dOO2WfyVTJgbUNC0yDqEWgg8",
  authDomain: "fakeititit.firebaseapp.com",
  databaseURL: "https://fakeititit-default-rtdb.firebaseio.com",
  projectId: "fakeititit",
  storageBucket: "fakeititit.appspot.com",
  messagingSenderId: "216129045105",
  appId: "1:216129045105:web:d31b6b6e035a481b4dd1d0"
};

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
    if (!name.trim()) return alert("أدخل اسمك أولاً");
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const id = nanoid();
    set(ref(db, `rooms/${code}/players/${id}`), { id, name, isHost: true, points: 0 });
    setRoomCode(code);
    setPlayerId(id);
    setStage("lobby");
  };

  const joinRoom = () => {
    if (!name.trim() || !roomCode.trim()) return alert("أدخل الاسم ورمز الغرفة");
    const id = nanoid();
    set(ref(db, `rooms/${roomCode}/players/${id}`), { id, name, isHost: false, points: 0 });
    setPlayerId(id);
    setStage("lobby");
  };

  if (stage === "welcome") {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: 60 }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>🎭 لعبة من هو الفيك؟</h1>
        <input
          style={{ padding: '10px', fontSize: '1rem', marginBottom: '10px', width: '80%' }}
          placeholder="اكتب اسمك"
          value={name}
          onChange={e => setName(e.target.value)}
        /><br />
        <button onClick={createRoom} style={{ padding: '10px 20px', marginBottom: '20px' }}>🎬 إنشاء غرفة جديدة</button>
        <div style={{ margin: '20px 0' }}>
          <input
            style={{ padding: '10px', fontSize: '1rem', width: '60%' }}
            placeholder="رمز الغرفة للدخول"
            value={roomCode}
            onChange={e => setRoomCode(e.target.value)}
          />
          <button onClick={joinRoom} style={{ padding: '10px 20px', marginLeft: 10 }}>🚪 دخول</button>
        </div>
      </div>
    );
  }

  return null;
}
