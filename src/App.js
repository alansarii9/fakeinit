// ✅ النسخة الكاملة للعبة "من هو الفيك؟"

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
  const [round, setRound] = useState({ questionIndex: 0, questionInRound: 0, fakerId: "", currentQuestion: "", hostIndex: 0, mode: "" });
  const [votes, setVotes] = useState({});
  const [timer, setTimer] = useState(15);
  const [lastVoteSummary, setLastVoteSummary] = useState([]);

  const modes = ["رفع اليد", "عدد الأصابع", "أشر على شخص"];
  const questions = [
    "ارفع يدك إذا سبق وتهربت من دفع فاتورة جماعية",
    "ارفع يدك إذا كذبت كذبة بيضاء مؤخرًا",
    "ارفع يدك إذا نسيت اسم شخص وقعدت تسولف معه",
    "ارفع يدك إذا تأخرت عن موعد مهم بدون سبب",
    "كم إصبع ترفع لتمثل عدد المرات اللي أكلت فيها من ثلاجة غيرك؟",
    "كم إصبع تمثل عدد المرات اللي تسرعت فيها بالسيارة؟",
    "كم مرة نسيت مناسبة لأحد قريب؟",
    "كم مرة ضبطوك على الجوال بالدوام؟",
    "أشر على أكثر لاعب تحسه يتأخر دائمًا",
    "أشر على الشخص اللي لو صار فيك ما راح تلاحظ!",
    "أشر على أكثر شخص تمثيله ضعيف",
    "أشر على الشخص اللي تحس يحب يبالغ بالكلام"
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
    if (stage === "ready") {
      const timeout = setTimeout(() => setStage("question"), 3000);
      return () => clearTimeout(timeout);
    }
    if (stage === "question") {
      setTimer(15);
      const countdown = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            clearInterval(countdown);
            setStage("vote");
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(countdown);
    }
    if (stage === "vote") {
      setTimer(10);
      const countdown = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            clearInterval(countdown);
            handleRoundProgress();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(countdown);
    }
  }, [stage]);

  const handleRoundProgress = () => {
    const voteCount = {};
    Object.values(votes).forEach(id => {
      voteCount[id] = (voteCount[id] || 0) + 1;
    });

    const caught = Object.values(votes).includes(round.fakerId);
    const updatedPlayers = players.map(p => {
      if (caught && votes[p.id] === round.fakerId) {
        return { ...p, points: (p.points || 0) + 1 };
      } else if (!caught && p.id === round.fakerId) {
        return { ...p, points: (p.points || 0) + players.length - 1 };
      }
      return p;
    });
    updatedPlayers.forEach(p => {
      set(ref(db, `rooms/${roomCode}/players/${p.id}/points`), p.points);
    });
    setLastVoteSummary(voteCount);

    const nextQuestionIndex = round.questionIndex + 1;
    const nextQuestionInRound = round.questionInRound + 1;

    if (nextQuestionInRound >= 4 || nextQuestionIndex >= questions.length) {
      const nextHostIndex = (round.hostIndex + 1) % players.length;
      const newFaker = players[Math.floor(Math.random() * players.length)].id;
      setStage("summary");
      set(ref(db, `rooms/${roomCode}/round`), {
        questionIndex: nextQuestionIndex,
        questionInRound: 0,
        currentQuestion: questions[nextQuestionIndex] || "",
        fakerId: newFaker,
        hostIndex: nextHostIndex,
        mode: ""
      });
      remove(ref(db, `rooms/${roomCode}/votes`));
    } else {
      set(ref(db, `rooms/${roomCode}/round/questionIndex`), nextQuestionIndex);
      set(ref(db, `rooms/${roomCode}/round/questionInRound`), nextQuestionInRound);
      set(ref(db, `rooms/${roomCode}/round/currentQuestion`), questions[nextQuestionIndex]);
      remove(ref(db, `rooms/${roomCode}/votes`));
      setStage("ready");
    }
  };

  if (stage === "summary") {
    const isHost = players[round.hostIndex]?.id === playerId;
    return (
      <div style={{ backgroundColor: '#002b3f', color: 'white', minHeight: '100vh', padding: '60px', textAlign: 'center' }}>
        <h2>📢 نهاية الجولة</h2>
        <h3 style={{ marginTop: '30px' }}>😈 الفيك كان: {players.find(p => p.id === round.fakerId)?.name || "مجهول"}</h3>

        <h3 style={{ marginTop: '40px' }}>📊 نتائج التصويت:</h3>
        <ul style={{ listStyle: 'none', padding: 0, fontSize: '20px' }}>
          {players.map(p => (
            <li key={p.id}>{p.name}: {lastVoteSummary[p.id] || 0} صوت</li>
          ))}
        </ul>

        <h3 style={{ marginTop: '40px' }}>🔥 النقاط:</h3>
        <ul style={{ listStyle: 'none', padding: 0, fontSize: '20px' }}>
          {players.map(p => (
            <li key={p.id}>{p.name}: {p.points || 0} نقطة</li>
          ))}
        </ul>

        {isHost ? (
          <button
            onClick={() => setStage("chooseMode")}
            style={{ marginTop: '50px', padding: '15px 30px', fontSize: '18px', backgroundColor: '#00c853', color: 'white', borderRadius: '30px', border: 'none' }}>
            ▶️ بدء الجولة التالية
          </button>
        ) : (
          <p style={{ marginTop: '40px' }}>بانتظار المضيف لبدء الجولة التالية...</p>
        )}
      </div>
    );
  }

  return <div style={{ backgroundColor: '#001f2f', color: 'white', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>مرحلة: {stage}</div>;
}
