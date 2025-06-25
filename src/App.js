// ✅ نسخة كاملة من لعبة Fake In It - تشمل: جولات بعدد اللاعبين، 3 أسئلة لكل جولة، تصويت، نتائج، تايمر تلقائي

import React, { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, remove, update } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDmnZFITZ7dOO2WfyVTJgbUNC0yDqEWgg8",
  authDomain: "fakeititit.firebaseapp.com",
  databaseURL: "https://fakeititit-default-rtdb.firebaseio.com",
  projectId: "fakeititit",
  storageBucket: "fakeititit.appspot.com",
  messagingSenderId: "216129045105",
  appId: "1:216129045105:web:d31b6b6e035a481b4dd1d0"
};

initializeApp(firebaseConfig);
const db = getDatabase();

export default function App() {
  const [stage, setStage] = useState("welcome");
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [playerId, setPlayerId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [round, setRound] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [votes, setVotes] = useState({});
  const [timer, setTimer] = useState(15);
  const [currentHostIndex, setCurrentHostIndex] = useState(0);
  const [currentRoundCount, setCurrentRoundCount] = useState(1);

  const modes = ["رفع اليد", "عدد الأصابع", "أشر على شخص"];
  const questions = [
    "ارفع يدك إذا سبق وتهربت من دفع فاتورة جماعية",
    "كم إصبع ترفع لتمثل عدد المرات اللي أكلت فيها من ثلاجة غيرك؟",
    "أشر على أكثر لاعب تحسه يتأخر دائمًا"
  ];

  useEffect(() => {
    if (!roomCode) return;
    onValue(ref(db, `rooms/${roomCode}/players`), snap => {
      const data = snap.val();
      if (data) setPlayers(Object.values(data));
    });
    onValue(ref(db, `rooms/${roomCode}/round`), snap => {
      const data = snap.val();
      if (data) setRound(data);
    });
    onValue(ref(db, `rooms/${roomCode}/votes`), snap => {
      const data = snap.val();
      if (data) setVotes(data);
    });
  }, [roomCode]);

  useEffect(() => {
    if (stage === "game" && timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
    if (stage === "game" && timer === 0) {
      const me = players.find(p => p.id === playerId);
      if (me?.isHost) revealVotes();
    }
  }, [stage, timer]);

  const createRoom = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const id = nanoid();
    const player = { id, name, isHost: true, points: 0 };
    set(ref(db, `rooms/${code}/players/${id}`), player);
    setRoomCode(code);
    setPlayerId(id);
    setStage("lobby");
  };

  const joinRoom = () => {
    const id = nanoid();
    const player = { id, name, isHost: false, points: 0 };
    set(ref(db, `rooms/${roomCode}/players/${id}`), player);
    setPlayerId(id);
    setStage("lobby");
  };

  const confirmMode = () => {
    const faker = players[Math.floor(Math.random() * players.length)].id;
    set(ref(db, `rooms/${roomCode}/round`), {
      fakerId: faker,
      mode: selectedMode,
      questionIndex: 0,
      currentQuestion: questions[0]
    });
    remove(ref(db, `rooms/${roomCode}/votes`));
    setTimer(15);
    setStage("game");
  };

  const castVote = (targetId) => {
    set(ref(db, `rooms/${roomCode}/votes/${playerId}`), targetId);
  };

  const revealVotes = () => {
    const voteValues = Object.values(votes);
    const voteCount = {};
    voteValues.forEach(id => {
      voteCount[id] = (voteCount[id] || 0) + 1;
    });

    const updates = {};
    players.forEach(p => {
      let points = p.points || 0;
      const gotVoted = voteCount[p.id] || 0;
      if (p.id === round.fakerId && gotVoted > 0) {
        players.forEach(voter => {
          if (votes[voter.id] === round.fakerId) {
            updates[`rooms/${roomCode}/players/${voter.id}/points`] = (voter.points || 0) + 1;
          }
        });
      }
    });
    update(ref(db), updates);

    const nextIndex = round.questionIndex + 1;
    if (nextIndex < questions.length) {
      set(ref(db, `rooms/${roomCode}/round/questionIndex`), nextIndex);
      set(ref(db, `rooms/${roomCode}/round/currentQuestion`), questions[nextIndex]);
      remove(ref(db, `rooms/${roomCode}/votes`));
      setTimer(15);
    } else {
      const nextHostIndex = currentHostIndex + 1;
      if (nextHostIndex < players.length) {
        setCurrentHostIndex(nextHostIndex);
        setSelectedMode(null);
        setStage("chooseMode");
      } else {
        setStage("results");
      }
    }
  };

  if (stage === "results") {
    const sorted = [...players].sort((a, b) => b.points - a.points);
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <h2>🏆 النتائج النهائية:</h2>
        <ol>
          {sorted.map(p => (
            <li key={p.id}>{p.name}: {p.points} نقطة</li>
          ))}
        </ol>
        <button onClick={() => {
          setCurrentHostIndex(0);
          setSelectedMode(null);
          setStage("chooseMode");
        }}>🔄 إعادة اللعب</button>
      </div>
    );
  }

  if (stage === "welcome") {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <h1>🎭 من هو الفيك؟</h1>
        <input placeholder="اسمك" value={name} onChange={e => setName(e.target.value)} /><br /><br />
        <button onClick={createRoom}>🎬 إنشاء غرفة</button>
        <br /><br />
        <input placeholder="رمز الغرفة" value={roomCode} onChange={e => setRoomCode(e.target.value)} /><br />
        <button onClick={joinRoom}>🚪 دخول</button>
      </div>
    );
  }

  if (stage === "lobby") {
    const me = players.find(p => p.id === playerId);
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <h2>رمز الغرفة: {roomCode}</h2>
        <h3>اللاعبين:</h3>
        <ul>
          {players.map(p => <li key={p.id}>{p.name}</li>)}
        </ul>
        {me?.isHost && <button onClick={() => setStage("chooseMode")}>🚀 ابدأ اللعب</button>}
      </div>
    );
  }

  if (stage === "chooseMode") {
    const currentHost = players[currentHostIndex];
    if (playerId !== currentHost?.id) {
      return <div style={{ textAlign: 'center', padding: 40 }}><h2>🕒 بانتظار {currentHost?.name} لاختيار نوع الجولة...</h2></div>;
    }
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <h2>🧠 اختر نوع الجولة:</h2>
        {modes.map((mode, i) => (
          <button key={i} onClick={() => setSelectedMode(mode)} style={{ margin: 10 }}>{mode}</button>
        ))}
        {selectedMode && <div><br /><button onClick={confirmMode}>✅ تأكيد الاختيار</button></div>}
      </div>
    );
  }

  if (stage === "game" && round) {
    const isFaker = round.fakerId === playerId;
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <h2>الجولة: {round.mode}</h2>
        <h3>{isFaker ? "🤫 أنت الفيك! تصرّف طبيعيًا" : `❓ ${round.currentQuestion}`}</h3>
        <h4>⏳ الوقت المتبقي: {timer} ثانية</h4>
        <h4>🗳️ صوّت على الفيك:</h4>
        {players.filter(p => p.id !== playerId).map(p => (
          <button key={p.id} onClick={() => castVote(p.id)} style={{ margin: 5 }}>{p.name}</button>
        ))}
        <br /><br />
        {players.find(p => p.id === playerId)?.isHost && (
          <button onClick={revealVotes} style={{ marginTop: 20 }}>👁️ كشف التصويت</button>
        )}
      </div>
    );
  }

  return null;
}
