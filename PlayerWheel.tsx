"use client";

import { useState } from "react";

const teams = [
  { name: "BLUE TEAM", left: 2 },
  { name: "ORANGE TEAM", left: 4 },
  { name: "TOSCA TEAM", left: 1 },
  { name: "BLACK TEAM", left: 3 }
];

export default function PlayerWheel() {
  const [name, setName] = useState("");
  const [result, setResult] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [turn, setTurn] = useState(0);

  function spin() {
    if (!name.trim() || spinning || result) return;
    const selected = teams[Math.floor(Math.random() * teams.length)];
    setSpinning(true);
    setTurn(v => v + 1440 + Math.floor(Math.random() * 300));
    setTimeout(() => {
      setResult(selected.name);
      setSpinning(false);
    }, 1800);
  }

  return (
    <>
      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="mb-5 rounded-3xl bg-gradient-to-br from-teal-500 to-teal-700 p-5 text-white">
          <p className="text-sm opacity-80">Welcome to</p>
          <h2 className="text-2xl font-black">Random Team Wheel</h2>
          <p className="mt-1 text-sm opacity-90">Enter your name, spin once, and meet your squad.</p>
        </div>

        <label className="text-sm font-bold">Player name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!!result}
          placeholder="e.g. Anjar"
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500 disabled:bg-slate-50"
        />

        <div className="mt-7 flex flex-col items-center">
          <div className="pointer z-10 mb-[-3px]" />
          <div
            className="wheel relative h-64 w-64 rounded-full border-[10px] border-white transition-transform duration-[1800ms] ease-out"
            style={{ transform: `rotate(${turn}deg)` }}
          >
            <span className="absolute left-1/2 top-5 -translate-x-1/2 text-xs font-black text-white">BLUE</span>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-xs font-black text-white">ORANGE</span>
            <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs font-black text-white">TOSCA</span>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-black text-white">BLACK</span>
          </div>
        </div>

        <button
          onClick={spin}
          disabled={!name.trim() || spinning || !!result}
          className="mt-7 w-full rounded-2xl bg-orange-500 py-4 text-base font-black text-white shadow-lg disabled:opacity-40"
        >
          {spinning ? "DRAWING..." : result ? "TEAM ASSIGNED" : "SPIN THE WHEEL"}
        </button>

        {result && (
          <div className="mt-4 rounded-2xl bg-teal-50 p-4 text-center">
            <p className="text-xs font-bold text-teal-700">WELCOME TO</p>
            <p className="text-2xl font-black text-teal-700">{result}</p>
            <p className="mt-1 text-xs text-slate-500">Prototype result. Server persistence comes with Supabase phase.</p>
          </div>
        )}
      </section>

      <section className="mt-4 rounded-[28px] bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-black">Team availability</h3>
          <span className="text-xs text-slate-400">Live soon</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {teams.map((team) => (
            <div key={team.name} className="rounded-2xl border border-slate-100 p-3">
              <p className="text-xs font-black">{team.name}</p>
              <p className="mt-1 text-sm text-slate-500">{team.left} slots left</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
