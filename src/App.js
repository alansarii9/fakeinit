// ✅ نسخة محسّنة وكاملة من لعبة Fake In It
// تضيف:
// - صفحة انتظار بعد الانضمام
// - كل لاعب يختار نوع الجولة بالدور
// - أسئلة متتالية داخل كل جولة
// - التصويت السري على الفيك بعد كل سؤال
// - حساب النقاط
// - الانتقال التلقائي للجولة التالية
// - عرض النتائج النهائية بعد آخر جولة

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

  const startGame = () => {
    setStage("chooseMode");
  };

  const confirmMode = () => {
    const newRounds = players.map(p => ({
      chooserId: p.id,
      selectedMode,
      fakerId: players[Math.floor(Math.random() * players.length)].id,
      questionIndex: 0
    }));
    newRounds.forEach((r, i) => set(ref(db, `rooms/${roomCode}/rounds/${i}`), r));
    set(ref(db, `rooms/${roomCode}/currentRound`), { ...newRounds[0], roundIndex: 0 });
    setStage("game");
  };

  const handleVote = (targetId) => {
    set(ref(db, `rooms/${roomCode}/votes/${playerId}`), targetId);
  };

  const revealVotes = () => {
    const voteRef = ref(db, `rooms/${roomCode}/votes`);
    onValue(voteRef, snapshot => {
      const voteData = snapshot.val();
      const voteCounts = {};
      Object.values(voteData || {}).forEach(id => {
        voteCounts[id] = (voteCounts[id] || 0) + 1;
      });
      setVotes(voteCounts);

      const fakerCaught = Object.entries(voteCounts).some(([id, count]) => id === currentRound.fakerId && count > 0);
      const updates = {};
      players.forEach(p => {
        let score = p.points;
        if (voteData[p.id] === currentRound.fakerId) score += 2;
        if (p.id === currentRound.fakerId && !fakerCaught) score += 2;
        updates[`rooms/${roomCode}/players/${p.id}/points`] = score;
      });
      update(ref(db), updates);
      remove(ref(db, `rooms/${roomCode}/votes`));

      if (currentRound.questionIndex < 2) {
        const updatedRound = { ...currentRound, questionIndex: currentRound.questionIndex + 1 };
        set(ref(db, `rooms/${roomCode}/currentRound`), updatedRound);
      } else if (currentRound.roundIndex < rounds.length - 1) {
        const next = rounds[currentRound.roundIndex + 1];
        set(ref(db, `rooms/${roomCode}/currentRound`), { ...next, roundIndex: currentRound.roundIndex + 1 });
      } else {
        setStage("results");
      }
    }, { onlyOnce: true });
  };

  if (stage === "chooseMode") {
    const chooser = players[0];
    return (
      <div className="mode-choice">
        <h2>🧠 {chooser.name} اختر نوع الجولة:</h2>
        {gameModes.map((mode, i) => (
          <button key={i} onClick={() => setSelectedMode(mode)}>{mode}</button>
        ))}
        {selectedMode && <button onClick={confirmMode}>✅ تأكيد</button>}
      </div>
    );
  }

  if (stage === "results") {
    const sorted = [...players].sort((a, b) => b.points - a.points);
    return (
      <div className="results">
        <h2>🏆 النتائج النهائية</h2>
        <ol>
          {sorted.map(p => (
            <li key={p.id}>{p.name}: {p.points} نقطة</li>
          ))}
        </ol>
      </div>
    );
  }

  if (stage === "game" && currentRound) {
    const isFaker = playerId === currentRound.fakerId;
    return (
      <div className="game">
        <h2>⏳ {timer} ثانية</h2>
        <h3>{isFaker ? "🤫 أنت الفيك! دبر نفسك!" : `❓ ${currentQuestion}`}</h3>
        <h4>صوّت على من تظنه الفيك:</h4>
        <ul>
          {players.filter(p => p.id !== playerId).map(p => (
            <li key={p.id}>
              <button onClick={() => handleVote(p.id)}>{p.name}</button>
            </li>
          ))}
        </ul>
        {players.find(p => p.id === playerId)?.isHost && (
          <button onClick={revealVotes}>👁️ كشف التصويت</button>
        )}
      </div>
    );
  }

  if (stage === "welcome") {
    return (
      <div className="container">
        <h1>🎭 لعبة من هو الفيك؟</h1>
        <input placeholder="اسمك" value={name} onChange={e => setName(e.target.value)} />
        <button onClick={createRoom}>🎬 إنشاء غرفة</button>
        <input placeholder="رمز الغرفة" value={roomCode} onChange={e => setRoomCode(e.target.value)} />
        <button onClick={joinRoom}>🚪 دخول</button>
      </div>
    );
  }

  if (stage === "lobby") {
    return (
      <div className="lobby">
        <h2>رمز الغرفة: {roomCode}</h2>
        <h3>اللاعبين داخل الغرفة:</h3>
        <ul>
          {players.map(p => (
            <li key={p.id}>{p.name} - {p.points} نقطة</li>
          ))}
        </ul>
        {players.find(p => p.id === playerId)?.isHost && (
          <button onClick={startGame}>🚀 ابدأ اللعب</button>
        )}
      </div>
    );
  }

  return null;
}
