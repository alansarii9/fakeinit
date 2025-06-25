// ✅ نسخة محدثة: تنسيق الصفحة الرئيسية - لون أزرق، عنوان كبير، إدخال مرتب

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
    onValue(ref(db, `rooms/${roomCode}/currentHostIndex`), snap => {
      const data = snap.val();
      if (data !== null) setCurrentHostIndex(data);
    });
  }, [roomCode]);

  const createRoom = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const id = nanoid();
    const player = { id, name, isHost: true, points: 0 };
    set(ref(db, `rooms/${code}/players/${id}`), player);
    set(ref(db, `rooms/${code}/currentHostIndex`), 0);
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

  if (stage === "welcome") {
    return (
      <div style={{
        backgroundColor: '#002f4b',
        minHeight: '100vh',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial',
        padding: 20
      }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>🎭 من هو الفيك؟</h1>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            style={{ padding: '10px', borderRadius: '25px', border: 'none', fontSize: '16px' }}
            placeholder="اسمك"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <input
            style={{ padding: '10px', borderRadius: '25px', border: 'none', fontSize: '16px' }}
            placeholder="رمز الغرفة"
            value={roomCode}
            onChange={e => setRoomCode(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <button
            onClick={createRoom}
            style={{ padding: '10px 20px', borderRadius: '30px', border: 'none', backgroundColor: '#00bcd4', color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
            🎬 إنشاء غرفة
          </button>

          <button
            onClick={joinRoom}
            style={{ padding: '10px 20px', borderRadius: '30px', border: 'none', backgroundColor: '#4caf50', color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
            🚪 دخول
          </button>
        </div>
      </div>
    );
  }

  if (stage === "lobby") {
    const currentHost = players[currentHostIndex];
    if (!currentHost) return <div style={{ color: 'white', padding: 20 }}>بانتظار اللاعبين...</div>;

    if (playerId !== currentHost.id) {
      return (
        <div style={{ backgroundColor: '#002f4b', minHeight: '100vh', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px' }}>
          🕒 بانتظار {currentHost.name} لاختيار نوع الجولة...
        </div>
      );
    }

    return (
      <div style={{ backgroundColor: '#002f4b', minHeight: '100vh', color: 'white', textAlign: 'center', paddingTop: '100px', fontFamily: 'Arial' }}>
        <h2 style={{ fontSize: '32px' }}>🧠 اختر نوع الجولة</h2>
        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
          {modes.map((mode, i) => (
            <button
              key={i}
              onClick={() => setSelectedMode(mode)}
              style={{ padding: '15px 25px', borderRadius: '30px', fontSize: '18px', fontWeight: 'bold', backgroundColor: selectedMode === mode ? '#00bcd4' : '#555', color: 'white', border: 'none' }}>
              {mode}
            </button>
          ))}
        </div>
        {selectedMode && (
          <button
            onClick={() => {
          const nextIndex = (round?.questionIndex || 0) + 1;
          if (nextIndex < questions.length) {
            set(ref(db, `rooms/${roomCode}/round/questionIndex`), nextIndex);
            set(ref(db, `rooms/${roomCode}/round/currentQuestion`), questions[nextIndex]);
            remove(ref(db, `rooms/${roomCode}/votes`));
            setStage("question");
          } else {
            setStage("summary");
              const nextHost = currentHostIndex + 1;
              if (nextHost < players.length) {
                set(ref(db, `rooms/${roomCode}/currentHostIndex`), nextHost);
              } else {
                setStage("final");
              }
          }
        }}
            style={{ marginTop: '40px', padding: '12px 30px', fontSize: '18px', borderRadius: '30px', border: 'none', backgroundColor: '#4caf50', color: 'white', fontWeight: 'bold' }}>
            ✅ تأكيد الاختيار
          </button>
        )}
      </div>
    );
  }

  if (stage === "question") {
    const isFaker = round?.fakerId === playerId;
    const question = questions[round?.questionIndex || 0];

    useEffect(() => {
      setTimer(15);
      const countdown = setInterval(() => setTimer(t => {
        if (t <= 1) {
          clearInterval(countdown);
          setStage("vote");
          setTimer(10);
        }
        return t - 1;
      }), 1000);
      return () => clearInterval(countdown);
    }, []);

    return (
      <div style={{ backgroundColor: '#001f3f', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontSize: '22px', padding: '20px', textAlign: 'center' }}>
        <h2>{isFaker ? "🤫 أنت الفيك! لا يظهر لك السؤال." : `❓ ${question}`}</h2>
        <p style={{ marginTop: '40px', fontSize: '28px' }}>⏳ {timer} ثانية</p>
      </div>
    );
  }

  if (stage === "vote") {
    useEffect(() => {
      const countdown = setInterval(() => setTimer(t => {
        if (t <= 1) {
          clearInterval(countdown);
          setStage("result");
        }
        return t - 1;
      }), 1000);
      return () => clearInterval(countdown);
    }, []);

    return (
      <div style={{ backgroundColor: '#003355', minHeight: '100vh', color: 'white', textAlign: 'center', paddingTop: '100px' }}>
        <h2>🗳️ صوّت على من تعتقد أنه الفيك</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
          {players.filter(p => p.id !== playerId).map(p => (
            <button
              key={p.id}
              onClick={() => set(ref(db, `rooms/${roomCode}/votes/${playerId}`), p.id)}
              style={{ padding: '15px 20px', borderRadius: '25px', backgroundColor: votes[playerId] === p.id ? '#4caf50' : '#00bcd4', color: 'white', fontSize: '18px', border: 'none' }}
              style={{ padding: '15px 20px', borderRadius: '25px', backgroundColor: '#00bcd4', color: 'white', fontSize: '18px', border: 'none' }}>
              {p.name}
            </button>
          ))}
        </div>
        <p style={{ marginTop: '40px', fontSize: '24px' }}>⏳ {timer} ثانية للتصويت</p>
      </div>
    );
  }

  if (stage === "result") {
    const voteCount = {};
    Object.values(votes).forEach(id => {
      voteCount[id] = (voteCount[id] || 0) + 1;
    });

    const currentFaker = round?.fakerId;
    const caught = Object.values(votes).includes(currentFaker);

    const updatedPlayers = players.map(p => {
      if (caught && votes[p.id] === currentFaker) {
        return { ...p, points: (p.points || 0) + 1 };
      } else if (!caught && p.id === currentFaker) {
        return { ...p, points: (p.points || 0) + players.length - 1 };
      }
      return p;
    });
    updatedPlayers.forEach(p => {
      set(ref(db, `rooms/${roomCode}/players/${p.id}/points`), p.points);
    });

    return (
      <div style={{ backgroundColor: '#001a33', minHeight: '100vh', color: 'white', textAlign: 'center', paddingTop: '100px' }}>
        <h2>📊 نتائج التصويت</h2>
        <ul style={{ listStyle: 'none', fontSize: '20px', marginTop: '20px' }}>
          {players.map(p => (
            <li key={p.id}>{p.name}: {voteCount[p.id] || 0} صوت</li>
          ))}
        </ul>
        <button
          onClick={() => {
            const nextIndex = (round?.questionIndex || 0) + 1;
            if (nextIndex < questions.length) {
              set(ref(db, `rooms/${roomCode}/round/questionIndex`), nextIndex);
              set(ref(db, `rooms/${roomCode}/round/currentQuestion`), questions[nextIndex]);
              remove(ref(db, `rooms/${roomCode}/votes`));
              setStage("question");
            } else {
              setStage("summary");
            }
          }}
          style={{ marginTop: '40px', padding: '12px 30px', fontSize: '18px', borderRadius: '30px', border: 'none', backgroundColor: '#4caf50', color: 'white', fontWeight: 'bold' }}>
          التالي ➡️
        </button>
      </div>
    );
  }

  if (stage === "summary") {
    return (
      <div style={{ backgroundColor: '#002244', color: 'white', textAlign: 'center', padding: '100px 20px' }}>
        <h1>😈 الفيك كان: {players.find(p => p.id === round?.fakerId)?.name || "غير معروف"}</h1>
        <h2 style={{ marginTop: '40px' }}>🔥 النقاط حتى الآن:</h2>
        <ul style={{ listStyle: 'none', fontSize: '20px', marginTop: '20px' }}>
          {players.map(p => (
            <li key={p.id}>{p.name}: {p.points || 0} نقطة</li>
          ))}
        </ul>
        <button
          onClick={() => {
            const nextHost = currentHostIndex + 1;
            if (nextHost < players.length) {
              set(ref(db, `rooms/${roomCode}/currentHostIndex`), nextHost);
              setSelectedMode(null);
              setStage("lobby");
            } else {
              setStage("final");
            }
          }}
          style={{ marginTop: '50px', padding: '15px 30px', borderRadius: '30px', fontSize: '18px', backgroundColor: '#00bcd4', color: 'white', border: 'none' }}>
          🎲 الجولة التالية
        </button>
      </div>
    );
  }

  if (stage === "final") {
    const sorted = [...players].sort((a, b) => (b.points || 0) - (a.points || 0));
    return (
      <div style={{ backgroundColor: '#000e1a', color: 'white', textAlign: 'center', padding: '100px 20px' }}>
        <h1>🏁 انتهت اللعبة!</h1>
        <h2 style={{ marginTop: '40px' }}>🏆 الترتيب النهائي:</h2>
        <ol style={{ fontSize: '22px', marginTop: '20px' }}>
          {sorted.map(p => (
            <li key={p.id}>{p.name} - {p.points || 0} نقطة</li>
          ))}
        </ol>
      </div>
    );
  }
          }}
          style={{ marginTop: '50px', padding: '15px 30px', borderRadius: '30px', fontSize: '18px', backgroundColor: '#00bcd4', color: 'white', border: 'none' }}>
          🎲 الجولة التالية
        </button>
      </div>
    );
  }
      <div style={{ backgroundColor: '#001a33', minHeight: '100vh', color: 'white', textAlign: 'center', paddingTop: '100px' }}>
        <h2>📊 نتائج التصويت</h2>
        <ul style={{ listStyle: 'none', fontSize: '20px', marginTop: '20px' }}>
          {players.map(p => (
            <li key={p.id}>{p.name}: {voteCount[p.id] || 0} صوت</li>
          ))}
        </ul>
        <button
          onClick={() => setStage("question")}
          style={{ marginTop: '40px', padding: '12px 30px', fontSize: '18px', borderRadius: '30px', border: 'none', backgroundColor: '#4caf50', color: 'white', fontWeight: 'bold' }}>
          التالي ➡️
        </button>
      </div>
    );
  }
}
